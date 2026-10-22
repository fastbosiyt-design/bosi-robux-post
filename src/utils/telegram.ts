/**
 * Telegram WebApp bridge & user session helper
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: TelegramUser;
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
      };
    };
  }
}

export function getTelegramWebApp() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

export function getTelegramUser(): TelegramUser {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }

  // Fallback for regular web browsers: check localStorage
  const stored = localStorage.getItem('bosi_tg_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  // Default guest profile
  const guestUser: TelegramUser = {
    id: 99000000 + Math.floor(Math.random() * 900000),
    first_name: 'Roblox Player',
    username: 'roblox_player_' + Math.floor(Math.random() * 1000),
  };
  localStorage.setItem('bosi_tg_user', JSON.stringify(guestUser));
  return guestUser;
}

export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    try {
      tg.HapticFeedback.impactOccurred(style);
    } catch {
      // Ignore
    }
  }
}

export function triggerHapticSuccess() {
  const tg = getTelegramWebApp();
  if (tg?.HapticFeedback) {
    try {
      tg.HapticFeedback.notificationOccurred('success');
    } catch {
      // Ignore
    }
  }
}
