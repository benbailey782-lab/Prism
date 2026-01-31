import React, { useState, useEffect } from 'react';
import { Brain, FileText, Users, Target, MessageSquare, BarChart3, Folder, Zap, AlertCircle } from 'lucide-react';
import TranscriptList from './components/TranscriptList';
import TranscriptDetail from './components/TranscriptDetail';
import SegmentBrowser from './components/SegmentBrowser';
import StatsPanel from './components/StatsPanel';
import DealList from './components/DealList';
import PeopleList from './components/PeopleList';

const TABS = [
  { id: 'transcripts', label: 'Transcripts', icon: FileText },
  { id: 'segments', label: 'Knowledge', icon: Folder },
  { id: 'deals', label: 'Deals', icon: Target },
  { id: 'people', label: 'People', icon: Users },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

function App() {
  const [activeTab, setActiveTab] = useState('transcripts');
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => setError('Cannot connect to server. Is it running?'));
  }, []);

  const renderContent = () => {
    if (selectedTranscript) {
      return (
        <TranscriptDetail 
          transcript={selectedTranscript} 
          onBack={() => setSelectedTranscript(null)} 
        />
      );
    }

    switch (activeTab) {
      case 'transcripts':
        return <TranscriptList onSelect={setSelectedTranscript} />;
      case 'segments':
        return <SegmentBrowser />;
      case 'deals':
        return <DealList />;
      case 'people':
        return <PeopleList />;
      case 'stats':
        return <StatsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Sales Brain</h1>
                <p className="text-xs text-zinc-500">Personal Learning Engine</p>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-4">
              {health && (
                <>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${health.aiEnabled ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span className="text-zinc-400">
                      {health.aiEnabled ? 'AI Active' : 'AI Inactive'}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    {health.watchFolder}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      {!selectedTranscript && (
        <nav className="border-b border-zinc-800 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                    border-b-2 -mb-px
                    ${activeTab === tab.id 
                      ? 'border-green-500 text-white' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'}
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-zinc-600">
          Drop transcript files in the watch folder to begin
        </div>
      </footer>
    </div>
  );
}

export default App;
