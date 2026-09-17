import { describe, expect, it } from "vitest";
import app from "../src/index.js";

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

  it("GET /v1/news returns seeded news articles", async () => {
    const res = await app.request("/v1/news");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].title).toBeDefined();
    expect(body.data[0].tickers).toBeDefined();
  });

  it("GET /v1/news?category=sec filters for SEC filings", async () => {
    const res = await app.request("/v1/news?category=sec");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((a: any) => a.category === "sec")).toBe(true);
  });

  it("GET /v1/flow returns unusual options activity trades", async () => {
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
    const res = await app.request("/v1/signals");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
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
