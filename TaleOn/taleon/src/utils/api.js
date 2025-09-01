// src/utils/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// attach token from sessionStorage automatically
api.interceptors.request.use((config) => {
  try {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  } catch (e) {
    // ignore parse errors
    console.error("API error:", e);
    throw e;
  }
  return config;
}, (err) => Promise.reject(err));

export default api;
