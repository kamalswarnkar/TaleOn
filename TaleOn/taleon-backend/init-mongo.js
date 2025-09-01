// MongoDB initialization script for Docker container
db = db.getSiblingDB('taleon');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('rooms');
db.createCollection('games');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "googleId": 1 });
db.users.createIndex({ "username": 1 });

db.rooms.createIndex({ "code": 1 }, { unique: true });
db.rooms.createIndex({ "hostId": 1 });
db.rooms.createIndex({ "createdAt": 1 });

db.games.createIndex({ "roomId": 1 });
db.games.createIndex({ "status": 1 });
db.games.createIndex({ "createdAt": 1 });

// Create AI user account
db.users.insertOne({
  username: "AI_Buddy",
  email: "ai@system.local",
  password: "ai_password_hash_123",
  isAI: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("MongoDB initialized successfully!");
print("Collections created: users, rooms, games");
print("Indexes created for performance");
print("AI user account created");


