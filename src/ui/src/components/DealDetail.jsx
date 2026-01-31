import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Building, DollarSign, Calendar, User,
  AlertCircle, CheckCircle, HelpCircle, Edit2, Save, X,
  MessageSquare, FileText, TrendingUp, Zap, ChevronRight,
  Target, Clock, Award
} from 'lucide-react';
import ConfidenceBadge from './shared/ConfidenceBadge';

const MEDDPICC_LABELS = {
  M: { name: 'Metrics', description: 'Quantifiable measures of success', icon: TrendingUp },
  E: { name: 'Economic Buyer', description: 'Person with budget authority', icon: User },
  D1: { name: 'Decision Criteria', description: 'How they will decide', icon: Target },
  D2: { name: 'Decision Process', description: 'Steps to make a decision', icon: Clock },
  P: { name: 'Paper Process', description: 'Procurement/legal requirements', icon: FileText },
  I: { name: 'Implicate Pain', description: 'Business pain being solved', icon: AlertCircle },
  C1: { name: 'Champion', description: 'Internal advocate', icon: Award },
  C2: { name: 'Competition', description: 'Alternative solutions', icon: Zap },
};

const STATUS_OPTIONS = ['unknown', 'partial', 'identified'];

function MeddpiccCard({ letter, data, onUpdate, aiSignals }) {
  const [isEditing, setIsEditing] = useState(false);
  const [evidence, setEvidence] = useState(data?.evidence || '');
  const [status, setStatus] = useState(data?.status || 'unknown');

  const config = MEDDPICC_LABELS[letter];
  const Icon = config.icon;

  const handleSave = () => {
    onUpdate(letter, { status, evidence });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEvidence(data?.evidence || '');
    setStatus(data?.status || 'unknown');
    setIsEditing(false);
  };

  // Get AI-detected signals for this MEDDPICC letter
  const relevantSignals = aiSignals?.filter(s => s.letter === letter) || [];

  return (
    <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            status === 'identified' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
            status === 'partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
            'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-white">{config.name}</h4>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                status === 'identified' ? 'bg-green-500/20 text-green-400' :
                status === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                'bg-zinc-700 text-zinc-500'
              }`}>
                {letter}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{config.description}</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setStatus(opt)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    status === opt
                      ? opt === 'identified' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                        opt === 'partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
                        'bg-zinc-600 text-zinc-300 border border-zinc-500'
                      : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600 hover:bg-zinc-600/50'
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Evidence</label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={3}
              placeholder="What evidence supports this status?"
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded text-sm bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {evidence ? (
            <p className="text-sm text-zinc-300">{evidence}</p>
          ) : (
            <p className="text-sm text-zinc-500 italic">No evidence recorded</p>
          )}

          {/* AI-detected signals */}
          {relevantSignals.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-purple-400">AI Detected</span>
              </div>
              <div className="space-y-1">
                {relevantSignals.map((signal, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    {signal.confidence && (
                      <ConfidenceBadge confidence={signal.confidence} size="sm" />
                    )}
                    <span className="text-zinc-400">{signal.evidence || signal.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MeddpiccSummary({ summary }) {
  if (!summary) return null;

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">AI Analysis</h3>
          <p className="text-xs text-zinc-400">MEDDPICC gaps and recommendations</p>
        </div>
      </div>

      {summary.gaps && summary.gaps.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-zinc-400 mb-2">Gaps to Address</h4>
          <div className="space-y-2">
            {summary.gaps.map((gap, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-red-400">{gap.letter}: </span>
                  <span className="text-xs text-zinc-300">{gap.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.strengths && summary.strengths.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-zinc-400 mb-2">Strengths</h4>
          <div className="space-y-2">
            {summary.strengths.map((strength, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-zinc-300">{strength}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.nextSteps && summary.nextSteps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-500/20">
          <h4 className="text-xs font-medium text-zinc-400 mb-2">Recommended Next Steps</h4>
          <ul className="space-y-1">
            {summary.nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                <ChevronRight className="w-3 h-3 text-purple-400" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DealDetail({ deal, dealId, onBack, onNavigateToPerson }) {
  const [dealData, setDealData] = useState(null);
  const [segments, setSegments] = useState([]);
  const [meddpiccSummary, setMeddpiccSummary] = useState(null);
  const [aiSignals, setAiSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('scorecard');

  const effectiveDealId = dealId || deal?.id;

  useEffect(() => {
    if (effectiveDealId) {
      loadDeal();
    }
  }, [effectiveDealId]);

  const loadDeal = async () => {
    setLoading(true);
    try {
      // Load deal data
      const res = await fetch(`/api/deals/${effectiveDealId}`);
      if (!res.ok) throw new Error('Failed to load deal');
      const data = await res.json();
      setDealData(data);

      // Load related segments
      try {
        const segRes = await fetch(`/api/deals/${effectiveDealId}/segments`);
        if (segRes.ok) {
          setSegments(await segRes.json());
        }
      } catch (e) {
        console.error('Failed to load segments:', e);
      }

      // Load MEDDPICC summary
      try {
        const summaryRes = await fetch(`/api/deals/${effectiveDealId}/meddpicc/summary`);
        if (summaryRes.ok) {
          setMeddpiccSummary(await summaryRes.json());
        }
      } catch (e) {
        console.error('Failed to load MEDDPICC summary:', e);
      }

      // Extract AI signals from MEDDPICC data
      if (data.meddpicc) {
        const signals = data.meddpicc
          .filter(m => m.ai_detected)
          .map(m => ({
            letter: m.letter,
            confidence: m.confidence,
            evidence: m.evidence
          }));
        setAiSignals(signals);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMeddpiccUpdate = async (letter, updates) => {
    try {
      const res = await fetch(`/api/deals/${effectiveDealId}/meddpicc/${letter}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update MEDDPICC');
      loadDeal();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !dealData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">{error || 'Deal not found'}</p>
        <button
          onClick={onBack}
          className="mt-4 text-green-400 hover:text-green-300"
        >
          Go back
        </button>
      </div>
    );
  }

  const letters = ['M', 'E', 'D1', 'D2', 'P', 'I', 'C1', 'C2'];
  const meddpiccMap = (dealData.meddpicc || []).reduce((acc, m) => {
    acc[m.letter] = m;
    return acc;
  }, {});

  const identified = dealData.meddpicc?.filter(m => m.status === 'identified').length || 0;
  const partial = dealData.meddpicc?.filter(m => m.status === 'partial').length || 0;
  const completionPercent = Math.round(((identified + partial * 0.5) / 8) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">{dealData.company_name}</h2>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              dealData.status === 'won' ? 'bg-green-500/20 text-green-400' :
              dealData.status === 'lost' ? 'bg-red-500/20 text-red-400' :
              dealData.status === 'stalled' ? 'bg-amber-500/20 text-amber-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {dealData.status || 'active'}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
            {dealData.contact_name && (
              <button
                onClick={() => onNavigateToPerson && onNavigateToPerson({ name: dealData.contact_name, company: dealData.company_name })}
                className="flex items-center gap-1 hover:text-green-400 transition-colors"
              >
                <User className="w-4 h-4" />
                {dealData.contact_name}
                {dealData.contact_role && ` - ${dealData.contact_role}`}
              </button>
            )}
            {dealData.value_amount && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {dealData.value_amount.toLocaleString()} {dealData.value_currency || 'USD'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-300">MEDDPICC Progress</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-400">
              <CheckCircle className="w-4 h-4" />
              {identified} Identified
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <HelpCircle className="w-4 h-4" />
              {partial} Partial
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-zinc-700/50 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${(identified / 8) * 100}%` }}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${(partial / 8) * 100}%` }}
          />
        </div>

        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          <span>0%</span>
          <span className={`font-medium ${
            completionPercent >= 75 ? 'text-green-400' :
            completionPercent >= 50 ? 'text-amber-400' :
            'text-zinc-400'
          }`}>
            {completionPercent}% Complete
          </span>
          <span>100%</span>
        </div>

        {/* Quick letter overview */}
        <div className="flex gap-1 mt-4 justify-center">
          {letters.map(letter => {
            const item = meddpiccMap[letter];
            const status = item?.status || 'unknown';
            return (
              <div
                key={letter}
                className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center font-bold transition-colors ${
                  status === 'identified' ? 'bg-green-500/30 text-green-400 border border-green-500/50' :
                  status === 'partial' ? 'bg-amber-500/30 text-amber-400 border border-amber-500/50' :
                  'bg-zinc-700/50 text-zinc-500 border border-zinc-600'
                }`}
                title={`${MEDDPICC_LABELS[letter].name}: ${status}`}
              >
                {letter.replace('1', '').replace('2', '')}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Summary */}
      {meddpiccSummary && <MeddpiccSummary summary={meddpiccSummary} />}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('scorecard')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'scorecard'
              ? 'border-green-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Scorecard
        </button>
        <button
          onClick={() => setActiveTab('segments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'segments'
              ? 'border-green-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Related Segments ({segments.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'scorecard' ? (
        <div>
          {/* Notes */}
          {dealData.notes && (
            <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-5 mb-6">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Notes</h3>
              <p className="text-sm text-zinc-400">{dealData.notes}</p>
            </div>
          )}

          {/* MEDDPICC Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {letters.map(letter => (
              <MeddpiccCard
                key={letter}
                letter={letter}
                data={meddpiccMap[letter]}
                onUpdate={handleMeddpiccUpdate}
                aiSignals={aiSignals}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {segments.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No related segments found</p>
            </div>
          ) : (
            segments.map(segment => (
              <div
                key={segment.id}
                className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      segment.classification === 'objection' ? 'bg-red-500/10 text-red-400' :
                      segment.classification === 'buying_signal' ? 'bg-green-500/10 text-green-400' :
                      segment.classification === 'pain_point' ? 'bg-amber-500/10 text-amber-400' :
                      segment.classification === 'decision_criteria' ? 'bg-blue-500/10 text-blue-400' :
                      segment.classification === 'competitor_mention' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-zinc-700 text-zinc-400'
                    }`}>
                      {segment.classification?.replace(/_/g, ' ') || 'unclassified'}
                    </span>
                    {segment.confidence && (
                      <ConfidenceBadge confidence={segment.confidence} size="sm" />
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {segment.transcript_filename || 'Unknown'}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{segment.content}</p>
                {segment.speaker && (
                  <p className="text-xs text-zinc-500 mt-2">Speaker: {segment.speaker}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default DealDetail;
