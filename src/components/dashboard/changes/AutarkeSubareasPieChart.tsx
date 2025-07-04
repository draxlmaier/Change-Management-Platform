// src/components/dashboard/AutarkeSubareasPieChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  LegendComponent,
  TooltipComponentOption,
  LegendComponentOption
} from 'echarts/components';
import { PieChart, PieSeriesOption } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([TooltipComponent, LegendComponent, PieChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  TooltipComponentOption | LegendComponentOption | PieSeriesOption
>;

export interface ChangeItem {
  SheetName?: string;       // Area
  Constructedspace?: string; // Sub-area
}

interface Props {
  items: ChangeItem[];
}

const AutarkeSubareasPieChart: React.FC<Props> = ({ items }) => {
  // filter only Autarke area
  const subs = items.filter(i => (i.SheetName || 'Unknown') === 'Autarke');

  // group by Constructedspace
  const counts: Record<string, number> = {};
  subs.forEach(i => {
    const sub = i.Constructedspace || 'Unknown';
    counts[sub] = (counts[sub] || 0) + 1;
  });

  // build data array
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  const option: EChartsOption = {
    title: { text: 'Autarke — Subareas', left: 'center' },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: data.map(d => d.name)
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['65%', '50%'],
        label: { formatter: '{b}: {d}%' },
        data
      }
    ]
  };

  return (
    <div style={{ width: '100%', height: 360, background: '#fff', borderRadius: 8, padding: 12 }}>
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default AutarkeSubareasPieChart;

