import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import harnessBg from "../assets/images/harness-bg.png";
import { IProject } from "../services/configService";
import { getProjectLogo } from "../utils/getProjectLogo";
import TopMenu from "../components/TopMenu";

const LISTS_CONFIG_KEY = "cmConfigLists";

const ProjectSelection: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjectsFromLocalStorage = () => {
      try {
        const raw = localStorage.getItem(LISTS_CONFIG_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.projects)) {
            setProjects(parsed.projects);
          } else {
            console.warn("No valid projects found in config.");
          }
        } else {
          console.warn("No config found in localStorage.");
        }
      } catch (err) {
        console.error("Failed to parse localStorage config:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProjectsFromLocalStorage();
  }, []);

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center overflow-hidden m-0 p-0"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <TopMenu />
      {/* Back button */}
      <button
        onClick={() => navigate("/tool-selection")}
        className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-2xl shadow-md text-white text-sm transition m-4"
      >
        ← Back
      </button>

      <div className="relative z-20 flex flex-col items-center px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">
          Select a Project
        </h1>

        {loading ? (
          <p className="text-white text-lg">Loading projects...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
  {projects.map((proj) => (
    <div
      key={proj.id}
      onClick={() => navigate(`/changes/${proj.id}`)}
      className="group cursor-pointer flex flex-col items-center justify-center space-y-3 px-6 py-8 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg hover:bg-white/30 hover:scale-105 transition transform duration-300 ease-in-out"
    >
      <img
        src={getProjectLogo(proj.id)}
        alt={`${proj.displayName} logo`}
        className="h-20 w-auto object-contain"
      />
      <h2 className="text-xl font-semibold text-white">{proj.displayName}</h2>
      <p className="text-gray-200 text-sm">View changes →</p>

      {/* Hover underline */}
      <span className="h-1 w-12 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
    </div>
  ))}

  {projects.length === 0 && (
    <p className="col-span-full text-center text-gray-300 mt-6">
      No projects found. Please add some in the Config Page first!
    </p>
  )}
</div>

        )}
      </div>
    </div>
  );
};

export default ProjectSelection;
