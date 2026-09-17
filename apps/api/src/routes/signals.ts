import { Hono } from "hono";
import { globalSignalsMonitor } from "../services/signals-monitor.js";

export const signalsRouter = new Hono();

signalsRouter.get("/", (c) => {
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;
  const data = globalSignalsMonitor.getSignals(limit);
  return c.json({ data, count: data.length });
});

interface MoverItem {
  ticker: string;
  change: string;
  price: number;
  volume: string;
  rvol: string;
  catalyst: string;
}

let liveGainers: MoverItem[] = [];
let liveLosers: MoverItem[] = [];

signalsRouter.get("/movers", (_c) => {
  return _c.json({ gainers: liveGainers, losers: liveLosers });
});

signalsRouter.post("/movers", async (c) => {
  try {
    const body = await c.req.json();
    if (Array.isArray(body.gainers)) liveGainers = body.gainers;
    if (Array.isArray(body.losers)) liveLosers = body.losers;
    return c.json({ status: "ok", gainersCount: liveGainers.length, losersCount: liveLosers.length });
  } catch (err: any) {
    return c.json({ error: "Failed to update movers", details: err?.message }, 400);
  }
});
