# Git Branching Strategy & Vercel Deployment Standards

> **Mandatory Rule for All Antigravity / Gemini Agents**
> **Scope**: Version control, branch management, pull requests, and automated deployment lifecycles for *The Himalayan Trails*.

---

## 1. GitHub Branching Strategy & Lifecycle Discipline

All code development in *The Himalayan Trails* must follow a structured **Branching Model**:

### A. Branch Hierarchy & Naming Conventions
| Branch Category | Naming Pattern | Target Base | Deployment Target | Description |
|---|---|---|---|---|
| **Production** | `main` | - | Vercel Production | Always stable, production-ready release code. |
| **Integration** | `develop` | `main` | Vercel Staging/Preview | Aggregation branch for tested features prior to production release. |
| **Feature** | `feature/<name>` | `develop` or `main` | Vercel Preview | New capabilities, UI flows, map tools, or API endpoints. |
| **Bugfix** | `fix/<name>` | `develop` or `main` | Vercel Preview | Patches for reported defects or runtime errors. |
| **Hotfix** | `hotfix/<name>` | `main` | Vercel Production | Critical production patches deployed immediately. |
| **Chore / Docs** | `chore/<name>` | `develop` or `main` | Vercel Preview | Config updates, test suites, rules, and documentation. |

### B. Branch Creation & Development Protocol
1. **Always branch off updated base**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```
2. **Maintain clean commit history**:
   - Follow Conventional Commits: `feat: ...`, `fix: ...`, `test: ...`, `refactor: ...`, `chore: ...`.
   - Never commit sensitive keys, personal tokens, or unverified temporary files.
3. **Branch Verification Gate**:
   Before merging or opening a pull request from any branch:
   - `npx tsc --noEmit` must exit with code 0 (zero type errors).
   - `npm run test` must pass 100% of integration and database persistence tests.
   - `npm run build` must compile successfully with zero build-time warnings/errors.
4. **Push to Remote**:
   - Always push the branch to GitHub:
     ```bash
     git push -u origin feature/your-feature-name
     ```

---

## 2. Vercel Deployment Standards

Every branch and code update must integrate seamlessly with **Vercel**:

### A. Continuous Deployment Automation
- **Push to `main`**: Automatically triggers a **Vercel Production Deployment** (`the-himalayan-trails-going-genius-projects.vercel.app`).
- **Push to any branch (`develop`, `feature/*`, `fix/*`)**: Automatically triggers a **Vercel Preview Deployment** with a unique preview URL.
- **Pull Requests**: Pull requests automatically build preview instances to allow visual review of UI/UX, mobile responsiveness, and map performance before merging.

### B. Configuration Contract (`vercel.json`)
- All deployment-level routing, caching headers (e.g. immutable cache for `/Cesium/` static assets), security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`), and region assignments (`iad1`) must be declared in [`vercel.json`](file:///c:/Users/acer/Desktop/The%20Himalayan%20Trails/vercel.json).
- Never modify deployment settings in the web dashboard without updating `vercel.json` in the codebase to preserve Infrastructure-as-Code parity.

### C. Serverless Persistence Integrity
- Serverless API routes running on Vercel Lambdas must support transient SQLite storage with fallback to `/tmp/himalayan_trails.db` and auto-seed reference trail catalogs upon cold start.
- Mutating operations in preview environments must validate inputs strictly and return proper HTTP status codes.

---

## 3. Pre-Flight Verification Checklist

Before reporting completion of any task:
1. [ ] **Branch Verified**: Work is contained in a properly named branch (`feature/*`, `fix/*`, `develop`, or `main`).
2. [ ] **Branch Pushed**: Remote tracking branch exists on GitHub (`origin/<branch>`).
3. [ ] **Tests Pass**: `npm run test` passes 100%.
4. [ ] **Build Clean**: `npm run build` compiles without errors.
5. [ ] **Vercel Configuration Verified**: `vercel.json` and `.vercel/project.json` match project identifiers.
