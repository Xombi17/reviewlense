import React from 'react';

interface ConfidenceBarProps {
  confidence: number;
  max?: number;
}

export default function ConfidenceBar({ confidence, max = 1.0 }: ConfidenceBarProps) {
  const normalized = Math.max(0, Math.min(100, ((confidence - 0.5) / 0.5) * 100));

  return (
    <div className="w-full">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Confidence: {Math.round(normalized)}%
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}

