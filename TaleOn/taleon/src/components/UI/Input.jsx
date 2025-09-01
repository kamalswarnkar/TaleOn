/* Reusable Input Component */
import React from "react";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-[#ccc] mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full p-2 border-2 border-[#00c3ff] bg-transparent text-white rounded-md outline-none focus:border-[#ff006f] focus:shadow-[0_0_10px_#ff006f] ${className}`}
        {...props}
      />
    </div>
  );
}
