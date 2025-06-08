// File: src/components/dashboard/ValidationPieChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface Props {
  validatedCount: number;
  notValidatedCount: number;
}

const ValidationPieChart: React.FC<Props> = ({
  validatedCount,
  notValidatedCount
}) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br/>Count: {c}<br/>({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: ['Validated','Not Validated']
    },
    series: [{
      name: 'Validation',
      type: 'pie',
      radius: ['40%','70%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}: {c} ({d}%)'
      },
      labelLine: { show: true },
      data: [
        { value: validatedCount,    name: 'Validated'     },
        { value: notValidatedCount, name: 'Not Validated' }
      ]
    }]
  };

  return <ReactECharts option={option} style={{ height:300,width:'100%' }} />;
};

export default ValidationPieChart;
