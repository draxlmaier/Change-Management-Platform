// File: src/components/DetailsPage.tsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import harnessBg from "../assets/images/harness-bg.png";
import { PROJECT_LOGO_MAP } from "../constants/projects";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TopMenu from "./TopMenu";

interface FieldEntry {
  label: string;
  key: string;
}

interface FieldsConfig {
  generalFields: FieldEntry[];
  editableFields: FieldEntry[];
  startEndWorkingGroup: FieldEntry[];
}

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    feasibility: string;
    implementation: string;
    feasibilityExtra?: string;
    implementationExtra?: string;
  };
}

interface SavedConfig {
  siteId: string;
  projects: IProject[];
}

interface ChangeItem {
  id: string;
  fields: Record<string, any>;
}

interface DetailsPageProps {
  fieldsConfig: FieldsConfig;
}

const DetailsPage: React.FC<DetailsPageProps> = ({ fieldsConfig }) => {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<ChangeItem | null>(null);
  const [project, setProject] = useState<IProject | null>(null);
  const [config, setConfig] = useState<SavedConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState<string>("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("cmConfigLists");
        if (!raw) return setError("Configuration missing");
        const loadedConfig: SavedConfig = JSON.parse(raw);
        setConfig(loadedConfig);

        const foundProject = loadedConfig.projects.find((p) => p.id === projectKey);
        if (!foundProject) return setError("Project not found");

        const patchedProject = {
          ...foundProject,
          logo: PROJECT_LOGO_MAP[foundProject.id.toLowerCase()] || PROJECT_LOGO_MAP["other"],
        };
        setProject(patchedProject);

        const listId = foundProject.mapping.implementation;
        if (!listId) return setError("Implementation list not configured");

        const account = msalInstance.getActiveAccount();
        if (!account) return setError("No signed-in user");
        const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);
        if (!token) return setError("Authentication failed");

        const resp = await axios.get<ChangeItem>(
          `https://graph.microsoft.com/v1.0/sites/${loadedConfig.siteId}/lists/${listId}/items/${itemId}?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItem(resp.data);
      } catch (e: any) {
        setError(e.response?.data?.error?.message || e.message);
      }
    })();
  }, [projectKey, itemId]);

  const f = item?.fields || {};
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!item || !project || !config) return null;

  const getInputType = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("date")) return "date";
    if (k.includes("cost") || k.includes("downtime") || k.includes("workingdays") || k.includes("scrap")) return "number";
    return "text";
  };

  const handleEditStart = (fieldKey: string, currentVal: string) => {
    setEditingField(fieldKey);
    setEditedValue(currentVal);
  };

  const handleSave = async (fieldKey: string, newValue: string) => {
    if (f[fieldKey] === newValue) {
      setEditingField(null);
      return;
    }

    setIsSaving(true);
    try {
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
      const listId = project?.mapping?.implementation;
      const updatePayload = { [fieldKey]: newValue };

      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${config?.siteId}/lists/${listId}/items/${itemId}/fields`,
        updatePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItem((prev) =>
        prev ? { ...prev, fields: { ...prev.fields, [fieldKey]: newValue } } : prev
      );
      toast.success("Saved");
    } catch (e: any) {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
      setEditingField(null);
    }
  };

  const renderEditable = (field: FieldEntry) => {
    const currentValue = f[field.key] ?? "";

    return (
      <div key={field.key} className="mb-4">
        <p className="text-sm text-yellow-400 mb-1">{field.label}</p>
        {editingField === field.key ? (
          <input
            ref={inputRef}
            className="p-2 rounded text-black w-full"
            type={getInputType(field.key)}
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            onBlur={() => handleSave(field.key, editedValue)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave(field.key, editedValue);
            }}
          />
        ) : (
          <div
            className="bg-white/10 p-2 rounded cursor-pointer hover:bg-white/20"
            onClick={() => handleEditStart(field.key, currentValue)}
          >
            {currentValue || "—"}
          </div>
        )}
      </div>
    );
  };

  const groupFields = (keys: string[]) => fieldsConfig.editableFields.filter(f => keys.includes(f.key));

  const section = (title: string, dateKeys: string[], contentKeys: string[]) => (
    <div className="mb-12">
      <div className="flex justify-between items-start">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
          {groupFields(dateKeys).map(renderEditable)}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {groupFields(contentKeys).map(renderEditable)}
      </div>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${harnessBg})` }}>
      <ToastContainer />
      <TopMenu />
      <button
  onClick={() => navigate(`/send-email/${projectKey}/implementation/${itemId}`)}
  className="absolute top-4 right-4 z-20 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md transition"
>
  📧 Send Email
</button>
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
      >
        ← Back
      </button>

      <div className="relative z-20 max-w-6xl mx-auto p-4 text-white">
        <div className="text-center mb-6">
          {project?.logo && <img src={project.logo} alt="logo" className="w-32 h-auto mx-auto mb-4" />}
          <h1 className="text-3xl font-bold">Change Details</h1>
        </div>

        {/* PROCESS INFORMATION */}
        {section("Process Information",
          ["StartdateProcessinfo", "EnddateProcessinfo", "WorkingDaysProcess"],
          fieldsConfig.generalFields.map(f => f.key)
        )}

        {/* PHASE 4 */}
        {section("Phase 4",
          ["StartdatePhase4", "EnddatePhase4", "WorkingDaysPhase4"],
          []
        )}

        {/* PAV SUBSECTION */}
        {section("PAV Subsection",
          ["StartdatePAVPhase4", "EnddatePAVPhase4", "WorkingDaysPAVPhase4"],
          [
            "EstimatedcostsPAVPhase4", "ToolsutilitiesavailablePAVPhase4", "ProcessFMEAPAVPhase4",
            "PLPRelevantPAVPhase4", "RisklevelactualPAVPhase4",
            "Estimatedscrap", "Estimatedcost", "Estimateddowntime", "estimatedchangedate"
          ]
        )}

        {/* PHASE 8 */}
        {section("Phase 8",
          ["StartdatePhase8", "EnddatePhase8", "WorkingDaysPAVPhase8"],
          ["Changepackages", "Scrap", "Actualcost", "Actualdowntime", "Changedate"]
        )}
      </div>
    </div>
  );
};

export default DetailsPage;
