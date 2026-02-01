import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Folder, Database, Cpu, Info, RefreshCw, Check, AlertCircle, ExternalLink
} from 'lucide-react';
import GlassCard from './shared/GlassCard';

// Prism Logo Mark SVG component
const PrismLogo = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 280 199" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse opacity="0.6" cx="140" cy="139" rx="140" ry="60" fill="url(#paint0_linear_settings)"/>
    <ellipse opacity="0.6" cx="139.5" cy="100.5" rx="137.5" ry="57.5" fill="url(#paint1_linear_settings)"/>
    <ellipse opacity="0.6" cx="140" cy="60" rx="140" ry="60" fill="url(#paint2_linear_settings)"/>
    <defs>
      <linearGradient id="paint0_linear_settings" x1="0" y1="139" x2="280" y2="139" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4AA8D8"/>
        <stop offset="1" stopColor="#C888B0"/>
      </linearGradient>
      <linearGradient id="paint1_linear_settings" x1="2" y1="100" x2="277" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6078C8"/>
        <stop offset="1" stopColor="#9878C0"/>
      </linearGradient>
      <linearGradient id="paint2_linear_settings" x1="0" y1="59.52" x2="280" y2="59.52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7B8EC8"/>
        <stop offset="1" stopColor="#9890C8"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [watchFolder, setWatchFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [healthRes, statsRes, configRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/stats'),
        fetch('/api/config/watch-folder')
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
        setWatchFolder(healthData.watchFolder || '');
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.watchFolder) {
          setWatchFolder(configData.watchFolder);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSelectFolder = async () => {
    if (!isElectron) return;

    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setWatchFolder(folder);
        await handleSaveFolder(folder);
      }
    } catch (err) {
      setError('Failed to select folder');
    }
  };

  const handleSaveFolder = async (folder) => {
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/config/watch-folder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchFolder: folder || watchFolder })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      // If Electron, also save to local config
      if (isElectron) {
        await window.electronAPI.saveConfig({ watchFolder: folder || watchFolder });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configure your Prism installation
        </p>
      </div>

      <div className="space-y-6">
        {/* Transcript Folder */}
        <GlassCard variant="static" padding="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-prism-blue/10 flex items-center justify-center flex-shrink-0">
              <Folder className="w-5 h-5 text-prism-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-white mb-1">Transcript Folder</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Prism watches this folder for new transcripts to automatically import and analyze.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={watchFolder}
                  onChange={(e) => setWatchFolder(e.target.value)}
                  placeholder="/path/to/transcripts"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-prism-blue/50"
                  readOnly={isElectron}
                />
                {isElectron ? (
                  <motion.button
                    onClick={handleSelectFolder}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2.5 bg-prism-500 hover:bg-prism-600 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Browse...
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => handleSaveFolder()}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2.5 bg-prism-500 hover:bg-prism-600 disabled:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved
                      </>
                    ) : (
                      'Save'
                    )}
                  </motion.button>
                )}
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {saved && (
                <div className="mt-3 flex items-center gap-2 text-prism-blue text-sm">
                  <Check className="w-4 h-4" />
                  Settings saved successfully
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* AI Provider */}
        <GlassCard variant="static" padding="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-white mb-1">AI Provider</h3>
              <p className="text-sm text-zinc-400 mb-4">
                AI processing status and configuration.
              </p>

              {health ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-zinc-400">Status</span>
                    <span className={`text-sm flex items-center gap-2 ${health.aiEnabled ? 'text-prism-blue' : 'text-amber-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${health.aiEnabled ? 'bg-prism-blue pulse-glow' : 'bg-amber-500'}`} />
                      {health.aiEnabled ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-zinc-400">Provider</span>
                    <span className="text-sm text-zinc-200">{health.aiProvider || 'None'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-zinc-400">Model</span>
                    <span className="text-sm text-zinc-200">{health.aiModel || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500">Loading AI status...</div>
              )}

              {!health?.aiEnabled && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-sm text-amber-400">
                    AI features require Ollama to be installed and running.
                  </p>
                  <a
                    href="https://ollama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-prism-blue hover:underline flex items-center gap-1 mt-2"
                  >
                    Learn how to install Ollama
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Database Stats */}
        <GlassCard variant="static" padding="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-white mb-1">Database</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Current data statistics.
              </p>

              {stats ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-center">
                    <div className="text-2xl font-semibold text-white">{stats.totalTranscripts || 0}</div>
                    <div className="text-xs text-zinc-500">Transcripts</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center">
                    <div className="text-2xl font-semibold text-white">{stats.totalSegments || 0}</div>
                    <div className="text-xs text-zinc-500">Segments</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center">
                    <div className="text-2xl font-semibold text-white">{stats.totalDeals || 0}</div>
                    <div className="text-xs text-zinc-500">Deals</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center">
                    <div className="text-2xl font-semibold text-white">{stats.totalPeople || 0}</div>
                    <div className="text-xs text-zinc-500">People</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500">Loading statistics...</div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* About */}
        <GlassCard variant="static" padding="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#09090b] border border-white/10 flex items-center justify-center flex-shrink-0">
              <PrismLogo className="w-6 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-white mb-1">About Prism</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Intelligence Engine for Sales Professionals
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-zinc-400">Version</span>
                  <span className="text-sm text-zinc-200">0.1.0</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-400">Environment</span>
                  <span className="text-sm text-zinc-200">{isElectron ? 'Desktop App' : 'Web'}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-600 mt-4">
                Your personal AI-powered sales intelligence engine. Prism automatically analyzes your sales conversations to surface insights, track deal progress, and coach you to success.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
