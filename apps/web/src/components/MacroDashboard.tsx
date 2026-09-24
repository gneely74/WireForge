import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Shield,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";

interface MacroIndicator {
  id: string;
  name: string;
  category: string;
  current_value: number;
  display_value: string;
  unit: string;
  change_3m: number;
  change_3m_display: string;
  percentile_10y: number;
  status: string;
  direction: string;
}

interface MacroRegime {
  active_regime: string;
  quadrant_id: number;
  growth_impulse_score: number;
  financial_conditions_score: number;
  liquidity_status: string;
  growth_status: string;
  transmission_bias: string;
  summary: string;
  favored_sectors: string[];
  vulnerable_sectors: string[];
  tactical_rules: string[];
  updated_at: string;
}

export const MacroDashboard: React.FC = () => {
  const { setSelectedMacroIndicator, setIsMacroModalOpen } = useWireForgeStore();

  const [regime, setRegime] = useState<MacroRegime | null>(null);
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [activeSection, setActiveSection] = useState<"fed" | "growth" | "global" | "matrix" | "council">("fed");
  const [loading, setLoading] = useState(false);

  const fetchMacroData = () => {
    setLoading(true);
    // Fetch Regime
    fetch("/v1/macro/regime")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setRegime(data.data);
      })
      .catch((err) => console.error("Failed to load macro regime:", err));

    // Fetch Indicators
    fetch("/v1/macro/indicators")
      .then((res) => res.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data)) {
          setIndicators(data.data);
        }
      })
      .catch((err) => console.error("Failed to load indicators:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMacroData();
  }, []);

  const openPlaybook = (indicatorId: string) => {
    setSelectedMacroIndicator(indicatorId);
    setIsMacroModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] text-[#d1d4dc] overflow-y-auto p-4 md:p-6 space-y-6">
      
      {/* Header & Regime Status Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-[#0f1420] border border-[#20283b] shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-xs font-bold">
              FORGE MACRO ENGINE
            </span>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Macroeconomic &amp; Federal Reserve Transmission Terminal
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-3xl">
            Click any chart or indicator to inspect <strong>Layman's Explanations</strong>, <strong>Real-World Market Examples</strong>, and <strong>Tactical Playbook Rules</strong>.
          </p>
        </div>

        {/* Active Regime Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-semibold">
              Current Macro Regime
            </div>
            <div className="text-xs font-bold text-amber-400 flex items-center justify-end gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {regime?.active_regime.split(":")[1] || " Late-Cycle Resilience"}
            </div>
          </div>
          <button
            onClick={fetchMacroData}
            title="Refresh macro indicators from Forge"
            className="p-2 rounded-lg bg-[#161d2d] hover:bg-[#1e273d] text-gray-400 hover:text-white border border-[#28324a] transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Quick Pulse Cards (Clickable) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {indicators.slice(0, 6).map((ind) => (
          <div
            key={ind.id}
            onClick={() => openPlaybook(ind.id)}
            className="p-3.5 rounded-xl bg-[#0f1420] hover:bg-[#141b2b] border border-[#20283b] hover:border-blue-500/50 cursor-pointer transition-all duration-200 group shadow-sm"
          >
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
              <span className="truncate">{ind.name}</span>
              <Info size={12} className="opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity" />
            </div>
            <div className="text-base font-bold text-white mt-1 group-hover:text-blue-400 transition-colors">
              {ind.display_value}
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
              <span className={ind.direction === "rising" ? "text-emerald-400 flex items-center" : "text-amber-400 flex items-center"}>
                {ind.change_3m_display}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-[#182133] text-gray-400">
                {ind.percentile_10y}%ile
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1f283d] pb-px overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSection("fed")}
          className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "fed"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          1. Fed Liquidity &amp; Discount Plumbing
        </button>

        <button
          onClick={() => setActiveSection("growth")}
          className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "growth"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          2. Real Economy, Growth &amp; Labor
        </button>

        <button
          onClick={() => setActiveSection("global")}
          className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "global"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          3. Global Liquidity &amp; FX
        </button>

        <button
          onClick={() => setActiveSection("matrix")}
          className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "matrix"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          4. 4-Quadrant Macro Matrix
        </button>

        <button
          onClick={() => setActiveSection("council")}
          className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeSection === "council"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          5. Council Consensus &amp; Signal vs Noise
        </button>
      </div>

      {/* ==================== TAB 1: FED LIQUIDITY & PLUMBING ==================== */}
      {activeSection === "fed" && (
        <div className="space-y-6">
          {/* Main Chart: Net Liquidity vs S&P 500 */}
          <div 
            onClick={() => openPlaybook("net_liquidity")}
            className="p-6 rounded-2xl bg-[#0f1420] border border-[#20283b] hover:border-blue-500/50 cursor-pointer transition-all duration-200 shadow-md group relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    Fed Net Liquidity vs. S&amp;P 500 (WALCL &minus; TGA &minus; RRP)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    0.86 R&sup2; Correlation
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Click to view layman's explanation, COVID 2020 &amp; 2022 case studies, and trading playbook.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-blue-400"><span className="w-3 h-0.5 bg-blue-500 inline-block"></span> Net Liquidity ($T)</span>
                <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> S&amp;P 500</span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="h-64 w-full">
              <svg className="w-full h-full" viewBox="0 0 900 240">
                <line x1="50" y1="20" x2="850" y2="20" stroke="#1f283d" />
                <line x1="50" y1="70" x2="850" y2="70" stroke="#1f283d" />
                <line x1="50" y1="120" x2="850" y2="120" stroke="#1f283d" />
                <line x1="50" y1="170" x2="850" y2="170" stroke="#1f283d" />

                {/* COVID QE flood shading */}
                <rect x="220" y="20" width="130" height="150" fill="#10b981" opacity="0.08" />
                <text x="285" y="35" font-size="10" fill="#10b981" text-anchor="middle" font-weight="bold">QE Bazooka ($3T Injected)</text>

                {/* 2022 QT Drain */}
                <rect x="420" y="20" width="140" height="150" fill="#ef4444" opacity="0.08" />
                <text x="490" y="35" font-size="10" fill="#ef4444" text-anchor="middle" font-weight="bold">QT Drain &amp; Multiple Crunch</text>

                {/* Left Labels */}
                <text x="40" y="25" font-size="10" fill="#6b7280" text-anchor="end">$7.5T</text>
                <text x="40" y="75" font-size="10" fill="#6b7280" text-anchor="end">$6.8T</text>
                <text x="40" y="125" font-size="10" fill="#6b7280" text-anchor="end">$6.1T</text>
                <text x="40" y="175" font-size="10" fill="#6b7280" text-anchor="end">$5.4T</text>

                {/* Right Labels */}
                <text x="860" y="25" font-size="10" fill="#6b7280">6,000</text>
                <text x="860" y="75" font-size="10" fill="#6b7280">5,000</text>
                <text x="860" y="125" font-size="10" fill="#6b7280">4,000</text>
                <text x="860" y="175" font-size="10" fill="#6b7280">3,000</text>

                {/* Net Liquidity Path (Blue) */}
                <path d="M 50 160 Q 120 155 180 150 L 220 170 Q 250 80 320 40 Q 360 30 400 50 L 460 120 Q 530 140 590 110 Q 660 100 730 95 L 800 85 L 850 88" 
                      fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" />

                {/* S&P 500 Path (Emerald) */}
                <path d="M 50 150 Q 120 135 180 125 L 220 175 Q 260 95 320 65 Q 360 45 400 55 L 460 135 Q 530 145 590 105 Q 660 80 730 55 L 800 35 L 850 30" 
                      fill="none" stroke="#10b981" stroke-width="2.5" stroke-dasharray="4,2" stroke-linecap="round" />

                <text x="50" y="200" font-size="10" fill="#6b7280">2019</text>
                <text x="220" y="200" font-size="10" fill="#6b7280">2020 COVID</text>
                <text x="380" y="200" font-size="10" fill="#6b7280">2021 Peak</text>
                <text x="500" y="200" font-size="10" fill="#6b7280">2022 Hikes</text>
                <text x="660" y="200" font-size="10" fill="#6b7280">2023 SVB</text>
                <text x="800" y="200" font-size="10" fill="#6b7280">2025-26</text>
              </svg>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-blue-400 font-mono">
              <span className="flex items-center gap-1"><HelpCircle size={14} /> Click to open Deep-Dive Modal</span>
              <span className="text-gray-400">Current Level: $6.24T (+42B 3M)</span>
            </div>
          </div>

          {/* Sub Grid: Real Yields & Yield Curve */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Real 10Y Yield */}
            <div 
              onClick={() => openPlaybook("real_10y_tips")}
              className="p-5 rounded-xl bg-[#0f1420] border border-[#20283b] hover:border-blue-500/50 cursor-pointer transition-all duration-200 shadow-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                    Real 10-Year TIPS Yield (DFII10)
                  </h4>
                  <p className="text-[11px] text-gray-400">Valuation gravity &bull; DCF hurdle rate</p>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">1.94% &uarr;</span>
              </div>

              <div className="h-44 w-full">
                <svg className="w-full h-full" viewBox="0 0 400 160">
                  <line x1="30" y1="20" x2="370" y2="20" stroke="#1f283d" />
                  <line x1="30" y1="60" x2="370" y2="60" stroke="#1f283d" />
                  <line x1="30" y1="100" x2="370" y2="100" stroke="#1f283d" />
                  <line x1="30" y1="140" x2="370" y2="140" stroke="#1f283d" />

                  <path d="M 30 40 Q 80 35 120 50 L 160 30 Q 210 70 250 130 Q 300 150 340 135 L 370 132" 
                        fill="none" stroke="#f43f5e" stroke-width="2.5" />

                  <text x="25" y="35" font-size="9" fill="#f43f5e" text-anchor="end">-1.0%</text>
                  <text x="25" y="75" font-size="9" fill="#f43f5e" text-anchor="end">0.0%</text>
                  <text x="25" y="115" font-size="9" fill="#f43f5e" text-anchor="end">+1.0%</text>
                  <text x="25" y="145" font-size="9" fill="#f43f5e" text-anchor="end">+2.0%</text>

                  <text x="50" y="155" font-size="9" fill="#6b7280">2020</text>
                  <text x="160" y="155" font-size="9" fill="#6b7280">2021</text>
                  <text x="260" y="155" font-size="9" fill="#6b7280">2022-23</text>
                  <text x="350" y="155" font-size="9" fill="#6b7280">2025-26</text>
                </svg>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                <strong>Click for Layman's Terms:</strong> Explains how 2% real safe yields compete against tech P/E multiples.
              </p>
            </div>

            {/* Yield Curve Slope */}
            <div 
              onClick={() => openPlaybook("yield_curve_10y3m")}
              className="p-5 rounded-xl bg-[#0f1420] border border-[#20283b] hover:border-blue-500/50 cursor-pointer transition-all duration-200 shadow-sm group"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                    Yield Curve (10Y &minus; 3M Spread)
                  </h4>
                  <p className="text-[11px] text-gray-400">The recession sonar &bull; Un-inversion trigger</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">-0.32% (Un-inverting)</span>
              </div>

              <div className="h-44 w-full">
                <svg className="w-full h-full" viewBox="0 0 400 160">
                  <line x1="30" y1="80" x2="370" y2="80" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="2,2" />
                  <text x="375" y="83" font-size="9" fill="#f59e0b">0.0% Inversion</text>

                  <path d="M 30 60 Q 70 50 110 40 L 150 70 Q 200 140 240 150 Q 290 155 330 120 L 370 100" 
                        fill="none" stroke="#6366f1" stroke-width="2.5" />

                  <path d="M 160 80 Q 200 140 240 150 Q 290 155 330 120 L 350 80 Z" 
                        fill="#ef4444" opacity="0.2" />

                  <text x="25" y="35" font-size="9" fill="#6b7280" text-anchor="end">+1.5%</text>
                  <text x="25" y="83" font-size="9" fill="#6b7280" text-anchor="end">0.0%</text>
                  <text x="25" y="145" font-size="9" fill="#6b7280" text-anchor="end">-1.5%</text>

                  <text x="240" y="125" font-size="9" fill="#ef4444" font-weight="bold" text-anchor="middle">Deepest Inversion since 1981</text>
                </svg>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                <strong>Click for Layman's Terms:</strong> The Submarine Sonar metaphor and the danger of the "Bull Steepener."
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ==================== TAB 2: REAL ECONOMY & LABOR ==================== */}
      {activeSection === "growth" && (
        <div className="space-y-6">
          {/* ISM New Orders - Inventories */}
          <div 
            onClick={() => openPlaybook("ism_noi")}
            className="p-6 rounded-2xl bg-[#0f1420] border border-[#20283b] hover:border-blue-500/50 cursor-pointer transition-all duration-200 shadow-md group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  ISM Manufacturing New Orders &minus; Inventories Spread
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  The #1 leading indicator for S&amp;P 500 quarterly corporate EPS revisions (3 to 4 month lead).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">+4.2 pts &uarr;</span>
            </div>

            <div className="h-56 w-full">
              <svg className="w-full h-full" viewBox="0 0 900 200">
                <line x1="50" y1="20" x2="850" y2="20" stroke="#1f283d" />
                <line x1="50" y1="60" x2="850" y2="60" stroke="#1f283d" />
                <line x1="50" y1="100" x2="850" y2="100" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3,3" />
                <text x="855" y="103" font-size="9" fill="#10b981">0 Spread</text>
                <line x1="50" y1="140" x2="850" y2="140" stroke="#1f283d" />

                <path d="M 50 110 Q 110 120 170 130 L 210 160 Q 240 40 310 30 Q 360 60 410 90 L 470 145 Q 530 150 590 130 Q 650 110 710 95 L 770 85 L 840 75" 
                      fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />

                <path d="M 50 95 Q 110 100 170 115 L 210 150 Q 260 170 310 50 Q 370 35 430 50 L 500 125 Q 560 140 620 120 Q 680 100 740 90 L 840 65" 
                      fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="4,2" />

                <text x="40" y="25" font-size="10" fill="#6b7280" text-anchor="end">+15</text>
                <text x="40" y="105" font-size="10" fill="#6b7280" text-anchor="end">0</text>
                <text x="40" y="145" font-size="10" fill="#6b7280" text-anchor="end">-10</text>

                <text x="50" y="180" font-size="10" fill="#6b7280">2019</text>
                <text x="210" y="180" font-size="10" fill="#6b7280">2020 Lockdowns</text>
                <text x="340" y="180" font-size="10" fill="#6b7280">2021 Restock Boom</text>
                <text x="490" y="180" font-size="10" fill="#6b7280">2022 Inventory Glut</text>
                <text x="640" y="180" font-size="10" fill="#6b7280">2023 Bottoming</text>
                <text x="800" y="180" font-size="10" fill="#6b7280">2025-26 AI &amp; Industrial</text>
              </svg>
            </div>
            <p className="text-xs text-blue-400 font-mono mt-2 flex items-center gap-1">
              <HelpCircle size={14} /> Click for Layman's Terms on operating leverage and cyclical sector rotation.
            </p>
          </div>

          {/* Jobless Claims */}
          <div 
            onClick={() => openPlaybook("jobless_claims")}
            className="p-6 rounded-2xl bg-[#0f1420] border border-[#20283b] hover:border-blue-500/50 cursor-pointer transition-all duration-200 shadow-md group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  Initial Jobless Claims (4-Week Moving Average)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  High-frequency pulse of private sector layoffs (leads monthly BLS unemployment by weeks).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">218k (Solid)</span>
            </div>

            <div className="h-44 w-full">
              <svg className="w-full h-full" viewBox="0 0 900 160">
                <line x1="50" y1="30" x2="850" y2="30" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2,2" />
                <text x="855" y="33" font-size="9" fill="#ef4444">300k Danger Zone</text>
                <line x1="50" y1="80" x2="850" y2="80" stroke="#1f283d" />
                <line x1="50" y1="120" x2="850" y2="120" stroke="#1f283d" />

                <path d="M 50 115 Q 120 118 180 120 L 210 125 Q 230 20 270 15 L 320 110 Q 420 100 520 105 Q 650 110 750 102 L 850 100" 
                      fill="none" stroke="#f59e0b" stroke-width="2.5" />

                <text x="40" y="35" font-size="10" fill="#6b7280" text-anchor="end">300k</text>
                <text x="40" y="85" font-size="10" fill="#6b7280" text-anchor="end">250k</text>
                <text x="40" y="125" font-size="10" fill="#6b7280" text-anchor="end">200k</text>
              </svg>
            </div>
            <p className="text-xs text-blue-400 font-mono mt-2 flex items-center gap-1">
              <HelpCircle size={14} /> Click for Layman's Terms on consumer income and discretionary spending.
            </p>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: GLOBAL MACRO & FX ==================== */}
      {activeSection === "global" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DXY */}
          <div 
            onClick={() => openPlaybook("dxy_index")}
            className="p-6 rounded-2xl bg-[#0f1420] border border-[#20283b] hover:border-blue-500/50 cursor-pointer transition-all duration-200 shadow-md group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                  U.S. Dollar Index (DXY)
                </h3>
                <p className="text-xs text-gray-400">Foreign currency drag &bull; Offshore liquidity squeeze</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">102.8 (Easing)</span>
            </div>

            <div className="h-48 w-full">
              <svg className="w-full h-full" viewBox="0 0 400 160">
                <line x1="30" y1="30" x2="370" y2="30" stroke="#1f283d" />
                <line x1="30" y1="80" x2="370" y2="80" stroke="#1f283d" />
                <line x1="30" y1="130" x2="370" y2="130" stroke="#1f283d" />

                <path d="M 30 110 Q 80 90 120 120 L 160 130 Q 210 100 250 30 Q 290 80 330 65 L 370 75" 
                      fill="none" stroke="#0ea5e9" stroke-width="2.5" />

                <text x="25" y="35" font-size="9" fill="#0ea5e9" text-anchor="end">114</text>
                <text x="25" y="85" font-size="9" fill="#0ea5e9" text-anchor="end">104</text>
                <text x="25" y="135" font-size="9" fill="#0ea5e9" text-anchor="end">94</text>
                <text x="250" y="20" font-size="9" fill="#ef4444" font-weight="bold" text-anchor="middle">2022 Dollar Wrecking Ball</text>
              </svg>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              <strong>Click for Layman's Terms:</strong> How a strong dollar reduces foreign sales for Apple and Microsoft.
            </p>
          </div>

          {/* Copper / Gold */}
          <div 
            onClick={() => openPlaybook("copper_gold")}
            className="p-6 rounded-2xl bg-[#0f1420] border border-[#20283b] hover:border-blue-500/50 cursor-pointer transition-all duration-200 shadow-md group"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                  Copper / Gold Ratio
                </h3>
                <p className="text-xs text-gray-400">Doctor Copper vs Safe-Haven Gold</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">0.174 (Caution)</span>
            </div>

            <div className="h-48 w-full">
              <svg className="w-full h-full" viewBox="0 0 400 160">
                <line x1="30" y1="30" x2="370" y2="30" stroke="#1f283d" />
                <line x1="30" y1="80" x2="370" y2="80" stroke="#1f283d" />
                <line x1="30" y1="130" x2="370" y2="130" stroke="#1f283d" />

                <path d="M 30 110 Q 70 130 110 125 L 150 40 Q 200 30 240 60 Q 290 90 330 100 L 370 120" 
                      fill="none" stroke="#d97706" stroke-width="2.5" />

                <text x="25" y="35" font-size="9" fill="#d97706" text-anchor="end">High</text>
                <text x="25" y="135" font-size="9" fill="#d97706" text-anchor="end">Low</text>
                <text x="320" y="135" font-size="9" fill="#ef4444" font-weight="bold">Sovereign Gold Bid</text>
              </svg>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              <strong>Click for Layman's Terms:</strong> Val's Rule on why gold's recent rally decoupled from the industrial cycle.
            </p>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: 4-QUADRANT REGIME MATRIX ==================== */}
      {activeSection === "matrix" && (
        <div className="p-6 rounded-2xl bg-[#0f1420] border border-[#20283b] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">4-Quadrant Macro Positioning Engine</h3>
              <p className="text-xs text-gray-400">Growth Impulse vs. Financial Conditions Impulse</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ACTIVE: QUADRANT 3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Quadrant 1: Goldilocks Reflation</span>
              <p className="text-xs text-gray-300 mt-1">Growth Accelerating &bull; Liquidity Easing</p>
              <div className="text-xs text-gray-400 mt-2">Playbook: Max Long Beta, Tech Growth, Industrials, Small Caps. P/E multiple expansion.</div>
            </div>

            <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Quadrant 2: Liquidity Rally / Disinflation</span>
              <p className="text-xs text-gray-300 mt-1">Growth Slowing &bull; Central Banks Easing</p>
              <div className="text-xs text-gray-400 mt-2">Playbook: Long-Duration Tech, Megacaps. Multiple expansion offsets sluggish earnings.</div>
            </div>

            <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-500/10 relative">
              <div className="absolute top-2 right-2 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500 text-black">
                CURRENT
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Quadrant 3: Late-Cycle Resilience</span>
              <p className="text-xs text-gray-300 mt-1">Growth Resilient &bull; Liquidity Restrictive (Real Yields 1.9%)</p>
              <div className="text-xs text-gray-200 font-semibold mt-2">Playbook: Free Cash Flow Aristocrats, Megacap Tech (Pristine Balance Sheets). Caution on indebted small caps.</div>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Quadrant 4: Credit Crunch / Liquidation</span>
              <p className="text-xs text-gray-300 mt-1">Growth Collapsing &bull; Liquidity Tightening (HY OAS &gt; 500 bps)</p>
              <div className="text-xs text-gray-400 mt-2">Playbook: Cash, Long Treasuries, Gold, Healthcare. Severe multiple &amp; EPS contraction.</div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: COUNCIL SYNTHESIS ==================== */}
      {activeSection === "council" && (
        <div className="p-6 rounded-2xl bg-[#0f1420] border border-[#20283b] space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-400" />
            <h3 className="text-base font-bold text-white">Frontier Model Council: Signal-to-Noise Reality Check</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42]">
              <span className="font-bold text-blue-400 block mb-1">Pete (OpenAI GPT-5.2)</span>
              <p className="text-gray-300 italic">
                "Never build dual-axis charts without z-scoring or percentile ranking. S&amp;P 500 concentration means macro parameters explain equal-weight and cyclical breadth far better than cap-weighted Mag7 EPS."
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42]">
              <span className="font-bold text-emerald-400 block mb-1">Deepak (DeepSeek Chat v3.1)</span>
              <p className="text-gray-300 italic">
                "Liquidity is a second-derivative game. The level of reserves matters less than the velocity of change. If RRP is exhausted, every dollar of QT is a dollar drained directly from risk asset bids."
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42]">
              <span className="font-bold text-rose-400 block mb-1">Val (xAI Grok 4.7)</span>
              <p className="text-gray-300 italic">
                "Stop looking for a single composite macro score. When Fed liquidity and non-Fed real growth diverge, do not average them into 'neutral.' That divergence IS the trade."
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
