import fs from "node:fs";
import path from "node:path";
import { PRESET_WATCHLISTS, Watchlist } from "@wireforge/shared";

export class WatchlistsService {
  private presetOverrides: Map<string, string[]> = new Map();
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
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const isPreset = PRESET_WATCHLISTS.some((p) => p.id === item.id);
            if (isPreset && Array.isArray(item.symbols)) {
              this.presetOverrides.set(item.id, item.symbols.map((s: string) => s.toUpperCase()));
            } else if (item.id) {
              this.customWatchlists.set(item.id, item);
            }
          }
        } else if (parsed && typeof parsed === "object") {
          if (parsed.presetOverrides) {
            for (const [id, symbols] of Object.entries(parsed.presetOverrides)) {
              if (Array.isArray(symbols)) {
                this.presetOverrides.set(id, symbols.map((s: any) => String(s).toUpperCase()));
              }
            }
          }
          if (Array.isArray(parsed.customWatchlists)) {
            for (const w of parsed.customWatchlists) {
              this.customWatchlists.set(w.id, w);
            }
          }
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

      const presetsRecord: Record<string, string[]> = {};
      for (const [k, v] of this.presetOverrides.entries()) {
        presetsRecord[k] = v;
      }

      const payload = {
        presetOverrides: presetsRecord,
        customWatchlists: Array.from(this.customWatchlists.values()),
      };

      fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), "utf-8");
    } catch (err) {
      console.error("[WatchlistsService] Failed to save watchlists to disk:", err);
    }
  }

  async syncFromTradingAgent() {
    try {
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
    const presets = PRESET_WATCHLISTS.map((preset) => {
      const overrideSymbols = this.presetOverrides.get(preset.id);
      if (overrideSymbols) {
        return {
          ...preset,
          symbols: overrideSymbols,
          updatedAt: Date.now(),
        };
      }
      return preset;
    });

    return [...presets, ...Array.from(this.customWatchlists.values())];
  }

  getWatchlist(id: string): Watchlist | undefined {
    return this.getAllWatchlists().find((w) => w.id === id);
  }

  addSymbol(id: string, rawSymbol: string): Watchlist | undefined {
    const sym = rawSymbol.trim().toUpperCase();
    if (!sym) return undefined;

    const preset = PRESET_WATCHLISTS.find((p) => p.id === id);
    if (preset) {
      const current = this.presetOverrides.get(id) || [...preset.symbols];
      if (!current.includes(sym)) {
        current.push(sym);
        this.presetOverrides.set(id, current);
        this.saveToDisk();
        this.forwardToRadarScreen(preset.name, current);
      }
      return this.getWatchlist(id);
    }

    const custom = this.customWatchlists.get(id);
    if (custom) {
      if (!custom.symbols.includes(sym)) {
        custom.symbols.push(sym);
        custom.updatedAt = Date.now();
        this.customWatchlists.set(id, custom);
        this.saveToDisk();
        this.forwardToRadarScreen(custom.name, custom.symbols);
      }
      return custom;
    }

    return undefined;
  }

  removeSymbol(id: string, rawSymbol: string): Watchlist | undefined {
    const sym = rawSymbol.trim().toUpperCase();
    if (!sym) return undefined;

    const preset = PRESET_WATCHLISTS.find((p) => p.id === id);
    if (preset) {
      const current = (this.presetOverrides.get(id) || [...preset.symbols]).filter(
        (s) => s !== sym
      );
      this.presetOverrides.set(id, current);
      this.saveToDisk();
      this.forwardToRadarScreen(preset.name, current);
      return this.getWatchlist(id);
    }

    const custom = this.customWatchlists.get(id);
    if (custom) {
      custom.symbols = custom.symbols.filter((s) => s !== sym);
      custom.updatedAt = Date.now();
      this.customWatchlists.set(id, custom);
      this.saveToDisk();
      this.forwardToRadarScreen(custom.name, custom.symbols);
      return custom;
    }

    return undefined;
  }

  resetPreset(id: string): Watchlist | undefined {
    const preset = PRESET_WATCHLISTS.find((p) => p.id === id);
    if (!preset) return undefined;

    this.presetOverrides.delete(id);
    this.saveToDisk();
    this.forwardToRadarScreen(preset.name, preset.symbols);
    return preset;
  }

  saveCustomWatchlist(payload: {
    id?: string;
    name: string;
    description?: string;
    symbols: string[];
  }): Watchlist {
    const cleanSymbols = Array.from(
      new Set(payload.symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))
    );

    // If target ID is a preset, store as preset override
    if (payload.id && PRESET_WATCHLISTS.some((p) => p.id === payload.id)) {
      this.presetOverrides.set(payload.id, cleanSymbols);
      this.saveToDisk();
      this.forwardToRadarScreen(payload.name, cleanSymbols);
      return this.getWatchlist(payload.id)!;
    }

    const id = payload.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
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
    this.forwardToRadarScreen(watchlist.name, cleanSymbols);

    return watchlist;
  }

  deleteCustomWatchlist(id: string): boolean {
    if (PRESET_WATCHLISTS.some((p) => p.id === id)) {
      return false; // Cannot delete presets, only reset them
    }
    if (this.customWatchlists.has(id)) {
      this.customWatchlists.delete(id);
      this.saveToDisk();
      return true;
    }
    return false;
  }

  private forwardToRadarScreen(name: string, symbols: string[]) {
    fetch(`${this.tradingAgentUrl}/api/radarscreen/watchlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, symbols }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => {});
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
