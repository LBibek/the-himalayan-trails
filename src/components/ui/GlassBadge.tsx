'use client';

import React from 'react';

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'blue' | 'neutral';
  pulse?: boolean;
  className?: string;
}

export default function GlassBadge({
  children,
  variant = 'gold',
  pulse = false,
  className = '',
}: GlassBadgeProps) {
  const variantStyles = {
    gold: 'bg-[#B68D40]/15 text-[#E2C085] border-[#B68D40]/40 shadow-sm shadow-[#B68D40]/20',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/20',
    blue: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-sm shadow-cyan-500/20',
    neutral: 'bg-white/5 text-gray-300 border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md border ${variantStyles[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
