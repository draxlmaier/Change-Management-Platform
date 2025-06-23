// File: src/pages/DRXKPIEditor.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import harnessBg from "../assets/images/harness-bg.png";
import ProjectCarousel from "../components/ProjectCarousel";
import TopMenu from "../components/TopMenu";

const LISTS_CONFIG_KEY = "cmConfigLists";

interface MonthlyKPIFields {
  Project: string;
  Month: string;
  year: string;
  DRXIdeasubmittedIdea: number;
  DRXIdeasubmittedIdeaGoal: number;
}

interface SharePointItem {
  id: string;
  fields: MonthlyKPIFields;
}

const DRXKPIEditor: React.FC = () => {
  const [siteId, setSiteId] = useState("");
  const [listId, setListId] = useState("");
  const [items, setItems] = useState<SharePointItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [years, setYears] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config = JSON.parse(raw);
        if (config?.siteId) setSiteId(config.siteId);
        if (config?.monthlyListId) setListId(config.monthlyListId);
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

        const filtered = response.data.value
          .filter((item: any) => {
            const f = item.fields;
            return (
              f.Project === selectedProject &&
              (f.DRXIdeasubmittedIdea > 0 || f.DRXIdeasubmittedIdeaGoal > 0)
            );
          });

        setItems(filtered);

        const yearSet = new Set<string>(filtered.map((item: any) => item.fields.year));
        setYears(Array.from(yearSet).sort());
      } catch (err) {
        console.error("Error loading DRX KPI items:", err);
      }
    }

    loadItems();
  }, [siteId, listId, selectedProject]);

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="relative z-20 max-w-6xl mx-auto p-6">
        <TopMenu />
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm"
        >
          ← Back
        </button>

        <h1 className="text-xl mt-4 mb-6 font-bold text-white/90">DRX KPI Editor</h1>

        <ProjectCarousel
          projects={(JSON.parse(localStorage.getItem(LISTS_CONFIG_KEY) || '{}').projects || [])}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
        />

        {years.map((year) => (
          <div key={year} className="mt-8">
            <h2 className="text-lg font-semibold text-white/80 mb-2">Year {year}</h2>
            <table className="w-full border border-white/20 text-sm text-white bg-white/10">
              <thead>
                <tr>
                  <th className="p-2 border">Month</th>
                  <th className="p-2 border">DRX Submitted</th>
                  <th className="p-2 border">DRX Goal</th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter((itm) => itm.fields.year === year)
                  .sort((a, b) => parseInt(a.fields.Month) - parseInt(b.fields.Month))
                  .map((itm) => (
                    <tr key={itm.id} className="border-t border-white/10">
                      <td className="p-2 border">{itm.fields.Month}</td>
                      <td className="p-2 border">{itm.fields.DRXIdeasubmittedIdea}</td>
                      <td className="p-2 border">{itm.fields.DRXIdeasubmittedIdeaGoal}</td>
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

export default DRXKPIEditor;
