import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Cpu, ChevronRight, Check, ArrowRight } from 'lucide-react';

// Prism Logo Mark SVG
const PrismLogo = ({ className = "w-40 h-auto" }) => (
  <svg className={className} viewBox="0 0 280 285" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse opacity="0.6" cx="140" cy="139" rx="140" ry="60" fill="url(#paint0_wizard)"/>
    <ellipse opacity="0.6" cx="139.5" cy="100.5" rx="137.5" ry="57.5" fill="url(#paint1_wizard)"/>
    <ellipse opacity="0.6" cx="140" cy="60" rx="140" ry="60" fill="url(#paint2_wizard)"/>
    <path d="M45.875 268V226.125H62.5625C64.3542 226.125 66.1042 226.479 67.8125 227.188C69.5625 227.854 71.125 228.833 72.5 230.125C73.9167 231.375 75.0417 232.896 75.875 234.688C76.7083 236.438 77.125 238.396 77.125 240.562C77.125 243.438 76.4375 245.958 75.0625 248.125C73.6875 250.25 71.8125 251.917 69.4375 253.125C67.1042 254.333 64.5 254.938 61.625 254.938C59.2083 254.938 57.0417 254.667 55.125 254.125C53.25 253.583 51.7917 253.042 50.75 252.5V247.375C51.75 247.917 53.25 248.458 55.25 249C57.25 249.5 59.3125 249.75 61.4375 249.75C64.6042 249.75 67.0417 248.958 68.75 247.375C70.5 245.792 71.375 243.521 71.375 240.562C71.375 238.771 70.875 237.208 69.875 235.875C68.9167 234.5 67.6458 233.417 66.0625 232.625C64.4792 231.833 62.7917 231.438 61 231.438H51.5V268H45.875ZM87.125 268V226.125H103.188C104.979 226.125 106.729 226.375 108.438 226.875C110.188 227.375 111.75 228.146 113.125 229.188C114.542 230.188 115.667 231.479 116.5 233.062C117.333 234.646 117.75 236.521 117.75 238.688C117.75 241.271 117 243.458 115.5 245.25C114.042 247.042 112.167 248.396 109.875 249.312C107.625 250.188 105.292 250.625 102.875 250.625C102.208 250.625 101.375 250.583 100.375 250.5C99.4167 250.417 98.4167 250.333 97.375 250.25C96.3333 250.125 95.3542 250 94.4375 249.875C93.5208 249.708 92.8125 249.562 92.3125 249.438V244.75C93.7292 245.167 95.2917 245.5 97 245.75C98.7083 245.958 100.396 246.062 102.062 246.062C105.229 246.062 107.667 245.396 109.375 244.062C111.125 242.729 112 240.938 112 238.688C112 236.354 111.042 234.562 109.125 233.312C107.25 232.062 104.958 231.438 102.25 231.438H92.75V268H87.125ZM110.75 268L91.6875 249.438L96.1875 247.125L119.375 268H110.75ZM134.562 268V226.125H140.188V268H134.562ZM127.5 268V262.688H147.25V268H127.5ZM127.5 231.438V226.125H147.25V231.438H127.5ZM169.312 268.625C166.896 268.625 164.667 268.208 162.625 267.375C160.583 266.542 158.812 265.604 157.312 264.562V258.75C158.938 259.875 160.792 260.896 162.875 261.812C165 262.688 167.396 263.125 170.062 263.125C172.146 263.125 173.979 262.604 175.562 261.562C177.146 260.521 177.938 259.083 177.938 257.25C177.938 256.208 177.604 255.312 176.938 254.562C176.312 253.812 175.542 253.167 174.625 252.625C173.708 252.083 172.812 251.625 171.938 251.25L165 248.125C163 247.208 161.438 246.208 160.312 245.125C159.188 244.042 158.396 242.854 157.938 241.562C157.479 240.229 157.25 238.792 157.25 237.25C157.25 235.042 157.875 233.062 159.125 231.312C160.417 229.521 162.125 228.104 164.25 227.062C166.375 226.021 168.667 225.5 171.125 225.5C173.583 225.5 175.604 225.854 177.188 226.562C178.812 227.271 180.229 228.021 181.438 228.812V234.625C180.271 233.75 178.854 232.938 177.188 232.188C175.521 231.396 173.708 231 171.75 231C170.5 231 169.188 231.229 167.812 231.688C166.479 232.104 165.354 232.792 164.438 233.75C163.521 234.708 163.062 235.938 163.062 237.438C163.062 239.104 163.667 240.375 164.875 241.25C166.083 242.125 167.542 242.958 169.25 243.75L175 246.375C177.875 247.667 180.042 249.104 181.5 250.688C182.958 252.271 183.688 254.375 183.688 257C183.688 259.292 183.021 261.312 181.688 263.062C180.354 264.771 178.604 266.125 176.438 267.125C174.271 268.125 171.896 268.625 169.312 268.625ZM193.688 268V226.125H195.438L213.312 245.312L230.875 226.125H232.625V268H227V237.688L214.062 251.5H212.562L199.312 237.688V268H193.688Z" fill="url(#paint3_wizard)"/>
    <defs>
      <linearGradient id="paint0_wizard" x1="0" y1="139" x2="280" y2="139" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4AA8D8"/><stop offset="1" stopColor="#C888B0"/>
      </linearGradient>
      <linearGradient id="paint1_wizard" x1="2" y1="100" x2="277" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6078C8"/><stop offset="1" stopColor="#9878C0"/>
      </linearGradient>
      <linearGradient id="paint2_wizard" x1="0" y1="59.52" x2="280" y2="59.52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7B8EC8"/><stop offset="1" stopColor="#9890C8"/>
      </linearGradient>
      <linearGradient id="paint3_wizard" x1="139.5" y1="208" x2="139.5" y2="285" gradientUnits="userSpaceOnUse">
        <stop stopColor="white"/><stop offset="1" stopColor="#999999"/>
      </linearGradient>
    </defs>
  </svg>
);

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'folder', title: 'Transcripts' },
  { id: 'ai', title: 'AI Status' },
  { id: 'ready', title: 'Ready' },
];

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [watchFolder, setWatchFolder] = useState('');
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    // Check AI status on the AI step
    if (step === 2) {
      fetch('/api/health')
        .then(r => r.json())
        .then(data => setAiStatus(data))
        .catch(() => setAiStatus({ aiEnabled: false }));
    }
  }, [step]);

  const handleSelectFolder = async () => {
    if (isElectron) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) setWatchFolder(folder);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save folder if set
      if (watchFolder) {
        await fetch('/api/config/watch-folder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchFolder })
        });
      }

      // Mark setup complete in Electron config
      if (isElectron) {
        await window.electronAPI.saveConfig({ setupComplete: true, watchFolder });
      }

      onComplete();
    } catch (err) {
      console.error('Setup error:', err);
      onComplete(); // Continue anyway
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 bg-[#09090b] flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto p-8"
      >
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                i <= step ? 'bg-prism-blue' : 'bg-zinc-700'
              }`} />
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px transition-colors ${
                  i < step ? 'bg-prism-blue' : 'bg-zinc-800'
                }`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-8">
                <PrismLogo className="w-48 h-auto" />
              </div>
              <p className="text-zinc-400 mb-8 text-sm leading-relaxed max-w-sm mx-auto">
                Your personal sales intelligence engine. Prism transforms conversations
                into searchable memory with AI-powered insights.
              </p>
              <motion.button
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-prism-500 hover:bg-prism-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Folder Selection */}
          {step === 1 && (
            <motion.div
              key="folder"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="w-12 h-12 rounded-xl bg-prism-blue/10 flex items-center justify-center mx-auto mb-6">
                <Folder className="w-6 h-6 text-prism-blue" />
              </div>
              <h2 className="text-xl font-semibold text-white text-center mb-2">Transcript Folder</h2>
              <p className="text-sm text-zinc-400 text-center mb-8">
                Where should Prism watch for new transcripts?
              </p>

              <div className="space-y-3">
                {isElectron && (
                  <button
                    onClick={handleSelectFolder}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/8 transition-colors"
                  >
                    <div className="text-sm font-medium text-white">
                      {watchFolder || 'Choose a folder...'}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {watchFolder ? 'Click to change' : 'Google Drive, local folder, or any synced location'}
                    </div>
                  </button>
                )}

                {!isElectron && (
                  <input
                    type="text"
                    value={watchFolder}
                    onChange={(e) => setWatchFolder(e.target.value)}
                    placeholder="/path/to/your/transcripts"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-prism-blue/50"
                  />
                )}

                <button
                  onClick={nextStep}
                  className="w-full p-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  I'll set this up later →
                </button>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button onClick={prevStep} className="text-sm text-zinc-500 hover:text-zinc-300">Back</button>
                <motion.button
                  onClick={nextStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-prism-500 hover:bg-prism-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: AI Status */}
          {step === 2 && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white text-center mb-2">AI Status</h2>
              <p className="text-sm text-zinc-400 text-center mb-8">
                Prism uses Ollama for local, free AI processing.
              </p>

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-6">
                {aiStatus === null ? (
                  <div className="text-sm text-zinc-400 text-center">Checking...</div>
                ) : aiStatus.aiEnabled ? (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-prism-blue pulse-glow" />
                    <div>
                      <div className="text-sm font-medium text-white">Ollama Connected</div>
                      <div className="text-xs text-zinc-400">{aiStatus.aiModel || 'Ready'}</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="text-sm font-medium text-white">Ollama Not Found</div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      AI features (transcript analysis, insights, Ask Prism) need Ollama.
                      Install from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-prism-blue hover:underline">ollama.ai</a>, then run:
                    </p>
                    <code className="block mt-2 p-2 bg-black/30 rounded text-xs text-zinc-300">
                      ollama pull llama3.1:8b
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">
                      You can still use Prism without AI — just set it up later in Settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={prevStep} className="text-sm text-zinc-500 hover:text-zinc-300">Back</button>
                <motion.button
                  onClick={nextStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-prism-500 hover:bg-prism-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Ready */}
          {step === 3 && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-prism-blue/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-prism-blue" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">You're All Set</h2>
              <p className="text-sm text-zinc-400 mb-2">Here's your setup summary:</p>

              <div className="text-left p-4 bg-white/5 border border-white/10 rounded-xl mb-8 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Transcript Folder</span>
                  <span className="text-zinc-200 truncate ml-4 max-w-[200px]">
                    {watchFolder || 'Default'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">AI</span>
                  <span className={`${aiStatus?.aiEnabled ? 'text-prism-blue' : 'text-amber-400'}`}>
                    {aiStatus?.aiEnabled ? 'Connected' : 'Not configured'}
                  </span>
                </div>
              </div>

              <motion.button
                onClick={handleComplete}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-prism-500 hover:bg-prism-600 disabled:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
              >
                {loading ? 'Setting up...' : 'Launch Prism'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
