import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Command } from 'lucide-react';

export default function Header({ health, onMenuClick }) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className="h-14 sticky top-0 z-10"
      style={{
        background: 'var(--surface-1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)'
      }}
    >
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left side - mobile menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center - Command palette trigger */}
        <motion.div
          className="flex-1 max-w-md mx-auto"
          animate={{ scale: searchFocused ? 1.02 : 1 }}
          transition={{ duration: 0.15 }}
        >
          <button
            onClick={() => {
              // Command palette placeholder - could open a modal
              setSearchFocused(true);
              setTimeout(() => setSearchFocused(false), 200);
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-2 rounded-xl
              text-sm text-zinc-500 transition-all duration-200
              hover:text-zinc-400
            `}
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search anything...</span>
            <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-600">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                <Command className="w-3 h-3 inline" />
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">K</kbd>
            </div>
          </button>
        </motion.div>

        {/* Right side - AI status pill */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {health && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`
                  hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full
                  text-xs font-medium transition-colors
                  ${health.aiEnabled
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-amber-500/10 text-amber-400'
                  }
                `}
              >
                <div className={`
                  w-1.5 h-1.5 rounded-full
                  ${health.aiEnabled ? 'bg-green-500 pulse-glow' : 'bg-amber-500'}
                `} />
                <span>
                  {health.aiEnabled
                    ? (health.aiModel ? health.aiModel.split(':')[0] : 'AI Ready')
                    : 'AI Offline'
                  }
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
