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
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = new Room({
      roomCode,
      host: req.user._id,
      players: [req.user._id],
    });

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
  const { roomCode } = req.body;

  try {
    const room = await Room.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.isActive) return res.status(400).json({ message: "Room is closed" });

    const alreadyIn = room.players.some(id => id.toString() === req.user._id.toString());
    if (!alreadyIn) {
      room.players.push(req.user._id);
      await room.save();
    }

    res.json({
      message: "Joined room successfully",
      roomCode: room.roomCode,
      players: room.players,
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

    res.json(room);
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

    room.players = room.players.filter(id => id.toString() !== req.user._id.toString());

    if (wasHost) {
      if (room.players.length > 0) {
        room.host = room.players[0]; // transfer host
      } else {
        room.isActive = false; // no players left, close the room
      }
    }

    await room.save();

    res.json({ message: "Left room", players: room.players, host: room.host });
  } catch (error) {
    res.status(500).json({ message: "Error leaving room", error: error.message });
  }
});

export default router;
