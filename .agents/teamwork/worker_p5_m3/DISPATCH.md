## 2026-09-27T06:14:00Z
You are worker_p5_m3, an implementation worker.
Your working directory is: c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\worker_p5_m3
Your parent conversation ID is: 1e815840-c007-4f0e-8244-3a4e20863857

MISSION: Implement Milestone 3 (Luxury Full-Page Mobile Hamburger Navigation & Trail Selector HUD Deduplication — R4 & R5).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

READ FIRST:
1. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md` (specifically header `## 2026-09-27T06:02:55Z`, R4 & R5).
2. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\orchestrator_2\PROJECT.md`.
3. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_p5_3\analysis.md` (contains complete code architectures).
4. `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_p5_3\handoff.md`.

YOUR EXCLUSIVE FILE OWNERSHIP:
- `src/components/layout/Navbar.tsx` (modify)
- `src/components/explorer/UnifiedDiscoveryHub.tsx` (modify)

IMPLEMENTATION REQUIREMENTS:
1. `src/components/layout/Navbar.tsx`:
   - Luxury full-screen frosted-glass overlay on viewports `< 768px` (`fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white`).
   - Accessible modal semantics: `role="dialog"`, `aria-modal="true"`, `aria-label="Mobile Navigation"`.
   - Body scroll lock: lock `document.body.style.overflow = 'hidden'` when open, restore on close.
   - Smooth animated hamburger-to-close toggle icon.
   - Keyboard listener: close on `Escape` key and restore focus to menu button trigger.
   - Luxury split layout:
     - Primary navigation links with Lucide icons, titles, and route descriptions.
     - Live search input field with search icon and accessible focus ring.
     - Quick expedition shortcuts: EBC, Annapurna, Manaslu, Mustang.
     - 24/7 Helicopter Evacuation & High-Altitude SAR emergency hotline CTA button (`tel:+97714123456`).
   - Strict HeroUI slots: `data-slot="base"`, `data-slot="trigger"`, `data-slot="overlay"`, `data-slot="body"`, `data-slot="footer"`.
   - Accessible focus rings: `focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none`.
2. `src/components/explorer/UnifiedDiscoveryHub.tsx`:
   - Inspect `#trail-switcher-hud` (around lines 878–912).
   - Deduplicate trail entries via `uniqueHudTrails` so that each trail button has a unique trail identity.
   - Replace `{t.region}` with distinct, unique trail names (e.g. "Everest Base Camp", "Annapurna Circuit", "Langtang Valley", "Manaslu Circuit").
   - Display distinct metadata for each button: trail name + max elevation in meters (e.g. `5,364m`, `5,416m`).
   - Guarantee 0 duplicate labels across the buttons.

VERIFICATION:
Run `npx tsc --noEmit` and `npm test`. Both must pass with 0 errors.

OUTPUT:
Write your implementation details to `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\worker_p5_m3\handoff.md`.
Update `progress.md` in your directory.
Send a message back to parent when complete.
