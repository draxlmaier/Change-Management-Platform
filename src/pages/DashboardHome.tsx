import React from "react";
import { useNavigate } from "react-router-dom";
import TopMenu from "../components/TopMenu";

export default function DashboardHome() {
  const navigate = useNavigate();


  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-teal-700 to-teal-900 text-white">
      <TopMenu />
      <div className="text-center space-y-8 p-8 rounded-lg bg-black/20 backdrop-blur-md">
        <h1 className="text-5xl font-extrabold">Welcome to the Dashboard</h1>
        <p className="text-lg opacity-80">
          Select a project from the side menu to view its metrics.
        </p>
        <button
          onClick={() => navigate("/tool-selection")}
          className="mt-4 px-8 py-3 bg-white text-teal-900 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
        >
          ← Return to Landing Page
        </button>
      </div>
    </div>
  );
}
