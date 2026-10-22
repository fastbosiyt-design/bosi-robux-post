import React, { useState } from 'react';
import { X, ShoppingBag, Zap, Cpu, ArrowUp, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { triggerHapticSuccess } from '../utils/telegram';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpgradeTap: () => Promise<{ success: boolean; message?: string }>;
  onBuyItem: (itemId: string) => Promise<{ success: boolean; message?: string }>;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeTap,
  onBuyItem,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // 2x scaling:
  // Level 0: cost 100 RBX -> gives 0.2 RBX
  // Level 1: cost 200 RBX -> gives 0.4 RBX
  // Level 2: cost 400 RBX -> gives 0.8 RBX
  const currentLevel = user.tapUpgradeLevel || 0;
  const tapUpgradeCost = 100 * Math.pow(2, currentLevel);
  const nextTapPower = Math.round(0.1 * Math.pow(2, currentLevel + 1) * 100) / 100;

  const handleBuyTapUpgrade = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (user.balance < tapUpgradeCost) {
      setErrorMsg(`Robux yetarli emas! Sizda: ${user.balance.toFixed(2)} ta RBX, kerak: ${tapUpgradeCost} ta RBX.`);
      return;
    }

    setLoading(true);
    try {
      const res = await onUpgradeTap();
      if (res.success) {
        sound.playUpgrade();
        triggerHapticSuccess();
        setSuccessMsg(res.message || `Muvaffaqiyatli! Har bosish endi ${nextTapPower.toFixed(2)} ta RBX beradi!`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuyShopItem = async (itemId: string, cost: number) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (user.balance < cost) {
      setErrorMsg(`Robux yetarli emas! Sizda: ${user.balance.toFixed(2)} ta RBX, kerak: ${cost} ta RBX.`);
      return;
    }

    setLoading(true);
    try {
      const res = await onBuyItem(itemId);
      if (res.success) {
        sound.playUpgrade();
        triggerHapticSuccess();
        setSuccessMsg(res.message || 'Muvaffaqiyatli sotib olindi!');
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
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Robux Do'koni (Shop)</h2>
            <p className="text-xs text-slate-400">
              Qazish kuchini 2 barobar ko'paytirish va qo'shimcha quvvatlar
            </p>
          </div>
        </div>

        {/* Current Balance Bar */}
        <div className="p-3 mb-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Sizning balansingiz:</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {user.balance.toFixed(2)} ta RBX
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {/* Main 2x Tap Multiplier Upgrade */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">2x Bosish Kuchaytirgichi</h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 rounded-md">
                      {currentLevel}-Daraja
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Hozirda har bosish: <strong className="text-emerald-400 font-mono">+{user.tapPower.toFixed(2)} RBX</strong>
                  </p>
                  <p className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                    Yangi daraja beradi: <strong className="font-mono">+{nextTapPower.toFixed(2)} ta RBX</strong> (2 barobar ko'p!)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-emerald-500/20">
              <div className="text-xs text-slate-400">
                Narxi: <strong className="font-mono text-white text-sm">{tapUpgradeCost} ta RBX</strong>
              </div>

              <button
                onClick={handleBuyTapUpgrade}
                disabled={loading || user.balance < tapUpgradeCost}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  user.balance >= tapUpgradeCost
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span>Sotib olish ({tapUpgradeCost} RBX)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instant 100% Energy Refill */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">100% Tezkor Quvvat</h4>
                <p className="text-xs text-slate-400">
                  Energiyangizni darhol to'liq 100% to'ldiradi
                </p>
                <span className="text-[11px] text-amber-400 font-bold font-mono">Narxi: 30 ta RBX</span>
              </div>
            </div>

            <button
              onClick={() => handleBuyShopItem('refill_energy', 30)}
              disabled={loading || user.balance < 30 || user.energy >= user.maxEnergy}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                user.balance >= 30 && user.energy < user.maxEnergy
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>To'ldirish</span>
            </button>
          </div>

          {/* Auto Miner Bot */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Avto-Qazuvchi Bot</h4>
                <p className="text-xs text-slate-400">
                  Hozirgi tezlik: <strong className="text-sky-400 font-mono">+{user.autoMinerRate.toFixed(1)} RBX/s</strong>
                </p>
                <span className="text-[11px] text-sky-400 font-bold font-mono">
                  Keyingi: +0.5 RBX/s (200 ta RBX)
                </span>
              </div>
            </div>

            <button
              onClick={() => handleBuyShopItem('auto_miner', 200)}
              disabled={loading || user.balance < 200}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                user.balance >= 200
                  ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-md shadow-sky-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Oshirish</span>
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-400 text-center">
          💡 Do'kondan olingan barcha kuchaytirishlar hisobingizda doimiy qoladi.
        </div>
      </div>
    </div>
  );
};
