// src/components/TopMenu.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Or any icon lib you prefer

const TopMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-white/70 hover:bg-white text-gray-700 p-2 rounded-full backdrop-blur"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-4 border-b">
          <h2 className="font-bold text-lg">Menu</h2>
          <button onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex flex-col px-4 py-4 space-y-4 text-gray-700">
          <Link to="/tool-selection" onClick={() => setIsOpen(false)}>Tool Selection</Link>
          <Link to="/data-extraction" onClick={() => setIsOpen(false)}>Data Extraction</Link>
          <Link to="/config" onClick={() => setIsOpen(false)}>Configuration</Link>
          <Link to="/project-selection" onClick={() => setIsOpen(false)}>Project Selection</Link>
          <Link to="/kpis" onClick={() => setIsOpen(false)}>KPI Entry </Link>
          <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
        </nav>
      </div>
    </>
  );
};

export default TopMenu;
