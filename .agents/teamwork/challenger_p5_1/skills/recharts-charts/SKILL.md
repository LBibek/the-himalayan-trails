---
name: recharts-charts
description: >-
  Use this skill whenever developing, styling, or refactoring data charts in The Himalayan Trails
  using the Recharts library, including elevation profiles, weather metrics, booking analytics,
  and interactive scrubbers synchronized with 2D/3D maps.
---

# Recharts Data Charts Development Guide (Local Workspace Copy)

This skill standardizes the development of interactive, high-performance data visualizations using **Recharts** across *The Himalayan Trails*.

---

## 1. Core Principles & Architecture
- Recharts requires Next.js App Router Client Boundary ('use client').
- Wrap with mounted state guard or dynamic import (`ssr: false`) to avoid SSR hydration mismatches.
- Himalayan Glassmorphism Theme Integration (Tailwind theme tokens, gold `#B68D40` gradient fills, frosted glass tooltips).
- 3-Way Component Synchronization (Map <-> Chart <-> Timeline).
- Mobile & Universal Responsiveness Checklist with explicit height parent containers.
- Zero-mock policy: real persistent data bindings.
