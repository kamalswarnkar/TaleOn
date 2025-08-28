import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/UI/Toast";
import axios from "axios";

const Archive = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [archives, setArchives] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [verdictCounts, setVerdictCounts] = useState({});
  const [totalGames, setTotalGames] = useState(0);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    const fetchArchives = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/game/archive`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        const games = (res.data.archives || []).map((g) => {
          // Ensure we have a proper verdict - show PENDING if no verdict exists
          const verdict = g.verdict || "PENDING";
          
          const story = (g.story || []).map((s) => ({
            player:
              typeof s.player === "object"
                ? s.player.username || s.player.name || "Player"
                : s.player,
            text: s.text || "",
          }));

          return {
            ...g,
            verdict,
            story,
          };
        });

        // Set the games and counts from backend
        setArchives(games);
        setFiltered(games);
        setVerdictCounts(res.data.filters?.verdictCounts || {});
        setTotalGames(res.data.pagination?.totalGames || 0);
      } catch (err) {
        console.error("Archive fetch failed:", err);
        error("Failed to load archive");
        setArchives([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArchives();
  }, [error]);

  const filterStories = (type) => {
    setActiveFilter(type);
    if (type === "all") {
      setFiltered(archives);
    } else if (type === "PENDING") {
      setFiltered(archives.filter((s) => s.verdict === "PENDING"));
    } else {
      setFiltered(archives.filter((s) => s.verdict === type));
    }
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

        <p className="text-[#ccc] italic mb-5">
          Relive your wins, your losses, and the chaos in between.
        </p>

        {/* Filters */}
        <div className="mb-6">
          <button
            onClick={() => filterStories("all")}
            className={`font-orbitron text-sm px-4 py-2 m-1 rounded-md transition duration-300 ${
              activeFilter === "all"
                ? "bg-[#00c3ff] text-black shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
                : "bg-[#333] text-white hover:bg-[#444]"
            }`}
          >
            All ({verdictCounts.ALL || totalGames || archives.length})
          </button>
          <button
            onClick={() => filterStories("WIN")}
            className={`font-orbitron text-sm px-4 py-2 m-1 rounded-md transition duration-300 ${
              activeFilter === "WIN"
                ? "bg-[#00ff9f] text-black shadow-[0_0_15px_#00ff9f,0_0_25px_#00ff9f]"
                : "bg-[#333] text-white hover:bg-[#444]"
            }`}
          >
            Wins ({verdictCounts.WIN || 0})
          </button>
          <button
            onClick={() => filterStories("LOSE")}
            className={`font-orbitron text-sm px-4 py-2 m-1 rounded-md transition duration-300 ${
              activeFilter === "LOSE"
                ? "bg-[#ff003c] text-black shadow-[0_0_15px_#ff003c,0_0_25px_#ff003c]"
                : "bg-[#333] text-white hover:bg-[#444]"
            }`}
          >
            Losses ({verdictCounts.LOSE || 0})
          </button>
          <button
            onClick={() => filterStories("PENDING")}
            className={`font-orbitron text-sm px-4 py-2 m-1 rounded-md transition duration-300 ${
              activeFilter === "PENDING"
                ? "bg-[#00c3ff] text-black shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
                : "bg-[#333] text-white hover:bg-[#444]"
            }`}
          >
            Pending ({verdictCounts.PENDING || 0})
          </button>
        </div>

        {/* Archive List */}
        <div className="bg-white/5 p-4 rounded-lg border border-[#00c3ff] shadow-[0_0_10px_#00c3ff] max-h-[500px] overflow-y-auto">
          {loading ? (
            <p className="text-[#aaa] italic">Loading past chaos...</p>
          ) : filtered.length === 0 ? (
            <p className="text-[#ccc] italic">No matching games found.</p>
          ) : (
            <div className="space-y-4 text-left">
              {filtered.map((game) => (
                <div
                  key={game.id}
                  className={`p-4 rounded-lg border bg-white/5 transition duration-300 ${
                    game.verdict === "WIN"
                      ? "border-[#00ff9f] shadow-[0_0_10px_#00ff9f]"
                      : game.verdict === "LOSE"
                      ? "border-[#ff003c] shadow-[0_0_10px_#ff003c]"
                      : "border-[#00c3ff] shadow-[0_0_10px_#00c3ff]"
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[#ccc]">{game.date}</span>
                    <span
                      className={`font-bold ${
                        game.verdict === "WIN"
                          ? "text-[#00ff9f]"
                          : game.verdict === "LOSE"
                          ? "text-[#ff003c]"
                          : "text-[#00c3ff]"
                      }`}
                    >
                      {game.verdict}
                    </span>
                  </div>

                  {/* Story */}
                  <div className="bg-white/5 p-2 rounded-md text-sm max-h-[150px] overflow-y-auto">
                    {game.story.length > 0 ? (
                      game.story.map((s, idx) => (
                        <div key={idx} className="mb-1">
                          <strong>{s.player}:</strong> {s.text}
                        </div>
                      ))
                    ) : (
                      <p className="text-[#aaa] italic">No story content available.</p>
                    )}
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
