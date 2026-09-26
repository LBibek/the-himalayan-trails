# Survey Handoff Report: Explorer 1 (Map Architecture & 3D Drone Flight Path Simulation)

**Target**: Investigation and architectural specification for **R1: 3D Cesium Drone Flight Path Simulator & Telemetry**.  
**Working Directory**: `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_survey_1`  
**Date**: 2026-09-26  
**Status**: Completed (Hard Handoff)

---

## 1. Observation

### 1.1 Map Controllers Architecture
- **`src/lib/map/types.ts`**:
  - Defines core geospatial primitives and map abstraction:
    - `GeoPoint`: `{ lat: number; lng: number; altitude?: number }` (lines 1-5).
    - `MapMarker`: `{ id: string; position: GeoPoint; title: string; category?: string; elevation?: number; iconUrl?: string }` (lines 7-14).
    - `MapPolyline`: `{ id: string; points: GeoPoint[]; color?: string; weight?: number }` (lines 16-21).
    - `IMapController`: Contract containing `engineType: 'leaflet' | 'cesium'`, `isInitialized: boolean`, `init(...)`, `flyTo(...)`, `setTrailPolyline(...)`, `clearTrailPolyline()`, `addMarkers(...)`, `clearMarkers()`, `setScrubberPosition(...)`, and `destroy()` (lines 30-42).
- **`src/lib/map/CesiumController.ts`**:
  - Implements `IMapController` with private `viewer: any` and `Cesium: any` (lines 4-13).
  - Contains imperative 3D management methods:
    - `setPerspective(preset: 'topo' | 'ridge' | 'summit')` (lines 179-212)
    - `setTrailPolyline(polyline: MapPolyline)` (lines 214-238)
    - `setAllRouteTracks(tracks, activeTrackId)` (lines 248-276)
    - `setRangeBoundaries(ranges, activeRangeName)` (lines 285-316)
    - `setScrubberPosition(point: GeoPoint | null)` (lines 364-399) - creates a yellow glowing beacon `cesium-scrubber-beacon`
    - `flyToTourWaypoint(waypoint, options)` (lines 401-435) - discrete jump using `flyToBoundingSphere`
    - `setTimeOfDayLighting(preset)` (lines 437-461)
    - `startOrbitalRotation(center, radius, speedRps)` (lines 463-489) - uses `viewer.clock.onTick`
    - `stopTour()` (lines 491-499)
- **`src/lib/map/LeafletController.ts`**:
  - Implements `IMapController` using Leaflet 1.9.4, OpenTopoMap tiles, marker clustering/layers, and `L.polyline` (lines 1-151).
- **`src/lib/map/MapEngineManager.ts`**:
  - Manages engine state (`activeController`, `currentEngine: 'leaflet' | 'cesium'`), restores `lastPolyline`, `lastMarkers`, and `lastScrubberPoint` when switching engines (lines 7-85).

### 1.2 Polyline Structures and Data Flow
- **`src/data/routeTracks.ts`**:
  - Contains `ROUTE_TRACKS: Record<string, { name: string; color: string; coords: [number, number][] }>` where coordinates are `[lat, lng]` (lines 1-2507).
- **`src/types/index.ts`**:
  - `Trail` model: contains `distanceKm: number`, `maxElevation: number`, `elevationProfile?: { distanceKm: number; elevation: number; label?: string }[]`, and `routeCoordinates?: [number, number, number?][]` (lines 1-25).
- **Coordinate Order Differences**:
  - In `src/lib/map/CesiumController.ts`: `polyline.points` are converted via `Cesium.Cartesian3.fromDegrees(p.lng, p.lat, (p.altitude || 3000) + 15)` (line 219) — notice `longitude` is the first parameter in Cesium `Cartesian3.fromDegrees(lng, lat, height)`.
  - In `ROUTE_TRACKS`, coordinates are stored as `[lat, lng]`, so `coords.map(c => Cartesian3.fromDegrees(c[1], c[0], 3500))` is used (line 258).

### 1.3 Cesium Initialization & Render Loop
- **Version & CDN**:
  - `CesiumController.ts` dynamically loads CesiumJS version **1.121** via script and link injection from `https://cesium.com/downloads/cesiumjs/releases/1.121/Build/Cesium/` (lines 27-34, 131-156).
  - Sets `(window as any).CESIUM_BASE_URL = CESIUM_CDN_BASE`.
