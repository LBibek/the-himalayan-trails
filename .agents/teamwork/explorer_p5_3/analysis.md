# Technical Analysis: Mobile Navigation, Trail Selector HUD Deduplication & Integration Test Architecture

**Author**: `explorer_p5_3`  
**Date**: 2026-09-27  
**Scope**: Phase 5 Survey (R4: Luxury Mobile Navigation, R5: Trail Selector HUD Deduplication, Quality: Integration Test Architecture)  
**Target Repository**: `The Himalayan Trails`

---

## Executive Summary

This investigation surveys three critical pillars of Phase 5 for **The Himalayan Trails**:
1. **Luxury Mobile Hamburger Navigation (`src/components/layout/Navbar.tsx`)**: The existing mobile view is a basic inline vertical drawer that pushes page content down, lacks body scroll locking, lacks search and expedition shortcuts, lacks an emergency rescue hotline, and does not provide an immersive full-screen frosted-glass overlay. We present the complete architectural design for a full-page modal overlay (`fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white`), kinetic split layout, animated hamburger toggle, keyboard navigation, and focus restoration.
2. **Trail Selector HUD Deduplication (`src/components/explorer/UnifiedDiscoveryHub.tsx`)**: In `#trail-switcher-hud`, button elements currently render `{t.region}` rather than the trail's name or metadata. This causes duplicate button labels (e.g. repeated "Everest" tags) and conceals the actual trail identity. We specify a deduplication and formatting pipeline that guarantees zero duplicate labels and displays concise trail titles with max elevation badges.
3. **Integration Test Architecture (`tests/integration.test.mjs` & test runner)**: We reconcile the project test inventory: Suites 1–14 comprise the 53 baseline tests from Phases 1–4; Suite 15 adds 4 Cesium synchronization tests (57 tests total in `integration.test.mjs`); and `tests/drone-kinematics-adversarial.test.mjs` contains 18 tests (75 total). For Phase 5, we specify 5 new comprehensive test suites (Suites 16–20) spanning R1 through R5 (20–22 new tests) ensuring rigorous end-to-end full-stack verification and exceeding the 75-test acceptance criterion.

---

## 1. Luxury Mobile Hamburger Navigation (`src/components/layout/Navbar.tsx` — R4)

### 1.1 Current Architecture & Deficiencies (Viewports `< 768px`)
Inspection of `src/components/layout/Navbar.tsx` (lines 120–187) revealed:
- **Inline Drawer vs. Full-Page Overlay**: The mobile menu is rendered as an inline container (`<div id="mobile-navigation" className="md:hidden bg-neutral-950 border-b border-neutral-800 ...">`) appended inside the sticky `<header>`. It does not cover the viewport and pushes down the underlying page content.
- **No Body Scroll Lock**: When the drawer opens, `document.body` continues to scroll freely behind it, causing disorienting scroll conflicts on touch devices.
- **Static Icon Swapping Without Morph Animation**: The button at lines 122–130 simply switches `{mobileMenuOpen ? <X /> : <Menu />}`, lacking animated hamburger bar transitions or kinetic rotations.
- **Lack of Expedition Utility & Shortcuts**: Mobile users are presented with a plain list of 12 text links. There is no live search input, no fast-track shortcuts to marquee trails (EBC, Annapurna, Manaslu, Mustang), and no emergency rescue hotline.
- **Missing Accessibility & Keyboard Controls**:
  - No `Escape` key event listener to close the overlay.
  - No focus trap or focus restoration to the hamburger trigger button upon closing.
  - Lacks `role="dialog"`, `aria-modal="true"`, and standard HeroUI semantic slot attributes (`data-slot="base"`, `data-slot="overlay"`, `data-slot="trigger"`).
  - Lacks standard HeroUI focus ring classes (`focus-visible:ring-2 focus-visible:ring-[#B68D40]`).

### 1.2 Target Architecture: Luxury Frosted-Glass Overlay

#### A. Container & Styling Tokens
- **Overlay Container**:
  ```tsx
  <div
    id="mobile-navigation-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Expedition Portal Navigation"
    data-slot="overlay"
    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white flex flex-col justify-between overflow-y-auto overscroll-contain animate-in fade-in duration-300"
  >
  ```
- **Contrast & Theme Tokens**: Strict pairing of `bg-surface text-surface-foreground` tokens, gold `#B68D40` brand highlights, frosted glass borders (`border-white/10`), and deep charcoal surfaces (`bg-neutral-900/80`).

