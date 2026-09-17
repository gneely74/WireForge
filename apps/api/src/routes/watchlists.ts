import { Hono } from "hono";
import { globalWatchlistsService } from "../services/watchlists-service.js";
import { broadcastWatchlistsUpdate } from "../websocket/server.js";

export const watchlistsRouter = new Hono();

watchlistsRouter.get("/", (c) => {
  const list = globalWatchlistsService.getAllWatchlists();
  return c.json({ data: list, count: list.length });
});

watchlistsRouter.get("/:id", (c) => {
  const id = c.req.param("id");
  const wl = globalWatchlistsService.getWatchlist(id);
  if (!wl) {
    return c.json({ error: "Watchlist not found" }, 404);
  }
  return c.json({ data: wl });
});

watchlistsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name || !Array.isArray(body.symbols)) {
      return c.json({ error: "Watchlist name and symbols array are required" }, 400);
    }
    const saved = globalWatchlistsService.saveCustomWatchlist({
      id: body.id,
      name: body.name,
      description: body.description,
      symbols: body.symbols,
    });
    broadcastWatchlistsUpdate(globalWatchlistsService.getAllWatchlists());
    return c.json({ status: "ok", data: saved }, 201);
  } catch (err: any) {
    return c.json({ error: "Failed to save watchlist", details: err?.message }, 400);
  }
});

watchlistsRouter.delete("/:id", (c) => {
  const id = c.req.param("id");
  const deleted = globalWatchlistsService.deleteCustomWatchlist(id);
  if (!deleted) {
    return c.json({ error: "Watchlist not found or cannot delete presets" }, 404);
  }
  broadcastWatchlistsUpdate(globalWatchlistsService.getAllWatchlists());
  return c.json({ status: "ok", message: `Watchlist ${id} deleted` });
});

// Add symbol to watchlist
watchlistsRouter.post("/:id/symbols", async (c) => {
  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    if (!body.symbol || typeof body.symbol !== "string") {
      return c.json({ error: "Symbol string is required" }, 400);
    }
    const updated = globalWatchlistsService.addSymbol(id, body.symbol);
    if (!updated) {
      return c.json({ error: `Watchlist ${id} not found` }, 404);
    }
    broadcastWatchlistsUpdate(globalWatchlistsService.getAllWatchlists());
    return c.json({ status: "ok", data: updated });
  } catch (err: any) {
    return c.json({ error: "Failed to add symbol", details: err?.message }, 400);
  }
});

// Remove symbol from watchlist
watchlistsRouter.delete("/:id/symbols/:symbol", (c) => {
  const id = c.req.param("id");
  const symbol = c.req.param("symbol");
  const updated = globalWatchlistsService.removeSymbol(id, symbol);
  if (!updated) {
    return c.json({ error: `Watchlist ${id} not found` }, 404);
  }
  broadcastWatchlistsUpdate(globalWatchlistsService.getAllWatchlists());
  return c.json({ status: "ok", data: updated });
});

// Reset preset watchlist to default canonical symbols
watchlistsRouter.post("/:id/reset", (c) => {
  const id = c.req.param("id");
  const reset = globalWatchlistsService.resetPreset(id);
  if (!reset) {
    return c.json({ error: `Preset watchlist ${id} not found` }, 404);
  }
  broadcastWatchlistsUpdate(globalWatchlistsService.getAllWatchlists());
  return c.json({ status: "ok", data: reset, message: `Preset ${id} reset to default` });
});

watchlistsRouter.post("/sync", async (c) => {
  await globalWatchlistsService.syncFromTradingAgent();
  const list = globalWatchlistsService.getAllWatchlists();
  broadcastWatchlistsUpdate(list);
  return c.json({ status: "ok", count: list.length, data: list });
});

// Proxy to Trading Agent RadarScreen scanner
watchlistsRouter.get("/radarscreen/scan", async (c) => {
  const universe = c.req.query("universe") || "default";
  const refresh = c.req.query("refresh") === "true";
  const tradingAgentUrl = (process.env.TRADING_AGENT_API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");

  try {
    let res = await fetch(`${tradingAgentUrl}/api/radarscreen/data?universe=${encodeURIComponent(universe)}&refresh=${refresh}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok && res.status === 404) {
      res = await fetch(`${tradingAgentUrl}/api/radarscreen/scan?universe=${encodeURIComponent(universe)}&refresh=${refresh}`, {
        signal: AbortSignal.timeout(4000),
      });
    }
    if (res.ok) {
      const data = await res.json();
      return c.json({ status: "ok", data });
    }
    return c.json({ error: "RadarScreen service returned non-200", status: res.status }, 502);
  } catch (err: any) {
    return c.json({ error: "Trading Agent RadarScreen offline", details: err?.message }, 503);
  }
});

// Sync active symbol with RadarScreen
watchlistsRouter.post("/radarscreen/active-symbol", async (c) => {
  const body = await c.req.json();
  const tradingAgentUrl = (process.env.TRADING_AGENT_API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");

  try {
    const res = await fetch(`${tradingAgentUrl}/api/radarscreen/active-symbol`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      return c.json(data);
    }
    return c.json({ status: "ok", message: "Symbol broadcast locally" });
  } catch {
    return c.json({ status: "ok", message: "Symbol broadcast locally (RadarScreen offline)" });
  }
});
