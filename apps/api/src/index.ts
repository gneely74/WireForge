import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import fs from "node:fs";
import path from "node:path";
import { newsRouter } from "./routes/news.js";
import { flowRouter } from "./routes/flow.js";
import { signalsRouter } from "./routes/signals.js";
import { calendarsRouter } from "./routes/calendars.js";
import { ecosystemRouter } from "./routes/ecosystem.js";
import { proxyRouter } from "./routes/proxy.js";
import { watchlistsRouter } from "./routes/watchlists.js";
import { setupWebSocketServer } from "./websocket/server.js";

const app = new Hono();

// Global CORS
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));

// API Root Info
app.get("/api", (c) => {
  return c.json({
    name: "WireForge API",
    version: "1.0.0",
    docs: "/docs",
    openapi: "/v1/openapi.json",
    health: "/v1/health",
  });
});

// Health check
app.get("/v1/health", (c) => {
  return c.json({
    status: "ok",
    service: "WireForge API",
    version: "1.0.0",
    timestamp: Date.now(),
  });
});

// Mount Routes
app.route("/v1/news", newsRouter);
app.route("/v1/flow", flowRouter);
app.route("/v1/signals", signalsRouter);
app.route("/v1/calendars", calendarsRouter);
app.route("/v1/ecosystem", ecosystemRouter);
app.route("/v1/proxy", proxyRouter);
app.route("/v1/watchlists", watchlistsRouter);

// OpenAPI Spec definition
app.get("/v1/openapi.json", (c) => {
  return c.json({
    openapi: "3.1.0",
    info: {
      title: "WireForge API",
      version: "1.0.0",
      description: "Real-time news wire, options flow scanner, signals, and market intelligence API.",
    },
    servers: [{ url: "http://localhost:5189", description: "Local WireForge Server" }],
    paths: {
      "/v1/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
      "/v1/news": { get: { summary: "List real-time news wire articles", responses: { "200": { description: "News array" } } } },
      "/v1/flow": { get: { summary: "Unusual options flow trade tape", responses: { "200": { description: "Options flow array" } } } },
      "/v1/flow/stats": { get: { summary: "Options flow sentiment statistics", responses: { "200": { description: "Sentiment breakdown" } } } },
      "/v1/signals": { get: { summary: "Market momentum, RVOL, and LULD halts", responses: { "200": { description: "Signals array" } } } },
      "/v1/signals/movers": { get: { summary: "Top gainers and losers", responses: { "200": { description: "Movers summary" } } } },
      "/v1/calendars/earnings": { get: { summary: "Earnings calendar", responses: { "200": { description: "Earnings events" } } } },
      "/v1/calendars/economic": { get: { summary: "Economic releases", responses: { "200": { description: "Economic events" } } } },
      "/v1/ecosystem/status": { get: { summary: "Ecosystem integration health (ChartForge, Trading Agent, ThetaData)", responses: { "200": { description: "Ecosystem health" } } } },
    },
  });
});

// Swagger UI Documentation
app.get("/docs", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>WireForge API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body style="margin:0; background:#0b0e14;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/v1/openapi.json',
        dom_id: '#swagger-ui',
        theme: 'dark'
      });
    };
  </script>
</body>
</html>`;
  return c.html(html);
});

// Static file serving for pre-built web workstation (production & docker deployment)
const webDistCandidates = [
  process.env.WEB_DIST_PATH,
  path.resolve(process.cwd(), "apps/web/dist"),
  path.resolve(process.cwd(), "../web/dist"),
  path.resolve(process.cwd(), "dist/web"),
].filter(Boolean) as string[];

const resolvedWebDist = webDistCandidates.find(
  (dir) => fs.existsSync(dir) && fs.existsSync(path.join(dir, "index.html"))
);

if (resolvedWebDist) {
  const relDist = path.relative(process.cwd(), resolvedWebDist) || resolvedWebDist;
  if (process.env.NODE_ENV !== "test") {
    console.log(`[WireForge] Serving pre-built workstation from ${resolvedWebDist}`);
  }
  app.use("/*", serveStatic({ root: relDist }));
  app.get("*", serveStatic({ path: path.join(relDist, "index.html") }));
} else {
  // Fallback API info at root when static workstation is not pre-built
  app.get("/", (c) => {
    return c.json({
      name: "WireForge API",
      version: "1.0.0",
      docs: "/docs",
      openapi: "/v1/openapi.json",
      health: "/v1/health",
    });
  });
}

const port = Number(process.env.PORT) || 5189;

let serverInstance: any = null;

if (process.env.NODE_ENV !== "test") {
  serverInstance = serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`[WireForge API] Running at http://localhost:${info.port}`);
      console.log(`[WireForge API] OpenAPI interactive docs at http://localhost:${info.port}/docs`);
    }
  );

  // Attach WebSocket Server
  setupWebSocketServer(serverInstance as any);
}

export default app;
