// File: ToolSelectionPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import cmp3dLogo from "../assets/images/change_management_platform_full2.png";
import draxlLogo from "../assets/images/draxlmaier-group.png";
import cmpIcon from "../assets/images/cmpIcon.png";
import dataToolIcon from "../assets/images/dataToolIcon.png";
import changeBtn from "../assets/images/cmplogoofficialnotext.png";
import dashBtn from "../assets/images/dashboard.png";
import kpiBtn from "../assets/images/kpis.png";
import harnessBg from "../assets/images/harness.png";
import settingsIc from "../assets/images/settings-icon.png";
import { getAccessToken } from "../auth/getToken";
import { msalInstance } from "../auth/msalInstance";
import { db } from "./db";
import { CarImage } from "./types";

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

interface cmConfigLists {
  siteId: string;
  questionsListId: string;
  monthlyListId: string;
  followCostListId: string;
  usersListId?: string;
  projects: IProject[];
}

const ToolSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [cars, setCars] = useState<CarImage[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken(msalInstance, ["User.Read"]);
      if (token) {
        const res = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = await res.json();
        setUserName(profile.displayName || "");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const carImages = await db.carImages.toArray();
      setCars(carImages);

      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) return;
      const config: cmConfigLists = JSON.parse(raw);
      setProjects(config.projects || []);
    })();
  }, []);

  const responsive = {
    superLargeDesktop: { breakpoint: { max: 4000, min: 3000 }, items: 5 },
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3 },
    tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
    mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
  };

  return (
    <div
      className="relative flex flex-col min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${harnessBg})` }}
    >
      <div className="absolute inset-0 backdrop-blur-sm z-0" />

      {/* Header */}
<header className="relative z-10 w-full h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-6">
  <img src={cmp3dLogo} alt="CMP" className="h-10" />
  <img src={draxlLogo} alt="Dräxlmaier" className="h-8" />
</header>

{/* Main Content */}
<main className="relative z-10 flex-1 flex flex-col items-center text-center px-4 pt-12 pb-14">
  {userName && (
    <div className="flex items-center gap-4 mb-8 text-white bg-black/30 p-4 rounded-xl">
      <div className="text-lg font-semibold">Welcome, {userName}!</div>
    </div>
  )}

  {/* Updated Button Section */}
  <div className="flex flex-wrap justify-center gap-10 mb-10">
    {[
      { img: dataToolIcon, label: "CMH Data Entry", route: "/data-extraction" },
      { img: kpiBtn, label: "KPIs Entry", route: "/kpis" },
      { img: dashBtn, label: "Dashboard", route: "/dashboard" },
      { img: settingsIc, label: "Settings", route: "/config" },
    ].map(({ img, label, route }) => (
      <button
        key={label}
        onClick={() => navigate(route)}
        className="w-72 h-72 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg hover:bg-white/30 hover:scale-105 transition transform duration-300 ease-in-out flex flex-col items-center justify-center text-white"
      >
        <img src={img} alt={label} className="h-36 w-36 mb-4 object-contain" />
        <span className="text-xl font-semibold">{label}</span>
      </button>
    ))}
  </div>

  {/* Carousel remains unchanged */}
  <div className="w-full">
    <Carousel responsive={responsive} infinite autoPlay autoPlaySpeed={3000}>
      {cars.map((car) => {
        const associatedProject = projects.find((p) => p.id === car.projectId);
        return (
          <div key={car.id} className="p-2 flex flex-col items-center">
            <div className="text-white font-semibold text-center mb-1">{car.name}</div>
            <img
              src={car.data}
              alt={car.name}
              style={{ width: "100%", height: "330px", objectFit: "contain" }}
            />
            <div className="mt-2 flex items-center gap-2 justify-center">
              {associatedProject?.logo && (
                <img
                  src={associatedProject.logo}
                  alt={associatedProject.displayName}
                  className="w-12 h-12 object-contain"
                />
              )}
              {car.carline && (
                <span className="text-white text-sm"> {car.carline}</span>
              )}
            </div>
          </div>
        );
      })}
    </Carousel>
  </div>
</main>
    </div>
  );
};

export default ToolSelectionPage;
