import React, { useEffect, useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  PauseCircle,
  Zap,
  ShieldAlert,
  Radio,
  Sliders,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { MarketSignal } from "@wireforge/shared";

interface MoverItem {
  ticker: string;
  change: string;
  price: number;
  volume: string;
  rvol: string;
  catalyst: string;
}

interface RadarScreenRow {
  symbol: string;
  name?: string;
  last: number;
  change: number;
  change_pct: number;
  volume: number;
  iv_rank?: number;
  iv_percentile?: number;
  net_gex?: number;
  gamma_regime?: string;
  dpi_pct?: number;
  vwap?: number;
  vwap_dist_pct?: number;
  rule1_signal?: string;
}

export const SignalsScanner: React.FC = () => {
  const { signals, setSelectedTicker, activeWatchlistId, watchlists } = useWireForgeStore();
  const [gainers, setGainers] = useState<MoverItem[]>([]);
  const [losers, setLosers] = useState<MoverItem[]>([]);
  const [viewMode, setViewMode] = useState<"alerts" | "radarscreen">("alerts");
  const [radarData, setRadarData] = useState<RadarScreenRow[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarError, setRadarError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/v1/signals/movers")
      .then((res) => res.json())
      .then((data) => {
        if (data.gainers) setGainers(data.gainers);
        if (data.losers) setLosers(data.losers);
      })
      .catch(() => {});
  }, []);

  const fetchRadarData = () => {
    setRadarLoading(true);
    setRadarError(null);
    const universe = activeWatchlistId === "all" ? "default" : activeWatchlistId;
    fetch(`/v1/watchlists/radarscreen/scan?universe=${encodeURIComponent(universe)}`)
      .then((res) => {
        if (!res.ok) throw new Error("RadarScreen service offline or unreachable");
        return res.json();
      })
      .then((data) => {
        const rows = Array.isArray(data) ? data : data.data || [];
        setRadarData(rows);
      })
      .catch((err) => {
        setRadarError(err.message || "RadarScreen service offline");
        setRadarData([]);
      })
      .finally(() => setRadarLoading(false));
  };

  useEffect(() => {
    if (viewMode === "radarscreen") {
      fetchRadarData();
    }
  }, [viewMode, activeWatchlistId]);

  return (
    <div className="flex flex-col h-full bg-[#0e121b] overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#1e2536] bg-[#121622]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-blue-400" />
            <span className="font-bold text-sm text-white tracking-wide">
              Market Signals & Scanner
            </span>
          </div>

          {/* Sub-view switcher */}
          <div className="flex items-center gap-1 bg-[#161c28] p-0.5 rounded-lg border border-[#232c3f] text-xs">
            <button
              onClick={() => setViewMode("alerts")}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                viewMode === "alerts" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              Catalysts & Movers
            </button>
            <button
              onClick={() => setViewMode("radarscreen")}
              className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
                viewMode === "radarscreen" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              RadarScreen Matrix
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "radarscreen" && (
            <button
              onClick={fetchRadarData}
              disabled={radarLoading}
              className="p-1 rounded bg-[#182030] hover:bg-[#222c42] text-gray-400 hover:text-white transition-colors"
              title="Refresh RadarScreen data"
            >
              <RefreshCw size={13} className={radarLoading ? "animate-spin text-blue-400" : ""} />
            </button>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b2233] text-gray-400 font-mono">
            {viewMode === "alerts" ? "Live Feed" : `RadarScreen (${radarData.length} items)`}
          </span>
        </div>
      </div>

      {viewMode === "radarscreen" ? (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {radarData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500">
              <Activity size={32} className="mb-3 opacity-40 text-blue-400" />
              <p className="font-semibold text-gray-300 text-sm">Trading Agent RadarScreen Standby</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md text-center leading-relaxed">
                {radarError
                  ? radarError
                  : "RadarScreen service on port 8080 is not currently active. Launch trading_agent to stream live DXLink quotes, Tastytrade IV metrics, and GEX levels."}
              </p>
              <span className="mt-3 text-[10px] font-mono px-2 py-1 rounded bg-[#151b27] text-gray-400 border border-[#232c3d]">
                Zero simulated data active
              </span>
            </div>
          ) : (
            <div className="flex-1 overflow-auto rounded-lg border border-[#1e2536] bg-[#10141f]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#141926] text-gray-400 font-mono text-[10px] uppercase sticky top-0 border-b border-[#1e2536] z-10">
                  <tr>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Last</th>
                    <th className="py-2.5 px-3">Chg %</th>
                    <th className="py-2.5 px-3">Volume</th>
                    <th className="py-2.5 px-3">IV Rank</th>
                    <th className="py-2.5 px-3">IV %ile</th>
                    <th className="py-2.5 px-3">GEX Regime</th>
                    <th className="py-2.5 px-3">Dark Pool</th>
                    <th className="py-2.5 px-3">VWAP Dist</th>
                    <th className="py-2.5 px-3">Rule #1 Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030] font-mono">
                  {radarData.map((row) => {
                    const isPositive = (row.change_pct ?? 0) >= 0;
                    return (
                      <tr
                        key={row.symbol}
                        onClick={() => setSelectedTicker(row.symbol)}
                        className="hover:bg-[#182133] transition-colors cursor-pointer group"
                      >
                        <td className="py-2 px-3 font-bold text-white group-hover:text-blue-400">
                          ${row.symbol}
                        </td>
                        <td className="py-2 px-3 text-gray-200">
                          ${row.last ? row.last.toFixed(2) : "—"}
                        </td>
                        <td className={`py-2 px-3 font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                          {row.change_pct !== undefined ? `${isPositive ? "+" : ""}${row.change_pct.toFixed(2)}%` : "—"}
                        </td>
                        <td className="py-2 px-3 text-gray-400">
                          {row.volume ? row.volume.toLocaleString() : "—"}
                        </td>
                        <td className="py-2 px-3 text-gray-300">
                          {row.iv_rank !== undefined ? `${row.iv_rank.toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2 px-3 text-gray-300">
                          {row.iv_percentile !== undefined ? `${row.iv_percentile.toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.gamma_regime === "LONG"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : row.gamma_regime === "SHORT"
                                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                : "bg-gray-800 text-gray-400"
                            }`}
                          >
                            {row.gamma_regime || "NEUTRAL"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-300">
                          {row.dpi_pct !== undefined ? `${row.dpi_pct.toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2 px-3 text-gray-300">
                          {row.vwap_dist_pct !== undefined
                            ? `${row.vwap_dist_pct >= 0 ? "+" : ""}${row.vwap_dist_pct.toFixed(2)}%`
                            : "—"}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.rule1_signal === "BUY"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : row.rule1_signal === "SELL"
                                ? "bg-red-500/20 text-red-400"
                                : "text-gray-500"
                            }`}
                          >
                            {row.rule1_signal || "NEUTRAL"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto text-xs">
          {/* Left Column: Live Signals Stream */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-gray-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              <span>Real-Time Catalysts & Volatility Alerts</span>
            </h3>

            <div className="flex flex-col gap-2">
              {signals.length === 0 ? (
                <div className="py-12 text-center text-gray-500">Awaiting market signals...</div>
              ) : (
                signals.map((sig) => {
                  const isHalt = sig.type === "luld_halt";
                  const isBull = sig.sentiment === "bullish";

                  return (
                    <div
                      key={sig.id}
                      onClick={() => setSelectedTicker(sig.ticker)}
                      className={`p-3 rounded-lg border transition-colors hover:border-blue-500 cursor-pointer flex flex-col gap-1.5 ${
                        isHalt
                          ? "bg-amber-950/20 border-amber-800/40"
                          : isBull
                          ? "bg-[#141926] border-[#222a3d]"
                          : "bg-red-950/10 border-red-900/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-xs">
                            ${sig.ticker}
                          </span>
                          <span className="text-gray-400 font-mono text-[10px]">{sig.timeStr}</span>
                        </div>

                        <span
                          className={`font-mono font-bold text-xs ${
                            isHalt ? "text-amber-400" : isBull ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {sig.metric}
                        </span>
                      </div>

                      <h4 className="font-semibold text-gray-100 text-xs">{sig.title}</h4>
                      <p className="text-gray-400 text-[11px] leading-relaxed">{sig.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Top Gainers & Losers */}
          <div className="flex flex-col gap-4">
            {/* Top Gainers */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#121622] border border-[#20283b]">
              <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} />
                <span>Top Market Gainers</span>
              </h4>

              <div className="flex flex-col divide-y divide-[#1b2333]">
                {gainers.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 text-[11px]">
                    No live market gainers feed connected.
                  </div>
                ) : (
                  gainers.map((m) => (
                    <div
                      key={m.ticker}
                      onClick={() => setSelectedTicker(m.ticker)}
                      className="py-2 flex items-center justify-between hover:bg-[#182030] px-2 rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">${m.ticker}</span>
                        <span className="text-gray-400 text-[11px]">${m.price.toFixed(2)}</span>
                        <span className="text-gray-500 text-[10px]">RVOL: {m.rvol}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-[10px] max-w-[120px] truncate">{m.catalyst}</span>
                        <span className="font-mono font-bold text-emerald-400">{m.change}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Losers */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#121622] border border-[#20283b]">
              <h4 className="font-bold text-red-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown size={14} />
                <span>Top Market Decliners</span>
              </h4>

              <div className="flex flex-col divide-y divide-[#1b2333]">
                {losers.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 text-[11px]">
                    No live market decliners feed connected.
                  </div>
                ) : (
                  losers.map((m) => (
                    <div
                      key={m.ticker}
                      onClick={() => setSelectedTicker(m.ticker)}
                      className="py-2 flex items-center justify-between hover:bg-[#182030] px-2 rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">${m.ticker}</span>
                        <span className="text-gray-400 text-[11px]">${m.price.toFixed(2)}</span>
                        <span className="text-gray-500 text-[10px]">RVOL: {m.rvol}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-[10px] max-w-[120px] truncate">{m.catalyst}</span>
                        <span className="font-mono font-bold text-red-400">{m.change}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
