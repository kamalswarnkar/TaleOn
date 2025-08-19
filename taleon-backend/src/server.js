import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import dotenv from 'dotenv';
import { gameSocketHandler } from './sockets/gameSocket.js';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect DB first
connectDB();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // tighten later to FE origin
  },
});

// ✅ centralize socket logic
gameSocketHandler(io);
app.set('io', io);

// Ensure AI user exists
const ensureAIUser = async () => {
  const aiEmail = "ai@system.local";
  let aiUser = await User.findOne({ email: aiEmail });
  if (!aiUser) {
    aiUser = new User({
      username: "AI_Player",
      email: aiEmail,
      password: "unusedpassword",
    });
    await aiUser.save();
    console.log("🤖 AI player seeded");
  } else {
    console.log("🤖 AI player already exists");
  }
};

httpServer.listen(PORT, async () => {
  await ensureAIUser();
  console.log(`🚀 Server running on port ${PORT}`);
});
