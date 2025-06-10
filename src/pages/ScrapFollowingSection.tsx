import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../auth/getToken";
import ProjectCarousel from "../components/ProjectCarousel";
import { msalInstance } from "../auth/msalInstance";

// 1) Project interface from your cmConfigLists
interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    feasibility: string;
    implementation: string; // The list ID for implementation
    feasibilityExtra?: string;
    implementationExtra?: string;
  };
}

// 2) The shape of your config stored in localStorage
interface cmConfigLists {
  siteId: string;
  questionsListId: string;
  monthlyListId: string;
  followCostListId: string;
  projects: IProject[];
  assignedRoles?: { email: string; role: string }[];
  frequentSites?: string[];
}

// 3) Fields in your implementation list
interface IScrapItemFields {
  Processnumber: string;
  processmonth: string;
  processyear: string; // e.g., "2025-06" or "2025-06-15"
  SheetName: string;
  Scrap: string;        // "Scrap" or "No Scrap"
}

interface IScrapItem {
  id: string;
  fields: IScrapItemFields;
}

const LISTS_CONFIG_KEY = "cmConfigLists";

const ScrapFollowingSection: React.FC = () => {
  const navigate = useNavigate();

  // State variables
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [siteId, setSiteId] = useState("");
  const [items, setItems] = useState<IScrapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load configuration from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config: cmConfigLists = JSON.parse(raw);
        setSiteId(config.siteId);
        setProjects(config.projects || []);
      } catch (err) {
        console.error("Error parsing config from localStorage:", err);
      }
    }
  }, []);

  // Fetch implementation items when a project is selected
  useEffect(() => {
    const projectObj = projects.find((p) => p.id === selectedProject);
    if (!siteId || !projectObj) return;

    const implementationListId = projectObj.mapping.implementation;

    async function loadImplementationItems() {
      try {
        setLoading(true);
        setError(null);
        const token = await getAccessToken(msalInstance,["https://graph.microsoft.com/Sites.Manage.All"]);
        if (!token) throw new Error("Could not get access token.");

        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${implementationListId}/items?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const loaded = response.data.value as IScrapItem[];
        setItems(loaded);
      } catch (err: any) {
        setError(err.message || "Error loading implementation items.");
      } finally {
        setLoading(false);
      }
    }

    loadImplementationItems();
  }, [siteId, selectedProject, projects]);

  // Group items by month and year
  const groupedByMonthYear = items.reduce((acc: Record<string, IScrapItem[]>, item) => {
  const { processmonth, processyear } = item.fields;

  // Use "Unknown" if either value is missing
  const monthKey = processmonth ? processmonth.substring(0, 7) : "UnknownMonth";
  const yearKey = processyear ? processyear.substring(0, 4) : "UnknownYear";

  // Combine keys for grouping, e.g. "2025-06 | 2025"
  const groupKey = `${monthKey} | ${yearKey}`;

  if (!acc[groupKey]) acc[groupKey] = [];
  acc[groupKey].push(item);
  return acc;
  }, {});

  // Render grouped data
  return (
    <div className="p-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
      >
        Back
      </button>

      {projects.length > 0 ? (
        <ProjectCarousel
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
        />
      ) : (
        <p className="text-gray-600">No projects found in config.</p>
      )}

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p>Loading items...</p>}

      {!selectedProject && (
        <p className="mt-4 text-gray-600">Please select a project to see scrap items.</p>
      )}

      {Object.keys(groupedByMonthYear).length === 0 && !loading && selectedProject && (
        <p className="mt-4 text-gray-600">No items found for this project’s implementation list.</p>
      )}

      {Object.keys(groupedByMonthYear)
      .sort()
      .map((monthYearKey) => {
        const itemsInGroup = groupedByMonthYear[monthYearKey];
        // Split back the combined key for display
        const [month, year] = monthYearKey.split(" | ");

        return (
          <div className="border border-gray-300 p-4 mt-4" key={monthYearKey}>
            <h3 className="font-semibold">
              Month: {month} | Year: {year}
            </h3>
            <table className="min-w-full border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className="p-2 border">Processnumber</th>
                  <th className="p-2 border">SheetName</th>
                  <th className="p-2 border">Scrap</th>
                </tr>
              </thead>
              <tbody>
                {itemsInGroup.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2 border">{item.fields.Processnumber}</td>
                    <td className="p-2 border">{item.fields.SheetName}</td>
                    <td className="p-2 border">{item.fields.Scrap || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

    </div>
  );
};

export default ScrapFollowingSection;
