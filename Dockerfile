# syntax=docker/dockerfile:1

# ---- build the webapp only ----
# Standalone build: only the webapp's own package.json is installed, so the
# monorepo (legacy safe-tx + its ledger/trezor → native `usb`/node-gyp) is
# never touched. Keeps bun.
FROM oven/bun:1 AS build
WORKDIR /app

# Deps layer (cached unless the webapp package.json changes). The webapp is
# self-contained — no workspace deps, no ledger/trezor.
COPY packages/webapp/package.json ./
RUN bun install

# Sources + build. No VITE_BASE → base "/" (served at the domain root).
# `bun run build` = tsc -b && vite build → /app/dist.
COPY packages/webapp/ ./
RUN bun run build

# ---- serve the static SPA with Caddy (fallback + gzip) ----
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
