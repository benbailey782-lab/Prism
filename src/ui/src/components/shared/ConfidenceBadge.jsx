import React from 'react';

export default function ConfidenceBadge({ confidence, size = 'sm' }) {
  const percent = Math.round((confidence || 0) * 100);

  let color = 'bg-zinc-700 text-zinc-400';
  if (percent >= 80) color = 'bg-prism-blue/20 text-prism-blue';
  else if (percent >= 60) color = 'bg-blue-500/20 text-blue-400';
  else if (percent >= 40) color = 'bg-amber-500/20 text-amber-400';
  else if (percent > 0) color = 'bg-red-500/20 text-red-400';

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  return (
    <span className={`rounded-full font-medium ${color} ${sizeClasses[size]}`}>
      {percent}%
    </span>
  );
}
