# Production Ready & Zero-Mock Policy for Gemini / Antigravity

This repository and project strictly enforce **Production-Ready Code Standards**. Simulated, fake, or mock implementations are strictly prohibited.

---

## 1. Absolute Zero-Mock Policy
- **NO Mock / Fake / Simulated Data Collections**: Never create or rely on hardcoded mock objects (e.g., `MOCK_TRAILS`, `MOCK_USERS`, `mockData.ts`, fake JSON stubs) for operational features.
- **NO Simulated Delays or Fake Handlers**: Never use `setTimeout` to pretend an API call is running, never write fake promise resolvers, and never stub out API functions.
- **NO Hollow Event Handlers**: Never leave form handlers as `onSubmit={(e) => e.preventDefault()}` or `alert('Submitted!')`. Every form, button, and user interaction must execute real backend requests with true persistence.
- **NO Hardcoded Credentials or Token Stubs**: Authentication must use real cryptographic hashing, genuine session or token management, and secure cookies/headers.

---

## 2. Mandatory Full-Stack Architecture

Whenever a feature is implemented or modified, it MUST include all three tiers:

### Tier 1: Frontend (Client & UI)
- **Real Data Binding**: Components must fetch data from real API endpoints or Server Actions using `fetch`, React hooks, or server components.
- **Real Form Handling**: Every form must validate user input, transmit payloads to the backend API, handle HTTP response codes, and display genuine feedback (loading states, validation errors, success confirmations).
- **State Synchronization**: Mutating operations must immediately mutate the backend database and update client state, ensuring changes persist across page reloads.

### Tier 2: Backend (APIs & Server Actions)
- **Real Next.js App Router Route Handlers (`src/app/api/...`) & Server Actions**: Complete implementation of GET, POST, PUT, PATCH, and DELETE handlers.
- **Input Validation & Sanitization**: Validate all incoming query parameters and request bodies (e.g., using Zod or comprehensive schema validation) before touching the database.
- **Proper HTTP Status Codes & Error Handling**: Return proper standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`) with structured JSON error responses `{ error: string }`.
- **Security & Cryptography**: Real password hashing (e.g., `bcryptjs` / `crypto`), secure cookie issuance, and authorization checks.

### Tier 3: Database (Persistence & Schemas)
- **Real Persistent Database**: Use a production-grade database engine (e.g., SQLite via Prisma / better-sqlite3, PostgreSQL / Supabase) with real file/server storage.
- **Structured Relational Schemas**: Define rigorous models with types, primary keys, foreign key relations, constraints, default values, and timestamps (`createdAt`, `updatedAt`).
- **Database Migrations & Seeding**: Keep schema migrations up to date. Populate base operational/reference catalogs (such as initial official Himalayan trail routes and landmarks) via repeatable database seeds directly into SQL tables, not client-side fake arrays.
- **ACID Transactions & Data Integrity**: Use database transactions for multi-step mutations (e.g., booking creation with inventory reservation).

---

## 3. Production Verification Requirement
Every feature must be verifiable from end to end:
1. User enters data in the UI.
2. The UI sends a real HTTP request to the backend.
3. The backend validates the request and executes a persistent database query.
4. The database stores the record reliably.
5. The UI receives the real database record and displays it.
6. A browser refresh confirms persistent state retrieval from the database.

---

## 4. Frontend Component, OOP Map Systems & Glassmorphism Standards
1. **Object-Oriented Flow for Maps**:
   - Implement maps using clean Object-Oriented Design (`IMapController` abstraction).
   - Encapsulate 2D (Leaflet) and 3D (Cesium) engines in dedicated controller classes coordinated via a centralized `MapEngineManager`.
2. **Cesium 3D Globe Integration**:
   - Seamlessly integrate Cesium for 3D Himalayan terrain visualization, altitude perspective, and summit fly-to controls.
3. **HeroUI Component Architecture & Compound Patterns**:
   - Implement components using compound patterns and explicit semantic slots (`data-slot="base"`, `data-slot="content"`, `data-slot="header"`, `data-slot="body"`, `data-slot="footer"`, `data-slot="trigger"`, `data-slot="indicator"`).
   - Expose interactive state via data attributes (`data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`).
   - Adhere to React Aria headless accessibility standards with prominent focus rings (`focus-visible:ring-2 focus-visible:ring-focus`).
4. **Standard Tailwind Theme Token System**:
   - Style all surfaces and elements using semantic tokens (`background`, `foreground`, `surface`, `surface-foreground`, `overlay`, `accent`, `accent-foreground`, `muted`, `border`, `separator`, `focus`).
   - Strict contrast rule: background tokens must always be paired with their matching `-foreground` tokens (e.g. `bg-surface text-surface-foreground`, `bg-accent text-accent-foreground`).
5. **Glassmorphism Design & GSAP Animations**:
   - Use high-fidelity frosted glass interfaces (`backdrop-blur-xl bg-surface/70 border border-border/40 shadow-2xl` with `#B68D40` gold accents).
   - Animate interactions using **GSAP** (kinetic reveals, staggered card transitions, smooth drawer animations).
6. **Universal Multi-Device Responsiveness**:
   - Ensure every component provides high UX value across all devices (mobile 375px+, tablets, and desktops).

