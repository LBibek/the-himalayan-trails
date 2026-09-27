# Architectural Survey & Analysis: Home Page Services & Live Interactive Map (R3)

**Author**: `explorer_p5_2` (Read-Only Exploration Agent)  
**Date**: 2026-09-27  
**Scope**: `src/app/page.tsx`, `src/components/map/LeafletMap.tsx`, `src/components/ui/GlassCard.tsx`, Alpine Services Matrix, and Regional Geospatial Leaflet Engine.  
**Requirement Reference**: Phase 5 Requirement R3 (`## 2026-09-27T06:02:55Z`).

---

## Executive Summary

Phase 5 elevates *The Himalayan Trails* into a world-class luxury alpine expedition portal. Requirement **R3** mandates redesigning `src/app/page.tsx` around two core pillars:
1. **Core Alpine Services Matrix**: 5 dedicated frosted-glass service cards adhering strictly to the HeroUI compound component architecture (`data-slot="base"`, `data-slot="header"`, `data-slot="body"`, `data-slot="footer"`), semantic Tailwind contrast tokens, `#B68D40` gold accents, and persistent database-backed inquiry/booking actions.
2. **Live Interactive Regional Map Module**: An embedded interactive Leaflet map canvas directly on the Home page featuring quick region selector tabs (`Everest / Khumbu`, `Annapurna`, `Manaslu`, `Mustang`, `Langtang`), smooth animated `flyTo` camera transitions, exact geographic coordinates and prominent mountain landmarks, and a prominent direct CTA to the 3D Cesium discovery hub.

This survey establishes the complete layout hierarchy, exact geographic coordinates, component slots, dynamic client-side loading mechanisms, and zero-mock database hooks.

---

## 1. Current Layout & Component Hierarchy of `src/app/page.tsx`

### 1.1 Existing Layout Inventory
`src/app/page.tsx` is currently a client component (`'use client'`) structured as follows:

| Section | Lines | Contents & Behavior | Deficiencies / Phase 5 Target |
|---|---|---|---|
| **1. Hero Section** | 127–226 | Background `/bg.jpg`, gradient vignette, spinning Compass badge, main headline, CTA buttons (`/trails`, `/map`), and 4-metric statistics bar (`3,500+ km`, `150+ communities`, `12+ regions`, `200+ landmarks`). | Retain aesthetic luxury; link CTA to discovery hub. |
| **(New: R2 Infinite Carousel)** | *N/A* | Will be inserted directly beneath Hero or above Services by `explorer_p5_1` / `worker`. | Dual-speed continuous loop showing routes & services. |
| **2. "What You Can Find" Showcase** | 229–360 | 4 alternating rows (Choose Region, Select Trails, Live Weather, View Stories & Itineraries). | Static and text-heavy; needs to yield priority to the live interactive regional map canvas and alpine services matrix. |
| **3. Full Suite Directory Hub** | 363–415 | 3x3 grid of `GlassCard` items representing 9 app modules (Login, Signup, Planner, Trails, Map, Landmark, Itineraries, Weather, Stories). | Functional navigation hub; preserve or streamline. |
| **4. Featured Trails Snapshot** | 418–485 | Fetches `/api/trails` via `fetch('/api/trails')`, renders 3 popular ascents (EBC, Annapurna, Langtang) in `GlassCard` with badges and elevation tags. | Real persistent database integration; preserve. |
| **5. Community Contribution Banner** | 488–520 | `/sub-bg.jpg` frosted-glass callout linking to `/donate` and `/share-trail`. | Preserve at the base of the page. |

### 1.2 Proposed Phase 5 Page Hierarchy
To maximize user engagement, authority, and booking conversion:
```
<main className="bg-background text-foreground min-h-screen flex flex-col">
  ├── 1. Hero Section (High-altitude brand positioning & primary exploration CTAs)
  ├── 2. Dual-Speed Continuous Infinite Carousel (R2 marquee component)
  ├── 3. Core Alpine Services Matrix (R3: 5 frosted-glass service cards with HeroUI slots)
  ├── 4. Live Interactive Regional Leaflet Map Module (R3: 5 region tabs, flyTo, 3D Cesium CTA)
  ├── 5. Popular Himalayan Ascents (Real database-fetched trails snapshot)
  ├── 6. Full Suite 9 Modules Directory Hub (System feature overview)
  └── 7. Himalayan Conservation & Community Contribution Banner
</main>
```

