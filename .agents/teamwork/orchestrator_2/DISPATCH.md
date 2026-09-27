# Dispatch Record

## 2026-09-27T06:04:47Z
You are the Project Orchestrator for Phase 5 of The Himalayan Trails.

Your working directory is:
`c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\orchestrator_2`

The authoritative user request is stored in:
`c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md` (see header `## 2026-09-27T06:02:55Z`).

Project root: `c:\Users\acer\Desktop\The Himalayan Trails`
Integrity mode: `development`

Core Mission & Requirements:
R1. Complete HeroUI Component Architecture Overhaul:
- Explicit semantic slots (`data-slot="base"`, `data-slot="content"`, `data-slot="header"`, `data-slot="body"`, `data-slot="footer"`, `data-slot="trigger"`, `data-slot="indicator"`).
- Interactive state reflection attributes (`data-hovered`, `data-pressed`, `data-focus-visible`).
- Standard Tailwind contrast token pairings (`bg-surface text-surface-foreground`, `bg-accent text-accent-foreground`, `#B68D40` gold accents).
- Prominent React Aria-compliant focus rings (`focus-visible:ring-2 focus-visible:ring-[#B68D40]`).

R2. Dual-Speed Continuous Infinite Carousel:
- Build reusable high-performance HeroUI infinite marquee carousel component (`src/components/ui/InfiniteCarousel.tsx`).
- Seamless continuous loop using GPU-accelerated CSS marquee with mirrored content buffers (zero seam, zero jump).
- Displays mixed cards: top Himalayan expedition routes (with live altitude, distance, duration) interspersed with high-altitude alpine services (Sherpa logistics, helicopter rescue, TIMS/conservation permits).
- Built-in pause-on-hover, pause-on-touch, and responsive card sizing.

R3. Services & Live Interactive Map-Centric Home Page:
- Redesign `src/app/page.tsx`:
  - 5 dedicated frosted-glass service cards (`data-slot="base"`):
    1. Guided Alpine Expeditions (IFMGA Sherpa leaders, oxygen logistics, summit pushes)
    2. Custom 3D Itinerary Planning (Day-by-day altitude pacing, GPX export, acclimatization)
    3. Sherpa & Porter Logistics (Fair-wage porters, gear transport, teahouse reservations)
    4. Helicopter Rescue & High-Altitude Evac (24/7 Garmin inReach dispatch, emergency liaison)
    5. Conservation Permits & TIMS Passes (National park entry, restricted area permits)
  - Embedded live interactive Leaflet map canvas directly on the Home page with quick region selector tabs (`Everest / Khumbu`, `Annapurna`, `Manaslu`, `Mustang`, `Langtang`), auto-flying camera coordinates, and direct link to 3D Cesium discovery hub.

R4. Luxury Full-Page Mobile Hamburger Navigation:
- Upgrade `src/components/layout/Navbar.tsx` on viewports `< 768px`:
  - Full-screen frosted-glass overlay (`fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white`).
  - Luxury split layout: kinetic primary navigation links with icons & route descriptions; quick expedition shortcuts (EBC, Annapurna, Manaslu, Mustang), live search input, emergency helicopter rescue hotline CTA.
  - Smooth animated hamburger-to-close toggle and staggered kinetic link reveals.

R5. Trail Selector HUD Deduplication:
- In `src/components/explorer/UnifiedDiscoveryHub.tsx`, fix floating Trail Selector HUD (`#trail-switcher-hud`):
  - Replace duplicate region labels with unique, distinct trail names (e.g. Everest Base Camp, Annapurna Circuit, Langtang Valley, Manaslu Circuit).
  - Ensure each trail button displays distinct metadata (name + max altitude) with 0 duplicated labels.

Quality, Zero-Mock & Pre-Flight Verification:
- `npx tsc --noEmit` must pass with 0 errors.
- `npm test` must pass all automated full-stack tests cleanly.
- `npm run build` must succeed with zero build errors.
- Strict Zero-Mock Policy: no fake timers, no hardcoded mock collections for operational features, true database persistence.
