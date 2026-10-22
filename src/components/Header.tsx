import React from 'react';
import { Volume2, VolumeX, ShieldCheck, Sparkles, Send, Gamepad2, Download } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  balance: number;
  activeTab: 'game' | 'tasks' | 'shop' | 'minigames' | 'giveaway' | 'withdraw' | 'admin';
  setActiveTab: (tab: 'game' | 'tasks' | 'shop' | 'minigames' | 'giveaway' | 'withdraw' | 'admin') => void;
  isAdmin: boolean;
  onOpenWithdraw: () => void;
  onOpenLinkRoblox: () => void;
  onOpenProjectFiles: () => void;
  onOpenLeaderboard: () => void;
  botUsername: string;
  robloxUsername?: string;
}

export const Header: React.FC<HeaderProps> = ({
  balance,
  activeTab,
  setActiveTab,
  isAdmin,
  onOpenWithdraw,
  onOpenLinkRoblox,
  onOpenProjectFiles,
  onOpenLeaderboard,
  botUsername,
  robloxUsername,
}) => {
  const [muted, setMuted] = React.useState(!sound.enabled);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setMuted(!sound.enabled);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 font-black text-lg">
            R$
          </div>
          <button
            onClick={() => setActiveTab('game')}
            className="text-left font-extrabold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 text-lg sm:text-xl cursor-pointer"
          >
            <span>BOSI ROBUX</span>
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('game')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              activeTab === 'game' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            O'yin (Tap)
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              activeTab === 'shop' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            Do'kon (Shop)
          </button>
          <button
            onClick={() => setActiveTab('minigames')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              activeTab === 'minigames' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            Mini-O'yinlar
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-amber-300 text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>🏆 Top 10</span>
          </button>
          <button
            onClick={() => setActiveTab('giveaway')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              activeTab === 'giveaway' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            10k Konkurs
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              activeTab === 'tasks' ? 'text-emerald-400 font-bold' : ''
            }`}
          >
            Majburiy Kanallar
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-300 cursor-pointer ${
                activeTab === 'admin' ? 'text-amber-400 font-bold' : 'text-amber-400/80'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Top 10 Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            title="Top 10 Liderlar jadvali"
            aria-label="Top 10 Liderlar"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:text-amber-300 hover:border-amber-400 transition-colors cursor-pointer"
          >
            <span className="text-sm">🏆</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            aria-label={muted ? 'Ovozni yoqish' : 'Ovozni o\'chirish'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </button>

          {/* Download project archive button */}
          <button
            onClick={onOpenProjectFiles}
            title="Loyiha fayllarini yuklab olish (.zip)"
            aria-label="Loyiha fayllarini yuklab olish"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Roblox Nick Status Button */}
          <button
            onClick={onOpenLinkRoblox}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          >
            <Gamepad2 className="h-3.5 w-3.5 text-sky-400" />
            <span className="truncate max-w-[100px]">{robloxUsername || 'Nikni ulash'}</span>
          </button>

          {/* Primary Action Button showing EXACT format: "100.10 ta RBX" */}
          <button
            onClick={onOpenWithdraw}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">{balance.toFixed(2)} ta RBX</span>
          </button>
        </div>
      </div>
    </header>
  );
};
