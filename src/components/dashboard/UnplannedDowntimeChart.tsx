import React from "react";
import ReactECharts from "echarts-for-react";

interface DowntimeRecord {
  year: string;
  Month: string;
  UnplanneddowntimecausedbyTechnic?: number | string;
  rateofdowntime?: number | string;
  Targetdowntime?: number | string;
  seuildinterventiondowntime?: number | string;
}

interface Props {
  data: DowntimeRecord[];
  isQuarterly?: boolean;
}

export const UnplannedDowntimeChart: React.FC<Props> = ({ data, isQuarterly }) => {
  const monthsOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getMonthIndex = (m: string = "") => {
    const clean = m.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
    return monthsOrder.findIndex(mon =>
      mon.toLowerCase() === clean.trim().toLowerCase()
    );
  };

  const sortedData = [...data].sort((a, b) => {
    const yearDiff = parseInt(a.year) - parseInt(b.year);
    if (yearDiff !== 0) return yearDiff;
    return getMonthIndex(a.Month) - getMonthIndex(b.Month);
  });

  console.log("✅ Final sorted data for chart:", sortedData);

  const xAxisLabels = sortedData.map((rec) => {
    const pretty = rec.Month.charAt(0).toUpperCase() + rec.Month.slice(1).toLowerCase();
    return rec.year ? `${pretty} ${rec.year}` : pretty;
  });

  const downtimeSeries = {
    name: "Downtime (min)",
    type: "bar",
    data: sortedData.map(rec => parseFloat(String(rec.UnplanneddowntimecausedbyTechnic || 0))),
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
