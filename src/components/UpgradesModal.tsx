import React, { useState } from 'react';
import { X, Sparkles, Zap, Cpu, Loader2, ArrowUp } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { triggerHapticSuccess } from '../utils/telegram';

interface UpgradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpgrade: (type: 'tapPower' | 'maxEnergy' | 'autoMiner') => Promise<boolean>;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgrade,
}) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Upgrade costs
  const tapPowerCost = Math.round(50 * Math.pow(1.8, user.tapPower));
  const maxEnergyLevel = Math.floor((user.maxEnergy - 1000) / 500) + 1;
  const maxEnergyCost = Math.round(100 * Math.pow(1.6, maxEnergyLevel));
  const autoMinerLevel = Math.floor(user.autoMinerRate * 2) + 1;
  const autoMinerCost = Math.round(250 * Math.pow(1.9, autoMinerLevel));

  const handleBuy = async (type: 'tapPower' | 'maxEnergy' | 'autoMiner') => {
    setErrorMsg('');
    setLoadingType(type);
    try {
      const ok = await onUpgrade(type);
      if (ok) {
        sound.playUpgrade();
        triggerHapticSuccess();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Kuchaytirgichlar (Upgrades)</h2>
            <p className="text-xs text-slate-400">
              Robux qazish tezligi va energiya zaxirangizni oshiring
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {/* Multitap Upgrade */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Multitap</h4>
                <p className="text-xs text-slate-400">
                  Har bir bosishga: <span className="text-amber-400 font-bold">+{user.tapPower} R$</span>
                </p>
                <span className="text-[11px] text-slate-500">Daraja: {user.tapPower}</span>
              </div>
            </div>

            <button
              onClick={() => handleBuy('tapPower')}
              disabled={loadingType === 'tapPower' || user.balance < tapPowerCost}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                user.balance >= tapPowerCost
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loadingType === 'tapPower' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span className="font-mono tabular-nums">{tapPowerCost} R$</span>
                </>
              )}
            </button>
          </div>

          {/* Energy Limit Upgrade */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Energiya Sig'imi</h4>
                <p className="text-xs text-slate-400">
                  Maksimal: <span className="text-emerald-400 font-bold font-mono">{user.maxEnergy}</span>
                </p>
                <span className="text-[11px] text-slate-500">+500 quvvat qo'shadi</span>
              </div>
            </div>

            <button
              onClick={() => handleBuy('maxEnergy')}
              disabled={loadingType === 'maxEnergy' || user.balance < maxEnergyCost}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                user.balance >= maxEnergyCost
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loadingType === 'maxEnergy' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span className="font-mono tabular-nums">{maxEnergyCost} R$</span>
                </>
              )}
            </button>
          </div>

          {/* Auto Miner */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Avto-Qazish (Bot)</h4>
                <p className="text-xs text-slate-400">
                  Soniya tezligi: <span className="text-sky-400 font-bold font-mono">+{user.autoMinerRate} R$/s</span>
                </p>
                <span className="text-[11px] text-slate-500">Siz yo'qligingizda ham ishlaydi</span>
              </div>
            </div>

            <button
              onClick={() => handleBuy('autoMiner')}
              disabled={loadingType === 'autoMiner' || user.balance < autoMinerCost}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                user.balance >= autoMinerCost
                  ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-md shadow-sky-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loadingType === 'autoMiner' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span className="font-mono tabular-nums">{autoMinerCost} R$</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-400 text-center">
          💡 Kuchaytirgichlar tezroq Robux yig'ish va chiqarish imkonini beradi.
        </div>
      </div>
    </div>
  );
};