---

## 2. Leaflet Map Technical Architecture & Client-Side Isolation

### 2.1 SSR Hydration Isolation
Leaflet references browser-only globals (`window`, `document`, `navigator.userAgent`). Server-side rendering of Leaflet in Next.js App Router causes fatal hydration errors:
```
ReferenceError: window is not defined
```
In `src/components/explorer/UnifiedDiscoveryHub.tsx`, Leaflet is loaded dynamically with `ssr: false`:
```tsx
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-900 animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-2xl border border-neutral-800">
      Loading AllTrails Interactive Leaflet Engine...
    </div>
  )
});
```
**Mandatory Requirement for Home Page**:
The embedded map on `src/app/page.tsx` **must** utilize the identical `next/dynamic` wrapper with `ssr: false` and a themed frosted-glass skeleton loader.

### 2.2 Existing LeafletMap Component Architecture (`src/components/map/LeafletMap.tsx`)
`LeafletMap.tsx` is an established, high-capability component with the following signature:
```tsx
export interface LeafletMapProps {
  selectedRegion?: string;
  focusedCoords?: [number, number];
  activeTrailId?: string;
  landmarks?: Landmark[];
  onSelectLandmark?: (landmark: Landmark) => void;
  onSelectTrail?: (trailId: string) => void;
  onSelectRegion?: (region: string) => void;
  height?: string;
  hideHeaderControls?: boolean;
}
```

Key Architectural Features:
1. **Container Styles**: `relative w-full ${height} rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col`.
2. **Header Controls Suppression**: Prop `hideHeaderControls={true}` suppresses the large draggable `FloatingMapPanel` (HUD) designed for `/map`, preventing layout clutter on the Home page.
3. **Animated Camera FlyTo**:
   Inside `LeafletMap.tsx`:
   ```tsx
   function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
     const map = useMap();
     useEffect(() => {
       map.flyTo(center, zoom, { duration: 1.2 });
     }, [center, zoom, map]);
     return null;
   }
   ```
   Passing `focusedCoords` triggers `setMapCenter(focusedCoords)` and `setMapZoom(zoomLevel)`, which programmatically invokes `map.flyTo` with smooth kinetic deceleration (`duration: 1.2s`).
4. **Dynamic Data Layers**:
   - **Base Tiles**: Topographic (`OpenTopoMap`), Satellite (`Esri World Imagery`), Street (`OpenStreetMap`).
   - **GPS Polylines (`showRoutes`)**: Renders high-resolution tracks from `src/data/routeTracks.ts` (`ROUTE_TRACKS`). Highlights `activeTrailId` in amber/gold with `weight: 7` and full opacity.
   - **Massif Bounds (`showRanges`)**: Renders golden dashed boundary polygons for Himalayan ranges from `/api/ranges`.
   - **Apex Summits (`showSummits`)**: Renders custom summit markers for 8,000m+ giants (`HIMALAYAN_SUMMITS`) with interactive popups displaying name, elevation, and GPS coordinates.
   - **Landmark POIs**: Fetches real POIs from `/api/landmarks`, filtered by `selectedRegion`.

---

## 3. Embedded Live Interactive Regional Map Module (R3)

### 3.1 Geographic Coordinates & Region Specification
The 5 regions required by R3 must be configured with exact geographic coordinates, zoom levels, primary GPS tracks, and landmark landmarks:

