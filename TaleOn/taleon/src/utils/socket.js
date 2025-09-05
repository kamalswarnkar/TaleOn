// src/utils/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

if (!SOCKET_URL) {
  throw new Error('VITE_SOCKET_URL environment variable is required');
}

let socket = null;

export const connectSocket = (onConnect) => {
  if (socket) return socket;
  
  // Get authentication token
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = user.token;
  
  socket = io(SOCKET_URL, { 
    autoConnect: false,
    auth: {
      token: token
    }
  });
  
  socket.connect();
  socket.on("connect", () => {
    if (onConnect) onConnect(socket);
  });
  
  // Handle authentication errors
  socket.on("error", (error) => {
    console.error("Socket authentication error:", error);
    // Redirect to login if authentication fails
    if (error.message.includes("authentication") || error.message.includes("token")) {
      sessionStorage.removeItem("user");
      window.location.href = "/login";
    }
  });
  
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Helper function to join room with authentication
export const joinRoom = (roomCode, username) => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = user.token;
  
  if (!token) {
    console.error("No authentication token available");
    return false;
  }
  
  if (socket) {
    socket.emit("joinRoom", { roomCode, username, token });
    return true;
  }
  
  return false;
};
