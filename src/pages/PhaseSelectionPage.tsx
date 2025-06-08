import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Adjust file paths for your images:
import harnessBg from "../assets/images/harness-bg.png";

// The two phase buttons
import feasibilityBtn from "../assets/images/implementation.png";
import implementationBtn from "../assets/images/feasability2.png";

interface IProject {
  id: string;
  displayName: string;
  logo?: string;    
}

// Match the localStorage key used by your Config page
const LISTS_CONFIG_KEY = "cmConfigLists";

const PhaseSelectionPage: React.FC = () => {
  const [project, setProject] = useState<IProject | null>(null);
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!projectKey) return;

    const raw = localStorage.getItem(LISTS_CONFIG_KEY);
    if (raw) {
      try {
        const config = JSON.parse(raw);
        if (Array.isArray(config.projects)) {
          // find the project whose key matches the route
          const found = config.projects.find(
            (p: IProject) => p.id === projectKey
          );
          if (found) {
            setProject(found);
          }
        }
      } catch (err) {
        console.error("Error parsing config from localStorage:", err);
      }
    }
  }, [projectKey]);

  // If no matching project or param is missing, show fallback
  if (!projectKey || !project) {
    return (
      <div
        className="relative w-full min-h-screen bg-cover bg-center flex flex-col items-center justify-center text-white"
        style={{ backgroundImage: `url(${harnessBg})` }}
      >
        <button
          onClick={() => navigate("/project-selection")}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Back to Projects
        </button>
        <p className="text-2xl">
          Unable to find that project. Please select a valid project.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      {/* back button */}
      <div className="p-4">
        <button
          onClick={() => navigate("/project-selection")}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Back to Projects
        </button>
      </div>

      {/* content */}
      <div className="flex flex-col items-center justify-center text-center space-y-10 px-4">
        {/* Optional: the project's logo */}
        {project.logo && (
          <img
            src={project.logo}
            alt={`${project.displayName} logo`}
            className="h-24 sm:h-32 mt-8 object-contain"
          />
        )}

        <h1 className="text-3xl sm:text-4xl font-bold text-white mt-4">
          Choose Phase for <span className="uppercase">{project.displayName}</span>
        </h1>

        {/* Two clickable "phase" boxes */}
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {[
            {
              src: implementationBtn,
              alt: "Implementation",
              label: "Feasibility",
              route: `/changes/${project.id}/implementation`,
            },
            {
              src: feasibilityBtn,
              alt: "Feasibility",
              label: "Implementation",
              route: `/changes/${project.id}/feasibility`,
            },
          ].map((btn, i) => (
            <div
              key={i} // fix "unique key" warning by using i or something else unique
              onClick={() => navigate(btn.route)}
              className="
                flex flex-col items-center justify-center
                w-56 sm:w-80
                p-10
                bg-[#1cb3d2]/30 
                backdrop-blur-md
                rounded-2xl
                cursor-pointer
                hover:scale-105
                transition-transform
              "
            >
              <img src={btn.src} alt={btn.alt} className="h-24 sm:h-32 mb-6" />
              <span className="text-white text-lg font-semibold">
                {btn.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhaseSelectionPage;
