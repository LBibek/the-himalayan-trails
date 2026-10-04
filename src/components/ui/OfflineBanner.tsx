'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WifiOff, Radio, ArrowRight, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Initial status check
    const checkStatus = () => {
      const simulated = typeof window !== 'undefined' && localStorage.getItem('himalayan_simulate_offline') === 'true';
      const actualOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      return actualOffline || simulated;
    };

    setIsOffline(checkStatus());

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
      setDismissed(false);
    };

    const handleOnline = () => {
      const simulated = typeof window !== 'undefined' && localStorage.getItem('himalayan_simulate_offline') === 'true';
      if (!simulated) {
        setIsOffline(false);
        setJustReconnected(true);
        setTimeout(() => setJustReconnected(false), 4000);
      }
    };

    const handleCustomSimulate = () => {
      setIsOffline(checkStatus());
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('storage', handleCustomSimulate);
    window.addEventListener('himalayan_offline_toggle', handleCustomSimulate);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('storage', handleCustomSimulate);
      window.removeEventListener('himalayan_offline_toggle', handleCustomSimulate);
    };
  }, []);

  if (dismissed && !justReconnected) return null;

  if (justReconnected) {
    return (
      <aside
        data-slot="base"
        role="status"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100%-2.5rem)] p-4 rounded-2xl backdrop-blur-xl bg-slate-900/90 border border-emerald-500/40 shadow-2xl text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      >
        <div data-slot="content" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-300">Network Restored</p>
            <p className="text-[11px] text-slate-300 truncate">Live weather radar and cloud sync are now active.</p>
          </div>
        </div>
      </aside>
    );
  }

  if (!isOffline) return null;

  return (
    <aside
      data-slot="base"
      role="alert"
      aria-live="assertive"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[calc(100%-2rem)] p-4 rounded-2xl backdrop-blur-xl bg-slate-950/90 border border-[#B68D40]/50 shadow-2xl text-white transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ring-1 ring-[#B68D40]/30"
    >
      <div data-slot="content" className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#B68D40]/20 border border-[#B68D40]/40 flex items-center justify-center text-[#B68D40] shrink-0 mt-0.5 sm:mt-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-[#E2C085] uppercase flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                Wilderness Mode: Offline
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                Autonomous
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Serving cached GPS route packs, offline maps & emergency high-altitude SOS guides.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/offline"
            data-slot="trigger"
            className="px-3 py-1.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs flex items-center gap-1 transition shadow-lg focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          >
            <span>Open Hub</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            data-slot="trigger"
            aria-label="Dismiss banner"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
