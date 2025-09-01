/* Reusable Button Component */
import React from 'react'

export default function Button({ children, onClick, type = "button", variant = "primary", className = "" }) {
  const baseStyles = "font-orbitron px-5 py-2 rounded-md transition duration-300 w-full";
  
  const variants = {
    primary: "bg-[#00c3ff] text-black hover:shadow-[0_0_15px_#00c3ff,0_0_25px_#00c3ff]",
    secondary: "bg-white text-black hover:shadow-[0_0_15px_#fff,0_0_25px_#fff]",
    danger: "bg-red-500 text-white hover:shadow-[0_0_15px_red,0_0_25px_red]"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
