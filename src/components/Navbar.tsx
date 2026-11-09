import React from 'react';
import { Sparkles, Play, LogOut, User } from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  activeTab: 'jobs' | 'queue' | 'tracker' | 'profile';
  setActiveTab: (tab: 'jobs' | 'queue' | 'tracker' | 'profile') => void;
  queueCount: number;
  appliedCount: number;
  onStartAutoApply: () => void;
  isProcessingQueue: boolean;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
  appliedCount,
  onStartAutoApply,
  isProcessingQueue,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Single text wordmark without logo icon or subtitle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('jobs')}
            className="text-left group py-1"
          >
            <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap block">
              My Otomate
            </span>
          </button>
        </div>

        {/* Zone 2: Nav Links - B&W Theme, Jobs, Antrean, Lacak */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-sm ${
              activeTab === 'jobs'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Jobs
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-sm flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <span>Antrean</span>
            {queueCount > 0 && (
              <span className="bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs px-1.5 py-0.2 rounded-full font-mono tabular-nums">
                {queueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-sm flex items-center gap-1.5 ${
              activeTab === 'tracker'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <span>Lacak</span>
            {appliedCount > 0 && (
              <span className="bg-zinc-800 text-zinc-300 text-xs px-1.5 py-0.2 rounded-full font-mono tabular-nums border border-zinc-700">
                {appliedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 text-sm ${
              activeTab === 'profile'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Profile
          </button>
        </nav>

        {/* Zone 3: Primary Action - Apply button and User Profile / Logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onStartAutoApply}
            disabled={isProcessingQueue}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 ${
              isProcessingQueue
                ? 'bg-zinc-800 text-zinc-300 cursor-wait border border-zinc-700'
                : 'bg-white hover:bg-zinc-200 text-black hover:shadow-white/10 hover:shadow-md active:scale-95'
            }`}
          >
            {isProcessingQueue ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-zinc-700" />
                <span>Apply</span>
                {queueCount > 0 && (
                  <span className="bg-black text-white text-xs px-1.5 py-0.5 rounded font-mono tabular-nums ml-0.5">
                    ({queueCount})
                  </span>
                )}
              </>
            )}
          </button>

          {/* User Account & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 p-1.5 rounded-lg text-left transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-zinc-800 text-white border border-zinc-600 ring-1 ring-zinc-500/40'
                    : 'hover:bg-zinc-900 text-zinc-300 hover:text-white border border-transparent'
                }`}
                title="Buka menu Profile"
              >
                <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-sm">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-xs font-semibold text-zinc-200 truncate max-w-[140px]">
                    {currentUser.name}
                  </p>
                </div>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors border border-zinc-800 flex items-center gap-1.5 text-xs shrink-0 cursor-pointer"
                  title="Keluar dari akun dan kembali ke halaman login"
                >
                  <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden md:inline text-[11px]">Keluar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div className="flex md:hidden border-t border-zinc-800 bg-zinc-950 px-3 py-2 overflow-x-auto justify-between items-center text-xs font-medium text-zinc-400">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'jobs' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`whitespace-nowrap px-2.5 py-1 rounded flex items-center gap-1 ${
              activeTab === 'queue' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Antrean ({queueCount})
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`whitespace-nowrap px-2.5 py-1 rounded flex items-center gap-1 ${
              activeTab === 'tracker' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Lacak ({appliedCount})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === 'profile' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Profile
          </button>
        </div>

        {currentUser && onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="text-zinc-400 hover:text-red-400 px-2 py-1 rounded hover:bg-zinc-900 flex items-center gap-1 text-xs shrink-0"
          >
            <LogOut className="w-3 h-3" />
            <span>Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
};
