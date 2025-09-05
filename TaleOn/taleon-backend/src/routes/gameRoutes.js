import express from "express";
import Game from "../models/Game.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const OPENAI_COMPLETIONS = "https://api.openai.com/v1/chat/completions";
const GROQ_COMPLETIONS   = "https://api.groq.com/openai/v1/chat/completions";

/* ============================================================
   Shared AI Helper
   ============================================================ */
async function callGroqAI(messages, model = "llama-3.1-8b-instant", max_tokens = 200, temperature = 0.9) {
  try {
    const resp = await fetch(GROQ_COMPLETIONS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature }),
    });

    const data = await resp.json();
    console.log("[Groq raw response]", JSON.stringify(data, null, 2));

    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[Groq call failed]", err.message);
    return null;
  }
}

/* ============================================================
   Story AI
   ============================================================ */
async function generateAIText({ storySoFar, genre }) {
  const systemPrompt =
    "You are an imaginative co-author for a turn-based story game. " +
    "Write the next 2–4 sentences that ADVANCE THE PLOT in a coherent way. " +
    "Your contribution must: " +
    "1. Build logically on what came before " +
    "2. Introduce new elements or complications " +
    "3. Maintain consistent tone and genre " +
    "4. NOT be random or disconnected " +
    "5. Help create a compelling narrative arc " +
    "Keep the story engaging and avoid ending it prematurely.";

  const userPrompt = `GENRE: ${genre || "Custom"}\nSTORY SO FAR:\n${storySoFar}\n\nWrite the next coherent part of the story:`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const text = await callGroqAI(messages, "llama-3.1-8b-instant", 200, 0.7);
  return text || "The story continues with a new twist...";
}

/* ============================================================
   Roast AI
   ============================================================ */
async function generateRoastText({ playerName, story, result }) {
  const systemPrompt =
    "You are a witty and savage AI roast master. " +
    "Create a short, funny roast (1–3 sentences max) about a player's storytelling. " +
    "Be clever and playful, not hateful or discriminatory.";

  const userPrompt =
`Player: ${playerName}
Game Result: ${result}
Story:
${Array.isArray(story) ? story.join("\n") : String(story || "")}
Now roast the player!`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user",   content: userPrompt },
  ];

  const text = await callGroqAI(messages, "llama-3.1-8b-instant", 100, 0.9);
  return text || "No roast available.";
}

/* ============================================================
   Game Meta AI
   ============================================================ */
async function generateGameMeta() {
  const systemPrompt = "You are a creative game session organizer for a collaborative storytelling game.";

  const userPrompt =
    'Generate a JSON object with a catchy "title" (max 5 words) and a simple "genre" ' +
    '(use one of: Fantasy, Comedy, Mystery, Horror, Sci-Fi, Adventure, Romance, Custom). ' +
    'Example: {"title":"Midnight Heist","genre":"Mystery"}';

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user",   content: userPrompt },
  ];

  const text = await callGroqAI(messages, "llama-3.1-8b-instant", 60, 0.8);

  try {
    const parsed = JSON.parse(text);
    if (parsed?.title && parsed?.genre) return parsed;
  } catch {
    console.warn("[generateGameMeta] Non-JSON response:", text);
  }

  return { title: "Untitled Tale", genre: "Custom" };
}

/* ============================================================
   Judgement AI (Two-Phase via AI Itself)
   with Smart Gibberish Detection + Contextual Fallback
   ============================================================ */

function isGibberishText(text) {
  if (!text) return true;

  const clean = text.trim();

  // Too short
  if (clean.length < 3) return true;

  // Only numbers/symbols
  if (/^[^a-zA-Z]+$/.test(clean)) return true;

  // Detect random short combos (3–5 letters)
  if (/^[a-z]{3,5}$/i.test(clean)) {
    const blacklist = ["asd", "qwe", "zxc", "dfg", "ghj", "jkl", "dcx", "acs"];
    if (blacklist.includes(clean.toLowerCase())) return true;

    // reject if no vowels
    if (clean.length <= 4 && !/[aeiou]/i.test(clean)) return true;
  }

  // Repeated junk patterns (aaa, abab, etc.)
  if (/^([a-z])\1{2,}$/i.test(clean)) return true;
  if (/^(..)\1{2,}$/i.test(clean)) return true;

  return false;
}

