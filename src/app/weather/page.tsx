'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  CloudSun,
  ShieldAlert,
  Wind,
  Thermometer,
  Loader2,
  AlertCircle,
  Compass,
  Mountain,
  Eye,
  Layers,
  MapPin,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Snowflake,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { WeatherReport, WeatherTelemetryResponse, HighPassHazardTelemetry } from '@/types';
import {
  calculateFreezingLevel,
  calculateWindChill,
  getHighPassesHazardTelemetry,
  getWeatherRadarTileConfig,
} from '@/lib/weatherPhysics';

// Dynamically import LeafletMap without SSR for live radar visualization
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-neutral-900/60 backdrop-blur-xl animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-3xl border border-border/40">
      Loading High-Altitude Weather Radar Map...
    </div>
  ),
});

export default function WeatherPage() {
  const [selectedElevation, setSelectedElevation] = useState<number>(4940);
  const [selectedWindSpeed, setSelectedWindSpeed] = useState<number>(35);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [activePassId, setActivePassId] = useState<string>('thorong-la');
  const [weatherData, setWeatherData] = useState<WeatherTelemetryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [radarOverlay, setRadarOverlay] = useState<'none' | 'radar' | 'clouds'>('radar');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const query = selectedRegion !== 'All' ? `?region=${encodeURIComponent(selectedRegion)}` : '';
    fetch(`/api/weather${query}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load weather`);
        return res.json();
      })
      .then((data: WeatherTelemetryResponse) => {
        if (isMounted) {
          setWeatherData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error communicating with database');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRegion]);

  // Dynamic physics calculation for slider values
  const simulatedTempC = useMemo(() => {
    // Sea level / valley baseline approx 18°C minus lapse rate
    const lapse = (selectedElevation / 1000) * 6.5;
    return Math.round((18 - lapse) * 10) / 10;
  }, [selectedElevation]);

  const simulatedWindChillC = useMemo(() => {
    return calculateWindChill(simulatedTempC, selectedWindSpeed);
  }, [simulatedTempC, selectedWindSpeed]);

  const simulatedFreezingLevel = useMemo(() => {
    return calculateFreezingLevel(selectedElevation, simulatedTempC);
  }, [selectedElevation, simulatedTempC]);

  const frostbiteRisk = useMemo(() => {
    if (simulatedWindChillC > 0) return { label: 'Low Risk', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (simulatedWindChillC > -10) return { label: 'Moderate Chilling', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    if (simulatedWindChillC > -25) return { label: 'Severe Risk (Frostbite in 30m)', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
    return { label: 'Extreme Danger (Frostbite in <10m)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse' };
  }, [simulatedWindChillC]);

  // High passes fallback or retrieved from API
  const highPasses: HighPassHazardTelemetry[] = useMemo(() => {
    if (weatherData?.highPasses && weatherData.highPasses.length > 0) {
      return weatherData.highPasses;
    }
    return getHighPassesHazardTelemetry();
  }, [weatherData]);

  const activePass = highPasses.find((p) => p.id === activePassId) || highPasses[0];

  return (
    <div
      data-slot="base"
      className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10"
    >
      {/* ── 1. HEADER SECTION ── */}
      <div
        data-slot="header"
        className="space-y-4 border-b border-border/40 pb-8 backdrop-blur-xl bg-surface/70 p-6 sm:p-8 rounded-3xl border shadow-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-mono text-xs font-bold uppercase tracking-wider">
            <Radio className="h-3.5 w-3.5 animate-pulse text-[#B68D40]" />
            <span>Phase 6.2 • Alpine Weather Telemetry & Hazard Hub</span>
          </div>

          {/* Region Filter Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-border/40 text-xs">
            {['All', 'Everest', 'Annapurna', 'Manaslu', 'Langtang'].map((region) => (
              <button
                key={region}
                type="button"
                data-slot="trigger"
                data-pressed={selectedRegion === region}
                onClick={() => setSelectedRegion(region)}
                className={`px-3 py-1 rounded-lg font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                  selectedRegion === region
                    ? 'bg-[#B68D40] text-black shadow font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            High-Altitude Alpine Hazards & Weather Radar
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-3xl leading-relaxed">
            Real-time Doppler radar scans, thermodynamic lapse rate calculations, wind chill indexes, and authentic high-pass hazard warnings for iconic Himalayan crossings.
          </p>
        </div>
      </div>

      {/* ── 2. LIVE RADAR MAP & ATMOSPHERIC OVERLAY SECTION ── */}
      <div
        data-slot="card"
        className="backdrop-blur-xl bg-surface/70 border border-border/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#B68D40]" />
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Live Himalayan Weather Radar & High-Pass Overlay
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Interactive precipitation radar tiles updated every 10 minutes from international meteorological feeds.
            </p>
          </div>

          {/* Radar Overlay Toggle Control */}
          <div data-slot="control" className="flex items-center p-1 rounded-2xl bg-black/80 border border-border/40 text-xs">
            <span className="px-2.5 text-[11px] font-mono font-bold text-gray-400 uppercase">Mode:</span>
            <button
              type="button"
              data-slot="trigger"
              data-pressed={radarOverlay === 'none'}
              onClick={() => setRadarOverlay('none')}
              className={`px-3 py-1.5 rounded-xl font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                radarOverlay === 'none'
                  ? 'bg-[#B68D40] text-black shadow font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              None
            </button>
            <button
              type="button"
              data-slot="trigger"
              data-pressed={radarOverlay === 'radar'}
              onClick={() => setRadarOverlay('radar')}
              className={`px-3 py-1.5 rounded-xl font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                radarOverlay === 'radar'
                  ? 'bg-[#B68D40] text-black shadow font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Rain Radar
            </button>
            <button
              type="button"
              data-slot="trigger"
              data-pressed={radarOverlay === 'clouds'}
              onClick={() => setRadarOverlay('clouds')}
              className={`px-3 py-1.5 rounded-xl font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                radarOverlay === 'clouds'
                  ? 'bg-[#B68D40] text-black shadow font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Wind & Clouds
            </button>
          </div>
        </div>

        {/* Embedded Map Canvas with Weather Radar */}
        <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-inner h-[420px] sm:h-[480px]">
          <LeafletMap
            selectedRegion={selectedRegion}
            weatherOverlay={radarOverlay}
            onWeatherOverlayChange={setRadarOverlay}
            radarTileUrl={weatherData?.radar?.radarTileUrl}
            cloudsTileUrl={weatherData?.radar?.cloudsTileUrl}
            height="h-full"
            hideHeaderControls={false}
          />
        </div>

        {/* Radar Map Legend & Attribution */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">Radar Intensity:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Light Rain/Snow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-600"></span>
              <span>Heavy Alpine Blizzard</span>
            </div>
          </div>
          <span className="font-mono text-gray-500">
            Source: RainViewer Global Doppler Radar & World Meteorological Organization
          </span>
        </div>
      </div>

      {/* ── 3. ICONIC HIGH-PASS ALPINE HAZARDS SECTION ── */}
      <div
        data-slot="card"
        className="backdrop-blur-xl bg-surface/70 border border-border/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mountain className="h-5 w-5 text-[#B68D40]" />
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Iconic Himalayan High-Pass Safety & Hazard Advisories
              </h2>
            </div>
            <p className="text-xs text-gray-400">
              Live alpine telemetry for the 4 critical Himalayan pass crossings: Thorong La (5,416m), Cho La (5,420m), Larkya La (5,106m), and Kongma La (5,535m).
            </p>
          </div>

          <Link
            href="/explore?engine=3d"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-[#B68D40]/40 text-[#B68D40] hover:text-white hover:bg-neutral-800 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          >
            <span>Fly in 3D Cesium</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 4 High Passes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {highPasses.map((pass) => {
            const isSelected = activePass.id === pass.id;
            return (
              <div
                key={pass.id}
                onClick={() => setActivePassId(pass.id)}
                data-slot="card"
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-neutral-900/90 border-[#B68D40] shadow-xl shadow-[#B68D40]/10 ring-2 ring-[#B68D40]/40'
                    : 'bg-black/60 border-border/30 hover:border-[#B68D40]/50 hover:bg-neutral-900/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-accent/20 text-[#B68D40] font-bold border border-accent/30">
                      {pass.region}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-gray-400">
                      {pass.coordinates.lat.toFixed(2)}°N, {pass.coordinates.lng.toFixed(2)}°E
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white">{pass.name}</h3>
                    {pass.nativeName && (
                      <p className="text-xs text-gray-400 font-medium">{pass.nativeName}</p>
                    )}
                  </div>

                  <div className="text-2xl font-black text-[#B68D40] font-mono">
                    {pass.elevation}m
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/30 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-neutral-950/70 border border-border/30">
                      <span className="text-gray-400 block text-[9px] uppercase">Ambient</span>
                      <span className="font-mono font-bold text-cyan-400">{pass.tempC}°C</span>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-950/70 border border-border/30">
                      <span className="text-gray-400 block text-[9px] uppercase">Wind Chill</span>
                      <span className="font-mono font-bold text-rose-400">{pass.windChillC}°C</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-400">Avalanche Risk:</span>
                    <span
                      className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                        pass.avalancheRiskLevel >= 3
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {pass.avalancheRisk}
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-400 pt-1">
                    <span className="text-gray-300 font-semibold">Crossing Window: </span>
                    <span className="text-amber-400">{pass.traversalWindow}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Pass Deep Telemetry & Technical Gear Advisory */}
        {activePass && (
          <div
            data-slot="body"
            className="p-6 rounded-2xl bg-neutral-950/90 border border-[#B68D40]/30 space-y-5 animate-in fade-in duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white">
                    Official High-Pass Telemetry & Route Advisory: {activePass.name} ({activePass.elevation}m)
                  </h3>
                </div>
                <p className="text-xs text-gray-400">
                  Calculated based on Himalayan standard atmospheric lapse rate (-6.5°C/km) and summit ridge shear.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-slot="trigger"
                  onClick={() => {
                    setSelectedElevation(activePass.elevation);
                    setSelectedWindSpeed(activePass.windKm);
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-[#B68D40]/20 hover:bg-[#B68D40]/30 text-[#B68D40] border border-[#B68D40]/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                >
                  Simulate {activePass.name} ({activePass.elevation}m)
                </button>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                    activePass.status === 'EQUIPMENT_MANDATORY'
                      ? 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                      : 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {activePass.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-neutral-900 border border-border/30">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Estimated Freezing Level</span>
                <span className="text-xl font-black text-blue-400 font-mono mt-1 block">
                  {activePass.freezingLevelAltitudeMeters}m
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5 block">Permanent ice above level</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-border/30">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Ridge Wind Speed</span>
                <span className="text-xl font-black text-white font-mono mt-1 block">
                  {activePass.windKm} km/h
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5 block">High alpine gusting</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-border/30">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Apparent Wind Chill</span>
                <span className="text-xl font-black text-rose-400 font-mono mt-1 block">
                  {activePass.windChillC}°C
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5 block">JAG/TI standard formula</span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-border/30">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Safe Traversal Window</span>
                <span className="text-sm font-black text-amber-400 font-mono mt-2 block">
                  {activePass.traversalWindow.split(' ')[0]}
                </span>
                <span className="text-[10px] text-gray-500 mt-0.5 block">Depart before thermal winds</span>
              </div>
            </div>

            {/* Safety Warning */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Terrain Hazard Alert:
              </span>
              <p className="text-xs text-gray-200 leading-relaxed">
                {activePass.safetyWarning}
              </p>
            </div>

            {/* Technical Gear Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Mandatory Equipment for {activePass.name} Crossing:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {activePass.recommendedGear.map((gear, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-black/50 border border-border/30 flex items-center gap-2 text-xs text-gray-300"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{gear}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. INTERACTIVE THERMODYNAMIC ALTITUDE CALCULATOR ── */}
      <div
        data-slot="card"
        className="backdrop-blur-xl bg-surface/70 border border-border/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Thermodynamic Alpine Weather Calculator
            </h2>
            <p className="text-xs text-gray-400">
              Simulate temperature plunge, wind chill indices, and freezing boundaries across custom altitudes.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">Simulation Altitude:</span>
            <div className="text-2xl font-black text-[#B68D40] font-mono">{selectedElevation}m</div>
          </div>
        </div>

        {/* Sliders Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-bold">Altitude Slider</span>
              <span className="font-mono text-cyan-400 font-bold">{selectedElevation} meters</span>
            </div>
            <input
              type="range"
              min="1500"
              max="6000"
              step="50"
              value={selectedElevation}
              onChange={(e) => setSelectedElevation(Number(e.target.value))}
              className="w-full accent-[#B68D40] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>Lukla (2,860m)</span>
              <span>Namche (3,440m)</span>
              <span>Thorong La (5,416m)</span>
              <span>Kongma La (5,535m)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-300 font-bold">Wind Speed Slider</span>
              <span className="font-mono text-cyan-400 font-bold">{selectedWindSpeed} km/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={selectedWindSpeed}
              onChange={(e) => setSelectedWindSpeed(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>Calm (0 km/h)</span>
              <span>Breeze (25 km/h)</span>
              <span>Gale (60 km/h)</span>
              <span>Jetstream (100 km/h)</span>
            </div>
          </div>
        </div>

        {/* Calculated Physics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-border/40 space-y-1">
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <Thermometer className="h-4 w-4 text-cyan-400" />
              <span>Calculated Temperature</span>
            </div>
            <div className="text-3xl font-black text-cyan-400 font-mono pt-1">
              {simulatedTempC}°C
            </div>
            <div className="text-[11px] text-gray-500 pt-0.5">Lapse rate: -6.5°C per 1,000m</div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-border/40 space-y-1">
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <Wind className="h-4 w-4 text-rose-400" />
              <span>Real Wind Chill Index</span>
            </div>
            <div className="text-3xl font-black text-rose-400 font-mono pt-1">
              {simulatedWindChillC}°C
            </div>
            <div className="text-[11px] text-gray-500 pt-0.5">NOAA / JAG/TI verified formula</div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-border/40 space-y-1">
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <Snowflake className="h-4 w-4 text-blue-400" />
              <span>Freezing Level Altitude</span>
            </div>
            <div className="text-3xl font-black text-blue-400 font-mono pt-1">
              {simulatedFreezingLevel}m
            </div>
            <div className="text-[11px] text-gray-500 pt-0.5">Zero-degree isotherm boundary</div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-border/40 space-y-1">
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Hypothermia Threat</span>
            </div>
            <div className="pt-1">
              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black border ${frostbiteRisk.color}`}>
                {frostbiteRisk.label}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 pt-1">Wind + thermal plunge matrix</div>
          </div>
        </div>
      </div>

      {/* ── 5. PERSISTENT DATABASE ACTIVE TRAIL HAZARDS ── */}
      <div
        data-slot="card"
        className="backdrop-blur-xl bg-surface/70 border border-border/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-black text-white">
              Database Trail Hazards & Field Incident Advisories ({weatherData?.location || 'Khumbu & Annapurna'})
            </h2>
          </div>

          {weatherData && (
            <span className="text-xs font-mono text-gray-400">
              Region: {weatherData.region} • Elevation: {weatherData.elevation}m
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-accent">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-semibold">Retrieving persistent advisories from database...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-400 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : weatherData && weatherData.hazards && weatherData.hazards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weatherData.hazards.map((h) => (
              <div
                key={h.id}
                className="p-5 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2 hover:border-[#B68D40] transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider font-mono">
                    {h.type}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-gray-400 font-mono">
                    {h.updatedAt}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{h.location}</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{h.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 bg-neutral-950/50 rounded-2xl border border-border/30">
            No active emergency hazard alerts registered in persistent database for this region.
          </div>
        )}
      </div>
    </div>
  );
}
