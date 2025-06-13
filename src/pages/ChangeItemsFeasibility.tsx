// File: src/pages/ChangeItemsFeasibility.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import harnessBg from "../assets/images/harness-bg.png";
import { msalInstance } from "../auth/msalInstance";
import { PROJECT_LOGO_MAP } from "../constants/projects";

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

  const parametersText = items[0]?.fields.Parameters || "";
  const fromMatch = parametersText.match(/Start date from:\s*([\d-]{10})/);
  const toMatch = parametersText.match(/Start date to:\s*([\d-]{10})/);
  const startDateFrom = fromMatch ? fromMatch[1] : "";
  const startDateTo = toMatch ? toMatch[1] : "";

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
      const patchedProject = {
        ...foundProject,
        logo: PROJECT_LOGO_MAP[foundProject.id.toLowerCase()] || PROJECT_LOGO_MAP["other"],
      };
      setProject(patchedProject);

      const listId = foundProject.mapping.feasibility;
      if (!listId) {
        setError("No feasibility list assigned");
        return;
      }
      const account = msalInstance.getActiveAccount();
      if (!account) {
        setError("User not logged in. Please sign in first.");
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

        fetchedItems.sort((a: ChangeItem, b: ChangeItem) => {
          const aHasDigit = /[0-9]/.test(a.fields.EnddatePAVPhase4);
          const bHasDigit = /[0-9]/.test(b.fields.EnddatePAVPhase4);
          if (!aHasDigit && bHasDigit) return -1;
          if (aHasDigit && !bHasDigit) return 1;
          return 0;
        });

        setItems(fetchedItems);
      } catch (e: any) {
        setError(e.response?.data?.error?.message || e.message);
      }
    })();
  }, [projectKey]);

  if (error) {
    return <div className="p-8 text-red-600 text-lg">Error: {error}</div>;
  }

  const handleAreaFilter = (newArea: string) => {
    setPage(0);
    setAreaFilter(newArea);
  };

  return (
    <div className="relative w-full min-h-screen bg-cover bg-center text-lg" style={{ backgroundImage: `url(${harnessBg})` }}>
      
      {/* Top Back Button */}
      <div className="relative z-20 w-full flex items-center justify-between px-8 py-4 text-white">
        <button onClick={() => navigate(`/changes/${projectKey}`)}
          className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition">
          ← Back
        </button>
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate("/extraction-monitoring")} className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition">
            Extraction Monitoring
          </button>
          <button onClick={() => navigate(`/changes/${projectKey}/feasibility-extra`)} className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-2xl text-white text-sm">
            Go to Feasibility Extra
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-20 max-w-5xl mx-auto p-8 flex flex-col items-center text-center text-white">
        <h1 className="text-3xl font-bold">Feasibility Changes for <span className="uppercase">{projectKey}</span></h1>
        {(startDateFrom || startDateTo) && (
          <div className="mt-4 p-4 bg-white/30 text-white rounded-md">
            <p>Start date from: {startDateFrom}</p>
            <p>Start date to: {startDateTo}</p>
          </div>
        )}
      </div>

      {/* Filters section (logo + filters side by side like your latest version) */}
      <div className="relative z-20 max-w-5xl mx-auto flex items-stretch gap-4 px-4 pb-4">
        
        {/* Logo */}
        <div className="flex-none flex items-center justify-center p-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-md">
          {project?.logo && (
            <img src={project.logo} alt={`${project.displayName} logo`} className="h-full max-h-52 w-auto object-contain" />
          )}
        </div>

        {/* DRX filters + Area filters */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* DRX filters */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md p-4 rounded-md flex flex-wrap items-center gap-2">
            <label className="text-white text-sm font-semibold">DRX:</label>
            <select value={searchYear} onChange={(e) => { setPage(0); setSearchYear(e.target.value); }} className="p-1 rounded bg-white text-gray-800">
              <option value="">Any Year</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
            <select value={searchMonth} onChange={(e) => { setPage(0); setSearchMonth(e.target.value); }} className="p-1 rounded bg-white text-gray-800">
              <option value="">Any Month</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const val = String(m).padStart(2, "0");
                return <option key={val} value={val}>{val}</option>;
              })}
            </select>
            <select value={searchDay} onChange={(e) => { setPage(0); setSearchDay(e.target.value); }} className="p-1 rounded bg-white text-gray-800">
              <option value="">Any Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                const val = String(d).padStart(2, "0");
                return <option key={val} value={val}>{val}</option>;
              })}
            </select>
            <input type="text" placeholder="ID" value={searchId} onChange={(e) => { setPage(0); setSearchId(e.target.value); }} className="p-1 rounded bg-white text-gray-800 w-16" />
          </div>

          {/* Area filters */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md p-4 rounded-md flex flex-wrap gap-3 items-center">
            {["all", "Cockpit", "MR", "Innenraum", "Autarke"].map(area => (
              <button key={area} onClick={() => handleAreaFilter(area)}
                className={`px-4 py-2 rounded-full font-semibold transition-colors 
                ${areaFilter === area ? "bg-blue-500 text-white" : "bg-white text-gray-800"}`}>
                {area === "all" ? "All Areas" : area}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Data Table */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 pb-8 space-y-4 text-white">
        <div className="grid items-center p-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl shadow-md"
          style={{ gridTemplateColumns: "14rem 14rem 6rem 6rem 6rem 6rem 8rem auto" }}>
          <span className="font-semibold">Change ID</span>
          <span className="font-semibold">OEM Offer Change</span>
          <span className="font-semibold text-center">PAV Phase 4 End</span>
          <span className="font-semibold text-center">Phase 4 End</span>
          <span className="font-semibold text-center">Process End</span>
          <span className="font-semibold text-center">Area</span>
          <span />
        </div>

        {currentItems.map((item) => {
          const f = item.fields;
          const drx = f.Processnumber;
          const risk1 = f.OEMOfferChangenumber;
          const pav = f.EnddatePAVPhase4;
          const ph4 = f.EnddatePhase4;
          const pi = f.EnddateProcessinfo;
          const area = f.SheetName;
          const areaClasses = getAreaColor(area);

          return (
            <div key={item.id} onClick={() => navigate(`/details/${projectKey}/feasibility/${item.id}`)}
              className={`grid h-20 items-center p-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl shadow-md cursor-pointer hover:bg-white/20`}
              style={{ gridTemplateColumns: "14rem 14rem 6rem 6rem 6rem 6rem 8rem auto" }}>
              <span className="font-semibold">{drx || ""}</span>
              <span className="font-semibold overflow-hidden whitespace-nowrap text-ellipsis">{risk1 || ""}</span>
              <span className={`justify-self-center w-3 h-3 rounded-full ${pav ? "bg-green-400" : "bg-red-400"}`} />
              <span className={`justify-self-center w-3 h-3 rounded-full ${ph4 ? "bg-green-400" : "bg-red-400"}`} />
              <span className={`justify-self-center w-3 h-3 rounded-full ${pi ? "bg-green-400" : "bg-red-400"}`} />
              <span className={`justify-self-center px-2 py-1 rounded-full text-sm font-semibold ${areaClasses}`}>{area || "—"}</span>
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
