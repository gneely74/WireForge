import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { OptionsFlowTrade, OptionOrderType, OptionSide, Sentiment } from "@wireforge/shared";

export interface FlowQueryParams {
  ticker?: string;
  watchlistSymbols?: string[];
  minPremium?: number;
  sentiment?: Sentiment;
  orderType?: OptionOrderType;
  isGolden?: boolean;
  date?: string;
  offset?: number;
  limit?: number;
}

export interface FlowStatsResult {
  totalTrades: number;
  bullishPremium: number;
  bearishPremium: number;
  totalPremium: number;
  bullishRatio: number;
  goldenCount: number;
}

export class OptionsDb {
  private db: DatabaseSync;
  private insertStmt: ReturnType<DatabaseSync["prepare"]>;

  constructor(dbFilePath?: string) {
    const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
    const defaultPath = process.env.FLOW_DB_PATH || (isTest ? ":memory:" : path.resolve(process.cwd(), "data/options_flow.db"));
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
      } catch {}
    }

    this.initSchema();
    this.insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO options_flow (
        id, ticker, expiration, strike, contract_type, spot_price,
        trade_price, size, open_interest, volume, premium,
        order_type, side, sentiment, is_golden, dte, exchange,
        timestamp, time_str, trade_date
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS options_flow (
        id TEXT PRIMARY KEY,
        ticker TEXT NOT NULL,
        expiration TEXT NOT NULL,
        strike REAL NOT NULL,
        contract_type TEXT NOT NULL,
        spot_price REAL NOT NULL,
        trade_price REAL NOT NULL,
        size INTEGER NOT NULL,
        open_interest INTEGER NOT NULL,
        volume INTEGER NOT NULL,
        premium INTEGER NOT NULL,
        order_type TEXT NOT NULL,
        side TEXT NOT NULL,
        sentiment TEXT NOT NULL,
        is_golden INTEGER NOT NULL,
        dte INTEGER NOT NULL,
        exchange TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        time_str TEXT NOT NULL,
        trade_date TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_flow_time ON options_flow (timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_flow_ticker ON options_flow (ticker, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_flow_premium ON options_flow (premium DESC);
      CREATE INDEX IF NOT EXISTS idx_flow_date ON options_flow (trade_date, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_flow_sentiment ON options_flow (sentiment, timestamp DESC);
    `);
  }

  /**
   * Inserts an options trade into SQLite options_flow table.
   * Tolerates missing/undefined fields by safely normalizing values.
   *
   * @param trade Trade to insert
   * @returns true if inserted, false otherwise
   */
  insertTrade(trade: OptionsFlowTrade | any): boolean {
    try {
      const timestamp = Number(trade.timestamp) || Date.now();
      const tradeDate = new Date(timestamp).toISOString().slice(0, 10);
      const expiration = String(trade.expiration || trade.expiry || tradeDate);
      const contractType = String(trade.contractType || trade.callPut || "CALL").toUpperCase();
      const orderType = String(trade.orderType || "sweep");
      const side = String(trade.side || "mid");
      const sentiment = String(trade.sentiment || "neutral");
      const spotPrice = Number(trade.spotPrice) || Number(trade.strike) || 0;
      const tradePrice = Number(trade.tradePrice) || 0;
      const size = Number(trade.size) || 0;
      const openInterest = Number(trade.openInterest) || 0;
      const volume = Number(trade.volume) || 0;
      const premium = Number(trade.premium) || 0;
      const isGolden = trade.isGolden ? 1 : 0;
      const dte = Number(trade.dte) || 0;
      const exchange = String(trade.exchange || "OPRA");
      const timeStr = String(trade.timeStr || new Date(timestamp).toLocaleTimeString("en-US", { hour12: false }));
      const id = String(trade.id || `flow-${timestamp}-${Math.random().toString(36).slice(2, 6)}`);
      const ticker = String(trade.ticker || "UNKNOWN").toUpperCase();
      const strike = Number(trade.strike) || 0;

      this.insertStmt.run(
        id,
        ticker,
        expiration,
        strike,
        contractType,
        spotPrice,
        tradePrice,
        size,
        openInterest,
        volume,
        premium,
        orderType,
        side,
        sentiment,
        isGolden,
        dte,
        exchange,
        timestamp,
        timeStr,
        tradeDate
      );
      return true;
    } catch (err) {
      console.error("[OptionsDb] insert error:", err);
      return false;
    }
  }

  queryTrades(params: FlowQueryParams): { trades: OptionsFlowTrade[]; total: number } {
    const whereClauses: string[] = [];
    const values: any[] = [];

    if (params.ticker) {
      whereClauses.push("ticker = ?");
      values.push(params.ticker.toUpperCase());
    }

    if (params.watchlistSymbols && params.watchlistSymbols.length > 0) {
      const placeholders = params.watchlistSymbols.map(() => "?").join(",");
      whereClauses.push(`ticker IN (${placeholders})`);
      values.push(...params.watchlistSymbols.map((s) => s.toUpperCase()));
    }

    if (params.minPremium && params.minPremium > 0) {
      whereClauses.push("premium >= ?");
      values.push(params.minPremium);
    }

    if (params.sentiment && params.sentiment !== "neutral") {
      whereClauses.push("sentiment = ?");
      values.push(params.sentiment);
    }

    if (params.orderType) {
      whereClauses.push("order_type = ?");
      values.push(params.orderType);
    }

    if (params.isGolden !== undefined) {
      whereClauses.push("is_golden = ?");
      values.push(params.isGolden ? 1 : 0);
    }

    if (params.date) {
      whereClauses.push("trade_date = ?");
      values.push(params.date);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Count total matching
    const countQuery = `SELECT COUNT(*) as total FROM options_flow ${whereSql}`;
    const countRow: any = this.db.prepare(countQuery).get(...values);
    const total = countRow ? Number(countRow.total) : 0;

    // Fetch paginated rows
    const limit = Math.min(Math.max(params.limit || 100, 1), 1000);
    const offset = Math.max(params.offset || 0, 0);

    const selectQuery = `
      SELECT * FROM options_flow
      ${whereSql}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const rows: any[] = this.db.prepare(selectQuery).all(...values, limit, offset);

    const trades: OptionsFlowTrade[] = rows.map((r) => ({
      id: r.id,
      ticker: r.ticker,
      expiration: r.expiration,
      strike: Number(r.strike),
      contractType: r.contract_type as "CALL" | "PUT",
      spotPrice: Number(r.spot_price),
      tradePrice: Number(r.trade_price),
      size: Number(r.size),
      openInterest: Number(r.open_interest),
      volume: Number(r.volume),
      premium: Number(r.premium),
      orderType: r.order_type as OptionOrderType,
      side: r.side as OptionSide,
      sentiment: r.sentiment as Sentiment,
      isGolden: Boolean(r.is_golden),
      dte: Number(r.dte),
      exchange: r.exchange,
      timestamp: Number(r.timestamp),
      timeStr: r.time_str,
    }));

    return { trades, total };
  }

  getDailyStats(date?: string, ticker?: string): FlowStatsResult {
    const queryDate = date || new Date().toISOString().slice(0, 10);
    const whereClauses = ["trade_date = ?"];
    const values: any[] = [queryDate];

    if (ticker) {
      whereClauses.push("ticker = ?");
      values.push(ticker.toUpperCase());
    }

    const sql = `
      SELECT
        COUNT(*) as total_trades,
        COALESCE(SUM(CASE WHEN sentiment = 'bullish' THEN premium ELSE 0 END), 0) as bullish_premium,
        COALESCE(SUM(CASE WHEN sentiment = 'bearish' THEN premium ELSE 0 END), 0) as bearish_premium,
        COALESCE(SUM(premium), 0) as total_premium,
        COALESCE(SUM(CASE WHEN is_golden = 1 THEN 1 ELSE 0 END), 0) as golden_count
      FROM options_flow
      WHERE ${whereClauses.join(" AND ")}
    `;

    const row: any = this.db.prepare(sql).get(...values);

    if (!row) {
      return {
        totalTrades: 0,
        bullishPremium: 0,
        bearishPremium: 0,
        totalPremium: 0,
        bullishRatio: 0,
        goldenCount: 0,
      };
    }

    const totalTrades = Number(row.total_trades) || 0;
    const bullishPremium = Number(row.bullish_premium) || 0;
    const bearishPremium = Number(row.bearish_premium) || 0;
    const totalPremium = Number(row.total_premium) || 0;
    const goldenCount = Number(row.golden_count) || 0;

    const sentimentTotal = bullishPremium + bearishPremium;
    const bullishRatio = sentimentTotal > 0 ? (bullishPremium / sentimentTotal) * 100 : 0;

    return {
      totalTrades,
      bullishPremium,
      bearishPremium,
      totalPremium,
      bullishRatio: Number(bullishRatio.toFixed(1)),
      goldenCount,
    };
  }

  pruneOldData(keepDays: number = 14) {
    try {
      const cutoffDate = new Date(Date.now() - keepDays * 86400000).toISOString().slice(0, 10);
      this.db.prepare("DELETE FROM options_flow WHERE trade_date < ?").run(cutoffDate);
    } catch (err) {
      console.error("[OptionsDb] prune error:", err);
    }
  }

  close() {
    try {
      this.db.close();
    } catch {}
  }
}

export const globalOptionsDb = new OptionsDb();
