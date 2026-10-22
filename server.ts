import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8820946196:AAH2qMY2Vs3kqo0M_2LBCPrizzgd_QsTR7M';
const BOT_USERNAME = 'BOSI_tekin_robuxbot';

// Allowed admin usernames (@bosi_admin, @vip_bosi, @fastabbos, @fastabbosrbx)
const defaultAdmins = ['bosi_admin', 'vip_bosi', 'fastabbos', 'fastabbosrbx'];
const envAdmins = (process.env.ADMIN_USERNAMES || '')
  .split(/[\s,]+/)
  .map((s) => s.trim().toLowerCase().replace('@', ''))
  .filter(Boolean);
const ADMIN_USERNAMES = Array.from(new Set([...defaultAdmins, ...envAdmins]));

// Admin Secret Code: BOSI2010 (kept strictly internal)
const ADMIN_SECRET_CODE = 'BOSI2010';

app.use(express.json());

// Persistent local data store
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface Channel {
  id: string;
  name: string;
  username: string;
  inviteLink: string;
  required: boolean;
  rewardRobux: number;
}

interface Withdrawal {
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

interface User {
  id: string;
  telegramId: string;
  username: string;
  firstName: string;
  robloxUsername?: string;
  robloxAvatarUrl?: string;
  balance: number;
  totalMined: number;
  energy: number;
  maxEnergy: number;
  tapPower: number; // starts at 0.1, doubles with upgrades: 0.2, 0.4, 0.8...
  tapUpgradeLevel: number;
  autoMinerRate: number;
  lastEnergyRefill: number;
  lastDailyClaim?: string;
  dailyStreak: number;
  completedTasks: string[];
  referredBy?: string;
  referralCount: number;
  joinedAt: string;
  hasAskedHelp?: boolean;
  joinedGiveaway?: boolean;
}

interface GiveawayWinner {
  telegramId: string;
  robloxUsername: string;
  name: string;
  wonAt: string;
  prize: number;
}

interface SundayGiveawayState {
  targetDate: string; // ISO string of upcoming Sunday 20:00
  prizePerWinner: number; // 10000 RBX
  winnersCount: number; // 3
  pastWinners: GiveawayWinner[];
}

interface StoreData {
  channels: Channel[];
  linkedBroadcastChannels: string[]; // channels where bot is added as admin
  users: Record<string, User>;
  withdrawals: Withdrawal[];
  robloxAccountsMap: Record<string, string>; // robloxUsername (lower) -> telegramId
  giveaway: SundayGiveawayState;
  settings: {
    minWithdrawal: number;
    referralRewardInviter: number;
    referralRewardFriend: number;
    dailyStreakBase: number;
    baseEnergy: number;
    energyRefillRatePerSec: number;
    baseTapPower: number;
    baseUpgradePrice: number;
  };
}

// Calculate next Sunday 20:00 UTC+5
function getNextSunday20(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0 is Sunday
  const diffToSunday = (7 - day) % 7;
  const target = new Date(now);
  target.setUTCDate(now.getUTCDate() + diffToSunday);
  // UTC+5 20:00 is 15:00 UTC
  target.setUTCHours(15, 0, 0, 0);

  // If today is Sunday and already past 15:00 UTC, move to next Sunday
  if (diffToSunday === 0 && now.getUTCHours() >= 15) {
    target.setUTCDate(target.getUTCDate() + 7);
  }
  return target.toISOString();
}

const defaultData: StoreData = {
  channels: [
    {
      id: 'ch_1',
      name: 'Fast Abbos Chat',
      username: '@fastabbos_chat',
      inviteLink: 'https://t.me/fastabbos_chat',
      required: true,
      rewardRobux: 250,
    },
    {
      id: 'ch_2',
      name: 'BOSI TEKIN ROBUX',
      username: '@BOSI_TEKIN_ROBUX',
      inviteLink: 'https://t.me/BOSI_TEKIN_ROBUX',
      required: true,
      rewardRobux: 300,
    },
  ],
  linkedBroadcastChannels: [],
  users: {},
  withdrawals: [],
  robloxAccountsMap: {},
  giveaway: {
    targetDate: getNextSunday20(),
    prizePerWinner: 10000,
    winnersCount: 3,
    pastWinners: [
      {
        telegramId: '9920192',
        robloxUsername: 'BosiPro_99',
        name: 'Azizbek',
        wonAt: 'O\'tgan yakshanba',
        prize: 10000,
      },
      {
        telegramId: '8839210',
        robloxUsername: 'RobuxKing_UZ',
        name: 'Jasur',
        wonAt: 'O\'tgan yakshanba',
        prize: 10000,
      },
      {
        telegramId: '7728193',
        robloxUsername: 'FastNinja_RBX',
        name: 'Shahzod',
        wonAt: 'O\'tgan yakshanba',
        prize: 10000,
      },
    ],
  },
  settings: {
    minWithdrawal: 1000,
    referralRewardInviter: 100,
    referralRewardFriend: 50,
    dailyStreakBase: 50,
    baseEnergy: 500,
    energyRefillRatePerSec: 0.5,
    baseTapPower: 0.1,
    baseUpgradePrice: 100,
  },
};

function ensureDataStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const loadedSettings = { ...defaultData.settings, ...(parsed.settings || {}) };
    loadedSettings.minWithdrawal = 1000;
    loadedSettings.baseEnergy = 500;
    loadedSettings.energyRefillRatePerSec = 0.5;
    loadedSettings.baseTapPower = 0.1;
    return {
      ...defaultData,
      ...parsed,
      settings: loadedSettings,
      giveaway: { ...defaultData.giveaway, ...(parsed.giveaway || {}) },
      robloxAccountsMap: parsed.robloxAccountsMap || {},
      linkedBroadcastChannels: parsed.linkedBroadcastChannels || [],
    };
  } catch (err) {
    console.error('Error reading store.json, re-initializing:', err);
    return defaultData;
  }
}

let store: StoreData = ensureDataStore();

function saveStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write store.json:', err);
  }
}

// Energy and auto-miner refill
function refillEnergy(user: User): User {
  const now = Date.now();
  const elapsedSec = Math.floor((now - user.lastEnergyRefill) / 1000);
  if (elapsedSec > 0 && user.energy < user.maxEnergy) {
    const addedEnergy = elapsedSec * store.settings.energyRefillRatePerSec;
    user.energy = Math.min(user.maxEnergy, user.energy + addedEnergy);
    user.lastEnergyRefill = now;
  }
  if (elapsedSec > 0 && user.autoMinerRate > 0) {
    const passiveMined = Math.min(elapsedSec * user.autoMinerRate, 500);
    user.balance += Math.round(passiveMined * 10) / 10;
    user.totalMined += Math.round(passiveMined * 10) / 10;
  }
  return user;
}

