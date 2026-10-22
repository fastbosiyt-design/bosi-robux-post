import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ArrowDownToLine,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  Check,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { UserProfile, WithdrawalRequest } from '../types';
import { sound } from '../utils/audio';
import { triggerHapticSuccess } from '../utils/telegram';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  withdrawals: WithdrawalRequest[];
  minWithdrawal?: number;
  onSubmitWithdraw: (robloxUsername: string, amount: number) => Promise<boolean>;
}

interface RobloxSearchResult {
  username: string;
  displayName?: string;
  avatarUrl: string;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  user,
  withdrawals,
  minWithdrawal = 1000,
  onSubmitWithdraw,
}) => {
  const [step, setStep] = useState<'search' | 'confirm_avatar' | 'amount'>('search');
  const [robloxUsername, setRobloxUsername] = useState(user.robloxUsername || '');
  const [amount, setAmount] = useState<number>(1000);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search avatar preview result
  const [foundRoblox, setFoundRoblox] = useState<RobloxSearchResult | null>(null);

  const minLimit = 1000; // 1k Robux
  const maxLimit = 100000000; // 100m Robux
  const quickAmounts = [1000, 5000, 10000, 50000, 100000];

  useEffect(() => {
    if (user.robloxUsername) {
      setRobloxUsername(user.robloxUsername);
    }
  }, [user.robloxUsername]);

  if (!isOpen) return null;

  // Step 1: Search player on Roblox
  const handleSearchRoblox = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanNick = robloxUsername.trim();
    if (cleanNick.length < 3) {
      setErrorMsg('Roblox foydalanuvchi nomini to\'g\'ri kiriting (kamida 3 belgi)!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/roblox/search?username=${encodeURIComponent(cleanNick)}`);
      if (!res.ok) {
        throw new Error('Roblox.com orqali o\'yinchi topilmadi');
      }
      const data = await res.json();
      setFoundRoblox({
        username: data.username || cleanNick,
        displayName: data.displayName || cleanNick,
        avatarUrl: data.avatarUrl,
      });
      sound.playAvatarMatch();
      setStep('confirm_avatar');
    } catch {
      // Fallback
      setFoundRoblox({
        username: cleanNick,
        displayName: cleanNick,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanNick)}&backgroundColor=0f172a`,
      });
      sound.playAvatarMatch();
      setStep('confirm_avatar');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm avatar (Shumi?)
  const handleConfirmAvatar = () => {
    sound.playTap(2);
    setStep('amount');
  };

  // Step 3: Final submit withdrawal request
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (amount < minLimit) {
      sound.playError();
      setErrorMsg(`Minimal yechish miqdori: 1,000 ta Robux (1k)!`);
      return;
    }

    if (amount > maxLimit) {
      sound.playError();
      setErrorMsg(`Maksimal yechish miqdori: 100,000,000 ta Robux (100m)!`);
      return;
    }

    if (user.balance < amount) {
      sound.playError();
      setErrorMsg(`Hisobingizda yetarli Robux yo'q! Hozirda: ${user.balance.toFixed(2)} ta RBX`);
      return;
    }

    setLoading(true);
    try {
      const targetNick = foundRoblox ? foundRoblox.username : robloxUsername.trim();
      const ok = await onSubmitWithdraw(targetNick, amount);
      if (ok) {
        sound.playWithdraw();
        triggerHapticSuccess();
        setSuccessMsg(`Arizangiz muvaffaqiyatli qabul qilindi! ${amount.toLocaleString()} Robux 20 kunda ${targetNick} hisobiga tushadi.`);
        setStep('search');
      }
    } catch (err: unknown) {
      sound.playError();
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
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

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ArrowDownToLine className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Robux Yechib Olish</h2>
            <p className="text-xs text-slate-400">
              Min: 1,000 RBX (1k) · Max: 100,000,000 RBX (100m)
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-3 mb-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Sizning balansingiz:</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {user.balance.toFixed(2)} ta RBX
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-300">{successMsg}</p>
              <p className="text-emerald-400/80 mt-1">
                Roblox Group Payout qoidalariga binoan Robuxlar taxminan 20 kun ichida to'liq o'tkaziladi.
              </p>
            </div>
          </div>
        )}

        {/* STEP 1: SEARCH ROBLOX NICKNAME */}
        {step === 'search' && (
          <form onSubmit={handleSearchRoblox} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Roblox Akkauntingiz (Username):
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: ProGamer_2026"
                value={robloxUsername}
                onChange={(e) => setRobloxUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Yechishdan oldin roblox.com dan avataringiz qidiriladi va sizga ko'rsatiladi.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || robloxUsername.trim().length < 3}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Roblox.com orqali qidirish va avatarni tekshirish</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: CONFIRM AVATAR ("SHUMI?") */}
        {step === 'confirm_avatar' && foundRoblox && (
          <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 mb-6 text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-emerald-300 mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Ushbu avatar siznikimi? (Shumi?)</span>
            </h3>

            {/* Avatar Headshot Image */}
            <div className="h-28 w-28 mx-auto rounded-2xl border-2 border-emerald-400 bg-slate-900 p-1.5 shadow-xl overflow-hidden mb-3">
              <img
                src={foundRoblox.avatarUrl}
                alt={foundRoblox.username}
                className="h-full w-full object-cover rounded-xl"
              />
            </div>

            <div className="mb-4">
              <span className="font-mono text-base font-black text-white block">
                {foundRoblox.username}
              </span>
              {foundRoblox.displayName && foundRoblox.displayName !== foundRoblox.username && (
                <span className="text-xs text-slate-400 block mt-0.5">
                  ({foundRoblox.displayName})
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('search')}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              >
                ❌ Yo'q, boshqa nik
              </button>

              <button
                type="button"
                onClick={handleConfirmAvatar}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Ha, bu men! (Tasdiqlash)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AMOUNT SELECTION & DELIVERY NOTICE (20 KUN) */}
        {step === 'amount' && (
          <form onSubmit={handleSubmitWithdrawal} className="space-y-4 mb-6">
            {/* Confirmed account bar */}
            {foundRoblox && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={foundRoblox.avatarUrl}
                    alt="avatar"
                    className="h-8 w-8 rounded-lg object-cover border border-emerald-500/40"
                  />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Qabul qiluvchi:</span>
                    <strong className="text-emerald-400 font-mono text-xs">{foundRoblox.username}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  O'zgartirish
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Yechish Miqdori (Robux):</span>
                <span className="text-slate-400">Min: 1,000 RBX · Max: 100,000,000 RBX</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(q)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      amount === q
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {q >= 1000 ? `${q / 1000}k` : q} RBX
                  </button>
                ))}
              </div>

              <input
                type="number"
                min={minLimit}
                max={maxLimit}
                step="500"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || minLimit)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* 20 Day Delivery Guarantee Notice */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
              <Calendar className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Yetkazib berish muddati:</span>
                <p className="text-amber-300/80 mt-0.5">
                  Agar <strong>{amount.toLocaleString()} Robux</strong> yechsangiz, Roblox guruhi payout qoidalari (pend time)ga ko'ra taxminan <strong>20 kunda</strong> to'liq hisobingizga tushadi!
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || user.balance < amount}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                user.balance < amount
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/20 active:scale-95'
              }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Yechish So'rovini Tasdiqlash va Yuborish</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Withdrawal History */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Sizning Yechish Tarixingiz
          </h3>

          {withdrawals.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
              Hali yechish arizasi yuborilmagan.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {withdrawals.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.robloxUsername}</span>
                      <span className="font-mono font-bold text-emerald-400">+{item.amount} ta RBX</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {new Date(item.createdAt).toLocaleDateString('uz-UZ', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[11px] text-amber-400/90 block mt-0.5">
                      ⏱ Taxminan 20 kunda hisobga tushadi
                    </span>
                  </div>

                  <div>
                    {item.status === 'pending' && (
                      <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                        <Clock className="h-3 w-3" />
                        <span>Kutilmoqda</span>
                      </span>
                    )}
                    {item.status === 'approved' && (
                      <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>To'lab berildi</span>
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                        <XCircle className="h-3 w-3" />
                        <span>Rad etildi</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
