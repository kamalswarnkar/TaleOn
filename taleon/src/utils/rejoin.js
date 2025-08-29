// src/utils/rejoin.js
import axios from "axios";

// Check if user has active game/room session and restore it
export const checkAndRejoinSession = async () => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const roomCode = sessionStorage.getItem("roomCode");
  const gameId = sessionStorage.getItem("gameId");
  
  if (!user?.token) {
    return { canRejoin: false, reason: "No authentication" };
  }
  
  try {
    // Check if user has an active game first (higher priority)
    if (gameId) {
      const gameResponse = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/game/${gameId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (gameResponse.data) {
        // Check if user is still a player in this game
        const isPlayer = gameResponse.data.players.some(
          player => player._id === user._id || player === user._id
        );

        if (isPlayer) {
          if (gameResponse.data.isActive) {
            // Game is active, can rejoin
            return {
              canRejoin: true,
              type: "game",
              data: gameResponse.data,
              redirectTo: "/game-room"
            };
          } else {
            // Game is completed, clear session and show appropriate message
            clearGameData();
            return {
              canRejoin: false,
              reason: "Game is already finished, start a new game!",
              completedGame: true
            };
          }
        } else {
          // User is not a player anymore, clear the session data
          clearGameData();
          return { canRejoin: false, reason: "No longer a player in this game" };
        }
      }
    }

    // Check if user has an active room (fallback)
    if (roomCode) {
      const roomResponse = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/room/${roomCode}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (roomResponse.data && roomResponse.data.isActive) {
        // Check if user is still a member of this room
        const isMember = roomResponse.data.players.some(
          player => player._id === user._id || player === user._id
        );

        if (isMember) {
          return {
            canRejoin: true,
            type: "room",
            data: roomResponse.data,
            redirectTo: "/lobby"
          };
        } else {
          // User is not a member anymore, clear the session data
          clearGameData();
          return { canRejoin: false, reason: "No longer a member of this room" };
        }
      }
    }
    
    return { canRejoin: false, reason: "No active session" };
  } catch (error) {
    console.error("Rejoin check failed:", error);
    return { canRejoin: false, reason: "Error checking session" };
  }
};

// Restore game state from backend
export const restoreGameState = async (gameId) => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/game/${gameId}`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const game = response.data;
    
    // Restore session storage with current game state
    sessionStorage.setItem("gameId", game._id);
    sessionStorage.setItem("roomCode", game.roomCode);
    sessionStorage.setItem("gameTitle", game.title);
    sessionStorage.setItem("gameGenre", game.genre);
    
    // Restore players with chosen names
    if (game.players && game.players.length > 0) {
      sessionStorage.setItem("players", JSON.stringify(game.players));
    }
    
    // Restore story
    if (game.story && game.story.length > 0) {
      sessionStorage.setItem("story", JSON.stringify(game.story));
    }
    
    return game;
  } catch (error) {
    console.error("Failed to restore game state:", error);
    throw error;
  }
};

// Restore room state from backend
export const restoreRoomState = async (roomCode) => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/room/${roomCode}`,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );
    
    const room = response.data;
    
    // Restore session storage with current room state
    sessionStorage.setItem("roomCode", room.roomCode);
    sessionStorage.setItem("players", JSON.stringify(room.players));
    
    return room;
  } catch (error) {
    console.error("Failed to restore room state:", error);
    throw error;
  }
};

// Clear all session data
export const clearSessionData = () => {
  const keysToKeep = ["user"]; // Keep user authentication
  
  // Clear all session storage except user data
  Object.keys(sessionStorage).forEach(key => {
    if (!keysToKeep.includes(key)) {
      sessionStorage.removeItem(key);
    }
  });
};

// Clear specific game/room data
export const clearGameData = () => {
  const keysToRemove = [
    "roomCode", "gameId", "gameTitle", "gameGenre", 
    "players", "story", "tossWinner", "playerName",
    "maxRounds", "turnTime", "gameResult"
  ];
  
  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
  });
};
