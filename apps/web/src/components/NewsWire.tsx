import React, { useMemo } from "react";
import { Search, Filter, Clock, ExternalLink, ShieldAlert, Sparkles, BookOpen, Bookmark } from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { NewsArticle, NewsCategory } from "@wireforge/shared";

export const NewsWire: React.FC = () => {
  const {
    newsArticles,
    newsCategory,
    setNewsCategory,
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

  const filtered = useMemo(() => {
    return newsArticles.filter((article) => {
      const matchesCat = newsCategory === "all" || article.category === newsCategory;
      const q = newsSearchQuery.trim().toLowerCase();
      const matchesQ =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.tickers.some((t) => t.toLowerCase().includes(q));

      const matchesWatchlist =
        !activeSymbols ||
        article.tickers.some((t) => activeSymbols.has(t.toUpperCase()));

      return matchesCat && matchesQ && matchesWatchlist;
    });
  }, [newsArticles, newsCategory, newsSearchQuery, activeSymbols]);

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

          <div className="relative w-56">
            <Search size={13} className="absolute left-2.5 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search wire or ticker..."
              value={newsSearchQuery}
              onChange={(e) => setNewsSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-[#171d2b] border border-[#263045] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setNewsCategory(cat.id)}
              className={`px-2.5 py-1 rounded whitespace-nowrap font-medium transition-colors ${
                newsCategory === cat.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-[#161c28] text-gray-400 hover:text-gray-200 hover:bg-[#1f2738]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* News Wire Stream List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#181f2e] text-xs">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Clock size={28} className="mb-2 opacity-50" />
            <p>No headlines found matching criteria.</p>
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

                  {/* Tickers Chips */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {item.tickers.map((ticker) => (
                      <button
                        key={ticker}
                        onClick={() => setSelectedTicker(ticker)}
                        className="px-1.5 py-0.5 rounded bg-[#1e2638] hover:bg-blue-600 hover:text-white text-blue-400 font-mono font-bold text-[10px] transition-colors border border-[#2b354d]"
                        title={`Inspect ${ticker} mini chart & options flow`}
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
