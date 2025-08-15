import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Roast = () => {
  const navigate = useNavigate();
  const [roasts, setRoasts] = useState([]);

  useEffect(() => {
    const players =
      JSON.parse(sessionStorage.getItem("players")) || [
        sessionStorage.getItem("playerName") || "Player",
        "AI_Buddy",
      ];
    const result = sessionStorage.getItem("gameResult") || "LOSE";

    const winRoasts = [
      "Your plot twist made no sense... but it was so good I almost cried.",
      "You kept the story alive, even if your grammar didn't.",
      "That was so weird, I loved it.",
      "Your part was like fine wine... except served in a plastic cup.",
    ];

    const loseRoasts = [
      "Your plot twist was so bad, even plot holes avoided it.",
      "I’ve seen more coherent stories in a toddler’s doodle book.",
      "If storytelling was a crime, you'd be sentenced to silence.",
      "Your scene was the narrative equivalent of a Windows XP error.",
    ];

    const generatedRoasts = players
      .filter((player) => player !== "AI_Buddy")
      .map((player) => ({
        name: player,
        roast:
          result === "WIN"
            ? winRoasts[Math.floor(Math.random() * winRoasts.length)]
            : loseRoasts[Math.floor(Math.random() * loseRoasts.length)],
      }));

    setRoasts(generatedRoasts);
  }, []);

  return (
    <div className="bg-[#0a0a0a] text-white font-inter text-center min-h-screen flex items-center justify-center">
      <div className="max-w-[700px] mx-auto p-5">
        {/* Title */}
        <h1
          className="font-orbitron text-[2.5rem] tracking-[2px] text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff,0 0 20px #00c3ff" }}
        >
          AI{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f,0 0 20px #ff006f" }}
          >
            Roast
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-5 text-[#ccc] italic">No one leaves unscathed...</p>

        {/* Roast List */}
        <div className="text-left bg-white/5 p-4 rounded-lg border border-[#00c3ff] shadow-[0_0_10px_#00c3ff] mb-8">
          {roasts.map((item, idx) => (
            <div
              key={idx}
              className="mb-2 pb-2 border-b border-white/10 last:border-b-0"
            >
              <span className="font-bold text-[#00c3ff]">{item.name}: </span>
              <span>{item.roast}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate("/lobby")}
            className="font-orbitron text-base px-5 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate("/landing")}
            className="font-orbitron text-base px-5 py-2 rounded-md bg-[#ff006f] text-white cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#ff006f,0_0_25px_#ff006f]"
          >
            Exit
          </button>
          <button
            onClick={() => navigate("/archive")}
            className="font-orbitron text-base px-5 py-2 rounded-md bg-[#ff006f] text-white cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#ff006f,0_0_25px_#ff006f]"
          >
            View Archive
          </button>
        </div>
      </div>
    </div>
  );
};

export default Roast;
