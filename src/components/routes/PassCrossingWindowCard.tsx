'use client';

import React, { useState } from 'react';
import type { PassCrossingAssessment, PassCrossingInterval, PassCrossingStatus } from '@/types/routes';
import {
  Mountain,
  Wind,
  Thermometer,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';

interface PassCrossingWindowCardProps {
  assessment: PassCrossingAssessment;
  isOnRoute?: boolean;
}

function getStatusBadge(status: PassCrossingStatus) {
  switch (status) {
    case 'OPTIMAL_WINDOW':
      return {
        bg: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40',
        icon: CheckCircle2,
        text: 'Optimal Window',
        symbol: '🟢'
      };
    case 'CAUTION_WINDOW':
      return {
        bg: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
        icon: AlertTriangle,
        text: 'Caution Window',
        symbol: '🟡'
      };
    case 'HIGH_RISK_CLOSED':
      return {
        bg: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
        icon: XCircle,
        text: 'High Risk / Gale Warning',
        symbol: '🔴'
      };
  }
}

export default function PassCrossingWindowCard({
  assessment,
  isOnRoute = false,
}: PassCrossingWindowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = getStatusBadge(assessment.currentStatus);
  const StatusIcon = statusInfo.icon;

  const todayMorning = assessment.intervals.find((i) => i.period === 'today_morning') || assessment.intervals[0];

  return (
    <div
      data-slot="base"
      className={`rounded-3xl p-5 backdrop-blur-xl border transition-all duration-300 ${
        isOnRoute
          ? 'bg-neutral-900/90 border-[#B68D40] shadow-2xl shadow-[#B68D40]/15 ring-1 ring-[#B68D40]/50'
          : 'bg-neutral-950/75 border-border/40 hover:border-border/70'
      }`}
    >
      {/* Header */}
      <div data-slot="header" className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <span>🏔️</span>
              <span>{assessment.passName}</span>
            </h4>
            {isOnRoute && (
              <span className="px-2 py-0.5 rounded-full bg-[#B68D40] text-black text-[10px] font-extrabold uppercase tracking-wider">
                Traversed On Route
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-[10px] font-semibold">
              {assessment.region}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            {assessment.nativeName && <span>{assessment.nativeName}</span>}
            <span>•</span>
            <span className="text-[#E2C085] font-bold">
              {assessment.elevationM.toLocaleString()} m
            </span>
          </div>
        </div>

        {/* Current Status Pill */}
        <div
          data-slot="indicator"
          className={`px-3 py-1.5 rounded-2xl border flex items-center gap-1.5 font-bold text-xs shrink-0 ${statusInfo.bg}`}
        >
          <StatusIcon className="h-4 w-4" />
          <span>{statusInfo.text}</span>
        </div>
      </div>

      {/* Morning Crossing Window Recommendation Box */}
      <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 mb-4">
        <div className="flex items-center gap-2 text-[#B68D40] text-xs font-bold mb-1">
          <Clock className="h-3.5 w-3.5" />
          <span>Recommended Alpine Window (05:00 - 09:30 AM)</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          {assessment.morningWindowRecommendation}
        </p>
      </div>

      {/* Key Telemetry Quick Specs (Today Morning) */}
      {todayMorning && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-gray-400 mb-0.5">
              <Wind className="h-3 w-3 text-cyan-400" />
              <span>Wind Speed</span>
            </div>
            <div className="text-sm font-extrabold text-white font-mono">
              {todayMorning.windSpeedKm} <span className="text-[10px] font-normal text-gray-400">km/h</span>
            </div>
            <div className="text-[9px] text-gray-400 truncate mt-0.5">
              {todayMorning.windSpeedCategory.split(' ')[0]}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-gray-400 mb-0.5">
              <Thermometer className="h-3 w-3 text-blue-400" />
              <span>Wind Chill</span>
            </div>
            <div className="text-sm font-extrabold text-blue-300 font-mono">
              {todayMorning.windChillC}°C
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">
              Air: {todayMorning.tempC}°C
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-gray-400 mb-0.5">
              <Layers className="h-3 w-3 text-purple-400" />
              <span>Freezing Alt</span>
            </div>
            <div className="text-sm font-extrabold text-purple-300 font-mono">
              {todayMorning.freezingLevelM} <span className="text-[10px] font-normal text-gray-400">m</span>
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">
              0°C Isotherm
            </div>
          </div>
        </div>
      )}

      {/* 48-Hour Forecast Periods Toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs text-gray-300 font-semibold transition cursor-pointer"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-1.5">
          <span>📅</span>
          <span>48-Hour Alpine Crossing Windows ({assessment.intervals.length} intervals)</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180 text-[#B68D40]' : ''}`}
        />
      </button>

      {/* Expanded 48-Hour Intervals */}
      {expanded && (
        <div data-slot="body" className="mt-3 space-y-2.5 pt-2 border-t border-white/10 animate-in fade-in duration-200">
          {assessment.intervals.map((interval) => {
            const intBadge = getStatusBadge(interval.status);
            return (
              <div
                key={interval.period}
                className="p-3 rounded-2xl bg-black/60 border border-white/10 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{interval.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({interval.timeRange})</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${intBadge.bg}`}>
                    {intBadge.symbol} {intBadge.text}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-300 font-mono">
                  <span>💨 Wind: <strong className="text-white">{interval.windSpeedKm} km/h</strong></span>
                  <span>❄️ Wind Chill: <strong className="text-blue-300">{interval.windChillC}°C</strong></span>
                  <span>🏔️ Freezing: <strong className="text-purple-300">{interval.freezingLevelM}m</strong></span>
                </div>

                <p className="text-[11px] text-gray-300 leading-tight">
                  {interval.recommendation}
                </p>

                <p className="text-[10px] text-[#B68D40] font-semibold">
                  ⏱️ {interval.departureAdvice}
                </p>
              </div>
            );
          })}

          {/* Mandatory Gear */}
          {assessment.gearRequired.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                Mandatory Alpine Gear for {assessment.passName}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {assessment.gearRequired.map((g, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] text-gray-300"
                  >
                    🛡️ {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
