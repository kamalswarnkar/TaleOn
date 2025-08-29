import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkAndRejoinSession, clearGameData } from "../../utils/rejoin.js";

const Landing = () => {
  const navigate = useNavigate();
  const [showRejoinModal, setShowRejoinModal] = useState(false);
  const [rejoinData, setRejoinData] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionCheck = await checkAndRejoinSession();
        if (sessionCheck.canRejoin) {
          setRejoinData(sessionCheck);
          setShowRejoinModal(true);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleRejoin = () => {
    if (rejoinData) {
      navigate(rejoinData.redirectTo);
    }
  };

  const handleDismissRejoin = () => {
    setShowRejoinModal(false);
    setRejoinData(null);
    // Clear all game/room data when dismissing rejoin
    clearGameData();
  };

  const handleProtectedNavigation = (path) => {
    const isLoggedIn = !!sessionStorage.getItem("user"); // Change to localStorage if persistent
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  if (checkingSession) {
    return (
      <div className="bg-[#0a0a0a] text-white font-inter flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00c3ff] mx-auto mb-4"></div>
          <p className="text-[#ccc]">Checking for active sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] text-white font-inter text-center flex flex-col min-h-screen">
      {/* Rejoin Modal */}
      {showRejoinModal && rejoinData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#00c3ff] rounded-lg shadow-[0_0_20px_#00c3ff] p-6 max-w-md w-full">
            <h3 className="font-orbitron text-xl text-[#00c3ff] mb-4">
              {rejoinData.completedGame ? "Game Completed" : "Rejoin Session?"}
            </h3>
            <p className="text-[#ccc] mb-6">
              {rejoinData.completedGame
                ? "Your previous game session has been completed."
                : `You have an active ${rejoinData.type === "game" ? "game" : "room"} session. Would you like to rejoin?`
              }
            </p>
            {rejoinData.reason && (
              <p className="text-[#ff6b6b] text-sm mb-4">
                {rejoinData.reason}
              </p>
            )}
            <div className="flex gap-3">
              {!rejoinData.completedGame ? (
                <>
                  <button
                    onClick={handleRejoin}
                    className="flex-1 font-orbitron text-base px-4 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
                  >
                    Rejoin
                  </button>
                  <button
                    onClick={handleDismissRejoin}
                    className="flex-1 font-orbitron text-base px-4 py-2 rounded-md bg-[#ff006f] text-white cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#ff006f,0_0_25px_#ff006f]"
                  >
                    Dismiss
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDismissRejoin}
                  className="w-full font-orbitron text-base px-4 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
                >
                  Start New Game
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[700px] mx-auto p-8 flex-1">
        {/* Title */}
        <h1
          className="font-orbitron text-[3rem] sm:text-[3.5rem] tracking-[2px] text-[#00c3ff]"
          style={{
            textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff",
          }}
        >
          Tale
          <span
            className="text-[#ff006f]"
            style={{
              textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f",
            }}
          >
            On
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-lg mt-2 text-[#ccc]">
          Keep the tale going… or get roasted together!
        </p>

        {/* Buttons */}
        <div className="my-10 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => handleProtectedNavigation("/create-room")}
            className="font-orbitron text-lg px-6 py-3 border-2 border-[#00c3ff] rounded-md bg-transparent text-white hover:bg-[#00c3ff] hover:text-black transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
          >
            Create Room
          </button>

          <button
            onClick={() => handleProtectedNavigation("/join-room")}
            className="font-orbitron text-lg px-6 py-3 border-2 border-[#00c3ff] rounded-md bg-transparent text-white hover:bg-[#00c3ff] hover:text-black transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
          >
            Join Room
          </button>

          <button
            onClick={() => navigate("/archive")}
            className="font-orbitron text-lg px-6 py-3 border-2 border-[#ff006f] rounded-md bg-transparent text-white hover:bg-[#ff006f] hover:text-black transition duration-300 hover:shadow-[0_0_15px_#ff006f,0_0_25px_#ff006f]"
          >
            View Archive
          </button>
        </div>

        {/* How it works */}
        <div className="mt-12">
          <h2 className="font-orbitron text-[#ff006f] drop-shadow-[0_0_10px_#ff006f]">
            How It Works
          </h2>
          <p className="text-[#aaa] leading-relaxed mt-2">
            Take turns writing a story with friends and AI. No genre rules —
            just keep it flowing! At the end, AI decides if you all win… or if
            it roasts you mercilessly.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#111] py-4 border-t border-[#222] text-sm text-[#666]">
        <p>
          © 2025 TaleOn |{" "}
          <a href="#" className="text-[#00c3ff] hover:underline">
            Terms
          </a>{" "}
          |{" "}
          <a href="#" className="text-[#00c3ff] hover:underline">
            Privacy
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Landing;
