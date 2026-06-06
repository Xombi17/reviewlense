import React from 'react';

interface ReliabilityTagProps {
  reliability: "HIGH" | "MEDIUM" | "LOW";
}

export default function ReliabilityTag({ reliability }: ReliabilityTagProps) {
  const styles = {
    HIGH: "bg-blue-100 text-blue-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-red-100 text-red-700"
  };

  const labels = {
    HIGH: "High Reliability",
    MEDIUM: "Medium Reliability",
    LOW: "Low Reliability"
  };

  return (
    <div className={`rounded-full py-1 px-3 text-xs font-semibold w-fit ${styles[reliability]}`}>
      {labels[reliability]}
    </div>
  );
}
