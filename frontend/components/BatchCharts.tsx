"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { BatchResponse } from "../lib/types";

interface BatchChartsProps {
  results: BatchResponse;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#10b981",
  negative: "#ef4444",
};

const RELIABILITY_COLORS: Record<string, string> = {
  HIGH: "#10b981",
  MEDIUM: "#f59e0b",
  LOW: "#ef4444",
};

export default function BatchCharts({ results }: BatchChartsProps) {
  // Transform sentiment_distribution: { positive: 120, negative: 80 } → [{ name, value }, ...]
  const sentimentData = Object.entries(results.sentiment_distribution).map(
    ([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      rawKey: key,
    })
  );

  // Transform reliability_breakdown to percentages
  const reliabilityRawTotal = Object.values(results.reliability_breakdown).reduce(
    (sum, v) => sum + v,
    0
  );

  const reliabilityData = Object.entries(results.reliability_breakdown).map(
    ([key, value]) => ({
      name: key,
      value:
        reliabilityRawTotal > 0
          ? Math.round((value / reliabilityRawTotal) * 1000) / 10
          : 0,
    })
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Sentiment Distribution PieChart */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Sentiment Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sentimentData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {sentimentData.map((entry, index) => (
                <Cell
                  key={`sentiment-cell-${index}`}
                  fill={
                    SENTIMENT_COLORS[entry.rawKey] ??
                    (index % 2 === 0 ? "#10b981" : "#ef4444")
                  }
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: unknown, name: unknown) => [value as number, String(name)]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Right: Reliability Breakdown BarChart */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Reliability Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={reliabilityData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip
              cursor={{ fill: "transparent" }}
              formatter={(value: unknown) => [`${value}%`, "Percentage"]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {reliabilityData.map((entry, index) => (
                <Cell
                  key={`reliability-cell-${index}`}
                  fill={RELIABILITY_COLORS[entry.name] ?? "#9ca3af"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
