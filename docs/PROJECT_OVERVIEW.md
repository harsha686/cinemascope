# PROJECT_OVERVIEW.md — CinemaScope System Overview

## 1. Executive Summary

**CinemaScope** (code identifier: `theater`) is a specialized web application engineered for cinema enthusiasts, with primary focus on Indian cinema (specifically Tollywood / Telugu, Tamil, Hindi, and Malayalam cinema) centered in Visakhapatnam, Andhra Pradesh, India.

The platform bridges a major gap in the theatrical moviegoing experience: **screen specifications, projection systems, aspect ratio representations, and authentic format-level theater reviews**. Unlike generic ticketing platforms (BookMyShow, Paytm Insider), CinemaScope provides deep technical insights into cinema screens (IMAX with Laser, Dolby Atmos, 4K RGB Laser, EPIQ, Barco DP4K, 70mm, ScreenX) alongside social movie discovery, crowd-sourced weekend picks voting, personal cinema diary, and curated collections.

---

## 2. Core Value Proposition & Domain Mission

1. **Aspect Ratio & Screen Experience Simulation**: Demonstrates how a film shot in 1.90:1 (IMAX digital), 1.43:1 (IMAX 70mm), 2.39:1 (Scope), or 1.85:1 (Flat) is framed on specific physical theater screens across Visakhapatnam.
2. **Theater & Screen Technical Directory**: In-depth catalog of city multiplexes and single screens (e.g., Sangam Sarat, Jagadamba, V-Max, Inox Varun Beach, PVR Cinepolis) with verified sound specs, projection gear, and seating capacities.
3. **Dual-Tier Review Ecosystem**: Authentic community reviews + verified Professional Reviewer system with multi-criteria rating matrices (Visual Clarity, Projection Alignment, Sound Dynamics, Seating Comfort, Ambience).
4. **Community Weekend Picks & Gamification**: Weekly consensus voting rounds allowing users to vote on curated movie candidates, earn CinemaScore points, and climb community leaderboards.
5. **Personal Cinema Suite**: Letterboxd-style personal watchlist, watched archive, interactive diary, and customizable public/private collections.
6. **OTT Streaming & Theatrical Bridge**: Automated tracking of digital OTT premiere dates, streaming provider links, and theatrical release statuses.

---

## 3. Technology Stack Summary

| Layer | Selected Technology | Version | License | Self-Hostable |
|---|---|---|---|---|
| **Frontend Framework** | React + React DOM | `18.3.1` | MIT | Yes |
| **Routing** | React Router DOM (`HashRouter`) | `7.18.2` | MIT | Yes |
| **Build & Dev Tooling** | Vite + Rollup | `5.4.10` | MIT | Yes |
| **Styling & Theme** | CSS3 Custom Properties (Vanilla) | Modern | Open Standard | Yes |
| **Icons** | Lucide React | `1.31.0` | ISC | Yes |
| **Mapping Engine** | Leaflet.js | `1.9.4` | BSD-2-Clause | Yes |
| **Card Export / Canvas** | html-to-image | `1.11.13` | MIT | Yes |
| **Testing Harness** | Vitest + jsdom | `1.6.1` / `31.0.1` | MIT | Yes |
| **Database & Auth (BaaS)** | Supabase (PostgreSQL + PostgREST) | `2.109.0` (Client) | Apache-2.0 (Core Engine) | Yes (via Docker Compose) |
| **External Movie Data** | TMDB API v3 | REST | Proprietary Free API (Non-commercial) | No |
| **Web Server / Reverse Proxy**| Nginx Alpine | `1.27` | BSD-2-Clause | Yes |
| **Containerization** | Docker Engine + Docker Compose | `v2+` | Apache-2.0 | Yes |
| **CI / CD Automation** | GitHub Actions | Workflows | Platform Free Tier | No (Runner is Apache-2.0) |

---

## 4. Repository Structure Map

