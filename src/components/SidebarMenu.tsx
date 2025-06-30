import React from "react";
import { Link, useLocation } from "react-router-dom";

import drxIcon from "../assets/images/drx.png";
import downtimeIcon from "../assets/images/downtime.png";
import budgetIcon from "../assets/images/budget.png";
import followupIcon from "../assets/images/costs.png";
import scrapIcon from "../assets/images/scrap.png";

const tabs = [
  { path: "/kpis/followup", label: " Follow-up Cost ", icon: followupIcon },
  { path: "/kpis/scrap", label: " Scrap ", icon: scrapIcon },
  { path: "/kpis/drx", label: "Engineering DRX Ideas ", icon: drxIcon },
  { path: "/kpis/downtime", label: " Downtime ", icon: downtimeIcon },
  { path: "/kpis/budget", label: " Budget ", icon: budgetIcon },
  
];

const SidebarMenu: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 flex flex-col justify-center items-center h-full border-r border-white/20" style={{
      backgroundImage: `url(/src/assets/images/harness-bg.png)`, // adjust as needed
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}>
      <nav className="flex flex-col items-center justify-center gap-8 w-full">
        {tabs.map(({ path, label, icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              to={path}
              key={path}
              className={`flex flex-col items-center justify-center gap-3 w-48 h-28 rounded-xl font-semibold text-lg transition 
                ${isActive
                  ? "bg-yellow-400 text-black shadow-lg"
                  : "bg-white/20 text-white hover:bg-white/30"
                }`}
              style={{ minHeight: "110px" }}
            >
              <img src={icon} alt={label} className="w-14 h-14 object-contain mb-1" />
              <span className="text-center leading-tight">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SidebarMenu;
