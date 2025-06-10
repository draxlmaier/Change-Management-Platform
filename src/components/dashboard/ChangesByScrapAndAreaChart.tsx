import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChangesByScrapAndAreaChartProps {
  data: { area: string; scrap: number; noScrap: number }[];
}

const ChangesByScrapAndAreaChart: React.FC<ChangesByScrapAndAreaChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);

      const option = {
        title: {
          text: 'Changes by Scrap/No Scrap and Area',
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['Scrap', 'No Scrap'],
          bottom: '5%',
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.area),
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: 'Scrap',
            type: 'bar',
            data: data.map(item => item.scrap),
            emphasis: {
              focus: 'series',
            },
          },
          {
            name: 'No Scrap',
            type: 'bar',
            data: data.map(item => item.noScrap),
            emphasis: {
              focus: 'series',
            },
          },
        ],
      };

      chartInstance.setOption(option);

      // Resize chart on window resize
      window.addEventListener('resize', () => {
        chartInstance.resize();
      });

      return () => {
        window.removeEventListener('resize', () => {
          chartInstance.resize();
        });
        chartInstance.dispose();
      };
    }
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
};

export default ChangesByScrapAndAreaChart;
