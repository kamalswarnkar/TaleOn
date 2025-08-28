import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Judgement = () => {
  const navigate = useNavigate();

  const [story, setStory] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [scores, setScores] = useState({
    flow: "--",
    creativity: "--",
    vibe: "--",
    immersion: "--",
  });
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    let storedStory = [];
    try {
      storedStory = JSON.parse(sessionStorage.getItem("story")) || [];
    } catch {
      storedStory = [];
    }

    if (!Array.isArray(storedStory) || storedStory.length === 0) {
      storedStory = [{ player: "System", text: "No story recorded." }];
    }

    // Normalize story data to ensure consistent structure
    const normalizedStory = storedStory.map(entry => {
      let playerName = "Player";
      let text = "";

      if (typeof entry === "object") {
        // Handle different story entry formats
        if (entry.player) {
          if (typeof entry.player === "object") {
            playerName = entry.player.username || entry.player.name || entry.player._id || "Player";
          } else {
            playerName = entry.player;
          }
        } else if (entry.user) {
          if (typeof entry.user === "object") {
            playerName = entry.user.username || entry.user.name || entry.user._id || "Player";
          } else {
            playerName = entry.player;
          }
        }
        
        text = entry.text || entry.content || "";
      } else if (typeof entry === "string") {
        text = entry;
      }

      return { player: playerName, text };
    });
    
    console.log("[JUDGEMENT] Normalized story:", normalizedStory);

    setStory(normalizedStory);

    // ✅ Check if we already have a verdict stored (prevents refresh vulnerability)
    const storedVerdict = sessionStorage.getItem("gameResult");
    const storedScores = sessionStorage.getItem("gameScores");
    
    if (storedVerdict && storedScores) {
      console.log("[JUDGEMENT] Using stored verdict:", storedVerdict);
      // Use stored verdict to prevent refresh vulnerability
      setVerdict(storedVerdict);
      try {
        setScores(JSON.parse(storedScores));
      } catch {
        setScores({
          flow: "3/5",
          creativity: "3/5",
          vibe: "3/5",
          immersion: "3/5",
        });
      }
      setHasFetched(true);
      return; // Don't fetch again if we have stored result
    }
    
    // Prevent multiple fetches
    if (hasFetched) {
      console.log("[JUDGEMENT] Already fetched, skipping");
      return;
    }
    
    console.log("[JUDGEMENT] No stored verdict found, fetching from backend");

    const roomCode = sessionStorage.getItem("roomCode");
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    const fetchJudgement = async () => {
      try {
        console.log("[JUDGEMENT] Sending story to backend:", normalizedStory);
        
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/game/judgement`,
          { roomCode, story: normalizedStory },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        const { verdict, scores } = res.data || {};
        console.log("[JUDGEMENT] Backend response:", { verdict, scores });
        
        if (verdict && scores) {
          console.log("[JUDGEMENT] Setting verdict:", verdict);
          setVerdict(verdict);
          setScores(scores);
          setHasFetched(true);
          // ✅ Store both verdict and scores to prevent refresh vulnerability
          sessionStorage.setItem("gameResult", verdict);
          sessionStorage.setItem("gameScores", JSON.stringify(scores));
        } else {
          throw new Error("Invalid response from /game/judgement");
        }
      } catch (err) {
        console.error("Judgement failed:", err);
        const fallbackVerdict = "LOSE";
        const fallbackScores = {
          flow: "2/5",
          creativity: "2/5",
          vibe: "2/5",
          immersion: "2/5",
        };
        console.log("[JUDGEMENT] Setting fallback verdict:", fallbackVerdict);
        setVerdict(fallbackVerdict);
        setScores(fallbackScores);
        setHasFetched(true);
        // ✅ Store fallback results too
        sessionStorage.setItem("gameResult", fallbackVerdict);
        sessionStorage.setItem("gameScores", JSON.stringify(fallbackScores));
      }
    };

    fetchJudgement();
  }, []);

  const goToRoast = () => {
    navigate("/roast");
  };

  const verdictBoxClasses =
    verdict === "WIN"
      ? "border-[#00ff9f] shadow-[0_0_20px_#00ff9f] text-[#00ff9f]"
      : verdict === "LOSE"
      ? "border-[#ff003c] shadow-[0_0_20px_#ff003c] text-[#ff003c]"
      : "border-[#00c3ff] shadow-[0_0_20px_#00c3ff]";

  return (
    <div className="bg-[#0a0a0a] text-white font-inter text-center min-h-screen flex items-center justify-center">
      <div className="max-w-[800px] w-full mx-auto p-5">
        {/* Title */}
        <h1
          className="font-orbitron text-[2.5rem] tracking-[2px] text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff,0 0 20px #00c3ff" }}
        >
          AI{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f" }}
          >
            Judgement
          </span>
        </h1>

        {/* Verdict Box */}
        <div
          id="verdictBox"
          className={`mt-6 mx-auto px-6 py-4 rounded-lg border-2 w-fit transition-all duration-500 ${verdictBoxClasses}`}
        >
          <h2 id="verdictText" className="text-xl font-bold">
            {verdict
              ? verdict === "WIN"
                ? "You All Win!"
                : "You All Lose!"
              : "Analysing..."}
          </h2>
        </div>

        {/* Criteria Scores */}
        <div className="text-left max-w-[400px] mx-auto my-6 space-y-2">
          <p>
            <strong>Flow:</strong> {scores.flow}
          </p>
          <p>
            <strong>Creativity:</strong> {scores.creativity}
          </p>
          <p>
            <strong>Vibe:</strong> {scores.vibe}
          </p>
          <p>
            <strong>Immersion:</strong> {scores.immersion}
          </p>
          
          {/* Scoring Guide */}
          <div className="mt-4 p-3 bg-white/5 rounded-md border border-[#333]">
            <p className="text-sm text-[#ccc] mb-2">
              <strong>Scoring Guide:</strong>
            </p>
            <div className="text-xs text-[#aaa] space-y-1">
              <p>• <strong>Flow (1-5):</strong> Logical progression, coherent narrative structure</p>
              <p>• <strong>Creativity (1-5):</strong> Original ideas, imaginative elements</p>
              <p>• <strong>Vibe (1-5):</strong> Consistent tone, engaging atmosphere</p>
              <p>• <strong>Immersion (1-5):</strong> Draws reader in, maintains interest</p>
            </div>
            <p className="text-xs text-[#ff006f] mt-2">
              💡 Tip: Write coherent, engaging stories with clear plot progression to score higher!
            </p>
          </div>
        </div>

        {/* Story Review */}
        <div className="mt-8 text-left border-t border-[#333] pt-4">
          <h3 className="font-orbitron text-[#00c3ff] mb-2">Final Story</h3>
          <div className="bg-white/5 p-3 rounded-md max-h-[250px] overflow-y-auto leading-relaxed">
            {Array.isArray(story) && story.length > 0 ? (
              story.map((entry, index) => (
                <p key={index} className="mb-2">
                  <strong>{entry.player}:</strong> {entry.text}
                </p>
              ))
            ) : (
              <p className="text-[#aaa] italic">No story recorded.</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={goToRoast}
            className="font-orbitron text-base px-6 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
          >
            Continue to Roast
          </button>
          
          {/* ✅ Clear stored verdict (for testing/debugging) */}
          <button
            onClick={() => {
              sessionStorage.removeItem("gameResult");
              sessionStorage.removeItem("gameScores");
              setHasFetched(false);
              setVerdict(null);
              setScores({
                flow: "--",
                creativity: "--",
                vibe: "--",
                immersion: "--",
              });
              window.location.reload();
            }}
            className="font-orbitron text-base px-4 py-2 rounded-md bg-[#ff006f] text-white cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#ff006f,0_0_25px_#ff006f]"
          >
            Reset Judgement
          </button>
        </div>
      </div>
    </div>
  );
};

export default Judgement;
