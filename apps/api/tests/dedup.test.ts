import { describe, expect, it, beforeEach } from "vitest";
import {
  NewsDeduplicator,
  getCanonicalUrl,
  getSecAccessionKey,
  normalizeHeadline,
  tokenizeHeadline,
  calculateJaccardSimilarity,
} from "../src/services/news-dedup.js";

describe("Tier 1: Canonical URL & SEC Accession Key", () => {
  it("strips analytics and tracking query parameters", () => {
    const raw = "https://www.reuters.com/markets/stocks/nvda-surge-2026?utm_source=feed&utm_medium=rss&oc=5&ref=homepage";
    expect(getCanonicalUrl(raw)).toBe("https://www.reuters.com/markets/stocks/nvda-surge-2026");
  });

  it("removes trailing slashes and hash fragments", () => {
    const raw = "https://finance.yahoo.com/news/apple-ai-launch/#section-comments";
    expect(getCanonicalUrl(raw)).toBe("https://finance.yahoo.com/news/apple-ai-launch");
  });

  it("extracts dashed SEC Accession Numbers from direct and interactive URLs", () => {
    const url1 = "https://www.sec.gov/Archives/edgar/data/320193/0000320193-26-000105/aapl-8k.htm";
    expect(getSecAccessionKey(url1)).toBe("sec:0000320193-26-000105");

    const url2 = "https://www.sec.gov/ix?doc=/Archives/edgar/data/320193/000032019326000105/aapl-8k.htm";
    expect(getSecAccessionKey(url2)).toBe("sec:0000320193-26-000105");
  });
});

describe("Tier 2: Headline Normalization & Fingerprinting", () => {
  it("strips known trailing publisher attributions", () => {
    expect(normalizeHeadline("NVIDIA unveils Rubin GPU architecture - Reuters")).toBe(
      "nvidia unveils rubin gpu architecture"
    );
    expect(normalizeHeadline("Tesla Q3 deliveries hit record | Bloomberg")).toBe(
      "tesla q3 deliveries hit record"
    );
    expect(normalizeHeadline("Apple signs $12B cloud infrastructure agreement - CNBC")).toBe(
      "apple signs 12b cloud infrastructure agreement"
    );
  });

  it("strips SEC filing prefixes and boilerplate", () => {
    expect(normalizeHeadline("SEC Form 8-K: Lennar Corp (0000059281) (Filer)")).toBe(
      "lennar corp"
    );
    expect(normalizeHeadline("8-K - Super Micro Computer, Inc.")).toBe(
      "super micro computer inc"
    );
  });

  it("cleans HTML entities and ticker symbols", () => {
    expect(normalizeHeadline("$NVDA &amp; $MSFT announce strategic AI partnership")).toBe(
      "nvda msft announce strategic ai partnership"
    );
  });
});

describe("Tier 3: Fuzzy Token Similarity & Stemming", () => {
  it("stems common English plurals and verbal forms", () => {
    const tokens1 = tokenizeHeadline("Tesla delivers 462,000 vehicles in Q3");
    const tokens2 = tokenizeHeadline("Tesla deliveries hit 462,000 in Q3");

    // Both should contain 'tesla', '462000', 'q3', and deliver/delivery stem
    expect(tokens1.has("tesla")).toBe(true);
    expect(tokens2.has("tesla")).toBe(true);
    expect(tokens1.has("462000")).toBe(true);
    expect(tokens2.has("462000")).toBe(true);

    const sim = calculateJaccardSimilarity(tokens1, tokens2);
    expect(sim).toBeGreaterThanOrEqual(0.5);
  });

  it("calculates accurate Jaccard similarity between distinct headlines", () => {
    const setA = new Set(["apple", "announc", "m4", "ipad"]);
    const setB = new Set(["apple", "announc", "iphone", "event"]);
    // Intersection: apple, announc (2). Union: 6.
    expect(calculateJaccardSimilarity(setA, setB)).toBeCloseTo(2 / 6, 2);
  });
});