function getOrCreateUser(telegramId: string, username: string, firstName: string, referralCode?: string): User {
  if (!store.users[telegramId]) {
    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      telegramId,
      username: username || '',
      firstName: firstName || 'Roblox Player',
      balance: 0.00, // Hard difficulty: starts strictly at 0.00 R$
      totalMined: 0.00,
      energy: store.settings.baseEnergy,
      maxEnergy: store.settings.baseEnergy,
      tapPower: 0.1, // Initial tap strictly gives 0.1 RBX
      tapUpgradeLevel: 0,
      autoMinerRate: 0,
      lastEnergyRefill: Date.now(),
      dailyStreak: 0,
      completedTasks: [],
      referralCount: 0,
      joinedAt: new Date().toISOString(),
      hasAskedHelp: false,
      joinedGiveaway: true, // auto enter giveaway
    };

    if (referralCode && referralCode !== telegramId && store.users[referralCode]) {
      newUser.referredBy = referralCode;
      newUser.balance += store.settings.referralRewardFriend;
      store.users[referralCode].balance += store.settings.referralRewardInviter;
      store.users[referralCode].referralCount = (store.users[referralCode].referralCount || 0) + 1;
    }

    store.users[telegramId] = newUser;
    saveStore();
  } else {
    if (username) store.users[telegramId].username = username;
    if (firstName) store.users[telegramId].firstName = firstName;
  }

  return refillEnergy(store.users[telegramId]);
}

// -------------------------------------------------------------
// TELEGRAM BOT API METHODS
// -------------------------------------------------------------
async function tgApi(method: string, body: Record<string, unknown>, requestTimeoutMs: number = 10000) {
  if (!BOT_TOKEN) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timer);
    const errMsg = err instanceof Error ? err.message : String(err);
    const isNetworkOrTimeout = errMsg.includes('ETIMEDOUT') ||
      errMsg.includes('timeout') ||
      errMsg.includes('abort') ||
      errMsg.includes('aborted') ||
      errMsg.includes('ECONNRESET') ||
      errMsg.includes('fetch failed');

    // Network timeouts or aborted requests during long-polling are normal retries
    if (!isNetworkOrTimeout) {
      console.warn(`[Telegram API] Method ${method} warning:`, errMsg);
    }
    return null;
  }
}

async function checkUserSubscription(chatIdOrUsername: string, userId: string): Promise<boolean> {
  try {
    const res = await tgApi('getChatMember', {
      chat_id: chatIdOrUsername,
      user_id: parseInt(userId, 10),
    });
    if (res && res.ok && res.result) {
      const status = res.result.status;
      return ['creator', 'administrator', 'member', 'restricted'].includes(status);
    }
    return false;
  } catch {
    return false;
  }
}

async function checkAllMandatoryChannels(userId: string): Promise<{ allSubscribed: boolean; missing: Channel[] }> {
  const requiredChannels = store.channels.filter((c) => c.required);
  if (requiredChannels.length === 0) {
    return { allSubscribed: true, missing: [] };
  }

  const missing: Channel[] = [];
  for (const ch of requiredChannels) {
    const target = ch.username.startsWith('@') ? ch.username : (ch.username ? '@' + ch.username : null);
    if (target) {
      const isSub = await checkUserSubscription(target, userId);
      if (!isSub) {
        missing.push(ch);
      }
    }
  }

  return {
    allSubscribed: missing.length === 0,
    missing,
  };
}

function getAppUrl(req?: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (req) {
    const host = req.get('host');
    const proto = req.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  return 'https://bosiiiirobux.vercel.app';
}

// Send Persistent Keyboard with WebApp button
async function sendMainMenu(chatId: number, user: User, appUrl: string, isAdmin: boolean) {
  // WebApp button directly launches app without showing URL!
  const keyboard = [
    [{ text: '💎 ROBUX Ishlash', web_app: { url: appUrl } }],
    [{ text: '💰 Mening Balansim' }, { text: '👥 Do\'stlarni Taklif Qilish' }],
    [{ text: '🎁 10,000 R$ Konkurs' }, { text: '❓ Yordam (/help)' }],
  ];

  if (isAdmin) {
    keyboard.push([{ text: '⚙️ Admin Panel' }]);
  }

  await tgApi('sendMessage', {
    chat_id: chatId,
    text: `👑 **BOSI Tekin Robux Bosh Menyusi:**\n\n` +
      `👤 Salom, *${user.firstName}*!\n` +
      `🎮 Bog'langan Roblox: *${user.robloxUsername || 'bog\'lanmagan'}*\n` +
      `💎 Balansingiz: *${user.balance.toFixed(2)} Robux*\n` +
      `⚡ Har bosish: *+${user.tapPower.toFixed(2)} RBX*\n` +
      `🎁 10k RBX Konkursi: *Faol (Har yakshanba 20:00)*\n\n` +
      `Pastdagi **«💎 ROBUX Ishlash»** tugmasini bosing va o'yinni boshlang! 👇`,
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: keyboard,
      resize_keyboard: true,
    },
  });
}

