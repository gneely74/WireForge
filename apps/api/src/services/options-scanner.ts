import { OptionsFlowTrade, OptionOrderType, OptionSide, Sentiment } from "@wireforge/shared";
import { globalWatchlistsService } from "./watchlists-service.js";

const CORE_SYMBOLS = ["SPY", "QQQ", "IWM", "NVDA", "TSLA", "AAPL", "AMD", "META", "AMZN", "MSFT"];

const OPRA_EXCHANGE_MAP: Record<string, string> = {
  "4": "EMERALD",
  "5": "MRX",
  "6": "GEMINI",
  "7": "PEARL",
  "9": "MIAX",
  "11": "AMEX",
  "18": "PHLX",
  "22": "BOX",
  "31": "MPRL",
  "43": "EDGX",
  "60": "ISE",
  "65": "ARCA",
  "69": "C2",
  "73": "BATS",
  "76": "CBOE",
};

export class OptionsScanner {
  private trades: OptionsFlowTrade[] = [];
  private listeners: ((trade: OptionsFlowTrade) => void)[] = [];
  private thetadataUrl = (process.env.THETADATA_API_URL || "http://127.0.0.1:25503").replace(/\/+$/, "");
  private tradingAgentUrl = (process.env.TRADING_AGENT_API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");
  private thetaTimer: NodeJS.Timeout | null = null;
  private seenThetaSeqs = new Set<string>();
  private isScanning = false;
  private currentSymbolIndex = 0;

  // Dynamic caches
  private expirationsCache = new Map<string, { expirations: string[]; expiresAt: number }>();
  private strikesCache = new Map<string, { strikes: number[]; expiresAt: number }>();
  private spotPriceCache = new Map<string, { price: number; expiresAt: number }>();

  constructor() {
    this.startStreamingTape();
  }

  getTrades(params: {
    ticker?: string;
    watchlistSymbols?: string[];
    minPremium?: number;
    sentiment?: Sentiment;
    orderType?: OptionOrderType;
    isGolden?: boolean;
    limit?: number;
  }): OptionsFlowTrade[] {
    let list = [...this.trades];

    if (params.ticker) {
      const t = params.ticker.toUpperCase();
      list = list.filter((x) => x.ticker === t);
    }

    if (params.watchlistSymbols && params.watchlistSymbols.length > 0) {
      const allowed = new Set(params.watchlistSymbols.map((s) => s.toUpperCase()));
      list = list.filter((x) => allowed.has(x.ticker));
    }

    if (params.minPremium && params.minPremium > 0) {
      list = list.filter((x) => x.premium >= params.minPremium!);
    }

    if (params.sentiment && params.sentiment !== "neutral") {
      list = list.filter((x) => x.sentiment === params.sentiment);
    }

    if (params.orderType) {
      list = list.filter((x) => x.orderType === params.orderType);
    }

    if (params.isGolden !== undefined) {
      list = list.filter((x) => x.isGolden === params.isGolden);
    }

    const limit = params.limit || 500;
    return list.slice(0, limit);
  }

  getStats(ticker?: string) {
    let list = this.trades;
    if (ticker) {
      const t = ticker.toUpperCase();
      list = list.filter((x) => x.ticker === t);
    }

    let bullishPremium = 0;
    let bearishPremium = 0;
    let goldenCount = 0;

    for (const t of list) {
      if (t.sentiment === "bullish") bullishPremium += t.premium;
      if (t.sentiment === "bearish") bearishPremium += t.premium;
      if (t.isGolden) goldenCount++;
    }

    const totalPremium = bullishPremium + bearishPremium;
    const bullishRatio = totalPremium > 0 ? (bullishPremium / totalPremium) * 100 : 0;

    return {
      totalTrades: list.length,
      bullishPremium,
      bearishPremium,
      totalPremium,
      bullishRatio: Number(bullishRatio.toFixed(1)),
      goldenCount,
    };
  }

  addTrade(trade: Omit<OptionsFlowTrade, "id" | "timestamp" | "timeStr">): OptionsFlowTrade {
    const now = Date.now();
    const full: OptionsFlowTrade = {
      ...trade,
      id: `flow-${now}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      timeStr: new Date(now).toLocaleTimeString("en-US", { hour12: false }),
    };

    this.trades.unshift(full);
    if (this.trades.length > 1500) {
      this.trades.pop();
    }

    this.notifyListeners(full);
    return full;
  }

  onNewTrade(cb: (trade: OptionsFlowTrade) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners(trade: OptionsFlowTrade) {
    for (const listener of this.listeners) {
      try {
        listener(trade);
      } catch (err) {
        console.error("[OptionsScanner] listener error:", err);
      }
    }
  }

  // ──────────────── Dynamic ThetaData Helpers ────────────────

  private getTodayCompact(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, "");
  }

  private getTodayISO(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private async getNearExpirations(symbol: string): Promise<string[]> {
    const cached = this.expirationsCache.get(symbol);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.expirations;
    }

    try {
      const res = await fetch(`${this.thetadataUrl}/v3/option/list/expirations?symbol=${symbol}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (!res.ok) return [];
      const text = await res.text();
      const todayISO = this.getTodayISO();

      const lines = text.trim().split("\n");
      const validExps: string[] = [];
      for (const line of lines) {
        const parts = line.split(",");
        if (parts.length < 2) continue;
        const exp = parts[1].replace(/"/g, "").trim();
        if (exp >= todayISO && exp.length === 10) {
          validExps.push(exp);
        }
      }

      validExps.sort();
      // Keep nearest 2 active expirations (0 DTE / weekly)
      const nearExps = validExps.slice(0, 2);
      if (nearExps.length > 0) {
        this.expirationsCache.set(symbol, {
          expirations: nearExps,
          expiresAt: now + 4 * 60 * 60 * 1000, // 4 hours
        });
      }
      return nearExps;
    } catch {
      return [];
    }
  }

  private async getSpotPrice(symbol: string): Promise<number | null> {
    const cached = this.spotPriceCache.get(symbol);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.price;
    }

    // 1. Try RadarScreen snapshot from Trading Agent (:8080)
    try {
      const res = await fetch(`${this.tradingAgentUrl}/api/radarscreen/data?universe=all`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.data || [];
        for (const item of items) {
          if (item.symbol && item.symbol.toUpperCase() === symbol && typeof item.last === "number" && item.last > 0) {
            this.spotPriceCache.set(symbol, { price: item.last, expiresAt: now + 30000 });
            return item.last;
          }
        }
      }
    } catch {}

    // 2. Fallback to ThetaData 5m OHLC bar
    try {
      const today = this.getTodayCompact();
      const res = await fetch(
        `${this.thetadataUrl}/v3/stock/history/ohlc?symbol=${symbol}&interval=5m&start_date=${today}&end_date=${today}`,
        { signal: AbortSignal.timeout(2500) }
      );
      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split("\n");
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1];
          const parts = lastLine.split(",");
          if (parts.length >= 5) {
            const close = parseFloat(parts[4]);
            if (!isNaN(close) && close > 0) {
              this.spotPriceCache.set(symbol, { price: close, expiresAt: now + 30000 });
              return close;
            }
          }
        }
      }
    } catch {}

    return null;
  }

  private async getATMStrikes(symbol: string, expiration: string, spotPrice: number): Promise<number[]> {
    const expCompact = expiration.replace(/-/g, "");
    const cacheKey = `${symbol}:${expCompact}`;
    const cached = this.strikesCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.strikes;
    }

    try {
      const res = await fetch(
        `${this.thetadataUrl}/v3/option/list/strikes?symbol=${symbol}&expiration=${expCompact}`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (!res.ok) return [];
      const text = await res.text();
      const lines = text.trim().split("\n");
      const strikes: number[] = [];

      for (const line of lines) {
        const parts = line.split(",");
        if (parts.length < 2) continue;
        const val = parseFloat(parts[1]);
        if (!isNaN(val) && val > 0) {
          strikes.push(val);
        }
      }

      if (strikes.length === 0) return [];

      // Sort by distance to spot price
      strikes.sort((a, b) => Math.abs(a - spotPrice) - Math.abs(b - spotPrice));

      // Pick top 3 strikes closest to spot (typically 1 ITM, 1 ATM, 1 OTM)
      const selected = strikes.slice(0, 3).sort((a, b) => a - b);
      this.strikesCache.set(cacheKey, {
        strikes: selected,
        expiresAt: now + 2 * 60 * 60 * 1000, // 2 hours
      });
      return selected;
    } catch {
      return [];
    }
  }

  // ──────────────── Live Tape Ingestion ────────────────

  private async fetchContractTrades(
    symbol: string,
    expiration: string,
    strike: number,
    right: "C" | "P",
    spotPrice: number
  ): Promise<number> {
    try {
      const today = this.getTodayCompact();
      const expParam = expiration.replace(/-/g, "");
      const res = await fetch(
        `${this.thetadataUrl}/v3/option/history/trade?symbol=${symbol}&start_date=${today}&end_date=${today}&strike=${strike}&right=${right}&expiration=${expParam}`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (!res.ok) return 0;
      const text = await res.text();
      const lines = text.trim().split("\n");
      if (lines.length <= 1) return 0;

      // symbol,expiration,strike,right,timestamp,sequence,ext1,ext2,ext3,ext4,condition,size,exchange,price
      let ingestedCount = 0;
      const recentLines = lines.slice(-25);

      for (const line of recentLines) {
        const p = line.split(",");
        if (p.length < 14) continue;
        const seq = p[5];
        if (this.seenThetaSeqs.has(seq)) continue;
        this.seenThetaSeqs.add(seq);

        // Bound seen sequence set to prevent memory growth
        if (this.seenThetaSeqs.size > 50000) {
          const keep = Array.from(this.seenThetaSeqs).slice(20000);
          this.seenThetaSeqs = new Set(keep);
        }

        const size = parseInt(p[11], 10) || 1;
        const price = parseFloat(p[13]) || 0;
        const premium = Math.round(size * price * 100);

        // Skip negligible 1-lot retail noise unless price is large
        if (size < 5 && premium < 2500) continue;

        const condition = parseInt(p[10], 10) || 0;
        const exchangeCode = p[12]?.replace(/"/g, "").trim();
        const exchange = OPRA_EXCHANGE_MAP[exchangeCode] || "OPRA";

        // Condition 18 = Intermarket Sweep Order (ISO)
        const isSweep = condition === 18 || size >= 300;
        const orderType: OptionOrderType = isSweep ? "sweep" : "block";

        const cp = right === "C" ? "CALL" : "PUT";
        const sentiment: Sentiment = right === "C" ? "bullish" : "bearish";
        const isGolden = premium >= 1000000 || (size >= 1000 && right === "C" && premium >= 250000);

        // Calculate DTE
        const expDate = new Date(expiration).getTime();
        const now = Date.now();
        const dte = Math.max(0, Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)));

        this.addTrade({
          ticker: symbol,
          expiration,
          strike,
          contractType: cp,
          spotPrice,
          tradePrice: price,
          size,
          openInterest: Math.max(1000, size * 2),
          volume: Math.max(2000, size * 3),
          premium,
          orderType,
          side: "above_ask",
          sentiment,
          isGolden,
          dte,
          exchange,
        });
        ingestedCount++;
      }

      return ingestedCount;
    } catch {
      return 0;
    }
  }

  private getMonitoredSymbols(): string[] {
    const symbols = new Set<string>(CORE_SYMBOLS);
    try {
      const watchlists = globalWatchlistsService.getAllWatchlists();
      for (const w of watchlists) {
        if (Array.isArray(w.symbols)) {
          for (const s of w.symbols) {
            const sym = s.trim().toUpperCase();
            if (sym && !sym.includes(".") && !sym.includes("/") && symbols.size < 25) {
              symbols.add(sym);
            }
          }
        }
      }
    } catch {}
    return Array.from(symbols);
  }

  async pollThetaData() {
    if (this.isScanning) return;
    this.isScanning = true;

    try {
      const symbols = this.getMonitoredSymbols();
      if (symbols.length === 0) return;

      // Select 2-3 symbols per pass to ensure snappy execution and adhere to ThetaData 4-request concurrency
      const batchSize = 2;
      const batch: string[] = [];
      for (let i = 0; i < batchSize; i++) {
        batch.push(symbols[(this.currentSymbolIndex + i) % symbols.length]);
      }
      this.currentSymbolIndex = (this.currentSymbolIndex + batchSize) % symbols.length;

      for (const symbol of batch) {
        const spotPrice = await this.getSpotPrice(symbol);
        if (!spotPrice) continue;

        const expirations = await this.getNearExpirations(symbol);
        if (expirations.length === 0) continue;

        // Primary near-term expiration
        const primaryExp = expirations[0];
        const strikes = await this.getATMStrikes(symbol, primaryExp, spotPrice);

        for (const strike of strikes) {
          // Poll Call and Put with gentle 60ms pacing
          await this.fetchContractTrades(symbol, primaryExp, strike, "C", spotPrice);
          await new Promise((r) => setTimeout(r, 60));
          await this.fetchContractTrades(symbol, primaryExp, strike, "P", spotPrice);
          await new Promise((r) => setTimeout(r, 60));
        }
      }
    } catch (err) {
      console.error("[OptionsScanner] poll error:", err);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Fast initial startup bootstrap across top symbols to immediately
   * populate the OPRA options flow terminal with authentic trades on launch.
   */
  async bootstrapTape() {
    const prioritySymbols = ["SPY", "QQQ", "NVDA", "TSLA", "AAPL"];
    for (const sym of prioritySymbols) {
      try {
        const spotPrice = await this.getSpotPrice(sym);
        if (!spotPrice) continue;
        const expirations = await this.getNearExpirations(sym);
        if (expirations.length === 0) continue;
        const primaryExp = expirations[0];
        const strikes = await this.getATMStrikes(sym, primaryExp, spotPrice);

        for (const strike of strikes) {
          await this.fetchContractTrades(sym, primaryExp, strike, "C", spotPrice);
          await new Promise((r) => setTimeout(r, 50));
          await this.fetchContractTrades(sym, primaryExp, strike, "P", spotPrice);
          await new Promise((r) => setTimeout(r, 50));
        }
      } catch {}
    }
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
    // Regular + Extended Tape session: Weekdays 8:30 AM - 5:00 PM Eastern Time
    return !isWeekend && (hour >= 8 && hour < 17);
  }

  private scheduleNextThetaPoll() {
    const isMarket = this.isMarketSessionActive();
    // 6 seconds during active trading hours, 60 seconds off-hours
    const delay = isMarket ? 6 * 1000 : 60 * 1000;
    this.thetaTimer = setTimeout(async () => {
      await this.pollThetaData();
      this.scheduleNextThetaPoll();
    }, delay);
  }

  private async startStreamingTape() {
    // 1. Instant bootstrap pass to populate terminal
    await this.bootstrapTape();
    // 2. Continuous adaptive loop
    this.scheduleNextThetaPoll();
  }

  stop() {
    if (this.thetaTimer) clearInterval(this.thetaTimer);
  }
}

export const globalOptionsScanner = new OptionsScanner();
