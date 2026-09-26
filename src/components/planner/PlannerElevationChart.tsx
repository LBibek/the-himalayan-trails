'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, ChevronDown, ChevronUp, Sparkles, MapPin, Compass, Mountain } from 'lucide-react';
import { PlannerWaypoint, ACTIVITY_CONFIG } from '@/types/planner';

export interface PlannerElevationChartProps {
  waypoints: PlannerWaypoint[];
  activeDayIndex: number | null;
  hoveredDayIndex: number | null;
  onSelectDayIndex: (index: number) => void;
  onHoverDayIndex: (index: number | null) => void;
}

interface PlannerChartPoint {
  dayIndex: number;
  day: number;
  title: string;
  distanceKm: number;
  elevation: number;
  activityType: string;
  lat: number;
  lng: number;
  notes?: string;
  altitudeGain: number;
}

export default function PlannerElevationChart({
  waypoints,
  activeDayIndex,
  hoveredDayIndex,
  onSelectDayIndex,
  onHoverDayIndex,
}: PlannerElevationChartProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!waypoints || waypoints.length === 0) return null;

  // Calculate cumulative distances for points
  let cumulativeDist = 0;
  const chartData: PlannerChartPoint[] = waypoints.map((wp, idx) => {
    if (idx > 0) cumulativeDist += wp.distanceKm;
    return {
      dayIndex: idx,
      day: wp.day,
      title: wp.title,
      distanceKm: cumulativeDist,
      elevation: wp.sleepingAltitude,
      activityType: wp.activityType,
      lat: wp.coordinates.lat,
      lng: wp.coordinates.lng,
      notes: wp.notes,
      altitudeGain: wp.altitudeGain,
    };
  });

  const maxElev = Math.max(...chartData.map((p) => p.elevation), 3000);
  const minElev = Math.min(...chartData.map((p) => p.elevation), 2000);
  const totalAscent = waypoints.reduce((acc, w) => acc + (w.altitudeGain > 0 ? w.altitudeGain : 0), 0);

  const highlightedIdx = hoveredDayIndex !== null ? hoveredDayIndex : activeDayIndex;
  const activePt = highlightedIdx !== null && chartData[highlightedIdx] ? chartData[highlightedIdx] : null;

  const handleMouseMove = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      onHoverDayIndex(state.activeTooltipIndex);
    }
  };

  const handleMouseLeave = () => {
    onHoverDayIndex(null);
  };

  const handleClick = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      onSelectDayIndex(state.activeTooltipIndex);
    }
  };

  return (
    <div
      data-slot="base"
      className="w-full rounded-3xl bg-neutral-950/90 border border-border/40 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300 text-foreground"
    >
      {/* 1. GLASSMORPHIC HEADER HUD TOOLBAR */}
      <div
        data-slot="header"
        className="px-5 py-3.5 bg-black/80 border-b border-border/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#B68D40] to-amber-600 text-black font-extrabold flex items-center justify-center shadow-lg shadow-amber-500/20">
            <TrendingUp className="h-4 w-4 text-black" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white tracking-wider flex items-center gap-2">
              <span>Interactive Recharts Altitude Profile</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/40 font-mono font-bold">
                Synced with 2D/3D Map & Timeline
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Hover along altitude curve or click waypoint markers to focus map and timeline
            </div>
          </div>
        </div>

        {/* Quick Route Elevation Badges */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-muted-foreground border-l border-border/40 pl-4">
          <span>
            Apex: <strong className="text-amber-400">{maxElev.toLocaleString()}m</strong>
          </span>
          <span>
            Min: <strong className="text-emerald-400">{minElev.toLocaleString()}m</strong>
          </span>
          <span>
            Total Climb: <strong className="text-cyan-400">+{totalAscent.toLocaleString()}m</strong>
          </span>
          <span>
            Distance: <strong className="text-[#B68D40]">{cumulativeDist} km</strong>
          </span>
        </div>

        {/* Highlighted Active Point Indicator */}
        {activePt && (
          <div
            data-slot="indicator"
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-black/90 border border-[#B68D40]/60 backdrop-blur-md shadow-xl text-xs animate-in fade-in"
          >
            <span className="text-xs font-bold text-[#B68D40]">Day {activePt.day}:</span>
            <span className="font-semibold text-white truncate max-w-[180px]">{activePt.title}</span>
            <span className="font-mono font-bold text-amber-400">{activePt.elevation.toLocaleString()}m</span>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          data-slot="trigger"
          className="p-1.5 rounded-xl bg-neutral-900 border border-border/40 text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          title={isExpanded ? 'Collapse Profile' : 'Expand Profile'}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* 2. RECHARTS EXPANDED AREA GRAPH CANVAS */}
      {isExpanded && (
        <div data-slot="body" className="p-4 space-y-3">
          <div data-slot="content" className="w-full h-48 sm:h-56">
            {!mounted ? (
              <div
                data-slot="indicator"
                className="w-full h-full rounded-2xl bg-surface/40 animate-pulse border border-border/20"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
                  margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="plannerRechartsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B68D40" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#B68D40" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(255, 255, 255, 0.07)" strokeDasharray="3 3" vertical={false} />

                  <XAxis
                    dataKey="distanceKm"
                    unit=" km"
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  />
                  <YAxis
                    dataKey="elevation"
                    unit="m"
                    domain={[minElev - 150, maxElev + 150]}
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip content={<CustomPlannerTooltip />} />

                  {/* Reference Dots for Waypoints */}
                  {chartData.map((pt) => {
                    const isSelected = activeDayIndex === pt.dayIndex;
                    const isHovered = hoveredDayIndex === pt.dayIndex;
                    const isHighlighted = isSelected || isHovered;

                    return (
                      <ReferenceDot
                        key={pt.day}
                        x={pt.distanceKm}
                        y={pt.elevation}
                        r={isHighlighted ? 8 : 5}
                        fill={isHighlighted ? '#fbbf24' : '#B68D40'}
                        stroke="#ffffff"
                        strokeWidth={isHighlighted ? 2.5 : 1.5}
                        className="cursor-pointer transition-all hover:scale-125"
                        onClick={() => onSelectDayIndex(pt.dayIndex)}
                      />
                    );
                  })}

                  <Area
                    type="monotone"
                    dataKey="elevation"
                    stroke="#B68D40"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#plannerRechartsGrad)"
                    activeDot={{ r: 7, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 3. WAYPOINT STEPPER PILLS FOOTER */}
          <div data-slot="footer" className="pt-2 border-t border-border/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-accent mr-1 flex items-center gap-1">
                <Mountain className="h-3.5 w-3.5" />
                <span>Waypoints:</span>
              </span>
              {chartData.map((pt) => {
                const isSelected = activeDayIndex === pt.dayIndex;
                const isHovered = hoveredDayIndex === pt.dayIndex;
                const cfg = ACTIVITY_CONFIG[pt.activityType as keyof typeof ACTIVITY_CONFIG] || ACTIVITY_CONFIG.trekking;

                return (
                  <button
                    key={pt.day}
                    onClick={() => onSelectDayIndex(pt.dayIndex)}
                    onMouseEnter={() => onHoverDayIndex(pt.dayIndex)}
                    onMouseLeave={() => onHoverDayIndex(null)}
                    data-slot="trigger"
                    data-selected={isSelected}
                    data-hovered={isHovered}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 border ${
                      isSelected || isHovered
                        ? `${cfg.badgeBg} text-white border-white shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-[#B68D40]`
                        : 'bg-neutral-900/90 text-gray-300 border-border/40 hover:border-[#B68D40]/50 hover:text-white'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                  >
                    <span>{cfg.iconSymbol}</span>
                    <span>D{pt.day}</span>
                    <span className="text-[10px] font-mono opacity-80">{pt.elevation}m</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Click point on chart to focus map directly to waypoint</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomPlannerTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as PlannerChartPoint;
    const cfg = ACTIVITY_CONFIG[item.activityType as keyof typeof ACTIVITY_CONFIG] || ACTIVITY_CONFIG.trekking;

    return (
      <div
        data-slot="tooltip"
        className="backdrop-blur-2xl bg-neutral-950/95 border border-[#B68D40]/60 shadow-2xl rounded-2xl p-3 text-white text-xs space-y-2 max-w-xs"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#B68D40]">Day {item.day}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.badgeBg} text-white`}>
              {cfg.label.split('/')[0]}
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-300">KM {item.distanceKm}</span>
        </div>

        <p className="font-bold text-white text-xs leading-snug">{item.title}</p>
        
        <div className="flex items-baseline justify-between">
          <p className="text-base font-mono font-extrabold text-amber-400">{item.elevation.toLocaleString()} m</p>
          <span className={item.altitudeGain >= 0 ? 'text-green-400 font-mono text-[11px]' : 'text-cyan-400 font-mono text-[11px]'}>
            {item.altitudeGain >= 0 ? `+${item.altitudeGain}m` : `${item.altitudeGain}m`}
          </span>
        </div>

        <div className="text-[10px] text-gray-400 font-mono pt-1 border-t border-white/10">
          GPS: {item.lat.toFixed(4)}°N, {item.lng.toFixed(4)}°E
        </div>
      </div>
    );
  }
  return null;
}
