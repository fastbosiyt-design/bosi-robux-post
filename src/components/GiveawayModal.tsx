import React, { useState, useEffect } from 'react';
import { X, Trophy, Sparkles, CheckCircle2, Clock, Users, Gift } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { triggerHapticSuccess } from '../utils/telegram';

interface GiveawayWinner {
  telegramId: string;
  robloxUsername: string;
  name: string;
  wonAt: string;
  prize: number;
}

interface GiveawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  targetDateStr: string;
  pastWinners: GiveawayWinner[];
  onJoinGiveaway: () => Promise<void>;
}

export const GiveawayModal: React.FC<GiveawayModalProps> = ({
  isOpen,
  onClose,
  user,
  targetDateStr,
  pastWinners,
  onJoinGiveaway,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [joined, setJoined] = useState(user.joinedGiveaway || false);

  useEffect(() => {
    setJoined(user.joinedGiveaway || false);
  }, [user.joinedGiveaway]);

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDateStr).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  if (!isOpen) return null;

  const handleJoin = async () => {
    await onJoinGiveaway();
    setJoined(true);
    sound.playSuccess();
    triggerHapticSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Haftalik Katta Konkurs</h2>
            <p className="text-xs text-slate-400">
              Har yakshanba soat 20:00 da 3 ta odamga 10,000 RBX dan!
            </p>
          </div>
        </div>

        {/* Prize Pool Spotlight Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 text-center mb-5 relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Jami Sovg'a Jamg'armasi</span>
          </div>

          <div className="font-mono text-4xl sm:text-5xl font-black text-amber-300 drop-shadow-sm mb-1">
            30,000 RBX
          </div>
          <p className="text-xs text-slate-300">
            Tasodifiy 3 ta ishtirokchiga <strong>10,000 ta RBX</strong> dan to'liq to'lab beriladi!
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="mb-5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Yakshanba soat 20:00 gacha qolgan vaqt:</span>
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-mono text-xl font-black text-white">{timeLeft.days}</span>
              <span className="text-[10px] text-slate-500 block">Kun</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-mono text-xl font-black text-white">{timeLeft.hours}</span>
              <span className="text-[10px] text-slate-500 block">Soat</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-mono text-xl font-black text-white">{timeLeft.minutes}</span>
              <span className="text-[10px] text-slate-500 block">Daqiqa</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-mono text-xl font-black text-emerald-400">{timeLeft.seconds}</span>
              <span className="text-[10px] text-slate-500 block">Soniya</span>
            </div>
          </div>
        </div>

        {/* Join Button */}
        <div className="mb-6">
          {joined ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Siz ushbu haftalik 10k RBX konkursida ishtirok etyapsiz!</span>
            </div>
          ) : (
            <button
              onClick={handleJoin}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <Gift className="h-4 w-4" />
              <span>Konkursda Bepul Qatnashish</span>
            </button>
          )}
        </div>

        {/* Past Winners */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>O'tgan Haftalar G'oliblari (10,000 RBX)</span>
          </h4>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {pastWinners.map((winner, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold text-[11px]">
                    #{idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{winner.robloxUsername}</span>
                    <span className="text-[10px] text-slate-500">{winner.wonAt}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  +{winner.prize.toLocaleString()} ta RBX
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