#### B. Split Layout Structure
The overlay interior must be structured into two logical columns on landscape/tablet and stacked on mobile:

1. **Header Bar**:
   - Left: Brand Logo & Title with gold gradient.
   - Right: Close Button (`data-slot="trigger"`, `aria-label="Close navigation"`, `focus-visible:ring-2 focus-visible:ring-[#B68D40]`).
2. **Column 1 — Kinetic Primary Navigation Links**:
   Each link includes an icon, a primary title, and an alpine description:
   - **Alpine Gateway** (`/`) — *Expedition Matrix & Live Regional Map* (Icon: `Mountain`)
   - **Interactive 2D Topo Map** (`/map`) — *AllTrails Engine with GPS Tracks* (Icon: `MapIcon`)
   - **3D Cesium Terrain Globe** (`/map?engine=3d`) — *Himalayan Massifs & Summit Drone Tours* (Icon: `Globe`)
   - **Itinerary Studio** (`/itinerary/planner`) — *Interactive Pacing, DnD Days & Waypoints* (Icon: `Calendar`)
   - **Alpine Met Office** (`/weather`) — *Avalanche Risk, Summit Temps & Lapse Rates* (Icon: `CloudSun`)
   - **Trekker Chronicles** (`/stories`) — *Verified Photo Journals & Dispatches* (Icon: `BookOpen`)
   - **Adventurer Profile** (`/dashboard`) — *Active Bookings, Badges & Reviews* (Icon: `User`)
   - **Command Studio** (`/admin`) — *Expedition Operations & Catalog Management* (Icon: `ShieldCheck`)
3. **Column 2 — Expedition Utilities, Search & Emergency Hotline**:
   - **Live Search Field**:
     ```tsx
     <form
       onSubmit={(e) => {
         e.preventDefault();
         if (searchQuery.trim()) {
           setMobileMenuOpen(false);
           router.push(`/map?search=${encodeURIComponent(searchQuery.trim())}`);
         }
       }}
       className="relative w-full"
     >
       <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#B68D40]" />
       <input
         type="text"
         value={searchQuery}
         onChange={(e) => setSearchQuery(e.target.value)}
         placeholder="Search routes, peaks, passes..."
         className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-900/80 border border-neutral-700/80 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40]"
       />
     </form>
     ```
   - **Quick Expedition Shortcuts**:
     A 2x2 responsive pill grid linking directly to marquee Himalayan expeditions:
     - `Everest Base Camp` (`5,364m` • Khumbu Glacier)
     - `Annapurna Circuit` (`5,416m` • Thorong La Pass)
     - `Manaslu Circuit` (`5,106m` • Larkya La Pass)
     - `Upper Mustang` (`3,840m` • Lo Manthang)
   - **Emergency Helicopter Rescue & High-Altitude Evacuation Hotline CTA**:
     ```tsx
     <div
       data-slot="hotline-card"
       className="p-4 rounded-2xl bg-gradient-to-br from-red-950/40 via-neutral-900/90 to-neutral-950 border border-red-500/30 text-white space-y-2"
     >
       <div className="flex items-center gap-2">
         <span className="relative flex h-2.5 w-2.5">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
         </span>
         <span className="text-xs font-bold uppercase tracking-wider text-red-400">
           24/7 High-Altitude Emergency Evacuation
         </span>
       </div>
       <p className="text-[11px] text-gray-300">
         Direct satellite link to Garmin inReach & Himalayan Search and Rescue (SAR) dispatch.
       </p>
       <a
         href="tel:+97714123456"
         className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg transition"
       >
         <span>Call Rescue Dispatch: +977-1-412-3456</span>
       </a>
     </div>
     ```
   - **Auth & Account Footer**:
     Clear split buttons for "Sign In" and "Create Account" (`bg-[#B68D40] text-black font-extrabold`).

### 1.3 State & Accessibility Synchronization
1. **Body Scroll Lock**:
   ```tsx
   useEffect(() => {
     if (mobileMenuOpen) {
       const originalStyle = window.getComputedStyle(document.body).overflow;
       document.body.style.overflow = 'hidden';
       return () => {
         document.body.style.overflow = originalStyle;
       };
     }
   }, [mobileMenuOpen]);
   ```
