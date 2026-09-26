# Handoff Report: Explorer 2 (Custom GPX/KML Route Importer & Waypoint Studio)

## Executive Summary
This survey provides a comprehensive investigation of the codebase for **Requirement R2: Custom GPX & KML Route File Importer & Waypoint Studio**. It covers existing page structures (`UnifiedDiscoveryHub`, `ItineraryPlannerPage`), geospatial representations (`Trail`, `PlannerWaypoint`, `Landmark`, `MapMarker`), XML parsing landscape in `package.json`, geodesic and elevation math formulas, Recharts elevation charting paradigms, 2D Leaflet and 3D Cesium waypoint rendering, and concrete architectural blueprints for implementing drag-and-drop GPX/KML route import and the interactive Waypoint Studio.

---

## 1. Observation

### 1.1 Map Explorer & Itinerary Planner Pages and Components
- **Map Explorer Entry Points**:
  - `src/app/map/page.tsx:4` and `src/app/explore/page.tsx:4` both render `<UnifiedDiscoveryHub defaultLayout="split" />`.
  - `src/components/explorer/UnifiedDiscoveryHub.tsx` (877 lines):
    - Lines 78-94 manage trails catalog, selected trail, layout mode (`split` | `mapOnly` | `cardsOnly`), map engine (`2d` | `3d-freeroam` | `3d-summit-tours`), `focusedCoords: [number, number] | undefined`, and `showElevationProfile: boolean`.
    - Lines 599-635 render the map container dynamically switching between `LeafletMap` (2D) and `CesiumGlobeMap` (3D).
    - Lines 638-690 render the docked `ElevationProfileChart` inside a floating panel at the bottom of the map, with `onHoverPoint` and `onSelectPoint` synchronizing `focusedCoords` with the 2D/3D map engines.
    - **Current Gap**: `UnifiedDiscoveryHub.tsx` does not have any UI, dropzone, or state for importing custom `.gpx` or `.kml` route files, nor does it have controls to manage custom user-added waypoints.

- **Itinerary Planner**:
  - `src/app/itinerary/planner/page.tsx` (991 lines):
    - Lines 214-292 initialize `waypoints: PlannerWaypoint[]` with 7 pre-populated days along the Everest Base Camp trek.
    - Lines 335-363 implement drag-and-drop day reordering using `@dnd-kit/core` and `@dnd-kit/sortable` (`arrayMove`), updating day numbers and altitude gains.
    - Lines 399-424 implement `handleAddWaypointOnMapClick(lat, lng, activity)`.
    - Lines 427-438 implement `handleUpdateWaypointCoords(index, lat, lng)` triggered by marker dragging.
    - Lines 441-456 implement `handleDeleteDay(index)`.
    - Lines 459-507 implement `handleExportGPX()` which generates standard GPX 1.1 XML using template string formatting and triggers browser blob download.
    - Lines 812-850 render `ItineraryPlannerMap` (2D Leaflet) or `CesiumGlobeMap` (3D Cesium) with `cesiumPolyline` and `cesiumMarkers`.
    - Lines 978-986 render `PlannerElevationChart` with 3-way synchronization (Map ↔ DnD Timeline ↔ Recharts Profile).
    - **Current Gap**: While `ItineraryPlannerPage` exports GPX XML, it completely lacks an "Import GPX / KML" upload button, drag-and-drop file listener, or file parser.

- **Expedition Map Editor**:
  - `src/components/admin/ExpeditionMapEditor.tsx` (459 lines):
    - Lines 50-59 define `calculatePolylineDistance(coords: [number, number][])` using Leaflet's `latlng1.distanceTo(latlng2)`.
    - Lines 116-160 support drawing trails (`mode === 'drawTrail'`) and adding landmarks (`mode === 'addLandmark'`).

