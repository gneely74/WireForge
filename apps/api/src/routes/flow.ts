import { Hono } from "hono";
import { globalOptionsScanner } from "../services/options-scanner.js";
import { OptionOrderType, Sentiment } from "@wireforge/shared";

export const flowRouter = new Hono();

flowRouter.get("/", (c) => {
  const ticker = c.req.query("ticker");
  const minPremium = c.req.query("min_premium") ? Number(c.req.query("min_premium")) : undefined;
  const sentiment = c.req.query("sentiment") as Sentiment | undefined;
  const orderType = c.req.query("order_type") as OptionOrderType | undefined;
  const isGolden = c.req.query("is_golden") !== undefined ? c.req.query("is_golden") === "true" : undefined;
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 100;

  const data = globalOptionsScanner.getTrades({
    ticker,
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
