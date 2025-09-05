import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/UI/Toast";
import "../../styles/Auth.css";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error("Please fill all fields!");
      return;
    }

    setLoading(true);

    try {
      // call backend API
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password }
      );

      // backend returns: { _id, username, email, token }
      const userObj = {
        _id: res.data._id,
        username: res.data.username,
        email: res.data.email,
        token: res.data.token,
      };

      sessionStorage.setItem("user", JSON.stringify(userObj));

      success("Login successful!");
      navigate("/"); // Redirect to landing
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Login failed";
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-inter flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md bg-[#111] p-8 rounded-lg border border-[#00c3ff] shadow-[0_0_20px_#00c3ff] transition-all duration-300 hover:shadow-[0_0_25px_#00c3ff,0_0_40px_#00c3ff]">
        <h1
          className="font-orbitron text-3xl text-center text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff, 0 0 20px #00c3ff" }}
        >
          Log{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f, 0 0 20px #ff006f" }}
          >
            In
          </span>
        </h1>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#ccc] mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full p-2 border-2 border-[#00c3ff] bg-transparent text-white rounded-md outline-none focus:border-[#ff006f] focus:shadow-[0_0_10px_#ff006f] disabled:opacity-50"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-bold text-[#ccc] mb-1">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full p-2 pr-10 border-2 border-[#00c3ff] bg-transparent text-white rounded-md outline-none focus:border-[#ff006f] focus:shadow-[0_0_10px_#ff006f] disabled:opacity-50"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute top-9 right-3 cursor-pointer ${
                showPassword ? "eye-pink" : "eye-blue"
              }`}
            >
              👁
            </span>
            <a
              href="/forgot-password"
              className="block text-sm text-[#00c3ff] mt-1 hover:underline text-right"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-orbitron px-5 py-2 mt-4 rounded-md bg-[#00c3ff] text-black hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff] transition duration-300 disabled:opacity-50"
          >
            {loading ? "Logging In..." : "Log In"}
          </button>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-[#333]" />
            <span className="mx-3 text-[#777]">OR</span>
            <hr className="flex-grow border-[#333]" />
          </div>

          <a
            href={`${import.meta.env.VITE_API_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-3 font-orbitron px-5 py-2 rounded-md bg-white text-black hover:shadow-[0_0_15px_#fff,0_0_25px_#fff] transition duration-300"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </a>

          <p className="mt-4 text-sm text-[#aaa] text-center">
            Don't have an account?{" "}
            <a href="/signup" className="text-[#00c3ff] hover:underline">
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
