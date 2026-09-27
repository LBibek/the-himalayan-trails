# Phase 5 Technical Survey & Architecture Analysis: HeroUI, Design Tokens & Continuous Infinite Carousel (R1 & R2)

**Author**: `explorer_p5_1` (Read-only Exploration Agent)  
**Date**: 2026-09-27  
**Scope**: Architecture survey for HeroUI compound component overhaul, Tailwind contrast tokens, accessible state reflection, and the Dual-Speed Continuous Infinite Carousel (`src/components/ui/InfiniteCarousel.tsx`).

---

## Executive Summary

Phase 5 elevates **The Himalayan Trails** into a world-class luxury alpine expedition portal. This investigation surveys the codebase to establish architectural baselines, identify gaps against `.agents/rules/heroui_component_theme_rules.md`, and design the technical specifications for:
1. **R1: Complete HeroUI Component Architecture Overhaul** (Semantic slots, interaction state reflection attributes, standard contrast token pairings, and React Aria focus rings).
2. **R2: Dual-Speed Continuous Infinite Carousel** (`src/components/ui/InfiniteCarousel.tsx` with GPU-accelerated CSS marquee, mirrored buffer arrays, speed/direction control, and mixed route/service card models).

The project currently has 75 passing integration tests and zero TypeScript errors (`npx tsc --noEmit`). However, interactive state reflection (`data-focus-visible`, `data-pressed`), semantic token pairing discipline (e.g. mixing `bg-[#B68D40] text-black` instead of `bg-accent text-accent-foreground`), and keyboard focus rings are inconsistent or missing across major views.

---

## 1. Survey of Existing UI Components (`src/components/ui/`)

The directory `src/components/ui/` currently contains 4 components:

| Component | Semantic Slots (`data-slot`) | Compound Subcomponents | State Reflection (`data-*`) | Token Pairing Adherence | Focus Ring Styling |
|---|---|---|---|---|---|
| `GlassCard.tsx` | `base`, `highlight`, `content`, `header`, `body`, `footer` | Yes (`Header`, `Body`, `Footer`) | `data-hovered` (via state) | Excellent: `bg-surface/70 text-surface-foreground`, `border-border/40`, `border-accent/40` | Missing: No keyboard focus support (`tabIndex`, `role="button"`, `focus-visible:ring-2`) |
| `GlassBadge.tsx` | `badge`, `indicator`, `content` | No | None | Partial: Gold variant uses `bg-accent/15 text-accent`, but emerald/cyan use ad-hoc Tailwind colors | Static component; no focus rings needed |
| `FloatingMapPanel.tsx` | `base`, `header`, `drag-handle`, `title`, `controls`, `minimize-btn`, `maximize-btn`, `close-btn`, `body`, `resize-handle` | No (monolithic props-based) | `data-minimized`, `data-maximized`, `data-dragging`, `data-resizing` | Deficient: Hardcoded `bg-slate-950/80 text-slate-100`, `bg-slate-900/60`, `border-slate-800/80` | Non-standard: uses `focus-visible:ring-amber-500` instead of `focus-visible:ring-focus` / `#B68D40` |
| `ElevationProfileChart.tsx` | `base`, `header`, `content`, `chart-skeleton`, `chart-empty`, `tooltip` | No | None | Good: `bg-surface/75 text-surface-foreground`, `border-border/40`, `text-accent` | Good on hover/selection points |

### Detailed Deficiencies in `src/components/ui/`:
1. **`GlassBadge.tsx`**: Uses `data-slot="badge"` on the root element. HeroUI rules mandate `data-slot="base"` on all component root containers.
2. **`GlassCard.tsx`**: When `variant="interactive"`, it adds cursor styling and GSAP scale animations on hover, but does not provide keyboard accessibility (`tabIndex={0}`, `role="button"`, `onKeyDown`), does not set `data-pressed` on pointer down, and does not provide focus rings or `data-focus-visible`.
3. **`FloatingMapPanel.tsx`**: Uses slate palette (`bg-slate-950`, `bg-slate-900`) and amber (`ring-amber-500`) instead of semantic tokens (`bg-surface`, `text-surface-foreground`, `border-border`, `focus-visible:ring-focus`).
4. **Missing UI Primitives**: No generic `GlassButton`, `GlassInput`, or `InfiniteCarousel` exists yet in `src/components/ui/`.