async function judgeStory({ story }) {
  // ✅ Extract only HUMAN player contributions
  const humanEntries = story.filter(s => {
    const playerName = typeof s === "object" ? (s.player || "") : "";
    return playerName !== "AI_Buddy" && playerName !== "AI";
  });

  const humanTexts = humanEntries.map(s =>
    typeof s === "string" ? s : (s.text || s.content || "")
  );

  const humanTextJoined = humanTexts.join("\n");

  const completeStory = story
    .map(s => (typeof s === "string" ? s : (s.text || s.content || "")))
    .join("\n");

  console.log(`[JUDGE] Running judgement...`);
  console.log(`[JUDGE] Human content:`, humanTextJoined.substring(0, 200) + "...");
  console.log(`[JUDGE] Full story length: ${completeStory.length}`);

  /* ============================================================
     STEP 1: Hard gibberish check (auto-LOSE outside AI)
     ============================================================ */
  const allGibberish = humanTexts.every(txt => isGibberishText(txt));
  if (allGibberish) {
    console.log("[JUDGE] All human inputs are gibberish → auto LOSE");
    return {
      verdict: "LOSE",
      source: "HUMAN_FILTER",
      scores: {
        flow: "1/5",
        creativity: "1/5",
        vibe: "1/5",
        immersion: "1/5"
      }
    };
  }

  /* ============================================================
     STEP 2: Ask AI to judge normally
     ============================================================ */
  const messages = [
    {
      role: "system",
      content:
        "You are a judge for a storytelling game. Decide WIN or LOSE.\n\n" +
        "WIN if: Story has creativity, plot, characters, or effort\n" +
        "LOSE if: Empty, gibberish, random codes, or meaningless\n\n" +
        "Return ONLY this JSON format:\n" +
        '{"verdict":"WIN","scores":{"flow":"3/5","creativity":"3/5","vibe":"3/5","immersion":"3/5"}}'
    },
    {
      role: "user",
      content:
        "Judge this story:\n\n" + completeStory + "\n\n" +
        "Is it creative and engaging? Return WIN or LOSE with scores."
    }
  ];

  const raw = await callGroqAI(messages, "llama-3.1-8b-instant", 200, 0.5);
  console.log(`[JUDGE] Raw AI response:`, raw);

  /* ============================================================
     STEP 3: JSON Parse + Repair
     ============================================================ */
  const tryParse = (txt) => {
    try {
      const parsed = JSON.parse(txt);
      if (parsed?.verdict && parsed?.scores) return parsed;
    } catch {}
    return null;
  };

  let result = tryParse(raw);

  if (!result) {
    const match = raw?.match(/\{[\s\S]*\}/);
    if (match) result = tryParse(match[0]);
  }

  if (!result && raw) {
    const cleaned = raw
      .replace(/(\r\n|\n|\r)/gm, " ")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");
    result = tryParse(cleaned);
  }

  if (result) {
    console.log(`[JUDGE] Parsed verdict:`, result.verdict);
    return { ...result, source: "AI" };
  }

  /* ============================================================
     STEP 4: Contextual Fallback
     ============================================================ */
  console.log("[JUDGE] AI failed to return valid JSON, using fallback");

  if (!humanTextJoined.trim()) {
    return {
      verdict: "LOSE",
      source: "FALLBACK",
      scores: {
        flow: "1/5",
        creativity: "1/5",
        vibe: "1/5",
        immersion: "1/5"
      }
    };
  }

  // For fallback, make a simple content-based decision
  const hasAnyContent = humanTextJoined.trim().length > 0;
  const hasMinimalContent = humanTextJoined.trim().length < 20;

  if (!hasAnyContent) {
    return {
      verdict: "LOSE",
      source: "FALLBACK",
      scores: {
        flow: "1/5",
        creativity: "1/5",
        vibe: "1/5",
        immersion: "1/5"
      }
    };
  }

  // For minimal content, assume LOSE; for substantial content, assume WIN
  return {
    verdict: hasMinimalContent ? "LOSE" : "WIN",
    source: "FALLBACK",
    scores: hasMinimalContent ? {
      flow: "2/5",
      creativity: "2/5",
      vibe: "2/5",
      immersion: "2/5"
    } : {
      flow: "3/5",
      creativity: "3/5",
      vibe: "3/5",
      immersion: "3/5"
    }
  };
}


