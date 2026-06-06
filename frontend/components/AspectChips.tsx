import React from 'react';
import type { AspectSentiment } from '../lib/types';

interface AspectChipsProps {
  aspects: AspectSentiment[];
}

export default function AspectChips({ aspects }: AspectChipsProps) {
  if (!aspects || aspects.length === 0) {
    return <div className="text-gray-500 italic text-sm">No aspects detected</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {aspects.map((aspect, idx) => {
        const isPositive = aspect.sentiment === 1;
        return (
          <div 
            key={idx} 
            className={`rounded-lg py-2 px-3 text-sm flex flex-col items-start justify-center ${
              isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            <span className="font-semibold">{isPositive ? '📈' : '📉'} {aspect.aspect}</span>
            <span className="text-gray-600 text-xs mt-0.5">{aspect.confidence.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}