| Region Key | Tab Label | Center Coordinates `[lat, lng]` | Zoom | Primary Trail ID | Key Landmarks & Mountain Summits |
|---|---|---|---|---|---|
| **Everest** | `Everest / Khumbu` | `[27.9881, 86.9250]` | `10.5` | `ebc-trek` | Mt. Everest (8,848.86m), Lhotse (8,516m), Ama Dablam (6,812m), Everest Base Camp (5,364m), Kala Patthar (5,545m), Tengboche Monastery (3,867m), Namche Bazaar (3,440m). |
| **Annapurna** | `Annapurna` | `[28.6000, 83.9500]` | `10.0` | `annapurna-circuit` | Annapurna I (8,091m), Dhaulagiri I (8,167m), Machapuchare (6,993m), Thorong La Pass (5,416m), Tilicho Glacial Lake (4,919m), Annapurna Base Camp (4,130m). |
| **Manaslu** | `Manaslu` | `[28.4500, 84.6500]` | `10.5` | `manaslu-circuit` | Mt. Manaslu (8,163m), Himalchuli (7,893m), Larkya La Pass (5,106m), Birendra Tal (3,620m), Samagaon Monastery (3,530m). |
| **Mustang** | `Mustang` | `[29.0000, 83.8500]` | `10.0` | `upper-mustang` | Walled Capital of Lo Manthang (3,840m), Chhoser Sky Caves (3,900m), Nilgiri North (7,061m), Kagbeni Red Gompa (2,810m), Tsarang Palace (3,560m). |
| **Langtang** | `Langtang` | `[28.2000, 85.4500]` | `11.0` | `langtang-valley` | Langtang Lirung (7,234m), Kyanjin Ri (4,773m), Tsergo Ri (4,984m), Kyanjin Gompa & Cheese Factory (3,870m), Gosaikunda Sacred Lakes (4,380m). |

### 3.2 Smooth Camera Transitions & Synchronization
When a user clicks any of the 5 region tabs:
1. Home page state updates:
   ```tsx
   const [selectedRegion, setSelectedRegion] = useState<RegionKey>('Everest');
   ```
2. The current region's metadata object supplies:
   - `coords`: `[lat, lng]`
   - `zoom`: number
   - `trailId`: string
   - `stats`: elevation, distance, days, key peak
3. `LeafletMap` is passed:
   ```tsx
   <LeafletMap
     selectedRegion={selectedRegion}
     focusedCoords={currentRegion.coords}
     activeTrailId={currentRegion.trailId}
     height="h-[520px] md:h-[600px]"
     hideHeaderControls={true}
   />
   ```
4. `LeafletMap`'s internal `MapController` immediately detects the coordinate change and triggers `map.flyTo(center, zoom, { duration: 1.2 })`.
5. The corresponding GPS polyline track is highlighted, non-relevant regional landmarks are filtered, and the active region massif boundary is illuminated.

### 3.3 Direct Link / CTA to the 3D Cesium Discovery Hub
To fulfill the requirement for a prominent direct link / CTA to the 3D Cesium discovery hub:
- The regional map header and inline control bar feature a high-contrast luxury CTA button:
  ```tsx
  <Link
    href="/map?engine=cesium"
    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold hover:bg-[#c99e4b] transition-all shadow-lg shadow-accent/25 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
  >
    <Globe className="h-4 w-4" />
    <span>Launch 3D Cesium Discovery Hub</span>
    <ArrowUpRight className="h-4 w-4" />
  </Link>
  ```
- Additionally, an inline quick-badge over the map canvas highlights:
  `"Switch to 3D Drone Flight Path Simulator"` linking directly to `/map?engine=cesium&trail=${currentRegion.trailId}`.

---

## 4. Core Alpine Services Matrix (R3)

### 4.1 HeroUI Compound Slot Pattern
In strict compliance with `.agents/rules/heroui_component_theme_rules.md`, each service card must implement explicit semantic slots:
- `data-slot="base"`: Outer card root container (`GlassCard` with `data-slot="base"`, `data-variant="interactive"`, `data-hovered`).
- `data-slot="header"`: Header section with service badge and luxury icon container (`GlassCard.Header`).
- `data-slot="body"`: Body containing title (`data-slot="label"`), detailed copy (`data-slot="description"`), and bulleted capability items (`data-slot="feature"`).
- `data-slot="footer"`: Footer displaying trust/certification metric and persistent action button (`GlassCard.Footer`).

