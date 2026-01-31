import React from 'react';
import { Menu, Bell, Settings } from 'lucide-react';

export default function Header({ health, onMenuClick }) {
  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left side - mobile menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-zinc-400 hover:text-zinc-200"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center - could add search here */}
        <div className="flex-1" />

        {/* Right side - status and actions */}
        <div className="flex items-center gap-4">
          {/* AI Status indicator */}
          {health && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${health.aiEnabled ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-zinc-500">
                {health.aiEnabled ? health.aiModel : 'AI Offline'}
              </span>
            </div>
          )}

          {/* Notifications (placeholder) */}
          <button className="p-2 text-zinc-400 hover:text-zinc-200 relative">
            <Bell className="w-5 h-5" />
          </button>

          {/* Settings (placeholder) */}
          <button className="p-2 text-zinc-400 hover:text-zinc-200">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
