import React from "react";
import ReactECharts from "echarts-for-react";

interface DowntimeRecord {
  year: string;
  Monthid: string; // numeric month (1-12)
  downtime?: number | string;
  rateofdowntime?: number | string;
  Targetdowntime?: number | string;
  seuildinterventiondowntime?: number | string;
  Project?: string; // <-- Add this if not already present in your data!
}

interface Props {
  data: DowntimeRecord[];
  isQuarterly?: boolean;
  selectedProject: string;
}

export const UnplannedDowntimeChart: React.FC<Props> = ({
  data,
  isQuarterly,
  selectedProject,
}) => {
  const monthsOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getMonthName = (monthId: string) => {
    const index = parseInt(monthId, 10) - 1;
    return monthsOrder[index] || "Unknown";
  };

  // --- FILTER BY PROJECT ---
  const filteredData =
    selectedProject.toLowerCase() === "draxlmaeir"
      ? data
      : data.filter(
          (rec) =>
            rec.Project?.toLowerCase() === selectedProject.toLowerCase()
        );

  const sortedData = [...filteredData].sort((a, b) => {
    const yearDiff = parseInt(a.year) - parseInt(b.year);
    if (yearDiff !== 0) return yearDiff;
    return parseInt(a.Monthid) - parseInt(b.Monthid);
  });

  const xAxisLabels = sortedData.map((rec) => {
    const monthName = getMonthName(rec.Monthid);
    return `${monthName} ${rec.year}`;
  });

  const downtimeSeries = {
    name: "Downtime (min)",
    type: "bar",
    data: sortedData.map(rec => parseFloat(String(rec.downtime || 0))),
    yAxisIndex: 0,
    itemStyle: { color: "#fdae61" },
  };

  const rateSeries = {
    name: "Rate of Downtime",
    type: "line",
    smooth: true,
    data: sortedData.map(rec =>
      rec.rateofdowntime !== undefined ? parseFloat(String(rec.rateofdowntime)) * 100 : null
    ),
    yAxisIndex: 1,
    lineStyle: { width: 2 },
    itemStyle: { color: "#2b83ba" },
  };

  const targetSeries = {
    name: "Target in %",
    type: "line",
    smooth: true,
    data: sortedData.map(rec =>
      rec.Targetdowntime !== undefined ? parseFloat(String(rec.Targetdowntime)) * 100 : null
    ),
    yAxisIndex: 1,
    lineStyle: { type: "dashed" },
    itemStyle: { color: "#5e72e4" },
  };

  const seuilSeries = {
    name: "Seuil d'intervention",
    type: "line",
    smooth: true,
    data: sortedData.map(rec =>
      rec.seuildinterventiondowntime !== undefined
        ? parseFloat(String(rec.seuildinterventiondowntime)) * 100
        : null
    ),
    yAxisIndex: 1,
    lineStyle: { type: "dotted" },
    itemStyle: { color: "#d7191c" },
  };

  const option = {
    title: {
      text: isQuarterly
        ? "Unplanned Downtime by Quarter"
        : "Unplanned Downtime by Month",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        let txt = `<strong>${params[0]?.axisValue}</strong><br/>`;
        params.forEach((p: any) => {
          if (p.seriesName.includes("Downtime (min)")) {
            txt += `${p.marker}${p.seriesName}: ${p.value?.toLocaleString()}<br/>`;
          } else {
            txt += `${p.marker}${p.seriesName}: ${p.value?.toFixed(2)}%<br/>`;
          }
        });
        return txt;
      },
    },
    legend: {
      top: 40,
      data: [
        "Downtime (min)",
        "Rate of Downtime",
        "Target in %",
        "Seuil d'intervention",
      ],
    },
    grid: {
      top: 80,
      left: 60,
      right: 60,
      bottom: 60,
    },
    xAxis: {
      type: "category",
      data: xAxisLabels,
      axisLabel: {
        rotate: isQuarterly ? 0 : 30,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "Minutes",
        position: "left",
      },
      {
        type: "value",
        name: "Percentage",
        position: "right",
        axisLabel: {
          formatter: "{value} %",
        },
      },
    ],
    series: [downtimeSeries, rateSeries, targetSeries, seuilSeries],
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: "100%", height: 400 }}
    />
  );
};
