import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import harnessBg from "../assets/images/harness-bg.png";
import ProjectCarousel from "../components/ProjectCarousel";

const LISTS_CONFIG_KEY = "cmConfigLists";

interface BudgetFields {
  Project: string;
  Month: string;
  year: string;
  Category: string;
  Budgetdepartment: number;
  Budgetdepartmentplanified: number;
}

interface SharePointItem {
  id: string;
  fields: BudgetFields;
}

const BudgetKPIEditor: React.FC = () => {
  const [siteId, setSiteId] = useState("");
  const [listId, setListId] = useState("");
  const [items, setItems] = useState<SharePointItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [years, setYears] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config = JSON.parse(raw);
        if (config?.siteId) setSiteId(config.siteId);
        if (config?.budgetsListId) setListId(config.budgetsListId);
      } catch (err) {
        console.error("Error reading config from localStorage:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!siteId || !listId || !selectedProject) return;

    async function loadItems() {
      try {
        const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
        const response = await axios.get(
          `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Filter for selected project (and category, if set)
        let filtered = response.data.value
          .filter((item: any) =>
            item.fields.Project === selectedProject &&
            (item.fields.Budgetdepartment > 0 || item.fields.Budgetdepartmentplanified > 0)
          );

        // Apply category filter if selected
        if (selectedCategory) {
          filtered = filtered.filter((item: any) => item.fields.Category === selectedCategory);
        }

        setItems(filtered);

        // Gather years and categories for selectors
        const yearSet = new Set<string>(filtered.map((item: any) => item.fields.year));
        setYears(Array.from(yearSet).sort());

        const categorySet = new Set<string>(filtered.map((item: any) => item.fields.Category));
        setCategories(Array.from(categorySet).sort());
      } catch (err) {
        console.error("Error loading budget KPI items:", err);
      }
    }

    loadItems();
  }, [siteId, listId, selectedProject, selectedCategory]);

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="relative z-20 max-w-6xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm"
        >
          ← Back
        </button>

        <h1 className="text-xl mt-4 mb-6 font-bold text-white/90">Budget KPI Editor</h1>

        <ProjectCarousel
          projects={(JSON.parse(localStorage.getItem(LISTS_CONFIG_KEY) || '{}').projects || [])}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
        />

        {/* Category Filter Dropdown */}
        <div className="mt-4">
          <label className="block text-white/80 mb-2">Filter by Category:</label>
          <select
            className="p-2 border rounded text-black"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {years.map((year) => (
          <div key={year} className="mt-8">
            <h2 className="text-lg font-semibold text-white/80 mb-2">Year {year}</h2>
            <table className="w-full border border-white/20 text-sm text-white bg-white/10">
              <thead>
                <tr>
                  <th className="p-2 border">Month</th>
                  <th className="p-2 border">Category</th>
                  <th className="p-2 border">Budget</th>
                  <th className="p-2 border">Planned Budget</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter((itm) => itm.fields.year === year)
                  .sort((a, b) => parseInt(a.fields.Month) - parseInt(b.fields.Month))
                  .map((itm) => (
                    <tr key={itm.id} className="border-t border-white/10">
                      <td className="p-2 border">{itm.fields.Month}</td>
                      <td className="p-2 border">{itm.fields.Category}</td>
                      <td className="p-2 border">{itm.fields.Budgetdepartment}</td>
                      <td className="p-2 border">{itm.fields.Budgetdepartmentplanified}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetKPIEditor;
