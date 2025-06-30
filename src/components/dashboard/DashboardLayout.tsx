import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { AVAILABLE_PROJECTS } from "../../constants/projects";

interface IProject {
  id: string;
  displayName: string;
  logo?: string;
  mapping: {
    implementation: string;
  };
}

export default function DashboardLayout(): React.ReactElement {
  const [projects, setProjects] = useState<{ key: string; label: string; icon: React.ReactNode }[]>([]);

  const draxLogo = require("../../assets/images/draxlmaeir slogan.png");

  useEffect(() => {
    const rawConfig = localStorage.getItem("cmConfigLists");
    if (rawConfig) {
      try {
        const config = JSON.parse(rawConfig);
        if (Array.isArray(config.projects)) {
          const validProjects = config.projects.filter((project: IProject) =>
             !!project.mapping.implementation
          );

          const mappedProjects = validProjects.map((project: IProject) => {
            const resolvedLogo =
              AVAILABLE_PROJECTS.find(p => p.id.toLowerCase() === project.id.toLowerCase())?.logo ||
              AVAILABLE_PROJECTS.find(p => p.id === "other")?.logo;

            return {
              key: project.id.toLowerCase(),
              label: project.displayName,
              icon: resolvedLogo ? (
                <img src={resolvedLogo} alt={project.displayName} className="h-16 w-auto" />
              ) : null,
            };
          });

          if (mappedProjects.length > 0) {
            mappedProjects.push({
              key: "draxlmaeir",
              label: "Draxlmaeir",
              icon: <img src={draxLogo} alt="Draxlmaeir" className="h-16 w-auto" />,
            });
          }

          setProjects(mappedProjects);
        }
      } catch (err) {
        console.error("Error parsing config:", err);
      }
    }
  }, []);

  const linkClass = (isActive: boolean) =>
    `flex items-center mb-2 px-3 py-2 rounded ${
      isActive ? "bg-gray-700" : "hover:bg-gray-700"
    }`;

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-[#0095B6] text-gray-100 p-4 flex flex-col">
        <NavLink to="/dashboard" end className={({ isActive }) => linkClass(isActive)}>
          <img src={require("../../assets/images/dashboard.png")} alt="Home" className="h-16 w-auto" />
        </NavLink>

        {projects.map(({ key, label, icon }) => (
          <NavLink
            key={key}
            to={`/dashboard/${key}`}
            className={({ isActive }) => linkClass(isActive)}
          >
            <span className="h-24 w-auto">{icon}</span>
          </NavLink>
        ))}
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
