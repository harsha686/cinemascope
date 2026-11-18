# COST_AND_LICENSE_ANALYSIS.md — Cost & Open-Source License Analysis

## 1. Compliance with Section 1 Non-Negotiable Requirements

This project adheres to the strict resource selection rules defined in the prompt:
- **Exclusively Free and Open-Source Software (FOSS)**: Every tool added to the stack is licensed under permissive, community-approved terms.
- **No Mandatory Subscriptions**: Zero software licensing or subscription fees.
- **No Trialware**: No dependencies that expire after a trial window.

---

## 2. Comprehensive Technology License Audit

| Tool / Dependency | Primary Function | License | Commercial Permissibility | Self-Hostable | Vendor Lock-In Risk |
|---|---|---|---|---|---|
| **React** | UI Engine | **MIT** | Unrestricted commercial use | 100% | None |
| **React Router** | Routing | **MIT** | Unrestricted commercial use | 100% | None |
| **Vite** | Bundler | **MIT** | Unrestricted commercial use | 100% | None |
| **Lucide Icons** | SVG Icons | **ISC** | Unrestricted commercial use | 100% | None |
| **Leaflet.js** | Mapping | **BSD-2-Clause** | Unrestricted commercial use | 100% | None |
| **Nginx** | Web Server | **BSD-2-Clause** | Unrestricted commercial use | 100% | None |
| **Vitest** | Test Harness | **MIT** | Unrestricted commercial use | 100% | None |
| **Uptime Kuma** | Monitoring | **GPL-3.0** | Permitted as isolated process | 100% | None |
| **Supabase Core** | Backend DB | **Apache-2.0** | Unrestricted commercial use | 100% | None (standard PostgreSQL) |
| **TMDB API** | Movie Data | **Proprietary Terms** | Free for non-commercial use | No | Low (JSON schema is standard) |

---

## 3. Total Cost of Ownership (TCO) Breakdown

```
┌─────────────────────────────────────────────────────────────┬────────────────────────┐
│ Budget Item                                                 │ Monthly Cost           │
├─────────────────────────────────────────────────────────────┼────────────────────────┤
│ Application Software Licenses                               │ $0.00 (100% FOSS)      │
│ Database Licenses (PostgreSQL)                              │ $0.00 (PostgreSQL Open)│
│ Monitoring Software (Uptime Kuma)                           │ $0.00 (Self-hosted)    │
│ Testing & CI/CD Tooling (Vitest / GitHub Actions Free Tier) │ $0.00                  │
│ Development Tools (Node.js, Docker, Vite)                   │ $0.00                  │
│ Production Hosting Option A: Home Server / Oracle ARM Free  │ $0.00                  │
│ Production Hosting Option B: Commodity Linux VPS (Optional) │ ~$3.50 – $5.00 / month │
├─────────────────────────────────────────────────────────────┼────────────────────────┤
│ TOTAL SOFTWARE LICENSE COST                                 │ $0.00 / FOREVER        │
└─────────────────────────────────────────────────────────────┴────────────────────────┘
```

> [!NOTE]
> Open-source software eliminates **all software license expenses**. If the administrator chooses to deploy on a commercial cloud provider (AWS, DigitalOcean, Hetzner), commodity hardware rental fees apply. If deployed on an existing computer or free-tier cloud host (e.g., Oracle Cloud Always Free 4-core ARM instance), total operating expenditure is **$0.00**.
