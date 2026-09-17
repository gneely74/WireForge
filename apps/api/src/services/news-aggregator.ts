import { NewsArticle, NewsCategory, NewsImpact, Sentiment } from "@wireforge/shared";

// Seed / Initial Market Wire Items
const INITIAL_NEWS: NewsArticle[] = [
  {
    id: "news-1",
    title: "NVIDIA Announces Next-Gen Ultra Rubin Architecture Accelerators Ahead of Schedule",
    summary: "NVIDIA Corp. ($NVDA) confirms high-volume production ramp for next-generation Rubin AI architecture with major hyperscalers including Microsoft and Google Cloud.",
    content: "SANTA CLARA, CA — NVIDIA Corporation (NASDAQ: NVDA) today issued an operational update confirming accelerated delivery schedules for its upcoming Rubin GPU architecture. Commercial hyperscaler allocations will commence late Q3 with expected rack-scale system deliveries expanding through Q4.",
    tickers: ["NVDA", "MSFT", "GOOGL"],
    category: "guidance",
    impact: "high",
    sentiment: "bullish",
    source: "WireForge Desk",
    url: "https://wireforge.market/news/nvda-rubin-update",
    timestamp: Date.now() - 60000 * 2,
    isoTime: new Date(Date.now() - 60000 * 2).toISOString(),
    isSquawked: false,
  },
  {
    id: "news-2",
    title: "SEC Form 8-K: Apple Inc. Discloses Material Strategic Cloud Infrastructure Agreement",
    summary: "Apple Inc. ($AAPL) files Form 8-K with the SEC regarding a multi-year $12B enterprise cloud infrastructure commitment with proprietary AI silicon acceleration.",
    content: "Item 1.01 Entry into a Material Definitive Agreement. On September 16, 2026, Apple Inc. entered into an amended master service agreement securing dedicated hyperscale datacenter capacity supporting Apple Intelligence on-device cloud offload.",
    tickers: ["AAPL"],
    category: "sec",
    impact: "high",
    sentiment: "bullish",
    source: "SEC EDGAR",
    url: "https://www.sec.gov/edgar/searchedgar/companysearch",
    timestamp: Date.now() - 60000 * 5,
    isoTime: new Date(Date.now() - 60000 * 5).toISOString(),
    isSquawked: false,
  },
  {
    id: "news-3",
    title: "Tesla Q3 Delivery Guidance Raised by Goldman Sachs Following Shanghai Gigafactory Export Data",
    summary: "Goldman Sachs upgrades Tesla ($TSLA) to Buy with price target raised to $295 following record weekly export metrics out of Giga Shanghai.",
    content: "Goldman Sachs analyst Mark Delaney updated equity research on Tesla Inc. ($TSLA), citing stabilizing margins, accelerating Megapack energy storage installations, and stronger-than-expected APAC deliveries.",
    tickers: ["TSLA"],
    category: "ratings",
    impact: "medium",
    sentiment: "bullish",
    source: "Goldman Sachs Research",
    url: "https://wireforge.market/ratings/tsla-goldman-upgrade",
    timestamp: Date.now() - 60000 * 9,
    isoTime: new Date(Date.now() - 60000 * 9).toISOString(),
    isSquawked: false,
  },
  {
    id: "news-4",
    title: "FDA Grants Accelerated Approval for Viking Therapeutics Oral Dual Incretin Agonist",
    summary: "Viking Therapeutics ($VKTX) surges 18% pre-market as FDA grants priority approval for oral VK2735 tablet formulation.",
    content: "The U.S. Food and Drug Administration (FDA) today granted accelerated marketing clearance for Viking Therapeutics Inc. (NASDAQ: VKTX) oral dual GLP-1/GIP receptor agonist following Phase 3 weight loss efficacy trials exceeding primary endpoints.",
    tickers: ["VKTX"],
    category: "fda",
    impact: "high",
    sentiment: "bullish",
    source: "PR Newswire",
    url: "https://www.prnewswire.com/news-releases/vktx-fda-approval",
    timestamp: Date.now() - 60000 * 14,
    isoTime: new Date(Date.now() - 60000 * 14).toISOString(),
    isSquawked: false,
  },
  {
    id: "news-5",
    title: "Federal Reserve FOMC Policy Statement: Rates Held Steady, Balance Sheet Runoff Maintained",
    summary: "Federal Open Market Committee holds federal funds rate target at 4.25%-4.50%. Powell notes economic resilience and orderly disinflation.",
    content: "WASHINGTON — The Federal Reserve issued its FOMC monetary policy decision today, maintaining benchmark interest rates while continuing systematic Treasury and agency mortgage-backed securities runoff.",
    tickers: ["SPY", "QQQ", "TLT"],
    category: "macro",
    impact: "high",
    sentiment: "neutral",
    source: "Federal Reserve Wire",
    url: "https://www.federalreserve.gov/monetarypolicy",
    timestamp: Date.now() - 60000 * 22,
    isoTime: new Date(Date.now() - 60000 * 22).toISOString(),
    isSquawked: false,
  },
  {
    id: "news-6",
    title: "CrowdStrike Beats Q2 Estimates with ARR of $4.15B, Reaffirms Full-Year Net New ARR Outlook",
    summary: "CrowdStrike ($CRWD) reports Adjusted EPS $1.04 vs $0.98 est. Revenue $1.01B (+31% YoY). Cloud security and Falcon Flex adoption driving growth.",
    content: "AUSTIN, TX — CrowdStrike Holdings, Inc. (NASDAQ: CRWD) reported financial results for its second quarter fiscal 2027. Ending Annual Recurring Revenue (ARR) grew 31% year-over-year to $4.15 billion.",
    tickers: ["CRWD"],
    category: "earnings",
    impact: "high",
    sentiment: "bullish",
    source: "Business Wire",
    url: "https://www.businesswire.com/news/home/crwd-q2-earnings",
    timestamp: Date.now() - 60000 * 35,
    isoTime: new Date(Date.now() - 60000 * 35).toISOString(),
    isSquawked: false,
  },
  {
    id: "news-7",
    title: "SEC Form 4: Meta Platforms CEO Mark Zuckerberg Discloses Scheduled Rule 10b5-1 Share Sales",
    summary: "Form 4 shows planned disposition of 48,000 shares of Meta ($META) Class A Common Stock under pre-established philanthropic trust plan.",
    content: "Item 4 Statement of Changes in Beneficial Ownership. Form 4 filed with the Securities and Exchange Commission on behalf of Mark Zuckerberg indicates orderly dispositions under a Rule 10b5-1 trading plan adopted in 2025.",
    tickers: ["META"],
    category: "sec",
    impact: "low",
    sentiment: "neutral",
    source: "SEC EDGAR",
    url: "https://www.sec.gov/edgar/searchedgar/companysearch",
    timestamp: Date.now() - 60000 * 48,
    isoTime: new Date(Date.now() - 60000 * 48).toISOString(),
    isSquawked: false,
  },
  {
    id: "news-8",
    title: "ExxonMobil and Chevron in Advanced Discussions for Offshore Guyana Consortium Expansion",
    summary: "ExxonMobil ($XOM) and Chevron ($CVX) exploring joint licensing bids for deepwater exploration blocks adjacent to Stabroek block.",
    content: "HOUSTON — Energy conglomerates Exxon Mobil Corp and Chevron are evaluating shared infrastructure and offshore transport logistics in offshore Guyana ahead of bilateral government licensing rounds.",
    tickers: ["XOM", "CVX"],
    category: "ma",
    impact: "medium",
    sentiment: "bullish",
    source: "Reuters Energy",
    url: "https://wireforge.market/energy/xom-cvx-guyana",
    timestamp: Date.now() - 60000 * 62,
    isoTime: new Date(Date.now() - 60000 * 62).toISOString(),
    isSquawked: false,
  },
];

