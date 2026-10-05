'use client';

import React, { useState, useEffect } from 'react';
import {
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import type { DailyPacingAudit } from '@/types/acclimatization';

interface AcclimatizationChartProps {
  stages: DailyPacingAudit[];
  onHoverStage?: (stage: DailyPacingAudit | null) => void;
  onSelectStage?: (stage: DailyPacingAudit) => void;
  selectedDay?: number | null;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}

function CustomAcclimatizationTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DailyPacingAudit;
    return (
      <div
        data-slot="chart-tooltip"
        className="backdrop-blur-xl bg-slate-900/95 border border-[#B68D40]/50 shadow-2xl rounded-2xl p-3.5 text-white text-xs max-w-xs space-y-2 pointer-events-none"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
          <span className="font-bold text-[#E2C085]">Day {data.day}: {data.title}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              data.rating === 'SAFE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : data.rating === 'CAUTION'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {data.wmsStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block">Sleeping Elevation:</span>
            <span className="font-bold font-mono text-white text-sm">
              {data.elevation.toLocaleString()} m
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Est. Resting SpO₂:</span>
            <span className="font-bold font-mono text-cyan-400 text-sm">
              {data.estimatedSpO2}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Daily Net Gain:</span>
            <span className={`font-mono font-semibold ${data.dailyGain > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {data.dailyGain > 0 ? `+${data.dailyGain} m` : `${data.dailyGain} m`}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">AMS Risk:</span>
            <span
              className={`font-semibold ${
                data.amsRiskLevel === 'LOW'
                  ? 'text-emerald-400'
                  : data.amsRiskLevel === 'MODERATE'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {data.amsRiskLevel}
            </span>
          </div>
        </div>

        {data.climbHighSleepLowDelta !== undefined && data.climbHighSleepLowDelta > 0 && (
          <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Day Peak (CHSL Excursion):</span>
            <span className="font-bold font-mono text-[#E2C085]">
              {data.dayPeakElevation?.toLocaleString()} m (+{data.climbHighSleepLowDelta}m)
            </span>
          </div>
        )}

        <p className="text-[10px] text-slate-300 italic pt-1 border-t border-white/10">
          {data.clinicalAdvisory}
        </p>
      </div>
    );
  }
  return null;
}

export default function AcclimatizationChart({
  stages,
  onHoverStage,
  onSelectStage,
  selectedDay,
}: AcclimatizationChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        data-slot="chart-skeleton"
        className="w-full h-64 sm:h-72 rounded-3xl bg-slate-900/60 animate-pulse border border-white/10 flex items-center justify-center text-slate-500 text-xs"
      >
        Loading WMS Elevation &amp; SpO₂ Telemetry Chart...
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div
        data-slot="chart-empty"
        className="w-full h-64 sm:h-72 rounded-3xl bg-slate-900/40 border border-white/10 flex items-center justify-center text-slate-400 text-sm"
      >
        No itinerary stages available for altitude analysis.
      </div>
    );
  }

  const chartData = stages.map((s) => ({
    ...s,
    displayLabel: `Day ${s.day}`,
  }));

  const minElevation = Math.min(...stages.map((s) => s.elevation));
  const maxElevation = Math.max(...stages.map((s) => s.elevation));
  const yDomainMin = Math.max(0, Math.floor((minElevation - 400) / 500) * 500);
  const yDomainMax = Math.ceil((maxElevation + 400) / 500) * 500;

  return (
    <div
      data-slot="base"
      className="p-5 sm:p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-[#B68D40]/30 shadow-2xl relative overflow-hidden"
    >
      {/* Header Info */}
      <div data-slot="header" className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68D40]">
            WMS Physiological Model
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Altitude Velocity &amp; Blood Oxygen (SpO₂) Forecast
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#B68D40]" />
            <span className="text-slate-300 font-medium">Sleeping Elevation (m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-medium">Est. SpO₂ (%)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div data-slot="content" className="w-full h-60 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (state && state.activeTooltipIndex !== undefined) {
                onHoverStage?.(stages[state.activeTooltipIndex]);
              }
            }}
            onMouseLeave={() => onHoverStage?.(null)}
            onClick={(state: any) => {
              if (state && state.activeTooltipIndex !== undefined) {
                onSelectStage?.(stages[state.activeTooltipIndex]);
              }
            }}
          >
            <defs>
              <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B68D40" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#B68D40" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255, 255, 255, 0.07)" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="displayLabel"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            />

            {/* Left Y Axis: Elevation */}
            <YAxis
              yAxisId="elev"
              stroke="#B68D40"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit="m"
              domain={[yDomainMin, yDomainMax]}
            />

            {/* Right Y Axis: SpO2 */}
            <YAxis
              yAxisId="spo2"
              orientation="right"
              stroke="#38bdf8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit="%"
              domain={[65, 100]}
            />

            {/* 3,000m WMS Altitude Threshold Line */}
            <ReferenceLine
              yAxisId="elev"
              y={3000}
              stroke="#e11d48"
              strokeDasharray="4 4"
              label={{
                value: '3,000m (WMS Hypoxia Threshold)',
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideBottomRight',
              }}
            />

            <Tooltip content={<CustomAcclimatizationTooltip />} />

            {/* Elevation Area */}
            <Area
              yAxisId="elev"
              type="monotone"
              dataKey="elevation"
              name="Elevation (m)"
              stroke="#B68D40"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#altitudeGradient)"
            />

            {/* SpO2 Line */}
            <Line
              yAxisId="spo2"
              type="monotone"
              dataKey="estimatedSpO2"
              name="Resting SpO₂"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#38bdf8' }}
              activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Indicators */}
      <div data-slot="footer" className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <span>Wilderness Medical Society 500m/night ceiling active above 3,000m line</span>
        <span className="font-mono text-cyan-400/90">
          Hypobaric SpO₂ Model: 98 - (Alt/1000)×3.2
        </span>
      </div>
    </div>
  );
}
