// File: src/pages/KPIInputPage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MonthlyKPIInput from "../components/dashboard/MonthlyKPIInput";
import FollowUpKPIInput from "../components/dashboard/FollowUpKPIInput";
import harnessBg from "../assets/images/harness-bg.png";
import ScrapFollowingSection from "./ScrapFollowingSection";

// 1) Use a consistent localStorage key for config
const LISTS_CONFIG_KEY = "cmConfigLists";

/** 
 * Custom hook that retrieves your config from localStorage instead of electron-store.
 */
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
        setConfig(null);
      }
    }
  }, []);

  return config;
}

// Basic tab definitions
const tabs = [
  { id: "monthly", label: "Monthly KPI Entry" },
  { id: "followup", label: "Follow-up Cost & Budget PA" },
  { id: "scrap", label: "Scrap Following" },
];

const KPIInputPage: React.FC = () => {
  const navigate = useNavigate();
  const config = useLocalConfig();  // now using localStorage
  const [activeTab, setActiveTab] = useState("monthly");

  // If config is null, that means there's no saved data yet.
  // Prompt the user to configure lists first
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

  // Extract your needed list IDs from localStorage-based config
  const { siteId, monthlyListId, followCostListId } = config;

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none" />

      {/* Top bar (buttons) */}
      <div className="relative z-20 max-w-6xl mx-auto p-4 flex items-center justify-start space-x-4">
        
      </div>

      {/* Page Title & Tabs */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 pb-4">

        {/* Tab Menu */}
        <div className="flex justify-start space-x-6 mb-6 text-base font-semibold border-b border-white/20 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-500 text-blue-300"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-xl shadow-xl">
          {activeTab === "monthly" && (
            <MonthlyKPIInput />
          )}
          {activeTab === "followup" && (
            <FollowUpKPIInput siteId={siteId} listId={followCostListId} />
          )}
          {activeTab === "scrap" && <ScrapFollowingSection />}
        </div>
      </div>
    </div>
  );
};

export default KPIInputPage;
