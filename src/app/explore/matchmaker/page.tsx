'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Calendar,
  Mountain,
  Flame,
  Award,
  DollarSign,
  Plane,
  Coffee,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  SlidersHorizontal,
  RotateCcw,
  Loader2
} from 'lucide-react';
import {
  MatchmakerPreferences,
  ExpeditionMatchResult,
  VacationDuration,
  ExpeditionSeason,
  FitnessLevel,
  ExpeditionVibe,
  ComfortPreference
} from '@/types/matchmaker';

export default function MatchmakerPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [matches, setMatches] = useState<ExpeditionMatchResult[]>([]);
  const [expandedCostSlug, setExpandedCostSlug] = useState<string | null>(null);

  // Wizard state
  const [preferences, setPreferences] = useState<MatchmakerPreferences>({
    duration: 'medium',
    season: 'autumn',
    fitness: 'intermediate',
    vibe: 'classic_iconic',
    comfort: 'authentic_teahouse'
  });

  // Fetch matches whenever preferences change or on mount
  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      try {
        const res = await fetch('/api/matchmaker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preferences)
        });
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
          if (data.matches && data.matches.length > 0 && !expandedCostSlug) {
            setExpandedCostSlug(data.matches[0].trail.slug);
          }
        }
      } catch (err) {
        console.error('Failed to calculate matches:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, [preferences]);

  const toggleCostExpanded = (slug: string) => {
    setExpandedCostSlug((prev) => (prev === slug ? null : slug));
  };

  return (
    <div data-slot="base" className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header */}
        <header data-slot="header" className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B68D40]/10 border border-[#B68D40]/30 text-[#B68D40] text-xs font-bold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Himalayan Matchmaker & True Cost Simulator</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Find Your Canonical <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-[#F5F6F7]">Himalayan Expedition</span>
          </h1>
          <p className="text-sm md:text-base text-gray-400">
            Tell us your vacation window, altitude readiness, and mountain style. We match you to canonical Himalayan routes and calculate a realistic door-to-door investment breakdown.
          </p>
        </header>

        {/* 4-Step Interactive Wizard Bar */}
        <div data-slot="body" className="p-6 md:p-8 rounded-3xl bg-neutral-900/70 backdrop-blur-xl border border-white/10 shadow-2xl space-y-8">
          {/* Step Progress Indicators */}
          <div className="grid grid-cols-4 gap-2 md:gap-4 border-b border-white/10 pb-6">
            {[
              { num: 1, label: 'Duration & Season', desc: 'Calendar window' },
              { num: 2, label: 'Fitness & Altitude', desc: 'Ascent capability' },
              { num: 3, label: 'Expedition Vibe', desc: 'Iconic vs Remote' },
              { num: 4, label: 'Comfort & Lodging', desc: 'Teahouse vs Luxury' }
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  data-slot="trigger"
                  className={`text-left p-3 rounded-2xl transition-all border ${
                    isActive
                      ? 'bg-[#B68D40]/15 border-[#B68D40] text-white shadow-lg shadow-[#B68D40]/10 ring-1 ring-[#B68D40]'
                      : isPast
                      ? 'bg-neutral-800/60 border-emerald-500/30 text-gray-300 hover:border-white/30'
                      : 'bg-neutral-900/40 border-white/5 text-gray-500 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? 'bg-[#B68D40] text-black font-extrabold'
                          : isPast
                          ? 'bg-emerald-500 text-black'
                          : 'bg-neutral-800 text-gray-400'
                      }`}
                    >
                      {isPast ? '✓' : step.num}
                    </span>
                    <span className="text-xs font-bold truncate hidden sm:inline">{step.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate hidden md:block">{step.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Wizard Step Content */}
          <div className="space-y-6">

            {/* STEP 1: Duration & Season */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#B68D40]" />
                    Step 1: Vacation Window & Travel Season
                  </h3>
                  <p className="text-xs text-gray-400">Select how much time you have and your preferred departure window.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Vacation Window</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { val: 'short', title: '≤ 8 Days', desc: 'Rapid alpine escapes & valley summits (Langtang, Poon Hill)' },
                      { val: 'medium', title: '9–14 Days', desc: 'Standard classic circuit (Everest Base Camp, Gokyo Lakes, ABC)' },
                      { val: 'long', title: '15+ Days', desc: 'Grand high-pass expeditions (Annapurna Circuit, Manaslu, Three Passes)' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setPreferences((p) => ({ ...p, duration: opt.val as VacationDuration }))}
                        className={`p-4 rounded-2xl text-left border transition-all ${
                          preferences.duration === opt.val
                            ? 'bg-[#B68D40]/20 border-[#B68D40] text-white ring-2 ring-[#B68D40]/50 shadow-md'
                            : 'bg-neutral-800/40 border-white/10 text-gray-300 hover:border-white/25'
                        }`}
                      >
                        <p className="font-extrabold text-sm text-[#E2C085]">{opt.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Preferred Season</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { val: 'spring', title: '🌸 Spring (Mar–May)', desc: 'Wild rhododendrons, warm days & active climbing season' },
                      { val: 'autumn', title: '🍂 Autumn (Sep–Nov)', desc: 'Crisp mountain air, crystalline summit views & dry paths' },
                      { val: 'winter', title: '❄️ Winter (Dec–Feb)', desc: 'Solitude, quiet trails & sub-zero starscapes' },
                      { val: 'monsoon', title: '☀️ Rain Shadow (Jun–Aug)', desc: 'Upper Mustang arid plateau & vibrant valley life' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setPreferences((p) => ({ ...p, season: opt.val as ExpeditionSeason }))}
                        className={`p-3.5 rounded-2xl text-left border transition-all ${
                          preferences.season === opt.val
                            ? 'bg-[#B68D40]/20 border-[#B68D40] text-white ring-2 ring-[#B68D40]/50 shadow-md'
                            : 'bg-neutral-800/40 border-white/10 text-gray-300 hover:border-white/25'
                        }`}
                      >
                        <p className="font-bold text-xs text-white">{opt.title}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Fitness Level */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#B68D40]" />
                    Step 2: Mountain Fitness & High-Altitude Readiness
                  </h3>
                  <p className="text-xs text-gray-400">Match your daily endurance and maximum elevation tolerance.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      val: 'casual',
                      badge: 'Casual Hiker',
                      pace: '≤12 km / day • Moderate Ascents',
                      target: 'Target ≤4,200m elevation',
                      desc: 'Enjoy comfortable daily pacing, cultural tea stops, and relaxed teahouse afternoons without technical pass crossing.'
                    },
                    {
                      val: 'intermediate',
                      badge: 'Intermediate Trekker',
                      pace: '12–18 km / day • High Pass Capable',
                      target: 'Target 5,000m–5,450m elevation',
                      desc: 'Comfortable with 6–8 hour trekking days, steady rocky moraine ascents, and high Himalayan passes (Thorong La, Cho La).'
                    },
                    {
                      val: 'extreme',
                      badge: 'Extreme Alpinist',
                      pace: '18+ km / day • Severe Alpine Terrains',
                      target: 'Target 5,400m+ near Death Zone',
                      desc: 'Thrives on rigorous high-altitude challenges, glacial traverses, freezing pre-dawn summit pushes, and sustained elevation.'
                    }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setPreferences((p) => ({ ...p, fitness: opt.val as FitnessLevel }))}
                      className={`p-5 rounded-2xl text-left border transition-all space-y-3 ${
                        preferences.fitness === opt.val
                          ? 'bg-[#B68D40]/20 border-[#B68D40] text-white ring-2 ring-[#B68D40]/50 shadow-md'
                          : 'bg-neutral-800/40 border-white/10 text-gray-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#E2C085]">{opt.badge}</span>
                        {preferences.fitness === opt.val && <CheckCircle2 className="w-4 h-4 text-[#B68D40]" />}
                      </div>
                      <div className="text-xs text-gray-200 font-medium">
                        <p>{opt.pace}</p>
                        <p className="text-amber-400 font-mono text-[11px] mt-0.5">{opt.target}</p>
                      </div>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Expedition Vibe */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#B68D40]" />
                    Step 3: Expedition Vibe & Trail Atmosphere
                  </h3>
                  <p className="text-xs text-gray-400">Choose the emotional and scenic backdrop of your journey.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      val: 'classic_iconic',
                      title: '🏔️ Classic Iconic Summits',
                      subtitle: 'Everest Panoramas & Annapurna Giants',
                      desc: 'Stand face-to-face with the crown of the world, cross iconic suspension bridges, and walk the legendary route of Mallory and Hillary.'
                    },
                    {
                      val: 'remote_wilderness',
                      title: '🏕️ Remote High-Altitude Wilderness',
                      subtitle: 'Manaslu Circuit & Hidden High Glaciers',
                      desc: 'Circumnavigate 8,000m giants with minimal foot traffic, untouched alpine forests, dramatic gorge canyons, and wild isolation.'
                    },
                    {
                      val: 'cultural_immersion',
                      title: '🛕 Sacred Culture & Valley Immersion',
                      subtitle: 'Langtang Valley & Tamang Heritage / Mustang',
                      desc: 'Experience living Tibetan Buddhist monasteries, prayer wheel valleys, Yak cheese cooperatives, and homestay hospitality.'
                    }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setPreferences((p) => ({ ...p, vibe: opt.val as ExpeditionVibe }))}
                      className={`p-5 rounded-2xl text-left border transition-all space-y-3 ${
                        preferences.vibe === opt.val
                          ? 'bg-[#B68D40]/20 border-[#B68D40] text-white ring-2 ring-[#B68D40]/50 shadow-md'
                          : 'bg-neutral-800/40 border-white/10 text-gray-300 hover:border-white/25'
                      }`}
                    >
                      <div>
                        <p className="font-extrabold text-sm text-[#E2C085]">{opt.title}</p>
                        <p className="text-xs text-gray-300 font-semibold">{opt.subtitle}</p>
                      </div>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Comfort Preference */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-[#B68D40]" />
                    Step 4: Comfort Preference & Lodging Style
                  </h3>
                  <p className="text-xs text-gray-400">Select your preferred accommodation tier for genuine door-to-door cost calculation.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      val: 'authentic_teahouse',
                      title: '🏡 Authentic Mountain Teahouse & Homestay',
                      badge: 'Traditional Trekker Style',
                      rate: '$95/day package + $25–$35/day food & shower',
                      desc: 'Warm communal wood-stove dining halls, piping hot pots of Sherpa tea, clean twin-share pine rooms, and genuine mountain family hospitality.'
                    },
                    {
                      val: 'premium_lodge',
                      title: '✨ Premium Attached-Bath Mountain Lodges',
                      badge: 'High-Altitude Luxury Tier',
                      rate: '$140/day package + $65/day premium dining',
                      desc: 'Private en-suite heated bathrooms, down duvets, electric heated mattress blankets, bakery treats, espresso bars, and 24/7 solar device charging.'
                    }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setPreferences((p) => ({ ...p, comfort: opt.val as ComfortPreference }))}
                      className={`p-5 rounded-2xl text-left border transition-all space-y-3 ${
                        preferences.comfort === opt.val
                          ? 'bg-[#B68D40]/20 border-[#B68D40] text-white ring-2 ring-[#B68D40]/50 shadow-md'
                          : 'bg-neutral-800/40 border-white/10 text-gray-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#E2C085]">{opt.title}</span>
                        {preferences.comfort === opt.val && <CheckCircle2 className="w-4 h-4 text-[#B68D40]" />}
                      </div>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/30 uppercase">
                        {opt.badge}
                      </span>
                      <p className="text-xs text-emerald-400 font-mono font-bold">{opt.rate}</p>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Wizard Navigation Buttons */}
          <div data-slot="footer" className="flex items-center justify-between pt-4 border-t border-white/10">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-[#B68D40]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#B68D40]/20 focus-visible:ring-2 focus-visible:ring-white"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Preferences Evaluated
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Match Results & True Cost Simulator */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Award className="w-6 h-6 text-[#B68D40]" />
                Top Matched Himalayan Expeditions ({matches.length})
              </h2>
              <p className="text-xs text-gray-400">
                Ranked by AI match algorithm with complete End-to-End True Cost breakdowns
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPreferences({
                  duration: 'medium',
                  season: 'autumn',
                  fitness: 'intermediate',
                  vibe: 'classic_iconic',
                  comfort: 'authentic_teahouse'
                });
                setCurrentStep(1);
              }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Preferences
            </button>
          </div>

          {/* Cards List */}
          {loading && matches.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#B68D40]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
                Evaluating Himalayan trails against your alpine criteria...
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-neutral-900/40 border border-white/5 space-y-2">
              <p className="text-sm font-semibold text-gray-300">No expeditions matched your exact criteria.</p>
              <p className="text-xs text-gray-500">Try adjusting your vacation duration or fitness level.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {matches.map((item, idx) => {
              const { trail, matchPercentage, matchReasons, costBreakdown } = item;
              const isCostExpanded = expandedCostSlug === trail.slug;

              return (
                <div
                  key={trail.id}
                  data-slot="base"
                  className={`p-6 md:p-8 rounded-3xl bg-neutral-900/60 backdrop-blur-xl border transition-all ${
                    idx === 0
                      ? 'border-[#B68D40] ring-1 ring-[#B68D40]/40 shadow-2xl shadow-[#B68D40]/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">

                    {/* Left: Trail Details & Match Metrics */}
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Match Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#B68D40] to-[#E2C085] text-black font-black text-xs shadow-md">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{matchPercentage}% Match</span>
                        </div>

                        {idx === 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase">
                            👑 Top Recommendation
                          </span>
                        )}

                        <span className="text-xs font-mono text-gray-400">
                          {trail.region} Massif • {trail.difficulty}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-white hover:text-[#B68D40] transition-colors">
                          <Link href={`/trails/${trail.slug}`}>
                            {trail.name}
                          </Link>
                        </h3>
                        <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                          {trail.description}
                        </p>
                      </div>

                      {/* Quick Specs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-black/40 p-3 rounded-2xl border border-white/5">
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block">Duration</span>
                          <span className="font-bold text-white">{trail.durationDays} Days</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block">Max Elevation</span>
                          <span className="font-bold text-amber-400">{trail.maxElevation}m</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block">Distance</span>
                          <span className="font-bold text-white">{trail.distanceKm} km</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block">Best Season</span>
                          <span className="font-bold text-[#E2C085]">{trail.bestMonths?.join(', ') || 'Spring/Autumn'}</span>
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Why this matched your profile:</span>
                        <div className="flex flex-wrap gap-2">
                          {matchReasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="text-xs px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: True Cost Summary Box */}
                    <div className="lg:w-80 flex flex-col justify-between p-5 rounded-2xl bg-neutral-950/80 border border-white/10 space-y-4 shrink-0">
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="uppercase tracking-wider font-semibold">True Cost Simulator</span>
                          <span className="text-[10px] font-mono text-[#B68D40]">Door-to-Door</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-2xl md:text-3xl font-black text-white">
                            ${costBreakdown.totalEstimatedInvestmentUsd.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 ml-1.5">USD total</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Complete realistic budget beyond base package.
                        </p>
                      </div>

                      {/* Accordion Toggle for Detailed Cost Breakdown */}
                      <button
                        type="button"
                        onClick={() => toggleCostExpanded(trail.slug)}
                        data-slot="trigger"
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 transition-colors border border-white/5"
                      >
                        <span>{isCostExpanded ? 'Hide Cost Breakdown' : 'View Itemized Breakdown'}</span>
                        {isCostExpanded ? <ChevronUp className="w-4 h-4 text-[#B68D40]" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* Direct CTAs */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <Link
                          href={`/itinerary/planner?trail=${trail.slug}`}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#B68D40]/20 focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          Customize in Planner
                        </Link>
                        <Link
                          href={`/trails/${trail.slug}`}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-gray-300 transition-colors border border-neutral-700/60"
                        >
                          Book Expedition
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                  </div>

                  {/* Expanded Itemized Cost Simulator Panel */}
                  {isCostExpanded && (
                    <div className="mt-6 pt-6 border-t border-white/10 animate-fadeIn space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#B68D40] flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" />
                          Complete 5-Pillar Door-to-Door Budget Breakdown
                        </h4>
                        <span className="text-[11px] text-gray-400">
                          Mode: <strong className="text-white capitalize">{costBreakdown.comfortMode.replace('_', ' ')}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                        {/* 1. Base Package */}
                        <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-gray-400 font-semibold">
                            <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                            <span>1. Base Package</span>
                          </div>
                          <p className="text-base font-extrabold text-white">${costBreakdown.basePackageUsd.toLocaleString()}</p>
                          <p className="text-[11px] text-gray-400">Guiding, teahouse rooms, permits clearance & mountain logistics.</p>
                        </div>

                        {/* 2. Domestic Flights & Transit */}
                        <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-gray-400 font-semibold">
                            <Plane className="w-3.5 h-3.5 text-sky-400" />
                            <span>2. Domestic Transit</span>
                          </div>
                          <p className="text-base font-extrabold text-white">${costBreakdown.domesticTransitUsd.toLocaleString()}</p>
                          <p className="text-[11px] text-gray-400">{costBreakdown.domesticTransitDetails}</p>
                        </div>

                        {/* 3. Daily Food & Hot Showers */}
                        <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-gray-400 font-semibold">
                            <Coffee className="w-3.5 h-3.5 text-amber-400" />
                            <span>3. Food & Hot Showers</span>
                          </div>
                          <p className="text-base font-extrabold text-white">${costBreakdown.dailyFoodAndShowerUsd.toLocaleString()}</p>
                          <p className="text-[11px] text-gray-400">{costBreakdown.foodAndShowerDetails}</p>
                        </div>

                        {/* 4. Permits & TIMS */}
                        <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-gray-400 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>4. Permits & TIMS</span>
                          </div>
                          <p className="text-base font-extrabold text-white">${costBreakdown.permitsAndTimsUsd.toLocaleString()}</p>
                          <p className="text-[11px] text-gray-400">{costBreakdown.permitsDetails}</p>
                        </div>

                        {/* 5. Guide/Porter Gratuity */}
                        <div className="p-3.5 rounded-xl bg-neutral-950 border border-white/5 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-gray-400 font-semibold">
                            <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                            <span>5. Tipping ({costBreakdown.tippingRatePercent}%)</span>
                          </div>
                          <p className="text-base font-extrabold text-white">${costBreakdown.tippingBudgetUsd.toLocaleString()}</p>
                          <p className="text-[11px] text-gray-400">Ethical standard tip pool for Sherpa lead guide and field porters.</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </section>

      </div>
    </div>
  );
}
