# Project: The Himalayan Trails — Phase 4

## Architecture
Phase 4 extends The Himalayan Trails with 4 core production modules:
1. **3D Cesium Drone Flight Simulator & Telemetry (R1)**:
   - Polyline geodesic cumulative parametrization in `src/lib/map/CesiumController.ts`.
   - Continuous camera kinematics along GPS coordinates on Cesium `clock.onTick`.
   - Tangent heading computation, forward-lookahead slope gradient, dynamic camera pitch.
   - Interactive Frosted Glass Telemetry Console (`src/components/map/DroneFlightConsole.tsx`) with Play, Pause, 1x/2x/5x speed, Restart, altitude, remaining distance, ETA to next landmark.
   - Bidirectional scrubber synchronization with `src/components/map/ElevationProfileChart.tsx` (Recharts).
2. **Custom GPX & KML Route Importer & Waypoint Studio (R2)**:
   - Universal zero-dependency XML parser in `src/lib/geo/routeParser.ts` for GPX 1.0/1.1 (`<trkpt>`, `<ele>`, `<wpt>`) and KML 2.2 (`<LineString>`, `<coordinates>`, `<Placemark>`).
   - Geodesic Haversine distance, elevation gain/loss accumulation, noise filtering, Recharts downsampling decimation.
   - Drag-and-drop file upload component `src/components/route/RouteFileImporter.tsx` with drag-over glow and sample route presets.
   - Interactive `src/components/route/WaypointStudio.tsx` supporting Add, Edit, Delete custom waypoints.
   - Dual-engine 2D Leaflet and 3D Cesium rendering in `UnifiedDiscoveryHub.tsx` (Map Explorer) and `src/app/itinerary/planner/page.tsx` (Itinerary Planner).
3. **Trail Reviews, Multi-Criteria Ratings & Explorer Badges (R3)**:
   - Persistent SQLite schema in `src/lib/db.ts` with `reviews` table (`overall_rating`, `difficulty_rating`, `scenic_rating`, `safety_rating`, `comment`, `photos_json`, `is_verified`).
   - Dynamic aggregate recalculation of `rating` and `reviews_count` on `trails` table.
   - `user_badges` table tracking unlocked achievements (e.g. "Everest Pioneer", "Annapurna Master", "Trail Blazer", "Safety Sentinel", "High Altitude Legend", "Expedition Veteran").
   - REST endpoints `/api/reviews` and `/api/user/badges`.
   - Frosted glass UI `src/components/reviews/TrailReviewsSection.tsx` on trail detail page (`src/app/trails/[id]/page.tsx`) and Explorer Badges grid on `/dashboard`.
4. **Expedition Checkout & ACID Deposit Reservation (R4)**:
   - Persistent schema extensions to `bookings` (`payment_option`, `deposit_amount`, `remaining_balance`, `base_price`, `permit_fee`, `tax_amount`, `receipt_number`, `invoice_breakdown`).
   - Server-side pricing engine: base rate, tiered group discounts (5% for 2-3, 10% for 4-6, 15% for 7+), regional permits (Everest $50, Annapurna $50, Manaslu $160, Mustang $530, Langtang $50, Rolwaling $50), 13% Nepal VAT.
   - ACID reservation transaction in `src/lib/db.ts` supporting 25% Deposit vs 100% Full Payment.
   - Endpoints `/api/checkout` and `/api/admin/bookings/[id]`.
   - New dedicated checkout page `src/app/checkout/page.tsx` with printable receipt, `/dashboard` deposit status tracking, and `/admin` 5-state lifecycle management (`PENDING`, `CONFIRMED`, `EXPEDITION_ACTIVE`, `COMPLETED`, `CANCELLED`).
