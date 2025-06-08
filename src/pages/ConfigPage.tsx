// ConfigPage.tsx

import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import axios from "axios";
import { getAccessToken } from "../auth/getToken";
import harnessBg from "../assets/images/harness-bg.png";

import { AVAILABLE_PROJECTS } from '../constants/projects';

import { db } from './db';
import { CarImage } from './types';

import CarConfigurationComponent from './CarConfigurationComponent';

// ----------------------------------------------------------------
// NEW CODE: Extend the IProject interface to include 4 list fields
// ----------------------------------------------------------------
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

const LISTS_CONFIG_KEY = "cmConfigLists";

interface ListsConfig {
  siteId: string;
  questionsListId: string;
  monthlyListId: string;
  followCostListId: string;
  projects: IProject[];
  assignedRoles?: { email: string; role: string }[];
  frequentSites?: string[];
}

// The rest of your config page’s code…

const ConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();

  // Basic states for siteName, siteId, etc.
  const [siteName, setSiteName] = useState("");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [lists, setLists] = useState<{ id: string; displayName: string }[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Frequent sites
  const [frequentSites, setFrequentSites] = useState<string[]>(() => {
    const storedSites = localStorage.getItem("frequentSharePointSites");
    return storedSites ? JSON.parse(storedSites) : [];
  });
  const addToFrequentSites = (site: string) => {
    if (!frequentSites.includes(site)) {
      const updatedSites = [...frequentSites, site];
      setFrequentSites(updatedSites);
      localStorage.setItem("frequentSharePointSites", JSON.stringify(updatedSites));
      setMessage(`Added ${site} to frequently used sites.`);
    } else {
      setMessage(`${site} is already in your frequently used sites.`);
    }
  };

  // KPI Lists
  const [questionsListId, setQuestionsListId] = useState("");
  const [monthlyListId, setMonthlyListId] = useState("");
  const [followCostListId, setFollowCostListId] = useState("");

  // ----------------------------------------------------------------
  // NEW CODE: We’ll store + load projects from localStorage, including the new fields
  // ----------------------------------------------------------------
  const [projects, setProjects] = useState<IProject[]>(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const cfg: ListsConfig = JSON.parse(raw);
        if (Array.isArray(cfg.projects)) {
          return cfg.projects;
        }
      } catch {}
    }
    return [];
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Roles
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [assignedRoles, setAssignedRoles] = useState<{ email: string; role: string }[]>([]);

  // Car images
  const [carList, setCarList] = useState<CarImage[]>([]);
  // Tab switching
  const [activeTab, setActiveTab] = useState<"lists" | "cars" | "roles">("lists");

  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const cfg = JSON.parse(raw);
        if (Array.isArray(cfg.projects)) {
          setProjects(cfg.projects);
          setQuestionsListId(cfg.questionsListId);
          setMonthlyListId(cfg.monthlyListId);
          setFollowCostListId(cfg.followCostListId);
          if (Array.isArray(cfg.assignedRoles)) {
            setAssignedRoles(cfg.assignedRoles);
          }
        }
      } catch (err) {
        console.error("Error parsing config:", err);
      }
    }
  }, []);

  // ----------------------------------------------------------------
  //   handleSiteLookup
  // ----------------------------------------------------------------
  const handleSiteLookup = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingLists(true);
    setMessage(null);

    try {
      const token = await getAccessToken(instance, [
        "https://graph.microsoft.com/Sites.Read.All",
      ]);
      if (!token) throw new Error("No token");

      const fullUrl = `https://uittunis.sharepoint.com/sites/${siteName}`;
      const url = new URL(fullUrl);
      const path = `${url.hostname}:${url.pathname}:`;

      const siteResp = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${path}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSiteId(siteResp.data.id);

      const listsResp = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteResp.data.id}/lists`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLists(listsResp.data.value);

      addToFrequentSites(siteName);
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || err.message);
    } finally {
      setLoadingLists(false);
    }
  };

  // ----------------------------------------------------------------
  //   Role assignment
  // ----------------------------------------------------------------
  const handleRoleAssignment = (e: FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userRole) return;

    const existingRole = assignedRoles.find((r) => r.email === userEmail);
    if (existingRole) {
      setMessage(`User ${userEmail} already has a role assigned.`);
      return;
    }

    const newRole = { email: userEmail, role: userRole };
    setAssignedRoles((prev) => [...prev, newRole]);
    setUserEmail("");
    setUserRole("");
    setMessage(`Role ${userRole} assigned to ${userEmail} successfully!`);
  };
  const removeRole = (email: string) => {
    setAssignedRoles((prev) => prev.filter((r) => r.email !== email));
  };

  // ----------------------------------------------------------------
  //   Projects: Add from dropdown
  // ----------------------------------------------------------------
  const addProjectFromDropdown = () => {
    if (!selectedProjectId) {
      setMessage("Please select a project from the dropdown.");
      return;
    }
    // Check if already added
    const existing = projects.find((p) => p.id === selectedProjectId.toLowerCase());
    if (existing) {
      setMessage(`Project '${existing.displayName}' is already added.`);
      return;
    }
    // Find in AVAILABLE_PROJECTS
    const chosen = AVAILABLE_PROJECTS.find((p) => p.id === selectedProjectId.toLowerCase());
    if (!chosen) {
      setMessage("Selected project not found in AVAILABLE_PROJECTS.");
      return;
    }
    // Construct the new project
    const newProject: IProject = {
      id: chosen.id,
      displayName: chosen.displayName,
      logo: chosen.logo,
      mapping: {
        feasibility: "",
        implementation: "",
        // optional fields are empty by default
        feasibilityExtra: "",
        implementationExtra: ""
      },
    };
    setProjects((prev) => [...prev, newProject]);
    setSelectedProjectId("");
    setMessage(null);
  };

  const removeProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // ----------------------------------------------------------------
  //   handleProjectMappingChange
  //   Allows updating any field in the .mapping object
  // ----------------------------------------------------------------
  const handleProjectMappingChange = (
    projId: string,
    field: keyof IProject["mapping"],
    value: string
  ) => {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === projId
          ? {
              ...proj,
              mapping: {
                ...proj.mapping,
                [field]: value,
              },
            }
          : proj
      )
    );
  };

  // ----------------------------------------------------------------
  //   Car images
  // ----------------------------------------------------------------
  const loadCarList = async () => {
    const allCars = await db.carImages.toArray();
    setCarList(allCars);
  };
  useEffect(() => {
    loadCarList();
  }, []);

  // ----------------------------------------------------------------
  //   Save entire config
  // ----------------------------------------------------------------
  const handleSave = () => {
    // Basic validations for the 3 KPI lists
    if (!questionsListId || !monthlyListId || !followCostListId) {
      setMessage("Please select all KPI lists.");
      return;
    }

    // The user requires feasibility + implementation for each project,
    // but feasibilityExtra + implementationExtra can be empty.
    for (const proj of projects) {
      if (!proj.mapping.feasibility) {
        setMessage(`Select a Feasibility (Phase8) list for ${proj.displayName}.`);
        return;
      }
      if (!proj.mapping.implementation) {
        setMessage(`Select an Implementation (Phase4) list for ${proj.displayName}.`);
        return;
      }
      // feasibilityExtra & implementationExtra are optional, so no checks here
    }

    const newConfig: ListsConfig = {
      siteId: siteId || "",
      questionsListId,
      monthlyListId,
      followCostListId,
      projects,
      assignedRoles,
      frequentSites
    };
    localStorage.setItem("cmConfigLists", JSON.stringify(newConfig));
    setMessage("Configuration saved successfully!");
  };

  // ----------------------------------------------------------------
  //   Rendering
  // ----------------------------------------------------------------
  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="absolute inset-0 bg-opacity-50" />
      <button
        onClick={() => navigate("/landing")}
        className="absolute top-4 left-4 z-20 px-3 py-2 bg-white/30 rounded text-white hover:bg-white/50 transition"
      >
        ← Back
      </button>

      <div className="relative z-10 flex mx-auto max-w-6xl bg-white/20 backdrop-blur-lg rounded-lg overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-1/4 bg-white/30 p-6 space-y-4">
          <button
            onClick={() => setActiveTab("lists")}
            className={`w-full py-3 rounded-xl text-center font-medium transition ${
              activeTab === "lists" ? "bg-[#1cb3d2] text-white" : "text-white hover:bg-white/30"
            }`}
          >
            Configure Lists
          </button>
          <button
            onClick={() => setActiveTab("cars")}
            className={`w-full py-3 rounded-xl text-center font-medium transition ${
              activeTab === "cars" ? "bg-[#1cb3d2] text-white" : "text-white hover:bg-white/30"
            }`}
          >
            Configure Cars
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`w-full py-3 rounded-xl text-center font-medium transition ${
              activeTab === "roles" ? "bg-[#1cb3d2] text-white" : "text-white hover:bg-white/30"
            }`}
          >
            Configure User Roles
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 space-y-6 text-white">
          {activeTab === "lists" && (
            <>
              <h2 className="text-2xl font-semibold">List Configuration</h2>
              <form onSubmit={handleSiteLookup} className="space-y-4">
                <label className="block">
                  <span className="text-lg">SharePoint Site Name</span>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    required
                    className="w-full mt-1 p-2 rounded bg-white/80 text-gray-900"
                  />
                </label>
                <div>
                  <label className="block">
                    Frequently Used Sites
                    <select
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full mt-1 p-2 rounded bg-white/80 text-gray-900"
                    >
                      <option value="">-- Select a Site --</option>
                      {frequentSites.map((site, index) => (
                        <option key={index} value={site}>
                          {site}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loadingLists}
                  className="px-6 py-2 bg-[#1cb3d2] rounded-xl font-medium hover:opacity-90 transition"
                >
                  {loadingLists ? "Loading…" : "Lookup Lists"}
                </button>
              </form>

              {lists.length > 0 && (
                <div className="space-y-6 mt-6">
                  {/* KPI Lists */}
                  <div>
                    <label className="block">
                      Questions List
                      <select
                        value={questionsListId}
                        onChange={(e) => setQuestionsListId(e.target.value)}
                        className="w-full mt-1 p-2 rounded bg-white/80 text-gray-900"
                      >
                        <option value="">-- Select --</option>
                        {lists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <label className="block">
                      Monthly KPIs List
                      <select
                        value={monthlyListId}
                        onChange={(e) => setMonthlyListId(e.target.value)}
                        className="w-full mt-1 p-2 rounded bg-white/80 text-gray-900"
                      >
                        <option value="">-- Select --</option>
                        {lists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <label className="block">
                      Follow-up Cost List
                      <select
                        value={followCostListId}
                        onChange={(e) => setFollowCostListId(e.target.value)}
                        className="w-full mt-1 p-2 rounded bg-white/80 text-gray-900"
                      >
                        <option value="">-- Select --</option>
                        {lists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Projects */}
                  <div>
                    <h3 className="text-xl font-medium">Projects</h3>
                    {projects.length === 0 && (
                      <p className="text-sm text-white/70">
                        No projects yet. Add one below!
                      </p>
                    )}

                    {projects.map((proj) => (
                      <div key={proj.id} className="mt-4 space-y-2 bg-white/10 p-4 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {proj.logo && (
                              <img
                                src={proj.logo}
                                alt={proj.displayName}
                                className="w-10 h-10 object-contain mr-3"
                              />
                            )}
                            <span className="font-semibold">{proj.displayName}</span>
                          </div>
                          <button
                            onClick={() => removeProject(proj.id)}
                            className="ml-4 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Implementation (Phase 4) */}
                        <label className="block mt-2">
                          <span className="text-sm">Implementation (Phase 4)</span>
                          <select
                            value={proj.mapping.implementation}
                            onChange={(e) =>
                              handleProjectMappingChange(proj.id, 'implementation', e.target.value)
                            }
                            className="w-full mt-1 p-2 rounded bg-white/80 text-gray-900"
                          >
                            <option value="">-- Select Implementation --</option>
                            {lists.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.displayName}
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* Feasibility (Phase 8) */}
                        <label className="block mt-2">
                          <span className="text-sm">Feasibility (Phase 8)</span>
                          <select
                            value={proj.mapping.feasibility}
                            onChange={(e) =>
                              handleProjectMappingChange(proj.id, 'feasibility', e.target.value)
                            }
                            className="w-full mt-1 p-2 rounded bg-white/80 text-gray-900"
                          >
                            <option value="">-- Select Feasibility --</option>
                            {lists.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.displayName}
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* NEW CODE: Implementation Extra (Phase4) */}
                        <label className="block mt-2">
                          <span className="text-sm text-white">Implementation Extra (Phase 4) [Optional]</span>
                          <select
                            value={proj.mapping.implementationExtra || ""}
                            onChange={(e) =>
                              handleProjectMappingChange(proj.id, 'implementationExtra', e.target.value)
                            }
                            className="w-full mt-1 p-2 rounded bg-white/80 text-gray-900"
                          >
                            <option value="">-- Optional --</option>
                            {lists.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.displayName}
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* NEW CODE: Feasibility Extra (Phase8) */}
                        <label className="block mt-2">
                          <span className="text-sm text-white">Feasibility Extra (Phase 8) [Optional]</span>
                          <select
                            value={proj.mapping.feasibilityExtra || ""}
                            onChange={(e) =>
                              handleProjectMappingChange(proj.id, 'feasibilityExtra', e.target.value)
                            }
                            className="w-full mt-1 p-2 rounded bg-white/80 text-gray-900"
                          >
                            <option value="">-- Optional --</option>
                            {lists.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.displayName}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ))}

                    {/* Add new project */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Add a New Project</h4>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="p-2 rounded bg-white/80 text-gray-900"
                        >
                          <option value="">-- Choose a Project --</option>
                          {AVAILABLE_PROJECTS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.displayName}
                            </option>
                          ))}
                        </select>
                        {selectedProjectId && (
                          <img
                            src={AVAILABLE_PROJECTS.find((p) => p.id === selectedProjectId)?.logo}
                            alt="Selected Project"
                            className="w-10 h-10 object-contain"
                          />
                        )}
                        <button
                          onClick={addProjectFromDropdown}
                          className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "cars" && (
            <CarConfigurationComponent
              projects={projects}
              siteId={siteId}
            />
          )}

          {activeTab === "roles" && (
            <>
              <h2 className="text-2xl font-semibold">User Roles Configuration</h2>
              <form onSubmit={handleRoleAssignment} className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="email"
                    placeholder="User Email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full p-2 rounded bg-white/80 text-gray-900"
                    required
                  />
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="ml-2 p-2 rounded bg-white/80 text-gray-900"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Assign Role
                  </button>
                </div>
              </form>
              <div className="mt-4">
                <h3 className="text-xl font-medium">Assigned Roles</h3>
                <ul className="space-y-2">
                  {assignedRoles.map((role) => (
                    <li
                      key={role.email}
                      className="flex justify-between bg-white/20 p-2 rounded"
                    >
                      <span>{role.email}</span>
                      <span>{role.role}</span>
                      <button
                        onClick={() => removeRole(role.email)}
                        className="ml-4 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <button
            onClick={handleSave}
            className="mt-8 px-6 py-2 bg-[#1cb3d2] rounded-xl font-medium hover:opacity-90 transition"
          >
            Save Configuration
          </button>
          {message && <p className="mt-4 text-yellow-200">{message}</p>}
        </main>
      </div>
    </div>
  );
};

export default ConfigPage;
