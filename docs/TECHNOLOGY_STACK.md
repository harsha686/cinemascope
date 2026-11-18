# TECHNOLOGY_STACK.md — Technology Inventory & License Audit

In strict compliance with the **Section 1 Non-Negotiable Technology Requirements**, every technology integrated or proposed for CinemaScope is audited below for open-source license compliance, self-hostability, account mandates, and operational limits.

---

## 1. Core Runtime Technologies

### 1.1 React & React DOM
- **Purpose**: Declarative component-based UI framework.
- **License**: **MIT License** (Permissive).
- **Official Repository**: [facebook/react](https://github.com/facebook/react)
- **Self-Hostable**: Yes (Static JavaScript bundle served by any web server).
- **External Account Required**: No.
- **Operational Limitations**: Client-side rendering (CSR); SEO requires pre-rendering or dynamic meta tags for social crawlers.

### 1.2 React Router DOM
- **Purpose**: Client-side SPA routing (`HashRouter` / `BrowserRouter`).
- **License**: **MIT License**.
- **Official Repository**: [remix-run/react-router](https://github.com/remix-run/react-router)
- **Self-Hostable**: Yes.
- **External Account Required**: No.
- **Operational Limitations**: `HashRouter` creates URL fragments (`/#/movie/123`), making search engine indexing difficult without server-side rewrite rules.

### 1.3 Vite
- **Purpose**: Next-generation frontend build tool and local development server.
- **License**: **MIT License**.
- **Official Repository**: [vitejs/vite](https://github.com/vitejs/vite)
- **Self-Hostable**: Yes (local developer CLI).
- **External Account Required**: No.
- **Operational Limitations**: None.

### 1.4 Lucide React
- **Purpose**: Clean, lightweight SVG icon package.
- **License**: **ISC License** (Permissive, functionally equivalent to MIT).
- **Official Repository**: [lucide-icons/lucide](https://github.com/lucide-icons/lucide)
- **Self-Hostable**: Yes.
- **External Account Required**: No.
- **Operational Limitations**: None.

### 1.5 Leaflet.js
- **Purpose**: Interactive maps for theater geolocation.
- **License**: **BSD-2-Clause License** (Permissive).
- **Official Repository**: [Leaflet/Leaflet](https://github.com/Leaflet/Leaflet)
- **Self-Hostable**: Yes (assets can be bundled locally instead of using unpkg CDN).
- **External Account Required**: No (OpenStreetMap tiles are free for moderate usage).
- **Operational Limitations**: OpenStreetMap tile servers have usage policies forbidding heavy bulk scraping.

### 1.6 html-to-image
- **Purpose**: Client-side SVG/DOM rasterization to generate shareable cinema cards.
- **License**: **MIT License**.
- **Official Repository**: [bubkoo/html-to-image](https://github.com/bubkoo/html-to-image)
- **Self-Hostable**: Yes.
- **External Account Required**: No.
- **Operational Limitations**: CORS restrictions require images to be hosted on origins that permit cross-origin image retrieval (`crossOrigin="anonymous"`).

---

## 2. Infrastructure & DevOps Stack

### 2.1 Nginx (Alpine)
- **Purpose**: High-performance reverse proxy, static asset server, gzip compressor, and security header injector.
- **License**: **BSD-2-Clause License**.
- **Official Repository**: [nginx/nginx](https://github.com/nginx/nginx)
- **Self-Hostable**: Yes (100% self-hosted on bare metal, VM, or Docker).
- **External Account Required**: No.
- **Operational Limitations**: Requires server administration knowledge.

### 2.2 Docker & Docker Compose
- **Purpose**: Container engine and multi-container orchestration.
- **License**: **Apache-2.0** (Moby engine) / Docker CLI.
- **Official Repository**: [moby/moby](https://github.com/moby/moby)
- **Self-Hostable**: Yes.
- **External Account Required**: No (Docker Hub account optional; images build locally).
- **Operational Limitations**: None.

### 2.3 Uptime Kuma
- **Purpose**: Self-hosted uptime, latency, and health monitoring dashboard.
- **License**: **GNU General Public License v3.0 (GPL-3.0)**.
- **Official Repository**: [louislam/uptime-kuma](https://github.com/louislam/uptime-kuma)
- **Self-Hostable**: Yes (standalone container).
- **External Account Required**: No.
- **License Compatibility Analysis**: Runs as an isolated external monitoring process; does not link with CinemaScope application source code, preserving MIT compatibility.

### 2.4 Vitest
- **Purpose**: Ultra-fast unit & integration testing harness.
- **License**: **MIT License**.
- **Official Repository**: [vitest-dev/vitest](https://github.com/vitest-dev/vitest)
- **Self-Hostable**: Yes (local developer CLI).
- **External Account Required**: No.
- **Operational Limitations**: None.

---

## 3. External Services & Third-Party Dependencies

### 3.1 Supabase (Self-Hostable PostgreSQL + GoTrue Auth)
- **Purpose**: Relational database, user management, and real-time synchronization.
- **License**: **Apache-2.0** (Self-hosted core stack).
- **Official Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Self-Hostable**: **Yes** — Supabase provides official Docker Compose configurations for running on any Linux server.
- **Current Project Status**: Currently connects to managed cloud project (`ioudwvkvtxlzmcqnrqlq.supabase.co`).
- **Managed Free-Tier Limits**: 500 MB database, 50,000 monthly active users, 1 GB file storage, project pauses after 7 days of inactivity.
- **Recommendation**: Transition from managed cloud to self-hosted Supabase Docker Compose on an existing home server or budget VPS ($0 software license).

### 3.2 The Movie Database (TMDB) API
- **Purpose**: Real-time film metadata, official posters, cast/crew listings, and digital OTT release dates.
- **License**: **Proprietary Terms of Use (Free for Non-Commercial Use)**.
- **Official Documentation**: [developer.themoviedb.org](https://developer.themoviedb.org)
- **Self-Hostable**: **No** (External proprietary catalog).
- **External Account Required**: **Yes** (Free developer account, no credit card required).
- **Operational Limitations**: Rate limit of ~40 requests per 10-second window. The application implements an in-memory session cache and exponential backoff to respect these bounds.

### 3.3 Cloudflare Pages / Wrangler
- **Purpose**: Static edge delivery of single-page application build artifacts.
- **License**: Proprietary Hosting Platform / Apache-2.0 CLI (`wrangler`).
- **Self-Hostable**: No (Alternative: Self-hosted Nginx container).
- **External Account Required**: Yes (Free Cloudflare account).
- **Operational Limitations**: Free tier supports unlimited static requests and 500 builds/month.
