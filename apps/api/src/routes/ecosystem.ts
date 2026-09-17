import { Hono } from "hono";
import { globalEcosystemClient } from "../services/ecosystem-client.js";

export const ecosystemRouter = new Hono();

ecosystemRouter.get("/status", async (c) => {
  const health = await globalEcosystemClient.getHealth();
  return c.json({ data: health });
});
