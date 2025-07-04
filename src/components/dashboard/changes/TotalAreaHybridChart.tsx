// src/components/dashboard/TotalAreaHybridChart.tsx
import React, { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import {
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponentOption,
  TooltipComponentOption,
  LegendComponentOption,
  GridComponentOption
} from "echarts/components";
import {
  LineChart,
  PieChart,
  LineSeriesOption,
  PieSeriesOption
} from "echarts/charts";
import { UniversalTransition, LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  UniversalTransition,
  LabelLayout,
  CanvasRenderer
]);

type EChartsOption = echarts.ComposeOption<
  | DatasetComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | GridComponentOption
  | LineSeriesOption
  | PieSeriesOption
>;

export interface ChangeItem {
  SheetName?: string;     // area (ignored now)
  OEM?: string;           // project
  processyear?: string;   // e.g. "2025"
  processmonth?: string;  // "01"–"12"
  processday?: string;    // "01"–"31"
}

export type FilterMode =
  | "year"
  | "quarter"
  | "month"
  | "day"
  | "weekOfMonth"
  | "weekOfYear"
  | "customRange";

interface Props {
  items: ChangeItem[];
  filterMode: FilterMode;
  /** only used when filterMode==="month" */
  viewBy?: "week" | "day";
  /** always set when filterMode==="year" or "month" */
  selectedYear?: string;
  /** only for filterMode==="month" */
  selectedMonth?: string;
  /**
   * in filterMode==="year" you can either show ALL years
   * or drill into months of one year:
   */
  yearViewMode?: "all" | "single";
}

const TotalAreaHybridChart: React.FC<Props> = ({
  items,
  filterMode,
  viewBy = "week",
  selectedYear,
  selectedMonth,
  yearViewMode = "all"
}) => {
  const echRef = useRef<any>(null);

  // ——— No area filtering!  ———
  const finalItems = items;

  // ——— Build your timeBuckets exactly as before ———
  let timeBuckets: string[];

  if (filterMode === "month") {
    // month‐mode → restrict to that year/month
    const monthItems = finalItems.filter(
      i =>
        i.processyear === selectedYear &&
        i.processmonth?.padStart(2, "0") === selectedMonth?.padStart(2, "0")
    );

    if (viewBy === "week") {
      timeBuckets = ["W1", "W2", "W3", "W4", "W5"];
    } else {
      timeBuckets = Array.from({ length: 31 }, (_, i) =>
        String(i + 1).padStart(2, "0")
      );
    }
    // overwrite for counting:
    finalItems.splice(0, finalItems.length, ...monthItems);
  } else {
    // year‐mode
    if (yearViewMode === "single" && selectedYear) {
      // drill into months of selectedYear
      const yearItems = finalItems.filter(i => i.processyear === selectedYear);
      timeBuckets = Array.from({ length: 12 }, (_, i) =>
        String(i + 1).padStart(2, "0")
      );
      finalItems.splice(0, finalItems.length, ...yearItems);
    } else {
      // all‐years mode
      timeBuckets = Array.from(
        new Set(finalItems.map(i => i.processyear || "Unknown"))
      ).sort((a, b) => +a - +b);
    }
  }

  // ——— Unique projects across all areas ———
  const projs = Array.from(new Set(finalItems.map(i => i.OEM || "Unknown")));

  // ——— Build dataset.source ———
  const source: any[][] = [
    ["project", ...timeBuckets],
    ...projs.map(proj => [
      proj,
      ...timeBuckets.map(bucket => {
        return finalItems.filter(i => {
          if ((i.OEM || "Unknown") !== proj) return false;

          if (filterMode === "month") {
            if (viewBy === "week") {
              const d = parseInt(i.processday || "0", 10);
              const wk = parseInt(bucket.replace("W", ""), 10);
              return d >= (wk - 1) * 7 + 1 && d <= wk * 7;
            } else {
              return i.processday?.padStart(2, "0") === bucket;
            }
          } else {
            if (yearViewMode === "single") {
              // bucket = "01"…"12"
              return i.processmonth?.padStart(2, "0") === bucket;
            } else {
              // bucket = year
              return i.processyear === bucket;
            }
          }
        }).length;
      })
    ])
  ];

  // ——— Series definitions ———
  const lineSeries = projs.map(
    () =>
      ({
        type: "line" as const,
        smooth: true,
        seriesLayoutBy: "row" as const,
        emphasis: { focus: "series" as const }
      }) as LineSeriesOption
  );

  const pieSeries = ({
    type: "pie" as const,
    id: "pie",
    radius: "30%",
    center: ["50%", "25%"],
    emphasis: { focus: "self" as const },
    label: { formatter: `{b}: {@${timeBuckets[0]}} ({d}%)` },
    encode: {
      itemName: "project",
      value: timeBuckets[0],
      tooltip: timeBuckets[0]
    }
  } as PieSeriesOption);

  // ——— Chart option ———
  const xAxisName =
    filterMode === "month"
      ? viewBy === "week"
        ? "Week of Month"
        : "Day of Month"
      : yearViewMode === "single"
      ? "Month"
      : "Year";

  const option: EChartsOption = {
    title: { text: "All", left: "center" },
    legend: { orient: "horizontal", bottom: "5%", left: "center" },
    tooltip: { trigger: "axis", showContent: false },
    dataset: { source },
    xAxis: { type: "category", name: xAxisName },
    yAxis: [{ gridIndex: 0, name: "Count" }],
    grid: [{ top: "55%" }],
    series: [...lineSeries, pieSeries]
  };

  // ——— Sync pie on hover ———
  useEffect(() => {
    const chart = echRef.current?.getEchartsInstance();
    if (!chart) return;
    chart.on("updateAxisPointer", (evt: any) => {
      const info = evt.axesInfo?.[0];
      if (info) {
        const dim = info.value + 1;
        chart.setOption({
          series: {
            id: "pie",
            label: { formatter: `{b}: {@[${dim}]} ({d}%)` },
            encode: { value: dim, tooltip: dim }
          }
        });
      }
    });
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: 360,
        marginBottom: 24,
        background: "#fff",
        padding: 12,
        borderRadius: 8
      }}
    >
      <ReactECharts
        ref={echRef}
        echarts={echarts}
        option={option}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default TotalAreaHybridChart;
