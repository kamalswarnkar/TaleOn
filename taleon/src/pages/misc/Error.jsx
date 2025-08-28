import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState(
    "Something went wrong. The room code may be invalid or you were disconnected."
  );

  useEffect(() => {
    const customMessage = sessionStorage.getItem("errorMessage");
    if (customMessage) {
      setMessage(customMessage);
    }
  }, []);

  return (
    <div className="bg-[#0a0a0a] text-white font-[Inter] flex items-center justify-center min-h-screen">
      <div className="max-w-[600px] p-10 bg-white/5 rounded-lg border border-[#00c3ff] shadow-[0_0_15px_#00c3ff] text-center">
        {/* Title */}
        <h1
          className="font-[Orbitron] text-[2.5rem] text-[#00c3ff]"
          style={{ textShadow: "0 0 10px #00c3ff,0 0 20px #00c3ff" }}
        >
          Oops!{" "}
          <span
            className="text-[#ff006f]"
            style={{ textShadow: "0 0 10px #ff006f,0 0 20px #ff006f" }}
          >
            Error
          </span>
        </h1>

        {/* Message */}
        <p className="mt-4 text-[#ccc] text-lg">{message}</p>

        {/* Button */}
        <button
          onClick={() => navigate("/")}
          className="font-[Orbitron] text-base px-5 py-2 mt-6 rounded-md bg-[#00c3ff] text-black cursor-pointer transition duration-300 hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]"
        >
          Go Back to Home
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
