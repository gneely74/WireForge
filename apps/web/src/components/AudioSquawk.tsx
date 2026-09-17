import React, { useEffect } from "react";
import { X, Volume2, VolumeX, Radio, Play, CheckCircle2, History, Sliders } from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { useAudioSquawk } from "../hooks/useAudioSquawk.js";

export const AudioSquawk: React.FC = () => {
  const {
    squawkEnabled,
    setSquawkEnabled,
    squawkVolume,
    setSquawkVolume,
    squawkRate,
    setSquawkRate,
    selectedVoiceURI,
    setSelectedVoiceURI,
    squawkChannels,
    setSquawkChannel,
    squawkHistory,
    isSquawkPlaying,
    isSquawkDrawerOpen,
    setSquawkDrawerOpen,
  } = useWireForgeStore();

  const { availableVoices, testSquawk } = useAudioSquawk();

  useEffect(() => {
    if (!isSquawkDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSquawkDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSquawkDrawerOpen, setSquawkDrawerOpen]);

  if (!isSquawkDrawerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none"
      onClick={() => setSquawkDrawerOpen(false)}
    >
      <div
        className="flex flex-col w-full max-w-xl rounded-xl border border-[#273248] bg-[#121622] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#20293b] bg-[#161c2b]">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-blue-400 animate-pulse" />
            <span className="font-bold text-base text-white tracking-wide">
              Audio Squawk Box Control
            </span>
          </div>
          <button
            onClick={() => setSquawkDrawerOpen(false)}
            className="p-1 text-gray-400 hover:text-white rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Settings */}
        <div className="p-4 flex flex-col gap-4 text-xs overflow-y-auto max-h-[80vh]">
          {/* Main Master Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#182030] border border-[#273248]">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  squawkEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800 text-gray-500"
                }`}
              >
                {squawkEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Automated Voice Squawk</h4>
                <p className="text-gray-400">
                  {squawkEnabled
                    ? "Live voice broadcast enabled for tier-1 breaking market events."
                    : "Squawk audio is currently muted."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSquawkEnabled(!squawkEnabled)}
              className={`px-4 py-1.5 rounded-lg font-bold transition-colors ${
                squawkEnabled
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {squawkEnabled ? "ENABLED" : "DISABLED"}
            </button>
          </div>

          {/* Voice Tuning Controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* Volume */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#151b29] border border-[#222a3d]">
              <div className="flex items-center justify-between text-gray-300 font-semibold">
                <span>Volume</span>
                <span className="font-mono text-blue-400">{Math.round(squawkVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={squawkVolume}
                onChange={(e) => setSquawkVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#252f44] rounded appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Speech Rate */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#151b29] border border-[#222a3d]">
              <div className="flex items-center justify-between text-gray-300 font-semibold">
                <span>Speed / Cadence</span>
                <span className="font-mono text-blue-400">{squawkRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={squawkRate}
                onChange={(e) => setSquawkRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#252f44] rounded appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Voice Selector */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#151b29] border border-[#222a3d]">
            <span className="font-semibold text-gray-300">System Speech Synthesizer Voice</span>
            <select
              value={selectedVoiceURI || ""}
              onChange={(e) => setSelectedVoiceURI(e.target.value || null)}
              className="w-full px-3 py-1.5 rounded bg-[#1c2436] border border-[#2d3a54] text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Default Optimal Voice</option>
              {availableVoices
                .filter((v) => v.lang.startsWith("en"))
                .map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
            </select>
          </div>

          {/* Channels / Categories */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#151b29] border border-[#222a3d]">
            <span className="font-semibold text-gray-300 mb-1">Squawk Audio Trigger Channels</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-gray-200">
                <input
                  type="checkbox"
                  checked={squawkChannels.news}
                  onChange={(e) => setSquawkChannel("news", e.target.checked)}
                  className="rounded border-[#2d3a54] bg-[#1c2436] text-blue-600 focus:ring-0"
                />
                <span>Tier-1 Breaking News Headlines & SEC 8-Ks</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-200">
                <input
                  type="checkbox"
                  checked={squawkChannels.flow}
                  onChange={(e) => setSquawkChannel("flow", e.target.checked)}
                  className="rounded border-[#2d3a54] bg-[#1c2436] text-blue-600 focus:ring-0"
                />
                <span>Unusual Golden Sweeps & Options Blocks (&gt;$750k Premium)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-200">
                <input
                  type="checkbox"
                  checked={squawkChannels.halts}
                  onChange={(e) => setSquawkChannel("halts", e.target.checked)}
                  className="rounded border-[#2d3a54] bg-[#1c2436] text-blue-600 focus:ring-0"
                />
                <span>Market Volatility Halts & LULD Circuit Breakers</span>
              </label>
            </div>
          </div>

          {/* Test Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => testSquawk()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              <Play size={14} />
              <span>Test Audio Voice</span>
            </button>

            <span className="text-gray-500 font-mono text-[11px]">
              HTML5 SpeechSynthesis Engine (Zero API Keys)
            </span>
          </div>

          {/* Squawk History */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#20293b]">
            <div className="flex items-center gap-1.5 text-gray-400 font-semibold">
              <History size={13} />
              <span>Recent Squawk Announcements ({squawkHistory.length})</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              {squawkHistory.length === 0 ? (
                <div className="text-gray-500 italic py-2">No squawk announcements yet.</div>
              ) : (
                squawkHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded bg-[#161c2b] border border-[#222a3d] text-gray-300 font-mono text-[11px] flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between text-gray-500 text-[10px]">
                      <span className="uppercase font-bold text-blue-400">{item.category}</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span>{item.text}</span>
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
