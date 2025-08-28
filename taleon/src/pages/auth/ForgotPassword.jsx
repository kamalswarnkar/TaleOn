import React, { useState } from "react";
import axios from "axios";
import "../../styles/Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/auth/forgot-password`,
        { email }
      );

      setMessage("Password reset link sent to your email!");
      setEmail("");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send reset link";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md bg-[#111] p-8 rounded-lg border border-[#00c3ff] shadow-[0_0_20px_#00c3ff] transition-all duration-300 hover:shadow-[0_0_25px_#00c3ff,0_0_40px_#00c3ff]">
        <h1
          className="font-orbitron text-3xl text-center text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}
        >
          Forgot{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f" }}
          >
            Password
          </span>
        </h1>
        <p className="text-center text-[#ccc] mt-2 mb-6 text-sm">
          Enter your registered email to receive a reset link.
        </p>

        {message && (
          <div className={`p-3 rounded-md mb-4 text-center ${
            message.includes("sent") 
              ? "bg-green-900/20 border border-green-500 text-green-400" 
              : "bg-red-900/20 border border-red-500 text-red-400"
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleForgot} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#ccc] mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full p-2 border-2 border-[#00c3ff] bg-transparent text-white rounded-md outline-none focus:border-[#ff006f] focus:shadow-[0_0_10px_#ff006f] disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-orbitron text-base px-5 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff] disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="mt-6 text-center text-sm">
            <a href="/login" className="text-[#ff006f] hover:underline">
              Back to Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
