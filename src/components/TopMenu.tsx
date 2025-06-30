import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

import homepage from "../assets/images/homepage.png";
import settingsIc from "../assets/images/settings-icon.png";
import projectslogo from "../assets/images/projectsIcon.png"; 
import dataToolIcon from "../assets/images/dataToolIcon.png";
import dashBtn from "../assets/images/dashboard.png";
import kpiBtn from "../assets/images/kpis.png";
import harnessBg from "../assets/images/harness-bg.png";

const TopMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { to: "/tool-selection", label: "Home Page", icon: homepage },
    { to: "/project-selection", label: "Project Selection", icon: projectslogo },
    { to: "/data-extraction", label: "Data Extraction", icon: dataToolIcon },
    { to: "/kpis/drx", label: "KPI Entry", icon: kpiBtn },
    { to: "/dashboard", label: "Dashboard", icon: dashBtn },
    { to: "/config", label: "Settings", icon: settingsIc },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-white/70 hover:bg-white text-gray-700 p-2 rounded-full backdrop-blur shadow-md"
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

      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-cover bg-center z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundImage: `url(${harnessBg})` }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-black/40 backdrop-blur-md border-b border-white/20">
          <h2 className="font-bold text-lg text-white">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-yellow-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
<div className="flex flex-col flex-grow justify-center items-center px-4 space-y-4 overflow-y-auto py-6">
  {menuItems.map(({ to, label, icon }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        key={to}
        to={to}
        onClick={() => setIsOpen(false)}
        className={`group flex items-center gap-4 w-full max-w-xs px-6 h-20 rounded-lg text-white text-base font-semibold transition duration-200 relative
          ${isActive
            ? "bg-yellow-400 text-black"
            : "bg-white/20 hover:bg-white/30"
          } backdrop-blur-md`}
      >
        <img src={icon} alt={label} className="w-8 h-8 object-contain" />
        <span>{label}</span>

        {!isActive && (
          <span className="absolute bottom-2 left-6 right-6 h-1 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
        )}
      </Link>
    );
  })}
</div>

      </div>
    </>
  );
};

export default TopMenu;
