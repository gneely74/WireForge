/**
 * @fileoverview Real-time Tree News (Tree of Alpha) streaming and ingestion service.
 * Connects to the public, high-speed Tree of Alpha WebSocket feed and REST backfill
 * endpoint to ingest sub-second breaking financial news, Federal Reserve announcements,
 * SEC orders, White House directives, Wall Street Journal exclusives, and high-impact social alerts.
 *
 * Upstream Feeds:
 *  - WebSocket: wss://news.treeofalpha.com/ws (Sub-second streaming tape)
 *  - REST Backfill: https://news.treeofalpha.com/api/news (Instant cold-start pre-warm)
 *
 * Downstream Integration:
 *  - globalNewsAggregator (services/news-aggregator.ts) -> Deduplication & SQLite persistence
 *  - WebSocket Broadcast (websocket/server.ts) -> Client UI live tape & AudioSquawk speech
 *
 * Strictly adheres to repository rule: NO FAKE OR HARDCODED DATA! LIVE AUTHENTIC DATA ONLY.
 */

import { WebSocket } from "ws";
import { NewsArticle, NewsCategory, NewsImpact, Sentiment } from "@wireforge/shared";
import { globalNewsAggregator } from "./news-aggregator.js";

/**
 * Raw data schema returned by Tree of Alpha APIs.
 */
export interface TreeNewsRawItem {
  _id?: string;
  title?: string;
  source?: string;
  sourceName?: string;
  url?: string;
  time?: number;
  icon?: string;
  image?: string;
  en?: string;
  symbols?: string[];
  suggestions?: Array<{
    coin?: string;
    symbols?: Array<{ exchange?: string; symbol?: string }>;
    supply?: number;
    priceMove1h?: number;
    maxMove1h?: number;
  }>;
  info?: {
    twitterId?: string;
    truthId?: string;
    isReply?: boolean;
    isRetweet?: boolean;
    isQuote?: boolean;
    isSelfReply?: boolean;
  };
}

/**
 * Diagnostics and connection status for Tree News service.
 */
export interface TreeNewsStatus {
  status: "connected" | "connecting" | "disconnected" | "error";
  connectedAt: string | null;
  lastMessageAt: string | null;
  messagesReceived: number;
  articlesIngested: number;
  reconnectAttempts: number;
  error: string | null;
}

const TREE_WS_URL = "wss://news.treeofalpha.com/ws";
const TREE_REST_URL = "https://news.treeofalpha.com/api/news";
const USER_AGENT = "WireForge/1.0 (Mozilla/5.0; Institutional Real-Time News Wire)";

export class TreeNewsService {
  private ws: WebSocket | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastReceived = 0;
  private isStopped = false;
  private status: TreeNewsStatus = {
    status: "disconnected",
    connectedAt: null,
    lastMessageAt: null,
    messagesReceived: 0,
    articlesIngested: 0,
    reconnectAttempts: 0,
    error: null,
  };

  /**
   * Initializes TreeNewsService.
   * Auto-starts WebSocket connection and backfill in non-test environments.
   *
   * @param {boolean} [autoStart=true] - Whether to connect and backfill immediately.
   */
  constructor(autoStart: boolean = true) {
    const isTest = process.env.NODE_ENV === "test";
    const isExplicitlyDisabled = process.env.TREE_NEWS_ENABLED === "false";

    if (autoStart && !isTest && !isExplicitlyDisabled) {
      this.start().catch((err) => {
        console.error("[TreeNews] Failed to start:", err);
      });
    }
  }

  /**
   * Starts the Tree News service: runs immediate REST backfill and opens streaming WebSocket.
   *
   * @returns {Promise<void>}
   */
  public async start(): Promise<void> {
    this.isStopped = false;

    // 1. Initial immediate cold-start backfill from live REST feed
    try {
      const backfilledCount = await this.backfill(100);
      console.log(`[TreeNews] Initial live backfill completed. Ingested ${backfilledCount} authentic items.`);
    } catch (err) {
      console.warn("[TreeNews] Initial live backfill failed, continuing with WebSocket connection:", err);
    }

    // 2. Open sub-second live streaming WebSocket connection
    this.connectWebSocket();
  }

