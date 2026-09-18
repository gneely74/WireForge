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
  flowTotal: number;
  hasMoreFlow: boolean;
  isFlowLoadingMore: boolean;
  signals: MarketSignal[];
  earnings: EarningsEvent[];
  economic: EconomicRelease[];
  ecosystemHealth: EcosystemHealth | null;

  // Data Setters / Ingestion
  setNewsArticles: (articles: NewsArticle[]) => void;
  prependNewsArticle: (article: NewsArticle) => void;
  setFlowTrades: (trades: OptionsFlowTrade[], total?: number) => void;
  appendOlderFlowTrades: (trades: OptionsFlowTrade[]) => void;
  loadEarlierTrades: () => Promise<void>;
  prependFlowTrade: (trade: OptionsFlowTrade) => void;
  setSignals: (signals: MarketSignal[]) => void;
  prependSignal: (signal: MarketSignal) => void;
  setEarnings: (earnings: EarningsEvent[]) => void;
  setEconomic: (economic: EconomicRelease[]) => void;
  setEcosystemHealth: (health: EcosystemHealth) => void;

  // Filters — News
  newsCategory: NewsCategory;
  setNewsCategory: (cat: NewsCategory) => void;
  /**
   * Positively whitelisted categories. If non-empty, only articles matching one of these are displayed.
   */
  includedCategories: NewsCategory[];
  /**
   * Negatively blacklisted categories. Articles matching these categories are suppressed.
   */
  excludedCategories: NewsCategory[];
  /**
   * Negatively blacklisted tickers. Articles referencing these tickers are suppressed.
   */
  excludedTickers: string[];
  /**
   * Toggles positive inclusion, negative exclusion, or cycles state for a category.
   *
   * @param {NewsCategory} category - Target news category.
   * @param {"include" | "exclude" | "cycle"} [mode="cycle"] - Action mode.
   */
  toggleCategoryFilter: (category: NewsCategory, mode?: "include" | "exclude" | "cycle") => void;
  /**
   * Toggles suppression of a specific ticker from the news feed.
   *
   * @param {string} ticker - Target ticker symbol to suppress or unsuppress.
   */
  toggleExcludeTicker: (ticker: string) => void;
  /**
   * Resets all category inclusions, exclusions, ticker suppressions, and search terms.
   */
  clearNewsFilters: () => void;
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
  /**
   * Master toggle for automated hands-free speech synthesis audio squawk.
   * Initialized to false (muted by default) to avoid disruptive audio upon startup.
   */
  squawkEnabled: boolean;
  /**
   * Sets the audio squawk enabled/muted state.
   * When muted, immediately halts active speech synthesis and empties the audio playback queue.
   * @param {boolean} enabled - Whether speech synthesis audio should be active.
   * @returns {void}
   */
  setSquawkEnabled: (enabled: boolean) => void;
  /**
   * Playback volume for speech synthesis (0.0 to 1.0).
   */
  squawkVolume: number;
  /**
   * Sets playback volume for speech synthesis.
   * @param {number} vol - Volume level between 0.0 and 1.0.
   * @returns {void}
   */
  setSquawkVolume: (vol: number) => void;
  /**
   * Speech rate / cadence multiplier (0.8 to 1.5).
   */
  squawkRate: number;
  /**
   * Sets speech rate multiplier.
   * @param {number} rate - Rate multiplier.
   * @returns {void}
   */
  setSquawkRate: (rate: number) => void;
  /**
   * URI of selected speech synthesis voice, or null for default system voice.
   */
  selectedVoiceURI: string | null;
  /**
   * Sets selected speech synthesis voice URI.
   * @param {string | null} uri - Selected voice URI.
   * @returns {void}
   */
  setSelectedVoiceURI: (uri: string | null) => void;
  /**
   * Category channels allowed to trigger audio announcements.
   */
  squawkChannels: {
    news: boolean;
    flow: boolean;
    halts: boolean;
  };
  /**
   * Updates an individual squawk channel filter.
   * @param {"news" | "flow" | "halts"} channel - Target channel identifier.
   * @param {boolean} val - Whether channel audio is enabled.
   * @returns {void}
   */
  setSquawkChannel: (channel: "news" | "flow" | "halts", val: boolean) => void;
  /**
   * Pending queue of squawk messages awaiting speech synthesis.
   */
  squawkQueue: SquawkMessage[];
  /**
   * Ingests a new squawk event.
   * Preserves event in rolling visual squawk history (50 items) regardless of audio state.
   * Enqueues for voice playback only if squawk is actively unmuted.
   * @param {SquawkMessage} msg - Incoming squawk message.
   * @returns {void}
   */
  pushSquawkMessage: (msg: SquawkMessage) => void;
  /**
   * Pops the next squawk message from playback queue.
   * @returns {SquawkMessage | undefined} Next message to speak, or undefined if queue empty.
   */
  popSquawkMessage: () => SquawkMessage | undefined;
  /**
   * Visual audit log of the last 50 squawk messages received.
   */
  squawkHistory: SquawkMessage[];
  /**
   * Whether the browser SpeechSynthesis engine is currently speaking an announcement.
   */
  isSquawkPlaying: boolean;
  /**
   * Sets active speaking status indicator.
   * @param {boolean} playing - True if audio is actively speaking.
   * @returns {void}
   */
  setIsSquawkPlaying: (playing: boolean) => void;
  /**
   * Whether the Squawk settings and history drawer modal is open.
   */
  isSquawkDrawerOpen: boolean;
  /**
   * Toggles or sets the Squawk settings drawer modal visibility.
   * @param {boolean} open - True to display modal drawer.
   * @returns {void}
   */
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
  flowTotal: 0,
  hasMoreFlow: false,
  isFlowLoadingMore: false,
  signals: [],
  earnings: [],
  economic: [],
  ecosystemHealth: null,

  setNewsArticles: (newsArticles) => set({ newsArticles }),
  prependNewsArticle: (article) =>
    set((state) => ({
      newsArticles: [article, ...state.newsArticles.filter((a) => a.id !== article.id)].slice(0, 500),
    })),

  setFlowTrades: (flowTrades, total) =>
    set((state) => {
      const finalTotal = typeof total === "number" ? total : Math.max(state.flowTotal, flowTrades.length);
      return {
        flowTrades,
        flowTotal: finalTotal,
        hasMoreFlow: flowTrades.length < finalTotal,
      };
    }),

  appendOlderFlowTrades: (olderTrades) =>
    set((state) => {
      const existingIds = new Set(state.flowTrades.map((t) => t.id));
      const uniqueOlder = olderTrades.filter((t) => !existingIds.has(t.id));
      const combined = [...state.flowTrades, ...uniqueOlder];
      return {
        flowTrades: combined,
        hasMoreFlow: combined.length < state.flowTotal,
      };
    }),

  loadEarlierTrades: async () => {
    const state = get();
    if (state.isFlowLoadingMore || !state.hasMoreFlow) return;
    set({ isFlowLoadingMore: true });
    try {
      const offset = state.flowTrades.length;
      const res = await fetch(`/v1/flow?offset=${offset}&limit=250`);
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        const total = typeof json.total === "number" ? json.total : state.flowTotal;
        const existingIds = new Set(get().flowTrades.map((t) => t.id));
        const uniqueOlder = (json.data as OptionsFlowTrade[]).filter((t) => !existingIds.has(t.id));
        const newCombined = [...get().flowTrades, ...uniqueOlder];
        set({
          flowTrades: newCombined,
          flowTotal: Math.max(total, newCombined.length),
          hasMoreFlow: newCombined.length < total,
        });
      } else {
        set({ hasMoreFlow: false });
      }
    } catch (err) {
      console.error("[WireForgeStore] Failed to load earlier trades:", err);
    } finally {
      set({ isFlowLoadingMore: false });
    }
  },

  prependFlowTrade: (trade) =>
    set((state) => {
      const filtered = state.flowTrades.filter((t) => t.id !== trade.id);
      return {
        flowTrades: [trade, ...filtered].slice(0, 5000),
        flowTotal: state.flowTotal + 1,
      };
    }),

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
  includedCategories: [],
  excludedCategories: [],
  excludedTickers: [],
  setNewsCategory: (newsCategory) =>
    set((state) => {
      if (newsCategory === "all") {
        return { newsCategory: "all", includedCategories: [], excludedCategories: [] };
      }
      return {
        newsCategory,
        includedCategories: [newsCategory],
        excludedCategories: state.excludedCategories.filter((c) => c !== newsCategory),
      };
    }),
  toggleCategoryFilter: (category, mode = "cycle") =>
    set((state) => {
      if (category === "all") {
        return { newsCategory: "all", includedCategories: [], excludedCategories: [] };
      }
      const inc = new Set(state.includedCategories);
      const exc = new Set(state.excludedCategories);

      if (mode === "cycle") {
        // Neutral -> Include (+) -> Exclude (-) -> Neutral
        if (!inc.has(category) && !exc.has(category)) {
          inc.add(category);
        } else if (inc.has(category)) {
          inc.delete(category);
          exc.add(category);
        } else {
          exc.delete(category);
        }
      } else if (mode === "include") {
        exc.delete(category);
        if (inc.has(category)) inc.delete(category);
        else inc.add(category);
      } else if (mode === "exclude") {
        inc.delete(category);
        if (exc.has(category)) exc.delete(category);
        else exc.add(category);
      }

      const nextInc = Array.from(inc);
      const nextExc = Array.from(exc);
      return {
        includedCategories: nextInc,
        excludedCategories: nextExc,
        newsCategory:
          nextInc.length === 1 ? nextInc[0] : nextInc.length === 0 ? "all" : state.newsCategory,
      };
    }),
  toggleExcludeTicker: (ticker) =>
    set((state) => {
      const sym = ticker.toUpperCase().replace("$", "").trim();
      if (!sym) return state;
      const existing = state.excludedTickers;
      if (existing.includes(sym)) {
        return { excludedTickers: existing.filter((t) => t !== sym) };
      }
      return { excludedTickers: [...existing, sym] };
    }),
  clearNewsFilters: () =>
    set({
      newsCategory: "all",
      includedCategories: [],
      excludedCategories: [],
      excludedTickers: [],
      newsSearchQuery: "",
      newsTickerFilter: "",
    }),
  newsSearchQuery: "",
  setNewsSearchQuery: (newsSearchQuery) => set({ newsSearchQuery }),
  newsTickerFilter: "",
  setNewsTickerFilter: (newsTickerFilter) => set({ newsTickerFilter }),

  flowMinPremium: 25000,
  setFlowMinPremium: (flowMinPremium) => set({ flowMinPremium }),
  flowSentimentFilter: "all",
  setFlowSentimentFilter: (flowSentimentFilter) => set({ flowSentimentFilter }),
  flowTickerFilter: "",
  setFlowTickerFilter: (flowTickerFilter) => set({ flowTickerFilter }),
  flowGoldenOnly: false,
  setFlowGoldenOnly: (flowGoldenOnly) => set({ flowGoldenOnly }),

  // Audio Squawk
  squawkEnabled: false,
  setSquawkEnabled: (squawkEnabled) => {
    if (!squawkEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    set({ squawkEnabled, squawkQueue: squawkEnabled ? get().squawkQueue : [] });
  },
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
      squawkQueue: state.squawkEnabled ? [...state.squawkQueue, msg] : [],
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
