# Implementation Dispatch: Worker 1 (Milestone 1 — 3D Drone Flight Path Simulator & Telemetry)

## Target
Implement Milestone 1 (Requirement R1):
- 3D Cesium Drone Flight Path Simulator along GPS coordinates
- Dynamic camera pitch following slope gradient, forward-lookahead bearing
- Frosted glass HUD Telemetry Console (`DroneFlightConsole.tsx`) with Play, Pause, 1x/2x/5x speed multiplier, Restart
- Live telemetry HUD (altitude meters & feet, remaining distance, current speed km/h, slope grade %, ETA to next landmark, barometric O2%)
- Recharts elevation profile scrubber bidirectional synchronization with drone camera
- "Start Drone Fly-Through" trigger in `CesiumGlobeMap.tsx`

## Authoritative Inputs
1. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md` (verbatim requirements)
2. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_survey_1\handoff.md` (detailed architectural blueprint, mathematical models, Cesium clock integration)
3. `c:\Users\acer\Desktop\The Himalayan Trails\PROJECT.md` (system architecture and interface contracts)
4. `.agents/rules/heroui_component_theme_rules.md` and `.agents/skills/recharts-charts/SKILL.md`

## Exclusive Write Ownership
Worker 1 exclusively owns and may modify:
- `src/lib/map/types.ts`
- `src/lib/map/CesiumController.ts`
- `src/components/map/DroneFlightConsole.tsx` (create new)
- `src/components/map/ElevationProfileChart.tsx`
- `src/components/map/CesiumGlobeMap.tsx`

DO NOT modify files outside of this boundary!

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Completion Criteria
1. Full drone flight simulator implemented in `CesiumController.ts` using smooth geodesic interpolation on `viewer.clock.onTick`.
2. HUD console created in `src/components/map/DroneFlightConsole.tsx` adhering to HeroUI semantic slots (`data-slot="base"`, `data-slot="header"`, `data-slot="controls"`, `data-slot="telemetry"`), frosted glass theme tokens, and gold accents (`#B68D40`).
3. Bi-directional scrubber synchronization with `ElevationProfileChart.tsx`.
4. `CesiumGlobeMap.tsx` provides "Start Drone Fly-Through" action.
5. Worker MUST execute `npx tsc --noEmit` and `npm run test` and document exact passing output.
6. Deliver handoff report to `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\worker_m1\handoff.md`.

## 2026-09-26T15:52:00Z
Received invocation:
- Role: Worker 1 for Milestone 1 (3D Cesium Drone Flight Path Simulator & Telemetry)
- Working directory: c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\worker_m1
- Exclusive write boundary:
  - src/lib/map/types.ts
  - src/lib/map/CesiumController.ts
  - src/components/map/DroneFlightConsole.tsx (create new)
  - src/components/map/ElevationProfileChart.tsx
  - src/components/map/CesiumGlobeMap.tsx
- Output handoff: c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\worker_m1\handoff.md

## 2026-09-26T15:58:35Z
From Parent (5c9ce7f7-d99c-4d69-97b3-30d674223482):
**Context**: Milestone 1 Drone Flight implementation in CesiumController.ts
**Content**: The E2E Test Writer noted a pre-flight TypeScript warning: `Property 'stopTour' does not exist on type 'CesiumController'`. Please make sure the `stopTour(): void` method is retained/defined on `CesiumController` and matches any references in `SummitTourConsole.tsx` so `npx tsc --noEmit` passes with 0 errors.
**Action**: Ensure `stopTour` is defined and verify with `npx tsc --noEmit` before concluding your handoff report.

