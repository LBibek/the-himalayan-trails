'use client';

import React, { useState } from 'react';
import { Mountain, TrendingUp, Gauge, Info, ChevronDown, ChevronUp, MapPin, Sparkles } from 'lucide-react';
import { PlannerWaypoint, ACTIVITY_CONFIG } from '@/types/planner';

export interface PlannerElevationChartProps {
  waypoints: PlannerWaypoint[];
  activeDayIndex: number | null;
  hoveredDayIndex: number | null;
  onSelectDayIndex: (index: number) => void;
  onHoverDayIndex: (index: number | null) => void;
}

export default function PlannerElevationChart({
  waypoints,
  activeDayIndex,
  hoveredDayIndex,
  onSelectDayIndex,
  onHoverDayIndex
}: PlannerElevationChartProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!waypoints || waypoints.length === 0) return null;

  // Calculate cumulative distances for points
  let cumulativeDist = 0;
  const points = waypoints.map((wp, idx) => {
    if (idx > 0) cumulativeDist += wp.distanceKm;
    return {
      dayIndex: idx,
      day: wp.day,
      title: wp.title,
      distanceKm: cumulativeDist,
      elevation: wp.sleepingAltitude,
      activityType: wp.activityType
    };
  });

  const maxElev = Math.max(...points.map((p) => p.elevation), 3000);
  const minElev = Math.min(...points.map((p) => p.elevation), 2000);
  const maxDist = cumulativeDist || 1;

  // SVG Canvas Dimensions
  const svgWidth = 900;
  const svgHeight = 180;
  const paddingX = 50;
  const paddingY = 30;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  // SVG coordinate transformation helpers
  const getX = (dist: number) => paddingX + (dist / maxDist) * chartW;
  const getY = (elev: number) => paddingY + chartH - ((elev - Math.min(minElev, 1000)) / (maxElev - Math.min(minElev, 1000) + 400)) * chartH;

  // Generate SVG polyline path string
  const pathD = points.reduce((acc, pt, idx) => {
    const x = getX(pt.distanceKm);
    const y = getY(pt.elevation);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Area path string for linear gradient fill under line
  const firstX = getX(points[0].distanceKm);
  const lastX = getX(points[points.length - 1].distanceKm);
  const bottomY = paddingY + chartH;
  const areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  // Find currently highlighted day (either hovered or selected)
  const highlightedIdx = hoveredDayIndex !== null ? hoveredDayIndex : activeDayIndex;
  const activePt = highlightedIdx !== null && points[highlightedIdx] ? points[highlightedIdx] : null;

  return (
    <div className="w-full rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">
      
      {/* 1. GLASSMORPHIC HEADER HUD TOOLBAR */}
      <div className="px-5 py-3 bg-white/5 border-b border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#B68D40] to-amber-600 text-black font-extrabold flex items-center justify-center shadow-lg shadow-[#B68D40]/20">
            <TrendingUp className="h-4 w-4 text-black" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white tracking-wider flex items-center gap-2">
              <span>Interactive Elevation Profile & Altitude Sync</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/40 font-mono font-bold">
                Synced with Map & Timeline
              </span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              Hover line chart to inspect map waypoint altitude
            </div>
          </div>
        </div>

        {/* Highlighted Day Badge indicator */}
        {activePt && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/80 border border-[#B68D40]/50 backdrop-blur-md shadow-xl text-xs">
            <span className="text-xs font-bold text-[#B68D40]">Day {activePt.day}:</span>
            <span className="font-semibold text-white truncate max-w-[200px]">{activePt.title}</span>
            <span className="font-mono font-bold text-amber-400">{activePt.elevation}m</span>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-gray-400 hover:text-white transition"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

      </div>

      {/* 2. EXPANDED SVG ALTITUDE GRAPH CANVAS */}
      {isExpanded && (
        <div className="p-4 relative">
          
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 cursor-pointer select-none"
              onMouseLeave={() => onHoverDayIndex(null)}
            >
              <defs>
                {/* Metallic Gold / Amber Gradient */}
                <linearGradient id="plannerAltitudeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B68D40" stopOpacity="0.5" />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#333333" strokeDasharray="3,3" />
              <line x1={paddingX} y1={paddingY + chartH / 2} x2={svgWidth - paddingX} y2={paddingY + chartH / 2} stroke="#262626" strokeDasharray="3,3" />
              <line x1={paddingX} y1={paddingY + chartH} x2={svgWidth - paddingX} y2={paddingY + chartH} stroke="#404040" />

              {/* Y Axis Elevation Labels */}
              <text x={paddingX - 8} y={paddingY + 4} textAnchor="end" fill="#9ca3af" fontSize="10" fontFamily="monospace">
                {maxElev}m
              </text>
              <text x={paddingX - 8} y={paddingY + chartH + 4} textAnchor="end" fill="#9ca3af" fontSize="10" fontFamily="monospace">
                {minElev}m
              </text>

              {/* Gradient Fill under Path */}
              <path d={areaD} fill="url(#plannerAltitudeGrad)" />

              {/* Altitude Profile Polyline */}
              <path
                d={pathD}
                fill="none"
                stroke="#B68D40"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {/* Day Waypoint Node Markers on Line */}
              {points.map((pt) => {
                const cx = getX(pt.distanceKm);
                const cy = getY(pt.elevation);
                const isSelected = highlightedIdx === pt.dayIndex;
                const cfg = ACTIVITY_CONFIG[pt.activityType] || ACTIVITY_CONFIG.trekking;

                return (
                  <g
                    key={pt.dayIndex}
                    onClick={() => onSelectDayIndex(pt.dayIndex)}
                    onMouseEnter={() => onHoverDayIndex(pt.dayIndex)}
                    className="cursor-pointer group"
                  >
                    {/* Hover hit target radius */}
                    <circle cx={cx} cy={cy} r="16" fill="transparent" />

                    {/* Outer Glow Ring when selected */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="10"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        className="animate-ping"
                      />
                    )}

                    {/* Main Circle Node */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? "7" : "5"}
                      fill={isSelected ? "#ffffff" : cfg.hexColor}
                      stroke={isSelected ? cfg.hexColor : "#000000"}
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />

                    {/* Day Text Label above Node */}
                    <text
                      x={cx}
                      y={cy - 12}
                      textAnchor="middle"
                      fill={isSelected ? "#f59e0b" : "#d1d5db"}
                      fontSize={isSelected ? "11" : "9"}
                      fontWeight={isSelected ? "bold" : "medium"}
                      fontFamily="monospace"
                    >
                      D{pt.day} ({pt.elevation}m)
                    </text>
                  </g>
                );
              })}

              {/* Vertical Guide Line for Highlighted Point */}
              {activePt && (
                <line
                  x1={getX(activePt.distanceKm)}
                  y1={paddingY}
                  x2={getX(activePt.distanceKm)}
                  y2={paddingY + chartH}
                  stroke="#B68D40"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  className="opacity-80"
                />
              )}

            </svg>
          </div>

          {/* Interactive Hint Legend */}
          <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-gray-400 font-mono">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#B68D40]" />
              <span>Click nodes on chart to fly map view directly to waypoint</span>
            </div>
            <div>
              Total Distance: <strong className="text-white">{cumulativeDist} km</strong>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
