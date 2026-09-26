'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Mountain,
  Navigation,
  Activity,
  Compass,
  MapPin,
  Clock,
  TrendingUp,
  Sparkles,
  Plane,
  X,
} from 'lucide-react';
import type { IMapController, DroneFlightTelemetry, MapPolyline } from '@/lib/map/types';
import type { Trail, Landmark } from '@/types';
import FloatingMapPanel from '@/components/ui/FloatingMapPanel';

export interface DroneFlightConsoleProps {
  controller?: IMapController | null;
  trail?: Trail | null;
  polyline?: MapPolyline;
  landmarks?: Landmark[];
  onClose?: () => void;
  onTelemetryChange?: (telemetry: DroneFlightTelemetry) => void;
  className?: string;
}

export default function DroneFlightConsole({
  controller,
  trail,
  polyline,
  landmarks,
  onClose,
  onTelemetryChange,
  className = '',
}: DroneFlightConsoleProps) {
  const [telemetry, setTelemetry] = useState<DroneFlightTelemetry>({
    isPlaying: false,
    speedMultiplier: 1,
    currentDistanceMeters: 0,
    totalDistanceMeters: (trail?.distanceKm || 0) * 1000,
    progressRatio: 0,
    currentPosition: {
      lat: trail?.routeCoordinates?.[0]?.[0] || 27.9881,
      lng: trail?.routeCoordinates?.[0]?.[1] || 86.9250,
      altitude: trail?.elevationProfile?.[0]?.elevation || 2860,
    },
    currentAltitudeMeters: trail?.elevationProfile?.[0]?.elevation || 2860,
    remainingDistanceKm: trail?.distanceKm || 0,
    currentSpeedKmh: 50,
    headingDegrees: 0,
    pitchDegrees: -20,
    slopePercent: 0,
  });

  // Subscribe to real-time drone telemetry from CesiumController
  useEffect(() => {
    if (!controller || !controller.onDroneTelemetry) return;

    const unsubscribe = controller.onDroneTelemetry((t) => {
      setTelemetry(t);
      onTelemetryChange?.(t);
    });

    return () => {
      unsubscribe();
    };
  }, [controller, onTelemetryChange]);

  const handleTogglePlay = () => {
    if (!controller) return;

    if (telemetry.isPlaying) {
      controller.pauseDroneFlight?.();
    } else {
      if (telemetry.currentDistanceMeters === 0) {
        controller.startDroneFlight?.({
          speedMultiplier: telemetry.speedMultiplier,
          initialDistanceMeters: 0,
        });
      } else {
        controller.resumeDroneFlight?.();
      }
    }
  };

  const handleRestart = () => {
    if (!controller) return;
    controller.seekDroneFlight?.(0);
    controller.startDroneFlight?.({
      speedMultiplier: telemetry.speedMultiplier,
      initialDistanceMeters: 0,
    });
  };

  const handleSetSpeed = (multiplier: 1 | 2 | 5) => {
    if (!controller) return;
    controller.setDroneFlightSpeed?.(multiplier);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!controller) return;
    const targetMeters = parseFloat(e.target.value);
    controller.seekDroneFlight?.(targetMeters);
  };

  // Barometric atmospheric calculations
  const altitudeMeters = telemetry.currentAltitudeMeters;
  const altitudeFeet = Math.round(altitudeMeters * 3.28084);
  const barometricO2Percent = Math.max(20, Math.min(100, Math.round(100 * Math.exp(-altitudeMeters / 7200))));

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'Immediate';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div data-slot="base" className={`w-full ${className}`}>
      <FloatingMapPanel
        id="drone-flight-hud-window"
        title={
          <div data-slot="header" className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-accent animate-pulse" />
            <span className="font-extrabold text-white text-sm">
              3D Drone Flight Path Simulator
            </span>
          </div>
        }
        icon={<Navigation className="w-4 h-4 text-accent" />}
        badge={
          <div className="flex items-center gap-1.5">
            <span
              data-slot="indicator"
              className={`inline-block w-2 h-2 rounded-full ${
                telemetry.isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="text-[10px] text-accent font-mono font-bold px-2 py-0.5 rounded bg-accent/20 border border-accent/40 truncate max-w-[150px]">
              {trail ? trail.name : '3D Polyline Tour'}
            </span>
          </div>
        }
        onClose={onClose}
        allowDrag={true}
        allowMinimize={true}
        allowMaximize={true}
        allowClose={Boolean(onClose)}
        defaultWidth="w-full max-w-4xl mx-auto"
        className="shadow-2xl border border-accent/40 bg-neutral-950/95 backdrop-blur-2xl"
      >
        <div className="space-y-3.5">
          {/* 1. CONTROLS SECTION */}
          <div
            data-slot="controls"
            className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900/85 border border-accent/30 rounded-2xl backdrop-blur-md"
          >
            {/* Play/Pause & Restart Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                data-slot="trigger"
                data-pressed={telemetry.isPlaying}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border ${
                  telemetry.isPlaying
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : 'bg-accent text-accent-foreground border-accent shadow-lg shadow-amber-500/20 hover:scale-105'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                title={telemetry.isPlaying ? 'Pause Drone Simulation' : 'Start / Resume Drone Simulation'}
              >
                {telemetry.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{telemetry.isPlaying ? 'Pause Flight' : 'Play Drone'}</span>
              </button>

              <button
                onClick={handleRestart}
                data-slot="trigger"
                className="p-2.5 rounded-xl text-xs font-semibold bg-neutral-950/80 hover:bg-neutral-800 text-gray-300 hover:text-white border border-border/40 hover:border-accent/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                title="Restart Flight from 0 km"
              >
                <RotateCcw className="w-4 h-4 text-accent" />
              </button>
            </div>

            {/* Speed Multiplier Pills */}
            <div className="flex items-center gap-1 bg-neutral-950/80 border border-border/40 rounded-xl p-1">
              <span className="text-[10px] text-muted-foreground uppercase font-mono px-1.5 font-bold">Speed:</span>
              {([1, 2, 5] as const).map((spd) => {
                const isSelected = telemetry.speedMultiplier === spd;
                return (
                  <button
                    key={spd}
                    onClick={() => handleSetSpeed(spd)}
                    data-slot="trigger"
                    data-selected={isSelected}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all font-mono ${
                      isSelected
                        ? 'bg-accent text-accent-foreground shadow-md scale-105'
                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                  >
                    {spd}x
                  </button>
                );
              })}
            </div>

            {/* Flight Timeline Scrubber Slider */}
            <div className="flex-1 min-w-[200px] flex items-center gap-2.5">
              <span className="text-[11px] font-mono text-accent font-extrabold w-14 text-right">
                {(telemetry.currentDistanceMeters / 1000).toFixed(1)} km
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(1, telemetry.totalDistanceMeters)}
                value={telemetry.currentDistanceMeters}
                onChange={handleScrubberChange}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#B68D40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                title="Drag to Scrub Drone Flight Path"
              />
              <span className="text-[11px] font-mono text-muted-foreground w-14">
                {(telemetry.totalDistanceMeters / 1000).toFixed(1)} km
              </span>
            </div>
          </div>

          {/* 2. TELEMETRY HUD TILES */}
          <div data-slot="telemetry" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {/* Tile 1: Altitude & O2 */}
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-border/40 backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                <span>Altitude</span>
                <Mountain className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="mt-1">
                <p className="text-base font-extrabold text-amber-300 font-mono">
                  {altitudeMeters.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">m</span>
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  {altitudeFeet.toLocaleString()} ft • <strong className="text-emerald-400">{barometricO2Percent}% O₂</strong>
                </p>
              </div>
            </div>

            {/* Tile 2: Remaining Distance & Progress */}
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-border/40 backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                <span>Remaining</span>
                <Navigation className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="mt-1">
                <p className="text-base font-extrabold text-white font-mono">
                  {telemetry.remainingDistanceKm.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">km</span>
                </p>
                <p className="text-[10px] text-accent font-mono font-semibold">
                  {Math.round(telemetry.progressRatio * 100)}% Traversed
                </p>
              </div>
            </div>

            {/* Tile 3: Ground Speed */}
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-border/40 backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                <span>Ground Speed</span>
                <Activity className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="mt-1">
                <p className="text-base font-extrabold text-white font-mono">
                  {telemetry.currentSpeedKmh} <span className="text-xs font-normal text-muted-foreground">km/h</span>
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  {(telemetry.currentSpeedKmh / 3.6).toFixed(1)} m/s True Airspeed
                </p>
              </div>
            </div>

            {/* Tile 4: Slope Grade & Pitch Tilt */}
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-border/40 backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                <span>Gradient</span>
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="mt-1">
                <p className={`text-base font-extrabold font-mono ${telemetry.slopePercent >= 0 ? 'text-emerald-300' : 'text-cyan-300'}`}>
                  {telemetry.slopePercent > 0 ? `+${telemetry.slopePercent}%` : `${telemetry.slopePercent}%`}
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  Pitch: {telemetry.pitchDegrees}° • Yaw: {telemetry.headingDegrees}°
                </p>
              </div>
            </div>

            {/* Tile 5: Next Landmark ETA */}
            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-neutral-900/80 border border-border/40 backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-[10px] font-mono uppercase tracking-wider">
                <span>Next Landmark</span>
                <Clock className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="mt-1">
                {telemetry.nextLandmark ? (
                  <>
                    <p className="text-xs font-bold text-accent truncate" title={telemetry.nextLandmark.name}>
                      🏔️ {telemetry.nextLandmark.name}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono font-semibold">
                      ETA {formatEta(telemetry.nextLandmark.etaSeconds)} ({telemetry.nextLandmark.distanceKm} km)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-gray-300 truncate">Summit Apex Approach</p>
                    <p className="text-[10px] text-muted-foreground font-mono">Final Ascent Ridge</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </FloatingMapPanel>
    </div>
  );
}