// Handle Bot Message
async function handleBotUpdate(update: Record<string, unknown>, currentAppUrl: string) {
  // If bot was added to a channel as administrator
  if (update.my_chat_member) {
    const chatMemberUpdate = update.my_chat_member as {
      chat: { id: number; title?: string; username?: string; type: string };
      new_chat_member: { status: string };
    };
    if (['administrator', 'creator'].includes(chatMemberUpdate.new_chat_member.status)) {
      const channelId = String(chatMemberUpdate.chat.id);
      if (!store.linkedBroadcastChannels.includes(channelId)) {
        store.linkedBroadcastChannels.push(channelId);
        saveStore();
        console.log(`📢 Bot added as admin to channel: ${chatMemberUpdate.chat.title} (${channelId})`);
      }
    }
  }

  if (update.message) {
    const msg = update.message as {
      chat: { id: number; type?: string };
      from: { id: number; username?: string; first_name?: string };
      text?: string;
    };
    const chatId = msg.chat.id;
    const fromId = String(msg.from.id);
    const username = msg.from.username || '';
    const firstName = msg.from.first_name || 'Foydalanuvchi';
    const text = (msg.text || '').trim();

    const isAdmin = ADMIN_USERNAMES.includes(username.toLowerCase());
    const user = getOrCreateUser(fromId, username, firstName);

    // /start command
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const startParam = parts[1] || '';
      if (startParam.startsWith('ref_')) {
        const refCode = startParam.replace('ref_', '');
        if (!user.referredBy && refCode !== fromId && store.users[refCode]) {
          user.referredBy = refCode;
          user.balance += store.settings.referralRewardFriend;
          store.users[refCode].balance += store.settings.referralRewardInviter;
          store.users[refCode].referralCount = (store.users[refCode].referralCount || 0) + 1;
          saveStore();
        }
      }

      // Check mandatory subscriptions
      const subCheck = await checkAllMandatoryChannels(fromId);
      if (!subCheck.allSubscribed && subCheck.missing.length > 0) {
        const inlineKeyboard = subCheck.missing.map((ch, idx) => [
          {
            text: `📢 ${idx + 1}. ${ch.name}`,
            url: ch.inviteLink.startsWith('http') ? ch.inviteLink : `https://t.me/${ch.username.replace('@', '')}`,
          },
        ]);

        inlineKeyboard.push([
          {
            text: '✅ Obunani tekshirish',
            callback_data: 'check_subs',
          } as unknown as { text: string; url: string },
        ]);

        await tgApi('sendMessage', {
          chat_id: chatId,
          text: `👋 **Assalomu alaykum, ${firstName}!**\n\n🎉 **BOSI Tekin Robux** botiga xush kelibsiz!\n\n⚠️ Botdan to'liq foydalanish va tekin Robux yutib olish uchun quyidagi homiy kanallarga a'zo bo'ling:`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: inlineKeyboard,
          },
        });
        return;
      }

      await sendMainMenu(chatId, user, currentAppUrl, isAdmin);
      return;
    }

    // /help command
    if (text === '/help' || text === '❓ Yordam (/help)') {
      user.hasAskedHelp = true;
      saveStore();
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `ℹ️ **BOSI Tekin Robux Yordam Markazi:**\n\n` +
          `Men sizga barcha savollaringiz bo'yicha yordam berishga tayyorman!\n\n` +
          `Istagan savolingizni shunchaki xabar qilib yozing. Masalan:\n` +
          `🔹 *Qanaqa qilib Robux tushadi?*\n` +
          `🔹 *Konkurs qachon va qancha beradi?*\n` +
          `🔹 *Qanday qilib ko'proq Robux qazish mumkin?*\n` +
          `🔹 *Roblox akkaunt qanday ulanadi?*\n\n` +
          `Savolingizni pastga yozing: 👇`,
        parse_mode: 'Markdown',
      });
      return;
    }

    // Balance command
    if (text === '/balance' || text === '💰 Mening Balansim') {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `💎 **BOSI Tekin Robux Hisobingiz:**\n\n` +
          `👤 Foydalanuvchi: ${firstName} (@${username || 'yo\'q'})\n` +
          `🎮 Roblox Login: *${user.robloxUsername || 'Hali bog\'lanmagan'}*\n` +
          `💰 Balans: *${user.balance.toFixed(2)} Robux*\n` +
          `⚡ Quvvat: *${user.tapPower.toFixed(2)} RBX / bosish*\n` +
          `⛏ Jami qazilgan: *${user.totalMined.toFixed(2)} Robux*\n` +
          `👥 Taklif qilingan do'stlar: *${user.referralCount} ta*\n\n` +
          `Minimal chiqarish miqdori: *${store.settings.minWithdrawal} R$*`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💎 ROBUX Ishlash', web_app: { url: currentAppUrl } }],
          ],
        },
      });
      return;
    }

    // Giveaway command
    if (text === '🎁 10,000 R$ Konkurs' || text === '/giveaway') {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `🎉 **Haftalik Katta Konkurs — 30,000 ROBUX!**\n\n` +
          `📅 **Har Yakshanba soat 20:00 da** tasodifiy 3 ta faol ishtirokchiga **10,000 Robuxdan** (jami 30,000 R$) sovg'a qilinadi!\n\n` +
          `🏆 Ishtirok etish shartlari:\n` +
          `1. Majburiy kanallarga a'zo bo'lish.\n` +
          `2. Veb-ilovada Robux qazish va o'yinlarda qatnashish.\n\n` +
          `O'yinda ishtirok etish uchun pastdagi tugmani bosing:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💎 Veb-Ilovaga Kirish', web_app: { url: currentAppUrl } }],
          ],
        },
      });
      return;
    }

    // Referral command
    if (text === '/referral' || text === '👥 Do\'stlarni Taklif Qilish') {
      const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${fromId}`;
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `👥 **Do'stlarni Taklif Qiling va Robux Oling!**\n\n` +
          `Har bir chaqirilgan do'st uchun sizga *+${store.settings.referralRewardInviter} Robux*, do'stingizga esa *+${store.settings.referralRewardFriend} Robux* beriladi!\n\n` +
          `🔗 Sizning shaxsiy havolangiz:\n\`${refLink}\`\n\n` +
          `Siz taklif qilgan a'zolar: *${user.referralCount} ta*`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Do\'stlarga ulashish',
                url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('🔥 BOSI Tekin Robux botida bepul Robux ishlayapman! Har yakshanba 10k RBX konkurs bor! Hoziroq kirib bonus oling!')}`,
              },
            ],
            [{ text: '💎 ROBUX Ishlash', web_app: { url: currentAppUrl } }],
          ],
        },
      });
      return;
    }

    // Admin Command
    if (text === '/admin' || text === '⚙️ Admin Panel') {
      if (!isAdmin) {
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: `❌ Kechirasiz, admin panelga faqat @bosi_admin, @vip_bosi va @fastabbosrbx kirishi mumkin!`,
        });
        return;
      }

      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `👑 **BOSI Admin Panel:**\n\n` +
          `📊 Jami a'zolar: *${Object.keys(store.users).length} ta*\n` +
          `🏧 Kutilayotgan arizalar: *${store.withdrawals.filter((w) => w.status === 'pending').length} ta*\n` +
          `📢 Majburiy kanallar: *${store.channels.length} ta*\n` +
          `📡 Ulangan kanallar: *${store.linkedBroadcastChannels.length} ta*\n\n` +
          `Barcha arizalarni tasdiqlash va kanallarni boshqarish uchun veb-panelni oching:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚙️ Veb Admin Panelni Ochish', web_app: { url: `${currentAppUrl}?admin=true` } }],
          ],
        },
      });
      return;
    }

    // NLP / Smart FAQ Answer Engine for natural questions!
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('qanaqa') ||
      lowerText.includes('qanday') ||
      lowerText.includes('tushadi') ||
      lowerText.includes('send') ||
      lowerText.includes('chiqar')
    ) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `💎 **Robux qanday tushadi?**\n\n` +
          `Siz veb-ilovada Robux yig'ib 'Robux Chiqarish' bo'limida Roblox akkauntingiz logini (username)ni kiritasiz.\n\n` +
          `Adminlarimiz sizning Robuxingizni Roblox Group Payout tizimi orqali sizga to'g'ridan-to'g'ri **send qilib yuboradi**!\n\n` +
          `🛡 **Muhim**: Biz hech qachon parolingizni so'ramaymiz — faqat username kerak!`,
        parse_mode: 'Markdown',
      });
      return;
    }

    if (
      lowerText.includes('konkurs') ||
      lowerText.includes('yakshanba') ||
      lowerText.includes('10k') ||
      lowerText.includes('yutuq') ||
      lowerText.includes('soat 20')
    ) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `🎁 **Haftalik 10,000 Robux Konkursi!**\n\n` +
          `Har **yakshanba soat 20:00 da** saytdan tasodifiy 3 ta ishtirokchiga **10,000 Robuxdan** (jami 30,000 R$) sovg'a qilinadi!\n\n` +
          `O'yinda muntazam Robux qazib tursangiz, konkursda avtomatik qatnashasiz.`,
        parse_mode: 'Markdown',
      });
      return;
    }

    if (
      lowerText.includes('kuchaytir') ||
      lowerText.includes('bosish') ||
      lowerText.includes('0.1') ||
      lowerText.includes('0.2') ||
      lowerText.includes('do\'kon') ||
      lowerText.includes('shop')
    ) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `⚡ **Robux qazishni ko'paytirish:**\n\n` +
          `Dastlab har bosishda *0.1 RBX* beriladi. Do'kondan (Shop) *100 RBX* evaziga kuchaytirgich sotib olsangiz, har bosish *0.2 RBX* berishni boshlaydi!\n\n` +
          `Keyingi har bir darajada narx va beradigan Robux 2 barobar ko'payib boradi (0.4 RBX, 0.8 RBX...).`,
        parse_mode: 'Markdown',
      });
      return;
    }

    if (
      lowerText.includes('parol') ||
      lowerText.includes('akkaunt') ||
      lowerText.includes('login') ||
      lowerText.includes('nik')
    ) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `🛡 **Roblox akkaunt xavfsizligi:**\n\n` +
          `Saytda Robux olish uchun hech qanday parol kerak emas! Faqat Roblox login (nikingiz) kiritiladi.\n` +
          `Sayt bir marta nikingizni eslab qoladi va boshqa hech kim sizning nikingiz bilan kira olmaydi.`,
        parse_mode: 'Markdown',
      });
      return;
    }

    // Default polite reply with WebApp button
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `👋 Salom, *${firstName}*!\n\nPastdagi **«💎 ROBUX Ishlash»** tugmasini bosing va katta Robux belgisini bosib Robux yig'ishni boshlang!`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 ROBUX Ishlash', web_app: { url: currentAppUrl } }],
          [{ text: '❓ Yordam', callback_data: 'help_btn' }, { text: '🎁 10k Konkurs', callback_data: 'giveaway_btn' }],
        ],
      },
    });
  } else if (update.callback_query) {
    const cb = update.callback_query as {
      id: string;
      from: { id: number; username?: string; first_name?: string };
      message?: { chat: { id: number }; message_id: number };
      data?: string;
    };
    const chatId = cb.message?.chat.id;
    const fromId = String(cb.from.id);
    const username = cb.from.username || '';
    const firstName = cb.from.first_name || 'Foydalanuvchi';
    const data = cb.data;

    await tgApi('answerCallbackQuery', { callback_query_id: cb.id });

    if (data === 'check_subs' && chatId) {
      const subCheck = await checkAllMandatoryChannels(fromId);
      if (subCheck.allSubscribed) {
        const user = getOrCreateUser(fromId, username, firstName);
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: `🎉 **Tabriklaymiz!** Siz barcha homiy kanallarga muvaffaqiyatli a'zo bo'ldingiz!\nEndi bemalol tekin Robux ishlashingiz mumkin:`,
          parse_mode: 'Markdown',
        });
        const isAdmin = ADMIN_USERNAMES.includes(username.toLowerCase());
        await sendMainMenu(chatId, user, currentAppUrl, isAdmin);
      } else {
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: `⚠️ **Diqqat!** Siz hali barcha majburiy kanallarga a'zo bo'lmadingiz. Iltimos, kanallarga kiring va yana "✅ Obunani tekshirish" tugmasini bosing!`,
          reply_markup: {
            inline_keyboard: subCheck.missing.map((ch, idx) => [
              {
                text: `📢 ${idx + 1}. ${ch.name}`,
                url: ch.inviteLink.startsWith('http') ? ch.inviteLink : `https://t.me/${ch.username.replace('@', '')}`,
              },
            ]).concat([
              [{ text: '✅ Qaytadan tekshirish', callback_data: 'check_subs' } as unknown as { text: string; url: string }],
            ]),
          },
        });
      }
    } else if (data === 'help_btn' && chatId) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `💎 **BOSI Tekin Robux Qo'llanma:**\n\n1. Katta Robux tangasini bosing (har bosish 0.1 RBX).\n2. Do'kondan kuchaytirib 0.2, 0.4 RBX qiling.\n3. Mini-o'yinlar (Omad charxi, Qutilar) o'ynab ko'paytiring.\n4. Minimal 1,000 RBX to'plab, Roblox loginingizga chiqarib oling!\n\nYetkazib berish taxminan 20 kunda Roblox hisobingizga tushadi.`,
        parse_mode: 'Markdown',
      });
    } else if (data === 'giveaway_btn' && chatId) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `🎁 **Yakshanba 20:00 Konkursi:**\nHar yakshanba soat 20:00 da 3 ta o'yinchiga 10,000 Robuxdan sovg'a qilinadi!`,
        parse_mode: 'Markdown',
      });
    }
  }
}

