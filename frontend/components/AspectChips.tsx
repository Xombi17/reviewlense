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
            tabIndex={0}
            className={`rounded-lg py-2 px-3 text-sm flex flex-col items-start justify-center cursor-pointer transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isPositive 
                ? 'bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-900/40' 
                : 'bg-red-100 text-red-900 hover:bg-red-200 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40'
            }`}
          >
            <span className="font-semibold">{isPositive ? '📈' : '📉'} {aspect.aspect}</span>
            <span className="text-gray-600 dark:text-gray-400 text-xs mt-0.5">{aspect.confidence.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

