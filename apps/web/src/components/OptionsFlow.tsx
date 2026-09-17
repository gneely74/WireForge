import React, { useMemo } from "react";
import { Zap, ShieldCheck, Filter, ArrowUpRight, ArrowDownRight, Sparkles, Bookmark } from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { OptionsFlowTrade, OptionOrderType } from "@wireforge/shared";

export const OptionsFlow: React.FC = () => {
  const {
    flowTrades,
    flowMinPremium,
    setFlowMinPremium,
    flowSentimentFilter,
    setFlowSentimentFilter,
    flowTickerFilter,
    setFlowTickerFilter,
    flowGoldenOnly,
    setFlowGoldenOnly,
    setSelectedTicker,
    ecosystemHealth,
    watchlists,
    activeWatchlistId,
    setActiveWatchlistId,
  } = useWireForgeStore();

  const activeWatchlist = useMemo(
    () => watchlists.find((w) => w.id === activeWatchlistId),
    [watchlists, activeWatchlistId]
  );

  const activeSymbols = useMemo(() => {
    if (!activeWatchlist) return null;
    return new Set(activeWatchlist.symbols.map((s) => s.toUpperCase()));
  }, [activeWatchlist]);

  const filtered = useMemo(() => {
    return flowTrades.filter((t) => {
      const matchPrem = t.premium >= flowMinPremium;
      const matchSent =
        flowSentimentFilter === "all" || t.sentiment === flowSentimentFilter;
      const q = flowTickerFilter.trim().toUpperCase();
      const matchTicker = !q || t.ticker.includes(q);
      const matchGolden = !flowGoldenOnly || t.isGolden;
      const matchWatchlist =
        !activeSymbols || activeSymbols.has(t.ticker.toUpperCase());

      return matchPrem && matchSent && matchTicker && matchGolden && matchWatchlist;
    });
  }, [flowTrades, flowMinPremium, flowSentimentFilter, flowTickerFilter, flowGoldenOnly, activeSymbols]);

  // Summary Metrics
  const stats = useMemo(() => {
    let bull = 0;
    let bear = 0;
    let golden = 0;

    for (const t of filtered) {
      if (t.sentiment === "bullish") bull += t.premium;
      if (t.sentiment === "bearish") bear += t.premium;
      if (t.isGolden) golden++;
    }

    const total = bull + bear;
    const ratio = total > 0 ? (bull / total) * 100 : 50;

    return { bull, bear, total, ratio: ratio.toFixed(1), golden };
  }, [filtered]);

  return (
    <div className="flex flex-col h-full bg-[#0e121b] overflow-hidden">
      {/* Header & Flow Summary Bar */}
      <div className="flex flex-col p-3 border-b border-[#1e2536] bg-[#121622] gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" />
              <span>Unusual Options Activity (UOA)</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b2233] text-gray-400 font-mono">
              {filtered.length} sweeps
            </span>
            {activeWatchlist && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Bookmark size={11} />
                <span>{activeWatchlist.name}</span>
                <button
                  onClick={() => setActiveWatchlistId("all")}
                  className="ml-1 hover:text-white font-bold"
                  title="Clear watchlist filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {/* Sentiment Bar */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">{stats.ratio}% Bullish</span>
              <div className="w-24 h-2 rounded bg-red-950 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${stats.ratio}%` }}
                />
              </div>
            </div>

            <span className="text-gray-400">
              Vol: <span className="text-white font-bold">${(stats.total / 1000000).toFixed(2)}M</span>
            </span>

            {stats.golden > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1">
                <Sparkles size={11} /> {stats.golden} Golden Sweeps
              </span>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Min Prem:</span>
            {[25000, 50000, 100000, 250000, 1000000].map((prem) => (
              <button
                key={prem}
                onClick={() => setFlowMinPremium(prem)}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                  flowMinPremium === prem
                    ? "bg-blue-600 text-white"
                    : "bg-[#161c28] text-gray-400 hover:text-white"
                }`}
              >
                ${prem >= 1000000 ? `${prem / 1000000}M` : `${prem / 1000}k`}
              </button>
            ))}

            <button
              onClick={() => setFlowGoldenOnly(!flowGoldenOnly)}
              className={`px-2 py-0.5 rounded font-mono font-bold transition-colors ml-2 ${
                flowGoldenOnly
                  ? "bg-amber-600 text-white"
                  : "bg-[#161c28] text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              ★ Golden Only
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#161c28] rounded border border-[#232b3d] p-0.5">
              {(["all", "bullish", "bearish"] as const).map((sent) => (
                <button
                  key={sent}
                  onClick={() => setFlowSentimentFilter(sent)}
                  className={`px-2 py-0.5 rounded uppercase font-mono text-[10px] font-semibold transition-colors ${
                    flowSentimentFilter === sent
                      ? sent === "bullish"
                        ? "bg-emerald-600 text-white"
                        : sent === "bearish"
                        ? "bg-red-600 text-white"
                        : "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {sent}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Filter Ticker..."
              value={flowTickerFilter}
              onChange={(e) => setFlowTickerFilter(e.target.value)}
              className="w-28 px-2 py-1 text-xs rounded bg-[#171d2b] border border-[#263045] text-white placeholder-gray-500 font-mono uppercase focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Options Tape Table */}
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#121622] text-[10px] text-gray-400 uppercase border-b border-[#1e2536] z-10">
            <tr>
              <th className="py-2 px-3">Time</th>
              <th className="py-2 px-3">Ticker</th>
              <th className="py-2 px-3">Exp / Strike</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Side</th>
              <th className="py-2 px-3">Spot</th>
              <th className="py-2 px-3 text-right">Size / OI</th>
              <th className="py-2 px-3 text-right">Price</th>
              <th className="py-2 px-3 text-right">Premium</th>
              <th className="py-2 px-3 text-center">Sentiment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171d2b]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-gray-500">
                  {flowTrades.length === 0 ? (
                    <div className="flex flex-col items-center gap-1">
                      <span>No institutional options sweeps recorded.</span>
                      <span className="text-[11px] text-gray-600">
                        {ecosystemHealth?.thetadata.connected
                          ? "ThetaData is ONLINE — listening for live OPRA trades..."
                          : "ThetaData is STANDBY / Offline — waiting for connected tape."}
                      </span>
                    </div>
                  ) : (
                    <span>No options sweeps matching the current filters.</span>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const isBull = t.sentiment === "bullish";
                const isBear = t.sentiment === "bearish";
                const isCall = t.contractType === "CALL";

                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicker(t.ticker)}
                    className={`hover:bg-[#151a28] cursor-pointer transition-colors ${
                      t.isGolden ? "bg-amber-950/10 font-medium" : ""
                    }`}
                  >
                    {/* Time */}
                    <td className="py-2 px-3 text-gray-500 text-[11px]">{t.timeStr}</td>

                    {/* Ticker & Golden badge */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span>{t.ticker}</span>
                        {t.isGolden && (
                          <span
                            className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] border border-amber-500/30"
                            title="Golden Sweep: Size > Open Interest filled at Ask"
                          >
                            GOLDEN
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Exp / Strike */}
                    <td className="py-2 px-3">
                      <span className="text-gray-300">{t.expiration.slice(5)}</span>{" "}
                      <span className="text-white font-semibold">${t.strike}</span>{" "}
                      <span
                        className={`text-[10px] font-bold px-1 rounded ${
                          isCall ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                        }`}
                      >
                        {t.contractType}
                      </span>
                    </td>

                    {/* Order Type */}
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          t.orderType === "sweep"
                            ? "bg-purple-950/70 text-purple-300 border border-purple-800/40"
                            : "bg-blue-950/70 text-blue-300 border border-blue-800/40"
                        }`}
                      >
                        {t.orderType}
                      </span>
                    </td>

                    {/* Side */}
                    <td className="py-2 px-3 text-gray-400 uppercase text-[10px]">
                      {t.side.replace("_", " ")}
                    </td>

                    {/* Spot */}
                    <td className="py-2 px-3 text-gray-400">${t.spotPrice.toFixed(2)}</td>

                    {/* Size / OI */}
                    <td className="py-2 px-3 text-right">
                      <span className="text-white font-bold">{t.size.toLocaleString()}</span>{" "}
                      <span className="text-gray-500 text-[10px]">/ {t.openInterest.toLocaleString()}</span>
                    </td>

                    {/* Trade Price */}
                    <td className="py-2 px-3 text-right text-gray-300">${t.tradePrice.toFixed(2)}</td>

                    {/* Total Dollar Premium */}
                    <td className="py-2 px-3 text-right font-bold text-white">
                      ${t.premium >= 1000000
                        ? `${(t.premium / 1000000).toFixed(2)}M`
                        : `${(t.premium / 1000).toFixed(0)}k`}
                    </td>

                    {/* Sentiment */}
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isBull
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                            : isBear
                            ? "bg-red-950/80 text-red-400 border border-red-800/50"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {isBull ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {t.sentiment}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
