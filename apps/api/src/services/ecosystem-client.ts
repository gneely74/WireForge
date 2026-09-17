import { EcosystemHealth } from "@wireforge/shared";

export class EcosystemClient {
  private tradingAgentUrl: string;
  private chartforgeUrl: string;
  private thetadataUrl: string;
  private edgarUrl: string;

  constructor() {
    this.tradingAgentUrl = (process.env.TRADING_AGENT_API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");
    this.chartforgeUrl = (process.env.CHARTFORGE_API_URL || "http://127.0.0.1:5188").replace(/\/+$/, "");
    this.thetadataUrl = (process.env.THETADATA_API_URL || "http://127.0.0.1:25503").replace(/\/+$/, "");
    this.edgarUrl = (process.env.EDGAR_API_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
  }

  async getHealth(): Promise<EcosystemHealth> {
    const health: EcosystemHealth = {
      tradingAgent: { url: this.tradingAgentUrl, connected: false },
      chartforge: { url: this.chartforgeUrl, connected: false },
      thetadata: { url: this.thetadataUrl, connected: false },
      edgar: { url: this.edgarUrl, connected: false },
    };

    // 1. Check Trading Agent (:8080)
    try {
      const res = await fetch(`${this.tradingAgentUrl}/api/darkpool/status?symbol=SPY`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        health.tradingAgent.connected = true;
        health.tradingAgent.dixSentiment = data.regime || undefined;
        health.tradingAgent.dixValue = typeof data.current_dix === "number" ? data.current_dix : undefined;
      }
    } catch {
      // Offline
    }

    // GEX check on Trading Agent
    try {
      const res = await fetch(`${this.tradingAgentUrl}/api/gex/status?symbol=SPY`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const gex = await res.json();
        health.tradingAgent.gexCallWall = typeof gex.call_wall === "number" ? gex.call_wall : undefined;
        health.tradingAgent.gexPutWall = typeof gex.put_wall === "number" ? gex.put_wall : undefined;
        health.tradingAgent.gexZeroFlip = typeof gex.zero_gamma === "number" ? gex.zero_gamma : undefined;
      }
    } catch {
      // Offline - never use simulated or fallback numbers
    }

    // 2. Check ChartForge (:5188)
    try {
      const res = await fetch(`${this.chartforgeUrl}/v1/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        health.chartforge.connected = true;
        health.chartforge.version = data.version || "1.0.0";
      }
    } catch {
      // Offline fallback
    }

    // 3. Check ThetaData (:25503)
    try {
      const res = await fetch(`${this.thetadataUrl}/v3/option/list/expirations?symbol=SPY`, {
        signal: AbortSignal.timeout(2000),
      });
      // ThetaTerminal v3 responds with 200 OK
      health.thetadata.connected = res.ok || (res.status < 500 && res.status !== 410);
    } catch {
      health.thetadata.connected = false;
    }

    return health;
  }

  getChartforgeUrl(): string {
    return this.chartforgeUrl;
  }

  getTradingAgentUrl(): string {
    return this.tradingAgentUrl;
  }
}

export const globalEcosystemClient = new EcosystemClient();
