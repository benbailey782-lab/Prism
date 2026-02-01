import React, { useState, useEffect } from 'react';
import {
  Plus, Search, AlertCircle, Clock, CheckCircle,
  Building2, TrendingUp, ChevronRight, Compass
} from 'lucide-react';
import TierBadge from './TierBadge';
import ProspectForm from './ProspectForm';
import EmptyState from '../shared/EmptyState';

export default function ProspectList({ onSelect }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ tier: 'all', status: 'active' });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchProspects();
    fetchStats();
  }, [filter]);

  const fetchProspects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.tier !== 'all') params.set('tier', filter.tier);
      if (filter.status !== 'all') params.set('status', filter.status);

      const res = await fetch(`/api/prospects?${params}`);
      const data = await res.json();
      setProspects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch prospects:', err);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/outreach/stats');
      setStats(await res.json());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const filteredProspects = (prospects || []).filter(p =>
    (p.company_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const groupedByTier = {
    1: filteredProspects.filter(p => p.tier === 1),
    2: filteredProspects.filter(p => p.tier === 2),
    3: filteredProspects.filter(p => p.tier === 3),
  };

  const getOutreachStatus = (prospect) => {
    if (!prospect.last_outreach_date) return { status: 'never', label: 'Never contacted' };

    const daysSince = Math.floor((Date.now() - new Date(prospect.last_outreach_date)) / (1000 * 60 * 60 * 24));
    const overdueThreshold = prospect.tier === 1 ? 5 : prospect.tier === 2 ? 7 : 14;

    if (daysSince > overdueThreshold) return { status: 'overdue', label: `${daysSince}d overdue`, days: daysSince };
    if (prospect.next_followup_date && new Date(prospect.next_followup_date) <= new Date()) {
      return { status: 'due', label: 'Due today' };
    }
    return { status: 'ok', label: `${daysSince}d ago`, days: daysSince };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Prospects</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {prospects.length} accounts · {stats?.overdueCount || 0} need attention
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Prospect
        </button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={stats.overdueCount || 0}
            color="red"
          />
          <StatCard
            icon={Clock}
            label="Due Today"
            value={stats.dueToday || 0}
            color="amber"
          />
          <StatCard
            icon={TrendingUp}
            label="Response Rate"
            value={`${Math.round((stats.responseRate || 0) * 100)}%`}
            color="green"
          />
          <StatCard
            icon={CheckCircle}
            label="Meetings This Week"
            value={stats.meetingsBooked || 0}
            color="blue"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search prospects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        <select
          value={filter.tier}
          onChange={(e) => setFilter({ ...filter, tier: e.target.value })}
          className="px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200 focus:outline-none focus:border-green-500/50"
        >
          <option value="all">All Tiers</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>

        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200 focus:outline-none focus:border-green-500/50"
        >
          <option value="active">Active</option>
          <option value="nurture">Nurture</option>
          <option value="all">All Status</option>
        </select>
      </div>

      {/* Prospect List by Tier */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : filteredProspects.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No prospects yet"
          description="Add your first prospect to start tracking your outbound pipeline"
          action={() => setShowForm(true)}
          actionLabel="Add Prospect"
        />
      ) : (
        <div className="space-y-8">
          {[1, 2, 3].map(tier => (
            groupedByTier[tier].length > 0 && (
              <div key={tier}>
                <div className="flex items-center gap-3 mb-4">
                  <TierBadge tier={tier} size="sm" />
                  <span className="text-sm text-zinc-400">
                    {groupedByTier[tier].length} prospects
                  </span>
                </div>

                <div className="space-y-2">
                  {groupedByTier[tier].map(prospect => {
                    const outreach = getOutreachStatus(prospect);
                    return (
                      <div
                        key={prospect.id}
                        onClick={() => onSelect(prospect)}
                        className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4 hover:bg-zinc-800 hover:border-zinc-600/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-zinc-400" />
                            </div>

                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium text-white">{prospect.company_name}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                                  Score: {prospect.score}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                                {prospect.industry && <span>{prospect.industry}</span>}
                                {prospect.employee_range && <span>· {prospect.employee_range}</span>}
                                {prospect.primary_contact && (
                                  <span>· {prospect.primary_contact}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Outreach status */}
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              outreach.status === 'overdue' ? 'bg-red-500/10 text-red-400' :
                              outreach.status === 'due' ? 'bg-amber-500/10 text-amber-400' :
                              outreach.status === 'never' ? 'bg-zinc-700 text-zinc-400' :
                              'bg-zinc-700 text-zinc-400'
                            }`}>
                              {outreach.label}
                            </div>

                            <ChevronRight className="w-5 h-5 text-zinc-600" />
                          </div>
                        </div>

                        {/* Signal tags */}
                        {prospect.signals && prospect.signals.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {prospect.signals.slice(0, 4).map((signal, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400"
                              >
                                {signal.signal_type.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {prospect.signals.length > 4 && (
                              <span className="text-xs text-zinc-500">
                                +{prospect.signals.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Add Prospect Modal */}
      {showForm && (
        <ProspectForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchProspects();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    red: 'bg-red-500/10 text-red-400',
    amber: 'bg-amber-500/10 text-amber-400',
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold text-white">{value}</div>
          <div className="text-xs text-zinc-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
