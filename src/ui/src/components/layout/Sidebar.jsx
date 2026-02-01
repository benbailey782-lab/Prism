import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Lightbulb,
  Target,
  DollarSign,
  Users,
  BookOpen,
  FileText,
  BarChart3
} from 'lucide-react';

const SECTIONS = {
  main: 'Main',
  pipeline: 'Pipeline',
  data: 'Data'
};

const NAV_ITEMS = [
  { id: 'ask', label: 'Ask', icon: MessageSquare, section: 'main' },
  { id: 'insights', label: 'Insights', icon: Lightbulb, section: 'main' },
  { id: 'prospects', label: 'Prospects', icon: Target, section: 'pipeline' },
  { id: 'deals', label: 'Deals', icon: DollarSign, section: 'pipeline' },
  { id: 'people', label: 'People', icon: Users, section: 'data' },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen, section: 'data' },
  { id: 'transcripts', label: 'Transcripts', icon: FileText, section: 'data' },
  { id: 'stats', label: 'Stats', icon: BarChart3, section: 'data' },
];

export default function Sidebar({ activeView, onNavigate, collapsed, onToggleCollapse, health }) {
  const groupedItems = NAV_ITEMS.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col sticky top-0 h-screen"
      style={{
        background: 'var(--surface-1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--glass-border)'
      }}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl animated-gradient flex items-center justify-center flex-shrink-0 shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-semibold text-white truncate">Sales Brain</h1>
                <p className="text-xs text-zinc-500 truncate">Intelligence Engine</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {Object.entries(groupedItems).map(([section, sectionItems]) => (
          <div key={section} className="mb-6">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="px-4 mb-2"
                >
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.08em]">
                    {SECTIONS[section]}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1 px-2">
              {sectionItems.map(item => {
                const isActive = activeView === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200 text-sm font-medium relative
                      ${isActive
                        ? 'text-green-400'
                        : 'text-zinc-400 hover:text-zinc-200'}
                    `}
                    style={isActive ? {
                      background: 'var(--glow-green)',
                      boxShadow: 'inset 0 0 20px rgba(34, 197, 94, 0.1)'
                    } : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-green-500 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    <item.icon className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-green-400' : ''
                    }`} />

                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* AI Status */}
      <AnimatePresence mode="wait">
        {!collapsed && health && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-4 border-t border-white/5"
          >
            <div className="flex items-center gap-2">
              <div className={`
                w-2 h-2 rounded-full flex-shrink-0
                ${health.aiEnabled ? 'bg-green-500 pulse-glow' : 'bg-amber-500'}
              `} />
              <span className="text-xs text-zinc-400 truncate">
                {health.aiEnabled
                  ? `${health.aiProvider || 'AI'} ready`
                  : 'AI inactive'
                }
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed AI indicator */}
      {collapsed && health && (
        <div className="p-4 border-t border-white/5 flex justify-center">
          <div className={`
            w-2 h-2 rounded-full
            ${health.aiEnabled ? 'bg-green-500 pulse-glow' : 'bg-amber-500'}
          `} />
        </div>
      )}

      {/* Collapse toggle */}
      <motion.button
        onClick={onToggleCollapse}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-4 border-t border-white/5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </motion.aside>
  );
}
