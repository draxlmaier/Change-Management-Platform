import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import harnessBg from "../assets/images/harness-bg.png";
import { updateProjectMappingsFromSites } from "./projectMapping";
import { IProject } from "../services/configService";
import { getProjectLogo } from "../utils/getProjectLogo";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import TopMenu from "../components/TopMenu";
import { db } from "./db"; // if you have a local DB with carImages
import { CarImage } from "./types"; // adjust path if needed
import Carousel from "react-multi-carousel";



const LISTS_CONFIG_KEY = "cmConfigLists";

const ProjectSelection: React.FC = () => {
  
  const [cars, setCars] = useState<CarImage[]>([]);

useEffect(() => {
  (async () => {
    const carImages = await db.carImages.toArray();
    setCars(carImages);
  })();
}, []);
  const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 3000 }, items: 5 },
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};

  const navigate = useNavigate();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshAndLoadProjects = async () => {
      try {
        // 1. Get Microsoft Graph API token
        const token = await getAccessToken(msalInstance, [
          "https://graph.microsoft.com/Sites.Read.All",
        ]);
        if (!token) {
          console.warn("Access token unavailable — user not authenticated?");
          return;
        }

        // 2. Update project mappings using the token
        await updateProjectMappingsFromSites(token);

        // 3. Load updated config from localStorage
        const raw = localStorage.getItem(LISTS_CONFIG_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.projects)) {
            setProjects(parsed.projects);
          } else {
            setProjects([]);
            console.warn("No valid projects found in config.");
          }
        } else {
          setProjects([]);
          console.warn("No config found in localStorage.");
        }
      } catch (err) {
        setProjects([]);
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    };

    refreshAndLoadProjects();
  }, []);

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        style={{ backgroundImage: `url(${harnessBg})` }}
      >
        <p className="text-white text-lg">Loading projects...</p>
      </div>
    );
  }

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
              <h2 className="text-xl font-semibold text-white">
                {proj.displayName}
              </h2>
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
      </div>
      <Carousel responsive={responsive} infinite autoPlay autoPlaySpeed={3000}>
  {cars.map((car) => {
    const associatedProject = projects.find((p) => p.id === car.projectId);
    return (
      <div key={car.id} className="p-4 flex flex-col items-center">
        {/* Car name */}
        <div className="text-white font-bold text-2xl text-center mb-4 drop-shadow-lg">
          {car.name}
        </div>
        {/* Car image */}
        <img
          src={car.data}
          alt={car.name}
          style={{ width: "100%", height: "330px", objectFit: "contain" }}
        />
        {/* Logo + carline */}
        <div className="mt-4 flex items-center gap-3 justify-center">
          {associatedProject?.logo && (
            <img
              src={associatedProject.logo}
              alt={associatedProject.displayName}
              className="w-28 h-28 object-contain drop-shadow"
            />
          )}
          {car.carline && (
            <span className="text-white text-lg font-medium drop-shadow">
              {car.carline}
            </span>
          )}
        </div>
      </div>
    );
  })}
</Carousel>

    </div>
  );
};

export default ProjectSelection;
