// src/components/dashboard/OpenClosedPieChart.tsx
import React from "react";
import ReactECharts from "echarts-for-react";

interface ChangeItem {
  EnddatePhase4?: string;
  EnddatePAVPhase4?: string;
  EnddatePhase8?: string;
  EnddateProcessinfo?: string;   // for filtering out completely blank items
  StartdatePhase4?: string;      // for filtering out completely blank items
  Status?: string;
}

interface OpenClosedPieChartProps {
  items: ChangeItem[];
  type: "phase8" | "phase4" | "pav" | "status";
}

export const OpenClosedPieChart: React.FC<OpenClosedPieChartProps> = ({
  items,
  type,
}) => {
  //
  // 1) Exclude any item where *both* EnddateProcessinfo and StartdatePhase4
  //    are blank/non‐dates (i.e. contain no digits).
  //
  const filteredItems = items.filter((item) => {
    const hasEndInfo = /\d/.test(item.EnddateProcessinfo || "");
    const hasStart4 = /\d/.test(item.StartdatePhase4 || "");
    return hasEndInfo || hasStart4;
  });

  //
  // 2) Tally open vs closed
  //
  let openCount = 0;
  let closedCount = 0;

  filteredItems.forEach((item) => {
    switch (type) {
      case "phase4":
        if (!item.EnddatePhase4) openCount++;
        else closedCount++;
        break;

      case "pav":
        if (!item.EnddatePAVPhase4) openCount++;
        else closedCount++;
        break;

      case "phase8":
        if (!item.EnddatePhase8) openCount++;
        else closedCount++;
        break;

      case "status":
        if (item.Status?.toLowerCase() === "open") openCount++;
        else closedCount++;
        break;
    }
  });

  //
  // 3) Build chart title & option
  //
  const chartTitle: string = {
    phase8: "Phase 8 Open/Closed",
    phase4: "Phase 4 Open/Closed",
    pav: "PAV Phase 4 Open/Closed",
    status: "Process Open/Closed (Status)",
  }[type];

  const option = {
    title: {
      text: chartTitle,
      left: "center",
    },
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

  //
  // 4) Render
  //
  return (
    <ReactECharts
      option={option}
      style={{ height: 300, width: "100%" }}
    />
  );
};
