'use client';

import React, { useState } from 'react';
import { Mountain, TrendingUp, Gauge, Info, ChevronDown, ChevronUp, MapPin, X } from 'lucide-react';
import { Trail } from '@/types';

export interface ElevationPoint {
  distanceKm: number;
  elevation: number;
  label?: string;
}

export interface ElevationProfileChartProps {
  trail: Trail;
  onClose?: () => void;
}

export default function ElevationProfileChart({ trail, onClose }: ElevationProfileChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ElevationPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Fallback profile if trail doesn't have custom points
  const points: ElevationPoint[] = trail.elevationProfile || [
    { distanceKm: 0, elevation: trail.startPoint.includes('2,860') ? 2860 : 1500, label: trail.startPoint },
    { distanceKm: trail.distanceKm * 0.25, elevation: Math.round(trail.maxElevation * 0.6), label: 'Mid Way Point' },
    { distanceKm: trail.distanceKm * 0.5, elevation: Math.round(trail.maxElevation * 0.85), label: 'High Pass Approach' },
    { distanceKm: trail.distanceKm * 0.65, elevation: trail.maxElevation, label: `${trail.name} Summit / Pass` },
    { distanceKm: trail.distanceKm * 0.8, elevation: Math.round(trail.maxElevation * 0.7), label: 'Descent Valley' },
    { distanceKm: trail.distanceKm, elevation: trail.endPoint.includes('2,860') ? 2860 : 1800, label: trail.endPoint },
  ];

  const maxElev = Math.max(...points.map((p) => p.elevation), trail.maxElevation);
  const minElev = Math.min(...points.map((p) => p.elevation));
  const maxDist = Math.max(...points.map((p) => p.distanceKm), trail.distanceKm);

  // SVG Dimensions
  const svgWidth = 800;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 25;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  // Map point to SVG coordinates
  const getX = (dist: number) => paddingX + (dist / maxDist) * chartW;
  const getY = (elev: number) => paddingY + chartH - ((elev - Math.min(minElev, 500)) / (maxElev - Math.min(minElev, 500) + 500)) * chartH;

  // Generate SVG path string
  const pathD = points.reduce((acc, pt, idx) => {
    const x = getX(pt.distanceKm);
    const y = getY(pt.elevation);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Area path for gradient fill under the line
  const firstX = getX(points[0].distanceKm);
  const lastX = getX(points[points.length - 1].distanceKm);
  const bottomY = paddingY + chartH;
  const areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * svgWidth;

    // Find closest point in profile
    let closestPt = points[0];
    let minDiff = Infinity;
    points.forEach((pt) => {
      const px = getX(pt.distanceKm);
      const diff = Math.abs(px - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestPt = pt;
      }
    });

    setHoveredPoint(closestPt);
    setHoverX(svgX);
  };

  return (
    <div className="w-full bg-neutral-950/95 border-t border-neutral-800 backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom text-white">
      
      {/* DRAWER HEADER BAR */}
      <div className="px-4 py-2.5 bg-black/80 border-b border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-[#B68D40]">
            <TrendingUp className="h-4 w-4 text-[#B68D40]" />
            <span>{trail.name} — Altitude Elevation Profile</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-gray-400 text-[11px] font-mono border-l border-neutral-800 pl-3">
            <span>Max: <strong className="text-amber-400">{trail.maxElevation}m</strong></span>
            <span>Min: <strong className="text-emerald-400">{minElev}m</strong></span>
            <span>Total Ascent: <strong className="text-cyan-400">+{trail.elevationGain}m</strong></span>
            <span>Distance: <strong className="text-[#E2C085]">{trail.distanceKm} km</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800"
            title={isExpanded ? 'Collapse Profile' : 'Expand Profile'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded bg-neutral-900 text-gray-400 hover:text-red-400 border border-neutral-800"
              title="Close Profile"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* SVG EXPANDED LINE GRAPH CONTENT */}
      {isExpanded && (
        <div className="p-4 relative space-y-3">
          
          {/* Active Hover Tooltip Indicator */}
          {hoveredPoint && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border border-[#B68D40]/40 rounded-xl text-xs text-gray-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#B68D40]" />
                <span className="font-bold text-white">{hoveredPoint.label || 'Waypoint'}</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span>Distance: <strong className="text-[#B68D40]">{hoveredPoint.distanceKm} km</strong></span>
                <span>Altitude: <strong className="text-amber-400">{hoveredPoint.elevation}m</strong></span>
              </div>
            </div>
          )}

          {/* SVG Line Graph */}
          <div className="w-full overflow-x-auto relative">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-40 cursor-crosshair overflow-visible"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                setHoveredPoint(null);
                setHoverX(null);
              }}
            >
              <defs>
                {/* Metallic Gold to Dark Gradient */}
                <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B68D40" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#B68D40" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#262626" strokeDasharray="3 3" />
              <line x1={paddingX} y1={paddingY + chartH / 2} x2={svgWidth - paddingX} y2={paddingY + chartH / 2} stroke="#262626" strokeDasharray="3 3" />
              <line x1={paddingX} y1={paddingY + chartH} x2={svgWidth - paddingX} y2={paddingY + chartH} stroke="#404040" />

              {/* Elevation Area Fill */}
              <path d={areaD} fill="url(#elevationGradient)" />

              {/* Elevation Line Stroke */}
              <path d={pathD} fill="none" stroke="#B68D40" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Key Waypoint Circle Markers & Text Labels */}
              {points.map((pt, idx) => {
                const cx = getX(pt.distanceKm);
                const cy = getY(pt.elevation);
                const isHovered = hoveredPoint?.elevation === pt.elevation && hoveredPoint?.distanceKm === pt.distanceKm;

                return (
                  <g key={idx}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? "6" : "4"}
                      fill={isHovered ? "#fbbf24" : "#B68D40"}
                      stroke="#000000"
                      strokeWidth="2"
                    />
                    {pt.label && (
                      <text
                        x={cx}
                        y={cy - 10}
                        textAnchor="middle"
                        fill="#d4d4d4"
                        fontSize="9"
                        fontWeight="600"
                        className="pointer-events-none drop-shadow"
                      >
                        {pt.elevation}m
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Hover Cursor Vertical Guide Line */}
              {hoverX && (
                <line
                  x1={hoverX}
                  y1={paddingY}
                  x2={hoverX}
                  y2={paddingY + chartH}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  className="pointer-events-none"
                />
              )}
            </svg>
          </div>

        </div>
      )}

    </div>
  );
}
