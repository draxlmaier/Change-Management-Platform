// src/components/dashboard/AreaProjectNestedDonut.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption
} from 'echarts/components';
import { PieChart, PieSeriesOption } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { ComposeOption } from 'echarts/core';

// register the pieces of ECharts we need
echarts.use([
  TooltipComponent,
  LegendComponent,
  PieChart,
  LabelLayout,
  CanvasRenderer
]);

// ComposeOption helps us get full type-checking
type EChartsOption = ComposeOption<
  TooltipComponentOption |
  LegendComponentOption |
  PieSeriesOption
>;

export interface ChangeItem {
  SheetName?: string;  // area
  OEM?: string;        // project
}

interface Props {
  items: ChangeItem[];
}

const AreaProjectNestedDonut: React.FC<Props> = ({ items }) => {
  // 1) aggregate totals by area & by project
  const areaCounts = items.reduce<Record<string, number>>((acc, it) => {
    const area = it.SheetName || 'Unknown';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  const projectCounts = items.reduce<Record<string, number>>((acc, it) => {
    const proj = it.OEM || 'Unknown';
    acc[proj] = (acc[proj] || 0) + 1;
    return acc;
  }, {});

  // 1.1) nested map: area → project → count
  const areaProjectCounts = items.reduce<Record<string, Record<string, number>>>((acc, it) => {
    const area = it.SheetName || 'Unknown';
    const proj = it.OEM       || 'Unknown';
    if (!acc[area]) acc[area] = {};
    acc[area][proj] = (acc[area][proj] || 0) + 1;
    return acc;
  }, {});

  // 1.2) total count of all changes
  const totalAll = items.length;

  // 2) turn into ECharts‐friendly arrays
  const areaData = Object.entries(areaCounts).map(([name, value]) => ({ name, value }));
  const projectData = Object.entries(projectCounts).map(([name, value]) => ({ name, value }));

  // 3) build the chart option
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a}<br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 10,
      data: [
        ...new Set([
          ...areaData.map(d => d.name),
          ...projectData.map(d => d.name)
        ])
      ]
    },
    series: [
      // inner ring = distribution by Project
      {
        name: 'By Project',
        type: 'pie',
        radius: ['30%', '50%'],
        center: ['50%', '45%'],
        label: {
          position: 'outside',
          formatter: '{b}\n{c} ({d}%)'
        },
         labelLine: {
          length: 10,
          length2: 10
        },
        labelLayout: {
          hideOverlap: true,
          moveOverlap: 'shiftY'
        },
        emphasis: { focus: 'series' },
        data: projectData
      },
      // outer ring = distribution by Area, with dual‐line labels
      {
        name: 'By Area',
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['50%', '45%'],
        label: {
          position: 'outside',
          formatter: params => {
            const areaName  = params.name as string;
            const areaCount = areaCounts[areaName] || 0;
            const globalPct = ((areaCount / totalAll) * 100).toFixed(1) + '%';

            // build one line per project for this area
            const projLines = Object.entries(areaProjectCounts[areaName] || {})
              .map(([proj, cnt]) => {
                const projTotal = projectCounts[proj] || 1;
                const pctOfProj = ((cnt / projTotal) * 100).toFixed(1) + '%';
                return `${proj}: ${pctOfProj}`;
              });

            return [
              // Line 1: area + global percentage
              `${areaName} Total Number : ${areaCount} - Total Percentage ${globalPct}`,
              // Line 2+: each project’s share within this area
              ...projLines
            ].join('\n');
          }
        },
        labelLine: {
          length: 15,
          length2: 8
        },
        labelLayout: {
          hideOverlap: true,
          moveOverlap: 'shiftY'
        },
        emphasis: { focus: 'series' },
        data: areaData
      }
    ]
  };

  return (
    <div style={{ width: '100%', height: 400, background: '#fff', borderRadius: 8, padding: 12 }}>
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

export default AreaProjectNestedDonut;
