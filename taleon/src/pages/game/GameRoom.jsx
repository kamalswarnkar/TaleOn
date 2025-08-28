import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/UI/Toast";
import axios from "axios";

const GameRoom = () => {
  const navigate = useNavigate();

  // Get stored players with their chosen names
  const storedPlayers = JSON.parse(sessionStorage.getItem("players")) || [];
  const storedTurnTime = parseInt(sessionStorage.getItem("turnTime")) || 10;
  const storedMaxRounds = parseInt(sessionStorage.getItem("maxRounds")) || 5;

  const roomCode = sessionStorage.getItem("roomCode") || "ABCD12";
  const gameId = sessionStorage.getItem("gameId");
  const gameTitle = sessionStorage.getItem("gameTitle") || "Untitled Tale";
  const gameGenre = sessionStorage.getItem("gameGenre") || "Custom";

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [players] = useState(storedPlayers);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(() => {
    const tossWinner = sessionStorage.getItem("tossWinner");
    return tossWinner
      ? players.findIndex((p) => p.username === tossWinner)
      : 0;
  });
  const [currentRound, setCurrentRound] = useState(1);
  const [story, setStory] = useState([]); // [{player, text}]
  const [timeLeft, setTimeLeft] = useState(storedTurnTime * 60);
  const [storyInput, setStoryInput] = useState("");
  const timerRef = useRef(null);
  const { error } = useToast();

  // 🔑 Helper to map ID → username/chosen name
  const getPlayerName = (playerId) => {
    // First try to find by username (chosen name)
    const p = players.find(
      (pl) => pl.username === playerId || pl._id === playerId
    );
    
    if (p) {
      return p.username || p.name || "Player";
    }
    
    // Fallback to playerId if no match found
    return playerId;
  };

  useEffect(() => {
    updateTurnDisplay();
    startTimer();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTurnIndex, currentRound]);

  const updateTurnDisplay = async () => {
    setStoryInput("");
    const currentPlayer = players[currentTurnIndex]?.username || "Player";

    if (currentPlayer === "AI_Buddy") {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/game/turn`,
          { roomCode, gameId },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        if (res.data?.story) {
          setStory(res.data.story);
        } else {
          setStory((prev) => [
            ...prev,
            { player: "AI_Buddy", text: res.data?.text || "AI had no response." },
          ]);
        }

        nextTurn();
      } catch (err) {
        console.error(err);
        setStory((prev) => [
          ...prev,
          { player: "AI_Buddy", text: "AI failed to respond, skipping..." },
        ]);
        nextTurn();
      }
    }
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(storedTurnTime * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (players[currentTurnIndex]?.username !== "AI_Buddy") {
            nextTurn();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const submitTurn = async () => {
    if (!storyInput.trim()) {
      error("Please write something before submitting!");
      return;
    }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/game/turn`,
        { roomCode, gameId, text: storyInput.trim() },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (res.data?.story) {
        setStory(res.data.story);
      } else {
        setStory((prev) => [
          ...prev,
          { player: players[currentTurnIndex]?.username || "Player", text: storyInput.trim() },
        ]);
      }

      nextTurn();
    } catch (err) {
      console.error(err);
      error("Failed to submit turn");
    }
  };

  const nextTurn = () => {
    clearInterval(timerRef.current);
    let nextRound = currentRound;
    let nextIndex = (currentTurnIndex + 1) % players.length;

    if (currentTurnIndex === players.length - 1) {
      nextRound++;
    }

    if (nextRound > storedMaxRounds) {
      // ✅ Ensure story is stored with proper player names for judgement
      const storyWithNames = story.map(entry => ({
        player: entry.player || "Player",
        text: entry.text || ""
      }));
      
      sessionStorage.setItem("story", JSON.stringify(storyWithNames));
      sessionStorage.setItem(
        "archiveGame",
        JSON.stringify({
          gameId,
          title: gameTitle,
          genre: gameGenre,
          story: storyWithNames,
        })
      );
      navigate("/judgement");
      return;
    }

    setCurrentRound(nextRound);
    setCurrentTurnIndex(nextIndex);
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter min-h-screen flex items-center justify-center">
      <div className="max-w-[800px] w-full p-6 text-center">
        <h1
          className="font-orbitron text-[2.5rem] tracking-[2px] text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff,0 0 20px #00c3ff" }}
        >
          Tale
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f" }}
          >
            On
          </span>{" "}
          Game
        </h1>

        <p className="text-sm mt-1 mb-5 text-[#ccc]">
          Room Code:{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 8px #ff006f" }}
          >
            {roomCode}
          </span>
        </p>

        <div className="bg-white/5 p-4 rounded-md border border-[#00c3ff] shadow-[0_0_10px_#00c3ff] h-[300px] overflow-y-auto text-left mb-6">
          {story.length > 0 ? (
            story.map((entry, index) => (
              <p key={index}>
                <strong>{getPlayerName(entry.player)}:</strong> {entry.text}
              </p>
            ))
          ) : (
            <p className="text-[#aaa] italic">The story begins...</p>
          )}
        </div>

        <div className="mb-4">
          <p>Current Turn: {players[currentTurnIndex]?.username || "Player"}</p>
          <p>
            Round {currentRound} / {storedMaxRounds}
          </p>
          <p>Time Left: {formatTime(timeLeft)}</p>
        </div>

        {players[currentTurnIndex]?.username !== "AI_Buddy" && (
          <div className="mt-4">
            {/* Story Writing Tips */}
            <div className="mb-3 p-2 bg-white/5 rounded-md border border-[#00c3ff] text-xs text-[#ccc]">
              <p className="mb-1"><strong>💡 Story Writing Tips:</strong></p>
              <p>• Write coherent sentences that advance the plot</p>
              <p>• Build on what previous players wrote</p>
              <p>• Avoid random text or gibberish</p>
              <p>• Keep the story engaging and logical</p>
            </div>
            
            <textarea
              placeholder="Write your part of the story..."
              value={storyInput}
              onChange={(e) => setStoryInput(e.target.value)}
              className="w-full h-[100px] bg-transparent text-white border-2 border-[#00c3ff] rounded-md p-2 text-base font-inter resize-none outline-none focus:border-[#ff006f] focus:shadow-[0_0_10px_#ff006f]"
            />
            <button
              onClick={submitTurn}
              className="mt-3 font-orbitron text-base px-5 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoom;
