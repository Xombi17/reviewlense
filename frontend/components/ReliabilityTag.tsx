import React from 'react';

interface ReliabilityTagProps {
  reliability: "HIGH" | "MEDIUM" | "LOW";
}

export default function ReliabilityTag({ reliability }: ReliabilityTagProps) {
  const styles = {
    HIGH: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
    MEDIUM: "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-400",
    LOW: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400"
  };

  const labels = {
    HIGH: "High Reliability",
    MEDIUM: "Medium Reliability",
    LOW: "Low Reliability"
  };

  return (
    <div className={`rounded-full py-1 px-3 text-sm font-semibold w-fit hover:shadow transition-shadow duration-200 ${styles[reliability]}`}>
      {labels[reliability]}
    </div>
  );
}

