import { create } from "zustand";
import {
  NewsArticle,
  NewsCategory,
  OptionsFlowTrade,
  MarketSignal,
  EarningsEvent,
  EconomicRelease,
  EcosystemHealth,
  SquawkMessage,
  Sentiment,
  Watchlist,
  PRESET_WATCHLISTS,
} from "@wireforge/shared";

interface WireForgeState {
  // Navigation & Layout
  activeTab: "split" | "news" | "flow" | "signals" | "calendars";
  setActiveTab: (tab: "split" | "news" | "flow" | "signals" | "calendars") => void;

  // Shared Watchlists
  watchlists: Watchlist[];
  setWatchlists: (watchlists: Watchlist[]) => void;
  activeWatchlistId: string;
  setActiveWatchlistId: (id: string) => void;
  isWatchlistManagerOpen: boolean;
  setIsWatchlistManagerOpen: (open: boolean) => void;

  // Selected Ticker for Mini-Chart modal & cross-screen sync
  selectedTicker: string | null;
  setSelectedTicker: (ticker: string | null) => void;

  // Selected Article for Reading Drawer
  selectedArticle: NewsArticle | null;
  setSelectedArticle: (article: NewsArticle | null) => void;

  // Real-Time Data Streams
  newsArticles: NewsArticle[];
  flowTrades: OptionsFlowTrade[];
  signals: MarketSignal[];
  earnings: EarningsEvent[];
  economic: EconomicRelease[];
  ecosystemHealth: EcosystemHealth | null;

  // Data Setters / Ingestion
  setNewsArticles: (articles: NewsArticle[]) => void;
  prependNewsArticle: (article: NewsArticle) => void;
  setFlowTrades: (trades: OptionsFlowTrade[]) => void;
  prependFlowTrade: (trade: OptionsFlowTrade) => void;
  setSignals: (signals: MarketSignal[]) => void;
  prependSignal: (signal: MarketSignal) => void;
  setEarnings: (earnings: EarningsEvent[]) => void;
  setEconomic: (economic: EconomicRelease[]) => void;
  setEcosystemHealth: (health: EcosystemHealth) => void;

  // Filters — News
  newsCategory: NewsCategory;
  setNewsCategory: (cat: NewsCategory) => void;
  newsSearchQuery: string;
  setNewsSearchQuery: (q: string) => void;
  newsTickerFilter: string;
  setNewsTickerFilter: (ticker: string) => void;

  // Filters — Flow
  flowMinPremium: number;
  setFlowMinPremium: (prem: number) => void;
  flowSentimentFilter: "all" | "bullish" | "bearish";
  setFlowSentimentFilter: (sentiment: "all" | "bullish" | "bearish") => void;
  flowTickerFilter: string;
  setFlowTickerFilter: (ticker: string) => void;
  flowGoldenOnly: boolean;
  setFlowGoldenOnly: (val: boolean) => void;

  // Audio Squawk State
  squawkEnabled: boolean;
  setSquawkEnabled: (enabled: boolean) => void;
  squawkVolume: number;
  setSquawkVolume: (vol: number) => void;
  squawkRate: number;
  setSquawkRate: (rate: number) => void;
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (uri: string | null) => void;
  squawkChannels: {
    news: boolean;
    flow: boolean;
    halts: boolean;
  };
  setSquawkChannel: (channel: "news" | "flow" | "halts", val: boolean) => void;
  squawkQueue: SquawkMessage[];
  pushSquawkMessage: (msg: SquawkMessage) => void;
  popSquawkMessage: () => SquawkMessage | undefined;
  squawkHistory: SquawkMessage[];
  isSquawkPlaying: boolean;
  setIsSquawkPlaying: (playing: boolean) => void;
  isSquawkDrawerOpen: boolean;
  setSquawkDrawerOpen: (open: boolean) => void;
}