2. **Keyboard Esc Listener & Focus Restoration**:
   ```tsx
   const triggerButtonRef = useRef<HTMLButtonElement>(null);
   const overlayRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'Escape' && mobileMenuOpen) {
         setMobileMenuOpen(false);
         triggerButtonRef.current?.focus();
       }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [mobileMenuOpen]);
   ```
3. **Animated Hamburger Morph**:
   Instead of abruptly swapping `<Menu />` and `<X />`, use a 3-bar kinetic hamburger icon that rotates and translates lines 1 and 3 into an `X` while fading out line 2:
   ```tsx
   <button
     ref={triggerButtonRef}
     onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
     className="relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl text-gray-300 hover:text-white focus-visible:ring-2 focus-visible:ring-[#B68D40] outline-none"
     aria-label="Toggle Navigation Menu"
     aria-expanded={mobileMenuOpen}
     aria-controls="mobile-navigation-overlay"
   >
     <span className={`block w-6 h-0.5 bg-current transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
     <span className={`block w-6 h-0.5 bg-current transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
     <span className={`block w-6 h-0.5 bg-current transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
   </button>
   ```

---

## 2. Trail Selector HUD Deduplication (`UnifiedDiscoveryHub.tsx` — R5)

### 2.1 Root Cause Analysis of Duplicate Labels
In `src/components/explorer/UnifiedDiscoveryHub.tsx` (lines 878–912), the Trail Selector floating HUD is rendered inside `FloatingMapPanel`:
```tsx
<FloatingMapPanel
  id="trail-switcher-hud"
  title="Trail Selector"
  ...
>
  <div className="flex flex-wrap items-center gap-1.5 text-xs">
    <span className="text-[10px] text-gray-400 uppercase font-semibold px-1">
      Select Trail:
    </span>
    {trails.map((t: Trail) => (
      <button
        key={t.id}
        onClick={() => handleTrailSelect(t)}
        className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition ${
          activeTrail?.id === t.id
            ? 'bg-[#B68D40] text-black font-bold shadow'
            : 'text-gray-300 hover:bg-neutral-800'
        }`}
      >
        {t.region}
      </button>
    ))}
  </div>
</FloatingMapPanel>
```

**Direct Flaws Identified**:
1. **Region Used as Trail Label**: Line 906 explicitly prints `{t.region}` rather than `{t.name}`.
2. **Duplicate Labels by Design**: If two trails belong to the Everest region (e.g. "Everest Base Camp" and "Three Passes Trek"), both buttons display identical text: `Everest`.
3. **No Altitude Metadata**: The button lacks max elevation, distance, or difficulty cues, making it impossible for the user to discern the target route without clicking.
4. **No Array Deduplication Guard**: If the backend database contains multiple entries with similar names or regions, the UI renders redundant buttons.

### 2.2 Deduplication & Distinct Metadata Pipeline

To achieve 100% compliance with R5:
1. **Deduplication Hook / Memo**:
   Filter `trails` through a unique key map to prevent any duplicate rendering:
   ```tsx
   const uniqueHudTrails = React.useMemo(() => {
     const seen = new Set<string>();
     const result: Trail[] = [];
     for (const t of trails) {
       // Unique identifier based on normalized name or slug
       const key = (t.slug || t.name).toLowerCase().trim();
       if (!seen.has(key)) {
         seen.add(key);
         result.push(t);
       }
     }
     return result;
   }, [trails]);
   ```
2. **Concise Trail Name Formatter**:
   Shorten long formal titles for compact HUD presentation while maintaining distinct identity:
   - "Everest Base Camp Trek" -> `"Everest Base Camp"`
   - "Annapurna Circuit & Thorong La" -> `"Annapurna Circuit"`
   - "Langtang Valley & Kyanjin Ri" -> `"Langtang Valley"`
   - "Manaslu Circuit Trek" -> `"Manaslu Circuit"`
   - "Upper Mustang Forbidden Kingdom" -> `"Upper Mustang"`
   - "Rolwaling Valley & Tashi Lapcha Pass" -> `"Rolwaling Valley"`
3. **HUD Button Template with HeroUI Semantics**:
   ```tsx
   {uniqueHudTrails.map((t: Trail) => {
     const isSelected = activeTrail?.id === t.id;
     const cleanName = getDisplayTrailName(t.name);
     return (
       <button
         key={t.id}
         data-slot="trail-button"
         data-trail-id={t.id}
         aria-pressed={isSelected}
         onClick={() => handleTrailSelect(t)}
         className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] outline-none ${
           isSelected
             ? 'bg-[#B68D40] text-black font-bold shadow-md'
             : 'text-gray-300 hover:bg-neutral-800 hover:text-white'
         }`}
         title={`${t.name} (${t.maxElevation}m) — ${t.region}`}
       >
         <span>{cleanName}</span>
         <span
           className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
             isSelected ? 'bg-black/20 text-black font-extrabold' : 'bg-neutral-800 text-[#B68D40]'
           }`}
         >
           {t.maxElevation}m
         </span>
       </button>
     );
   })}
   ```

**Verification Guarantee**:
- Number of buttons equals `uniqueHudTrails.length`.
- Every button label contains both the unique trail name AND its distinct altitude in meters.
- There are exactly **0** duplicated labels in `#trail-switcher-hud`.

---

## 3. Integration Test Architecture (`tests/integration.test.mjs` — Quality)

### 3.1 Current Test Inventory Breakdown

Running `node .agents/teamwork/explorer_p5_3/list_tests.js` against `tests/integration.test.mjs` and inspecting `tests/drone-kinematics-adversarial.test.mjs` establishes the full inventory:

#### Baseline Suites in `tests/integration.test.mjs` (57 tests)
1. **Relational Database Schemas & Data Integrity** (5 tests):
   - Table existence (users, trails, landmarks, itineraries, stories, weather_reports, bookings, inquiries, contact_messages, shared_trails)
   - Seeded routes metadata integrity
   - Landmarks GPS coordinates & associations
   - Regional weather reports
   - 7 official Himalayan massifs
2. **Authentication & Cryptographic Security** (3 tests):
   - scrypt password hashing & salt
   - User registration persistence
   - HMAC session token tampering detection
3. **Booking & Reservation ACID Persistence** (1 test):
   - Valid booking foreign key integrity
4. **Stories & Atomic Community Interactions** (1 test):
   - Story creation & atomic like increment
5. **Contact Messages & Inquiries Persistence** (1 test):
   - Message storage & status lifecycle
6. **Zero-Mock & Codebase Cleanliness Verification** (3 tests):
   - Ban on `mockData.ts`
   - Ban on artificial `setTimeout` delays in Server Actions/APIs
   - Real JSON API responses without hardcoded arrays
7. **Phase 2 User Dashboard & Admin Lifecycle Operations** (3 tests):
   - User dashboard query scoping
   - Admin status transitions (`EXPEDITION_ACTIVE`, `COMPLETED`)
   - Admin booking deletion
8. **Phase 3 Itinerary Planner, Admin Studio & Full-Stack Persistence** (5 tests):
   - Itinerary custom route days persistence
   - Trail cascading lifecycle
   - Inquiries administrative state machine
   - Contact messages cleanup
   - Supabase `schema.sql` RLS policies and indexes
9. **Interactive Recharts Altitude Profile, DnD Timeline & 2D/3D Map Architecture** (6 tests):
   - `@dnd-kit` library installation
   - Recharts `ReferenceDot` landmarks & 3-way synchronization
   - PlannerElevationChart scrubbing & HeroUI compound slots
   - Itinerary Planner DnD sorting & 2D/3D map engine toggle
   - CesiumGlobeMap landmark interaction & scrubber beacon
   - GPS proximity along route track
10. **Unified Discovery Hub, Merged Explore/Map/Trails & Multi-View Architecture** (2 tests):
    - UnifiedDiscoveryHub layout modes (split, mapOnly, cardsOnly)
    - Route rendering parity across `/map`, `/explore`, and `/trails`
11. **Phase 4 GPX & KML Route Importer, Geodesic Math & Waypoint Studio (R2)** (7 tests):
    - GPX 1.1 XML parsing
    - KML 2.2 XML parsing
    - Geodesic Haversine math tolerance
    - Elevation noise filtering threshold
    - Profile decimation preserving extrema
    - Boundary & error handling
    - Waypoint Studio CRUD
12. **Phase 4 Reviews, Multi-Criteria Ratings & Dynamic Aggregate Scores (R3)** (5 tests):
    - Schema enforcement
    - Verified review submission
    - Dynamic trail score recalculation
    - Sub-dimension analytics
    - Boundary & validation rules
13. **Phase 4 Explorer Badges & Mountain Honors Gamification (R3)** (5 tests):
    - `UNIQUE(user_id, badge_id)` constraint
    - Auto-unlocking badges on review submission
    - Region and altitude badge rules
    - Booking milestone badges
    - Dashboard badges query
14. **Phase 4 Expedition Checkout, ACID Deposit Reservation & Lifecycle (R4)** (6 tests):
    - Tiered group discount engine
    - Regional permits & 13% VAT
    - 25% deposit arithmetic
    - ACID transaction commit and rollback
    - 5-state booking lifecycle state machine
    - Tier 4 end-to-end adventurer journey
15. **Cesium 3D Entity Collision Resolution & Planner 2D/3D Synchronization** (4 tests):
    - Idempotent `addMarkers`
    - Entity cleanup in `clearMarkers`
    - Safe `setTrailPolyline` replacement
    - `onMarkerClick` pub/sub registration

*Note on "53 tests"*: Suites 1 through 14 contain exactly 53 tests (30 from Phases 1–3 + 23 from Phase 4). Suite 15 adds 4 tests for Cesium controller collision resolution, totaling 57 tests in `integration.test.mjs`.

#### Adversarial Physics Suite (18 tests)
- `tests/drone-kinematics-adversarial.test.mjs`: 18 tests covering geodesic tolerances, boundary clamping, pitch constraints, and numerical stability.

**Current Test Total**: 57 + 18 = **75 passing tests**.

---

### 3.2 Phase 5 Target Test Suites (Suites 16–20)
To establish airtight test coverage for Phase 5 (R1 through R5), we specify 5 new integration test suites adding 21 new assertions:

```
=============================================================================
Suite 16: Phase 5 HeroUI Component Architecture & Focus Rings (R1) [4 Tests]
=============================================================================
Test 16.1: Semantic slots compliance across Navbar, Home, and Carousel
  - Assert that Navbar, Home page, and InfiniteCarousel implement explicit semantic slots:
    'data-slot="base"', 'data-slot="header"', 'data-slot="body"', 'data-slot="footer"', 'data-slot="trigger"', 'data-slot="overlay"'.
Test 16.2: Accessible focus ring styling across interactive controls
  - Assert that buttons, links, inputs, and toggles contain 'focus-visible:ring-2' and 'focus-visible:ring-[#B68D40]'.
Test 16.3: Strict Tailwind contrast token pairings
  - Assert all 'bg-surface' instances pair with 'text-surface-foreground' (or 'bg-neutral-900' with 'text-white' / 'text-gray-300').
  - Assert brand gold '#B68D40' is used consistently for accents and active indicators.
Test 16.4: Interactive state reflection attributes
  - Assert that compound components expose 'data-hovered', 'data-pressed', or 'aria-pressed' attributes.

=============================================================================
Suite 17: Phase 5 Dual-Speed Continuous Infinite Carousel (R2) [4 Tests]
=============================================================================
Test 17.1: InfiniteCarousel component export & HeroUI compound structure
  - Assert src/components/ui/InfiniteCarousel.tsx exists and exports InfiniteCarousel.
  - Assert data-slot="base", data-slot="content", and data-slot="item" are implemented.
Test 17.2: Mirrored content buffer architecture for zero-seam infinite loop
  - Assert carousel renders duplicated item arrays (items.concat(items) or dual track) to guarantee zero jump at loop boundary.
Test 17.3: GPU-accelerated CSS marquee with speed controls
  - Assert presence of GPU acceleration classes ('transform-gpu' or 'translate3d').
  - Assert support for speed variants ('normal', 'slow', 'fast') or configurable duration classes.
Test 17.4: Mixed expedition routes & alpine services schema
  - Assert carousel items include both expedition routes (distance, max altitude, duration) and high-altitude alpine services (Sherpa logistics, helicopter rescue, TIMS passes).
  - Assert hover pause capability ('hover:[animation-play-state:paused]').

=============================================================================
Suite 18: Phase 5 Services & Live Interactive Map-Centric Home Page (R3) [5 Tests]
=============================================================================
Test 18.1: Alpine Services Matrix includes all 5 core services
  - Assert Home page contains:
    1. Guided Alpine Expeditions
    2. Custom 3D Itinerary Planning
    3. Sherpa & Porter Logistics
    4. Helicopter Rescue & High-Altitude Evac
    5. Conservation Permits & TIMS Passes
Test 18.2: Service cards provide clear action links & frosted glass styling
  - Assert each service card contains data-slot="base", backdrop-blur styling, and functional CTAs (/itinerary/planner, /map, /contact).
Test 18.3: Embedded live interactive regional Leaflet map integration
  - Assert src/app/page.tsx dynamically loads LeafletMap with { ssr: false }.
Test 18.4: 5 quick region selector tabs with accurate geographic coordinates
  - Assert region tabs exist for Everest [27.9881, 86.9250], Annapurna [28.5960, 83.8200], Manaslu [28.5500, 84.5600], Mustang [29.1800, 83.9500], Langtang [28.2100, 85.5600].
  - Assert clicking region tabs updates focused coordinates and triggers camera transition.
Test 18.5: Direct link CTA to 3D Cesium discovery hub
  - Assert Home page includes prominent link to /map?engine=3d.

=============================================================================
Suite 19: Phase 5 Luxury Full-Page Mobile Hamburger Navigation (R4) [4 Tests]
=============================================================================
Test 19.1: Full-page frosted-glass overlay structure
  - Assert Navbar renders overlay with 'fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white' on mobile.
Test 19.2: Body scroll locking and cleanup
  - Assert presence of body scroll lock logic (document.body.style.overflow = 'hidden' when open, restored on unmount).
Test 19.3: Split layout with primary routes, live search, shortcuts & emergency hotline
  - Assert presence of search input routing to /map?search=...
  - Assert presence of quick expedition shortcuts (EBC, Annapurna, Manaslu, Mustang).
  - Assert presence of 24/7 Helicopter Rescue & Evac hotline CTA with tel: link.
Test 19.4: Accessibility & keyboard navigation
  - Assert 'role="dialog"', 'aria-modal="true"', 'aria-expanded', and Escape key listener restoring trigger focus.

=============================================================================
Suite 20: Phase 5 Trail Selector HUD Deduplication Verification (R5) [4 Tests]
=============================================================================
Test 20.1: Trail buttons render distinct trail names instead of region strings
  - Assert button text in #trail-switcher-hud displays trail names (e.g. Everest Base Camp, Annapurna Circuit) rather than raw region names.
Test 20.2: Distinct metadata displayed on every HUD button
  - Assert each button renders distinct max elevation metadata (e.g. 5364m, 5416m).
Test 20.3: Zero duplicate text labels guarantee
  - Assert deduplication logic ensures 0 duplicate button labels even with multiple trails per region.
Test 20.4: Active trail selection updates aria-pressed and map focus
  - Assert active button reflects aria-pressed="true" and triggers handleTrailSelect.
```

Adding Suites 16–20 will bring `tests/integration.test.mjs` to **78 tests** (and repository total to **96 tests**), delivering comprehensive automated validation of Phase 5.

---

## 4. Architectural Recommendations for Implementation Agents

1. **For `Navbar.tsx` (Mobile Navigation)**:
   - Separate the mobile overlay into an explicit sub-component `<MobileNavOverlay isOpen={...} onClose={...} />` or clean modal block to keep `Navbar.tsx` maintainable.
   - Use `useRef` for both the toggle button and the first focusable element inside the modal to ensure clean focus trapping and restoration.
   - Bind search form submission to `router.push('/map?search=' + encodeURIComponent(term))` and close the overlay immediately on navigation.

2. **For `UnifiedDiscoveryHub.tsx` (Trail Selector HUD)**:
   - Extract `getCleanTrailName(name: string)` into a shared helper to strip trailing generic suffixes ("Trek", "Forbidden Kingdom", "& Thorong La") while keeping the mountain massif name distinct.
   - Render the altitude badge inside the button with contrasting font-mono styling (`bg-neutral-800 text-[#B68D40]`).
   - Use `uniqueHudTrails` with a `Map<string, Trail>` keyed by `slug || id` to ensure duplicate database records never create duplicate HUD buttons.

3. **For Integration Tests**:
   - Append Suites 16 through 20 directly into `tests/integration.test.mjs` using the standard `describe` and `test` blocks from `node:test`.
   - Ensure all static source code checks use normalized path joins (`path.join(process.cwd(), 'src', ...)`), ensuring multi-platform Windows and Linux/CI compatibility.
   - Run `npx tsc --noEmit` and `npm test` after all edits to verify 0 regressions.
