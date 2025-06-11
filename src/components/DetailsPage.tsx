import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import harnessBg from "../assets/images/harness-bg.png";
import { PROJECT_LOGO_MAP } from "../constants/projects";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

interface FieldEntry {
  label: string;
  key: string;
}

interface DetailsPageProps {
  fieldsConfig: {
    generalFields: FieldEntry[];
    editableFields: FieldEntry[];
  };
  listType: "feasibility" | "implementation";
}

const DetailsPage: React.FC<DetailsPageProps> = ({ fieldsConfig, listType }) => {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<ChangeItem | null>(null);
  const [project, setProject] = useState<IProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState<string>("");
  const [config, setConfig] = useState<SavedConfig | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

  const renderField = ({ label, key }: FieldEntry, editable: boolean) => {
    const val = f[key] ?? "—";
    const isEditing = editingField === key;

    if (!editable) {
      return (
        <div key={key} className="flex justify-between items-center mb-4">
          <div className="font-semibold text-white w-64">{label}</div>
          <div className="p-2 rounded border border-white/30 text-white">{val}</div>
        </div>
      );
    }

    return (
      <div key={key} className="flex justify-between items-center mb-4">
        <div className="font-semibold text-white w-64">{label}</div>
        <div className="flex-1">
          {isEditing ? (
            <>
              <input
                className="p-1 rounded text-black w-full"
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => saveEdit(key)}
                  className="px-3 py-1 bg-green-500 rounded text-white"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => cancelEdit()}
                  className="px-3 py-1 bg-red-500 rounded text-white"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div
              onDoubleClick={() => startEdit(key, val)}
              className="p-2 rounded border border-white/30 hover:bg-white/20 transition cursor-pointer text-white"
            >
              {val}
              <button
                className="ml-2 px-2 py-1 bg-blue-500 text-xs text-white rounded"
                onClick={() => startEdit(key, val)}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const startEdit = (key: string, val: any) => {
    setEditingField(key);
    setEditedValue(val);
  };

  const cancelEdit = () => {
    if (!isSaving) {
      setEditingField(null);
      setEditedValue("");
    }
  };

  const saveEdit = async (key: string) => {
    setIsSaving(true);
    try {
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);
      const listId =
        listType === "feasibility"
          ? project?.mapping?.feasibility || project?.mapping?.implementation
          : project?.mapping?.implementation;

      if (!listId) throw new Error("List ID not found");
      const updatePayload = { [key]: editedValue };

      await axios.patch(
        `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items/${itemId}/fields`,
        updatePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItem((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fields: { ...prev.fields, [key]: editedValue },
        };
      });

      toast.success("Field updated successfully!");
    } catch (err: any) {
      console.error("Error updating field", err);
      toast.error("Error updating field: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setIsSaving(false);
      setEditingField(null);
      setEditedValue("");
    }
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
      <div className="relative z-20 flex mx-auto max-w-7xl p-10 space-x-10">
        <div className="w-1/3 p-6 text-white">
          {project?.logo && <img src={project.logo} alt="logo" className="w-24 h-auto mb-4" />}
          {fieldsConfig.generalFields.map((field) => renderField(field, false))}
        </div>

        <div className="w-2/3 bg-black/50 rounded-2xl p-6 text-white overflow-y-auto">
          <h1 className="text-3xl font-bold mb-6">Details</h1>
          {fieldsConfig.editableFields.map((field) => renderField(field, true))}
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;
