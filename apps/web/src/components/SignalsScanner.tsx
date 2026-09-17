import React, { useEffect, useState } from "react";
import { Activity, TrendingUp, TrendingDown, PauseCircle, Zap, ShieldAlert } from "lucide-react";
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

export const SignalsScanner: React.FC = () => {
  const { signals, setSelectedTicker } = useWireForgeStore();
  const [gainers, setGainers] = useState<MoverItem[]>([]);
  const [losers, setLosers] = useState<MoverItem[]>([]);

  useEffect(() => {
    fetch("/v1/signals/movers")
      .then((res) => res.json())
      .then((data) => {
        if (data.gainers) setGainers(data.gainers);
        if (data.losers) setLosers(data.losers);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0e121b] overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#1e2536] bg-[#121622]">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-blue-400" />
          <span className="font-bold text-sm text-white tracking-wide">
            Market Signals & Movers Scanner
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b2233] text-gray-400 font-mono">
          Live Radar
        </span>
      </div>

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
    </div>
  );
};