/* ============================================================
   Helpers
   ============================================================ */
function normalizeStory(story = []) {
  return (story || []).map((s) => {
    let playerName = "Player";
    let text = "";

    if (typeof s === "object") {
      // Handle different story entry formats
      if (s.player) {
        if (typeof s.player === "object") {
          playerName = s.player.username || s.player.name || s.player._id || "Player";
        } else {
          playerName = s.player;
        }
      } else if (s.user) {
        if (typeof s.user === "object") {
          playerName = s.user.username || s.user.name || s.user._id || "Player";
        } else {
          playerName = s.user;
        }
      }
      
      text = s.content || s.text || "";
    } else if (typeof s === "string") {
      text = s;
    }

    return { player: playerName, text };
  });
}

/* ============================================================
   Routes
   ============================================================ */

// Roast
router.post("/roast", protect, async (req, res) => {
  const { players = [], story = [], result = "LOSE" } = req.body;
  try {
    const roasts = [];
    for (const player of players) {
      const name = typeof player === "string" ? player : player?.username || player?.name;
      if (!name || String(name).toLowerCase() === "ai_buddy") continue;
      const roast = await generateRoastText({ playerName: name, story, result });
      roasts.push({ name, roast });
    }
    res.json({ roasts });
  } catch (err) {
    console.error("Roast route error:", err);
    res.status(500).json({ message: "Error generating roasts" });
  }
});

// Start Game
router.post("/start", protect, async (req, res) => {
  const { roomCode } = req.body;
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

    const aiUser = await User.findOne({ email: "ai@system.local" });
    if (!aiUser) return res.status(500).json({ message: "AI user not found in database" });

    const meta = await generateGameMeta();

    const playersWithAI = [...room.players.map(p => p._id), aiUser._id];
    
    // ✅ Use chosen player names from room.playerNames, fallback to database usernames
    const playersPayload = [
      ...room.players.map(p => ({ 
        _id: p._id, 
        username: room.playerNames.get(p._id.toString()) || p.username 
      })),
      { _id: aiUser._id, username: "AI_Buddy" }
    ];

    const RAW = String(meta?.genre ?? "custom");
    const GENRE_ALIASES = {
      Fantasy: "fantasy",
      Horror: "horror",
      "Sci-Fi": "sci-fi",
      "Sci Fi": "sci-fi",
      "Science Fiction": "sci-fi",
      Mystery: "mystery",
      Adventure: "adventure",
      Romance: "romance",
      Comedy: "comedy",
      Drama: "drama",
      Custom: "custom"
    };
    const normalizedGenre = GENRE_ALIASES[RAW] || RAW.toLowerCase();

    const game = new Game({
      title: meta.title,
      description: "AI-generated session",
      genre: normalizedGenre,
      createdBy: req.user._id,
      players: playersWithAI,
      room: room._id,
      roomCode: room.roomCode,
      currentTurnIndex: 0,
      turnTimeLimit: Math.max(60, (Number(room.turnTime) || 10) * 60),
    });

    await game.save();

    room.game = game._id;
    await room.save();

    const io = req.app.get("io");
    io?.to(room.roomCode).emit("gameStarted", {
      gameId: game._id,
      roomCode: room.roomCode,
      title: game.title,
      genre: game.genre,
      turnTimeLimit: game.turnTimeLimit,
      players: playersPayload,
    });

    res.status(201).json({
      message: "Game started with AI player",
      gameId: game._id,
      roomCode: room.roomCode,
      title: game.title,
      genre: game.genre,
      players: playersPayload, // ✅ This now includes chosen player names
    });
  } catch (error) {
    console.error("[/game/start] error:", error);
    res.status(500).json({ message: "Error starting game", error: error.message });
  }
});

