import { MarketSignal, MarketSignalType, Sentiment } from "@wireforge/shared";

const INITIAL_SIGNALS: MarketSignal[] = [
  {
    id: "sig-1",
    timestamp: Date.now() - 30000,
    timeStr: new Date(Date.now() - 30000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "NVDA",
    type: "52w_high",
    title: "New 52-Week All-Time High",
    description: "NVIDIA breaches prior high on aggressive volume.",
    metric: "$141.80 (+4.2%)",
    sentiment: "bullish",
  },
  {
    id: "sig-2",
    timestamp: Date.now() - 75000,
    timeStr: new Date(Date.now() - 75000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "VKTX",
    type: "rvol_spike",
    title: "Extreme Relative Volume Surge",
    description: "Relative Volume exceeding 5.4x 30-day average following oral obesity trial FDA approval.",
    metric: "RVOL 5.4x",
    sentiment: "bullish",
  },
  {
    id: "sig-3",
    timestamp: Date.now() - 140000,
    timeStr: new Date(Date.now() - 140000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "IONQ",
    type: "price_spike",
    title: "Rapid 5-Minute Momentum Spike",
    description: "Quantum computing peer group surging on defense contract announcement.",
    metric: "+6.8% (5m)",
    sentiment: "bullish",
  },
  {
    id: "sig-4",
    timestamp: Date.now() - 210000,
    timeStr: new Date(Date.now() - 210000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "GCT",
    type: "luld_halt",
    title: "Trading Paused — LULD Circuit Breaker",
    description: "Limit Up / Limit Down volatility trading pause on NASDAQ.",
    metric: "PAUSED (LULD)",
    sentiment: "neutral",
  },
  {
    id: "sig-5",
    timestamp: Date.now() - 290000,
    timeStr: new Date(Date.now() - 290000).toLocaleTimeString("en-US", { hour12: false }),
    ticker: "SPY",
    type: "vwap_cross",
    title: "Session VWAP Bullish Reclaim",
    description: "S&P 500 ETF reclaims institutional daily VWAP with positive delta volume.",
    metric: "VWAP $568.90",
    sentiment: "bullish",
  },
];

export class SignalsMonitor {
  private signals: MarketSignal[] = [...INITIAL_SIGNALS];
  private listeners: ((signal: MarketSignal) => void)[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitor();
  }

  getSignals(limit = 50): MarketSignal[] {
    return this.signals.slice(0, limit);
  }

  addSignal(signal: Omit<MarketSignal, "id" | "timestamp" | "timeStr">): MarketSignal {
    const now = Date.now();
    const full: MarketSignal = {
      ...signal,
      id: `sig-${now}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      timeStr: new Date(now).toLocaleTimeString("en-US", { hour12: false }),
    };

    this.signals.unshift(full);
    if (this.signals.length > 200) {
      this.signals.pop();
    }

    this.notifyListeners(full);
    return full;
  }

  onNewSignal(cb: (sig: MarketSignal) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners(sig: MarketSignal) {
    for (const listener of this.listeners) {
      try {
        listener(sig);
      } catch (err) {
        console.error("[SignalsMonitor] listener error:", err);
      }
    }
  }

  private startMonitor() {
    const ROTATION = [
      { ticker: "TSLA", type: "price_spike" as const, title: "1-Minute Volume Velocity Spike", metric: "+1.9% (1m)", desc: "Accelerating block buying through session VWAP.", sent: "bullish" as const },
      { ticker: "AMD", type: "rvol_spike" as const, title: "RVOL Breakout > 2.5x", metric: "RVOL 2.8x", desc: "Data center server socket market share updates.", sent: "bullish" as const },
      { ticker: "SMCI", type: "vwap_cross" as const, title: "Reclaimed Session VWAP", metric: "VWAP $482.00", desc: "Sustained call delta lift across strike ladder.", sent: "bullish" as const },
      { ticker: "PLTR", type: "52w_high" as const, title: "Intraday New High of Day", metric: "$42.45 (+5.1%)", desc: "Enterprise defense contract flow confirmation.", sent: "bullish" as const },
    ];

    let idx = 0;
    this.timer = setInterval(() => {
      const item = ROTATION[idx % ROTATION.length];
      this.addSignal({
        ticker: item.ticker,
        type: item.type,
        title: item.title,
        description: item.desc,
        metric: item.metric,
        sentiment: item.sent,
      });
      idx++;
    }, 35000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

export const globalSignalsMonitor = new SignalsMonitor();
