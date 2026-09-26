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
- **HeroUI Component Architecture**: Standardize components using compound patterns and explicit semantic slots (`data-slot="base"`, `data-slot="content"`, `data-slot="header"`, `data-slot="body"`, `data-slot="footer"`, `data-slot="indicator"`). Expose interaction attributes (`data-hovered`, `data-pressed`, `data-focus-visible`).
- **Standard Tailwind Theme Tokens**: Use standard semantic theme tokens (`background`, `foreground`, `surface`, `surface-foreground`, `overlay`, `accent`, `accent-foreground`, `muted`, `border`, `separator`, `focus`). Strictly pair every background token with its corresponding `-foreground` token.
- **Glassmorphism & GSAP Motion**: Design modern frosted-glass components (`backdrop-blur-xl bg-surface/70 border border-border/40 text-surface-foreground`) with GSAP kinetic animations and `#B68D40` gold accent highlights.
- **Recharts Data Visualizations**: Use the Recharts library for all data charts (elevation profiles, weather forecasts, booking metrics), styled with frosted glass and synchronized with 2D/3D maps.
- **Universal Responsiveness**: Ensure high UX value across mobile (375px+), tablet, and desktop form factors.
- **Reference**: See `.agents/rules/heroui_component_theme_rules.md` and skill `.agents/skills/recharts-charts/SKILL.md`.


# GitHub Branching & Vercel Deployment Protocol

- **Continuous Vercel Deployment**: Every change and branch pushed to GitHub must build and deploy to Vercel (Production for `main`, Preview for feature/develop branches).
- **Structured GitHub Branching**: Maintain dedicated branches for development (`develop`, `feature/<name>`, `fix/<name>`). Never commit unverified code directly to `main` without passing tests and builds.
- **Pre-Flight Verification**: Every branch must pass `npx tsc --noEmit` and `npm run test` before merge or deployment.
- **Reference**: See `.agents/rules/git_branching_and_deployment_rules.md` for full implementation details.


