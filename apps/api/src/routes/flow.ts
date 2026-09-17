import { Hono } from "hono";
import { globalOptionsScanner } from "../services/options-scanner.js";
import { globalWatchlistsService } from "../services/watchlists-service.js";
import { OptionOrderType, Sentiment } from "@wireforge/shared";

export const flowRouter = new Hono();

flowRouter.get("/", (c) => {
  const ticker = c.req.query("ticker");
  const minPremium = c.req.query("min_premium") ? Number(c.req.query("min_premium")) : undefined;
  const sentiment = c.req.query("sentiment") as Sentiment | undefined;
  const orderType = c.req.query("order_type") as OptionOrderType | undefined;
  const isGolden = c.req.query("is_golden") !== undefined ? c.req.query("is_golden") === "true" : undefined;
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 100;
  const watchlistId = c.req.query("watchlist");

  let watchlistSymbols: string[] | undefined;
  if (watchlistId && watchlistId !== "all") {
    const wl = globalWatchlistsService.getWatchlist(watchlistId);
    if (wl) watchlistSymbols = wl.symbols;
  }

  const data = globalOptionsScanner.getTrades({
    ticker,
    watchlistSymbols,
    minPremium,
    sentiment,
    orderType,
    isGolden,
    limit,
  });

  return c.json({ data, count: data.length });
});

flowRouter.get("/stats", (c) => {
  const ticker = c.req.query("ticker");
  const stats = globalOptionsScanner.getStats(ticker);
  return c.json({ data: stats });
});

flowRouter.post("/ingest", async (c) => {
  try {
    const body = await c.req.json();
    const items = Array.isArray(body) ? body : [body];
    const added = items.map((trade) => globalOptionsScanner.addTrade(trade));
    return c.json({ status: "ok", count: added.length, data: added }, 201);
  } catch (err: any) {
    return c.json({ error: "Failed to ingest options flow", details: err?.message }, 400);
  }
});