### 1.2 Route Coordinates and Waypoint Data Representation
- **Official Trails**:
  - In `src/types/index.ts:1-25`, `Trail` defines:
    - `routeCoordinates?: [number, number, number?][]` (lat, lng, elevation).
    - `elevationProfile?: { distanceKm: number; elevation: number; label?: string }[]`.
    - `distanceKm: number`, `elevationGain: number`, `maxElevation: number`, `startPoint: string`, `endPoint: string`.
  - In SQLite database `data/himalayan_trails.db` (`src/lib/db.ts:61-81, 249-254`), the `trails` table stores `route_coordinates` as a JSON text column and `elevation_profile` as a JSON text column.
  - In `src/data/routeTracks.ts:3-60`, `ROUTE_TRACKS` provides static polyline coordinate arrays `coords: [number, number][]` for 6 core Himalayan trails (`ebc-trek`, `annapurna-circuit`, `langtang-valley`, `manaslu-circuit`, `upper-mustang`, `rolwaling-valley`).

- **Planner Waypoints**:
  - In `src/types/planner.ts:3-14`, `PlannerWaypoint` defines:
    - `id?: string`
    - `day: number`
    - `title: string`
    - `distanceKm: number`
    - `sleepingAltitude: number`
    - `altitudeGain: number`
    - `activityType: 'trekking' | 'acclimatization' | 'pass' | 'flight' | 'camp' | 'monastery'`
    - `coordinates: { lat: number; lng: number }`
    - `landmarkName?: string`
    - `notes?: string`

- **Landmarks / POIs**:
  - In `src/types/index.ts:36-48`, `Landmark` defines:
    - `id`, `name`, `nativeName`, `category`, `elevation`, `region`, `coordinates: { lat: number; lng: number }`, `image`, `description`, `permitRequired`, `associatedTrail`.
  - Stored in SQLite `landmarks` table (`src/lib/db.ts:85-101`).

- **Unified Map Engine Types**:
  - In `src/lib/map/types.ts`:
    - `GeoPoint: { lat: number; lng: number; altitude?: number }`
    - `MapMarker: { id: string; position: GeoPoint; title: string; category?: string; elevation?: number }`
    - `MapPolyline: { id: string; points: GeoPoint[]; color?: string; weight?: number }`

### 1.3 Parsing Libraries & Codebase State
- In `package.json:13-39`:
  - No external XML parser package (such as `@tmcw/togeojson`, `fast-xml-parser`, `gpxparser`, `xml2js`) is present.
  - Dependencies installed: `next: 16.3.6`, `react: 19.2.8`, `leaflet: ^1.9.4`, `react-leaflet: ^5.0.0`, `recharts: ^3.10.1`, `@dnd-kit/core: ^6.3.1`, `@dnd-kit/sortable: ^10.0.0`, `@dnd-kit/utilities: ^3.2.2`, `gsap: ^3.15.0`, `lucide-react: ^1.48.0`.
- In `src/app/share-trail/page.tsx:206-214`:
  - There is a static placeholder UI box reading "Standard WGS84 GPS coordinate format accepted" without any file handler or parsing logic.
- Observation on standard web APIs:
  - Modern browsers have native `DOMParser` (`new DOMParser().parseFromString(xml, 'text/xml')` or `'application/xml'`).
  - Node.js test runtime (`node:test`) does not have `window.DOMParser` by default unless polyfilled or parsed with regex/string extraction.

### 1.4 Distance, Elevation Gain & Loss Computations
- `calculatePolylineDistance` in `ExpeditionMapEditor.tsx:50-59` relies on Leaflet's `L.latLng().distanceTo()`.
- In `src/app/itinerary/planner/page.tsx:327`, total distance is computed by summing `w.distanceKm`.
- In `PlannerElevationChart.tsx:74`, total ascent is computed by summing positive gains:
  `const totalAscent = waypoints.reduce((acc, w) => acc + (w.altitudeGain > 0 ? w.altitudeGain : 0), 0);`
- GPS trackpoints require great-circle haversine calculation across successive coordinates `(lat1, lon1)` and `(lat2, lon2)`, along with noise-filtered elevation deltas `(ele2 - ele1)` with a minimum threshold (e.g. 1.5m to 2.0m) to avoid GPS barometric jitter accumulation.

