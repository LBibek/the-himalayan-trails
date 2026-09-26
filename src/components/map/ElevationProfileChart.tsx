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
  ExternalLink,
} from 'lucide-react';
import FloatingMapPanel from '@/components/ui/FloatingMapPanel';
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
        lm.associatedTrail?.toLowerCase().includes(trail.slug.toLowerCase()) ||
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

  const minElevation = allElevations.length > 0 ? Math.min(...allElevations) : 1500;
  const maxElevation = allElevations.length > 0 ? Math.max(...allElevations, trail.maxElevation || 0) : trail.maxElevation || 5000;

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

  return (
    <div data-slot="base" className="w-full">
      <FloatingMapPanel
        id="elevation-profile-window"
        title={
          <span data-slot="header" className="font-bold text-white">
            {trail.name}
          </span>
        }
        icon={<TrendingUp className="h-4 w-4" />}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40 font-mono font-bold">
            Interactive 2D/3D Altitude Profile
          </span>
        }
        onClose={onClose}
        allowDrag={true}
        allowMinimize={true}
        allowMaximize={true}
        allowClose={Boolean(onClose)}
        defaultWidth="w-full max-w-5xl mx-auto"
        className="shadow-2xl border border-accent/40 bg-neutral-950/95"
      >
      <div data-slot="body" className="space-y-3">
          {/* Active Hover / Landmark Scrubber Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-neutral-900/80 border border-accent/30 rounded-xl text-xs backdrop-blur-md">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent animate-pulse" />
              {hoveredDataPoint ? (
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white">{hoveredDataPoint.label}</span>
                  {hoveredDataPoint.lat && hoveredDataPoint.lng && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({hoveredDataPoint.lat.toFixed(4)}°N, {hoveredDataPoint.lng.toFixed(4)}°E)
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-[11px] font-mono">
                  Hover along graph to scrub 2D Leaflet pin & 3D Cesium camera
                </span>
              )}
            </div>

            {hoveredDataPoint && (
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span>
                  Distance: <strong className="text-accent">{hoveredDataPoint.distanceKm} km</strong>
                </span>
                <span>
                  Altitude: <strong className="text-amber-400">{hoveredDataPoint.elevation.toLocaleString()}m</strong>
                </span>
              </div>
            )}
          </div>

          {/* Recharts Elevation Canvas */}
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
                  {landmarkMarkers.map((lm) => (
                    <ReferenceDot
                      key={lm.id}
                      x={lm.distanceKm}
                      y={lm.elevation}
                      r={6}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="cursor-pointer transition-all hover:scale-125"
                      onClick={() => handleLandmarkBadgeClick(lm)}
                    />
                  ))}

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

          {/* 3. ROUTE LANDMARK CHECKPOINTS INTERACTIVE CHIPS */}
          {landmarkMarkers.length > 0 && (
            <div data-slot="footer" className="pt-2 border-t border-border/30 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-accent flex items-center gap-1">
                <Mountain className="h-3.5 w-3.5 text-accent" />
                <span>Route Landmarks:</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {landmarkMarkers.map((lm) => {
                  const isSelected = selectedLandmarkId === lm.id;
                  return (
                    <button
                      key={lm.id}
                      onClick={() => handleLandmarkBadgeClick(lm)}
                      data-slot="landmark-pill"
                      data-selected={isSelected}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-accent text-accent-foreground border-accent shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-neutral-900/90 text-gray-300 border-border/40 hover:border-accent/60 hover:text-white'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                    >
                      <span>🏔️ {lm.name}</span>
                      <span className="text-[10px] font-mono opacity-80">{lm.elevation}m</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </FloatingMapPanel>
    </div>
  );
}

function CustomRechartsTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as ChartDataPoint;
    return (
      <div
        data-slot="tooltip"
        className="backdrop-blur-2xl bg-neutral-950/95 border border-accent/50 shadow-2xl rounded-xl p-3 text-white text-xs space-y-1.5 max-w-xs"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
          <span className="font-extrabold text-accent">{item.label}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
            {item.distanceKm} km
          </span>
        </div>
        <p className="text-base font-mono font-extrabold text-amber-300">{item.elevation.toLocaleString()} m</p>
        {item.lat && item.lng && (
          <p className="text-[10px] text-gray-400 font-mono">
            GPS: {item.lat.toFixed(4)}°N, {item.lng.toFixed(4)}°E
          </p>
        )}
        <div className="pt-1 border-t border-white/10 flex items-center gap-1 text-[10px] text-accent">
          <Sparkles className="h-3 w-3" />
          <span>Click to focus 2D & 3D map camera</span>
        </div>
      </div>
    );
  }
  return null;
}
