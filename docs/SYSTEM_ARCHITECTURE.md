# SYSTEM_ARCHITECTURE.md — Target Production Architecture

## 1. Target Architecture Overview

The target architecture is a **Modular Single-Page Application (SPA) paired with a Containerized Edge Reverse Proxy (Nginx) and a Self-Hostable PostgreSQL/BaaS Backend (Supabase)**.

This model preserves the application's client-side reactivity and offline-first capabilities while adding containerization, environment security, database-level authorization, and self-hosted monitoring.

```mermaid
C4Context
    title System Context Diagram — CinemaScope Platform

    Person(user, "Cinema Enthusiast", "Discovers theaters, aspect ratios, reviews movies, and votes on weekend picks.")
    Person(admin, "Platform Admin", "Curates movies, monitors technical specs, moderates reviews, and manages rounds.")

    System(cinemascope, "CinemaScope System", "Modular React SPA served via containerized Nginx with client-side caching.")

    System_Ext(supabase, "Supabase Stack", "Self-hosted or managed PostgreSQL, GoTrue Auth, and PostgREST API.")
    System_Ext(tmdb, "TMDB API", "Provides real-time theatrical metadata, cast/crew listings, and posters.")
    System_Ext(kuma, "Uptime Kuma", "Self-hosted heartbeat monitoring and incident alerting.")

    Rel(user, cinemascope, "Browses, compares, reviews, and votes via HTTPS")
    Rel(admin, cinemascope, "Manages catalog, theaters, and moderation via HTTPS")
    Rel(cinemascope, supabase, "Authenticates and synchronizes data via PostgREST")
    Rel(cinemascope, tmdb, "Queries movie catalogs and OTT streaming data")
    Rel(kuma, cinemascope, "Probes /health endpoint every 30s")
```

---

## 2. Container Architecture Diagram (Docker Compose Deployment)

```mermaid
graph TD
    Internet((Public Internet))
    
    subgraph HostServer [Host Linux Server / VPS / Local Dev]
        subgraph DockerNetwork [Isolated Docker Bridge Network: cinemascope-net]
            Nginx[Nginx Reverse Proxy :80]
            StaticFiles[SPA Static Assets /usr/share/nginx/html]
            UptimeKuma[Uptime Kuma Monitoring :3001]
            HealthEndpoint[Nginx /health probe]
        end
        
        HostStorage[(Persistent Volumes: uptime-kuma-data)]
    end

    subgraph DatabaseCloud [Database & Auth Tier]
        PostgreSQL[(PostgreSQL 15+ Database)]
        RLS[Row Level Security Engine]
        PostgREST[PostgREST RESTful API]
        GoTrue[GoTrue Auth Service]
    end

    Internet -->|HTTP :8080| Nginx
    Internet -->|Admin HTTP :3001| UptimeKuma
    Nginx --> StaticFiles
    Nginx --> HealthEndpoint
    UptimeKuma -->|Ping :80/health| Nginx
    UptimeKuma --> HostStorage

    StaticFiles -.->|Client Browser executes JS| PostgREST
    PostgREST --> RLS
    RLS --> PostgreSQL
    StaticFiles -.->|Client OAuth Login| GoTrue
```

---

## 3. Component Architecture & Data Flow

```mermaid
graph LR
    subgraph Presentation [React Presentation Tier]
        Router[HashRouter / Routes]
        Suspense[React.Suspense Boundary]
        Views[Lazy-Loaded Pages: Home, Movie, Admin, City, Weekend]
        Modals[Global Modals: OTT Release, Account Delete]
    end

    subgraph StateTier [State & Persistence Tier]
        AppContext[AppContext + useReducer]
        LocalStorage[(Browser LocalStorage)]
        SessionStorage[(Browser SessionStorage)]
    end

    subgraph ServiceTier [Domain Service Layer]
        S_Supabase[supabase.js]
        S_TMDB[tmdbService.js]
        S_Weekend[weekendPickService.js]
        S_Library[movieLibraryService.js]
        S_Catalog[movieCatalogService.js]
    end

    Router --> Suspense
    Suspense --> Views
    Views --> AppContext
    Modals --> AppContext
    AppContext <--> LocalStorage
    AppContext --> ServiceTier
    S_TMDB <--> SessionStorage
```

---

## 4. Authentication & Security Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Cinema Enthusiast
    participant UI as React UI (GoogleAuthButton)
    participant SDK as Supabase JS Client
    participant Auth as GoTrue Auth Server
    participant Google as Google Identity Services
    participant DB as PostgreSQL (public.users)

    User->>UI: Click "Sign in with Google"
    UI->>SDK: signInWithGoogle(redirectTo)
    SDK->>Auth: Request OAuth authorization URL
    Auth->>Google: Redirect to accounts.google.com
    Google->>User: Consent & account selection screen
    User->>Google: Authorizes identity
    Google->>Auth: Exchange OAuth code for ID & Access Token
    Auth->>SDK: Redirect to app callback with session tokens in URL fragment
    SDK->>SDK: Persist session in LocalStorage (autoRefreshToken: true)
    SDK->>DB: Upsert profile to public.users via PostgREST
    DB-->>UI: Authenticated session established (JWT available)
```

---

## 5. Architectural Decision Rationale

### Why Monolithic SPA over Microservices?
1. **Zero Operational Overhead**: A team of 1–3 engineers can maintain, test, and deploy the entire platform in a single repository without Kubernetes clusters or distributed tracing complexity.
2. **Offline-First Resilience**: An SPA with LocalStorage caching ensures that even if backend connections drop, users can continue browsing theaters and cached film specs.
3. **Free & Open-Source Compatibility**: The entire stack runs on free, permissive open-source tools with zero proprietary lock-in.
