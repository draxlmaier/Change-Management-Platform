// File: src/components/dashboard/ClosedOpenPieChart.tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

interface Props {
  closedCount: number;
  openCount: number;
}

const ClosedOpenPieChart: React.FC<Props> = ({
  closedCount,
  openCount
}) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br/>Count: {c}<br/>({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: ['Closed','Open']
    },
    series: [{
      name: 'Status',
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
        { value: closedCount, name: 'Closed' },
        { value: openCount,   name: 'Open'   }
      ]
    }]
  };

  return <ReactECharts option={option} style={{ height:300,width:'100%' }} />;
};

export default ClosedOpenPieChart;
