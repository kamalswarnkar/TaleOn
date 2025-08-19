import express from "express";
import Game from "../models/Game.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const OPENAI_COMPLETIONS = "https://api.openai.com/v1/chat/completions";
const GROQ_COMPLETIONS   = "https://api.groq.com/openai/v1/chat/completions";

async function generateAIText({ storySoFar, genre }) {
  // Build a compact prompt that keeps the AI on-track and concise.
  const systemPrompt =
    "You are an imaginative co-author for a turn-based story game. " +
    "Write the next 1–3 sentences only. Keep tone consistent with the genre, " +
    "advance the plot, avoid ending the story, and do not narrate other players' actions.";

  const userPrompt =
    `GENRE: ${genre || "custom"}\n` +
    "STORY SO FAR:\n" +
    storySoFar;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user",   content: userPrompt },
  ];

  // helper: parse API errors safely
  const readError = async (resp) => {
    try {
      const j = await resp.json();
      return j?.error?.message || JSON.stringify(j);
    } catch {
      return `HTTP ${resp.status}`;
    }
  };

  // Try OpenAI (if allowed)
  if (process.env.USE_OPENAI !== "false" && process.env.OPENAI_API_KEY) {
    try {
      const resp = await fetch(OPENAI_COMPLETIONS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages,
          temperature: 0.9,
          max_tokens: 180,
        }),
      });

      if (!resp.ok) {
        const msg = await readError(resp);
        console.error("[OpenAI] error:", msg);
        throw new Error(msg);
      }

      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log("[AI] provider: OpenAI");
        return text;
      }
      throw new Error("OpenAI returned no content");
    } catch (err) {
      console.warn("[OpenAI] failed, will try Groq. Reason:", err.message);
      // fall through to Groq
    }
  }

  // Fallback: Groq
  if (!process.env.GROQ_API_KEY) {
    console.error("[Groq] missing GROQ_API_KEY");
    return "[AI error: Groq key missing]";
  }

  try {
    const resp = await fetch(GROQ_COMPLETIONS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages,
        temperature: 0.9,
        max_tokens: 180,
      }),
    });

    if (!resp.ok) {
      const msg = await readError(resp);
      console.error("[Groq] error:", msg);
      return `[AI error: ${msg}]`;
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) {
      console.log("[AI] provider: Groq");
      return text;
    }
    return "[AI error: Groq returned no content]";
  } catch (err) {
    console.error("[Groq] fetch failed:", err);
    return "[AI error: Groq fetch failed]";
  }
}

/**
 * @desc    Start a new game inside a room (always includes AI)
 * @route   POST /game/start
 * @access  Private
 */
router.post("/start", protect, async (req, res) => {
  const { roomCode, title, description, genre } = req.body;

  try {
    const room = await Room.findOne({ roomCode }).populate("players");
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.isActive) return res.status(400).json({ message: "Room already closed" });

    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only host can start the game" });
    }

    if (room.game) {
      return res.status(400).json({ message: "Game already started in this room" });
    }

    // Ensure AI user exists
    const aiUser = await User.findOne({ email: "ai@system.local" });
    if (!aiUser) {
      return res.status(500).json({ message: "AI user not found in database" });
    }

    const playersWithAI = [...room.players.map(p => p._id), aiUser._id];

    const game = new Game({
      title,
      description,
      genre,
      createdBy: req.user._id,
      players: playersWithAI,
      room: room._id,
      roomCode: room.roomCode,
      currentTurnIndex: 0,
    });

    await game.save();

    room.game = game._id;
    await room.save();

    const io = req.app.get("io");
    io?.to(room.roomCode).emit("gameStarted", { gameId: game._id, roomCode: room.roomCode });

    res.status(201).json({
      message: "Game started with AI player",
      gameId: game._id,
      roomCode: room.roomCode,
    });
  } catch (error) {
    res.status(500).json({ message: "Error starting game", error: error.message });
  }
});

/**
 * @desc    Convenience: get a game by roomCode
 * @route   GET /game/by-room/:roomCode
 * @access  Private
 */
