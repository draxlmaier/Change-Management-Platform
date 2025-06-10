// src/pages/ConfigPage.tsx

import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import harnessBg from "../assets/images/harness-bg.png";
import { db } from "./db"; // for Dexie usage
import { CarImage } from "./types";
import CarConfigurationComponent from "./CarConfigurationComponent";
import { AVAILABLE_PROJECTS } from "../constants/projects";
import { msalInstance } from "../auth/msalInstance";
import { getAccessToken } from "../auth/getToken";
import { getConfig, saveConfig, cmConfigLists, IProject } from "../services/configService";


const ConfigPage: React.FC = () => {
  const navigate = useNavigate();

  // Basic states
  const [siteName, setSiteName] = useState("");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [lists, setLists] = useState<{ id: string; displayName: string }[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Frequent sites
  const [frequentSites, setFrequentSites] = useState<string[]>([]);

  // KPI Lists
  const [questionsListId, setQuestionsListId] = useState("");
  const [monthlyListId, setMonthlyListId] = useState("");
  const [followCostListId, setFollowCostListId] = useState("");

  // Projects
  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Roles
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [assignedRoles, setAssignedRoles] = useState<{ email: string; role: string }[]>([]);

  // Dexie-based car images
  const [carList, setCarList] = useState<CarImage[]>([]);

  // Track which tab is active: "lists", "cars", or "roles"
  const [activeTab, setActiveTab] = useState<"lists" | "cars" | "roles">("lists");


  const [editCarId, setEditCarId] = useState<number | null>(null);
const [editCarName, setEditCarName] = useState("");



  const handleDeleteCar = async (carId: number) => {
  await db.carImages.delete(carId);
  loadCarList(); // refresh
};

const handleEditCar = (car: CarImage) => {
  setEditCarId(car.id || null);
  setEditCarName(car.name || "");
};

const handleSaveCarName = async () => {
  if (!editCarId) return;
  await db.carImages.update(editCarId, { name: editCarName });
  setEditCarId(null);
  setEditCarName("");
  loadCarList(); // refresh
};

  // 1) Load config from localStorage on mount, plus load Dexie cars
 useEffect(() => {
  const savedSite = localStorage.getItem("sharepointSite");
  if (savedSite) setSiteName(savedSite);

  try {
    const cfg = getConfig();
    setSiteId(cfg.siteId || null);
    setQuestionsListId(cfg.questionsListId || "");
    setMonthlyListId(cfg.monthlyListId || "");
    setFollowCostListId(cfg.followCostListId || "");
    setProjects(cfg.projects || []);
    setAssignedRoles(cfg.assignedRoles || []);
    setFrequentSites(cfg.frequentSites || []);
  } catch (err) {
    console.error("Failed to load config:", err);
  }

  loadCarList();
}, []);


  const loadCarList = async () => {
    const allCars = await db.carImages.toArray();
    setCarList(allCars);
  };

  // 2) Site lookup
    const handleSiteLookup = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingLists(true);
    setMessage(null);

    try {
      const account = msalInstance.getActiveAccount();
      if (!account) throw new Error("No signed-in account. Please log in.");
      const token = await getAccessToken(msalInstance, ["https://graph.microsoft.com/Sites.Read.All"]);
      if (!token) throw new Error("No token");

      const url = new URL(siteName);
      const path = `${url.hostname}:${url.pathname}:`;
      const siteResp = await axios.get(`https://graph.microsoft.com/v1.0/sites/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSiteId(siteResp.data.id);

      const listsResp = await axios.get(
        `https://graph.microsoft.com/v1.0/sites/${siteResp.data.id}/lists`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLists(listsResp.data.value);

      const regex = /^changes_([a-zA-Z0-9]+)_phase(4|8)(extra)?$/i;
      const newProjectsMap: { [key: string]: IProject } = {};

      listsResp.data.value.forEach((list: any) => {
        const match = regex.exec(list.displayName);
        if (!match) return;
        const [_, rawProjectName, phase, isExtra] = match;
        const projectId = rawProjectName.toLowerCase();
        const existing = newProjectsMap[projectId] || projects.find(p => p.id === projectId);

        const updatedProject: IProject = existing
          ? { ...existing }
          : {
              id: projectId,
              displayName: rawProjectName,
              mapping: {
                feasibility: "",
                implementation: "",
                feasibilityExtra: "",
                implementationExtra: "",
              },
            };

        if (phase === "4" && isExtra) updatedProject.mapping.feasibilityExtra = list.id;
        else if (phase === "4") updatedProject.mapping.feasibility = list.id;
        else if (phase === "8" && isExtra) updatedProject.mapping.implementationExtra = list.id;
        else if (phase === "8") updatedProject.mapping.implementation = list.id;

        newProjectsMap[projectId] = updatedProject;
      });

      const finalProjects = Object.values(newProjectsMap);
      setProjects(finalProjects);

      // ✅ Auto-save to localStorage
      const newConfig: cmConfigLists = {
        siteId: siteResp.data.id,
        questionsListId,
        monthlyListId,
        followCostListId,
        projects: finalProjects,
        assignedRoles,
        frequentSites: [...new Set([...frequentSites, siteName])],
      };
      saveConfig(newConfig);


      // Add site to frequent list
      if (!frequentSites.includes(siteName)) {
        setFrequentSites((prev) => [...prev, siteName]);
        setMessage(`Added ${siteName} to frequently used sites.`);
      } else {
        setMessage(`${siteName} is already in your frequently used sites.`);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error?.message || err.message);
    } finally {
      setLoadingLists(false);
    }
  };
  // 3) Roles
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
    setMessage(`Role '${userRole}' assigned to ${userEmail} successfully!`);
  };
  const removeRole = (email: string) => {
    setAssignedRoles((prev) => prev.filter((r) => r.email !== email));
  };

  // 4) Projects
  const addProjectFromDropdown = () => {
    if (!selectedProjectId) {
      setMessage("Please select a project from the dropdown.");
      return;
    }
    const existing = projects.find((p) => p.id === selectedProjectId.toLowerCase());
    if (existing) {
      setMessage(`Project '${existing.displayName}' is already added.`);
      return;
    }
    const chosen = AVAILABLE_PROJECTS.find((p) => p.id === selectedProjectId.toLowerCase());
    if (!chosen) {
      setMessage("Selected project not found in AVAILABLE_PROJECTS.");
      return;
    }
    const newProject: IProject = {
      id: chosen.id,
      displayName: chosen.displayName,
      logo: chosen.logo,
      mapping: {
        feasibility: "",
        implementation: "",
        feasibilityExtra: "",
        implementationExtra: "",
      },
    };
    setProjects((prev) => [...prev, newProject]);
    setSelectedProjectId("");
    setMessage(null);
  };
  const removeProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };
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
              mapping: { ...proj.mapping, [field]: value },
            }
          : proj
      )
    );
  };

  // 5) Save entire config to localStorage
  const handleSave = () => {
  if (!questionsListId || !monthlyListId || !followCostListId) {
    setMessage("Please select all KPI lists.");
    return;
  }

  for (const proj of projects) {
    const hasFeasibility = proj.mapping.feasibility || proj.mapping.feasibilityExtra;
    const hasImplementation = proj.mapping.implementation || proj.mapping.implementationExtra;
    if (!hasFeasibility && !hasImplementation) {
      setMessage(`Project "${proj.displayName}" must have at least one mapped list (feasibility or implementation).`);
      return;
    }
  }

  const newConfig: cmConfigLists = {
    siteId: siteId || "",
    questionsListId,
    monthlyListId,
    followCostListId,
    projects,
    assignedRoles,
    frequentSites,
  };

  saveConfig(newConfig);
  setMessage("Configuration saved successfully!");
};

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

        <main className="flex-1 p-8 space-y-6 text-white">
          {/* TAB:  lists */}
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
                      {frequentSites.map((site, i) => (
                        <option key={i} value={site}>
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
                          <span className="text-sm">Implementation (Phase 8)</span>
                          <select
                            value={proj.mapping.implementation}
                            onChange={(e) =>
                              handleProjectMappingChange(proj.id, "implementation", e.target.value)
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
                          <span className="text-sm">Feasibility (Phase 4)</span>
                          <select
                            value={proj.mapping.feasibility}
                            onChange={(e) =>
                              handleProjectMappingChange(proj.id, "feasibility", e.target.value)
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

                        {/* Implementation Extra */}
                        <label className="block mt-2">
                          <span className="text-sm">
                            Implementation Extra (Phase 8) [Optional]
                          </span>
                          <select
                            value={proj.mapping.implementationExtra || ""}
                            onChange={(e) =>
                              handleProjectMappingChange(proj.id, "implementationExtra", e.target.value)
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

                        {/* Feasibility Extra */}
                        <label className="block mt-2">
                          <span className="text-sm">
                            Feasibility Extra (Phase 4) [Optional]
                          </span>
                          <select
                            value={proj.mapping.feasibilityExtra || ""}
                            onChange={(e) =>
                              handleProjectMappingChange(proj.id, "feasibilityExtra", e.target.value)
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
                            src={
                              AVAILABLE_PROJECTS.find((p) => p.id === selectedProjectId)?.logo || ""
                            }
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

          {/* TAB: cars */}
          {activeTab === "cars" && (
            <CarConfigurationComponent
              projects={projects}
              siteId={siteId}
            />
          )}
          <div className="space-y-6">
    {/* A) RE-USE the CarConfigurationComponent for uploading new cars */}

    <hr className="my-6 border-gray-600" />

    {/* B) Manage Existing Cars */}
    <h2 className="text-2xl font-semibold">Manage Existing Cars</h2>
    {carList.length === 0 ? (
      <p>No car images saved yet.</p>
    ) : (
      <div className="grid grid-cols-2 gap-4">
        {carList.map((car) => (
          <div key={car.id} className="bg-white/20 p-4 rounded space-y-3">
            {/* Example: display car’s project */}
            <div className="flex justify-between items-center">
              {projects
                .filter((p) => p.id === car.projectId)
                .map((proj) => (
                  <div key={proj.id} className="flex items-center gap-2">
                    {proj.logo && (
                      <img
                        src={proj.logo}
                        alt={proj.displayName}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <span>{proj.displayName}</span>
                  </div>
                ))}

              <button
                onClick={() => handleDeleteCar(car.id!)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>

            {/* Car image */}
            <img
              src={car.data}
              alt={car.name || "Car"}
              className="w-full h-32 object-contain bg-white/10 rounded"
            />

            {/* Edit or display car name */}
            {editCarId === car.id ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={editCarName}
                  onChange={(e) => setEditCarName(e.target.value)}
                  className="flex-1 p-2 rounded bg-white/80 text-gray-900"
                />
                <button
                  onClick={handleSaveCarName}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="font-medium">{car.name || `Car_${car.id}`}</p>
                <button
                  onClick={() => handleEditCar(car)}
                  className="text-sm text-blue-300 hover:underline"
                >
                  Edit
                </button>
              </div>
            )}

            {/* Display carline if you’ve stored it */}
            {car.carline && (
              <p className="text-sm bg-white/10 p-2 rounded">
                Carline: {car.carline}
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>

          {/* TAB: roles */}
          {activeTab === "roles" && (
            <>
              <h2 className="text-2xl font-semibold">User Roles Configuration</h2>
              <form onSubmit={handleRoleAssignment} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="email"
                    placeholder="User Email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="p-2 rounded bg-white/80 text-gray-900"
                    required
                  />
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="p-2 rounded bg-white/80 text-gray-900"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
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
                      className="flex justify-between items-center bg-white/20 p-2 rounded"
                    >
                      <span>
                        {role.email} - {role.role}
                      </span>
                      <button
                        onClick={() => removeRole(role.email)}
                        className="px-2 py-1 text-red-500 hover:text-red-700"
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
