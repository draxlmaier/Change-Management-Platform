// LandingPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import axios from "axios";
import { msalInstance } from "../auth/msalInstance";

import harnessBg from "../assets/images/harness.png";
import cmp3dLogo from "../assets/images/change_management_platform_full2.png";
import draxlLogo from "../assets/images/draxlmaier-group.png";
import settingsIc from "../assets/images/settings-icon.png";
import changeBtn from "../assets/images/cmplogoofficialnotext.png";
import dashBtn from "../assets/images/dashboard.png";
import kpiBtn from "../assets/images/kpis.png";
import Footer from "../components/Footer";

import { CarImage } from "./types";
import { db } from "./db";
import { getAccessToken } from "../auth/getToken";

import HeaderWithBack from "../components/HeaderWithBack";
import { ArrowLeftIcon } from "lucide-react";

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
  assignedRoles?: { email: string; role: string }[];
  frequentSites?: string[];
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [cars, setCars] = useState<CarImage[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);

  // Load cars from Dexie, load the config from localStorage
  useEffect(() => {
    (async () => {
      // 1. Load all car images
      const carImages = await db.carImages.toArray();
      setCars(carImages);

      // 2. Load config from localStorage to get the list of projects
      const raw = localStorage.getItem("cmConfigLists");
      if (!raw) return;
      const config: cmConfigLists = JSON.parse(raw);
      setProjects(config.projects || []);
    })();
  }, []);

  // Fetch user display name from Microsoft Graph (if desired)
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken(msalInstance,["User.Read"]);
        if (!token) return;
        const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = await profileRes.json();
        setUserName(profile.displayName || "");
      } catch (err) {
        console.error("Error loading user data", err);
      }
    })();
  }, []);

  // Carousel responsive config
  const responsive = {
    superLargeDesktop: { breakpoint: { max: 4000, min: 3000 }, items: 5 },
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3 },
    tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
    mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        backgroundImage: `url(${harnessBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header */}
     <header className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md z-20 flex items-center justify-between px-6">
      {/* Left: Back */}
      <button onClick={() => navigate("/tool-selection")} className="flex items-center gap-1 hover:opacity-80">
        <ArrowLeftIcon className="h-5 w-5 text-black" />
        <span className="text-black font-medium">Back</span>
      </button>

      {/* Center: CMP Logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <img src={cmp3dLogo} alt="Change Management Platform" className="h-10" />
      </div>

      {/* Right: Config + Draxlmaier Logo */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/config")} className="hover:opacity-80">
          <img src={settingsIc} alt="Config" className="h-6 w-6" />
        </button>
        <img src={draxlLogo} alt="Dräxlmaier" className="h-8" />
      </div>
    </header>


      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-14">
        {userName && (
          <div className="flex items-center gap-4 mb-6 text-white bg-black/30 p-4 rounded-xl">
            <div className="text-lg font-semibold">Welcome, {userName}!</div>
          </div>
        )}

        {/* Example Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {[
            { img: changeBtn, label: "Projects", route: "/project-selection" },
            { img: dashBtn, label: "Dashboard", route: "/dashboard" },
            { img: kpiBtn, label: "KPIs", route: "/kpis" },
          ].map(({ img, label, route }) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              className="
                cursor-pointer
                w-72
                bg-white/30
                backdrop-blur-md
                rounded-xl
                py-10
                flex flex-col items-center justify-center
                hover:bg-white/40
                transition
              "
            >
              <img src={img} alt={label} className="h-32 w-32 mb-4" />
              <span className="text-2xl font-semibold text-white">{label}</span>
            </button>
          ))}
        </div>

        {/* Car Carousel */}
        <div className="w-full mt-10">
          <Carousel responsive={responsive} infinite autoPlay autoPlaySpeed={3000}>
            {cars.map((car) => {
              // Find the project for this car
              const associatedProject = projects.find((p) => p.id === car.projectId);

              return (
                <div key={car.id} className="p-2 flex flex-col items-center">
                  {/* Car Name at the top */}
                  <div className="text-white font-semibold text-center mb-1">
                    {car.name}
                  </div>

                  {/* Car Image */}
                  <img
                    src={car.data}
                    alt={car.name}
                    style={{ width: "100%", height: "330px", objectFit: "contain" }}
                  />

                  {/* Project’s Logo & Carline together */}
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

      <Footer />
    </div>
  );
};

export default LandingPage;
