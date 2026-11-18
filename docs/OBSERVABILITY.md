# OBSERVABILITY.md — Monitoring, Health Checks & Reliability

## 1. Observability Architecture Overview

To maintain high availability without expensive proprietary monitoring subscriptions (Datadog, New Relic), CinemaScope utilizes a self-hosted, lightweight observability architecture.

```mermaid
graph LR
    subgraph ProbeSource [Monitoring Engine]
        Kuma[Uptime Kuma Container :3001]
    end

    subgraph CinemaScope [CinemaScope App Container]
        Nginx[Nginx Web Server :80]
        HealthCheck[/health Endpoint]
        SPA[React App Runtime]
    end

    subgraph AlertChannels [Free Alert Dispatchers]
        Discord[Discord Webhook]
        Telegram[Telegram Bot API]
        Email[SMTP Notification]
    end

    Kuma -->|HTTP GET every 30s| HealthCheck
    HealthCheck -->|200 OK| Kuma
    Kuma -.->|On 3 Consecutive Failures| Discord
    Kuma -.->|Incident Alerts| Telegram
    Kuma -.->|Incident Alerts| Email
```

---

## 2. Health Check Specification (`/health`)

Implemented in `nginx.conf`:
- **Endpoint**: `GET /health`
- **Response Code**: `200 OK`
- **Content-Type**: `text/plain`
- **Response Body**: `healthy\n`
- **Overhead**: Microsecond response time; bypassed from Nginx access logs to prevent log pollution.

---

## 3. Self-Hosted Uptime Kuma Integration

Pre-configured in `docker-compose.yml`:
- **Image**: `louislam/uptime-kuma:1` (GPL-3.0)
- **Port**: `3001`
- **Volume**: `uptime-kuma-data`
- **Configuration Steps**:
  1. Navigate to `http://<server-ip>:3001`.
  2. Create an administrative account on first boot.
  3. Click **Add New Monitor**:
     - Monitor Type: `HTTP(s)`
     - Friendly Name: `CinemaScope Production Web`
     - URL: `http://app/health` (internal Docker network name) or `https://your-domain.com/health`
     - Heartbeat Interval: `30 seconds`
     - Retries: `3`
  4. Connect free notification webhooks (Telegram, Discord, Slack, or SMTP).
