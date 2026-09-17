import React, { useEffect, useState, useCallback } from "react";
import { DollarSign, Globe, AlertTriangle, RefreshCw, Loader2, Database } from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { EarningsEvent, EconomicRelease } from "@wireforge/shared";

interface StatusState {
  loading: boolean;
  source?: string;
  error?: string;
  message?: string;
  actionable?: string;
}

export const CorporateCalendar: React.FC = () => {
  const { earnings, economic, setEarnings, setEconomic, setSelectedTicker } = useWireForgeStore();
  const [calendarTab, setCalendarTab] = useState<"earnings" | "economic">("earnings");

  const [earningsStatus, setEarningsStatus] = useState<StatusState>({ loading: true });
  const [economicStatus, setEconomicStatus] = useState<StatusState>({ loading: true });

  const fetchEarnings = useCallback(() => {
    setEarningsStatus((s) => ({ ...s, loading: true, error: undefined }));
    fetch("/v1/calendars/earnings")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setEarnings(data.data);
        }
        setEarningsStatus({
          loading: false,
          source: data.source || "SEC EDGAR",
          error: data.error,
          message: data.message,
          actionable: data.actionable,
        });
      })
      .catch((err) => {
        setEarningsStatus({
          loading: false,
          error: "FETCH_FAILED",
          message: `Network error reaching calendar endpoint: ${err.message}`,
          actionable: "Check if the WireForge API server is running.",
        });
      });
  }, [setEarnings]);

  const fetchEconomic = useCallback(() => {
    setEconomicStatus((s) => ({ ...s, loading: true, error: undefined }));
    fetch("/v1/calendars/economic")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setEconomic(data.data);
        }
        setEconomicStatus({
          loading: false,
          source: data.source || "Trading Agent",
          error: data.error,
          message: data.message,
          actionable: data.actionable,
        });
      })
      .catch((err) => {
        setEconomicStatus({
          loading: false,
          error: "FETCH_FAILED",
          message: `Network error reaching economic calendar endpoint: ${err.message}`,
          actionable: "Check if the WireForge API server is running.",
        });
      });
  }, [setEconomic]);

  useEffect(() => {
    fetchEarnings();
    fetchEconomic();
  }, [fetchEarnings, fetchEconomic]);

  const currentStatus = calendarTab === "earnings" ? earningsStatus : economicStatus;
  const onRefreshCurrent = calendarTab === "earnings" ? fetchEarnings : fetchEconomic;

  return (
    <div className="flex flex-col h-full bg-[#0e121b] overflow-hidden">
      {/* Top Tabs & Live Feed Meta */}
      <div className="flex items-center justify-between p-3 border-b border-[#1e2536] bg-[#121622]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#171d2b] p-0.5 rounded-lg border border-[#252f44] text-xs">
            <button
              onClick={() => setCalendarTab("earnings")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-colors ${
                calendarTab === "earnings"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <DollarSign size={13} />
              <span>Earnings Calendar</span>
            </button>

            <button
              onClick={() => setCalendarTab("economic")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold transition-colors ${
                calendarTab === "economic"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Globe size={13} />
              <span>Economic Releases</span>
            </button>
          </div>

          <button
            onClick={onRefreshCurrent}
            disabled={currentStatus.loading}
            title="Refresh Live Data"
            className="p-1.5 rounded-md hover:bg-[#1f283d] text-gray-400 hover:text-white transition-colors border border-[#232c42]"
          >
            <RefreshCw size={13} className={currentStatus.loading ? "animate-spin text-blue-400" : ""} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentStatus.source && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-[#161c2a] px-2 py-0.5 rounded border border-[#232c42]">
              <Database size={11} className="text-emerald-400" />
              <span>{currentStatus.source.replace(/^https?:\/\//, "")}</span>
            </span>
          )}
          <span className="text-gray-500 font-mono text-xs hidden md:inline">Wall Street Catalyst Calendar</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 text-xs">
        {/* Actionable Error Banner */}
        {currentStatus.error && (
          <div className="mb-4 p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <div className="font-semibold text-sm text-amber-300">
                  {calendarTab === "earnings" ? "Live Earnings Service Offline" : "Trading Agent Calendar Offline"}
                </div>
                <div className="mt-1 text-xs text-amber-200/90 font-mono">
                  {currentStatus.message}
                </div>
                {currentStatus.actionable && (
                  <div className="mt-2 text-xs bg-amber-950/40 p-2 rounded border border-amber-800/40 text-amber-100">
                    <span className="font-bold text-amber-300 uppercase text-[10px] block mb-0.5">Actionable Remediation:</span>
                    {currentStatus.actionable}
                  </div>
                )}
                <div className="mt-3">
                  <button
                    onClick={onRefreshCurrent}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-semibold rounded text-xs transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {currentStatus.loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="animate-spin mb-2 text-blue-400" size={24} />
            <span className="font-mono text-xs">
              Fetching authentic {calendarTab === "earnings" ? "corporate earnings from SEC EDGAR" : "releases from Trading Agent"}...
            </span>
          </div>
        )}

        {/* Tables */}
        {!currentStatus.loading && calendarTab === "earnings" && (
          earnings.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">
                No corporate earnings scheduled in the upcoming window.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#121622] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#171d2b] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Timing</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3 text-right">EPS Est</th>
                    <th className="py-2.5 px-3 text-right">Rev Est</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2130]">
                  {earnings.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedTicker(e.ticker)}
                      className="hover:bg-[#182030] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 text-gray-400">{e.date}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            e.timing === "BMO"
                              ? "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                              : e.timing === "AMC"
                              ? "bg-purple-950/60 text-purple-300 border border-purple-800/40"
                              : "bg-gray-800/60 text-gray-300 border border-gray-700/40"
                          }`}
                        >
                          {e.timing === "BMO" ? "BEFORE OPEN" : e.timing === "AMC" ? "AFTER CLOSE" : "DURING MARKET"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">${e.ticker}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans">{e.companyName}</td>
                      <td className="py-2.5 px-3 text-gray-400">{e.fiscalQuarter}</td>
                      <td className="py-2.5 px-3 text-right text-white">
                        {e.epsEstimate !== null ? `$${e.epsEstimate?.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-white">{e.revEstimate || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {!currentStatus.loading && calendarTab === "economic" && (
          economic.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">
                No macroeconomic events scheduled in the current horizon.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#121622] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#171d2b] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Country</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Impact</th>
                    <th className="py-2.5 px-3 text-right">Forecast</th>
                    <th className="py-2.5 px-3 text-right">Prior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2130]">
                  {economic.map((ec) => (
                    <tr key={ec.id} className="hover:bg-[#182030] transition-colors">
                      <td className="py-2.5 px-3 text-gray-400">{ec.date}</td>
                      <td className="py-2.5 px-3 text-gray-400">{ec.time}</td>
                      <td className="py-2.5 px-3 text-gray-300">{ec.country}</td>
                      <td className="py-2.5 px-3 font-bold text-white font-sans">{ec.name}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ec.impact === "high"
                              ? "bg-red-950/60 text-red-300 border border-red-800/40"
                              : ec.impact === "medium"
                              ? "bg-blue-950/60 text-blue-300 border border-blue-800/40"
                              : "bg-gray-800 text-gray-300 border border-gray-700"
                          }`}
                        >
                          {ec.impact}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-white">{ec.forecast || "—"}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{ec.previous || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

