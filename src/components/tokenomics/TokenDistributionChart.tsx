
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TokenomicsContent } from '@/lib/types/cms';
import { Loader2 } from 'lucide-react';

const COLORS = ['#22c55e', '#15803d', '#059669', '#10b981', '#34d399', '#4ade80'];

// Default chart data in case no data is available
const DEFAULT_CHART_DATA = [
  { name: "Marketing", value: 20, amount: "13.80B" },
  { name: "Liquidity", value: 20, amount: "13.80B" },
  { name: "Quiz Rewards", value: 25, amount: "17.25B" },
  { name: "Development", value: 15, amount: "10.35B" },
  { name: "Team", value: 10, amount: "6.90B" },
  { name: "Reserve", value: 10, amount: "6.90B" },
];

interface TokenDistributionChartProps {
  animate: boolean;
  content?: TokenomicsContent;
}

export const TokenDistributionChart = ({ animate, content }: TokenDistributionChartProps) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [animationComplete, setAnimationComplete] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimationComplete(true);
      }, 1000); // Wait for animation to complete before showing data
      return () => clearTimeout(timer);
    }
  }, [animate]);

  // Log data to ensure it's being received correctly
  useEffect(() => {
    console.log("TokenDistributionChart received content:", content);
    if (content?.sections) {
      console.log("Using sections from CMS data:", content.sections);
    } else {
      console.log("No sections found in CMS data, using default data");
    }
  }, [content]);

  // Use actual data or fallback to default data
  const chartData = content?.sections?.length ? content.sections : DEFAULT_CHART_DATA;
  
  console.log("Chart data being used:", chartData);

  const handleMouseEnter = (data: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(-1);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 20,
          left: 0,
          bottom: 60
        }}
        onMouseLeave={handleMouseLeave}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={60}
          interval={0}
          tick={{ fill: 'white', fontSize: 10 }}
          tickMargin={5}
        />
        <YAxis 
          label={{ 
            value: 'Allocation (%)', 
            angle: -90, 
            position: 'insideLeft',
            fill: 'white',
            fontSize: 12
          }}
          tick={{ fill: 'white', fontSize: 10 }}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
          labelStyle={{ color: 'white' }}
          itemStyle={{ color: 'white' }}
          formatter={(value: any) => [`${value}%`, 'Allocation']}
        />
        <Bar 
          dataKey="value" 
          radius={[4, 4, 0, 0]}
          animationDuration={animate ? 1500 : 0}
          animationBegin={0}
          onMouseEnter={handleMouseEnter}
        >
          {animationComplete && chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={index === activeIndex ? '#4ade80' : COLORS[index % COLORS.length]} 
              cursor="pointer"
              opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.6}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
