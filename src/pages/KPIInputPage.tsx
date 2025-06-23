// File: src/pages/KPIInputPage.tsx

import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import harnessBg from "../assets/images/harness-bg.png";
import TopMenu from "../components/TopMenu";

const tabs = [
  { path: "#/kpis/drx", label: "DRX KPIs" },
  { path: "#/kpis/downtime", label: "Downtime KPIs" },
  { path: "#/kpis/budget", label: "Budget KPIs" },
  { path: "#/kpis/followup", label: "Follow-up Cost & Budget PA" },
  { path: "#/kpis/scrap", label: "Scrap Following" },
];

const KPIInputPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-cover bg-center" style={{ backgroundImage: `url(${harnessBg})` }}>
      <TopMenu />
      {/* Sidebar */}
      <aside className="w-64 p-6 space-y-4 text-white border-r border-white/20">
        <h2 className="text-xl font-semibold mb-6">KPI Sections</h2>
        {tabs.map((tab) => (
          <a href={tab.path}    key={tab.path}
            className="block w-full text-left px-4 py-2 rounded hover:bg-white/10 transition"
             >{tab.label}</a>

        ))}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 text-white">
        <div className="bg-white/10 border border-white/20 rounded-xl p-8 shadow-xl min-h-[80vh]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default KPIInputPage;
