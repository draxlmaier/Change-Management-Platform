// src/pages/DetailsImplementation.tsx
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
  mapping?: {
    implementation?: string;
    feasibility?: string;
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

const DetailsImplementation: React.FC = () => {
  const { projectKey, itemId } = useParams<{ projectKey: string; itemId: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<ChangeItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // NEW: loading state
  const [project, setProject] = useState<IProject | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); // NEW
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) {
        setError("Configuration missing");
        setLoading(false);
        return;
      }

      let config: SavedConfig;
      try {
        config = JSON.parse(raw);
      } catch {
        setError("Invalid configuration data");
        setLoading(false);
        return;
      }

      const foundProject = config.projects.find((p) => p.id === projectKey);
      if (!foundProject) {
        setError(`No project found for key "${projectKey}"`);
        setLoading(false);
        return;
      }
      const patchedProject = {
              ...foundProject,
              logo: PROJECT_LOGO_MAP[foundProject.id.toLowerCase()] || PROJECT_LOGO_MAP["other"],
            };
            setProject(patchedProject);

      const listId = foundProject.mapping?.feasibility;
      if (!listId) {
        setError("No implementation list assigned");
        setLoading(false);
        return;
      }
      const account = msalInstance.getActiveAccount();
      if (!account) {
        setError("No signed-in user. Please sign in again.");
        return;
      }

      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);

      if (!token) {
        setError("No token");
        setLoading(false);
        return;
      }

      try {
        const resp = await axios.get<ChangeItem>(
          `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items/${itemId}?expand=fields`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItem(resp.data);
      } catch (e: any) {
        setError(e.response?.data?.error?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectKey, itemId]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (loading) return <div className="p-8 text-white animate-pulse">Loading details...</div>; // NEW

  if (!item) return null;

  const f = item.fields;

  const renderGrid = (fields: Array<[string, string]>) => (
  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-lg items-center">
    {fields.map(([label, key]) => {
      const val = f[key];
      const isEmpty = val === undefined || val === null || val === "";
      return (
                <React.Fragment key={key}>
                  <div className="text-white font-semibold">{label}</div>
                  <div 
                  className={`p-2 text-white rounded border ${
                    val ? "border-transparent" : "border-red-600"
                  }`}
                  >
                    {isEmpty ? "—" : val}
                  </div>
                </React.Fragment>
       );
    })}
  </div>
);

  const generalFields: Array<[string, string]> = [
    ["Process number", "Processnumber"],
    ["Status", "Status"],
    ["OEM", "OEM"],
    ["Carline", "Carline"],
    ["Constructed space", "Constructedspace"],
    ["Projectphase", "Projectphase"],
    ["DeadlineTBT", "DeadlineTBT"],
    ["Modelyear", "Modelyear"],
    ["Realizationplanned", "Realizationplanned"],
    ["Approxrealizationdate", "Approxrealizationdate"],
    ["Hand drivers", "Handdrivers"],
    ["OEMOfferChangenumber", "OEMOfferChangenumber"],
    ["Reason for changes", "Reasonforchanges"],
  ];

  const timelineFields: Array<[string, string]> = [
    ["Process start date", "StartdateProcessinfo"],
    ["Process end date", "EnddateProcessinfo"],
  ];

  const estimationFields: Array<[string, string]> = [
    ["Estimated cost", "Estimatedcost"],
    ["Estimated downtime", "Estimateddowntime"],
  ];

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="absolute inset-0 z-10 pointer-events-none" />

      <button
        onClick={() => navigate(`/changes/${projectKey}/implementation`)}
        className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
      >
        ← Back
      </button>

      <div className="relative z-20 max-w-5xl mx-auto p-8 space-y-10 text-white">
        {/* Centered Logo + Title */}
        <div className="flex flex-col items-center text-center mb-8">
          {project?.logo && (
            <img
              src={project.logo}
              alt={`${project.displayName} logo`}
              className="h-16 w-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold capitalize">
            {project?.displayName} Feasability Details
          </h1>
        </div>

        {[["General", generalFields], ["Timeline", timelineFields], ["Estimations", estimationFields]].map(
          ([title, sectionFields]) => (
            <section
              key={title as string}
              className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl shadow-lg p-6 space-y-4"
            >
              <h2 className="text-2xl font-bold">{title}</h2>
              {renderGrid(sectionFields as Array<[string, string]>)}
            </section>
          )
        )}

        <div className="flex flex-wrap gap-4 pt-4">
          <button
            onClick={() => navigate(`/update/${projectKey}/implementation/${item.id}`)}
           className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
          >
            Update
          </button>
          <button
            onClick={() => navigate(`/send-email/${projectKey}/implementation/${item.id}`)}
            className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
          >
            Send Email
          </button>
          <button
            onClick={async () => {
              if (!window.confirm("Are you sure you want to delete this item?")) return; // NEW
              if (!projectKey || !itemId) return;
              const raw = localStorage.getItem("cmConfigLists");
              if (!raw) return;
              const cfg: SavedConfig = JSON.parse(raw);
              const proj = cfg.projects.find((p) => p.id === projectKey);
              if (!proj || !proj.mapping?.implementation) return;
              
              const account = msalInstance.getActiveAccount();
              if (!account) {
                setError("No signed-in user. Please sign in again.");
                return;
              }

              const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);

              if (!token) return;

              try {
                await axios.delete(
                  `https://graph.microsoft.com/v1.0/sites/${cfg.siteId}/lists/${proj.mapping.implementation}/items/${itemId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                navigate(-1);
              } catch (e: any) {
                alert("Delete failed: " + (e.response?.data?.error?.message || e.message));
              }
            }}
            className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsImplementation;