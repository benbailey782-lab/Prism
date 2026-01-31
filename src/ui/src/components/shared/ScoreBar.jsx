import React from 'react';

export default function ScoreBar({ score, max = 100, showLabel = true, size = 'md' }) {
  const percent = Math.min(100, Math.max(0, (score / max) * 100));

  let color = 'bg-zinc-600';
  if (percent >= 70) color = 'bg-green-500';
  else if (percent >= 40) color = 'bg-amber-500';
  else if (percent > 0) color = 'bg-red-500';

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-zinc-800 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-zinc-400 w-8 text-right">{Math.round(score)}</span>
      )}
    </div>
  );
}