---

## 2. Interactive State Reflection & Accessible Focus Rings

### A. State Reflection Attributes Status
- **`data-hovered`**: Found in only 3 files: `GlassCard.tsx` (line 126), `PlannerElevationChart.tsx` (line 262), and `itinerary/planner/page.tsx` (line 117). Missing across `Navbar.tsx`, `page.tsx`, and button triggers.
- **`data-pressed`**: Found in only 3 files: `CesiumGlobeMap.tsx` (line 390), `DroneFlightConsole.tsx` (line 170), and `trails/[id]/page.tsx` (line 674). Completely missing from all card clicks, menu toggles, and form actions.
- **`data-focus-visible`**: **0 occurrences across the entire codebase**. Not a single component reflects focus-visible via data attributes.
- **`data-disabled`**: Not implemented on form buttons when `disabled={true}`.

### B. Keyboard Focus Ring Auditing
HeroUI standards require:
```css
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background
```
(where `var(--focus)` is `#B68D40`).

- **Current State**:
  - `src/components/layout/Navbar.tsx`: 0 focus rings on desktop links, logo link, or signup CTA. Mobile toggle uses `focus:ring-[#B68D40]/50` which triggers on mouse click rather than `focus-visible`.
  - `src/app/page.tsx`: 0 focus rings on hero CTA buttons, feature directory cards, or footer links.
  - `src/components/explorer/UnifiedDiscoveryHub.tsx`: Trail switcher HUD buttons (`#trail-switcher-hud`, lines 896-908) have no focus rings.
- **Recommendation for R1**: Standardize a shared focus ring utility or class pattern:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background`

---

## 3. Tailwind Contrast Token System & Palette Analysis

### A. Token Configuration (`src/app/globals.css`)
Tailwind CSS v4 is used with `@theme inline`:
- `background`: `#050505` / `foreground`: `#f5f5f5`
- `surface`: `#0e0e0e` / `surface-foreground`: `#f5f5f5`
- `overlay`: `#141414` / `overlay-foreground`: `#f5f5f5`
- `muted`: `#1c1c1f` / `muted-foreground`: `#a1a1aa`
- `accent`: `#B68D40` (Himalayan Gold) / `accent-foreground`: `#050505`
- `default`: `#262626` / `default-foreground`: `#f5f5f5`
- `border`: `rgba(255, 255, 255, 0.1)`
- `separator`: `rgba(255, 255, 255, 0.08)`
- `focus`: `#B68D40`
- `radius`: `0.75rem`

### B. Contrast Pairing Violations
`.agents/rules/heroui_component_theme_rules.md` Section 2.B states:
> **RULE**: Never use a background token without its corresponding `-foreground` token.
> - Correct: `bg-accent text-accent-foreground`
> - Correct: `bg-surface text-surface-foreground`
> - Incorrect: `bg-accent text-white`

Widespread violations found in current code:
1. `bg-[#B68D40] text-black` instead of `bg-accent text-accent-foreground` (found in `Navbar.tsx`, `page.tsx`, `trails/[id]/page.tsx`, `Footer.tsx`).
2. `bg-black/90 text-white` or `bg-neutral-950 text-white` instead of `bg-surface/90 text-surface-foreground` or `bg-background text-foreground`.
3. `border-[#B68D40]/40` instead of `border-accent/40`.
4. `text-[#B68D40]` instead of `text-accent`.

Refactoring to strict semantic tokens guarantees theme consistency, high contrast compliance (APCA / WCAG AA 4.5:1), and simplified maintenance.

---

## 4. Architecture Specification for `src/components/ui/InfiniteCarousel.tsx` (R2)

