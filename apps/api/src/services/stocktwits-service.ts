import { NewsArticle, Sentiment, StockTwitsSentiment } from "@wireforge/shared";
import { globalNewsAggregator } from "./news-aggregator.js";

const STOCKTWITS_API_BASE = "https://api.stocktwits.com/api/2";
const USER_AGENT = "WireForge/1.0 (Mozilla/5.0; compatible; Institutional News Wire)";

export class StockTwitsService {
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private pollerTimer: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor() {
    this.startPoller();
  }

  private startPoller() {
    // Initial fetch after 2s
    setTimeout(() => {
      this.pollTrendingStream().catch(() => {});
    }, 2000);

    // Recurring poll every 60 seconds
    this.pollerTimer = setInterval(() => {
      this.pollTrendingStream().catch(() => {});
    }, 60 * 1000);
  }

  public stop() {
    if (this.pollerTimer) {
      clearInterval(this.pollerTimer);
      this.pollerTimer = null;
    }
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache(key: string, data: any, ttlSeconds: number) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Poll trending stream and stream new authentic trader messages into the NewsWire.
   */
  public async pollTrendingStream(): Promise<number> {
    if (this.isPolling) return 0;
    this.isPolling = true;

    try {
      const resp = await fetch(`${STOCKTWITS_API_BASE}/streams/trending.json`, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
      });

      if (!resp.ok) {
        console.warn(`[StockTwits] Trending stream returned HTTP ${resp.status}`);
        return 0;
      }

      const json = await resp.json();
      const messages = (json.messages || []) as any[];

      let addedCount = 0;
      for (const msg of messages) {
        const body = (msg.body || "").trim();
        if (!body) continue;

        // Extract tickers
        const rawSymbols = (msg.symbols || []) as any[];
        let tickers = rawSymbols.map((s) => s.symbol?.toUpperCase()).filter(Boolean);
        if (!tickers.length) {
          const matched = body.match(/\$([A-Z]{1,6})\b/g);
          if (matched) {
            tickers = matched.map((m: string) => m.replace("$", "").toUpperCase());
          }
        }
        if (!tickers.length) continue;

        // Extract sentiment
        const basicSent = msg.entities?.sentiment?.basic?.toLowerCase();
        let sentiment: Sentiment = "neutral";
        if (basicSent === "bullish") sentiment = "bullish";
        else if (basicSent === "bearish") sentiment = "bearish";

        // Clean user title
        const user = msg.user?.username || "trader";
        const followers = msg.user?.followers || 0;
        const cleanSnippet = body.replace(/\s+/g, " ").slice(0, 100);
        const title = `${tickers.slice(0, 3).map((t: string) => `$${t}`).join(" ")}: ${cleanSnippet}${body.length > 100 ? "..." : ""}`;

        const article = globalNewsAggregator.addArticle({
          title,
          summary: body,
          content: `${body}\n\n— Posted by @${user} (${followers} followers) on StockTwits`,
          tickers: tickers.slice(0, 5),
          category: "social",
          impact: followers >= 1000 || (sentiment !== "neutral" && tickers.length === 1) ? "medium" : "low",
          sentiment,
          source: "StockTwits",
          url: `https://stocktwits.com/${user}/message/${msg.id}`,
        });

        if (article) {
          addedCount++;
        }
      }

      return addedCount;
    } catch (err) {
      console.error("[StockTwits] Failed to poll trending stream:", err);
      return 0;
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Retrieve live sentiment and message sample for a specific symbol.
   */
  public async getSymbolSentiment(symbol: string): Promise<StockTwitsSentiment> {
    const cleanSym = symbol.trim().toUpperCase();
    const cacheKey = `sent:${cleanSym}`;
    const cached = this.getCached<StockTwitsSentiment>(cacheKey);
    if (cached) return cached;

    const fallback: StockTwitsSentiment = {
      symbol: cleanSym,
      bullishPct: 0.0,
      bullishCount: 0,
      bearishCount: 0,
      totalMessages: 0,
      watchlistCount: 0,
      updatedAt: Date.now(),
    };

    try {
      const resp = await fetch(`${STOCKTWITS_API_BASE}/streams/symbol/${cleanSym}.json`, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
      });

      if (!resp.ok) {
        this.setCache(cacheKey, fallback, 30);
        return fallback;
      }

      const json = await resp.json();
      const messages = (json.messages || []) as any[];
      const symbolInfo = json.symbol || {};

      let bullishCount = 0;
      let bearishCount = 0;

      for (const m of messages) {
        const basic = m.entities?.sentiment?.basic;
        if (basic === "Bullish") bullishCount++;
        else if (basic === "Bearish") bearishCount++;
      }

      const totalTagged = bullishCount + bearishCount;
      const bullishPct = totalTagged > 0 ? Math.round((bullishCount / totalTagged) * 1000) / 10 : 0.0;

      const result: StockTwitsSentiment = {
        symbol: cleanSym,
        bullishPct,
        bullishCount,
        bearishCount,
        totalMessages: messages.length,
        watchlistCount: symbolInfo.watchlist_count || 0,
        updatedAt: Date.now(),
      };

      this.setCache(cacheKey, result, 120);
      return result;
    } catch (err) {
      console.error(`[StockTwits] Failed to fetch sentiment for ${cleanSym}:`, err);
      return fallback;
    }
  }

  /**
   * Retrieve top trending symbols.
   */
  public async getTrendingSymbols(): Promise<any[]> {
    const cacheKey = "trending:symbols";
    const cached = this.getCached<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const resp = await fetch(`${STOCKTWITS_API_BASE}/trending/symbols.json`, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
      });

      if (!resp.ok) return [];
      const json = await resp.json();
      const symbols = json.symbols || [];
      this.setCache(cacheKey, symbols, 60);
      return symbols;
    } catch (err) {
      console.error("[StockTwits] Failed to fetch trending symbols:", err);
      return [];
    }
  }
}

export const globalStockTwitsService = new StockTwitsService();
