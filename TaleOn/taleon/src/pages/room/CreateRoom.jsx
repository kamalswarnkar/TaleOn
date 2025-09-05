import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateRoom = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [maxRounds, setMaxRounds] = useState("");
  const [turnTime, setTurnTime] = useState("");

  const createRoom = async () => {
    if (!playerName.trim() || !maxRounds.trim() || !turnTime.trim()) {
      alert("Please fill in all fields!");
      return;
    }

    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (!user?.token) {
      alert("You must be logged in to create a room.");
      navigate("/login");
      return;
    }

    try {
      // ✅ send playerName, turnTime, maxRounds
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/room/create`,
        {
          playerName: playerName.trim(),
          maxRounds: Number(maxRounds),
          turnTime: Number(turnTime),
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      const room = res.data.room || {};
      const roomCode = room.roomCode || res.data.roomCode;

      // store values locally for UI flow
      sessionStorage.setItem("playerName", playerName.trim());
      sessionStorage.setItem("maxRounds", maxRounds);
      sessionStorage.setItem("turnTime", turnTime);
      sessionStorage.setItem("roomCode", roomCode);

      if (room.players) {
        sessionStorage.setItem("players", JSON.stringify(room.players));
      }

      navigate("/lobby");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to create room";
      alert(msg);
    }
  };

  const goBack = () => {
    navigate("/");
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-[Inter] text-center min-h-screen">
      {/* Autofill Dark Mode Fix */}
      <style>{`
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px #0a0a0a inset !important;
          -webkit-text-fill-color: #fff !important;
          border: 2px solid #00c3ff !important;
          caret-color: #fff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        input:-webkit-autofill:focus {
          border: 2px solid #ff006f !important;
          -webkit-box-shadow: 0 0 0px 1000px #0a0a0a inset, 0 0 10px #ff006f !important;
        }
      `}</style>

      <div className="max-w-[500px] mx-auto p-8">
        {/* Title */}
        <h1
          className="font-[Orbitron] text-[2.8rem] tracking-[2px] text-neonBlue"
          style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}
        >
          Create{" "}
          <span
            className="text-neonPink"
            style={{ textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f" }}
          >
            Room
          </span>
        </h1>

        {/* Player Name */}
        <div className="my-5 text-left">
          <label htmlFor="playerName" className="block font-bold mb-1 text-[#ccc]">
            Your Name
          </label>
          <input
            type="text"
            id="playerName"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-2 border-2 border-neonBlue bg-transparent text-white text-base rounded-md outline-none font-[Inter] focus:border-neonPink focus:shadow-[0_0_10px_#ff006f]"
          />
        </div>

        {/* Max Rounds */}
        <div className="my-5 text-left">
          <label htmlFor="maxRounds" className="block font-bold mb-1 text-[#ccc]">
            Max Rounds
          </label>
          <input
            type="number"
            id="maxRounds"
            placeholder="e.g. 5"
            min="1"
            max="20"
            value={maxRounds}
            onChange={(e) => setMaxRounds(e.target.value)}
            className="w-full p-2 border-2 border-neonBlue bg-transparent text-white text-base rounded-md outline-none font-[Inter] focus:border-neonPink focus:shadow-[0_0_10px_#ff006f]"
          />
        </div>

        {/* Turn Time */}
        <div className="my-5 text-left">
          <label htmlFor="turnTime" className="block font-bold mb-1 text-[#ccc]">
            Turn Time (minutes)
          </label>
          <input
            type="number"
            id="turnTime"
            placeholder="e.g. 10"
            min="1"
            max="60"
            value={turnTime}
            onChange={(e) => setTurnTime(e.target.value)}
            className="w-full p-2 border-2 border-neonBlue bg-transparent text-white text-base rounded-md outline-none font-[Inter] focus:border-neonPink focus:shadow-[0_0_10px_#ff006f]"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
            onClick={createRoom}
            className="font-[Orbitron] text-base px-5 py-2 rounded-md bg-neonBlue text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
          >
            Create Room
          </button>
          <button
            onClick={goBack}
            className="font-[Orbitron] text-base px-5 py-2 rounded-md bg-neonPink text-white cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#ff006f,0_0_25px_#ff006f]"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
