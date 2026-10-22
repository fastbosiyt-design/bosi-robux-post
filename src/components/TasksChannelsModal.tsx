import React, { useState } from 'react';
import { X, CheckCircle2, ExternalLink, Radio, Sparkles, Loader2 } from 'lucide-react';
import { MandatoryChannel, UserProfile } from '../types';
import { sound } from '../utils/audio';
import { triggerHapticSuccess } from '../utils/telegram';

interface TasksChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: MandatoryChannel[];
  user: UserProfile;
  onClaimTask: (channelId: string) => Promise<boolean>;
}

export const TasksChannelsModal: React.FC<TasksChannelsModalProps> = ({
  isOpen,
  onClose,
  channels,
  user,
  onClaimTask,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [visitedMap, setVisitedMap] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleOpenLink = (channel: MandatoryChannel) => {
    setVisitedMap((prev) => ({ ...prev, [channel.id]: true }));
    const targetUrl = channel.inviteLink.startsWith('http')
      ? channel.inviteLink
      : `https://t.me/${channel.username.replace('@', '')}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClaim = async (channel: MandatoryChannel) => {
    setLoadingId(channel.id);
    try {
      const ok = await onClaimTask(channel.id);
      if (ok) {
        sound.playSuccess();
        triggerHapticSuccess();
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-modal-pop">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Majburiy Homiy Kanallar</h2>
            <p className="text-xs text-slate-400">
              Kanallarga obuna bo'ling va bepul Robux bonuslarini yig'ing
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3 mb-5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <p className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Kafolatlangan Payout Qoidasi</span>
          </p>
          <p className="text-slate-400">
            Barcha homiy kanallarga a'zo bo'lgach, @BOSI_tekin_robuxbot boti hisobingizni tasdiqlaydi va Robux chiqarish so'rovlaringiz to'liq to'lab beriladi.
          </p>
        </div>

        {/* Channel Cards */}
        <div className="space-y-3 mb-6">
          {channels.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400">
              Hozircha faol homiy kanallar mavjud emas.
            </div>
          ) : (
            channels.map((ch) => {
              const isCompleted = user.completedTasks.includes(ch.id);
              const isVisited = visitedMap[ch.id];
              const isLoading = loadingId === ch.id;

              return (
                <div
                  key={ch.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isCompleted
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-semibold text-sm">
                      {isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : '📢'}
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-white truncate">{ch.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="text-emerald-400 font-bold font-mono">+{ch.rewardRobux} R$</span>
                        <span>·</span>
                        <span className="truncate">{ch.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted ? (
                      <span className="px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-lg">
                        Bajarildi
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenLink(ch)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>Kanal</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>

                        <button
                          onClick={() => handleClaim(ch)}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-all shadow-sm shadow-emerald-500/20 cursor-pointer active:scale-95"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <span>Tekshirish</span>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Telegram Bot Link Helper */}
        <div className="border-t border-slate-900 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Telegram bot: @BOSI_tekin_robuxbot</span>
          <a
            href="https://t.me/BOSI_tekin_robuxbot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline font-semibold"
          >
            Botga o'tish →
          </a>
        </div>
      </div>
    </div>
  );
};
