import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MonthlyKPIInput from "../components/dashboard/MonthlyKPIInput";
import FollowUpKPIInput from "../components/dashboard/FollowUpKPIInput";
import ScrapFollowingSection from "./ScrapFollowingSection";
import harnessBg from "../assets/images/harness-bg.png";

const LISTS_CONFIG_KEY = "cmConfigLists";

function useLocalConfig() {
  const [config, setConfig] = useState<any>(null);
  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setConfig(parsed);
      } catch (err) {
        console.error("Failed to parse config from localStorage:", err);
      }
    }
  }, []);
  return config;
}

const tabs = [
  { id: "monthly", label: "Monthly KPI Entry" },
  { id: "followup", label: "Follow-up Cost & Budget PA" },
  { id: "scrap", label: "Scrap Following" },
];

const KPIInputPage: React.FC = () => {
  const navigate = useNavigate();
  const config = useLocalConfig();
  const [activeTab, setActiveTab] = useState("monthly");

  if (!config) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center justify-center">
        <p className="mb-4 text-lg">Configuration missing. Please configure lists first.</p>
        <button
          onClick={() => navigate("/config")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Go to Config
        </button>
      </div>
    );
  }

  const { siteId, monthlyListId, followCostListId } = config;

  return (
    <div className="flex h-screen bg-cover bg-center" style={{ backgroundImage: `url(${harnessBg})` }}>
      {/* Sidebar */}
      <aside className="w-64 p-6 space-y-4 text-white border-r border-white/20">
  <h2 className="text-xl font-semibold mb-6">KPI Sections</h2>
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`w-full text-left px-4 py-2 rounded transition ${
        activeTab === tab.id ? "bg-white text-[#0095B6]" : "hover:bg-white/10"
      }`}
    >
      {tab.label}
    </button>
  ))}
</aside>


      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 text-white">
        <div className="bg-white/10 border border-white/20 rounded-xl p-8 shadow-xl min-h-[80vh]">
          {activeTab === "monthly" && <MonthlyKPIInput />}
          {activeTab === "followup" && (
            <FollowUpKPIInput siteId={siteId} listId={followCostListId} />
          )}
          {activeTab === "scrap" && <ScrapFollowingSection />}
        </div>
      </main>
    </div>
  );
};

export default KPIInputPage;
