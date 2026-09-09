import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[90] flex items-center justify-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-md px-4 py-2 text-xs font-mono uppercase tracking-wider text-slate-950 shadow-2xl border border-amber-300 animate-in fade-in slide-in-from-bottom-2">
      <WifiOff className="w-3.5 h-3.5 animate-pulse" />
      <span>Offline Mode — Cached data active</span>
    </div>
  );
};
