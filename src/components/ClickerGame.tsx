import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, Gift, Users, Radio, ChevronRight, ShoppingBag, Dices, Trophy, Gamepad2 } from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';
import { UserProfile } from '../types';

interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  value: number;
}

interface ClickerGameProps {
  user: UserProfile;
  onTap: (taps: number) => Promise<void>;
  onOpenDaily: () => void;
  onOpenShop: () => void;
  onOpenMiniGames: () => void;
  onOpenGiveaway: () => void;
  onOpenTasks: () => void;
  onOpenReferral: () => void;
  onOpenWithdraw: () => void;
  onOpenLinkRoblox: () => void;
  mandatoryChannelsCount: number;
  completedTasksCount: number;
}

export const ClickerGame: React.FC<ClickerGameProps> = ({
  user,
  onTap,
  onOpenDaily,
  onOpenShop,
  onOpenMiniGames,
  onOpenGiveaway,
  onOpenTasks,
  onOpenReferral,
  onOpenWithdraw,
  onOpenLinkRoblox,
  mandatoryChannelsCount,
  completedTasksCount,
}) => {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(true);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Client-side visual energy refill approximation
  const [displayEnergy, setDisplayEnergy] = useState(user.energy);

  useEffect(() => {
    setDisplayEnergy(user.energy);
  }, [user.energy]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayEnergy((prev) => {
        if (prev < user.maxEnergy) {
          return Math.min(user.maxEnergy, prev + 0.5);
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [user.maxEnergy]);

  const handleCoinClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (displayEnergy < 1) {
      sound.playError();
      triggerHaptic('heavy');
      return;
    }

    sound.playTap(user.tapPower);
    triggerHaptic('light');

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? clientX - rect.left : 140;
    const y = rect ? clientY - rect.top : 140;

    const newId = Date.now() + Math.random();
    // Strictly user.tapPower (starts at 0.1)
    setFloatingNumbers((prev) => [...prev, { id: newId, x, y, value: user.tapPower }]);

    setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((item) => item.id !== newId));
    }, 900);

    onTap(1);
  };

  const energyPercentage = Math.min(100, Math.max(0, (displayEnergy / user.maxEnergy) * 100));

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-80px)] py-3 max-w-lg mx-auto px-4 select-none">
      {/* Linked Roblox Account Status Bar */}
      <div className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 mb-2">
        <div className="flex items-center gap-2.5">
          {user.robloxUsername ? (
            <>
              <div className="h-8 w-8 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-800">
                <img
                  src={user.robloxAvatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.robloxUsername)}`}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Bog'langan Roblox:</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{user.robloxUsername}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Gamepad2 className="h-4 w-4 text-amber-400" />
              <span>Roblox nikingiz hali bog'lanmagan</span>
            </div>
          )}
        </div>

        <button
          onClick={onOpenLinkRoblox}
          className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          {user.robloxUsername ? 'O\'zgartirish' : 'Nikni bog\'lash'}
        </button>
      </div>

      {/* Mandatory Channels Notice Banner */}
      <div className="w-full mb-2">
        <button
          onClick={onOpenTasks}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/30 transition-colors text-left group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-emerald-300">
              {completedTasksCount < mandatoryChannelsCount
                ? 'Majburiy kanallarga a\'zo bo\'ling va +550 ta RBX oling'
                : 'Barcha homiy kanallarga obuna bo\'lingan'}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Robux Balance Display - EXACTLY formatted as requested: "100.10 ta RBX" */}
      <div className="flex flex-col items-center text-center my-1">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-0.5">
          Robux Balansingiz
        </span>

        <div className="flex items-baseline gap-2">
          <h1 className="font-mono text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-white drop-shadow-sm">
            {user.balance.toFixed(2)}
          </h1>
          <span className="text-xl sm:text-2xl font-bold text-emerald-400">ta RBX</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Har bosish: <strong className="text-emerald-400 font-mono">+{user.tapPower.toFixed(2)} RBX</strong></span>
          <span>·</span>
          <button
            onClick={onOpenShop}
            className="text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
          >
            Do'konda kuchaytirish (100 RBX)
          </button>
        </div>
      </div>

      {/* The BIG Interactive Robux Coin Button */}
      <div className="relative my-3 flex items-center justify-center">
        <div className="absolute h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <div
          ref={buttonRef}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onClick={handleCoinClick}
          className={`relative h-60 w-60 sm:h-68 sm:w-68 rounded-full cursor-pointer transition-all duration-100 flex items-center justify-center touch-manipulation ${
            isPressed ? 'scale-90 brightness-110' : 'hover:scale-105 active:scale-95'
          }`}
          style={{
            filter: isPressed ? 'drop-shadow(0 0 25px rgba(16, 185, 129, 0.6))' : 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.25))',
          }}
        >
          {/* Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/40 p-2 shadow-inner">
            <div className="h-full w-full rounded-full border-2 border-emerald-400/20" />
          </div>

          {/* Robux Coin 3D image */}
          {imageLoaded ? (
            <img
              src="/src/assets/images/robux_coin_3d_1792505425408.jpg"
              alt="BOSI Tekin Robux"
              onError={() => setImageLoaded(false)}
              className="h-52 w-52 sm:h-60 sm:w-60 rounded-full object-cover shadow-2xl pointer-events-none select-none transition-transform"
              draggable={false}
            />
          ) : (
            <div className="h-52 w-52 sm:h-60 sm:w-60 rounded-full bg-gradient-to-tr from-emerald-800 via-emerald-600 to-teal-400 flex flex-col items-center justify-center text-slate-950 font-black shadow-2xl">
              <span className="text-6xl font-extrabold tracking-tight">R$</span>
              <span className="text-[10px] uppercase tracking-widest mt-1 opacity-80">Robux Coin</span>
            </div>
          )}

          {/* Floating Tap Multiplier Text (e.g. +0.10 RBX) */}
          {floatingNumbers.map((num) => (
            <div
              key={num.id}
              className="absolute pointer-events-none text-xl sm:text-2xl font-black text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-out"
              style={{
                left: `${num.x}px`,
                top: `${num.y - 20}px`,
                animation: 'floatUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              +{num.value.toFixed(2)} RBX
            </div>
          ))}
        </div>
      </div>

      {/* Energy Bar */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-lg mb-3">
        <div className="flex items-center justify-between text-xs font-semibold mb-1">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Zap className="h-4 w-4 fill-amber-400" />
            <span>Energiya Zaxirasi</span>
          </div>
          <span className="font-mono tabular-nums text-slate-300">
            {Math.floor(displayEnergy)} / {user.maxEnergy}
          </span>
        </div>

        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${energyPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 px-0.5">
          <span>Tiklanish: +3 / soniya</span>
          <button
            onClick={onOpenShop}
            className="text-emerald-400 hover:text-emerald-300 font-medium underline cursor-pointer"
          >
            Quvvatni to'ldirish
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="w-full grid grid-cols-5 gap-1.5 mb-1">
        <button
          onClick={onOpenShop}
          className="flex flex-col items-center justify-center p-2 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 transition-all text-center group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mb-1 group-hover:scale-110 transition-transform">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-200">Do'kon</span>
          <span className="text-[9px] text-emerald-400 font-mono">2x Tap</span>
        </button>

        <button
          onClick={onOpenMiniGames}
          className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition-all text-center group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 mb-1 group-hover:scale-110 transition-transform">
            <Dices className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-200">O'yinlar</span>
          <span className="text-[9px] text-purple-400">Yutuqli</span>
        </button>

        <button
          onClick={onOpenGiveaway}
          className="flex flex-col items-center justify-center p-2 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 transition-all text-center group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mb-1 group-hover:scale-110 transition-transform">
            <Trophy className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-200">Konkurs</span>
          <span className="text-[9px] text-amber-400 font-bold">10k RBX</span>
        </button>

        <button
          onClick={onOpenDaily}
          className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition-all text-center group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mb-1 group-hover:scale-110 transition-transform">
            <Gift className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-200">Bonus</span>
          <span className="text-[9px] text-slate-500">Kunlik</span>
        </button>

        <button
          onClick={onOpenReferral}
          className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition-all text-center group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 mb-1 group-hover:scale-110 transition-transform">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-200">Do'stlar</span>
          <span className="text-[9px] text-sky-400 font-mono">+100</span>
        </button>
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-70px) scale(1.15);
          }
        }
      `}</style>
    </div>
  );
};
