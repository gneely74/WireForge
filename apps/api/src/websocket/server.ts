import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import { globalNewsAggregator } from "../services/news-aggregator.js";
import { globalOptionsScanner } from "../services/options-scanner.js";
import { globalSignalsMonitor } from "../services/signals-monitor.js";
import { NewsArticle, OptionsFlowTrade, MarketSignal, SquawkMessage } from "@wireforge/shared";

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/v1/stream" });

  const clients = new Set<WebSocket>();

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);

    // Initial greeting
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "Connected to WireForge Real-Time Stream",
        timestamp: Date.now(),
      })
    );

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("error", (err) => {
      console.error("[WebSocket] client error:", err);
      clients.delete(ws);
    });
  });

  const broadcast = (payload: any) => {
    const raw = JSON.stringify(payload);
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
      }
    }
  };

  // Wire event listeners to broadcast
  globalNewsAggregator.onNewArticle((article: NewsArticle) => {
    broadcast({ type: "news", data: article });

    // If high-impact, also broadcast to squawk channel and emit real market signal
    if (article.impact === "high") {
      const squawkMsg: SquawkMessage = {
        id: `squawk-${article.id}`,
        text: `${article.tickers.length > 0 ? article.tickers.join(", ") + ": " : ""}${article.title}`,
        priority: 1,
        category: article.category,
        timestamp: Date.now(),
        ticker: article.tickers[0],
      };
      broadcast({ type: "squawk", data: squawkMsg });

      if (article.tickers.length > 0 && article.tickers[0] !== "MARKET" && article.tickers[0] !== "SEC") {
        globalSignalsMonitor.addSignal({
          ticker: article.tickers[0],
          type: article.category === "sec" ? "vwap_cross" : "price_spike",
          title: article.title,
          description: article.summary,
          metric: article.category.toUpperCase(),
          sentiment: article.sentiment,
        });
      }
    }
  });

  globalOptionsScanner.onNewTrade((trade: OptionsFlowTrade) => {
    broadcast({ type: "flow", data: trade });

    // If golden sweep or premium >= $500k, emit authentic market signal
    if (trade.isGolden || trade.premium >= 500000) {
      globalSignalsMonitor.addSignal({
        ticker: trade.ticker,
        type: "rvol_spike",
        title: trade.isGolden ? "Institutional Golden Sweep" : "Institutional Block Alert",
        description: `${trade.contractType} $${trade.strike} exp ${trade.expiration} (${trade.orderType.toUpperCase()})`,
        metric: `$${(trade.premium / 1000).toFixed(0)}k`,
        sentiment: trade.sentiment,
      });
    }

    // If golden sweep or premium >= $750k, squawk it!
    if (trade.isGolden || trade.premium >= 750000) {
      const squawkMsg: SquawkMessage = {
        id: `squawk-${trade.id}`,
        text: `Unusual Flow Alert: ${trade.ticker} ${trade.strike} ${trade.contractType} ${trade.orderType.toUpperCase()} of $${(trade.premium / 1000).toFixed(0)} thousand dollars.`,
        priority: 2,
        category: "flow",
        timestamp: Date.now(),
        ticker: trade.ticker,
      };
      broadcast({ type: "squawk", data: squawkMsg });
    }
  });

  globalSignalsMonitor.onNewSignal((signal: MarketSignal) => {
    broadcast({ type: "signal", data: signal });

    // If LULD halt, broadcast to squawk immediately
    if (signal.type === "luld_halt") {
      const squawkMsg: SquawkMessage = {
        id: `squawk-${signal.id}`,
        text: `Market Halt: ${signal.ticker} has been halted for volatility under LULD circuit breaker.`,
        priority: 1,
        category: "halt",
        timestamp: Date.now(),
        ticker: signal.ticker,
      };
      broadcast({ type: "squawk", data: squawkMsg });
    }
  });

  return wss;
}
