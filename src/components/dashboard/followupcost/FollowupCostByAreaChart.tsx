import React from "react";
import ReactECharts from "echarts-for-react";

export interface FollowCostItem {
  ID: string;                  // SharePoint item id
  Project: string;
  Area: string;
  Carline: string;
  FollowupcostBudgetPA: number;
  InitiationReasons: string;
  BucketID: string;
  Date: string;                // Format: YYYY-MM-DD
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
  filterMode: "year" | "quarter" | "month" | "day" | "weekOfMonth" | "weekOfYear" | "customRange";
  selectedYear: string;
  selectedMonth: string;
  selectedDay: string;
  selectedQuarter: string;
  selectedWeekOfMonth?: number;
  selectedWeekOfYear?: number;
  selectedProject: string;
}

export const FollowupCostByAreaChart: React.FC<Props> = ({
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
  // --- Filter & Normalize
  const filtered = data.filter((item) => {
    if (!item.Date) return false;
    const date = new Date(item.Date);
    const y = String(date.getFullYear());
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    const matchesProject =
      selectedProject.toLowerCase() === "draxlmaeir"
        ? true
        : item.Project?.toLowerCase() === selectedProject.toLowerCase();

    if (!matchesProject) return false;

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

  // --- Grouping logic: Area (and merge per filter period)
  const grouped: Record<string, number> = {};
  filtered.forEach((item) => {
    const date = new Date(item.Date);
    const area = item.Area || "Undefined";
    let label = "";

    switch (filterMode) {
      case "day":
        label = `${area} - ${date.toLocaleDateString()}`;
        break;
      case "month":
        label = `${area} - ${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`;
        break;
      case "quarter": {
        const q = Math.ceil((date.getMonth() + 1) / 3);
        label = `${area} - Q${q} ${date.getFullYear()}`;
        break;
      }
      case "year":
        label = `${area} - ${date.getFullYear()}`;
        break;
      case "weekOfMonth": {
        const w = Math.ceil(date.getDate() / 7);
        label = `${area} - S${w} ${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`;
        break;
      }
      case "weekOfYear": {
        const jan1 = new Date(date.getFullYear(), 0, 1);
        const diff = (date.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24);
        const week = Math.floor(diff / 7) + 1;
        label = `${area} - S${week} ${date.getFullYear()}`;
        break;
      }
      default:
        label = `${area} - ${date.toLocaleDateString()}`;
    }

    grouped[label] = (grouped[label] || 0) + (item.TotalNettValue || 0);
  });

  const labels = Object.keys(grouped).sort();
  const values = labels.map((l) => grouped[l]);

  const colors = [
    "#E53935", "#3B82F6", "#F59E0B", "#10B981",
    "#8B5CF6", "#EC4899", "#6366F1", "#22D3EE", "#F87171"
  ];
  const colorMap = labels.reduce((acc, l, i) => {
    acc[l] = colors[i % colors.length];
    return acc;
  }, {} as Record<string, string>);

  const option = {
    title: {
      text: "Total Nett Value (€) par Zone et Projet",
      left: "center",
      textStyle: { fontWeight: "bold", fontSize: 18 },
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: any) =>
        params.map((p: any) => `${p.marker}${p.name}: €${p.value.toLocaleString()}`).join("<br/>"),
    },
    legend: {
      top: 30,
      data: ["Total Nett Value (€)"],
    },
    xAxis: {
      type: "category",
      data: labels,
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
          itemStyle: { color: colorMap[labels[i]] },
        })),
        label: {
          show: true,
          position: "top",
          formatter: (val: any) => `€${val.value.toLocaleString()}`,
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 450 }} />;
};