describe("NewsDeduplicator Engine Integration", () => {
  let dedup: NewsDeduplicator;

  beforeEach(() => {
    dedup = new NewsDeduplicator();
  });

  it("Tier 1: detects duplicate canonical URLs with different tracking params", () => {
    const res1 = dedup.checkAndTrack({
      id: "art-1",
      title: "Broadcom beats Q3 semiconductor revenue expectations",
      url: "https://bloomberg.com/news/broadcom-q3?utm_source=twitter",
      tickers: ["AVGO"],
    });
    expect(res1.isDuplicate).toBe(false);

    const res2 = dedup.checkAndTrack({
      id: "art-2",
      title: "Broadcom beats Q3 semiconductor revenue expectations",
      url: "https://bloomberg.com/news/broadcom-q3?utm_source=newsletter&oc=5",
      tickers: ["AVGO"],
    });
    expect(res2.isDuplicate).toBe(true);
    expect(res2.tier).toBe(1);
    expect(res2.reason).toBe("canonical_url");
  });

  it("Tier 1: detects identical SEC accession numbers under different paths", () => {
    const res1 = dedup.checkAndTrack({
      id: "sec-1",
      title: "SEC Form 8-K: Lennar Corp",
      url: "https://www.sec.gov/Archives/edgar/data/59281/000005928126000042/len-8k.htm",
      tickers: ["LEN"],
    });
    expect(res1.isDuplicate).toBe(false);

    const res2 = dedup.checkAndTrack({
      id: "sec-2",
      title: "SEC Form 8-K: Lennar Corp Item 2.02",
      url: "https://www.sec.gov/ix?doc=/Archives/edgar/data/59281/0000059281-26-000042/len-8k.htm",
      tickers: ["LEN"],
    });
    expect(res2.isDuplicate).toBe(true);
    expect(res2.tier).toBe(1);
    expect(res2.reason).toBe("sec_accession");
  });

  it("Tier 2: detects syndicated headlines with different publisher suffixes", () => {
    const res1 = dedup.checkAndTrack({
      id: "wire-1",
      title: "NVIDIA accelerates high-volume production of Rubin architecture - Reuters",
      url: "https://reuters.com/nvda-1",
      tickers: ["NVDA"],
    });
    expect(res1.isDuplicate).toBe(false);

    const res2 = dedup.checkAndTrack({
      id: "wire-2",
      title: "NVIDIA Accelerates High-Volume Production of Rubin Architecture | Bloomberg",
      url: "https://bloomberg.com/nvda-different-url",
      tickers: ["NVDA"],
    });
    expect(res2.isDuplicate).toBe(true);
    expect(res2.tier).toBe(2);
    expect(res2.reason).toBe("headline_fingerprint");
  });

  it("Tier 3: detects paraphrased near-duplicates sharing a company ticker", () => {
    const res1 = dedup.checkAndTrack({
      id: "tsla-1",
      title: "Tesla delivers 462,000 vehicles in Q3, beating Wall Street estimates",
      url: "https://cnbc.com/tsla-deliveries",
      tickers: ["TSLA"],
    });
    expect(res1.isDuplicate).toBe(false);

    const res2 = dedup.checkAndTrack({
      id: "tsla-2",
      title: "Tesla Q3 deliveries hit 462,000, topping consensus analyst estimates - Reuters",
      url: "https://reuters.com/tsla-q3",
      tickers: ["TSLA"],
    });
    expect(res2.isDuplicate).toBe(true);
    expect(res2.tier).toBe(3);
    expect(res2.reason).toBe("fuzzy_token_similarity");
  });

  it("Does NOT dedupe distinct stories for the same company", () => {
    const res1 = dedup.checkAndTrack({
      id: "aapl-1",
      title: "Apple reports quarterly services revenue of $24.2 billion",
      url: "https://wire.com/aapl-earnings",
      tickers: ["AAPL"],
    });
    expect(res1.isDuplicate).toBe(false);

    const res2 = dedup.checkAndTrack({
      id: "aapl-2",
      title: "Apple announces major hardware event in Cupertino for new Mac models",
      url: "https://wire.com/aapl-event",
      tickers: ["AAPL"],
    });
    expect(res2.isDuplicate).toBe(false);
  });

  it("Does NOT dedupe similar headlines across different companies", () => {
    const res1 = dedup.checkAndTrack({
      id: "nvda-split",
      title: "NVIDIA announces 10-for-1 forward stock split",
      url: "https://wire.com/nvda-split",
      tickers: ["NVDA"],
    });
    expect(res1.isDuplicate).toBe(false);

    const res2 = dedup.checkAndTrack({
      id: "tsla-split",
      title: "Tesla announces 3-for-1 forward stock split",
      url: "https://wire.com/tsla-split",
      tickers: ["TSLA"],
    });
    expect(res2.isDuplicate).toBe(false);
  });
});