### 1.5 Elevation Profile Plotting & Recharts Synchronization
- Recharts Skill (`.agents/skills/recharts-charts/SKILL.md`):
  - Requires `'use client';` client boundary and mounted state guard to prevent Next.js SSR hydration mismatches.
  - Himalayan Gold Theme: Area stroke `#B68D40` (2.5px), linear gradient fill from `rgba(182, 141, 64, 0.4)` to `rgba(182, 141, 64, 0.0)`.
  - Tooltips: Frosted glass `backdrop-blur-xl bg-surface/90 border border-accent/40 shadow-2xl rounded-xl p-3 text-surface-foreground`.
  - Chart components: `AreaChart`, `Area`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `ReferenceDot`, `CartesianGrid`.
- In `src/components/map/ElevationProfileChart.tsx:133-159`:
  - Maps raw distance/elevation points to route track coordinates for map synchronization.
  - Lines 162-199 compute landmark placement along the elevation curve using minimum squared Euclidean distance (`minDistSq`) against route coordinates.
  - Hovering points triggers `onHoverPoint({ distanceKm, elevation, lat, lng })` which updates `focusedCoords` on `LeafletMap` and `CesiumGlobeMap`.

### 1.6 Waypoint Rendering on 2D Leaflet & 3D Cesium
- **2D Leaflet**:
  - `LeafletMap.tsx`: Renders summits with `createSummitIcon` and landmarks with `createCustomIcon`. Renders `ROUTE_TRACKS` polylines and a bouncing scrubber marker at `focusedCoords`.
  - `ItineraryPlannerMap.tsx`: Renders draggable markers (`draggable={true}`, `dragend` callback `onUpdateWaypointCoords`), clicks on map add waypoints (`MapClickListener`), popup contains a Delete button (`onDeleteWaypoint`).
- **3D Cesium**:
  - `CesiumController.ts:325-355` adds markers using `viewer.entities.add` with a gold point (`#B68D40`) and white billboard label with black outline.
  - `CesiumController.ts:214-239` renders the route polyline using `viewer.entities.add({ polyline: { positions, clampToGround: true, material: Color.fromCssColorString('#B68D40') } })`.
  - `CesiumController.ts:364-399` renders the glowing yellow scrubber beacon at `point.altitude + 30m`.
  - `CesiumGlobeMap.tsx:167-195` syncs `activeTrail` or `polyline` into the 3D globe.

### 1.7 Current Project Health & Tests
- `npm run test`: All 30 existing unit and integration tests pass with 100% success (0 failures, 199ms).
- `npx tsc --noEmit`: Exits cleanly with 0 TypeScript compilation errors.

---

## 2. Logic Chain

1. **Requirement Analysis**:
   - R2 mandates:
     - Drag-and-drop or upload custom `.gpx` and `.kml` track files directly in the Map Explorer and Itinerary Planner.
     - Parse XML trackpoints.
     - Compute total distance, elevation gain, and elevation loss.
     - Dynamically render the route on 2D Leaflet and 3D Cesium maps.
     - Plot the Recharts elevation profile with interactive synchronization.
     - Allow dropping and managing custom waypoint markers (add, edit, delete).

2. **Parsing Architecture Selection**:
   - Because `package.json` contains no external XML parser and zero-mock/production-ready standards discourage unnecessary heavy bloatware, a self-contained, zero-dependency parser engine (`src/lib/geo/routeParser.ts`) is optimal.
   - It will use the standard browser `DOMParser` (`new DOMParser().parseFromString(text, 'text/xml')`) when running in the browser (client components), which accurately handles GPX 1.0/1.1 tags (`<trkpt lat="" lon=""><ele>`, `<wpt lat="" lon=""><name><ele>`, `<rtept>`) and KML 2.2 tags (`<LineString><coordinates>`, `<gx:Track><gx:coord>`, `<Placemark><Point><coordinates>`).
   - For Node.js test environments (`tests/integration.test.mjs`), a robust regex/text extraction fallback will be included so automated integration tests execute cleanly in standard `node:test` without needing JSDOM.

3. **Geodesic & Elevation Math Implementation**:
   - From trackpoints `[{ lat, lng, elevation }]`:
     - Distance between successive points is calculated via the Haversine formula:
       $$d = 2 R \arcsin\left(\sqrt{\sin^2(\Delta\phi/2) + \cos(\phi_1)\cos(\phi_2)\sin^2(\Delta\lambda/2)}\right)$$
       where $R = 6371\text{ km}$.
     - Total distance is the cumulative sum of distances.
     - Elevation gain is $\sum \max(0, \Delta \text{ele})$ for $\Delta \text{ele} \ge 1.5\text{m}$.
     - Elevation loss is $\sum \max(0, -\Delta \text{ele})$ for $-\Delta \text{ele} \ge 1.5\text{m}$.
     - Extrema: $E_{\max} = \max(\text{ele})$, $E_{\min} = \min(\text{ele})$.

