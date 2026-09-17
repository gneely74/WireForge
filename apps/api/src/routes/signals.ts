import { Hono } from "hono";
import { globalSignalsMonitor } from "../services/signals-monitor.js";

export const signalsRouter = new Hono();

signalsRouter.get("/", (c) => {
  const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;
  const data = globalSignalsMonitor.getSignals(limit);
  return c.json({ data, count: data.length });
});

signalsRouter.get("/movers", (_c) => {
  // Top Gainers & Losers snapshot
  const gainers = [
    { ticker: "VKTX", change: "+18.4%", price: 82.50, volume: "14.2M", rvol: "5.4x", catalyst: "FDA Oral Approval" },
    { ticker: "IONQ", change: "+9.2%", price: 11.45, volume: "8.1M", rvol: "3.2x", catalyst: "DOE Defense Contract" },
    { ticker: "PLTR", change: "+5.1%", price: 42.45, volume: "42.8M", rvol: "2.1x", catalyst: "Morgan Stanley PT Raise" },
    { ticker: "NVDA", change: "+4.2%", price: 141.80, volume: "68.4M", rvol: "1.8x", catalyst: "Rubin GPU Ramp" },
  ];

  const losers = [
    { ticker: "SMCI", change: "-4.8%", price: 472.10, volume: "12.4M", rvol: "2.3x", catalyst: "Margin Headwinds" },
    { ticker: "NKE", change: "-3.1%", price: 81.20, volume: "9.5M", rvol: "1.4x", catalyst: "Pre-Earnings De-risking" },
    { ticker: "FDX", change: "-2.4%", price: 284.10, volume: "4.2M", rvol: "1.2x", catalyst: "Freight Volume Forecast" },
  ];

  return _c.json({ gainers, losers });
});
