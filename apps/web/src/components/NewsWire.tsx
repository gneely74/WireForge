/**
 * @fileoverview News Wire interactive streaming feed component.
 * Displays real-time authentic financial headlines with support for
 * multi-state positive inclusion, negative category exclusion, ticker suppression,
 * and instant search filtering.
 *
 * Upstream Sources:
 *  - useWireForgeStore (store/wireforge-store.ts)
 *  - Backend News Ingestion API (/v1/news)
 * Downstream Interactions:
 *  - Detail view on article selection
 *  - Mini-chart / Options flow correlation on ticker selection
 */

import React, { useMemo } from "react";
import { Search, Clock, ShieldAlert, Bookmark, Filter, X } from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { NewsArticle, NewsCategory } from "@wireforge/shared";

/**
 * Interactive News Wire component supporting 3-state positive and negative filtering.
 */
export const NewsWire: React.FC = () => {
  const {
    newsArticles,
    includedCategories,
    excludedCategories,
    excludedTickers,
    toggleCategoryFilter,
    toggleExcludeTicker,
    clearNewsFilters,
    newsSearchQuery,
    setNewsSearchQuery,
    setSelectedTicker,
    setSelectedArticle,
    watchlists,
    activeWatchlistId,
    setActiveWatchlistId,
  } = useWireForgeStore();

  const CATEGORIES: { id: NewsCategory; label: string }[] = [
    { id: "all", label: "All Wire" },
    { id: "sec", label: "SEC 8-K / Filings" },
    { id: "earnings", label: "Earnings" },
    { id: "fda", label: "FDA / Biotech" },
    { id: "ratings", label: "Analyst Ratings" },
    { id: "guidance", label: "Guidance" },
    { id: "ma", label: "M&A" },
    { id: "macro", label: "Macro / Fed" },
    { id: "social", label: "StockTwits Social" },
  ];

  const activeWatchlist = useMemo(
    () => watchlists.find((w) => w.id === activeWatchlistId),
    [watchlists, activeWatchlistId]
  );

  const activeSymbols = useMemo(() => {
    if (!activeWatchlist) return null;
    return new Set(activeWatchlist.symbols.map((s) => s.toUpperCase()));
  }, [activeWatchlist]);

  // Compute filtered news articles with positive, negative, and search rules
  const filtered = useMemo(() => {
    const excCats = new Set(excludedCategories);
    const excTickers = new Set(excludedTickers.map((t) => t.toUpperCase()));
    const incCats = new Set(includedCategories);

    // Parse positive and negative search tokens
    const rawTokens = newsSearchQuery.trim().split(/\s+/).filter(Boolean);
    const positiveTokens: string[] = [];
    const negativeTokens: string[] = [];

    for (const tok of rawTokens) {
      if (tok.startsWith("-") && tok.length > 1) {
        negativeTokens.push(tok.slice(1).toLowerCase().replace(/^\$/, ""));
      } else {
        positiveTokens.push(tok.toLowerCase().replace(/^\$/, ""));
      }
    }

    return newsArticles.filter((article) => {
      // 1. Negative category exclusion
      if (excCats.has(article.category)) {
        return false;
      }

      // 2. Positive category inclusion (if any categories are explicitly whitelisted)
      if (incCats.size > 0 && !incCats.has(article.category)) {
        return false;
      }

      // 3. Negative ticker exclusion
      if (article.tickers.some((t) => excTickers.has(t.toUpperCase()))) {
        return false;
      }

      // 4. Watchlist filtering
      if (activeSymbols && !article.tickers.some((t) => activeSymbols.has(t.toUpperCase()))) {
        return false;
      }

      // 5. Negative search tokens
      if (negativeTokens.length > 0) {
        const matchesNegative = negativeTokens.some((neg) => {
          return (
            article.title.toLowerCase().includes(neg) ||
            article.summary.toLowerCase().includes(neg) ||
            article.tickers.some((t) => t.toLowerCase().includes(neg))
          );
        });
        if (matchesNegative) return false;
      }

      // 6. Positive search tokens
      if (positiveTokens.length > 0) {
        const matchesPositive = positiveTokens.every((pos) => {
          return (
            article.title.toLowerCase().includes(pos) ||
            article.summary.toLowerCase().includes(pos) ||
            article.tickers.some((t) => t.toLowerCase().includes(pos))
          );
        });
        if (!matchesPositive) return false;
      }

      return true;
    });
  }, [
    newsArticles,
    includedCategories,
    excludedCategories,
    excludedTickers,
    newsSearchQuery,
    activeSymbols,
  ]);

  const hasActiveExclusions = excludedCategories.length > 0 || excludedTickers.length > 0;
  const isAllWireActive = includedCategories.length === 0 && excludedCategories.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#0e121b] border-r border-[#1e2536] overflow-hidden">
      {/* Header & Filter Toolbar */}
      <div className="flex flex-col p-3 border-b border-[#1e2536] bg-[#121622] gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
              <span className="text-blue-500">●</span> Real-Time News Wire
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b2233] text-gray-400 font-mono">
              {filtered.length} items
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

          <div className="relative w-64">
            <Search size={13} className="absolute left-2.5 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search or -exclude (e.g. -TSLA)..."
              value={newsSearchQuery}
              onChange={(e) => setNewsSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-[#171d2b] border border-[#263045] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Pills (3-state: Neutral, Include +, Exclude -) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {/* All Wire Reset Button */}
          <button
            onClick={() => clearNewsFilters()}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium transition-colors ${
              isAllWireActive
                ? "bg-blue-600 text-white shadow-sm font-semibold"
                : "bg-[#161c28] text-gray-400 hover:text-gray-200 hover:bg-[#1f2738]"
            }`}
            title="Reset all filters to show complete unfiltered wire"
          >
            All Wire
          </button>

          {CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
            const isIncluded = includedCategories.includes(cat.id);
            const isExcluded = excludedCategories.includes(cat.id);

            let style = "bg-[#161c28] text-gray-400 hover:text-gray-200 hover:bg-[#1f2738] border border-transparent";
            let badge = "";

            if (isIncluded) {
              style = "bg-blue-600 text-white shadow-sm border border-blue-400/40 font-semibold";
              badge = "+ ";
            } else if (isExcluded) {
              style = "bg-rose-950/80 text-rose-300 border border-rose-500/60 line-through font-semibold";
              badge = "- ";
            }

            return (
              <button
                key={cat.id}
                onClick={(e) => {
                  e.preventDefault();
                  toggleCategoryFilter(cat.id, "cycle");
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleCategoryFilter(cat.id, "exclude");
                }}
                className={`px-2.5 py-1 rounded whitespace-nowrap font-medium transition-all select-none ${style}`}
                title={
                  isIncluded
                    ? `${cat.label} (Included). Click to exclude (-), Right-click to clear.`
                    : isExcluded
                    ? `${cat.label} (Excluded). Click to clear, Right-click to include (+).`
                    : `${cat.label}. Click to include (+), Right-click to exclude (-).`
                }
              >
                {badge}{cat.label}
              </button>
            );
          })}
        </div>

        {/* Active Exclusions Ribbon */}
        {hasActiveExclusions && (
          <div className="flex items-center gap-1.5 flex-wrap px-2 py-1 bg-rose-950/25 border border-rose-900/40 rounded text-[11px] animate-fadeIn">
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <ShieldAlert size={12} /> Excluded:
            </span>
            {excludedCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/60 font-mono"
              >
                <span>- {CATEGORIES.find((c) => c.id === cat)?.label || cat}</span>
                <button
                  onClick={() => toggleCategoryFilter(cat, "exclude")}
                  className="hover:text-white font-bold ml-0.5 cursor-pointer"
                  title="Remove category exclusion"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {excludedTickers.map((ticker) => (
              <span
                key={ticker}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/60 font-mono"
              >
                <span>-${ticker}</span>
                <button
                  onClick={() => toggleExcludeTicker(ticker)}
                  className="hover:text-white font-bold ml-0.5 cursor-pointer"
                  title="Remove ticker exclusion"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <button
              onClick={clearNewsFilters}
              className="text-[10px] text-gray-400 hover:text-white underline ml-auto cursor-pointer"
              title="Clear all positive and negative filters"
            >
              Clear Exclusions
            </button>
          </div>
        )}
      </div>

      {/* News Wire Stream List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#181f2e] text-xs">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Clock size={28} className="mb-2 opacity-50" />
            <p className="text-sm">No headlines found matching criteria.</p>
            {hasActiveExclusions && (
              <button
                onClick={clearNewsFilters}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Reset active exclusions
              </button>
            )}
          </div>
        ) : (
          filtered.map((item) => {
            const timeAgo = formatTimeAgo(item.timestamp);
            const isHighImpact = item.impact === "high";

            return (
              <div
                key={item.id}
                onClick={() => setSelectedArticle(item)}
                className={`flex flex-col p-3 transition-colors hover:bg-[#141926] cursor-pointer ${
                  isHighImpact ? "bg-red-950/10 border-l-2 border-red-500" : "border-l-2 border-transparent"
                }`}
              >
                {/* Meta Row: Source, Time, Category, Impact */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-gray-400 uppercase font-semibold">
                      {item.source}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-[10px] text-gray-500 font-mono">{timeAgo}</span>

                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-medium ${
                        item.category === "sec"
                          ? "bg-purple-950/50 text-purple-300 border border-purple-800/40"
                          : item.category === "earnings"
                          ? "bg-emerald-950/50 text-emerald-300 border border-emerald-800/40"
                          : item.category === "fda"
                          ? "bg-amber-950/50 text-amber-300 border border-amber-800/40"
                          : item.category === "social"
                          ? "bg-sky-950/50 text-sky-300 border border-sky-600/40"
                          : "bg-blue-950/40 text-blue-300 border border-blue-800/30"
                      }`}
                    >
                      {item.category === "social" ? "StockTwits" : item.category}
                    </span>

                    {item.sentiment && (
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                          item.sentiment === "bullish"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                            : item.sentiment === "bearish"
                            ? "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                            : "bg-gray-800/50 text-gray-400 border border-gray-700/30"
                        }`}
                      >
                        {item.sentiment}
                      </span>
                    )}

                    {isHighImpact && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-600 text-white font-bold flex items-center gap-0.5 animate-pulse shadow-sm">
                        HIGH IMPACT
                      </span>
                    )}
                  </div>

                  {/* Tickers Chips: Left-click inspect, Right-click exclude */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {item.tickers.map((ticker) => (
                      <button
                        key={ticker}
                        onClick={() => setSelectedTicker(ticker)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          toggleExcludeTicker(ticker);
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#1e2638] hover:bg-blue-600 hover:text-white text-blue-400 font-mono font-bold text-[10px] transition-colors border border-[#2b354d]"
                        title={`$${ticker} • Left-click to inspect, Right-click to exclude (-)`}
                      >
                        ${ticker}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Headline */}
                <h3 className="font-semibold text-sm text-gray-100 hover:text-blue-400 transition-colors leading-snug mb-1">
                  {item.title}
                </h3>

                {/* Brief Summary */}
                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function formatTimeAgo(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}
