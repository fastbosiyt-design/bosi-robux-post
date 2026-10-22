import React, { useState } from 'react';
import { X, Download, FileCode, Server, Terminal, Check, Copy, FolderArchive } from 'lucide-react';
import { sound } from '../utils/audio';

interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadUrl = '/bosi_tekin_robux_loyihasi.zip';
  const startCommand = 'npm install && npm run build && npm start';

  const handleCopy = () => {
    navigator.clipboard.writeText(startCommand);
    sound.playTap();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    sound.playSuccess();
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'bosi_tekin_robux_loyihasi.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <FolderArchive className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Loyiha Fayllari (.ZIP)</h2>
            <p className="text-xs text-slate-400">
              Sayt va Telegram Botning to'liq manba kodlari arxivi
            </p>
          </div>
        </div>

        {/* Download Action Card */}
        <div className="p-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 mb-5 text-center">
          <span className="text-xs text-emerald-300 font-semibold block mb-1">
            📦 bosi_tekin_robux_loyihasi.zip (1.8 MB)
          </span>
          <p className="text-xs text-slate-400 mb-4">
            Barcha frontend (React/Vite/Tailwind), backend (Node/Express/Telegram Bot API) va sozlamalarni o'z ichiga oladi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>To'liq Loyiha (.ZIP)</span>
            </button>
            <a
              href="/bosiiiirobux.html"
              download="bosiiiirobux.html"
              onClick={() => sound.playSuccess()}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <FileCode className="h-4 w-4 text-emerald-400" />
              <span>Yagona HTML Fayl</span>
            </a>
          </div>
        </div>

        {/* Files Included Overview */}
        <div className="space-y-3 mb-5 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <FileCode className="h-4 w-4 text-sky-400" />
              <span>Arxiv ichidagi asosiy fayllar:</span>
            </div>
            <ul className="space-y-1 text-slate-400 font-mono text-[11px]">
              <li>📁 <strong className="text-slate-200">src/</strong> — React komponentlar, o'yin, tovush effektlari</li>
              <li>📄 <strong className="text-slate-200">server.ts</strong> — Express backend va Telegram Bot polling</li>
              <li>📁 <strong className="text-slate-200">data/</strong> — Ma'lumotlar bazasi (foydalanuvchilar, kanallar)</li>
              <li>📄 <strong className="text-slate-200">package.json</strong> — Barcha kutubxonalar va scriptlar</li>
              <li>📄 <strong className="text-slate-200">README.md</strong> — O'zbek tilidagi to'liq yo'riqnoma</li>
            </ul>
          </div>

          {/* Quick Launch Instruction */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-white font-bold">
                <Terminal className="h-4 w-4 text-amber-400" />
                <span>O'z kompyuteringizda ishga tushirish:</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Nusxalandi' : 'Nusxalash'}</span>
              </button>
            </div>
            <code className="block p-2 rounded-lg bg-black text-emerald-400 font-mono text-[11px] break-all">
              {startCommand}
            </code>
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
