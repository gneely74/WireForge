/**
 * @fileoverview U.S. Treasury Par Yield Curve & Benchmark Rates Component.
 * Visualizes the 11-tenor Treasury yield curve (1M to 30Y) and SOFR/EFFR benchmark rates.
 * Sourced directly from ValueForge Central Financial Intelligence Platform (with government fallback).
 *
 * Adheres strictly to repository rule: NO FAKE OR HARDCODED DATA! LIVE DATA ONLY.
 *
 * Upstream Feeds:
 *  - WireForge API: GET /v1/macro/yield-curve
 *  - ValueForge: GET /api/macro/rates
 *  - Federal Reserve Bank of New York: SOFR & EFFR
 *  - U.S. Department of the Treasury: Daily Par Yield Curve CSV
 */

import React, { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { YieldCurveResponse } from "@wireforge/shared";

/**
 * Props for YieldCurveCard.
 */
interface YieldCurveCardProps {
  /** Optional callback to open modal or deep dive */
  onSelectTenor?: (tenor: string) => void;
}

/**
 * YieldCurveCard renders an interactive SVG yield curve and tenor benchmarks.
 *
 * @param {YieldCurveCardProps} props - Component properties.
 * @returns {React.ReactElement} The rendered YieldCurveCard.
 */
export const YieldCurveCard: React.FC<YieldCurveCardProps> = ({ onSelectTenor }) => {
  const [data, setData] = useState<YieldCurveResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches yield curve telemetry from backend API.
   *
   * @param {boolean} [forceRefresh=false] - Whether to bypass cache.
   */
  const fetchYieldCurve = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/v1/macro/yield-curve${forceRefresh ? "?refresh=true" : ""}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Live yield curve telemetry unavailable`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.message || "Failed to parse yield curve telemetry");
      }
    } catch (err: any) {
      console.error("[YieldCurveCard] Error loading yield curve:", err);
      setError(err.message || "Upstream rate feed offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYieldCurve();
  }, []);

  // Filter tenors with numeric rates for curve plotting (excluding SOFR from the Treasury curve itself)
  const treasuryTenors = (data?.tenors || []).filter(
    (t) => t.category !== "overnight" && typeof t.rate === "number" && t.rate !== null
  );

  // SVG coordinate calculations
  const width = 850;
  const height = 180;
  const paddingLeft = 55;
  const paddingRight = 40;
  const paddingTop = 25;
  const paddingBottom = 35;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Determine min and max yields for dynamic Y-axis scaling
  const ratesList = treasuryTenors.map((t) => t.rate as number);
  const minRate = ratesList.length ? Math.floor(Math.min(...ratesList) * 2) / 2 - 0.25 : 3.0;
  const maxRate = ratesList.length ? Math.ceil(Math.max(...ratesList) * 2) / 2 + 0.25 : 5.5;
  const rateRange = maxRate - minRate || 1;

  // Generate SVG points
  const points = treasuryTenors.map((t, idx) => {
    const x = paddingLeft + (idx / Math.max(treasuryTenors.length - 1, 1)) * plotWidth;
    const y = paddingTop + plotHeight - (((t.rate as number) - minRate) / rateRange) * plotHeight;
    return { x, y, tenor: t.tenor, label: t.label, rate: t.rate as number };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return (
    <div className="p-6 rounded-2xl bg-[#0f1420] border border-[#20283b] shadow-md relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px] font-bold">
              BENCHMARK INTELLIGENCE
            </span>
            <h3 className="text-base font-bold text-white tracking-wide">
              U.S. Treasury Par Yield Curve &amp; SOFR Benchmarks
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Authoritative risk-free discount curves and overnight secured borrowing costs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {data?.asOfDate && (
            <span className="text-[11px] font-mono text-gray-400">
              As of: <span className="text-gray-200 font-semibold">{data.asOfDate}</span>
            </span>
          )}
          <button
            onClick={() => fetchYieldCurve(true)}
            disabled={loading}
            title="Force refresh rates from ValueForge / NY Fed / Treasury.gov"
            className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#1e273d] text-gray-400 hover:text-white border border-[#28324a] transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {/* SOFR */}
        <div className="p-3 rounded-xl bg-[#141b2b] border border-[#232e47]">
          <div className="text-[10px] font-mono uppercase text-gray-400 flex items-center justify-between">
            <span>Overnight SOFR</span>
            <span className="text-emerald-400 text-[9px] font-semibold">NY FED</span>
          </div>
          <div className="text-lg font-bold text-cyan-300 mt-0.5 font-mono">
            {data?.rates.SOFR != null ? `${data.rates.SOFR.toFixed(2)}%` : "—"}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Overnight secured repo</div>
        </div>

        {/* 10Y-2Y Spread */}
        <div className="p-3 rounded-xl bg-[#141b2b] border border-[#232e47]">
          <div className="text-[10px] font-mono uppercase text-gray-400 flex items-center justify-between">
            <span>10Y &minus; 2Y Spread</span>
            {data?.spreads?.isInverted10y2y ? (
              <span className="text-rose-400 text-[9px] font-semibold flex items-center gap-0.5">
                <AlertTriangle size={10} /> INVERTED
              </span>
            ) : (
              <span className="text-emerald-400 text-[9px] font-semibold flex items-center gap-0.5">
                <ShieldCheck size={10} /> NORMAL
              </span>
            )}
          </div>
          <div
            className={`text-lg font-bold mt-0.5 font-mono ${
              data?.spreads?.isInverted10y2y ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {data?.spreads?.spread10y2y != null
              ? `${data.spreads.spread10y2y > 0 ? "+" : ""}${data.spreads.spread10y2y.toFixed(2)}%`
              : "—"}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Leading recession canary</div>
        </div>

        {/* 10Y-3M Spread */}
        <div className="p-3 rounded-xl bg-[#141b2b] border border-[#232e47]">
          <div className="text-[10px] font-mono uppercase text-gray-400 flex items-center justify-between">
            <span>10Y &minus; 3M Spread</span>
            {data?.spreads?.isInverted10y3m ? (
              <span className="text-rose-400 text-[9px] font-semibold">INVERTED</span>
            ) : (
              <span className="text-emerald-400 text-[9px] font-semibold">NORMAL</span>
            )}
          </div>
          <div
            className={`text-lg font-bold mt-0.5 font-mono ${
              data?.spreads?.isInverted10y3m ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {data?.spreads?.spread10y3m != null
              ? `${data.spreads.spread10y3m > 0 ? "+" : ""}${data.spreads.spread10y3m.toFixed(2)}%`
              : "—"}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Fed official recession sonar</div>
        </div>

        {/* 10Y Benchmark Note */}
        <div className="p-3 rounded-xl bg-[#141b2b] border border-[#232e47]">
          <div className="text-[10px] font-mono uppercase text-gray-400 flex items-center justify-between">
            <span>10-Yr Benchmark</span>
            <span className="text-blue-400 text-[9px] font-semibold">TREASURY</span>
          </div>
          <div className="text-lg font-bold text-white mt-0.5 font-mono">
            {data?.rates.TREASURY_Y10 != null ? `${data.rates.TREASURY_Y10.toFixed(2)}%` : "—"}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">World's discount benchmark</div>
        </div>
      </div>

      {/* Interactive Yield Curve SVG */}
      {error ? (
        <div className="h-48 flex flex-col items-center justify-center rounded-xl bg-[#141b2b] border border-rose-500/20 text-rose-400 text-xs p-4">
          <AlertTriangle size={20} className="mb-2" />
          <p className="font-semibold">Unable to fetch live yield curve</p>
          <p className="text-gray-400 text-[11px] mt-1">{error}</p>
        </div>
      ) : loading && !data ? (
        <div className="h-48 flex items-center justify-center text-xs text-gray-400">
          <RefreshCw size={16} className="animate-spin mr-2" />
          Loading authentic Treasury yield curve...
        </div>
      ) : (
        <div className="h-48 w-full bg-[#0a0e17] rounded-xl p-2 border border-[#1b2336] relative overflow-hidden">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + plotHeight * pct;
              const rateVal = (maxRate - pct * rateRange).toFixed(2);
              return (
                <g key={i}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1b253b" strokeDasharray="3,3" />
                  <text x={paddingLeft - 10} y={y + 3} fontSize="9" fill="#6b7280" textAnchor="end" fontFamily="monospace">
                    {rateVal}%
                  </text>
                </g>
              );
            })}

            {/* Inversion shading if 2Y > 10Y */}
            {data?.spreads?.isInverted10y2y && (
              <rect
                x={paddingLeft}
                y={paddingTop}
                width={plotWidth}
                height={plotHeight}
                fill="#f43f5e"
                opacity="0.04"
              />
            )}

            {/* Yield Curve Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Yield Points */}
            {points.map((p, idx) => (
              <g
                key={idx}
                className="cursor-pointer group"
                onClick={() => onSelectTenor && onSelectTenor(p.tenor)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#0ea5e9"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="transition-all duration-150 hover:r-6 hover:fill-amber-400"
                />
                {/* Tenor X Label */}
                <text
                  x={p.x}
                  y={height - 12}
                  fontSize="9"
                  fill="#94a3b8"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {p.label.replace(" Year", "Y").replace(" Month", "M")}
                </text>
                {/* Rate on hover or prominent */}
                <text
                  x={p.x}
                  y={p.y - 8}
                  fontSize="9"
                  fill="#e2e8f0"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {p.rate.toFixed(2)}%
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Tenor Strip Table */}
      <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 text-center text-xs">
        {data?.tenors.map((t) => (
          <div
            key={t.tenor}
            className={`p-2 rounded-lg border transition-all ${
              t.category === "overnight"
                ? "bg-[#101b2b] border-cyan-500/30 text-cyan-300"
                : "bg-[#0b101a] border-[#1d263b] text-gray-200 hover:border-blue-500/50"
            }`}
          >
            <div className="text-[10px] text-gray-400 font-mono font-medium truncate">{t.label}</div>
            <div className="font-mono font-bold text-sm mt-0.5">
              {typeof t.rate === "number" ? `${t.rate.toFixed(2)}%` : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Attribution */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 border-t border-[#1b253b] pt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Source: <strong className="text-gray-300">{data?.source || "ValueForge Central Financial Database"}</strong></span>
        </div>
        <div className="mt-1 sm:mt-0 font-mono text-[10px] text-gray-400">
          Option B: ValueForge API &bull; U.S. Treasury Daily Par Curve &bull; NY Fed Reference Rates
        </div>
      </div>
    </div>
  );
};