- **Terrain & Imagery**:
  - Checks `process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN`.
  - If valid token: uses `createWorldTerrainAsync` and `createWorldImageryAsync` (lines 52-66).
  - Fallback / Token-free default: `EllipsoidTerrainProvider` with Esri World Imagery (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`) (lines 76-86).
- **Viewer Configuration**:
  - `requestRenderMode: true` and `maximumRenderTimeChange: Number.POSITIVE_INFINITY` (lines 108-109).
  - **Critical Observation**: Because `requestRenderMode` is `true`, Cesium does not re-render continuously unless `scene.requestRender()` is explicitly triggered on each animation frame or `viewer.scene.requestRenderMode` is toggled to `false` during drone flight simulation.

### 1.4 Camera Movement & Animation
- Existing camera calls in `CesiumController.ts`:
  - `flyTo`: calls `this.viewer.camera.flyTo({ destination, orientation: { heading, pitch, roll }, duration })` (lines 158-177).
  - `flyToTourWaypoint`: calls `this.viewer.camera.flyToBoundingSphere(...)` (lines 424-434).
  - `startOrbitalRotation`: hooks `orbitListener` to `this.viewer.clock.onTick` and calls `viewer.camera.lookAt` (lines 475-487).
  - `stopTour`: removes `_orbitListener` and resets `viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)` (lines 491-499).
- **Missing Drone Simulator Capabilities**:
  - No continuous parametric camera motion along polyline path points.
  - No Play / Pause / 1x / 2x / 5x speed multiplier controller for polyline travel.
  - No slope gradient calculation or dynamic camera pitch adjustment.
  - No real-time telemetry extraction (altitude, remaining distance, next landmark ETA).

### 1.5 Recharts Elevation Profile Chart Interaction
- **`src/components/map/ElevationProfileChart.tsx`**:
  - Renders Recharts `AreaChart` with golden gradient `#B68D40` (lines 324-385).
  - Maps `relevantLandmarks` to `landmarkMarkers` along the route track using minimum squared Euclidean distance (`minDistSq`) (lines 161-199).
  - Places `<ReferenceDot>` markers at landmark checkpoints (lines 361-373).
  - Prop `onHoverPoint` emits `{ distanceKm, elevation, label, lat, lng }` on `MouseMove`.
  - In `UnifiedDiscoveryHub.tsx` (lines 652-686), `onHoverPoint` calculates coordinates and updates `focusedCoords`, which is fed into `CesiumGlobeMap` as `scrubberPoint`.
  - Prop `activePointIndex` is declared in `ElevationProfileChartProps` (line 48) but not yet used to render an active flight scrubber marker or vertical line.

### 1.6 Verification Status
- `npx tsc --noEmit` passes with 0 errors.
- `npm run test` executes 30 test cases across 11 suites with 100% pass rate.
- Suite 9 explicitly tests `ReferenceDot`, `onSelectPoint`, `onSelectLandmark`, `scrubberPoint`, `minDistSq`, and HeroUI data slots.

---

## 2. Logic Chain

1. **Polyline Parametrization for Continuous Flight**:
   - Discrete `flyTo` or `flyToTourWaypoint` creates snapping and cannot support smooth speed control (1x, 2x, 5x) or continuous telemetry.
   - Therefore, a continuous flight path must pre-calculate cumulative geodesic distance across polyline points: $D = [0, d_0, d_0 + d_1, \dots, D_{\text{total}}]$.
   - At any time $t$, distance traversed is $s(t) = s_0 + v \cdot \Delta t$, where $v = v_{\text{base}} \cdot \text{speedMultiplier}$.
   - Binary search locates segment index $k$ such that $D_k \le s < D_{k+1}$, giving interpolation factor $u = (s - D_k) / (D_{k+1} - D_k) \in [0, 1)$.
   - Interpolated coordinate $(lat, lng, alt)$ represents exact drone position.

