---
name: recharts-charts
description: >-
  Use this skill whenever developing, styling, or refactoring data charts in The Himalayan Trails
  using the Recharts library, including elevation profiles, weather metrics, booking analytics,
  and interactive scrubbers synchronized with 2D/3D maps.
---

# Recharts Data Charts Development Guide

This skill standardizes the development of interactive, high-performance data visualizations using **Recharts** across *The Himalayan Trails*.

---

## 1. Core Principles & Architecture

### A. Next.js App Router Client Boundary
Recharts relies on direct DOM measurements and SVG rendering that require browser APIs (`window`, `ResizeObserver`, SVG bounding box).
- Always place Recharts components inside Client Components marked with `'use client';`.
- Prevent Next.js SSR hydration mismatches by wrapping `ResponsiveContainer` with a mounted state guard or dynamic import (`ssr: false`):
  ```tsx
  'use client';

  import { useState, useEffect } from 'react';
  import { ResponsiveContainer } from 'recharts';

  export function ChartWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
      return (
        <div data-slot="chart-skeleton" className="w-full h-64 rounded-2xl bg-surface/40 animate-pulse border border-border/20" />
      );
    }

    return (
      <div data-slot="chart-container" className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    );
  }
  ```

### B. Himalayan Glassmorphism Theme Integration
All charts must adopt the project's semantic Tailwind theme tokens and metallic gold aesthetic:
- **Grid Lines**: `stroke="rgba(255, 255, 255, 0.08)"` with `strokeDasharray="3 3"`.
- **Axes & Ticks**: `stroke="var(--muted-foreground, #a1a1aa)"`, `fontSize: 11`, `fontFamily: "var(--font-sans)"`.
- **Primary Line / Area**: Himalayan Gold `#B68D40` with linear gradient fill `rgba(182, 141, 64, 0.35)` fading to transparent `rgba(182, 141, 64, 0.0)`.
- **Secondary Lines**: Cyan / Glacier Blue `#38bdf8` or Emerald `#10b981`.
- **Custom Tooltip**: Render frosted glass tooltips (`backdrop-blur-xl bg-surface/90 border border-accent/40 shadow-2xl rounded-xl text-foreground text-xs p-3`).

---

## 2. 3-Way Component Synchronization (Map ↔ Chart ↔ Timeline)

One of the signature requirements of *The Himalayan Trails* is synchronized scrubbers between trail elevation charts, Leaflet 2D markers, and Cesium 3D camera viewpoints:

### Implementation Pattern:
```tsx
'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ElevationPoint {
  distanceKm: number;
  altitudeMeters: number;
  landmarkName?: string;
  lat: number;
  lng: number;
}

interface ElevationChartProps {
  data: ElevationPoint[];
  onHoverPoint?: (point: ElevationPoint | null) => void;
  onSelectPoint?: (point: ElevationPoint) => void;
  activePointIndex?: number | null;
}

export function ElevationProfileChart({
  data,
  onHoverPoint,
  onSelectPoint,
  activePointIndex,
}: ElevationChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleMouseMove = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      const point = data[state.activeTooltipIndex];
      setHoverIndex(state.activeTooltipIndex);
      onHoverPoint?.(point);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    onHoverPoint?.(null);
  };

  return (
    <div data-slot="elevation-chart" className="p-4 rounded-2xl backdrop-blur-xl bg-surface/70 border border-border/40 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-accent">
          Elevation Profile (m)
        </h4>
        <span className="text-xs text-muted-foreground font-mono">
          Max: {Math.max(...data.map((d) => d.altitudeMeters))}m
        </span>
      </div>

      <div className="w-full h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={(state: any) => {
              if (state && state.activeTooltipIndex !== undefined) {
                onSelectPoint?.(data[state.activeTooltipIndex]);
              }
            }}
          >
            <defs>
              <linearGradient id="elevationGoldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B68D40" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#B68D40" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="distanceKm"
              unit=" km"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              dataKey="altitudeMeters"
              unit="m"
              domain={['dataMin - 200', 'dataMax + 200']}
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomElevationTooltip />} />
            <Area
              type="monotone"
              dataKey="altitudeMeters"
              stroke="#B68D40"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#elevationGoldGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomElevationTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as ElevationPoint;
    return (
      <div
        data-slot="chart-tooltip"
        className="backdrop-blur-xl bg-surface/90 border border-accent/40 shadow-2xl rounded-xl p-3 text-surface-foreground"
      >
        <p className="text-xs font-semibold text-accent">{item.landmarkName || `KM ${item.distanceKm}`}</p>
        <p className="text-sm font-bold mt-0.5">{item.altitudeMeters.toLocaleString()} m</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {item.lat.toFixed(4)}°N, {item.lng.toFixed(4)}°E
        </p>
      </div>
    );
  }
  return null;
}
```

---

## 3. Reusable Chart Patterns

### A. Weather Trends Chart (Composed Temperature & Snowfall)
- Use `ComposedChart` combining a `Bar` (snowfall in cm) and `Line` (temperature in °C).
- Use dual Y-axes with `yAxisId="temp"` and `yAxisId="snow"`.

### B. Expedition & Booking Analytics Chart
- Use `BarChart` with rounded top radius `radius={[6, 6, 0, 0]}`.
- Gold gradient fill for booked capacity and muted dark fill for available capacity.

---

## 4. Mobile & Universal Responsiveness Checklist
1. [ ] **Fixed Height on Containers**: Always supply an explicit pixel height (e.g. `h-48 sm:h-64`) to the parent of `ResponsiveContainer` to avoid zero-height collapsing bugs.
2. [ ] **Touch Scrubber**: Enable `onMouseMove` and `onTouchMove` events for effortless dragging on mobile screens (375px+).
3. [ ] **Axis Decimation**: Reduce tick density on smaller viewports using `interval="preserveStartEnd"` or custom `tickFormatter`.
4. [ ] **Zero-Mock Data Rule**: Always bind chart data to genuine backend API responses or database models. Never use artificial `faker` or mock array placeholders.
