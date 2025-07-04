// src/components/dashboard/scrap/ScrapPieChart.tsx
import React from "react";
import ReactECharts from "echarts-for-react";
import { ChangeItem } from "../../../pages/types";

interface ScrapPieChartProps {
  items: ChangeItem[];
  /** if omitted, shows one overall pie; if set, shows one ring per group */
  groupBy?: "month" | "year" | "area";
}

export const ScrapPieChart: React.FC<ScrapPieChartProps> = ({
  items,
  groupBy,
}) => {
  // categorize into exactly three buckets
  const categorize = (val: any): "Scrap" | "No Scrap" | "Not Defined Yet" => {
    const s = String(val || "").trim().toLowerCase();
    if (s === "scrap") return "Scrap";
    if (s === "no scrap") return "No Scrap";
    return "Not Defined Yet";
  };

  // overall totals
  const overallCounts: Record<string, number> = {
    Scrap: 0,
    "No Scrap": 0,
    "Not Defined Yet": 0,
  };

  // for groupBy
  const grouped: Record<
    string,
    { Scrap: number; "No Scrap": number; "Not Defined Yet": number }
  > = {};

  // single pass to fill counts
  items.forEach((item) => {
    const cat = categorize(item.Scrap);

    if (!groupBy) {
      overallCounts[cat]++;
    } else {
      let key: string;
      switch (groupBy) {
        case "month":
          key = `${item.processyear || "?"}-${String(
            item.processmonth || ""
          ).padStart(2, "0")}`;
          break;
        case "year":
          key = item.processyear || "Unknown";
          break;
        case "area":
          key = item.SheetName || "Unknown";
          break;
      }
      if (!grouped[key]) {
        grouped[key] = { Scrap: 0, "No Scrap": 0, "Not Defined Yet": 0 };
      }
      grouped[key][cat]++;
    }
  });

  // build the ECharts series
  const series = !groupBy
    ? [
        {
          name: "Scrap",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "outside",
            formatter: "{b}: {c} ({d}%)",
          },
          data: [
            { value: overallCounts.Scrap, name: "Scrap" },
            { value: overallCounts["No Scrap"], name: "No Scrap" },
            { value: overallCounts["Not Defined Yet"], name: "Not Defined Yet" },
          ],
        },
      ]
    : Object.entries(grouped).map(([key, counts]) => ({
        name: key,
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "50%"], // you can tweak per-group centers if you lay them out in a grid
        label: {
          show: true,
          position: "outside",
          formatter: "{b}: {c} ({d}%)",
        },
        data: [
          { value: counts.Scrap, name: "Scrap" },
          { value: counts["No Scrap"], name: "No Scrap" },
          { value: counts["Not Defined Yet"], name: "Not Defined Yet" },
        ],
      }));

  const title = groupBy
    ? `Scrap Analysis by ${groupBy[0].toUpperCase() + groupBy.slice(1)}`
    : "Scrap Analysis";

  const option = {
    title: { text: title, left: "center" },
    tooltip: { trigger: "item", formatter: "{b}<br/>Count: {c}<br/>({d}%)" },
    legend: {
      orient: "vertical",
      left: 10,
      data: ["Scrap", "No Scrap", "Not Defined Yet"],
    },
    series,
  };

  return <ReactECharts option={option} style={{ height: 300, width: "100%" }} />;
};
