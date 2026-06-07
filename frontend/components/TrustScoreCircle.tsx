import React, { useState, useEffect } from 'react';

interface TrustScoreCircleProps {
  score: number;
}

export default function TrustScoreCircle({ score }: TrustScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 50);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 32;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore * circumference);

  return (
    <div className="flex flex-col items-center justify-center select-none font-mono">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke="#1E1E2E"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke="#00D4FF"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)',
              filter: 'drop-shadow(0 0 3px rgba(0, 212, 255, 0.4))'
            }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-[20px] font-bold text-white tracking-tighter leading-none">
            {score.toFixed(2)}
          </span>
          <span className="text-[9px] text-muted-text mt-0.5 font-mono">0.0 - 1.0</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-text uppercase tracking-widest mt-1">TRUST SCORE</span>
    </div>
  );
}
