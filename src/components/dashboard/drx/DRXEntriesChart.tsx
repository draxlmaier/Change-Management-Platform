import React from "react";
import ReactECharts from "echarts-for-react";

interface DRXItem {
  ID: string;
  year: string;
  Monthid?: string;
  Project?: string;
  DRXIdeasubmittedIdea?: number;
  DRXIdeasubmittedIdeaGoal?: number;
}

interface Props {
  data: DRXItem[];
  filterMode: "month" | "quarter" | "year";
}

export const DRXEntriesChart: React.FC<Props> = ({ data, filterMode }) => {
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
        actual: item.DRXIdeasubmittedIdea || 0,
        goal: item.DRXIdeasubmittedIdeaGoal || 0,
      };
    });

  const labels = entries.map(e => e.label);
  const actuals = entries.map(e => e.actual);
  const goals = entries.map(e => e.goal);

  const option = {
    title: {
      text: "DRX Idea Entries – Detailed View",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      top: 30,
      data: ["Target", "Submitted"],
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
        name: "Target",
        type: "bar",
        data: goals,
        itemStyle: { color: "#3B82F6" },
      },
      {
        name: "Submitted",
        type: "bar",
        data: actuals,
        itemStyle: { color: "#E53935" },
      },
    ],
  };

  if (!entries.length) {
    return <div className="text-gray-500 p-4">No DRX idea entries found for this filter.</div>;
  }

  return <ReactECharts option={option} style={{ height: 450 }} />;
};
