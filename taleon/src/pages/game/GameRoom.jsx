import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const GameRoom = () => {
  const navigate = useNavigate();

  const storedPlayers =
    JSON.parse(sessionStorage.getItem("players")) || [
      sessionStorage.getItem("playerName") || "Player",
      "AI_Buddy",
    ];

  const storedTurnTime = parseInt(sessionStorage.getItem("turnTime")) || 10;
  const storedMaxRounds = parseInt(sessionStorage.getItem("maxRounds")) || 5;

  const [players] = useState(storedPlayers);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(() => {
    const tossWinner = sessionStorage.getItem("tossWinner");
    return tossWinner ? players.indexOf(tossWinner) : 0;
  });
  const [currentRound, setCurrentRound] = useState(1);
  const [story, setStory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(storedTurnTime * 60);
  const [storyInput, setStoryInput] = useState("");

  const timerRef = useRef(null);

  const roomCode = sessionStorage.getItem("roomCode") || "ABCD12";

  useEffect(() => {
    updateTurnDisplay();
    startTimer();
    // Cleanup timer when unmounting
    return () => clearInterval(timerRef.current);
  }, [currentTurnIndex, currentRound]);

  const updateTurnDisplay = () => {
    setStoryInput("");

    if (players[currentTurnIndex] === "AI_Buddy") {
      setTimeout(() => {
        const aiText = "AI_Buddy continues the story with a twist...";
        setStory((prev) => [...prev, { player: "AI_Buddy", text: aiText }]);
        nextTurn();
      }, 1500);
    }
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(storedTurnTime * 60);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (players[currentTurnIndex] !== "AI_Buddy") {
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

  const submitTurn = () => {
    if (!storyInput.trim()) {
      alert("Please write something before submitting!");
      return;
    }
    setStory((prev) => [
      ...prev,
      { player: players[currentTurnIndex], text: storyInput.trim() },
    ]);
    nextTurn();
  };

  const nextTurn = () => {
    clearInterval(timerRef.current);

    let nextRound = currentRound;
    let nextIndex = (currentTurnIndex + 1) % players.length;

    if (currentTurnIndex === players.length - 1) {
      nextRound++;
    }

    if (nextRound > storedMaxRounds) {
      sessionStorage.setItem("story", JSON.stringify(story));
      navigate("/judgement");
      return;
    }

    setCurrentRound(nextRound);
    setCurrentTurnIndex(nextIndex);
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter min-h-screen flex items-center justify-center">
      <div className="max-w-[800px] w-full p-6 text-center">
        {/* Title */}
        <h1
          className="font-orbitron text-[2.5rem] tracking-[2px] text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff,0 0 20px #00c3ff" }}
        >
          Tale
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f,0 0 20px #ff006f" }}
          >
            On
          </span>{" "}
          Game
        </h1>

        {/* Room Code */}
        <p className="text-sm mt-1 mb-5 text-[#ccc]">
          Room Code:{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 8px #ff006f" }}
          >
            {roomCode}
          </span>
        </p>

        {/* Story Feed */}
        <div className="bg-white/5 p-4 rounded-md border border-[#00c3ff] shadow-[0_0_10px_#00c3ff] h-[300px] overflow-y-auto text-left mb-6">
          {story.length > 0 ? (
            story.map((entry, index) => (
              <p key={index}>
                <strong>{entry.player}:</strong> {entry.text}
              </p>
            ))
          ) : (
            <p className="text-[#aaa] italic">The story begins...</p>
          )}
        </div>

        {/* Turn Info */}
        <div className="mb-4">
          <p>Current Turn: {players[currentTurnIndex]}</p>
          <p>Time Left: {formatTime(timeLeft)}</p>
        </div>

        {/* Turn Input */}
        {players[currentTurnIndex] !== "AI_Buddy" && (
          <div className="mt-4">
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
