import { Hono } from "hono";
import { globalCalendarsService } from "../services/calendars-service.js";

export const calendarsRouter = new Hono();

calendarsRouter.get("/earnings", async (c) => {
  const timing = c.req.query("timing") as "BMO" | "AMC" | "DURING" | undefined;
  const ticker = c.req.query("ticker");
  const result = await globalCalendarsService.getEarnings(timing, ticker);
  return c.json(result);
});

calendarsRouter.get("/economic", async (c) => {
  const impact = c.req.query("impact") as "high" | "medium" | "low" | undefined;
  const result = await globalCalendarsService.getEconomic(impact);
  return c.json(result);
});

