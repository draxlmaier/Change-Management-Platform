import React from "react";

interface MonthlyKPIItem {
  ID: string;
  year: string;
  Month: string;
  Project?: string;
  BudgetDepartment?: string;
}

interface BudgetDepartmentKPIProps {
  data: MonthlyKPIItem[];
  filterMode: "month" | "quarter" | "year";
  selectedMonth?: string;    // e.g. "06"
  selectedQuarter?: string;  // e.g. "2"
  selectedYear: string;      // e.g. "2025"
}

export const BudgetDepartmentKPI: React.FC<BudgetDepartmentKPIProps> = ({
  data,
  filterMode,
  selectedMonth,
  selectedQuarter,
  selectedYear,
}) => {
  // Convert month number to French name
  const getMonthName = (numStr: string) => {
    const months = [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];
    const index = parseInt(numStr, 10) - 1;
    return months[index] || "";
  };

  // Filter entries for the department "department budget"
  const filtered = data.filter(
    (item) =>
      item.BudgetDepartment?.toLowerCase() === "department budget"
  );

  const count = filtered.length;

  let timeLabel = "";
  if (filterMode === "month" && selectedMonth) {
    timeLabel = getMonthName(selectedMonth);
  } else if (filterMode === "quarter" && selectedQuarter) {
    timeLabel = `Q${selectedQuarter}`;
  } else if (filterMode === "year") {
    timeLabel = selectedYear;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center space-y-2">
      <h2 className="text-lg font-semibold text-gray-700">Department Budget</h2>
      <div className="text-4xl font-bold text-blue-600">{count}</div>
      <div className="text-sm text-gray-500">{timeLabel}</div>
    </div>
  );
};
