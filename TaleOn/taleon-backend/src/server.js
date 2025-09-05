import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { gameSocketHandler } from './sockets/gameSocket.js';
import connectDB from './config/db.js';
import User from './models/User.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Connect DB first
connectDB();

const httpServer = createServer(app);

// Socket.io configuration with production settings
const io = new Server(httpServer, {
  cors: {
    origin: NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL,
          process.env.FRONTEND_URL?.replace('https://', 'https://www.'),
          process.env.FRONTEND_URL?.replace('http://', 'http://www.')
        ].filter(Boolean)
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Make io available to routes
app.set('io', io);

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Game socket handler
gameSocketHandler(io);

// Ensure AI user exists
const ensureAIUser = async () => {
  try {
    const aiUser = await User.findOne({ email: "ai@system.local" });
    if (!aiUser) {
      const newAIUser = new User({
        username: "AI_Buddy",
        email: "ai@system.local",
        password: "ai_password_hash_123", // This won't be used for login
      });
      await newAIUser.save();
      console.log("🤖 AI player created");
    } else {
      console.log("🤖 AI player already exists");
    }
  } catch (error) {
    console.error("❌ Error ensuring AI user:", error);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
httpServer.listen(PORT, async () => {
  await ensureAIUser();
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🔗 CORS Origins: ${NODE_ENV === 'production' ? 'Production URLs' : 'Localhost URLs'}`);
});

// Handle server errors
httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error('💡 Try using a different port or kill the process using this port');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});
