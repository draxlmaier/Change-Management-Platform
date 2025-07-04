// src/components/dashboard/ChangePerAreaChart.tsx
import React from "react";
import ReactECharts from "echarts-for-react";

interface ChangeItem {
  SheetName: string;
  processmonth: string;
  processyear: string;
  // Add other fields as needed
}

interface Props {
  items: ChangeItem[];
}

export const ChangePerAreaChart: React.FC<Props> = ({ items }) => {
  const grouped: Record<string, Record<string, number>> = {};

  items.forEach(({ SheetName, processmonth, processyear }) => {
    const monthKey = `${processyear}-${processmonth.padStart(2, "0")}`;
    if (!grouped[SheetName]) grouped[SheetName] = {};
    if (!grouped[SheetName][monthKey]) grouped[SheetName][monthKey] = 0;
    grouped[SheetName][monthKey]++;
  });

  const allMonths = Array.from(
    new Set(items.map(i => `${i.processyear}-${i.processmonth.padStart(2, "0")}`))
  ).sort();

  const series = Object.entries(grouped).map(([area, monthData]) => ({
    name: area,
    type: "bar",
    stack: "total",
    emphasis: { focus: "series" },
    data: allMonths.map(month => monthData[month] || 0),
  }));

  const option = {
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    toolbox: { feature: { saveAsImage: {} } },
    xAxis: { type: "category", data: allMonths },
    yAxis: { type: "value" },
    series,
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};
