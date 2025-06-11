import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import harnessBg from "../assets/images/harness-bg.png";
import { PROJECT_LOGO_MAP } from "../constants/projects";

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

const DetailsFeasibility: React.FC = () => {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<ChangeItem | null>(null);
  const [project, setProject] = useState<IProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState<string>("");

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) return setError("Configuration missing");
      let config: SavedConfig;
      try {
        config = JSON.parse(raw);
      } catch {
        return setError("Invalid configuration");
      }

      const foundProject = config.projects.find((p) => p.id === projectKey);
      if (!foundProject) return setError("Project not found");

      const patchedProject = {
        ...foundProject,
        logo: PROJECT_LOGO_MAP[foundProject.id.toLowerCase()] || PROJECT_LOGO_MAP["other"],
      };
      setProject(patchedProject);

      const listId = foundProject.mapping?.implementation;
      if (!listId) return setError("Feasibility list not configured");

      const account = msalInstance.getActiveAccount();
      if (!account) return setError("No signed-in user");
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);
      if (!token) return setError("Authentication failed");

      try {
        const resp = await axios.get<ChangeItem>(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items/${itemId}?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItem(resp.data);
      } catch (e: any) {
        setError(e.response?.data?.error?.message || e.message);
      }
    })();
  }, [projectKey, itemId]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!item || !project) return null;

  const f = item.fields;

  const generalFields: Array<[string, string]> = [
    ["Processnumber", "Processnumber"],
    ["Status", "Status"],
    ["OEM", "OEM"],
    ["Carline", "Carline"],
    ["Constructedspace", "Constructedspace"],
    ["Handdrivers", "Handdrivers"],
    ["Projectphase", "Projectphase"],
  ];

  const otherFields: Array<[string, string]> = [
    ["DeadlineTBT", "DeadlineTBT"],
    ["Modelyear", "Modelyear"],
    ["Realizationplanned", "Realizationplanned"],
    ["Approxrealizationdate", "Approxrealizationdate"],
    ["StartdateProcessinfo", "StartdateProcessinfo"],
    ["EnddateProcessinfo", "EnddateProcessinfo"],
    ["OEMOfferChangenumber", "OEMOfferChangenumber"],
    ["OEMChangenumber", "OEMChangenumber"],
    ["Reasonforchanges", "Reasonforchanges"],
    ["StartdatePhase4", "StartdatePhase4"],
    ["EnddatePhase4", "EnddatePhase4"],
    ["StartdatePAVPhase4", "StartdatePAVPhase4"],
    ["EnddatePAVPhase4", "EnddatePAVPhase4"],
    ["EstimatedcostsPAVPhase4", "EstimatedcostsPAVPhase4"],
    ["ToolsutilitiesavailablePAVPhase4", "ToolsutilitiesavailablePAVPhase4"],
    ["ProcessFMEAPAVPhase4", "ProcessFMEAPAVPhase4"],
    ["PLPRelevantPAVPhase4", "PLPRelevantPAVPhase4"],
    ["RisklevelactualPAVPhase4", "RisklevelactualPAVPhase4"],
    ["Parameters", "Parameters"],
    ["Estimatedscrap", "Estimatedscrap"],
    ["Estimatedcost", "Estimatedcost"],
    ["Estimateddowntime", "Estimateddowntime"],
    ["estimatedchangedate", "estimatedchangedate"],
    ["SheetName", "SheetName"],
    ["WorkingDaysProcess", "WorkingDaysProcess"],
    ["WorkingDaysPhase4", "WorkingDaysPhase4"],
    ["WorkingDaysPAVPhase4", "WorkingDaysPAVPhase4"],
  ];

  const renderField = ([label, key]: [string, string]) => {
    const val = f[key] ?? "—";
    const isEditing = editingField === key;

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
                >
                  Save
                </button>
                <button
                  onClick={() => cancelEdit()}
                  className="px-3 py-1 bg-red-500 rounded text-white"
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
    setEditingField(null);
    setEditedValue("");
  };

  const saveEdit = (key: string) => {
    setItem((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: { ...prev.fields, [key]: editedValue },
      };
    });
    cancelEdit();
  };

  return (
    <div className="relative w-full min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${harnessBg})` }}>
      <div className="absolute inset-0 z-10 pointer-events-none bg-black bg-opacity-30" />
      <div className="relative z-20 flex mx-auto max-w-7xl p-10 space-x-10">
        <div className="w-1/3 bg-black/50 rounded-2xl p-6 text-white">
          {project?.logo && <img src={project.logo} alt="logo" className="w-24 h-auto mb-4" />}
          {generalFields.map(renderField)}
        </div>

        <div className="w-2/3 bg-black/50 rounded-2xl p-6 text-white overflow-y-auto">
          <h1 className="text-3xl font-bold mb-6">Feasibility Details</h1>
          {otherFields.map(renderField)}
        </div>
      </div>
    </div>
  );
};

export default DetailsFeasibility;
