import React from "react";
import ReactECharts from "echarts-for-react";

interface BudgetKPIItem {
  ID: string;
  year: string;
  Monthid?: string;
  Project?: string;
  Budgetdepartment?: number;
  Budgetdepartmentplanified?: number;
}

interface Props {
  data: BudgetKPIItem[];
  filterMode: "month" | "quarter" | "year";
}

export const BudgetEntriesChart: React.FC<Props> = ({ data, filterMode }) => {
  const monthsOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const entries = data
    .filter((item) => item.Monthid && item.year && item.ID)
    .map((item) => {
      const monthIndex = parseInt(item.Monthid?.padStart(2, "0") || "01", 10) - 1;
      const label = `${monthsOrder[monthIndex]} ${item.year} – ${item.Project || "ID:" + item.ID}`;
      return {
        label,
        actual: item.Budgetdepartment || 0,
        planned: item.Budgetdepartmentplanified || 0,
      };
    });

  const labels = entries.map(e => e.label);
  const actuals = entries.map(e => e.actual);
  const plans = entries.map(e => e.planned);

  const option = {
    title: {
      text: "Budget Department – Raw Entries",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      top: 30,
      data: ["Planned", "Actual"],
    },
    grid: {
      bottom: 100,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: {
        rotate: 45,
        interval: 0,
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "Planned",
        type: "bar",
        data: plans,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Actual",
        type: "bar",
        data: actuals,
        itemStyle: { color: "#E53935" },
      },
    ],
  };

  if (!entries.length) {
    return <div className="text-gray-500 p-4">No raw budget entries available for this filter.</div>;
  }

  return <ReactECharts option={option} style={{ height: 450 }} />;
};