export const useWireForgeStore = create<WireForgeState>((set, get) => ({
  activeTab: "split",
  setActiveTab: (tab) => set({ activeTab: tab }),

  watchlists: PRESET_WATCHLISTS,
  setWatchlists: (watchlists) => set({ watchlists }),
  activeWatchlistId: "all",
  setActiveWatchlistId: (activeWatchlistId) => set({ activeWatchlistId }),
  isWatchlistManagerOpen: false,
  setIsWatchlistManagerOpen: (isWatchlistManagerOpen) => set({ isWatchlistManagerOpen }),

  selectedTicker: null,
  setSelectedTicker: (selectedTicker) => {
    set({ selectedTicker });
    if (selectedTicker) {
      // 1. Cross-screen sync with ChartForge (<1ms BroadcastChannel)
      try {
        if (typeof BroadcastChannel !== "undefined") {
          const ch = new BroadcastChannel("chartforge_symbol_sync");
          ch.postMessage({ ticker: selectedTicker, symbol: selectedTicker });
          ch.close();
        }
      } catch {}

      // 2. Synchronize active symbol with Trading Agent RadarScreen
      fetch("/v1/watchlists/radarscreen/active-symbol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: selectedTicker, interval: "5m" }),
      }).catch(() => {});
    }
  },

  selectedArticle: null,
  setSelectedArticle: (selectedArticle) => set({ selectedArticle }),

  newsArticles: [],
  flowTrades: [],
  signals: [],
  earnings: [],
  economic: [],
  ecosystemHealth: null,

  setNewsArticles: (newsArticles) => set({ newsArticles }),
  prependNewsArticle: (article) =>
    set((state) => ({
      newsArticles: [article, ...state.newsArticles.filter((a) => a.id !== article.id)].slice(0, 300),
    })),

  setFlowTrades: (flowTrades) => set({ flowTrades }),
  prependFlowTrade: (trade) =>
    set((state) => ({
      flowTrades: [trade, ...state.flowTrades.filter((t) => t.id !== trade.id)].slice(0, 300),
    })),

  setSignals: (signals) => set({ signals }),
  prependSignal: (signal) =>
    set((state) => ({
      signals: [signal, ...state.signals.filter((s) => s.id !== signal.id)].slice(0, 150),
    })),

  setEarnings: (earnings) => set({ earnings }),
  setEconomic: (economic) => set({ economic }),
  setEcosystemHealth: (ecosystemHealth) => set({ ecosystemHealth }),

  // Filters
  newsCategory: "all",
  setNewsCategory: (newsCategory) => set({ newsCategory }),
  newsSearchQuery: "",
  setNewsSearchQuery: (newsSearchQuery) => set({ newsSearchQuery }),
  newsTickerFilter: "",
  setNewsTickerFilter: (newsTickerFilter) => set({ newsTickerFilter }),

  flowMinPremium: 50000,
  setFlowMinPremium: (flowMinPremium) => set({ flowMinPremium }),
  flowSentimentFilter: "all",
  setFlowSentimentFilter: (flowSentimentFilter) => set({ flowSentimentFilter }),
  flowTickerFilter: "",
  setFlowTickerFilter: (flowTickerFilter) => set({ flowTickerFilter }),
  flowGoldenOnly: false,
  setFlowGoldenOnly: (flowGoldenOnly) => set({ flowGoldenOnly }),

  // Audio Squawk
  squawkEnabled: true,
  setSquawkEnabled: (squawkEnabled) => set({ squawkEnabled }),
  squawkVolume: 0.85,
  setSquawkVolume: (squawkVolume) => set({ squawkVolume }),
  squawkRate: 1.05,
  setSquawkRate: (squawkRate) => set({ squawkRate }),
  selectedVoiceURI: null,
  setSelectedVoiceURI: (selectedVoiceURI) => set({ selectedVoiceURI }),
  squawkChannels: {
    news: true,
    flow: true,
    halts: true,
  },
  setSquawkChannel: (channel, val) =>
    set((state) => ({
      squawkChannels: { ...state.squawkChannels, [channel]: val },
    })),
  squawkQueue: [],
  pushSquawkMessage: (msg) =>
    set((state) => ({
      squawkQueue: [...state.squawkQueue, msg],
      squawkHistory: [msg, ...state.squawkHistory].slice(0, 50),
    })),
  popSquawkMessage: () => {
    const q = get().squawkQueue;
    if (q.length === 0) return undefined;
    const [first, ...rest] = q;
    set({ squawkQueue: rest });
    return first;
  },
  squawkHistory: [],
  isSquawkPlaying: false,
  setIsSquawkPlaying: (isSquawkPlaying) => set({ isSquawkPlaying }),
  isSquawkDrawerOpen: false,
  setSquawkDrawerOpen: (isSquawkDrawerOpen) => set({ isSquawkDrawerOpen }),
}));
