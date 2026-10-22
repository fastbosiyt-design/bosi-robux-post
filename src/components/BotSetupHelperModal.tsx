import React, { useState } from 'react';
import { Bot, ExternalLink, ShieldCheck, X, Check, Copy } from 'lucide-react';

interface BotSetupHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  botUsername: string;
  adminUsernames: string[];
  onSelectAdminUser?: (username: string) => void;
}

export const BotSetupHelperModal: React.FC<BotSetupHelperModalProps> = ({
  isOpen,
  onClose,
  botUsername,
  adminUsernames,
  onSelectAdminUser,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyBotLink = () => {
    navigator.clipboard.writeText(`https://t.me/${botUsername}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">@{botUsername} Ma'lumotlari</h2>
            <p className="text-xs text-slate-400">Telegram Bot va Admin Sozlamalari</p>
          </div>
        </div>

        <div className="space-y-3 mb-5 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block mb-1">Telegram Bot:</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">@{botUsername}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyBotLink}
                  className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Nusxalandi' : 'Nusxa'}</span>
                </button>
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-slate-950 bg-sky-400 hover:bg-sky-300 font-bold rounded-lg flex items-center gap-1"
                >
                  <span>Ochish</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block mb-1">Maxsus Adminlar:</span>
            <div className="flex flex-wrap items-center gap-2">
              {adminUsernames.map((uname) => (
                <span
                  key={uname}
                  className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
                >
                  <ShieldCheck className="h-3 w-3" />
                  <span>@{uname}</span>
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Admin panelga faqat @bosi_admin, @vip_bosi va @fastabbosrbx kirishi mumkin.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block mb-1">Bot Buyruqlari:</span>
            <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
              <li><strong className="text-emerald-400">/start</strong> - Botni ishga tushirish & kanal tekshiruvi</li>
              <li><strong className="text-emerald-400">/balance</strong> - Robux balansi va energiyani ko'rish</li>
              <li><strong className="text-emerald-400">/referral</strong> - Do'stlarni taklif qilish havolasi</li>
              <li><strong className="text-emerald-400">/admin</strong> - Admin panelni ochish (faqat adminlar uchun)</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          Yopish
        </button>
      </div>
    </div>
  );
};
