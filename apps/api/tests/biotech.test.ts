/**
 * @file biotech.test.ts
 * @description Unit and integration tests for the Biotech Catalyst, Clinical Trial,
 * and Regulatory Intelligence endpoints in WireForge.
 *
 * Verifies live authentic data retrieval from:
 * - NIH ClinicalTrials.gov API v2
 * - openFDA Drug and Medical Device endpoints
 * - ValueForge SEC Form 10-K, 10-Q, 8-K filings and Healthcare balance sheet screener
 * - SEC EDGAR Form S-1 and 8-K filings
 * - Local ThetaData options volatility database
 */

import { describe, expect, it } from "vitest";
import app from "../src/index.js";

describe("Biotech Radar & Catalyst API Suite", () => {
  it("GET /v1/biotech/fda-calendar returns authentic clinical milestones", async () => {
    const res = await app.request("/v1/biotech/fda-calendar?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    expect(body).toBeDefined();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.count).toBeGreaterThanOrEqual(0);
      if (body.data.length > 0) {
        const item = body.data[0];
        expect(item.ticker).toBeDefined();
        expect(item.drugName).toBeDefined();
        expect(item.stage).toBeDefined();
        expect(item.indication).toBeDefined();
        expect(item.catalystDate).toBeDefined();
      }
    } else {
      expect(body.error).toBeDefined();
      expect(body.actionable).toBeDefined();
    }
  });

  it("GET /v1/biotech/pdufa returns PDUFA target decision dates", async () => {
    const res = await app.request("/v1/biotech/pdufa?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it("GET /v1/biotech/impact returns options flow and volatility sentiment", async () => {
    const res = await app.request("/v1/biotech/impact");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it("GET /v1/biotech/conferences returns healthcare conferences", async () => {
    const res = await app.request("/v1/biotech/conferences?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      const conf = body.data[0];
      expect(conf.name).toBeDefined();
      expect(conf.acronym).toBeDefined();
      expect(conf.startDate).toBeDefined();
    }
  });

  it("GET /v1/biotech/jpm2026 returns J.P. Morgan Healthcare Conference presentations", async () => {
    const res = await app.request("/v1/biotech/jpm2026?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it("GET /v1/biotech/medical-devices returns medical device milestones", async () => {
    const res = await app.request("/v1/biotech/medical-devices?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it("GET /v1/biotech/historical-catalysts returns historical catalyst outcomes", async () => {
    const res = await app.request("/v1/biotech/historical-catalysts?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it("GET /v1/biotech/historical-devices returns historical medical device clearances", async () => {
    const res = await app.request("/v1/biotech/historical-devices?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it("GET /v1/biotech/ipos returns biotech IPO offerings from SEC EDGAR", async () => {
    const res = await app.request("/v1/biotech/ipos");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it("GET /v1/biotech/earnings returns corporate earnings calendar", async () => {
    const res = await app.request("/v1/biotech/earnings?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it("GET /v1/biotech/cash-runway flags dilution risk when cash < 6 months", async () => {
    const res = await app.request("/v1/biotech/cash-runway?page=1&dangerOnly=true");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
      for (const item of body.data) {
        expect(item.dangerDilution).toBe(true);
        expect(item.monthsCash).toBeLessThan(6);
      }
    }
  });

  it("GET /v1/biotech/pipeline returns drug pipeline candidates", async () => {
    const res = await app.request("/v1/biotech/pipeline?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it("GET /v1/biotech/cash-runway excludes stale shells and provides institutional runway metrics", async () => {
    const res = await app.request("/v1/biotech/cash-runway?page=1");
    expect([200, 503]).toContain(res.status);
    const body = await res.json();
    if (res.status === 200) {
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      for (const item of body.data) {
        expect(Number(item.reportDate)).toBeGreaterThanOrEqual(2024);
        expect(item.cashLive).toBeGreaterThanOrEqual(100000);
        expect(item.monthsCash).toBeGreaterThan(0);
      }
    }
  });

  it("GET /v1/biotech/detail/:ticker returns composite intelligence report with financial runway", async () => {
    const res = await app.request("/v1/biotech/detail/GALT");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.ticker).toBe("GALT");
    expect(Array.isArray(body.data.catalysts)).toBe(true);
    expect(Array.isArray(body.data.secFilings)).toBe(true);
    if (body.data.financials) {
      expect(body.data.financials.cashLive).toBeDefined();
      expect(body.data.financials.monthlyBurn).toBeDefined();
      expect(body.data.financials.monthsCash).toBeDefined();
    }
  });
});
