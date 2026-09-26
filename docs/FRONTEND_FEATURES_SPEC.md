# The Himalayan Trails — Frontend Architecture & Feature Specification

> **Project Name:** The Himalayan Trails  
> **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Mapbox GL / Leaflet  
> **Target Audience:** Trekkers, Mountaineers, Tour Operators, and Outdoor Enthusiasts  

---

## 🏔️ Overview

This document serves as the master technical blueprint for the **The Himalayan Trails** web application frontend. It outlines the core user features identified in the product layout, detailing routing, UI component hierarchies, visual aesthetics, state management, and API integration specifications.

---

## 📂 Feature Roadmap & Mapping

The following 9 core user-facing features identified in the product wireframe are structured into 6 focused modular specification documents:

| # | Feature (from Wireframe) | Next.js App Route | Specification File | Key Technical Scope |
|---|--------------------------|-------------------|--------------------|---------------------|
| 1 | **Login** | `/login` | [`01_auth_login_signup.md`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/01_auth_login_signup.md) | OAuth, Email/Password login, JWT session management, form validation |
| 2 | **Sign Up** | `/signup` | [`01_auth_login_signup.md`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/01_auth_login_signup.md) | Registration wizard, preference selection (trek level, emergency contacts) |
| 3 | **Trails View** | `/trails`, `/trails/[id]` | [`02_trails_and_map.md`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/02_trails_and_map.md) | Search grid, difficulty filter, elevation profile charts, trail details |
| 4 | **MAP** | `/map` | [`02_trails_and_map.md`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/02_trails_and_map.md) | 3D Topographic map view, trail GPX overlay, custom waypoints, layer controls |
| 5 | **Landmark** | `/landmarks`, `/landmarks/[id]` | [`03_landmark_view.md`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/03_landmark_view.md) | Historical sites, stupas, base camps, tea houses, high passes detail cards |
| 6 | **Itinerary Planner** | `/itinerary/planner` | [`04_itinerary_planner_and_view.md`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/04_itinerary_planner_and_view.md) | Drag-and-drop daily route builder, altitude gain estimator, packing checklist |
| 7 | **Itineraries View** | `/itineraries`, `/itineraries/[id]` | [`04_itinerary_planner_and_view.md`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/04_itinerary_planner_and_view.md) | Community itineraries browse, export to PDF/GPX, bookmark & copy itinerary |
| 8 | **Weather and Trail** | `/weather`, `/trails/[id]/weather` | [`05_weather_and_trail_status.md`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/05_weather_and_trail_status.md) | Real-time altitude weather, avalanche warnings, trail hazard reports |
| 9 | **Stories** | `/stories`, `/stories/[id]` | [`06_user_stories.md`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/06_user_stories.md) | Trekker blog logs, photo galleries, trail experience stories, rich text editor |

---

## 🎨 Global Design System & Aesthetics

- **Color Palette:**
  - **Primary:** Slate Cyan & Deep Himalayan Slate (`#0f172a`, `#0e7490`, `#06b6d4`)
  - **Accent:** Glacier Ice Blue (`#38bdf8`) & Terracotta Mountain Sunset (`#f97316`)
  - **Surface:** Glassmorphic translucent cards (`bg-slate-900/60 backdrop-blur-md`)
- **Typography:** Inter / Plus Jakarta Sans for clean readability, Outfit / Syncopate for headers.
- **Micro-Interactions:** Smooth hover tilt, elevation gain graph animations, interactive Mapbox markers.

---

## 🛠️ Directory Structure Plan

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── trails/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── map/
│   │   └── page.tsx
│   ├── landmarks/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── itinerary/
│   │   ├── planner/page.tsx
│   │   └── page.tsx
│   ├── weather/
│   │   └── page.tsx
│   └── stories/
│       ├── page.tsx
│       ├── new/page.tsx
│       └── [id]/page.tsx
├── components/
│   ├── ui/               # Reusable primitives (buttons, modals, badges, inputs)
│   ├── map/              # Mapbox/Leaflet custom layer components & controls
│   ├── trails/           # Trail cards, elevation graph, filter sidebar
│   ├── itinerary/        # Drag-and-drop planner components, day cards
│   ├── weather/          # Live altitude weather cards, alert banners
│   └── stories/          # Story feed, photo viewer, markdown content editor
├── types/                # TypeScript interface definitions
└── lib/                  # API helpers, Mapbox configs, weather utils
```

---

## 📑 Feature Specifications Quick Links

1. 🔐 [Authentication Specification (`01_auth_login_signup.md`)](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/01_auth_login_signup.md)
2. 🗺️ [Trails & Interactive Map Specification (`02_trails_and_map.md`)](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/02_trails_and_map.md)
3. 🏔️ [Landmarks Specification (`03_landmark_view.md`)](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/03_landmark_view.md)
4. 📝 [Itinerary Planner & View Specification (`04_itinerary_planner_and_view.md`)](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/04_itinerary_planner_and_view.md)
5. 🌤️ [Weather & Trail Status Specification (`05_weather_and_trail_status.md`)](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/05_weather_and_trail_status.md)
6. 📖 [Stories & Community Feed Specification (`06_user_stories.md`)](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/docs/features/06_user_stories.md)
