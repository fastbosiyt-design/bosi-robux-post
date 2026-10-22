export interface MandatoryChannel {
  id: string;
  name: string;
  username: string; // e.g. "@bosi_rasmiy"
  inviteLink: string;
  required: boolean;
  rewardRobux: number;
}

export interface WithdrawalRequest {
  id: string;
  telegramId: string;
  userFullName: string;
  telegramUsername?: string;
  robloxUsername: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
}

export interface UserProfile {
  id: string;
  telegramId: string;
  username: string;
  firstName: string;
  robloxUsername?: string;
  robloxAvatarUrl?: string;
  balance: number; // in Robux
  totalMined: number;
  energy: number;
  maxEnergy: number;
  tapPower: number; // starts at 0.1, doubles with upgrades: 0.2, 0.4, 0.8...
  tapUpgradeLevel: number;
  autoMinerRate: number; // Robux per second
  lastEnergyRefill: number;
  lastDailyClaim?: string;
  dailyStreak: number;
  completedTasks: string[]; // channel ids or task keys
  referredBy?: string;
  referralCount: number;
  joinedAt: string;
  hasAskedHelp?: boolean; // Telegram bot FAQ state
  joinedGiveaway?: boolean;
}

export interface SundayGiveaway {
  id: string;
  targetDate: string; // next Sunday 20:00 UTC+5
  prizePerWinner: number; // 10,000 RBX
  winnersCount: number; // 3
  status: 'active' | 'drawn';
  winners?: {
    telegramId: string;
    robloxUsername: string;
    name: string;
    wonAt: string;
    prize: number;
  }[];
}

export interface SystemSettings {
  minWithdrawal: number;
  referralRewardInviter: number;
  referralRewardFriend: number;
  dailyStreakBase: number;
  baseEnergy: number;
  energyRefillRatePerSec: number;
  botUsername: string;
  adminUsernames: string[];
  baseTapPower: number; // 0.1
  baseUpgradePrice: number; // 100
}

export interface AdminStats {
  totalUsers: number;
  totalRobuxMined: number;
  totalRobuxDistributed: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  channelsCount: number;
  giveawayParticipantsCount: number;
}

export interface LeaderboardUser {
  rank: number;
  telegramId: string;
  name: string;
  robloxUsername: string;
  avatarUrl: string;
  totalMined: number;
  balance: number;
  isCurrentUser?: boolean;
}
