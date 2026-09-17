import { MarketSignal, MarketSignalType, Sentiment } from "@wireforge/shared";

export class SignalsMonitor {
  private signals: MarketSignal[] = [];
  private listeners: ((signal: MarketSignal) => void)[] = [];

  constructor() {
    // Zero simulated signals on boot; strictly event-driven from authentic market feeds
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

  stop() {
    // No background timers to clear
  }
}

export const globalSignalsMonitor = new SignalsMonitor();
