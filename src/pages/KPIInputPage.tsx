// File: src/pages/KPIInputPage.tsx

import React from "react";
import {Outlet} from "react-router-dom";
import harnessBg from "../assets/images/harness-bg.png";
import TopMenu from "../components/TopMenu";
import SidebarMenu from "../components/SidebarMenu";

const KPIInputPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-cover bg-center" style={{ backgroundImage: `url(${harnessBg})` }}>
      <TopMenu />
      {/* Sidebar */}
      <SidebarMenu />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 text-white">
        <div className="bg-white/10 border border-white/20 rounded-xl p-8 shadow-xl min-h-[80vh]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default KPIInputPage;
