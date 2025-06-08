// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import LoginPage                 from "./pages/LoginPage";
import LandingPage               from "./pages/LandingPage";
import ConfigPage                from "./pages/ConfigPage";
import ProjectSelection          from "./pages/ProjectSelection";
import PhaseSelectionPage        from "./pages/PhaseSelectionPage";
import ChangeItemsImplementation from "./pages/ChangeItemsImplementation";
import ChangeItemsFeasibility    from "./pages/ChangeItemsFeasibility";
import DetailsImplementation     from "./pages/DetailsImplementation";
import DetailsFeasibility        from "./pages/DetailsFeasibility";
import UpdateImplementation      from "./pages/UpdateImplementation";
import UpdateFeasibility         from "./pages/UpdateFeasibility";
import SendEmailPage             from "./pages/SendEmailPage";
import ExtractionMonitoring      from "./pages/ExtractionMonitoring";
import NotFoundPage              from "./pages/NotFoundPage";
import KPIInputPage              from "./pages/KPIInputPage";

import DashboardHome   from "./pages/DashboardHome";
import DashboardPage   from "./pages/DashboardPage";
import ReportPage      from "./pages/ReportPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";

import ChangeItemsFeasibilityExtra from "./pages/ChangeItemsFeasibilityExtra";
import ChangeItemsImplementationExtra from "./pages/ChangeItemsImplementationExtra";

const App: React.FC = () => (
  <Routes>
    {/* Auth & Landing */}
    <Route path="/" element={<LoginPage />} />
    <Route path="/landing" element={<LandingPage />} />

    {/* Configuration */}
    <Route path="/config" element={<ConfigPage />} />

    {/* Change management flow */}
    <Route path="/project-selection" element={<ProjectSelection />} />
    <Route path="/changes/:projectKey" element={<PhaseSelectionPage />} />
    <Route path="/changes/:projectKey/implementation" element={<ChangeItemsImplementation />} />
    <Route path="/details/:projectKey/implementation/:itemId" element={<DetailsImplementation />} />
    <Route path="/update/:projectKey/implementation/:itemId" element={<UpdateImplementation />} />
    <Route path="/changes/:projectKey/feasibility" element={<ChangeItemsFeasibility />} />
    <Route path="/details/:projectKey/feasibility/:itemId" element={<DetailsFeasibility />} />
    <Route path="/update/:projectKey/feasibility/:itemId" element={<UpdateFeasibility />} />
    <Route path="/send-email/:projectKey/:phase/:itemId" element={<SendEmailPage />} />

    {/* NEW routes for extra phases */}
    <Route path="/changes/:projectKey/feasibility-extra" element={<ChangeItemsFeasibilityExtra />} />
    <Route path="/changes/:projectKey/implementation-extra" element={<ChangeItemsImplementationExtra />} />

    {/* Extraction Monitoring */}
    <Route path="/extraction-monitoring" element={<ExtractionMonitoring />} />

    {/* Dashboard section */}
    <Route path="/dashboard/*" element={<DashboardLayout />}>  
      <Route index element={<DashboardHome />} />
      <Route path=":project" element={<DashboardPage />} />
      <Route path="report" element={<ReportPage />} />
    </Route>
    {/* …other routes */}
    <Route path="/kpis" element={<KPIInputPage/>} />

    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
