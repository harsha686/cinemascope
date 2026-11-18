# DEPLOYMENT_ARCHITECTURE.md — Container & Production Topology

## 1. Zero-Software-License-Cost Production Topology

In compliance with the **Section 1 Non-Negotiable Requirements**, this deployment model uses **100% free and open-source software** with zero software license fees, trial periods, or mandatory credit cards.

```mermaid
graph TD
    subgraph PublicInternet [Public Internet / DNS]
        Browser[User Browsers: Mobile & Desktop]
        SearchBots[Search Engine Crawlers]
    end

    subgraph ReverseProxyTier [Ingress & Reverse Proxy]
        Nginx[Nginx Alpine 1.27 :80 / :443]
        Certbot[Let's Encrypt Certbot: Free TLS Certificate]
    end

    subgraph ApplicationContainer [Application Tier]
        SPAFiles[Static Dist Artifacts]
        HealthEndpoint[/health Health Probe]
    end

    subgraph MonitoringTier [Observability Tier]
        UptimeKuma[Uptime Kuma Dashboard :3001]
    end

    subgraph PersistenceTier [Database Tier: Self-Hosted or Managed]
        Postgres[PostgreSQL 15 Engine]
        PostgREST[PostgREST Engine]
        GoTrue[GoTrue Auth Service]
    end

    Browser -->|HTTPS :443| Nginx
    Certbot -.->|Auto-renew TLS| Nginx
    Nginx --> SPAFiles
    Nginx --> HealthEndpoint
    UptimeKuma -->|HTTP Health Checks| HealthEndpoint
    Browser -.->|Direct API calls via PostgREST| PostgREST
    PostgREST --> Postgres
```

---

## 2. Infrastructure Deployment Options

### Option A: Self-Hosted Single VPS or Home Server (Recommended Zero-License Path)
- **Hardware**: Any budget Linux server (Ubuntu 22.04 LTS / Debian 12), 2 vCPU, 2 GB RAM.
- **Cost**: $0 software license. Hosting: can run on existing home PC, Raspberry Pi 4/5, or any commodity VPS (~$3–$5/month hardware rental, or $0 on Oracle Cloud Always Free ARM instance).
- **Stack**: Docker Engine + Docker Compose.

### Option B: Cloudflare Pages (Static Edge Delivery)
- **Status**: Currently configured via `wrangler.toml`.
- **Cost**: Free tier includes unlimited bandwidth and 500 builds/month.
- **Limitation**: Proprietary platform; does not include database hosting.
