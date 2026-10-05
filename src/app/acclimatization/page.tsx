'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mountain,
  HeartPulse,
  Activity,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Scale,
  Calendar,
  Plus,
  Trash2,
  Stethoscope,
  Info,
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Bed,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import type { Trail } from '@/types';
import type { ItineraryStageInput } from '@/types/acclimatization';
import { auditItineraryPacing } from '@/lib/acclimatization';
import {
  CANONICAL_EXPEDITION_TRAILS,
  getCanonicalTrailBySlug,
} from '@/lib/canonicalStages';
import { calculateLakeLouiseScore } from '@/lib/offline/trailStorage';
import AcclimatizationChart from '@/components/acclimatization/AcclimatizationChart';
import PacingStageList from '@/components/acclimatization/PacingStageList';
import GearAuditorCard from '@/components/acclimatization/GearAuditorCard';

function AcclimatizationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dbTrails, setDbTrails] = useState<Trail[]>([]);
  const [selectedTrailSlug, setSelectedTrailSlug] = useState<string>('everest-base-camp');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [stages, setStages] = useState<ItineraryStageInput[]>(() => {
    return CANONICAL_EXPEDITION_TRAILS[0].stages;
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Lake Louise Diagnostic State
  const [showAmsModal, setShowAmsModal] = useState(false);
  const [amsSymptoms, setAmsSymptoms] = useState({
    headache: 1,
    gastrointestinal: 0,
    fatigue: 1,
    dizziness: 0,
  });

  // Fetch live trails from SQLite database
  useEffect(() => {
    fetch('/api/trails')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Trail[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbTrails(data);
        }
      })
      .catch((err) => console.error('Failed to load database trails:', err));
  }, []);

  // Initialize from URL query parameter ?trail=...
  useEffect(() => {
    const trailParam = searchParams.get('trail');
    if (trailParam) {
      const canonical = getCanonicalTrailBySlug(trailParam);
      if (canonical) {
        setSelectedTrailSlug(canonical.slug);
        setStages(canonical.stages);
        setIsCustomMode(false);
      } else {
        // Look up by db trail slug
        const found = dbTrails.find((t) => t.slug === trailParam || t.id === trailParam);
        if (found) {
          setSelectedTrailSlug(found.slug);
          // If canonical matches found name/slug
          const match = getCanonicalTrailBySlug(found.slug) || getCanonicalTrailBySlug(found.name);
          if (match) {
            setStages(match.stages);
          }
        }
      }
    }
  }, [searchParams, dbTrails]);

  // Handle Trail Selection
  const handleSelectTrail = (slug: string) => {
    setSelectedTrailSlug(slug);
    setIsCustomMode(false);
    const canonical = getCanonicalTrailBySlug(slug);
    if (canonical) {
      setStages(canonical.stages);
    }
  };

  // Custom stage modification
  const handleAddCustomStage = () => {
    setStages((prev) => {
      const nextDay = prev.length + 1;
      const lastElevation = prev.length > 0 ? prev[prev.length - 1].elevation : 2500;
      return [
        ...prev,
        {
          day: nextDay,
          title: `Stage ${nextDay} Alpine Ascent`,
          elevation: Math.min(6000, lastElevation + 400),
          distanceKm: 10,
        },
      ];
    });
  };

  const handleUpdateStageElevation = (index: number, newElev: number) => {
    setStages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], elevation: newElev };
      return copy;
    });
  };

  const handleUpdateStageTitle = (index: number, newTitle: string) => {
    setStages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], title: newTitle };
      return copy;
    });
  };

  const handleRemoveStage = (index: number) => {
    setStages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((stage, idx) => ({ ...stage, day: idx + 1 }));
    });
  };

  const handleInsertRestDay = (index: number) => {
    setStages((prev) => {
      const target = prev[index];
      const restStage: ItineraryStageInput = {
        day: target.day + 1,
        title: `${target.title.split(' to ')[0]} Acclimatization Rest Day`,
        elevation: target.elevation,
        distanceKm: 4,
      };
      const copy = [...prev];
      copy.splice(index + 1, 0, restStage);
      return copy.map((st, i) => ({ ...st, day: i + 1 }));
    });
  };

  // Run WMS Itinerary Pacing Audit
  const report = useMemo(() => {
    return auditItineraryPacing(stages);
  }, [stages]);

  // Lake Louise AMS Score calculation
  const amsResult = useMemo(() => {
    return calculateLakeLouiseScore(amsSymptoms);
  }, [amsSymptoms]);

  return (
    <div className="min-h-screen bg-slate-950 text-foreground pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Header */}
        <div data-slot="header" className="relative p-8 sm:p-12 rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-black/90 border border-[#B68D40]/30 shadow-2xl overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#B68D40]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B68D40]/15 border border-[#B68D40]/40 text-[#E2C085] text-xs font-semibold uppercase tracking-wider">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Wilderness Medical Society (WMS) Clinical Protocols</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Alpine Pacing &amp; Altitude Acclimatization Advisor
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Ascent velocity monitoring, hypobaric hypoxia ($SpO_2$) forecasting, and dynamic gear weight auditing for expeditions across the Nepal Himalaya.
            </p>

            {/* Quick Stats Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ≤ 500m / night gain above 3,000m
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-300 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-cyan-400" />
                Live Arterial $SpO_2$ Projections
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-300 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#B68D40]" />
                IPPG Porter Load Compliance
              </span>
            </div>
          </div>
        </div>

        {/* Trail Selector & Custom Itinerary Switcher */}
        <div data-slot="base" className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68D40] block">
                Expedition Selection
              </span>
              <h2 className="text-lg font-bold text-white">
                Select Official Himalayan Route or Build Custom Pacing
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                data-slot="trigger"
                data-pressed={isCustomMode}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isCustomMode
                    ? 'bg-[#B68D40] text-black shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isCustomMode ? 'Custom Mode Active' : 'Customize Stages'}</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {CANONICAL_EXPEDITION_TRAILS.map((trail) => {
              const isSelected = selectedTrailSlug === trail.slug && !isCustomMode;
              return (
                <button
                  key={trail.slug}
                  type="button"
                  onClick={() => handleSelectTrail(trail.slug)}
                  data-slot="trigger"
                  data-pressed={isSelected}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#B68D40] text-black shadow-md font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-white/5'
                  }`}
                >
                  <Mountain className="w-3.5 h-3.5" />
                  <span>{trail.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({trail.maxElevation}m)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Mode Stage Editor Panel */}
        {isCustomMode && (
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/90 border border-[#B68D40]/40 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#E2C085]">
                  Interactive Itinerary Stage Customizer
                </h3>
                <p className="text-xs text-slate-400">
                  Add, adjust, or insert rest days to model physiological acclimatization.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomStage}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Day</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {stages.map((stage, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center gap-3 text-xs"
                >
                  <span className="font-mono font-bold text-white w-8">D{stage.day}</span>
                  <input
                    type="text"
                    value={stage.title}
                    onChange={(e) => handleUpdateStageTitle(idx, e.target.value)}
                    className="flex-1 min-w-[200px] bg-slate-800/90 border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus-visible:ring-1 focus-visible:ring-[#B68D40]"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Alt (m):</span>
                    <input
                      type="number"
                      step={50}
                      value={stage.elevation}
                      onChange={(e) => handleUpdateStageElevation(idx, Number(e.target.value))}
                      className="w-24 bg-slate-800/90 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono text-center outline-none focus-visible:ring-1 focus-visible:ring-[#B68D40]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInsertRestDay(idx)}
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 transition"
                  >
                    + Rest Day
                  </button>
                  {stages.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(idx)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executive Medical Acclimatization Summary Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* WMS Compliance Score */}
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              WMS Compliance Score
            </span>
            <div className="my-2">
              <span
                className={`text-4xl font-extrabold font-mono ${
                  report.wmsComplianceScore >= 80
                    ? 'text-emerald-400'
                    : report.wmsComplianceScore >= 60
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {report.wmsComplianceScore}%
              </span>
              <span
                className={`block text-xs font-bold uppercase tracking-wider mt-1 ${
                  report.overallSafety === 'SAFE'
                    ? 'text-emerald-300'
                    : report.overallSafety === 'CAUTION'
                    ? 'text-amber-300'
                    : 'text-rose-400'
                }`}
              >
                {report.overallSafety === 'SAFE'
                  ? 'Optimal Pacing'
                  : report.overallSafety === 'CAUTION'
                  ? 'Moderate Caution'
                  : 'High Risk Velocity'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">{report.summaryText}</p>
          </div>

          {/* Max Sleeping Altitude */}
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Apex Sleeping Elevation
            </span>
            <div className="my-2">
              <span className="text-4xl font-extrabold font-mono text-white">
                {report.maxSleepingElevation.toLocaleString()}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1">m</span>
              </span>
              <span className="block text-xs font-mono text-cyan-400 mt-1">
                Est. Minimum SpO₂: {Math.min(...report.stages.map((s) => s.estimatedSpO2))}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Atmospheric pressure drops to ~50% of sea level at 5,400m passes.
            </p>
          </div>

          {/* Rest Days vs Recommended */}
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Acclimatization Layovers
            </span>
            <div className="my-2">
              <span className="text-4xl font-extrabold font-mono text-[#E2C085]">
                {report.restDayCount}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1">days</span>
              </span>
              <span className="block text-xs text-slate-300 mt-1">
                {report.daysAbove3000m} days spent &gt; 3,000m
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              WMS recommends a dedicated rest day every 3–4 days above 3,000m.
            </p>
          </div>

          {/* Total Net Ascent & Lake Louise Trigger */}
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cumulative Vertical Gain
            </span>
            <div className="my-2">
              <span className="text-4xl font-extrabold font-mono text-white">
                +{report.totalAscentMeters.toLocaleString()}
                <span className="text-xs font-sans text-slate-400 font-normal ml-1">m</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAmsModal(true)}
                className="mt-2 text-xs font-bold text-[#B68D40] hover:text-[#E2C085] flex items-center gap-1 underline"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Test Lake Louise AMS Score</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Active physical ascent combined with hypobaric hypoxia.
            </p>
          </div>
        </div>

        {/* WMS Violations Box if any */}
        {report.wmsViolations.length > 0 && (
          <div className="p-5 rounded-3xl bg-rose-950/30 border border-rose-500/40 text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Wilderness Medical Society Pacing Discrepancies Detected</span>
            </div>
            <ul className="list-disc list-inside text-xs space-y-1 text-rose-200/90 pl-1">
              {report.wmsViolations.map((violation, i) => (
                <li key={i}>{violation}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recharts Elevation Velocity & Blood Oxygen Chart */}
        <AcclimatizationChart
          stages={report.stages}
          selectedDay={selectedDay}
          onSelectStage={(stage) => setSelectedDay(stage.day)}
        />

        {/* Clinical Recommendations Card */}
        <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-[#B68D40]/30 shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#B68D40]/20 flex items-center justify-center text-[#B68D40]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Personalized Clinical Acclimatization Guidelines
              </h3>
              <p className="text-xs text-slate-400">
                Formulated using Wilderness Medical Society altitude illness management guidelines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {report.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-3 text-xs text-slate-300"
              >
                <span className="w-5 h-5 rounded-full bg-[#B68D40]/20 text-[#B68D40] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Day-by-Day Pacing Stages List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68D40]">
                Stage Breakdown
              </span>
              <h3 className="text-lg font-bold text-white">
                Daily Ascent Velocity &amp; Advisory Telemetry
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Showing {report.stages.length} expedition stages
            </span>
          </div>

          <PacingStageList
            stages={report.stages}
            selectedDay={selectedDay}
            onSelectDay={(day) => setSelectedDay(day)}
          />
        </div>

        {/* Dynamic Gear Catalog & Pack Weight Auditor */}
        <div id="gear-auditor" className="pt-6">
          <GearAuditorCard />
        </div>

        {/* Interactive Lake Louise 2018 AMS Modal */}
        {showAmsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-[#B68D40]/40 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-400" />
                  <h3 className="text-base font-bold text-white">Lake Louise AMS Assessment</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAmsModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Self-assess your symptoms against the Lake Louise Consensus Criteria. In the presence of recent altitude gain, headache plus 3+ points indicates Acute Mountain Sickness.
              </p>

              {/* Symptom Sliders / Pickers */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Headache:</span>
                    <span className="font-bold text-white font-mono">Score: {amsSymptoms.headache}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={amsSymptoms.headache}
                    onChange={(e) =>
                      setAmsSymptoms((prev) => ({ ...prev, headache: Number(e.target.value) }))
                    }
                    className="w-full accent-[#B68D40]"
                  />
                  <span className="text-[10px] text-slate-400">0: None, 1: Mild, 2: Moderate, 3: Severe</span>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Gastrointestinal (Nausea / Appetite loss):</span>
                    <span className="font-bold text-white font-mono">Score: {amsSymptoms.gastrointestinal}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={amsSymptoms.gastrointestinal}
                    onChange={(e) =>
                      setAmsSymptoms((prev) => ({ ...prev, gastrointestinal: Number(e.target.value) }))
                    }
                    className="w-full accent-[#B68D40]"
                  />
                  <span className="text-[10px] text-slate-400">0: None, 1: Poor appetite, 2: Moderate nausea, 3: Vomiting</span>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Fatigue / Weakness:</span>
                    <span className="font-bold text-white font-mono">Score: {amsSymptoms.fatigue}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={amsSymptoms.fatigue}
                    onChange={(e) =>
                      setAmsSymptoms((prev) => ({ ...prev, fatigue: Number(e.target.value) }))
                    }
                    className="w-full accent-[#B68D40]"
                  />
                  <span className="text-[10px] text-slate-400">0: None, 1: Mild, 2: Moderate, 3: Incapacitating</span>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Dizziness / Lightheadedness:</span>
                    <span className="font-bold text-white font-mono">Score: {amsSymptoms.dizziness}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    value={amsSymptoms.dizziness}
                    onChange={(e) =>
                      setAmsSymptoms((prev) => ({ ...prev, dizziness: Number(e.target.value) }))
                    }
                    className="w-full accent-[#B68D40]"
                  />
                  <span className="text-[10px] text-slate-400">0: None, 1: Mild, 2: Moderate, 3: Severe</span>
                </div>
              </div>

              {/* Diagnosis Result Box */}
              <div
                className={`p-4 rounded-2xl border ${
                  amsResult.severity === 'None'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : amsResult.severity === 'Mild AMS'
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>Score: {amsResult.totalScore} / 12</span>
                  <span>{amsResult.severity}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{amsResult.recommendation}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAmsModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Close Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcclimatizationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-[#B68D40] text-sm font-semibold">
          Initializing Himalayan Acclimatization Advisor...
        </div>
      }
    >
      <AcclimatizationContent />
    </Suspense>
  );
}
