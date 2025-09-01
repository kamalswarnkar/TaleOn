// src/sockets/gameSocket.js
import Game from "../models/Game.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const presence = new Map(); // roomCode -> { users: Map<socketId, username> }
const timers = {}; // roomCode -> timeout

// Helper function to verify JWT token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (error) {
    return null;
  }
};

// Helper function to verify room membership
const verifyRoomMembership = async (roomCode, userId) => {
  try {
    const room = await Room.findOne({ roomCode });
    if (!room) return false;
    
    // Check if user is in the room's players list
    return room.players.some(playerId => playerId.toString() === userId.toString());
  } catch (error) {
    return false;
  }
};

export const gameSocketHandler = (io) => {
  io.on("connection", (socket) => {
    // Store authenticated user data
    socket.userData = null;

    // Helpers
    const addUser = (roomCode, username) => {
      if (!presence.has(roomCode)) presence.set(roomCode, { users: new Map() });
      presence.get(roomCode).users.set(socket.id, username);
    };
    const removeUser = (roomCode) => {
      const room = presence.get(roomCode);
      if (!room) return;
      room.users.delete(socket.id);
      if (room.users.size === 0) presence.delete(roomCode);
    };
    const listUsers = (roomCode) => {
      const room = presence.get(roomCode);
      return room ? Array.from(room.users.values()) : [];
    };

    // --- Room presence ---
    socket.on("joinRoom", async ({ roomCode, username, token }) => {
      if (!roomCode || !token) {
        socket.emit("error", { message: "Room code and authentication token required" });
        return;
      }

      // Verify JWT token
      const user = await verifyToken(token);
      if (!user) {
        socket.emit("error", { message: "Invalid authentication token" });
        return;
      }

      // Verify room membership
      const isMember = await verifyRoomMembership(roomCode, user._id);
      if (!isMember) {
        socket.emit("error", { message: "You are not a member of this room" });
        return;
      }

      // Store user data for future use
      socket.userData = { userId: user._id, username: user.username };
      
      socket.join(roomCode);
      addUser(roomCode, username || user.username);

      io.to(roomCode).emit("playerJoined", {
        username: username || user.username,
        players: listUsers(roomCode),
      });
    });

    socket.on("leaveRoom", ({ roomCode }) => {
      if (!roomCode) return;
      const username = presence.get(roomCode)?.users.get(socket.id);
      socket.leave(roomCode);
      removeUser(roomCode);
      io.to(roomCode).emit("playerLeft", {
        username: username || "Player",
        players: listUsers(roomCode),
      });
    });

    // Typing indicators
    socket.on("typing", ({ roomCode, username }) => {
      if (!roomCode) return;
      socket.to(roomCode).emit("typing", { username: username || "Player" });
    });

    socket.on("stopTyping", ({ roomCode, username }) => {
      if (!roomCode) return;
      socket.to(roomCode).emit("stopTyping", { username: username || "Player" });
    });

    // --- Game events ---
    socket.on("startGame", async ({ roomCode, gameId, turnDuration }) => {
      if (!roomCode || !gameId) return;
      
      // Verify user is authenticated and in the room
      if (!socket.userData) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      io.to(roomCode).emit("gameStarted", { gameId });

      const game = await Game.findById(gameId).populate("players");
      if (!game) return;

      // If client didn't pass duration, derive from model (seconds -> ms)
      const durationMs = Number.isFinite(turnDuration)
        ? Number(turnDuration)
        : ((game.turnTimeLimit ?? 600) * 1000);

      startTurnTimer(io, game, durationMs, timers);
    });

    socket.on("submitTurn", async ({ gameId, userId, content }) => {
      try {
        // Verify user is authenticated
        if (!socket.userData || socket.userData.userId.toString() !== userId) {
          socket.emit("errorMsg", { message: "Authentication required" });
          return;
        }

        const game = await Game.findById(gameId).populate("players");
        if (!game || !game.isActive) return;

        const currentPlayerId = game.players[game.currentTurnIndex].toString();
        if (userId !== currentPlayerId) {
          socket.emit("errorMsg", { message: "Not your turn!" });
          return;
        }

        const turnDoc = {
          turn: game.story.length + 1,
          user: userId,
          content: (content || "").trim(),
          createdAt: new Date(),
        };

        if (!turnDoc.content) {
          socket.emit("errorMsg", { message: "Content is required" });
          return;
        }

        game.story.push(turnDoc);
        game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
        await game.save();

        clearTimeout(timers[game.roomCode]);

        io.to(game.roomCode).emit("turnAdded", {
          gameId: game._id,
          roomCode: game.roomCode,
          turn: turnDoc,
          nextTurnIndex: game.currentTurnIndex,
        });

        // continue with configured duration from model
        const durationMs = (game.turnTimeLimit ?? 600) * 1000;
        startTurnTimer(io, game, durationMs, timers);
      } catch (error) {
        console.error("Error in submitTurn:", error);
      }
    });

    socket.on("endGame", ({ roomCode, gameId }) => {
      if (!roomCode) return;
      clearTimeout(timers[roomCode]);
      io.to(roomCode).emit("gameEnded", { gameId });
    });

    // --- Disconnect cleanup ---
    socket.on("disconnecting", () => {
      for (const roomCode of socket.rooms) {
        if (roomCode === socket.id) continue;
        const username = presence.get(roomCode)?.users.get(socket.id);
        removeUser(roomCode);
        socket.to(roomCode).emit("playerLeft", {
          username: username || "Player",
          players: listUsers(roomCode),
        });
      }
    });
  });
};

// --- Helper: start timer for a turn ---
async function startTurnTimer(io, game, duration, timers) {
  const roomCode = game.roomCode;
  const currentPlayerId = game.players[game.currentTurnIndex].toString();

  io.to(roomCode).emit("turnStarted", {
    currentTurnIndex: game.currentTurnIndex,
    playerId: currentPlayerId,
    duration,
  });

  timers[roomCode] = setTimeout(async () => {
    try {
      const skippedTurn = {
        turn: game.story.length + 1,
        user: currentPlayerId,
        content: "[SKIPPED - timeout]",
        createdAt: new Date(),
      };

      game.story.push(skippedTurn);
      game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
      await game.save();

      io.to(roomCode).emit("turnSkipped", {
        skippedTurn,
        nextTurnIndex: game.currentTurnIndex,
      });

      startTurnTimer(io, game, duration, timers);
    } catch (error) {
      console.error("Error auto-skipping turn:", error);
    }
  }, duration);
}