export class NewsAggregator {
  private articles: NewsArticle[] = [...INITIAL_NEWS];
  private listeners: ((article: NewsArticle) => void)[] = [];
  private generatorTimer: NodeJS.Timeout | null = null;
  private secTimer: NodeJS.Timeout | null = null;
  private rssTimer: NodeJS.Timeout | null = null;
  private seenUrls: Set<string> = new Set<string>();

  constructor() {
    this.startBackgroundPoller();
    // Initial fetch on boot
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
        if (!link || this.seenUrls.has(link)) continue;
        this.seenUrls.add(link);

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
        if (!link || this.seenUrls.has(link)) continue;
        this.seenUrls.add(link);

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

  addArticle(article: Omit<NewsArticle, "id" | "timestamp" | "isoTime" | "isSquawked"> & { isSquawked?: boolean }): NewsArticle {
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

  private startBackgroundPoller() {
    // Generates periodic breaking live headlines simulating market wire flow
    const SIMULATED_HEADLINES: Array<Omit<NewsArticle, "id" | "timestamp" | "isoTime" | "isSquawked">> = [
      {
        title: "Microsoft Copilot Enterprise Subscriptions Surpass 120 Million Paid Seats",
        summary: "Microsoft ($MSFT) reports acceleration in commercial office Copilot enterprise seats, with gross margins stabilizing at 71%.",
        tickers: ["MSFT"],
        category: "guidance",
        impact: "high",
        sentiment: "bullish",
        source: "Business Wire",
      },
      {
        title: "SEC Form 8-K: Super Micro Computer Secures $2.5B Extended Revolving Credit Facility",
        summary: "Super Micro Computer ($SMCI) enters credit agreement with syndicate led by JPMorgan and BofA Securities.",
        tickers: ["SMCI"],
        category: "sec",
        impact: "medium",
        sentiment: "bullish",
        source: "SEC EDGAR",
      },
      {
        title: "Eli Lilly Submits European MAA for Triple G Hormone Agonist Retatrutide",
        summary: "Eli Lilly ($LLY) advances next-generation obesity pipeline into European regulatory assessment window.",
        tickers: ["LLY"],
        category: "fda",
        impact: "high",
        sentiment: "bullish",
        source: "PR Newswire",
      },
      {
        title: "Morgan Stanley Initiates Coverage on Palantir Technologies with Overweight Rating",
        summary: "Morgan Stanley analyst sets price target of $55 on Palantir ($PLTR), citing AIP enterprise contract monetization velocity.",
        tickers: ["PLTR"],
        category: "ratings",
        impact: "medium",
        sentiment: "bullish",
        source: "Morgan Stanley Research",
      },
      {
        title: "US Department of Energy Awards $850M Next-Gen Nuclear SMR Grid Integration Contract to Constellation Energy",
        summary: "Constellation Energy ($CEG) selected for primary reactor restart and hyperscale AI datacenter dedicated power purchase agreements.",
        tickers: ["CEG"],
        category: "general",
        impact: "high",
        sentiment: "bullish",
        source: "WireForge Desk",
      },
    ];

    let idx = 0;
    this.generatorTimer = setInterval(() => {
      const template = SIMULATED_HEADLINES[idx % SIMULATED_HEADLINES.length];
      this.addArticle(template);
      idx++;
    }, 45000); // New market headline every 45s
  }

  stop() {
    if (this.generatorTimer) clearInterval(this.generatorTimer);
    if (this.secTimer) clearInterval(this.secTimer);
    if (this.rssTimer) clearInterval(this.rssTimer);
  }
}

export const globalNewsAggregator = new NewsAggregator();
