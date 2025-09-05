import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      unique: true,
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Map user IDs to their chosen player names
    playerNames: {
      type: Map,
      of: String,
      default: {}
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game", // each room is tied to a Game session
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Game configuration
    turnTime: { type: Number, default: 10 }, // minutes
    maxRounds: { type: Number, default: 5 },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
