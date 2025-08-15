import React from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleProtectedNavigation = (path) => {
    const isLoggedIn = !!sessionStorage.getItem("user"); // Change to localStorage if persistent
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter text-center flex flex-col min-h-screen">
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