### A. Core Architecture & Seamless Continuous Animation
To achieve **zero seam, zero jump, and 60fps GPU acceleration**:
1. **Marquee Mechanics**:
   - Container: `overflow-hidden relative w-full select-none`.
   - Gradient Fade Edges: Left and right edge masks (`pointer-events-none absolute inset-y-0 w-24 z-20 bg-gradient-to-r from-background to-transparent` and right reverse).
   - Inner Flex Track: Contains two identical cloned tracks rendered side by side:
     - Track 1 (Primary): `flex shrink-0 gap-6 items-center will-change-transform`
     - Track 2 (Cloned Buffer): `flex shrink-0 gap-6 items-center will-change-transform` with `aria-hidden="true"`.
   - Continuous Movement:
     Both tracks translate simultaneously using CSS `translate3d(0, 0, 0)` to `translate3d(-100%, 0, 0)` for `direction="left"`.
     Because Track 2 is an exact duplicate placed right behind Track 1 with the identical `gap-6` spacing, the moment Track 1 finishes translating `-100%`, it loops back to `0%` seamlessly with zero jump or stutter.
2. **Hardware Acceleration**:
   - `will-change: transform; transform: translate3d(0, 0, 0);`
   - Keyframe definitions:
     ```css
     @keyframes marquee-left {
       0% { transform: translate3d(0, 0, 0); }
       100% { transform: translate3d(-100%, 0, 0); }
     }
     @keyframes marquee-right {
       0% { transform: translate3d(-100%, 0, 0); }
       100% { transform: translate3d(0, 0, 0); }
     }
     ```
3. **Speed Controls**:
   - `speed="fast"`: `25s`
   - `speed="normal"`: `45s`
   - `speed="slow"`: `75s`
4. **Pause Interactivity**:
   - Pause on hover: Mouse enter/leave toggles `animationPlayState: 'paused' | 'running'` and updates `data-hovered="true"`.
   - Pause on touch: Touch start/end toggles `animationPlayState: 'paused'` and updates `data-pressed="true"`.
   - Pause on keyboard focus: Focus into any card pauses the marquee so keyboard navigators can inspect cards without motion sickness.

### B. Mixed Card Domain Modeling
The carousel must intersperse **Top Himalayan Expedition Routes** and **High-Altitude Alpine Services**:

```typescript
export type CarouselRouteCard = {
  kind: 'route';
  id: string;
  name: string;
  region: string;
  maxElevation: number; // e.g. 5364
  distanceKm: number;   // e.g. 130
  durationDays: number; // e.g. 14
  difficulty: 'Moderate' | 'Strenuous' | 'Challenging' | 'Extreme';
  image: string;
  highlights: string[];
  slug: string;
};

export type CarouselServiceCard = {
  kind: 'service';
  id: string;
  title: string;
  category: string;
  highlightBadge: string;
  badgeVariant?: 'gold' | 'emerald' | 'blue';
  description: string;
  ctaText: string;
  ctaHref: string;
  iconName: 'Compass' | 'Calendar' | 'ShieldCheck' | 'PhoneCall' | 'FileText';
  emergencyHotline?: string;
};

export type CarouselItem = CarouselRouteCard | CarouselServiceCard;
```

#### Mixed Catalog Content (Seed Alignment):
1. **Route**: Everest Base Camp Trek (5,364m, 130km, 14d, Strenuous)
2. **Service**: Guided Alpine Expeditions (IFMGA Sherpa leaders, oxygen logistics, summit pushes)
3. **Route**: Annapurna Circuit & Thorong La (5,416m, 160km, 16d, Strenuous)
4. **Service**: Helicopter Rescue & High-Altitude Evac (24/7 Garmin inReach dispatch, emergency hotline `+977-1-4700000`)
5. **Route**: Manaslu Circuit Trek (5,106m, 177km, 14d, Challenging)
6. **Service**: Custom 3D Itinerary Planning (Day-by-day altitude pacing, GPX export, acclimatization)
7. **Route**: Langtang Valley & Kyanjin Ri (4,773m, 77km, 8d, Moderate)
8. **Service**: Sherpa & Porter Logistics (Fair-wage porters, gear transport, teahouse reservations)
9. **Route**: Upper Mustang Forbidden Kingdom (3,840m, 125km, 12d, Moderate)
10. **Service**: Conservation Permits & TIMS Passes (National park entry, restricted area permits)

