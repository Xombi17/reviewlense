import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
}

export default function StatCard({ title, value, unit }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium truncate" title={title}>{title}</h3>
      <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{value}</span>
        {unit && (
          <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium truncate" title={unit}>{unit}</span>
        )}
      </div>
    </div>
  );
}

