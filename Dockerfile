# ─────────────────────────────────────────────────────────────────────────────
# CinemaScope — Multi-stage Dockerfile
#
# Stage 1 (builder): Node.js image → installs deps, builds Vite SPA
# Stage 2 (server):  Minimal Nginx image → serves the static dist/ folder
#
# Build:  docker build -t cinemascope:latest .
# Run:    docker run -p 8080:80 --env-file .env cinemascope:latest
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer cache: only re-runs npm ci on dependency changes)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build arguments that become Vite env vars at build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_TMDB_API_KEY
ARG VITE_ADMIN_EMAIL
ARG VITE_APP_URL=https://cinemascope.pages.dev

# Inject build-time env vars
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_TMDB_API_KEY=$VITE_TMDB_API_KEY \
    VITE_ADMIN_EMAIL=$VITE_ADMIN_EMAIL \
    VITE_APP_URL=$VITE_APP_URL

# Production build
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS server

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config optimized for SPA
COPY nginx.conf /etc/nginx/conf.d/cinemascope.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx runs on port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
