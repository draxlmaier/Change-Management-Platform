import React from "react";
import ReactECharts from "echarts-for-react";

// Full interface for consistency (only a subset is used here)
interface FollowCostItem {
  Project: string;
  Area: string;
  Carline: string;
  FollowupcostBudgetPA: number;
  InitiationReasons: string;
  BucketID: string;
  Date: string;
  Statut: string;
  Quantity: number;
  NettValue: number;
  TotalNettValue: number;
  Currency: string;
  BucketResponsible: string;
  PostnameID: string;
}

interface Props {
  data: FollowCostItem[];
  selectedProject: string;
  filterMode: "year" | "quarter" | "month" | "day" | "weekOfMonth" | "weekOfYear" | "customRange";
  selectedYear: string;
  selectedMonth: string;
  selectedDay: string;
  selectedQuarter: string;
  selectedWeekOfMonth?: number;
  selectedWeekOfYear?: number;
}

export const FollowupCostByReasonChart: React.FC<Props> = ({
  data,
  selectedProject,
  filterMode,
  selectedYear,
  selectedMonth,
  selectedDay,
  selectedQuarter,
  selectedWeekOfMonth,
  selectedWeekOfYear,
}) => {
  // --- Filtering logic
  const filtered = data.filter((item) => {
    if (!item.Date) return false;
    const date = new Date(item.Date);
    const y = String(date.getFullYear());
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    if (
      selectedProject.toLowerCase() !== "draxlmaeir" &&
      item.Project?.toLowerCase() !== selectedProject.toLowerCase()
    ) {
      return false;
    }

    switch (filterMode) {
      case "day":
        return y === selectedYear && m === selectedMonth && d === selectedDay;
      case "month":
        return y === selectedYear && m === selectedMonth;
      case "year":
        return y === selectedYear;
      case "quarter": {
        const q = parseInt(selectedQuarter);
        const monthNum = parseInt(m);
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

  // --- Group by InitiationReasons and sum TotalNettValue
  const grouped: Record<string, number> = {};
  filtered.forEach((item) => {
    const reason = item.InitiationReasons || "Inconnu";
    if (!isNaN(item.TotalNettValue)) {
      if (selectedProject.toLowerCase() === "draxlmaeir") {
        grouped[reason] = (grouped[reason] || 0) + item.TotalNettValue;
      } else {
        const key = `${reason} - ${item.Project || "unknown"}`;
        grouped[key] = (grouped[key] || 0) + item.TotalNettValue;
      }
    }
  });

  const reasons = Object.keys(grouped).length > 0 ? Object.keys(grouped) : ["Aucune donnée"];
  const values = reasons.map((key) => grouped[key] || 0);

  const colors = [
    "#E53935", "#3B82F6", "#F59E0B", "#10B981",
    "#8B5CF6", "#EC4899", "#6366F1", "#22D3EE", "#F87171"
  ];

  const colorMap = reasons.reduce((acc, key, i) => {
    acc[key] = colors[i % colors.length];
    return acc;
  }, {} as Record<string, string>);

  const option = {
    title: {
      text: "Total Nett Value par Raison de l’initiation",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) =>
        params.map((p: any) => `${p.marker}${p.name}: €${p.value.toLocaleString()}`).join("<br/>"),
    },
    xAxis: {
      type: "category",
      data: reasons,
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: "value",
      name: "€",
    },
    series: [
      {
        name: "Total Nett Value (€)",
        type: "bar",
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: colorMap[reasons[i]] },
        })),
        label: {
          show: true,
          position: "top",
          formatter: (val: any) => `€${val.value.toLocaleString()}`,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};
