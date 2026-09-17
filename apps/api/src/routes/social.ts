import { Hono } from "hono";
import { globalStockTwitsService } from "../services/stocktwits-service.js";

export const socialRouter = new Hono();

socialRouter.get("/sentiment/:symbol", async (c) => {
  const symbol = c.req.param("symbol");
  const data = await globalStockTwitsService.getSymbolSentiment(symbol);
  return c.json(data);
});

socialRouter.get("/trending", async (c) => {
  const symbols = await globalStockTwitsService.getTrendingSymbols();
  return c.json({ data: symbols, count: symbols.length });
});

socialRouter.post("/poll", async (c) => {
  const added = await globalStockTwitsService.pollTrendingStream();
  return c.json({ success: true, added });
});
