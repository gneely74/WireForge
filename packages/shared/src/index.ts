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

// ==========================================
// 9. BIOTECH RADAR & CATALYST INTELLIGENCE
// ==========================================

/**
 * Schema representing an upcoming or current FDA clinical milestone catalyst.
 * Integrates clinical stage, trial registry ID (NCT), cash runway, and market metrics.
 */
export const BiotechCatalystSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  drugName: z.string(),
  stage: z.string(),
  stageRaw: z.string().optional(),
  indication: z.string(),
  catalystDate: z.string(),
  note: z.string(),
  clinicalTrialId: z.string().nullable().optional(),
  estimatedPrimaryCompletionDate: z.string().nullable().optional(),
  pressLink: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  change: z.number().nullable().optional(),
  percentChange: z.number().nullable().optional(),
  marketCap: z.number().nullable().optional(),
  float: z.number().nullable().optional(),
  cashLive: z.number().nullable().optional(),
  monthlyBurn: z.number().nullable().optional(),
  monthsCash: z.number().nullable().optional(),
  statuses: z.array(z.object({
    label: z.string(),
    abbreviation: z.string().optional(),
  })).optional(),
  sparkline: z.array(z.array(z.number())).optional(),
});
/** TypeScript interface for an authentic FDA clinical milestone catalyst. */
export type BiotechCatalyst = z.infer<typeof BiotechCatalystSchema>;

/**
 * Schema representing an FDA PDUFA decision date or Advisory Committee (AdCom) milestone.
 */
export const PdufaEventSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  drugName: z.string(),
  pdufaDate: z.string().nullable().optional(),
  priorityReviewDate: z.string().nullable().optional(),
  adcomDate: z.string().nullable().optional(),
  status: z.string().optional(),
  note: z.string().optional(),
  pressLink: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  percentChange: z.number().nullable().optional(),
});
/** TypeScript interface for a PDUFA decision target event. */
export type PdufaEvent = z.infer<typeof PdufaEventSchema>;

/**
 * Schema representing catalyst expected price move, options implied volatility,
 * and options sentiment for upcoming biotech catalysts.
 */
export const CatalystImpactItemSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string().optional(),
  drugName: z.string().optional(),
  catalystDate: z.string().optional(),
  indication: z.string().optional(),
  stage: z.string().optional(),
  expectedPriceMovePct: z.number().nullable().optional(),
  impliedVolatility: z.number().nullable().optional(),
  openInterest: z.number().nullable().optional(),
  daysToExpiration: z.number().nullable().optional(),
  recentSweepsCount: z.number().default(0),
  totalOptionVolume: z.number().default(0),
  bullishFlowRatio: z.number().nullable().optional(),
});
/** TypeScript interface for catalyst options impact and volatility metrics. */
export type CatalystImpactItem = z.infer<typeof CatalystImpactItemSchema>;

/**
 * Schema representing major medical and scientific healthcare conferences
 * (e.g. J.P. Morgan Healthcare Conference, ASCO, AACR, ASH, EAACI).
 */
export const BiotechConferenceEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  acronym: z.string(),
  type: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  abstractDate: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  companiesCount: z.number().optional(),
});
/** TypeScript interface for a biotech conference event. */
export type BiotechConferenceEvent = z.infer<typeof BiotechConferenceEventSchema>;

/**
 * Schema representing an authentic presentation scheduled for the J.P. Morgan Healthcare Conference.
 */
export const JpmConferencePresentationSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  dateTime: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  deals: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  catalystChange: z.string().nullable().optional(),
});
/** TypeScript interface for a JPM conference presentation. */
export type JpmConferencePresentation = z.infer<typeof JpmConferencePresentationSchema>;

/**
 * Schema representing a medical device regulatory or clinical catalyst (510(k), PMA, De Novo).
 */
export const MedicalDeviceCatalystSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string().optional(),
  deviceName: z.string(),
  indication: z.string(),
  stage: z.string(),
  decisionDate: z.string().nullable().optional(),
  note: z.string().optional(),
  cashLive: z.number().nullable().optional(),
  monthsCash: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  percentChange: z.number().nullable().optional(),
});
/** TypeScript interface for a medical device catalyst. */
export type MedicalDeviceCatalyst = z.infer<typeof MedicalDeviceCatalystSchema>;

