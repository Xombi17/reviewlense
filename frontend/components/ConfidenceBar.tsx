import React, { useState, useEffect } from 'react';

interface ConfidenceBarProps {
  confidence: number;
  sentiment?: 0 | 1;
}

export default function ConfidenceBar({ confidence, sentiment = 1 }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(percentage);
    }, 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  const isPositive = sentiment === 1;

  return (
    <div className="w-full font-mono">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-[10px] uppercase text-muted-text tracking-widest">CONFIDENCE</span>
        <span className={`text-[12px] font-bold ${isPositive ? 'text-accent-green' : 'text-accent-coral'}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-terminal-border h-[4px] rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-[600ms] ease-out ${
            isPositive ? 'bg-accent-green' : 'bg-accent-coral'
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
