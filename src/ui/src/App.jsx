import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import TranscriptList from './components/TranscriptList';
import TranscriptDetail from './components/TranscriptDetail';
import SegmentBrowser from './components/SegmentBrowser';
import StatsPanel from './components/StatsPanel';
import DealList from './components/DealList';
import DealDetail from './components/DealDetail';
import PeopleList from './components/PeopleList';
import PersonDetail from './components/PersonDetail';
import ProspectList from './components/prospects/ProspectList';
import ProspectDetail from './components/prospects/ProspectDetail';
import InsightsDashboard from './components/insights/InsightsDashboard';
import AskPanel from './components/AskPanel';

function App() {
  const [activeView, setActiveView] = useState('ask');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => setError('Cannot connect to server. Is it running?'));
  }, []);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  const handleNavigate = (viewId) => {
    setActiveView(viewId);
    setSelectedItem(null);
  };

  const renderContent = () => {
    // Handle detail views when an item is selected
    if (selectedItem) {
      switch (activeView) {
        case 'transcripts':
          return (
            <TranscriptDetail
              transcript={selectedItem}
              onBack={handleBack}
            />
          );
        case 'deals':
          return (
            <DealDetail
              deal={selectedItem}
              onBack={handleBack}
              onNavigateToPerson={(person) => {
                setActiveView('people');
                setSelectedItem(person);
              }}
            />
          );
        case 'people':
          return (
            <PersonDetail
              person={selectedItem}
              onBack={handleBack}
              onNavigateToDeal={(deal) => {
                setActiveView('deals');
                setSelectedItem(deal);
              }}
            />
          );
        case 'prospects':
          return (
            <ProspectDetail
              prospect={selectedItem}
              onBack={handleBack}
              onConvertToDeal={(deal) => {
                setActiveView('deals');
                setSelectedItem(deal);
              }}
            />
          );
        default:
          break;
      }
    }

    // Main list/panel views
    switch (activeView) {
      case 'ask':
        return <AskPanel />;
      case 'insights':
        return <InsightsDashboard />;
      case 'prospects':
        return <ProspectList onSelect={handleSelectItem} />;
      case 'deals':
        return <DealList onSelect={handleSelectItem} />;
      case 'people':
        return <PeopleList onSelect={handleSelectItem} />;
      case 'knowledge':
        return <SegmentBrowser />;
      case 'transcripts':
        return <TranscriptList onSelect={handleSelectItem} />;
      case 'stats':
        return <StatsPanel />;
      default:
        return <AskPanel />;
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        health={health}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <Header
          health={health}
          activeView={activeView}
          showBack={!!selectedItem}
          onBack={handleBack}
        />

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
