// File: src/pages/MonthlyKPIInput.tsx

import React, { useState, useEffect } from "react";
import ProjectCarousel from "../ProjectCarousel";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../auth/getToken";
import { msalInstance } from "../../auth/msalInstance";
import InputFormatted from "../InputFormatted";

const LISTS_CONFIG_KEY = "cmConfigLists";

interface MonthlyForm {
  Project: string;
  year: string;
  Month: string;
  DRXIdeasubmittedIdea: number;
  DRXIdeasubmittedIdeaGoal: number;
  productionminutes: number;
  UnplanneddowntimecausedbyTechnic: number;
  rateofdowntime: number;
  Targetdowntime: number;
  seuildinterventiondowntime: number;
}

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
}

const parseDecimal = (val: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace(",", "."));
};

const MonthlyKPIInput: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [monthlyListId, setMonthlyListId] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [validationMsgs, setValidationMsgs] = useState<Partial<Record<keyof MonthlyForm, string>>>({});

  const now = new Date();
  const defaultYear = String(now.getFullYear());
  const defaultMonth = String(now.getMonth() + 1).padStart(2, "0");

  const [form, setForm] = useState<MonthlyForm>({
    Project: "",
    year: defaultYear,
    Month: defaultMonth,
    DRXIdeasubmittedIdea: 0,
    DRXIdeasubmittedIdeaGoal: 0,
    productionminutes: 0,
    UnplanneddowntimecausedbyTechnic: 0,
    rateofdowntime: 0,
    Targetdowntime: 0,
    seuildinterventiondowntime: 0,
  });
  const formatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
  useGrouping: false,
});

  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config = JSON.parse(raw);
        setMonthlyListId(config.monthlyListId || null);
        setSiteId(config.siteId || null);
        if (config.projects && Array.isArray(config.projects)) {
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

  const handleNumberInput = (key: keyof MonthlyForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    const cleaned = raw.replace(",", "."); // Normalize comma to dot
  const parsed = parseFloat(cleaned);
    setForm((prev) => ({
      ...prev,
      [key]: isNaN(parsed) ? 0 : parsed,
    }));
    
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    try {
      if (!siteId || !monthlyListId) throw new Error("Missing SharePoint site or list ID.");

      const account = msalInstance.getActiveAccount();
      if (!account) throw new Error("User not authenticated.");

      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
      if (!token) throw new Error("Could not get access token.");

      const normalizedMonth = new Date(0, parseInt(form.Month) - 1).toLocaleString("en-US", { month: "long" });

      await axios.post(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${monthlyListId}/items`,
        {
          fields: {
            Project: form.Project,
            year: form.year,
            Month: normalizedMonth,
            DRXIdeasubmittedIdea: form.DRXIdeasubmittedIdea,
            DRXIdeasubmittedIdeaGoal: form.DRXIdeasubmittedIdeaGoal,
            productionminutes: form.productionminutes,
            UnplanneddowntimecausedbyTechnic: form.UnplanneddowntimecausedbyTechnic,
            rateofdowntime: form.rateofdowntime,
            Targetdowntime: form.Targetdowntime,
            seuildinterventiondowntime: form.seuildinterventiondowntime,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMsg("✅ KPI entry submitted successfully.");
    } catch (err: any) {
      console.error("Error submitting KPI:", err);
      setMsg("❌ Failed to submit: " + (err.response?.data?.error?.message || err.message));
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-cover bg-center text-white">
      <div className="absolute inset-0 z-10 pointer-events-none" />

      <div className="relative z-20 max-w-6xl mx-auto p-4 flex items-center space-x-4">
        <button
          onClick={() => navigate('/tool-selection')}
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
            onProjectSelect={(projectId) => setForm((prev) => ({ ...prev, Project: projectId }))}
          />
        ) : (
          <p className="text-center text-gray-300">
            No projects found. Please add them in the Config Page first!
          </p>
        )}

        {msg && <div className="text-sm text-yellow-200 mt-4">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
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

          {/* Section 1: Engineering DRX Ideas Tracking */}
<fieldset className="border border-white/20 p-4 rounded-md space-y-4 mt-6">
  <legend className="text-lg font-semibold mb-4 text-white/80"> Engineering DRX Ideas Tracking</legend>

  {[
    { label: "DRX Idea submitted Idea", key: "DRXIdeasubmittedIdea" },
    { label: "DRX Idea submitted Idea Goal", key: "DRXIdeasubmittedIdeaGoal" },
    
  ].map(({ label, key }) => (
    <div key={key}>
      <label className="block font-semibold mb-1 text-white">{label}</label>
      <InputFormatted
        className="w-full p-2 border rounded text-black"
        value={form[key as keyof MonthlyForm]}
        onChange={(e) => {
          const val = e.target.valueAsNumber;
          const field = key as keyof MonthlyForm;
          setForm((prev) => ({
            ...prev,
            [field]: isNaN(val) ? 0 : val,
          }));
        }}
        format={formatter.format}
      />
    </div>
  ))}
</fieldset>

{/* Section 2: Downtime */}
<fieldset className="border border-white/20 p-4 rounded-md space-y-4 mt-6">
  <legend className="text-lg font-semibold mb-4 text-white/80"> Downtime</legend>

  {[
    { label: "Unplanned downtime caused by Technical Change", key: "UnplanneddowntimecausedbyTechnic" },
    { label: "Production Minutes", key: "productionminutes" },
    { label: "Rate of Downtime", key: "rateofdowntime" },
    { label: "Target Downtime", key: "Targetdowntime" },
    { label: "Seuil d'intervention Downtime", key: "seuildinterventiondowntime" },
  ].map(({ label, key }) => (
    <div key={key}>
      <label className="block font-semibold mb-1 text-white">{label}</label>
      <InputFormatted
        className="w-full p-2 border rounded text-black"
        value={form[key as keyof MonthlyForm]}
        onChange={(e) => {
          const val = e.target.valueAsNumber;
          const field = key as keyof MonthlyForm;
          setForm((prev) => ({
            ...prev,
            [field]: isNaN(val) ? 0 : val,
          }));
        }}
        format={formatter.format}
      />
    </div>
  ))}
</fieldset>


          <div className="flex justify-end mt-6">
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
