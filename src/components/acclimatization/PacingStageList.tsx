'use client';

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  Activity,
  Bed,
  HeartPulse,
  Info,
} from 'lucide-react';
import type { DailyPacingAudit } from '@/types/acclimatization';

interface PacingStageListProps {
  stages: DailyPacingAudit[];
  selectedDay?: number | null;
  onSelectDay?: (day: number) => void;
}

export default function PacingStageList({
  stages,
  selectedDay,
  onSelectDay,
}: PacingStageListProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm bg-slate-900/50 rounded-3xl border border-white/10">
        No itinerary stages available for pacing breakdown.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const isSelected = selectedDay === stage.day;
        const isSafe = stage.rating === 'SAFE';
        const isCaution = stage.rating === 'CAUTION';
        const isDanger = stage.rating === 'DANGER';

        return (
          <div
            key={stage.day}
            onClick={() => onSelectDay?.(stage.day)}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-slate-800/95 border-[#B68D40] shadow-xl ring-1 ring-[#B68D40]/50'
                : 'bg-slate-900/70 border-white/10 hover:border-white/20 hover:bg-slate-800/60'
            }`}
          >
            {/* Stage Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  D{stage.day}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {stage.title}
                    {stage.isRestDay && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                        Acclimatization Rest
                      </span>
                    )}
                    {stage.climbHighSleepLowDelta !== undefined && stage.climbHighSleepLowDelta > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B68D40]/20 text-[#E2C085] font-semibold border border-[#B68D40]/40" title="Climb high, sleep low daytime excursion delta">
                        Peak: {stage.dayPeakElevation?.toLocaleString()}m (+{stage.climbHighSleepLowDelta}m)
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Bed className="w-3.5 h-3.5 text-[#B68D40]" />
                      {stage.elevation.toLocaleString()} m sleep alt
                    </span>
                    {stage.distanceKm !== undefined && stage.distanceKm > 0 && (
                      <span>• {stage.distanceKm} km</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider ${
                    isSafe
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : isCaution
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {isSafe ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : isCaution ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <AlertOctagon className="w-3.5 h-3.5" />
                  )}
                  <span>{stage.wmsStatus}</span>
                </span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/5 text-xs my-2.5">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Daily Net Gain
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    stage.dailyGain > 600
                      ? 'text-rose-400'
                      : stage.dailyGain > 500
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {stage.dailyGain > 0 ? `+${stage.dailyGain}` : stage.dailyGain} m
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Gain &gt; 3,000m
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    stage.sleepGainAbove3000 > 600
                      ? 'text-rose-400'
                      : stage.sleepGainAbove3000 > 500
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }`}
                >
                  {stage.sleepGainAbove3000 > 0 ? `+${stage.sleepGainAbove3000} m` : '0 m'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Est. SpO₂ Level
                </span>
                <span className="font-mono font-bold text-cyan-400 text-sm flex items-center gap-1">
                  <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
                  {stage.estimatedSpO2}%
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Lake Louise AMS Risk
                </span>
                <span
                  className={`font-bold text-xs ${
                    stage.amsRiskLevel === 'LOW'
                      ? 'text-emerald-400'
                      : stage.amsRiskLevel === 'MODERATE'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {stage.amsRiskLevel}
                </span>
              </div>
            </div>

            {/* Clinical Advisory Snippet */}
            <div className="flex items-start gap-2 pt-1 text-xs text-slate-300">
              <Info className="w-3.5 h-3.5 text-[#B68D40] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{stage.clinicalAdvisory}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
