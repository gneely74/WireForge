import { NewsArticle, NewsCategory, NewsImpact, Sentiment } from "@wireforge/shared";
import { NewsDeduplicator } from "./news-dedup.js";

export class NewsAggregator {
  // Purely authentic news store; zero hardcoded mock or synthetic articles
  private articles: NewsArticle[] = [];
  private listeners: ((article: NewsArticle) => void)[] = [];
  private secTimer: NodeJS.Timeout | null = null;
  private rssTimer: NodeJS.Timeout | null = null;
  private deduplicator: NewsDeduplicator = new NewsDeduplicator();

  constructor() {
    // Initial fetch on boot directly from live feeds
    this.pollSecEdgar();
    this.pollFinancialRss();

    // Schedule adaptive recurring polls based on market session (RTH vs After-Hours)
    this.scheduleNextSecPoll();
    this.scheduleNextRssPoll();
  }

  private isMarketSessionActive(): boolean {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour12: false,
      weekday: "short",
      hour: "numeric",
    });
    const parts = formatter.formatToParts(now);
    const weekday = parts.find((p) => p.type === "weekday")?.value || "";
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const isWeekend = weekday === "Sat" || weekday === "Sun";
    // Active trading session: Weekdays 6:00 AM - 8:00 PM Eastern Time
    return !isWeekend && hour >= 6 && hour < 20;
  }

  private getPollingIntervals(): { secInterval: number; rssInterval: number; isAfterHours: boolean } {
    const isMarketHours = this.isMarketSessionActive();
    if (isMarketHours) {
      // Regular / Pre-Market active hours: high frequency
      return {
        secInterval: 30 * 1000,   // 30 seconds
        rssInterval: 60 * 1000,   // 60 seconds
        isAfterHours: false,
      };
    } else {
      // After-Hours / Overnight / Weekends: poll only a few times per hour (~every 20 minutes)
      const afterHoursMs = Number(process.env.AFTER_HOURS_POLL_INTERVAL_MS) || 20 * 60 * 1000;
      return {
        secInterval: afterHoursMs,
        rssInterval: afterHoursMs,
        isAfterHours: true,
      };
    }
  }

  private scheduleNextSecPoll() {
    const { secInterval } = this.getPollingIntervals();
    this.secTimer = setTimeout(async () => {
      await this.pollSecEdgar();
      this.scheduleNextSecPoll();
    }, secInterval);
  }

  private scheduleNextRssPoll() {
    const { rssInterval } = this.getPollingIntervals();
    this.rssTimer = setTimeout(async () => {
      await this.pollFinancialRss();
      this.scheduleNextRssPoll();
    }, rssInterval);
  }

  async pollSecEdgar() {
    try {
      const res = await fetch("https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&output=atom", {
        headers: {
          "User-Agent": "WireForge/1.0 (gene@wireforge.local)",
          "Accept": "application/atom+xml,text/xml,application/xml",
        },
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) return;
      const xml = await res.text();
      const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];

      for (const entry of entries) {
        const linkMatch = entry.match(/<link[^>]*href="([^"]*)"/);
        const link = linkMatch ? linkMatch[1] : "";
        if (!link) continue;

        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        let rawTitle = titleMatch ? titleMatch[1].trim() : "SEC Form 8-K Filing";
        rawTitle = rawTitle.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

        const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
        let rawSummary = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, " ").trim() : "Material Definitive Event disclosure filed with the SEC.";
        rawSummary = rawSummary.replace(/\s+/g, " ");

        const companyName = rawTitle.replace(/^8-K\s*-\s*/i, "").replace(/\s*\(\d+\)\s*\(Filer\)/i, "").trim();

        const tickers: string[] = [];
        const knownTickers: Record<string, string> = {
          "Apple": "AAPL", "Microsoft": "MSFT", "NVIDIA": "NVDA", "Tesla": "TSLA",
          "Amazon": "AMZN", "Alphabet": "GOOGL", "Google": "GOOGL", "Meta": "META",
          "Super Micro": "SMCI", "Palantir": "PLTR", "Eli Lilly": "LLY", "Boeing": "BA",
          "Netflix": "NFLX", "AMD": "AMD", "Intel": "INTC", "Broadcom": "AVGO",
          "Micron": "MU", "FedEx": "FDX", "Lennar": "LEN", "Costco": "COST", "Nike": "NKE",
        };
        for (const [name, sym] of Object.entries(knownTickers)) {
          if (companyName.toLowerCase().includes(name.toLowerCase())) {
            tickers.push(sym);
          }
        }
        if (tickers.length === 0) {
          const m = companyName.match(/\b([A-Z]{2,5})\b/);
          if (m) tickers.push(m[1]);
        }

        const isHighImpact = rawSummary.includes("Item 1.01") || rawSummary.includes("Item 2.02") || rawSummary.includes("Item 8.01");

        this.addArticle({
          title: `SEC Form 8-K: ${companyName}`,
          summary: rawSummary.length > 200 ? rawSummary.slice(0, 197) + "..." : rawSummary,
          content: `Filing URL: ${link}\n\n${rawSummary}`,
          tickers: tickers.length > 0 ? tickers : ["SEC"],
          category: "sec",
          impact: isHighImpact ? "high" : "medium",
          sentiment: "neutral",
          source: "SEC EDGAR",
          url: link,
        });
      }
    } catch (err) {
      // Suppress network transient errors
    }
  }

  async pollFinancialRss() {
    try {
      const res = await fetch("https://news.google.com/rss/search?q=stock+market+when:1h&hl=en-US&gl=US&ceid=US:en", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
          "Accept": "application/rss+xml,text/xml,application/xml",
        },
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) return;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const item of items) {
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const link = linkMatch ? linkMatch[1] : "";
        if (!link) continue;

        const titleMatch = item.match(/<title>(.*?)<\/title>/);
        let rawTitle = titleMatch ? titleMatch[1].trim() : "";
        rawTitle = rawTitle.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

        const sourceMatch = item.match(/<source[^>]*>(.*?)<\/source>/);
        const source = sourceMatch ? sourceMatch[1].trim() : "MarketWire";

        const title = rawTitle.replace(/\s*-\s*[^-]+$/, "").trim();

        const tickers: string[] = [];
        const tickerMatches = title.match(/\$([A-Z]{1,5})\b/g);
        if (tickerMatches) {
          for (const t of tickerMatches) {
            tickers.push(t.replace("$", ""));
          }
        }
        const WATCH_TICKERS = ["NVDA", "AAPL", "MSFT", "TSLA", "AMZN", "GOOGL", "META", "SPY", "QQQ", "SMCI", "PLTR", "LLY", "AMD", "MU", "LEN", "FDX", "COST", "NKE", "BA", "NFLX"];
        for (const sym of WATCH_TICKERS) {
          if (new RegExp(`\\b${sym}\\b`, "i").test(title) && !tickers.includes(sym)) {
            tickers.push(sym);
          }
        }

        const lower = title.toLowerCase();
        let category: NewsCategory = "general";
        if (lower.includes("earnings") || lower.includes("profit") || lower.includes("revenue") || lower.includes("quarter")) category = "earnings";
        else if (lower.includes("fda") || lower.includes("drug") || lower.includes("trial") || lower.includes("biotech")) category = "fda";
        else if (lower.includes("upgrade") || lower.includes("downgrade") || lower.includes("price target") || lower.includes("analyst")) category = "ratings";
        else if (lower.includes("fed") || lower.includes("rate") || lower.includes("inflation") || lower.includes("cpi") || lower.includes("treasury")) category = "macro";
        else if (lower.includes("guidance") || lower.includes("forecast") || lower.includes("outlook")) category = "guidance";
        else if (lower.includes("merger") || lower.includes("acquire") || lower.includes("acquisition") || lower.includes("buyout")) category = "ma";

        let sentiment: Sentiment = "neutral";
        if (/surges|beats|rallies|jumps|soars|upgrades|bull|record high/i.test(lower)) sentiment = "bullish";
        else if (/plunges|misses|drops|falls|halves|downgrade|bear|warning|slumps|tumbles/i.test(lower)) sentiment = "bearish";

        const impact: NewsImpact = (/breaking|beats|halves|plunges|surges|crisis|fed rate/i.test(lower) || tickers.length > 0) ? "high" : "medium";

        this.addArticle({
          title,
          summary: title,
          content: `Source: ${source}\nRead Full Story: ${link}`,
          tickers: tickers.length > 0 ? tickers : ["MARKET"],
          category,
          impact,
          sentiment,
          source,
          url: link,
        });
      }
    } catch (err) {
      // Suppress network transient errors
    }
  }

  getArticles(params: {
    category?: NewsCategory;
    ticker?: string;
    watchlistSymbols?: string[];
    impact?: NewsImpact;
    query?: string;
    limit?: number;
  }): NewsArticle[] {
    let list = [...this.articles];

    if (params.category && params.category !== "all") {
      list = list.filter((a) => a.category === params.category);
    }

    if (params.ticker) {
      const q = params.ticker.toUpperCase();
      list = list.filter((a) => a.tickers.includes(q));
    }

    if (params.watchlistSymbols && params.watchlistSymbols.length > 0) {
      const allowed = new Set(params.watchlistSymbols.map((s) => s.toUpperCase()));
      list = list.filter((a) => a.tickers.some((t) => allowed.has(t)));
    }

    if (params.impact) {
      list = list.filter((a) => a.impact === params.impact);
    }

    if (params.query) {
      const q = params.query.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tickers.some((t) => t.toLowerCase().includes(q))
      );
    }

    const limit = params.limit || 50;
    return list.slice(0, limit);
  }

  addArticle(article: Omit<NewsArticle, "id" | "timestamp" | "isoTime" | "isSquawked"> & { isSquawked?: boolean }): NewsArticle | null {
    const dedupe = this.deduplicator.checkAndTrack({
      title: article.title,
      url: article.url,
      tickers: article.tickers,
      timestamp: Date.now(),
    });

    if (dedupe.isDuplicate) {
      return null;
    }

    const full: NewsArticle = {
      ...article,
      id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      isoTime: new Date().toISOString(),
      isSquawked: article.isSquawked ?? false,
    };

    this.articles.unshift(full);
    // Keep last 500 articles in memory
    if (this.articles.length > 500) {
      this.articles.pop();
    }

    this.notifyListeners(full);
    return full;
  }

  getDedupeStats() {
    return this.deduplicator.getStats();
  }

  onNewArticle(cb: (article: NewsArticle) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners(article: NewsArticle) {
    for (const listener of this.listeners) {
      try {
        listener(article);
      } catch (err) {
        console.error("[NewsAggregator] listener error:", err);
      }
    }
  }

  stop() {
    if (this.secTimer) clearInterval(this.secTimer);
    if (this.rssTimer) clearInterval(this.rssTimer);
  }
}

export const globalNewsAggregator = new NewsAggregator();
