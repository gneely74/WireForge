/**
 * @fileoverview Yield Curve and Benchmark Interest Rates Service.
 * Implements Option B architecture:
 *  - Primary Source: ValueForge Central Financial Intelligence Platform (http://192.168.74.105:4000/api/macro/rates)
 *  - High-Availability Fallback: Official U.S. Treasury (home.treasury.gov) & Federal Reserve Bank of New York (NY Fed)
 *
 * Provides real-time benchmark rates:
 *  - SOFR (Secured Overnight Financing Rate) & EFFR (Effective Fed Funds)
 *  - 11 Treasury tenors: TREASURY_M1 through TREASURY_Y30
 *  - 10Y-2Y and 10Y-3M yield curve spreads and recession inversion status
 *
 * Adheres strictly to repository rule: NO FAKE OR HARDCODED DATA! LIVE DATA ONLY.
 */

import { YieldCurveRates, YieldCurveResponse } from "@wireforge/shared";

interface CachedYieldCurve {
  data: YieldCurveResponse;
  expiresAt: number;
}

export class YieldCurveService {
  private valueforgeCandidates: string[];
  private cache: CachedYieldCurve | null = null;
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute TTL

  /**
   * Initializes YieldCurveService and resolves candidate URLs for ValueForge.
   */
  constructor() {
    const configuredVf = process.env.VALUEFORGE_URL?.replace(/\/+$/, "");
    this.valueforgeCandidates = [
      ...(configuredVf ? [configuredVf] : []),
      "http://192.168.74.105:4000",
      "http://127.0.0.1:4000",
    ].filter((v, i, a) => a.indexOf(v) === i);
  }

