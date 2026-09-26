'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'accent' | 'interactive';
  animateOnMount?: boolean;
  delay?: number;
  className?: string;
}

export default function GlassCard({
  children,
  variant = 'default',
  animateOnMount = true,
  delay = 0,
  className = '',
  ...props
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animateOnMount || !cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 24,
        scale: 0.98,
        duration: 0.7,
        delay: delay,
        ease: 'power3.out',
      });
    }, cardRef);

    return () => ctx.revert();
  }, [animateOnMount, delay]);

  const handleMouseEnter = () => {
    if (variant === 'interactive' && cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.015,
        y: -3,
        boxShadow: '0 20px 35px -10px rgba(182, 141, 64, 0.25)',
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  };

  const handleMouseLeave = () => {
    if (variant === 'interactive' && cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.0,
        y: 0,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        duration: 0.35,
        ease: 'power2.out',
      });
    }
  };

  const baseStyles = 'relative rounded-2xl backdrop-blur-xl border transition-colors overflow-hidden';

  const variantStyles = {
    default: 'bg-black/60 border-white/10 shadow-xl shadow-black/50',
    glow: 'bg-neutral-950/70 border-[#B68D40]/30 shadow-2xl shadow-[#B68D40]/10',
    accent: 'bg-gradient-to-b from-[#B68D40]/10 to-black/80 border-[#B68D40]/40 shadow-xl',
    interactive: 'bg-neutral-900/60 border-white/10 hover:border-[#B68D40]/50 cursor-pointer shadow-lg',
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Subtle glass reflection highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
