import React, { useEffect } from "react";
import { Header } from "./components/Header.js";
import { NewsWire } from "./components/NewsWire.js";
import { OptionsFlow } from "./components/OptionsFlow.js";
import { SignalsScanner } from "./components/SignalsScanner.js";
import { CorporateCalendar } from "./components/CorporateCalendar.js";
import { AudioSquawk } from "./components/AudioSquawk.js";
import { MiniChartModal } from "./components/MiniChartModal.js";
import { ArticleModal } from "./components/ArticleModal.js";
import { useWireWebSocket } from "./hooks/useWireWebSocket.js";
import { useWireForgeStore } from "./store/wireforge-store.js";

export const App: React.FC = () => {
  const { isConnected } = useWireWebSocket();
  const {
    activeTab,
    setNewsArticles,
    setFlowTrades,
    setSignals,
    setEcosystemHealth,
    setWatchlists,
  } = useWireForgeStore();

  // Cross-Window BroadcastChannel sync with ChartForge
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("chartforge_symbol_sync");

    channel.onmessage = (event) => {
      const sym = (event.data?.ticker || event.data?.symbol)?.toUpperCase();
      if (sym) {
        // Update selected ticker state without re-broadcasting
        useWireForgeStore.setState({ selectedTicker: sym });
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Initial Data Bootstrap
  useEffect(() => {
    // 0. Fetch Shared Watchlists
    fetch("/v1/watchlists")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setWatchlists(data.data);
      })
      .catch((err) => console.error("Failed to load initial watchlists:", err));

    // 1. Fetch News
    fetch("/v1/news")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setNewsArticles(data.data);
      })
      .catch((err) => console.error("Failed to load initial news:", err));

    // 2. Fetch Options Flow
    fetch("/v1/flow")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setFlowTrades(data.data);
      })
      .catch((err) => console.error("Failed to load initial flow:", err));

    // 3. Fetch Signals
    fetch("/v1/signals")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setSignals(data.data);
      })
      .catch((err) => console.error("Failed to load initial signals:", err));

    // 4. Fetch Ecosystem Status
    fetch("/v1/ecosystem/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setEcosystemHealth(data.data);
      })
      .catch((err) => console.error("Failed to load ecosystem health:", err));

    // Periodic ecosystem refresh
    const timer = setInterval(() => {
      fetch("/v1/ecosystem/status")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setEcosystemHealth(data.data);
        })
        .catch(() => {});
    }, 15000);

    return () => clearInterval(timer);
  }, [setWatchlists, setNewsArticles, setFlowTrades, setSignals, setEcosystemHealth]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0a0d14] text-[#d1d4dc] overflow-hidden">
      {/* Top Main Navigation & Regime Ribbon */}
      <Header isConnected={isConnected} />

      {/* Main Terminal Body */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === "split" && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden">
            <NewsWire />
            <OptionsFlow />
          </div>
        )}

        {activeTab === "news" && (
          <div className="flex-1 h-full overflow-hidden">
            <NewsWire />
          </div>
        )}

        {activeTab === "flow" && (
          <div className="flex-1 h-full overflow-hidden">
            <OptionsFlow />
          </div>
        )}

        {activeTab === "signals" && (
          <div className="flex-1 h-full overflow-hidden">
            <SignalsScanner />
          </div>
        )}

        {activeTab === "calendars" && (
          <div className="flex-1 h-full overflow-hidden">
            <CorporateCalendar />
          </div>
        )}
      </main>

      {/* Modals and Overlays */}
      <AudioSquawk />
      <MiniChartModal />
      <ArticleModal />
    </div>
  );
};
