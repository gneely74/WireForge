import React, { useState, useRef, useEffect } from "react";
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
  Bookmark,
  ChevronDown,
  Globe,
  Check,
  Layers,
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
    watchlists,
    activeWatchlistId,
    setActiveWatchlistId,
    setIsWatchlistManagerOpen,
  } = useWireForgeStore();

  const { testSquawk } = useAudioSquawk();
  const [quickSearch, setQuickSearch] = useState("");
  const [isWatchlistDropdownOpen, setIsWatchlistDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWatchlistDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      setSelectedTicker(quickSearch.trim().toUpperCase());
      setQuickSearch("");
    }
  };

  const chartforgeUrl = ecosystemHealth?.chartforge.url || "http://192.168.74.102:5188";
  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId);

  return (
    <header className="flex flex-col bg-[#0d111a] border-b border-[#1f2637] select-none">
      {/* Top Main Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo, Status, & Watchlist Universe Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-black tracking-wider text-base text-white">
            <span className="text-blue-500 text-lg">⚡</span>
            <span>WIRE<span className="text-blue-500">FORGE</span></span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-normal border border-blue-500/30">
              TERMINAL
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs pr-2 border-r border-[#1f2637]">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-gray-400 font-mono text-[11px]">
              {isConnected ? "LIVE FEED" : "CONNECTING..."}
            </span>
          </div>

          {/* Shared Watchlist Universe Dropdown */}
          <div className="flex items-center gap-1">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  const nextState = !isWatchlistDropdownOpen;
                  setIsWatchlistDropdownOpen(nextState);
                  if (nextState) {
                    fetch("/v1/watchlists")
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.data && Array.isArray(data.data)) {
                          useWireForgeStore.getState().setWatchlists(data.data);
                        }
                      })
                      .catch(() => {});
                  }
                }}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#151a26] hover:bg-[#1a2233] border border-[#232b3d] text-xs transition-colors"
                title="Filter WireForge streams by shared watchlist"
              >
                {activeWatchlistId === "all" ? (
                  <Globe size={13} className="text-blue-400" />
                ) : (
                  <Bookmark size={13} className="text-amber-400" />
                )}
                <span className="font-semibold text-gray-200">
                  {activeWatchlist ? activeWatchlist.name : "All Markets"}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1e2638] text-gray-400 border border-[#2a344d]">
                  {activeWatchlist ? `${activeWatchlist.symbols.length}` : "ALL"}
                </span>
                <ChevronDown size={12} className="text-gray-400 ml-0.5" />
              </button>

              {isWatchlistDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-72 rounded-lg bg-[#121622] border border-[#263147] shadow-2xl z-50 overflow-hidden py-1">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-gray-400 border-b border-[#1c2436] flex items-center justify-between">
                    <span>Shared Watchlists</span>
                    <span className="text-[9px] text-blue-400">ChartForge Sync</span>
                  </div>

                  {/* All Markets Option */}
                  <button
                    onClick={() => {
                      setActiveWatchlistId("all");
                      setIsWatchlistDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#182030] text-xs transition-colors ${
                      activeWatchlistId === "all" ? "bg-blue-600/15 text-blue-400 font-semibold" : "text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe size={13} className={activeWatchlistId === "all" ? "text-blue-400" : "text-gray-400"} />
                      <div>
                        <div>All Markets (Unfiltered)</div>
                        <div className="text-[10px] text-gray-500">Global broad market news & flow</div>
                      </div>
                    </div>
                    {activeWatchlistId === "all" && <Check size={13} className="text-blue-400" />}
                  </button>

                  <div className="my-1 border-t border-[#1c2436]" />

                  {/* Watchlists List */}
                  <div className="max-h-60 overflow-y-auto">
                    {watchlists.map((wl) => {
                      const isSelected = activeWatchlistId === wl.id;
                      return (
                        <button
                          key={wl.id}
                          onClick={() => {
                            setActiveWatchlistId(wl.id);
                            setIsWatchlistDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#182030] text-xs transition-colors ${
                            isSelected ? "bg-blue-600/15 text-blue-400 font-semibold" : "text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Layers size={13} className={isSelected ? "text-blue-400" : "text-amber-400/80"} />
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{wl.name}</span>
                                <span className="text-[10px] font-mono px-1 rounded bg-[#1c2333] text-gray-400">
                                  {wl.symbols.length}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500 truncate">
                                {wl.symbols.slice(0, 6).join(", ")}
                                {wl.symbols.length > 6 ? "..." : ""}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check size={13} className="text-blue-400 flex-shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Manage Watchlists Action Button */}
                  <div className="p-1.5 border-t border-[#1c2436] bg-[#0f131c]">
                    <button
                      onClick={() => {
                        setIsWatchlistDropdownOpen(false);
                        setIsWatchlistManagerOpen(true);
                      }}
                      className="w-full py-1.5 px-2 rounded bg-[#182030] hover:bg-blue-600/20 hover:text-blue-300 text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-500/30 transition-colors"
                    >
                      <Sliders size={13} />
                      <span>Manage & Edit Watchlists</span>
                    </button>
                  </div>

                  <div className="px-3 py-1.5 text-[9px] font-mono text-gray-500 bg-[#0d1017] border-t border-[#1c2436] flex items-center justify-between">
                    <span>Linked to RadarScreen (:8080)</span>
                    <span>BroadcastChannel</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsWatchlistManagerOpen(true)}
              className="p-1.5 rounded-lg bg-[#151a26] hover:bg-[#1a2233] border border-[#232b3d] text-gray-400 hover:text-white transition-colors"
              title="Open Watchlist Manager (Add/Remove Tickers)"
            >
              <Sliders size={13} />
            </button>
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
              {ecosystemHealth?.tradingAgent.dixSentiment || "STANDBY"}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-gray-500">DARK POOL DIX:</span>
            <span className="text-white font-bold">
              {ecosystemHealth?.tradingAgent.dixValue !== undefined
                ? `${ecosystemHealth.tradingAgent.dixValue.toFixed(1)}%`
                : "—"}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-gray-500">SPY CALL WALL:</span>
            <span className="text-fuchsia-400 font-bold">
              {ecosystemHealth?.tradingAgent.gexCallWall !== undefined
                ? ecosystemHealth.tradingAgent.gexCallWall.toFixed(2)
                : "—"}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-gray-500">SPY PUT WALL:</span>
            <span className="text-teal-400 font-bold">
              {ecosystemHealth?.tradingAgent.gexPutWall !== undefined
                ? ecosystemHealth.tradingAgent.gexPutWall.toFixed(2)
                : "—"}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-gray-500">ZERO GAMMA FLIP:</span>
            <span className="text-yellow-400 font-bold">
              {ecosystemHealth?.tradingAgent.gexZeroFlip !== undefined
                ? ecosystemHealth.tradingAgent.gexZeroFlip.toFixed(2)
                : "—"}
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
