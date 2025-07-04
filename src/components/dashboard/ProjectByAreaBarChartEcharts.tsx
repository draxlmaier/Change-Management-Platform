import React from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption,
  GridComponent,
  GridComponentOption,
} from 'echarts/components';
import { BarChart, BarSeriesOption } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BarChart,
  CanvasRenderer
]);

type EChartsOption = echarts.ComposeOption<
  | TooltipComponentOption
  | LegendComponentOption
  | GridComponentOption
  | BarSeriesOption
>;

/**
 * Props for ProjectByAreaBarChartEcharts.
 * @template ProjID - Literal union of project ID strings.
 */
export interface ProjectByAreaBarChartProps<ProjID extends string> {
  /** Array of objects with an 'area' and numeric values for each project ID */
  data: Array<{ area: string } & Record<ProjID, number>>;
  /** List of projects, providing id (ProjID) and displayName */
  projects: Array<{ id: ProjID; displayName: string }>;
}

/**
 * Bar chart showing percentage breakdown by project for each area.
 * Only works when data is typed so that keys match project IDs.
 */
export function ProjectByAreaBarChartEcharts<ProjID extends string>({
  data,
  projects,
}: ProjectByAreaBarChartProps<ProjID>) {
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: params =>
        (params as any[])
          .map(p => `${p.seriesName}: ${p.value}%`)
          .join('<br/>'),
    },
    legend: {
      data: projects.map(p => p.displayName),
      top: '5%',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.area),
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%' },
    },
    series: projects.map(p => ({
      name: p.displayName,
      type: 'bar',
      stack: 'total',
      data: data.map(d => d[p.id]),
      emphasis: { focus: 'series' },
      barWidth: 20,
    })),
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">% by Project & Area</h2>
      <ReactECharts
        option={option}
        style={{ height: 300, width: '100%' }}
        theme="shine"
      />
    </div>
  );
}
