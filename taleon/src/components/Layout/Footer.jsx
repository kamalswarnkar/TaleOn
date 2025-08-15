import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a] text-[#aaa] text-center py-4 border-t border-[#00c3ff] shadow-[0_-0_15px_#00c3ff]">
      <p className="text-sm font-inter">
        © {new Date().getFullYear()} TaleOn — <span className="text-[#00c3ff]">Where Stories Come Alive</span>
      </p>
    </footer>
  );
};

export default Footer;
