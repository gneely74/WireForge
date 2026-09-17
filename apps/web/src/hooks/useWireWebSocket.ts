import { useEffect, useRef, useState } from "react";
import { useWireForgeStore } from "../store/wireforge-store.js";

/**
 * React hook that manages the real-time WebSocket connection to the WireForge server (/v1/stream).
 * Ingests live streaming events including news articles, unusual options flow prints,
 * market signals, audio squawk announcements, and synchronized watchlists.
 *
 * Upstream Source: `/v1/stream` WebSocket broadcast from API server.
 * Downstream Sink: WireForge Zustand store (`prependNewsArticle`, `prependFlowTrade`, `prependSignal`, `pushSquawkMessage`, `setWatchlists`).
 *
 * @returns {{ isConnected: boolean }} Object containing current live connection state.
 */
export function useWireWebSocket(): { isConnected: boolean } {
  const {
    prependNewsArticle,
    prependFlowTrade,
    prependSignal,
    pushSquawkMessage,
    setWatchlists,
  } = useWireForgeStore();

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/v1/stream`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "watchlists" && Array.isArray(msg.data)) {
              setWatchlists(msg.data);
            } else if (msg.type === "news" && msg.data) {
              prependNewsArticle(msg.data);
            } else if (msg.type === "flow" && msg.data) {
              prependFlowTrade(msg.data);
            } else if (msg.type === "signal" && msg.data) {
              prependSignal(msg.data);
            } else if (msg.type === "squawk" && msg.data) {
              pushSquawkMessage(msg.data);
            }
          } catch (err) {
            console.error("[WireWebSocket] parse error:", err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error("[WireWebSocket] connection failure:", err);
        reconnectTimeoutRef.current = setTimeout(connect, 4000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [prependNewsArticle, prependFlowTrade, prependSignal, pushSquawkMessage, setWatchlists]);

  return { isConnected };
}
