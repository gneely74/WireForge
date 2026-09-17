import fs from "node:fs";
import path from "node:path";
import { PRESET_WATCHLISTS, Watchlist } from "@wireforge/shared";

export class WatchlistsService {
  private customWatchlists: Map<string, Watchlist> = new Map();
  private filePath: string;
  private tradingAgentUrl: string;

  constructor() {
    this.filePath = path.resolve(process.cwd(), "data/watchlists.json");
    this.tradingAgentUrl = (process.env.TRADING_AGENT_API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");
    this.loadFromDisk();
    this.syncFromTradingAgent();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const list: Watchlist[] = JSON.parse(raw);
        for (const w of list) {
          this.customWatchlists.set(w.id, w);
        }
      }
    } catch (err) {
      console.error("[WatchlistsService] Failed to load watchlists from disk:", err);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.customWatchlists.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[WatchlistsService] Failed to save watchlists to disk:", err);
    }
  }

  async syncFromTradingAgent() {
    try {
      // Check /api/radarscreen/universes
      const res = await fetch(`${this.tradingAgentUrl}/api/radarscreen/universes`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.custom && typeof body.custom === "object") {
          for (const [name, symbols] of Object.entries(body.custom)) {
            if (Array.isArray(symbols)) {
              const id = `radarscreen-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              this.customWatchlists.set(id, {
                id,
                name: `RadarScreen: ${name}`,
                description: "Synchronized with Trading Agent RadarScreen",
                symbols: (symbols as string[]).map((s) => s.toUpperCase()),
                isPreset: false,
                updatedAt: Date.now(),
              });
            }
          }
        }
      }
    } catch {
      // Standby / offline
    }
  }

  getAllWatchlists(): Watchlist[] {
    return [...PRESET_WATCHLISTS, ...Array.from(this.customWatchlists.values())];
  }

  getWatchlist(id: string): Watchlist | undefined {
    return (
      PRESET_WATCHLISTS.find((w) => w.id === id) ||
      this.customWatchlists.get(id)
    );
  }

  saveCustomWatchlist(payload: { id?: string; name: string; description?: string; symbols: string[] }): Watchlist {
    const id = payload.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const cleanSymbols = Array.from(
      new Set(payload.symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))
    );

    const watchlist: Watchlist = {
      id,
      name: payload.name.trim(),
      description: payload.description?.trim(),
      symbols: cleanSymbols,
      isPreset: false,
      updatedAt: Date.now(),
    };

    this.customWatchlists.set(id, watchlist);
    this.saveToDisk();

    // Forward to Trading Agent RadarScreen in background
    fetch(`${this.tradingAgentUrl}/api/radarscreen/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: watchlist.name, symbols: cleanSymbols }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {});

    return watchlist;
  }

  deleteCustomWatchlist(id: string): boolean {
    if (this.customWatchlists.has(id)) {
      this.customWatchlists.delete(id);
      this.saveToDisk();
      return true;
    }
    return false;
  }

  getAllTrackedSymbols(): Set<string> {
    const all = new Set<string>();
    for (const w of this.getAllWatchlists()) {
      for (const s of w.symbols) {
        all.add(s);
      }
    }
    return all;
  }
}

export const globalWatchlistsService = new WatchlistsService();
