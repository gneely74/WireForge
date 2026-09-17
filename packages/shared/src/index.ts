import { z } from "zod";

// ==========================================
// 1. NEWS & WIRE TYPES & SCHEMAS
// ==========================================
export const NewsCategorySchema = z.enum([
  "all",
  "earnings",
  "fda",
  "ratings",
  "sec",
  "ma",
  "guidance",
  "dividends",
  "macro",
  "social",
  "general",
]);
export type NewsCategory = z.infer<typeof NewsCategorySchema>;

export const NewsImpactSchema = z.enum(["high", "medium", "low"]);
export type NewsImpact = z.infer<typeof NewsImpactSchema>;

export const SentimentSchema = z.enum(["bullish", "bearish", "neutral"]);
export type Sentiment = z.infer<typeof SentimentSchema>;

export const NewsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  content: z.string().optional(),
  tickers: z.array(z.string()),
  category: NewsCategorySchema,
  impact: NewsImpactSchema,
  sentiment: SentimentSchema,
  source: z.string(),
  url: z.string().optional(),
  timestamp: z.number(),
  isoTime: z.string(),
  isSquawked: z.boolean().default(false),
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

// ==========================================
// 2. UNUSUAL OPTIONS ACTIVITY (UOA / FLOW)
// ==========================================
export const OptionOrderTypeSchema = z.enum(["sweep", "block", "split"]);
export type OptionOrderType = z.infer<typeof OptionOrderTypeSchema>;

export const OptionSideSchema = z.enum(["ask", "bid", "mid", "above_ask", "below_bid"]);
export type OptionSide = z.infer<typeof OptionSideSchema>;

export const OptionsFlowTradeSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  timeStr: z.string(),
  ticker: z.string(),
  expiration: z.string(), // YYYY-MM-DD
  strike: z.number(),
  contractType: z.enum(["CALL", "PUT"]),
  spotPrice: z.number(),
  tradePrice: z.number(),
  size: z.number(),
  openInterest: z.number(),
  volume: z.number(),
  premium: z.number(), // $ dollar total
  orderType: OptionOrderTypeSchema,
  side: OptionSideSchema,
  sentiment: SentimentSchema,
  isGolden: z.boolean(), // Size > Open Interest and filled at/above Ask
  dte: z.number(),
  exchange: z.string().default("MULTI"),
});
export type OptionsFlowTrade = z.infer<typeof OptionsFlowTradeSchema>;

// ==========================================
// 3. MARKET SIGNALS, MOVERS & HALTS
// ==========================================
export const MarketSignalTypeSchema = z.enum([
  "52w_high",
  "52w_low",
  "rvol_spike",
  "price_spike",
  "luld_halt",
  "luld_resume",
  "vwap_cross",
]);
export type MarketSignalType = z.infer<typeof MarketSignalTypeSchema>;

export const MarketSignalSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  timeStr: z.string(),
  ticker: z.string(),
  type: MarketSignalTypeSchema,
  title: z.string(),
  description: z.string(),
  metric: z.string(),
  sentiment: SentimentSchema,
});
export type MarketSignal = z.infer<typeof MarketSignalSchema>;

// ==========================================
// 4. CORPORATE & ECONOMIC CALENDARS
// ==========================================
export const EarningsEventSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  date: z.string(), // YYYY-MM-DD
  timing: z.enum(["BMO", "AMC", "DURING"]),
  epsEstimate: z.number().nullable().optional(),
  epsActual: z.number().nullable().optional(),
  revEstimate: z.string().nullable().optional(),
  revActual: z.string().nullable().optional(),
  fiscalQuarter: z.string().default("Q3 2026"),
});
export type EarningsEvent = z.infer<typeof EarningsEventSchema>;

export const EconomicReleaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string().default("US"),
  date: z.string(),
  time: z.string(),
  impact: NewsImpactSchema,
  actual: z.string().nullable().optional(),
  forecast: z.string().nullable().optional(),
  previous: z.string().nullable().optional(),
});
export type EconomicRelease = z.infer<typeof EconomicReleaseSchema>;

// ==========================================
// 5. AUDIO SQUAWK
// ==========================================
export const SquawkMessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  priority: z.number().default(2), // 1 = immediate breaking, 2 = standard
  category: z.string(),
  timestamp: z.number(),
  ticker: z.string().optional(),
});
export type SquawkMessage = z.infer<typeof SquawkMessageSchema>;

// ==========================================
// 6. ECOSYSTEM INTEGRATION STATUS
// ==========================================
export interface EcosystemHealth {
  tradingAgent: {
    url: string;
    connected: boolean;
    status?: string;
    dixSentiment?: string;
    dixValue?: number;
    gexCallWall?: number;
    gexPutWall?: number;
    gexZeroFlip?: number;
  };
  chartforge: {
    url: string;
    connected: boolean;
    version?: string;
  };
  thetadata: {
    url: string;
    connected: boolean;
  };
  edgar: {
    url: string;
    connected: boolean;
  };
}

// ==========================================
// 7. SHARED WATCHLISTS
// ==========================================
export const WatchlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  symbols: z.array(z.string()),
  isPreset: z.boolean().default(false),
  updatedAt: z.number().optional(),
});
export type Watchlist = z.infer<typeof WatchlistSchema>;

export const PRESET_WATCHLISTS: Watchlist[] = [
  {
    id: "options-bellwethers",
    name: "Options Bellwethers",
    description: "Highest liquidity options flow & tech mega-caps",
    symbols: ["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "AMD", "NFLX", "AVGO", "SMCI", "PLTR"],
    isPreset: true,
  },
  {
    id: "indices-volatility",
    name: "Indices & Volatility",
    description: "Benchmark equity indexes, broad market ETFs & volatility",
    symbols: ["SPX", "SPY", "QQQ", "IWM", "RUT", "NDX", "DJX", "VIX"],
    isPreset: true,
  },
  {
    id: "sector-etfs-macro",
    name: "Sector ETFs & Macro",
    description: "Key economic sectors, interest rates, commodities & credit",
    symbols: ["SPY", "QQQ", "IWM", "TLT", "XLF", "SMH", "XLE", "XLK", "GLD", "USO", "HYG"],
    isPreset: true,
  },
];

// ==========================================
// 8. STOCKTWITS SOCIAL & SENTIMENT
// ==========================================
export const StockTwitsMessageSchema = z.object({
  id: z.string(),
  body: z.string(),
  tickers: z.array(z.string()),
  user: z.object({
    username: z.string(),
    name: z.string().optional(),
    avatarUrl: z.string().optional(),
    followers: z.number().default(0),
  }),
  sentiment: SentimentSchema.nullable(),
  timestamp: z.number(),
  isoTime: z.string(),
  source: z.string().default("StockTwits"),
  likes: z.number().default(0),
});
export type StockTwitsMessage = z.infer<typeof StockTwitsMessageSchema>;

export const StockTwitsSentimentSchema = z.object({
  symbol: z.string(),
  bullishPct: z.number(),
  bullishCount: z.number(),
  bearishCount: z.number(),
  totalMessages: z.number(),
  watchlistCount: z.number().optional(),
  updatedAt: z.number(),
});
export type StockTwitsSentiment = z.infer<typeof StockTwitsSentimentSchema>;

