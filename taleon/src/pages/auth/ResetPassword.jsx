import React, { useState } from "react";
import "../../styles/Auth.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength] = useState("");

  const checkStrength = (pass) => {
    let s = 0;
    if (pass.length >= 8) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;

    if (!pass) setStrength("");
    else if (s <= 1) setStrength("Weak");
    else if (s === 2) setStrength("Moderate");
    else setStrength("Strong");
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      alert("Please fill in both fields!");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert("Your password has been updated!");
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full bg-[#111] border border-[#00c3ff] rounded-lg shadow-[0_0_20px_#00c3ff] transition-all duration-300 hover:shadow-[0_0_25px_#00c3ff,0_0_40px_#00c3ff] p-8">
        <h1
          className="font-orbitron text-[2rem] text-[#00c3ff] text-center"
          style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}
        >
          New{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f" }}
          >
            Password
          </span>
        </h1>
        <p className="text-center text-[#ccc] mt-2 mb-6 text-sm">
          Enter and confirm your new password below.
        </p>

        <form onSubmit={handleReset}>
          <div className="mb-5 relative">
            <label className="block font-bold mb-1 text-[#ccc]">
              New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkStrength(e.target.value);
              }}
              className="w-full p-2 pr-10 border-2 border-[#00c3ff] bg-transparent text-white rounded-md outline-none focus:border-[#ff006f] focus:shadow-[0_0_10px_#ff006f]"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute top-9 right-3 cursor-pointer ${
                showPassword ? "eye-pink" : "eye-blue"
              }`}
            >
              👁
            </span>
            {strength && (
              <p
                className={`mt-1 text-sm italic ${
                  strength === "Weak"
                    ? "text-red-500"
                    : strength === "Moderate"
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {strength} password
              </p>
            )}
          </div>

          <div className="mb-5 relative">
            <label className="block font-bold mb-1 text-[#ccc]">
              Confirm Password
            </label>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 pr-10 border-2 border-[#00c3ff] bg-transparent text-white rounded-md outline-none focus:border-[#ff006f] focus:shadow-[0_0_10px_#ff006f]"
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              className={`absolute top-9 right-3 cursor-pointer ${
                showConfirm ? "eye-pink" : "eye-blue"
              }`}
            >
              👁
            </span>
          </div>

          <button
            type="submit"
            className="w-full font-orbitron text-base px-5 py-2 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
          >
            Update Password
          </button>

          <p className="mt-6 text-center text-sm">
            <a href="/login" className="text-[#ff006f] hover:underline">
              Back to Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
