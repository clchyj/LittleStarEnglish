import React from 'react';

interface HeaderProps {
  onHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHome }) => {
  return (
    <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <button onClick={onHome} className="flex items-center gap-2 focus:outline-none group">
          <div className="bg-white text-primary p-2 rounded-full font-bold text-xl group-hover:scale-110 transition-transform">
            ⭐
          </div>
          <h1 className="text-2xl font-bold tracking-wide">Little Star English</h1>
        </button>
        <nav>
           <span className="text-indigo-200 text-sm">Primary English Tutor</span>
        </nav>
      </div>
    </header>
  );
};

export default Header;
