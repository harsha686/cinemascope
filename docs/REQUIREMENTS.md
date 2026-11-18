# REQUIREMENTS.md — System Requirements & Domain Specification

This specification documents the functional, technical, and operational requirements of CinemaScope, clearly distinguishing between **Existing Functionality** (already verified in source code) and **Proposed Target Functionality**.

---

## 1. User Personas & Roles

1. **Guest / Anonymous User**:
   - Browses theatrical movies, theater listings, technical screen specifications, and public reviews.
   - Experiments with the Aspect Ratio Screen Simulator.
   - Views weekend pick candidates and community leaderboards.
2. **Authenticated Cinema Enthusiast**:
   - Manages personal Watchlist, Watched Archive, and Movie Diary.
   - Authors reviews and votes on review helpfulness.
   - Participates in weekly Weekend Picks consensus voting.
   - Creates and shares custom movie collections.
   - Submits account deletion requests in compliance with data privacy standards.
3. **Verified Professional Reviewer**:
   - Cinema critics, projectionists, and technicians who have completed the application process.
   - Publishes reviews tagged with verified professional badges and technical breakdown scoring.
4. **Platform Administrator**:
   - Manages the theatrical movie catalog, imports films from TMDB, and discovers official posters from X.
   - Manages city and theater directories, screen technical specifications, and amenities.
   - Moderates community reviews and flags non-genuine content.
   - Creates and closes Weekend Picks voting rounds.
   - Processes user deletion requests.

---

## 2. Functional Requirements (FR)

### FR-01: Movie Catalog & Theatrical Discovery
- **FR-01.1 (Existing)**: The system shall present movies classified by status: `NOW_SHOWING`, `COMING_SOON`, and `ARCHIVED`.
- **FR-01.2 (Existing)**: The system shall display runtime, technical aspect ratio, audio format, language, censor certificate, genres, synopsis, and cast.
- **FR-01.3 (Existing)**: The system shall track OTT digital premiere dates and direct streaming links (Netflix, Prime Video, Hotstar, Aha).
- **FR-01.4 (Existing)**: Administrators shall be able to search TMDB by title and import movies into the database with one click.
- **FR-01.5 (Existing)**: Administrators shall be able to discover official posters from verified production house X accounts.

### FR-02: Theater & Screen Technical Directory
- **FR-02.1 (Existing)**: The system shall list cinema theaters filtered by city (e.g., Visakhapatnam), multiplex chain (PVR, INOX, Cinepolis), and single screens.
- **FR-02.2 (Existing)**: The system shall document screen-level technical specifications: screen dimensions, projection technology (4K RGB Laser, Xenon), and sound system (Dolby Atmos, 7.1 Surround).
- **FR-02.3 (Existing)**: The system shall render an interactive Leaflet map displaying theater geolocations.

### FR-03: Aspect Ratio & Screen Simulator
- **FR-03.1 (Existing)**: The system shall simulate letterboxing and pillarboxing when projecting various film aspect ratios (1.43:1, 1.90:1, 1.85:1, 2.39:1) on physical screen dimensions.
- **FR-03.2 (Existing)**: The system shall allow side-by-side comparison of two theater screens or formats.

### FR-04: Multi-Criteria Review System
- **FR-04.1 (Existing)**: Users shall be able to post ratings (1.0 to 5.0) and written reviews for both movies and theaters.
- **FR-04.2 (Existing)**: The system shall record parameter-specific scores: Projection Alignment, Audio Clarity, Seating Comfort, and Ambience.
- **FR-04.3 (Existing)**: Users shall be able to vote reviews as "Helpful" with real-time tally reconciliation.
- **FR-04.4 (Existing)**: Administrators shall be able to flag non-genuine reviews with an official moderation notice.

### FR-05: Weekend Picks Consensus Voting
- **FR-05.1 (Existing)**: The system shall support weekly consensus voting rounds featuring curated movie candidates.
- **FR-05.2 (Existing)**: Authenticated users shall cast votes, award CinemaScore points, and trigger cross-device synchronization.
- **FR-05.3 (Existing)**: Past winners shall be catalogued in the Weekend Winners Archive.

### FR-06: Personal Cinema Suite
- **FR-06.1 (Existing)**: Users shall maintain a Watchlist, Watched history, and Diary with watch dates and rewatch tags.
- **FR-06.2 (Existing)**: Users shall create named movie collections with public or private visibility.
- **FR-06.3 (Existing)**: The system shall generate shareable cinema summary cards rendered via HTML canvas.

### FR-07: Authentication & Account Lifecycle
- **FR-07.1 (Existing)**: Users shall authenticate via Supabase Google OAuth.
- **FR-07.2 (Existing)**: Users shall be able to submit an account deletion request.
- **FR-07.3 (Existing)**: Administrators shall be able to approve or reject deletion requests, triggering complete data erasure across all tables.

---

## 3. Non-Functional Requirements (NFR)

| Category | Requirement Specification |
|---|---|
| **NFR-01: Cost & Licensing** | **100% Free and Open-Source Software (FOSS)**. Zero software license fees. No proprietary dependencies or mandatory paid subscriptions. |
| **NFR-02: Security** | Passwords and private credentials shall never be stored in source code. All database mutations shall be governed by PostgreSQL Row Level Security. |
| **NFR-03: Performance** | Initial page bundle transfer shall remain under 500 kB gzipped on standard 4G connections. Route views shall be lazy-loaded on demand. |
| **NFR-04: Offline Resilience** | The application shall function in read-only mode using cached LocalStorage data during network disruptions. |
| **NFR-05: Maintainability** | The codebase shall maintain clean modular separation between UI components and services, backed by automated unit tests. |
| **NFR-06: Observability** | The web server shall expose a `/health` endpoint and integrate with self-hosted monitoring (Uptime Kuma). |
