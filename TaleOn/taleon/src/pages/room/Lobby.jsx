import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/UI/Toast";
import axios from "axios";
import { connectSocket, joinRoom } from "../../utils/socket.js";

const Lobby = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [roomCode, setRoomCode] = useState("----");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const code = sessionStorage.getItem("roomCode");
    const playerName = sessionStorage.getItem("playerName");

    if (!code || !playerName) {
      navigate("/");
      return;
    }

    setRoomCode(code);

    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (!user?.token) {
      error("You must be logged in.");
      navigate("/login");
      return;
    }

    // fetch latest room info from backend
    axios
      .get(
        `${import.meta.env.VITE_API_URL}/room/${code}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      .then((res) => {
        console.log("Room data received:", res.data);
        // Persist full players for game session usage
        const fullPlayers = [
          ...res.data.players.map((p) => ({
            _id: p._id,
            username: p.playerName || p.username || "Player",
          })),
        ];
        sessionStorage.setItem("players", JSON.stringify(fullPlayers));

        // Determine host
        const currentUserId = user._id;
        const currentIsHost = res.data.host && res.data.host._id === currentUserId;
        setIsHost(!!currentIsHost);
        sessionStorage.setItem("isHost", currentIsHost ? "1" : "0");

        setPlayers(
          res.data.players.map((p) => ({
            name: p.playerName || p.username || "Player",
            isHost: p._id === res.data.host._id,
          }))
        );

        // Proactively detect if a game is already active for this room and redirect
        axios
          .get(`${import.meta.env.VITE_API_URL}/game/by-room/${code}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          })
          .then((gameRes) => {
            const g = gameRes.data;
            if (!g || !g._id) return;
            sessionStorage.setItem("gameId", g._id);
            sessionStorage.setItem("gameTitle", g.title || "Untitled Tale");
            sessionStorage.setItem("gameGenre", g.genre || "custom");
            // Build players from game payload + ensure chosen names if available
            const playersFromGame = Array.isArray(g.players)
              ? g.players.map((pl) => ({ _id: pl._id, username: pl.username }))
              : [];
            const hasAI2 = playersFromGame.some((p) => p.username === "AI_Buddy");
            const finalPlayers = hasAI2
              ? playersFromGame
              : [...playersFromGame, { _id: "AI", username: "AI_Buddy" }];
            sessionStorage.setItem("players", JSON.stringify(finalPlayers));
            if (!currentIsHost) {
              navigate("/game-room");
            }
          })
          .catch(() => {});
      })
      .catch((err) => {
        console.error(err);
        error("Failed to load room data");
        navigate("/");
      });

    // connect to socket with authentication
    const socket = connectSocket();
    
    // Join room with authentication
    if (!joinRoom(code, playerName)) {
      error("Failed to join room. Please try again.");
      navigate("/");
      return;
    }

    socket.on("playerJoined", (data) => {
      console.log("Player joined:", data);
      setPlayers(data.players.map((p) => ({ 
        name: p.playerName || p.username || "Player",
        isHost: p._id === data.host?._id
      })));
    });

    socket.on("playerLeft", (data) => {
      console.log("Player left:", data);
      setPlayers(data.players.map((p) => ({ 
        name: p.playerName || p.username || "Player",
        isHost: p._id === data.host?._id
      })));
    });

    // When backend starts the game, everyone in room should proceed
    socket.on("gameStarted", (data) => {
      try {
        if (!data) return;
        if (data.gameId) sessionStorage.setItem("gameId", data.gameId);
        if (data.title) sessionStorage.setItem("gameTitle", data.title);
        if (data.genre) sessionStorage.setItem("gameGenre", data.genre);
        // Ensure AI player exists locally for clients who didn't initiate start
        const existing = JSON.parse(sessionStorage.getItem("players") || "[]");
        const hasAI = existing.some((p) => p.username === "AI_Buddy");
        if (!hasAI) {
          const withAI = [...existing, { _id: "AI", username: "AI_Buddy" }];
          sessionStorage.setItem("players", JSON.stringify(withAI));
        }
        // Proceed to game room
        navigate("/game-room");
      } catch (e) {
        console.error("Failed handling gameStarted:", e);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const startGame = () => {
    navigate("/toss");
  };

  const leaveLobby = () => {
    navigate("/");
  };

  const refreshRoom = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/room/${roomCode}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setPlayers(res.data.players.map((p) => ({
        name: p.playerName || p.username || "Player",
        isHost: p._id === res.data.host._id
      })));
    } catch (err) {
      console.error("Failed to refresh room:", err);
    }
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
              className={`bg-white/5 p-2 my-2 rounded-md border ${
                player.isHost 
                  ? 'border-[#ff006f] shadow-[0_0_5px_#ff006f]' 
                  : 'border-[#00c3ff] shadow-[0_0_5px_#00c3ff]'
              }`}
            >
              <span className="flex items-center justify-between">
                <span>{player.name}</span>
                {player.isHost && (
                  <span className="text-xs text-[#ff006f] font-bold">👑 HOST</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          {isHost && (
            <button
              onClick={startGame}
              className="font-orbitron text-base px-5 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
            >
              Start Game
            </button>
          )}
          <button
            onClick={refreshRoom}
            className="font-orbitron text-base px-4 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
          >
            🔄 Refresh
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
