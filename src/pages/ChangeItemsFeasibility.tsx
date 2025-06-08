// src/pages/ChangeItemsFeasibility.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import harnessBg from "../assets/images/harness-bg.png";

// -- Types and Interfaces --
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

const ChangeItemsFeasibility: React.FC = () => {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();
  const { instance } = useMsal();

  const [items, setItems] = useState<ChangeItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // 1) Filter states
  // Example toggles and text inputs for quick demonstration:
  //   (a) showOnlyEmptyProcInfo -> show items with EnddateProcessinfo === ""
  //   (b) DRX numeric search fields for "year", "month", "day", "id"
  //   (c) areaFilter -> item.fields.SheetName in [Cockpit, MR, Innenraum, Autarke], or "all"
  const [showOnlyEmptyProcInfo, setShowOnlyEmptyProcInfo] = useState(false);
  const [searchYear, setSearchYear] = useState("");
  const [searchMonth, setSearchMonth] = useState("");
  const [searchDay, setSearchDay] = useState("");
  const [searchId, setSearchId] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");

  // Store the found project so we can display its logo or name
  const [project, setProject] = useState<IProject | null>(null);

  // Derive filtered items based on your filter states
  const filteredItems = items.filter((item) => {
    const f = item.fields;

    // (a) If toggled, only show items with EnddateProcessinfo === ""
    if (showOnlyEmptyProcInfo && f.EnddateProcessinfo !== "") {
      return false;
    }

    // (b) DRX numeric parts
    if (searchYear && f.processyear !== searchYear) return false;
    if (searchMonth && f.processmonth !== searchMonth) return false;
    if (searchDay && f.processday !== searchDay) return false;
    if (searchId && f.processid !== searchId) return false;

    // (c) Area filter
    const sheet = f.SheetName || "";
    if (areaFilter !== "all" && sheet !== areaFilter) {
      return false;
    }

    return true;
  });

  // Paginate only the filtered items
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

      // Find the matching project
      const foundProject = config.projects.find((p) => p.id === projectKey);
      if (!foundProject) {
        setError("No such project in config");
        return;
      }
      setProject(foundProject);

      // Get the list ID for "feasibility"
      const listId = foundProject.mapping.feasibility;
      if (!listId) {
        setError("No feasibility list assigned");
        return;
      }

      // Acquire token via MSAL
      const token = await getAccessToken(instance, [
        "https://graph.microsoft.com/Sites.Read.All",
      ]);
      if (!token) {
        setError("Authentication failed");
        return;
      }

      // Load items
      try {
        const resp = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items?expand=fields&$top=5000`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
       let fetchedItems = resp.data.value.map((it: any) => ({
          id: it.id,
          fields: it.fields,
        }));
        // 2) Sort so items without digits in EnddatePAVPhase4 appear first
        fetchedItems.sort((a: any, b: any) => {
          const aHasDigit = /[0-9]/.test(a.fields.EnddatePAVPhase4);
          const bHasDigit = /[0-9]/.test(b.fields.EnddatePAVPhase4);

          if (!aHasDigit && bHasDigit) return -1; // a first, no digits
          if (aHasDigit && !bHasDigit) return 1;  // b first, no digits
          return 0; // otherwise keep the same order
        });
        setItems(fetchedItems);
      } catch (e: any) {
        setError(e.response?.data?.error?.message || e.message);
      }
    })();
  }, [instance, projectKey]);

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={() => navigate(`/changes/${projectKey}`)}
        className="absolute top-4 left-4 z-20 flex items-center space-x-2
                   px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                   rounded-2xl shadow-md text-white text-sm transition"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="relative z-20 max-w-4xl mx-auto p-8 flex items-center justify-between text-white">
        <div>
          {/* Project Logo */}
          {project?.logo && (
            <img
              src={project.logo}
              alt={`${project.displayName} logo`}
              className="h-12 w-auto mb-2"
            />
          )}
          <h1 className="text-2xl font-bold">
            Feasibility Changes for <span className="uppercase">{projectKey}</span>
          </h1>
        </div>
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

      {/* FILTER BAR */}
      <div className="relative z-20 max-w-4xl mx-auto p-4">
        <div className="bg-white/20 p-4 rounded-md mb-4 flex flex-col sm:flex-row items-center gap-4">
          {/* (b) DRX numeric fields */}
         
          <div className="flex items-end gap-2 text-white">
            <div>
           <label className="block text-sm font-semibold mb-1">DRX </label>
            </div>
            <div>
              <input
                type="text"
                value={searchYear}
                onChange={(e) => {
                  setPage(0);
                  setSearchYear(e.target.value);
                }}
                className="p-1 rounded bg-white text-gray-800 w-16"
              />
            </div>
            <div>
              <input
                type="text"
                value={searchMonth}
                onChange={(e) => {
                  setPage(0);
                  setSearchMonth(e.target.value);
                }}
                className="p-1 rounded bg-white text-gray-800 w-16"
              />
            </div>
            <div>
              <input
                type="text"
                value={searchDay}
                onChange={(e) => {
                  setPage(0);
                  setSearchDay(e.target.value);
                }}
                className="p-1 rounded bg-white text-gray-800 w-16"
              />
            </div>
            <div>
              <input
                type="text"
                value={searchId}
                onChange={(e) => {
                  setPage(0);
                  setSearchId(e.target.value);
                }}
                className="p-1 rounded bg-white text-gray-800 w-16"
              />
            </div>
          </div>

          {/* (c) Area Filter */}
          <div className="text-white">
            <div>
            <label className="block text-sm font-semibold mb-1">Area Filter</label>
            </div>
            <div>
            <select
              value={areaFilter}
              onChange={(e) => {
                setPage(0);
                setAreaFilter(e.target.value);
              }}
              className="p-1 rounded bg-white text-gray-800"
            >
              <option value="all">All Areas</option>
              <option value="Cockpit">Cockpit</option>
              <option value="MR">MR</option>
              <option value="Innenraum">Innenraum</option>
              <option value="Autarke">Autarke</option>
              <option value="Autarke">Cockpit and Innenraum</option>
            </select>
            </div>
          </div>
        </div>
      </div>

      {/* ITEMS + PAGINATION */}
      <div className="relative z-20 max-w-4xl mx-auto p-8 space-y-4 text-white">
        {/* Column headers */}
        <div
          className="grid items-center p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-md"
          style={{ gridTemplateColumns: "12rem 8rem 8rem 8rem 10rem auto" }}
        >
          <span className="font-semibold">Change No.</span>
          <span className="text-xs text-center">PAV-4 End</span>
          <span className="text-xs text-center">Phase 4 End</span>
          <span className="text-xs text-center">ProcInfo End</span>
          <span className="text-xs text-center font-semibold">OEM-Offer-Change number</span>
          <span />
        </div>

        {currentItems.map((item) => {
          const drx = item.fields.Processnumber; 
          const pav = item.fields.EnddatePAVPhase4;
          const ph4 = item.fields.EnddatePhase4;
          const pi = item.fields.EnddateProcessinfo;
          const risk = item.fields.OEMOfferChangenumber;

          return (
            <div
              key={item.id}
              onClick={() =>
                navigate(`/details/${projectKey}/feasibility/${item.id}`)
              }
              className="grid items-center p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-md
                         cursor-pointer hover:bg-white/30 transition"
              style={{ gridTemplateColumns: "12rem 8rem 8rem 8rem 10rem auto" }}
            >
              <span className="font-semibold">{drx}</span>

              {/* End-date indicators (green if truthy, red if falsey) */}
              <span
                className={`justify-self-center w-3 h-3 rounded-full relative ${
                  pav ? "bg-green-400 animate-ping-once" : "bg-red-400 animate-ping-once"
                }`}
                title="PAV-4 ended?"
              />
              <span
                className={`justify-self-center w-3 h-3 rounded-full relative ${
                  ph4 ? "bg-green-400 animate-ping-once" : "bg-red-400 animate-ping-once"
                }`}
                title="Phase 4 ended?"
              />
              <span
                className={`justify-self-center w-3 h-3 rounded-full relative ${
                  pi ? "bg-green-400 animate-ping-once" : "bg-red-400 animate-ping-once"
                }`}
                title="ProcInfo ended?"
              />

              {/* Risk pill */}
              <span
                className="justify-self-center px-2 py-1 rounded-md text-xs"
                title={`Risk: ${risk || ""}`}
              >
                {risk || ""}
              </span>

              {/* Chevron */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="justify-self-center h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          );
        })}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex justify-center items-center space-x-8 mt-4 text-white">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="text-3xl disabled:opacity-50"
            >
              ‹
            </button>
            <span className="text-lg font-medium">
              {page + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
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

export default ChangeItemsFeasibility;