  /**
   * Retrieves the latest authentic U.S. Treasury yield curve and SOFR benchmarks.
   * Checks local memory cache, attempts ValueForge primary fetch, and falls back
   * to direct official U.S. government endpoints if ValueForge is unreachable.
   *
   * @param {boolean} [forceRefresh=false] - Whether to bypass the 15-minute cache.
   * @returns {Promise<YieldCurveResponse>} Authentic yield curve and interest rate benchmarks.
   */
  public async getYieldCurve(forceRefresh: boolean = false): Promise<YieldCurveResponse> {
    if (!forceRefresh && this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.data;
    }

    // 1. Primary: Fetch from ValueForge
    for (const baseUrl of this.valueforgeCandidates) {
      try {
        const url = `${baseUrl}/api/macro/rates${forceRefresh ? "?refresh=true" : ""}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "WireForge/1.0 (Workstation Trading Desk)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          if (json && json.success && json.rates) {
            const response: YieldCurveResponse = {
              success: true,
              asOfDate: json.asOfDate || new Date().toISOString().slice(0, 10),
              rates: json.rates,
              spreads: json.spreads || {
                spread10y2y: null,
                spread10y3m: null,
                isInverted10y2y: false,
                isInverted10y3m: false,
              },
              tenors: json.tenors || [],
              source: "ValueForge Central Financial Database",
            };

            this.cache = {
              data: response,
              expiresAt: Date.now() + this.CACHE_TTL_MS,
            };
            return response;
          }
        }
      } catch {
        // Continue to next candidate or fallback
      }
    }

    // 2. Fallback: Direct fetch from authentic U.S. Government sources (NY Fed & Treasury.gov)
    try {
      const liveGovRates = await this.fetchDirectFromGovernment();
      this.cache = {
        data: liveGovRates,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      };
      return liveGovRates;
    } catch (err: any) {
      console.error("[YieldCurveService] Direct government fetch failed:", err);
      throw new Error(`Yield curve unavailable from upstream sources: ${err.message}`);
    }
  }

  /**
   * Fetches SOFR directly from the Federal Reserve Bank of New York (NY Fed)
   * and Treasury tenors directly from the U.S. Department of the Treasury CSV.
   *
   * @returns {Promise<YieldCurveResponse>} Structured yield curve response.
   */
  private async fetchDirectFromGovernment(): Promise<YieldCurveResponse> {
    const currentYear = new Date().getFullYear();

    const [sofrRes, treasuryRes] = await Promise.all([
      fetch("https://markets.newyorkfed.org/api/rates/all/latest.json", {
        headers: { "User-Agent": "WireForge/1.0" },
        signal: AbortSignal.timeout(5000),
      }),
      fetch(
        `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${currentYear}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${currentYear}&page&_format=csv`,
        {
          headers: { "User-Agent": "WireForge/1.0" },
          signal: AbortSignal.timeout(6000),
        }
      ),
    ]);

    let sofrRate: number | null = null;
    let effrRate: number | null = null;
    let fedDate = "";

    if (sofrRes.ok) {
      const fedData = (await sofrRes.json()) as any;
      for (const r of fedData.refRates || []) {
        if (r.type === "SOFR" && r.percentRate != null) {
          sofrRate = Number(r.percentRate);
          fedDate = r.effectiveDate || "";
        } else if (r.type === "EFFR" && r.percentRate != null) {
          effrRate = Number(r.percentRate);
        }
      }
    }

    const rates: YieldCurveRates = {
      SOFR: sofrRate,
      EFFR: effrRate,
      TREASURY_M1: null,
      TREASURY_M3: null,
      TREASURY_M6: null,
      TREASURY_Y1: null,
      TREASURY_Y2: null,
      TREASURY_Y3: null,
      TREASURY_Y5: null,
      TREASURY_Y7: null,
      TREASURY_Y10: null,
      TREASURY_Y20: null,
      TREASURY_Y30: null,
    };

    let asOfDate = fedDate || new Date().toISOString().slice(0, 10);

    if (treasuryRes.ok) {
      const csv = await treasuryRes.text();
      const lines = csv.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length >= 2) {
        const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
        const latestCols = lines[1].split(",").map((v) => v.replace(/"/g, "").trim());

        const rawDate = latestCols[0];
        const dateParts = rawDate.split("/");
        if (dateParts.length === 3) {
          asOfDate = `${dateParts[2]}-${dateParts[0].padStart(2, "0")}-${dateParts[1].padStart(2, "0")}`;
        }

        const headerMap: Record<string, keyof YieldCurveRates> = {
          "1 Mo": "TREASURY_M1",
          "3 Mo": "TREASURY_M3",
          "6 Mo": "TREASURY_M6",
          "1 Yr": "TREASURY_Y1",
          "2 Yr": "TREASURY_Y2",
          "3 Yr": "TREASURY_Y3",
          "5 Yr": "TREASURY_Y5",
          "7 Yr": "TREASURY_Y7",
          "10 Yr": "TREASURY_Y10",
          "20 Yr": "TREASURY_Y20",
          "30 Yr": "TREASURY_Y30",
        };

        headers.forEach((h, index) => {
          const key = headerMap[h];
          if (key && latestCols[index]) {
            const val = parseFloat(latestCols[index]);
            if (!isNaN(val)) {
              rates[key] = val;
            }
          }
        });
      }
    }

    const dgs10 = rates.TREASURY_Y10;
    const dgs2 = rates.TREASURY_Y2;
    const dgs3m = rates.TREASURY_M3;

    const spread10y2y = dgs10 != null && dgs2 != null ? Math.round((dgs10 - dgs2) * 100) / 100 : null;
    const spread10y3m = dgs10 != null && dgs3m != null ? Math.round((dgs10 - dgs3m) * 100) / 100 : null;

    return {
      success: true,
      asOfDate,
      rates,
      spreads: {
        spread10y2y,
        spread10y3m,
        isInverted10y2y: spread10y2y != null ? spread10y2y < 0 : false,
        isInverted10y3m: spread10y3m != null ? spread10y3m < 0 : false,
      },
      tenors: [
        { tenor: "SOFR", label: "Overnight SOFR", rate: rates.SOFR, category: "overnight" },
        { tenor: "TREASURY_M1", label: "1 Month", rate: rates.TREASURY_M1, category: "bill" },
        { tenor: "TREASURY_M3", label: "3 Month", rate: rates.TREASURY_M3, category: "bill" },
        { tenor: "TREASURY_M6", label: "6 Month", rate: rates.TREASURY_M6, category: "bill" },
        { tenor: "TREASURY_Y1", label: "1 Year", rate: rates.TREASURY_Y1, category: "bill" },
        { tenor: "TREASURY_Y2", label: "2 Year", rate: rates.TREASURY_Y2, category: "note" },
        { tenor: "TREASURY_Y3", label: "3 Year", rate: rates.TREASURY_Y3, category: "note" },
        { tenor: "TREASURY_Y5", label: "5 Year", rate: rates.TREASURY_Y5, category: "note" },
        { tenor: "TREASURY_Y7", label: "7 Year", rate: rates.TREASURY_Y7, category: "note" },
        { tenor: "TREASURY_Y10", label: "10 Year", rate: rates.TREASURY_Y10, category: "note" },
        { tenor: "TREASURY_Y20", label: "20 Year", rate: rates.TREASURY_Y20, category: "bond" },
        { tenor: "TREASURY_Y30", label: "30 Year", rate: rates.TREASURY_Y30, category: "bond" },
      ],
      source: "U.S. Department of the Treasury & Federal Reserve Bank of New York (Direct Government Fallback)",
    };
  }
}

export const globalYieldCurveService = new YieldCurveService();
