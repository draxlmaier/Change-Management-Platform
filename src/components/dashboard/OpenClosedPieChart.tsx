// src/components/dashboard/OpenClosedPieChart.tsx
import React from "react";
import ReactECharts from "echarts-for-react";

interface ChangeItem {
  EnddatePhase4?: string;
  EnddatePAVPhase4?: string;
  Status?: string;
  // ...any other fields
}

interface OpenClosedPieChartProps {
  items: ChangeItem[];
  type: "phase8" |"phase4" | "pav" | "status";
}

export const OpenClosedPieChart: React.FC<OpenClosedPieChartProps> = ({ items, type }) => {
  let openCount = 0;
  let closedCount = 0;

  items.forEach((item) => {
    switch (type) {
      case "phase4":
        if (!item.EnddatePhase4) openCount++;
        else closedCount++;
        break;
      case "pav":
        if (!item.EnddatePAVPhase4) openCount++;
        else closedCount++;
        break;
      case "status":
        if (item.Status === "open") openCount++;
        else closedCount++;
        break;
      default:
        break;
    }
  });

  const chartTitle = {
    phase8: "Phase8 Open/Closed",
    phase4: "Phase4 Open/Closed",
    pav: "PAV Phase4 Open/Closed",
    status: "Process Open/Closed (Status)",
  }[type];

  const option = {
    title: { text: chartTitle, left: "center" },
    tooltip: {
      trigger: "item",
      formatter: "{b}<br/>Count: {c}<br/>({d}%)",
    },
    legend: {
      orient: "vertical",
      left: 10,
      data: ["Closed", "Open"],
    },
    series: [
      {
        name: "Open vs Closed",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: "outside",
          formatter: "{b}: {c} ({d}%)",
        },
        data: [
          { value: closedCount, name: "Closed" },
          { value: openCount, name: "Open" },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 300, width: "100%" }} />;
};
