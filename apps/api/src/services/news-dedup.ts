/**
 * Multi-Tier News Deduplication Engine for WireForge
 * 
 * Implements:
 * - Tier 1: Canonical URL Normalization & SEC Accession Key Extraction
 * - Tier 2: Normalized Headline Fingerprinting (Exact Match & Publisher Stripping)
 * - Tier 3: Ticker-Aware Fuzzy Token Similarity (Near-Duplicate Detection)
 */

export interface DeduplicationOptions {
  /** Jaccard similarity threshold for near-duplicates sharing a company ticker (0.0 - 1.0). Default: 0.35 */
  tickerSimilarityThreshold?: number;
  /** Jaccard similarity threshold for macro/generic news without specific tickers (0.0 - 1.0). Default: 0.65 */
  macroSimilarityThreshold?: number;
  /** Minimum shared content tokens required to flag near-duplicate. Default: 3 */
  minSharedTokens?: number;
  /** Time window in milliseconds for fuzzy near-duplicate matching. Default: 4 hours */
  fuzzyWindowMs?: number;
  /** Time window in milliseconds for headline fingerprint cache. Default: 24 hours */
  fingerprintWindowMs?: number;
  /** Maximum number of records per cache map to prevent memory leaks. Default: 3000 */
  maxEntries?: number;
}

export interface DedupeResult {
  isDuplicate: boolean;
  tier?: 1 | 2 | 3;
  reason?: "canonical_url" | "sec_accession" | "headline_fingerprint" | "fuzzy_token_similarity";
  matchedId?: string;
  similarity?: number;
}

interface TrackedArticle {
  id: string;
  title: string;
  tickers: string[];
  tokens: Set<string>;
  timestamp: number;
}

// Common publisher attribution suffixes found on Google News, RSS, and wire syndications
const PUBLISHER_SUFFIX_REGEX =
  /\s*[-–—|]\s*(Reuters|Bloomberg|CNBC|The Wall Street Journal|WSJ|MarketWatch|Yahoo Finance|Associated Press|AP|Benzinga|PR Newswire|Business Wire|Seeking Alpha|Financial Times|FT|Barron's|Investor's Business Daily|IBD|The Fly|Investing\.com|Forbes|TheStreet|Fox Business|Barchart|TipRanks|Zacks|GlobeNewswire).*$/i;

// Generic trailing attribution if pattern is " - [Any Publisher Word(s)]"
const GENERIC_TRAILING_ATTRIBUTION_REGEX = /\s*[-–—|]\s*[A-Za-z0-9\s.&]{2,30}$/;

// Standard English and financial stop words
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "its", "it", "this", "that", "these", "those",
  "about", "after", "amid", "says", "said", "reports", "reported", "reporting",
  "today", "now", "new", "inc", "corp", "co", "ltd", "llc", "shares", "stock",
  "stocks", "market", "markets", "update", "breaking", "statement", "into",
  "over", "under", "than", "more", "most", "also", "out", "up", "down"
]);

/**
 * Tier 1A: Canonical URL Normalization
 * Strips tracking parameters, referral tokens, fragments, and trailing slashes.
 */
