// File: src/layouts/DashboardLayout.tsx

import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { AVAILABLE_PROJECTS } from "../../constants/projects";

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: { implementation: string };
}

export default function DashboardLayout(): React.ReactElement {
  const [projects, setProjects] = useState<
    { key: string; label: string; icon: React.ReactNode }[]
  >([]);

  const draxLogo = require("../../assets/images/draxlmaeir slogan.png");

  useEffect(() => {
    const rawConfig = localStorage.getItem("cmConfigLists");
    if (!rawConfig) return;
    try {
      const config = JSON.parse(rawConfig);
      if (Array.isArray(config.projects)) {
        const mapped = config.projects
          .filter((p: IProject) => !!p.mapping.implementation)
          .map((project: IProject) => {
            const foundLogo =
              AVAILABLE_PROJECTS.find(
                (x) => x.id.toLowerCase() === project.id.toLowerCase()
              )?.logo ||
              AVAILABLE_PROJECTS.find((x) => x.id === "other")?.logo;
            return {
              key: project.id.toLowerCase(),
              label: project.displayName,
              icon: foundLogo ? (
                <img
                  src={foundLogo}
                  alt={project.displayName}
                  className="h-8 w-auto"
                />
              ) : null,
            };
          });

        if (mapped.length) {
          mapped.push({
            key: "draxlmaeir",
            label: "Draxlmaeir",
            icon: (
              <img
                src={draxLogo}
                alt="Draxlmaeir"
                className="h-8 w-auto"
              />
            ),
          });
        }

        setProjects(mapped);
      }
    } catch (e) {
      console.error("Parsing cmConfigLists failed:", e);
    }
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar: center all buttons */}
      <aside className="w-64 bg-[#0095B6] p-4 flex flex-col justify-center items-center space-y-4">

        {/* Project Buttons */}
        {projects.map(({ key, label, icon }) => (
          <NavLink
            key={key}
            to={`/dashboard/${key}`}
            className="group w-full h-16 bg-white/20 backdrop-blur-md rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-transform transform duration-300 ease-in-out flex items-center px-4"
          >
            {icon}
            <span className="ml-4 text-lg font-semibold text-white">
              {label}
            </span>
          </NavLink>
        ))}

        {/* Go to Tools Selection */}
        <NavLink
          to="/tool-selection"
          className="w-full h-16 bg-white/20 backdrop-blur-md rounded-xl shadow-lg hover:bg-white/30 hover:scale-105 transition-transform transform duration-300 ease-in-out flex items-center px-4"
        >
          <span className="ml-4 text-lg font-semibold text-white">
            Data Management
          </span>
        </NavLink>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
