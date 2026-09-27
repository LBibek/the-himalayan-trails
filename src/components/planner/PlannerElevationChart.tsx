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
import { TrendingUp, ChevronDown, ChevronUp, Sparkles, MapPin, Compass, Mountain, Route, CheckCircle } from 'lucide-react';
import { PlannerWaypoint, ACTIVITY_CONFIG } from '@/types/planner';

export interface ElevationProfilePoint {
  distanceKm: number;
  elevation: number;
  label?: string;
  lat?: number;
  lng?: number;
}

export interface GpxTelemetryData {
  totalDistanceKm?: number;
  minElevationM?: number;
  maxElevationM?: number;
  elevationGainM?: number;
  elevationLossM?: number;
  trackpointCount?: number;
  fileName?: string;
  routeName?: string;
}

export interface PlannerElevationChartProps {
  waypoints: PlannerWaypoint[];
  activeDayIndex: number | null;
  hoveredDayIndex: number | null;
  onSelectDayIndex: (index: number) => void;
  onHoverDayIndex: (index: number | null) => void;
  gpxElevationProfile?: ElevationProfilePoint[];
  gpxTelemetry?: GpxTelemetryData | null;
}

interface ChartDataPoint {
  distanceKm: number;
  elevation: number;
  label?: string;
  lat?: number;
  lng?: number;
  isWaypoint?: boolean;
  dayIndex?: number;
  day?: number;
  title?: string;
  activityType?: string;
  notes?: string;
  altitudeGain?: number;
}

interface WaypointMarkerPoint {
  dayIndex: number;
  day: number;
  title: string;
  distanceKm: number;
  elevation: number;
  activityType: string;
  lat: number;
  lng: number;
  notes?: string;
  altitudeGain: number;
}

