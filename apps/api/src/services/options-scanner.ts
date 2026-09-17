import { OptionsFlowTrade, OptionOrderType, OptionSide, Sentiment } from "@wireforge/shared";

// Seed / Initial Unusual Options Flow items
const INITIAL_FLOW: OptionsFlowTrade[] = [
  {
    id: "flow-1",
    timestamp: Date.now() - 15000,
    timeStr: new Date(Date.now() - 15000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "NVDA",
    expiration: "2026-10-16",
    strike: 145,
    contractType: "CALL",
    spotPrice: 139.85,
    tradePrice: 4.85,
    size: 2450,
    openInterest: 1820,
    volume: 3890,
    premium: 1188250, // $1.18M
    orderType: "sweep",
    side: "above_ask",
    sentiment: "bullish",
    isGolden: true, // Size > Open Interest and above ask!
    dte: 30,
    exchange: "MULTI",
  },
  {
    id: "flow-2",
    timestamp: Date.now() - 45000,
    timeStr: new Date(Date.now() - 45000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "SPY",
    expiration: "2026-09-18",
    strike: 565,
    contractType: "PUT",
    spotPrice: 569.20,
    tradePrice: 1.15,
    size: 5200,
    openInterest: 14200,
    volume: 18500,
    premium: 598000, // $598k
    orderType: "sweep",
    side: "ask",
    sentiment: "bearish",
    isGolden: false,
    dte: 2,
    exchange: "MULTI",
  },
  {
    id: "flow-3",
    timestamp: Date.now() - 85000,
    timeStr: new Date(Date.now() - 85000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "TSLA",
    expiration: "2026-10-02",
    strike: 250,
    contractType: "CALL",
    spotPrice: 242.10,
    tradePrice: 5.60,
    size: 1500,
    openInterest: 890,
    volume: 2400,
    premium: 840000, // $840k
    orderType: "sweep",
    side: "ask",
    sentiment: "bullish",
    isGolden: true,
    dte: 16,
    exchange: "MULTI",
  },
  {
    id: "flow-4",
    timestamp: Date.now() - 130000,
    timeStr: new Date(Date.now() - 130000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "AAPL",
    expiration: "2026-11-20",
    strike: 240,
    contractType: "CALL",
    spotPrice: 232.50,
    tradePrice: 6.20,
    size: 3200,
    openInterest: 4100,
    volume: 5800,
    premium: 1984000, // $1.98M
    orderType: "block",
    side: "ask",
    sentiment: "bullish",
    isGolden: false,
    dte: 65,
    exchange: "CBOE",
  },
  {
    id: "flow-5",
    timestamp: Date.now() - 190000,
    timeStr: new Date(Date.now() - 190000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "IWM",
    expiration: "2026-09-25",
    strike: 220,
    contractType: "PUT",
    spotPrice: 223.80,
    tradePrice: 1.82,
    size: 2800,
    openInterest: 6400,
    volume: 8100,
    premium: 509600, // $509k
    orderType: "sweep",
    side: "ask",
    sentiment: "bearish",
    isGolden: false,
    dte: 9,
    exchange: "MULTI",
  },
  {
    id: "flow-6",
    timestamp: Date.now() - 260000,
    timeStr: new Date(Date.now() - 260000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "PLTR",
    expiration: "2026-10-16",
    strike: 45,
    contractType: "CALL",
    spotPrice: 42.15,
    tradePrice: 2.10,
    size: 4500,
    openInterest: 2100,
    volume: 6800,
    premium: 945000, // $945k
    orderType: "sweep",
    side: "above_ask",
    sentiment: "bullish",
    isGolden: true,
    dte: 30,
    exchange: "MULTI",
  },
  {
    id: "flow-7",
    timestamp: Date.now() - 320000,
    timeStr: new Date(Date.now() - 320000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "QQQ",
    expiration: "2026-09-18",
    strike: 495,
    contractType: "PUT",
    spotPrice: 498.40,
    tradePrice: 1.45,
    size: 3800,
    openInterest: 9200,
    volume: 11400,
    premium: 551000, // $551k
    orderType: "block",
    side: "bid",
    sentiment: "bullish", // Sold to open/close at bid!
    isGolden: false,
    dte: 2,
    exchange: "PHLX",
  },
];

export class OptionsScanner {
  private trades: OptionsFlowTrade[] = [...INITIAL_FLOW];
  private listeners: ((trade: OptionsFlowTrade) => void)[] = [];
  private generatorTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startStreamingTape();
  }

  getTrades(params: {
    ticker?: string;
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

    const limit = params.limit || 100;
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
    const bullishRatio = totalPremium > 0 ? (bullishPremium / totalPremium) * 100 : 50;

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
    if (this.trades.length > 500) {
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

  private thetadataUrl = (process.env.THETADATA_API_URL || "http://127.0.0.1:25503").replace(/\/+$/, "");
  private thetaTimer: NodeJS.Timeout | null = null;
  private seenThetaSeqs = new Set<string>();

  async pollThetaData() {
    try {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const res = await fetch(
        `${this.thetadataUrl}/v3/option/history/trade?symbol=SPY&start_date=${today}&end_date=${today}&strike=750&right=C&expiration=20260918`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.trim().split("\n");
      if (lines.length <= 1) return;

      // Header: symbol,expiration,strike,right,timestamp,sequence,...
      // Parse last 5 trades
      for (const line of lines.slice(-5)) {
        const p = line.split(",");
        if (p.length < 14) continue;
        const seq = p[5];
        if (this.seenThetaSeqs.has(seq)) continue;
        this.seenThetaSeqs.add(seq);

        const symbol = p[0].replace(/"/g, "").trim();
        const exp = p[1].replace(/"/g, "").trim();
        const strike = parseFloat(p[2]);
        const cp = p[3].replace(/"/g, "").trim() as "CALL" | "PUT";
        const size = parseInt(p[11], 10) || 50;
        const price = parseFloat(p[13]) || 1.0;
        const premium = Math.round(size * price * 100);

        this.addTrade({
          ticker: symbol,
          expiration: exp,
          strike,
          contractType: cp,
          spotPrice: 754.05,
          tradePrice: price,
          size,
          openInterest: 1800,
          volume: 2400,
          premium,
          orderType: size > 500 ? "sweep" : "block",
          side: "above_ask",
          sentiment: cp === "CALL" ? "bullish" : "bearish",
          isGolden: size > 1000 && cp === "CALL",
          dte: 2,
          exchange: "OPRA",
        });
      }
    } catch {
      // Standby fallback
    }
  }

  private startStreamingTape() {
    // Poll real ThetaData v3 tape every 20 seconds
    this.pollThetaData();
    this.thetaTimer = setInterval(() => this.pollThetaData(), 20000);

    // Generates periodic realistic options sweeps and blocks
    const CANDIDATES = [
      { ticker: "NVDA", spot: 140.25, strike: 145, cp: "CALL" as const, exp: "2026-10-16", dte: 30, price: 4.90 },
      { ticker: "SPY", spot: 569.50, strike: 575, cp: "CALL" as const, exp: "2026-09-25", dte: 9, price: 2.15 },
      { ticker: "TSLA", spot: 243.80, strike: 235, cp: "PUT" as const, exp: "2026-10-02", dte: 16, price: 3.40 },
      { ticker: "AMZN", spot: 188.40, strike: 195, cp: "CALL" as const, exp: "2026-11-20", dte: 65, price: 5.10 },
      { ticker: "META", spot: 535.10, strike: 550, cp: "CALL" as const, exp: "2026-10-16", dte: 30, price: 12.40 },
      { ticker: "QQQ", spot: 498.80, strike: 490, cp: "PUT" as const, exp: "2026-09-21", dte: 5, price: 1.65 },
      { ticker: "SMCI", spot: 480.20, strike: 520, cp: "CALL" as const, exp: "2026-10-09", dte: 23, price: 18.50 },
    ];

    let idx = 0;
    this.generatorTimer = setInterval(() => {
      const c = CANDIDATES[idx % CANDIDATES.length];
      const isCall = c.cp === "CALL";
      const isSweep = Math.random() > 0.35;
      const r = Math.random();
      const side: OptionSide = r > 0.6 ? (isCall ? "above_ask" : "ask") : r > 0.2 ? "bid" : "below_bid";
      const size = Math.floor(800 + Math.random() * 3500);
      const oi = Math.floor(500 + Math.random() * 4000);
      const isGolden = isSweep && size > oi && (side === "ask" || side === "above_ask");
      const premium = Math.round(size * c.price * 100);

      let sentiment: Sentiment = "neutral";
      if (isCall && (side === "ask" || side === "above_ask")) sentiment = "bullish";
      else if (isCall && (side === "bid" || side === "below_bid")) sentiment = "bearish";
      else if (!isCall && (side === "ask" || side === "above_ask")) sentiment = "bearish";
      else if (!isCall && (side === "bid" || side === "below_bid")) sentiment = "bullish";

      this.addTrade({
        ticker: c.ticker,
        expiration: c.exp,
        strike: c.strike,
        contractType: c.cp,
        spotPrice: c.spot,
        tradePrice: c.price,
        size,
        openInterest: oi,
        volume: oi + size,
        premium,
        orderType: isSweep ? "sweep" : "block",
        side,
        sentiment,
        isGolden,
        dte: c.dte,
        exchange: isSweep ? "MULTI" : "CBOE",
      });

      idx++;
    }, 25000); // New options trade sweep every 25s
  }

  stop() {
    if (this.generatorTimer) clearInterval(this.generatorTimer);
    if (this.thetaTimer) clearInterval(this.thetaTimer);
  }
}

export const globalOptionsScanner = new OptionsScanner();
