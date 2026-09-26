# Feature Specification 02: Trails View & Interactive MAP

> **Features:** Trails View, MAP  
> **Target Routes:** `/trails`, `/trails/[id]`, `/map`  
> **Module Status:** Planned  

---

## 1. Overview & Purpose
The Trails View and Interactive MAP modules form the visual and geographic core of **The Himalayan Trails**. Trekkers can explore interactive 3D terrain maps of the Himalayas, view trek details (elevation profiles, difficulty ratings, total distance, maximum altitude), filter routes by region (e.g., Everest, Annapurna, Manaslu, Mustang), and download GPX files.

---

## 2. Route & Component Architecture

### Routes
- `/trails` — Trail explorer page with grid/list view and filter controls
- `/trails/[id]` — In-depth single trail page with interactive route maps and elevation profile
- `/map` — Fullscreen interactive 3D Mapbox / Leaflet map explorer

### Component Hierarchy
```
src/app/
├── trails/
│   ├── page.tsx                  # Trails catalog & filter page
│   └── [id]/page.tsx             # Trail detail view
└── map/
    └── page.tsx                  # Fullscreen 3D Map Explorer page

src/components/trails/
├── TrailCard.tsx                 # Card component (Image, badge, distance, elevation gain, difficulty)
├── TrailFilterSidebar.tsx        # Multi-select region, altitude slider, difficulty selector
├── TrailSearchHeader.tsx         # Search bar with autocomplete suggestions
├── ElevationProfileChart.tsx     # Recharts elevation profile graph (interactive hover tooltips)
└── TrailStatsBar.tsx             # Quick metrics (Max Altitude, Duration in Days, Best Season)

src/components/map/
├── MapExplorer.tsx               # Primary Mapbox GL JS / Deck.gl 3D container
├── MapControls.tsx               # Zoom, layer toggle (Satellite, Topo, Outdoor), 3D Terrain tilt
├── GPXPolylineLayer.tsx          # Renderer for trail GPX track lines with color-coded elevation
├── WaypointMarker.tsx            # Custom markers for Tea Houses, Campsites, High Passes, Viewpoints
└── MapSearchOverlay.tsx          # Floating search card over the map view
```

---

## 3. UI / UX Design & Micro-Interactions

### Trails View Layout
- **Hero Header:** Atmospheric dark canvas featuring real-time trail counter and search box.
- **Filter Drawer / Sidebar:** Sticky sidebar containing:
  - **Region Filter:** Checkboxes for Everest (Khumbu), Annapurna, Langtang, Manaslu, Kanchenjunga, Mustang, Kumaon.
  - **Difficulty Range:** Easy, Moderate, Strenuous, Technical Alpine.
  - **Max Altitude Slider:** `1,000m` to `8,848m` with live range badge.
  - **Duration Slider:** `1 Day` to `30 Days`.
- **Trail Card Design:** Hover effect featuring subtle 3D tilt, difficulty badge color indicator (Green = Moderate, Orange = Strenuous, Red = Technical), and instant "Add to Planner" action button.

### Interactive MAP Layout
- **Fullscreen Canvas:** Full view height map with floating translucent HUD overlays.
- **Layer Selector:** Seamless switching between Satellite (3D Terrain), Topographic, and Outdoor Vector mode.
- **Interactive Waypoint Popups:** Clicking a waypoint marker pops up a mini photo, elevation indicator, and button to view associated Landmark details.

---

## 4. Data Models & Schemas

### Trail Schema (`Trail`)
```typescript
export interface Trail {
  id: string;
  slug: string;
  title: string;
  region: 'Everest' | 'Annapurna' | 'Langtang' | 'Manaslu' | 'Mustang' | 'Other';
  difficulty: 'Easy' | 'Moderate' | 'Strenuous' | 'Technical';
  distanceKm: number;
  durationDays: number;
  maxElevationMeters: number;
  elevationGainMeters: number;
  startingPoint: string;
  endingPoint: string;
  bestMonths: string[];
  gpxFileUrl: string;
  featuredImageUrl: string;
  galleryImages: string[];
  coordinates: [number, number][]; // LatLng tuple array for map route
  waypointsCount: number;
}
```

---

## 5. API Endpoints Contract

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/api/trails` | Fetch filtered list of trails | `region`, `difficulty`, `maxAlt`, `minDays`, `search` |
| `GET` | `/api/trails/:id` | Get comprehensive trail details | None |
| `GET` | `/api/trails/:id/gpx` | Download GPX file | `format=gpx|geojson` |
| `GET` | `/api/map/markers` | Fetch map markers within bounding box | `bbox=sw_lng,sw_lat,ne_lng,ne_lat` |

---

## 6. Acceptance Criteria

- [ ] Smooth 60fps map render with Mapbox 3D terrain elevation mesh.
- [ ] Hovering over the elevation profile chart highlights the corresponding position on the map track.
- [ ] Responsive grid layout: 1 column on mobile, 2 columns on tablet, 3-4 columns on desktop.
- [ ] Download GPX function triggers clean browser file download.
