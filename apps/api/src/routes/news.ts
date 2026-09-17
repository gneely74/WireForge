import { Hono } from "hono";
import { globalNewsAggregator } from "../services/news-aggregator.js";
import { globalWatchlistsService } from "../services/watchlists-service.js";
import { NewsCategory, NewsImpact } from "@wireforge/shared";

export const newsRouter = new Hono();

newsRouter.get("/", (c) => {
  const category = c.req.query("category") as NewsCategory | undefined;
  const ticker = c.req.query("ticker");
  const impact = c.req.query("impact") as NewsImpact | undefined;
  const query = c.req.query("query");
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;
  const watchlistId = c.req.query("watchlist");

  let watchlistSymbols: string[] | undefined;
  if (watchlistId && watchlistId !== "all") {
    const wl = globalWatchlistsService.getWatchlist(watchlistId);
    if (wl) watchlistSymbols = wl.symbols;
  }

  const data = globalNewsAggregator.getArticles({
    category,
    ticker,
    watchlistSymbols,
    impact,
    query,
    limit,
  });

  return c.json({ data, count: data.length });
});

newsRouter.get("/stats", (c) => {
  return c.json({
    totalArticles: globalNewsAggregator.getArticles({ limit: 1000 }).length,
    dedupe: globalNewsAggregator.getDedupeStats(),
  });
});

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