2. **Dynamic Camera Orientation (Heading, Slope Pitch, and Roll)**:
   - To look along the trail rather than facing north or snapping:
     - Sample lookahead point at $s + \Delta s$ (where $\Delta s \approx 40\text{m}$ to $60\text{m}$).
     - Forward bearing (Yaw/Heading):
       $$\theta_{\text{heading}} = \text{atan2}(\sin \Delta \lambda \cos \phi_2, \cos \phi_1 \sin \phi_2 - \sin \phi_1 \cos \phi_2 \cos \Delta \lambda)$$
     - Slope Gradient & Dynamic Pitch:
       $$\Delta h = alt_{\text{ahead}} - alt_{\text{current}}, \quad \Delta d = \text{distance}(P_{\text{current}}, P_{\text{ahead}})$$
       $$\text{slopeAngle} = \text{atan2}(\Delta h, \Delta d)$$
     - Camera pitch formula: $\text{pitch} = \text{basePitch} + k_{\text{slope}} \cdot \text{slopeAngle}$, clamped between $-45^\circ$ and $+15^\circ$.
     - Camera altitude: add drone flight height offset AGL (e.g. $+80\text{m}$ to $+120\text{m}$) above ground to give cinematic drone perspective and avoid terrain clipping.

3. **Cesium Render Loop Synchronization**:
   - Because `requestRenderMode` is `true`, updating camera position on `clock.onTick` without triggering renders causes frozen frames.
   - Solution: During active flight, temporarily set `viewer.scene.requestRenderMode = false` (or invoke `viewer.scene.requestRender()` inside the tick listener), and restore `viewer.scene.requestRenderMode = true` when flight is paused or completed.

4. **HUD Telemetry Generation**:
   - In each tick, the flight controller computes:
     - `currentAltitude`: in meters and feet.
     - `remainingDistance`: $(D_{\text{total}} - s) / 1000$ in km.
     - `currentSpeedKmh`: speed in km/h.
     - `slopePercent`: $(\Delta h / \Delta d) \times 100\%$.
     - `nextLandmark`: compare $s$ against landmark distances along track; calculate $\Delta D = D_{\text{lm}} - s$ and $\text{ETA} = \Delta D / v$.
     - `oxygenPercentage`: $100 \cdot e^{-alt / 7200}$ (barometric formula).

5. **Bidirectional Elevation Profile Synchronization**:
   - Flight -> Chart: Telemetry emits `currentDistanceKm`, which is passed to `ElevationProfileChart` as `activeDistanceKm`. A vertical golden reference line `<ReferenceLine x={activeDistanceKm} stroke="#fbbf24" strokeWidth={2} />` and glowing beacon `<ReferenceDot>` visually scrub across the chart in real time.
   - Chart -> Flight: Clicking or scrubbing `ElevationProfileChart` triggers `onSelectPoint`, passing `distanceKm`. The drone flight simulator immediately calls `seekDroneFlight(distanceKm)` to reposition the camera and drone beacon.

---

## 3. Caveats

1. **Elevation Data Resolution**:
   - `ROUTE_TRACKS` in `src/data/routeTracks.ts` provides high-density 2D lat/lng coordinates, but altitude values are not present on every coordinate point.
   - *Mitigation*: For official trails, interpolate altitude from `trail.elevationProfile` using distance ratio or sample terrain height. For uploaded GPX/KML routes (R2), preserve `<ele>` tags from trackpoints.
2. **WebGL Context and High DPR Performance**:
   - Rendering full 3D terrain and running a 60 FPS flight animation can stress lower-end mobile GPUs.
   - *Mitigation*: Respect existing `resolutionScale = Math.min(dpr, 1.5)` in `CesiumController.ts` and ensure render requests stop when paused.
3. **Existing Integration Tests**:
   - `tests/integration.test.mjs` checks for exact slot names (`data-slot="base"`, `data-slot="header"`, etc.) and key tokens. All additions must strictly adhere to HeroUI compound semantics.

---

## 4. Conclusion & Architectural Recommendation

### 4.1 Interface Extensions (`src/lib/map/types.ts`)
Add `DroneFlightTelemetry` and extend `IMapController`:
```typescript
export interface DroneFlightTelemetry {
  isPlaying: boolean;
  speedMultiplier: 1 | 2 | 5;
  currentDistanceMeters: number;
  totalDistanceMeters: number;
  progressRatio: number; // 0.0 to 1.0
  currentPosition: GeoPoint;
  currentAltitudeMeters: number;
  remainingDistanceKm: number;
  currentSpeedKmh: number;
  headingDegrees: number;
  pitchDegrees: number;
  slopePercent: number;
  nextLandmark?: {
    name: string;
    distanceKm: number;
    etaSeconds: number;
  };
}

export interface IMapController {
  // Existing methods preserved...
  startDroneFlight?(options?: { speedMultiplier?: 1 | 2 | 5; initialDistanceMeters?: number }): void;
  pauseDroneFlight?(): void;
  resumeDroneFlight?(): void;
  setDroneFlightSpeed?(multiplier: 1 | 2 | 5): void;
  seekDroneFlight?(distanceMetersOrRatio: number): void;
  stopDroneFlight?(): void;
  onDroneTelemetry?(listener: (telemetry: DroneFlightTelemetry) => void): () => void;
}
```