// Turn
router.post("/turn", protect, async (req, res) => {
  const { roomCode, text } = req.body;
  if (!roomCode) return res.status(400).json({ message: "roomCode is required" });

  try {
    const game = await Game.findOne({ roomCode });
    if (!game || !game.isActive) {
      return res.status(404).json({ message: "Game not found or inactive" });
    }

    const isPlayer = game.players.some(p => p.toString() === req.user._id.toString());
    if (!isPlayer) return res.status(403).json({ message: "You are not a player in this game" });

    const aiUser = await User.findOne({ email: "ai@system.local" });
    if (!aiUser) return res.status(500).json({ message: "AI user not found" });

    // ✅ Get room to access chosen player names
    const room = await Room.findOne({ roomCode });

    const io = req.app.get("io");
    const currentPlayerId = game.players[game.currentTurnIndex].toString();
    const isAITurn = currentPlayerId === aiUser._id.toString();
    const isUserTurn = currentPlayerId === req.user._id.toString();

    // Helper function to normalize story with chosen names
    const normalizeStoryWithChosenNames = (storyData) => {
      return (storyData || []).map(s => {
        const userId = s.user?._id?.toString();
        const chosenName = room?.playerNames?.get(userId) || s.user?.username || "Player";
        return {
          player: chosenName,
          text: s.content || s.text || ""
        };
      });
    };

    // --- AI TURN ---
    if (isAITurn) {
      const storyText = game.story.map(s => s.content).join("\n");
      const aiText = await generateAIText({ storySoFar: storyText, genre: game.genre });

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

      return res.status(201).json({
        message: "AI turn added",
        text: aiText,  // ✅ ensure frontend sees AI text
        story: normalizeStoryWithChosenNames(game.story),
        currentTurnIndex: game.currentTurnIndex,
      });
    }

    // --- NOT USER'S TURN ---
    if (!isUserTurn) {
      return res.status(200).json({
        message: "Waiting for another player",
        story: normalizeStoryWithChosenNames(game.story),
        currentTurnIndex: game.currentTurnIndex,
        waiting: true,
      });
    }

    // --- USER TURN ---
    if (!text || !String(text).trim()) {
      return res.status(200).json({
        message: "Awaiting your input",
        story: normalizeStoryWithChosenNames(game.story),
        currentTurnIndex: game.currentTurnIndex,
        needText: true,
      });
    }

    const playerTurn = {
      turn: game.story.length + 1,
      user: req.user._id,
      content: String(text).trim(),
      createdAt: new Date(),
    };
    game.story.push(playerTurn);
    game.currentTurnIndex = (game.currentTurnIndex + 1) % game.players.length;
    await game.save();

    io?.to(game.roomCode).emit("turnAdded", {
      gameId: game._id,
      roomCode: game.roomCode,
      turn: playerTurn,
      nextTurnIndex: game.currentTurnIndex,
    });

    // --- AUTO AI TURN IF NEXT ---
    let aiTextReturned = null;
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

      aiTextReturned = aiText;
    }

    return res.status(201).json({
      message: "Turn added",
      text: aiTextReturned || null,  // ✅ if AI played, frontend gets text
      story: normalizeStoryWithChosenNames(game.story),
      currentTurnIndex: game.currentTurnIndex,
    });
  } catch (error) {
    console.error("[/game/turn] error:", error);
    res.status(500).json({ message: "Error adding turn", error: error.message });
  }
});

// Judgement
router.post("/judgement", protect, async (req, res) => {
  const { roomCode, story } = req.body;
  if (!roomCode && !Array.isArray(story)) {
    return res.status(400).json({ message: "roomCode or story is required" });
  }

  try {
    let sourceStory = story;
    let game = null;
    let room = null;

    // Always try to retrieve the game and room if roomCode is provided
    if (roomCode) {
      game = await Game.findOne({ roomCode }).populate("story.user", "username");
      room = await Room.findOne({ roomCode });
      if (!game) return res.status(404).json({ message: "Game not found" });
      if (!room) return res.status(404).json({ message: "Room not found" });
      
      // Only use the database story if no story was provided
      if (!sourceStory) {
        // ✅ Use chosen player names from room.playerNames instead of database usernames
        sourceStory = (game.story || []).map(s => {
          const userId = s.user?._id?.toString();
          const chosenName = room.playerNames.get(userId) || s.user?.username || "Player";
          return {
            player: chosenName,
            text: s.content || s.text || ""
          };
        });
      }
    }

    const result = await judgeStory({ story: sourceStory || [] });

    // ✅ save verdict in DB
    if (game) {
      game.verdict = result.verdict;
      game.scores = result.scores;
      game.isActive = false; // end game when judged
      await game.save();
      
      console.log(`[JUDGEMENT] Saved verdict ${result.verdict} for game ${game._id}`);
    }

    res.json(result);
  } catch (error) {
    console.error("[/game/judgement] error:", error);
    res.status(500).json({ message: "Error judging story", error: error.message });
  }
});

