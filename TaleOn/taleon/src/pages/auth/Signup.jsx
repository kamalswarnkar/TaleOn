import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Signup.css"; // for extra styles like eye glow
import axios from "axios";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState("");
  const navigate = useNavigate();

  const checkStrength = (pass) => {
    let s = 0;
    if (pass.length >= 6) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;

    if (!pass) setStrength("");
    else if (s <= 1) setStrength("Weak");
    else if (s === 2 || s === 3) setStrength("Medium");
    else setStrength("Strong");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert("Please fill all fields!");
      return;
    }

    try {
      // call backend signup API
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/signup`,
        {
          username: name,
          email,
          password,
        }
      );

      // backend returns: { _id, username, email, token }
      const userObj = {
        _id: res.data._id,
        username: res.data.username,
        email: res.data.email,
        token: res.data.token,
      };

      sessionStorage.setItem("user", JSON.stringify(userObj));

      alert("Account created!");
      navigate("/"); // Redirect to landing
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Signup failed";
      alert(msg);
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md bg-[#111] p-8 rounded-lg border border-[#00c3ff] shadow-[0_0_20px_#00c3ff] transition-all duration-300 hover:shadow-[0_0_25px_#00c3ff,0_0_40px_#00c3ff]">
        <h1
          className="font-orbitron text-3xl text-center text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}
        >
          Sign{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f" }}
          >
            Up
          </span>
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#ccc] mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border-2 border-[#00c3ff] bg-transparent text-white rounded-md outline-none transition duration-300 focus:border-[#ff006f] focus:shadow-[0_0_12px_#ff006f]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#ccc] mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-[#00c3ff] bg-transparent text-white rounded-md outline-none transition duration-300 focus:border-[#ff006f] focus:shadow-[0_0_12px_#ff006f]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#ccc] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkStrength(e.target.value);
                }}
                className="w-full p-3 pr-12 border-2 border-[#00c3ff] bg-transparent text-white rounded-md outline-none transition duration-300 focus:border-[#ff006f] focus:shadow-[0_0_12px_#ff006f]"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                id="toggleEye"
                className={`absolute inset-y-0 right-3 flex items-center cursor-pointer transition duration-300 ${
                  showPassword ? "eye-pink" : "eye-blue"
                }`}
              >
                👁
              </span>
            </div>
            {strength && (
              <p
                className={`mt-1 text-sm font-bold ${
                  strength === "Weak"
                    ? "text-red-500"
                    : strength === "Medium"
                    ? "text-orange-400"
                    : "text-green-400"
                }`}
              >
                {strength}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full font-orbitron px-5 py-2 mt-4 rounded-md bg-[#00c3ff] text-black font-bold transition duration-300 hover:shadow-[0_0_18px_#00c3ff,0_0_30px_#00c3ff]"
          >
            Sign Up
          </button>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-[#333]" />
            <span className="mx-3 text-[#777]">OR</span>
            <hr className="flex-grow border-[#333]" />
          </div>

          <a
            href={`${import.meta.env.VITE_API_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-3 font-orbitron px-5 py-2 rounded-md bg-white text-black transition duration-300 hover:shadow-[0_0_18px_#fff,0_0_30px_#fff]"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </a>

          <p className="mt-4 text-sm text-[#aaa] text-center">
            Already have an account?{" "}
            <a href="/login" className="text-[#00c3ff] hover:underline">
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
