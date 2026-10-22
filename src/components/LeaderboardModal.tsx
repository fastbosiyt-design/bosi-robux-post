import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Crown, Medal, RefreshCw, X, Sparkles, User, Flame } from 'lucide-react';
import { LeaderboardUser } from '../types';
import { sound } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelegramId?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentTelegramId,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?telegramId=${encodeURIComponent(currentTelegramId || '')}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.top10 || []);
        setCurrentUserRank(data.currentUserRank || null);
        setTotalPlayers(data.totalPlayers || 0);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTelegramId]);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, fetchLeaderboard]);

  if (!isOpen) return null;

  const top3 = leaderboard.slice(0, 3);
  const rest7 = leaderboard.slice(3, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col animate-modal-pop">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>TOP 10 LIDERLAR</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                24/7 Reyting
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Eng ko'p Robux qazigan chempion o'yinchilar
            </p>
          </div>
        </div>

        {/* Refresh & Total Info Bar */}
        <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs shrink-0">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Faol ishtirokchilar: <b className="text-white font-mono">{totalPlayers.toLocaleString()}</b> ta</span>
          </span>
          <button
            onClick={() => {
              sound.playTap(1);
              fetchLeaderboard();
            }}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="flex flex-col items-center justify-end p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center relative mt-4">
                  <div className="absolute -top-3 w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    2
                  </div>
                  <img
                    src={top3[1].avatarUrl}
                    alt={top3[1].robloxUsername}
                    className="w-12 h-12 rounded-xl border-2 border-slate-400 bg-slate-950 object-cover mb-1.5"
                  />
                  <span className="text-[11px] font-bold text-white truncate max-w-full">
                    {top3[1].robloxUsername}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {Math.floor(top3[1].totalMined).toLocaleString()} R$
                  </span>
                </div>
              )}

              {/* 1st Place (Gold / King) */}
              {top3[0] && (
                <div className="flex flex-col items-center justify-end p-3 rounded-xl bg-gradient-to-b from-amber-500/20 to-slate-900/80 border-2 border-amber-400/60 text-center relative shadow-lg shadow-amber-500/10">
                  <Crown className="h-5 w-5 text-amber-400 absolute -top-3.5 animate-bounce" />
                  <div className="absolute -top-3 w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    1
                  </div>
                  <img
                    src={top3[0].avatarUrl}
                    alt={top3[0].robloxUsername}
                    className="w-14 h-14 rounded-xl border-2 border-amber-400 bg-slate-950 object-cover mb-1.5"
                  />
                  <span className="text-xs font-black text-amber-300 truncate max-w-full">
                    {top3[0].robloxUsername}
                  </span>
                  <span className="text-[11px] font-mono font-black text-emerald-300">
                    {Math.floor(top3[0].totalMined).toLocaleString()} R$
                  </span>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="flex flex-col items-center justify-end p-2.5 rounded-xl bg-slate-900/60 border border-amber-700/50 text-center relative mt-4">
                  <div className="absolute -top-3 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md">
                    3
                  </div>
                  <img
                    src={top3[2].avatarUrl}
                    alt={top3[2].robloxUsername}
                    className="w-12 h-12 rounded-xl border-2 border-amber-700 bg-slate-950 object-cover mb-1.5"
                  />
                  <span className="text-[11px] font-bold text-white truncate max-w-full">
                    {top3[2].robloxUsername}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {Math.floor(top3[2].totalMined).toLocaleString()} R$
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Ranks 4 to 10 */}
          <div className="space-y-1.5">
            {rest7.map((player) => (
              <div
                key={player.rank + '_' + player.robloxUsername}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  player.isCurrentUser
                    ? 'bg-emerald-500/15 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center text-xs font-mono font-bold text-slate-500">
                    #{player.rank}
                  </span>
                  <img
                    src={player.avatarUrl}
                    alt={player.robloxUsername}
                    className="w-8 h-8 rounded-lg border border-slate-700 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <span>{player.robloxUsername}</span>
                      {player.isCurrentUser && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 font-black">
                          SIZ
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{player.name}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {Math.floor(player.totalMined).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-bold ml-1">R$</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current User Bottom Sticky Card */}
        {currentUserRank && (
          <div className="mt-4 pt-3 border-t border-slate-800 shrink-0">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  Sizning o'rningiz: <b className="text-emerald-400 font-mono">#{currentUserRank}</b>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                bosi bosing va yuqoriga chiqing! 🚀
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