// Telegram Polling Engine with 24/7 Auto-Reconnect
let isPolling = false;
async function startTelegramPolling() {
  if (isPolling) return;
  isPolling = true;
  console.log('🤖 Telegram Bot 24/7 polling started for @' + BOT_USERNAME);

  const currentUrl = process.env.APP_URL || 'https://bosiiiirobux.vercel.app';

  // Automatically configure Telegram WebApp Chat Menu Button
  try {
    await tgApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '💎 ROBUX',
        web_app: { url: currentUrl },
      },
    });
    console.log('✅ Telegram Bot WebApp Menu Button connected to:', currentUrl);
  } catch (err) {
    console.error('Failed to set chat menu button:', err);
  }

  let offset = 0;
  let consecutiveErrors = 0;
  while (true) {
    try {
      const res = await tgApi('getUpdates', {
        offset: offset,
        timeout: 5,
        allowed_updates: ['message', 'callback_query', 'my_chat_member'],
      }, 10000);

      if (res && res.ok && Array.isArray(res.result)) {
        consecutiveErrors = 0;
        for (const update of res.result) {
          offset = update.update_id + 1;
          const targetUrl = process.env.APP_URL || 'https://bosiiiirobux.vercel.app';
          await handleBotUpdate(update, targetUrl);
        }
      } else {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch {
      consecutiveErrors++;
      const backoffMs = Math.min(10000, 1500 * Math.pow(1.3, consecutiveErrors));
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// Public configuration
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    botUsername: BOT_USERNAME,
    channels: store.channels,
    settings: store.settings,
    giveaway: {
      targetDate: store.giveaway.targetDate,
      prizePerWinner: store.giveaway.prizePerWinner,
      winnersCount: store.giveaway.winnersCount,
      pastWinners: store.giveaway.pastWinners,
    },
    adminUsernames: ADMIN_USERNAMES,
  });
});

// Sync user
app.post('/api/user/sync', (req: Request, res: Response) => {
  const { telegramId, username, firstName, referralCode } = req.body;
  const user = getOrCreateUser(String(telegramId || 'guest'), username || '', firstName || 'Mehmon', referralCode);
  res.json({ success: true, user });
});

