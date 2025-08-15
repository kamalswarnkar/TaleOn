import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    // Load story from sessionStorage
    const storedStory =
      JSON.parse(sessionStorage.getItem("story")) || [
        { player: "Player_1", text: "Once upon a time..." },
        { player: "AI_Buddy", text: "Suddenly, a ghost appeared..." },
      ];
    setStory(storedStory);

    // Simulate AI Analysis delay
    setTimeout(() => {
      const result = Math.random() > 0.5 ? "WIN" : "LOSE";
      setVerdict(result);

      // Random scores
      setScores({
        flow: `${Math.floor(Math.random() * 5) + 1}/5`,
        creativity: `${Math.floor(Math.random() * 5) + 1}/5`,
        vibe: `${Math.floor(Math.random() * 5) + 1}/5`,
        immersion: `${Math.floor(Math.random() * 5) + 1}/5`,
      });

      // Save for roast page
      sessionStorage.setItem("gameResult", result);
    }, 1500);
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
            style={{ textShadow: "0 0 10px #ff006f,0 0 20px #ff006f" }}
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
            {verdict ? (verdict === "WIN" ? "You All Win!" : "You All Lose!") : "Analysing..."}
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
        </div>

        {/* Story Review */}
        <div className="mt-8 text-left border-t border-[#333] pt-4">
          <h3 className="font-orbitron text-[#00c3ff] mb-2">Final Story</h3>
          <div className="bg-white/5 p-3 rounded-md max-h-[250px] overflow-y-auto">
            {story.map((entry, index) => (
              <p key={index}>
                <strong>{entry.player}:</strong> {entry.text}
              </p>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={goToRoast}
          className="mt-6 font-orbitron text-base px-6 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
        >
          Continue to Roast
        </button>
      </div>
    </div>
  );
};

export default Judgement;
