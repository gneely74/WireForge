import React, { useEffect, useState, useRef } from "react";
import { X, ExternalLink, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const MiniChartModal: React.FC = () => {
  const { selectedTicker, setSelectedTicker, ecosystemHealth } = useWireForgeStore();
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const chartforgeBase = ecosystemHealth?.chartforge.url || "http://192.168.74.102:5188";
  const directChartUrl = `${chartforgeBase}/?symbol=${selectedTicker || "SPY"}`;

  useEffect(() => {
    if (!selectedTicker) return;

    setLoading(true);
    fetch(`/v1/proxy/candles?symbol=${selectedTicker}&interval=5m&range=1d`)
      .then((res) => res.json())
      .then((data) => {
        if (data.candles && Array.isArray(data.candles)) {
          setCandles(data.candles);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedTicker]);

  // Render Canvas Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Find price min/max
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    const priceRange = maxPrice - minPrice || 1;
    const padding = 15;
    const plotH = height - padding * 2;
    const barWidth = Math.max(3, (width - padding * 2) / candles.length - 2);

    // Draw gridlines
    ctx.strokeStyle = "#1b2333";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = padding + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Candles
    candles.forEach((c, idx) => {
      const x = padding + idx * (barWidth + 2);
      const isUp = c.close >= c.open;

      const yHigh = padding + plotH * (1 - (c.high - minPrice) / priceRange);
      const yLow = padding + plotH * (1 - (c.low - minPrice) / priceRange);
      const yOpen = padding + plotH * (1 - (c.open - minPrice) / priceRange);
      const yClose = padding + plotH * (1 - (c.close - minPrice) / priceRange);

      const color = isUp ? "#10b981" : "#ef4444";
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Stem
      ctx.beginPath();
      ctx.moveTo(x + barWidth / 2, yHigh);
      ctx.lineTo(x + barWidth / 2, yLow);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyH = Math.max(2, Math.abs(yOpen - yClose));
      ctx.fillRect(x, bodyTop, barWidth, bodyH);
    });
  }, [candles]);

  if (!selectedTicker) return null;

  const first = candles[0];
  const last = candles[candles.length - 1];
  const priceChange = last && first ? last.close - first.open : 0;
  const pctChange = first && first.open > 0 ? (priceChange / first.open) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none"
      onClick={() => setSelectedTicker(null)}
    >
      <div
        className="flex flex-col w-full max-w-2xl rounded-xl border border-[#273248] bg-[#121622] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#20293b] bg-[#161c2b]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-black text-white">${selectedTicker}</span>
            {last && (
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-white font-bold">${last.close.toFixed(2)}</span>
                <span
                  className={`flex items-center text-xs font-semibold ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? <TrendingUp size={13} className="mr-0.5" /> : <TrendingDown size={13} className="mr-0.5" />}
                  {isPositive ? "+" : ""}{priceChange.toFixed(2)} ({isPositive ? "+" : ""}{pctChange.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={directChartUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono transition-colors"
            >
              <span>Open in ChartForge</span>
              <ExternalLink size={13} />
            </a>

            <button
              onClick={() => setSelectedTicker(null)}
              className="p-1 text-gray-400 hover:text-white rounded"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="p-4 flex flex-col gap-3 bg-[#0d1017]">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>5-Minute Intraday Session</span>
            <span>{candles.length} bars loaded</span>
          </div>

          <div className="relative w-full h-64 rounded-lg bg-[#0a0d13] border border-[#1d2536] overflow-hidden flex items-center justify-center">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                <RefreshCw size={16} className="animate-spin text-blue-500" />
                <span>Streaming live candle bars...</span>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={600}
                height={256}
                className="w-full h-full"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 pt-1">
            <span>Data synced via ChartForge &amp; DXLink Candle Provider</span>
            <span>Host: {chartforgeBase}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
