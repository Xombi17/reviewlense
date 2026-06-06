import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="w-full flex flex-col gap-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      <div className="h-5 bg-gray-200 rounded w-full"></div>
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-20 bg-gray-200 rounded w-full"></div>
    </div>
  );
}