```
c:\Users\hp\Desktop\Desktop - Copy\Projects\Cinema scope\
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # Automated Lint, Build, Audit, and Tag Deploy
├── dist/                            # Production output from Vite build
├── docs/                            # Comprehensive System Architecture & Audit Suite
├── public/                          # Static assets (favicons, banners, logos)
├── server/                          # Reserved for future self-hosted micro-backends
├── src/
│   ├── assets/                      # SVGs and UI media
│   ├── components/
│   │   ├── admin/                   # TMDB import, poster discovery, theater form modals
│   │   ├── auth/                    # Google OAuth button & auth handlers
│   │   ├── city/                    # Theater maps (Leaflet) and Theater cards
│   │   ├── common/                  # Skeleton loaders, CloudSync status pills
│   │   ├── comparison/              # Aspect ratio interactive comparison sliders
│   │   ├── discovery/               # Search autocomplete, movie filters
│   │   ├── layout/                  # Responsive Navbar, MobileBottomNav, Footer
│   │   ├── library/                 # Watchlist, Diary forms, Collection modals
│   │   ├── movies/                  # Movie cards, OTT modals, cast carousels
│   │   ├── pro/                     # Verified reviewer badges, application forms
│   │   ├── reviews/                 # Parameterized rating matrices & review composers
│   │   ├── shared/                  # ErrorBoundary, modal dialogs, share cards
│   │   ├── simulator/               # Screen aspect ratio visualizer
│   │   ├── social/                  # Social share generation widgets
│   │   ├── specs/                   # Technical specs badges (4K, Atmos, Laser)
│   │   ├── theaters/                # Screen listings, amenity filters
│   │   └── weekend/                 # Voting rounds, winner badges, hero cards
│   ├── context/                     # Context providers
│   ├── data/                        # Seed data (movies.json, theaters.json, users.json)
│   ├── pages/                       # 24 Route views (HomePage, AdminDashboard, etc.)
│   ├── services/
│   │   ├── accountDeletionService.js# GDPR-compliant user data purging
│   │   ├── movieCatalogService.js   # Live theatrical & OTT status synchronization
│   │   ├── movieLibraryService.js   # Cross-device user watchlist/diary sync
│   │   ├── proReviewerService.js    # Professional reviewer verification
│   │   ├── showcaseArchiveService.js# Hall of fame & archive services
│   │   ├── socialSharingService.js  # Share link & canvas snapshot generators
│   │   ├── supabase.js              # Supabase database client & CRUD endpoints
│   │   ├── tmdbService.js           # Multi-key TMDB API integration & fallback pool
│   │   ├── userPosterService.js     # Custom poster submission & cloud caching
│   │   ├── weekendPickService.js    # Consensus voting round manager
│   │   └── xApiService.js           # X / Twitter official poster discovery
│   ├── utils/                       # Date math, rating normalizers, sluggers
│   ├── __tests__/                   # Vitest unit & integration test suites
│   ├── App.css                      # Global layout styles & CSS reset
│   ├── App.jsx                      # Route definitions with lazy loading & Suspense
│   ├── AppContext.jsx               # Centralized state reducer & event dispatcher
│   ├── index.css                    # Theme color tokens & typography variables
│   └── main.jsx                     # Application bootstrap
├── .env.example                     # Environment variables template
├── docker-compose.yml               # Multi-container local & prod deployment
├── Dockerfile                       # Multi-stage production Docker build
├── nginx.conf                       # High-performance SPA Nginx configuration
├── supabase-master-schema.sql       # Baseline schema definition
├── supabase-secure-rls.sql          # Hardened Row Level Security policies
├── vite.config.js                   # Optimized chunking, aliases, build config
└── vitest.config.js                 # Testing harness configuration
```

---

## 5. Architectural Strengths & Baseline Assets

- **Zero-Latency Offline-First Capabilities**: Uses LocalStorage with memory reconciliation, allowing the application to function seamlessly even in unstable network conditions.
- **Deep Technical Accuracy**: Rich screen specifications (screen dimensions, throw ratio, sound formats) rarely captured by commercial apps.
- **Visual Polish**: Fluid UI, cinema-grade dark palette, responsive design tailored for mobile viewports.
- **Resilient Fallback Design**: If Supabase or TMDB experiences an outage, local seed data prevents crashes.
