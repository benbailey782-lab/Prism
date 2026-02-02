import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, User, Calendar, DollarSign, TrendingUp, ChevronRight, AlertTriangle } from 'lucide-react';

/**
 * MEDDPICC Progress Ring — circular SVG gauge showing completion
 */
function MeddpiccRing({ scores, size = 80 }) {
  // Count statuses
  const total = 8;
  const identified = scores.filter(s => s.status === 'identified').length;
  const partial = scores.filter(s => s.status === 'partial').length;
  const filled = identified + (partial * 0.5);
  const pct = Math.round((filled / total) * 100);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (filled / total) * circumference;

  // Color based on completion
  const color = pct >= 70 ? '#4AA8D8' : pct >= 40 ? '#D97706' : '#EF4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{pct}%</span>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider">MEDDPICC</span>
      </div>
    </div>
  );
}

/**
 * Status badge with color coding
 */
function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    discovery: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    negotiation: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    proposal: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    closed_won: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    closed_lost: 'bg-red-500/15 text-red-400 border-red-500/20',
    stalled: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    unknown: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20'
  };

  const label = (status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide ${styles[status] || styles.unknown}`}>
      {label}
    </span>
  );
}

/**
 * DealSummaryCard — Rich deal overview for Ask panel answers
 */
export default function DealSummaryCard({ visualization, onNavigate }) {
  const { deal, meddpiccSummary } = visualization;

  if (!deal) return null;

  // Relative time for last activity
  const lastActivity = deal.last_activity_at ? getRelativeTime(deal.last_activity_at) : null;
  const isStale = deal.last_activity_at && (Date.now() - new Date(deal.last_activity_at).getTime()) > 14 * 86400000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card-elevated rounded-xl p-4 mt-3"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-prism-blue flex-shrink-0" />
            <h4 className="text-base font-semibold text-white truncate">{deal.company_name}</h4>
          </div>
          {deal.contact_name && (
            <div className="flex items-center gap-1.5 text-sm text-zinc-400 ml-6">
              <User className="w-3 h-3" />
              <span>{deal.contact_name}</span>
              {deal.contact_role && <span className="text-zinc-600">· {deal.contact_role}</span>}
            </div>
          )}
        </div>

        {/* MEDDPICC ring */}
        {meddpiccSummary && meddpiccSummary.length > 0 && (
          <MeddpiccRing scores={meddpiccSummary} size={72} />
        )}
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-4 py-2 border-t border-b border-white/5 my-2">
        {deal.value_amount && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm font-medium text-white">
              {Number(deal.value_amount).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
            </span>
          </div>
        )}
        <StatusBadge status={deal.status} />
        {deal.stage && (
          <span className="text-xs text-zinc-500">Stage: {deal.stage}</span>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {lastActivity && (
            <div className={`flex items-center gap-1 ${isStale ? 'text-amber-400' : ''}`}>
              {isStale && <AlertTriangle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              <span>{lastActivity}</span>
            </div>
          )}
          {deal.close_date && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Close: {new Date(deal.close_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('deals', deal.id)}
            className="flex items-center gap-1 text-xs text-prism-blue hover:text-prism-blue/80 transition-colors"
          >
            View Deal <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* MEDDPICC letter pills (compact) */}
      {meddpiccSummary && meddpiccSummary.length > 0 && (
        <div className="flex gap-1 mt-3 pt-2 border-t border-white/5">
          {['M', 'E', 'D1', 'D2', 'P', 'I', 'C1', 'C2'].map(letter => {
            const item = meddpiccSummary.find(s => s.letter === letter);
            const status = item?.status || 'unknown';
            const pillStyles = {
              identified: 'bg-prism-blue/20 text-prism-blue',
              partial: 'bg-amber-500/20 text-amber-400',
              unknown: 'bg-zinc-700/50 text-zinc-600'
            };
            return (
              <div
                key={letter}
                className={`w-7 h-6 rounded text-[10px] font-medium flex items-center justify-center ${pillStyles[status] || pillStyles.unknown}`}
                title={`${letter}: ${status}`}
              >
                {letter}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Get human-readable relative time string
 */
function getRelativeTime(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}
