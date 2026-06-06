import React from "react";

export default function BatchSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6 animate-pulse">
      {/* Summary stat cards row — 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-gray-200 dark:bg-gray-700 h-20 w-full"
          />
        ))}
      </div>

      {/* Charts row — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-gray-200 dark:bg-gray-700 h-80 w-full" />
        <div className="rounded-lg bg-gray-200 dark:bg-gray-700 h-80 w-full" />
      </div>

      {/* Top reviews row — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-gray-200 dark:bg-gray-700 h-64 w-full" />
        <div className="rounded-lg bg-gray-200 dark:bg-gray-700 h-64 w-full" />
      </div>
    </div>
  );
}
