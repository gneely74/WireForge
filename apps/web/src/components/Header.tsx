import React, { useState } from "react";
import {
  Activity,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Calendar,
  Zap,
  ExternalLink,
  Search,
} from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { useAudioSquawk } from "../hooks/useAudioSquawk.js";

interface HeaderProps {
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isConnected }) => {
  const {
    activeTab,
    setActiveTab,
    squawkEnabled,
    setSquawkEnabled,
    squawkVolume,
    setSquawkVolume,
    isSquawkPlaying,
    setSquawkDrawerOpen,
    ecosystemHealth,
    setSelectedTicker,
  } = useWireForgeStore();

  const { testSquawk } = useAudioSquawk();
  const [quickSearch, setQuickSearch] = useState("");

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      setSelectedTicker(quickSearch.trim().toUpperCase());
      setQuickSearch("");
    }
  };

  const chartforgeUrl = ecosystemHealth?.chartforge.url || "http://192.168.74.102:5188";

  return (
    <header className="flex flex-col bg-[#0d111a] border-b border-[#1f2637] select-none">
      {/* Top Main Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black tracking-wider text-base text-white">
            <span className="text-blue-500 text-lg">⚡</span>
            <span>WIRE<span className="text-blue-500">FORGE</span></span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-normal border border-blue-500/30">
              TERMINAL
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-gray-400 font-mono text-[11px]">
              {isConnected ? "LIVE FEED" : "CONNECTING..."}
            </span>
          </div>
        </div>

        {/* Center Workspace Tabs */}
        <div className="flex items-center gap-1 bg-[#151a26] p-0.5 rounded-lg border border-[#232b3d] text-xs">
          <button
            onClick={() => setActiveTab("split")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "split"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sliders size={13} />
            <span>Split Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab("news")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "news"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Radio size={13} />
            <span>News Wire</span>
          </button>

          <button
            onClick={() => setActiveTab("flow")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "flow"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Zap size={13} />
            <span>Options Flow (UOA)</span>
          </button>

          <button
            onClick={() => setActiveTab("signals")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "signals"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Activity size={13} />
            <span>Signals & Halts</span>
          </button>

          <button
            onClick={() => setActiveTab("calendars")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "calendars"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Calendar size={13} />
            <span>Calendars</span>
          </button>
        </div>

        {/* Right Tools: Quick Search, Audio Squawk, ChartForge Link */}
        <div className="flex items-center gap-3">
          {/* Quick Symbol Lookup */}
          <form onSubmit={handleQuickSearchSubmit} className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-gray-500" />
            <input
              type="text"
              placeholder="Inspect ticker (e.g. NVDA)..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-48 pl-7 pr-2 py-1 text-xs rounded bg-[#151a26] border border-[#232b3d] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono uppercase"
            />
          </form>

          {/* Audio Squawk Box Controls */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#151a26] border border-[#232b3d]">
            <button
              onClick={() => setSquawkEnabled(!squawkEnabled)}
              title={squawkEnabled ? "Mute Voice Squawk" : "Enable Voice Squawk"}
              className={`p-1 rounded transition-colors ${
                squawkEnabled
                  ? isSquawkPlaying
                    ? "text-emerald-400 animate-pulse bg-emerald-500/20"
                    : "text-blue-400 hover:text-blue-300"
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              {squawkEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <span className="text-[11px] font-mono font-medium text-gray-300">
              SQUAWK {squawkEnabled ? (isSquawkPlaying ? "ACTIVE" : "ON") : "OFF"}
            </span>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={squawkVolume}
              onChange={(e) => setSquawkVolume(parseFloat(e.target.value))}
              className="w-14 h-1 bg-[#232b3d] rounded-lg appearance-none cursor-pointer accent-blue-500"
              title={`Squawk Volume: ${Math.round(squawkVolume * 100)}%`}
            />

            <button
              onClick={() => setSquawkDrawerOpen(true)}
              className="p-1 text-gray-400 hover:text-white rounded"
              title="Open Squawk Audio Settings & History"
            >
              <Sliders size={13} />
            </button>
          </div>

          {/* Deep Link to ChartForge */}
          <a
            href={chartforgeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e2433] hover:bg-[#283145] text-blue-400 hover:text-blue-300 text-xs font-mono font-medium border border-[#2e374a] transition-colors"
            title="Launch ChartForge Charting Workstation in new tab"
          >
            <span>ChartForge</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Institutional Market Regime Ribbon */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#090c12] border-t border-[#1a202e] text-[11px] font-mono">
        <div className="flex items-center gap-4 text-gray-400">
          <span className="flex items-center gap-1">
            <span className="text-gray-500">REGIME:</span>
            <span className="text-emerald-400 font-bold">
              {ecosystemHealth?.tradingAgent.dixSentiment || "ACCUMULATION"}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-gray-500">DARK POOL DIX:</span>
            <span className="text-white font-bold">
              {ecosystemHealth?.tradingAgent.dixValue?.toFixed(1) || "44.8"}%
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-gray-500">SPY CALL WALL:</span>
            <span className="text-fuchsia-400 font-bold">
              {ecosystemHealth?.tradingAgent.gexCallWall || "575.00"}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-gray-500">SPY PUT WALL:</span>
            <span className="text-teal-400 font-bold">
              {ecosystemHealth?.tradingAgent.gexPutWall || "560.00"}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-gray-500">ZERO GAMMA FLIP:</span>
            <span className="text-yellow-400 font-bold">
              {ecosystemHealth?.tradingAgent.gexZeroFlip || "565.00"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-gray-500">
          <span>THETADATA: {ecosystemHealth?.thetadata.connected ? "ONLINE" : "STANDBY"}</span>
          <span>TRADING AGENT: {ecosystemHealth?.tradingAgent.connected ? "CONNECTED" : "STANDBY"}</span>
          <span>CHARTFORGE: {ecosystemHealth?.chartforge.connected ? "CONNECTED" : "ONLINE"}</span>
        </div>
      </div>
    </header>
  );
};
