# SYSTEM_DESIGN_ROADMAP.md — Architectural Implementation Roadmap

This roadmap defines the prioritized, staged engineering path for elevating CinemaScope into a hardened, production-grade system using exclusively free and open-source tooling.

---

## Roadmap Phases

```mermaid
timeline
    title CinemaScope Implementation Roadmap
    section Stage 1 : Audit & Discovery
        Discovery : Repository inspection
        Audit Docs : Security & performance baselines
    section Stage 2 : Security & Hardening
        Credentials : Environment variable migration
        Database : PostgreSQL RLS policies
        Admin Boundary : Server-side privilege enforcement
    section Stage 3 : Performance & Bundling
        Code Splitting : React.lazy & Suspense
        Vendor Splitting : Manual rollup chunks
        Nginx Tuning : Gzip compression & security headers
    section Stage 4 : Quality & CI/CD
        Test Harness : Vitest & JSDOM setup
        Automated CI : GitHub Actions pipeline
        Containerization : Multi-stage Docker & Compose
    section Stage 5 : Observability & Deploy
        Health Checks : /health endpoint
        Monitoring : Uptime Kuma integration
        Production Run : Deployment guide & handover
```

---

## Detailed Milestone Breakdown

### Milestone 1: Technical Audit & Repository Discovery (Completed)
- [x] Complete inventory of frontend routes, services, and schemas.
- [x] Identification of security vulnerabilities, technical liabilities, and performance bottlenecks.
- [x] Authoring of audit artifacts (`PROJECT_OVERVIEW.md`, `EXISTING_ARCHITECTURE.md`, `TECHNOLOGY_STACK.md`, `TECHNICAL_DEBT.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_AUDIT.md`).

### Milestone 2: Security & Credentials Remediation (Completed)
- [x] Purge hardcoded Supabase URL and anon key; wire `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- [x] Purge hardcoded TMDB API keys; configure `VITE_TMDB_API_KEY`.
- [x] Purge hardcoded admin email; wire `VITE_ADMIN_EMAIL`.
- [x] Create `.env.example` template covering all runtime dependencies.
- [x] Author `supabase-secure-rls.sql` providing least-privilege PostgreSQL Row Level Security policies.

### Milestone 3: Performance Engineering & Chunk Optimization (Completed)
- [x] Implement dynamic imports with `React.lazy()` and `Suspense` across all 24 page views in `src/App.jsx`.
- [x] Configure Rollup manual chunking in `vite.config.js` (`vendor-react`, `vendor-supabase`, `vendor-icons`, `vendor-image`).
- [x] Configure production Nginx Alpine with Level 6 Gzip compression, 1-year immutable caching for hashed assets, and security headers.
- [x] Verify production build succeeds and outputs optimized chunk sizes.

### Milestone 4: Test Architecture & Automation (Completed)
- [x] Configure Vitest testing environment compatible with Vite 5.
- [x] Author unit tests for core domain algorithms:
  - Review sanitization (`sanitizeReviews`).
  - Like count reconciliation (`reconcileReviewLikes`).
  - User deduplication (`deduplicateUsers`).
  - TMDB utility functions (`formatRuntime`, `normalizeRating5`, `getTmdbImageUrl`).
- [x] Execute test suite and verify 34/34 tests passing cleanly.
- [x] Wire `npm test` script in `package.json`.

### Milestone 5: DevOps, Infrastructure & CI/CD (Completed)
- [x] Create multi-stage production `Dockerfile` with builder stage and Nginx Alpine server stage.
- [x] Create `docker-compose.yml` orchestrating the CinemaScope web service alongside self-hosted Uptime Kuma monitoring.
- [x] Create GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) executing ESLint, build verification, security audit, and Cloudflare Pages deployment on release tags.

### Milestone 6: Architectural Evolution & Database Normalization (Target Future State)
- [ ] Split `AppContext.jsx` into modular domain contexts (`AuthContext`, `MovieCatalogContext`, `ReviewContext`, `WeekendVotingContext`).
- [ ] Break down `AdminDashboard.jsx` (3,316 lines) into modular sub-tab components.
- [ ] Transition from stringified JSON blobs in `collections` to normalized PostgreSQL tables (`weekend_rounds`, `weekend_candidates`, `weekend_votes`, `deletion_requests`).
- [ ] Migrate local storage caching layer to IndexedDB for larger offline capacity.
