/**
 * @file CorporateCalendar.tsx
 * @description Comprehensive institutional catalyst terminal for biotechnology clinical milestones,
 * regulatory decisions (FDA / PDUFA / Med Devices), investor conferences (JPM 2026, ASCO, etc.),
 * cash runway dilution radar, drug pipeline screeners, and macroeconomic releases.
 *
 * Replicates all primary BioPharmCatalyst calendars with 100% authentic live data:
 * - FDA Calendar (/calendars/fda-calendar)
 * - PDUFA Calendar (/calendars/pdufa-calendar)
 * - Catalyst Impact (/calendars/catalyst-impact)
 * - Conference Calendar (/calendars/conferences)
 * - Biotech Earnings Calendar (/calendars/earnings-calendar)
 * - Biotech IPO Calendar (/calendars/ipo-calendar)
 * - Medical Device Calendar (/calendars/medical-devices)
 * - Historical FDA Catalyst Calendar (/calendars/historical-catalyst-calendar)
 * - Historical Medical Device Calendar (/calendars/historical-medical-devices)
 * - JPM26 Conference Schedule (/calendars/jpm-conference-2026)
 * - Drug Pipeline Database & Screener (/companies/drug-pipeline-database)
 * - Cash Runway Holdings Database (/analysis/cash-database)
 * - Wall Street Corporate Earnings (SEC EDGAR)
 * - Macroeconomic Releases (Trading Agent)
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  DollarSign,
  Globe,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Database,
  FlaskConical,
  Award,
  Zap,
  Users,
  Building2,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Cpu,
  History,
  Archive,
  Rocket,
  Calendar,
  Filter,
} from "lucide-react";
import { useWireForgeStore } from "../store/wireforge-store.js";
import {
  BiotechCatalyst,
  PdufaEvent,
  CatalystImpactItem,
  BiotechConferenceEvent,
  JpmConferencePresentation,
  MedicalDeviceCatalyst,
  HistoricalCatalystItem,
  HistoricalMedicalDeviceItem,
  BiotechIpoItem,
  BiotechCashRunwayItem,
  DrugPipelineItem,
  EarningsEvent,
  EconomicRelease,
} from "@wireforge/shared";

type CalendarViewType =
  | "fda"
  | "pdufa"
  | "impact"
  | "conferences"
  | "jpm2026"
  | "cash"
  | "pipeline"
  | "devices"
  | "historical"
  | "historical_devices"
  | "ipos"
  | "biotech_earnings"
  | "earnings"
  | "economic";

interface StatusState {
  loading: boolean;
  source?: string;
  error?: string;
  message?: string;
  actionable?: string;
}

export const CorporateCalendar: React.FC = () => {
  const {
    earnings,
    economic,
    setEarnings,
    setEconomic,
    setSelectedTicker,
    setSelectedBiotechTicker,
    setIsBiotechModalOpen,
  } = useWireForgeStore();

  const [activeTab, setActiveTab] = useState<CalendarViewType>("fda");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [dangerOnly, setDangerOnly] = useState(false);

  // Data collections for each view
  const [fdaCatalysts, setFdaCatalysts] = useState<BiotechCatalyst[]>([]);
  const [pdufaEvents, setPdufaEvents] = useState<PdufaEvent[]>([]);
  const [impactItems, setImpactItems] = useState<CatalystImpactItem[]>([]);
  const [conferences, setConferences] = useState<BiotechConferenceEvent[]>([]);
  const [jpmPresentations, setJpmPresentations] = useState<JpmConferencePresentation[]>([]);
  const [cashRunway, setCashRunway] = useState<BiotechCashRunwayItem[]>([]);
  const [pipelineItems, setPipelineItems] = useState<DrugPipelineItem[]>([]);
  const [medicalDevices, setMedicalDevices] = useState<MedicalDeviceCatalyst[]>([]);
  const [historicalCatalysts, setHistoricalCatalysts] = useState<HistoricalCatalystItem[]>([]);
  const [historicalDevices, setHistoricalDevices] = useState<HistoricalMedicalDeviceItem[]>([]);
  const [ipos, setIpos] = useState<BiotechIpoItem[]>([]);
  const [biotechEarnings, setBiotechEarnings] = useState<any[]>([]);

  // Status mapping
  const [status, setStatus] = useState<Record<CalendarViewType, StatusState>>({
    fda: { loading: false },
    pdufa: { loading: false },
    impact: { loading: false },
    conferences: { loading: false },
    jpm2026: { loading: false },
    cash: { loading: false },
    pipeline: { loading: false },
    devices: { loading: false },
    historical: { loading: false },
    historical_devices: { loading: false },
    ipos: { loading: false },
    biotech_earnings: { loading: false },
    earnings: { loading: false },
    economic: { loading: false },
  });

  const setViewStatus = (view: CalendarViewType, st: Partial<StatusState>) => {
    setStatus((prev) => ({
      ...prev,
      [view]: { ...prev[view], ...st },
    }));
  };

  /**
   * Generic fetch wrapper handling live authentic backend responses.
   */
  const loadViewData = useCallback(
    async (view: CalendarViewType, forceRefresh = false) => {
      setViewStatus(view, { loading: true, error: undefined });
      const refreshParam = forceRefresh ? "&refresh=true" : "";

      try {
        let endpoint = "";
        switch (view) {
          case "fda":
            endpoint = `/v1/biotech/fda-calendar?page=1${refreshParam}`;
            break;
          case "pdufa":
            endpoint = `/v1/biotech/pdufa?page=1${refreshParam}`;
            break;
          case "impact":
            endpoint = `/v1/biotech/impact?${refreshParam}`;
            break;
          case "conferences":
            endpoint = `/v1/biotech/conferences?page=1${refreshParam}`;
            break;
          case "jpm2026":
            endpoint = `/v1/biotech/jpm2026?page=1${refreshParam}`;
            break;
          case "cash":
            endpoint = `/v1/biotech/cash-runway?page=1${refreshParam}`;
            break;
          case "pipeline":
            endpoint = `/v1/biotech/pipeline?page=1${refreshParam}`;
            break;
          case "devices":
            endpoint = `/v1/biotech/medical-devices?page=1${refreshParam}`;
            break;
          case "historical":
            endpoint = `/v1/biotech/historical-catalysts?page=1${refreshParam}`;
            break;
          case "historical_devices":
            endpoint = `/v1/biotech/historical-devices?page=1${refreshParam}`;
            break;
          case "ipos":
            endpoint = `/v1/biotech/ipos?${refreshParam}`;
            break;
          case "biotech_earnings":
            endpoint = `/v1/biotech/earnings?page=1${refreshParam}`;
            break;
          case "earnings":
            endpoint = "/v1/calendars/earnings";
            break;
          case "economic":
            endpoint = "/v1/calendars/economic";
            break;
        }

        const res = await fetch(endpoint);
        const json = await res.json();

        if (!res.ok || json.error) {
          setViewStatus(view, {
            loading: false,
            error: json.error || `HTTP ${res.status}`,
            message: json.message || "Failed to retrieve calendar stream",
            actionable: json.actionable || "Verify backend service status.",
            source: json.source || "BioPharmCatalyst",
          });
          return;
        }

        // Assign data
        const dataList = json.data || [];
        switch (view) {
          case "fda":
            setFdaCatalysts(dataList);
            break;
          case "pdufa":
            setPdufaEvents(dataList);
            break;
          case "impact":
            setImpactItems(dataList);
            break;
          case "conferences":
            setConferences(dataList);
            break;
          case "jpm2026":
            setJpmPresentations(dataList);
            break;
          case "cash":
            setCashRunway(dataList);
            break;
          case "pipeline":
            setPipelineItems(dataList);
            break;
          case "devices":
            setMedicalDevices(dataList);
            break;
          case "historical":
            setHistoricalCatalysts(dataList);
            break;
          case "historical_devices":
            setHistoricalDevices(dataList);
            break;
          case "ipos":
            setIpos(dataList);
            break;
          case "biotech_earnings":
            setBiotechEarnings(dataList);
            break;
          case "earnings":
            setEarnings(dataList);
            break;
          case "economic":
            setEconomic(dataList);
            break;
        }

        setViewStatus(view, {
          loading: false,
          source: json.source || "Live Feed",
          error: undefined,
        });
      } catch (err: any) {
        setViewStatus(view, {
          loading: false,
          error: "NETWORK_FAILED",
          message: err.message,
          actionable: "Ensure the WireForge API server is online.",
        });
      }
    },
    [setEarnings, setEconomic]
  );

  // Lazy-load data when tab switches
  useEffect(() => {
    loadViewData(activeTab);
  }, [activeTab, loadViewData]);

  const handleRowClick = (ticker?: string) => {
    if (!ticker) return;
    const sym = ticker.toUpperCase();
    setSelectedBiotechTicker(sym);
    setIsBiotechModalOpen(true);
  };

  const currentStatus = status[activeTab];

  // Helper formatter
  const formatMoney = (val?: number | null) => {
    if (val === null || val === undefined) return "—";
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (Math.abs(val) >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toLocaleString()}`;
  };

  /**
   * Institutional runway badge helper adhering to biotech equity research standards:
   * - null / undefined / <= 0: "—"
   * - 999: Emerald "Positive OCF" (self-funded commercial biopharmas)
   * - >= 36: Green "36+ mo" (well capitalized multi-year buffer)
   * - < 6: Red danger dilution badge ("X.X mo") with shield icon
   * - < 12: Amber warning badge ("X.X mo")
   * - 12-36: Standard emerald badge ("X.X mo")
   */
  const renderRunwayBadge = (months?: number | null) => {
    if (months === null || months === undefined || months <= 0) {
      return <span className="text-gray-500">—</span>;
    }
    if (months === 999) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 whitespace-nowrap">
          Positive OCF
        </span>
      );
    }
    if (months >= 36) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 whitespace-nowrap">
          36+ mo
        </span>
      );
    }
    if (months < 6) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800/50 whitespace-nowrap inline-flex items-center gap-1">
          <ShieldAlert size={10} className="text-red-400" />
          <span>{months.toFixed(1)} mo</span>
        </span>
      );
    }
    if (months < 12) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/40 whitespace-nowrap">
          {months.toFixed(1)} mo
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-400 whitespace-nowrap">
        {months.toFixed(1)} mo
      </span>
    );
  };

  // Filtered views
  const filteredFda = useMemo(() => {
    return fdaCatalysts.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.indication.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStage = stageFilter === "all" || c.stage.toLowerCase().includes(stageFilter.toLowerCase());
      return matchSearch && matchStage;
    });
  }, [fdaCatalysts, searchQuery, stageFilter]);

  const filteredCash = useMemo(() => {
    return cashRunway.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDanger = !dangerOnly || c.dangerDilution;
      return matchSearch && matchDanger;
    });
  }, [cashRunway, searchQuery, dangerOnly]);

  const filteredPipeline = useMemo(() => {
    return pipelineItems.filter((p) => {
      const matchSearch =
        !searchQuery.trim() ||
        p.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.indication.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStage = stageFilter === "all" || p.stage.toLowerCase().includes(stageFilter.toLowerCase());
      return matchSearch && matchStage;
    });
  }, [pipelineItems, searchQuery, stageFilter]);

  return (
    <div className="flex flex-col h-full bg-[#0a0d14] overflow-hidden select-none text-xs">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col border-b border-[#1b2233] bg-[#0d111a]">
        {/* Main Ribbon Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#181f30]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold">
                <FlaskConical size={16} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-wide text-sm">CATALYST & CLINICAL RADAR</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 font-mono border border-purple-800/40">
                    NIH & OPENFDA & VALUEFORGE
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => loadViewData(activeTab, true)}
              disabled={currentStatus.loading}
              title="Force Refresh Live Feeds"
              className="p-1.5 rounded-lg hover:bg-[#1a2233] text-gray-400 hover:text-white transition-colors border border-[#232c42]"
            >
              <RefreshCw size={13} className={currentStatus.loading ? "animate-spin text-blue-400" : ""} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentStatus.source && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-[#141926] px-2.5 py-1 rounded-lg border border-[#232c42]">
                <Database size={11} className="text-emerald-400" />
                <span>{currentStatus.source}</span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Sub-Tabs Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none bg-[#0a0d14]">
          {/* Biotech Group */}
          <div className="flex items-center gap-1 pr-2 border-r border-[#1b2233]">
            <button
              onClick={() => setActiveTab("fda")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "fda" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <FlaskConical size={13} />
              <span>FDA Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab("pdufa")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "pdufa" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Award size={13} />
              <span>PDUFA Decisions</span>
            </button>

            <button
              onClick={() => setActiveTab("impact")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "impact" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Zap size={13} />
              <span>Catalyst Impact (Options)</span>
            </button>

            <button
              onClick={() => setActiveTab("cash")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "cash" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <DollarSign size={13} />
              <span>Cash & Runway Radar</span>
            </button>

            <button
              onClick={() => setActiveTab("conferences")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "conferences" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Users size={13} />
              <span>Conferences</span>
            </button>

            <button
              onClick={() => setActiveTab("jpm2026")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "jpm2026" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Building2 size={13} />
              <span>JPM 2026</span>
            </button>

            <button
              onClick={() => setActiveTab("pipeline")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "pipeline" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Database size={13} />
              <span>Drug Pipeline (10k+)</span>
            </button>

            <button
              onClick={() => setActiveTab("devices")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "devices" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Cpu size={13} />
              <span>Medical Devices</span>
            </button>

            <button
              onClick={() => setActiveTab("historical")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "historical" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <History size={13} />
              <span>Historical FDA</span>
            </button>

            <button
              onClick={() => setActiveTab("historical_devices")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "historical_devices" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Archive size={13} />
              <span>Historical Med</span>
            </button>

            <button
              onClick={() => setActiveTab("ipos")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "ipos" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Rocket size={13} />
              <span>Biotech IPOs</span>
            </button>

            <button
              onClick={() => setActiveTab("biotech_earnings")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "biotech_earnings" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Calendar size={13} />
              <span>Biotech Earnings</span>
            </button>
          </div>

          {/* Broad Market Group */}
          <div className="flex items-center gap-1 pl-2">
            <button
              onClick={() => setActiveTab("earnings")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "earnings" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <DollarSign size={13} />
              <span>Wall St Earnings</span>
            </button>

            <button
              onClick={() => setActiveTab("economic")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === "economic" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-[#141926]"
              }`}
            >
              <Globe size={13} />
              <span>Macro Releases</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar (Search, Phase Dropdown, Dilution Toggle) */}
        {(activeTab === "fda" || activeTab === "pipeline" || activeTab === "cash" || activeTab === "devices") && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#181f30] bg-[#0c1017]">
            <div className="flex items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter ticker, indication, or drug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-7 pr-2 py-1 text-xs rounded-lg bg-[#141926] border border-[#232c42] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Stage Filter */}
              {(activeTab === "fda" || activeTab === "pipeline") && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Filter size={12} />
                  <span>Stage:</span>
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="bg-[#141926] border border-[#232c42] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="all">All Stages</option>
                    <option value="phase1">Phase 1</option>
                    <option value="phase2">Phase 2</option>
                    <option value="phase3">Phase 3</option>
                    <option value="bla">BLA / NDA Filing</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              )}

              {/* Dilution Risk Toggle */}
              {activeTab === "cash" && (
                <button
                  onClick={() => setDangerOnly(!dangerOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                    dangerOnly
                      ? "bg-red-950/80 border-red-700/80 text-red-300"
                      : "bg-[#141926] border-[#232c42] text-gray-400 hover:text-white"
                  }`}
                >
                  <ShieldAlert size={13} className={dangerOnly ? "text-red-400" : "text-gray-500"} />
                  <span>Flag &lt; 6 Months Cash Danger Only</span>
                </button>
              )}
            </div>

            <div className="text-[11px] font-mono text-gray-500">
              Click any company or ticker row for NIH Clinical Trials & ValueForge SEC 10-Q/10-K Filings
            </div>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-4 text-xs">
        {/* Actionable Error Banner */}
        {currentStatus.error && (
          <div className="mb-4 p-4 rounded-xl border border-amber-900/60 bg-amber-950/20 text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <div className="font-semibold text-sm text-amber-300">
                  Upstream Data Service Offline ({currentStatus.error})
                </div>
                <div className="mt-1 text-xs text-amber-200/90 font-mono">
                  {currentStatus.message}
                </div>
                {currentStatus.actionable && (
                  <div className="mt-2 text-xs bg-amber-950/40 p-2 rounded border border-amber-800/40 text-amber-100">
                    <span className="font-bold text-amber-300 uppercase text-[10px] block mb-0.5">
                      Actionable Remediation:
                    </span>
                    {currentStatus.actionable}
                  </div>
                )}
                <div className="mt-3">
                  <button
                    onClick={() => loadViewData(activeTab, true)}
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
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 className="animate-spin mb-2 text-blue-400" size={26} />
            <span className="font-mono text-xs">
              Streaming live data from {currentStatus.source || "upstream service"}...
            </span>
          </div>
        )}

        {/* 1. FDA CALENDAR */}
        {!currentStatus.loading && activeTab === "fda" && (
          filteredFda.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">
                No FDA catalyst records match the selected filters.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Catalyst Date</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Drug / Program</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Indication</th>
                    <th className="py-2.5 px-3">Catalyst Notes</th>
                    <th className="py-2.5 px-3 text-right">Cash Runway</th>
                    <th className="py-2.5 px-3 text-right">NIH NCT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {filteredFda.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-amber-300 whitespace-nowrap">{c.catalystDate}</td>
                      <td className="py-2.5 px-3 font-bold text-white">${c.ticker}</td>
                      <td className="py-2.5 px-3 text-white font-medium">{c.drugName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/40">
                          {c.stage}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans max-w-xs truncate">{c.indication}</td>
                      <td className="py-2.5 px-3 text-gray-400 font-sans max-w-md truncate">{c.note}</td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {renderRunwayBadge(c.monthsCash)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {c.clinicalTrialId ? (
                          <span className="text-blue-400 text-[10px] hover:underline">{c.clinicalTrialId}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 2. PDUFA DECISIONS */}
        {!currentStatus.loading && activeTab === "pdufa" && (
          pdufaEvents.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">No upcoming PDUFA events recorded.</div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">PDUFA Date</th>
                    <th className="py-2.5 px-3">Priority Review</th>
                    <th className="py-2.5 px-3">AdCom Date</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Drug Candidate</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {pdufaEvents.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => handleRowClick(p.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-emerald-400 whitespace-nowrap">{p.pdufaDate || "Pending"}</td>
                      <td className="py-2.5 px-3 text-amber-300">{p.priorityReviewDate || "—"}</td>
                      <td className="py-2.5 px-3 text-gray-300">{p.adcomDate || "—"}</td>
                      <td className="py-2.5 px-3 font-bold text-white">${p.ticker}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans">{p.companyName}</td>
                      <td className="py-2.5 px-3 text-white font-medium">{p.drugName}</td>
                      <td className="py-2.5 px-3 text-gray-400 font-sans max-w-md truncate">{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 3. CATALYST IMPACT & OPTIONS */}
        {!currentStatus.loading && activeTab === "impact" && (
          impactItems.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">No catalyst impact metrics available.</div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Drug / Program</th>
                    <th className="py-2.5 px-3">Catalyst Date</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3 text-right">Unusual Sweeps</th>
                    <th className="py-2.5 px-3 text-right">Total Flow Trades</th>
                    <th className="py-2.5 px-3 text-right">Bullish Flow %</th>
                    <th className="py-2.5 px-3 text-right">DTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {impactItems.map((imp) => (
                    <tr
                      key={imp.id}
                      onClick={() => handleRowClick(imp.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white">${imp.ticker}</td>
                      <td className="py-2.5 px-3 text-white font-medium">{imp.drugName || "—"}</td>
                      <td className="py-2.5 px-3 text-amber-300">{imp.catalystDate || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40 text-[10px]">
                          {imp.stage || "Clinical"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-400">{imp.recentSweepsCount}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300">{imp.totalOptionVolume}</td>
                      <td className="py-2.5 px-3 text-right">
                        {imp.bullishFlowRatio !== null && imp.bullishFlowRatio !== undefined ? (
                          <span
                            className={`font-bold ${
                              imp.bullishFlowRatio >= 60
                                ? "text-emerald-400"
                                : imp.bullishFlowRatio <= 40
                                ? "text-red-400"
                                : "text-gray-300"
                            }`}
                          >
                            {imp.bullishFlowRatio.toFixed(1)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{imp.daysToExpiration || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 4. CASH & RUNWAY RADAR */}
        {!currentStatus.loading && activeTab === "cash" && (
          filteredCash.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">No cash runway records match criteria.</div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Live Cash Holdings</th>
                    <th className="py-2.5 px-3 text-right">Monthly Cash Burn</th>
                    <th className="py-2.5 px-3 text-right">Months Runway</th>
                    <th className="py-2.5 px-3 text-right">Filing Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {filteredCash.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleRowClick(c.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        {c.dangerDilution && <ShieldAlert size={13} className="text-red-400" />}
                        <span>${c.ticker}</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans">{c.companyName}</td>
                      <td className="py-2.5 px-3 text-right text-white">
                        {c.price ? `$${c.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        {formatMoney(c.cashLive)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-400">
                        {c.monthlyBurn === 0 && c.monthsCash === 999 ? (
                          <span className="text-emerald-400 font-sans text-[11px]">$0 (Profitable)</span>
                        ) : (
                          formatMoney(c.monthlyBurn)
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {renderRunwayBadge(c.monthsCash)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{c.reportDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 5. CONFERENCES */}
        {!currentStatus.loading && activeTab === "conferences" && (
          conferences.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">No conference events scheduled.</div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Conference Dates</th>
                    <th className="py-2.5 px-3">Acronym</th>
                    <th className="py-2.5 px-3">Conference Name</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Abstract Date</th>
                    <th className="py-2.5 px-3 text-right">Companies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {conferences.map((conf) => (
                    <tr key={conf.id} className="hover:bg-[#161d2b] transition-colors">
                      <td className="py-2.5 px-3 text-amber-300 whitespace-nowrap">
                        {conf.startDate ? `${conf.startDate} to ${conf.endDate || ""}` : "TBA"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-400">{conf.acronym}</td>
                      <td className="py-2.5 px-3 text-white font-medium font-sans">{conf.name}</td>
                      <td className="py-2.5 px-3 text-gray-300">{conf.location || "Virtual / TBA"}</td>
                      <td className="py-2.5 px-3 text-gray-400">{conf.abstractDate || "—"}</td>
                      <td className="py-2.5 px-3 text-right text-white font-bold">{conf.companiesCount || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 6. JPM 2026 SCHEDULE */}
        {!currentStatus.loading && activeTab === "jpm2026" && (
          jpmPresentations.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">
                No JPM 2026 presentations recorded in calendar feed.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Date / Time</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Presentation Notes & Guidance</th>
                    <th className="py-2.5 px-3">Deals & Partnerships</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {jpmPresentations.map((j) => (
                    <tr
                      key={j.id}
                      onClick={() => handleRowClick(j.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 text-amber-300 whitespace-nowrap">{j.dateTime || "TBA"}</td>
                      <td className="py-2.5 px-3 font-bold text-white">${j.ticker}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans">{j.companyName}</td>
                      <td className="py-2.5 px-3 text-white font-sans max-w-lg truncate">{j.notes || "—"}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-sans">{j.deals || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 7. DRUG PIPELINE SCREENER */}
        {!currentStatus.loading && activeTab === "pipeline" && (
          filteredPipeline.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">
                No drug pipeline candidates match search criteria.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Drug Name</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Indication</th>
                    <th className="py-2.5 px-3">Next Catalyst</th>
                    <th className="py-2.5 px-3 text-right">Months Cash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {filteredPipeline.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => handleRowClick(p.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white">{p.drugName}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-400">${p.ticker}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans">{p.companyName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40 text-[10px]">
                          {p.stage}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans max-w-xs truncate">{p.indication}</td>
                      <td className="py-2.5 px-3 text-amber-300">{p.catalystDate || "—"}</td>
                      <td className="py-2.5 px-3 text-right">
                        {renderRunwayBadge(p.monthsCash)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 8. MEDICAL DEVICES */}
        {!currentStatus.loading && activeTab === "devices" && (
          medicalDevices.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">No medical device milestones recorded.</div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Device Name</th>
                    <th className="py-2.5 px-3">Indication</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Decision Date</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {medicalDevices.map((dev) => (
                    <tr
                      key={dev.id}
                      onClick={() => handleRowClick(dev.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white">${dev.ticker}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-300">{dev.deviceName}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans max-w-xs truncate">{dev.indication}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40 text-[10px]">
                          {dev.stage}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-300">{dev.decisionDate || "—"}</td>
                      <td className="py-2.5 px-3 text-gray-400 font-sans max-w-md truncate">{dev.note}</td>
                      <td className="py-2.5 px-3 text-right text-white">
                        {dev.price ? `$${dev.price.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 9. HISTORICAL CATALYSTS */}
        {!currentStatus.loading && activeTab === "historical" && (
          historicalCatalysts.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">No historical catalyst records.</div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Catalyst Date</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Drug Candidate</th>
                    <th className="py-2.5 px-3">Outcome Notes</th>
                    <th className="py-2.5 px-3 text-right">Price at Catalyst</th>
                    <th className="py-2.5 px-3 text-right">Move %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {historicalCatalysts.map((h) => (
                    <tr
                      key={h.id}
                      onClick={() => handleRowClick(h.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">{h.catalystDate}</td>
                      <td className="py-2.5 px-3 font-bold text-white">${h.ticker}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans">{h.companyName}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{h.drugName}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans max-w-lg truncate">{h.note}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300">{h.priceAtCatalyst || "—"}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {h.catalystPriceMovement || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 10. HISTORICAL DEVICES */}
        {!currentStatus.loading && activeTab === "historical_devices" && (
          historicalDevices.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">No historical device records.</div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Catalyst Date</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Device Name</th>
                    <th className="py-2.5 px-3">Indication</th>
                    <th className="py-2.5 px-3">Outcome Notes</th>
                    <th className="py-2.5 px-3 text-right">Price Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {historicalDevices.map((hd) => (
                    <tr
                      key={hd.id}
                      onClick={() => handleRowClick(hd.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap">{hd.catalystDate}</td>
                      <td className="py-2.5 px-3 font-bold text-white">${hd.ticker}</td>
                      <td className="py-2.5 px-3 text-blue-300 font-medium">{hd.deviceName}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans max-w-xs truncate">{hd.indication}</td>
                      <td className="py-2.5 px-3 text-gray-400 font-sans max-w-md truncate">{hd.note}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">{hd.priceChange || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 11. BIOTECH IPOS */}
        {!currentStatus.loading && activeTab === "ipos" && (
          ipos.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">No biotech IPOs scheduled in calendar.</div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Underwriters & Managers</th>
                    <th className="py-2.5 px-3 text-right">Target Shares</th>
                    <th className="py-2.5 px-3 text-right">Volume</th>
                    <th className="py-2.5 px-3 text-right">Expected Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {ipos.map((ipo) => (
                    <tr key={ipo.id} className="hover:bg-[#161d2b] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-blue-400">${ipo.symbol}</td>
                      <td className="py-2.5 px-3 font-medium text-white font-sans">{ipo.company}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans max-w-md truncate">{ipo.managers}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300">{ipo.shares || "—"}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300">{ipo.volume || "—"}</td>
                      <td className="py-2.5 px-3 text-right text-amber-300">{ipo.expectedToTrade || "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 12. BIOTECH EARNINGS */}
        {!currentStatus.loading && activeTab === "biotech_earnings" && (
          biotechEarnings.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">No confirmed biotech earnings scheduled.</div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3 text-right">EPS Estimate</th>
                    <th className="py-2.5 px-3 text-right">Confirmed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182030]">
                  {biotechEarnings.map((b, idx) => (
                    <tr
                      key={idx}
                      onClick={() => handleRowClick(b.company_ticker || b.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 text-gray-300">{b.date || b.report_date || "—"}</td>
                      <td className="py-2.5 px-3 font-bold text-white">${b.company_ticker || b.ticker}</td>
                      <td className="py-2.5 px-3 text-gray-300 font-sans">{b.company_name || b.company}</td>
                      <td className="py-2.5 px-3 text-right text-white">
                        {b.eps_estimate !== undefined ? `$${b.eps_estimate}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">YES</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 13. WALL STREET BROAD EARNINGS (EDGAR) */}
        {!currentStatus.loading && activeTab === "earnings" && (
          earnings.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">
                No corporate earnings scheduled in the upcoming window.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
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
                <tbody className="divide-y divide-[#182030]">
                  {earnings.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedTicker(e.ticker)}
                      className="hover:bg-[#161d2b] cursor-pointer transition-colors"
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
                        {e.epsEstimate !== null && e.epsEstimate !== undefined ? `$${e.epsEstimate?.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-white">{e.revEstimate || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 14. MACROECONOMIC RELEASES */}
        {!currentStatus.loading && activeTab === "economic" && (
          economic.length === 0 ? (
            !currentStatus.error && (
              <div className="text-center py-12 text-gray-500 font-mono">
                No macroeconomic events scheduled in the current horizon.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-[#20283b] bg-[#10141f] overflow-hidden">
              <table className="w-full text-left font-mono border-collapse">
                <thead className="bg-[#141926] text-[10px] text-gray-400 uppercase border-b border-[#20283b]">
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
                <tbody className="divide-y divide-[#182030]">
                  {economic.map((ec) => (
                    <tr key={ec.id} className="hover:bg-[#161d2b] transition-colors">
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
