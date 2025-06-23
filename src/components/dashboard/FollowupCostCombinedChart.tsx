import React from "react";
import EChartsReact from "echarts-for-react";

interface FollowCostItem {
  Area: string;
  InitiationReasons: string;
  Followupcost_x002f_BudgetPA: number;
  Date: string;
  Project: string;
}

interface Props {
  data: FollowCostItem[];
  filterMode: "year" | "quarter" | "month" | "day" | "weekOfMonth" | "weekOfYear" | "customRange";
  selectedYear: string;
  selectedMonth: string;
  selectedDay: string;
  selectedQuarter: string;
  selectedWeekOfMonth?: number;
  selectedWeekOfYear?: number;
  selectedProject: string;
}

export const FollowupCostCombinedChart: React.FC<Props> = ({
  data,
  filterMode,
  selectedDay,
  selectedMonth,
  selectedYear,
  selectedWeekOfMonth,
  selectedWeekOfYear,
  selectedQuarter,
  selectedProject,
}) => {
  const filtered = data.filter((item) => {
    if (selectedProject !== "draxlmaeir" && item.Project?.toLowerCase() !== selectedProject.toLowerCase()) {
      return false;
    }
    const date = new Date(item.Date);
    const y = String(date.getFullYear());
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    switch (filterMode) {
      case "day": return y === selectedYear && m === selectedMonth && d === selectedDay;
      case "month": return y === selectedYear && m === selectedMonth;
      case "year": return y === selectedYear;
      case "quarter": {
        const q = parseInt(selectedQuarter, 10);
        const monthNum = parseInt(m, 10);
        return y === selectedYear && monthNum >= (q - 1) * 3 + 1 && monthNum <= q * 3;
      }
      case "weekOfMonth": {
        if (y !== selectedYear || m !== selectedMonth || !selectedWeekOfMonth) return false;
        const week = Math.ceil(date.getDate() / 7);
        return week === selectedWeekOfMonth;
      }
      case "weekOfYear": {
        if (y !== selectedYear || !selectedWeekOfYear) return false;
        const jan1 = new Date(Number(y), 0, 1);
        const diff = (date.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24);
        const week = Math.floor(diff / 7) + 1;
        return week === selectedWeekOfYear;
      }
      default:
        return true;
    }
  });

  const grouped: Record<string, Record<string, number>> = {};
  const allAreasSet = new Set<string>();

  filtered.forEach((item) => {
    const reason = item.InitiationReasons || "Autre";
    const area = item.Area || "Sans zone";
    allAreasSet.add(area);
    if (!grouped[reason]) grouped[reason] = {};
    grouped[reason][area] = (grouped[reason][area] || 0) + (item.Followupcost_x002f_BudgetPA || 0);
  });

  const allReasons = Object.keys(grouped);
  const allAreas = Array.from(allAreasSet);

  const glassyColors = [
    "rgba(229, 57, 53, 0.6)",  // Soft red
    "rgba(59, 130, 246, 0.6)", // Soft blue
    "rgba(245, 158, 11, 0.6)", // Amber
    "rgba(16, 185, 129, 0.6)", // Emerald
    "rgba(139, 92, 246, 0.6)", // Violet
    "rgba(236, 72, 153, 0.6)", // Pink
    "rgba(99, 102, 241, 0.6)", // Indigo
    "rgba(34, 211, 238, 0.6)", // Cyan
    "rgba(248, 113, 113, 0.6)", // Rose
  ];

  const series = allAreas.map((area, i) => ({
    name: area,
    type: "bar",
    stack: false,
    label: {
      show: true,
      position: "top",
      formatter: (val: any) => `€${val.value.toLocaleString()}`,
      color: "#fff",
      fontWeight: "bold",
    },
    itemStyle: {
      color: glassyColors[i % glassyColors.length],
      borderRadius: [6, 6, 0, 0],
    },
    data: allReasons.map((reason) => grouped[reason]?.[area] || 0),
  }));

  const option = {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily: "Inter, sans-serif",
      color: "#f0f0f0",
    },
    title: {
      text: "Coût suivi / Budget PA (€) par Raison de l’initiation et Zone",
      left: "center",
      textStyle: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(0,0,0,0.7)",
      borderColor: "transparent",
      textStyle: { color: "#fff" },
      formatter: (params: any) =>
        params.map((p: any) => `${p.marker}${p.seriesName}: €${p.value.toLocaleString()}`).join("<br/>"),
    },
    legend: {
      top: 30,
      textStyle: {
        color: "#e0e0e0",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: allReasons,
      axisLabel: {
        rotate: 30,
        color: "#ccc",
      },
      axisLine: {
        lineStyle: {
          color: "#555",
        },
      },
    },
    yAxis: {
      type: "value",
      name: "€",
      axisLabel: {
        color: "#ccc",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(255,255,255,0.1)",
        },
      },
    },
    series,
  };

  return (
    
      <EChartsReact option={option} style={{ height: 400 }} />
  )
};
