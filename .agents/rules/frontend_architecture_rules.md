# Frontend Component & Map Architecture Standards

> **Mandatory Architecture Rule for Antigravity / Gemini Agents**
> Scope: All UI components, geospatial map implementations, animations, and responsive layouts.

---

## 1. Object-Oriented Flow for Maps & Controllers
All map engines and complex domain logic must follow an **Object-Oriented Architecture (OOA)**:
- **Strategy & Interface Abstraction**: Define unified interfaces (e.g. `IMapController`) establishing standard contracts for geospatial operations (`init`, `flyTo`, `renderTrailRoute`, `addLandmarkPin`, `setHoverScrubber`, `destroy`).
- **Encapsulated Engine Controllers**: Implement separate class controllers for distinct engines:
  - `LeafletController` for 2D tactical, topographic, and trail polyline maps.
  - `CesiumController` for 3D globe, mountain terrain elevation, atmospheric perspective, and high-altitude summit fly-throughs.
- **Map Engine Manager / Factory Pattern**: Orchestrate multi-engine lifecycles through a central manager (`MapEngineManager`) to allow dynamic switching between 2D Topographic and 3D Cesium Globe representations without tightly coupling UI components to specific engine APIs.

---

## 2. 3D Cesium Globe Integration
- **3D Geospatial Engine**: Integrate CesiumJS for high-fidelity 3D Himalayan terrain rendering.
- **Topographic Terrain**: Support 3D digital elevation models, summit fly-to coordinates (Mount Everest 8,848m, K2, Kangchenjunga, Annapurna, Manaslu), and high-altitude flight paths.
- **Resilient Client Loading**: Load WebGL/Wasm-dependent Cesium components dynamically with SSR disabled (`dynamic(() => ..., { ssr: false })`) to guarantee zero Next.js hydration mismatches.

---

## 3. Modern Glassmorphism Design System
All modern UI surfaces must adhere to the **Himalayan Glassmorphism Standard**:
- **Frosted Translucency**: `backdrop-blur-xl bg-black/60` or `bg-neutral-900/70` with subtle border delineation (`border border-white/10` or `border-[#B68D40]/30`).
- **Metallic Gold Accent Hierarchy**: Primary brand accents use Himalayan Gold (`#B68D40`), warm amber (`#E2C085`), and stark ice white (`#F5F6F7`).
- **Multi-Layered Depth**: Combine dark glass backdrops, drop-shadow elevations (`shadow-2xl shadow-black/50`), and soft ambient inner glows.

---

## 4. GSAP Micro-Animations & Motion Design
- **Kinetic Physics**: Integrate **GSAP (GreenSock)** for performant, hardware-accelerated animations.
- **Staggered Enters & Reveals**: Use `gsap.from()` and `gsap.stagger()` for smooth entry of lists, cards, and data metrics.
- **Micro-Interactions**: Implement spring-based hover states, elastic button pushes, and silky smooth drawer transitions.
- **Clean Lifecycle Cleanup**: Always clean up GSAP contexts (`gsap.context()`) in `useEffect` returns to prevent memory leaks and duplicate tweens.

---

## 5. Universal Responsiveness & High-Value UX
- **Mobile-First Accessibility**: Every component must be crafted with high UX value for all device form factors:
  - Mobile (375px - 640px): Full-width glass cards, collapsible HUDs, touch-friendly tap targets (minimum 44x44px).
  - Tablet (768px - 1024px): Balanced split-screen workspaces and adaptive grids.
  - Desktop (1280px+): Immersive full-screen 3D globe viewports and multi-pane studios.
- **Progressive Enhancement**: Ensure essential content, trail details, and data are immediately accessible even before heavy WebGL engines initialize.
