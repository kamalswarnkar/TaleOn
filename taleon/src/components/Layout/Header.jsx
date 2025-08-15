import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-[#0a0a0a] border-b border-[#00c3ff] shadow-[0_0_15px_#00c3ff]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-orbitron text-2xl text-[#00c3ff]" style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}>
          Tale<span className="text-[#ff006f]" style={{ textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f" }}>On</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex space-x-6 font-orbitron text-sm">
          <Link to="/archive" className="text-[#ccc] hover:text-[#00c3ff] transition">Archive</Link>
          <Link to="/create-room" className="text-[#ccc] hover:text-[#00c3ff] transition">Create Room</Link>
          <Link to="/join-room" className="text-[#ccc] hover:text-[#00c3ff] transition">Join Room</Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex space-x-3">
          <Link
            to="/login"
            className="px-3 py-1 bg-[#00c3ff] text-black rounded hover:shadow-[0_0_10px_#00c3ff] transition font-orbitron"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-3 py-1 bg-[#ff006f] text-white rounded hover:shadow-[0_0_10px_#ff006f] transition font-orbitron"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
