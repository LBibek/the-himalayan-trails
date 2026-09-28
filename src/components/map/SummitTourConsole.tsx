'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mountain,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Wind,
  Thermometer,
  Activity,
  History,
  Info,
  Compass,
  Sparkles,
  ChevronRight,
  Maximize2,
  Minimize2,
  Gauge
} from 'lucide-react';
import { SUMMIT_TOURS, SummitTour, TourWaypoint } from '@/data/summitTours';
import type { CesiumController } from '@/lib/map/CesiumController';
import GlassCard from '@/components/ui/GlassCard';
import GlassBadge from '@/components/ui/GlassBadge';
import FloatingMapPanel from '@/components/ui/FloatingMapPanel';

interface SummitTourConsoleProps {
  controller: CesiumController | null;
  initialSummitSlug?: string;
  onSelectSummit?: (tour: SummitTour) => void;
  className?: string;
}

export default function SummitTourConsole({
  controller,
  initialSummitSlug = 'everest',
  onSelectSummit,
  className = '',
}: SummitTourConsoleProps) {
  // Find initial tour
  const [selectedTour, setSelectedTour] = useState<SummitTour>(() => {
    return SUMMIT_TOURS.find((t) => t.slug === initialSummitSlug) || SUMMIT_TOURS[0];
  });

  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [lightingPreset, setLightingPreset] = useState<'sunrise' | 'midday' | 'sunset' | 'night'>('sunrise');
  const [hudExpanded, setHudExpanded] = useState(true);
  const [showTrivia, setShowTrivia] = useState(true);

  const activeWaypoint: TourWaypoint = selectedTour.waypoints[currentWaypointIndex] || selectedTour.waypoints[0];

  // Calculate dynamic oxygen percentage based on barometric formula
  const currentAltitude = activeWaypoint.elevationMeters;
  const currentAltitudeFt = Math.round(currentAltitude * 3.28084);
  const oxygenPercentage = Math.round(100 * Math.exp(-currentAltitude / 7200));

  // Change tour peak
  const handleSelectTour = (tour: SummitTour) => {
    setSelectedTour(tour);
    setCurrentWaypointIndex(0);
    setIsPlaying(false);
    onSelectSummit?.(tour);

    if (controller && tour.waypoints[0]) {
      controller.flyToTourWaypoint(tour.waypoints[0], {
        duration: 4,
        onComplete: () => {
          if (lightingPreset) {
            controller.setTimeOfDayLighting(lightingPreset);
          }
        },
      });
    }
  };

  // Fly to specific waypoint
  const goToWaypoint = (index: number) => {
    if (index < 0 || index >= selectedTour.waypoints.length) return;
    setCurrentWaypointIndex(index);
    const targetWp = selectedTour.waypoints[index];

    if (controller && targetWp) {
      if (targetWp.phase === 'Orbital 360') {
        controller.flyToTourWaypoint(targetWp, {
          duration: 3 / playbackSpeed,
          onComplete: () => {
            controller.startOrbitalRotation(targetWp.coords, targetWp.cameraRangeMeters, 0.04 * playbackSpeed);
          },
        });
      } else {
        controller.flyToTourWaypoint(targetWp, {
          duration: (targetWp.durationSeconds || 4) / playbackSpeed,
        });
      }
    }
  };

  // Handle Play/Pause
  const togglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      goToWaypoint(currentWaypointIndex);
    } else {
      setIsPlaying(false);
      controller?.stopTour();
    }
  };

  // Autoplay sequencer effect
  useEffect(() => {
    if (!isPlaying) return;

    const currentWp = selectedTour.waypoints[currentWaypointIndex];
    const durationMs = ((currentWp?.durationSeconds || 4) / playbackSpeed) * 1000 + 1500;

    const timer = setTimeout(() => {
      if (currentWaypointIndex < selectedTour.waypoints.length - 1) {
        goToWaypoint(currentWaypointIndex + 1);
      } else {
        // Reached end of tour
        setIsPlaying(false);
      }
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentWaypointIndex, selectedTour, playbackSpeed]);

  // Handle lighting change
  const handleLightingChange = (preset: 'sunrise' | 'midday' | 'sunset' | 'night') => {
    setLightingPreset(preset);
    controller?.setTimeOfDayLighting(preset);
  };

  return (
    <FloatingMapPanel
      id="summit-tour-window"
      title={selectedTour.name}
      icon={<Mountain className="h-4 w-4 text-[#B68D40]" />}
      badge={
        <GlassBadge variant="gold">
          Earth Rank #{selectedTour.rankInWorld}
        </GlassBadge>
      }
      allowDrag={true}
      allowMinimize={true}
      allowMaximize={true}
      allowClose={false}
      defaultWidth="w-full"
      className={className}
    >
      <div className="space-y-4">
        {/* 1. TOP CAROUSEL: 8,000M SUMMIT SELECTOR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-500/20">
          {SUMMIT_TOURS.map((tour) => {
            const isSelected = selectedTour.id === tour.id;
            return (
              <button
                key={tour.id}
                onClick={() => handleSelectTour(tour)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-2xl border transition-all flex items-center gap-2.5 text-xs font-bold ${
                  isSelected
                    ? 'bg-amber-500/20 border-[#B68D40] text-amber-300 shadow-lg shadow-[#B68D40]/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Mountain className={`h-4 w-4 ${isSelected ? 'text-[#B68D40]' : 'text-slate-500'}`} />
                <div className="text-left">
                  <p className="leading-tight">{tour.name.split('(')[0].trim()}</p>
                  <p className="text-[10px] font-normal text-slate-400">{tour.elevation.toLocaleString()} m • #{tour.rankInWorld} Peak</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Header with Native Script and Lighting Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-xs text-slate-400 font-mono">{selectedTour.nativeName}</span>
          </div>

          {/* Lighting Presets */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleLightingChange('sunrise')}
              title="Golden Hour Sunrise Alpenglow"
              className={`p-1.5 rounded-lg text-xs transition ${
                lightingPreset === 'sunrise' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sunrise className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleLightingChange('midday')}
              title="High Noon Glacial Reflection"
              className={`p-1.5 rounded-lg text-xs transition ${
                lightingPreset === 'midday' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleLightingChange('sunset')}
              title="Dramatic Sunset Amber"
              className={`p-1.5 rounded-lg text-xs transition ${
                lightingPreset === 'sunset' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sunset className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleLightingChange('night')}
              title="Starry Night Sky"
              className={`p-1.5 rounded-lg text-xs transition ${
                lightingPreset === 'night' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Real-Time Telemetry Gauges (Altitude, Oxygen %, Weather) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Gauge className="h-3 w-3 text-amber-400" />
              Waypoint Elevation
            </span>
            <p className="text-base font-black text-white">
              {currentAltitude.toLocaleString()} <span className="text-xs font-normal text-slate-400">m</span>
            </p>
            <span className="text-[10px] text-slate-500 font-mono">{currentAltitudeFt.toLocaleString()} ft</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-400" />
              Effective Oxygen ($O_2$)
            </span>
            <p className={`text-base font-black ${oxygenPercentage < 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {oxygenPercentage}% <span className="text-xs font-normal text-slate-400">of sea level</span>
            </p>
            <span className="text-[10px] text-slate-500 font-mono">
              {currentAltitude >= selectedTour.deathZoneElevation ? '⚠️ Death Zone' : 'Acclimatized Range'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-cyan-400" />
              Summit Temperature
            </span>
            <p className="text-base font-black text-cyan-300">
              {selectedTour.summitTempC}°C
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Windchill ~ -42°C</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Wind className="h-3 w-3 text-blue-400" />
              Summit Wind Gusts
            </span>
            <p className="text-base font-black text-blue-300">
              {selectedTour.summitWindKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Jet Stream Influence</span>
          </div>

        </div>

        {/* Current Waypoint Information & Documentary Trivia */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[#B68D40] text-[10px] font-bold uppercase tracking-wider">
                Stage {currentWaypointIndex + 1}/{selectedTour.waypoints.length} • {activeWaypoint.phase}
              </span>
              <h3 className="text-sm font-bold text-white">{activeWaypoint.name}</h3>
            </div>
            <button
              onClick={() => setShowTrivia(!showTrivia)}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              <History className="h-3.5 w-3.5" />
              <span>{showTrivia ? 'Hide History' : 'Pioneer History'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {activeWaypoint.description}
          </p>

          {showTrivia && (
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-200/90 flex items-start gap-2 bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20">
              <Sparkles className="h-4 w-4 text-[#B68D40] shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 block font-semibold">Documentary Milestone:</strong>
                {activeWaypoint.pioneerMilestone || activeWaypoint.historicalTrivia || `First ascended in ${selectedTour.firstAscentYear} by ${selectedTour.firstAscenders}.`}
              </div>
            </div>
          )}
        </div>

        {/* 3. FLIGHT AUTOPILOT CONTROLLER & WAYPOINT SCRUBBER */}
        <div className="space-y-3 pt-1 border-t border-slate-800/80">
          
          {/* Waypoint Progress Dots */}
          <div className="flex items-center justify-between gap-1.5">
            {selectedTour.waypoints.map((wp, idx) => {
              const isActive = currentWaypointIndex === idx;
              return (
                <button
                  key={wp.id}
                  onClick={() => goToWaypoint(idx)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all truncate ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-extrabold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {wp.name.split('(')[0].trim()}
                </button>
              );
            })}
          </div>

          {/* Autopilot Action Bar */}
          <div className="flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToWaypoint(Math.max(0, currentWaypointIndex - 1))}
                disabled={currentWaypointIndex === 0}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition"
                title="Previous Waypoint"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                onClick={togglePlay}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#B68D40] hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-[#B68D40]/30 flex items-center gap-2 transition"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 fill-slate-950" />
                    <span>Pause Flight</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-slate-950" />
                    <span>Play 3D Summit Tour</span>
                  </>
                )}
              </button>

              <button
                onClick={() => goToWaypoint(Math.min(selectedTour.waypoints.length - 1, currentWaypointIndex + 1))}
                disabled={currentWaypointIndex === selectedTour.waypoints.length - 1}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition"
                title="Next Waypoint"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Flight Speed Multipliers */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[11px]">
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded-lg font-bold transition ${
                    playbackSpeed === spd
                      ? 'bg-amber-500/20 text-amber-300 border border-[#B68D40]/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>
    </FloatingMapPanel>
  );
}
