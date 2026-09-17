import { Hono } from "hono";
import { globalCalendarsService } from "../services/calendars-service.js";

export const calendarsRouter = new Hono();

calendarsRouter.get("/earnings", (c) => {
  const timing = c.req.query("timing") as "BMO" | "AMC" | "DURING" | undefined;
  const ticker = c.req.query("ticker");
  const data = globalCalendarsService.getEarnings(timing, ticker);
  return c.json({ data, count: data.length });
});

calendarsRouter.get("/economic", (c) => {
  const impact = c.req.query("impact") as "high" | "medium" | "low" | undefined;
  const data = globalCalendarsService.getEconomic(impact);
  return c.json({ data, count: data.length });
});
