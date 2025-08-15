import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Archive = () => {
  const navigate = useNavigate();
  const [archives, setArchives] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Load archive data (mock/localStorage)
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("archives")) || [
      {
        id: 1,
        date: "2025-08-14",
        verdict: "WIN",
        story: [
          { player: "Player_1", text: "Once upon a time..." },
          { player: "AI_Buddy", text: "A ghost appeared and laughed..." },
        ],
      },
      {
        id: 2,
        date: "2025-08-12",
        verdict: "LOSE",
        story: [
          { player: "Player_2", text: "We went to Mars..." },
          { player: "AI_Buddy", text: "But forgot to bring oxygen." },
        ],
      },
    ];
    setArchives(stored);
    setFiltered(stored);
  }, []);

  const filterStories = (type) => {
    if (type === "all") setFiltered(archives);
    else setFiltered(archives.filter((s) => s.verdict === type));
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter text-center min-h-screen p-5">
      <div className="max-w-[900px] mx-auto">
        {/* Title */}
        <h1
          className="font-orbitron text-[2.5rem] tracking-[2px] text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}
        >
          Game{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f" }}
          >
            Archive
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-[#ccc] italic mb-5">
          Relive your wins, your losses, and the chaos in between.
        </p>

        {/* Filters */}
        <div className="mb-6">
          <button
            onClick={() => filterStories("all")}
            className="font-orbitron text-sm px-4 py-2 m-1 rounded-md bg-[#00c3ff] text-black hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff] transition duration-300"
          >
            All
          </button>
          <button
            onClick={() => filterStories("WIN")}
            className="font-orbitron text-sm px-4 py-2 m-1 rounded-md bg-[#00c3ff] text-black hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff] transition duration-300"
          >
            Wins
          </button>
          <button
            onClick={() => filterStories("LOSE")}
            className="font-orbitron text-sm px-4 py-2 m-1 rounded-md bg-[#00c3ff] text-black hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff] transition duration-300"
          >
            Losses
          </button>
        </div>

        {/* Outer Blue Glowing Container */}
        <div className="bg-white/5 p-4 rounded-lg border border-[#00c3ff] shadow-[0_0_10px_#00c3ff] max-h-[500px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-[#ccc] italic">No matching games found.</p>
          ) : (
            <div className="space-y-4 text-left">
              {filtered.map((game) => (
                <div
                  key={game.id}
                  className={`p-4 rounded-lg border bg-white/5 transition duration-300 ${
                    game.verdict === "WIN"
                      ? "border-[#00ff9f] shadow-[0_0_10px_#00ff9f]"
                      : "border-[#ff003c] shadow-[0_0_10px_#ff003c]"
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[#ccc]">
                      #{game.id} — {game.date}
                    </span>
                    <span
                      className={`font-bold ${
                        game.verdict === "WIN"
                          ? "text-[#00ff9f]"
                          : "text-[#ff003c]"
                      }`}
                    >
                      {game.verdict}
                    </span>
                  </div>

                  {/* Story */}
                  <div className="bg-white/5 p-2 rounded-md text-sm max-h-[150px] overflow-y-auto">
                    {game.story.map((s, idx) => (
                      <div key={idx}>
                        <strong>{s.player}:</strong> {s.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Home Button */}
        <div className="mt-8">
          <button
            onClick={() => navigate("/")}
            className="font-orbitron text-base px-5 py-2 rounded-md bg-[#ff006f] text-white hover:shadow-[0_0_15px_#ff006f,0_0_25px_#ff006f] transition duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Archive;
