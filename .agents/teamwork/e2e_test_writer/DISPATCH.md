# E2E Testing Track Dispatch: Test Writer

## Target
Design and implement the comprehensive opaque-box E2E test suite for Phase 4 of The Himalayan Trails according to `TEST_INFRA.md` and `ORIGINAL_REQUEST.md`.

## Key Responsibilities:
1. Read `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md` and `c:\Users\acer\Desktop\The Himalayan Trails\TEST_INFRA.md`.
2. Review existing tests in `tests/integration.test.mjs` (Suites 1–10).
3. Implement new test suites in `tests/integration.test.mjs`:
   - **Suite 11: Phase 4 GPX & KML Route Importer, Geodesic Math & Waypoint Studio (R2)**
     - Test parsing valid GPX XML (trackpoints, elevations, waypoints).
     - Test parsing valid KML XML (LineString coordinates, Placemark points).
     - Test Haversine distance, elevation gain/loss calculations.
     - Test boundary cases: corrupt XML, missing elevations, empty track.
   - **Suite 12: Phase 4 Reviews, Multi-Criteria Ratings & Dynamic Aggregate Scores (R3)**
     - Test reviews table schema.
     - Test submitting valid 1-5 star multi-criteria review (overall, difficulty, scenic, safety).
     - Test automatic recalculation of `rating` and `reviews_count` on `trails` table.
     - Test boundary validation: rejects 0 or 6 rating, rejects empty comments, rejects unauthenticated submission.
   - **Suite 13: Phase 4 Explorer Badges & Gamification (R3)**
     - Test `user_badges` table schema with UNIQUE(user_id, badge_id).
     - Test badge unlocking logic for review submissions ("Trail Blazer", "Safety Sentinel", region badges).
     - Test querying user badges for dashboard.
   - **Suite 14: Phase 4 Expedition Checkout, ACID Deposit Reservation & Lifecycle (R4)**
     - Test pricing calculations: base price, tiered group discounts (5%, 10%, 15%), regional permits (Everest $50, Annapurna $50, Manaslu $160, Mustang $530), 13% Nepal VAT.
     - Test ACID deposit (25%) vs full (100%) payment reservation transaction.
     - Test balance accounting (`remaining_balance = total - deposit`).
     - Test 5-state lifecycle transitions (`PENDING` -> `CONFIRMED` -> `EXPEDITION_ACTIVE` -> `COMPLETED` -> `CANCELLED`).
4. Publish `TEST_READY.md` at project root using the exact template from the Project Pattern.
5. Verify test syntax with `node --check tests/integration.test.mjs`.

## Working Directory:
`c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\e2e_test_writer`
Deliver handoff report to:
`c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\e2e_test_writer\handoff.md`

## 2026-09-26T15:52:00Z
You are the E2E Test Writer for Phase 4 of The Himalayan Trails.
Your working directory is:
c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\e2e_test_writer

MANDATORY FIRST STEPS:
1. Read the user's verbatim request in:
   c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read your dispatch instructions in:
   c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\e2e_test_writer\DISPATCH.md
3. Read the test blueprint in:
   c:\Users\acer\Desktop\The Himalayan Trails\TEST_INFRA.md
4. Read the project contracts in:
   c:\Users\acer\Desktop\The Himalayan Trails\PROJECT.md

TASK:
Implement the Phase 4 test suites in `tests/integration.test.mjs` according to `TEST_INFRA.md`:
- Suite 11: Phase 4 GPX & KML Route Importer, Geodesic Math & Waypoint Studio (R2)
- Suite 12: Phase 4 Reviews, Multi-Criteria Ratings & Dynamic Aggregate Scores (R3)
- Suite 13: Phase 4 Explorer Badges & Mountain Honors Gamification (R3)
- Suite 14: Phase 4 Expedition Checkout, ACID Deposit Reservation & Lifecycle (R4)
Ensure all test cases run cleanly against real SQLite models, real routes, and real geodesic logic without mocks.
Verify test file syntax with `node --check tests/integration.test.mjs`.
Create `TEST_READY.md` at project root with test runner commands and coverage summary table.

Write your handoff report to:
c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\e2e_test_writer\handoff.md
Update your progress.md regularly with Last visited timestamps.
When complete, send a message back to the orchestrator.
