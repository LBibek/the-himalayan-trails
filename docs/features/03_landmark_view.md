# Feature Specification 03: Landmark (Points of Interest)

> **Features:** Landmark  
> **Target Routes:** `/landmarks`, `/landmarks/[id]`  
> **Module Status:** Planned  

---

## 1. Overview & Purpose
The Landmark feature enables users to discover and inspect key points of interest along Himalayan trekking routes. Landmarks include iconic high passes (e.g., Thorong La Pass, Cho La Pass), base camps (e.g., EBC, Annapurna Base Camp), sacred monasteries (e.g., Tengboche Monastery), tea house settlements, lakes (e.g., Tilicho Lake, Gokyo Lakes), and emergency medical stations.

---

## 2. Route & Component Architecture

### Routes
- `/landmarks` — Categorized landmark directory and visual gallery
- `/landmarks/[id]` — Detailed landmark page containing historical context, elevation, nearby trails, and visitor tips

### Component Hierarchy
```
src/app/landmarks/
├── page.tsx                    # Landmark catalog with category tabs & search
└── [id]/page.tsx               # Landmark detailed page

src/components/landmarks/
├── LandmarkCategoryFilter.tsx  # Tabs: Pass, Monastery, BaseCamp, Lake, Village, Emergency
├── LandmarkCard.tsx            # Visual card with elevation tag and quick location
├── LandmarkHero.tsx            # Panoramic hero banner with weather snippet
├── LandmarkGeoDetails.tsx      # GPS coordinates, elevation, permits required
├── NearbyTrailsGrid.tsx        # Carousel of trails passing through this landmark
└── LandmarkGalleryModal.tsx    # High-resolution lightbox photo gallery
```

---

## 3. UI / UX Design & Micro-Interactions

- **Visual Badge Indicators:**
  - Elevation pill (e.g., `5,416m / 17,769ft` in bold gold typography).
  - Category icons (e.g., 🏛️ Monastery, 🏔️ High Pass, ⛺ Base Camp, 🌊 Sacred Lake).
- **Interactive Geo Card:** Embedded mini-map centered on the landmark with 360-degree panorama photo toggle (if available).
- **Permit & Advisory Notice Box:** Distinct alert cards highlighting restricted area permits (e.g., Mustang RAP, Manaslu RAP) or altitude sickness warnings.

---

## 4. Data Models & Schemas

### Landmark Schema (`Landmark`)
```typescript
export interface Landmark {
  id: string;
  name: string;
  nativeName?: string; // e.g. "थोरङ ला"
  category: 'Pass' | 'BaseCamp' | 'Monastery' | 'Lake' | 'Village' | 'Viewpoint' | 'MedicalStation';
  elevationMeters: number;
  region: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description: string;
  historyAndCulture?: string;
  permitsRequired: string[];
  associatedTrailIds: string[];
  mainImageUrl: string;
  photoGallery: string[];
  rating: number;
  reviewsCount: number;
}
```

---

## 5. API Endpoints Contract

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/api/landmarks` | Fetch list of landmarks | `category`, `region`, `minElevation`, `maxElevation` |
| `GET` | `/api/landmarks/:id` | Get single landmark info | None |
| `GET` | `/api/landmarks/:id/nearby` | Fetch nearby tea houses and landmarks | `radiusKm` |

---

## 6. Acceptance Criteria

- [ ] Category filtering switches views without page reload.
- [ ] Image lightbox opens smoothly with keyboard navigation (Arrow left/right, Esc).
- [ ] Direct "View on Interactive Map" link opens `/map` centered on the landmark coordinates.
- [ ] Mobile responsive layout with collapsible historical and safety sections.
