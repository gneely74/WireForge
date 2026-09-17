import { Hono } from "hono";
import { globalNewsAggregator } from "../services/news-aggregator.js";
import { NewsCategory, NewsImpact } from "@wireforge/shared";

export const newsRouter = new Hono();

newsRouter.get("/", (c) => {
  const category = c.req.query("category") as NewsCategory | undefined;
  const ticker = c.req.query("ticker");
  const impact = c.req.query("impact") as NewsImpact | undefined;
  const query = c.req.query("query");
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;

  const data = globalNewsAggregator.getArticles({
    category,
    ticker,
    impact,
    query,
    limit,
  });

  return c.json({ data, count: data.length });
});

newsRouter.post("/", async (c) => {
  const body = await c.req.json();
  const created = globalNewsAggregator.addArticle(body);
  return c.json({ success: true, data: created }, 201);
});
