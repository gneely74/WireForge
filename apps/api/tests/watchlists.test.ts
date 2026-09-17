import { describe, expect, it } from "vitest";
import app from "../src/index.js";

describe("Watchlists API & Shared Interop Test Suite", () => {
  it("GET /v1/watchlists returns preset watchlists", async () => {
    const res = await app.request("/v1/watchlists");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.count).toBeGreaterThanOrEqual(3);

    const ids = body.data.map((w: any) => w.id);
    expect(ids).toContain("options-bellwethers");
    expect(ids).toContain("indices-volatility");
    expect(ids).toContain("sector-etfs-macro");
  });

  it("GET /v1/watchlists/:id returns symbols for a specific watchlist", async () => {
    const res = await app.request("/v1/watchlists/options-bellwethers");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("options-bellwethers");
    expect(body.data.symbols).toContain("NVDA");
    expect(body.data.symbols).toContain("AAPL");
    expect(body.data.symbols).toContain("TSLA");
  });

  it("GET /v1/watchlists/:id returns 404 for unknown watchlist", async () => {
    const res = await app.request("/v1/watchlists/non-existent-watchlist-xyz");
    expect(res.status).toBe(404);
  });

  it("POST /v1/watchlists creates a custom watchlist and DELETE removes it", async () => {
    const customId = `custom-quantum-${Date.now()}`;
    const payload = {
      id: customId,
      name: "Quantum Computing & Semi",
      symbols: ["RGTI", "QBTS", "IONQ", "NVDA"],
    };

    const postRes = await app.request("/v1/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(postRes.status).toBe(201);
    const postBody = await postRes.json();
    expect(postBody.status).toBe("ok");
    expect(postBody.data.symbols).toEqual(["RGTI", "QBTS", "IONQ", "NVDA"]);

    // Verify it appears in list
    const getRes = await app.request(`/v1/watchlists/${customId}`);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.data.name).toBe("Quantum Computing & Semi");

    // Attempt to delete a preset (should be prevented)
    const delPresetRes = await app.request("/v1/watchlists/options-bellwethers", {
      method: "DELETE",
    });
    expect(delPresetRes.status).toBe(404);

    // Delete custom watchlist
    const delRes = await app.request(`/v1/watchlists/${customId}`, {
      method: "DELETE",
    });
    expect(delRes.status).toBe(200);

    // Verify deleted
    const checkRes = await app.request(`/v1/watchlists/${customId}`);
    expect(checkRes.status).toBe(404);
  });

  it("GET /v1/flow?watchlist=options-bellwethers filters flow correctly", async () => {
    // Ingest a trade in bellwethers and one outside bellwethers
    await app.request("/v1/flow/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: "NVDA",
        strike: 135,
        expiry: "2026-10-16",
        callPut: "call",
        premium: 850000,
        volume: 3500,
        openInterest: 1200,
        sentiment: "bullish",
        orderType: "sweep",
      }),
    });

    await app.request("/v1/flow/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: "GME",
        strike: 25,
        expiry: "2026-10-16",
        callPut: "call",
        premium: 400000,
        volume: 2000,
        openInterest: 500,
        sentiment: "bullish",
        orderType: "sweep",
      }),
    });

    const res = await app.request("/v1/flow?watchlist=options-bellwethers");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.every((t: any) =>
      ["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "AMD", "NFLX", "AVGO", "SMCI", "PLTR"].includes(t.ticker)
    )).toBe(true);
  });

  it("POST /v1/watchlists/radarscreen/active-symbol syncs active symbol cleanly", async () => {
    const res = await app.request("/v1/watchlists/radarscreen/active-symbol", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: "NVDA", interval: "5m" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});
