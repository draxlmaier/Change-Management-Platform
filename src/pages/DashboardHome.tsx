// File: src/pages/DashboardHome.tsx

import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../auth/getToken';
import { msalInstance } from '../auth/msalInstance';
import harnessBg from '../assets/images/harness.png';
import cmp3dLogo from '../assets/images/change_management_platform_full2.png';
import draxlLogo from '../assets/images/draxlmaier-group.png';
import TopMenu from '../components/TopMenu';
import Footer from '../components/Footer';

const DashboardHome: React.FC = () => {
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    (async () => {
      const token = await getAccessToken(msalInstance, ['User.Read']);
      if (token) {
        const res = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = await res.json();
        setUserName(profile.displayName || '');
      }
    })();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="relative z-20 w-full h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-6">
        <div className="w-1/3" />
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <img src={cmp3dLogo} alt="CMP" className="h-10" />
        </div>
        <div className="w-1/3 flex justify-end">
          <img src={draxlLogo} alt="Dräxlmaier" className="h-8" />
        </div>
      </header>

      <div
        className="relative flex flex-1 bg-cover bg-center"
        style={{ backgroundImage: `url(${harnessBg})` }}
      >
        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          {/* Draxlmaier Logo Card */}
            <div className="cursor-pointer w-64 h-64 flex flex-col items-center justify-center space-y-2 p-6 mb-6 bg-white/20 backdrop-blur-sm rounded-2xl shadow-md hover:bg-white/30 transition">
            <img
              src={draxlLogo}
              alt="Main Banner"
              className="w-32 h-32 object-contain"
            />
          </div>

           {/* Dashboard Intro */}
          <div className="max-w-lg w-full bg-white/20 backdrop-blur-md p-10 rounded-2xl shadow-xl text-center space-y-8">
            <h1 className="text-2xl font-normal text-white">
              {`Welcome to the Dashboard${userName ? `, ${userName}!` : ''}`}
            </h1>
            <p className="text-lg text-white opacity-80">
              Select a project from the side menu to view its metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default DashboardHome;
