import React, { useState } from 'react';
import { X, Users, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  botUsername: string;
  referralRewardInviter: number;
  referralRewardFriend: number;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  user,
  botUsername,
  referralRewardInviter,
  referralRewardFriend,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const referralLink = `https://t.me/${botUsername}?start=ref_${user.telegramId}`;
  const shareText = `🔥 Salom! Men @${botUsername} orqali bepul Robux ishlayapman! Havolaga kirib boshlang va darhol +${referralRewardFriend} Robux bonus oling:`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    sound.playTap();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Do'stlarni Taklif Qilish</h2>
            <p className="text-xs text-slate-400">
              Har bir taklif qilingan do'stingiz uchun Robux oling
            </p>
          </div>
        </div>

        {/* Reward cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-center">
            <span className="text-[11px] text-slate-400 block mb-0.5">Sizga beriladi</span>
            <span className="font-mono text-xl font-black text-emerald-400">+{referralRewardInviter} R$</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">har bir do'st uchun</span>
          </div>

          <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 text-center">
            <span className="text-[11px] text-slate-400 block mb-0.5">Do'stingizga beriladi</span>
            <span className="font-mono text-xl font-black text-sky-400">+{referralRewardFriend} R$</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">boshlang'ich sovg'a</span>
          </div>
        </div>

        {/* Stats */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs mb-5">
          <span className="text-slate-400">Taklif qilgan do'stlaringiz:</span>
          <span className="font-mono font-bold text-white text-sm">{user.referralCount || 0} ta</span>
        </div>

        {/* Referral Link Box */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Shaxsiy Taklif Havolangiz:
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="bg-transparent flex-1 text-xs text-slate-300 focus:outline-none font-mono truncate px-1"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
            </button>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleTelegramShare}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20 active:scale-95"
        >
          <Share2 className="h-4 w-4" />
          <span>Telegram orqali do'stlarga yuborish</span>
        </button>
      </div>
    </div>
  );
};
