'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'accent' | 'interactive';
  animateOnMount?: boolean;
  delay?: number;
  className?: string;
  isHovered?: boolean;
  isPressed?: boolean;
  isFocusVisible?: boolean;
}

export function GlassCardHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="header"
      className={`flex items-center justify-between pb-3 border-b border-border/20 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassCardBody({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="body" className={`py-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function GlassCardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="footer"
      className={`flex items-center justify-between pt-3 border-t border-border/20 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default function GlassCard({
  children,
  variant = 'default',
  animateOnMount = true,
  delay = 0,
  className = '',
  isHovered: isHoveredProp,
  isPressed: isPressedProp,
  isFocusVisible: isFocusVisibleProp,
  ...props
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [internalHovered, setInternalHovered] = useState(false);
  const [internalPressed, setInternalPressed] = useState(false);
  const [internalFocusVisible, setInternalFocusVisible] = useState(false);

  const activeHovered = isHoveredProp !== undefined ? isHoveredProp : internalHovered;
  const activePressed = isPressedProp !== undefined ? isPressedProp : internalPressed;
  const activeFocusVisible = isFocusVisibleProp !== undefined ? isFocusVisibleProp : internalFocusVisible;

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

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setInternalHovered(true);
    if (variant === 'interactive' && cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.015,
        y: -3,
        boxShadow: '0 20px 35px -10px rgba(182, 141, 64, 0.25)',
        duration: 0.3,
        ease: 'power2.out',
      });
    }
    props.onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setInternalHovered(false);
    if (variant === 'interactive' && cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.0,
        y: 0,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        duration: 0.35,
        ease: 'power2.out',
      });
    }
    props.onMouseLeave?.(e);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setInternalPressed(true);
    props.onMouseDown?.(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setInternalPressed(false);
    props.onMouseUp?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (variant === 'interactive' || props.onClick) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setInternalPressed(true);
        props.onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    }
    props.onKeyDown?.(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setInternalPressed(false);
    }
    props.onKeyUp?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    try {
      if (e.target.matches(':focus-visible')) {
        setInternalFocusVisible(true);
      } else {
        setInternalFocusVisible(true);
      }
    } catch {
      setInternalFocusVisible(true);
    }
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setInternalFocusVisible(false);
    setInternalPressed(false);
    props.onBlur?.(e);
  };

  const baseStyles = 'relative rounded-2xl backdrop-blur-xl border transition-all overflow-hidden text-surface-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  const variantStyles = {
    default: 'bg-surface/70 border-border/40 shadow-xl shadow-black/50',
    glow: 'bg-surface/80 border-accent/40 shadow-2xl shadow-accent/10',
    accent: 'bg-gradient-to-b from-accent/15 to-surface/90 border-accent/40 shadow-xl',
    interactive: 'bg-surface/70 border-border/40 hover:border-accent/60 cursor-pointer shadow-lg data-[hovered=true]:border-accent/60 data-[pressed=true]:scale-[0.99]',
  };

  return (
    <div
      ref={cardRef}
      data-slot="base"
      data-variant={variant}
      data-hovered={activeHovered ? 'true' : 'false'}
      data-pressed={activePressed ? 'true' : 'false'}
      data-focus-visible={activeFocusVisible ? 'true' : 'false'}
      tabIndex={props.tabIndex ?? (variant === 'interactive' ? 0 : undefined)}
      role={props.role ?? (variant === 'interactive' && props.onClick ? 'button' : undefined)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Subtle glass reflection highlight */}
      <div
        data-slot="highlight"
        className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent pointer-events-none"
      />
      <div data-slot="content" className="relative z-10">{children}</div>
    </div>
  );
}

// Compound component attachments
GlassCard.Header = GlassCardHeader;
GlassCard.Body = GlassCardBody;
GlassCard.Footer = GlassCardFooter;
