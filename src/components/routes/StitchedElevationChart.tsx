'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import type { StitchedElevationPoint } from '@/types/routes';

interface StitchedElevationChartProps {
  data: StitchedElevationPoint[];
  maxAltitudeM?: number;
  minAltitudeM?: number;
  totalGainM?: number;
  totalLossM?: number;
  onHoverPoint?: (point: StitchedElevationPoint | null) => void;
}

function CustomElevationTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as StitchedElevationPoint;
    return (
      <div
        data-slot="chart-tooltip"
        className="backdrop-blur-xl bg-neutral-950/90 border border-[#B68D40]/40 shadow-2xl rounded-2xl p-3 text-white text-xs space-y-1 min-w-[160px]"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
          <span className="text-[10px] uppercase font-bold text-[#B68D40]">
            {item.isConnector ? 'Bridging Passage' : `Segment Point`}
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            KM {item.distanceKm}
          </span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-gray-300">Altitude</span>
          <span className="text-base font-extrabold text-[#E2C085]">
            {item.altitudeMeters.toLocaleString()} m
          </span>
        </div>
        {item.landmarkName && (
          <p className="text-[11px] font-semibold text-emerald-400">
            📍 {item.landmarkName}
          </p>
        )}
        <p className="text-[10px] text-gray-500 font-mono">
          {item.lat.toFixed(4)}°N, {item.lng.toFixed(4)}°E
        </p>
      </div>
    );
  }
  return null;
}

export default function StitchedElevationChart({
  data,
  maxAltitudeM,
  minAltitudeM,
  totalGainM,
  totalLossM,
  onHoverPoint,
}: StitchedElevationChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || data.length === 0) {
    return (
      <div
        data-slot="chart-skeleton"
        className="w-full h-56 rounded-3xl bg-neutral-950/60 animate-pulse border border-border/20 flex items-center justify-center text-gray-500 text-xs font-semibold"
      >
        Loading Stitched Alpine Elevation Topology...
      </div>
    );
  }

  const handleMouseMove = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      onHoverPoint?.(data[state.activeTooltipIndex]);
    }
  };

  const handleMouseLeave = () => {
    onHoverPoint?.(null);
  };

  const domainMin = Math.max(0, (minAltitudeM ?? 2000) - 200);
  const domainMax = (maxAltitudeM ?? 6000) + 300;

  return (
    <div
      data-slot="elevation-chart"
      className="p-5 rounded-3xl backdrop-blur-xl bg-surface/70 border border-border/40 shadow-2xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#B68D40] flex items-center gap-2">
            <span>⛰️</span>
            <span>Continuous Alpine Elevation Profile</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synchronized geodesic altitude curve across all connected trail segments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
          {totalGainM !== undefined && (
            <div className="px-2.5 py-1 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
              <span className="text-[10px] text-gray-400 block font-sans">Vertical Gain</span>
              +{totalGainM.toLocaleString()} m
            </div>
          )}
          {totalLossM !== undefined && (
            <div className="px-2.5 py-1 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-400">
              <span className="text-[10px] text-gray-400 block font-sans">Vertical Loss</span>
              -{totalLossM.toLocaleString()} m
            </div>
          )}
          {maxAltitudeM !== undefined && (
            <div className="px-2.5 py-1 rounded-xl bg-[#B68D40]/15 border border-[#B68D40]/40 text-[#E2C085]">
              <span className="text-[10px] text-gray-400 block font-sans">Apex Altitude</span>
              {maxAltitudeM.toLocaleString()} m
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-52 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="stitchedGoldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B68D40" stopOpacity={0.45} />
                <stop offset="50%" stopColor="#B68D40" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#B68D40" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="distanceKm"
              unit=" km"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              dataKey="altitudeMeters"
              unit="m"
              domain={[domainMin, domainMax]}
              stroke="#71717a"
              fontSize={11}
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
              fill="url(#stitchedGoldGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
