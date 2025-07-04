// src/components/dashboard/scrap/ScrapEntriesChart.tsx
import React from "react";
import ReactECharts from "echarts-for-react";

// Re-use the ChangeItem shape from your dashboard
interface ChangeItem {
  ID: string;
  processyear?: string;
  processmonth?: string;
  Actualscrap?: number;
  Estimatedscrap?: number;
}

interface Props {
  items: ChangeItem[];
  filterMode: FillMode;
}

export const ScrapEntriesChart: React.FC<Props> = ({ items, filterMode }) => {
  const monthsOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // 1) Build entries for anything that has a year & month
  const entries = items
    .filter(i => i.processyear && i.processmonth)
    .map(i => {
      const mIdx = parseInt(i.processmonth!.padStart(2, "0"), 10) - 1;
      const label = `${monthsOrder[mIdx]} ${i.processyear}`;
      return {
        label,
        actual: i.Actualscrap ?? 0,
        estimated: i.Estimatedscrap ?? 0,
      };
    });

  // 2) No data?
  if (entries.length === 0) {
    return (
      <div className="text-gray-500 p-4">
        No scrap data found for this filter.
      </div>
    );
  }

  // 3) Pull arrays for ECharts
  const labels     = entries.map(e => e.label);
  const actuals    = entries.map(e => e.actual);
  const estimateds = entries.map(e => e.estimated);

  // 4) ECharts option
  const option = {
    title: {
      text: "Scrap: Actual vs Estimated",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) => {
        let txt = `<strong>${params[0].axisValueLabel}</strong><br/>`;
        params.forEach(p => {
          txt += `${p.seriesName}: ${p.data} €<br/>`;
        });
        return txt;
      },
    },
    legend: {
      top: 30,
      data: ["Estimated Scrap", "Actual Scrap"],
    },
    grid: {
      bottom: 100,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { rotate: 45, interval: 0, fontSize: 10 },
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: "{value} €" },
    },
    series: [
      { name: "Estimated Scrap", type: "bar", data: estimateds },
      { name: "Actual Scrap",    type: "bar", data: actuals    },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 450, width: "100%" }}
    />
  );
};