  /**
   * Retrieves recent articles from Tree of Alpha REST API and ingests non-duplicates.
   *
   * @param {number} [limit=100] - Number of recent headlines to fetch (max 500).
   * @returns {Promise<number>} Number of newly added non-duplicate articles.
   */
  public async backfill(limit: number = 100): Promise<number> {
    try {
      const url = `${TREE_REST_URL}?limit=${Math.min(limit, 500)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const items = (await res.json()) as TreeNewsRawItem[];
      if (!Array.isArray(items)) {
        return 0;
      }

      let added = 0;
      // Ingest in chronological order (oldest first) so memory array stores newest first
      const chronologicallyOrdered = [...items].reverse();
      for (const item of chronologicallyOrdered) {
        const article = this.processRawItem(item);
        if (article) {
          added++;
          this.status.articlesIngested++;
        }
      }

      return added;
    } catch (err) {
      console.error("[TreeNews] REST backfill error:", err);
      throw err;
    }
  }

  /**
   * Establishes low-latency WebSocket connection to Tree of Alpha streaming tape.
   */
  public connectWebSocket(): void {
    if (this.isStopped) return;

    if (this.ws) {
      try {
        this.ws.terminate();
      } catch {
        // Suppress termination errors
      }
      this.ws = null;
    }

    this.status.status = "connecting";
    console.log(`[TreeNews] Connecting to streaming tape at ${TREE_WS_URL}...`);

    try {
      this.ws = new WebSocket(TREE_WS_URL, {
        headers: {
          "User-Agent": USER_AGENT,
        },
      });

      this.ws.on("open", () => {
        this.status.status = "connected";
        this.status.connectedAt = new Date().toISOString();
        this.status.error = null;
        this.lastReceived = Date.now();
        console.log(`[TreeNews] WebSocket connected to ${TREE_WS_URL}. Streaming live news tape.`);

        // Reset reconnect attempts after 10s of connection stability
        setTimeout(() => {
          if (this.status.status === "connected") {
            this.status.reconnectAttempts = 0;
          }
        }, 10000);

        this.startHeartbeat();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        this.lastReceived = Date.now();
        this.status.messagesReceived++;
        this.status.lastMessageAt = new Date().toISOString();

        const raw = data.toString();

        // Handle keepalive pings/pongs
        if (raw === "ping") {
          try {
            this.ws?.send("pong");
          } catch {
            // Ignore send failure
          }
          return;
        }

        if (raw === "pong") {
          return;
        }

        try {
          const item = JSON.parse(raw) as TreeNewsRawItem;
          const article = this.processRawItem(item);
          if (article) {
            this.status.articlesIngested++;
          }
        } catch (err) {
          // Non-JSON message or malformed event
          console.warn("[TreeNews] Could not parse WS message:", err);
        }
      });

      this.ws.on("error", (err: Error) => {
        console.error("[TreeNews] WebSocket error:", err.message);
        this.status.status = "error";
        this.status.error = err.message;
      });

      this.ws.on("close", (code: number, reason: Buffer) => {
        this.stopHeartbeat();
        this.status.status = "disconnected";
        console.warn(`[TreeNews] WebSocket closed (code ${code}): ${reason.toString() || "No reason"}`);

        if (!this.isStopped) {
          this.scheduleReconnect();
        }
      });
    } catch (err: any) {
      console.error("[TreeNews] Connection initialization error:", err);
      this.status.status = "error";
      this.status.error = err?.message || String(err);
      this.scheduleReconnect();
    }
  }

  /**
   * Heartbeat keepalive checking if stream is idle and sending ping frames.
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        if (Date.now() > this.lastReceived + 10000) {
          try {
            this.ws.send("ping");
          } catch {
            // Socket write failed
          }
        }
      }
    }, 5000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedules reconnection with exponential backoff (2s up to max 30s).
   */
  private scheduleReconnect(): void {
    if (this.isStopped) return;
    if (this.reconnectTimer) return;

    this.status.reconnectAttempts++;
    const delay = Math.min(2000 * Math.pow(1.5, this.status.reconnectAttempts - 1), 30000);
    console.log(`[TreeNews] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this.status.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, delay);
  }

