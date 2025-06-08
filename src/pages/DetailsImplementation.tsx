// src/pages/DetailsImplementation.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";

import harnessBg from "../assets/images/harness-bg.png";

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
  const { instance } = useMsal();

  const [item, setItem] = useState<ChangeItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // NEW: store the found project to show its logo
  const [project, setProject] = useState<IProject | null>(null);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) {
        setError("Configuration missing");
        return;
      }

      let config: SavedConfig;
      try {
        config = JSON.parse(raw);
      } catch {
        setError("Invalid configuration data");
        return;
      }

      // find the matching project
      const foundProject = config.projects.find((p) => p.id === projectKey);
      if (!foundProject) {
        setError(`No project found for key "${projectKey}"`);
        return;
      }
      setProject(foundProject);

      const listId = foundProject.mapping?.implementation;
      if (!listId) {
        setError("No implementation list assigned");
        return;
      }

      const token = await getAccessToken(instance, [
        "https://graph.microsoft.com/Sites.Read.All",
      ]);
      if (!token) {
        setError("No token");
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
      }
    })();
  }, [instance, projectKey, itemId]);

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!item) {
    return null;
  }

  const f = item.fields;

  // Helper to render grid
  const renderGrid = (fields: Array<[string, string]>) => (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      {fields.map(([label, key]) => {
        const val = f[key];
        const isEmpty = val === undefined || val === null || val === "";
        return (
          <React.Fragment key={key}>
            <div className="text-white font-medium">{label}</div>
            <div
              className={`p-2 rounded border ${
                isEmpty ? "border-red-600" : "border-transparent"
              } text-white`}
            >
              {isEmpty ? "—" : val}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  // Field sections
  const generalFields: Array<[string, string]> = [
    ["Process number", "Processnumber"],
    ["Status", "Status"],
    ["OEM", "OEM"],
    ["Carline", "Carline"],
    ["Constructed space", "Constructedspace"],
    ["Projectphase","Projectphase"],
    ["DeadlineTBT","DeadlineTBT"], 
    ["Modelyear","Modelyear"],
    ["Realizationplanned","Realizationplanned"],
    ["Approxrealizationdate","Approxrealizationdate"],
    ["Hand drivers","Handdrivers"],
    ["OEMOfferChangenumber","OEMOfferChangenumber"],
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
      {/* dark overlay (clicks pass through) */}
      <div className="absolute inset-0 z-10 pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => navigate(`/changes/${projectKey}/implementation`)}
        className="
          absolute top-4 left-4 z-20
          flex items-center space-x-2
          px-3 py-2
          bg-white/20 hover:bg-white/30
          backdrop-blur rounded-2xl shadow-md
          text-white text-sm
          transition
        "
      >
        ← Back
      </button>

      {/* content */}
      <div className="relative z-20 max-w-4xl mx-auto p-8 space-y-8 text-white">
        {/* NEW: show the project's logo (if present) */}
        {project?.logo && (
          <img
            src={project.logo}
            alt={`${project.displayName} logo`}
            className="h-16 w-auto mb-4"
          />
        )}

        <h1 className="text-3xl font-bold capitalize">
          {project?.displayName} Feasibility Details
        </h1>

        <section className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">General</h2>
          {renderGrid(generalFields)}
        </section>

        <section className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Timeline</h2>
          {renderGrid(timelineFields)}
        </section>

        <section className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Estimations</h2>
          {renderGrid(estimationFields)}
        </section>

        <div className="flex space-x-4">
          <button
            onClick={() => navigate(`/update/${projectKey}/implementation/${item.id}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-md hover:bg-blue-700 transition"
          >
            Update
          </button>
          <button
            onClick={() => navigate(`/send-email/${projectKey}/implementation/${item.id}`)}
            className="px-6 py-3 bg-green-600 text-white rounded-2xl shadow-md hover:bg-green-700 transition"
          >
            Send Email
          </button>
          <button
            onClick={async () => {
              if (!projectKey || !itemId) return;
              const raw = localStorage.getItem("cmConfigLists");
              if (!raw) return;
              const cfg: SavedConfig = JSON.parse(raw);
              const proj = cfg.projects.find((p) => p.id === projectKey);
              if (!proj || !proj.mapping?.implementation) return;

              const token = await getAccessToken(instance, [
                "https://graph.microsoft.com/Sites.Manage.All",
              ]);
              if (!token) return;

              try {
                await axios.delete(
                  `https://graph.microsoft.com/v1.0/sites/${cfg.siteId}/lists/${proj.mapping.implementation}/items/${itemId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                navigate(-1);
              } catch (e: any) {
                alert(
                  "Delete failed: " + (e.response?.data?.error?.message || e.message)
                );
              }
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-2xl shadow-md hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsImplementation;
