import { Hono } from "hono";
import { globalOptionsScanner } from "../services/options-scanner.js";
import { globalWatchlistsService } from "../services/watchlists-service.js";
import { OptionOrderType, Sentiment } from "@wireforge/shared";

/**
 * Options Flow Router provides REST endpoints for querying real-time OPRA sweeps,
 * historical session trades via SQLite pagination, daily sentiment metrics,
 * and programmatic ingestion.
 */
export const flowRouter = new Hono();

/**
 * GET /v1/flow
 * Retrieves unusual options activity prints with support for filtering and pagination.
 *
 * Query Parameters:
 * - ticker: Filter by specific underlying symbol (e.g., AAPL)
 * - watchlist: Watchlist ID to filter tickers (e.g., "tech-titans")
 * - min_premium: Minimum dollar premium (e.g., 25000)
 * - sentiment: "bullish" | "bearish"
 * - order_type: "sweep" | "block"
 * - is_golden: "true" | "false"
 * - date: Trade date in YYYY-MM-DD format (defaults to current day)
 * - offset: Pagination offset index (0-based)
 * - limit: Maximum results per page (1 to 1,000, default 500)
 */
flowRouter.get("/", (c) => {
  const ticker = c.req.query("ticker");
  const minPremium = c.req.query("min_premium") ? Number(c.req.query("min_premium")) : undefined;
  const sentiment = c.req.query("sentiment") as Sentiment | undefined;
  const orderType = c.req.query("order_type") as OptionOrderType | undefined;
  const isGolden = c.req.query("is_golden") !== undefined ? c.req.query("is_golden") === "true" : undefined;
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 500;
  const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;
  const date = c.req.query("date") || undefined;
  const watchlistId = c.req.query("watchlist");

  let watchlistSymbols: string[] | undefined;
  if (watchlistId && watchlistId !== "all") {
    const wl = globalWatchlistsService.getWatchlist(watchlistId);
    if (wl) watchlistSymbols = wl.symbols;
  }

  const result = globalOptionsScanner.getTrades({
    ticker,
    watchlistSymbols,
    minPremium,
    sentiment,
    orderType,
    isGolden,
    date,
    offset,
    limit,
  });

  return c.json({
    data: result.trades,
    count: result.trades.length,
    total: result.total,
    offset,
    limit,
  });
});

/**
 * GET /v1/flow/stats
 * Retrieves daily options volume and sentiment statistics.
 *
 * Query Parameters:
 * - ticker: Optional ticker symbol filter
 * - date: Optional trade date (YYYY-MM-DD)
 */
flowRouter.get("/stats", (c) => {
  const ticker = c.req.query("ticker");
  const date = c.req.query("date") || undefined;
  const stats = globalOptionsScanner.getStats(ticker, date);
  return c.json({ data: stats });
});

/**
 * POST /v1/flow/ingest
 * Ingests external options prints into the real-time scanner and persistent SQLite store.
 */
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