5. **E2E Testing & Verification Track (M5)**:
   - Add Suites 11, 12, 13 to `tests/integration.test.mjs` verifying reviews, ratings, badges, GPX/KML route parser, and checkout ACID transactions.
   - Enforce 100% test pass, `npx tsc --noEmit` 0 errors, `npm run build` zero errors, and zero mocks.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 3D Drone Kinematics & Path Traversal | Geodesic parameterization, continuous clock interpolation, forward bearing, slope pitch | M1 | R1 / Survey 1 |
| 2 | Drone Flight Console & Telemetry HUD | Play/Pause/1x/2x/5x/Restart controls, altitude, remaining distance, ETA to next landmark | M1 | R1 / Survey 1 |
| 3 | Recharts Flight Scrubber Synchronization | Real-time scrubber line/beacon sync between ElevationProfileChart and drone camera | M1 | R1 / Survey 1 |
| 4 | GPX & KML Route Parser & Geodesic Engine | Parse XML trackpoints/elevations, Haversine distance, elevation gain/loss, decimation | M2 | R2 / Survey 2 |
| 5 | Drag-and-Drop Route Importer UI | Dropzone, validation, sample route presets (Everest Three Passes, Annapurna Sanctuary) | M2 | R2 / Survey 2 |
| 6 | Interactive Waypoint Studio | Add, edit, delete named waypoints; drop waypoints at map center / coordinates | M2 | R2 / Survey 2 |
| 7 | Dual-Engine Custom Route Map Sync | Render imported route polylines and waypoints on 2D Leaflet and 3D Cesium | M2 | R2 / Survey 2 |
| 8 | Persistent SQLite DB Schema Migrations | Create `reviews`, `user_badges` tables, add payment/receipt columns to `bookings` | M3, M4 | R3, R4 / Survey 3 |
| 9 | Multi-Criteria Reviews & Aggregate Scoring | 1-5 stars for overall, difficulty, scenic, safety; dynamic trail rating recalculation | M3 | R3 / Survey 3 |
| 10 | Explorer Badges Gamification Engine | Award region and activity badges on reviews/completed bookings; display on /dashboard | M3 | R3 / Survey 3 |
| 11 | Expedition Pricing & Regional Permit Engine | Compute group discounts, regional permit fees, 13% Nepal VAT, 25% deposit amount | M4 | R4 / Survey 3 |
| 12 | ACID Deposit & Booking Checkout Flow | Transactional reservation, invoice breakdown, downloadable/printable receipt | M4 | R4 / Survey 3 |
| 13 | 5-State Booking Lifecycle Management | Admin & dashboard lifecycle (`PENDING` -> `CONFIRMED` -> `EXPEDITION_ACTIVE` -> `COMPLETED`) | M4 | R4 / Survey 3 |
| 14 | Automated Integration Test Verification | Test suites 11, 12, 13 in `tests/integration.test.mjs`, TypeScript preflight, build | M5 | AC / Survey 3 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 3D Cesium Drone Flight Simulator & Telemetry | F1, F2, F3 (`CesiumController.ts`, `DroneFlightConsole.tsx`, `ElevationProfileChart.tsx`, `CesiumGlobeMap.tsx`) | Survey complete | PLANNED |
| M2 | Custom GPX & KML Route Importer & Waypoint Studio | F4, F5, F6, F7 (`routeParser.ts`, `RouteFileImporter.tsx`, `WaypointStudio.tsx`, `UnifiedDiscoveryHub.tsx`, `planner/page.tsx`) | Survey complete | PLANNED |
| M3 | Trail Reviews, Multi-Criteria Ratings & Explorer Badges | F8(part), F9, F10 (`src/lib/db.ts`, `/api/reviews`, `/api/user/badges`, `TrailReviewsSection.tsx`, `/dashboard`) | Survey complete | PLANNED |
| M4 | Expedition Checkout & ACID Deposit Reservation | F8(part), F11, F12, F13 (`src/lib/db.ts`, `/api/checkout`, `/checkout/page.tsx`, `/admin`, `/dashboard`) | M3 (shares DB) | PLANNED |
| M5 | Test Suite Execution, Coverage Hardening & Delivery | F14 (`tests/integration.test.mjs`, pre-flight `tsc`, `npm run build`, zero-mock audit) | M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. Geospatial & Drone Simulator Contracts (`src/lib/map/types.ts`)
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

