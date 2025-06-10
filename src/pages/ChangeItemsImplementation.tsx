// File: src/pages/ChangeItemsImplementation.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import harnessBg from "../assets/images/harness-bg.png";
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

const ChangeItemsImplementation: React.FC = () => {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();

  const [items, setItems] = useState<ChangeItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const pageSize = 5;
  // Helper function to decide background color for an area
const getAreaColor = (areaName: string): string => {
  switch (areaName) {
    case "Cockpit":
      return "bg-green-500 text-white";
    case "MR":
      return "bg-purple-500 text-white";
    case "Innenraum":
      return "bg-yellow-500 text-black"; // easier to see black text on yellow
    case "Autarke":
      return "bg-red-500 text-white";
    default:
      // e.g. fallback color
      return "bg-white text-gray-800";
  }
};
  // Filter states
  const [showOnlyEmptyProcInfo, setShowOnlyEmptyProcInfo] = useState(false);
  const [searchYear, setSearchYear] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [searchDay, setSearchDay] = useState("");
  const [searchId, setSearchId] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  
   // 1) Extract the "Parameters" text from the first item (change indexing if needed):
const parametersText = items[0]?.fields.Parameters || "";

// 2) Use regex to find the YYYY-MM-DD part:
//    This matches exactly 10 characters of the form "2025-03-01" and skips " 00:00:00".
const fromMatch = parametersText.match(/Start date from:\s*([\d-]{10})/);
const toMatch = parametersText.match(/Start date to:\s*([\d-]{10})/);

// 3) Pull out the actual date strings or fall back to an empty string:
const startDateFrom = fromMatch ? fromMatch[1] : "";
const startDateTo = toMatch ? toMatch[1] : "";

  // Filter logic
  const filteredItems = items.filter((item) => {
    const f = item.fields;

    // Only items where EnddateProcessinfo === "" if toggle is on
    if (showOnlyEmptyProcInfo && f.EnddateProcessinfo !== "") {
      return false;
    }

    if (searchYear && f.processyear !== searchYear) return false;
    if (searchMonth && f.processmonth !== searchMonth) return false;
    if (searchDay && f.processday !== searchDay) return false;
    if (searchId && f.processid !== searchId) return false;

    const sheet = f.SheetName || "";
    if (areaFilter !== "all" && sheet !== areaFilter) {
      return false;
    }

    return true;
  });
  
   // Handle changing area filter
  const handleAreaFilter = (newArea: string) => {
    setPage(0);
    setAreaFilter(newArea);
  };
  const pageCount = Math.ceil(filteredItems.length / pageSize);
  const currentItems = filteredItems.slice(page * pageSize, page * pageSize + pageSize);

  // Keep the found project
  const [project, setProject] = useState<IProject | null>(null);

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
        setError("No implementation list assigned");
        return;
      }
      const account = msalInstance.getActiveAccount();
      if (!account) {
        setError("No user is signed in.");
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

        // Sort so items without digits in EnddatePAVPhase4 appear first
        fetchedItems.sort((a: any, b: any) => {
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

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center text-lg"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-20 w-full flex items-center justify-between px-8 py-4 text-white">
        {/* Left side: Back Button */}
        <button
          onClick={() => navigate(`/changes/${projectKey}`)}
          className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30
                    backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
        >
          ← Back
        </button>

        {/* Right side: Additional Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate("/extraction-monitoring")}
            className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30
                      backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
          >
            Extraction Monitoring
          </button>
          <button
            onClick={() => navigate(`/changes/${projectKey}/feasibility-extra`)}
            className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-2xl text-white text-sm"
          >
            Go to Feasibility Extra
          </button>
        </div>
      </div>
      
       {/* Header + Dates Container */}
      <div className="relative z-20 max-w-5xl mx-auto p-8 flex flex-col items-center text-center text-white">
        <h1 className="text-3xl font-bold">
          Feasibility Changes for <span className="uppercase">{projectKey}</span>
        </h1>

        {(startDateFrom || startDateTo) && (
          <div className="mt-4 p-4 bg-white/30 text-white rounded-md">
            <p>Start date from: {startDateFrom}</p>
            <p>Start date to: {startDateTo}</p>
          </div>
        )}
      </div>

      {/* FILTERS + LOGO (mirroring feasibility layout) */}
      <div className="relative z-20 max-w-5xl mx-auto flex items-stretch gap-4 px-4 pb-4">
        {/* Logo (if present) on the LEFT */}
        <div className="flex-none flex items-center justify-center p-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-md">
          {project?.logo && (
            <img
              src={project.logo}
              alt={`${project.displayName} logo`}
              className="h-full max-h-52 w-auto object-contain"
            />
          )}
        </div>

        {/* Filters on the RIGHT */}
        <div className="flex-1 flex flex-col gap-4">
          {/* DRX numeric search */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md p-4 rounded-md flex flex-wrap items-center gap-2">
            <label className="text-white text-sm font-semibold">DRX:</label>
            <input
              type="text"
              value={searchYear}
              onChange={(e) => {
                setPage(0);
                setSearchYear(e.target.value);
              }}
              placeholder="YYYY"
              className="p-1 rounded bg-white text-gray-800 w-16"
            />
            <input
              type="text"
              value={searchMonth}
              onChange={(e) => {
                setPage(0);
                setSearchMonth(e.target.value);
              }}
              placeholder="MM"
              className="p-1 rounded bg-white text-gray-800 w-16"
            />
            <input
              type="text"
              value={searchDay}
              onChange={(e) => {
                setPage(0);
                setSearchDay(e.target.value);
              }}
              placeholder="DD"
              className="p-1 rounded bg-white text-gray-800 w-16"
            />
            <input
              type="text"
              value={searchId}
              onChange={(e) => {
                setPage(0);
                setSearchId(e.target.value);
              }}
              placeholder="PID"
              className="p-1 rounded bg-white text-gray-800 w-16"
            />
          </div>

          {/* Area Filter Buttons */}
          <div className="bg-white/10 border border-white/20 backdrop-blur-md p-4 rounded-md flex flex-wrap gap-3 items-center">
            <button
              onClick={() => handleAreaFilter("all")}
              className={`px-4 py-2 rounded-full font-semibold transition-colors 
                ${areaFilter === "all" ? "bg-blue-500 text-white" : "bg-white text-gray-800"}`}
            >
              All Areas
            </button>
            <button
              onClick={() => handleAreaFilter("Cockpit")}
              className={`px-4 py-2 rounded-full font-semibold transition-colors 
                ${areaFilter === "Cockpit" ? "bg-green-500 text-white" : "bg-white text-gray-800"}`}
            >
              Cockpit
            </button>
            <button
              onClick={() => handleAreaFilter("MR")}
              className={`px-4 py-2 rounded-full font-semibold transition-colors 
                ${areaFilter === "MR" ? "bg-purple-500 text-white" : "bg-white text-gray-800"}`}
            >
              MR
            </button>
            <button
              onClick={() => handleAreaFilter("Innenraum")}
              className={`px-4 py-2 rounded-full font-semibold transition-colors 
                ${areaFilter === "Innenraum" ? "bg-yellow-500 text-black" : "bg-white text-gray-800"}`}
            >
              Innenraum
            </button>
            <button
              onClick={() => handleAreaFilter("Autarke")}
              className={`px-4 py-2 rounded-full font-semibold transition-colors 
                ${areaFilter === "Autarke" ? "bg-red-500 text-white" : "bg-white text-gray-800"}`}
            >
              Autarke
            </button>
          </div>
        </div>
      </div>

      {/* List + pagination */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 pb-8 space-y-4 text-white">
        {/* COLUMN HEADERS */}
        <div
          className="grid items-center p-4 bg-white/10 border border-white/20
                     backdrop-blur-md rounded-2xl shadow-md"
          style={{ gridTemplateColumns: "12rem 8rem 8rem 8rem 10rem auto" }}
        >
          <span className="font-semibold">Change ID</span>
          <span className="font-semibold text-center">OEM Offer Change</span>
          <span className="font-semibold text-center">PAV Phase 4 End</span>
          <span className="font-semibold text-center">Phase 4 End</span>
          <span className="font-semibold text-center">Process End</span>
          <span className="font-semibold text-center">Area</span>
          <span />
        </div>

        {currentItems.map((item) => {
          const drx = item.fields.Processnumber;
          const risk1 = item.fields.OEMOfferChangenumber;
          const pav = item.fields.EnddatePAVPhase4;
          const ph4 = item.fields.EnddatePhase4;
          const pi = item.fields.EnddateProcessinfo;
          const area = item.fields.SheetName;

          // If area matches filter button color
          const areaClasses = getAreaColor(area);

          return (
            <div
              key={item.id}
              onClick={() =>
                navigate(`/details/${projectKey}/implementation/${item.id}`)
              }
              className="grid items-center p-4 bg-white/10 border border-white/20
                         backdrop-blur-md rounded-2xl shadow-md cursor-pointer
                         hover:bg-white/20 transition"
              style={{ gridTemplateColumns: "12rem 8rem 8rem 8rem 10rem auto" }}
            >
              <span className="font-semibold">{drx}</span>
              <span className="font-semibold overflow-hidden whitespace-nowrap text-ellipsis">
                {risk1 || ""}
              </span>
              <span
                className={`justify-self-center w-3 h-3 rounded-full ${
                  pav ? "bg-green-400" : "bg-red-400"
                }`}
                title="PAV-4 ended?"
              />
              <span
                className={`justify-self-center w-3 h-3 rounded-full ${
                  ph4 ? "bg-green-400" : "bg-red-400"
                }`}
                title="Phase 4 ended?"
              />
              <span
                className={`justify-self-center w-3 h-3 rounded-full ${
                  pi ? "bg-green-400" : "bg-red-400"
                }`}
                title="ProcInfo ended?"
              />
               <span
                className={`justify-self-center px-2 py-1 rounded-full text-sm font-semibold ${areaClasses}`}
                title={`Area: ${area}`}
              >
                {area || "—"}
              </span>
            </div>
          );
        })}

        {/* PAGINATION */}
        {pageCount > 1 && (
          <div className="flex justify-center items-center space-x-8 mt-4 text-white">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="text-3xl disabled:opacity-50"
            >
              ‹
            </button>
            <span className="text-lg font-medium">
              {page + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
              disabled={page === pageCount - 1}
              className="text-3xl disabled:opacity-50"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeItemsImplementation;
