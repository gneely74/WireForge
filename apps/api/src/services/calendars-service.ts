/**
 * @file calendars-service.ts
 * @description Real-time corporate earnings and macroeconomic calendar aggregation service.
 *
 * Sourced directly from authentic live ecosystem backends:
 * - Macroeconomic Calendar: Trading Agent (/api/calendar/events on port 8080)
 * - Corporate Earnings Calendar: SEC EDGAR Tool (/api/earnings/calendar on port 4000)
 *
 * Strictly eliminates all synthetic, fake, or hardcoded calendar fixtures. If upstream
 * services are unreachable, returns structured, meaningful, actionable error responses.
 */

import { EarningsEvent, EconomicRelease } from "@wireforge/shared";

export interface CalendarQueryResult<T> {
  data: T[];
  count: number;
  source: string;
  updatedAt: string;
  error?: string;
  message?: string;
  actionable?: string;
}

export class CalendarsService {
  private tradingAgentCandidates: string[];
  private edgarCandidates: string[];

  // In-memory caches with 5-minute TTL
  private cachedEconomic: { data: EconomicRelease[]; timestamp: number } | null = null;
  private cachedEarnings: { data: EarningsEvent[]; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor() {
    const configuredTa = process.env.TRADING_AGENT_API_URL?.replace(/\/+$/, "");
    this.tradingAgentCandidates = [
      ...(configuredTa ? [configuredTa] : []),
      "http://127.0.0.1:8080",
      "http://192.168.74.102:8080",
    ].filter((v, i, a) => a.indexOf(v) === i);

    const configuredEdgar = process.env.EDGAR_API_URL?.replace(/\/+$/, "");
    this.edgarCandidates = [
      ...(configuredEdgar ? [configuredEdgar] : []),
      "http://192.168.74.105:4000",
      "http://127.0.0.1:4000",
    ].filter((v, i, a) => a.indexOf(v) === i);
  }

  /**
   * Fetches authentic corporate earnings announcements scheduled within a rolling window.
   *
   * @param timing Optional filter for announcement timing ('BMO', 'AMC', 'DURING').
   * @param ticker Optional ticker symbol filter.
   * @returns Structured query result with authentic events or actionable error message.
   */
  async getEarnings(
    timing?: "BMO" | "AMC" | "DURING",
    ticker?: string
  ): Promise<CalendarQueryResult<EarningsEvent>> {
    let allEvents: EarningsEvent[] = [];
    let activeSource = "edgar-tool";

    // 1. Check in-memory cache
    if (this.cachedEarnings && Date.now() - this.cachedEarnings.timestamp < this.CACHE_TTL_MS) {
      allEvents = this.cachedEarnings.data;
      activeSource = "edgar-tool:cache";
    } else {
      let fetchSuccess = false;
      let lastError: Error | null = null;

      for (const baseUrl of this.edgarCandidates) {
        try {
          const res = await fetch(`${baseUrl}/api/earnings/calendar?days=30`, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(4000),
          });

          if (res.ok) {
            const json: any = await res.json();
            const events: EarningsEvent[] = [];

            if (json.calendar && typeof json.calendar === "object") {
              for (const [dateStr, items] of Object.entries(json.calendar as Record<string, any[]>)) {
                if (!Array.isArray(items)) continue;
                for (const item of items) {
                  const rawTiming = item.time_of_day ? String(item.time_of_day).toUpperCase() : "DURING";
                  const timingVal: "BMO" | "AMC" | "DURING" =
                    rawTiming === "BMO" ? "BMO" : rawTiming === "AMC" ? "AMC" : "DURING";

                  events.push({
                    id: `earn-${item.ticker}-${dateStr}`,
                    ticker: String(item.ticker).toUpperCase(),
                    companyName: item.company_name || item.ticker,
                    date: dateStr,
                    timing: timingVal,
                    epsEstimate:
                      item.eps_estimate !== null && item.eps_estimate !== undefined
                        ? Number(item.eps_estimate)
                        : null,
                    epsActual:
                      item.eps_actual !== null && item.eps_actual !== undefined
                        ? Number(item.eps_actual)
                        : null,
                    revEstimate: item.revenue_estimate ? String(item.revenue_estimate) : null,
                    revActual: item.revenue_actual ? String(item.revenue_actual) : null,
                    fiscalQuarter: item.fiscal_quarter || "Upcoming",
                  });
                }
              }
            }

            allEvents = events;
            this.cachedEarnings = { data: events, timestamp: Date.now() };
            activeSource = `${baseUrl}/api/earnings/calendar`;
            fetchSuccess = true;
            break;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!fetchSuccess) {
        return {
          data: [],
          count: 0,
          source: "unreachable",
          updatedAt: new Date().toISOString(),
          error: "EDGAR_EARNINGS_UNAVAILABLE",
          message: `Unable to retrieve live earnings calendar from SEC EDGAR service (${lastError?.message || "connection failed"}).`,
          actionable:
            "Ensure the edgar-tool service is running on 192.168.74.105:4000 or set EDGAR_API_URL in your environment.",
        };
      }
    }

    let filtered = [...allEvents];
    if (timing) {
      filtered = filtered.filter((e) => e.timing === timing);
    }
    if (ticker) {
      const t = ticker.toUpperCase();
      filtered = filtered.filter((e) => e.ticker === t);
    }

    return {
      data: filtered,
      count: filtered.length,
      source: activeSource,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Fetches authentic macroeconomic events and releases from the Trading Agent calendar pipeline.
   *
   * @param impact Optional impact filter ('high', 'medium', 'low').
   * @returns Structured query result with authentic releases or actionable error message.
   */
  async getEconomic(impact?: "high" | "medium" | "low"): Promise<CalendarQueryResult<EconomicRelease>> {
    let allReleases: EconomicRelease[] = [];
    let activeSource = "trading-agent";

    // 1. Check in-memory cache
    if (this.cachedEconomic && Date.now() - this.cachedEconomic.timestamp < this.CACHE_TTL_MS) {
      allReleases = this.cachedEconomic.data;
      activeSource = "trading-agent:cache";
    } else {
      let fetchSuccess = false;
      let lastError: Error | null = null;

      for (const baseUrl of this.tradingAgentCandidates) {
        try {
          const res = await fetch(`${baseUrl}/api/calendar/events`, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(4000),
          });

          if (res.ok) {
            const json: any = await res.json();
            const rawEvents: any[] = json.events || [];

            const releases: EconomicRelease[] = rawEvents.map((evt) => {
              const rawImpact = (evt.impact || "").toLowerCase();
              const impactLevel: "high" | "medium" | "low" =
                rawImpact === "high" ? "high" : rawImpact === "low" ? "low" : "medium";

              return {
                id: evt.id || `eco-${evt.date_str}-${evt.title}`,
                name: evt.title || "Economic Release",
                country: evt.country === "USD" ? "US" : evt.country || "US",
                date: evt.date_str || new Date(evt.date).toISOString().slice(0, 10),
                time: evt.time_et || "TBD",
                impact: impactLevel,
                actual: evt.actual ?? null,
                forecast: evt.forecast || null,
                previous: evt.previous || null,
              };
            });

            allReleases = releases;
            this.cachedEconomic = { data: releases, timestamp: Date.now() };
            activeSource = `${baseUrl}/api/calendar/events`;
            fetchSuccess = true;
            break;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!fetchSuccess) {
        return {
          data: [],
          count: 0,
          source: "unreachable",
          updatedAt: new Date().toISOString(),
          error: "ECONOMIC_CALENDAR_UNAVAILABLE",
          message: `Unable to retrieve macroeconomic releases from Trading Agent (${lastError?.message || "connection failed"}).`,
          actionable:
            "Ensure Trading Agent is running on port 8080 (http://192.168.74.102:8080) or configure TRADING_AGENT_API_URL.",
        };
      }
    }

    let filtered = [...allReleases];
    if (impact) {
      filtered = filtered.filter((r) => r.impact === impact);
    }

    return {
      data: filtered,
      count: filtered.length,
      source: activeSource,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const globalCalendarsService = new CalendarsService();

