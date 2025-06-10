// src/pages/UpdateFeasibility.tsx
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
  };
}

interface ListsConfig {
  siteId: string;
  questionsListId: string;
  monthlyListId: string;
  followCostListId: string;
  projects: IProject[];
}

export default function UpdateFeasibility() {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();

  const [fields, setFields] = useState<Record<string, any>>({
    ActualDowntimecausedbythischange: "",
    Actualcost: "",
    Actualscrap: "",
  });

  const [project, setProject] = useState<IProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing values
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) {
          setError("Configuration missing.");
          return;
        }
        const config: ListsConfig = JSON.parse(raw);

        const foundProject = config.projects.find((p) => p.id === projectKey);
        if (!foundProject) {
          setError(`No project found for key "${projectKey}".`);
          return;
        }
        setProject(foundProject);

        const listId = foundProject.mapping.implementation;
        if (!listId) {
          setError("Feasibility list not assigned.");
          return;
        }
        const token = await getAccessToken(msalInstance,['https://graph.microsoft.com/Sites.Read.All']);
        if (!token) {
          throw new Error("Unable to get a valid token. User may not be signed in.");
        }

        // GET the item
        const resp = await axios.get<any>(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items/${itemId}?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const f = resp.data.fields;

        setFields({
          ActualDowntimecausedbythischange: f.ActualDowntimecausedbythischange || "",
          Actualcost: f.Actualcost || "",
          Actualscrap: f.Actualscrap || "",
        });
      } catch (e: any) {
        setError(e.response?.data?.error?.message || e.message);
      }
    })();
  }, [projectKey, itemId]);

  const handleChange = (key: string, value: any) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) throw new Error("Configuration missing.");

      const config: ListsConfig = JSON.parse(raw);
      const foundProject = config.projects.find((p) => p.id === projectKey);
      if (!foundProject) throw new Error(`No project found for key "${projectKey}".`);

      const listId = foundProject.mapping.implementation;
      const token = await getAccessToken(msalInstance,["https://graph.microsoft.com/Sites.Manage.All"]);
      if (!token) throw new Error("Auth failed / no token.");

      // PATCH update
      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items/${itemId}/fields`,
        fields,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/details/${projectKey}/feasibility/${itemId}`);
    } catch (e: any) {
      setError("Save failed: " + (e.response?.data?.error?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <button
        onClick={() => navigate(`/details/${projectKey}/feasibility/${itemId}`)}
        className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
      >
        ← Back
      </button>

      {/* content panel */}
      <div className="relative z-20 max-w-4xl mx-auto p-8 space-y-6 text-white">
        {project?.logo && (
          <img
            src={project.logo}
            alt={`${project.displayName} logo`}
            className="h-16 w-auto mb-4"
          />
        )}
        <h1 className="text-2xl font-bold">Update Implementation</h1>

        <div className="grid grid-cols-3 gap-6 bg-white/20 backdrop-blur-sm rounded-2xl p-6 shadow-md">
          <div>
            <label className="block font-semibold text-white mb-1">Downtime (h)</label>
            <input
              type="number"
              min="0"
              value={fields.ActualDowntimecausedbythischange}
              onChange={(e) =>
                handleChange("ActualDowntimecausedbythischange", e.target.value)
              }
              className="w-full bg-white bg-opacity-50 border border-transparent rounded px-2 py-1 focus:ring focus:ring-white/50"
            />
          </div>
          <div>
            <label className="block font-semibold text-white mb-1">Cost (€)</label>
            <input
              type="number"
              min="0"
              value={fields.Actualcost}
              onChange={(e) => handleChange("Actualcost", e.target.value)}
              className="w-full bg-white bg-opacity-50 border border-transparent rounded px-2 py-1 focus:ring focus:ring-white/50"
            />
          </div>
          <div>
            <label className="block font-semibold text-white mb-1">Scrap (€)</label>
            <input
              type="number"
              min="0"
              value={fields.Actualscrap}
              onChange={(e) => handleChange("Actualscrap", e.target.value)}
              className="w-full bg-white bg-opacity-50 border border-transparent rounded px-2 py-1 focus:ring focus:ring-white/50"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            onClick={() => navigate(`/details/${projectKey}/feasibility/${itemId}`)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl text-white transition"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-2xl text-white transition"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
