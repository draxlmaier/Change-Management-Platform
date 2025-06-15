import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import harnessBg from "../assets/images/harness-bg.png";
import { PROJECT_LOGO_MAP } from "../constants/projects";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  listType: "feasibility" | "implementation";
}

const DetailsPage: React.FC<DetailsPageProps> = ({ fieldsConfig, listType }) => {
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

        const listId =
          listType === "feasibility"
            ? foundProject.mapping.feasibility || foundProject.mapping.implementation
            : foundProject.mapping.implementation;

        if (!listId) return setError("List mapping not configured");

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
  }, [projectKey, itemId, listType]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!item || !project || !config) return null;

  const f = item.fields;

  const filledEditableFields = fieldsConfig.editableFields.filter(
    (field) => f[field.key] !== undefined && f[field.key] !== null && f[field.key] !== ""
  ).filter(field => !fieldsConfig.startEndWorkingGroup.some(g => g.key === field.key));

  const emptyEditableFields = fieldsConfig.editableFields.filter(
    (field) => !filledEditableFields.includes(field) &&
      !fieldsConfig.startEndWorkingGroup.some(g => g.key === field.key)
  );

  const getInputType = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("date")) return "date";
    if (k.includes("cost") || k.includes("downtime") || k.includes("workingdays") || k.includes("scrap"))
      return "number";
    return "text";
  };

  const handleEditStart = (fieldKey: string, currentVal: string) => {
    setEditingField(fieldKey);
    setEditedValue(currentVal);
  };

  const handleSave = async (fieldKey: string, newValue: string) => {
    if (f[fieldKey] === newValue) {
      setEditingField(null);
      return; // Prevent unnecessary API calls
    }

    setIsSaving(true);
    try {
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
      const listId =
        listType === "feasibility"
          ? project?.mapping?.feasibility || project?.mapping?.implementation
          : project?.mapping?.implementation;

      const updatePayload = { [fieldKey]: newValue };

      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${config?.siteId}/lists/${listId}/items/${itemId}/fields`,
        updatePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItem((prev) => prev ? ({ ...prev, fields: { ...prev.fields, [fieldKey]: newValue } }) : prev);
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
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(field.key, editedValue); }}
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

  return (
    <div className="relative w-full min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${harnessBg})` }}>
      <ToastContainer />
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
      >
        ← Back
      </button>

      <div className="relative z-20 flex flex-col lg:flex-row mx-auto max-w-7xl p-4 gap-6">
        {/* LEFT PANEL */}
        <div className="w-full lg:w-5/12 bg-black/50 rounded-2xl p-6 text-white">
          {project?.logo && <img src={project.logo} alt="logo" className="w-32 h-auto mb-6 mx-auto" />}
          <h1 className="text-3xl font-bold mb-6 text-center">Change Details</h1>

          {fieldsConfig.generalFields.map(field => (
  <div key={field.key} className="mb-4">
    <p className="text-sm text-yellow-400 mb-1">{field.label}</p>
    <div className="bg-white/10 px-3 py-2 rounded text-white">{f[field.key] ?? "—"}</div>
  </div>
))}

        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-7/12 bg-black/50 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-6">Edit Fields</h2>

          {filledEditableFields.map(renderEditable)}
          {emptyEditableFields.map(renderEditable)}

          <h2 className="text-2xl font-semibold my-8 text-center">Timeline Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fieldsConfig.startEndWorkingGroup.map(renderEditable)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;
