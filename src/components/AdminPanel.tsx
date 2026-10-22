import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Radio,
  ArrowDownToLine,
  Send,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Users,
  Coins,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trophy,
  Gift
} from 'lucide-react';
import { MandatoryChannel, WithdrawalRequest, SystemSettings, AdminStats, SundayGiveaway } from '../types';
import { sound } from '../utils/audio';

interface AdminPanelProps {
  currentUsername: string;
  adminUsernames: string[];
  onClose?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUsername,
  adminUsernames,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'withdrawals' | 'giveaway' | 'broadcast' | 'settings'>('overview');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [channels, setChannels] = useState<MandatoryChannel[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [giveaway, setGiveaway] = useState<SundayGiveaway | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // New Channel Form
  const [channelName, setChannelName] = useState('');
  const [channelUsername, setChannelUsername] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [channelReward, setChannelReward] = useState(250);

  // Broadcast Form
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');

  // Note for withdrawal
  const [actionNote, setActionNote] = useState('');
  const [processingWdId, setProcessingWdId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAutoAdmin = adminUsernames.includes(currentUsername.toLowerCase().replace('@', ''));

  useEffect(() => {
    if (isAutoAdmin) {
      setIsAdminLoggedIn(true);
    }
  }, [isAutoAdmin]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: {
          'x-admin-user': currentUsername || 'bosi_admin',
          'x-admin-key': adminKey || 'BOSI2010',
        },
      });

      if (!res.ok) {
        throw new Error('Ruxsat berilmadi! Admin login yoki kalit xato.');
      }

      const data = await res.json();
      setStats(data.stats);
      setChannels(data.channels);
      setWithdrawals(data.withdrawals);
      setGiveaway(data.giveaway);
      setSettings(data.settings);
      setIsAdminLoggedIn(true);
      setAuthError('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAdminData();
    }
  }, [isAdminLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName || !channelUsername) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': currentUsername || 'bosi_admin',
          'x-admin-key': adminKey || 'BOSI2010',
        },
        body: JSON.stringify({
          name: channelName,
          username: channelUsername,
          inviteLink: channelLink,
          rewardRobux: channelReward,
          required: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels);
        setChannelName('');
        setChannelUsername('');
        setChannelLink('');
        sound.playSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Haqiqatan ham bu kanalni o\'chirmoqchimisiz?')) return;
    try {
      const res = await fetch(`/api/admin/channels/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-user': currentUsername || 'bosi_admin',
          'x-admin-key': adminKey || 'BOSI2010',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels);
      }
    } catch {
      // Error
    }
  };

  const handleProcessWithdrawal = async (id: string, action: 'approve' | 'reject') => {
    setProcessingWdId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': currentUsername || 'bosi_admin',
          'x-admin-key': adminKey || 'BOSI2010',
        },
        body: JSON.stringify({
          action,
          adminNote: actionNote || (action === 'approve' ? 'Robux muvaffaqiyatli send qilib yuborildi!' : 'Rad etildi'),
        }),
      });

      if (res.ok) {
        sound.playSuccess();
        setActionNote('');
        fetchAdminData();
      }
    } finally {
      setProcessingWdId(null);
    }
  };

  const handleTriggerGiveawayDraw = async () => {
    if (!confirm('Haqiqatan ham hozir 3 ta tasodifiy g\'olibga 10,000 RBX dan yubormoqchimisiz?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/giveaway/draw', {
        method: 'POST',
        headers: {
          'x-admin-user': currentUsername || 'bosi_admin',
          'x-admin-key': adminKey || 'BOSI2010',
        },
      });

      if (res.ok) {
        sound.playSuccess();
        alert('🎉 3 ta g\'olibga 10,000 Robuxdan muvaffaqiyatli jo\'natildi va xabar berildi!');
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setLoading(true);
    setBroadcastStatus('Yuborilmoqda...');
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': currentUsername || 'bosi_admin',
          'x-admin-key': adminKey || 'BOSI2010',
        },
        body: JSON.stringify({ message: broadcastText, sendToChannels: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setBroadcastStatus(`Muvaffaqiyatli! ${data.sentUsersCount} ta a'zoga va ${data.sentChannelsCount} ta kanalga yuborildi.`);
        setBroadcastText('');
        sound.playSuccess();
      } else {
        setBroadcastStatus('Xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">BOSI Admin Panel</h2>
            <p className="text-xs text-slate-400">
              Ruxsat: @bosi_admin, @vip_bosi va @fastabbosrbx uchun
            </p>
          </div>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Kalit Paroli:
            </label>
            <input
              type="password"
              placeholder="Admin kodini kiriting"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Admin Panelga Kirish</span>}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">BOSI Admin Boshqaruv Paneli</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 rounded-md border border-amber-500/30">
                VIP Boshqaruv
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Adminlar: @bosi_admin, @vip_bosi, @fastabbosrbx
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="h-3.5 w-3.5" />
          <span>Statistika</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'channels' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Majburiy Kanallar ({channels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'withdrawals' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
          <span>
            Chiqarish So'rovlari ({withdrawals.filter((w) => w.status === 'pending').length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('giveaway')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'giveaway' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>10k RBX Konkurs</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'broadcast' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Bot Xabarnoma</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'settings' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Sozlamalar</span>
        </button>
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
              <span className="text-xs text-slate-400 block mb-1">Jami Foydalanuvchilar</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-white">{stats?.totalUsers || 0}</span>
                <Users className="h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
              <span className="text-xs text-slate-400 block mb-1">Qazilgan Robux</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-emerald-400">
                  {stats?.totalRobuxMined ? stats.totalRobuxMined.toFixed(2) : '0.00'}
                </span>
                <span className="text-xs text-slate-500">ta RBX</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
              <span className="text-xs text-slate-400 block mb-1">Kutilayotgan Chiqarish</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-amber-400">
                  {stats?.pendingWithdrawalsCount || 0}
                </span>
                <span className="text-xs text-slate-500">ta so'rov</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
              <span className="text-xs text-slate-400 block mb-1">Konkurs Ishtirokchilari</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-black text-sky-400">
                  {stats?.giveawayParticipantsCount || 0}
                </span>
                <span className="text-xs text-slate-500">ta</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANNELS */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-5 rounded-2xl border border-slate-800 bg-slate-900/50 h-fit">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>Yangi Majburiy Kanal Qo'shish</span>
            </h3>

            <form onSubmit={handleAddChannel} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kanal Nomi:</label>
                <input
                  type="text"
                  required
                  placeholder="BOSI Rasmiy Kanal"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username (@bilan):</label>
                <input
                  type="text"
                  required
                  placeholder="@bosi_rasmiy"
                  value={channelUsername}
                  onChange={(e) => setChannelUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Taklif Havolasi:</label>
                <input
                  type="text"
                  placeholder="https://t.me/bosi_admin"
                  value={channelLink}
                  onChange={(e) => setChannelLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mukofot (Robux):</label>
                <input
                  type="number"
                  value={channelReward}
                  onChange={(e) => setChannelReward(parseInt(e.target.value, 10) || 200)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Kanalni Qo'shish</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white mb-2">Faol Majburiy Kanallar ({channels.length} ta)</h3>
            {channels.map((ch, idx) => (
              <div key={ch.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{ch.name}</h4>
                  <p className="text-xs text-slate-400">{ch.username} · +{ch.rewardRobux} RBX</p>
                </div>
                <button
                  onClick={() => handleDeleteChannel(ch.id)}
                  className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WITHDRAWALS */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white">Chiqarish Arizalari ({withdrawals.length} ta)</h3>
          {withdrawals.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-500">
              Arizalar mavjud emas.
            </div>
          ) : (
            withdrawals.map((wd) => (
              <div
                key={wd.id}
                className={`p-4 rounded-2xl border transition-all ${
                  wd.status === 'pending' ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">Roblox: <strong className="text-emerald-400">{wd.robloxUsername}</strong></span>
                      <button onClick={() => copyToClipboard(wd.robloxUsername, wd.id)} className="p-1 text-slate-400 hover:text-white">
                        {copiedId === wd.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">Telegram: {wd.userFullName} (@{wd.telegramUsername || 'yo\'q'})</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-black text-emerald-400">{wd.amount} ta RBX</span>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                      wd.status === 'pending' ? 'text-amber-400 bg-amber-500/10' : wd.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {wd.status === 'pending' ? 'Kutilmoqda' : wd.status === 'approved' ? 'Send qilindi (To\'landi)' : 'Rad etildi'}
                    </span>
                  </div>
                </div>

                {wd.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Admin izohi (Masalan: Group payout orqali send qilindi)"
                      onChange={(e) => setActionNote(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                    <button
                      onClick={() => handleProcessWithdrawal(wd.id, 'approve')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer"
                    >
                      Tasdiqlash (Send)
                    </button>
                    <button
                      onClick={() => handleProcessWithdrawal(wd.id, 'reject')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950 text-red-200 border border-red-800 cursor-pointer"
                    >
                      Rad etish
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 10K RBX GIVEAWAY TAB */}
      {activeTab === 'giveaway' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yakshanba 20:00 Konkursi Boshqaruvi</h3>
              <p className="text-xs text-slate-400">Har hafta 3 ta ishtirokchiga 10,000 Robuxdan sovg'a</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-5">
            <p className="text-xs text-slate-300 mb-1">
              Har yakshanba soat 20:00 da bot avtomatik tarzda 3 ta o'yinchiga 10k RBX o'tkazadi va kanallarga e'lon tarqatadi.
            </p>
            <p className="text-xs text-slate-400">
              Xohlasangiz hozir ham sinov tariqasida g'oliblarni aniqlashingiz mumkin:
            </p>
          </div>

          <button
            onClick={handleTriggerGiveawayDraw}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Gift className="h-4 w-4" />
            <span>G'oliblarni Aniqlash va 10,000 RBX dan Yuborish</span>
          </button>
        </div>
      )}

      {/* BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-bold text-white mb-2">Bot Foydalanuvchilari va Kanallarga Xabar Yuborish</h3>
          {broadcastStatus && <div className="mb-4 p-3 rounded-xl bg-slate-800 text-xs text-slate-200">{broadcastStatus}</div>}

          <form onSubmit={handleBroadcast} className="space-y-4">
            <textarea
              required
              rows={5}
              placeholder="🎉 Yangilik! Konkursimiz boshlandi..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer"
            >
              Yuborish (Barcha a'zolarga & Kanallarga)
            </button>
          </form>
        </div>
      )}

      {/* SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span>Boshlang'ich bosish kuchi:</span>
            <span className="font-mono font-bold text-emerald-400">0.1 RBX</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span>2x Kuchaytirish bazaviy narxi:</span>
            <span className="font-mono font-bold text-amber-400">100 RBX</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span>Ruxsat etilgan adminlar:</span>
            <span className="font-mono font-bold text-white">@bosi_admin, @vip_bosi, @fastabbosrbx</span>
          </div>
        </div>
      )}
    </div>
  );
};
