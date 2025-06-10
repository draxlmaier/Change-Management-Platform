// File: src/pages/MonthlyKPIInput.tsx

import React, { useState, useEffect } from "react";
import ProjectCarousel from "../ProjectCarousel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../auth/getToken";
import { msalInstance } from "../../auth/msalInstance";

interface MonthlyKPIInputProps {
  siteId: string;
  listId: string;
}

interface MonthlyForm {
  project: string;
  month: string;

  // DRX
  DRXIdeasubmittedIdeaGoal: number;
  DRXParticipationQuota: number;
  DRXParticipationQuotaGoal: number;
  DRXAcceptanceQuota: number;
  DRXAcceptanceQuotaGoal: number;
  DRXClosingDuration: number;
  DRXClosingDurationGoal: number;

  // Downtime
  UnplanneddowntimecausedbyTechnic: number;
  rateofdowntime: number;
  Targetdowntime: number;
  seuildinterventiondowntime: number;

  // Budget
  BudgetDepartment: number;
}

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
}

const LISTS_CONFIG_KEY = "cmConfigLists";

const MonthlyKPIInput: React.FC<MonthlyKPIInputProps> = ({ siteId, listId }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<MonthlyForm>({
    project: "",
    month: new Date().toISOString().slice(0, 7), // e.g., "2025-09"

    // DRX
    DRXIdeasubmittedIdeaGoal: 0,
    DRXParticipationQuota: 0,
    DRXParticipationQuotaGoal: 0,
    DRXAcceptanceQuota: 0,
    DRXAcceptanceQuotaGoal: 0,
    DRXClosingDuration: 0,
    DRXClosingDurationGoal: 0,

    // Downtime
    UnplanneddowntimecausedbyTechnic: 0,
    rateofdowntime: 0,
    Targetdowntime: 0,
    seuildinterventiondowntime: 0,

    // Budget
    BudgetDepartment: 0,
  });

  // Load projects from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config = JSON.parse(raw);
        if (config && Array.isArray(config.projects)) {
          setProjects(config.projects);
          if (config.projects.length > 0) {
            setForm((prev) => ({ ...prev, project: config.projects[0].id }));
          }
        }
      } catch (err) {
        console.error("Error loading config from localStorage:", err);
      }
    }
  }, []);

  // Handle form submission: POST to SharePoint list via Microsoft Graph
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); // Clear previous messages

    try {
      const account = msalInstance.getActiveAccount();
if (!account) {
  throw new Error("User not authenticated. Please sign in first.");
}

      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);

      if (!token) {
        throw new Error("Could not get access token.");
      }

      const response = await axios.post(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`,
        {
          fields: {
            Month: form.month,
            Project: form.project,
            DRXIdeasubmittedIdeaGoal: form.DRXIdeasubmittedIdeaGoal,
            DRXParticipationQuota: form.DRXParticipationQuota,
            DRXParticipationQuotaGoal: form.DRXParticipationQuotaGoal,
            DRXAcceptanceQuota: form.DRXAcceptanceQuota,
            DRXAcceptanceQuotaGoal: form.DRXAcceptanceQuotaGoal,
            DRXClosingDuration: form.DRXClosingDuration,
            DRXClosingDurationGoal: form.DRXClosingDurationGoal,
            UnplanneddowntimecausedbyTechnic:
              form.UnplanneddowntimecausedbyTechnic,
            rateofdowntime: form.rateofdowntime,
            Targetdowntime: form.Targetdowntime,
            seuildinterventiondowntime: form.seuildinterventiondowntime,
            BudgetDepartment: form.BudgetDepartment,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMsg("Enregistrement réussi !");
      console.log("Item created successfully:", response.data);

      // Reset the form
      setForm({
        project: "",
        month: new Date().toISOString().slice(0, 7),
        DRXIdeasubmittedIdeaGoal: 0,
        DRXParticipationQuota: 0,
        DRXParticipationQuotaGoal: 0,
        DRXAcceptanceQuota: 0,
        DRXAcceptanceQuotaGoal: 0,
        DRXClosingDuration: 0,
        DRXClosingDurationGoal: 0,
        UnplanneddowntimecausedbyTechnic: 0,
        rateofdowntime: 0,
        Targetdowntime: 0,
        seuildinterventiondowntime: 0,
        BudgetDepartment: 0,
      });
    } catch (err: any) {
      console.error("Error creating item:", err);
      setMsg(
        "Failed to create item: " +
          (err.response?.data?.error?.message || err.message)
      );
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
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
        >
          ← Back
        </button>

        <button
          onClick={() => navigate(`/monthly-editor`)}
          className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
        >
          Go to Monthly Kpis List
        </button>
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 max-w-6xl mx-auto p-4">

        <div className="bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-xl shadow-xl">
          {/* Project selection or fallback */}
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

          {/* Success/Error feedback */}
          {msg && <div className="text-sm text-green-300 mt-4">{msg}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {/* Month */}
            <div>
              <label className="block mb-2 font-semibold">Mois</label>
              <input
                type="month"
                value={form.month}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, month: e.target.value }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            {/* DRX Fields */}
            <div>
              <label className="block font-semibold">
                DRX Idea submitted Goal
              </label>
              <input
                type="number"
                value={form.DRXIdeasubmittedIdeaGoal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    DRXIdeasubmittedIdeaGoal: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold">DRX Participation Quota</label>
              <input
                type="number"
                value={form.DRXParticipationQuota}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    DRXParticipationQuota: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold">
                DRX Participation Quota Goal
              </label>
              <input
                type="number"
                value={form.DRXParticipationQuotaGoal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    DRXParticipationQuotaGoal: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold">DRX Acceptance Quota</label>
              <input
                type="number"
                value={form.DRXAcceptanceQuota}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    DRXAcceptanceQuota: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold">
                DRX Acceptance Quota Goal
              </label>
              <input
                type="number"
                value={form.DRXAcceptanceQuotaGoal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    DRXAcceptanceQuotaGoal: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold">DRX Closing Duration</label>
              <input
                type="number"
                value={form.DRXClosingDuration}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    DRXClosingDuration: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold">
                DRX Closing Duration Goal
              </label>
              <input
                type="number"
                value={form.DRXClosingDurationGoal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    DRXClosingDurationGoal: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            {/* Downtime Fields */}
            <div>
              <label className="block font-semibold">
                Unplanned downtime caused by Technical Change
              </label>
              <input
                type="number"
                value={form.UnplanneddowntimecausedbyTechnic}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    UnplanneddowntimecausedbyTechnic: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold">Rate of downtime</label>
              <input
                type="number"
                value={form.rateofdowntime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    rateofdowntime: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold">Target downtime</label>
              <input
                type="number"
                value={form.Targetdowntime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    Targetdowntime: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block font-semibold">
                Seuil d'intervention downtime
              </label>
              <input
                type="number"
                value={form.seuildinterventiondowntime}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    seuildinterventiondowntime: +e.target.value,
                  }))
                }
                required
                className="w-full p-2 border rounded text-black"
              />
            </div>

            {/* Budget Field */}
            <div>
              <label className="block font-semibold">Budget Department</label>
              <input
                type="number"
                value={form.BudgetDepartment}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    BudgetDepartment: +e.target.value,
                  }))
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

export default MonthlyKPIInput;
