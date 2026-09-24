import { EcosystemHealth } from "@wireforge/shared";

export class EcosystemClient {
  private tradingAgentUrl: string;
  private chartforgeUrl: string;
  private thetadataUrl: string;
  private edgarUrl: string;
  private cachedHealth: EcosystemHealth | null = null;
  private cachedHealthAt: number = 0;

  constructor() {
    this.tradingAgentUrl = (process.env.TRADING_AGENT_API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");
    this.chartforgeUrl = (process.env.CHARTFORGE_API_URL || "http://127.0.0.1:5188").replace(/\/+$/, "");
    this.thetadataUrl = (process.env.THETADATA_API_URL || "http://127.0.0.1:25503").replace(/\/+$/, "");
    this.edgarUrl = (process.env.EDGAR_API_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
  }

  async getHealth(): Promise<EcosystemHealth> {
    const now = Date.now();
    if (this.cachedHealth && now - this.cachedHealthAt < 10000) {
      return this.cachedHealth;
    }

    const health: EcosystemHealth = {
      tradingAgent: { url: this.tradingAgentUrl, connected: false },
      chartforge: { url: this.chartforgeUrl, connected: false },
      thetadata: { url: this.thetadataUrl, connected: false },
      edgar: { url: this.edgarUrl, connected: false },
    };

    // Run external service checks in parallel with tight 1500ms timeouts
    await Promise.allSettled([
      // 1. Trading Agent Darkpool
      fetch(`${this.tradingAgentUrl}/api/darkpool/status?symbol=SPY`, {
        signal: AbortSignal.timeout(1500),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            health.tradingAgent.connected = true;
            health.tradingAgent.dixSentiment = data.regime || undefined;
            health.tradingAgent.dixValue = typeof data.current_dix === "number" ? data.current_dix : undefined;
          }
        })
        .catch(() => {}),

      // 2. Trading Agent GEX
      fetch(`${this.tradingAgentUrl}/api/gex/status?symbol=SPY`, {
        signal: AbortSignal.timeout(1500),
      })
        .then(async (res) => {
          if (res.ok) {
            const gex = await res.json();
            health.tradingAgent.gexCallWall = typeof gex.call_wall === "number" ? gex.call_wall : undefined;
            health.tradingAgent.gexPutWall = typeof gex.put_wall === "number" ? gex.put_wall : undefined;
            health.tradingAgent.gexZeroFlip = typeof gex.zero_gamma === "number" ? gex.zero_gamma : undefined;
          }
        })
        .catch(() => {}),

      // 3. ChartForge
      fetch(`${this.chartforgeUrl}/v1/health`, {
        signal: AbortSignal.timeout(1500),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            health.chartforge.connected = true;
            health.chartforge.version = data.version || "1.0.0";
          }
        })
        .catch(() => {}),

      // 4. ThetaData
      fetch(`${this.thetadataUrl}/v3/option/list/expirations?symbol=SPY`, {
        signal: AbortSignal.timeout(1500),
      })
        .then((res) => {
          health.thetadata.connected = res.ok || (res.status < 500 && res.status !== 410);
        })
        .catch(() => {
          health.thetadata.connected = false;
        }),
    ]);

    this.cachedHealth = health;
    this.cachedHealthAt = Date.now();
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
