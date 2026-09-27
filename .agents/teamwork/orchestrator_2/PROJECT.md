# Project: The Himalayan Trails — Phase 5

## Architecture
Phase 5 transforms The Himalayan Trails into a world-class luxury alpine expedition portal using HeroUI compound design principles, a dual-layer continuous infinite marquee carousel, a services- and live interactive map-centric Home page, a full-page luxury frosted-glass mobile hamburger navigation overlay, and a deduplicated trail selector HUD.

### Core Modules:
1. **HeroUI Component Architecture Overhaul (R1)**:
   - Compound semantic slots (`data-slot="base"`, `data-slot="content"`, `data-slot="header"`, `data-slot="body"`, `data-slot="footer"`, `data-slot="trigger"`, `data-slot="indicator"`).
   - Interactive state reflection attributes (`data-hovered`, `data-pressed`, `data-focus-visible`).
   - Tailwind contrast pairing discipline: `bg-surface text-surface-foreground`, `bg-accent text-accent-foreground`, `#B68D40` gold accents.
   - React Aria focus rings: `focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none`.
   - Key refactoring targets: `GlassBadge.tsx` (add root `data-slot="base"`), `GlassCard.tsx` (keyboard activation and focus states), `Navbar.tsx`, `page.tsx`.

2. **Dual-Speed Continuous Infinite Marquee Carousel (R2)**:
   - Component: `src/components/ui/InfiniteCarousel.tsx`.
   - CSS Keyframes in `src/app/globals.css`: `@keyframes marquee-left` and `@keyframes marquee-right` with GPU-accelerated `transform: translate3d(...)`.
   - Zero seam / zero jump via duplicated mirrored buffer array (`aria-hidden="true"` on duplicate track).
   - Speed controls: `speed="slow" | "normal" | "fast"` (60s, 35s, 20s).
   - Pause-on-hover (`group-hover:[animation-play-state:paused]`) and pause-on-touch event handlers.
   - Mixed card catalog: Top expedition routes (Everest Base Camp, Annapurna Circuit, Manaslu Circuit, Langtang Valley with live altitude, distance, duration) interspersed with high-altitude alpine services (Guided Expeditions, Custom 3D Itineraries, Sherpa Logistics, Heli Rescue, Conservation Permits).

3. **Services & Live Interactive Map-Centric Home Page (R3)**:
   - Redesigned `src/app/page.tsx`:
     - 5 dedicated frosted-glass service cards (`data-slot="base"`):
       1. Guided Alpine Expeditions (IFMGA Sherpa leaders, oxygen logistics, summit pushes)
       2. Custom 3D Itinerary Planning (Day-by-day altitude pacing, GPX export, acclimatization)
       3. Sherpa & Porter Logistics (Fair living wage, gear transport, teahouse reservations)
       4. Helicopter Rescue & High-Altitude Evac (24/7 Garmin inReach dispatch, emergency liaison)
       5. Conservation Permits & TIMS Passes (National park entry, restricted area permits)
     - Embedded live interactive regional Leaflet map canvas directly on Home page:
       - Region selector tabs: `Everest / Khumbu` ([27.9881, 86.9250], zoom 10.5), `Annapurna` ([28.6000, 83.9500], zoom 10.0), `Manaslu` ([28.4500, 84.6500], zoom 10.5), `Mustang` ([29.0000, 83.8500], zoom 10.0), `Langtang` ([28.2000, 85.4500], zoom 11.0).
       - Dynamic client-side loading via `next/dynamic` (`ssr: false`) to avoid SSR hydration mismatches.
       - Smooth camera animated transitions (`map.flyTo` / `map.setView`).
       - Prominent direct link / CTA to the 3D Cesium discovery hub (`/map?engine=cesium`).

4. **Luxury Full-Page Mobile Hamburger Navigation (R4)**:
   - Upgraded `src/components/layout/Navbar.tsx` on viewports `< 768px`:
     - Full-screen frosted-glass overlay (`fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white`).
     - Split layout: kinetic primary navigation links with icons & route descriptions; quick expedition shortcuts (EBC, Annapurna, Manaslu, Mustang), live search input, emergency helicopter rescue hotline CTA (`tel:+97714123456`).
     - Smooth animated hamburger-to-close toggle and staggered kinetic link reveals.
     - Body scroll lock (`document.body.style.overflow = 'hidden'`), keyboard `Escape` to close, and focus restoration to hamburger trigger.

5. **Trail Selector HUD Deduplication (R5)**:
   - Fixed `#trail-switcher-hud` in `src/components/explorer/UnifiedDiscoveryHub.tsx`:
     - Deduplicate trail entries via `uniqueHudTrails` map/set.
     - Replace ambiguous duplicate region strings `{t.region}` with distinct, unique trail names (e.g. "Everest Base Camp", "Annapurna Circuit", "Langtang Valley", "Manaslu Circuit").
     - Display distinct metadata for each trail button (name + max altitude in meters) with 0 duplicated labels.

