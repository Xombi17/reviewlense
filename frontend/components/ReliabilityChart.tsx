"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ReliabilityChartProps {
  high: number;
  medium: number;
  low: number;
}

export default function ReliabilityChart({ high, medium, low }: ReliabilityChartProps) {
  const data = [
    { name: "HIGH", value: Math.round(high), color: "#39FF14" },
    { name: "MEDIUM", value: Math.round(medium), color: "#FFB800" },
    { name: "LOW", value: Math.round(low), color: "#FF4757" },
  ];

  return (
    <div className="w-full h-[180px] font-mono text-[11px] select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 10, right: 60, left: 10, bottom: 5 }}
        >
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            stroke="#5A5A72"
            width={60}
            tick={{ fontFamily: 'var(--font-ibm-plex-mono), monospace', fontWeight: 'bold' }}
          />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            hide 
          />
          
          <Bar 
            dataKey="value" 
            barSize={20} 
            radius={[0, 2, 2, 0]}
            label={{ 
              position: 'right', 
              fill: '#C8C8D4', 
              formatter: (val: any) => ` ${val}%`,
              fontSize: 11,
              fontFamily: 'var(--font-ibm-plex-mono), monospace',
              fontWeight: 'bold'
            }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                style={{ filter: `drop-shadow(0 0 2px ${entry.color}33)` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
