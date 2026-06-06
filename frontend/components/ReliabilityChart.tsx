"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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
    { name: "HIGH", value: high },
    { name: "MEDIUM", value: medium },
    { name: "LOW", value: low },
  ];

  const getColor = (tier: string) => {
    switch (tier) {
      case "HIGH":
        return "#3b82f6"; // blue
      case "MEDIUM":
        return "#f59e0b"; // amber
      case "LOW":
        return "#ef4444"; // red
      default:
        return "#9ca3af";
    }
  };

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis 
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }} 
            domain={[0, 100]}
          />
          <Tooltip cursor={{ fill: "transparent" }} formatter={(value: any) => [`${value}%`, 'Percentage']} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
