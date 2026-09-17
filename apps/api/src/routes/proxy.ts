import { Hono } from "hono";
import { globalEcosystemClient } from "../services/ecosystem-client.js";

export const proxyRouter = new Hono();

// Candle forwarding to ChartForge or Trading Agent
proxyRouter.get("/candles", async (c) => {
  const symbol = c.req.query("symbol") || "SPY";
  const interval = c.req.query("interval") || "5m";
  const range = c.req.query("range") || "1d";

  const chartforgeUrl = globalEcosystemClient.getChartforgeUrl();
  const tradingAgentUrl = globalEcosystemClient.getTradingAgentUrl();

  // Try ChartForge first
  try {
    const target = `${chartforgeUrl}/v1/market-data/candles?symbol=${symbol}&interval=${interval}&range=${range}`;
    const res = await fetch(target, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return c.json(data);
    }
  } catch {
    // Fallback to Trading Agent
  }

  try {
    const target = `${tradingAgentUrl}/api/market-data/candles?symbol=${symbol}&interval=${interval}&range=${range}`;
    const res = await fetch(target, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return c.json(data);
    }
  } catch {
    // Trading Agent also failed
  }

  // No synthetic mock fallback; return empty data with informative message
  return c.json({
    symbol,
    source: "unavailable",
    interval,
    range,
    count: 0,
    candles: [],
    message: "No live market data available from connected charting services (ChartForge / Trading Agent offline)",
  });
});