// Archive
router.get("/archive", protect, async (req, res) => {
  try {
    // Get all games for the user (no limit)
    const games = await Game.find({ players: req.user._id })
      .sort({ createdAt: -1 })
      .populate("players", "username")
      .populate("story.user", "username")
      .lean();

    const archives = [];
    const verdictCounts = { ALL: 0, WIN: 0, LOSE: 0, PENDING: 0, ABANDONED: 0 };
    
    for (const g of games) {
      // ✅ Get the room to access chosen player names
      const room = await Room.findOne({ roomCode: g.roomCode });
      
      const story = (g.story || []).map(s => {
        const userId = s.user?._id?.toString();
        // Use chosen name from room, fallback to database username
        const playerName = room?.playerNames?.get(userId) || s.user?.username || "Player";
        return {
          player: playerName,
          text: s.content || s.text || "",
        };
      });

      // ✅ Only show PENDING if no verdict exists, otherwise show the actual verdict
      const verdict = g.verdict || "PENDING";
      
      // Handle different verdict types
      let displayVerdict = verdict;
      if (verdict === "ABANDONED") {
        displayVerdict = "ABANDONED";
      } else if (verdict === "PENDING") {
        displayVerdict = "PENDING";
      } else {
        displayVerdict = verdict; // WIN or LOSE
      }

      // Count verdicts
      verdictCounts.ALL++;
      if (verdictCounts.hasOwnProperty(displayVerdict)) {
        verdictCounts[displayVerdict]++;
      }

      archives.push({
        id: String(g._id),
        date: new Date(g.updatedAt || g.createdAt).toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }),
        verdict: displayVerdict,
        title: g.title || "Untitled Tale",
        genre: g.genre || "Custom",
        story,
      });
    }

    console.log(`[ARCHIVE] Retrieved ${archives.length} games for user ${req.user._id}`);
    console.log(`[ARCHIVE] Verdicts:`, archives.map(g => ({ id: g.id, verdict: g.verdict })));
    console.log(`[ARCHIVE] Verdict counts:`, verdictCounts);

    res.json({ 
      archives,
      filters: { verdictCounts },
      pagination: { totalGames: games.length }
    });
  } catch (error) {
    console.error("[/game/archive] error:", error);
    res.status(500).json({ message: "Error fetching archives", error: error.message });
  }
});

