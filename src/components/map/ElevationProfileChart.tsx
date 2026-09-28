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

  const selectedLandmark = useMemo(() => {
    if (!selectedLandmarkId) return null;
    return landmarkMarkers.find((lm) => lm.id === selectedLandmarkId) || null;
  }, [selectedLandmarkId, landmarkMarkers]);

  // Active highlighted point for the compact header readout
  const activePt = hoveredDataPoint || (activeScrubberData ? {
    label: '🚁 Drone Position',
    distanceKm: activeScrubberData.distanceKm,
    elevation: activeScrubberData.elevation,
  } : null);

  return (
    <div
      data-slot="base"
      className="w-full rounded-2xl bg-neutral-950/90 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300 text-foreground"
    >
      {/* 1. SLIMLINE HEADER: Essential Trail Name + Vital Metrics + Current Scrubber */}
      <div
        data-slot="header"
        className="px-3 py-1.5 bg-black/80 border-b border-white/10 flex items-center justify-between gap-2 text-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#B68D40] to-amber-600 text-black flex items-center justify-center shrink-0 shadow">
            <TrendingUp className="h-3 w-3 text-black" />
          </div>
          <span className="font-extrabold text-white text-xs truncate max-w-[140px] sm:max-w-[200px]">
            {trail.name}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono shrink-0 hidden sm:inline-block">
            {trail.distanceKm}km • +{totalClimb.toLocaleString()}m
          </span>
        </div>

        {/* Live Scrubber / Hover Readout */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {activePt ? (
            <div
              data-slot="indicator"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-[#B68D40]/40 text-[10px] font-mono"
            >
              <span className="text-[#B68D40] font-bold truncate max-w-[100px]">{activePt.label}:</span>
              <span className="text-gray-300">{activePt.distanceKm}km</span>
              <span className="font-bold text-amber-400">{activePt.elevation.toLocaleString()}m</span>
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground font-mono hidden md:flex items-center gap-2">
              <span>Max: <strong className="text-amber-400 font-bold">{maxElevation.toLocaleString()}m</strong></span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            data-slot="trigger"
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white transition"
            title={isExpanded ? 'Collapse Profile' : 'Expand Profile'}
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              data-slot="trigger"
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-red-400 transition"
              title="Close Profile"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. KEYPOINTS TOP NAVIGATION STRIP (Directly above line chart for seamless trail navigation) */}
      {isExpanded && landmarkMarkers.length > 0 && (
        <div
          data-slot="keypoints-nav"
          className="px-2.5 pt-1.5 pb-1 border-b border-white/5 bg-neutral-950/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none"
        >
          <span className="text-[9px] uppercase font-bold tracking-wider text-[#B68D40] shrink-0 flex items-center gap-1 pr-1 border-r border-white/10">
            <Mountain className="h-2.5 w-2.5 text-[#B68D40]" />
            <span>Keypoints</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {landmarkMarkers.map((lm) => {
              const isSelected = selectedLandmarkId === lm.id;
              return (
                <button
                  key={lm.id}
                  onClick={() => handleLandmarkBadgeClick(lm)}
                  data-slot="keypoint-chip"
                  data-selected={isSelected}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#B68D40] text-black border-amber-300 shadow-sm shadow-amber-500/20 font-bold scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10 hover:border-[#B68D40]/40'
                  } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B68D40]`}
                  title={`Navigate to ${lm.name} (${lm.elevation}m at KM ${lm.distanceKm})`}
                >
                  <span className="text-[10px]">{getCategoryIcon(lm.category)}</span>
                  <span className="truncate max-w-[100px]">{lm.name}</span>
                  <span className={`text-[9px] font-mono ${isSelected ? 'text-black/80' : 'text-gray-400'}`}>
                    {lm.elevation}m
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. COMPACT RECHARTS AREA CHART CANVAS */}
      {isExpanded && (
        <div data-slot="body" className="p-2 pt-1">
          <div data-slot="content" className="w-full h-20 sm:h-24">
            {!mounted ? (
              <div
                data-slot="indicator"
                className="w-full h-full rounded-xl bg-surface/40 animate-pulse border border-border/20"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleClick}
                  margin={{ top: 6, right: 10, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="elevationProfileGoldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B68D40" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#B68D40" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="2 2" vertical={false} />

                  <XAxis
                    dataKey="distanceKm"
                    unit="km"
                    stroke="#71717a"
                    fontSize={9}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    dataKey="elevation"
                    unit="m"
                    domain={[minElevation - 80, maxElevation + 80]}
                    stroke="#71717a"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickCount={3}
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
                        r={isSelected ? 6 : 4}
                        fill={isSelected ? '#fbbf24' : '#B68D40'}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? 2 : 1}
                        className="cursor-pointer transition-all hover:scale-125"
                        onClick={() => handleLandmarkBadgeClick(lm)}
                      />
                    );
                  })}

                  {/* Active Selected Landmark Vertical Guideline */}
                  {selectedLandmark && (
                    <ReferenceLine
                      x={selectedLandmark.distanceKm}
                      stroke="#fbbf24"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Synchronized 3D Drone Flight Scrubber Marker & Reference Line */}
                  {activeScrubberData && (
                    <>
                      <ReferenceLine
                        x={activeScrubberData.distanceKm}
                        stroke="#fbbf24"
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                      />
                      <ReferenceDot
                        x={activeScrubberData.distanceKm}
                        y={activeScrubberData.elevation}
                        r={6}
                        fill="#fbbf24"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    </>
                  )}

                  <Area
                    type="monotone"
                    dataKey="elevation"
                    stroke="#B68D40"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#elevationProfileGoldGrad)"
                    activeDot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryIcon(category?: string): string {
  if (!category) return '📍';
  const c = category.toLowerCase();
  if (c.includes('summit') || c.includes('peak')) return '🏔️';
  if (c.includes('pass')) return '⛰️';
  if (c.includes('camp') || c.includes('base') || c.includes('village') || c.includes('settlement')) return '⛺';
  if (c.includes('monastery') || c.includes('temple') || c.includes('gompa')) return '🛕';
  if (c.includes('view') || c.includes('ridge')) return '🔭';
  if (c.includes('lake')) return '💧';
  return '📍';
}

function CustomRechartsTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as ChartDataPoint;

    return (
      <div
        data-slot="tooltip"
        className="backdrop-blur-xl bg-neutral-950/95 border border-[#B68D40]/50 shadow-2xl rounded-xl px-2.5 py-1.5 text-white text-xs space-y-1 max-w-[200px]"
      >
        <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-1">
          <span className="font-extrabold text-[#B68D40] text-[11px] truncate max-w-[120px]">{item.label}</span>
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
            {item.distanceKm} km
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <p className="text-sm font-mono font-extrabold text-amber-400">{item.elevation.toLocaleString()} m</p>
          <span className="text-emerald-400 font-mono text-[10px]">Elevation</span>
        </div>
      </div>
    );
  }
  return null;
}