  /**
   * Normalizes and enriches a raw Tree of Alpha payload into a WireForge NewsArticle,
   * passing it to globalNewsAggregator for deduplication and client broadcast.
   *
   * @param {TreeNewsRawItem} item - The raw payload from Tree News.
   * @returns {NewsArticle | null} The added article, or null if duplicate/invalid.
   */
  public processRawItem(item: TreeNewsRawItem): NewsArticle | null {
    const rawTitle = (item.title || item.en || "").trim();
    if (!rawTitle) return null;

    // Clean title string: normalize whitespace and remove unescaped HTML entities
    const cleanTitle = rawTitle
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // 1. Resolve canonical source tag
    let sourceName = item.sourceName || "";
    if (!sourceName) {
      if (item.source === "usGov") sourceName = "US Government";
      else if (item.source === "Blogs") sourceName = "Market Wire";
      else if (item.source === "Twitter") sourceName = "Tree News (X)";
      else sourceName = item.source || "Tree News";
    }

    // 2. Extract tickers & crypto symbols
    const tickers: string[] = [];
    const tickerMatches = cleanTitle.match(/\$([A-Z]{1,6})\b/g);
    if (tickerMatches) {
      for (const t of tickerMatches) {
        const sym = t.replace("$", "").toUpperCase();
        if (!tickers.includes(sym)) tickers.push(sym);
      }
    }

    // Extract crypto suggestions from Tree of Alpha's algorithmic resolver
    if (item.suggestions && Array.isArray(item.suggestions)) {
      for (const s of item.suggestions) {
        if (s.coin && !tickers.includes(s.coin.toUpperCase())) {
          tickers.push(s.coin.toUpperCase());
        }
      }
    }

    // Match high-impact US mega-caps if explicitly referenced with word boundaries
    const WATCH_TICKERS = [
      "NVDA", "AAPL", "MSFT", "TSLA", "AMZN", "GOOGL", "META",
      "SPY", "QQQ", "SMCI", "PLTR", "LLY", "AMD", "MU", "BA", "NFLX"
    ];
    for (const sym of WATCH_TICKERS) {
      if (new RegExp(`\\b${sym}\\b`, "i").test(cleanTitle) && !tickers.includes(sym)) {
        tickers.push(sym);
      }
    }

    // Add institutional macro tags for regulatory / government sources
    const upperSource = sourceName.toUpperCase();
    if (upperSource.includes("FEDERAL RESERVE") || upperSource.includes("FED")) {
      if (!tickers.includes("FED")) tickers.push("FED");
      if (!tickers.includes("MACRO")) tickers.push("MACRO");
    } else if (upperSource.includes("SEC")) {
      if (!tickers.includes("SEC")) tickers.push("SEC");
    } else if (upperSource.includes("WHITEHOUSE")) {
      if (!tickers.includes("MACRO")) tickers.push("MACRO");
      if (!tickers.includes("USGOV")) tickers.push("USGOV");
    } else if (upperSource.includes("FEDERAL REGISTER")) {
      if (!tickers.includes("REG")) tickers.push("REG");
    }

    // 3. Classify Category
    const lower = cleanTitle.toLowerCase();
    let category: NewsCategory = "general";

    if (item.source === "usGov") {
      if (upperSource.includes("SEC") || lower.startsWith("sec:") || lower.includes("sec approval")) {
        category = "sec";
      } else {
        category = "macro";
      }
    } else if (item.source === "Twitter" || item.info?.twitterId) {
      if (/fed|inflation|interest rate|cpi|treasury|tariff|central bank/i.test(lower)) {
        category = "macro";
      } else if (/fda|clinical|drug|trial|biotech|pdufa/i.test(lower)) {
        category = "fda";
      } else {
        category = "social";
      }
    } else {
      if (/earnings|quarterly profit|revenue|guidance|eps|quarter/i.test(lower)) {
        category = "earnings";
      } else if (/fda|pdufa|clinical trial|phase [123]|biotech|drug approval|clearance/i.test(lower)) {
        category = "fda";
      } else if (/upgrade|downgrade|price target|analyst/i.test(lower)) {
        category = "ratings";
      } else if (/fed|inflation|interest rate|cpi|treasury|tariff|debt ceiling|unemployment|recession/i.test(lower)) {
        category = "macro";
      } else if (/merger|acquisition|buyout|takeover|acquire/i.test(lower)) {
        category = "ma";
      } else if (/guidance|outlook|forecast/i.test(lower)) {
        category = "guidance";
      } else {
        category = "general";
      }
    }

    // 4. Sentiment Detection
    let sentiment: Sentiment = "neutral";
    if (/surges|beats|rallies|jumps|soars|upgrades|bull|record high|approval|cleared|wins|raises guidance/i.test(lower)) {
      sentiment = "bullish";
    } else if (/plunges|misses|drops|falls|halves|downgrade|bear|warning|slumps|tumbles|sued|halts|cuts guidance|ban|prohibits|charges/i.test(lower)) {
      sentiment = "bearish";
    }

    // 5. Impact Assessment (High-Impact triggers Audio Squawk)
    const isGovSource = item.source === "usGov" || upperSource.includes("FED") || upperSource.includes("SEC");
    const isBreakingKeyword = /breaking|urgent|rate hike|rate cut|emergency|crisis|fed decision|tariff|sec approval|etf approval/i.test(lower);
    const isKeyPolitical = /donald j\. trump|@realdonaldtrump|elon musk|@elonmusk/i.test(cleanTitle);

    let impact: NewsImpact = "medium";
    if (isGovSource || isBreakingKeyword || isKeyPolitical) {
      impact = "high";
    } else if (item.source === "Twitter" && tickers.length === 0) {
      impact = "low";
    }

    const sourceTag = sourceName;
    const url = item.url || (item.info?.twitterId ? `https://x.com/i/status/${item._id}` : undefined);

    return globalNewsAggregator.addArticle({
      title: cleanTitle,
      summary: cleanTitle.length > 200 ? cleanTitle.slice(0, 197) + "..." : cleanTitle,
      content: `Source: ${sourceTag}\nURL: ${url || "N/A"}\n\n${cleanTitle}`,
      tickers: tickers.length > 0 ? tickers : ["MARKET"],
      category,
      impact,
      sentiment,
      source: sourceTag,
      url,
    });
  }

  /**
   * Retrieves current diagnostic status of the Tree News streaming service.
   *
   * @returns {TreeNewsStatus}
   */
  public getStatus(): TreeNewsStatus {
    return { ...this.status };
  }

  /**
   * Closes the streaming WebSocket and halts timers cleanly.
   */
  public stop(): void {
    this.isStopped = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Suppress close error
      }
      this.ws = null;
    }
    this.status.status = "disconnected";
  }
}

export const globalTreeNewsService = new TreeNewsService();