// Roblox Account Lock / Verification (Anti-Steal & Unique nickname)
app.post('/api/user/link-roblox', (req: Request, res: Response) => {
  const { telegramId, robloxUsername, avatarUrl } = req.body;
  const user = store.users[String(telegramId)];
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  const cleanNick = (robloxUsername || '').trim();
  if (cleanNick.length < 3) {
    res.status(400).json({ error: 'Roblox foydalanuvchi nomi kamida 3 belgidan iborat bo\'lishi kerak!' });
    return;
  }

  const lowerNick = cleanNick.toLowerCase();
  const existingOwner = store.robloxAccountsMap[lowerNick];

  // If another device/telegram user registered this nick
  if (existingOwner && existingOwner !== user.telegramId) {
    res.status(400).json({
      error: `Ushbu nikli odam allaqachon mavjud (${cleanNick})! Boshqa akkaunt tanlang yoki o'z qurilmangizdan kiring.`,
      exists: true,
    });
    return;
  }

  // Bind nick to this user
  store.robloxAccountsMap[lowerNick] = user.telegramId;
  user.robloxUsername = cleanNick;
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
    user.robloxAvatarUrl = avatarUrl;
  } else if (!user.robloxAvatarUrl) {
    user.robloxAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanNick)}&backgroundColor=0f172a`;
  }

  saveStore();
  res.json({
    success: true,
    message: `O'yinchi topildi va muvaffaqiyatli bog'landi: ${cleanNick}`,
    robloxUsername: cleanNick,
    avatarUrl: user.robloxAvatarUrl,
    user,
  });
});

// Tap Robux Coin (gives 0.1 RBX initially, scales with tapPower)
app.post('/api/user/tap', (req: Request, res: Response) => {
  const { telegramId, taps = 1 } = req.body;
  const user = store.users[String(telegramId)];
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  refillEnergy(user);

  const cleanTaps = Math.min(Math.max(1, parseInt(taps, 10)), 50);
  const energyCost = cleanTaps * 1;

  if (user.energy < energyCost) {
    const possibleTaps = Math.max(0, Math.floor(user.energy));
    if (possibleTaps <= 0) {
      res.status(400).json({ error: 'Energiya tugadi! Biroz kuting yoki do\'kondan quvvatni to\'ldiring.', user });
      return;
    }
    const earned = possibleTaps * user.tapPower;
    user.energy -= possibleTaps;
    user.balance += Math.round(earned * 100) / 100;
    user.totalMined += Math.round(earned * 100) / 100;
    saveStore();
    res.json({ success: true, earned, user });
    return;
  }

  const earned = cleanTaps * user.tapPower;
  user.energy -= energyCost;
  user.balance += Math.round(earned * 100) / 100;
  user.totalMined += Math.round(earned * 100) / 100;
  saveStore();

  res.json({ success: true, earned, user });
});

// Shop Upgrades: Tap Multiplier (2x scaling, starts at 100 RBX -> 0.2 RBX, then 200 -> 0.4, 400 -> 0.8...)
app.post('/api/user/upgrade-tap', (req: Request, res: Response) => {
  const { telegramId } = req.body;
  const user = store.users[String(telegramId)];
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  const currentLevel = user.tapUpgradeLevel || 0;
  // Level 0: 100 RBX -> gives 0.2 RBX
  // Level 1: 200 RBX -> gives 0.4 RBX
  // Level 2: 400 RBX -> gives 0.8 RBX
  const cost = 100 * Math.pow(2, currentLevel);
  const nextTapPower = Math.round(0.1 * Math.pow(2, currentLevel + 1) * 100) / 100;

  if (user.balance < cost) {
    res.status(400).json({ error: `Robux yetarli emas! Kerak: ${cost} RBX, sizda: ${user.balance.toFixed(2)} RBX` });
    return;
  }

  user.balance -= cost;
  user.tapUpgradeLevel = currentLevel + 1;
  user.tapPower = nextTapPower;

  saveStore();
  res.json({
    success: true,
    message: `Tabriklaymiz! Har bosish endi +${nextTapPower} RBX beradi!`,
    user,
  });
});

// Shop Item: Refill Energy or Auto Miner
app.post('/api/user/shop-buy', (req: Request, res: Response) => {
  const { telegramId, itemId } = req.body;
  const user = store.users[String(telegramId)];
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  if (itemId === 'refill_energy') {
    const cost = 30; // 30 RBX
    if (user.balance < cost) {
      res.status(400).json({ error: `Yetarli Robux yo'q! Kerak: ${cost} RBX` });
      return;
    }
    user.balance -= cost;
    user.energy = user.maxEnergy;
    saveStore();
    res.json({ success: true, message: 'Energiya to\'liq 100% tiklandi!', user });
    return;
  }

  if (itemId === 'auto_miner') {
    const level = Math.floor(user.autoMinerRate * 2) + 1;
    const cost = Math.round(200 * Math.pow(1.8, level - 1));
    if (user.balance < cost) {
      res.status(400).json({ error: `Yetarli Robux yo'q! Kerak: ${cost} RBX` });
      return;
    }
    user.balance -= cost;
    user.autoMinerRate += 0.5;
    saveStore();
    res.json({ success: true, message: `Avto-qazish tezligi: +${user.autoMinerRate} RBX/s ga oshirildi!`, user });
    return;
  }

  res.status(400).json({ error: 'Noma\'lum buyum' });
});

// Mini Games: Wheel, Chests, CoinFlip
app.post('/api/games/play', (req: Request, res: Response) => {
  const { telegramId, gameType, bet = 10, choice } = req.body;
  const user = store.users[String(telegramId)];
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  const betAmount = Math.max(1, parseInt(bet, 10));
  if (user.balance < betAmount) {
    res.status(400).json({ error: 'Hisobingizda yetarli Robux yo\'q!' });
    return;
  }

  user.balance -= betAmount;

  let multiplier = 0;
  let won = false;
  let details = '';
  let coinOutcome: 'heads' | 'tails' | undefined;
  let chestDistribution: number[] | undefined;
  let wheelIndex: number | undefined;

  if (gameType === 'wheel') {
    // Wheel multipliers: [0, 0.5, 1.5, 2, 2.5, 5, 10]
    const multipliers = [0, 0.5, 1.5, 2, 2.5, 5, 10];
    const randIdx = Math.floor(Math.random() * multipliers.length);
    wheelIndex = randIdx;
    multiplier = multipliers[randIdx];
    won = multiplier > 1;
    details = `Omad charxi: ${multiplier}x tushdi!`;
  } else if (gameType === 'chests') {
    // 3 Chests with randomised rewards [0, 1.8, 3.5]
    const chosenIdx = typeof choice === 'number' ? choice : (parseInt(String(choice), 10) || 0);
    const validIdx = Math.max(0, Math.min(2, chosenIdx));
    const rewards = [0, 1.8, 3.5].sort(() => Math.random() - 0.5);
    multiplier = rewards[validIdx] ?? 0;
    chestDistribution = rewards;
    won = multiplier > 1;
    details = `Sandiq ochildi: ${multiplier}x Robux!`;
  } else if (gameType === 'coinflip') {
    // Heads or Tails (50/50)
    const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
    coinOutcome = outcome;
    const userChoice = choice === 'heads' ? 'heads' : 'tails';
    if (outcome === userChoice) {
      multiplier = 1.95;
      won = true;
      details = `To'g'ri topdingiz! (${outcome === 'heads' ? 'Burgut' : 'Raqam'})`;
    } else {
      multiplier = 0;
      won = false;
      details = `Afsus, tushmadi (${outcome === 'heads' ? 'Burgut' : 'Raqam'})`;
    }
  }

  const payout = Math.round(betAmount * multiplier * 100) / 100;
  if (payout > 0) {
    user.balance += payout;
    user.totalMined += Math.max(0, payout - betAmount);
  }

  saveStore();
  res.json({
    success: true,
    won,
    multiplier,
    payout,
    netProfit: payout - betAmount,
    details,
    user,
    coinOutcome,
    chestDistribution,
    wheelIndex,
  });
});

// Join Sunday 10k Giveaway
app.post('/api/giveaway/join', (req: Request, res: Response) => {
  const { telegramId } = req.body;
  const user = store.users[String(telegramId)];
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  user.joinedGiveaway = true;
  saveStore();
  res.json({ success: true, message: 'Siz haftalik 10,000 Robux konkursiga muvaffaqiyatli qo\'shildingiz!' });
});

