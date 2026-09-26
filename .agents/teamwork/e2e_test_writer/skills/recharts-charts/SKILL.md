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
- Prevent Next.js SSR hydration mismatches by wrapping `ResponsiveContainer` with a mounted state guard or dynamic import (`ssr: false`).

### B. Himalayan Glassmorphism Theme Integration
All charts must adopt the project's semantic Tailwind theme tokens and metallic gold aesthetic:
- **Grid Lines**: `stroke="rgba(255, 255, 255, 0.08)"` with `strokeDasharray="3 3"`.
- **Axes & Ticks**: `stroke="var(--muted-foreground, #a1a1aa)"`, `fontSize: 11`, `fontFamily: "var(--font-sans)"`.
- **Primary Line / Area**: Himalayan Gold `#B68D40` with linear gradient fill `rgba(182, 141, 64, 0.35)` fading to transparent `rgba(182, 141, 64, 0.0)`.
- **Secondary Lines**: Cyan / Glacier Blue `#38bdf8` or Emerald `#10b981`.
- **Custom Tooltip**: Render frosted glass tooltips (`backdrop-blur-xl bg-surface/90 border border-accent/40 shadow-2xl rounded-xl text-foreground text-xs p-3`).

---

## 2. 3-Way Component Synchronization (Map ↔ Chart ↔ Timeline)
Synchronized scrubbers between trail elevation charts, Leaflet 2D markers, and Cesium 3D camera viewpoints.

## 3. Mobile & Universal Responsiveness Checklist
1. Fixed Height on Containers
2. Touch Scrubber
3. Axis Decimation
4. Zero-Mock Data Rule: Always bind chart data to genuine backend API responses or database models.
