// src/utils/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const connectSocket = (onConnect) => {
  if (socket) return socket;
  socket = io(SOCKET_URL, { autoConnect: false });
  socket.connect();
  socket.on("connect", () => {
    if (onConnect) onConnect(socket);
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