6. **Automated Integration Testing & Verification Track (Quality)**:
   - Extend `tests/integration.test.mjs` with Suites 16 through 20 (21 new tests):
     - Suite 16: HeroUI Semantic Slots & Keyboard Focus Rings (R1)
     - Suite 17: Infinite Marquee Carousel Loop Mechanics & Props (R2)
     - Suite 18: Home Page Services & Live Leaflet Map Region Fly-To (R3)
     - Suite 19: Luxury Full-Page Mobile Nav Overlay & Hotline CTA (R4)
     - Suite 20: Trail Selector HUD Deduplication & Metadata (R5)
   - Total repository test count rises from 75 to 96 tests, guaranteeing 100% pass across all tests.
   - Full TypeScript (`npx tsc --noEmit`) 0 errors, `npm run build` succeeds, and Forensic Auditor verification is CLEAN.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | HeroUI Semantic Slot Overhaul | Implement `data-slot="base"`, `"content"`, `"header"`, `"body"`, `"footer"`, `"trigger"`, `"indicator"` | M1 | R1 / Survey 1 |
| 2 | Interactive State Reflection | Expose `data-hovered`, `data-pressed`, `data-focus-visible` on interactive UI components | M1 | R1 / Survey 1 |
| 3 | Tailwind Contrast Token Pairing | Ensure strict pairing `bg-surface text-surface-foreground` and `bg-accent text-accent-foreground` | M1 | R1 / Survey 1 |
| 4 | React Aria Focus Rings | Add `focus-visible:ring-2 focus-visible:ring-[#B68D40]` across nav links, cards, buttons, inputs | M1 | R1 / Survey 1 |
| 5 | Infinite Carousel Component | Build `src/components/ui/InfiniteCarousel.tsx` with GPU-accelerated CSS marquee & mirrored buffers | M1 | R2 / Survey 1 |
| 6 | Marquee CSS Keyframes | Add `@keyframes marquee-left` and `@keyframes marquee-right` in `src/app/globals.css` | M1 | R2 / Survey 1 |
| 7 | Mixed Card Model in Carousel | Render expedition routes (altitude, distance, duration) + alpine services cards | M1 | R2 / Survey 1 |
| 8 | 5 Core Frosted-Glass Service Cards | Guided Expeditions, 3D Planning, Sherpa Logistics, Heli Rescue, Permits on `src/app/page.tsx` | M2 | R3 / Survey 2 |
| 9 | Live Interactive Home Leaflet Map | Embed dynamic client-side Leaflet canvas with region selector tabs and animated flyTo | M2 | R3 / Survey 2 |
| 10 | 3D Cesium Direct Gateway | High-contrast CTA linking Home page map directly to 3D Cesium discovery hub | M2 | R3 / Survey 2 |
| 11 | Luxury Full-Page Mobile Nav Overlay | Full-screen frosted-glass modal (`fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl`) on `< 768px` | M3 | R4 / Survey 3 |
| 12 | Mobile Nav Split Layout & Actions | Kinetic primary links, expedition shortcuts (EBC, Annapurna, Manaslu, Mustang), live search | M3 | R4 / Survey 3 |
| 13 | Emergency Heli Rescue Hotline CTA | Prominent 24/7 SAR emergency hotline button in mobile menu | M3 | R4 / Survey 3 |
| 14 | Mobile Menu Accessibility & Body Lock | Body scroll lock (`overflow: hidden`), Esc key handler, hamburger-to-close animation | M3 | R4 / Survey 3 |
| 15 | Trail Selector HUD Deduplication | Replace `{t.region}` with unique trail names and max elevation in `UnifiedDiscoveryHub.tsx` | M3 | R5 / Survey 3 |
| 16 | Phase 5 Integration Test Suites | Add Suites 16-20 in `tests/integration.test.mjs` verifying R1-R5 (21 new tests, 96 total) | Test Track | Quality / Survey 3 |
| 17 | Zero-Mock & Pre-Flight Quality Gate | Verify `npx tsc --noEmit` (0 errors), `npm test` (all 96 pass), `npm run build` (success) | M4 | Quality / Survey 3 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| Test Track | Phase 5 E2E Test Suite Creation | F16 (`tests/integration.test.mjs` Suites 16–20) | Survey complete | IN_PROGRESS |
| M1 | HeroUI Overhaul & Infinite Carousel | F1, F2, F3, F4, F5, F6, F7 (`InfiniteCarousel.tsx`, `globals.css`, `GlassBadge.tsx`, `GlassCard.tsx`) | Survey complete | IN_PROGRESS |
| M2 | Services & Live Map Home Page | F8, F9, F10 (`src/app/page.tsx`, `src/components/home/HomeMapSection.tsx`, `LeafletMap.tsx`) | M1 | PLANNED |
| M3 | Mobile Nav & HUD Deduplication | F11, F12, F13, F14, F15 (`Navbar.tsx`, `UnifiedDiscoveryHub.tsx`) | M1 | PLANNED |
| M4 | Final E2E Verification & Hardening | F17 (100% test pass across 96 tests, TypeScript, build, forensic integrity audit) | Test Track, M1, M2, M3 | PLANNED |

---

## Code Layout
- `src/components/ui/`: `InfiniteCarousel.tsx`, `GlassCard.tsx`, `GlassBadge.tsx`, `FloatingMapPanel.tsx`
- `src/app/globals.css`: Marquee keyframes and utility classes
- `src/app/page.tsx`: Redesigned Home page with 5 service cards and live map
- `src/components/home/`: `HomeRegionalMap.tsx` or inline Home map component
- `src/components/layout/`: `Navbar.tsx` (luxury full-page mobile navigation)
- `src/components/explorer/`: `UnifiedDiscoveryHub.tsx` (`#trail-switcher-hud` fix)
- `tests/integration.test.mjs`: Test suites 16–20
