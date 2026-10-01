/**
 * @file biotech.ts
 * @description REST API routing layer for biotechnology clinical trial catalysts, PDUFA dates,
 * conference schedules, medical devices, cash runway radar, and composite equity intelligence.
 *
 * Upstream sources:
 * - BioPharmCatalyst REST API
 * - ValueForge (192.168.74.105:4000) for authentic SEC 10-K, 10-Q, 8-K filings and cash balance
 * - ClinicalTrials.gov API v2 for official NIH clinical protocol milestones
 * - ThetaData streaming options scanner for implied volatility and sweep prints
 */

import { Hono } from "hono";
import { globalBiotechService } from "../services/biotech-service.js";

/** Express / Hono router for all `/v1/biotech/*` endpoints. */
export const biotechRouter = new Hono();

/**
 * GET `/v1/biotech/fda-calendar`
 * Retrieves authentic upcoming and active FDA clinical trial readouts and milestones.
 */
biotechRouter.get("/fda-calendar", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const search = c.req.query("search");
  const stage = c.req.query("stage");
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getFdaCalendar({ page, search, stage, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/pdufa`
 * Retrieves FDA PDUFA decision target dates and Advisory Committee meetings.
 */
biotechRouter.get("/pdufa", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getPdufaCalendar({ page, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/impact`
 * Retrieves catalyst expected price move, options implied volatility, and sweep activity.
 */
biotechRouter.get("/impact", async (c) => {
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getCatalystImpact({ forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/conferences`
 * Retrieves major medical and healthcare investment conference schedules.
 */
biotechRouter.get("/conferences", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getConferences({ page, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/jpm2026`
 * Retrieves scheduled company presentations at the J.P. Morgan Healthcare Conference 2026.
 */
biotechRouter.get("/jpm2026", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getJpm2026({ page, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/medical-devices`
 * Retrieves medical device regulatory and clinical milestones (510(k), PMA, feasibility).
 */
biotechRouter.get("/medical-devices", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getMedicalDevices({ page, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/historical-catalysts`
 * Retrieves historical FDA catalyst decisions, notes, and post-catalyst equity price performance.
 */
biotechRouter.get("/historical-catalysts", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getHistoricalCatalysts({ page, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/historical-devices`
 * Retrieves historical medical device decisions and price movement.
 */
biotechRouter.get("/historical-devices", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getHistoricalMedicalDevices({ page, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/ipos`
 * Retrieves biotech IPO offerings calendar and historical debut schedule.
 */
biotechRouter.get("/ipos", async (c) => {
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getIpos({ forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/earnings`
 * Retrieves confirmed quarterly reporting dates and EPS consensus for biotech equities.
 */
biotechRouter.get("/earnings", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getBiotechEarnings({ page, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/cash-runway`
 * Retrieves biotech balance sheet cash holdings, burn rate, and dilution danger warnings (<6mo cash).
 */
biotechRouter.get("/cash-runway", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const dangerOnly = c.req.query("dangerOnly") === "true";
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getCashRunway({ page, dangerOnly, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/pipeline`
 * Comprehensive drug pipeline database and screener (searchable by ticker, indication, stage).
 */
biotechRouter.get("/pipeline", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const search = c.req.query("search");
  const stage = c.req.query("stage");
  const forceRefresh = c.req.query("refresh") === "true";

  const result = await globalBiotechService.getDrugPipeline({ page, search, stage, forceRefresh });
  if (result.error) {
    return c.json(result, 503);
  }
  return c.json(result);
});

/**
 * GET `/v1/biotech/detail/:ticker`
 * Returns deep-dive composite stock intelligence cross-referencing BioPharmCatalyst,
 * NIH ClinicalTrials.gov, and ValueForge SEC Form 10-K, 10-Q, 8-K filings.
 */
biotechRouter.get("/detail/:ticker", async (c) => {
  const ticker = c.req.param("ticker");
  if (!ticker) {
    return c.json({ error: "Missing ticker parameter" }, 400);
  }

  const detail = await globalBiotechService.getBiotechStockDetail(ticker);
  return c.json({ data: detail, source: "WireForge Composite Biotech Intelligence", updatedAt: new Date().toISOString() });
});
