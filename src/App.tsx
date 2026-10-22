/**
 * BOSI Tekin Robux Platform & Telegram Bot
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ClickerGame } from './components/ClickerGame';
import { DailyBonusModal } from './components/DailyBonusModal';
import { TasksChannelsModal } from './components/TasksChannelsModal';
import { ReferralModal } from './components/ReferralModal';
import { WithdrawModal } from './components/WithdrawModal';
import { AdminPanel } from './components/AdminPanel';
import { BotSetupHelperModal } from './components/BotSetupHelperModal';
import { RobloxAccountModal } from './components/RobloxAccountModal';
import { ShopModal } from './components/ShopModal';
import { MiniGamesModal } from './components/MiniGamesModal';
import { GiveawayModal } from './components/GiveawayModal';
import { ProjectFilesModal } from './components/ProjectFilesModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { UserProfile, MandatoryChannel, WithdrawalRequest, SystemSettings, SundayGiveaway } from './types';
import { getTelegramUser, getTelegramWebApp } from './utils/telegram';
import { Bot, ShieldCheck, Loader2, Trophy } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'tasks' | 'shop' | 'minigames' | 'giveaway' | 'withdraw' | 'admin'>('game');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [channels, setChannels] = useState<MandatoryChannel[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [giveaway, setGiveaway] = useState<SundayGiveaway>({
    id: 'gw_1',
    targetDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    prizePerWinner: 10000,
    winnersCount: 3,
    status: 'active',
    winners: [],
  });
  const [settings, setSettings] = useState<SystemSettings>({
    minWithdrawal: 1000,
    referralRewardInviter: 100,
    referralRewardFriend: 50,
    dailyStreakBase: 50,
    baseEnergy: 500,
    energyRefillRatePerSec: 0.5,
    botUsername: 'BOSI_tekin_robuxbot',
    adminUsernames: ['bosi_admin', 'vip_bosi', 'fastabbos', 'fastabbosrbx'],
    baseTapPower: 0.1,
    baseUpgradePrice: 100,
  });

  // Modal open states
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isBotInfoOpen, setIsBotInfoOpen] = useState(false);
  const [isLinkRobloxOpen, setIsLinkRobloxOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMiniGamesOpen, setIsMiniGamesOpen] = useState(false);
  const [isGiveawayOpen, setIsGiveawayOpen] = useState(false);
  const [isProjectFilesOpen, setIsProjectFilesOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      try {
        tg.ready();
        tg.expand();
      } catch {
        // ignore
      }
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setActiveTab('admin');
    }
  }, []);

  // Fetch initial app config and sync user
  const initApp = useCallback(async () => {
    try {
      const tgUser = getTelegramUser();
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('start')?.replace('ref_', '') || undefined;

      // 1. Fetch system config
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setChannels(configData.channels || []);
        if (configData.settings) {
          setSettings((prev) => ({
            ...prev,
            ...configData.settings,
            botUsername: configData.botUsername || prev.botUsername,
            adminUsernames: configData.adminUsernames || prev.adminUsernames,
          }));
        }
        if (configData.giveaway) {
          setGiveaway(configData.giveaway);
        }
      }

      // 2. Sync user profile
      const userRes = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tgUser.id,
          username: tgUser.username,
          firstName: tgUser.first_name,
          referralCode: refCode,
        }),
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);

        // If user doesn't have roblox nickname linked yet, prompt them gently
        if (!userData.user.robloxUsername) {
          // Check local storage fallback
          const savedNick = localStorage.getItem('bosi_roblox_nick');
          if (savedNick) {
            handleLinkRoblox(savedNick);
          } else {
            setIsLinkRobloxOpen(true);
          }
        }

        // Fetch user's previous withdrawals
        const wdRes = await fetch(`/api/withdrawals/my?telegramId=${tgUser.id}`);
        if (wdRes.ok) {
          const wdData = await wdRes.json();
          setWithdrawals(wdData.withdrawals || []);
        }
      }
    } catch (err) {
      console.error('Failed to init app:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Tap handler (strictly gives 0.1 RBX initially or user.tapPower)
  const handleTap = async (taps: number) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: user.telegramId,
          taps,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // optimistic handled on client
    }
  };

  // Link Roblox Account (Anti-steal / unique nick check)
  const handleLinkRoblox = async (nickname: string, avatarUrl?: string) => {
    if (!user) return { success: false, error: 'Foydalanuvchi topilmadi' };
    const res = await fetch('/api/user/link-roblox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user.telegramId,
        robloxUsername: nickname,
        avatarUrl,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setUser(data.user);
      localStorage.setItem('bosi_roblox_nick', nickname);
      return { success: true, message: data.message, avatarUrl: data.avatarUrl };
    } else {
      return { success: false, error: data.error };
    }
  };

  // 2x Upgrade Tap Power (100 RBX -> 0.2, 200 -> 0.4, 400 -> 0.8...)
  const handleUpgradeTap = async () => {
    if (!user) return { success: false };
    const res = await fetch('/api/user/upgrade-tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: user.telegramId }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setUser(data.user);
      return { success: true, message: data.message };
    } else {
      throw new Error(data.error || 'Yangilashda xatolik');
    }
  };

  // Shop Buy Item
  const handleBuyShopItem = async (itemId: string) => {
    if (!user) return { success: false };
    const res = await fetch('/api/user/shop-buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: user.telegramId, itemId }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setUser(data.user);
      return { success: true, message: data.message };
    } else {
      throw new Error(data.error || 'Sotib olishda xatolik');
    }
  };

  // Play Mini Game
  const handlePlayGame = async (gameType: 'wheel' | 'chests' | 'coinflip', bet: number, choice?: string | number) => {
    if (!user) throw new Error('Foydalanuvchi topilmadi');
    const res = await fetch('/api/games/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user.telegramId,
        gameType,
        bet,
        choice,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setUser(data.user);
      return {
        won: data.won,
        multiplier: data.multiplier,
        payout: data.payout,
        details: data.details,
        netProfit: data.netProfit,
        coinOutcome: data.coinOutcome,
        chestDistribution: data.chestDistribution,
        wheelIndex: data.wheelIndex,
      };
    } else {
      throw new Error(data.error || 'O\'yinda xatolik');
    }
  };

  // Join Sunday 10k Giveaway
  const handleJoinGiveaway = async () => {
    if (!user) return;
    const res = await fetch('/api/giveaway/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: user.telegramId }),
    });
    if (res.ok) {
      setUser({ ...user, joinedGiveaway: true });
    }
  };

  // Claim Daily
  const handleClaimDaily = async (): Promise<boolean> => {
    if (!user) return false;
    const res = await fetch('/api/user/daily-claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: user.telegramId }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      return true;
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Xatolik yuz berdi');
    }
  };

  // Claim Task / Channel
  const handleClaimTask = async (channelId: string): Promise<boolean> => {
    if (!user) return false;
    const res = await fetch('/api/user/claim-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user.telegramId,
        channelId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      return true;
    } else {
      const err = await res.json();
      alert(err.error || 'Vazifani bajarishda xatolik yuz berdi');
      return false;
    }
  };

  // Submit Withdrawal
  const handleSubmitWithdraw = async (robloxUsername: string, amount: number): Promise<boolean> => {
    if (!user) return false;
    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user.telegramId,
        robloxUsername,
        amount,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setWithdrawals((prev) => [data.withdrawal, ...prev]);
      return true;
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Chiqarishda xatolik yuz berdi');
    }
  };

  const isAdmin = Boolean(
    user && settings.adminUsernames.includes(user.username.toLowerCase().replace('@', ''))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="h-10 w-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">BOSI Tekin Robux yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <Header
        balance={user ? user.balance : 0}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={true}
        onOpenWithdraw={() => setIsWithdrawOpen(true)}
        onOpenLinkRoblox={() => setIsLinkRobloxOpen(true)}
        onOpenProjectFiles={() => setIsProjectFilesOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        botUsername={settings.botUsername}
        robloxUsername={user?.robloxUsername}
      />

      {/* Main View */}
      <main className="flex-1 pb-16">
        {activeTab === 'game' && user && (
          <ClickerGame
            user={user}
            onTap={handleTap}
            onOpenDaily={() => setIsDailyOpen(true)}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenMiniGames={() => setIsMiniGamesOpen(true)}
            onOpenGiveaway={() => setIsGiveawayOpen(true)}
            onOpenTasks={() => setIsTasksOpen(true)}
            onOpenReferral={() => setIsReferralOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenLinkRoblox={() => setIsLinkRobloxOpen(true)}
            mandatoryChannelsCount={channels.length}
            completedTasksCount={user.completedTasks.length}
          />
        )}

        {activeTab === 'shop' && user && (
          <div className="max-w-xl mx-auto px-4 py-6">
            <ShopModal
              isOpen={true}
              onClose={() => setActiveTab('game')}
              user={user}
              onUpgradeTap={handleUpgradeTap}
              onBuyItem={handleBuyShopItem}
            />
          </div>
        )}

        {activeTab === 'minigames' && user && (
          <div className="max-w-xl mx-auto px-4 py-6">
            <MiniGamesModal
              isOpen={true}
              onClose={() => setActiveTab('game')}
              user={user}
              onPlayGame={handlePlayGame}
            />
          </div>
        )}

        {activeTab === 'giveaway' && user && (
          <div className="max-w-xl mx-auto px-4 py-6">
            <GiveawayModal
              isOpen={true}
              onClose={() => setActiveTab('game')}
              user={user}
              targetDateStr={giveaway.targetDate}
              pastWinners={giveaway.winners || []}
              onJoinGiveaway={handleJoinGiveaway}
            />
          </div>
        )}

        {activeTab === 'tasks' && user && (
          <div className="max-w-xl mx-auto px-4 py-6">
            <TasksChannelsModal
              isOpen={true}
              onClose={() => setActiveTab('game')}
              channels={channels}
              user={user}
              onClaimTask={handleClaimTask}
            />
          </div>
        )}

        {activeTab === 'withdraw' && user && (
          <div className="max-w-xl mx-auto px-4 py-6">
            <WithdrawModal
              isOpen={true}
              onClose={() => setActiveTab('game')}
              user={user}
              withdrawals={withdrawals}
              minWithdrawal={settings.minWithdrawal}
              onSubmitWithdraw={handleSubmitWithdraw}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            currentUsername={user ? user.username : 'bosi_admin'}
            adminUsernames={settings.adminUsernames}
            onClose={() => setActiveTab('game')}
          />
        )}
      </main>

      {/* Floating Bot Helper Indicator */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsLeaderboardOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/90 border border-amber-500/50 text-xs font-bold text-amber-300 hover:text-white hover:bg-amber-500/20 transition-all shadow-xl backdrop-blur-md cursor-pointer active:scale-95"
        >
          <Trophy className="h-4 w-4 text-amber-400" />
          <span>Top 10</span>
        </button>

        <button
          onClick={() => setIsBotInfoOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white hover:border-emerald-500/60 transition-all shadow-xl backdrop-blur-md cursor-pointer active:scale-95"
        >
          <Bot className="h-4 w-4 text-sky-400" />
          <span>@{settings.botUsername}</span>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'admin' ? 'game' : 'admin')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all shadow-xl backdrop-blur-md cursor-pointer active:scale-95"
        >
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          <span>{activeTab === 'admin' ? 'O\'yin' : 'Admin'}</span>
        </button>
      </div>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentTelegramId={user?.telegramId}
      />

      {/* Modals */}
      {user && (
        <>
          <RobloxAccountModal
            isOpen={isLinkRobloxOpen}
            onClose={() => setIsLinkRobloxOpen(false)}
            canClose={Boolean(user.robloxUsername)}
            onLinkRoblox={handleLinkRoblox}
          />

          <ShopModal
            isOpen={isShopOpen}
            onClose={() => setIsShopOpen(false)}
            user={user}
            onUpgradeTap={handleUpgradeTap}
            onBuyItem={handleBuyShopItem}
          />

          <MiniGamesModal
            isOpen={isMiniGamesOpen}
            onClose={() => setIsMiniGamesOpen(false)}
            user={user}
            onPlayGame={handlePlayGame}
          />

          <GiveawayModal
            isOpen={isGiveawayOpen}
            onClose={() => setIsGiveawayOpen(false)}
            user={user}
            targetDateStr={giveaway.targetDate}
            pastWinners={giveaway.winners || []}
            onJoinGiveaway={handleJoinGiveaway}
          />

          <DailyBonusModal
            isOpen={isDailyOpen}
            onClose={() => setIsDailyOpen(false)}
            user={user}
            onClaimDaily={handleClaimDaily}
            baseBonus={settings.dailyStreakBase}
          />

          <TasksChannelsModal
            isOpen={isTasksOpen}
            onClose={() => setIsTasksOpen(false)}
            channels={channels}
            user={user}
            onClaimTask={handleClaimTask}
          />

          <ReferralModal
            isOpen={isReferralOpen}
            onClose={() => setIsReferralOpen(false)}
            user={user}
            botUsername={settings.botUsername}
            referralRewardInviter={settings.referralRewardInviter}
            referralRewardFriend={settings.referralRewardFriend}
          />

          <WithdrawModal
            isOpen={isWithdrawOpen}
            onClose={() => setIsWithdrawOpen(false)}
            user={user}
            withdrawals={withdrawals}
            minWithdrawal={settings.minWithdrawal}
            onSubmitWithdraw={handleSubmitWithdraw}
          />
        </>
      )}

      <BotSetupHelperModal
        isOpen={isBotInfoOpen}
        onClose={() => setIsBotInfoOpen(false)}
        botUsername={settings.botUsername}
        adminUsernames={settings.adminUsernames}
        onSelectAdminUser={(uname) => {
          if (user) {
            setUser({ ...user, username: uname, firstName: uname });
          }
          setActiveTab('admin');
        }}
      />
    </div>
  );
}
