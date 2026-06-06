"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SentimentChartProps {
  positive: number;
  negative: number;
}

export default function SentimentChart({ positive, negative }: SentimentChartProps) {
  const total = positive + negative;
  const positivePercentage = total > 0 ? ((positive / total) * 100).toFixed(1) : 0;
  const negativePercentage = total > 0 ? ((negative / total) * 100).toFixed(1) : 0;

  const data = [
    { name: "Positive", value: positive, percentage: positivePercentage },
    { name: "Negative", value: negative, percentage: negativePercentage },
  ];

  const COLORS = ["#10b981", "#ef4444"]; // Green and Red

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={(props: any) => `${props.payload.percentage}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: any, props: any) => [
              `${value} (${props.payload.percentage}%)`, 
              name
            ]} 
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
