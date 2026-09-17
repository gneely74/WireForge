import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  Bookmark,
  Layers,
  Sparkles,
  Search,
} from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { Watchlist } from "@wireforge/shared";

function broadcastWatchlistUpdate() {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel("wireforge_watchlist_sync");
      ch.postMessage({ type: "WATCHLIST_UPDATED", timestamp: Date.now() });
      ch.close();
    }
  } catch {}
}

export const WatchlistManagerModal: React.FC = () => {
  const {
    watchlists,
    setWatchlists,
    activeWatchlistId,
    setActiveWatchlistId,
    isWatchlistManagerOpen,
    setIsWatchlistManagerOpen,
  } = useWireForgeStore();

  const [selectedId, setSelectedId] = useState<string>(
    activeWatchlistId !== "all" ? activeWatchlistId : watchlists[0]?.id || "options-bellwethers"
  );
  const [newSymbol, setNewSymbol] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isWatchlistManagerOpen) return null;

  const currentWatchlist = watchlists.find((w) => w.id === selectedId) || watchlists[0];

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    const sym = newSymbol.trim().toUpperCase();
    if (!sym || !currentWatchlist) return;

    if (currentWatchlist.symbols.includes(sym)) {
      setError(`$${sym} is already in this watchlist`);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/v1/watchlists/${currentWatchlist.id}/symbols`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = watchlists.map((w) => (w.id === currentWatchlist.id ? data.data : w));
        setWatchlists(updated);
        setNewSymbol("");
        broadcastWatchlistUpdate();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to add symbol");
      }
    } catch {
      setError("Network error adding symbol");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSymbol = async (sym: string) => {
    if (!currentWatchlist) return;
    setError(null);
    try {
      const res = await fetch(`/v1/watchlists/${currentWatchlist.id}/symbols/${sym}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        const updated = watchlists.map((w) => (w.id === currentWatchlist.id ? data.data : w));
        setWatchlists(updated);
        broadcastWatchlistUpdate();
      }
    } catch {
      setError("Failed to remove symbol");
    }
  };

  const handleResetPreset = async () => {
    if (!currentWatchlist || !currentWatchlist.isPreset) return;
    setError(null);
    try {
      const res = await fetch(`/v1/watchlists/${currentWatchlist.id}/reset`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        const updated = watchlists.map((w) => (w.id === currentWatchlist.id ? data.data : w));
        setWatchlists(updated);
        broadcastWatchlistUpdate();
      }
    } catch {
      setError("Failed to reset preset");
    }
  };

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/v1/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, symbols: [] }),
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlists([...watchlists, data.data]);
        setSelectedId(data.data.id);
        setNewListName("");
        setIsCreating(false);
        broadcastWatchlistUpdate();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to create watchlist");
      }
    } catch {
      setError("Network error creating watchlist");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this watchlist?")) return;
    setError(null);
    try {
      const res = await fetch(`/v1/watchlists/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updated = watchlists.filter((w) => w.id !== id);
        setWatchlists(updated);
        if (selectedId === id) {
          setSelectedId(updated[0]?.id || "options-bellwethers");
        }
        if (activeWatchlistId === id) {
          setActiveWatchlistId("all");
        }
        broadcastWatchlistUpdate();
      }
    } catch {
      setError("Failed to delete watchlist");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-3xl h-[560px] bg-[#0f131c] border border-[#232b3d] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1f2738] bg-[#141926]">
          <div className="flex items-center gap-2">
            <Bookmark size={17} className="text-amber-400" />
            <span className="font-bold text-sm text-white tracking-wide">
              Shared Watchlist Manager
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2638] text-blue-400 border border-blue-500/20">
              Synced with ChartForge & RadarScreen
            </span>
          </div>
          <button
            onClick={() => setIsWatchlistManagerOpen(false)}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1f2738] transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Watchlists List */}
          <div className="w-64 border-r border-[#1f2738] bg-[#111622] flex flex-col justify-between">
            <div className="p-3 flex flex-col gap-2 overflow-y-auto flex-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Universes ({watchlists.length})
                </span>
                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300"
                >
                  <Plus size={12} />
                  <span>New</span>
                </button>
              </div>

              {isCreating && (
                <form onSubmit={handleCreateWatchlist} className="p-2 rounded bg-[#161d2c] border border-blue-500/40 flex flex-col gap-1.5">
                  <input
                    type="text"
                    placeholder="Watchlist name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded bg-[#0d1017] border border-[#273247] text-white focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-2 py-0.5 text-[11px] text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !newListName.trim()}
                      className="px-2.5 py-0.5 text-[11px] rounded bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-col gap-1">
                {watchlists.map((wl) => {
                  const isSelected = wl.id === selectedId;
                  return (
                    <div
                      key={wl.id}
                      onClick={() => setSelectedId(wl.id)}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? "bg-blue-600/15 border border-blue-500/40 text-white font-semibold"
                          : "text-gray-300 hover:bg-[#161c29] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Layers size={13} className={isSelected ? "text-blue-400" : "text-amber-400/70"} />
                        <span className="truncate">{wl.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1b2233] text-gray-400">
                          {wl.symbols.length}
                        </span>
                        {!wl.isPreset && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWatchlist(wl.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-400 rounded transition-opacity"
                            title="Delete custom watchlist"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-[#1f2738] bg-[#0e121a] text-[10px] text-gray-500 flex items-center justify-between">
              <span>Edits sync automatically</span>
              <span className="text-emerald-400 font-mono">LIVE SYNC</span>
            </div>
          </div>

          {/* Right Column: Active Watchlist Detail & Symbols Editor */}
          {currentWatchlist ? (
            <div className="flex-1 flex flex-col p-5 overflow-hidden bg-[#0d111a]">
              {/* Top Details & Controls */}
              <div className="flex items-start justify-between pb-4 border-b border-[#1c2436]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{currentWatchlist.name}</h3>
                    {currentWatchlist.isPreset ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        PRESET
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {currentWatchlist.description || "Shared market watchlist universe"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentWatchlist.isPreset && (
                    <button
                      onClick={handleResetPreset}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161d2b] hover:bg-[#1f283b] text-gray-300 text-xs border border-[#253047] transition-colors"
                      title="Reset this preset watchlist to its canonical defaults"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Defaults</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveWatchlistId(currentWatchlist.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      activeWatchlistId === currentWatchlist.id
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                  >
                    <Check size={12} />
                    <span>{activeWatchlistId === currentWatchlist.id ? "Active Filter" : "Filter Workstation"}</span>
                  </button>
                </div>
              </div>

              {/* Add Symbol Input Row */}
              <form onSubmit={handleAddSymbol} className="flex items-center gap-2 my-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Add ticker to watchlist (e.g. ARM, TSM, COIN)..."
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#141926] border border-[#242e42] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !newSymbol.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  <Plus size={13} />
                  <span>Add Ticker</span>
                </button>
              </form>

              {error && (
                <div className="mb-3 px-3 py-1.5 rounded bg-red-950/40 border border-red-900/50 text-red-300 text-xs">
                  {error}
                </div>
              )}

              {/* Symbols Pills Grid */}
              <div className="flex-1 overflow-y-auto">
                <div className="text-[11px] font-mono text-gray-400 mb-2 flex items-center justify-between">
                  <span>Tickers in Universe ({currentWatchlist.symbols.length})</span>
                  <span className="text-[10px] text-gray-500">Click × to remove</span>
                </div>

                {currentWatchlist.symbols.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-xs">
                    No symbols in this watchlist. Type a ticker above to add.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentWatchlist.symbols.map((sym) => (
                      <div
                        key={sym}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141a28] hover:bg-[#1a2336] border border-[#242f45] text-xs font-mono transition-colors group"
                      >
                        <span className="font-bold text-white">${sym}</span>
                        <button
                          onClick={() => handleRemoveSymbol(sym)}
                          className="text-gray-500 hover:text-red-400 p-0.5 rounded transition-colors"
                          title={`Remove $${sym}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
              Select a watchlist on the left to manage symbols
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
