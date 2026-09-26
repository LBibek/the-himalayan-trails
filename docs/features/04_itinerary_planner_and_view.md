# Feature Specification 04: Itinerary Planner & Itineraries View

> **Features:** Itinerary Planner, Itineraries View  
> **Target Routes:** `/itinerary/planner`, `/itineraries`, `/itineraries/[id]`  
> **Module Status:** Planned  

---

## 1. Overview & Purpose
The Itinerary module allows users to plan customized day-by-day Himalayan treks or explore community-created itineraries. The **Itinerary Planner** includes drag-and-drop daily route customization, automated altitude gain calculation (acclimatization warning triggers), budget estimation, and gear checklist generator. The **Itineraries View** lets users browse, clone, rate, and export itineraries.

---

## 2. Route & Component Architecture

### Routes
- `/itinerary/planner` — Interactive trip builder tool
- `/itineraries` — Public catalog of curated & user-generated itineraries
- `/itineraries/[id]` — View page for a specific itinerary with day-by-day breakdown

### Component Hierarchy
```
src/app/
├── itinerary/
│   ├── planner/page.tsx           # Drag-and-Drop itinerary planner workstation
│   └── page.tsx                   # Redirect to planner or saved itineraries
└── itineraries/
    ├── page.tsx                   # Community itineraries discovery page
    └── [id]/page.tsx              # Detailed itinerary view & print/PDF export

src/components/itinerary/
├── PlannerCanvas.tsx              # Main drag-and-drop daily timeline
├── DayCardItem.tsx                # Single day block (Start, End, Distance, Elevation Gain, Sleeping Altitude)
├── AcclimatizationAlert.tsx       # Safety alert triggering if sleeping altitude increases > 500m/day above 3000m
├── GearChecklistModal.tsx         # Automated gear recommendation based on max altitude & season
├── ItinerarySummarySidebar.tsx    # Total Days, Total Elevation Gain, Estimated Cost ($), Difficulty score
├── ItineraryCard.tsx              # Community itinerary item card
└── ExportPDFButton.tsx            # Client-side PDF preview and download trigger
```

---

## 3. UI / UX Design & Micro-Interactions

### Drag-and-Drop Planner Experience
- **Interactive Timeline:** Reorder days easily with smooth drag visual cues.
- **Acclimatization Guardrail:** If a user schedules a day with `> 600m` altitude gain above `3,000m` without a rest day, a glowing amber banner appears:  
  *⚠️ Acclimatization Warning: Sleeping altitude increases by 750m today. Consider adding an acclimatization day.*
- **Custom Stop Adding:** Search bar to insert tea house villages, rest points, or side trips (e.g., Kala Patthar sunrise hike).

### Export & Sharing Options
- 📄 Export printable PDF itinerary with offline maps & emergency contact numbers.
- 📲 One-click "Clone to My Planner" button.

---

## 4. Data Models & Schemas

### Itinerary Day & Itinerary Object (`Itinerary`)
```typescript
export interface ItineraryDay {
  dayNumber: number;
  title: string; // e.g. "Namche Bazaar to Tengboche"
  startPoint: string;
  endPoint: string;
  distanceKm: number;
  trekkingHours: number;
  startElevationMeters: number;
  endElevationMeters: number;
  isAcclimatizationDay: boolean;
  notes?: string;
  recommendedStay?: string; // Tea House / Camping
}

export interface Itinerary {
  id: string;
  title: string;
  description: string;
  trailId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  totalDays: number;
  maxElevationMeters: number;
  estimatedCostUSD: number;
  isPublic: boolean;
  days: ItineraryDay[];
  likesCount: number;
  clonesCount: number;
  createdAt: string;
}
```

---

## 5. API Endpoints Contract

| Method | Endpoint | Description | Payload |
|--------|----------|-------------|---------|
| `GET` | `/api/itineraries` | List community itineraries | Query: `trailId`, `maxDays`, `sort` |
| `GET` | `/api/itineraries/:id` | Fetch specific itinerary details | None |
| `POST` | `/api/itineraries` | Save a new custom itinerary | `Omit<Itinerary, 'id'>` |
| `POST` | `/api/itineraries/:id/clone` | Clone itinerary to logged-in user account | None |

---

## 6. Acceptance Criteria

- [ ] Real-time total distance and elevation recalculation as days are modified or reordered.
- [ ] Acclimatization warning pops up automatically when safety thresholds are breached.
- [ ] Export to PDF renders crisp, print-friendly layout.
- [ ] Unsaved changes warning modal when navigating away from `/itinerary/planner`.