4. **Recharts Decimation Strategy**:
   - GPX track logs often contain 2,000 to 15,000 dense GPS points recorded every 1-5 seconds. Passing 15,000 SVG points to Recharts causes severe layout recalculations, dropped frames, and tooltip lag.
   - The route parser must generate a downsampled elevation profile (100–150 data points) preserving critical topological peaks and valleys, while preserving the full high-resolution polyline for 2D Leaflet and 3D Cesium rendering.

5. **Component Integration Strategy**:
   - Create a reusable `RouteFileImporter` component (`src/components/route/RouteFileImporter.tsx`):
     - Renders a drag-and-drop dropzone with drag-over visual feedback (`border-[#B68D40]`, gold glow).
     - Provides standard file browse button (`accept=".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml"`).
     - Includes sample route buttons (e.g., "Everest Three Passes GPX", "Annapurna Sanctuary KML") for instant one-click testing.
     - Validates file size, extension, XML syntax, and coordinate sanity (valid lat/lng bounds).
     - Returns `ParsedRouteResult` to parent.
   - Create a unified `WaypointStudio` component (`src/components/route/WaypointStudio.tsx`):
     - Displays all waypoints (both imported from `<wpt>` / `<Placemark>` and custom-added).
     - Enables adding new waypoints (name, activity/category, elevation, notes, coordinates).
     - Enables editing existing waypoints in-place or via modal.
     - Enables deleting waypoints.
     - Enables dropping a waypoint at the current map center or scrubber position.
   - Integrate into `UnifiedDiscoveryHub.tsx`:
     - Add "Import Custom Route" button in top navigation.
     - Manage `customRoute: ParsedRouteResult | null` and `customWaypoints: MapMarker[]` state.
     - When a route is loaded, seamlessly update 2D Leaflet (`LeafletMap`) and 3D Cesium (`CesiumGlobeMap`) polylines and markers.
     - Bind `ElevationProfileChart` to the custom route's elevation data.
   - Integrate into `ItineraryPlannerPage.tsx`:
     - Add "Import GPX / KML" button in the top toolbar beside "Export GPX".
     - Convert parsed route waypoints or daily stages into `PlannerWaypoint[]` with calculated distances, sleeping elevations, and gains.
     - Update DnD sortable timeline, `ItineraryPlannerMap`, `CesiumGlobeMap`, and `PlannerElevationChart`.

---

## 3. Caveats

1. **Elevation Data in GPX/KML**: Some user-generated KML or GPX files (e.g. drawn by hand in Google Earth) only have 2D coordinates `(lat, lng)` and lack altitude tags (`<ele>` or 3rd coordinate in KML).
   - *Mitigation*: The parser will gracefully detect missing altitude and synthesize a reasonable topographic approximation using the trail's region/start/end baselines, while displaying an informative badge ("2D Track - Topographic Elevation Estimated").
2. **File Size and Performance**: Extremely large GPX files (> 20 MB) can block the main UI thread during XML parsing.
   - *Mitigation*: The parser will enforce a sensible file size limit (e.g. 15 MB) and perform decimation to keep Recharts SVG nodes under 200 elements.
3. **Cesium Ground Clamping**: Cesium 3D polylines must be explicitly clamped to ground (`clampToGround: true`) to conform to Himalayan terrain ridges and avoid clipping through mountain slopes.

---

## 4. Conclusion & Recommended Action Plan