export function getCanonicalUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const url = new URL(rawUrl);
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "oc", "ved", "usg", "ref", "fbclid", "gclid", "msclkid", "_ga", "source",
      "campaign", "client", "ncid"
    ];
    for (const p of trackingParams) {
      url.searchParams.delete(p);
    }
    // Remove hash fragment
    url.hash = "";
    // Normalize protocol and hostname to lowercase
    let clean = `${url.protocol}//${url.hostname.toLowerCase()}${url.pathname}`;
    // Remove trailing slash if path is not root
    if (clean.endsWith("/") && url.pathname !== "/") {
      clean = clean.slice(0, -1);
    }
    // Keep sorted remaining search params if any
    const remainingKeys = Array.from(url.searchParams.keys()).sort();
    if (remainingKeys.length > 0) {
      const search = remainingKeys
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(url.searchParams.get(k) || "")}`)
        .join("&");
      clean += `?${search}`;
    }
    return clean;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Tier 1B: SEC EDGAR Accession Number Extraction
 * Identifies duplicate SEC filings regardless of URL parameters or viewer wrapper (/ix?doc=...).
 */
export function getSecAccessionKey(urlOrText: string): string | null {
  if (!urlOrText) return null;
  // Format: 0000000000-00-000000 (10 digits - 2 digits - 6 digits)
  const matchDashed = urlOrText.match(/(\d{10}-\d{2}-\d{6})/);
  if (matchDashed) {
    return `sec:${matchDashed[1]}`;
  }
  // Format: 18 digits without dashes in directory paths: e.g. /000032019326000105/
  const matchPlain = urlOrText.match(/\/(\d{10})(\d{2})(\d{6})\//);
  if (matchPlain) {
    return `sec:${matchPlain[1]}-${matchPlain[2]}-${matchPlain[3]}`;
  }
  return null;
}

/**
 * Tier 2: Normalized Headline Fingerprinting
 * Strips publisher attributions, SEC filing headers, ticker symbols, punctuation, and extra whitespace.
 */
export function normalizeHeadline(title: string): string {
  if (!title) return "";
  let clean = title
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Strip publisher attributions at the end of the headline
  clean = clean.replace(PUBLISHER_SUFFIX_REGEX, "");
  // Fallback to generic attribution if still present
  clean = clean.replace(GENERIC_TRAILING_ATTRIBUTION_REGEX, "");

  // Strip common SEC filing headers & filer tags
  clean = clean
    .replace(/^(SEC\s+Form\s+)?(8-K|10-K|10-Q|4|SC\s+13[D|G]):?\s*/i, "")
    .replace(/^8-K\s*-\s*/i, "")
    .replace(/\s*\(\d+\)\s*\(Filer\)/gi, "")
    .replace(/\s*\(Filer\)/gi, "")
    .replace(/\s*\(Issuer\)/gi, "");

  // Remove commas inside numbers: e.g. 462,000 -> 462000
  clean = clean.replace(/(\d),(\d)/g, "$1$2");

  // Strip ticker dollar signs: $NVDA -> NVDA
  clean = clean.replace(/\$([A-Za-z]+)/g, "$1");

  // Lowercase & remove non-alphanumeric characters (replacing with spaces)
  clean = clean.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

  // Collapse consecutive whitespace
  return clean.trim().replace(/\s+/g, " ");
}

/**
 * Lightweight English financial stemmer for headline tokenization
 */
export function stemToken(word: string): string {
  if (word.length <= 2) return word;
  if (word.endsWith("ies")) return word.slice(0, -3);
  if (word.endsWith("y") && word.length > 3) return word.slice(0, -1);
  if (word.endsWith("ing") && word.length > 4) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 3) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 3) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

/**
 * Tokenizes a headline into a set of normalized, stemmed keywords
 */
export function tokenizeHeadline(title: string): Set<string> {
  const normalized = normalizeHeadline(title);
  if (!normalized) return new Set();

  const words = normalized.split(" ");
  const tokens = new Set<string>();

  for (const raw of words) {
    if (raw.length < 2) continue;
    if (STOP_WORDS.has(raw)) continue;
    tokens.add(stemToken(raw));
  }

  return tokens;
}

/**
 * Calculates Jaccard similarity between two token sets: |A ∩ B| / |A ∪ B|
 */
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection++;
    }
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Counts the intersection size between two token sets
 */
export function countSharedTokens(setA: Set<string>, setB: Set<string>): number {
  let count = 0;
  for (const token of setA) {
    if (setB.has(token)) count++;
  }
  return count;
}

/**
 * Generic ticker labels that do not represent a single equity company
 */
const GENERIC_TICKERS = new Set(["MARKET", "SEC", "MACRO", "FED", "SPY", "QQQ"]);

/**
 * Main NewsDeduplicator engine managing multi-tier deduplication state
 */
export class NewsDeduplicator {
  private canonicalUrls = new Map<string, number>(); // canonicalUrl -> timestamp
  private secKeys = new Map<string, number>(); // secKey -> timestamp
  private fingerprints = new Map<string, number>(); // fingerprint -> timestamp
  private recentArticles: TrackedArticle[] = [];

  private tickerSimThreshold: number;
  private macroSimThreshold: number;
  private minSharedTokens: number;
  private fuzzyWindowMs: number;
  private fingerprintWindowMs: number;
  private maxEntries: number;

  constructor(options: DeduplicationOptions = {}) {
    this.tickerSimThreshold = options.tickerSimilarityThreshold ?? 0.35;
    this.macroSimThreshold = options.macroSimilarityThreshold ?? 0.65;
    this.minSharedTokens = options.minSharedTokens ?? 3;
    this.fuzzyWindowMs = options.fuzzyWindowMs ?? 4 * 60 * 60 * 1000; // 4 hours
    this.fingerprintWindowMs = options.fingerprintWindowMs ?? 24 * 60 * 60 * 1000; // 24 hours
    this.maxEntries = options.maxEntries ?? 3000;
  }

  /**
   * Evaluates an article against Tier 1, Tier 2, and Tier 3.
   * If unique, tracks it and returns { isDuplicate: false }.
   * If duplicate, returns { isDuplicate: true, tier, reason, ... } without tracking.
   */
  public checkAndTrack(article: {
    id?: string;
    title: string;
    url?: string;
    tickers?: string[];
    timestamp?: number;
  }): DedupeResult {
    const now = article.timestamp ?? Date.now();
    this.prune(now);

    const articleId = article.id || `news-${now}-${Math.random().toString(36).slice(2, 6)}`;
    const tickers = (article.tickers || []).map((t) => t.toUpperCase());

    // --- TIER 1A: Canonical URL ---
    if (article.url) {
      const canonical = getCanonicalUrl(article.url);
      if (canonical && this.canonicalUrls.has(canonical)) {
        return {
          isDuplicate: true,
          tier: 1,
          reason: "canonical_url",
        };
      }

      // --- TIER 1B: SEC Accession Key ---
      const secKey = getSecAccessionKey(article.url);
      if (secKey && this.secKeys.has(secKey)) {
        return {
          isDuplicate: true,
          tier: 1,
          reason: "sec_accession",
        };
      }
    }

    // --- TIER 2: Normalized Headline Fingerprint (Exact Match) ---
    const fingerprint = normalizeHeadline(article.title);
    if (fingerprint.length > 0) {
      const seenTime = this.fingerprints.get(fingerprint);
      if (seenTime !== undefined && now - seenTime <= this.fingerprintWindowMs) {
        return {
          isDuplicate: true,
          tier: 2,
          reason: "headline_fingerprint",
        };
      }
    }

    // --- TIER 3: Fuzzy Token Similarity (Near-Duplicates within 4h window) ---
    const tokens = tokenizeHeadline(article.title);
    if (tokens.size >= 2) {
      const specificTickers = tickers.filter((t) => !GENERIC_TICKERS.has(t));

      for (const recent of this.recentArticles) {
        if (now - recent.timestamp > this.fuzzyWindowMs) continue;

        const recentSpecificTickers = recent.tickers.filter((t) => !GENERIC_TICKERS.has(t));
        const sharedTokenCount = countSharedTokens(tokens, recent.tokens);

        // Case A: Both articles tag specific company tickers
        if (specificTickers.length > 0 && recentSpecificTickers.length > 0) {
          const sharesTicker = specificTickers.some((t) => recentSpecificTickers.includes(t));
          if (sharesTicker && sharedTokenCount >= this.minSharedTokens) {
            const jaccard = calculateJaccardSimilarity(tokens, recent.tokens);
            const dice = (2 * sharedTokenCount) / (tokens.size + recent.tokens.size);
            if (jaccard >= this.tickerSimThreshold || dice >= 0.48) {
              return {
                isDuplicate: true,
                tier: 3,
                reason: "fuzzy_token_similarity",
                matchedId: recent.id,
                similarity: Math.round(Math.max(jaccard, dice) * 100) / 100,
              };
            }
          }
          // If different company tickers (e.g. NVDA vs AMD), do not dedupe
        } else {
          // Case B: Macro / general news without specific company tickers
          if (sharedTokenCount >= this.minSharedTokens + 1) {
            const jaccard = calculateJaccardSimilarity(tokens, recent.tokens);
            if (jaccard >= this.macroSimThreshold) {
              return {
                isDuplicate: true,
                tier: 3,
                reason: "fuzzy_token_similarity",
                matchedId: recent.id,
                similarity: Math.round(jaccard * 100) / 100,
              };
            }
          }
        }
      }
    }

    // --- NO DUPLICATE DETECTED: Record in tracking state ---
    if (article.url) {
      const canonical = getCanonicalUrl(article.url);
      if (canonical) this.canonicalUrls.set(canonical, now);

      const secKey = getSecAccessionKey(article.url);
      if (secKey) this.secKeys.set(secKey, now);
    }

    if (fingerprint.length > 0) {
      this.fingerprints.set(fingerprint, now);
    }

    this.recentArticles.unshift({
      id: articleId,
      title: article.title,
      tickers,
      tokens,
      timestamp: now,
    });

    return { isDuplicate: false };
  }

  /**
   * Prune expired entries to maintain a bounded memory footprint
   */
  public prune(now: number = Date.now()) {
    // Prune recent articles outside fuzzy window (4h) or keep max 500
    this.recentArticles = this.recentArticles.filter(
      (a) => now - a.timestamp <= this.fuzzyWindowMs
    );
    if (this.recentArticles.length > 500) {
      this.recentArticles.length = 500;
    }

    // Prune fingerprints older than 24h
    if (this.fingerprints.size > this.maxEntries) {
      for (const [fp, time] of this.fingerprints.entries()) {
        if (now - time > this.fingerprintWindowMs) {
          this.fingerprints.delete(fp);
        }
      }
    }

    // Prune canonical URLs older than 24h if size exceeded
    if (this.canonicalUrls.size > this.maxEntries) {
      for (const [url, time] of this.canonicalUrls.entries()) {
        if (now - time > this.fingerprintWindowMs) {
          this.canonicalUrls.delete(url);
        }
      }
    }

    // Prune SEC keys older than 24h
    if (this.secKeys.size > this.maxEntries) {
      for (const [k, time] of this.secKeys.entries()) {
        if (now - time > this.fingerprintWindowMs) {
          this.secKeys.delete(k);
        }
      }
    }
  }

  public clear() {
    this.canonicalUrls.clear();
    this.secKeys.clear();
    this.fingerprints.clear();
    this.recentArticles = [];
  }

  public getStats() {
    return {
      canonicalUrlsCount: this.canonicalUrls.size,
      secKeysCount: this.secKeys.size,
      fingerprintsCount: this.fingerprints.size,
      recentArticlesCount: this.recentArticles.length,
    };
  }
}
