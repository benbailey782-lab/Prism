import React, { useState, useEffect } from 'react';
import {
  Users, Plus, User, Building, Mail, Phone,
  Briefcase, UserCheck, UserX, HelpCircle,
  AlertCircle, Filter, Search
} from 'lucide-react';

const RELATIONSHIP_TYPES = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'prospect', label: 'Prospects', icon: UserCheck },
  { id: 'customer', label: 'Customers', icon: Briefcase },
  { id: 'colleague', label: 'Colleagues', icon: Users },
  { id: 'mentor', label: 'Mentors', icon: UserCheck },
  { id: 'manager', label: 'Managers', icon: User },
  { id: 'other', label: 'Other', icon: HelpCircle },
];

const RELATIONSHIP_COLORS = {
  prospect: 'bg-amber-500/20 text-amber-400',
  customer: 'bg-green-500/20 text-green-400',
  colleague: 'bg-blue-500/20 text-blue-400',
  mentor: 'bg-purple-500/20 text-purple-400',
  manager: 'bg-indigo-500/20 text-indigo-400',
  competitor_contact: 'bg-red-500/20 text-red-400',
  other: 'bg-zinc-500/20 text-zinc-400',
};

function CreatePersonModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    relationshipType: 'prospect',
    email: '',
    phone: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
    setFormData({ name: '', role: '', company: '', relationshipType: 'prospect', email: '', phone: '', notes: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Person</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., VP of Engineering"
                className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Relationship</label>
            <select
              value={formData.relationshipType}
              onChange={(e) => setFormData({ ...formData, relationshipType: e.target.value })}
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-green-500"
            >
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
              <option value="colleague">Colleague</option>
              <option value="mentor">Mentor</option>
              <option value="manager">Manager</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any notes about this person..."
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add Person
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PersonCard({ person, onClick }) {
  const relationshipColor = RELATIONSHIP_COLORS[person.relationship_type] || RELATIONSHIP_COLORS.other;

  return (
    <div
      onClick={onClick}
      className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-5 hover:bg-zinc-700/30 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-medium text-zinc-300">
          {person.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-white truncate">{person.name}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${relationshipColor}`}>
              {person.relationship_type?.replace('_', ' ') || 'other'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-zinc-400">
            {person.role && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {person.role}
              </span>
            )}
            {person.company && (
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                {person.company}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-zinc-500">
            {person.email && (
              <a
                href={`mailto:${person.email}`}
                className="flex items-center gap-1 hover:text-green-400 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                {person.email}
              </a>
            )}
            {person.phone && (
              <a
                href={`tel:${person.phone}`}
                className="flex items-center gap-1 hover:text-green-400 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                {person.phone}
              </a>
            )}
          </div>

          {person.notes && (
            <p className="mt-3 text-sm text-zinc-400 line-clamp-2">{person.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PeopleList({ onSelect }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPeople();
  }, [selectedType]);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const url = selectedType === 'all'
        ? '/api/people'
        : `/api/people?relationship_type=${selectedType}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load people');
      const data = await res.json();
      setPeople(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (personData) => {
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personData)
      });
      if (!res.ok) throw new Error('Failed to create person');
      setShowCreate(false);
      loadPeople();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredPeople = people.filter(person => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      person.name?.toLowerCase().includes(query) ||
      person.company?.toLowerCase().includes(query) ||
      person.role?.toLowerCase().includes(query) ||
      person.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">People</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Track contacts, colleagues, and relationships
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Person
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {RELATIONSHIP_TYPES.map(type => {
          const Icon = type.icon;
          const isActive = selectedType === type.id;
          const count = type.id === 'all'
            ? people.length
            : people.filter(p => p.relationship_type === type.id).length;

          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-colors border
                ${isActive
                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                  : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-700/50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {type.label}
              {count > 0 && (
                <span className="text-xs opacity-60">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people..."
          className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg
                     text-sm text-zinc-200 placeholder-zinc-500
                     focus:outline-none focus:border-green-500/50"
        />
      </div>

      {/* People List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">
            {searchQuery
              ? 'No people match your search'
              : 'No people yet'}
          </p>
          <p className="text-sm text-zinc-500 mt-1">Add people to start tracking relationships</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="text-sm text-zinc-500">
            {filteredPeople.length} {filteredPeople.length === 1 ? 'person' : 'people'}
            {searchQuery && ' matching your search'}
          </div>
          {filteredPeople.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              onClick={() => onSelect && onSelect(person)}
            />
          ))}
        </div>
      )}

      <CreatePersonModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

export default PeopleList;
