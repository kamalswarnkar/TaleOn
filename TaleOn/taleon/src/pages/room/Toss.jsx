import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/UI/Toast";
import axios from "axios";

const Toss = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState("");
  const [showResult, setShowResult] = useState(false);

  const startToss = async () => {
    const roomCode = sessionStorage.getItem("roomCode");
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    if (!roomCode || !user?.token) {
      error("Missing room or login info.");
      navigate("/");
      return;
    }

    setFlipping(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/game/start`,
        { roomCode },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      // ✅ backend now explicitly provides starter information
      const { players = [], gameId, title, genre, starterUserId, starterName } = res.data;

      if (!players.length) {
        throw new Error("No players returned from backend.");
      }

      // Use explicit starter information from backend
      const starter = starterName || players[0].username;

      // store game session info
      sessionStorage.setItem("tossWinner", starter);
      sessionStorage.setItem("players", JSON.stringify(players));
      sessionStorage.setItem("gameId", gameId);
      sessionStorage.setItem("gameTitle", title);
      sessionStorage.setItem("gameGenre", genre);

      setTimeout(() => {
        setFlipping(false);
        setResult(`${starter} starts the story!`);
        setShowResult(true);
      }, 1000);
    } catch (err) {
      console.error(err);
      setFlipping(false);
      error(err?.response?.data?.message || "Failed to start toss/game");
      navigate("/");
    }
  };

  const goToGame = () => {
    navigate("/game-room");
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter text-center min-h-screen flex items-center justify-center">
      <div className="max-w-[500px] w-full p-10 bg-white/5 rounded-md border border-[#00c3ff] shadow-[0_0_15px_#00c3ff]">
        {/* Title */}
        <h1
          className="font-orbitron text-[2.5rem] mb-6 text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}
        >
          Who{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f" }}
          >
            Starts?
          </span>
        </h1>

        {/* Coin */}
        <div
          className={`w-[120px] h-[120px] mx-auto mb-5 rounded-full bg-gradient-to-br from-[#00c3ff] to-[#0077ff] shadow-[0_0_20px_#00c3ff,0_0_40px_#00c3ff] ${
            flipping ? "animate-flip" : ""
          }`}
        ></div>

        {/* Toss Button */}
        {!showResult && (
          <button
            onClick={startToss}
            disabled={flipping}
            className="font-orbitron text-lg px-6 py-2 mt-3 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff] disabled:opacity-50"
          >
            Flip Coin
          </button>
        )}

        {/* Result */}
        {showResult && (
          <div className="mt-6">
            <p
              className="text-[#ff006f] text-lg"
              style={{ textShadow: "0 0 10px #ff006f" }}
            >
              {result}
            </p>
            <button
              onClick={goToGame}
              className="font-orbitron text-lg px-5 py-2 mt-4 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
            >
              Go to Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toss;
