import React, { useState } from 'react';
import { Gamepad2, CheckCircle2, AlertCircle, Loader2, Sparkles, X, Search, Check, ExternalLink } from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerHapticSuccess } from '../utils/telegram';

interface RobloxAccountModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
  onLinkRoblox: (nickname: string, avatarUrl?: string) => Promise<{ success: boolean; message?: string; error?: string; avatarUrl?: string }>;
}

interface RobloxSearchResult {
  username: string;
  displayName: string;
  userId?: number;
  avatarUrl: string;
  profileUrl?: string;
}

export const RobloxAccountModal: React.FC<RobloxAccountModalProps> = ({
  isOpen,
  onClose,
  canClose = true,
  onLinkRoblox,
}) => {
  const [nickname, setNickname] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [foundPlayer, setFoundPlayer] = useState<RobloxSearchResult | null>(null);

  if (!isOpen) return null;

  // Search Roblox player on roblox.com
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setFoundPlayer(null);

    const cleanNick = nickname.trim();
    if (cleanNick.length < 3) {
      setErrorMsg('Roblox foydalanuvchi nomini kamida 3 belgidan iborat qilib yozing!');
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/roblox/search?username=${encodeURIComponent(cleanNick)}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        sound.playError();
        setErrorMsg(data.error || `Ushbu nikli odam roblox.com da topilmadi (${cleanNick})! Nikingizni to'g'ri yozganingizga ishonch hosil qiling.`);
        return;
      }

      if (data.alreadyClaimed) {
        sound.playError();
        setErrorMsg(data.error || `Ushbu nikli odam saytda allaqachon mavjud (${cleanNick})!`);
        return;
      }

      sound.playAvatarMatch();
      setFoundPlayer({
        username: data.username,
        displayName: data.displayName || data.username,
        userId: data.userId,
        avatarUrl: data.avatarUrl,
        profileUrl: data.profileUrl,
      });
    } catch (err: unknown) {
      sound.playError();
      setErrorMsg('Roblox bilan bog\'lanishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Confirm and bind this Roblox account
  const handleConfirmLink = async () => {
    if (!foundPlayer) return;
    setErrorMsg('');
    setSaveLoading(true);

    try {
      const res = await onLinkRoblox(foundPlayer.username, foundPlayer.avatarUrl);
      if (res.success) {
        sound.playSuccess();
        triggerHapticSuccess();
        setSuccessMsg(`O'yinchi topildi va muvaffaqiyatli saqlandi: ${foundPlayer.username}! Endi Robux yechishingiz mumkin.`);
        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      } else {
        sound.playError();
        setErrorMsg(res.error || 'Ushbu nikli odam saytda allaqachon mavjud! Boshqa nik tanlang.');
      }
    } catch (err: unknown) {
      sound.playError();
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Xatolik yuz berdi');
      }
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative animate-modal-pop">
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-1.5">
              <span>Roblox Akkauntini Bog'lash</span>
            </h2>
            <p className="text-xs text-slate-400">
              roblox.com dan qidirish va avatarni tekshirish
            </p>
          </div>
        </div>

        {/* Security Notice: No Password Required */}
        <div className="p-3 mb-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <p className="flex items-center gap-1.5 font-bold text-emerald-400 mb-0.5">
            <Sparkles className="h-4 w-4" />
            <span>Parol umuman kerak emas!</span>
          </p>
          <p className="text-slate-400 leading-relaxed">
            Faqat Roblox login (username)ingizni kiriting. Tizim roblox.com dan avataringizni topib ko'rsatadi va sayt sizni eslab qoladi.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Roblox Foydalanuvchi Nomi (Username):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="Masalan: ProGamer_2026"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
              />
              <button
                type="submit"
                disabled={searchLoading || nickname.trim().length < 3}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Qidirish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Found Roblox Player Avatar & Confirmation Box */}
        {foundPlayer && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border-2 border-emerald-500/40 text-center animate-in zoom-in-95 duration-200">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
              <Check className="h-3.5 w-3.5" />
              <span>O'yinchi roblox.com da topildi!</span>
            </p>

            <div className="relative inline-block mx-auto mb-3">
              <div className="w-20 h-20 rounded-2xl border-2 border-emerald-400 bg-slate-900 p-1 shadow-lg shadow-emerald-500/20 overflow-hidden mx-auto">
                <img
                  src={foundPlayer.avatarUrl}
                  alt={foundPlayer.username}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>

            <h3 className="text-base font-black text-white">{foundPlayer.username}</h3>
            {foundPlayer.displayName && foundPlayer.displayName !== foundPlayer.username && (
              <p className="text-xs text-slate-400 font-medium">({foundPlayer.displayName})</p>
            )}

            <div className="mt-2 mb-4 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <span className="text-emerald-400 font-bold">Shu sizning Roblox akkauntingizmi?</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tasdiqlasangiz, yechilgan Robuxlar ushbu akkauntga tushiriladi.
              </p>
            </div>

            <button
              onClick={handleConfirmLink}
              disabled={saveLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95"
            >
              {saveLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ha, bu mening akkauntim (Tasdiqlash)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