### 4.2 Detailed Specifications for All 5 Alpine Services

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE ALPINE SERVICES MATRIX                     │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Guided Alpine Expeditions      │ 2. Custom 3D Itinerary Planning    │
│    • IFMGA/NNMGA Sherpa leaders   │    • Day-by-day altitude pacing    │
│    • Poisk oxygen & regulators    │    • GPX / KML GPS file export     │
│    • 1:1 summit client ratio      │    • Acclimatization rest alerts   │
│    • Real DB: /api/inquiries      │    • Real DB: /api/itineraries     │
├───────────────────────────────────┼────────────────────────────────────┤
│ 3. Sherpa & Porter Logistics      │ 4. Helicopter Rescue & Evacuation  │
│    • Fair living wage guarantee   │    • 24/7 Garmin inReach dispatch  │
│    • 20kg strict load limits      │    • Airbus H125 (B3e) rotorcraft  │
│    • IPPG ethical certification   │    • Direct CIWEC hospital liaison │
│    • Real DB: /api/contact        │    • Real DB: /api/contact         │
├───────────────────────────────────┴────────────────────────────────────┤
│ 5. Conservation Permits & TIMS Passes                                  │
│    • Sagarmatha, ACAP, MCAP & Langtang national park permits           │
│    • Upper Mustang & Manaslu Restricted Area Permits (RAP)             │
│    • Digital pre-clearance with zero Kathmandu queue delays            │
│    • Real DB: /api/inquiries & /api/landmarks                          │
└────────────────────────────────────────────────────────────────────────┘
```

#### Service Card 1: Guided Alpine Expeditions
- **Title**: Guided Alpine Expeditions
- **Badge**: `IFMGA Sherpa Certified`
- **Icon**: `Mountain` / `Compass`
- **Core Summary**: Elite high-altitude mountaineering and trekking led by veteran IFMGA/NNMGA certified Sherpa leaders with multi-summit 8,000m credentials, closed-circuit oxygen systems, and fixed-rope summit logistics.
- **Key Capabilities**:
  1. 1:1 Sherpa summit ratio on 8,000m & 7,000m technical peaks.
  2. Top-tier Poisk oxygen systems with redundant regulators and pulse oximeter monitoring.
  3. Advanced high-altitude medical kits & hyperbaric Gamow bags at all high camps.
  4. Daily satellite weather window forecasts & meteorological risk analysis.
- **Trust Metric**: `100% Safety Track Record`
- **Action CTA**: `"Inquire Expedition" -> /trails` (or inquiry modal submitting to `POST /api/inquiries`).

#### Service Card 2: Custom 3D Itinerary Planning
- **Title**: Custom 3D Itinerary Planning
- **Badge**: `Kinetic 3D Simulation`
- **Icon**: `Calendar` / `Layers`
- **Core Summary**: Interactive altitude-calibrated daily route design. Visualize daily ascents in 3D Cesium terrain, enforce scientific acclimatization rest days, and export verified GPX/KML routes directly to your GPS device.
- **Key Capabilities**:
  1. Algorithmic altitude sickness prevention & lapse rate alerts.
  2. Drag-and-drop daily waypoints with elevation gain and distance calculations.
  3. One-click Garmin, Coros & Suunto GPX/KML track export.
  4. Curated teahouse recommendations, solar charging, and potable water points.
- **Trust Metric**: `Instant GPX / KML Export`
- **Action CTA**: `"Launch 3D Planner" -> /itinerary/planner` (connected to `POST /api/itineraries`).

#### Service Card 3: Sherpa & Porter Logistics
- **Title**: Sherpa & Porter Logistics
- **Badge**: `IPPG Ethical Fair-Wage`
- **Icon**: `ShieldCheck` / `Users`
- **Core Summary**: Responsible, ethical expedition labor adhering strictly to International Porter Protection Group (IPPG) protocols: guaranteed fair living wages, medical insurance, weather-grade mountain gear, and load caps.
- **Key Capabilities**:
  1. Strict 20kg load limits per porter with mandatory gear inspection before departure.
  2. Full emergency medical, rescue & life insurance coverage for all local staff.
  3. Guaranteed heated teahouse accommodations & nourishing high-calorie meals.
  4. Experienced English-speaking expedition sirdars, cooks, and wilderness first responders.
- **Trust Metric**: `Fair-Wage Certified`
- **Action CTA**: `"Reserve Support Crew" -> /contact?subject=Sherpa+Porter+Logistics` (connected to `POST /api/contact`).

#### Service Card 4: Helicopter Rescue & High-Altitude Evacuation
- **Title**: Helicopter Rescue & High-Altitude Evac
- **Badge**: `24/7 Garmin SOS Dispatch` (with live pulsing dot indicator)
- **Icon**: `Wind` / `Radio`
- **Core Summary**: Round-the-clock emergency medical liaison with direct hotline to Airbus H125 (B3e) high-altitude rotorcraft crews capable of sling operations up to 7,000m across all Himalayan sectors.
- **Key Capabilities**:
  1. Direct satellite link to Garmin inReach, ZOLEO & Apple Emergency SOS beacons.
  2. Fast-track flight clearance with the Civil Aviation Authority of Nepal (CAAN).
  3. Direct patient transfer to Kathmandu CIWEC Clinic & Era International Hospital.
  4. Dedicated emergency insurance verification and cashless hospital claims liaison.
- **Trust Metric**: `< 45 Min Dispatch Window`
- **Action CTA**: `"Emergency Evac Hotline" -> tel:+977-1-4567890` (and contact dispatch form).

#### Service Card 5: Conservation Permits & TIMS Passes
- **Title**: Conservation Permits & TIMS Passes
- **Badge**: `Gov Official Liaison`
- **Icon**: `FileText` / `Award`
- **Core Summary**: Comprehensive, seamless processing for all government trekking permits, national park conservation passes, and restricted area permits (RAP) across Nepal's sensitive border zones.
- **Key Capabilities**:
  1. Sagarmatha, Annapurna (ACAP), Langtang & Manaslu (MCAP) national park permits.
  2. Upper Mustang & Manaslu Restricted Area Permits (RAP) processed with licensed guides.
  3. Trekkers' Information Management System (TIMS) biometric registration.
  4. Pre-arrival digital verification with zero Kathmandu queue delays.
- **Trust Metric**: `100% Verified Permits`
- **Action CTA**: `"Permit Requirements" -> /landmarks` (connected to `POST /api/inquiries`).

---

## 5. Zero-Mock & Persistent Full-Stack Database Architecture

In accordance with `GEMINI.md` and `AGENTS.md`, no hardcoded mock collections or simulated timeouts are permitted. Every service card action and interactive map coordinate connects to persistent database records and validated API routes:

| Service / Map Feature | Persistent API Route | Database Table | Database Operations |
|---|---|---|---|
| **Featured Routes Snapshot** | `GET /api/trails` | `trails` | Queries real seeded routes (`ebc-trek`, `annapurna-circuit`, `langtang-valley`, `manaslu-circuit`, `upper-mustang`) with real elevation profiles. |
| **Regional POIs & Permits** | `GET /api/landmarks` | `landmarks` | Queries real landmarks with exact GPS coordinates and `permit_required` data. |
| **Massif Boundary Polygons** | `GET /api/ranges` | `ranges` | Queries 7 official Himalayan massifs with polygon boundary coordinates. |
| **Expedition & Permit Inquiries** | `POST /api/inquiries` | `inquiries` | Validates input (trailId, fullName, email, groupSize, fitnessLevel) and persists record with status `'PENDING'`. |
| **Expedition Bookings** | `POST /api/bookings` | `bookings` | Validates booking dates, pricing, travelers, and atomically inserts with foreign key relation to `trails`. |
| **Logistics & Emergency Evac** | `POST /api/contact` | `contact_messages` | Records emergency dispatch and porter logistics requests with timestamp and unread status. |
| **3D Itinerary Planner** | `POST /api/itineraries` | `itineraries` | Persists custom day-by-day routes, max altitudes, and waypoint JSON to SQLite. |

---

## 6. Implementation Blueprint for `src/app/page.tsx`

### 6.1 Required Imports
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Compass, Mountain, Map as MapIcon, MapPin, Calendar, Layers, CloudSun,
  BookOpen, User, UserPlus, ArrowRight, ArrowUpRight, ShieldCheck,
  CheckCircle2, Wind, FileText, PhoneCall, Globe, Loader2, Sparkles
} from 'lucide-react';
import { Trail } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import GlassBadge from '@/components/ui/GlassBadge';

// Dynamic client-only Leaflet Map import with SSR disabled
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] bg-surface/70 backdrop-blur-xl animate-pulse flex flex-col items-center justify-center text-accent text-sm font-semibold rounded-2xl border border-border/40">
      <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
      <span>Initializing Himalayan Geospatial Engine...</span>
    </div>
  )
});
```

