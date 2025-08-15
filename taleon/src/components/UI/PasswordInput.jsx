import React from "react";
import { useState } from "react";

export default function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full relative">
      {label && (
        <label className="block text-sm font-bold text-[#ccc] mb-1">
          {label}
        </label>
      )}
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full p-2 pr-10 border-2 ${
          showPassword
            ? "border-[#ff006f] focus:border-[#ff006f] focus:shadow-[0_0_10px_#ff006f]"
            : "border-[#00c3ff] focus:border-[#ff006f] focus:shadow-[0_0_10px_#ff006f]"
        } bg-transparent text-white rounded-md outline-none ${className}`}
        {...props}
      />
      <span
        onClick={() => setShowPassword(!showPassword)}
        className={`absolute top-9 right-3 cursor-pointer transition-colors duration-300 ${
          showPassword ? "text-[#ff006f]" : "text-[#00c3ff]"
        }`}
      >
        {showPassword ? "👁" : "👁"}
      </span>
    </div>
  );
}
