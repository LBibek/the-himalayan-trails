# Original User Request

## 2026-09-26T15:41:34Z

Build and deploy Phase 4 of **The Himalayan Trails**, delivering an immersive 3D Cesium drone flight simulator, custom GPX/KML route & waypoint studio, verified user trail reviews with explorer badges, and an end-to-end expedition checkout & payment management workflow.

Working directory: `c:\Users\acer\Desktop\The Himalayan Trails`
Integrity mode: `development`

## Requirements

### R1. 3D Cesium Drone Flight Path Simulator & Telemetry
Provide an interactive 3D virtual tour mode that flies a camera smoothly along the exact polyline GPS coordinates of any selected Himalayan trail. Include flight controls (Play, Pause, Speed multiplier 1x/2x/5x, Restart), dynamic camera tilt/pitch to follow slope gradient, and real-time flight telemetry (current altitude, remaining distance, next landmark ETA).

### R2. Custom GPX & KML Route File Importer & Waypoint Studio
Allow users and expedition guides to drag-and-drop or upload custom `.gpx` and `.kml` track files directly in the Map Explorer and Itinerary Planner. The system must parse XML trackpoints, compute total distance, elevation gain/loss, dynamically render the route on 2D Leaflet and 3D Cesium maps, plot the Recharts elevation profile, and allow dropping custom waypoint markers.

### R3. Trail Reviews, Multi-Criteria Ratings & Explorer Badges
Implement a full-stack review and rating system where authenticated adventurers can submit verified reviews with 1-5 star ratings across sub-criteria (trail difficulty, scenic beauty, safety/condition), text commentary, and photo links. Persist reviews to SQLite/Supabase schemas, calculate dynamic aggregate trail scores, and award achievement badges on the user profile (e.g., "Everest Pioneer", "Annapurna Master").

### R4. Expedition Checkout & ACID Deposit Reservation
Deliver a complete booking checkout and payment flow supporting deposit and full-payment options. Validate expedition dates, calculate group pricing and permit fees, provide invoice breakdowns, and atomically persist confirmed bookings with transaction safety and downloadable receipt confirmation.

## Acceptance Criteria

### Simulation & Visualization
- [ ] Selecting any official or custom trail in 3D Cesium mode provides a "Start Drone Fly-Through" action.
- [ ] Drone camera moves along the polyline path smoothly without snapping, with speed adjustments (1x, 2x, 5x) and a live altitude telemetry HUD.
- [ ] Scrubbing the Recharts elevation graph during or outside flight mode updates camera position accordingly.

### Route Import & Waypoint Studio
- [ ] Uploading valid GPX/KML files instantly parses coordinates, displays the route polyline on both 2D and 3D map engines, and generates an elevation profile.
- [ ] Users can add, edit, and delete custom named waypoints along the uploaded or selected route.

### Reviews & User Badges
- [ ] Review submissions persist to the database with validation, preventing unauthenticated or blank submissions.
- [ ] Dynamic average rating and rating breakdown bars update on the trail details page.
- [ ] Completing bookings or submitting verified reviews unlocks badges displayed on `/dashboard`.

### Checkout & Persistence
- [ ] Booking checkout accurately computes taxes, permit fees, and deposit totals, persisting records with proper HTTP status codes.
- [ ] Booking lifecycle status transitions (Pending -> Confirmed -> Expedition Active -> Completed) are manageable via `/admin` and reflect in `/dashboard`.

### Pre-Flight Verification & Quality
- [ ] `npx tsc --noEmit` passes with 0 TypeScript errors.
- [ ] All automated integration tests in `tests/integration.test.mjs` pass cleanly with 100% success.
- [ ] Production build `npm run build` succeeds with zero build errors.
- [ ] Zero-mock policy is strictly preserved (no fake timers, no hardcoded mock objects).

## 2026-09-27T06:02:55Z

Execute Phase 5 of **The Himalayan Trails**, transforming the platform into a world-class luxury alpine expedition portal using HeroUI compound design principles, a dual-layer continuous infinite carousel, a services- and live interactive map-centric Home page, a full-page luxury frosted-glass mobile hamburger navigation overlay, and a deduplicated trail selector HUD.

Working directory: `c:\Users\acer\Desktop\The Himalayan Trails`
Integrity mode: `development`

## Requirements

### R1. Complete HeroUI Component Architecture Overhaul
Refactor frontend components across the landing page and navigation to strictly implement HeroUI compound design patterns:
- Explicit semantic slots (`data-slot="base"`, `data-slot="content"`, `data-slot="header"`, `data-slot="body"`, `data-slot="footer"`, `data-slot="trigger"`, `data-slot="indicator"`).
- Interactive state reflection attributes (`data-hovered`, `data-pressed`, `data-focus-visible`).
- Standard Tailwind contrast token pairings (`bg-surface text-surface-foreground`, `bg-accent text-accent-foreground`, `#B68D40` gold accents).
- Prominent React Aria-compliant focus rings (`focus-visible:ring-2 focus-visible:ring-[#B68D40]`).

