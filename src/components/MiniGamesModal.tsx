import React, { useState, useRef, useEffect } from 'react';
import { X, Dices, Coins, Box, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { triggerHaptic, triggerHapticSuccess } from '../utils/telegram';

interface MiniGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onPlayGame: (gameType: 'wheel' | 'chests' | 'coinflip', bet: number, choice?: string | number) => Promise<{
    won: boolean;
    multiplier: number;
    payout: number;
    details: string;
    netProfit: number;
    coinOutcome?: 'heads' | 'tails';
    chestDistribution?: number[];
    wheelIndex?: number;
  }>;
}

export const MiniGamesModal: React.FC<MiniGamesModalProps> = ({
  isOpen,
  onClose,
  user,
  onPlayGame,
}) => {
  const [selectedGame, setSelectedGame] = useState<'chests' | 'coinflip' | 'wheel'>('chests');
  const [bet, setBet] = useState(10);
  const [coinChoice, setCoinChoice] = useState<'heads' | 'tails'>('heads');

  // Chest state
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [chestPhase, setChestPhase] = useState<'idle' | 'shaking' | 'bursting' | 'revealed'>('idle');
  const [chestRewards, setChestRewards] = useState<number[]>([0, 1.8, 3.5]);

  // Coinflip state
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipOutcome, setFlipOutcome] = useState<'heads' | 'tails'>('heads');

  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  // Common result state
  const [loading, setLoading] = useState(false);
  const [gameResult, setGameResult] = useState<{
    won: boolean;
    multiplier: number;
    payout: number;
    details: string;
    netProfit: number;
  } | null>(null);

  const rattleIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rattleIntervalRef.current) {
        clearInterval(rattleIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const quickBets = [5, 10, 25, 50, 100];

  const resetGameState = () => {
    setGameResult(null);
    setChestPhase('idle');
    setSelectedChest(null);
    setIsFlipping(false);
    setIsSpinning(false);
  };

  // 1. PLAY CHESTS WITH SUSPENSE SHAKE & BURST
  const handlePlayChest = async (chosenIdx: number) => {
    if (loading || chestPhase !== 'idle') return;
    if (user.balance < bet) {
      alert(`Hisobingizda yetarli Robux yo'q! Hozirda: ${user.balance.toFixed(2)} ta RBX`);
      return;
    }

    setLoading(true);
    setSelectedChest(chosenIdx);
    setChestPhase('shaking');
    setGameResult(null);
    triggerHaptic('medium');

    // Suspense sound ticks during shaking
    sound.playChestRattle();
    const interval = window.setInterval(() => {
      sound.playChestRattle();
    }, 280);
    rattleIntervalRef.current = interval;

    try {
      const res = await onPlayGame('chests', bet, chosenIdx);

      // Keep shaking for at least 850ms for high dramatic effect
      setTimeout(() => {
        if (rattleIntervalRef.current) {
          clearInterval(rattleIntervalRef.current);
          rattleIntervalRef.current = null;
        }

        // Set distribution from server or fallback
        if (res.chestDistribution && res.chestDistribution.length === 3) {
          setChestRewards(res.chestDistribution);
        } else {
          const fallback = [0, 1.8, 3.5];
          fallback[chosenIdx] = res.multiplier;
          setChestRewards(fallback);
        }

        // Pop open chest with burst & sound
        setChestPhase('bursting');
        sound.playChestOpen();
        triggerHaptic('heavy');

        setTimeout(() => {
          setChestPhase('revealed');
          setGameResult({
            won: res.won,
            multiplier: res.multiplier,
            payout: res.payout,
            details: res.details,
            netProfit: res.netProfit,
          });

          if (res.won) {
            sound.playSuccess();
            triggerHapticSuccess();
          } else {
            sound.playError();
          }
          setLoading(false);
        }, 400);
      }, 900);
    } catch {
      if (rattleIntervalRef.current) {
        clearInterval(rattleIntervalRef.current);
        rattleIntervalRef.current = null;
      }
      setChestPhase('idle');
      setLoading(false);
    }
  };

  // 2. PLAY COINFLIP WITH 3D SPINNING & BOUNCE LANDING
  const handlePlayCoinflip = async () => {
    if (loading || isFlipping) return;
    if (user.balance < bet) {
      alert(`Hisobingizda yetarli Robux yo'q! Hozirda: ${user.balance.toFixed(2)} ta RBX`);
      return;
    }

    setLoading(true);
    setIsFlipping(true);
    setGameResult(null);
    triggerHaptic('medium');
    sound.playCoinFlip();

    try {
      const res = await onPlayGame('coinflip', bet, coinChoice);
      const outcome = res.coinOutcome || (res.won ? coinChoice : coinChoice === 'heads' ? 'tails' : 'heads');

      // Spin for 1.3s then reveal landing
      setTimeout(() => {
        setFlipOutcome(outcome);
        setIsFlipping(false);
        setGameResult({
          won: res.won,
          multiplier: res.multiplier,
          payout: res.payout,
          details: res.details,
          netProfit: res.netProfit,
        });

        if (res.won) {
          sound.playSuccess();
          triggerHapticSuccess();
        } else {
          sound.playError();
        }
        setLoading(false);
      }, 1300);
    } catch {
      setIsFlipping(false);
      setLoading(false);
    }
  };

  // 3. PLAY WHEEL WITH REALISTIC ROTATING SECTORS & TICK SOUNDS
  const wheelSlices = [
    { label: '0x', mult: 0, color: '#334155', textColor: '#94a3b8' },
    { label: '0.5x', mult: 0.5, color: '#0284c7', textColor: '#e0f2fe' },
    { label: '1.5x', mult: 1.5, color: '#059669', textColor: '#d1fae5' },
    { label: '2.0x', mult: 2.0, color: '#7c3aed', textColor: '#ede9fe' },
    { label: '2.5x', mult: 2.5, color: '#d97706', textColor: '#fef3c7' },
    { label: '5.0x', mult: 5.0, color: '#e11d48', textColor: '#ffe4e6' },
    { label: '10x', mult: 10, color: '#eab308', textColor: '#713f12' },
  ];

  const handlePlayWheel = async () => {
    if (loading || isSpinning) return;
    if (user.balance < bet) {
      alert(`Hisobingizda yetarli Robux yo'q! Hozirda: ${user.balance.toFixed(2)} ta RBX`);
      return;
    }

    setLoading(true);
    setIsSpinning(true);
    setGameResult(null);
    triggerHaptic('medium');
    sound.playWheelSpin();

    try {
      const res = await onPlayGame('wheel', bet);
      const sliceCount = wheelSlices.length;
      const sliceAngle = 360 / sliceCount;

      const targetIdx = res.wheelIndex !== undefined ? res.wheelIndex : 0;
      // Angle to point slice at 12 o'clock (top pointer)
      const targetAngle = 360 - (targetIdx * sliceAngle + sliceAngle / 2);
      const spins = 5 * 360; // 5 full rotations
      const finalRotation = wheelRotation + spins + targetAngle - (wheelRotation % 360);

      setWheelRotation(finalRotation);

      // Wait for spin animation (2.3s)
      setTimeout(() => {
        setIsSpinning(false);
        setGameResult({
          won: res.won,
          multiplier: res.multiplier,
          payout: res.payout,
          details: res.details,
          netProfit: res.netProfit,
        });

        if (res.won) {
          sound.playSuccess();
          triggerHapticSuccess();
        } else {
          sound.playError();
        }
        setLoading(false);
      }, 2350);
    } catch {
      setIsSpinning(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-modal-pop">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-md shadow-purple-500/20">
            <Dices className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">Robux Mini-O'yinlar</h2>
            <p className="text-xs text-slate-400">
              Ochilish effektlari va yutuqli ko'paytmalar bilan Robux ishlang!
            </p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="p-3 mb-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Mavjud Balansingiz:</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {user.balance.toFixed(2)} ta RBX
          </span>
        </div>

        {/* Game Mode Selector */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900 rounded-xl border border-slate-800 mb-5">
          <button
            onClick={() => {
              setSelectedGame('chests');
              resetGameState();
            }}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex flex-col items-center gap-1 active:scale-95 ${
              selectedGame === 'chests'
                ? 'bg-purple-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="h-4 w-4" />
            <span>Sirli Qutilar</span>
          </button>

          <button
            onClick={() => {
              setSelectedGame('coinflip');
              resetGameState();
            }}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex flex-col items-center gap-1 active:scale-95 ${
              selectedGame === 'coinflip'
                ? 'bg-purple-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>Tanga (Flip)</span>
          </button>

          <button
            onClick={() => {
              setSelectedGame('wheel');
              resetGameState();
            }}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex flex-col items-center gap-1 active:scale-95 ${
              selectedGame === 'wheel'
                ? 'bg-purple-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Omad Charxi</span>
          </button>
        </div>

        {/* Bet Selection */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Tikish Miqdori (Robux):
          </label>
          <div className="grid grid-cols-5 gap-2">
            {quickBets.map((b) => (
              <button
                key={b}
                type="button"
                disabled={loading || isFlipping || isSpinning || chestPhase === 'shaking'}
                onClick={() => setBet(b)}
                className={`py-1.5 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                  bet === b
                    ? 'border-purple-500 bg-purple-500/20 text-purple-300 ring-2 ring-purple-500/30'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                {b} RBX
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GAME 1: MYSTERY CHESTS (SIRLI QUTILAR) WITH OPENING BURST & SUSPENSE      */}
        {/* ========================================================================= */}
        {selectedGame === 'chests' && (
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-center mb-4">
            <h3 className="text-sm font-extrabold text-white mb-0.5">3 ta Sandiqdan Birini Tanlang</h3>
            <p className="text-xs text-slate-400 mb-4">
              Birida 0x (bo'sh), qolganlarida 1.8x va 3.5x Robux yashiringan!
            </p>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {[0, 1, 2].map((idx) => {
                const isThisPicked = selectedChest === idx;
                const isShaking = isThisPicked && chestPhase === 'shaking';
                const isBursting = isThisPicked && (chestPhase === 'bursting' || chestPhase === 'revealed');
                const isRevealed = chestPhase === 'revealed';
                const multiplier = chestRewards[idx];

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePlayChest(idx)}
                    disabled={loading || chestPhase !== 'idle' || user.balance < bet}
                    className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-center min-h-[140px] overflow-hidden cursor-pointer ${
                      isShaking
                        ? 'animate-chest-shake border-amber-400 bg-amber-950/40 animate-pulse-gold z-20 scale-105'
                        : isBursting
                        ? 'border-emerald-500 bg-emerald-950/30 z-20'
                        : isRevealed
                        ? 'border-slate-800 bg-slate-900/40 opacity-75'
                        : 'border-slate-800 bg-slate-900/80 hover:border-purple-500/70 hover:scale-105 hover:bg-slate-900'
                    }`}
                  >
                    {/* Rotating Sunburst behind opened winning chest */}
                    {isBursting && multiplier > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                        <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-amber-400 via-emerald-400 to-transparent animate-sunburst blur-md" />
                      </div>
                    )}

                    {/* Floating payout text when opened */}
                    {isRevealed && isThisPicked && (
                      <div className="absolute top-2 left-0 right-0 font-mono text-xs font-black text-amber-300 animate-float-rbx pointer-events-none z-30">
                        {multiplier > 0 ? `+${(bet * multiplier).toFixed(2)} RBX` : `Bo'sh 0x`}
                      </div>
                    )}

                    {/* Chest Graphics */}
                    <div className="relative mb-2">
                      {isShaking ? (
                        <div className="relative">
                          <Box className="h-12 w-12 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                          <Sparkles className="h-4 w-4 text-yellow-300 absolute -top-1 -right-1 animate-ping" />
                        </div>
                      ) : isBursting ? (
                        <div className="relative animate-chest-burst">
                          {multiplier > 0 ? (
                            <div className="relative flex items-center justify-center">
                              <span className="text-4xl">🎁</span>
                              <Sparkles className="h-6 w-6 text-emerald-400 absolute -top-2 -right-2 animate-bounce" />
                            </div>
                          ) : (
                            <span className="text-4xl opacity-50">💨</span>
                          )}
                        </div>
                      ) : isRevealed ? (
                        <span className="text-3xl opacity-60">📦</span>
                      ) : (
                        <div className="relative group-hover:scale-110 transition-transform">
                          <Box className="h-11 w-11 text-amber-400/90 drop-shadow-md" />
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500/40 rounded-full" />
                        </div>
                      )}
                    </div>

                    {/* Multiplier / Status Label */}
                    {isRevealed ? (
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                            multiplier > 0
                              ? isThisPicked
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {multiplier}x
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 font-semibold">
                          {multiplier > 0 ? `+${(bet * multiplier).toFixed(1)} RBX` : "Bo'sh"}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-200">
                          {isShaking ? 'Ochilmoqda...' : `${idx + 1}-Sandiq`}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 font-medium">Bosing</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {chestPhase === 'revealed' && (
              <button
                onClick={resetGameState}
                className="mt-2 py-2 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Qayta o'ynash</span>
              </button>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* GAME 2: COIN FLIP (BURGIN YOKI RAQAM) WITH 3D SUSPENSE SPIN               */}
        {/* ========================================================================= */}
        {selectedGame === 'coinflip' && (
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-center mb-4">
            <h3 className="text-sm font-extrabold text-white mb-0.5">Burgut yoki Raqam (50/50)</h3>
            <p className="text-xs text-slate-400 mb-4">
              To'g'ri topsangiz 1.95x yutuq olasiz!
            </p>

            {/* Central 3D Spinning Coin */}
            <div className="py-4 flex justify-center items-center min-h-[140px]">
              <div
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isFlipping
                    ? 'animate-coin-flip'
                    : 'animate-coin-land'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Coin Face */}
                <div
                  className={`w-full h-full rounded-full border-4 flex flex-col items-center justify-center shadow-xl ${
                    flipOutcome === 'heads'
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-950 text-white shadow-emerald-500/30'
                      : 'border-amber-400 bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-950 text-slate-950 shadow-amber-500/30'
                  }`}
                >
                  <span className="text-2xl mb-0.5">
                    {flipOutcome === 'heads' ? '🦅' : '🪙'}
                  </span>
                  <span className="text-[10px] font-black tracking-wider uppercase">
                    {flipOutcome === 'heads' ? 'Burgut' : 'Raqam'}
                  </span>
                </div>
              </div>
            </div>

            {/* Choice Pickers */}
            <div className="grid grid-cols-2 gap-3 mb-4 max-w-xs mx-auto">
              <button
                type="button"
                disabled={isFlipping || loading}
                onClick={() => setCoinChoice('heads')}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  coinChoice === 'heads'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30 font-black'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-base">🦅</span>
                <span>Burgut (1.95x)</span>
              </button>

              <button
                type="button"
                disabled={isFlipping || loading}
                onClick={() => setCoinChoice('tails')}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  coinChoice === 'tails'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/30 font-black'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-base">🪙</span>
                <span>Raqam (1.95x)</span>
              </button>
            </div>

            {/* Action Button */}
            <button
              onClick={handlePlayCoinflip}
              disabled={loading || isFlipping || user.balance < bet}
              className="py-3 px-8 rounded-xl font-extrabold text-xs bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isFlipping ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Tanga aylanmoqda...</span>
                </span>
              ) : (
                `Tashlash (${bet} RBX)`
              )}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GAME 3: WHEEL OF FORTUNE (OMAD CHARXI) WITH VISUAL ROTATING SECTORS       */}
        {/* ========================================================================= */}
        {selectedGame === 'wheel' && (
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-center mb-4">
            <h3 className="text-sm font-extrabold text-white mb-0.5">Omad Charxini Aylantirish</h3>
            <p className="text-xs text-slate-400 mb-4">
              0x dan 10x gacha Robux ko'paytmasi yutuqqa ega bo'ling!
            </p>

            {/* Visual SVG Wheel */}
            <div className="relative w-52 h-52 mx-auto my-3 flex items-center justify-center">
              {/* Needle / Ticker at 12 o'clock */}
              <div className="absolute -top-3 z-30 flex flex-col items-center">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.9)]" />
              </div>

              {/* Rotating SVG Wheel Container */}
              <div
                className="w-full h-full rounded-full border-4 border-slate-800 shadow-2xl shadow-purple-500/20 overflow-hidden"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinning ? 'transform 2.3s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none',
                }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {wheelSlices.map((slice, i) => {
                    const total = wheelSlices.length;
                    const angle = 360 / total;
                    const startAngle = i * angle;
                    const endAngle = (i + 1) * angle;

                    const startRad = ((startAngle - 90) * Math.PI) / 180;
                    const endRad = ((endAngle - 90) * Math.PI) / 180;

                    const x1 = 100 + 100 * Math.cos(startRad);
                    const y1 = 100 + 100 * Math.sin(startRad);
                    const x2 = 100 + 100 * Math.cos(endRad);
                    const y2 = 100 + 100 * Math.sin(endRad);

                    const midRad = (((startAngle + endAngle) / 2 - 90) * Math.PI) / 180;
                    const textX = 100 + 62 * Math.cos(midRad);
                    const textY = 100 + 62 * Math.sin(midRad);

                    return (
                      <g key={i}>
                        <path
                          d={`M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`}
                          fill={slice.color}
                          stroke="#0f172a"
                          strokeWidth="2"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill={slice.textColor}
                          fontSize="13"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${(startAngle + endAngle) / 2}, ${textX}, ${textY})`}
                        >
                          {slice.label}
                        </text>
                      </g>
                    );
                  })}
                  {/* Center Hub */}
                  <circle cx="100" cy="100" r="24" fill="#0f172a" stroke="#eab308" strokeWidth="3" />
                  <text
                    x="100"
                    y="102"
                    fill="#fbbf24"
                    fontSize="11"
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    R$
                  </text>
                </svg>
              </div>
            </div>

            {/* Spin Button */}
            <button
              onClick={handlePlayWheel}
              disabled={loading || isSpinning || user.balance < bet}
              className="py-3 px-8 rounded-xl font-extrabold text-xs bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-lg shadow-purple-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50 mt-2"
            >
              {isSpinning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Aylanmoqda...</span>
                </span>
              ) : (
                `Aylantirish (${bet} RBX)`
              )}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GAME RESULT BANNER WITH BURST ANIMATION                                    */}
        {/* ========================================================================= */}
        {gameResult && (
          <div
            className={`p-4 rounded-xl border text-center animate-modal-pop duration-200 mt-2 ${
              gameResult.won
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'border-red-800/60 bg-red-950/40 text-red-300'
            }`}
          >
            <div className="text-base font-extrabold mb-0.5 flex items-center justify-center gap-1.5">
              <span>{gameResult.won ? '🎉 YUTDINGIZ!' : '😔 YUTQAZDINGIZ'}</span>
            </div>
            <p className="text-xs mb-1 text-slate-300 font-medium">{gameResult.details}</p>
            <div className="font-mono text-sm font-bold">
              {gameResult.won ? (
                <span className="text-emerald-400">
                  +{gameResult.payout.toFixed(2)} ta RBX (Foyda: +{gameResult.netProfit.toFixed(2)} RBX)
                </span>
              ) : (
                <span className="text-rose-400">-{bet} ta RBX</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