// Claim Daily Bonus
app.post('/api/user/daily-claim', (req: Request, res: Response) => {
  const { telegramId } = req.body;
  const user = store.users[String(telegramId)];
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (user.lastDailyClaim === todayStr) {
    res.status(400).json({ error: 'Bugungi bonusni olgansiz! Ertaga yana kiring.' });
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (user.lastDailyClaim === yesterdayStr) {
    user.dailyStreak = Math.min(7, (user.dailyStreak || 0) + 1);
  } else {
    user.dailyStreak = 1;
  }

  const bonusAmount = store.settings.dailyStreakBase * user.dailyStreak;
  user.balance += bonusAmount;
  user.totalMined += bonusAmount;
  user.lastDailyClaim = todayStr;
  saveStore();

  res.json({ success: true, bonusAmount, dailyStreak: user.dailyStreak, user });
});

// Complete Channel Task
app.post('/api/user/claim-task', async (req: Request, res: Response) => {
  const { telegramId, channelId } = req.body;
  const user = store.users[String(telegramId)];
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  const channel = store.channels.find((c) => c.id === channelId);
  if (!channel) {
    res.status(404).json({ error: 'Kanal topilmadi' });
    return;
  }

  if (user.completedTasks.includes(channelId)) {
    res.status(400).json({ error: 'Bu vazifa allaqachon bajarilgan!' });
    return;
  }

  user.completedTasks.push(channelId);
  user.balance += channel.rewardRobux;
  user.totalMined += channel.rewardRobux;
  saveStore();

  res.json({ success: true, reward: channel.rewardRobux, user });
});

// Roblox Avatar Search & Verification Endpoint
app.get('/api/roblox/search', async (req: Request, res: Response) => {
  const username = String(req.query.username || '').trim();
  const currentTgId = String(req.query.telegramId || '');

  if (!username || username.length < 3) {
    res.status(400).json({ found: false, error: 'Foydalanuvchi nomini kiriting (kamida 3 belgi)' });
    return;
  }

  // Anti-steal / check if already claimed by someone else on our platform
  const lowerNick = username.toLowerCase();
  const existingOwner = store.robloxAccountsMap[lowerNick];
  const isClaimedByOther = existingOwner && existingOwner !== currentTgId;

  try {
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });

    if (userRes.ok) {
      const userData = (await userRes.json()) as { data?: { id: number; name: string; displayName?: string }[] };
      if (userData.data && userData.data.length > 0) {
        const robloxUser = userData.data[0];
        const userId = robloxUser.id;
        const displayName = robloxUser.displayName || robloxUser.name;

        // Fetch high quality headshot thumbnail from Roblox CDN
        let avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(robloxUser.name)}&backgroundColor=0f172a`;
        try {
          const thumbRes = await fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
          );
          if (thumbRes.ok) {
            const thumbData = (await thumbRes.json()) as { data?: { imageUrl?: string }[] };
            if (thumbData.data && thumbData.data.length > 0 && thumbData.data[0].imageUrl) {
              avatarUrl = thumbData.data[0].imageUrl;
            }
          }
        } catch {
          // fallback
        }

        if (isClaimedByOther) {
          res.status(400).json({
            found: true,
            alreadyClaimed: true,
            username: robloxUser.name,
            displayName,
            userId,
            avatarUrl,
            error: `Ushbu nikli odam saytda allaqachon mavjud (${robloxUser.name})! Boshqa akkaunt tanlang yoki o'z qurilmangizdan kiring.`,
          });
          return;
        }

        res.json({
          found: true,
          alreadyClaimed: false,
          username: robloxUser.name,
          displayName,
          userId,
          avatarUrl,
          profileUrl: `https://www.roblox.com/users/${userId}/profile`,
        });
        return;
      } else {
        // Explicitly not found on Roblox
        res.status(404).json({
          found: false,
          error: `Ushbu nikli odam roblox.com da topilmadi (${username}). Nikingizni to'g'ri yozganingizga ishonch hosil qiling!`,
        });
        return;
      }
    }
  } catch (err) {
    console.log('Roblox external fetch failed, fallback avatar will be used:', err);
  }

  // Graceful fallback if network to Roblox API times out
  if (isClaimedByOther) {
    res.status(400).json({
      found: true,
      alreadyClaimed: true,
      username,
      displayName: username,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}&backgroundColor=0f172a`,
      error: `Ushbu nikli odam saytda allaqachon mavjud (${username})!`,
    });
    return;
  }

  res.json({
    found: true,
    alreadyClaimed: false,
    username,
    displayName: username,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}&backgroundColor=0f172a`,
    profileUrl: `https://www.roblox.com`,
  });
});

// Withdraw Robux (min 1,000, max 100,000,000, ~20 kun delivery)
app.post('/api/withdraw', (req: Request, res: Response) => {
  const { telegramId, robloxUsername, amount } = req.body;
  const user = store.users[String(telegramId)];
  if (!user) {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    return;
  }

  const withdrawAmount = parseInt(amount, 10);
  const minLimit = 1000; // minimum 1k Robux
  const maxLimit = 100000000; // maximum 100m Robux

  if (isNaN(withdrawAmount) || withdrawAmount < minLimit) {
    res.status(400).json({ error: `Minimal chiqarish miqdori: 1,000 ta Robux (1k)!` });
    return;
  }

  if (withdrawAmount > maxLimit) {
    res.status(400).json({ error: `Maksimal chiqarish miqdori: 100,000,000 ta Robux (100m)!` });
    return;
  }

  if (user.balance < withdrawAmount) {
    res.status(400).json({ error: `Hisobingizda buncha Robux yo'q! Sizda: ${user.balance.toFixed(2)} ta RBX` });
    return;
  }

  const cleanNick = (robloxUsername || user.robloxUsername || '').trim();
  if (cleanNick.length < 3) {
    res.status(400).json({ error: 'To\'g\'ri Roblox login kiriting!' });
    return;
  }

  user.balance -= withdrawAmount;
  user.robloxUsername = cleanNick;

  const newWithdrawal: Withdrawal = {
    id: 'wd_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    telegramId: user.telegramId,
    userFullName: user.firstName,
    telegramUsername: user.username,
    robloxUsername: cleanNick,
    amount: withdrawAmount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    adminNote: '20 kunda hisobga tushadi',
  };

  store.withdrawals.unshift(newWithdrawal);
  saveStore();

  // Notify admins
  for (const adminUname of ADMIN_USERNAMES) {
    const adminUser = Object.values(store.users).find((u) => u.username.toLowerCase() === adminUname);
    if (adminUser) {
      tgApi('sendMessage', {
        chat_id: adminUser.telegramId,
        text: `🔔 **Yangi Robux Chiqarish So'rovi!**\n\n` +
          `👤 Foydalanuvchi: ${user.firstName} (@${user.username || 'yo\'q'})\n` +
          `🎮 Roblox Login: *${cleanNick}*\n` +
          `💎 Miqdor: *${withdrawAmount} Robux*\n` +
          `📅 Vaqt: ${new Date().toLocaleString('uz-UZ')}\n\n` +
          `Admin panel orqali tasdiqlang yoki rad eting.`,
        parse_mode: 'Markdown',
      });
    }
  }

  res.json({
    success: true,
    message: `Arizangiz muvaffaqiyatli qabul qilindi! ${withdrawAmount.toLocaleString()} Robux 20 kunda ${cleanNick} hisobiga tushadi.`,
    deliveryDays: 20,
    withdrawal: newWithdrawal,
    user,
  });
});

app.get('/api/withdrawals/my', (req: Request, res: Response) => {
  const telegramId = String(req.query.telegramId || '');
  const userWithdrawals = store.withdrawals.filter((w) => w.telegramId === telegramId);
  res.json({ withdrawals: userWithdrawals });
});

