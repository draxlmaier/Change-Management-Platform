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
  Project: string;
  year: string;
  Month: string;

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

const parseDecimal = (val: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace(",", "."));
};
const MonthlyKPIInput: React.FC<MonthlyKPIInputProps> = ({ siteId, listId }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [validationMsgs, setValidationMsgs] = useState<Partial<Record<keyof MonthlyForm, string>>>({});

  const now = new Date();
  const defaultYear = String(now.getFullYear());
  const defaultMonth = String(now.getMonth() + 1).padStart(2, "0");

  const [form, setForm] = useState<MonthlyForm>({
    Project: "",
    year: defaultYear,
    Month: defaultMonth,

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

  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config = JSON.parse(raw);
        if (config && Array.isArray(config.projects)) {
          setProjects(config.projects);
          if (config.projects.length > 0) {
            setForm((prev) => ({ ...prev, Project: config.projects[0].id }));
          }
        }
      } catch (err) {
        console.error("Error loading config from localStorage:", err);
      }
    }
  }, []);
  const handleTextInputChange = (key: keyof MonthlyForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const validFormat = /^[0-9]*([,][0-9]{0,3})?$/.test(value);

      if (validFormat || value === "") {
        const parsed = parseDecimal(value);
        setForm((prev) => ({ ...prev, [key]: isNaN(parsed) ? 0 : parsed }));
        setValidationMsgs((prev) => ({ ...prev, [key]: "" }));
      } else {
        setValidationMsgs((prev) => ({
          ...prev,
          [key]: "Format invalide. Ex: 0,015",
        }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    try {
      const account = msalInstance.getActiveAccount();
      if (!account) throw new Error("User not authenticated. Please sign in first.");

      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
      if (!token) throw new Error("Could not get access token.");

      const response = await axios.post(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`,
        {
          fields: {  Project: form.Project, // map correctly
  year: form.year,
  Month: new Date(0, parseInt(form.Month) - 1)
  .toLocaleString("en-US", { month: "long" }),



  // DRX
  DRXIdeasubmittedIdeaGoal: form.DRXIdeasubmittedIdeaGoal,
  DRXParticipationQuota: form.DRXParticipationQuota,
  DRXParticipationQuotaGoal: form.DRXParticipationQuotaGoal,
  DRXAcceptanceQuota: form.DRXAcceptanceQuota,
  DRXAcceptanceQuotaGoal: form.DRXAcceptanceQuotaGoal,
  DRXClosingDuration: form.DRXClosingDuration,
  DRXClosingDurationGoal: form.DRXClosingDurationGoal,

  // Downtime
  UnplanneddowntimecausedbyTechnic: form.UnplanneddowntimecausedbyTechnic,
  rateofdowntime: form.rateofdowntime,
  Targetdowntime: form.Targetdowntime,
  seuildinterventiondowntime: form.seuildinterventiondowntime,

  // Budget
  BudgetDepartment: form.BudgetDepartment },
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

      setForm({
        Project: "",
        year: defaultYear,
        Month: defaultMonth,
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
      setMsg("Failed to create item: " + (err.response?.data?.error?.message || err.message));
    }
  };
  return (
    <div className="relative w-full min-h-screen bg-cover bg-center text-white">
      <div className="absolute inset-0 z-10 pointer-events-none" />

      <div className="relative z-20 max-w-6xl mx-auto p-4 flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
        >
          ← Back
        </button>
        <button
          onClick={() => navigate(`/monthly-editor`)}
          className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
        >
          Go to Monthly KPIs List
        </button>
      </div>

      <div className="relative z-20 max-w-4xl mx-auto mt-6 p-6 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl shadow-xl">
        {projects.length > 0 ? (
          <ProjectCarousel
            projects={projects}
            selectedProject={form.Project}
            onProjectSelect={(projectId) =>
              setForm((prev) => ({ ...prev, Project: projectId }))
            }
          />
        ) : (
          <p className="text-center text-gray-300">
            No projects found. Please add them in the Config Page first!
          </p>
        )}

        {msg && <div className="text-sm text-green-300 mt-4">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Year + Month */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-white">Year</label>
              <select
                value={form.year}
                onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                className="w-full p-2 border rounded text-black"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const yearOpt = 2024 + i;
                  return (
                    <option key={yearOpt} value={String(yearOpt)}>
                      {yearOpt}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-white">Month</label>
              <select
                value={form.Month}
                onChange={(e) => setForm((prev) => ({ ...prev, Month: e.target.value }))}
                className="w-full p-2 border rounded text-black"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const val = String(i + 1).padStart(2, "0");
                  const label = new Date(0, i).toLocaleString("en-US", { month: "long" });
                  return (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          {/* DRX Section */}
          <fieldset className="border border-white/20 p-4 rounded-md">
            <legend className="text-lg font-semibold mb-2 text-white/80">📁 DRX</legend>

            {[
              "DRXIdeasubmittedIdeaGoal",
              "DRXParticipationQuota",
              "DRXParticipationQuotaGoal",
              "DRXAcceptanceQuota",
              "DRXAcceptanceQuotaGoal",
              "DRXClosingDuration",
              "DRXClosingDurationGoal",
            ].map((key) => (
              <div key={key} className="mb-4">
                <label className="block font-semibold mb-1 text-white">
                  {key} <span className="text-sm text-white/60">(ex: 0,015)</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 0,015"
                  value={form[key as keyof MonthlyForm].toString().replace(".", ",")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (/[^0-9,]/.test(raw) || raw.includes(".")) return;
                    const parsed = parseFloat(raw.replace(",", "."));
                    setForm((prev) => ({
                      ...prev,
                      [key]: isNaN(parsed) ? 0 : parsed,
                    }));
                    setValidationMsgs((msgs) => ({
                      ...msgs,
                      [key]: "",
                    }));
                  }}
                  className="w-full p-2 border rounded text-black"
                />
                {validationMsgs[key as keyof MonthlyForm] && (
                  <p className="text-red-400 text-sm mt-1">
                    {validationMsgs[key as keyof MonthlyForm]}
                  </p>
                )}
              </div>
            ))}
          </fieldset>

         {/* Downtime Section */}
          <fieldset className="border border-white/20 p-4 rounded-md">
          <legend className="text-lg font-semibold mb-2 text-white/80">🔧 Downtime</legend>

          {[
            "UnplanneddowntimecausedbyTechnic",
            "rateofdowntime",
            "Targetdowntime",
            "seuildinterventiondowntime",
          ].map((key) => (
            <div key={key} className="mb-4">
              <label className="block font-semibold mb-1 text-white">
                {key} <span className="text-sm text-white/60">(ex: 0,016)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 0,016"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (/[^0-9,]/.test(raw) || raw.includes(".")) return;

                  const parsed = parseFloat(raw.replace(",", "."));
                  setForm((prev) => ({
                    ...prev,
                    [key]: isNaN(parsed) ? 0 : parsed,
                  }));
                  setValidationMsgs((msgs) => ({
                    ...msgs,
                    [key]: "",
                  }));
                }}
                required
                className="w-full p-2 border rounded text-black"
              />
              {validationMsgs[key as keyof MonthlyForm] && (
                <p className="text-red-400 text-sm mt-1">
                  {validationMsgs[key as keyof MonthlyForm]}
                </p>
              )}
            </div>
          ))}
          </fieldset>

          {/* Budget Section */}
          <fieldset className="border border-white/20 p-4 rounded-md">
          <legend className="text-lg font-semibold mb-2 text-white/80">💰 Budget</legend>
          <div className="mb-4">
            <label className="block font-semibold mb-1 text-white">
              BudgetDepartment <span className="text-sm text-white/60">(ex: 0,02)</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 0,02"
              onChange={(e) => {
                const raw = e.target.value;
                if (/[^0-9,]/.test(raw) || raw.includes(".")) return;

                const parsed = parseFloat(raw.replace(",", "."));
                setForm((prev) => ({
                  ...prev,
                  BudgetDepartment: isNaN(parsed) ? 0 : parsed,
                }));
                setValidationMsgs((msgs) => ({
                  ...msgs,
                  BudgetDepartment: "",
                }));
              }}
              required
              className="w-full p-2 border rounded text-black"
            />
            {validationMsgs.BudgetDepartment && (
              <p className="text-red-400 text-sm mt-1">
                {validationMsgs.BudgetDepartment}
              </p>
            )}
          </div>
          </fieldset>
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded shadow"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MonthlyKPIInput;
