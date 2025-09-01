import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const JoinRoom = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const showFormError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const joinRoom = async () => {
    const name = playerName.trim();
    const code = roomCode.trim().toUpperCase();

    if (!name || !code) {
      showFormError("Please enter both name and room code!");
      return;
    }

    const codeOk = /^[A-Z0-9]{6}$/.test(code);
    if (!codeOk) {
      sessionStorage.setItem(
        "errorMessage",
        "Invalid room code format. Room codes must be 6 letters/numbers."
      );
      navigate("/error");
      return;
    }

    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (!user?.token) {
      alert("You must log in to join a room.");
      navigate("/login");
      return;
    }

    try {
      // backend call
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/room/join`,
        { roomCode: code },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      // backend confirms and returns room details
      sessionStorage.setItem("playerName", name);
      sessionStorage.setItem("roomCode", res.data.roomCode);

      navigate("/lobby");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Invalid room code or room no longer exists.";
      sessionStorage.setItem("errorMessage", msg);
      navigate("/error");
    }
  };

  const goBack = () => {
    navigate("/");
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter text-center min-h-screen flex items-center justify-center">
      <div className="max-w-[500px] mx-auto p-8 w-full">
        {/* Title */}
        <h1
          className="font-orbitron text-[2.8rem] tracking-[2px] text-neonBlue"
          style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}
        >
          Join{" "}
          <span
            className="text-neonPink"
            style={{ textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f" }}
          >
            Room
          </span>
        </h1>

        {/* Player Name */}
        <div className="my-5 text-left">
          <label
            htmlFor="playerName"
            className="block font-bold mb-1 text-[#ccc]"
          >
            Your Name
          </label>
          <input
            type="text"
            id="playerName"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-2 border-2 border-neonBlue bg-transparent text-white text-base rounded-md outline-none font-inter focus:border-neonPink focus:shadow-[0_0_10px_#ff006f]"
          />
        </div>

        {/* Room Code */}
        <div className="my-5 text-left">
          <label
            htmlFor="roomCode"
            className="block font-bold mb-1 text-[#ccc]"
          >
            Room Code
          </label>
          <input
            type="text"
            id="roomCode"
            placeholder="Enter room code (6 chars)"
            maxLength="6"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full p-2 border-2 border-neonBlue bg-transparent text-white text-base rounded-md outline-none font-inter uppercase focus:border-neonPink focus:shadow-[0_0_10px_#ff006f]"
          />
        </div>

        {/* Inline error */}
        {errorMsg && (
          <p className="text-sm text-red-400 text-left mt-1">{errorMsg}</p>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
            onClick={joinRoom}
            className="font-orbitron text-base px-5 py-2 rounded-md bg-neonBlue text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
          >
            Join Room
          </button>
          <button
            onClick={goBack}
            className="font-orbitron text-base px-5 py-2 rounded-md bg-neonPink text-white cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#ff006f,0_0_25px_#ff006f]"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
