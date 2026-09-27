## 2026-09-27T06:19:49Z

You are worker_p5_m2, an implementation worker.
Your working directory is: c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\worker_p5_m2
Your parent conversation ID is: 1e815840-c007-4f0e-8244-3a4e20863857

MISSION: Implement Milestone 2 (Services & Live Interactive Map-Centric Home Page — R3).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

READ FIRST:
1. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically header `## 2026-09-27T06:02:55Z`, R3).
2. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\orchestrator_2\PROJECT.md`.
3. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_p5_2\analysis.md` (contains complete code architectures).
4. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_p5_2\handoff.md`.

YOUR EXCLUSIVE FILE OWNERSHIP:
- `src/app/page.tsx` (redesign)
- `src/components/home/HomeRegionalMap.tsx` (create client-side interactive regional Leaflet map canvas)

IMPLEMENTATION REQUIREMENTS:
1. `src/components/home/HomeRegionalMap.tsx`:
   - Interactive regional Leaflet map canvas loaded dynamically with `next/dynamic` (`ssr: false`) to avoid hydration errors.
   - Quick region selector tabs:
     - `Everest / Khumbu`: `[27.9881, 86.9250]`, zoom 10.5
     - `Annapurna`: `[28.6000, 83.9500]`, zoom 10.0
     - `Manaslu`: `[28.4500, 84.6500]`, zoom 10.5
     - `Mustang`: `[29.0000, 83.8500]`, zoom 10.0
     - `Langtang`: `[28.2000, 85.4500]`, zoom 11.0
   - Smooth animated camera transition (`map.flyTo`) when region tab is clicked.
   - Prominent, high-contrast direct CTA button to the 3D Cesium discovery hub (`/map?engine=cesium` or `/explorer`).
   - Standard HeroUI semantic slots (`data-slot="base"`, `data-slot="header"`, `data-slot="body"`).
2. `src/app/page.tsx`:
   - Integrate `InfiniteCarousel` from `src/components/ui/InfiniteCarousel.tsx` (built in Milestone 1).
   - Core Alpine Services Matrix with 5 dedicated frosted-glass service cards (`data-slot="base"`, `data-slot="header"`, `data-slot="body"`, `data-slot="footer"`):
     1. Guided Alpine Expeditions (IFMGA Sherpa leaders, oxygen logistics, summit pushes)
     2. Custom 3D Itinerary Planning (Day-by-day altitude pacing, GPX export, acclimatization)
     3. Sherpa & Porter Logistics (Fair-wage porters, gear transport, teahouse reservations)
     4. Helicopter Rescue & High-Altitude Evac (24/7 Garmin inReach dispatch, emergency liaison)
     5. Conservation Permits & TIMS Passes (National park entry, restricted area permits)
   - Real persistent actions (`/contact`, `/itinerary/planner`, `/checkout`, `/api/inquiries`).
   - Standard Tailwind contrast token pairings (`bg-surface text-surface-foreground`, `bg-accent text-accent-foreground`, `#B68D40` gold accents).
   - Accessible focus rings on all buttons and interactive elements (`focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none`).

VERIFICATION:
Run `npx tsc --noEmit` and `npm test`. Both must pass with 0 errors.

OUTPUT:
Write your implementation details to `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\worker_p5_m2\handoff.md`.
Update `progress.md` in your directory.
Send a message back to parent when complete.
