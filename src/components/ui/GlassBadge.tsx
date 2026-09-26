'use client';

import React from 'react';

interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
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
  ...props
}: GlassBadgeProps) {
  const variantStyles = {
    gold: 'bg-accent/15 text-accent border-accent/40 shadow-sm shadow-accent/20',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/20',
    blue: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-sm shadow-cyan-500/20',
    neutral: 'bg-default/40 text-foreground/80 border-border/30',
  };

  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {pulse && (
        <span data-slot="indicator" className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      <span data-slot="content">{children}</span>
    </span>
  );
}
