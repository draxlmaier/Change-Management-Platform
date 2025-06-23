// File: src/pages/BudgetKPIInput.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import KPIInputWrapper from "../../pages/shared/KPIInputWrapper";

const BudgetKPIInput: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Top Navigation Buttons */}
      <div className="relative z-20 max-w-6xl mx-auto p-4 flex items-center space-x-4 mb-4">
        {/* Back Button */}
        <button
          onClick={() => navigate("/tool-selection")}
          className="flex items-center space-x-2
                     px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
        >
          ← Back
        </button>

        {/* Budget KPI Editor Button */}
        <button
          onClick={() => navigate("/kpi-editor/budget")}
          className="flex items-center space-x-2
                     px-3 py-2 bg-blue-600 hover:bg-blue-500 backdrop-blur
                     rounded-2xl shadow-md text-white text-sm transition"
        >
          💰 Open Budget KPI Editor
        </button>
      </div>

      {/* KPI Input Section */}
      <KPIInputWrapper
        title="Budget KPIs"
        fields={[
          { label: "Department Budget", key: "Budgetdepartment" },
          { label: "Planified Budget", key: "Budgetdepartmentplanified" },
        ]}
      />
    </div>
  );
};

export default BudgetKPIInput;
