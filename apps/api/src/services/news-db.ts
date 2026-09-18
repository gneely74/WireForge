/**
 * @fileoverview SQLite persistence layer for authentic news articles.
 * Utilizes Node 22 native DatabaseSync in WAL mode to guarantee zero-loss
 * storage and instant cold-boot pre-warming of the WireForge News Wire.
 *
 * Upstream Sources:
 *  - Google News Financial RSS feeds (news-aggregator.ts)
 *  - SEC EDGAR Atom filing feeds (news-aggregator.ts)
 *  - StockTwits trending and symbol streams (stocktwits-service.ts)
 * Downstream Consumers:
 *  - NewsAggregator (news-aggregator.ts) for instant memory hydration
 *  - REST API /v1/news (routes/news.ts)
 */

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { NewsArticle, NewsCategory, NewsImpact, Sentiment } from "@wireforge/shared";

/**
 * Filter and query options for retrieving persisted news articles.
 */
export interface NewsQueryParams {
  /** Filter by primary news category */
  category?: NewsCategory;
  /** Filter by single associated ticker */
  ticker?: string;
  /** Filter by watchlist of tickers */
  watchlistSymbols?: string[];
  /** Maximum number of records to return (defaults to 250) */
  limit?: number;
}

/**
 * Manages persistent storage, indexing, and retrieval of authentic news articles
 * using SQLite in WAL mode.
 */
export class NewsDb {
  private db: DatabaseSync;
  private insertStmt: ReturnType<DatabaseSync["prepare"]>;
  private existsStmt: ReturnType<DatabaseSync["prepare"]>;

