# Docker Deployment Guide for WireForge

## Overview

WireForge runs in Docker using **host networking mode** (`network_mode: host`) to ensure zero-latency communication with the local Trading Agent API (`http://127.0.0.1:8080`), ChartForge (`http://127.0.0.1:5188`), ThetaData options terminal (`http://127.0.0.1:25503`), and EDGAR services.

The production container combines the pre-compiled React 19 workstation and the Hono REST/WebSocket streaming API into a single lightweight Node 22 Alpine service served on port **5189** (configurable via `PORT` in `.env`).

---

## Quick Start

### 1. Initial Setup on Server (`192.168.74.102`)

```bash
cd /docker/wireforge
cp .env.example .env
sudo docker compose up -d --build
```

### 2. Verify Container Is Running

```bash
sudo docker compose ps
sudo docker compose logs --tail 30 wireforge
```

### 3. Verify Live Endpoints

From the server or any machine on your LAN:
```bash
# Health Check
curl -s http://192.168.74.102:5189/v1/health

# Web Workstation UI
curl -sI http://192.168.74.102:5189/

# Swagger UI API Documentation
curl -sI http://192.168.74.102:5189/docs

# Breaking News Feed
curl -s http://192.168.74.102:5189/v1/news | head -c 200

# Unusual Options Activity Tape
curl -s http://192.168.74.102:5189/v1/flow | head -c 200

# Ecosystem Connectivity
curl -s http://192.168.74.102:5189/v1/ecosystem/status
```

---

## Continuous Deployment from Local Machine

Deploy local commits to the server with a single command:

```bash
pnpm run deploy
```

This runs the automated deploy script:
```bash
ssh -o BatchMode=yes -o ConnectTimeout=15 gneely@192.168.74.102 \
  'set -e; cd /docker/wireforge && git fetch origin && git pull --ff-only origin main && docker compose up -d --build && sleep 3 && docker compose ps'
```

---

## Configuration Reference (`.env`)

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5189` | Port WireForge listens on |
| `NODE_ENV` | `production` | Environment mode |
| `TZ` | `America/Chicago` | Homelab local timezone |
| `TRADING_AGENT_API_URL` | `http://127.0.0.1:8080` | Local Trading Agent endpoint (GEX, DIX, positions) |
| `CHARTFORGE_API_URL` | `http://127.0.0.1:5188` | Local ChartForge instance for mini-charts and deep-links |
| `THETADATA_API_URL` | `http://127.0.0.1:25503` | Local ThetaData terminal for options flow & prints |
| `EDGAR_API_URL` | `http://127.0.0.1:3000` | Local SEC EDGAR microservice |

---

## Architecture in Host Networking

```
                     ┌──────────────────────────────────────────────────┐
                     │          Proxmox Homelab Host (192.168.74.102)   │
                     │                                                  │
Browser Client ─────┼─► :5189 WireForge (News Wire, UOA, Squawk, UI)   │
(Desktop / Mobile)   │     │                                            │
                     │     ├─► :8080 Trading Agent (GEX & DIX Darkpool) │
                     │     ├─► :5188 ChartForge (Candles & Pine Script) │
                     │     ├─► :25503 ThetaData (Options Flow & Tape)   │
                     │     └─► :3000 EDGAR Focus (SEC 8-K & Form 4s)    │
                     └──────────────────────────────────────────────────┘
```
