'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  GripHorizontal,
  Minus,
  Maximize2,
  Minimize2,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface FloatingMapPanelProps {
  id?: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialMinimized?: boolean;
  initialMaximized?: boolean;
  onClose?: () => void;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  allowDrag?: boolean;
  allowMinimize?: boolean;
  allowMaximize?: boolean;
  allowClose?: boolean;
  defaultWidth?: string; // e.g. "max-w-3xl w-full"
}

export default function FloatingMapPanel({
  id = 'floating-panel',
  title,
  icon,
  children,
  badge,
  initialPosition = { x: 0, y: 0 },
  initialMinimized = false,
  initialMaximized = false,
  onClose,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  allowDrag = true,
  allowMinimize = true,
  allowMaximize = true,
  allowClose = true,
  defaultWidth = 'max-w-3xl w-full',
}: FloatingMapPanelProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [isMaximized, setIsMaximized] = useState(initialMaximized);

  const dragStartPos = useRef({ x: 0, y: 0 });
  const panelStartPos = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle Drag Start
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!allowDrag || isMaximized) return;

    // Do not drag if interacting with buttons or inputs
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a')
    ) {
      return;
    }

    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    panelStartPos.current = { ...position };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    setPosition({
      x: panelStartPos.current.x + deltaX,
      y: panelStartPos.current.y + deltaY,
    });
  };

  // Handle Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  const toggleMinimize = () => {
    if (isMaximized) setIsMaximized(false);
    setIsMinimized((prev) => !prev);
  };

  const toggleMaximize = () => {
    if (isMinimized) setIsMinimized(false);
    setIsMaximized((prev) => !prev);
  };

  return (
    <div
      ref={panelRef}
      id={id}
      data-slot="base"
      data-minimized={isMinimized}
      data-maximized={isMaximized}
      data-dragging={isDragging}
      style={
        isMaximized
          ? { transform: 'none' }
          : { transform: `translate3d(${position.x}px, ${position.y}px, 0)` }
      }
      className={`transition-shadow pointer-events-auto rounded-3xl border border-[#B68D40]/30 shadow-2xl backdrop-blur-2xl bg-slate-950/90 text-slate-100 select-none overflow-hidden ${
        isMaximized
          ? 'fixed inset-4 z-[9999] flex flex-col m-auto w-[calc(100%-2rem)] h-[calc(100%-2rem)]'
          : `${defaultWidth} ${className}`
      } ${isDragging ? 'shadow-amber-500/20 ring-2 ring-[#B68D40]/50 cursor-grabbing' : ''}`}
    >
      {/* WINDOW HEADER / DRAG BAR */}
      <div
        data-slot="header"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 ${
          allowDrag && !isMaximized ? 'cursor-grab active:cursor-grabbing' : ''
        } ${headerClassName}`}
      >
        {/* Left Title & Grip Indicator */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          {allowDrag && !isMaximized && (
            <div data-slot="drag-handle" className="text-slate-500 hover:text-amber-400 transition" title="Drag Window">
              <GripHorizontal className="h-4 w-4" />
            </div>
          )}
          {icon && <div className="text-[#B68D40] shrink-0">{icon}</div>}
          <div data-slot="title" className="font-bold text-xs sm:text-sm text-white truncate">
            {title}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {/* Right Window Action Controls (Minimize, Maximize, Close) */}
        <div data-slot="controls" className="flex items-center gap-1.5 shrink-0">
          {/* Minimize / Collapse Button */}
          {allowMinimize && (
            <button
              type="button"
              data-slot="minimize-btn"
              onClick={toggleMinimize}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              title={isMinimized ? 'Expand Window' : 'Minimize Window'}
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <ChevronUp className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Maximize / Restore Button */}
          {allowMaximize && (
            <button
              type="button"
              data-slot="maximize-btn"
              onClick={toggleMaximize}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
              title={isMaximized ? 'Restore Size' : 'Maximize Window'}
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5 text-amber-400" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Close Button */}
          {allowClose && onClose && (
            <button
              type="button"
              data-slot="close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 transition border border-rose-500/20 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ml-1"
              title="Close Panel"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* WINDOW BODY CONTENT */}
      {!isMinimized && (
        <div
          data-slot="body"
          className={`p-4 sm:p-5 select-text overflow-y-auto ${
            isMaximized ? 'flex-1 h-full max-h-none' : 'max-h-[70vh]'
          } ${bodyClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