### 2. Route Parser & Waypoint Studio Contracts (`src/lib/geo/routeParser.ts`)
```typescript
export interface ParsedTrackpoint {
  lat: number;
  lng: number;
  elevation: number;
  distanceFromStartKm: number;
}

export interface ParsedWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  category?: string;
  description?: string;
}

export interface ParsedRouteResult {
  name: string;
  format: 'gpx' | 'kml';
  trackpoints: ParsedTrackpoint[];
  waypoints: ParsedWaypoint[];
  totalDistanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  maxElevationM: number;
  minElevationM: number;
  elevationProfile: { distanceKm: number; elevation: number; label?: string }[];
  routeCoordinates: [number, number, number][]; // [lat, lng, elevation]
}
```

### 3. Review & Badges Contracts (`src/types/index.ts`)
```typescript
export interface Review {
  id: string;
  trailId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  overallRating: number;      // 1 to 5
  difficultyRating: number;   // 1 to 5
  scenicRating: number;       // 1 to 5
  safetyRating: number;       // 1 to 5
  comment: string;
  photos: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  unlockedAt: string;
}
```

### 4. Checkout & Pricing Contracts (`src/types/index.ts`)
```typescript
export interface InvoiceBreakdown {
  trailId: string;
  trailName: string;
  travelers: number;
  startDate: string;
  basePricePerPerson: number;
  basePriceSubtotal: number;
  groupDiscountPercent: number;
  groupDiscountAmount: number;
  discountedBasePrice: number;
  permitFeePerPerson: number;
  permitFeeTotal: number;
  taxAmount: number; // 13% VAT
  totalExpeditionPrice: number;
  paymentOption: 'DEPOSIT' | 'FULL';
  depositAmount: number;
  remainingBalance: number;
}

export interface CheckoutRequest {
  trailId: string;
  fullName: string;
  email: string;
  phone: string;
  startDate: string;
  travelers: number;
  paymentOption: 'DEPOSIT' | 'FULL';
  specialRequests?: string;
}
```

---

## Code Layout
- `src/lib/map/`: `types.ts`, `CesiumController.ts`, `LeafletController.ts`, `MapEngineManager.ts`
- `src/components/map/`: `DroneFlightConsole.tsx`, `ElevationProfileChart.tsx`, `CesiumGlobeMap.tsx`, `LeafletMap.tsx`
- `src/lib/geo/`: `routeParser.ts`
- `src/components/route/`: `RouteFileImporter.tsx`, `WaypointStudio.tsx`
- `public/data/samples/`: `everest-three-passes.gpx`, `annapurna-sanctuary.kml`
- `src/lib/db.ts`: SQLite schema migrations, reviews, badges, checkout ACID transaction
- `src/types/index.ts`: types for Review, Badge, Booking, InvoiceBreakdown
- `src/app/api/reviews/route.ts`: reviews API
- `src/app/api/user/badges/route.ts`: badges API
- `src/app/api/checkout/route.ts`: checkout API
- `src/app/api/admin/bookings/[id]/route.ts`: booking status lifecycle API
- `src/components/reviews/TrailReviewsSection.tsx`: reviews & multi-criteria ratings UI
- `src/app/trails/[id]/page.tsx`: trail details page integration
- `src/app/checkout/page.tsx`: dedicated checkout page with receipt confirmation
- `src/app/dashboard/page.tsx`: user dashboard with explorer badges & deposit tracking
- `src/app/admin/page.tsx`: admin studio booking lifecycle
- `tests/integration.test.mjs`: automated integration test suites 11, 12, 13
