// src/components/dashboard/ScrapPieChart.tsx

import React from "react";
import ReactECharts from "echarts-for-react";

interface ChangeItem {
  Scrap?: string;  // Add the Scrap field to the interface
  SheetName?: string;
  processyear?: string;
  processmonth?: string;
}

interface ScrapPieChartProps {
  items: ChangeItem[];
  groupBy?: "month" | "year" | "area";  // Optional prop to group data
}

export const ScrapPieChart: React.FC<ScrapPieChartProps> = ({ items, groupBy }) => {
  // Initialize counters
  let scrapCount = 0;
  let noScrapCount = 0;

  // If no groupBy is specified, just count total Scrap vs No Scrap
  if (!groupBy) {
    items.forEach((item) => {
      if (item.Scrap === "Yes") scrapCount++;
      else noScrapCount++;
    });
  }

  // For grouped data, create a map of counts
  const groupedData: Record<string, { scrap: number; noScrap: number }> = {};

  if (groupBy) {
    items.forEach((item) => {
      let groupKey = "";
      
      // Determine the group key based on groupBy prop
      switch (groupBy) {
        case "month":
          groupKey = `${item.processyear}-${item.processmonth}`;
          break;
        case "year":
          groupKey = item.processyear || "Unknown";
          break;
        case "area":
          groupKey = item.SheetName || "Unknown";
          break;
      }

      // Initialize group if it doesn't exist
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = { scrap: 0, noScrap: 0 };
      }

      // Increment appropriate counter
      if (item.Scrap === "Yes") {
        groupedData[groupKey].scrap++;
      } else {
        groupedData[groupKey].noScrap++;
      }
    });
  }

  // Prepare chart title based on grouping
  const chartTitle = groupBy 
    ? `Scrap Analysis by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`
    : "Scrap Analysis";

  // Prepare chart data
  const chartData = groupBy
    ? Object.entries(groupedData).map(([key, counts]) => ({
        name: key,
        type: "pie",
        radius: ["40%", "70%"],
        label: {
          show: true,
          position: "outside",
          formatter: "{b}: {c} ({d}%)",
        },
        data: [
          { value: counts.scrap, name: "Scrap" },
          { value: counts.noScrap, name: "No Scrap" },
        ],
      }))
    : [{
        name: "Scrap Analysis",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: "outside",
          formatter: "{b}: {c} ({d}%)",
        },
        data: [
          { value: scrapCount, name: "Scrap" },
          { value: noScrapCount, name: "No Scrap" },
        ],
      }];

  const option = {
    title: { 
      text: chartTitle, 
      left: "center" 
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}<br/>Count: {c}<br/>({d}%)",
    },
    legend: {
      orient: "vertical",
      left: 10,
      data: ["Scrap", "No Scrap"],
    },
    series: chartData,
  };

  return <ReactECharts option={option} style={{ height: 300, width: "100%" }} />;
};
