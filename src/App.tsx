// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage                 from "./pages/LoginPage";
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
import NotFoundPage              from "./pages/NotFoundPage";
import KPIInputPage              from "./pages/KPIInputPage";

import DashboardHome   from "./pages/DashboardHome";
import DashboardPage   from "./pages/DashboardPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";

import ChangeItemsFeasibilityExtra from "./pages/ChangeItemsFeasibilityExtra";
import ChangeItemsImplementationExtra from "./pages/ChangeItemsImplementationExtra";
import AddQuestionPage from "./pages/AddQuestionPage";
import EditQuestionPage from "./pages/EditQuestionPage";
import ScrapFollowingSection from "./pages/ScrapFollowingSection";
import FollowCostKPIEditor from "./pages/FollowCostKPIEditor";

import ToolSelectionPage from "./pages/ToolSelectionPage";
import SharePointUploaderPage from "./pages/SharePointUploaderPage"; // assuming this exists

import AdminUserManager from "./pages/AdminUserManager";
import DRXKPIInput from "./components/dashboard/DRXKPIInput";
import DowntimeKPIInput from "./components/dashboard/DowntimeKPIInput";
import BudgetKPIInput from "./components/dashboard/BudgetKPIInput";
import FollowUpKPIInput from "./components/dashboard/FollowUpKPIInput";

import DRXKPIEditor from "./pages/DRXKPIEditor";
import DowntimeKPIEditor from "./pages/DowntimeKPIEditor";
import BudgetKPIEditor from "./pages/BudgetKPIEditor";

const App: React.FC = () => (
  <Routes>
    {/* Auth & Landing */}
    <Route index element={<LoginPage />} />
    <Route path="/tool-selection" element={<ToolSelectionPage />} />
    <Route path="/data-extraction" element={<SharePointUploaderPage />} />
    {/* Configuration */}
    <Route path="/config" element={<ConfigPage />} />
     <Route path="/admin/users" element={<AdminUserManager />} />

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

    <Route path="/send-email/:projectKey/:phase/:itemId/add-question" element={<AddQuestionPage />} />
    <Route path="/send-email/:projectKey/:phase/:itemId/edit-question/:questionId" element={<EditQuestionPage />} />
    {/* NEW routes for extra phases */}
    <Route path="/changes/:projectKey/feasibility-extra" element={<ChangeItemsFeasibilityExtra />} />
    <Route path="/changes/:projectKey/implementation-extra" element={<ChangeItemsImplementationExtra />} />

    {/* Dashboard section */}
    <Route path="/dashboard/*" element={<DashboardLayout />}>  
      <Route index element={<DashboardHome />} />
      <Route path=":project" element={<DashboardPage />} />
    </Route>
    {/* …other routes */}
    <Route path="/kpis" element={<KPIInputPage />}>
  <Route index element={<Navigate to="drx" />} />   {/* ✅ FIXED */}
  <Route path="drx" element={<DRXKPIInput />} />
  <Route path="downtime" element={<DowntimeKPIInput />} />
  <Route path="budget" element={<BudgetKPIInput />} />
  <Route path="followup" element={<FollowUpKPIInput />} />
  <Route path="scrap" element={<ScrapFollowingSection />} />
</Route>

<Route path="/kpi-editor/drx" element={<DRXKPIEditor />} />
<Route path="/kpi-editor/downtime" element={<DowntimeKPIEditor />} />
<Route path="/kpi-editor/budget" element={<BudgetKPIEditor />} />
<Route path="/follow-cost-editor" element={<FollowCostKPIEditor/>}/>


    {/* 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default App;
