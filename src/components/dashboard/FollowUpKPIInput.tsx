// File: src/pages/FollowUpKPIInput.tsx

import React, { useState, useEffect } from "react";
import ProjectCarousel from "../ProjectCarousel";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../../auth/getToken";
import { msalInstance } from "../../auth/msalInstance";

interface FollowUpCostInputProps {
  siteId: string;
  listId: string;
}

interface FollowUpForm {
  project: string;
  area: string;
  followUpCost: number;
  initiationReason: string;
  bucketId: string;
  entryDate: string;
  bucketResponsible: string;
  postName: string;
}

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
}

const LISTS_CONFIG_KEY = "cmConfigLists";

const FollowUpCostInput: React.FC<FollowUpCostInputProps> = ({ siteId, listId }) => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<IProject[]>([]);
  const [form, setForm] = useState<FollowUpForm>({
    project: "",
    area: "Innenraum",
    followUpCost: 0,
    initiationReason: "demande suite à un changement technique (aeb)",
    bucketId: "",
    entryDate: new Date().toISOString().slice(0, 10), // "YYYY-MM-DD"
    bucketResponsible: "",
    postName: "",
  });
  const [msg, setMsg] = useState<string | null>(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config = JSON.parse(raw);
        if (config && Array.isArray(config.projects)) {
          setProjects(config.projects);
          // Optionally default to the first project's ID
          if (config.projects.length > 0) {
            setForm((prev) => ({ ...prev, project: config.projects[0].id }));
          }
        }
      } catch (err) {
        console.error("Error loading config from localStorage:", err);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    try {
      // 1) Get token
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);

      if (!token) {
        throw new Error("Could not get access token.");
      }

      // 2) POST to create a new item in the FollowCostKPI (FollowUp cost) list
      const response = await axios.post(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`,
        {
          fields: {
            Project: form.project,
            Area: form.area,
            Followupcost_x002f_BudgetPA: form.followUpCost,
            InitiationReasons: form.initiationReason,
            BucketID: form.bucketId,
            Date: form.entryDate,
            BucketResponsible: form.bucketResponsible,
            Postname_x002f_ID: form.postName,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("FollowCost item created:", response.data);
      setMsg("Enregistrement réussi !");
      // Optionally reset the form
      setForm({
        project: "",
        area: "Innenraum",
        followUpCost: 0,
        initiationReason: "demande suite à un changement technique (aeb)",
        bucketId: "",
        entryDate: new Date().toISOString().slice(0, 10),
        bucketResponsible: "",
        postName: "",
      });
    } catch (err: any) {
      console.error("Error creating follow cost item:", err);
      setMsg("Erreur: " + (err.response?.data?.error?.message || err.message));
    }
  };

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center text-white"
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-20 max-w-6xl mx-auto p-4 flex items-center space-x-4">
        <button
          onClick={() => navigate('/tool-selection')}
          className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
        >
          ← Back
        </button>

        <button
          onClick={() => navigate("/follow-cost-editor")}
          className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
        >
          Go to FollowUpCost List
        </button>
      </div>

      {/* Content container */}
      <div className="relative z-20 max-w-6xl mx-auto p-4">

        <div className="bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-xl shadow-xl">
          {/* Project Carousel or fallback message */}
          {projects.length > 0 ? (
            <ProjectCarousel
              projects={projects}
              selectedProject={form.project}
              onProjectSelect={(projectId) => {
                setForm((prev) => ({ ...prev, project: projectId }));
              }}
            />
          ) : (
            <p className="text-center text-gray-300">
              No projects found. Please add them in the Config Page first!
            </p>
          )}

          {/* Any success / error message */}
          {msg && (
            <div className="mt-4 text-sm text-green-300 font-semibold">{msg}</div>
          )}

          {/* Follow-Up Cost Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Zone</label>
                <select
                  value={form.area}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, area: e.target.value }))
                  }
                  className="w-full p-2 border rounded text-black"
                >
                  <option>Innenraum</option>
                  <option>Autarke</option>
                  <option>Cockpit</option>
                  <option>Motorblick</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Coût suivi / Budget PA (€)
              </label>
              <input
                type="number"
                value={form.followUpCost}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, followUpCost: +e.target.value }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Raison de l’initiation
              </label>
              <select
                value={form.initiationReason}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    initiationReason: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded text-black"
              >
                <option>
                  demande suite à un changement technique (aeb)
                </option>
                <option>demande suite une optimisation</option>
                <option>
                  demande suite mail/réunion d'analyse de réclamation
                </option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1">
                  Identifiant Panier
                </label>
                <input
                  type="text"
                  value={form.bucketId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bucketId: e.target.value }))
                  }
                  required
                  className="w-full p-2 border rounded text-black"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={form.entryDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, entryDate: e.target.value }))
                  }
                  required
                  className="w-full p-2 border rounded text-black"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Responsable du Panier
                </label>
                <input
                  type="text"
                  value={form.bucketResponsible}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      bucketResponsible: e.target.value,
                    }))
                  }
                  required
                  className="w-full p-2 border rounded text-black"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Poste / Identifiant
              </label>
              <input
                type="text"
                value={form.postName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, postName: e.target.value }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded mt-2"
            >
              Enregistrer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FollowUpCostInput;
