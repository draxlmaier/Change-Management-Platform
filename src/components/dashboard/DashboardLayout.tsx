import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

interface IProject {
  id: string;               
  displayName: string;      
  logo?: string;            
  mapping: {
    feasibility: string;    
    implementation: string; 
  };
}

export default function DashboardLayout(): React.ReactElement {
  const [projects, setProjects] = useState<{ key: string; label: string; icon: React.ReactNode }[]>([]);

  useEffect(() => {
    const rawConfig = localStorage.getItem("cmConfigLists");
    if (rawConfig) {
      try {
        const config = JSON.parse(rawConfig);
        if (Array.isArray(config.projects)) {
          // Filter projects with both feasibility and implementation mappings
          const validProjects = config.projects.filter((project: IProject) => 
            project.mapping.feasibility && project.mapping.implementation
          );

          // Map projects to the format used in the component
          const mappedProjects = validProjects.map((project: IProject) => ({
            key: project.id.toLowerCase(), // Ensure the key is lowercase
            label: project.displayName,
            icon: project.logo ? 
              <img 
                src={project.logo} 
                alt={project.displayName} 
                className="h-16 w-auto"
              /> : null
          }));

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
          <img src="/assets/images/dashboard home.png" alt="Home" className="h-16 w-auto"/>
        </NavLink>
        
        {projects.map(({ key, label, icon }) => (
          <NavLink
            key={key}
            to={`/dashboard/${key}`} // Use the lowercase key for routing
            className={({ isActive }) => linkClass(isActive)}
          >
            <span className="h-24 w-auto">{icon}</span>
            {label}
          </NavLink>
        ))}

        <div className="mt-auto">
          <NavLink
            to="/dashboard/report"
            className={({ isActive }) => linkClass(isActive)}
          >
            <img src="/assets/images/report icon.png" alt="Report" className="h-16 w-auto"/>
          </NavLink>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
