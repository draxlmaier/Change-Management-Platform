// src/pages/DetailsFeasibility.tsx
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
  const [error, setError] = useState<string | null>(null);

  // Store found project so we can display its logo
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

      // Find the matching project in the array
      const foundProject = config.projects.find((p) => p.id === projectKey);
      if (!foundProject) {
        setError(`No project found for key "${projectKey}"`);
        return;
      }
        const patchedProject = {
        ...foundProject,
        logo: PROJECT_LOGO_MAP[foundProject.id.toLowerCase()] || PROJECT_LOGO_MAP["other"],
      };
      setProject(patchedProject);

      // Grab feasibility list ID
      const listId = foundProject.mapping?.implementation;
      if (!listId) {
        setError("Feasibility list not configured");
        return;
      }
      const account = msalInstance.getActiveAccount();
      if (!account) {
        setError("No signed-in user. Please log in.");
        return;
      }
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);

      if (!token) {
        setError("Authentication failed");
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
  }, [ projectKey, itemId]);

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!item) return null;

  const f = item.fields;

  const renderGrid = (fields: Array<[string, string]>) => (
    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-lg items-center">
      {fields.map(([label, key]) => {
        const val = f[key];
        const isEmpty = val === undefined || val === null || val === "";
        const isWorking =
          key === "WorkingDays_Process" ||
          key === "WorkingDays_Phase4" ||
          key === "WorkingDays_PAV_Phase4";
        const num = Number(val);

        let bgColor = "";
        if (isWorking && !isEmpty) {
          bgColor =
            num > 5
              ? "bg-red-500 text-white font-bold"
              : "bg-green-500 text-white font-bold";
        }

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
    ["Status", "Status"],
    ["OEM", "OEM"],
    ["Carline", "Carline"],
    ["Constructed space", "Constructedspace"],
    ["Hand drivers", "Handdrivers"],
    ["Project phase", "Projectphase"],
    ["Realization planned", "Realizationplanned"],
    ["Process number", "Processnumber"],
    ["Reason for changes", "Reasonforchanges"],
    ["Tools / utilities available", "ToolsutilitiesavailablePAVPhase4"],
    ["Process – FMEA", "ProcessFMEAPAVPhase4"],
    ["PLP Relevant", "PLPRelevantPAVPhase4"],
    ["Risk level actual", "RisklevelactualPAVPhase4"],
    ["SheetName", "SheetName"],
  ];

  const timelineFields: Array<[string, string]> = [
    ["Approx. realization date", "Approxrealizationdate"],
    ["Process Start date", "StartdateProcessinfo"],
    ["Process End date", "EnddateProcessinfo"],
    ["WorkingDays_Process", "WorkingDays_Process"],
    ["Start date – Phase4", "StartdatePhase4"],
    ["End date – Phase4", "EnddatePhase4"],
    ["WorkingDays_Phase4", "WorkingDays_Phase4"],
    ["Start date – PAV", "StartdatePAVPhase4"],
    ["End date – PAV", "EnddatePAVPhase4"],
    ["WorkingDays_PAV_Phase4", "WorkingDays_PAV_Phase4"],
  ];

  const estimationFields: Array<[string, string]> = [
    ["Estimated scrap", "Estimatedscrap"],
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
        onClick={() => navigate(`/changes/${projectKey}/feasibility`)}
        className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition"
      >
        ← Back
      </button>

      <div className="relative z-20 max-w-4xl mx-auto p-8 space-y-8 text-white">
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
            onClick={() => navigate(`/update/${projectKey}/feasibility/${itemId}`)}
           className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
          >
            Update
          </button>
          <button
            onClick={async () => {
              if (!projectKey || !itemId) return;
              const raw = localStorage.getItem("cmConfigLists");
              if (!raw) return;
              const cfg: SavedConfig = JSON.parse(raw);
              const proj = cfg.projects.find((p) => p.id === projectKey);
              if (!proj || !proj.mapping?.feasibility) return;
              const account = msalInstance.getActiveAccount();
              if (!account) {
                setError("No signed-in user. Please log in.");
                return;
              }
              const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Manage.All"]);

              if (!token) return;

              try {
                await axios.delete(
                  `https://graph.microsoft.com/v1.0/sites/${cfg.siteId}/lists/${proj.mapping.feasibility}/items/${itemId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                navigate(-1);
              } catch (e: any) {
                alert(
                  "Delete failed: " + (e.response?.data?.error?.message || e.message)
                );
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

export default DetailsFeasibility;
