import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import harnessBg from "../assets/images/harness-bg.png";
import { updateProjectMappingsFromSites } from "./projectMapping";
import { IProject } from "../services/configService";
import { getProjectLogo } from "../utils/getProjectLogo";  // ✅ centralized logo resolver

const LISTS_CONFIG_KEY = "cmConfigLists";

const ProjectSelection: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<IProject[]>([]);

  useEffect(() => {
    const refreshAndLoadProjects = async () => {
      await updateProjectMappingsFromSites();

      const raw = localStorage.getItem(LISTS_CONFIG_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.projects)) {
            setProjects(parsed.projects);  // ✅ no patching needed
          }
        } catch (err) {
          console.error("Failed to parse localStorage config:", err);
        }
      }
    };

    refreshAndLoadProjects();
  }, []);

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center overflow-hidden m-0 p-0"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate("/landing")}
        className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition m-4"
      >
        ← Back
      </button>

      {/* Page content */}
      <div className="relative z-20 flex flex-col items-center px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">
          Select a Project
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/changes/${proj.id}`)}
              className="cursor-pointer flex flex-col items-center space-y-4 p-6 bg-white/20 backdrop-blur-sm rounded-2xl shadow-md hover:bg-white/30 transition"
            >
              <img
                src={getProjectLogo(proj.id)}  // ✅ dynamic logo resolution
                alt={`${proj.displayName} logo`}
                className="h-24 w-auto"
              />
              <h2 className="text-xl font-semibold text-white">
                {proj.displayName}
              </h2>
              <p className="text-gray-200 text-sm">View changes →</p>
            </div>
          ))}

          {projects.length === 0 && (
            <p className="col-span-full text-center text-gray-300 mt-6">
              No projects found. Please add some in the Config Page first!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSelection;
