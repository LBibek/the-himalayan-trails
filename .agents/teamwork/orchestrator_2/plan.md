# Phase 5 Orchestration Plan

## Objective
Execute Phase 5 of The Himalayan Trails in strict adherence to Zero-Mock standards, HeroUI compound architecture, luxury glassmorphic styling, and production pre-flight verification.

## Milestones & Phasing

### Step 0: Architectural & Codebase Survey
- Dispatch 3 Explorers in parallel:
  - **Explorer 1** (`explorer_p5_1`): Survey HeroUI rules (`.agents/rules/heroui_component_theme_rules.md`), UI tokens, existing components in `src/components/ui/`, and requirements for `InfiniteCarousel.tsx` (CSS marquee keyframes, GPU acceleration, pause-on-hover/touch, mixed card props).
  - **Explorer 2** (`explorer_p5_2`): Survey `src/app/page.tsx`, existing Home page sections, Leaflet integration (`LeafletMap.tsx`, `MapEngineManager.ts`), the 5 core alpine services, and regional coordinates for Everest, Annapurna, Manaslu, Mustang, Langtang.
  - **Explorer 3** (`explorer_p5_3`): Survey `src/components/layout/Navbar.tsx` (mobile hamburger navigation, viewports < 768px, glassmorphic overlay, emergency rescue CTA), `src/components/explorer/UnifiedDiscoveryHub.tsx` (`#trail-switcher-hud` duplicate labels bug), and existing tests in `tests/integration.test.mjs`.

### Step 1: Synthesis & Scoping
- Consolidate explorer findings into `PROJECT.md` Feature Inventory & Architecture.
- Update `TEST_INFRA.md` with required test coverage for Phase 5 (target: 75 tests passing).

### Step 2: Dual Track Execution
- **E2E Testing Track**: Test writer subagent creates integration test suites for Phase 5 (HeroUI semantic slots, Infinite Carousel loop mechanics, Home page services & map region fly-to, Mobile Nav overlay & CTA, HUD deduplication).
- **Implementation Track**:
  - **Milestone 1**: HeroUI Overhaul & Reusable Dual-Speed Infinite Carousel (`src/components/ui/InfiniteCarousel.tsx`).
  - **Milestone 2**: Redesigned Services & Live Interactive Map-Centric Home Page (`src/app/page.tsx`).
  - **Milestone 3**: Luxury Mobile Full-Page Hamburger Nav (`Navbar.tsx`) & Trail Selector HUD Deduplication (`UnifiedDiscoveryHub.tsx`).
  - **Milestone 4 (Final)**: Complete E2E integration test pass (75 tests), `npx tsc --noEmit` (0 errors), `npm run build` (success), and Forensic Integrity Audit (CLEAN).

### Step 3: Verification & Gate Review
- Every milestone runs through Worker -> Reviewers (2) -> Challengers (2) -> Forensic Auditor -> Gate.
- 100% test pass and zero integrity violations required before closing.
