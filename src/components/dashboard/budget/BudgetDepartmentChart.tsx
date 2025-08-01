import React from "react";
import ReactECharts from "echarts-for-react";

interface BudgetKPIRecord {
  year: string;
  Monthid?: string;
  Budgetdepartment?: number;
  Budgetdepartmentplanified?: number;
}

interface Props {
  data: BudgetKPIRecord[];
  filterMode: "month" | "quarter" | "year";
}

function getLinearRegression(values: number[]): number[] {
  const n = values.length;
  const x = [...Array(n).keys()];
  const y = values;

  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce((acc, xi, i) => acc + (xi - xMean) * (y[i] - yMean), 0);
  const denominator = x.reduce((acc, xi) => acc + Math.pow(xi - xMean, 2), 0);

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  return x.map(xi => +(slope * xi + intercept).toFixed(2));
}

export const BudgetDepartmentChart: React.FC<Props> = ({ data, filterMode }) => {
  const monthsOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const grouped: Record<string, { plan: number; actual: number }> = {};

  data.forEach((item) => {
    const year = item.year;
    const rawMonth = item.Monthid;
    if (!year || !rawMonth) return;

    const monthId = rawMonth.padStart(2, "0");
    const monthNum = parseInt(monthId, 10);
    const quarter = Math.ceil(monthNum / 3);

    let key = "";
    if (filterMode === "year") {
      key = year;
    } else if (filterMode === "quarter") {
      key = `Q${quarter} ${year}`;
    } else {
      const monthName = monthsOrder[monthNum - 1] || "Unknown";
      key = `${monthName} ${year}`;
    }

    if (!grouped[key]) {
      grouped[key] = { plan: 0, actual: 0 };
    }

    grouped[key].plan += item.Budgetdepartmentplanified || 0;
    grouped[key].actual += item.Budgetdepartment || 0;
  });

  const labels = Object.keys(grouped).sort((a, b) => {
    const [aMain, aYear] = a.includes("Q") ? a.split(" ") : a.split(" ");
    const [bMain, bYear] = b.includes("Q") ? b.split(" ") : b.split(" ");

    if (filterMode === "month") {
      const aIndex = monthsOrder.findIndex((m) => a.startsWith(m));
      const bIndex = monthsOrder.findIndex((m) => b.startsWith(m));
      return parseInt(aYear) - parseInt(bYear) || aIndex - bIndex;
    } else if (filterMode === "quarter") {
      return parseInt(aYear) - parseInt(bYear) || parseInt(aMain.replace("Q", "")) - parseInt(bMain.replace("Q", ""));
    }

    return parseInt(aMain) - parseInt(bMain);
  });

  const plans = labels.map((label) => grouped[label].plan);
  const actuals = labels.map((label) => grouped[label].actual);
  const trendLine = getLinearRegression(actuals);

  if (!labels.length) {
    return <div className="text-gray-500 p-4">No budget data available for the selected filter.</div>;
  }

  const option = {
    title: {
      text: "Budget vs Plan – Department",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
    },
    legend: {
      top: 30,
      data: ["Planned Budget", "Actual Budget", "Linear (Actual)"],
    },
    xAxis: {
      type: "category",
      data: labels,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "Planned Budget",
        type: "bar",
        data: plans,
        itemStyle: { color: "#3B82F6" },
        label: {
          show: true,
          position: "top",
        },
      },
      {
        name: "Actual Budget",
        type: "bar",
        data: actuals,
        itemStyle: { color: "#E53935" },
        label: {
          show: true,
          position: "top",
        },
      },
      {
        name: "Linear (Actual)",
        type: "line",
        data: trendLine,
        smooth: false,
        lineStyle: {
          type: "dotted",
          color: "#10B981",
        },
        symbol: "none",
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};
