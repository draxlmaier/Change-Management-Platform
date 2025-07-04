// src/components/dashboard/ChangeStatusSemiPieChart.tsx
import React from "react";
import ReactECharts from "echarts-for-react";

export interface ChangeItem {
  Status?: string;
  // (other fields are ignored here)
}

interface Props {
  items: ChangeItem[];
}

export const ChangeStatusSemiPieChart: React.FC<Props> = ({ items }) => {
  // 1) Tally up each status
  const statusCounts: Record<string, number> = {};
  items.forEach((it) => {
    const st = it.Status?.toString() || "Unknown";
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });

  // 2) Turn into [{ name, value }]
  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 3) ECharts option for a half-donut
  const option = {
    title: {
      text: "Change Status Distribution",
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}<br/>Count: {c}<br/>({d}%)",
    },
    legend: {
      top: "5%",
      left: "center",
    },
    series: [
      {
        name: "Status",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "70%"],
        startAngle: 180,
        endAngle: 360,
        label: {
          show: true,
          position: "inside",
          formatter: "{b}: {d}%",
        },
        data,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 300, width: "100%" }}
    />
  );
};
