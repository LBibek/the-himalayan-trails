# The Himalayan Trails — System Design & Sequential Thinking Rules

> **MANDATORY CONTEXT FOR AGENTS & SEQUENTIAL THINKING WORKFLOWS**
> This file defines the strict visual design standards, interactive component synchronization rules, Tailwind CSS conventions, and Sequential Thinking step-by-step traits for **The Himalayan Trails** codebase.
> All agents and developers must consult and update these rules whenever introducing new UI components or workflows.

---

## 1. Visual Design Architecture & Glassmorphism Rules

### A. Color Palette & Brand Tokens
- **Primary Accent**: Metallic Gold (`#B68D40`, hover `#c99e4b`, highlight `#E2C085`).
- **Dark Himalayan Theme**: Deep slate/neutral night canvas (`bg-black`, `bg-neutral-950`, `bg-neutral-900`).
- **Status & Activity Badges**:
  - 🥾 **Trekking / Hiking**: Emerald (`#10b981`, `bg-emerald-600`, `border-emerald-400`)
  - 🧘 **Acclimatization Rest**: Cyan (`#06b6d4`, `bg-cyan-600`, `border-cyan-300`)
  - 🏔️ **High Pass / Summit**: Metallic Gold (`#B68D40`, `bg-[#B68D40]`, `border-[#E2C085]`)
  - 🚁 **Flight / Helipad**: Purple (`#a855f7`, `bg-purple-600`, `border-purple-300`)
  - ⛺ **High Camp / Lodge**: Orange (`#f97316`, `bg-orange-600`, `border-orange-300`)
  - 🛕 **Monastery / Shrine**: Rose / Red (`#e11d48`, `bg-red-600`, `border-red-400`)

### B. Glassmorphism Design Token Standard
Every card, HUD overlay, toolbar, and modal MUST utilize glassmorphism styling:
- **Background**: `bg-black/60` or `bg-neutral-950/70`
- **Backdrop Filter**: `backdrop-blur-xl` or `backdrop-blur-md`
- **Border**: Translucent crisp border (`border border-white/10` or `border-[#B68D40]/30`)
- **Shadow**: `shadow-2xl` or `shadow-amber-500/10`

---

## 2. Tailwind CSS & Responsive Layout Rules

- **Utility Framework**: Exclusively use **Tailwind CSS v4** utility classes (`@import "tailwindcss";` in `globals.css`).
- **Breakpoint Hierarchy**: Every layout MUST be responsive across all devices:
  - Mobile (`< 640px`): Single-column stack (`grid-cols-1`, `flex-col`, mobile menu drawer).
  - Tablet (`sm: / md:`): 2-column grid (`md:grid-cols-2`), split control HUDs.
  - Desktop (`lg: / xl:`): 3-column / 12-column split views (`lg:grid-cols-12`), side-by-side interactive map and timeline.
- **Micro-Interactions**: All clickable elements MUST include hover/focus effects (`hover:scale-105`, `hover:border-amber-400/50`, `transition-all duration-200`).

---

## 3. Bidirectional Component Synchronization Rules

Every map feature page (such as `/map`, `/explore`, `/itinerary/planner`) MUST enforce 3-way synchronization:

1. **Map Marker ↔ Timeline Card ↔ Altitude Line Chart**:
   - **Hover Event**: Hovering over a Map Marker, Timeline Card, or Elevation Line Chart node MUST set `hoveredDayIndex` and visually highlight all 3 elements simultaneously.
   - **Select / Click Event**: Clicking any of the 3 elements MUST set `activeDayIndex`, fly the Leaflet map view to the target coordinates, scroll/expand the timeline card, and highlight the line chart node.
   - **Interactive Dragging**: Map markers MUST support dragging (`draggable={true}`) to update trail track coordinates live in state.

2. **SSR Window Safety**:
   - Any component importing Leaflet (`leaflet`, `react-leaflet`) MUST be dynamically imported with `{ ssr: false }` or protected with a client-side mount check (`typeof window !== 'undefined'`).
   - Shared data types and static configuration MUST be isolated in `src/types/` or `src/data/` without Leaflet dependencies.

---

## 4. Sequential Thinking Traits & Execution Steps

When executing tasks or implementing features, apply the following **Sequential Thinking** workflow steps:

```
[Thought Step 1: Context Ingestion & Rule Audit]
  └── Read DESIGN_RULES.md & inspect target page components.

[Thought Step 2: Component & Schema Verification]
  └── Verify TypeScript interfaces, props, and SSR safety constraints.

[Thought Step 3: Glassmorphic UI Implementation]
  └── Apply Tailwind CSS glassmorphic tokens (backdrop-blur, border-white/10, #B68D40 accents).

[Thought Step 4: Bidirectional Sync & Interactivity Wiring]
  └── Wire up active/hover states between Map, Timeline, and Line Chart.

[Thought Step 5: Empirical Verification & Documentation Self-Update]
  └── Test endpoint with curl.exe (HTTP 200), verify runtime logs, and update DESIGN_RULES.md.
```

---

## 5. Continuous Documentation Update Protocol

- Whenever a new feature, activity category, map controller, or UI pattern is added to the codebase:
  1. Update `DESIGN_RULES.md` with the new design tokens or component contracts.
  2. Document any SSR gotchas or performance optimizations.
  3. Ensure all future Sequential Thinking iterations reference these updated standards.

---
*Last Updated: September 2026 — The Himalayan Trails Engineering Team*
