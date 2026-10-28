'use client';

import React from 'react';
import { Sun, Glasses, Eye } from 'lucide-react';
import { useAlpineGlare } from '@/components/providers/AlpineGlareProvider';

interface AlpineGlareToggleProps {
  variant?: 'compact' | 'expanded' | 'map-floating';
  className?: string;
}

export default function AlpineGlareToggle({ variant = 'compact', className = '' }: AlpineGlareToggleProps) {
  const { isAlpineGlare, toggleAlpineGlare } = useAlpineGlare();

  if (variant === 'map-floating') {
    return (
      <button
        type="button"
        onClick={toggleAlpineGlare}
        title={isAlpineGlare ? 'Disable Alpine Glare Mode' : 'Enable Alpine Sun-Glare Mode (4,500m+)'}
        aria-label="Toggle Alpine High-Contrast Sun-Glare Mode"
        aria-pressed={isAlpineGlare}
        data-pressed={isAlpineGlare}
        data-alpine-glare-toggle="true"
        data-slot="trigger"
        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-black border backdrop-blur-md shadow-2xl transition-all flex items-center gap-2 pointer-events-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] ${
          isAlpineGlare
            ? 'bg-[#FACC15] text-black border-white shadow-[#FACC15]/40 ring-2 ring-[#FACC15]'
            : 'bg-black/85 text-gray-200 border-white/20 hover:border-[#FACC15]/60 hover:text-white'
        } ${className}`}
      >
        <Sun className={`w-4 h-4 ${isAlpineGlare ? 'text-black animate-spin' : 'text-[#FACC15]'}`} />
        <span className="font-mono text-[11px] uppercase tracking-wider">
          {isAlpineGlare ? 'Glare Mode ON' : 'Glare Mode'}
        </span>
      </button>
    );
  }

  if (variant === 'expanded') {
    return (
      <button
        type="button"
        onClick={toggleAlpineGlare}
        title={isAlpineGlare ? 'Disable Alpine Glare Mode' : 'Enable Alpine Sun-Glare Mode (4,500m+)'}
        aria-label="Toggle Alpine High-Contrast Sun-Glare Mode"
        aria-pressed={isAlpineGlare}
        data-pressed={isAlpineGlare}
        data-alpine-glare-toggle="true"
        data-slot="trigger"
        className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] ${
          isAlpineGlare
            ? 'bg-[#FACC15] text-black border-white ring-2 ring-[#FACC15]'
            : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:text-white'
        } ${className}`}
      >
        <Sun className={`w-4 h-4 ${isAlpineGlare ? 'text-black' : 'text-[#FACC15]'}`} />
        <div className="text-left">
          <p className="font-extrabold leading-none text-xs">
            {isAlpineGlare ? 'Alpine Glare Active' : 'Alpine Sun-Glare Mode'}
          </p>
          <p className="text-[10px] opacity-80 leading-none mt-1">High-contrast above 4,500m</p>
        </div>
      </button>
    );
  }

  // Compact variant (default for Navbar)
  return (
    <button
      type="button"
      onClick={toggleAlpineGlare}
      title={isAlpineGlare ? 'Disable Alpine Glare Mode' : 'Enable Alpine Sun-Glare Mode (4,500m+)'}
      aria-label="Toggle Alpine High-Contrast Sun-Glare Mode"
      aria-pressed={isAlpineGlare}
      data-pressed={isAlpineGlare}
      data-alpine-glare-toggle="true"
      data-slot="trigger"
      className={`min-w-[40px] min-h-[40px] p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] ${
        isAlpineGlare
          ? 'bg-[#FACC15] text-black border-white shadow-lg shadow-[#FACC15]/20 ring-2 ring-[#FACC15]'
          : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:text-[#FACC15]'
      } ${className}`}
    >
      <Sun className={`w-4 h-4 ${isAlpineGlare ? 'text-black' : 'text-[#FACC15]'}`} />
    </button>
  );
}