  /**
   * Initializes the NewsDb database instance and ensures required schema and indexes exist.
   *
   * @param {string} [dbFilePath] - Optional explicit database file path (e.g. for testing).
   */
  constructor(dbFilePath?: string) {
    const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
    const defaultPath =
      process.env.NEWS_DB_PATH ||
      (isTest ? ":memory:" : path.resolve(process.cwd(), "data/news.db"));
    const resolvedPath = dbFilePath || defaultPath;

    if (resolvedPath !== ":memory:") {
      const dir = path.dirname(resolvedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.db = new DatabaseSync(resolvedPath);
    if (resolvedPath !== ":memory:") {
      try {
        this.db.exec("PRAGMA journal_mode = WAL;");
        this.db.exec("PRAGMA busy_timeout = 5000;");
      } catch {
        // Suppress pragma errors in constrained environments
      }
    }

    this.initSchema();

    this.insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO news (
        id, title, summary, content, tickers, category,
        impact, sentiment, source, url, is_squawked,
        timestamp, iso_time
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    this.existsStmt = this.db.prepare(`
      SELECT 1 FROM news WHERE url = ? OR (title = ? AND timestamp > ?) LIMIT 1
    `);
  }

  /**
   * Creates the news schema and performance indexes if they do not exist.
   */
  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        tickers TEXT NOT NULL,
        category TEXT NOT NULL,
        impact TEXT NOT NULL,
        sentiment TEXT NOT NULL,
        source TEXT NOT NULL,
        url TEXT NOT NULL,
        is_squawked INTEGER NOT NULL DEFAULT 0,
        timestamp INTEGER NOT NULL,
        iso_time TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_news_timestamp ON news (timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_news_category ON news (category, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_news_url ON news (url);
    `);
  }

  /**
   * Persists a single authentic news article into SQLite.
   *
   * @param {NewsArticle} article - The article to persist.
   * @returns {boolean} True if a new row was inserted; false if ignored as duplicate.
   */
  public saveArticle(article: NewsArticle): boolean {
    try {
      const result = this.insertStmt.run(
        article.id,
        article.title || "",
        article.summary || "",
        article.content || article.summary || "",
        JSON.stringify(article.tickers || []),
        article.category || "general",
        article.impact || "medium",
        article.sentiment || "neutral",
        article.source || "NewsWire",
        article.url || "",
        article.isSquawked ? 1 : 0,
        article.timestamp || Date.now(),
        article.isoTime || new Date().toISOString()
      ) as { changes?: number };

      return (result?.changes ?? 0) > 0;
    } catch (err) {
      console.error("[NewsDb] Failed to save article:", err);
      return false;
    }
  }

  /**
   * Persists a batch of authentic news articles in a single database transaction.
   *
   * @param {NewsArticle[]} articles - Array of articles to persist.
   * @returns {number} The count of newly inserted unique articles.
   */
  public saveBatch(articles: NewsArticle[]): number {
    if (!articles.length) return 0;
    let inserted = 0;
    this.db.exec("BEGIN TRANSACTION;");
    try {
      for (const a of articles) {
        const res = this.insertStmt.run(
          a.id,
          a.title || "",
          a.summary || "",
          a.content || a.summary || "",
          JSON.stringify(a.tickers || []),
          a.category || "general",
          a.impact || "medium",
          a.sentiment || "neutral",
          a.source || "NewsWire",
          a.url || "",
          a.isSquawked ? 1 : 0,
          a.timestamp || Date.now(),
          a.isoTime || new Date().toISOString()
        ) as { changes?: number };
        if ((res?.changes ?? 0) > 0) inserted++;
      }
      this.db.exec("COMMIT;");
    } catch (err) {
      this.db.exec("ROLLBACK;");
      console.error("[NewsDb] Failed to commit batch:", err);
    }
    return inserted;
  }

  /**
   * Checks whether an article with the matching URL or recent title already exists.
   *
   * @param {string} url - Target URL.
   * @param {string} title - Target Title.
   * @param {number} [maxAgeMs=86400000] - Lookback window for identical title check (default 24h).
   * @returns {boolean} True if article already exists.
   */
  public hasArticle(url: string, title: string, maxAgeMs = 86400000): boolean {
    try {
      const since = Date.now() - maxAgeMs;
      const row = this.existsStmt.get(url, title, since);
      return Boolean(row);
    } catch {
      return false;
    }
  }

  /**
   * Retrieves the most recent authentic news articles ordered chronologically (newest first).
   *
   * @param {number} [limit=250] - Number of records to return.
   * @param {NewsQueryParams} [params] - Optional category or ticker filtering.
   * @returns {NewsArticle[]} Array of hydrated NewsArticle records.
   */
  public getRecentArticles(limit = 250, params?: NewsQueryParams): NewsArticle[] {
    try {
      let query = "SELECT * FROM news";
      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (params?.category && params.category !== "all") {
        conditions.push("category = ?");
        values.push(params.category);
      }

      if (params?.ticker) {
        conditions.push("tickers LIKE ?");
        values.push(`%"${params.ticker.toUpperCase()}"%`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY timestamp DESC LIMIT ?";
      values.push(limit);

      const stmt = this.db.prepare(query);
      const rows = stmt.all(...values) as Array<{
        id: string;
        title: string;
        summary: string;
        content: string;
        tickers: string;
        category: NewsCategory;
        impact: NewsImpact;
        sentiment: Sentiment;
        source: string;
        url: string;
        is_squawked: number;
        timestamp: number;
        iso_time: string;
      }>;

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        content: row.content,
        tickers: this.safeParseJson(row.tickers, []),
        category: row.category,
        impact: row.impact,
        sentiment: row.sentiment,
        source: row.source,
        url: row.url,
        isSquawked: Boolean(row.is_squawked),
        timestamp: row.timestamp,
        isoTime: row.iso_time,
      }));
    } catch (err) {
      console.error("[NewsDb] Failed to get recent articles:", err);
      return [];
    }
  }

  /**
   * Safely parses JSON string array without throwing errors.
   */
  private safeParseJson<T>(raw: string, fallback: T): T {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  /**
   * Closes SQLite database connection cleanly.
   */
  public close(): void {
    try {
      this.db.close();
    } catch {
      // Suppress close errors
    }
  }
}

/**
 * Singleton instance of NewsDb for application-wide persistence.
 */
export const globalNewsDb = new NewsDb();
