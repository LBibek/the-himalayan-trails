'use client';

import React, { useState, useMemo } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Users,
  Mountain,
  Save,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Info,
  DollarSign,
  HeartPulse,
  Backpack
} from 'lucide-react';
import {
  assessPorterEthicsAndSafety,
  MANIFEST_PRESETS,
  IPPG_CONSTANTS
} from '@/lib/porterEthics';
import { GearManifest, ManifestItemEntry } from '@/types/gear';

interface GearWeightBalancerProps {
  expeditionId?: string;
  bookingId?: string;
  initialTrekkerName?: string;
  initialTrekkerEmail?: string;
  initialGroupSize?: number;
  initialAltitudeM?: number;
  onManifestSaved?: (manifest: GearManifest) => void;
  className?: string;
}

export default function GearWeightBalancer({
  expeditionId,
  bookingId,
  initialTrekkerName = 'Himalayan Trekker',
  initialTrekkerEmail = '',
  initialGroupSize = 2,
  initialAltitudeM = 5364,
  onManifestSaved,
  className = ''
}: GearWeightBalancerProps) {
  // Input States
  const [trekkerName, setTrekkerName] = useState(initialTrekkerName);
  const [trekkerEmail, setTrekkerEmail] = useState(initialTrekkerEmail);
  const [bodyWeightKg, setBodyWeightKg] = useState<number>(70);
  const [groupSize, setGroupSize] = useState<number>(initialGroupSize);
  const [targetAltitudeM, setTargetAltitudeM] = useState<number>(initialAltitudeM);
  const [daypackWeightKg, setDaypackWeightKg] = useState<number>(6.0);
  const [duffelWeightKg, setDuffelWeightKg] = useState<number>(12.0);
  const [selectedItems, setSelectedItems] = useState<ManifestItemEntry[]>(
    MANIFEST_PRESETS.HIGH_PASS_16_DAY.items
  );
  const [notes, setNotes] = useState('');

  // UI / Async State
  const [saving, setSaving] = useState(false);
  const [savedManifest, setSavedManifest] = useState<GearManifest | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('HIGH_PASS_16_DAY');

  // Compute live assessment
  const assessment = useMemo(() => {
    return assessPorterEthicsAndSafety({
      daypackWeightKg,
      duffelWeightKg,
      trekkerBodyWeightKg: bodyWeightKg,
      groupSize,
      targetAltitudeMeters: targetAltitudeM
    });
  }, [daypackWeightKg, duffelWeightKg, bodyWeightKg, groupSize, targetAltitudeM]);

  // Handle Preset Selection
  const applyPreset = (presetKey: keyof typeof MANIFEST_PRESETS) => {
    const preset = MANIFEST_PRESETS[presetKey];
    setActivePreset(presetKey);
    setDaypackWeightKg(preset.daypackKg);
    setDuffelWeightKg(preset.duffelKg);
    setTargetAltitudeM(preset.targetAltitudeM);
    setSelectedItems(preset.items);
  };

  // Save to SQLite API
  const handleSaveManifest = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/logistics/gear-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expeditionId,
          bookingId,
          trekkerName,
          trekkerEmail: trekkerEmail || undefined,
          bodyWeightKg,
          targetAltitudeM,
          groupSize,
          daypackWeightKg,
          duffelWeightKg,
          items: selectedItems,
          notes: notes || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to persist gear manifest');
      }

      setSavedManifest(data.manifest);
      if (onManifestSaved) {
        onManifestSaved(data.manifest);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error saving gear manifest');
    } finally {
      setSaving(false);
    }
  };

  // Metric status badges
  const isIppgCompliant = assessment.ippgCompliance === 'COMPLIANT';
  const isIppgWarning = assessment.ippgCompliance === 'WARNING';

  const daypackRatioPercent = (assessment.daypackToBodyWeightRatio * 100).toFixed(1);

  return (
    <div
      data-slot="base"
      className={`rounded-2xl border border-border/40 backdrop-blur-xl bg-surface/75 text-surface-foreground p-6 shadow-2xl transition-all ${className}`}
    >
      {/* Header Slot */}
      <div data-slot="header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
            <Scale className="w-4 h-4 text-accent" />
            <span>Himalayan Ergonomics & IPPG Porter Ethics</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Expedition Gear Weight & Porter Load Balancer
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Simulate daypack vs. duffel weight distribution, calculate altitude-induced physical exertion, and ensure full compliance with the 5 International Porter Protection Group (IPPG) guidelines.
          </p>
        </div>

        {/* IPPG Compliance Indicator */}
        <div data-slot="indicator" className="flex items-center gap-2">
          {isIppgCompliant && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              IPPG Compliant (&le;20kg/porter)
            </span>
          )}
          {isIppgWarning && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Legal Maximum (&le;25kg/porter)
            </span>
          )}
          {assessment.ippgCompliance === 'VIOLATION' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              IPPG Violation (&gt;25kg/porter)
            </span>
          )}
        </div>
      </div>

      {/* Body Slot */}
      <div data-slot="body" className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
        {/* Left Column: Interactive Input Controls & Presets */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Curated Himalayan Expedition Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(MANIFEST_PRESETS) as Array<keyof typeof MANIFEST_PRESETS>).map((key) => {
                const preset = MANIFEST_PRESETS[key];
                const isActive = activePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={`text-left p-3 rounded-xl border transition-all text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive
                        ? 'border-accent bg-accent/15 text-white shadow-lg'
                        : 'border-border/40 bg-surface/50 text-muted-foreground hover:bg-surface/80 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-white text-xs mb-0.5">{preset.name}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">{preset.description}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-accent font-semibold">
                      <span>{preset.daypackKg}kg Day</span>
                      <span>•</span>
                      <span>{preset.duffelKg}kg Duffel</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders: Daypack vs Duffel */}
          <div className="p-4 rounded-xl border border-border/30 bg-surface/40 space-y-5">
            {/* Daypack Slider (Carried by Trekker) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Backpack className="w-4 h-4 text-accent" />
                  Daypack Weight (Carried by You)
                </span>
                <span className="text-base font-black text-accent">{daypackWeightKg.toFixed(1)} kg</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="16.0"
                step="0.2"
                value={daypackWeightKg}
                onChange={(e) => {
                  setDaypackWeightKg(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-accent h-2 bg-muted/40 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>Ultralight (3 kg)</span>
                <span>Recommended Max (&le; 6.5 kg)</span>
                <span>Heavy (&gt; 9 kg)</span>
              </div>
            </div>

            {/* Duffel Bag Slider (Carried by Porter / Pack Animal) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  Duffel Bag Weight (Carried by Porter / Yak)
                </span>
                <span className="text-base font-black text-emerald-400">{duffelWeightKg.toFixed(1)} kg</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="25.0"
                step="0.5"
                value={duffelWeightKg}
                onChange={(e) => {
                  setDuffelWeightKg(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-emerald-400 h-2 bg-muted/40 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>Minimal (8 kg)</span>
                <span>Ideal Shared (&le; 12.5 kg)</span>
                <span>Solo Porter Cap (20 kg)</span>
              </div>
            </div>
          </div>

          {/* Expedition Parameters: Group Size, Altitude, Body Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Trekker Body Weight */}
            <div className="p-3 rounded-xl border border-border/30 bg-surface/30">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Your Body Weight
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="40"
                  max="130"
                  value={bodyWeightKg}
                  onChange={(e) => setBodyWeightKg(Math.max(40, Number(e.target.value) || 70))}
                  className="w-full bg-surface/80 border border-border/40 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
            </div>

            {/* Expedition Target Altitude */}
            <div className="p-3 rounded-xl border border-border/30 bg-surface/30">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Pass / Camp Altitude
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1300"
                  max="8848"
                  step="100"
                  value={targetAltitudeM}
                  onChange={(e) => setTargetAltitudeM(Math.max(1300, Number(e.target.value) || 4500))}
                  className="w-full bg-surface/80 border border-border/40 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-muted-foreground">m</span>
              </div>
            </div>

            {/* Team Group Size */}
            <div className="p-3 rounded-xl border border-border/30 bg-surface/30">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Expedition Team Size
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={groupSize}
                  onChange={(e) => setGroupSize(Math.max(1, Math.min(16, Number(e.target.value) || 1)))}
                  className="w-full bg-surface/80 border border-border/40 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-accent"
                />
                <span className="text-xs text-muted-foreground">trekkers</span>
              </div>
            </div>
          </div>

          {/* Trekker Identity Info for Manifest Persistence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/30 bg-surface/30">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Trekker Name
              </label>
              <input
                type="text"
                value={trekkerName}
                onChange={(e) => setTrekkerName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-surface/80 border border-border/40 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={trekkerEmail}
                onChange={(e) => setTrekkerEmail(e.target.value)}
                placeholder="trekker@example.com"
                className="w-full bg-surface/80 border border-border/40 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Physics Telemetry, Porter Logistics & IPPG Ethics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Daypack Ergonomics & Altitude Multiplier */}
          <div className="p-4 rounded-xl border border-border/40 bg-surface/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-accent" />
                Physical Ergonomics
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                assessment.daypackSafetyStatus === 'SAFE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : assessment.daypackSafetyStatus === 'CAUTION'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {assessment.daypackSafetyStatus} ({daypackRatioPercent}% Body Wt)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-surface/60 border border-border/20">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Actual Pack</div>
                <div className="text-xl font-black text-white">{daypackWeightKg.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kg</span></div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface/60 border border-border/20">
                <div className="text-[10px] uppercase font-bold text-accent">Felt At {targetAltitudeM}m</div>
                <div className="text-xl font-black text-accent">{assessment.effectiveExertionKg.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kg</span></div>
                <div className="text-[10px] text-muted-foreground">+{Math.round((assessment.altitudeExertionMultiplier - 1) * 100)}% Exertion</div>
              </div>
            </div>
          </div>

          {/* Card 2: Porter Logistics & Fair Compensation */}
          <div className="p-4 rounded-xl border border-border/40 bg-surface/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Porter Load Logistics
              </span>
              <span className="text-xs font-extrabold text-emerald-400">
                {assessment.portersRequired} {assessment.portersRequired === 1 ? 'Porter' : 'Porters'} Needed
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Total Team Duffel Load</span>
                <span className="font-bold text-white">{assessment.totalDuffelKg.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Load per Porter</span>
                <span className={`font-bold ${isIppgCompliant ? 'text-emerald-400' : isIppgWarning ? 'text-amber-400' : 'text-rose-400'}`}>
                  {(assessment.totalDuffelKg / assessment.portersRequired).toFixed(1)} kg / porter
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/20">
                <span className="text-muted-foreground">Daily Fair Wage (Total)</span>
                <span className="font-bold text-white">
                  ${assessment.estimatedDailyPorterWageUsd.toFixed(2)} USD{' '}
                  <span className="text-[11px] text-muted-foreground">
                    (NPR {assessment.estimatedDailyPorterWageNpr.toLocaleString()})
                  </span>
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface/40 border border-border/30 text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-white flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-accent" />
                <span>The 5 IPPG Guidelines Guarantee:</span>
              </div>
              <p>1. Warm windproof shelter & sleeping pad.</p>
              <p>2. Equal access to expedition medical supplies.</p>
              <p>3. Comprehensive emergency helicopter evacuation insurance.</p>
            </div>
          </div>

          {/* Card 3: Actionable Advice Notes */}
          <div className="p-3.5 rounded-xl border border-border/30 bg-surface/40 text-xs space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Alpine Safety Advisory
            </div>
            {assessment.guidanceNotes.map((note, idx) => (
              <p key={idx} className="text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <span className="text-accent font-bold">•</span>
                <span>{note}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Slot: Manifest Saving & Confirmation */}
      <div data-slot="footer" className="mt-4 pt-4 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground">
          {savedManifest ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Manifest saved! ID: {savedManifest.id}
            </span>
          ) : (
            <span>Ready to lock your gear weights for guide and porter coordination.</span>
          )}
          {saveError && (
            <span className="block text-rose-400 text-xs font-semibold mt-1">
              {saveError}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSaveManifest}
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-lg disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-focus"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
              <span>Saving Manifest...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Packing Manifest</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
