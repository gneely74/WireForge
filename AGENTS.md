# Agent Guidelines & Repository Rules (AGENTS.md)

This repository enforces strict development standards for all AI coding agents (Antigravity, Cursor, Claude, Copilot, Hermes, etc.) and human contributors working on WireForge.

---

## 1. MANDATORY REPOSITORY RULE: NO FAKE OR HARDCODED DATA! LIVE DATA ONLY

> [!CAUTION]
> **NO FAKE OR HARDCODED DATA! LIVE DATA ONLY.**
>
> 1. **Zero Synthetic / Mock Generators**: Under no circumstances should any mock market data generators, simulated ticker tapes, fake news headline generators (e.g. `SIMULATED_HEADLINES`), seed articles (`INITIAL_NEWS`), fabricated economic events, or hardcoded ratio heuristics (e.g. defaulting flow bullish ratio to 50% when volume is 0) be introduced or preserved in production application pathways.
> 2. **Authentic Live Feeds Only**: All news items, economic calendar entries, options flow prints, and SEC filings must originate exclusively from authentic upstream live services:
>    - Live Options Flow: ThetaData streaming tape (`:25503`)
>    - Economic Calendar & Market Data: `trading-agent` API (`http://127.0.0.1:8080` / `http://192.168.74.102:8080/#calendar`)
>    - Real-Time Financial News: Finnhub API (`FINNHUB_API_KEY`)
>    - SEC Filings: EDGAR tool service (`:4000`)
> 3. **Actionable Missing / Error States**: When upstream data feeds are offline or unconfigured, the system MUST return explicit missing states (`null`, `0`, HTTP 503 `DATA_UNAVAILABLE`) and display clear, actionable diagnostics instructing how to start or authenticate the required service. Never disguise an offline data feed with synthetic filler.

---

## 2. Mandatory Code Documentation Rule

> [!IMPORTANT]
> **EVERY AGENT THAT MAKES CODE CHANGES MUST FULLY DOCUMENT OR UPDATE EXISTING CODE DOCUMENTATION WHENEVER MAKING CHANGES.**
>
> - All TypeScript and JavaScript code must include complete JSDoc annotations specifying purpose, arguments, return types, and upstream/downstream flow.
> - Outdated or missing documentation is considered a breaking defect.

---

## 3. Verification & Testing

- Before committing changes, always run the full test suite and build pipeline:
  ```bash
  npm test
  npm run build
  ```
- All unit and integration tests must pass cleanly.
