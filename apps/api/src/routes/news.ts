/**
 * @fileoverview News Wire REST endpoint handlers.
 * Exposes endpoints to retrieve real-time authentic news feeds with
 * support for positive filtering, multi-category exclusion, ticker suppression,
 * and deduplication diagnostics.
 *
 * Upstream Sources:
 *  - globalNewsAggregator (services/news-aggregator.ts)
 *  - globalWatchlistsService (services/watchlists-service.ts)
 * Downstream Consumers:
 *  - WireForge Web Client (apps/web/src/App.tsx, NewsWire.tsx)
 */

import { Hono } from "hono";
import { globalNewsAggregator } from "../services/news-aggregator.js";
import { globalWatchlistsService } from "../services/watchlists-service.js";
import { NewsCategory, NewsImpact } from "@wireforge/shared";

export const newsRouter = new Hono();

/**
 * GET /v1/news
 * Retrieves authentic news articles ordered newest first.
 * Supports positive filtering by category, negative exclusion of categories,
 * ticker inclusion/exclusion, watchlist filtering, and full-text search.
 */
newsRouter.get("/", (c) => {
  const category = c.req.query("category") as NewsCategory | undefined;
  const rawExcludeCats = c.req.query("excludeCategories");
  const rawExcludeTickers = c.req.query("excludeTickers");
  const ticker = c.req.query("ticker");
  const impact = c.req.query("impact") as NewsImpact | undefined;
  const query = c.req.query("query");
  // Default to 200 records to eliminate stream catchup delays upon startup
  const limit = c.req.query("limit") ? Math.min(Number(c.req.query("limit")), 500) : 200;
  const watchlistId = c.req.query("watchlist");

  const excludeCategories: NewsCategory[] | undefined = rawExcludeCats
    ? (rawExcludeCats.split(",").map((s) => s.trim()) as NewsCategory[])
    : undefined;

  const excludeTickers: string[] | undefined = rawExcludeTickers
    ? rawExcludeTickers.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
    : undefined;

  let watchlistSymbols: string[] | undefined;
  if (watchlistId && watchlistId !== "all") {
    const wl = globalWatchlistsService.getWatchlist(watchlistId);
    if (wl) watchlistSymbols = wl.symbols;
  }

  const data = globalNewsAggregator.getArticles({
    category,
    excludeCategories,
    ticker,
    excludeTickers,
    watchlistSymbols,
    impact,
    query,
    limit,
  });

  return c.json({ data, count: data.length });
});

/**
 * GET /v1/news/stats
 * Retrieves news stream statistics and deduplication diagnostics.
 */
newsRouter.get("/stats", (c) => {
  return c.json({
    totalArticles: globalNewsAggregator.getArticles({ limit: 1000 }).length,
    dedupe: globalNewsAggregator.getDedupeStats(),
  });
});

/**
 * POST /v1/news
 * Ingests a new authentic news article and broadcasts it to active subscribers.
 */
newsRouter.post("/", async (c) => {
  const body = await c.req.json();
  const created = globalNewsAggregator.addArticle(body);
  if (!created) {
    return c.json(
      {
        success: false,
        message: "Duplicate article detected and suppressed by Tiers 1-3 deduplication engine",
      },
      409
    );
  }
  return c.json({ success: true, data: created }, 201);
});
