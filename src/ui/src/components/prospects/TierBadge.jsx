import React from 'react';

export default function TierBadge({ tier, size = 'md' }) {
  const tiers = {
    1: { label: 'Tier 1', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    2: { label: 'Tier 2', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    3: { label: 'Tier 3', color: 'bg-zinc-700 text-zinc-400 border-zinc-600' }
  };

  const config = tiers[tier] || tiers[3];

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium border
      ${config.color} ${sizeClasses[size]}
    `}>
      {config.label}
    </span>
  );
}
