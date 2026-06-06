import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 animate-pulse">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-[100px] w-full" />
        ))}
      </div>

      {/* 2 Charts Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-[300px] w-full" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-[300px] w-full" />
      </div>

      {/* 1 Table */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-[200px] w-full" />
    </div>
  );
}
