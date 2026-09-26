# Feature Specification 05: Weather and Trail Status

> **Features:** weather and trail  
> **Target Routes:** `/weather`, `/trails/[id]/weather`  
> **Module Status:** Planned  

---

## 1. Overview & Purpose
High-altitude Himalayan weather can change rapidly. The Weather and Trail Status module delivers real-time weather forecasts pinpointed to specific mountain altitudes (e.g., Lukla 2,860m vs Gorak Shep 5,164m), temperature lapse rate estimates, wind speeds, avalanche risks, snow cover reports, and community-reported trail hazards (e.g., landslide blockages, damaged suspension bridges).

---

## 2. Route & Component Architecture

### Routes
- `/weather` — Master Himalayan weather hub with multi-region selector
- Dynamic integration into `/trails/[id]` page tab

### Component Hierarchy
```
src/app/weather/
└── page.tsx                    # Multi-region Himalayan weather dashboard

src/components/weather/
├── AltitudeWeatherCard.tsx     # Current temp, feels like, wind speed, UV index, freezing level
├── MultiDayForecastTable.tsx   # 7-day hourly/daily altitude forecast chart
├── TrailHazardAlertBanner.tsx  # Critical safety alerts (Landslide, Blizzard warning, Bridge closed)
├── AvalancheRiskGauge.tsx      # Risk indicator meter (1-Low to 5-Extreme)
└── HazardReportModal.tsx       # User submission form to log a real-time trail obstacle/hazard
```

---

## 3. UI / UX Design & Micro-Interactions

- **Altitude Slider Selector:** Users can toggle weather by altitude (e.g. Base Camp vs High Pass vs Valley floor).
- **Hazard Level Badging:**
  - 🟢 **Passable:** Normal trail conditions.
  - 🟡 **Caution:** Micro-crampons / spikes required, ice patches.
  - 🔴 **Blocked / Dangerous:** Route closed due to heavy snowfall or landslide.
- **Dynamic Background FX:** Subtle glassmorphic animated overlays reflecting live conditions (falling snow particles, drifting mist, clear starry mountain night).

---

## 4. Data Models & Schemas

### Weather Report (`AltitudeWeather`)
```typescript
export interface AltitudeWeather {
  locationName: string;
  elevationMeters: number;
  region: string;
  temperatureC: number;
  feelsLikeC: number;
  windSpeedKmh: number;
  windDirection: string;
  humidityPercent: number;
  precipitationChancePercent: number;
  snowDepthCm: number;
  freezingAltitudeMeters: number;
  uvIndex: number;
  condition: 'Clear' | 'PartlyCloudy' | 'Snow' | 'Blizzard' | 'Fog' | 'Rain';
  forecast7Days: {
    date: string;
    tempMinC: number;
    tempMaxC: number;
    condition: string;
  }[];
}

export interface TrailHazardReport {
  id: string;
  trailId: string;
  landmarkName: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  description: string;
  reportedAt: string;
  reporterName: string;
  status: 'Active' | 'Resolved';
}
```

---

## 5. API Endpoints Contract

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/api/weather` | Fetch weather for specified coordinates & altitude | `lat`, `lng`, `elevation` |
| `GET` | `/api/weather/hazards` | Fetch active hazard reports | `trailId`, `region` |
| `POST` | `/api/weather/hazards` | Submit new hazard report | `Omit<TrailHazardReport, 'id' \| 'reportedAt'>` |

---

## 6. Acceptance Criteria

- [ ] Weather metrics update with altitude adjustments.
- [ ] Active critical hazards render an emergency top bar notice across affected trail pages.
- [ ] User hazard submissions require photo proof or coordinates validation.
