import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onOpenAndroidHub?: () => void;
}

export default function PWAInstallBanner({ onOpenAndroidHub }: PWAInstallBannerProps) {
  const { isInstallable, isInstalled, install, isAndroid } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // If already installed in standalone mode or dismissed, don't show
  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="mx-4 mb-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-fuchsia-950/80 border border-indigo-500/30 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-white transition-all animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-md">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white tracking-wide truncate">
              Install on {isAndroid ? 'Pixel / Android' : 'Your Device'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              App
            </span>
          </div>
          <p className="text-[10px] text-white/60 font-light truncate">
            Push notifications, widgets & 1-tap launcher
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isInstallable ? (
          <button
            onClick={() => install()}
            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-90 text-white font-mono text-[10px] uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3 h-3" />
            <span>Install</span>
          </button>
        ) : (
          <button
            onClick={onOpenAndroidHub}
            className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-[10px] uppercase tracking-wider border border-white/10 flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Pixel Setup</span>
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
