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
