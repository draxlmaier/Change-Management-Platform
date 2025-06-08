import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import harnessBg from "../assets/images/harness.png";
import cmp3dLogo from "../assets/images/change_management_platform_full2.png";
import draxlLogo from "../assets/images/draxlmaier-group.png";
import settingsIc from "../assets/images/settings-icon.png";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import changeBtn from "../assets/images/cmplogoofficialnotext.png";
import dashBtn from "../assets/images/dashboard.png";
import kpiBtn from "../assets/images/kpis.png";
import { useMsal } from "@azure/msal-react";
import { CarImage } from "./types"; // Ensure this is correctly pointing to your types file
import { db } from "./db"; // Ensure your Dexie DB setup is exported from here

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const [userName, setUserName] = useState("");
  const [cars, setCars] = useState<CarImage[]>([]);

  useEffect(() => {
    const loadIndexedDBImages = async () => {
      const carImages = await db.carImages.toArray();
      setCars(carImages || []);
    };
    loadIndexedDBImages();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (accounts.length === 0) return;
      const account = accounts[0];
      try {
        const response = await instance.acquireTokenSilent({
          scopes: ["User.Read"],
          account,
        });
        const accessToken = response.accessToken;
        const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = await profileRes.json();
        setUserName(profile.displayName || "");
      } catch (err) {
        console.error("Error loading user data", err);
      }
    };
    fetchUserProfile();
  }, [accounts, instance]);

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
      <header className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md z-20 flex items-center justify-between px-6">
        <button onClick={() => navigate("/config")} className="p-2 hover:opacity-80">
          <img src={settingsIc} alt="Config" className="h-6 w-6" />
        </button>
        <img src={cmp3dLogo} alt="Change Management Platform" className="h-10" />
        <img src={draxlLogo} alt="Dräxlmaier" className="h-8" />
      </header>

      <main className="flex-1 overflow-y-auto relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-14">
        {userName && (
          <div className="flex items-center gap-4 mb-6 text-white bg-black/30 p-4 rounded-xl">
            <div className="text-lg font-semibold">Welcome, {userName}!</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {[
            { img: changeBtn, label: "Change Management", route: "/project-selection" },
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

        {/* Carousel for user-uploaded images */}
        <div className="w-full mt-10">
          <Carousel responsive={responsive} infinite autoPlay autoPlaySpeed={3000}>
            {cars.map((carImage, index) => (
              <div key={carImage.id ?? index} className="p-2">
                <img
                  src={carImage.data}
                  alt={carImage.name || `Car ${index + 2}`}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
                <div className="mt-2 text-white font-semibold text-center">
                  {carImage.name || `Car ${index + 2}`}
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
