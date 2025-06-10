import React, { useEffect, useState } from "react";
import axios from "axios";
import { getAccessToken } from "../../auth/getToken";
import { msalInstance } from "../../auth/msalInstance";

interface KPIItem {
  ID: string;
  Month?: string;
  Project?: string;
  DRXParticipationQuota?: number;
  DRXParticipationQuotaGoal?: number;
  UnplanneddowntimecausedbyTechnic?: number;
  BudgetDepartment?: string;
}

interface cmConfigLists {
  siteId: string;
  projects: any[];
}

const KPIDashboard: React.FC = () => {
  const [kpiItems, setKpiItems] = useState<KPIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<string>("All");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await getAccessToken(msalInstance, ["User.Read"]);
        const rawConfig = localStorage.getItem("cmConfigLists");
        if (!rawConfig) throw new Error("Missing config");

        const config: cmConfigLists = JSON.parse(rawConfig);
        const siteId = config.siteId;
        const listId = "de72f9e8-c6fa-46c3-a21b-2c760b573b1a";

        const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields&$top=2000`;
        const resp = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const items = resp.data.value.map((item: any) => ({
          ID: item.id,
          ...item.fields,
        })) as KPIItem[];

        setKpiItems(items);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch KPIs");
        setLoading(false);
      }
    })();
  }, []);

  // Filtering logic
  const filteredItems = kpiItems.filter((item) => {
    const date = item.Month ? new Date(item.Month) : null;
    const year = date ? date.getFullYear().toString() : "";
    const month = date ? (date.getMonth() + 1).toString().padStart(2, "0") : "";

    const quarter =
      date && date.getMonth() < 3
        ? "Q1"
        : date && date.getMonth() < 6
        ? "Q2"
        : date && date.getMonth() < 9
        ? "Q3"
        : date
        ? "Q4"
        : "";

    return (
      (selectedYear === "All" || year === selectedYear) &&
      (selectedMonth === "All" || month === selectedMonth) &&
      (selectedQuarter === "All" || quarter === selectedQuarter) &&
      (selectedProject === "All" || item.Project === selectedProject)
    );
  });

  // Get unique values for dropdowns
  const uniqueYears = Array.from(
    new Set(kpiItems.map((i) => i.Month && new Date(i.Month).getFullYear().toString()))
  ).filter(Boolean);

  const uniqueProjects = Array.from(new Set(kpiItems.map((i) => i.Project))).filter(Boolean);

  return (
    <div className="kpi-dashboard p-4 bg-white shadow rounded-xl">
      <h2 className="text-xl font-semibold mb-4">Monthly KPIs</h2>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          <option value="All">All Years</option>
          {uniqueYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          <option value="All">All Months</option>
          {Array.from({ length: 12 }, (_, i) => {
            const month = (i + 1).toString().padStart(2, "0");
            return (
              <option key={month} value={month}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            );
          })}
        </select>

        <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
          <option value="All">All Quarters</option>
          <option value="Q1">Q1</option>
          <option value="Q2">Q2</option>
          <option value="Q3">Q3</option>
          <option value="Q4">Q4</option>
        </select>

        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
          <option value="All">All Projects</option>
          {uniqueProjects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading KPIs...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : (
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Month</th>
              <th className="border px-2 py-1">Project</th>
              <th className="border px-2 py-1">Participation</th>
              <th className="border px-2 py-1">Downtime</th>
              <th className="border px-2 py-1">Budget Dept.</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.ID}>
                <td className="border px-2 py-1">{item.Month?.split("T")[0]}</td>
                <td className="border px-2 py-1">{item.Project}</td>
                <td className="border px-2 py-1">
                  {item.DRXParticipationQuota} / {item.DRXParticipationQuotaGoal}
                </td>
                <td className="border px-2 py-1">{item.UnplanneddowntimecausedbyTechnic}</td>
                <td className="border px-2 py-1">{item.BudgetDepartment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default KPIDashboard;