router.get("/by-room/:roomCode", protect, async (req, res) => {
  try {
    const game = await Game.findOne({ roomCode: req.params.roomCode })
      .populate("players", "username email")
      .populate("story.user", "username");

    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: "Error fetching game", error: error.message });
  }
});

/**
 * @desc    Get all games related to logged-in user
 * @route   GET /game/my
 * @access  Private
 */
router.get("/my", protect, async (req, res) => {
  try {
    const games = await Game.find({
      players: req.user._id,
    })
      .populate("players", "username email")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    const hostedGames = [];
    const joinedGames = [];

    games.forEach((game) => {
      if (game.createdBy._id.toString() === req.user._id.toString()) {
        hostedGames.push(game);
      } else {
        joinedGames.push(game);
      }
    });

    res.json({ hostedGames, joinedGames });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user games", error: error.message });
  }
});

/**
 * @desc    Add a story turn (turn-based enforced + auto AI when AI's turn)
 * @route   POST /game/:id/turn
 * @access  Private
 */
router.post("/:id/turn", protect, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Content is required" });
  }

  try {
    const game = await Game.findById(req.params.id);
    if (!game || !game.isActive) {
      return res.status(404).json({ message: "Game not found or inactive" });
    }

    const isPlayer = game.players.some(p => p.toString() === req.user._id.toString());
    if (!isPlayer) return res.status(403).json({ message: "You are not a player in this game" });

    const currentPlayerId = game.players[game.currentTurnIndex].toString();
    if (req.user._id.toString() !== currentPlayerId) {
      return res.status(403).json({ message: "Not your turn!" });
    }

    // Save human turn
    const playerTurn = {
      turn: game.story.length + 1,
      user: req.user._id,
      content: content.trim(),
      createdAt: new Date(),
    };
    game.story.push(playerTurn);
    game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
    await game.save();

    const io = req.app.get("io");
    io?.to(game.roomCode).emit("turnAdded", {
      gameId: game._id,
      roomCode: game.roomCode,
      turn: {
        turn: playerTurn.turn,
        user: req.user._id,
        content: playerTurn.content,
        createdAt: playerTurn.createdAt,
      },
      nextTurnIndex: game.currentTurnIndex,
    });

    // If it's now AI's turn, generate and save AI turn automatically
    const aiUser = await User.findOne({ email: "ai@system.local" });
    const nowPlayerId = game.players[game.currentTurnIndex].toString();
    if (aiUser && nowPlayerId === aiUser._id.toString()) {
      const storyText = game.story.map(s => s.content).join("\n");
      const aiText = await generateAIText({
        storySoFar: storyText,
        genre: game.genre,
      });

      const aiTurn = {
        turn: game.story.length + 1,
        user: aiUser._id,
        content: aiText,
        createdAt: new Date(),
      };

      game.story.push(aiTurn);
      game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
      await game.save();

      io?.to(game.roomCode).emit("turnAdded", {
        gameId: game._id,
        roomCode: game.roomCode,
        turn: aiTurn,
        nextTurnIndex: game.currentTurnIndex,
      });
    }

    res.status(201).json({
      message: "Turn added",
      story: game.story,
      currentTurnIndex: game.currentTurnIndex,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding turn", error: error.message });
  }
});

/**
 * @desc    End game session
 * @route   POST /game/:id/end
 * @access  Private
 */
router.post("/:id/end", protect, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    game.isActive = false;
    await game.save();

    const io = req.app.get("io");
    io?.to(game.roomCode).emit("gameEnded", { gameId: game._id, roomCode: game.roomCode });

    res.json({ message: "Game ended", game });
  } catch (error) {
    res.status(500).json({ message: "Error ending game", error: error.message });
  }
});

/**
 * @desc    Get full game details
 * @route   GET /game/:id
 * @access  Private
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate("players", "username email")
      .populate("story.user", "username");

    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: "Error fetching game", error: error.message });
  }
});

export default router;
