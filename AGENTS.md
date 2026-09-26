<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Zero Mock & Production-Ready Code Standard

- **Strict Ban on Mocks & Fake Data**: Never use mock files, simulated delays, or fake stub functions.
- **Full Stack Production Delivery**:
  - **Frontend**: Real data fetching, validation, and UI state synchronization.
  - **Backend**: Real Next.js App Router API routes (`/api/...`) with validation, proper status codes, and error handling.
  - **Database**: Real persistent database schemas, migrations, relations, and ACID queries.

# Frontend Component Architecture & Modern UI Standards

- **Object-Oriented Map Architecture**: Use polymorphic map controllers (`IMapController`) coordinating 2D Leaflet and 3D Cesium engines via `MapEngineManager`.
- **Cesium 3D Globe**: Integrate CesiumJS for 3D Himalayan terrain topography and summit fly-to controls.
- **Glassmorphism & GSAP Motion**: Design modern frosted-glass components (`backdrop-blur-xl bg-black/60 border border-white/10`) with GSAP kinetic animations.
- **Universal Responsiveness**: Ensure high UX value across mobile (375px+), tablet, and desktop form factors.