### 6.2 Regional Data Matrix
```tsx
interface RegionConfig {
  key: string;
  name: string;
  coords: [number, number];
  zoom: number;
  trailId: string;
  apexSummit: string;
  maxAlt: string;
  keyPass: string;
  description: string;
}

const REGION_CONFIGS: Record<string, RegionConfig> = {
  'Everest': {
    key: 'Everest',
    name: 'Everest / Khumbu',
    coords: [27.9881, 86.9250],
    zoom: 10.5,
    trailId: 'ebc-trek',
    apexSummit: 'Mt. Everest (8,848m)',
    maxAlt: '5,545m (Kala Patthar)',
    keyPass: 'Cho La & Kongma La',
    description: 'Home of the Sherpa kingdom, soaring Khumbu Icefall, and the highest pinnacle on Earth.'
  },
  'Annapurna': {
    key: 'Annapurna',
    name: 'Annapurna',
    coords: [28.6000, 83.9500],
    zoom: 10.0,
    trailId: 'annapurna-circuit',
    apexSummit: 'Annapurna I (8,091m)',
    maxAlt: '5,416m (Thorong La)',
    keyPass: 'Thorong La Pass',
    description: 'A dramatic circumnavigation from lush rhododendron valleys to high-altitude Tibetan plateaus.'
  },
  'Manaslu': {
    key: 'Manaslu',
    name: 'Manaslu',
    coords: [28.4500, 84.6500],
    zoom: 10.5,
    trailId: 'manaslu-circuit',
    apexSummit: 'Mt. Manaslu (8,163m)',
    maxAlt: '5,106m (Larkya La)',
    keyPass: 'Larkya La Pass',
    description: 'Pristine wilderness traverse around the Mountain of the Spirit bordering mystical Tibet.'
  },
  'Mustang': {
    key: 'Mustang',
    name: 'Mustang',
    coords: [29.0000, 83.8500],
    zoom: 10.0,
    trailId: 'upper-mustang',
    apexSummit: 'Nilgiri North (7,061m)',
    maxAlt: '3,840m (Lo Manthang)',
    keyPass: 'Marang La (4,230m)',
    description: 'The ancient walled Buddhist Kingdom of Lo set within vibrant ochre wind-sculpted canyons.'
  },
  'Langtang': {
    key: 'Langtang',
    name: 'Langtang',
    coords: [28.2000, 85.4500],
    zoom: 11.0,
    trailId: 'langtang-valley',
    apexSummit: 'Langtang Lirung (7,234m)',
    maxAlt: '4,773m (Kyanjin Ri)',
    keyPass: 'Ganja La (5,130m)',
    description: 'The Valley of Glaciers steeped in ancient Tamang culture, yak pastures, and dramatic ice faces.'
  }
};
```

