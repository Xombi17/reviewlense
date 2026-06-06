import React from 'react';

interface ConfidenceBarProps {
  confidence: number;
  max?: number;
}

export default function ConfidenceBar({ confidence, max = 1.0 }: ConfidenceBarProps) {
  const normalized = Math.max(0, Math.min(100, ((confidence - 0.5) / 0.5) * 100));

  return (
    <div className="w-full">
      <div className="text-sm text-gray-700 mb-1 font-semibold">
        Confidence: {Math.round(normalized)}%
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}
