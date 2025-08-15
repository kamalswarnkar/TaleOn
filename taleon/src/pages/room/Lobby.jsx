import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("----");
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // Load from sessionStorage
    const code = sessionStorage.getItem("roomCode") || "ABCD12";
    const playerName = sessionStorage.getItem("playerName") || "Host (You)";

    setRoomCode(code);
    setPlayers([
      { name: playerName },
      { name: "AI_Buddy" } // Example player
    ]);
  }, []);

  const startGame = () => {
    navigate("/toss");
  };

  const leaveLobby = () => {
    navigate("/");
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter text-center min-h-screen flex items-center justify-center">
      <div className="max-w-[600px] w-full p-10 bg-white/5 rounded-md border border-[#00c3ff] shadow-[0_0_15px_#00c3ff]">
        
        {/* Title */}
        <h1
          className="font-orbitron text-[2.8rem] tracking-[2px] text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}
        >
          Game{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f" }}
          >
            Lobby
          </span>
        </h1>

        {/* Room Code */}
        <p className="text-lg mt-2 mb-8 text-[#ccc]">
          Room Code:{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 8px #ff006f" }}
          >
            {roomCode}
          </span>
        </p>

        {/* Section Title */}
        <h2
          className="font-orbitron text-[1.5rem] mb-4 text-[#00c3ff]"
          style={{ textShadow: "0 0 5px #00c3ff" }}
        >
          Players
        </h2>

        {/* Player List */}
        <ul className="list-none p-0 m-0 mx-auto mb-8 max-w-[300px]">
          {players.map((player, index) => (
            <li
              key={index}
              className="bg-white/5 p-2 my-2 rounded-md border border-[#00c3ff] shadow-[0_0_5px_#00c3ff]"
            >
              {player.name}
            </li>
          ))}
        </ul>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={startGame}
            className="font-orbitron text-base px-5 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
          >
            Start Game
          </button>
          <button
            onClick={leaveLobby}
            className="font-orbitron text-base px-5 py-2 rounded-md bg-[#ff006f] text-white cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#ff006f,0_0_25px_#ff006f]"
          >
            Leave Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
