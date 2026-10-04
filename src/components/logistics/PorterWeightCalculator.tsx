'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Scale,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Info,
  HeartHandshake,
  Minus,
  Plus,
  RefreshCw
} from 'lucide-react';
import type { PorterCalculationResult } from '@/types';

interface PorterWeightCalculatorProps {
  initialGroupSize?: number;
  initialDurationDays?: number;
  onLogisticsChange?: (logistics: {
    porterCount: number;
    totalWeightKg: number;
    totalCostUsd: number;
    weightPerPorterKg: number;
    complianceStatus: 'OPTIMAL' | 'LEGAL_MAXIMUM' | 'OVERLOADED';
  }) => void;
  className?: string;
  showCardHeader?: boolean;
}

export default function PorterWeightCalculator({
  initialGroupSize = 2,
  initialDurationDays = 14,
  onLogisticsChange,
  className = '',
  showCardHeader = true
}: PorterWeightCalculatorProps) {
  // Configurable sliders
  const [groupSize, setGroupSize] = useState<number>(initialGroupSize);
  const [durationDays, setDurationDays] = useState<number>(initialDurationDays);
  const [personalWeightPerPerson, setPersonalWeightPerPerson] = useState<number>(12); // kg
  const [groupEquipmentWeight, setGroupEquipmentWeight] = useState<number>(10); // kg
  const [customPorters, setCustomPorters] = useState<number | null>(null);

  // Synchronize when initial props change
  useEffect(() => {
    if (initialGroupSize && initialGroupSize !== groupSize) {
      setGroupSize(initialGroupSize);
    }
  }, [initialGroupSize]);

  useEffect(() => {
    if (initialDurationDays && initialDurationDays !== durationDays) {
      setDurationDays(initialDurationDays);
    }
  }, [initialDurationDays]);

  // Total weight computation
  const totalWeightKg = useMemo(() => {
    return Math.round((groupSize * personalWeightPerPerson + groupEquipmentWeight) * 10) / 10;
  }, [groupSize, personalWeightPerPerson, groupEquipmentWeight]);

  // Recommended porters (IPPG ethical maximum 25kg)
  const recommendedPorters = useMemo(() => {
    return Math.max(1, Math.ceil(totalWeightKg / 25));
  }, [totalWeightKg]);

  // Active porter count
  const effectivePorters = customPorters !== null ? Math.max(1, customPorters) : recommendedPorters;

  // Weight per porter
  const weightPerPorter = useMemo(() => {
    return Math.round((totalWeightKg / effectivePorters) * 10) / 10;
  }, [totalWeightKg, effectivePorters]);

  // Compliance status
  const compliance = useMemo(() => {
    if (weightPerPorter <= 25) {
      return {
        status: 'OPTIMAL' as const,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border-emerald-500/30',
        badgeBg: 'bg-emerald-500',
        label: 'Optimal & Ethical (<25 kg)',
        description: 'Meets International Porter Protection Group (IPPG) gold standard for alpine safety and endurance.'
      };
    } else if (weightPerPorter <= 30) {
      return {
        status: 'LEGAL_MAXIMUM' as const,
        color: 'text-amber-400',
        bg: 'bg-amber-500/15 border-amber-500/30',
        badgeBg: 'bg-amber-500',
        label: 'Legal Maximum (25 - 30 kg)',
        description: 'Permissible under Nepal law, but heavy. Not recommended for multi-week high-altitude traverses.'
      };
    } else {
      return {
        status: 'OVERLOADED' as const,
        color: 'text-rose-400',
        bg: 'bg-rose-500/15 border-rose-500/30',
        badgeBg: 'bg-rose-500',
        label: 'Overloaded (>30 kg)',
        description: 'Exceeds IPPG legal ceiling! Poses serious injury risk. Please increase porter allocation immediately.'
      };
    }
  }, [weightPerPorter]);

  // Fair wages calculations
  const baseWages = effectivePorters * 25 * durationDays; // $25/day
  const insurance = effectivePorters * 15; // $15 mandatory insurance
  const equipment = effectivePorters * 10; // $10 equipment allowance
  const totalCostUsd = baseWages + insurance + equipment;

  // Inform parent callback
  useEffect(() => {
    if (onLogisticsChange) {
      onLogisticsChange({
        porterCount: effectivePorters,
        totalWeightKg,
        totalCostUsd,
        weightPerPorterKg: weightPerPorter,
        complianceStatus: compliance.status
      });
    }
  }, [effectivePorters, totalWeightKg, totalCostUsd, weightPerPorter, compliance.status, onLogisticsChange]);

  const handleResetToEthical = useCallback(() => {
    setCustomPorters(null);
  }, []);

  return (
    <div
      data-slot="base"
      className={`rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 p-6 sm:p-7 shadow-2xl text-white space-y-6 ${className}`}
    >
      {/* Header */}
      {showCardHeader && (
        <div data-slot="header" className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B68D40]/20 border border-[#B68D40]/40 flex items-center justify-center text-[#B68D40] shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Ethical Porter Weight &amp; Logistics Allocator
              </h3>
              <p className="text-[11px] text-slate-400">
                International Porter Protection Group (IPPG) • TAAN Fair Wage Mandate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-[#B68D40]/10 border border-[#B68D40]/30 text-[#B68D40] font-bold text-[11px] flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5" />
              100% Fair Wage Guaranteed
            </span>
          </div>
        </div>
      )}

      {/* Sliders Grid */}
      <div data-slot="body" className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
        {/* Trekkers */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex justify-between font-bold">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Adventurers / Trekkers
            </span>
            <span className="text-white text-sm">{groupSize} person{groupSize > 1 ? 's' : ''}</span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1 Solo</span>
            <span>8 Group</span>
            <span>15 Max</span>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex justify-between font-bold">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Trek Duration
            </span>
            <span className="text-white text-sm">{durationDays} days</span>
          </div>
          <input
            type="range"
            min={3}
            max={30}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>3 Days</span>
            <span>14 Days</span>
            <span>30 Days</span>
          </div>
        </div>

        {/* Personal Duffel Weight */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex justify-between font-bold">
            <span className="text-slate-400">Personal Duffel Weight / Person</span>
            <span className="text-[#B68D40] font-bold">{personalWeightPerPerson} kg</span>
          </div>
          <input
            type="range"
            min={8}
            max={20}
            step={1}
            value={personalWeightPerPerson}
            onChange={(e) => setPersonalWeightPerPerson(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>8kg (Ultralight)</span>
            <span>12kg (Standard)</span>
            <span>20kg (Heavy)</span>
          </div>
        </div>

        {/* Group Gear Weight */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex justify-between font-bold">
            <span className="text-slate-400">Group Gear (Tents, Medkit, Kitchen)</span>
            <span className="text-[#B68D40] font-bold">{groupEquipmentWeight} kg</span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            step={5}
            value={groupEquipmentWeight}
            onChange={(e) => setGroupEquipmentWeight(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0kg (Tea House)</span>
            <span>15kg (Alpine)</span>
            <span>40kg (Expedition)</span>
          </div>
        </div>
      </div>

      {/* Live IPPG Compliance Gauge */}
      <div data-slot="indicator" className={`p-4 rounded-2xl border ${compliance.bg} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {compliance.status === 'OPTIMAL' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {compliance.status === 'LEGAL_MAXIMUM' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
            {compliance.status === 'OVERLOADED' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />}
            <div>
              <span className={`text-xs font-bold ${compliance.color}`}>{compliance.label}</span>
              <p className="text-[11px] text-slate-300">{compliance.description}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Load Per Porter</span>
            <span className={`text-lg font-mono font-black ${compliance.color}`}>
              {weightPerPorter} <span className="text-xs font-normal">kg</span>
            </span>
          </div>
        </div>

        {/* Meter Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            {/* 0-25kg Optimal (Green) */}
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (Math.min(25, weightPerPorter) / 35) * 100)}%` }}
            />
            {/* 25-30kg Warning (Amber) */}
            {weightPerPorter > 25 && (
              <div
                className="bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.min(100, ((Math.min(30, weightPerPorter) - 25) / 35) * 100)}%` }}
              />
            )}
            {/* >30kg Overload (Rose) */}
            {weightPerPorter > 30 && (
              <div
                className="bg-rose-500 transition-all duration-300 flex-1 animate-pulse"
              />
            )}
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>0 kg</span>
            <span className="text-emerald-400 font-bold">25 kg (Ethical Target)</span>
            <span className="text-amber-400 font-bold">30 kg (Legal Max)</span>
            <span className="text-rose-400">Overload</span>
          </div>
        </div>

        {compliance.status === 'OVERLOADED' && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-500/30">
            <span className="text-[11px] text-rose-300 font-medium">
              ⚠️ IPPG safety limit exceeded. Porter spine and endurance compromised.
            </span>
            <button
              type="button"
              onClick={handleResetToEthical}
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Auto-Increase to Ethical Allocation ({recommendedPorters} porters)</span>
            </button>
          </div>
        )}
      </div>

      {/* Porter Allocation Stepper & Weight Summary */}
      <div data-slot="body" className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Gear Cargo</span>
          <span className="text-lg font-bold text-white">
            {totalWeightKg} <span className="text-xs text-slate-400 font-normal">kg payload</span>
          </span>
          <p className="text-[11px] text-slate-400">
            Suggested by IPPG algorithm: <strong className="text-[#B68D40]">{recommendedPorters} porter{recommendedPorters > 1 ? 's' : ''}</strong>
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 font-semibold">Active Porters:</span>
          <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
            <button
              type="button"
              disabled={effectivePorters <= 1}
              onClick={() => setCustomPorters(Math.max(1, effectivePorters - 1))}
              className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
              title="Decrease porters"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <span className="w-8 text-center font-mono font-bold text-sm text-[#B68D40]">
              {effectivePorters}
            </span>

            <button
              type="button"
              disabled={effectivePorters >= 15}
              onClick={() => setCustomPorters(effectivePorters + 1)}
              className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
              title="Increase porters"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {customPorters !== null && customPorters !== recommendedPorters && (
            <button
              type="button"
              onClick={handleResetToEthical}
              className="text-[10px] text-[#B68D40] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#B68D40] rounded"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Itemized Fair Compensation Breakdown */}
      <div data-slot="footer" className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#B68D40]" />
            Itemized Fair Porter Compensation (TAAN Rates)
          </span>
          <span className="text-[10px] font-mono text-slate-400">Nepal Tourism Board Standard</span>
        </div>

        <div className="space-y-1.5 text-slate-300">
          <div className="flex justify-between items-center">
            <span>Base Porter Wages ($25 / porter / day × {durationDays} days):</span>
            <span className="font-semibold text-white">${baseWages.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Mandatory High-Altitude Porter Insurance ($15 / porter):</span>
            <span className="font-semibold text-white">${insurance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Cold-Weather High-Pass Equipment Allowance ($10 / porter):</span>
            <span className="font-semibold text-white">${equipment.toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center font-bold text-sm">
          <span className="text-white">Total Porter Logistics:</span>
          <span className="text-[#B68D40] text-base">${totalCostUsd.toLocaleString()} USD</span>
        </div>
      </div>
    </div>
  );
}