// Top 10 Leaderboard Endpoint
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const currentTgId = String(req.query.telegramId || '');

  // Default legendary seed players so Top 10 is always exciting and filled
  const seedPlayers = [
    { telegramId: 'seed_1', name: 'Abbos (Admin)', robloxUsername: 'Bosi_Admin', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bosi_Admin&backgroundColor=0f172a', totalMined: 48950.8, balance: 24500.5 },
    { telegramId: 'seed_2', name: 'Fast Abbos RBX', robloxUsername: 'FastAbbos_RBX', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=FastAbbos_RBX&backgroundColor=0f172a', totalMined: 36240.0, balance: 18120.0 },
    { telegramId: 'seed_3', name: 'Robux King UZ', robloxUsername: 'RobuxKing_UZ', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=RobuxKing_UZ&backgroundColor=0f172a', totalMined: 28150.4, balance: 14000.0 },
    { telegramId: 'seed_4', name: 'Jasur Pro', robloxUsername: 'Jasur_Gamer', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Jasur_Gamer&backgroundColor=0f172a', totalMined: 19800.2, balance: 9900.0 },
    { telegramId: 'seed_5', name: 'Shahzod', robloxUsername: 'Shahzod_RBX', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shahzod_RBX&backgroundColor=0f172a', totalMined: 15420.0, balance: 7710.0 },
    { telegramId: 'seed_6', name: 'Azizbek', robloxUsername: 'Azizbek_NoobToPro', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Azizbek_NoobToPro&backgroundColor=0f172a', totalMined: 12300.5, balance: 6150.0 },
    { telegramId: 'seed_7', name: 'Cyber Uzbek', robloxUsername: 'Cyber_Uzbek', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber_Uzbek&backgroundColor=0f172a', totalMined: 9800.0, balance: 4900.0 },
    { telegramId: 'seed_8', name: 'Sardor Blox', robloxUsername: 'Sardor_Blox99', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sardor_Blox99&backgroundColor=0f172a', totalMined: 7650.0, balance: 3825.0 },
    { telegramId: 'seed_9', name: 'Alisher', robloxUsername: 'Alisher_Pro777', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alisher_Pro777&backgroundColor=0f172a', totalMined: 5400.0, balance: 2700.0 },
    { telegramId: 'seed_10', name: 'Dostonbek', robloxUsername: 'Doston_Legend', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Doston_Legend&backgroundColor=0f172a', totalMined: 3200.0, balance: 1600.0 },
  ];

  // Map real users from store
  const realUsers = Object.values(store.users).map((u) => ({
    telegramId: u.telegramId,
    name: u.firstName || u.username || 'Roblox O\'yinchi',
    robloxUsername: u.robloxUsername || (u.username ? `${u.username}_rbx` : 'O\'yinchi'),
    avatarUrl: u.robloxAvatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.robloxUsername || u.telegramId)}&backgroundColor=0f172a`,
    totalMined: u.totalMined || 0,
    balance: u.balance || 0,
  }));

  const combinedMap = new Map<string, typeof seedPlayers[0]>();
  for (const s of seedPlayers) combinedMap.set(s.robloxUsername.toLowerCase(), s);
  for (const r of realUsers) {
    if (r.robloxUsername) {
      combinedMap.set(r.robloxUsername.toLowerCase(), r);
    }
  }

  const allSorted = Array.from(combinedMap.values()).sort((a, b) => b.totalMined - a.totalMined);
  const top10 = allSorted.slice(0, 10).map((p, idx) => ({
    rank: idx + 1,
    ...p,
    isCurrentUser: p.telegramId === currentTgId,
  }));

  let userRank = allSorted.findIndex((p) => p.telegramId === currentTgId);
  const currentUserRank = userRank !== -1 ? userRank + 1 : (top10.length + 1);

  res.json({
    top10,
    currentUserRank,
    totalPlayers: allSorted.length,
  });
});

// 24/7 Health and Uptime status endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    domain: 'bosiiiirobux.vercel.app',
    bot: {
      username: BOT_USERNAME,
      status: 'active_24_7',
    },
    usersCount: Object.keys(store.users).length,
  });
});

// -------------------------------------------------------------
// ADMIN API (Auth via username or BOSI2010 code)
// -------------------------------------------------------------
function verifyAdmin(req: Request): boolean {
  const authHeader = (req.headers['x-admin-user'] as string) || '';
  const adminKey = (req.headers['x-admin-key'] as string) || '';
  const cleanUname = authHeader.trim().toLowerCase().replace('@', '');

  if (cleanUname && ADMIN_USERNAMES.includes(cleanUname)) {
    return true;
  }
  // Check secret code BOSI2010
  if (adminKey === ADMIN_SECRET_CODE || adminKey === 'BOSI2010') {
    return true;
  }
  return false;
}

app.get('/api/admin/overview', (req: Request, res: Response) => {
  if (!verifyAdmin(req)) {
    res.status(403).json({ error: 'Ruxsat berilmagan! Faqat @bosi_admin, @vip_bosi va @fastabbosrbx uchun.' });
    return;
  }

  const usersList = Object.values(store.users);
  const totalRobuxMined = usersList.reduce((acc, u) => acc + (u.totalMined || 0), 0);
  const totalRobuxDistributed = store.withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((acc, w) => acc + w.amount, 0);
  const pendingWd = store.withdrawals.filter((w) => w.status === 'pending');

  res.json({
    stats: {
      totalUsers: usersList.length,
      totalRobuxMined,
      totalRobuxDistributed,
      pendingWithdrawalsCount: pendingWd.length,
      pendingWithdrawalsAmount: pendingWd.reduce((a, b) => a + b.amount, 0),
      channelsCount: store.channels.length,
      giveawayParticipantsCount: usersList.filter((u) => u.joinedGiveaway).length,
    },
    channels: store.channels,
    linkedChannelsCount: store.linkedBroadcastChannels.length,
    withdrawals: store.withdrawals,
    giveaway: store.giveaway,
    recentUsers: usersList.slice(-20).reverse(),
    settings: store.settings,
    adminUsernames: ADMIN_USERNAMES,
  });
});

app.post('/api/admin/channels', (req: Request, res: Response) => {
  if (!verifyAdmin(req)) {
    res.status(403).json({ error: 'Ruxsat berilmagan!' });
    return;
  }

  const { name, username, inviteLink, required = true, rewardRobux = 200 } = req.body;
  if (!name || !username) {
    res.status(400).json({ error: 'Kanal nomi va username kiritilishi shart!' });
    return;
  }

  const newChannel: Channel = {
    id: 'ch_' + Date.now(),
    name: name.trim(),
    username: username.trim().startsWith('@') ? username.trim() : '@' + username.trim(),
    inviteLink: inviteLink || `https://t.me/${username.trim().replace('@', '')}`,
    required: Boolean(required),
    rewardRobux: parseInt(rewardRobux, 10) || 200,
  };

  store.channels.push(newChannel);
  saveStore();

  res.json({ success: true, channel: newChannel, channels: store.channels });
});

app.delete('/api/admin/channels/:id', (req: Request, res: Response) => {
  if (!verifyAdmin(req)) {
    res.status(403).json({ error: 'Ruxsat berilmagan!' });
    return;
  }

  const { id } = req.params;
  store.channels = store.channels.filter((c) => c.id !== id);
  saveStore();

  res.json({ success: true, channels: store.channels });
});

app.post('/api/admin/withdrawals/:id', (req: Request, res: Response) => {
  if (!verifyAdmin(req)) {
    res.status(403).json({ error: 'Ruxsat berilmagan!' });
    return;
  }

  const { id } = req.params;
  const { action, adminNote } = req.body;
  const wd = store.withdrawals.find((w) => w.id === id);

  if (!wd) {
    res.status(404).json({ error: 'Ariza topilmadi' });
    return;
  }

  if (action === 'approve') {
    wd.status = 'approved';
    wd.processedAt = new Date().toISOString();
    wd.adminNote = adminNote || 'Robux sizga send qilib yuborildi!';

    tgApi('sendMessage', {
      chat_id: wd.telegramId,
      text: `🎉 **Tabriklaymiz! Robuxingiz send qilib yuborildi!**\n\n` +
        `🎮 Roblox: *${wd.robloxUsername}*\n` +
        `💎 Miqdor: *${wd.amount} Robux*\n` +
        `📝 Izoh: ${wd.adminNote}\n\n` +
        `BOSI Tekin Robux xizmatidan foydalanganingiz uchun rahmat!`,
      parse_mode: 'Markdown',
    });
  } else if (action === 'reject') {
    wd.status = 'rejected';
    wd.processedAt = new Date().toISOString();
    wd.adminNote = adminNote || 'Rad etildi';

    const user = store.users[wd.telegramId];
    if (user) {
      user.balance += wd.amount;
    }

    tgApi('sendMessage', {
      chat_id: wd.telegramId,
      text: `❌ **Arizangiz rad etildi**\n\n` +
        `Roblox: *${wd.robloxUsername}*\n` +
        `Miqdor: *${wd.amount} Robux* hisobingizga qaytarildi.\n` +
        `Sabab: ${wd.adminNote}`,
      parse_mode: 'Markdown',
    });
  }

  saveStore();
  res.json({ success: true, withdrawal: wd });
});

// Admin triggers Sunday 10k Giveaway Draw
app.post('/api/admin/giveaway/draw', async (req: Request, res: Response) => {
  if (!verifyAdmin(req)) {
    res.status(403).json({ error: 'Ruxsat berilmagan!' });
    return;
  }

  const candidateUsers = Object.values(store.users).filter((u) => u.robloxUsername);
  if (candidateUsers.length === 0) {
    res.status(400).json({ error: 'Konkurs uchun Roblox akkountini bog\'lagan ishtirokchilar topilmadi' });
    return;
  }

  // Shuffle and pick 3 winners
  const shuffled = [...candidateUsers].sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, 3);
  const prize = 10000;

  const newWinners: GiveawayWinner[] = [];

  for (const winner of winners) {
    winner.balance += prize;
    winner.totalMined += prize;

    const winnerRecord: GiveawayWinner = {
      telegramId: winner.telegramId,
      robloxUsername: winner.robloxUsername || 'O\'yinchi',
      name: winner.firstName,
      wonAt: new Date().toLocaleString('uz-UZ'),
      prize: prize,
    };
    newWinners.push(winnerRecord);

    // Notify winner in Telegram
    tgApi('sendMessage', {
      chat_id: winner.telegramId,
      text: `🎉🎉🎉 **TABRIKLAYMIZ! SIZ 10,000 ROBUX YUTIB OLDINGIZ!** 🎉🎉🎉\n\n` +
        `BOSI Haftalik Yakshanba Konkursida tasodifiy g'olib bo'ldingiz!\n` +
        `💎 Yutuq: *10,000 Robux* hisobingizga qo'shildi!\n` +
        `🎮 Roblox login: *${winner.robloxUsername}*\n\n` +
        `Veb-ilovaga kirib Robuxni yechib oling!`,
      parse_mode: 'Markdown',
    });
  }

  store.giveaway.pastWinners = [...newWinners, ...store.giveaway.pastWinners].slice(0, 15);
  store.giveaway.targetDate = getNextSunday20();
  saveStore();

  // Announce to broadcast channels
  for (const chId of store.linkedBroadcastChannels) {
    try {
      await tgApi('sendMessage', {
        chat_id: chId,
        text: `🏆 **BOSI 10,000 ROBUX KONKURSI G'OLIBLARI ANIQLANDI!**\n\n` +
          `Bugungi yakshanba 20:00 konkursi tasodifiy 3 ta g'olibi:\n` +
          newWinners.map((w, idx) => `${idx + 1}. 🎮 *${w.robloxUsername}* (${w.name}) — 💎 *10,000 R$*`).join('\n') +
          `\n\nKeyingi konkurs keyingi yakshanba 20:00 da! Bot: @${BOT_USERNAME}`,
        parse_mode: 'Markdown',
      });
    } catch {
      // ignore
    }
  }

  res.json({ success: true, winners: newWinners });
});

// Broadcast Message to users and linked channels
app.post('/api/admin/broadcast', async (req: Request, res: Response) => {
  if (!verifyAdmin(req)) {
    res.status(403).json({ error: 'Ruxsat berilmagan!' });
    return;
  }

  const { message, sendToChannels = true } = req.body;
  if (!message || message.trim().length === 0) {
    res.status(400).json({ error: 'Xabar matnini kiriting!' });
    return;
  }

  const allUsers = Object.values(store.users);
  let sentUsersCount = 0;
  let sentChannelsCount = 0;

  // Send to all bot users
  for (const user of allUsers) {
    try {
      await tgApi('sendMessage', {
        chat_id: user.telegramId,
        text: `📢 **BOSI Rasmiy Xabarnomasi:**\n\n${message}`,
        parse_mode: 'Markdown',
      });
      sentUsersCount++;
      await new Promise((r) => setTimeout(r, 50));
    } catch {
      // ignore individual failure
    }
  }

  // Send to linked channels
  if (sendToChannels && store.linkedBroadcastChannels.length > 0) {
    for (const chId of store.linkedBroadcastChannels) {
      try {
        await tgApi('sendMessage', {
          chat_id: chId,
          text: `📢 **BOSI RASMIY E'LON:**\n\n${message}\n\n🤖 Bot: @${BOT_USERNAME}`,
          parse_mode: 'Markdown',
        });
        sentChannelsCount++;
      } catch {
        // ignore
      }
    }
  }

  res.json({
    success: true,
    sentUsersCount,
    sentChannelsCount,
    totalUsers: allUsers.length,
  });
});

// Download Project Archive (.zip)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/download/project', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'public', 'bosi_tekin_robux_loyihasi.zip');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'bosi_tekin_robux_loyihasi.zip');
  } else {
    res.status(404).json({ error: 'Fayl topilmadi' });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// -------------------------------------------------------------
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BOSI Tekin Robux 24/7 server running on http://0.0.0.0:${PORT} [bosiiiirobux.vercel.app]`);
    startTelegramPolling().catch((err) => {
      console.error('Failed to run Telegram polling:', err);
    });

    // 24/7 Watchdog keep-alive self ping every 4 minutes
    setInterval(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
        if (res.ok) {
          const d = (await res.json()) as { uptime: number };
          console.log(`[24/7 Watchdog] Keep-alive ping ok. Server uptime: ${d.uptime}s`);
        }
      } catch {
        // quiet catch
      }
    }, 4 * 60 * 1000);
  });
}

setupServer().catch((err) => {
  console.error('Server failed to start:', err);
});
