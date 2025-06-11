// File: src/pages/ChangeItemsImplementation.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import harnessBg from "../assets/images/harness-bg.png";
import { msalInstance } from "../auth/msalInstance";

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    feasibility: string;
    implementation: string;
    feasibilityExtra?: string;
    implementationExtra?: string;
  };
}

interface SavedConfig {
  siteId: string;
  projects: IProject[];
}

interface ChangeItem {
  id: string;
  fields: Record<string, any>;
}

const getAreaColor = (areaName: string): string => {
  switch (areaName) {
    case "Cockpit":
      return "bg-green-500 text-white";
    case "MR":
      return "bg-purple-500 text-white";
    case "Innenraum":
      return "bg-yellow-500 text-black";
    case "Autarke":
      return "bg-red-500 text-white";
    default:
      return "bg-white text-gray-800";
  }
};

const ChangeItemsFeasibility: React.FC = () => {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();

  const [items, setItems] = useState<ChangeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const [searchYear, setSearchYear] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [searchDay, setSearchDay] = useState("");
  const [searchId, setSearchId] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");

  const [project, setProject] = useState<IProject | null>(null);

  const filteredItems = items.filter((item) => {
    const f = item.fields;
    if (!f.Status || f.Status.toLowerCase() !== "open") return false;
    if (searchYear && f.processyear !== searchYear) return false;
    if (searchMonth && f.processmonth !== searchMonth) return false;
    if (searchDay && f.processday !== searchDay) return false;
    if (searchId && f.processid !== searchId) return false;
    const area = f.SheetName || "";
    if (areaFilter !== "all" && area !== areaFilter) return false;
    return true;
  });

  const pageCount = Math.ceil(filteredItems.length / pageSize);
  const currentItems = filteredItems.slice(page * pageSize, page * pageSize + pageSize);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) {
        setError("Configuration missing");
        return;
      }
      let config: SavedConfig;
      try {
        config = JSON.parse(raw);
      } catch {
        setError("Invalid configuration data");
        return;
      }

      const foundProject = config.projects.find((p) => p.id === projectKey);
      if (!foundProject) {
        setError("No such project in config");
        return;
      }
      setProject(foundProject);

      const listId = foundProject.mapping.implementation;
      if (!listId) {
        setError("No implementation list assigned");
        return;
      }

      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);

      if (!token) {
        setError("Authentication failed");
        return;
      }

      try {
        const resp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items?expand=fields&$top=5000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let fetchedItems = resp.data.value.map((it: any) => ({
          id: it.id,
          fields: it.fields,
        }));

        setItems(fetchedItems);
      } catch (e: any) {
        setError(e.response?.data?.error?.message || e.message);
      }
    })();
  }, [projectKey]);

  if (error) {
    return <div className="p-8 text-red-600 text-lg">Error: {error}</div>;
  }

  return (
    <div className="relative w-full min-h-screen bg-cover bg-center text-lg" style={{ backgroundImage: `url(${harnessBg})` }}>
      {/* Inline animations */}
      <style>{`
        @keyframes row-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.97); }
        }
        .animate-row-pulse {
          animation: row-pulse 1.5s ease-in-out infinite;
        }
        @keyframes dot-attention {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-dot-attention {
          animation: dot-attention 1s ease-in-out 1;
        }
      `}</style>

      {/* Filters */}
      <div className="relative z-20 max-w-6xl mx-auto p-4 text-white">
        <div className="bg-white/10 border border-white/20 backdrop-blur-md p-4 rounded-md flex flex-wrap gap-3 items-center">
          <label className="text-sm font-semibold">DRX:</label>

          <select value={searchYear} onChange={(e) => { setPage(0); setSearchYear(e.target.value); }} className="p-1 rounded bg-white text-gray-800">
            <option value="">Year</option>
            {["2024", "2025", "2026", "2027"].map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>

          <select value={searchMonth} onChange={(e) => { setPage(0); setSearchMonth(e.target.value); }} className="p-1 rounded bg-white text-gray-800">
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((month) => (
              <option key={month}>{month}</option>
            ))}
          </select>

          <select value={searchDay} onChange={(e) => { setPage(0); setSearchDay(e.target.value); }} className="p-1 rounded bg-white text-gray-800">
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((day) => (
              <option key={day}>{day}</option>
            ))}
          </select>

          <input value={searchId} onChange={(e) => { setPage(0); setSearchId(e.target.value); }} placeholder="ID" className="p-1 rounded bg-white text-gray-800 w-16" />
        </div>
      </div>

      {/* Table */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 pb-8 space-y-4 text-white">
        <div className="grid items-center p-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl shadow-md" style={{ gridTemplateColumns: "14rem 14rem 6rem 6rem 6rem 6rem auto" }}>
          <span className="font-semibold">Change ID</span>
          <span className="font-semibold">OEM Offer Change</span>
          <span className="font-semibold text-center">PAV</span>
          <span className="font-semibold text-center">PH4</span>
          <span className="font-semibold text-center">PH8</span>
          <span className="font-semibold text-center">PI</span>
        </div>

        {currentItems.map((item) => {
          const f = item.fields;
          const pav = f.EnddatePAVPhase4;
          const ph4 = f.EnddatePhase4;
          const ph8 = f.EnddatePhase8;
          const pi = f.EnddateProcessinfo;

          const hasPH8 = /[0-9]/.test(ph8);
          const rowClass = hasPH8 ? "" : "animate-row-pulse";

          return (
            <div key={item.id}
              className={`grid h-20 items-center p-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl shadow-md cursor-pointer hover:bg-white/20 transition ${rowClass}`}
              style={{ gridTemplateColumns: "14rem 14rem 6rem 6rem 6rem 6rem auto" }}
            >
              <span className="font-semibold">{f.Processnumber || ""}</span>
              <span className="font-semibold overflow-hidden whitespace-nowrap text-ellipsis">{f.OEMOfferChangenumber || ""}</span>

              <span className={`justify-self-center w-3 h-3 rounded-full ${pav ? "bg-green-400" : "bg-red-400 animate-dot-attention"}`} />
              <span className={`justify-self-center w-3 h-3 rounded-full ${ph4 ? "bg-green-400" : "bg-red-400 animate-dot-attention"}`} />
              <span className={`justify-self-center w-3 h-3 rounded-full ${ph8 ? "bg-green-400" : "bg-red-400 animate-dot-attention"}`} />
              <span className={`justify-self-center w-3 h-3 rounded-full ${pi ? "bg-green-400" : "bg-red-400 animate-dot-attention"}`} />
            </div>
          );
        })}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex justify-center items-center space-x-8 mt-4 text-white">
            <button onClick={() => setPage((prev) => Math.max(prev - 1, 0))} disabled={page === 0} className="text-3xl disabled:opacity-50">‹</button>
            <span className="text-lg font-medium">{page + 1} / {pageCount}</span>
            <button onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))} disabled={page === pageCount - 1} className="text-3xl disabled:opacity-50">›</button>
          </div>
        )}
      </div>
    </div>
  );
};
export default ChangeItemsFeasibility;
