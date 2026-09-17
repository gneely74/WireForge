# WireForge ⚡

> **High-Velocity Institutional Market News Wire, Unusual Options Flow Tape, and Audio Squawk Workstation.**

WireForge is an institutional-grade Benzinga Pro alternative built for modern active traders and automated macro systems. It synthesizes breaking market headlines, unusual options sweeps, SEC Form 8-K/4 filings, corporate earnings calendars, and audio squawk into a cohesive, sub-millisecond trading workstation.

WireForge integrates directly with your homelab trading ecosystem:
- 📈 **[ChartForge](http://192.168.74.102:5188)**: Instant 1-click mini-candlestick preview & deep linking.
- 🏛️ **[Trading Agent](http://192.168.74.102:8080)**: GEX gamma exposure levels, Call/Put walls, and Dark Pool DIX sentiment.
- ⚡ **ThetaData (`:25503`)**: Direct OPRA options tape parsing for institutional sweeps, blocks, and golden sweeps.
- 📜 **EDGAR Focus**: Real-time SEC Form 8-K material events and insider Form 4 disclosures.

---

## Key Features

1. **⚡ Real-Time Streaming News Wire**
   - Filter by categories: `SEC Filings`, `Earnings & Guidance`, `FDA Approvals`, `Analyst Ratings`, `M&A`, and `Macro`.
   - Sentiment tagging (`Bullish`, `Bearish`, `Neutral`) and impact tiers (`High`, `Medium`, `Low`).
   - Interactive full-article reader modal with source attribution and ticker mentions.

2. **🌊 Unusual Options Activity (UOA) & Golden Sweeps**
   - Live streaming options tape filtering for multi-exchange sweeps, single blocks, and splits.
   - **Golden Sweep Tagging**: Highlights orders where `Size > Open Interest`, filled at or above the ask, signaling aggressive institutional accumulation.
   - Real-time Call/Put sentiment ratio tracking.

3. **🔊 Hands-Free Audio Squawk Engine**
   - Browser-native HTML5 Web Speech API engine with zero cloud subscription fees or API keys.
   - Configurable channel toggles (Squawk Breaking News, Squawk High Impact Only, Squawk Golden Sweeps).
   - Adjustable speech rate, pitch, volume, and synthesized system voice.

4. **📡 Market Signals & High/Low Scanner**
   - Live monitor for 52-Week High/Low breakouts, Relative Volume (RVOL) spikes, and LULD circuit breaker halts.
   - Top Gainers & Losers leaderboards with real-time percentage changes.

5. **📅 Institutional Calendars**
   - **Earnings Calendar**: Tracks upcoming releases, Before Market Open (BMO) vs. After Market Close (AMC), and EPS/Revenue estimates.
   - **Economic Calendar**: Tracks CPI, FOMC, PPI, Nonfarm Payrolls, Retail Sales with consensus, previous, and actual values.

6. **📊 Integrated Mini-Charts**
   - Click any ticker anywhere in WireForge to inspect a mini-chart powered by ChartForge / Tastytrade proxy.
   - Direct 1-click button to launch full technical analysis in ChartForge.

---

## Monorepo Architecture

WireForge is organized as a high-performance TypeScript monorepo using **pnpm workspaces**:

```
WireForge/
├── packages/
│   └── shared/          # Shared Zod schemas, TypeScript types, and validation models
├── apps/
│   ├── api/             # Hono REST & WebSocket streaming server (Port 5189)
│   │   ├── src/
│   │   │   ├── services/# News aggregator, Options scanner, Signals monitor, Ecosystem client
│   │   │   ├── routes/  # /v1/news, /v1/flow, /v1/signals, /v1/calendars, /v1/ecosystem
│   │   │   └── websocket/# High-throughput WebSocket broadcasting (/v1/stream)
│   │   └── tests/       # Vitest integration test suite
│   └── web/             # React 19 + Vite + Tailwind CSS workstation UI
│       └── src/
│           ├── store/   # Zustand unified state management
│           ├── hooks/   # useWireWebSocket, useAudioSquawk
│           └── components/# NewsWire, OptionsFlow, AudioSquawk, SignalsScanner, CorporateCalendar, MiniChartModal
├── Dockerfile           # Multi-stage production container
└── docker-compose.yml   # Host networking deployment configuration
```

---

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm v10+

### Development

```bash
# Clone the repository
git clone https://github.com/gneely74/WireForge.git
cd WireForge

# Install dependencies
pnpm install

# Run backend and frontend in dev mode
pnpm dev
```

- API runs at `http://localhost:5189`
- Swagger UI available at `http://localhost:5189/docs`
- Web workstation runs with Vite HMR at `http://localhost:5173`

### Run Tests & Verification

```bash
pnpm typecheck
pnpm test
pnpm -r build
```

---

## Deployment

WireForge is deployed in Docker with `network_mode: host` on port **5189**:

```bash
# Single command deploy to homelab server (192.168.74.102)
pnpm run deploy
```

For full details, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md).

---

## License

MIT © Gene Neely
