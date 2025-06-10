// src/components/dashboard/ChangesDashboard.tsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import StatsCards from "./StatsCards";
import { OpenClosedPieChart } from "./OpenClosedPieChart";
import { ScrapPieChart } from "./ScrapPieChart";
import { SubAreaPieChart } from "./SubAreaPieChart";
import { getAccessToken } from "../../auth/getToken";
import { msalInstance } from "../../auth/msalInstance";

interface IProject {
  id: string;
  displayName: string;
  mapping: {
    feasibility: string;
    implementation: string;
    feasibilityExtra?: string;
    implementationExtra?: string;
  };
}

interface cmConfigLists {
  siteId: string;
  projects: IProject[];
}

interface ChangeItem {
  ID: string;
  SheetName?: string;
  Constructedspace?: string;
  Status?: string;
  EnddatePhase4?: string;
  EnddatePAVPhase4?: string;
  EnddatePhase8?: string;
  processyear?: string;
  processmonth?: string;
  processday?: string;
}

type FilterMode =
  | "year"
  | "quarter"
  | "month"
  | "day"
  | "weekOfMonth"
  | "weekOfYear"
  | "customRange";

export const ChangesDashboard: React.FC = () => {
  const { project } = useParams<{ project: string }>();

  // Items & error/loading states
  const [allItems, setAllItems] = useState<ChangeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feasibility vs. implementation
  const [listType, setListType] = useState<"feasibility" | "implementation">("feasibility");

  // FilterMode + date/time states
  const [filterMode, setFilterMode] = useState<FilterMode>("month");
  const now = new Date();
  const defaultYear = String(now.getFullYear());
  const defaultMonth = String(now.getMonth() + 1).padStart(2, "0");
  const defaultDay = String(now.getDate()).padStart(2, "0");

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selectedQuarter, setSelectedQuarter] = useState("1");

  const [selectedWeekOfMonth, setSelectedWeekOfMonth] = useState<number | null>(null);
  const [selectedWeekOfYear, setSelectedWeekOfYear] = useState<number | null>(null);

  // Custom range states
  const [fromDay, setFromDay] = useState("01");
  const [fromMonth, setFromMonth] = useState("01");
  const [fromYear, setFromYear] = useState("2025");
  const [toDay, setToDay] = useState("31");
  const [toMonth, setToMonth] = useState("12");
  const [toYear, setToYear] = useState("2025");

  // Fetch data once on mount (and if project/listType changes)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAccessToken(msalInstance, ["User.Read"]);
        if (!token) throw new Error("No valid token found. Please log in again.");

        const rawConfig = localStorage.getItem("cmConfigLists");
        if (!rawConfig) throw new Error("No config in localStorage (cmConfigLists).");

        let config: cmConfigLists;
        try {
          config = JSON.parse(rawConfig);
        } catch {
          throw new Error("Failed to parse cmConfigLists from localStorage.");
        }

        if (!config.siteId) {
          throw new Error("No siteId in config.");
        }
        const siteId = config.siteId;
        const accumulated: ChangeItem[] = [];

        // Helper: fetch all pages from the given list ID
        const fetchListItems = async (listId: string) => {
          let nextLink = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields&$top=2000`;
          while (nextLink) {
            const resp = await axios.get(nextLink, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!Array.isArray(resp.data.value)) {
              throw new Error("Missing array at resp.data.value from SharePoint.");
            }
            const pageItems = resp.data.value.map((it: any) => ({
              ID: it.id,
              SheetName: it.fields.SheetName,
              Constructedspace: it.fields.Constructedspace,
              Status: it.fields.Status,
              EnddatePhase4: it.fields.EnddatePhase4,
              EnddatePAVPhase4: it.fields.EnddatePAVPhase4,
              EnddatePhase8: it.fields.EnddatePhase8,
              processyear: it.fields.processyear,
              processmonth: it.fields.processmonth,
              processday: it.fields.processday,
            })) as ChangeItem[];
            accumulated.push(...pageItems);
            nextLink = resp.data["@odata.nextLink"] || "";
          }
        };

        // If project is "draxlmaeir," gather from multiple sub-projects
        if (project?.toLowerCase() === "draxlmaeir") {
          const validProjects = config.projects.filter(
            (p) => p.mapping?.feasibility && p.mapping?.implementation
          );
          if (!validProjects.length) {
            throw new Error("No valid subprojects found for 'Draxlmaeir'.");
          }
          for (const sub of validProjects) {
            const listId = sub.mapping[listType];
            if (listId) {
              await fetchListItems(listId);
            }
          }
        } else {
          // Single project
          const found = config.projects.find(
            (p) => p.id.toLowerCase() === project?.toLowerCase()
          );
          if (!found) {
            throw new Error(`No project with id='${project}' found in config.`);
          }
          const listId = found.mapping[listType];
          if (!listId) {
            throw new Error(`Project '${found.displayName}' missing '${listType}' mapping.`);
          }
          await fetchListItems(listId);
        }

        setAllItems(accumulated);
      } catch (err: any) {
        console.error("Error:", err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [project, listType]);

  // Filter items whenever user changes filterMode / date states
  useEffect(() => {
    if (!allItems.length) {
      setFilteredItems([]);
      return;
    }
    const newFiltered = allItems.filter((item) => {
      const y = item.processyear || "";
      const m = item.processmonth || "";
      const d = item.processday || "";

      switch (filterMode) {
        case "year":
          return y === selectedYear;

        case "month":
          return y === selectedYear && m === selectedMonth;
        case "quarter": {
            if (y !== selectedYear) return false;
            const monthNum = parseInt(m, 10);
            const q = parseInt(selectedQuarter, 10);
            if (isNaN(monthNum) || isNaN(q)) return false;
            const quarterRanges: Record<number, [number, number]> = {
              1: [1, 3],
              2: [4, 6],
              3: [7, 9],
              4: [10, 12],
            };
            const [minMonth, maxMonth] = quarterRanges[q];
            return monthNum >= minMonth && monthNum <= maxMonth;
          }
        case "day":
          return y === selectedYear && m === selectedMonth && d === selectedDay;

        case "weekOfMonth": {
          if (y !== selectedYear || m !== selectedMonth) return false;
          if (!selectedWeekOfMonth) return true;
          const dayNum = parseInt(d, 10);
          if (isNaN(dayNum)) return false;
          const itemWeek = Math.ceil(dayNum / 7);
          return itemWeek === selectedWeekOfMonth;
        }

        case "weekOfYear": {
          if (!selectedWeekOfYear) return true;
          try {
            const itemDate = new Date(+y, +m - 1, +d);
            // Ensure the item year matches the user’s chosen year
            if (itemDate.getFullYear() !== Number(selectedYear)) return false;
            // Basic function to get week-of-year
            const getWeekNum = (dt: Date) => {
              const startOfYear = new Date(dt.getFullYear(), 0, 1);
              const diffDays =
                (dt.getTime() - startOfYear.getTime()) / (1000 * 3600 * 24);
              return Math.floor(diffDays / 7) + 1;
            };
            const w = getWeekNum(itemDate);
            return w === selectedWeekOfYear;
          } catch {
            return false;
          }
        }

        case "customRange": {
          try {
            const itemDate = new Date(+y, +m - 1, +d);
            const fromDate = new Date(+fromYear, +fromMonth - 1, +fromDay);
            const toDate = new Date(+toYear, +toMonth - 1, +toDay);
            return itemDate >= fromDate && itemDate <= toDate;
          } catch {
            return false;
          }
        }

        default:
          return true;
      }
    });

    setFilteredItems(newFiltered);
  }, [
    allItems,
    filterMode,
    selectedYear,
    selectedMonth,
    selectedDay,
    selectedWeekOfMonth,
    selectedWeekOfYear,
    fromDay,
    fromMonth,
    fromYear,
    toDay,
    toMonth,
    toYear,
  ]);

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>;
  if (error) return <p style={{ color: "red", padding: 20 }}>Error: {error}</p>;

  // Summaries
  const totalChanges = filteredItems.length;
  const changesByArea: Record<string, number> = {};
  filteredItems.forEach((item) => {
    const area = item.SheetName || "Unknown";
    changesByArea[area] = (changesByArea[area] || 0) + 1;
  });

  return (
  <div className="bg-gray-100 min-h-screen p-6">
    <div className="p-6 space-y-6 bg-white rounded-lg shadow-md">
      {/* Dashboard Title */}
      <h1 className="text-2xl font-bold text-gray-900">
        {project?.toLowerCase() === "draxlmaeir"
          ? "Changes Dashboard – Combined – Project: draxlmaeir"
          : `Changes Dashboard – ${
              listType === "feasibility" ? "Feasibility" : "Implementation"
            } – Project: ${project}`}
      </h1>

      {/* Dropdown: Feasibility vs. Implementation */}
      <div className="flex space-x-4 mb-4">
        <label className="text-gray-700">List Type:</label>
        <select
          value={listType}
          onChange={(e) => setListType(e.target.value as "feasibility" | "implementation")}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="feasibility">Feasibility</option>
          <option value="implementation">Implementation</option>
        </select>
      </div>

      {/* Filter Mode Selector */}
      <div className="flex space-x-4 items-center mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Filter Mode:</label>
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="year">Year Only</option>
            <option value="quarter">Quarter</option>
            <option value="month">Month</option>
            <option value="day">Day</option>
            <option value="weekOfMonth">Week of Month</option>
            <option value="weekOfYear">Week of Year</option>
            <option value="customRange">Custom Range</option>
          </select>
        </div>

        {/* Week of Year */}
        {filterMode === "weekOfYear" && (
          <div>
            <label className="text-gray-700">Week # of Year:</label>
            <select
              value={selectedWeekOfYear ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedWeekOfYear(isNaN(val) ? null : val);
              }}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Weeks</option>
              {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
                <option key={week} value={week}>
                  {week}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Week of Month */}
        {filterMode === "weekOfMonth" && (
          <div>
            <label className="text-gray-700">Week # in Month:</label>
            <select
              value={selectedWeekOfMonth ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSelectedWeekOfMonth(isNaN(val) ? null : val);
              }}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Weeks</option>
              <option value="1">1 (Days 1-7)</option>
              <option value="2">2 (Days 8-14)</option>
              <option value="3">3 (Days 15-21)</option>
              <option value="4">4 (Days 22-28)</option>
              <option value="5">5 (Days 29+)</option>
            </select>
          </div>
        )}
      </div>

      {/* Year/Month/Day Selectors */}
      {filterMode !== "customRange" && (
        <div className="flex space-x-4 mb-4">
          <div>
            <label className="text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Year --</option>
              {Array.from({ length: 6 }).map((_, i) => {
                const yearOpt = 2024 + i;
                return (
                  <option key={yearOpt} value={String(yearOpt)}>
                    {yearOpt}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-gray-700">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Month --</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = String(i + 1).padStart(2, "0");
                return (
                  <option key={month} value={month}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-gray-700">Day:</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Day --</option>
              {Array.from({ length: 31 }, (_, i) => {
                const day = String(i + 1).padStart(2, "0");
                return (
                  <option key={day} value={day}>
                    {day}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}
      {filterMode === "quarter" && (
        <div className="space-x-2">
          <label className="text-sm">Quarter:</label>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="1">Q1 (Jan–Mar)</option>
            <option value="2">Q2 (Apr–Jun)</option>
            <option value="3">Q3 (Jul–Sep)</option>
            <option value="4">Q4 (Oct–Dec)</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {/* Populate with years dynamically if you want */}
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      )}


      {/* Stats Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <StatsCards totalChanges={totalChanges} changesByArea={changesByArea} />
      </div>

      {/* Visuals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <SubAreaPieChart items={filteredItems} />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <OpenClosedPieChart items={filteredItems} type="phase4" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <OpenClosedPieChart items={filteredItems} type="pav" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <OpenClosedPieChart items={filteredItems} type="phase8" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <ScrapPieChart items={filteredItems} groupBy="year"/>
        </div>
      </div>
    </div>
  </div>
);
};
