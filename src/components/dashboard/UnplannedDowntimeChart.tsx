import React from "react";
import ReactECharts from "echarts-for-react";

interface DowntimeRecord {
  year: string;
  Month: string;
  UnplanneddowntimecausedbyTechnic?: number; // <-- fix here
  rateofdowntime?: number;
  Targetdowntime?: number;
  seuildinterventiondowntime?: number;
}


interface Props {
  data: DowntimeRecord[];
  isQuarterly?: boolean;  // If set, the x-axis are quarter labels instead of months
}

export const UnplannedDowntimeChart: React.FC<Props> = ({ data, isQuarterly }) => {
  // Sort data by month name or by Q1..Q4
  const monthsOrder = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const quartersOrder = ["Q1","Q2","Q3","Q4"];

  // Decide how to sort
  const sortedData = [...data].sort((a, b) => {
  const yearDiff = parseInt(a.year) - parseInt(b.year);
  if (yearDiff !== 0) return yearDiff;

  const list = isQuarterly ? quartersOrder : monthsOrder;
  return list.indexOf(a.Month) - list.indexOf(b.Month);
});


  const xAxisLabels = sortedData.map((rec) =>
  rec.year ? `${rec.Month} ${rec.year}` : rec.Month
);


  // For the primary axis: Downtime in minutes
  const downtimeSeries = {
    name: "Downtime (min)",
    type: "bar",
    data: sortedData.map((rec) => rec.UnplanneddowntimecausedbyTechnic || 0),
    yAxisIndex: 0,
    itemStyle: { color: "#fdae61" },
  };

  // For the secondary axis (percent):
  const rateSeries = {
    name: "Rate of Downtime",
    type: "line",
    smooth: true,
    data: sortedData.map((rec) =>
      rec.rateofdowntime !== undefined ? rec.rateofdowntime * 100 : null
    ),
    yAxisIndex: 1,
    lineStyle: { width: 2 },
    itemStyle: { color: "#2b83ba" },
  };

  const targetSeries = {
    name: "Target in %",
    type: "line",
    smooth: true,
    data: sortedData.map((rec) =>
      rec.Targetdowntime !== undefined ? rec.Targetdowntime * 100 : null
    ),
    yAxisIndex: 1,
    lineStyle: { type: "dashed" },
    itemStyle: { color: "#5e72e4" },
  };

  const seuilSeries = {
    name: "Seuil d'intervention",
    type: "line",
    smooth: true,
    data: sortedData.map((rec) =>
      rec.seuildinterventiondowntime !== undefined
        ? rec.seuildinterventiondowntime * 100
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
            txt += `${p.marker}${p.seriesName}: ${p.value?.toFixed(4)}%<br/>`;
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
