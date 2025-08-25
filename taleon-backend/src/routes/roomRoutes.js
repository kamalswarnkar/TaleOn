import express from "express";
import Room from "../models/Room.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @desc    Create a room
 * @route   POST /room/create
 * @access  Private
 */
router.post("/create", protect, async (req, res) => {
  try {
    const { playerName } = req.body;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = new Room({
      roomCode,
      host: req.user._id,
      players: [req.user._id],
    });

    // Set the player name for the host
    if (playerName && playerName.trim()) {
      room.playerNames.set(req.user._id.toString(), playerName.trim());
    }

    await room.save();

    res.status(201).json({
      message: "Room created successfully",
      roomCode: room.roomCode,
      host: req.user.username,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating room", error: error.message });
  }
});

/**
 * @desc    Join a room
 * @route   POST /room/join
 * @access  Private
 */
router.post("/join", protect, async (req, res) => {
  const { roomCode, playerName } = req.body;

  try {
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.isActive) return res.status(400).json({ message: "Room is closed" });

    const alreadyIn = room.players.some(id => id.toString() === req.user._id.toString());
    if (!alreadyIn) {
      room.players.push(req.user._id);
      // Set the player name if provided
      if (playerName && playerName.trim()) {
        room.playerNames.set(req.user._id.toString(), playerName.trim());
      }
      await room.save();
    }

    res.json({
      message: "Joined room successfully",
      roomCode: room.roomCode,
      players: room.players,
      playerName: playerName || req.user.username
    });
  } catch (error) {
    res.status(500).json({ message: "Error joining room", error: error.message });
  }
});

/**
 * @desc    Get room details
 * @route   GET /room/:code
 * @access  Private
 */
router.get("/:code", protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.code })
      .populate("host", "username")
      .populate("players", "username");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Add player names to the response
    const playersWithNames = room.players.map(player => ({
      ...player.toObject(),
      playerName: room.playerNames.get(player._id.toString()) || player.username
    }));

    const responseObject = {
      ...room.toObject(),
      players: playersWithNames
    };

    res.json(responseObject);
  } catch (error) {
    res.status(500).json({ message: "Error fetching room", error: error.message });
  }
});

/**
 * @desc    Leave a room
 * @route   POST /room/leave
 * @access  Private
 */
router.post("/leave", protect, async (req, res) => {
  const { roomCode } = req.body;
  try {
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const wasHost = room.host.toString() === req.user._id.toString();

    // Remove player from room
    room.players = room.players.filter(id => id.toString() !== req.user._id.toString());
    
    // Remove player name from playerNames Map
    room.playerNames.delete(req.user._id.toString());

    // Handle host leaving
    if (wasHost) {
      if (room.players.length > 0) {
        room.host = room.players[0]; // transfer host
      } else {
        room.isActive = false; // no players left, close the room
      }
    }

    // If there's an active game and not enough players, end it
    if (room.game && room.players.length < 2) {
      // Import Game model here since we're in roomRoutes
      const Game = (await import("../models/Game.js")).default;
      const game = await Game.findById(room.game);
      if (game) {
        game.isActive = false;
        game.verdict = "ABANDONED"; // Mark as abandoned instead of PENDING
        await game.save();
        console.log(`[ROOM] Game ${game._id} marked as ABANDONED due to insufficient players`);
      }
      room.game = undefined; // Remove game reference
    }

    await room.save();

    res.json({ 
      message: "Left room successfully", 
      players: room.players, 
      host: room.host,
      roomClosed: !room.isActive
    });
  } catch (error) {
    res.status(500).json({ message: "Error leaving room", error: error.message });
  }
});

export default router;
