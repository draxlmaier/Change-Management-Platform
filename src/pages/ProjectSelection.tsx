// src/pages/ProjectSelection.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import harnessBg from "../assets/images/harness-bg.png";

/** 
 * Match whatever interface or shape you're saving in localStorage.
 * For instance, if your ConfigPage pushes objects like:
 * { key: "audi", title: "Audi", logo: "/some/path/Audi.png" }
 */
interface IProject {
  id: string;
  displayName: string;
  logo?: string;
}

// The key under which your Config page saves data.
const LISTS_CONFIG_KEY = "cmConfigLists";

const ProjectSelection: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<IProject[]>([]);

  // 1) Load projects from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        // If you're storing an entire config object, parse that first:
        const config = JSON.parse(raw);
        // E.g. config might have { projects: [{ key, title, logo }, ...], ... }
        if (Array.isArray(config.projects)) {
          setProjects(config.projects);
        }
      } catch (err) {
        console.error("Error parsing projects from localStorage:", err);
      }
    }
  }, []);

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate("/landing")}
        className="self-start mb-4 ml-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        ← Back
      </button>

      {/* Page content */}
      <div className="relative z-20 flex flex-col items-center px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">
          Select a Project
        </h1>

        {/* Dynamically render project cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/changes/${proj.id}`)}
              className="cursor-pointer flex flex-col items-center space-y-4 p-6 bg-white/20 backdrop-blur-sm rounded-2xl shadow-md hover:bg-white/30 transition"
            >
              <img
                src={proj.logo}
                alt={`${proj.displayName} logo`}
                className="h-24 w-auto"
              />
              <h2 className="text-xl font-semibold text-white">
                {proj.displayName}
              </h2>
              <p className="text-gray-200 text-sm">View changes →</p>
            </div>
          ))}

          {/* If no projects found */}
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
