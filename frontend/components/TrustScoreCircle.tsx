import React from 'react';

interface TrustScoreCircleProps {
  score: number;
}

export default function TrustScoreCircle({ score }: TrustScoreCircleProps) {
  const percentage = Math.max(0, Math.min(100, score * 100));
  
  let colorCode = "#16a34a"; // green-600
  let textColorClass = "text-green-700 dark:text-green-400";
  if (score < 0.5) {
    colorCode = "#dc2626"; // red-600
    textColorClass = "text-red-700 dark:text-red-400";
  } else if (score < 0.75) {
    colorCode = "#b45309"; // amber-700
    textColorClass = "text-amber-800 dark:text-amber-400";
  }

  return (
    <div className="flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200">
      <div 
        className="w-[100px] h-[100px] rounded-full flex items-center justify-center relative bg-gray-100 dark:bg-gray-800 shadow-sm"
        style={{
          background: `conic-gradient(${colorCode} ${percentage}%, #e5e7eb ${percentage}%)`
        }}
      >
        <div className={`w-[84px] h-[84px] bg-white dark:bg-gray-900 rounded-full flex items-center justify-center flex-col ${textColorClass} z-10 shadow-inner`}>
          <span className="text-xl font-bold leading-none">{score.toFixed(2)}</span>
        </div>
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">Trust Score</span>
    </div>
  );
}

