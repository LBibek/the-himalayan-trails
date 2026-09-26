# Phase 4 Orchestration Plan

## 1. Survey Phase (Step 0)
- Dispatch 3 Explorers concurrently:
  - **Explorer 1**: Maps Map Architecture (2D Leaflet, 3D Cesium `MapEngineManager`, `IMapController`, trail polyline structures, drone fly-through feasibility, Recharts elevation synchronization).
  - **Explorer 2**: Maps GPX/KML parsing, trackpoints, waypoint management, Itinerary Planner, Map Explorer integrations, and Recharts elevation profile component.
  - **Explorer 3**: Maps Database schema (SQLite / Supabase / Prisma), existing API endpoints (`/api/...`), Auth state, Reviews/Ratings/Badges schema & UI, Checkout/Booking models & ACID transactions, and existing test harness (`tests/integration.test.mjs`).
- Synthesize all findings into `PROJECT.md` at project root with Feature Inventory, Architecture, Milestone assignments, and Interface Contracts.

## 2. Dual-Track Execution
### Track A: E2E Testing Track
- Build comprehensive opaque-box test suite for R1, R2, R3, R4 covering Tiers 1-4.
- Test runner and runner commands in `TEST_READY.md`.

### Track B: Implementation Track
- Milestone 1: 3D Cesium Drone Flight Path Simulator & Telemetry (R1)
- Milestone 2: Custom GPX & KML Route Importer & Waypoint Studio (R2)
- Milestone 3: Trail Reviews, Multi-Criteria Ratings & Explorer Badges (R3)
- Milestone 4: Expedition Checkout & ACID Deposit Reservation (R4)
- Milestone 5: Pass 100% of E2E test suite + Phase 2 white-box adversarial hardening (Tier 5)

## 3. Pre-Flight Verification & Delivery
- Verify 100% pass of `tests/integration.test.mjs`.
- Verify `npx tsc --noEmit` has 0 errors.
- Verify `npm run build` succeeds cleanly.
- Verify zero mocks anywhere in code or database.
- Present final report to user / Sentinel.
