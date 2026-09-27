'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  Mountain,
  Compass,
  Sparkles,
  Navigation,
} from 'lucide-react';
import { Trail, Landmark } from '@/types';
import { ROUTE_TRACKS } from '@/data/routeTracks';

export interface ElevationPoint {
  distanceKm: number;
  elevation: number;
  label?: string;
  lat?: number;
  lng?: number;
  landmarkName?: string;
  isLandmark?: boolean;
}

export interface ElevationProfileChartProps {
  trail: Trail;
  landmarks?: Landmark[];
  onClose?: () => void;
  onHoverPoint?: (point: ElevationPoint | null) => void;
  onSelectPoint?: (point: ElevationPoint) => void;
  onSelectLandmark?: (landmark: Landmark) => void;
  activePointIndex?: number | null;
  activeDistanceKm?: number | null;
}

interface ChartDataPoint {
  distanceKm: number;
  elevation: number;
  label: string;
  lat?: number;
  lng?: number;
  landmarkName?: string;
  isLandmark?: boolean;
}

interface LandmarkMarkerPoint {
  id: string;
  name: string;
  category: string;
  elevation: number;
  distanceKm: number;
  lat: number;
  lng: number;
}

export default function ElevationProfileChart({
  trail,
  landmarks: propLandmarks,
  onClose,
  onHoverPoint,
  onSelectPoint,
  onSelectLandmark,
  activePointIndex,
  activeDistanceKm,
}: ElevationProfileChartProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<ChartDataPoint | null>(null);
  const [fetchedLandmarks, setFetchedLandmarks] = useState<Landmark[]>([]);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch landmarks if not passed via props
  useEffect(() => {
    if (!propLandmarks || propLandmarks.length === 0) {
      fetch('/api/landmarks')
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Landmark[]) => {
          if (Array.isArray(data)) {
            setFetchedLandmarks(data);
          }
        })
        .catch((err) => console.warn('Failed to load landmarks for elevation chart:', err));
    }
  }, [propLandmarks]);

  const allLandmarks = propLandmarks && propLandmarks.length > 0 ? propLandmarks : fetchedLandmarks;

  // Filter landmarks relevant to this trail or region
  const relevantLandmarks = useMemo(() => {
    return allLandmarks.filter(
      (lm) =>
        lm.associatedTrail?.toLowerCase().includes(trail.slug?.toLowerCase() || '') ||
        lm.associatedTrail?.toLowerCase().includes(trail.id.toLowerCase()) ||
        lm.region?.toLowerCase() === trail.region?.toLowerCase()
    );
  }, [allLandmarks, trail]);

  // Format data points from trail profile or interpolate fallback
  const rawPoints = useMemo(() => {
    if (trail.elevationProfile && trail.elevationProfile.length > 0) {
      return trail.elevationProfile;
    }
    return [
      { distanceKm: 0, elevation: trail.startPoint.includes('2,860') ? 2860 : 1500, label: trail.startPoint },
      { distanceKm: Math.round(trail.distanceKm * 0.2), elevation: Math.round(trail.maxElevation * 0.55), label: 'Lower Valley Camp' },
      { distanceKm: Math.round(trail.distanceKm * 0.4), elevation: Math.round(trail.maxElevation * 0.72), label: 'Mid-Station Ridge' },
      { distanceKm: Math.round(trail.distanceKm * 0.6), elevation: Math.round(trail.maxElevation * 0.88), label: 'High Pass Approach' },
      { distanceKm: Math.round(trail.distanceKm * 0.75), elevation: trail.maxElevation, label: `${trail.name} Summit / Apex` },
      { distanceKm: Math.round(trail.distanceKm * 0.9), elevation: Math.round(trail.maxElevation * 0.75), label: 'Descent Valley' },
      { distanceKm: trail.distanceKm, elevation: trail.endPoint.includes('2,860') ? 2860 : 1800, label: trail.endPoint },
    ];
  }, [trail]);

  // Map route track GPS coordinates to chart distance points
  const chartData: ChartDataPoint[] = useMemo(() => {
    const track = ROUTE_TRACKS[trail.id];
    const trackCoords = track?.coords || [];

    return rawPoints.map((p, idx) => {
      let lat: number | undefined;
      let lng: number | undefined;

      if (trail.routeCoordinates && trail.routeCoordinates[idx]) {
        lat = trail.routeCoordinates[idx][0];
        lng = trail.routeCoordinates[idx][1];
      } else if (trackCoords.length > 0) {
        const ratio = rawPoints.length > 1 ? idx / (rawPoints.length - 1) : 0;
        const coordIdx = Math.min(trackCoords.length - 1, Math.floor(ratio * (trackCoords.length - 1)));
        lat = trackCoords[coordIdx][0];
        lng = trackCoords[coordIdx][1];
      }

      return {
        distanceKm: p.distanceKm,
        elevation: p.elevation,
        label: p.label || `KM ${p.distanceKm}`,
        lat,
        lng,
      };
    });
  }, [rawPoints, trail]);

  // Position relevant landmarks along the elevation line using GPS proximity to route tracks
  const landmarkMarkers: LandmarkMarkerPoint[] = useMemo(() => {
    if (!relevantLandmarks.length || !chartData.length) return [];

    const track = ROUTE_TRACKS[trail.id];
    const trackCoords = track?.coords || (trail.routeCoordinates?.map(c => [c[0], c[1]] as [number, number]) || []);

    return relevantLandmarks.map((lm, idx) => {
      let dist = 0;
      if (trackCoords.length > 1) {
        let minDistSq = Infinity;
        let closestIdx = 0;
        for (let i = 0; i < trackCoords.length; i++) {
          const dLat = trackCoords[i][0] - lm.coordinates.lat;
          const dLng = trackCoords[i][1] - lm.coordinates.lng;
          const distSq = dLat * dLat + dLng * dLng;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            closestIdx = i;
          }
        }
        const ratio = closestIdx / (trackCoords.length - 1);
        dist = Math.round(ratio * trail.distanceKm * 10) / 10;
      } else {
        const ratio = relevantLandmarks.length > 1 ? (idx + 1) / (relevantLandmarks.length + 1) : 0.5;
        dist = Math.round(ratio * trail.distanceKm * 10) / 10;
      }

      return {
        id: lm.id,
        name: lm.name,
        category: lm.category,
        elevation: lm.elevation || 3500,
        distanceKm: dist,
        lat: lm.coordinates.lat,
        lng: lm.coordinates.lng,
      };
    });
  }, [relevantLandmarks, chartData, trail.distanceKm, trail.id, trail.routeCoordinates]);

  const allElevations = useMemo(() => {
    const dataElevs = chartData.map((d) => d.elevation);
    const lmElevs = landmarkMarkers.map((lm) => lm.elevation);
    return [...dataElevs, ...lmElevs];
  }, [chartData, landmarkMarkers]);

  // Synchronized flight scrubber position and elevation
  const activeScrubberData = useMemo(() => {
    if (activeDistanceKm === undefined || activeDistanceKm === null || !chartData.length) {
      return null;
    }
    const dist = Math.max(0, Math.min(activeDistanceKm, trail.distanceKm));
    let p1 = chartData[0];
    let p2 = chartData[chartData.length - 1];
    for (let i = 0; i < chartData.length - 1; i++) {
      if (dist >= chartData[i].distanceKm && dist <= chartData[i + 1].distanceKm) {
        p1 = chartData[i];
        p2 = chartData[i + 1];
        break;
      }
    }
    const span = p2.distanceKm - p1.distanceKm;
    const ratio = span > 0 ? (dist - p1.distanceKm) / span : 0;
    const elev = Math.round(p1.elevation + ratio * (p2.elevation - p1.elevation));
    const lat = p1.lat && p2.lat ? p1.lat + ratio * (p2.lat - p1.lat) : p1.lat;
    const lng = p1.lng && p2.lng ? p1.lng + ratio * (p2.lng - p1.lng) : p1.lng;

    return {
      distanceKm: Math.round(dist * 10) / 10,
      elevation: elev,
      lat,
      lng,
    };
  }, [activeDistanceKm, chartData, trail.distanceKm]);

  const minElevation = allElevations.length > 0 ? Math.min(...allElevations) : 1500;
  const maxElevation = allElevations.length > 0 ? Math.max(...allElevations, trail.maxElevation || 0) : trail.maxElevation || 5000;
  const totalClimb = trail.elevationGain || (maxElevation - minElevation);

  const handleMouseMove = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined && chartData[state.activeTooltipIndex]) {
      const pt = chartData[state.activeTooltipIndex];
      setHoveredDataPoint(pt);
      onHoverPoint?.({
        distanceKm: pt.distanceKm,
        elevation: pt.elevation,
        label: pt.label,
        lat: pt.lat,
        lng: pt.lng,
        landmarkName: pt.landmarkName,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredDataPoint(null);
    onHoverPoint?.(null);
  };

  const handleClick = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined && chartData[state.activeTooltipIndex]) {
      const pt = chartData[state.activeTooltipIndex];
      onSelectPoint?.({
        distanceKm: pt.distanceKm,
        elevation: pt.elevation,
        label: pt.label,
        lat: pt.lat,
        lng: pt.lng,
      });
    }
  };

  const handleLandmarkBadgeClick = (lm: LandmarkMarkerPoint) => {
    setSelectedLandmarkId(lm.id);
    const fullLm = relevantLandmarks.find((l) => l.id === lm.id);
    if (fullLm && onSelectLandmark) {
      onSelectLandmark(fullLm);
    }
    onSelectPoint?.({
      distanceKm: lm.distanceKm,
      elevation: lm.elevation,
      label: lm.name,
      lat: lm.lat,
      lng: lm.lng,
      landmarkName: lm.name,
    });
  };

  // Active highlighted point for the header HUD badge
  const activePt = hoveredDataPoint || (activeScrubberData ? {
    label: '🚁 3D Drone Flight Position',
    distanceKm: activeScrubberData.distanceKm,
    elevation: activeScrubberData.elevation,
  } : null);

  return (
    <div
      data-slot="base"
      className="w-full rounded-3xl bg-neutral-950/95 border border-border/40 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300 text-foreground"
    >
      {/* 1. GLASSMORPHIC HEADER HUD TOOLBAR (Matching PlannerElevationChart logic & design) */}
      <div
        data-slot="header"
        className="px-4 py-3 bg-black/85 border-b border-border/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#B68D40] to-amber-600 text-black font-extrabold flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <TrendingUp className="h-4 w-4 text-black" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white tracking-wider flex items-center gap-2">
              <span className="truncate max-w-[200px] sm:max-w-xs">{trail.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/40 font-mono font-bold shrink-0">
                Altitude Profile
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono hidden sm:block">
              Hover along altitude curve or click waypoint markers to focus 2D/3D map
            </div>
          </div>
        </div>

        {/* Quick Route Elevation Badges */}
        <div className="hidden md:flex items-center gap-3.5 text-xs font-mono text-muted-foreground border-l border-border/40 pl-3.5">
          <span>
            Apex: <strong className="text-amber-400">{maxElevation.toLocaleString()}m</strong>
          </span>
          <span>
            Min: <strong className="text-emerald-400">{minElevation.toLocaleString()}m</strong>
          </span>
          <span>
            Climb: <strong className="text-cyan-400">+{totalClimb.toLocaleString()}m</strong>
          </span>
          <span>
            Dist: <strong className="text-[#B68D40]">{trail.distanceKm} km</strong>
          </span>
        </div>

        {/* Highlighted Active Point Indicator */}
        {activePt && (
          <div
            data-slot="indicator"
            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/90 border border-[#B68D40]/60 backdrop-blur-md shadow-xl text-xs animate-in fade-in"
          >
            <span className="text-xs font-bold text-[#B68D40] truncate max-w-[140px]">{activePt.label}:</span>
            <span className="font-mono text-gray-300 text-[11px]">{activePt.distanceKm}km</span>
            <span className="font-mono font-bold text-amber-400">{activePt.elevation.toLocaleString()}m</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-slot="trigger"
            className="p-1.5 rounded-xl bg-neutral-900 border border-border/40 text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title={isExpanded ? 'Collapse Profile' : 'Expand Profile'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              data-slot="trigger"
              className="p-1.5 rounded-xl bg-neutral-900 border border-border/40 text-muted-foreground hover:text-red-400 transition"
              title="Close Profile"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. RECHARTS EXPANDED AREA GRAPH CANVAS */}
      {isExpanded && (
        <div data-slot="body" className="p-3.5 space-y-2.5">
          <div data-slot="content" className="w-full h-44 sm:h-52">
            {!mounted ? (
              <div
                data-slot="indicator"
                className="w-full h-full rounded-2xl bg-surface/40 animate-pulse border border-border/20"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
                  margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="elevationProfileGoldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B68D40" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#B68D40" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(255, 255, 255, 0.07)" strokeDasharray="3 3" vertical={false} />

                  <XAxis
                    dataKey="distanceKm"
                    unit=" km"
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  />
                  <YAxis
                    dataKey="elevation"
                    unit="m"
                    domain={[minElevation - 100, maxElevation + 100]}
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip content={<CustomRechartsTooltip />} />

                  {/* Route Checkpoint Reference Dots for Key Landmarks */}
                  {landmarkMarkers.map((lm) => {
                    const isSelected = selectedLandmarkId === lm.id;
                    return (
                      <ReferenceDot
                        key={lm.id}
                        x={lm.distanceKm}
                        y={lm.elevation}
                        r={isSelected ? 7 : 5}
                        fill={isSelected ? '#fbbf24' : '#B68D40'}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="cursor-pointer transition-all hover:scale-125"
                        onClick={() => handleLandmarkBadgeClick(lm)}
                      />
                    );
                  })}

                  {/* Synchronized 3D Drone Flight Scrubber Marker & Reference Line */}
                  {activeScrubberData && (
                    <>
                      <ReferenceLine
                        x={activeScrubberData.distanceKm}
                        stroke="#fbbf24"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                      />
                      <ReferenceDot
                        x={activeScrubberData.distanceKm}
                        y={activeScrubberData.elevation}
                        r={7}
                        fill="#fbbf24"
                        stroke="#ffffff"
                        strokeWidth={2.5}
                      />
                    </>
                  )}

                  <Area
                    type="monotone"
                    dataKey="elevation"
                    stroke="#B68D40"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#elevationProfileGoldGrad)"
                    activeDot={{ r: 7, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 3. ROUTE LANDMARK CHECKPOINTS FOOTER (Matching PlannerElevationChart Waypoint Stepper) */}
          {landmarkMarkers.length > 0 && (
            <div
              data-slot="footer"
              className="pt-2 border-t border-border/30 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-accent mr-1 flex items-center gap-1">
                  <Mountain className="h-3.5 w-3.5 text-[#B68D40]" />
                  <span>Key Waypoints:</span>
                </span>
                {landmarkMarkers.map((lm) => {
                  const isSelected = selectedLandmarkId === lm.id;
                  return (
                    <button
                      key={lm.id}
                      onClick={() => handleLandmarkBadgeClick(lm)}
                      data-slot="landmark-pill"
                      data-selected={isSelected}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[#B68D40] text-black border-white shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-[#B68D40]'
                          : 'bg-neutral-900/90 text-gray-300 border-border/40 hover:border-[#B68D40]/50 hover:text-white'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                    >
                      <span>🏔️</span>
                      <span>{lm.name}</span>
                      <span className="text-[10px] font-mono opacity-80">{lm.elevation}m</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-accent" />
                <span>Click point to focus map directly</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomRechartsTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as ChartDataPoint;

    return (
      <div
        data-slot="tooltip"
        className="backdrop-blur-2xl bg-neutral-950/95 border border-[#B68D40]/60 shadow-2xl rounded-2xl p-3 text-white text-xs space-y-2 max-w-xs"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
          <span className="font-extrabold text-[#B68D40] truncate max-w-[180px]">{item.label}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
            KM {item.distanceKm}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <p className="text-base font-mono font-extrabold text-amber-400">{item.elevation.toLocaleString()} m</p>
          <span className="text-emerald-400 font-mono text-[11px]">Altitude</span>
        </div>

        {item.lat && item.lng && (
          <div className="text-[10px] text-gray-400 font-mono pt-1 border-t border-white/10">
            GPS: {item.lat.toFixed(4)}°N, {item.lng.toFixed(4)}°E
          </div>
        )}

        <div className="pt-1 border-t border-white/10 flex items-center gap-1 text-[10px] text-[#B68D40]">
          <Sparkles className="h-3 w-3" />
          <span>Click to focus 2D & 3D map camera</span>
        </div>
      </div>
    );
  }
  return null;
}