### 6.3 State Management
```tsx
const [selectedRegionKey, setSelectedRegionKey] = useState<string>('Everest');
const currentRegion = REGION_CONFIGS[selectedRegionKey] || REGION_CONFIGS['Everest'];
```

### 6.4 Alpine Services Matrix JSX Structure
```tsx
<section className="py-24 px-4 sm:px-6 lg:px-8 bg-background border-t border-border/20">
  <div className="max-w-7xl mx-auto space-y-16">
    <div className="text-center max-w-3xl mx-auto space-y-4">
      <GlassBadge variant="gold" pulse={true}>
        Elite High-Altitude Operations
      </GlassBadge>
      <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
        Core Alpine Services Matrix
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed">
        Full-spectrum expedition infrastructure delivered by licensed IFMGA Sherpa teams, certified high-altitude rotorcraft pilots, and government permit liaisons.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* 5 Dedicated Service Cards styled with GlassCard compound slots */}
      ...
    </div>
  </div>
</section>
```

### 6.5 Live Interactive Regional Map JSX Structure
```tsx
<section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface/30 border-t border-border/20">
  <div className="max-w-7xl mx-auto space-y-10">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/20 pb-8">
      <div className="space-y-2">
        <GlassBadge variant="gold">
          Geospatial Exploration
        </GlassBadge>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          Interactive Himalayan Regional Map
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Fly across iconic massifs with live GPS trail tracks, 8,000m apex summit telemetry, and conservation boundary polygons.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/map?engine=cesium"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold hover:bg-[#c99e4b] transition-all shadow-xl shadow-accent/20 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <Globe className="h-4 w-4" />
          <span>Launch 3D Cesium Hub</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>

    {/* Region Selector Tabs */}
    <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-surface/80 border border-border/40 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        {Object.values(REGION_CONFIGS).map((reg) => {
          const isActive = selectedRegionKey === reg.key;
          return (
            <button
              key={reg.key}
              onClick={() => setSelectedRegionKey(reg.key)}
              data-slot="trigger"
              data-selected={isActive ? 'true' : 'false'}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                isActive
                  ? 'bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20'
                  : 'bg-surface/50 text-surface-foreground/80 hover:text-white hover:bg-surface/90 border-border/30'
              }`}
            >
              <Mountain className="h-3.5 w-3.5" />
              <span>{reg.name}</span>
            </button>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-4 px-4 text-xs text-muted-foreground font-mono">
        <span>Apex: <strong className="text-accent">{currentRegion.apexSummit}</strong></span>
        <span>•</span>
        <span>Max: <strong className="text-foreground">{currentRegion.maxAlt}</strong></span>
      </div>
    </div>

    {/* Embedded Map Canvas */}
    <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl bg-surface">
      <LeafletMap
        selectedRegion={selectedRegionKey}
        focusedCoords={currentRegion.coords}
        activeTrailId={currentRegion.trailId}
        height="h-[520px] md:h-[620px]"
        hideHeaderControls={true}
      />
    </div>
  </div>
</section>
```

---

## 7. Quality & Verification Method

1. **Type Checking**:
   Execute `npx tsc --noEmit` to verify 0 type errors across `page.tsx` and all imported types.
2. **Automated Integration Tests**:
   Run `npm test` to ensure all 75 existing full-stack integration tests pass.
3. **Map Rendering Verification**:
   Verify that clicking each of the 5 region tabs (`Everest / Khumbu`, `Annapurna`, `Manaslu`, `Mustang`, `Langtang`) updates `selectedRegionKey`, smoothly animates `map.flyTo`, highlights the region polyline, and loads matching landmarks.
4. **HeroUI Slot Verification**:
   Inspect the DOM to verify `data-slot="base"`, `data-slot="header"`, `data-slot="body"`, and `data-slot="footer"` are present on all 5 service cards.
5. **Production Build**:
   Verify `npm run build` generates clean output without SSR `window is not defined` errors.
