## 2026-09-27T06:14:00Z
MISSION: Implement Milestone 1 (HeroUI Component Architecture Overhaul & Dual-Speed Continuous Infinite Carousel — R1 & R2).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

READ FIRST:
1. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically header `## 2026-09-27T06:02:55Z`, R1 & R2).
2. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\orchestrator_2\PROJECT.md`.
3. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_p5_1\analysis.md` (contains complete code architectures).
4. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_p5_1\handoff.md`.

YOUR EXCLUSIVE FILE OWNERSHIP:
- `src/components/ui/InfiniteCarousel.tsx` (create)
- `src/app/globals.css` (modify: add `@keyframes marquee-left` and `@keyframes marquee-right` with GPU transform translate3d, and utility classes)
- `src/components/ui/GlassBadge.tsx` (modify: add root `data-slot="base"`, support state attributes)
- `src/components/ui/GlassCard.tsx` (modify: add keyboard activation and focus ring support `focus-visible:ring-2 focus-visible:ring-focus`)

IMPLEMENTATION REQUIREMENTS:
1. `src/components/ui/InfiniteCarousel.tsx`:
   - High-performance HeroUI compound component (`InfiniteCarousel`, `CarouselTrack`, `CarouselCard`).
   - Semantic slots: `data-slot="base"`, `data-slot="track"`, `data-slot="card"`.
   - Dual mirrored content tracks (`Track` + `Track aria-hidden="true"`) to guarantee 0 seam / 0 jump continuous marquee.
   - GPU-accelerated CSS marquee animation (`will-change: transform`, `transform: translate3d(0, 0, 0)`).
   - Props: `items`, `speed="slow" | "normal" | "fast"`, `direction="left" | "right"`, `pauseOnHover={true}`, `pauseOnTouch={true}`.
   - Mixed card models:
     - Expedition route cards: trail name, region, max altitude, total distance, duration, elevation badge, View Expedition action.
     - Alpine service cards: service title, lead icon, highlighted metric (e.g. "100% IFMGA Sherpa", "24/7 Garmin SAR", "100% Legal RAP Permits"), description, Book/Inquire action.
2. `src/app/globals.css`:
   - Add marquee animations (`@keyframes marquee-left`, `@keyframes marquee-right`).
   - Add support for pause-on-hover: `.group:hover .animate-marquee-left { animation-play-state: paused; }`.
3. `src/components/ui/GlassBadge.tsx` and `GlassCard.tsx`:
   - Ensure `data-slot="base"` on root container.
   - Ensure `focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none`.

VERIFICATION:
Run `npx tsc --noEmit` and `npm test`. Both must pass with 0 errors.

OUTPUT:
Write your implementation details to `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\worker_p5_m1\handoff.md`.
Update `progress.md` in your directory.
Send a message back to parent when complete.
