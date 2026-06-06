import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
}

export default function StatCard({ title, value, unit }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</h3>
      <div className="mt-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      {unit && (
        <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{unit}</div>
      )}
    </div>
  );
}
