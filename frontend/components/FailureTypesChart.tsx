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

interface FailureTypesChartProps {
  failureTypes: Record<string, number>;
}

export default function FailureTypesChart({ failureTypes }: FailureTypesChartProps) {
  // Convert object to array and sort by value descending
  const data = Object.entries(failureTypes)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 5 distinct colors: blue, orange, green, purple, red
  const COLORS = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#ef4444"];

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={(props: any) => props.name}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [`${value}%`, "Percentage"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