### Core Findings
- The repository already has rich foundations: polymorphic map controllers (`LeafletController`, `CesiumController`, `MapEngineManager`), 3D Cesium globe with polyline/marker support (`CesiumGlobeMap`), 2D Leaflet maps with interactive marker dragging (`ItineraryPlannerMap`), and gold-themed Recharts charts (`ElevationProfileChart`, `PlannerElevationChart`).
- The missing capabilities for R2 are:
  1. A standalone universal GPX/KML XML parser and metrics engine (`src/lib/geo/routeParser.ts`).
  2. A drag-and-drop file importer component (`src/components/route/RouteFileImporter.tsx`) with instant sample route loading.
  3. A waypoint management studio (`src/components/route/WaypointStudio.tsx`) for adding, editing, and deleting named waypoints.
  4. Wiring these into both `UnifiedDiscoveryHub.tsx` (Map Explorer) and `src/app/itinerary/planner/page.tsx` (Itinerary Planner).
  5. Verified sample GPX and KML files in `public/data/samples/` for testing.
  6. Automated integration tests covering parser execution, metric calculations, and waypoint operations.

### Proposed File Manifest

| Action | Path | Description |
|---|---|---|
| **CREATE** | `src/lib/geo/routeParser.ts` | Zero-dependency GPX & KML parser, Haversine distance, elevation gain/loss, decimation. |
| **CREATE** | `src/components/route/RouteFileImporter.tsx` | Drag-and-drop file upload component with dropzone, validation, and sample presets. |
| **CREATE** | `src/components/route/WaypointStudio.tsx` | Waypoint management studio panel for adding, editing, deleting, and dropping custom waypoints. |
| **CREATE** | `public/data/samples/everest-three-passes.gpx` | Verified sample GPX route with trackpoints and waypoints for instant testing. |
| **CREATE** | `public/data/samples/annapurna-sanctuary.kml` | Verified sample KML route with LineString and Placemark waypoints for instant testing. |
| **MODIFY** | `src/components/explorer/UnifiedDiscoveryHub.tsx` | Add custom route import trigger, custom route state, 2D/3D map sync, and Waypoint Studio integration. |
| **MODIFY** | `src/app/itinerary/planner/page.tsx` | Add "Import GPX / KML" button, convert imported routes into `PlannerWaypoint[]`, auto-recalculate metrics. |
| **MODIFY** | `src/components/map/LeafletMap.tsx` | Support `customRoute` polyline and `customWaypoints` markers with click/drag events. |
| **MODIFY** | `src/components/map/CesiumGlobeMap.tsx` | Ensure reactive rendering of custom route polylines and waypoints when imported. |
| **MODIFY** | `tests/integration.test.mjs` | Add comprehensive test suite for GPX/KML parsing, trackpoint calculation, and Waypoint Studio. |

---

## 5. Verification Method

To independently verify the investigation and future implementation:

1. **Automated Integration Tests**:
   ```powershell
   npm run test
   ```
   *Expected Result*: All 30 existing tests plus new GPX/KML parser and Waypoint Studio tests pass with 100% success.

2. **TypeScript Compilation Pre-Flight**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected Result*: 0 errors.

3. **Production Next.js Build**:
   ```powershell
   npm run build
   ```
   *Expected Result*: Build completes with zero errors, and all pages compile cleanly.

4. **Parser Unit Verification**:
   - Feed `everest-three-passes.gpx` into `parseGpx()`:
     - Verify `trackpoints.length > 50`.
     - Verify `waypoints.length > 0`.
     - Verify `totalDistanceKm > 0`.
     - Verify `elevationGainM > 0`.
     - Verify `maxElevationM >= 5000`.
   - Feed `annapurna-sanctuary.kml` into `parseKml()`:
     - Verify `trackpoints.length > 30`.
     - Verify `waypoints.length > 0`.
     - Verify `totalDistanceKm > 0`.

5. **End-to-End UI Verification**:
   - In `/map` (UnifiedDiscoveryHub):
     - Drag and drop `.gpx` or `.kml` file into the importer dropzone.
     - Route polyline instantly renders in gold on 2D Topo and 3D Globe.
     - Elevation profile chart renders matching altitude curve.
     - Adding a custom waypoint in Waypoint Studio places a new marker on 2D and 3D maps and adds a dot on the elevation profile.
   - In `/itinerary/planner`:
     - Click "Import GPX / KML".
     - Select a GPX file.
     - The DnD timeline populates with days, calculating day distances, sleeping altitudes, and elevation gains.
     - 2D Leaflet and 3D Cesium map views update with connected polyline and activity-badge markers.
