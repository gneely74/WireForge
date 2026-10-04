/**
 * @fileoverview Unit tests for TreeNewsService.
 * Validates headline parsing, categorization, ticker extraction, sentiment analysis,
 * and integration with NewsAggregator deduplication.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { TreeNewsService, TreeNewsRawItem } from "../src/services/tree-news-service.js";
import { globalNewsAggregator } from "../src/services/news-aggregator.js";

describe("TreeNewsService Normalization & Ingestion", () => {
  let service: TreeNewsService;

  beforeEach(() => {
    // Instantiate with autoStart = false to avoid live socket connections during unit tests
    service = new TreeNewsService(false);
  });

  afterEach(() => {
    service.stop();
  });

  it("normalizes and classifies Federal Reserve government releases", () => {
    const raw: TreeNewsRawItem = {
      _id: "test-fed-001",
      source: "usGov",
      sourceName: "FEDERAL RESERVE",
      title: "FEDERAL RESERVE: Federal Reserve Board announces approval of application by Fleur Capital Corporation",
      url: "https://www.federalreserve.gov/newsevents/pressreleases/orders20261002a.htm",
      time: 1790973912547,
    };

    const article = service.processRawItem(raw);
    expect(article).not.toBeNull();
    if (!article) return;

    expect(article.category).toBe("macro");
    expect(article.impact).toBe("high");
    expect(article.source).toBe("FEDERAL RESERVE");
    expect(article.tickers).toContain("FED");
    expect(article.tickers).toContain("MACRO");
    expect(article.url).toBe(raw.url);
  });

  it("normalizes and classifies SEC regulatory orders", () => {
    const raw: TreeNewsRawItem = {
      _id: "test-sec-002",
      source: "usGov",
      sourceName: "SEC",
      title: "SEC: Order Granting Approval of a Proposed Rule Change to List and Trade Shares of the 3x Gold ETF",
      url: "https://www.sec.gov/files/rules/sro/cboebzx/2026/34-106577.pdf",
      time: 1790972000000,
      suggestions: [
        {
          coin: "BTC",
          symbols: [{ exchange: "binance-futures", symbol: "BTCUSDT" }],
        },
      ],
    };

    const article = service.processRawItem(raw);
    expect(article).not.toBeNull();
    if (!article) return;

    expect(article.category).toBe("sec");
    expect(article.impact).toBe("high");
    expect(article.source).toBe("SEC");
    expect(article.tickers).toContain("SEC");
    expect(article.tickers).toContain("BTC");
  });

  it("extracts equities tickers and determines bullish sentiment for market beats", () => {
    const raw: TreeNewsRawItem = {
      _id: "test-wsj-003",
      source: "Blogs",
      sourceName: "WSJ",
      title: "WSJ: $NVDA surges 8% after quarterly profit beats estimates and raises guidance",
      url: "https://www.wsj.com/tech/nvidia-earnings-beat",
      time: 1790980000000,
    };

    const article = service.processRawItem(raw);
    expect(article).not.toBeNull();
    if (!article) return;

    expect(article.category).toBe("earnings");
    expect(article.sentiment).toBe("bullish");
    expect(article.tickers).toContain("NVDA");
    expect(article.source).toBe("WSJ");
  });

  it("flags bearish sentiment and marks clinical trial failures as fda category", () => {
    const raw: TreeNewsRawItem = {
      _id: "test-fda-004",
      source: "Blogs",
      sourceName: "REUTERS",
      title: "REUTERS: Biotech developer plunges 45% after FDA clinical trial fails primary endpoint",
      url: "https://www.reuters.com/business/healthcare/biotech-trial-failure",
      time: 1790985000000,
    };

    const article = service.processRawItem(raw);
    expect(article).not.toBeNull();
    if (!article) return;

    expect(article.category).toBe("fda");
    expect(article.sentiment).toBe("bearish");
    expect(article.source).toBe("REUTERS");
  });

  it("handles high-impact social posts from market-moving figures", () => {
    const raw: TreeNewsRawItem = {
      _id: "test-social-005",
      source: "Twitter",
      title: "Donald J. Trump (@realDonaldTrump): Announcing immediate emergency tariff exemptions for domestic steel manufacturers",
      url: "https://x.com/realDonaldTrump/status/123456789",
      time: 1790990000000,
      info: {
        twitterId: "123456789",
        isReply: false,
      },
    };

    const article = service.processRawItem(raw);
    expect(article).not.toBeNull();
    if (!article) return;

    expect(article.impact).toBe("high");
    expect(article.category).toBe("macro");
  });

  it("rejects duplicates when identical article is re-submitted", () => {
    const raw: TreeNewsRawItem = {
      _id: "test-dedup-006",
      source: "Blogs",
      sourceName: "BLOOMBERG",
      title: "BLOOMBERG: Treasury yields tumble as inflation prints below target",
      url: "https://www.bloomberg.com/news/treasury-yields-tumble",
      time: 1790995000000,
    };

    const first = service.processRawItem(raw);
    expect(first).not.toBeNull();

    // Second ingestion of same title & url should be detected as duplicate
    const second = service.processRawItem(raw);
    expect(second).toBeNull();
  });

  it("provides observable status diagnostics", () => {
    const status = service.getStatus();
    expect(status).toHaveProperty("status");
    expect(status).toHaveProperty("messagesReceived");
    expect(status).toHaveProperty("articlesIngested");
    expect(status).toHaveProperty("reconnectAttempts");
  });
});
