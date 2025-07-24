import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import axios from "axios";
import { getAccessToken } from "../../../auth/getToken";
import { msalInstance } from "../../../auth/msalInstance";

interface Props {
  siteId: string;
  followListId: string;
  targetListId: string;
  year: number;
}

function normalizeId(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

function beautifyProjectName(s: string): string {
  return s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export const DraxlmaeirCostChart: React.FC<Props> = ({
  siteId,
  followListId,
  targetListId,
  year,
}) => {
  const [projectMonthlyData, setProjectMonthlyData] = useState<Record<string, number[]>>({});
  const [monthlyTarget, setMonthlyTarget] = useState<number[]>(Array(12).fill(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getAccessToken(msalInstance, ["Sites.Read.All"]);
        if (!token) {
          setError("Access token could not be acquired.");
          return;
        }

        const projectMap: Record<string, number[]> = {};
        let urlA = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${followListId}/items?expand=fields&$top=500`;

        while (urlA && !canceled) {
          const respA = await axios.get(urlA, {
            headers: { Authorization: `Bearer ${token}` },
          });

          for (const it of respA.data.value) {
            const f = it.fields;
            if (!f.Date || !f.Project) continue;

            const d = new Date(f.Date);
            if (d.getFullYear() !== year) continue;

            const pNorm = normalizeId(f.Project);
            const month = d.getMonth();

            if (!projectMap[pNorm]) {
              projectMap[pNorm] = Array(12).fill(0);
            }

            projectMap[pNorm][month] += Number(f.TotalNettValue) || 0;
          }

          urlA = respA.data["@odata.nextLink"] || "";
        }

        const cumulativeMap: Record<string, number[]> = {};
        for (const [proj, vals] of Object.entries(projectMap)) {
          const cum = vals.slice();
          for (let i = 1; i < 12; i++) {
            cum[i] += cum[i - 1];
          }
          cumulativeMap[proj] = cum;
        }

        const tgt = Array(12).fill(0);
        let urlT = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${targetListId}/items?expand=fields&$top=500`;

        while (urlT && !canceled) {
          const respT = await axios.get(urlT, {
            headers: { Authorization: `Bearer ${token}` },
          });

          for (const it of respT.data.value) {
            const f = it.fields;
            if (!f.Project || f.Year !== year) continue;

            const m = Number(f.Month);
            if (m >= 1 && m <= 12) {
              tgt[m - 1] += Number(f.Monthlytarget) || 0;
            }
          }

          urlT = respT.data["@odata.nextLink"] || "";
        }

        const cumTgt = tgt.slice();
        for (let i = 1; i < 12; i++) {
          cumTgt[i] += cumTgt[i - 1];
        }

        if (!canceled) {
          setProjectMonthlyData(cumulativeMap);
          setMonthlyTarget(cumTgt);
          setLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        if (!canceled) {
          setError("Unexpected error occurred.");
          setLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [siteId, followListId, targetListId, year]);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (loading) return <p>Loading chart…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const totalPerMonth = Array(12).fill(0);
  for (let i = 0; i < 12; i++) {
    totalPerMonth[i] = Object.values(projectMonthlyData)
      .reduce((sum, arr) => sum + (arr[i] || 0), 0);
  }

  const projectSeries = Object.entries(projectMonthlyData).map(([proj, data]) => ({
    name: beautifyProjectName(proj),
    type: "bar",
    stack: "actuals",
    data: data.map(v => +v.toFixed(0)),
    label: { show: false },
    tooltip: {
      valueFormatter: (v: number) => `€${v.toLocaleString()}`,
    },
  }));

  const totalLabelSeries = {
  name: "Total",
  type: "bar",
  data: totalPerMonth.map(v => +v.toFixed(0)),
  barGap: "-100%", // overlays on existing bars
  label: {
    show: true,
    position: "top",
    formatter: (params: any) => {
      const val = params?.value ?? 0;
      return `{val|${val.toLocaleString()}}`;
    },
    rich: {
      val: {
        backgroundColor: "#fff",
        borderColor: "#999",
        borderWidth: 1,
        borderRadius: 15,
        padding: [4, 8],
        shadowBlur: 4,
        shadowColor: "rgba(0,0,0,0.15)",
        fontSize: 12,
        color: "#333",
      },
    },
  },
  itemStyle: {
    color: "transparent", // ✅ makes the bar invisible
  },
  emphasis: {
    itemStyle: {
      color: "transparent",
    },
  },
  tooltip: {
    show: false,
  },
};

  const targetSeries = {
    name: "Target",
    type: "line",
    data: monthlyTarget.map(v => +v.toFixed(0)),
    smooth: true,
    lineStyle: { type: "dashed" },
    symbol: "circle",
    symbolSize: 6,
    tooltip: {
      valueFormatter: (v: number) => `€${v.toLocaleString()}`,
    },
  };

  return (
    <ReactECharts
      option={{
        backgroundColor: "#ffffff",
        title: {
          text: "Draxlmaeir – Cumulative Project Costs vs. Target",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        legend: {
          data: [
            ...Object.keys(projectMonthlyData).map(beautifyProjectName),
            "Total",
            "Target",
          ],
          top: 24,
        },
        toolbox: { feature: { saveAsImage: {} } },
        xAxis: {
          type: "category",
          data: MONTHS,
          axisTick: { alignWithLabel: true },
        },
        yAxis: {
          type: "value",
          name: "€",
          axisLabel: { formatter: "{value}" },
        },
        series: [
          ...projectSeries,
          totalLabelSeries,
          targetSeries,
        ],
      }}
      style={{ height: 500, width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
};
