# syntax=docker/dockerfile:1

# Static single-file demo — no build step. The page imports viem from esm.sh
# at runtime, so there is nothing to bundle: just serve index.html with Caddy.
# In Coolify, point the app at this directory (Base Directory = /demo-dapp,
# Dockerfile = Dockerfile) and set the demo's own domain — Coolify terminates
# TLS in front.
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html /srv/index.html
EXPOSE 80
