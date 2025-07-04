// File: src/pages/DashboardPage.tsx

import React from "react";
import TopMenu from "../components/TopMenu";
import ChangesDashboard from "../components/dashboard/ChangesDashboard";
// ^ Make sure the import path is correct

export default function DashboardPage() {
  return (
    
    <div style={{ padding: 20 }}>
      <TopMenu />
      <ChangesDashboard />
    </div>
  );
}
