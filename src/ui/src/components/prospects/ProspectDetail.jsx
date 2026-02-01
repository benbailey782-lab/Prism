import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, Globe, MapPin, Users, Plus,
  Trash2, Edit2, Mail, Phone, Linkedin, UserPlus,
  Send, Calendar, TrendingUp, Target
} from 'lucide-react';
import TierBadge from './TierBadge';
import ScoreBar from '../shared/ScoreBar';
import OutreachLog from './OutreachLog';

export default function ProspectDetail({ prospect: initialProspect, onBack }) {
  const [prospect, setProspect] = useState(initialProspect);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddSignal, setShowAddSignal] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showLogOutreach, setShowLogOutreach] = useState(false);

  useEffect(() => {
    if (initialProspect?.id) {
      fetchProspect();
    }
  }, [initialProspect?.id]);

  const fetchProspect = async () => {
    try {
      const res = await fetch(`/api/prospects/${initialProspect.id}`);
      const data = await res.json();
      setProspect(data);
    } catch (err) {
      console.error('Failed to fetch prospect:', err);
    }
    setLoading(false);
  };

  const handleAddSignal = async (signalData) => {
    try {
      await fetch(`/api/prospects/${prospect.id}/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signalData)
      });
      fetchProspect();
      setShowAddSignal(false);
    } catch (err) {
      console.error('Failed to add signal:', err);
    }
  };

  const handleRemoveSignal = async (signalId) => {
    try {
      await fetch(`/api/prospects/${prospect.id}/signals/${signalId}`, { method: 'DELETE' });
      fetchProspect();
    } catch (err) {
      console.error('Failed to remove signal:', err);
    }
  };

  const handleAddContact = async (contactData) => {
    try {
      await fetch(`/api/prospects/${prospect.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      fetchProspect();
      setShowAddContact(false);
    } catch (err) {
      console.error('Failed to add contact:', err);
    }
  };

  const handleConvertToDeal = async () => {
    const value = prompt('Deal value (optional):');
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealValue: value ? parseFloat(value) : null })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Converted to deal! Deal ID: ${data.dealId}`);
        onBack();
      }
    } catch (err) {
      console.error('Failed to convert:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-zinc-400" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">{prospect.company_name}</h1>
              <TierBadge tier={prospect.tier} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
              {prospect.industry && <span>{prospect.industry}</span>}
              {prospect.employee_range && <span>· {prospect.employee_range}</span>}
              {prospect.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {prospect.location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogOutreach(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
            Log Outreach
          </button>
          <button
            onClick={handleConvertToDeal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
          >
            <Target className="w-4 h-4" />
            Convert to Deal
          </button>
        </div>
      </div>

      {/* Score Overview */}
      <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-300">Prospect Score</span>
          <span className="text-lg font-semibold text-white">{prospect.score}/100</span>
        </div>
        <ScoreBar score={prospect.score} size="lg" showLabel={false} />
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="flex gap-6">
          {['overview', 'contacts', 'outreach', 'signals'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Company Info */}
          <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4">
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Company Info</h3>
            <div className="space-y-3">
              {prospect.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-zinc-500" />
                  <a href={prospect.website} target="_blank" rel="noopener noreferrer"
                     className="text-blue-400 hover:underline">
                    {prospect.website}
                  </a>
                </div>
              )}
              {prospect.employee_range && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-300">{prospect.employee_range} employees</span>
                </div>
              )}
              {prospect.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  <span className="text-zinc-300">{prospect.location}</span>
                </div>
              )}
            </div>

            {prospect.notes && (
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <h4 className="text-xs text-zinc-500 uppercase mb-2">Notes</h4>
                <p className="text-sm text-zinc-300">{prospect.notes}</p>
              </div>
            )}
          </div>

          {/* Signals Summary */}
          <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-300">Buying Signals</h3>
              <button
                onClick={() => setShowAddSignal(true)}
                className="text-xs text-green-400 hover:text-green-300"
              >
                + Add Signal
              </button>
            </div>
            <div className="space-y-2">
              {prospect.signals?.slice(0, 5).map(signal => (
                <div key={signal.id} className="flex items-center justify-between py-2 border-b border-zinc-700/50 last:border-0">
                  <div>
                    <span className="text-sm text-zinc-200 capitalize">
                      {signal.signal_type.replace(/_/g, ' ')}
                    </span>
                    {signal.signal_value && (
                      <p className="text-xs text-zinc-500 mt-0.5">{signal.signal_value}</p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                    +{signal.weight}
                  </span>
                </div>
              ))}
              {(!prospect.signals || prospect.signals.length === 0) && (
                <p className="text-sm text-zinc-500">No signals yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Contact
            </button>
          </div>

          <div className="grid gap-4">
            {prospect.contacts?.map(contact => (
              <div key={contact.id} className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{contact.name}</span>
                      {contact.is_primary === 1 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                          Primary
                        </span>
                      )}
                      {contact.persona && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300 capitalize">
                          {contact.persona.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {contact.title && (
                      <p className="text-sm text-zinc-400 mt-0.5">{contact.title}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1 text-sm text-zinc-400">
                      <Phone className="w-4 h-4" />
                      {contact.phone}
                    </span>
                  )}
                  {contact.linkedin_url && (
                    <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
            {(!prospect.contacts || prospect.contacts.length === 0) && (
              <p className="text-center text-zinc-500 py-8">No contacts yet</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'outreach' && (
        <OutreachLog
          prospectId={prospect.id}
          outreach={prospect.outreach || []}
          onRefresh={fetchProspect}
        />
      )}

      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddSignal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Signal
            </button>
          </div>

          <div className="space-y-2">
            {prospect.signals?.map(signal => (
              <div key={signal.id} className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-200 capitalize">
                      {signal.signal_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                      +{signal.weight} pts
                    </span>
                  </div>
                  {signal.signal_value && (
                    <p className="text-sm text-zinc-400 mt-1">{signal.signal_value}</p>
                  )}
                  {signal.source && (
                    <p className="text-xs text-zinc-500 mt-1">Source: {signal.source}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveSignal(signal.id)}
                  className="p-2 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!prospect.signals || prospect.signals.length === 0) && (
              <p className="text-center text-zinc-500 py-8">No signals added yet</p>
            )}
          </div>
        </div>
      )}

      {/* Add Signal Modal */}
      {showAddSignal && (
        <AddSignalModal
          onClose={() => setShowAddSignal(false)}
          onAdd={handleAddSignal}
        />
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <AddContactModal
          onClose={() => setShowAddContact(false)}
          onAdd={handleAddContact}
        />
      )}

      {/* Log Outreach Modal */}
      {showLogOutreach && (
        <LogOutreachModal
          prospectId={prospect.id}
          contacts={prospect.contacts || []}
          onClose={() => setShowLogOutreach(false)}
          onSaved={() => {
            setShowLogOutreach(false);
            fetchProspect();
          }}
        />
      )}
    </div>
  );
}

// Add Signal Modal Component
function AddSignalModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    signalType: '',
    signalValue: '',
    source: ''
  });

  const SIGNAL_TYPES = [
    'recent_funding', 'hiring_signals', 'tech_stack_fit', 'industry_fit',
    'company_size_fit', 'social_engagement', 'competitor_customer',
    'inbound_signal', 'previous_relationship', 'recent_news',
    'growth_indicators', 'pain_indicators'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Signal</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Signal Type</label>
            <select
              value={form.signalType}
              onChange={(e) => setForm({ ...form, signalType: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
            >
              <option value="">Select...</option>
              {SIGNAL_TYPES.map(type => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Details</label>
            <input
              type="text"
              value={form.signalValue}
              onChange={(e) => setForm({ ...form, signalValue: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
              placeholder="e.g., Raised $10M Series A"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Source</label>
            <input
              type="text"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
              placeholder="e.g., TechCrunch"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-200">
            Cancel
          </button>
          <button
            onClick={() => onAdd(form)}
            disabled={!form.signalType}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            Add Signal
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Contact Modal Component
function AddContactModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    persona: 'unknown',
    isPrimary: false
  });

  const PERSONAS = ['decision_maker', 'champion', 'influencer', 'blocker', 'user', 'unknown'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Add Contact</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Persona</label>
            <select
              value={form.persona}
              onChange={(e) => setForm({ ...form, persona: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
            >
              {PERSONAS.map(p => (
                <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            />
            <span className="text-sm text-zinc-300">Primary contact</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-200">
            Cancel
          </button>
          <button
            onClick={() => onAdd(form)}
            disabled={!form.name}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            Add Contact
          </button>
        </div>
      </div>
    </div>
  );
}

// Log Outreach Modal Component
function LogOutreachModal({ prospectId, contacts, onClose, onSaved }) {
  const [form, setForm] = useState({
    method: 'email',
    direction: 'outbound',
    contactId: '',
    subject: '',
    contentSummary: '',
    outcome: 'pending',
    nextFollowupDate: ''
  });

  const handleSubmit = async () => {
    try {
      await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId, ...form })
      });
      onSaved();
    } catch (err) {
      console.error('Failed to log outreach:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Log Outreach</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
              >
                <option value="email">Email</option>
                <option value="linkedin">LinkedIn</option>
                <option value="call">Call</option>
                <option value="text">Text</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Direction</label>
              <select
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>
          {contacts.length > 0 && (
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Contact</label>
              <select
                value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
              >
                <option value="">Select contact...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Subject/Topic</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Summary</label>
            <textarea
              value={form.contentSummary}
              onChange={(e) => setForm({ ...form, contentSummary: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Outcome</label>
              <select
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
              >
                <option value="pending">Pending</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="no_response">No Response</option>
                <option value="meeting_booked">Meeting Booked</option>
                <option value="replied">Replied</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Next Follow-up</label>
              <input
                type="date"
                value={form.nextFollowupDate}
                onChange={(e) => setForm({ ...form, nextFollowupDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-200"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-zinc-400 hover:text-zinc-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"
          >
            Log Outreach
          </button>
        </div>
      </div>
    </div>
  );
}