// get game by room
router.get("/by-room/:roomCode", protect, async (req, res) => {
  try {
    const game = await Game.findOne({ roomCode: req.params.roomCode })
      .populate("players", "username email")
      .populate("story.user", "username");
    if (!game) return res.status(404).json({ message: "Game not found" });
    
    // ✅ Get room to access chosen player names
    const room = await Room.findOne({ roomCode: req.params.roomCode });
    
    // Normalize story with chosen names
    const normalizedStory = (game.story || []).map(s => {
      const userId = s.user?._id?.toString();
      const chosenName = room?.playerNames?.get(userId) || s.user?.username || "Player";
      return {
        player: chosenName,
        text: s.content || s.text || ""
      };
    });
    
    const gameData = game.toObject();
    gameData.story = normalizedStory;
    // Provide players with chosen names for the frontend
    gameData.players = (game.players || []).map(p => ({
      _id: p._id,
      username: room?.playerNames?.get(p._id.toString()) || p.username
    }));
    
    res.json(gameData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching game", error: error.message });
  }
});

// my games
router.get("/my", protect, async (req, res) => {
  try {
    const games = await Game.find({ players: req.user._id })
      .populate("players", "username email")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    const hostedGames = [];
    const joinedGames = [];
    
    for (const game of games) {
      // ✅ Get room to access chosen player names
      const room = await Room.findOne({ roomCode: game.roomCode });
      
      // Normalize story with chosen names
      const normalizedStory = (game.story || []).map(s => {
        const userId = s.user?._id?.toString();
        const chosenName = room?.playerNames?.get(userId) || s.user?.username || "Player";
        return {
          player: chosenName,
          text: s.content || s.text || ""
        };
      });
      
      const gameData = game.toObject();
      gameData.story = normalizedStory;
      
      if (game.createdBy?._id?.toString() === req.user._id.toString()) {
        hostedGames.push(gameData);
      } else {
        joinedGames.push(gameData);
      }
    }

    res.json({ hostedGames, joinedGames });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user games", error: error.message });
  }
});

// (legacy) add turn by id (kept for compatibility with older clients)
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

    // ✅ Get room to access chosen player names
    const room = await Room.findOne({ roomCode: game.roomCode });

    // Helper function to normalize story with chosen names
    const normalizeStoryWithChosenNames = (storyData) => {
      return (storyData || []).map(s => {
        const userId = s.user?._id?.toString();
        const chosenName = room?.playerNames?.get(userId) || s.user?.username || "Player";
        return {
          player: chosenName,
          text: s.content || s.text || ""
        };
      });
    };

    // human turn
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
      turn: playerTurn,
      nextTurnIndex: game.currentTurnIndex,
    });

    // AI turn if it's next
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
      story: normalizeStoryWithChosenNames(game.story),
      currentTurnIndex: game.currentTurnIndex,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding turn", error: error.message });
  }
});

// end game
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

// leave game (for active players)
router.post("/leave", protect, async (req, res) => {
  const { roomCode } = req.body;
  
  try {
    const game = await Game.findOne({ roomCode });
    if (!game) return res.status(404).json({ message: "Game not found" });

    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Check if user is a player in this game
    const isPlayer = game.players.some(p => p.toString() === req.user._id.toString());
    if (!isPlayer) return res.status(403).json({ message: "You are not a player in this game" });

    // Remove player from game
    game.players = game.players.filter(id => id.toString() !== req.user._id.toString());
    
    // If not enough players left, handle the game
    if (game.players.length < 2) {
      game.isActive = false;
      // Only mark as abandoned if the game was never started or has no story
      if (!game.story || game.story.length === 0) {
        game.verdict = "ABANDONED";
        console.log(`[GAME] Game ${game._id} marked as ABANDONED - no story content`);
      } else {
        // Keep game as PENDING if it has story content, let it be judged later
        console.log(`[GAME] Game ${game._id} kept as PENDING - has story content for judgement`);
      }
    }

    await game.save();

    // Also remove from room
    room.players = room.players.filter(id => id.toString() !== req.user._id.toString());
    room.playerNames.delete(req.user._id.toString());
    
    // If no players left, close room
    if (room.players.length === 0) {
      room.isActive = false;
      room.game = undefined;
    }
    
    await room.save();

    const io = req.app.get("io");
    io?.to(roomCode).emit("playerLeftGame", { 
      userId: req.user._id,
      players: room.players,
      gameEnded: !game.isActive
    });

    res.json({ 
      message: "Left game successfully", 
      gameEnded: !game.isActive,
      roomClosed: !room.isActive
    });
  } catch (error) {
    res.status(500).json({ message: "Error leaving game", error: error.message });
  }
});

// by id
router.get("/:id", protect, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate("players", "username email")
      .populate("story.user", "username");
    if (!game) return res.status(404).json({ message: "Game not found" });
    
    // ✅ Get room to access chosen player names
    const room = await Room.findOne({ roomCode: game.roomCode });
    
    // Normalize story with chosen names
    const normalizedStory = (game.story || []).map(s => {
      const userId = s.user?._id?.toString();
      const chosenName = room?.playerNames?.get(userId) || s.user?.username || "Player";
      return {
        player: chosenName,
        text: s.content || s.text || ""
      };
    });
    
    const gameData = game.toObject();
    gameData.story = normalizedStory;
    
    res.json(gameData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching game", error: error.message });
  }
});

export default router;