### R2. Dual-Speed Continuous Infinite Carousel
Build a reusable, high-performance HeroUI infinite marquee carousel component (`src/components/ui/InfiniteCarousel.tsx`):
- Seamless continuous loop using GPU-accelerated CSS marquee with mirrored content buffers (zero seam, zero jump).
- Displays mixed cards: top Himalayan expedition routes (with live altitude, distance, duration) interspersed with high-altitude alpine services (Sherpa logistics, helicopter rescue, TIMS/conservation permits).
- Built-in pause-on-hover, pause-on-touch, and responsive card sizing.

### R3. Services & Live Interactive Map-Centric Home Page
Redesign `src/app/page.tsx` to elevate conversions and mountain exploration:
- **Core Alpine Services Matrix**: 5 dedicated frosted-glass service cards (`data-slot="base"`):
  1. *Guided Alpine Expeditions* (IFMGA Sherpa leaders, oxygen logistics, summit pushes)
  2. *Custom 3D Itinerary Planning* (Day-by-day altitude pacing, GPX export, acclimatization)
  3. *Sherpa & Porter Logistics* (Fair-wage porters, gear transport, teahouse reservations)
  4. *Helicopter Rescue & High-Altitude Evac* (24/7 Garmin inReach dispatch, emergency liaison)
  5. *Conservation Permits & TIMS Passes* (National park entry, restricted area permits)
- **Live Interactive Regional Map Module**: An embedded interactive Leaflet map canvas directly on the Home page with quick region selector tabs (`Everest / Khumbu`, `Annapurna`, `Manaslu`, `Mustang`, `Langtang`), auto-flying camera coordinates, and a direct link to the 3D Cesium discovery hub.

### R4. Luxury Full-Page Mobile Hamburger Navigation
Upgrade `src/components/layout/Navbar.tsx` on viewports `< 768px`:
- Full-screen frosted-glass overlay (`fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white`).
- Luxury split layout: kinetic primary navigation links on the top/left with icons and route descriptions; quick expedition shortcuts (EBC, Annapurna, Manaslu, Mustang), live search input, and an emergency helicopter rescue hotline CTA on the right/bottom.
- Smooth animated hamburger-to-close toggle and staggered kinetic link reveals.

### R5. Trail Selector HUD Deduplication
In `src/components/explorer/UnifiedDiscoveryHub.tsx`, fix the floating Trail Selector HUD (`#trail-switcher-hud`):
- Replace duplicate region labels with unique, distinct trail names (e.g., "Everest Base Camp", "Annapurna Circuit", "Langtang Valley", "Manaslu Circuit").
- Ensure each trail button displays distinct metadata (name + max altitude) with 0 duplicated labels.

## Acceptance Criteria

### HeroUI Architecture
- [ ] Components use compound semantic slots (`data-slot="base"`, `data-slot="header"`, `data-slot="body"`, `data-slot="footer"`) and contrast tokens (`bg-surface text-surface-foreground`).
- [ ] All interactive buttons and inputs have accessible focus rings (`focus-visible:ring-2 focus-visible:ring-[#B68D40]`).

### Infinite Carousel
- [ ] Marquee scrolls smoothly and continuously without stutter or visible jump on desktop and mobile.
- [ ] Hovering over the carousel pauses movement smoothly.

### Home Page Services & Live Map
- [ ] Home page features all 5 core alpine services with clear descriptions and booking/inquiry actions.
- [ ] The embedded live interactive map allows switching between Everest, Annapurna, Manaslu, Mustang, and Langtang, updating the map view and coordinates smoothly.

### Full-Page Mobile Navigation
- [ ] On mobile devices (<768px), tapping the hamburger menu button triggers a full-page frosted glass overlay.
- [ ] Contains search input, core route navigation, high-altitude shortcuts, and emergency dispatch contact CTA.
- [ ] Closing the menu restores normal page scrolling cleanly.

### Trail Selector HUD
- [ ] Trail Selector HUD in `UnifiedDiscoveryHub.tsx` displays distinct, unique trail names for each button with zero duplicate text labels.

### Quality & Pre-Flight Verification
- [ ] `npx tsc --noEmit` passes with 0 TypeScript errors.
- [ ] `npm test` passes all 75 automated full-stack tests cleanly.
- [ ] Production build `npm run build` succeeds without errors.
- [ ] Zero-mock policy is strictly preserved.
