import React, { useEffect, useState } from "react";
import { Calendar, DollarSign, Globe, CheckCircle } from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { EarningsEvent, EconomicRelease } from "@wireforge/shared";

export const CorporateCalendar: React.FC = () => {
  const { earnings, economic, setEarnings, setEconomic, setSelectedTicker } = useWireForgeStore();
  const [calendarTab, setCalendarTab] = useState<"earnings" | "economic">("earnings");

  useEffect(() => {
    fetch("/v1/calendars/earnings")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setEarnings(data.data);
      })
      .catch(() => {});

    fetch("/v1/calendars/economic")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setEconomic(data.data);
      })
      .catch(() => {});
  }, [setEarnings, setEconomic]);

  return (
    <div className="flex flex-col h-full bg-[#0e121b] overflow-hidden">
      {/* Top Tabs */}
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
        </div>

        <span className="text-gray-500 font-mono text-xs">Wall Street Catalyst Calendar</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 text-xs">
        {calendarTab === "earnings" ? (
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
                            : "bg-purple-950/60 text-purple-300 border border-purple-800/40"
                        }`}
                      >
                        {e.timing === "BMO" ? "BEFORE OPEN" : "AFTER CLOSE"}
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
        ) : (
          <div className="rounded-xl border border-[#20283b] bg-[#121622] overflow-hidden">
            <table className="w-full text-left font-mono border-collapse">
              <thead className="bg-[#171d2b] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Time (EDT)</th>
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
                    <td className="py-2.5 px-3 font-bold text-white font-sans">{ec.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ec.impact === "high"
                            ? "bg-red-950/60 text-red-300 border border-red-800/40"
                            : "bg-blue-950/60 text-blue-300 border border-blue-800/40"
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
        )}
      </div>
    </div>
  );
};
