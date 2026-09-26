# E2E Test Infra: The Himalayan Trails — Phase 4

## Test Philosophy
- Opaque-box, requirement-driven. Derived from `ORIGINAL_REQUEST.md` and user-facing acceptance criteria.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial + Real-World Workload Testing.
- Zero-Mock Policy: All tests run against genuine SQLite database (`data/himalayan_trails.db`), genuine API route handlers, and genuine geospatial algorithms.

## Feature Inventory & Test Coverage Goals
| # | Feature | Source (requirement) | Tier 1 (Happy) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Workload) |
|---|---------|---------------------|:--------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | 3D Cesium Drone Simulator & Telemetry | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Custom GPX & KML Route Importer | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 3 | Interactive Waypoint Studio | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 4 | Trail Reviews & Multi-Criteria Ratings | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 5 | Explorer Badges & Gamification | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 6 | Expedition Pricing & Regional Permit Engine | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 7 | ACID Deposit Reservation & Checkout | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 8 | 5-State Booking Lifecycle Management | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Node.js native test runner via `npm run test` (`node --test tests/**/*.test.mjs`).
- Test Suite Location: `tests/integration.test.mjs`.
- Existing Suites: Suites 1–10 (30 tests passing).
- Phase 4 Additions:
  - Suite 11: Phase 4 GPX & KML Route Importer, Geodesic Math & Waypoint Studio (R2).
  - Suite 12: Phase 4 Reviews, Multi-Criteria Ratings & Dynamic Aggregate Scores (R3).
  - Suite 13: Phase 4 Explorer Badges & Mountain Honors Gamification (R3).
  - Suite 14: Phase 4 Expedition Checkout, ACID Deposit Reservation & Lifecycle (R4).

## Test Case Tiers
- **Tier 1 (Feature Coverage)**: Valid GPX parse, valid KML parse, review submission, badge award, deposit checkout, lifecycle transition.
- **Tier 2 (Boundary & Corner)**: Corrupt XML/GPX/KML, missing altitude, 0 or negative travelers, rating out of bounds (0 or 6), blank reviews, large party size (15+), unauthenticated checkout.
- **Tier 3 (Cross-Feature Combinations)**: Review submission triggers trail average rating update AND unlocks "Trail Blazer" badge simultaneously; Completed booking unlocks region badge; Custom route import generates elevation profile used in waypoint studio.
- **Tier 4 (Real-World Workloads)**: Multi-day expedition booking with 25% deposit, verified adventurer review submission, and lifecycle transition to `COMPLETED` verifying balance accounting and badges.

## Thresholds
- Minimum 100% pass rate across all suites.
- Pre-flight `npx tsc --noEmit` must pass with 0 errors.
- `npm run build` must compile cleanly with 0 errors.
