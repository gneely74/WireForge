/**
 * @file BiotechDetailModal.tsx
 * @description Deep-dive biotechnology composite equity intelligence modal.
 *
 * Merges four authentic live layers:
 * 1. BioPharmCatalyst Clinical Readouts & Milestones (phase, indication, catalyst date, notes)
 * 2. ValueForge (192.168.74.105:4000) SEC Form 10-K, 10-Q, 8-K filings and cash runway balance
 * 3. ClinicalTrials.gov API v2 Official NIH study registry data (status, enrollment, completion date)
 * 4. ThetaData Real-Time Options Sentiment & Sweeps scanner
 */

import React, { useEffect, useState } from "react";
import {
  X,
  ExternalLink,
  FlaskConical,
  FileText,
  DollarSign,
  AlertTriangle,
  Zap,
  Activity,
  Calendar,
  CheckCircle2,
  Building2,
  RefreshCw,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import { BiotechStockDetail } from "@wireforge/shared";

export const BiotechDetailModal: React.FC = () => {
  const {
    selectedBiotechTicker,
    isBiotechModalOpen,
    setIsBiotechModalOpen,
    setSelectedTicker,
  } = useWireForgeStore();

  const [activeSubTab, setActiveSubTab] = useState<"catalysts" | "sec" | "options">("catalysts");
  const [detail, setDetail] = useState<BiotechStockDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBiotechModalOpen || !selectedBiotechTicker) {
      setDetail(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/v1/biotech/detail/${selectedBiotechTicker}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch composite intelligence`);
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setDetail(json.data);
        } else {
          throw new Error("No intelligence records returned");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [isBiotechModalOpen, selectedBiotechTicker]);

  if (!isBiotechModalOpen || !selectedBiotechTicker) return null;

  const sym = selectedBiotechTicker.toUpperCase();
  const formatMoney = (val?: number | null) => {
    if (val === null || val === undefined) return "—";
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (Math.abs(val) >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-[#0c1017] border border-[#232c42] rounded-2xl shadow-2xl overflow-hidden text-xs">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2536] bg-[#101522]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold">
              <FlaskConical size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white font-mono tracking-tight">${sym}</span>
                {detail?.companyName && (
                  <span className="text-gray-300 font-medium text-sm truncate max-w-md">
                    {detail.companyName}
                  </span>
                )}
                {detail?.financials?.dangerDilution && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-700/50">
                    <ShieldAlert size={12} className="text-red-400" />
                    <span>DILUTION RISK &lt;6MO</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 font-mono">
                {detail?.price !== null && detail?.price !== undefined && (
                  <span>Price: <strong className="text-white">${detail.price.toFixed(2)}</strong></span>
                )}
                {detail?.marketCap && (
                  <span>Market Cap: <strong className="text-white">{formatMoney(detail.marketCap)}</strong></span>
                )}
                {detail?.financials?.cik && (
                  <span>SEC CIK: <strong className="text-gray-300">{detail.financials.cik}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedTicker(sym);
                window.open(`http://192.168.74.102:5188/#${sym}`, "_blank");
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#171f2e] hover:bg-blue-600/20 border border-[#26334a] hover:border-blue-500/40 text-blue-400 flex items-center gap-1.5 transition-colors font-medium"
              title="Open full technical chart on ChartForge (:5188)"
            >
              <span>ChartForge</span>
              <ExternalLink size={12} />
            </button>

            <button
              onClick={() => window.open(`http://192.168.74.105:4000/stock/${sym}`, "_blank")}
              className="px-2.5 py-1.5 rounded-lg bg-[#171f2e] hover:bg-emerald-600/20 border border-[#26334a] hover:border-emerald-500/40 text-emerald-400 flex items-center gap-1.5 transition-colors font-medium"
              title="Inspect 10-K, 10-Q & balance sheet in ValueForge (:4000)"
            >
              <span>ValueForge</span>
              <ExternalLink size={12} />
            </button>

            <button
              onClick={() => setIsBiotechModalOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2133] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1b2233] bg-[#0e121a]">
          <button
            onClick={() => setActiveSubTab("catalysts")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSubTab === "catalysts"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-[#161d2b]"
            }`}
          >
            <Activity size={13} />
            <span>Catalysts & NIH Protocol</span>
            {detail?.catalysts && detail.catalysts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/30 text-blue-200">
                {detail.catalysts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("sec")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSubTab === "sec"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-[#161d2b]"
            }`}
          >
            <FileText size={13} />
            <span>ValueForge SEC Filings & Runway</span>
            {detail?.secFilings && detail.secFilings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/30 text-blue-200">
                {detail.secFilings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("options")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSubTab === "options"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-[#161d2b]"
            }`}
          >
            <Zap size={13} />
            <span>ThetaData Options Flow</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 size={28} className="animate-spin text-blue-400 mb-2" />
              <span className="font-mono">Synthesizing clinical trials and SEC filings for ${sym}...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-red-900/60 bg-red-950/20 text-red-200">
              <div className="flex items-center gap-2 font-bold text-red-400 mb-1">
                <AlertTriangle size={16} />
                <span>Intelligence Service Error</span>
              </div>
              <p className="font-mono text-xs">{error}</p>
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* TAB 1: Catalysts & NIH Clinical Protocol */}
              {activeSubTab === "catalysts" && (
                <div className="space-y-4">
                  {/* Upstream BioPharmCatalyst Readouts */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar size={13} className="text-blue-400" />
                      <span>Upcoming Clinical Catalysts</span>
                    </h3>
                    {detail.catalysts.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#111520] border border-[#1e2536] text-gray-500 font-mono text-center">
                        No upcoming clinical readouts registered in active catalyst calendar.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detail.catalysts.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl bg-[#111520] border border-[#20293d] space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white font-mono text-sm">{c.drugName}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/40">
                                  {c.stage}
                                </span>
                                {c.statuses?.map((st, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/40"
                                  >
                                    {st.label}
                                  </span>
                                ))}
                              </div>
                              <span className="font-bold text-amber-300 font-mono bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/30">
                                {c.catalystDate}
                              </span>
                            </div>

                            <div className="text-gray-300 leading-relaxed font-sans">{c.note}</div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1a2233] text-gray-400 font-mono">
                              <div>Indication: <strong className="text-gray-200">{c.indication}</strong></div>
                              {c.clinicalTrialId && (
                                <a
                                  href={`https://clinicaltrials.gov/study/${c.clinicalTrialId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                                >
                                  <span>NIH {c.clinicalTrialId}</span>
                                  <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Official NIH Clinical Trials Protocol Module */}
                  {detail.clinicalTrials.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>Official NIH ClinicalTrials.gov Protocol Registry</span>
                      </h3>
                      <div className="space-y-2">
                        {detail.clinicalTrials.map((ct) => (
                          <div
                            key={ct.nctId}
                            className="p-3 rounded-xl bg-[#111520] border border-emerald-950/40 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold font-mono text-emerald-400">{ct.nctId}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  ct.overallStatus === "RECRUITING" || ct.overallStatus === "ACTIVE_NOT_RECRUITING"
                                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/40"
                                    : "bg-gray-800 text-gray-300"
                                }`}
                              >
                                {ct.overallStatus}
                              </span>
                            </div>
                            <div className="font-medium text-gray-200 text-xs">{ct.briefTitle}</div>
                            <div className="flex items-center gap-4 text-[11px] font-mono text-gray-400 pt-1">
                              {ct.phase && <span>Phase: <strong className="text-gray-300">{ct.phase}</strong></span>}
                              {ct.enrollmentCount && (
                                <span>Enrollment: <strong className="text-gray-300">{ct.enrollmentCount.toLocaleString()} patients</strong></span>
                              )}
                              {ct.primaryCompletionDate && (
                                <span>Primary Completion: <strong className="text-white">{ct.primaryCompletionDate}</strong></span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ValueForge SEC Filings & Runway */}
              {activeSubTab === "sec" && (
                <div className="space-y-4">
                  {/* Financial Runway Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-[#111520] border border-[#20293d]">
                      <div className="text-gray-400 text-[11px] mb-1">Live Balance Sheet Cash</div>
                      <div className="text-lg font-bold text-white font-mono">
                        {formatMoney(detail.financials?.cashLive)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">Cash & Short-Term Equiv</div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111520] border border-[#20293d]">
                      <div className="text-gray-400 text-[11px] mb-1">Monthly Cash Burn</div>
                      <div className="text-lg font-bold text-amber-400 font-mono">
                        {formatMoney(detail.financials?.monthlyBurn)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">Operational Outflow / mo</div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        detail.financials?.dangerDilution
                          ? "bg-red-950/30 border-red-800/50"
                          : "bg-[#111520] border-[#20293d]"
                      }`}
                    >
                      <div className="text-gray-400 text-[11px] mb-1">Estimated Cash Runway</div>
                      <div
                        className={`text-lg font-bold font-mono ${
                          detail.financials?.dangerDilution ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {detail.financials?.monthsCash !== null && detail.financials?.monthsCash !== undefined
                          ? `${detail.financials.monthsCash.toFixed(1)} Months`
                          : "—"}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {detail.financials?.dangerDilution ? "High Dilution / Offering Risk" : "Funded Runway"}
                      </div>
                    </div>
                  </div>

                  {/* Business Narrative */}
                  {detail.financials?.description && (
                    <div className="p-3 rounded-xl bg-[#111520] border border-[#20293d] space-y-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Building2 size={12} />
                        <span>Corporate Business Description (SEC Form 10-K)</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed font-sans text-[11px]">
                        {detail.financials.description}
                      </p>
                    </div>
                  )}

                  {/* Authentic SEC Filings Table */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText size={13} className="text-blue-400" />
                      <span>Authentic SEC EDGAR Filings (via ValueForge :4000)</span>
                    </h3>
                    {detail.secFilings.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#111520] border border-[#1e2536] text-gray-500 font-mono text-center">
                        No recent SEC filings indexed for ${sym}.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[#20283b] bg-[#111520] overflow-hidden">
                        <table className="w-full text-left font-mono border-collapse">
                          <thead className="bg-[#161c2a] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                            <tr>
                              <th className="py-2 px-3">Form</th>
                              <th className="py-2 px-3">Filing Date</th>
                              <th className="py-2 px-3">Accession Number</th>
                              <th className="py-2 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1a2130]">
                            {detail.secFilings.map((f, i) => (
                              <tr key={i} className="hover:bg-[#182030] transition-colors">
                                <td className="py-2 px-3 font-bold text-white">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40 text-[10px]">
                                    {f.formType}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-gray-300">{f.filingDate}</td>
                                <td className="py-2 px-3 text-gray-400 text-[10px]">{f.accessionNo}</td>
                                <td className="py-2 px-3 text-right">
                                  {f.primaryDocumentUrl ? (
                                    <a
                                      href={f.primaryDocumentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 hover:underline text-[10px]"
                                    >
                                      <span>SEC EDGAR</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  ) : (
                                    <span className="text-gray-600">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ThetaData Options Sentiment */}
              {activeSubTab === "options" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[#111520] border border-[#20293d]">
                      <div className="text-gray-400 text-[11px] mb-1">Total Flow Trades</div>
                      <div className="text-lg font-bold text-white font-mono">
                        {detail.optionsSummary?.totalVolume || 0}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111520] border border-[#20293d]">
                      <div className="text-gray-400 text-[11px] mb-1">Unusual Sweeps</div>
                      <div className="text-lg font-bold text-amber-400 font-mono">
                        {detail.optionsSummary?.sweepsCount || 0}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111520] border border-[#20293d]">
                      <div className="text-gray-400 text-[11px] mb-1">Call Volume</div>
                      <div className="text-lg font-bold text-emerald-400 font-mono">
                        {detail.optionsSummary?.callVolume.toLocaleString() || 0}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#111520] border border-[#20293d]">
                      <div className="text-gray-400 text-[11px] mb-1">Put Volume</div>
                      <div className="text-lg font-bold text-red-400 font-mono">
                        {detail.optionsSummary?.putVolume.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111520] border border-[#20293d] text-center">
                    <p className="text-gray-400 font-sans text-xs">
                      Live options tape is streaming from ThetaData OPRA feed (:25503).
                      Click "Set Global Ticker" above to inspect individual sweep prints on the Options Flow table.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1e2536] bg-[#0c1017] flex items-center justify-between text-[11px] font-mono text-gray-500">
          <div className="flex items-center gap-2">
            <span>Sources: BioPharmCatalyst • ValueForge (:4000) • ClinicalTrials.gov • ThetaData</span>
          </div>
          <button
            onClick={() => setIsBiotechModalOpen(false)}
            className="px-3 py-1 rounded bg-[#171e2c] hover:bg-[#20293d] text-gray-300 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
