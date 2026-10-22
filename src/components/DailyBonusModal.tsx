import React, { useState } from 'react';
import { X, Gift, Check, Sparkles, Loader2, Calendar } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { triggerHapticSuccess } from '../utils/telegram';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onClaimDaily: () => Promise<boolean>;
  baseBonus: number;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  isOpen,
  onClose,
  user,
  onClaimDaily,
  baseBonus,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyClaimedToday = user.lastDailyClaim === todayStr;

  const streakDays = [
    { day: 1, reward: baseBonus * 1 },
    { day: 2, reward: baseBonus * 2 },
    { day: 3, reward: baseBonus * 3 },
    { day: 4, reward: baseBonus * 4 },
    { day: 5, reward: baseBonus * 5 },
    { day: 6, reward: baseBonus * 6 },
    { day: 7, reward: baseBonus * 10 }, // Super Day 7 Jackpot!
  ];

  const handleClaim = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const ok = await onClaimDaily();
      if (ok) {
        sound.playSuccess();
        triggerHapticSuccess();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Kunlik Robux Bonusi</h2>
            <p className="text-xs text-slate-400">
              Har kuni kiring va ketma-ketlik uchun ko'proq Robux yutib oling
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* 7 Days Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {streakDays.slice(0, 4).map((item) => {
            const isCompleted = user.dailyStreak >= item.day;
            const isCurrent = (user.dailyStreak || 0) + 1 === item.day && !alreadyClaimedToday;

            return (
              <div
                key={item.day}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400'
                    : isCurrent
                    ? 'border-amber-500 bg-amber-950/30 ring-2 ring-amber-500/40 text-amber-300 animate-pulse'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{item.day}-Kun</span>
                <div className="my-1">
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                  ) : (
                    <Calendar className="h-5 w-5 mx-auto opacity-70" />
                  )}
                </div>
                <span className="font-mono text-xs font-bold text-white">+{item.reward} R$</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {streakDays.slice(4).map((item) => {
            const isCompleted = user.dailyStreak >= item.day;
            const isCurrent = (user.dailyStreak || 0) + 1 === item.day && !alreadyClaimedToday;
            const isDay7 = item.day === 7;

            return (
              <div
                key={item.day}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  isDay7
                    ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-950/40 to-slate-900 shadow-md shadow-emerald-500/10'
                    : isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400'
                    : isCurrent
                    ? 'border-amber-500 bg-amber-950/30 ring-2 ring-amber-500/40 text-amber-300 animate-pulse'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-300">
                  {isDay7 && <Sparkles className="h-3 w-3 text-emerald-400" />}
                  <span>{item.day}-Kun {isDay7 ? '🎁' : ''}</span>
                </div>
                <div className="my-1">
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                  ) : (
                    <Gift className={`h-5 w-5 mx-auto ${isDay7 ? 'text-emerald-400' : 'opacity-70'}`} />
                  )}
                </div>
                <span className={`font-mono text-xs font-bold ${isDay7 ? 'text-emerald-400 text-sm' : 'text-white'}`}>
                  +{item.reward} R$
                </span>
              </div>
            );
          })}
        </div>

        {/* Claim Action Button */}
        <button
          onClick={handleClaim}
          disabled={alreadyClaimedToday || loading}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
            alreadyClaimedToday
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/25 active:scale-95'
          }`}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : alreadyClaimedToday ? (
            <span>Bugungi bonus olingan (Ertaga yana kiring)</span>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Bugungi Bonusni Olish</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