### C. Responsive Card Sizing & HeroUI Glassmorphism
- **Card Sizing**:
  - Mobile (375px+): `w-[280px] shrink-0`
  - Tablet/Desktop: `w-[340px] sm:w-[380px] shrink-0`
- **HeroUI Slot Structure**:
  ```tsx
  <div data-slot="base" className="w-[340px] shrink-0 rounded-3xl backdrop-blur-xl bg-surface/75 border border-border/40 hover:border-accent/60 text-surface-foreground p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group">
    <div data-slot="header" className="flex items-center justify-between pb-3 border-b border-border/30">
      <div data-slot="indicator">...</div>
      <GlassBadge variant="gold">...</GlassBadge>
    </div>
    <div data-slot="body" className="py-3">
      <h3 data-slot="label" className="font-bold text-base text-foreground group-hover:text-accent transition-colors">...</h3>
      <p data-slot="description" className="text-xs text-muted-foreground mt-1">...</p>
    </div>
    <div data-slot="footer" className="pt-3 border-t border-border/30 flex items-center justify-between">
      ...
    </div>
  </div>
  ```

---

## 5. Dual-Speed Configuration on Home Page (`src/app/page.tsx`)

To fulfill the "Dual-Speed Continuous Infinite Carousel" requirement:
- **Layer 1 (Upper Marquee)**:
  - `direction="left"`, `speed="normal"` (45s)
  - Features the mixed route & expedition cards.
- **Layer 2 (Lower Marquee)**:
  - `direction="right"`, `speed="slow"` (70s) or `speed="fast"` (25s)
  - Features high-altitude services, alpine credentials, safety advisories, and regional expedition highlights.
- This creates an immersive, counter-rotating luxury alpine showcase directly beneath the Hero section.

---

## 6. Recommendations for Downstream Agents

1. **For `coder_p5_1` (R1 & R2 Implementation)**:
   - Create `src/components/ui/InfiniteCarousel.tsx` with compound structure (`InfiniteCarousel`, `InfiniteCarousel.RouteCard`, `InfiniteCarousel.ServiceCard`).
   - Add `@keyframes marquee-left` and `@keyframes marquee-right` to `src/app/globals.css`.
   - Update `src/components/ui/GlassBadge.tsx` to include `data-slot="base"`.
   - Enhance `src/components/ui/GlassCard.tsx` with accessible keyboard focus ring and state attributes.
   - Refactor `Navbar.tsx` and `page.tsx` buttons to use `focus-visible:ring-2 focus-visible:ring-[#B68D40]`.
2. **For `coder_p5_2` (R3, R4, R5 Implementation)**:
   - Build the 5 core alpine frosted-glass service cards on `page.tsx`.
   - Implement the embedded interactive Leaflet map canvas on `page.tsx` with region selector tabs.
   - Upgrade `Navbar.tsx` on `< 768px` to the full-page luxury frosted-glass overlay.
   - Fix `#trail-switcher-hud` in `UnifiedDiscoveryHub.tsx` to show unique trail names and max altitudes (zero duplicate region names).
3. **For `tester_p5` (Verification)**:
   - Add Phase 5 integration tests in `tests/integration.test.mjs` verifying:
     - `InfiniteCarousel.tsx` existence and slots (`data-slot="base"`, `data-slot="track"`, pause-on-hover).
     - HeroUI compound slots and theme tokens across `Navbar.tsx` and `page.tsx`.
     - 5 Core Alpine Services cards on `page.tsx`.
     - Embedded home page map region selector.
     - Full-page mobile navigation overlay structure.
     - Trail Selector HUD deduplication.
