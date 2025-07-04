// src/components/dashboard/SubAreaPieChart.tsx
import React from "react";
import ReactECharts from "echarts-for-react";

interface ChangeItem {
  Constructedspace?: string;
}

interface Props {
  items: ChangeItem[];
}

export const SubAreaPieChart: React.FC<Props> = ({ items }) => {
  // Group by subarea
  const subAreaCounts: Record<string, number> = {};
  items.forEach((i) => {
    const sub = i.Constructedspace || "Unknown";
    subAreaCounts[sub] = (subAreaCounts[sub] || 0) + 1;
  });

  const dataArr = Object.entries(subAreaCounts).map(([name, value]) => ({ name, value }));

  const option = {
    title: { text: "Subarea Distribution", left: "center" },
    tooltip: { trigger: "item", formatter: "{b}<br/>Count: {c}<br/>({d}%)" },
    legend: { orient: "vertical", left: 10 },
    series: [
      {
        name: "Subareas",
        type: "pie",
        radius: ["40%", "70%"],
        label: {
          show: true,
          formatter: "{b}: {c} ({d}%)",
        },
        data: dataArr,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 300, width: "100%" }} />;
};
