'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import { TrendingUp, Mountain, Sparkles, MapPin } from 'lucide-react';

export interface ElevationPoint {
  distanceKm: number;
  altitudeMeters: number;
  landmarkName?: string;
  lat: number;
  lng: number;
}

interface ElevationProfileChartProps {
  data: ElevationPoint[];
  onHoverPoint?: (point: ElevationPoint | null) => void;
  onSelectPoint?: (point: ElevationPoint) => void;
  className?: string;
  height?: number | string;
}

interface TooltipPayloadItem {
  payload: ElevationPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomElevationTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div
        data-slot="tooltip"
        className="backdrop-blur-2xl bg-neutral-950/95 border border-[#B68D40]/50 shadow-2xl rounded-2xl p-3 text-white text-xs space-y-1.5"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
          <p className="font-bold text-[#B68D40]">{item.landmarkName || `Distance: ${item.distanceKm} km`}</p>
          <span className="text-[10px] font-mono text-gray-300">KM {item.distanceKm}</span>
        </div>
        <p className="text-sm font-mono font-extrabold text-amber-300">{item.altitudeMeters.toLocaleString()} m</p>
        <p className="text-[10px] text-gray-400 font-mono">
          GPS: {item.lat.toFixed(4)}°N, {item.lng.toFixed(4)}°E
        </p>
      </div>
    );
  }
  return null;
}

export default function ElevationProfileChart({
  data,
  onHoverPoint,
  onSelectPoint,
  className = '',
  height = 220,
}: ElevationProfileChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        data-slot="chart-skeleton"
        className={`w-full h-56 rounded-2xl bg-surface/40 animate-pulse border border-border/20 ${className}`}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        data-slot="chart-empty"
        className={`w-full h-56 flex items-center justify-center rounded-2xl bg-surface/40 border border-border/20 text-muted-foreground text-xs ${className}`}
      >
        No elevation data available
      </div>
    );
  }

  const maxAlt = Math.max(...data.map((d) => d.altitudeMeters));
  const minAlt = Math.min(...data.map((d) => d.altitudeMeters));

  return (
    <div
      data-slot="base"
      className={`relative p-4 rounded-3xl backdrop-blur-2xl bg-surface/75 border border-border/40 shadow-2xl overflow-hidden text-surface-foreground ${className}`}
    >
      <div data-slot="header" className="flex items-center justify-between mb-3 border-b border-border/30 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#B68D40]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent">
            Elevation Profile
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
          <span>Min: <strong className="text-emerald-400">{minAlt.toLocaleString()}m</strong></span>
          <span>•</span>
          <span>Max: <strong className="text-amber-400">{maxAlt.toLocaleString()}m</strong></span>
        </div>
      </div>

      <div data-slot="content" style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                const point = data[state.activeTooltipIndex];
                if (point) onHoverPoint?.(point);
              }
            }}
            onMouseLeave={() => onHoverPoint?.(null)}
            onClick={(state: any) => {
              if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                const point = data[state.activeTooltipIndex];
                if (point) onSelectPoint?.(point);
              }
            }}
          >
            <defs>
              <linearGradient id="himalayanElevationGold" x1="0" y1="0" x2="0" y2="1">
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
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.12)' }}
            />
            <YAxis
              dataKey="altitudeMeters"
              unit="m"
              domain={['dataMin - 150', 'dataMax + 150']}
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomElevationTooltip />} />
            <Area
              type="monotone"
              dataKey="altitudeMeters"
              stroke="#B68D40"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#himalayanElevationGold)"
              activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
