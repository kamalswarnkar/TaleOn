import mongoose from "mongoose";

const turnSchema = new mongoose.Schema(
  {
    turn: Number,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    genre: {
      type: String,
      enum: ["fantasy", "horror", "sci-fi", "mystery", "comedy", "drama", "custom"],
      lowercase: true,
      default: "custom",
    },

    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    roomCode: { type: String, required: true, unique: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    story: [turnSchema],
    currentTurnIndex: { type: Number, default: 0 },
    turnTimeLimit: { type: Number, default: 600 }, // seconds
    isActive: { type: Boolean, default: true },

    // Judgement fields
    verdict: { type: String, enum: ["WIN", "LOSE"] },
    scores: {
      flow: String,
      creativity: String,
      vibe: String,
      immersion: String
    },

    // optional "finals"
    finalizedTitle: { type: String },
    finalizedGenre: { type: String },
    mergedStory: { type: String }, // convenience field saved at end
  },
  { timestamps: true }
);

export default mongoose.model("Game", gameSchema);
