import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    genre: {
      type: String,
      enum: ["fantasy", "horror", "sci-fi", "mystery", "custom"],
      default: "custom",
    },
    createdBy: {
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
    story: [
      {
        turn: Number, // order of contribution
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: String, // contribution to story
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room", // link back to its Room
      required: true,
    },
    currentTurnIndex: {
      type: Number,
      default: 0, // start from first player
    }
  },
  { timestamps: true }
);

const Game = mongoose.model("Game", gameSchema);

export default Game;
