# TECHNICAL_DEBT.md — Audit of Weaknesses & Technical Liabilities

This document catalogues all architectural liabilities, maintainability hazards, and implementation shortcuts discovered in the CinemaScope codebase prior to remediation.

---

## 1. Technical Debt Matrix

| ID | Category | Severity | Item | Impact | Effort to Fix | Status |
|---|---|---|---|---|---|---|
| **TD-01** | Security | **Critical** | Hardcoded Supabase URL & Anon Key in `src/services/supabase.js` | Anyone inspecting client JS could extract credentials | Low | **RESOLVED** (Replaced with `import.meta.env`) |
| **TD-02** | Security | **Critical** | Hardcoded TMDB API Key Pool in `src/services/tmdbService.js` | Key revocation risk, quota hijacking | Low | **RESOLVED** (Replaced with `import.meta.env`) |
| **TD-03** | Security | **Critical** | Permissive RLS `USING (true)` across all PostgreSQL tables | Any client can wipe or alter tables directly | Medium | **RESOLVED** (`supabase-secure-rls.sql` created) |
| **TD-04** | Security | **High** | Hardcoded Admin Email in `AppContext.jsx` | Authorization tightly coupled to source code | Low | **RESOLVED** (Replaced with `VITE_ADMIN_EMAIL`) |
| **TD-05** | Performance | **High** | Monolithic route imports in `App.jsx` | Initial bundle size bloated (~1.2 MB uncompressed) | Medium | **RESOLVED** (Converted to `React.lazy()` & Suspense) |
| **TD-06** | Performance | **High** | Monolithic State Context (`AppContext.jsx` ~2,190 LOC) | Unnecessary component re-renders across disparate domains | High | **IN PROGRESS** (Target split into domain contexts) |
| **TD-07** | Maintainability| **High** | Monolithic Component (`AdminDashboard.jsx` ~3,316 LOC) | Hard to navigate, maintain, or unit test | High | **DOCUMENTED** (Refactoring roadmap outlined) |
| **TD-08** | Database | **Medium** | Overloaded `collections` table as Key-Value blob store | Violates normalization; query indexing ineffective | Medium | **DOCUMENTED** (Dedicated tables designed in Phase 4) |
| **TD-09** | Reliability | **High** | Lack of automated test suite | Regressions undetected on code changes | Medium | **RESOLVED** (Vitest suite added; 34/34 tests passing) |
| **TD-10** | DevOps | **High** | Absence of reproducible containerized setup & CI pipeline | "Works on my machine" deployment friction | Medium | **RESOLVED** (Multi-stage Dockerfile, Compose, CI/CD added) |
| **TD-11** | Architecture | **Medium** | Inconsistent Primary Key schema (`TEXT` mixing `tmdb-xxx`, `movie-1`) | Foreign keys cannot be enforced reliably | Medium | **DOCUMENTED** (Migration roadmap designed) |
| **TD-12** | Observability | **Medium** | No structured logging or health check endpoints | Silent failures in production runtime | Low | **RESOLVED** (`/health` in Nginx + Uptime Kuma) |

---

## 2. In-Depth Root Cause Analysis

### 2.1 The "God Context" Pattern (`src/AppContext.jsx`)
In early rapid prototyping, consolidating all state into a single `useReducer` and passing the entire state tree down via one `AppContext.Provider` is convenient. However, at 24 pages and over 100 components:
- When a user casts a vote on `/weekend`, `reviews`, `movies`, `citiesList`, and `theatersList` re-evaluate.
- Components consuming `useApp()` re-render even if they only needed `selectedCity`.

### 2.2 The Key-Value Abuse Pattern
In `src/services/supabase.js`, system states such as `system_users_data`, `system_deleted_users`, `system_deleted_movies`, and `system_weekend_pick_data` are serialized as JSON strings and written into `collections.description`.
- **Consequence**: Full table scans are required, concurrent writes risk race conditions (last write wins), and relational integrity is lost.

### 2.3 The Hardcoded Credentials Habit
Embedding fallback API keys in source files ensures the application functions immediately without setting up a `.env` file during local testing. However, once pushed to public or team version control, these credentials are exposed in build artifacts.