### 4.2 CesiumController Implementation (`src/lib/map/CesiumController.ts`)
Add drone flight subsystem:
1. `setupDroneFlightPath(polyline: MapPolyline, landmarks?: Landmark[])`: pre-computes cumulative distances, segments, and landmark checkpoints.
2. `startDroneFlight(...)`, `pauseDroneFlight()`, `resumeDroneFlight()`, `setDroneFlightSpeed(1 | 2 | 5)`, `seekDroneFlight(...)`, `stopDroneFlight()`.
3. Creates a 3D drone beacon entity (`id: 'cesium-drone-beacon'`) with pulsating gold color and dynamic position.
4. Uses `viewer.clock.onTick` with smooth interpolation, tangent bearing calculation, dynamic slope pitch, and calls `viewer.camera.setView(...)`.
5. Emits `DroneFlightTelemetry` to subscribers on every tick.

### 4.3 New Component: `DroneFlightConsole.tsx` (`src/components/map/DroneFlightConsole.tsx`)
Create a dedicated frosted-glass HUD using HeroUI compound structure:
- `data-slot="base"`: `FloatingMapPanel` with drag, minimize, maximize.
- `data-slot="header"`: Title "3D Drone Flight Path Simulator", Trail Name badge, Mode indicator.
- `data-slot="controls"`:
  - Play / Pause button with kinetic icon toggle
  - Restart button (seek to 0m)
  - Speed Multiplier pills: `1x` (50 km/h), `2x` (100 km/h), `5x` (250 km/h)
  - Interactive flight timeline scrubber bar (0% to 100%)
- `data-slot="telemetry"`:
  - Altitude gauge (meters + feet) with barometric $O_2\%$
  - Remaining distance (km)
  - Current speed (km/h)
  - Slope gradient (% grade & dynamic camera tilt angle)
  - Next Landmark card with dynamic countdown ETA (e.g., "Tengboche in 3m 45s")

### 4.4 CesiumGlobeMap Integration (`src/components/map/CesiumGlobeMap.tsx`)
- Extend `mode` prop: `mode?: 'freeroam' | 'summit-tours' | 'drone-flight'`.
- Add "Start Drone Fly-Through" action button in the top action bar when `activeTrail` or `polyline` is selected.
- In `drone-flight` mode, render `<DroneFlightConsole controller={controllerRef.current} trail={activeTrail} polyline={polyline} onTelemetryChange={...} />`.

### 4.5 ElevationProfileChart Scrubber Sync (`src/components/map/ElevationProfileChart.tsx`)
- Add `activeDistanceKm?: number` prop.
- Render vertical `<ReferenceLine x={activeDistanceKm} stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 3" />` and `<ReferenceDot>` matching the drone's position.
- Clicking on the chart calls `onSelectPoint`, which invokes `seekDroneFlight(point.distanceKm * 1000)`.

---

## 5. Verification Method

1. **TypeScript Pre-Flight**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: 0 compilation errors.
2. **Automated Integration Tests**:
   ```bash
   npm run test
   ```
   *Expected*: All test suites pass 100%.
3. **Code Inspection**:
   - Verify `IMapController` and `CesiumController` contain `startDroneFlight`, `pauseDroneFlight`, `resumeDroneFlight`, `setDroneFlightSpeed`, `seekDroneFlight`, and `stopDroneFlight`.
   - Verify `src/components/map/DroneFlightConsole.tsx` exists and implements `Play`, `Pause`, `1x/2x/5x`, `Restart`, and Telemetry HUD with HeroUI slots.
   - Verify `CesiumGlobeMap.tsx` exposes the "Start Drone Fly-Through" trigger.
   - Verify `ElevationProfileChart.tsx` renders dynamic golden flight scrubber reference line at `activeDistanceKm`.
4. **Invalidation Conditions**:
   - Jerky camera movements or camera snapping instead of continuous smooth interpolation.
   - Frame freezing due to `requestRenderMode: true` failing to request renders during flight.
   - Mock data or hardcoded fake intervals (must adhere strictly to Zero-Mock Policy).
