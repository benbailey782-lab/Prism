import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Building, DollarSign, Calendar, User,
  AlertCircle, CheckCircle, HelpCircle, Edit2, Save, X
} from 'lucide-react';

const MEDDPICC_LABELS = {
  M: { name: 'Metrics', description: 'Quantifiable measures of success' },
  E: { name: 'Economic Buyer', description: 'Person with budget authority' },
  D1: { name: 'Decision Criteria', description: 'How they will decide' },
  D2: { name: 'Decision Process', description: 'Steps to make a decision' },
  P: { name: 'Paper Process', description: 'Procurement/legal requirements' },
  I: { name: 'Implicate Pain', description: 'Business pain being solved' },
  C1: { name: 'Champion', description: 'Internal advocate' },
  C2: { name: 'Competition', description: 'Alternative solutions' },
};

const STATUS_OPTIONS = ['unknown', 'partial', 'identified'];

function MeddpiccCard({ letter, data, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [evidence, setEvidence] = useState(data?.evidence || '');
  const [status, setStatus] = useState(data?.status || 'unknown');

  const config = MEDDPICC_LABELS[letter];

  const handleSave = () => {
    onUpdate(letter, { status, evidence });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEvidence(data?.evidence || '');
    setStatus(data?.status || 'unknown');
    setIsEditing(false);
  };

  return (
    <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
            status === 'identified' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
            status === 'partial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
            'bg-zinc-700/50 text-zinc-400 border border-zinc-600'
          }`}>
            {letter}
          </div>
          <div>
            <h4 className="font-medium text-white">{config.name}</h4>
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
        <div>
          {evidence ? (
            <p className="text-sm text-zinc-300">{evidence}</p>
          ) : (
            <p className="text-sm text-zinc-500 italic">No evidence recorded</p>
          )}
        </div>
      )}
    </div>
  );
}

function DealDetail({ dealId, onBack }) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDeal();
  }, [dealId]);

  const loadDeal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}`);
      if (!res.ok) throw new Error('Failed to load deal');
      const data = await res.json();
      setDeal(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMeddpiccUpdate = async (letter, updates) => {
    try {
      const res = await fetch(`/api/deals/${dealId}/meddpicc/${letter}`, {
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

  if (error || !deal) {
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
  const meddpiccMap = (deal.meddpicc || []).reduce((acc, m) => {
    acc[m.letter] = m;
    return acc;
  }, {});

  const identified = deal.meddpicc?.filter(m => m.status === 'identified').length || 0;
  const partial = deal.meddpicc?.filter(m => m.status === 'partial').length || 0;

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
          <h2 className="text-xl font-semibold text-white">{deal.company_name}</h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
            {deal.contact_name && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {deal.contact_name}
                {deal.contact_role && ` - ${deal.contact_role}`}
              </span>
            )}
            {deal.value_amount && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {deal.value_amount.toLocaleString()} {deal.value_currency || 'USD'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status & Summary */}
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
          <span>{Math.round(((identified + partial * 0.5) / 8) * 100)}% Complete</span>
          <span>100%</span>
        </div>
      </div>

      {/* Notes */}
      {deal.notes && (
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-2">Notes</h3>
          <p className="text-sm text-zinc-400">{deal.notes}</p>
        </div>
      )}

      {/* MEDDPICC Grid */}
      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-4">MEDDPICC Scorecard</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {letters.map(letter => (
            <MeddpiccCard
              key={letter}
              letter={letter}
              data={meddpiccMap[letter]}
              onUpdate={handleMeddpiccUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DealDetail;
