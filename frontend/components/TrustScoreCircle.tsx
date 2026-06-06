import React from 'react';

interface TrustScoreCircleProps {
  score: number;
}

export default function TrustScoreCircle({ score }: TrustScoreCircleProps) {
  const percentage = Math.max(0, Math.min(100, score * 100));
  
  let colorCode = "#22c55e"; // green-500
  let textColorClass = "text-green-600";
  if (score < 0.5) {
    colorCode = "#ef4444"; // red-500
    textColorClass = "text-red-600";
  } else if (score < 0.75) {
    colorCode = "#eab308"; // yellow-500
    textColorClass = "text-yellow-600";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className="w-[100px] h-[100px] rounded-full flex items-center justify-center relative bg-gray-100 shadow-sm"
        style={{
          background: `conic-gradient(${colorCode} ${percentage}%, #f3f4f6 ${percentage}%)`
        }}
      >
        <div className={`w-[84px] h-[84px] bg-white rounded-full flex items-center justify-center flex-col ${textColorClass} z-10`}>
          <span className="text-xl font-bold leading-none">{score.toFixed(2)}</span>
        </div>
      </div>
      <span className="text-xs text-gray-600 mt-2 font-medium">Trust Score</span>
    </div>
  );
}