export default function PlannerElevationChart({
  waypoints,
  activeDayIndex,
  hoveredDayIndex,
  onSelectDayIndex,
  onHoverDayIndex,
  gpxElevationProfile,
  gpxTelemetry,
}: PlannerElevationChartProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute waypoint positions along the route
  const waypointMarkers: WaypointMarkerPoint[] = useMemo(() => {
    if (!waypoints || waypoints.length === 0) return [];

    let cumDist = 0;
    return waypoints.map((wp, idx) => {
      if (idx > 0) cumDist += wp.distanceKm;

      // If we have a GPX profile with coordinates, try to find the closest match along the GPX track
      let matchedDist = cumDist;
      let matchedElev = wp.sleepingAltitude;

      if (gpxElevationProfile && gpxElevationProfile.length > 0 && wp.coordinates) {
        let bestDistSq = Infinity;
        let closestPt: ElevationProfilePoint | null = null;

        for (const pt of gpxElevationProfile) {
          if (pt.lat !== undefined && pt.lng !== undefined) {
            const dLat = pt.lat - wp.coordinates.lat;
            const dLng = pt.lng - wp.coordinates.lng;
            const distSq = dLat * dLat + dLng * dLng;
            if (distSq < bestDistSq) {
              bestDistSq = distSq;
              closestPt = pt;
            }
          }
        }

        // If matched within reasonable proximity (~5km in coordinate delta approx 0.05 deg)
        if (closestPt && bestDistSq < 0.005) {
          matchedDist = Math.round(closestPt.distanceKm * 10) / 10;
        }
      }

      return {
        dayIndex: idx,
        day: wp.day,
        title: wp.title,
        distanceKm: matchedDist,
        elevation: matchedElev,
        activityType: wp.activityType,
        lat: wp.coordinates.lat,
        lng: wp.coordinates.lng,
        notes: wp.notes,
        altitudeGain: wp.altitudeGain,
      };
    });
  }, [waypoints, gpxElevationProfile]);

  // Construct continuous chart curve data:
  // Prefer high-density GPX profile if available from upload or connected expedition
  const { chartData, isGpxActive } = useMemo(() => {
    if (gpxElevationProfile && gpxElevationProfile.length > 1) {
      // Sort GPX points by distance
      const sorted = [...gpxElevationProfile].sort((a, b) => a.distanceKm - b.distanceKm);

      // If points are sparse (< 20), interpolate between them for natural smooth terrain rendering
      let fullProfile: ElevationProfilePoint[] = [];
      if (sorted.length < 20) {
        for (let i = 0; i < sorted.length - 1; i++) {
          const p1 = sorted[i];
          const p2 = sorted[i + 1];
          fullProfile.push(p1);

          const stepCount = Math.max(2, Math.round((p2.distanceKm - p1.distanceKm) * 2));
          for (let s = 1; s < stepCount; s++) {
            const t = s / stepCount;
            // Smooth sinusoidal hill interpolation between known survey stations
            const tSmooth = (1 - Math.cos(t * Math.PI)) / 2;
            const interpDist = Math.round((p1.distanceKm + (p2.distanceKm - p1.distanceKm) * t) * 10) / 10;
            const interpElev = Math.round(p1.elevation + (p2.elevation - p1.elevation) * tSmooth);
            fullProfile.push({
              distanceKm: interpDist,
              elevation: interpElev,
              lat: p1.lat !== undefined && p2.lat !== undefined ? p1.lat + (p2.lat - p1.lat) * t : undefined,
              lng: p1.lng !== undefined && p2.lng !== undefined ? p1.lng + (p2.lng - p1.lng) * t : undefined,
            });
          }
        }
        fullProfile.push(sorted[sorted.length - 1]);
      } else {
        fullProfile = sorted;
      }

      // Map to ChartDataPoints and tag any points that align with waypoints
      const mapped: ChartDataPoint[] = fullProfile.map((pt) => {
        // Check if there is an itinerary waypoint near this distance
        const nearestWp = waypointMarkers.find((wm) => Math.abs(wm.distanceKm - pt.distanceKm) <= 0.8);
        return {
          distanceKm: Math.round(pt.distanceKm * 10) / 10,
          elevation: Math.round(pt.elevation),
          label: pt.label,
          lat: pt.lat,
          lng: pt.lng,
          isWaypoint: !!nearestWp,
          dayIndex: nearestWp?.dayIndex,
          day: nearestWp?.day,
          title: nearestWp?.title,
          activityType: nearestWp?.activityType,
          notes: nearestWp?.notes,
          altitudeGain: nearestWp?.altitudeGain,
        };
      });

      return { chartData: mapped, isGpxActive: true };
    }

    // Fallback: If no GPX profile is uploaded, build interpolated terrain from waypoints
    let cumDist = 0;
    const basePts: { dist: number; elev: number; wp: WaypointMarkerPoint }[] = waypointMarkers.map((w, idx) => {
      return { dist: w.distanceKm, elev: w.elevation, wp: w };
    });

    const fallbackPoints: ChartDataPoint[] = [];
    for (let i = 0; i < basePts.length; i++) {
      const cur = basePts[i];
      fallbackPoints.push({
        distanceKm: cur.dist,
        elevation: cur.elev,
        label: cur.wp.title,
        lat: cur.wp.lat,
        lng: cur.wp.lng,
        isWaypoint: true,
        dayIndex: cur.wp.dayIndex,
        day: cur.wp.day,
        title: cur.wp.title,
        activityType: cur.wp.activityType,
        notes: cur.wp.notes,
        altitudeGain: cur.wp.altitudeGain,
      });

      // Add gentle terrain variations between days
      if (i < basePts.length - 1) {
        const next = basePts[i + 1];
        const segDist = next.dist - cur.dist;
        const subSteps = Math.max(2, Math.round(segDist / 4));
        for (let s = 1; s < subSteps; s++) {
          const t = s / subSteps;
          const tCurve = (1 - Math.cos(t * Math.PI)) / 2;
          const undulatingTerrain = Math.sin(t * Math.PI) * 45; // Subtle natural mountain crest
          fallbackPoints.push({
            distanceKm: Math.round((cur.dist + segDist * t) * 10) / 10,
            elevation: Math.round(cur.elev + (next.elev - cur.elev) * tCurve + undulatingTerrain),
          });
        }
      }
    }

    return { chartData: fallbackPoints, isGpxActive: false };
  }, [gpxElevationProfile, waypointMarkers]);

  if (!waypoints || waypoints.length === 0) return null;

  // Telemetry Metrics (Derived from GPX if active, else from waypoints)
  const maxElev = gpxTelemetry?.maxElevationM || Math.max(...chartData.map((p) => p.elevation), ...waypoints.map((w) => w.sleepingAltitude), 3000);
  const minElev = gpxTelemetry?.minElevationM || Math.min(...chartData.map((p) => p.elevation), ...waypoints.map((w) => w.sleepingAltitude), 1500);
  const totalAscent = gpxTelemetry?.elevationGainM || waypoints.reduce((acc, w) => acc + (w.altitudeGain > 0 ? w.altitudeGain : 0), 0);
  const totalDistance = gpxTelemetry?.totalDistanceKm || (chartData.length > 0 ? chartData[chartData.length - 1].distanceKm : waypoints.reduce((acc, w) => acc + w.distanceKm, 0));

  const highlightedIdx = hoveredDayIndex !== null ? hoveredDayIndex : activeDayIndex;
  const activeWp = highlightedIdx !== null && waypointMarkers[highlightedIdx] ? waypointMarkers[highlightedIdx] : null;

  const handleMouseMove = (state: any) => {
    if (state && state.activePayload && state.activePayload.length) {
      const pt = state.activePayload[0].payload as ChartDataPoint;
      if (pt.dayIndex !== undefined) {
        onHoverDayIndex(pt.dayIndex);
      }
    }
  };

  const handleMouseLeave = () => {
    onHoverDayIndex(null);
  };

  const handleClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length) {
      const pt = state.activePayload[0].payload as ChartDataPoint;
      if (pt.dayIndex !== undefined) {
        onSelectDayIndex(pt.dayIndex);
      } else {
        // Find nearest waypoint to clicked distance
        let nearestWpIdx = 0;
        let minDistDiff = Infinity;
        waypointMarkers.forEach((wm) => {
          const diff = Math.abs(wm.distanceKm - pt.distanceKm);
          if (diff < minDistDiff) {
            minDistDiff = diff;
            nearestWpIdx = wm.dayIndex;
          }
        });
        onSelectDayIndex(nearestWpIdx);
      }
    }
  };

  return (
    <div
      data-slot="base"
      className="w-full rounded-3xl bg-neutral-950/90 border border-border/40 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300 text-foreground"
    >
      {/* 1. GLASSMORPHIC HEADER HUD TOOLBAR */}
      <div
        data-slot="header"
        className="px-5 py-3.5 bg-black/80 border-b border-border/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#B68D40] to-amber-600 text-black font-extrabold flex items-center justify-center shadow-lg shadow-amber-500/20">
            <TrendingUp className="h-4 w-4 text-black" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white tracking-wider flex items-center gap-2">
              <span>Interactive Recharts Altitude Profile</span>
              {isGpxActive ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>GPX Data Info Active ({chartData.length} pts)</span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/40 font-mono font-bold">
                  Synced with 2D/3D Map &amp; Timeline
                </span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {isGpxActive
                ? `High-resolution GPX topography from ${gpxTelemetry?.fileName || gpxTelemetry?.routeName || 'route track'}`
                : 'Hover along altitude curve or click waypoint markers to focus map and timeline'}
            </div>
          </div>
        </div>

        {/* Quick Route Elevation Badges */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-muted-foreground border-l border-border/40 pl-4">
          <span>
            Apex: <strong className="text-amber-400">{maxElev.toLocaleString()}m</strong>
          </span>
          <span>
            Min: <strong className="text-emerald-400">{minElev.toLocaleString()}m</strong>
          </span>
          <span>
            Total Climb: <strong className="text-cyan-400">+{totalAscent.toLocaleString()}m</strong>
          </span>
          <span>
            Distance: <strong className="text-[#B68D40]">{totalDistance} km</strong>
          </span>
        </div>

        {/* Highlighted Active Point Indicator */}
        {activeWp && (
          <div
            data-slot="indicator"
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-black/90 border border-[#B68D40]/60 backdrop-blur-md shadow-xl text-xs animate-in fade-in"
          >
            <span className="text-xs font-bold text-[#B68D40]">Day {activeWp.day}:</span>
            <span className="font-semibold text-white truncate max-w-[180px]">{activeWp.title}</span>
            <span className="font-mono font-bold text-amber-400">{activeWp.elevation.toLocaleString()}m</span>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          data-slot="trigger"
          className="p-1.5 rounded-xl bg-neutral-900 border border-border/40 text-muted-foreground hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          title={isExpanded ? 'Collapse Profile' : 'Expand Profile'}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* 2. RECHARTS EXPANDED AREA GRAPH CANVAS */}
      {isExpanded && (
        <div data-slot="body" className="p-4 space-y-3">
          <div data-slot="content" className="w-full h-48 sm:h-56">
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
                    <linearGradient id="plannerRechartsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B68D40" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#B68D40" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(255, 255, 255, 0.07)" strokeDasharray="3 3" vertical={false} />

                  <XAxis
                    dataKey="distanceKm"
                    type="number"
                    domain={[0, 'dataMax']}
                    unit=" km"
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  />
                  <YAxis
                    dataKey="elevation"
                    unit="m"
                    domain={[Math.max(0, minElev - 150), maxElev + 150]}
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip content={<CustomPlannerTooltip />} />

                  {/* Active Day Vertical Reference Line */}
                  {activeWp && (
                    <ReferenceLine
                      x={activeWp.distanceKm}
                      stroke="#fbbf24"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                    />
                  )}

                  {/* Interactive Reference Dots for Waypoints plotted along the elevation curve */}
                  {waypointMarkers.map((pt) => {
                    const isSelected = activeDayIndex === pt.dayIndex;
                    const isHovered = hoveredDayIndex === pt.dayIndex;
                    const isHighlighted = isSelected || isHovered;

                    return (
                      <ReferenceDot
                        key={`wp-dot-${pt.day}`}
                        x={pt.distanceKm}
                        y={pt.elevation}
                        r={isHighlighted ? 9 : 6}
                        fill={isHighlighted ? '#fbbf24' : '#B68D40'}
                        stroke="#ffffff"
                        strokeWidth={isHighlighted ? 2.5 : 1.5}
                        className="cursor-pointer transition-all hover:scale-125"
                        onClick={() => onSelectDayIndex(pt.dayIndex)}
                      />
                    );
                  })}

                  <Area
                    type="monotone"
                    dataKey="elevation"
                    stroke="#B68D40"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#plannerRechartsGrad)"
                    activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 3. WAYPOINT STEPPER PILLS FOOTER */}
          <div data-slot="footer" className="pt-2 border-t border-border/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#B68D40] mr-1 flex items-center gap-1">
                <Mountain className="h-3.5 w-3.5" />
                <span>Waypoints:</span>
              </span>
              {waypointMarkers.map((pt) => {
                const isSelected = activeDayIndex === pt.dayIndex;
                const isHovered = hoveredDayIndex === pt.dayIndex;
                const cfg = ACTIVITY_CONFIG[pt.activityType as keyof typeof ACTIVITY_CONFIG] || ACTIVITY_CONFIG.trekking;

                return (
                  <button
                    key={pt.day}
                    onClick={() => onSelectDayIndex(pt.dayIndex)}
                    onMouseEnter={() => onHoverDayIndex(pt.dayIndex)}
                    onMouseLeave={() => onHoverDayIndex(null)}
                    data-slot="trigger"
                    data-selected={isSelected}
                    data-hovered={isHovered}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected || isHovered
                        ? `${cfg.badgeBg} text-white border-white shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-[#B68D40]`
                        : 'bg-neutral-900/90 text-gray-300 border-border/40 hover:border-[#B68D40]/50 hover:text-white'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                  >
                    <span>{cfg.iconSymbol}</span>
                    <span>D{pt.day}</span>
                    <span className="text-[10px] font-mono opacity-80">{pt.elevation}m</span>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#B68D40]" />
              <span>Click point or marker on chart to focus map &amp; timeline</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomPlannerTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as ChartDataPoint;
    const isWp = item.isWaypoint && item.day !== undefined;
    const cfg = isWp && item.activityType
      ? ACTIVITY_CONFIG[item.activityType as keyof typeof ACTIVITY_CONFIG] || ACTIVITY_CONFIG.trekking
      : null;

    return (
      <div
        data-slot="tooltip"
        className="backdrop-blur-2xl bg-neutral-950/95 border border-[#B68D40]/60 shadow-2xl rounded-2xl p-3 text-white text-xs space-y-2 max-w-xs"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            {isWp ? (
              <>
                <span className="font-extrabold text-[#B68D40]">Day {item.day}</span>
                {cfg && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.badgeBg} text-white`}>
                    {cfg.label.split('/')[0]}
                  </span>
                )}
              </>
            ) : (
              <span className="font-extrabold text-cyan-400 flex items-center gap-1">
                <Route className="h-3.5 w-3.5" />
                <span>GPX Trackpoint</span>
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-gray-300">KM {item.distanceKm}</span>
        </div>

        <p className="font-bold text-white text-xs leading-snug">
          {item.title || item.label || 'Mountain Route Segment'}
        </p>

        <div className="flex items-baseline justify-between">
          <p className="text-base font-mono font-extrabold text-amber-400">{item.elevation.toLocaleString()} m</p>
          {item.altitudeGain !== undefined && (
            <span className={item.altitudeGain >= 0 ? 'text-green-400 font-mono text-[11px]' : 'text-cyan-400 font-mono text-[11px]'}>
              {item.altitudeGain >= 0 ? `+${item.altitudeGain}m` : `${item.altitudeGain}m`}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="text-[10px] text-gray-400 line-clamp-2 italic">
            {item.notes}
          </p>
        )}

        {item.lat !== undefined && item.lng !== undefined && (
          <div className="text-[10px] text-gray-500 font-mono pt-1 border-t border-white/10">
            GPS: {item.lat.toFixed(4)}°N, {item.lng.toFixed(4)}°E
          </div>
        )}
      </div>
    );
  }
  return null;
}
