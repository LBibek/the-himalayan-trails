# The Himalayan Trails — User & Admin Feature Catalog

> **Comprehensive System Documentation**
> This document details all implemented end-user features, interactive map tools, safety advisories, and administrative expedition creation capabilities across **The Himalayan Trails** platform.

---

## 1. End-User Features & Interactive Exploration Engine

### A. AllTrails-Style Interactive 3D & Topographic Map Explorer (`/map`, `/explore`)
- **Multi-Layer Tile Rendering**: Seamlessly toggle between **OpenTopoMap** (Topographic contours), **Esri World Imagery** (High-res Satellite), and **OpenStreetMap** (Standard vector roads & paths).
- **Multi-Region Navigation**: Instant focus buttons for major Himalayan regions: *Everest / Khumbu*, *Annapurna Circuit*, *Langtang Valley*, *Manaslu Circuit*, *Upper Mustang*, and *Rolwaling Valley*.
- **Polyline GPS Track Overlays**: Curated polyline tracks for major routes with active trail color highlights and segment thickness adjustments on hover.
- **Split-Screen UX**: Inspired by AllTrails desktop and mobile layout, allowing users to browse trail cards on the left while synchronously viewing location markers on the right.

### B. Custom Itinerary Route Studio (`/itinerary/planner`)
- **Three-Way Bidirectional Synchronization**:
  - **Map Markers ↔ Timeline Day Cards ↔ Elevation Line Chart**.
  - Hovering or clicking a marker on the Leaflet map highlights its corresponding day card and pinpoints its distance/altitude on the SVG line chart.
- **Map Click-to-Drop Waypoints**: Click anywhere on the Leaflet canvas to place a new day waypoint with custom coordinates.
- **Drag-to-Reposition Markers**: Drag waypoint markers directly on the map to adjust trail paths in real time.
- **Custom Activity Icon Badge Library**:
  - 🥾 **Trekking / Hiking** (Emerald `#10b981`) — Trail walking & valley ascents
  - 🧘 **Acclimatization Rest** (Cyan `#06b6d4`) — Adaptation rest day & ridge climb
  - 🏔️ **High Pass / Summit** (Metallic Gold `#B68D40`) — Technical pass crossing or peak attempt
  - 🚁 **Flight / Helipad** (Purple `#a855f7`) — Twin-otter flight or helicopter charter
  - ⛺ **High Camp / Lodge** (Orange `#f97316`) — Teahouse overnight or wilderness camp
  - 🛕 **Monastery / Shrine** (Rose `#e11d48`) — Tibetan Buddhist gompa or sacred site
- **Interactive SVG Elevation Profile Chart**: Real-time line graph displaying day-by-day altitude progression with glowing gradients and altitude hover tooltips.

### C. Altitude Safety & Acclimatization Risk Radar
- **Automated AMS Warning Engine**: Evaluates day-by-day sleeping altitude increases. If a day gains > 600m in sleeping altitude above 3,000m without an acclimatization rest day, an **Acclimatization Safety Advisory** banner is automatically triggered.

### D. Landmark Points of Interest & Alpine Pass Guide (`/landmarks`)
- Filter high-altitude landmarks by category (*Base Camps*, *High Passes*, *Tibetan Monasteries*, *Sacred Glacial Lakes*, *High Altitude Villages*).
- Includes scraped and curated entries such as **Tsho Rolpa Glacial Lake (4,580m)**, **Tashi Lapcha Pass (5,755m)**, **Tilicho Lake (4,919m)**, and **Everest Base Camp (5,364m)**.

### E. Curated Trail Directory (`/trails`)
- Search and filter trails by valley name, difficulty (*Moderate*, *Strenuous*, *Challenging*, *Extreme*), maximum altitude slider, and region.
- Includes step-by-step route descriptions, best trekking months, elevation gain stats, and embedded interactive Leaflet map overlays.

### F. Live Weather Hazard & Risk Radar (`/weather`)
- Mountain weather hazard reports, freezing levels, wind speed warnings, avalanche risks, and pass clearance statuses.

---

## 2. Admin & Expedition Studio Features (`/admin`)

### A. Visual Expedition Map Editor
- **Interactive Landmark Dropper**: Click anywhere on the admin map editor to set start points, high pass waypoints, or base camps.
- **Custom Landmark Metadata**: Input custom landmark titles, category tags, elevation figures, permit requirements, and descriptions.

### B. Expedition Management & Creation Studio
- Create new trekking routes specifying Title, Region (*Everest, Annapurna, Langtang, Manaslu, Mustang, Rolwaling*), Difficulty Level, Duration (Days), Max Elevation (m), Distance (km), Highlights, and Cover Photo URL.
- Local Storage & API Persistence: Automatically saves created expeditions to `localStorage` or backend APIs.

### C. Admin Dashboard & Analytics
- Overview stat cards displaying *Total Expeditions Registered*, *Total Landmarks Mapped*, *Total Distance Tracked*, and *Leaflet Engine Health*.

### D. Data Export Capabilities
- Export custom planned itineraries to standard PDF format or GPX coordinate files.

---
*Document Version: 1.0 — The Himalayan Trails Architecture Team*
