import React, { useEffect, useState } from "react";
import { X, BookOpen, AlertCircle, Lightbulb, TrendingUp, History, ShieldAlert, Cpu } from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";

interface PlaybookData {
  indicator_id: string;
  name: string;
  laymans_term: string;
  intuitive_analogy: string;
  real_world_examples: Array<{
    episode: string;
    what_happened: string;
  }>;
  transmission_to_stocks: {
    multiples?: string;
    earnings?: string;
    factor_rotation?: string;
  };
  playbook_rules: string[];
  formula: string;
  fred_series_id: string;
  signal_type: string;
  update_frequency: string;
}

export const MacroDeepDiveModal: React.FC = () => {
  const {
    selectedMacroIndicator,
    setSelectedMacroIndicator,
    isMacroModalOpen,
    setIsMacroModalOpen,
  } = useWireForgeStore();

  const [playbook, setPlaybook] = useState<PlaybookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"layman" | "examples" | "transmission" | "playbook">("layman");

  useEffect(() => {
    if (!isMacroModalOpen || !selectedMacroIndicator) {
      setPlaybook(null);
      return;
    }

    setLoading(true);
    fetch(`/v1/macro/playbook/${selectedMacroIndicator}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setPlaybook(data.data);
        }
      })
      .catch((err) => console.error("Failed to load playbook:", err))
      .finally(() => setLoading(false));
  }, [isMacroModalOpen, selectedMacroIndicator]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMacroModalOpen) {
        setIsMacroModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMacroModalOpen, setIsMacroModalOpen]);

  if (!isMacroModalOpen || !selectedMacroIndicator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0f1420] border border-[#263147] shadow-2xl text-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f283d] bg-[#131929]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {playbook ? playbook.name : selectedMacroIndicator.replace(/_/g, " ").toUpperCase()}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {playbook?.signal_type || "LEADING"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                FRED Code: <span className="font-mono text-gray-300">{playbook?.fred_series_id || "UPSTREAM"}</span> &bull; {playbook?.update_frequency || "Weekly"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMacroModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e2638] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Sub-tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#1f283d] bg-[#111624] text-xs">
          <button
            onClick={() => setActiveSubTab("layman")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeSubTab === "layman"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Lightbulb size={14} />
            <span>Plain English (Layman's)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("examples")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeSubTab === "examples"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <History size={14} />
            <span>Real-World Examples</span>
          </button>

          <button
            onClick={() => setActiveSubTab("transmission")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeSubTab === "transmission"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <TrendingUp size={14} />
            <span>Transmission to Stocks</span>
          </button>

          <button
            onClick={() => setActiveSubTab("playbook")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeSubTab === "playbook"
                ? "border-blue-500 text-blue-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShieldAlert size={14} />
            <span>Tactical Playbook Rules</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-sm leading-relaxed">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span>Loading playbook intelligence...</span>
            </div>
          ) : playbook ? (
            <>
              {/* Tab 1: Layman's Terms */}
              {activeSubTab === "layman" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1.5">
                      <Lightbulb size={14} />
                      <span>In Plain English</span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {playbook.laymans_term}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42]">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1.5">
                      <Cpu size={14} />
                      <span>The Intuitive Metaphor</span>
                    </div>
                    <p className="text-gray-300 italic text-sm">
                      "{playbook.intuitive_analogy}"
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-2">
                    <div className="text-xs font-mono uppercase tracking-wider text-gray-400">
                      Technical Mathematical Construction
                    </div>
                    <div className="p-2.5 rounded bg-[#0b0e17] border border-[#1b2333] font-mono text-xs text-blue-300">
                      {playbook.formula}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Real-World Examples */}
              {activeSubTab === "examples" && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-400 mb-2">
                    Historical case studies demonstrating exactly how markets behaved when this parameter triggered:
                  </div>
                  {playbook.real_world_examples.map((ex, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                          {ex.episode}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e263a] text-gray-400">
                          Historical Study
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed pt-1">
                        {ex.what_happened}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Transmission to Stocks */}
              {activeSubTab === "transmission" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42]">
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        P/E Multiples Impact
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {playbook.transmission_to_stocks.multiples || "Direct impact on valuation hurdle rates."}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42]">
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                        Corporate Earnings Impact
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {playbook.transmission_to_stocks.earnings || "Impacts revenue velocity, borrowing costs, and operating margins."}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42]">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                        Factor Rotation Bias
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {playbook.transmission_to_stocks.factor_rotation || "Shifts leadership between Growth, Value, Small Caps, and Defensives."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Tactical Playbook Rules */}
              {activeSubTab === "playbook" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
                    <ShieldAlert size={14} />
                    <span>Actionable Risk Protocols</span>
                  </div>
                  {playbook.playbook_rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-[#141a29] border border-[#232d42] text-xs">
                      <span className="font-mono text-blue-400 font-bold">{idx + 1}.</span>
                      <span className="text-gray-200">{rule}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Indicator metadata could not be retrieved.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#1f283d] bg-[#111624] text-xs font-mono text-gray-400">
          <span>Source: Forge Quantitative Engine (:8080)</span>
          <button
            onClick={() => setIsMacroModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