/**
 * Schema representing historical FDA catalyst outcomes, decisions, and post-catalyst stock performance.
 */
export const HistoricalCatalystItemSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  drugName: z.string(),
  indication: z.string(),
  stage: z.string(),
  catalystDate: z.string(),
  note: z.string(),
  priceAtCatalyst: z.union([z.string(), z.number()]).nullable().optional(),
  catalystPriceMovement: z.union([z.string(), z.number()]).nullable().optional(),
});
/** TypeScript interface for a historical catalyst outcome. */
export type HistoricalCatalystItem = z.infer<typeof HistoricalCatalystItemSchema>;

/**
 * Schema representing historical medical device regulatory decisions and price movements.
 */
export const HistoricalMedicalDeviceItemSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string().optional(),
  deviceName: z.string(),
  indication: z.string(),
  stage: z.string(),
  catalystDate: z.string(),
  note: z.string(),
  priceChange: z.union([z.string(), z.number()]).nullable().optional(),
});
/** TypeScript interface for a historical medical device decision. */
export type HistoricalMedicalDeviceItem = z.infer<typeof HistoricalMedicalDeviceItemSchema>;

/**
 * Schema representing biotech Initial Public Offerings (IPOs) and offerings calendar.
 */
export const BiotechIpoItemSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  company: z.string(),
  managers: z.string(),
  shares: z.string().nullable().optional(),
  volume: z.string().nullable().optional(),
  expectedToTrade: z.string().nullable().optional(),
});
/** TypeScript interface for a biotech IPO event. */
export type BiotechIpoItem = z.infer<typeof BiotechIpoItemSchema>;

/**
 * Schema representing cash runway, monthly burn rate, and dilution risk analysis for biotech equities.
 * Dilution risk is triggered when months of cash falls below 6 months.
 */
export const BiotechCashRunwayItemSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  price: z.number().nullable().optional(),
  percentChange: z.number().nullable().optional(),
  cashLive: z.number(),
  monthlyBurn: z.number(),
  monthsCash: z.number(),
  reportDate: z.string(),
  dangerDilution: z.boolean(),
  notes: z.string().optional(),
});
/** TypeScript interface for biotech balance sheet runway and dilution risk metrics. */
export type BiotechCashRunwayItem = z.infer<typeof BiotechCashRunwayItemSchema>;

/**
 * Schema representing a drug pipeline candidate in the comprehensive screener database.
 */
export const DrugPipelineItemSchema = z.object({
  id: z.string(),
  drugId: z.number(),
  drugName: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  stage: z.string(),
  indication: z.string(),
  catalystDate: z.string().optional(),
  clinicalTrialId: z.string().nullable().optional(),
  note: z.string().optional(),
  monthsCash: z.number().nullable().optional(),
  marketCap: z.number().nullable().optional(),
});
/** TypeScript interface for a drug pipeline candidate. */
export type DrugPipelineItem = z.infer<typeof DrugPipelineItemSchema>;

/**
 * Enriched composite intelligence details for a biotech company,
 * cross-referencing BioPharmCatalyst, NIH ClinicalTrials.gov, and ValueForge SEC EDGAR filings.
 */
export interface BiotechStockDetail {
  ticker: string;
  companyName: string;
  price?: number | null;
  marketCap?: number | null;
  catalysts: BiotechCatalyst[];
  clinicalTrials: Array<{
    nctId: string;
    briefTitle: string;
    overallStatus: string;
    phase?: string;
    enrollmentCount?: number;
    primaryCompletionDate?: string;
  }>;
  secFilings: Array<{
    accessionNo: string;
    formType: string;
    filingDate: string;
    description: string;
    primaryDocumentUrl: string;
  }>;
  financials?: {
    cik?: number;
    cashLive?: number | null;
    monthlyBurn?: number | null;
    monthsCash?: number | null;
    dangerDilution?: boolean;
    sicCode?: string;
    headquarters?: string;
    description?: string;
  };
  optionsSummary?: {
    totalVolume: number;
    callVolume: number;
    putVolume: number;
    bullishRatio: number | null;
    sweepsCount: number;
    impliedVolatility?: number | null;
  };
}

