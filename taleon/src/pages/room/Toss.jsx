import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Toss = () => {
  const navigate = useNavigate();
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState("");
  const [showResult, setShowResult] = useState(false);

  const startToss = () => {
    let players =
      JSON.parse(sessionStorage.getItem("players")) || [
        sessionStorage.getItem("playerName") || "Player",
        "AI_Buddy",
      ];

    setFlipping(true);

    setTimeout(() => {
      setFlipping(false);
      const winner = players[Math.floor(Math.random() * players.length)];
      sessionStorage.setItem("tossWinner", winner);
      setResult(`${winner} starts the story!`);
      setShowResult(true);
    }, 1000);
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
