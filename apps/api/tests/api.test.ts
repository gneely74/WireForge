import { describe, expect, it } from "vitest";
import app from "../src/index.js";
import { globalOptionsScanner } from "../src/services/options-scanner.js";
import { globalSignalsMonitor } from "../src/services/signals-monitor.js";

describe("WireForge Backend API Test Suite", () => {
  it("GET /v1/health returns 200 and ok status", async () => {
    const res = await app.request("/v1/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("WireForge API");
  });

  it("GET /v1/openapi.json returns valid OpenAPI 3.1 schema", async () => {
    const res = await app.request("/v1/openapi.json");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.openapi).toBe("3.1.0");
    expect(body.paths["/v1/news"]).toBeDefined();
    expect(body.paths["/v1/flow"]).toBeDefined();
  });

  it("GET /v1/news returns news articles array", async () => {
    const res = await app.request("/v1/news");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /v1/news adds article and filters correctly by category", async () => {
    const testArticle = {
      title: `SEC Form 8-K Test Filing ${Date.now()}`,
      summary: "Material agreement test disclosure",
      tickers: ["NVDA"],
      category: "sec",
      impact: "high",
      sentiment: "bullish",
      source: "SEC EDGAR",
      url: `https://www.sec.gov/Archives/edgar/data/test-${Date.now()}`,
    };
    const postRes = await app.request("/v1/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testArticle),
    });
    expect(postRes.status).toBe(201);

    const res = await app.request("/v1/news?category=sec");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((a: any) => a.category === "sec")).toBe(true);
    expect(body.data.some((a: any) => a.title === testArticle.title)).toBe(true);
  });

  it("GET /v1/news/stats returns news counts and deduplication stats", async () => {
    const res = await app.request("/v1/news/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalArticles).toBeGreaterThanOrEqual(1);
    expect(body.dedupe).toBeDefined();
    expect(typeof body.dedupe.fingerprintsCount).toBe("number");
  });

  it("POST /v1/news deduplicates exact duplicate and near-duplicate articles", async () => {
    const uniqueTitle = `Amazon expands project Kuiper satellite network ${Date.now()}`;
    const payload1 = {
      title: `${uniqueTitle} - Reuters`,
      summary: "Amazon expands satellite broadband constellation.",
      tickers: ["AMZN"],
      category: "general",
      impact: "medium",
      sentiment: "bullish",
      source: "Reuters",
      url: `https://reuters.com/amzn-satellite-${Date.now()}?utm_source=rss`,
    };

    const res1 = await app.request("/v1/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload1),
    });
    expect(res1.status).toBe(201);
    const body1 = await res1.json();
    expect(body1.success).toBe(true);

    // Duplicate post with different publisher suffix and UTM tracking (Tier 1 & 2)
    const payload2 = {
      title: `${uniqueTitle} | Bloomberg`,
      summary: "Amazon expands satellite broadband constellation.",
      tickers: ["AMZN"],
      category: "general",
      impact: "medium",
      sentiment: "bullish",
      source: "Bloomberg",
      url: `https://reuters.com/amzn-satellite-${Date.now()}?utm_source=twitter`,
    };

    const res2 = await app.request("/v1/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload2),
    });
    expect(res2.status).toBe(409);
    const body2 = await res2.json();
    expect(body2.success).toBe(false);
    expect(body2.message).toContain("Duplicate article detected");
  });

  it("GET /v1/flow returns unusual options activity trades", async () => {
    globalOptionsScanner.addTrade({
      ticker: "SPY",
      expiration: "2026-09-18",
      strike: 750,
      contractType: "CALL",
      spotPrice: 754.05,
      tradePrice: 4.85,
      size: 2500,
      openInterest: 1800,
      volume: 3800,
      premium: 1212500,
      orderType: "sweep",
      side: "above_ask",
      sentiment: "bullish",
      isGolden: true,
      dte: 2,
      exchange: "OPRA",
    });

    const res = await app.request("/v1/flow");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].ticker).toBeDefined();
    expect(body.data[0].premium).toBeGreaterThan(0);
  });

  it("GET /v1/flow/stats returns options sentiment ratio", async () => {
    const res = await app.request("/v1/flow/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.totalTrades).toBeGreaterThan(0);
    expect(typeof body.data.bullishRatio).toBe("number");
  });

  it("GET /v1/signals returns market signals", async () => {
    globalSignalsMonitor.addSignal({
      ticker: "NVDA",
      type: "rvol_spike",
      title: "NVDA unusual volume spike exceeding 3x 20-day average",
      description: "Relative volume spike on semiconductor buying",
      metric: "RVOL 3.2x",
      sentiment: "bullish",
    });

    const res = await app.request("/v1/signals");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].ticker).toBe("NVDA");
  });

  it("GET /v1/proxy/candles does NOT return fake synthetic candles when services are offline", async () => {
    const res = await app.request("/v1/proxy/candles?symbol=SPY");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("unavailable");
    expect(body.candles).toEqual([]);
  });

  it("GET /v1/signals/movers returns top gainers and losers", async () => {
    const res = await app.request("/v1/signals/movers");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.gainers)).toBe(true);
    expect(Array.isArray(body.losers)).toBe(true);
  });

  it("GET /v1/calendars/earnings returns earnings schedule", async () => {
    const res = await app.request("/v1/calendars/earnings");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("GET /v1/calendars/economic returns economic calendar releases", async () => {
    const res = await app.request("/v1/calendars/economic");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("GET /v1/ecosystem/status returns health of sibling services", async () => {
    const res = await app.request("/v1/ecosystem/status");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.tradingAgent).toBeDefined();
    expect(body.data.chartforge).toBeDefined();
  });
});
