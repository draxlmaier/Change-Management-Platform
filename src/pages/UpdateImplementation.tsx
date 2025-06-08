// src/pages/UpdateImplementation.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";

import harnessBg from "../assets/images/harness-bg.png";

// Helper to calc business days between two YYYY‑MM‑DD dates
const calculateWorkingDays = (start: string, end: string) => {
  const a = new Date(start);
  const b = new Date(end);
  let count = 0;
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
};

const TABS = ["General", "Timeline", "Estimations"] as const;
type Tab = typeof TABS[number];

// --------------------------------------------------
// Added interfaces for your config
// --------------------------------------------------
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

export default function UpdateImplementation() {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();
  const { instance } = useMsal();

  const [fields, setFields] = useState<Record<string, any>>({});
  const [readOnlyCols, setReadOnlyCols] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // NEW: store the found project so we can display its logo
  const [project, setProject] = useState<IProject | null>(null);

  // Load item + metadata
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) {
          setLoadError("Configuration missing");
          return;
        }
        const config: ListsConfig = JSON.parse(raw);

        const foundProject = config.projects.find((p) => p.id === projectKey);
        if (!foundProject) {
          setLoadError(`No project found for key "${projectKey}"`);
          return;
        }
        setProject(foundProject);

        const listId = foundProject.mapping.implementation;
        if (!listId) {
          setLoadError("No implementation list assigned");
          return;
        }

        const token = await getAccessToken(instance, [
          "https://graph.microsoft.com/Sites.Read.All",
        ]);
        if (!token) throw new Error("No token");

        const { data: item } = await axios.get<{ fields: any }>(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items/${itemId}?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Object.keys(item.fields).forEach((k) => {
          if (typeof item.fields[k] === "string" && item.fields[k].includes("T")) {
            item.fields[k] = item.fields[k].split("T")[0];
          }
        });
        setFields(item.fields);

        const { data: cols } = await axios.get<{ value: any[] }>(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/columns`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReadOnlyCols(cols.value.filter((c) => c.readOnlyField).map((c) => c.name));
      } catch (e: any) {
        console.error(e);
        setLoadError(e.response?.data?.error?.message || e.message || "Save failed");
      }
    })();
  }, [instance, projectKey, itemId]);

  if (loadError) return <div className="p-8 text-red-600">{loadError}</div>;

  // Handle input change
  const handleChange = (key: string, raw: any) => {
    setFields((prev) => {
      const updated = { ...prev, [key]: raw };
      // Recalc working days
      if (
        updated.Start_x0020_date_x0020__x002d__x &&
        updated.End_x0020_date_x0020__x002d__x00
      ) {
        updated.WorkingDays_Process = calculateWorkingDays(
          updated.Start_x0020_date_x0020__x002d__x,
          updated.End_x0020_date_x0020__x002d__x00
        );
      }
      return updated;
    });
  };

  // Save handler
  const handleSave = async () => {
  setSaving(true);
  try {
    const raw = localStorage.getItem("cmConfigLists");
    if (!raw) throw new Error("Config missing");
    const config: ListsConfig = JSON.parse(raw);

    const foundProject = config.projects.find((p) => p.id === projectKey);
    if (!foundProject) throw new Error(`No project found for key "${projectKey}"`);

    const listId = foundProject.mapping.implementation;
    const token = await getAccessToken(instance, ["https://graph.microsoft.com/Sites.Manage.All"]);
    if (!token) throw new Error("No token");

    // Filter out invalid fields
    const payload: Record<string, any> = {};
    Object.entries(fields).forEach(([key, value]) => {
      if (key !== "id" &&
        key !== "Created" &&
        key !== "Author" &&
        key !== "AuthorLookupId" &&
        key !== "EditorLookupId" &&
        key !== "_UIVersionString" &&
        key !== "Edit" &&
        key !== "_ComplianceFlags" &&
        key !== "_ComplianceTag" &&
        key !== "_ComplianceTagWrittenTime" &&
        key !== "_ComplianceTagUserId" &&
        key !== "AppAuthorLookupId" &&
        key !== "AppEditorLookupId" &&
        key !== "Modified" &&
        key !== "Editor" &&
        key !== "ContentType" &&
        key !== "Attachments" &&
        key !== "FileRef" &&
        key !== "FileLeafRef" &&
        key !== "File_x0020_Type" &&
        key !== "OData__UIVersionString" &&
        key !== "File_x0020_Size" &&
        key !== "LinkTitle" &&
        key !== "LinkTitleNoMenu" &&
        key !== "ItemChildCount" &&
        key !== "FolderChildCount" &&
        key !== "ComplianceFlags" &&
        key !== "ComplianceTag" &&
        key !== "ComplianceTagWrittenTime" &&
        key !== "ComplianceTagUserId" && !(readOnlyCols || []).includes(key)) {
        payload[key] = value;
      }
    });

    console.log("Payload being sent:", payload);

    await axios.patch(
      `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items/${itemId}/fields`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    navigate(`/details/${projectKey}/implementation/${itemId}`);
  } catch (e: any) {
    console.error("Error:", e);
  } finally {
    setSaving(false);
  }
};

  const renderFields = (cfg: any[], cols: number = 2) => (
    <div className={`${cols === 2 ? "grid-cols-2" : "grid-cols-3"} grid gap-x-8 gap-y-6`}>
      {cfg.map(({ label, key, type, options }: any) => (
        <div key={key}>
          <label className="block font-semibold mb-1 text-white">{label}</label>
          {type === "select" ? (
            <select
              value={fields[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="
                block w-full 
                bg-white/20 
                text-gray-900
                border border-gray-300 
                rounded-xl 
                px-3 py-2 
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            >
              <option className="text-gray-900" value="">
                — select —
              </option>
              {options.map((opt: string) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={fields[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full bg-white bg-opacity-50 border border-transparent rounded px-2 py-1 focus:ring focus:ring-white/50"
            />
          )}
        </div>
      ))}
    </div>
  );

  // Field configs
  const generalFields = [
    { label: "Process Number", key: "Processnumber", type: "text" },
    { label: "OEM", key: "OEM", type: "text" },
    { label: "Carline", key: "Carline", type: "text" },
    {
      label: "Constructed Space",
      key: "Constructedspace",
      type: "select",
      options: ["Innenraum", "Autarke", "Cockpit", "Motorblick"],
    },
    {
      label: "Hand Drivers",
      key: "Handdrivers",
      type: "select",
      options: ["LL", "RL", "ALL"],
    },
    {
      label: "Project Phase",
      key: "Projectphase",
      type: "select",
      options: ["VFF", "PVS", "0-Serie", "PVL", "SOP"],
    },
  ];
  const timelineFields = [
    {
      label: "Start date - Process",
      key: "StartdateProcessinfo",
      type: "date",
    },
    {
      label: "End date - Process",
      key: "EnddateProcessinfo",
      type: "date",
    },
    { label: "WorkingDays_Process", key: "WorkingDays_Process", type: "number" },
    {
      label: "Start date - Phase4",
      key: "StartdatePhase4",
      type: "date",
    },
    {
      label: "End date - Phase4",
      key: "EnddatePhase4",
      type: "date",
    },
    { label: "WorkingDays_Phase4", key: "WorkingDays_Phase4", type: "number" },
    {
      label: "Start date - PAV",
      key: "StartdatePAVPhase4",
      type: "date",
    },
    {
      label: "End date - PAV",
      key: "EnddatePAVPhase4",
      type: "date",
    },
    {
      label: "WorkingDays_PAV_Phase4",
      key: "WorkingDays_PAV_Phase4",
      type: "number",
    },
    {
      label: "Realization planned",
      key: "Realizationplanned",
      type: "date",
    },
    {
      label: "Approx. realization date",
      key: "Approxrealizationdate",
      type: "date",
    },
  ];
  const estimationFields = [
    { label: "Estimated scrap", key: "Estimatedscrap", type: "number" },
    { label: "Estimated cost", key: "Estimatedcost", type: "number" },
    { label: "Estimated downtime", key: "Estimateddowntime", type: "number" },
  ];

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      {/* overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none" />

      {/* back button */}
      <button
        onClick={() => navigate(`/details/${projectKey}/implementation/${itemId}`)}
        className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-2 bg-white/20 backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
      >
        ← Back
      </button>

      {/* content */}
      <div className="relative z-20 max-w-4xl mx-auto p-8 space-y-8 text-white">
        {/* NEW: Show the project logo */}
        {project?.logo && (
          <img
            src={project.logo}
            alt={`${project.displayName} logo`}
            className="h-16 w-auto mb-4"
          />
        )}
        <h1 className="text-3xl font-bold">Update Implementation</h1>

        {/* tabs */}
        <div className="flex border-b border-white/30">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-2 -mb-px ${
                activeTab === t
                  ? "border-b-4 border-blue-600 font-semibold text-white"
                  : "text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <form className="space-y-8">
          {activeTab === "General" && renderFields(generalFields)}
          {activeTab === "Timeline" && renderFields(timelineFields, 3)}
          {activeTab === "Estimations" && renderFields(estimationFields)}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/details/${projectKey}/implementation/${itemId}`)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl text-white transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-2xl text-white transition"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
