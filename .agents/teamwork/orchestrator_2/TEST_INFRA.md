# E2E Test Infra: Phase 5 The Himalayan Trails

## Test Philosophy
- Opaque-box, requirement-driven.
- Zero-mock policy: genuine database queries, DOM structure verification, and mathematical assertions.
- Node.js 22+ Native Test Runner (`node:test`, `node:assert/strict`).

## Feature Inventory & Test Mapping
| # | Feature | Requirement | Planned Test Suite | Expected Tests |
|---|---------|-------------|--------------------|:--------------:|
| 1 | HeroUI Semantic Slots & Contrast Tokens | R1 | Suite 16 | 4 |
| 2 | Dual-Speed Infinite Marquee Carousel | R2 | Suite 17 | 4 |
| 3 | 5 Core Alpine Services & Leaflet Map Fly-To | R3 | Suite 18 | 5 |
| 4 | Full-Page Luxury Mobile Navigation & Emergency SAR CTA | R4 | Suite 19 | 4 |
| 5 | Trail Selector HUD Deduplication & Metadata | R5 | Suite 20 | 4 |

## Target Metrics
- Current baseline: 75 tests passing (57 in `tests/integration.test.mjs`, 18 in `tests/drone-kinematics-adversarial.test.mjs`).
- New tests: 21 tests added in Suites 16–20.
- Total expected tests: 96 tests (100% passing).
