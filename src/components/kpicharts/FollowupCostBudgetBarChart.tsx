import React from "react";
import ReactECharts from "echarts-for-react";

interface FollowCostItem {
  Area: string;
  Followupcost_x002f_BudgetPA: number;
  InitiationReasons: string;
  BucketResponsible: string;
}

interface Props {
  data: FollowCostItem[];
}

export const FollowupCostBudgetBarChart: React.FC<Props> = ({ data }) => {
  const areaMap = new Map<string, number[]>();

  data.forEach((item) => {
    if (!item.Area || isNaN(item.Followupcost_x002f_BudgetPA)) return;
    if (!areaMap.has(item.Area)) {
      areaMap.set(item.Area, []);
    }
    areaMap.get(item.Area)?.push(item.Followupcost_x002f_BudgetPA);
  });

  const areas = Array.from(areaMap.keys());
  const averages = areas.map(
    (area) => {
      const values = areaMap.get(area)!;
      const sum = values.reduce((acc, v) => acc + v, 0);
      return +(sum / values.length).toFixed(2);
    }
  );

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const area = params[0].axisValue;
        const filtered = data.filter((d) => d.Area === area);
        const initCount: Record<string, number> = {};
        const bucketCount: Record<string, number> = {};
        filtered.forEach((item) => {
          initCount[item.InitiationReasons] = (initCount[item.InitiationReasons] || 0) + 1;
          bucketCount[item.BucketResponsible] = (bucketCount[item.BucketResponsible] || 0) + 1;
        });
        const initTotal = Object.values(initCount).reduce((a, b) => a + b, 0);
        const bucketTotal = Object.values(bucketCount).reduce((a, b) => a + b, 0);

        const initText = Object.entries(initCount)
          .map(([key, val]) => `${key}: ${((val / initTotal) * 100).toFixed(1)}%`)
          .join("<br>");
        const bucketText = Object.entries(bucketCount)
          .map(([key, val]) => `${key}: ${((val / bucketTotal) * 100).toFixed(1)}%`)
          .join("<br>");

        return `Area: ${area}<br>Avg Cost/Budget: ${params[0].data}<br><br><b>Initiation Reasons</b><br>${initText}<br><br><b>Bucket Responsible</b><br>${bucketText}`;
      },
    },
    xAxis: {
      type: "category",
      data: areas,
    },
    yAxis: {
      type: "value",
      name: "Avg Cost / Budget PA",
    },
    series: [
      {
        data: averages,
        type: "bar",
        itemStyle: {
          color: "#3B82F6",
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
};
