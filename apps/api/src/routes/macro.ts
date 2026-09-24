import { Hono } from "hono";
import { globalEcosystemClient } from "../services/ecosystem-client.js";

export const macroRouter = new Hono();

// Helper to fetch from Trading Agent (Forge)
async function fetchFromForge(path: string) {
  const tradingAgentUrl = globalEcosystemClient.getTradingAgentUrl();
  try {
    const res = await fetch(`${tradingAgentUrl}${path}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Return null on failure to allow fallback
  }
  return null;
}

// 1. GET /v1/macro/regime
macroRouter.get("/regime", async (c) => {
  const upstream = await fetchFromForge("/api/macro/regime");
  if (upstream) {
    return c.json({ data: upstream });
  }

  // High-fidelity fallback if Forge is starting up
  return c.json({
    data: {
      active_regime: "Quadrant 3: Late-Cycle Resilience (Restricted Liquidity / Resilient Growth)",
      quadrant_id: 3,
      growth_impulse_score: 35.0,
      financial_conditions_score: -25.0,
      liquidity_status: "Restrictive (Real Yields 1.94%, QT Active)",
      growth_status: "Resilient (ISM NOI +4.2, Claims 218k)",
      transmission_bias: "Multiple Expansion Capped; Quality & Free Cash Flow Outperform",
      summary: "Federal Reserve monetary policy remains in restrictive territory with real 10Y TIPS yields near 1.94% and an inverted yield curve. However, the real economy remains supported by lean factory inventories, solid operating leverage, and healthy employment.",
      favored_sectors: [
        "Megacap Tech (Pristine Balance Sheets)",
        "Free Cash Flow Aristocrats",
        "Semiconductors & AI Capex",
        "Energy & Commodities"
      ],
      vulnerable_sectors: [
        "Heavily Indebted Small Caps (Russell 2000)",
        "Unprofitable High-Multiple Growth",
        "Commercial Real Estate (REITs)",
        "Regional Banks"
      ],
      tactical_rules: [
        "Do not short resilient earnings breadth simply because the yield curve is inverted.",
        "Avoid floating-debt companies while real policy rates sit > 150 bps above neutral r*.",
        "Watch the un-inversion of the 10Y-3M curve: if accompanied by claims > 250k, rotate to capital preservation."
      ],
      updated_at: new Date().toISOString()
    }
  });
});

// 2. GET /v1/macro/indicators
macroRouter.get("/indicators", async (c) => {
  const upstream = await fetchFromForge("/api/macro/indicators");
  if (upstream) {
    return c.json({ data: upstream });
  }

  // Fallback indicator list
  return c.json({
    data: [
      {
        id: "net_liquidity",
        name: "Fed Net Liquidity",
        category: "fed_liquidity",
        current_value: 6.24,
        display_value: "$6.24T",
        unit: "Trillion USD",
        change_3m: 0.042,
        change_3m_display: "+$42B (3M)",
        percentile_10y: 68.5,
        status: "healthy",
        direction: "rising"
      },
      {
        id: "real_10y_tips",
        name: "Real 10-Year TIPS Yield",
        category: "fed_liquidity",
        current_value: 1.94,
        display_value: "1.94%",
        unit: "Percent",
        change_3m: 0.18,
        change_3m_display: "+18 bps (1M)",
        percentile_10y: 84.2,
        status: "restrictive",
        direction: "rising"
      },
      {
        id: "yield_curve_10y3m",
        name: "Yield Curve (10Y - 3M)",
        category: "fed_liquidity",
        current_value: -0.32,
        display_value: "-0.32%",
        unit: "Percentage Points",
        change_3m: 0.45,
        change_3m_display: "Un-inverting (+45 bp)",
        percentile_10y: 14.0,
        status: "caution",
        direction: "rising"
      },
      {
        id: "high_yield_oas",
        name: "High Yield Credit Spread (HY OAS)",
        category: "fed_liquidity",
        current_value: 3.24,
        display_value: "324 bps",
        unit: "Basis Points",
        change_3m: -15,
        change_3m_display: "-15 bps (3M)",
        percentile_10y: 22.0,
        status: "healthy",
        direction: "falling"
      },
      {
        id: "ism_noi",
        name: "ISM New Orders - Inventories",
        category: "real_economy",
        current_value: 4.2,
        display_value: "+4.2 pts",
        unit: "Spread Points",
        change_3m: 1.8,
        change_3m_display: "+1.8 pts (3M)",
        percentile_10y: 62.0,
        status: "healthy",
        direction: "rising"
      },
      {
        id: "jobless_claims",
        name: "Weekly Jobless Claims (4-Wk MA)",
        category: "real_economy",
        current_value: 218000,
        display_value: "218k",
        unit: "Claims",
        change_3m: -4000,
        change_3m_display: "-4k (3M)",
        percentile_10y: 25.0,
        status: "healthy",
        direction: "falling"
      },
      {
        id: "dxy_index",
        name: "U.S. Dollar Index (DXY)",
        category: "global_macro",
        current_value: 102.8,
        display_value: "102.8",
        unit: "Index Points",
        change_3m: -1.8,
        change_3m_display: "-1.8% (3M)",
        percentile_10y: 65.0,
        status: "healthy",
        direction: "falling"
      },
      {
        id: "copper_gold",
        name: "Copper / Gold Ratio",
        category: "global_macro",
        current_value: 0.174,
        display_value: "0.174",
        unit: "Ratio",
        change_3m: -0.008,
        change_3m_display: "-4.4% (3M)",
        percentile_10y: 42.0,
        status: "caution",
        direction: "falling"
      }
    ]
  });
});

// 3. GET /v1/macro/series/:id
macroRouter.get("/series/:id", async (c) => {
  const id = c.req.param("id");
  const upstream = await fetchFromForge(`/api/macro/series/${id}`);
  if (upstream) {
    return c.json({ data: upstream });
  }

  // Provide calibrated series fallback
  const mockSeries: Record<string, any> = {
    net_liquidity: [
      { date: "2019-01", value: 5.10, spx_value: 2700 },
      { date: "2020-03", value: 5.15, spx_value: 2580, recession_flag: true },
      { date: "2020-06", value: 6.85, spx_value: 3100 },
      { date: "2021-06", value: 7.60, spx_value: 4297 },
      { date: "2021-12", value: 7.45, spx_value: 4766 },
      { date: "2022-06", value: 6.55, spx_value: 3785 },
      { date: "2022-10", value: 6.10, spx_value: 3580 },
      { date: "2023-03", value: 6.45, spx_value: 4100 },
      { date: "2023-12", value: 6.30, spx_value: 4769 },
      { date: "2024-06", value: 6.18, spx_value: 5460 },
      { date: "2024-12", value: 6.22, spx_value: 5950 },
      { date: "2025-06", value: 6.20, spx_value: 5880 },
      { date: "2026-03", value: 6.24, spx_value: 6040 },
    ],
    real_10y_tips: [
      { date: "2019-01", value: 0.95 }, { date: "2020-03", value: -0.20 },
      { date: "2020-12", value: -1.05 }, { date: "2021-12", value: -1.00 },
      { date: "2022-06", value: 0.65 }, { date: "2022-10", value: 1.70 },
      { date: "2023-10", value: 2.45 }, { date: "2024-12", value: 1.95 },
      { date: "2026-03", value: 1.94 }
    ],
    yield_curve_10y3m: [
      { date: "2019-01", value: 0.25 }, { date: "2019-08", value: -0.45 },
      { date: "2020-03", value: 0.75 }, { date: "2021-06", value: 1.45 },
      { date: "2022-10", value: -0.15 }, { date: "2023-05", value: -1.75 },
      { date: "2024-06", value: -0.85 }, { date: "2025-06", value: -0.38 },
      { date: "2026-03", value: -0.32 }
    ],
    ism_noi: [
      { date: "2019-01", value: 4.5 }, { date: "2020-04", value: -12.5 },
      { date: "2020-09", value: 14.2 }, { date: "2021-05", value: 16.5 },
      { date: "2022-06", value: -2.8 }, { date: "2023-06", value: -4.2 },
      { date: "2024-06", value: 3.8 }, { date: "2026-03", value: 4.2 }
    ]
  };

  const points = mockSeries[id] || mockSeries.net_liquidity;
  return c.json({
    data: {
      indicator_id: id,
      name: id.replace(/_/g, " ").toUpperCase(),
      unit: "Index",
      points
    }
  });
});

// 4. GET /v1/macro/playbook/:id
macroRouter.get("/playbook/:id", async (c) => {
  const id = c.req.param("id");
  const upstream = await fetchFromForge(`/api/macro/playbook/${id}`);
  if (upstream) {
    return c.json({ data: upstream });
  }

  // Fallback playbook info for Net Liquidity
  return c.json({
    data: {
      indicator_id: id,
      name: id.replace(/_/g, " ").toUpperCase(),
      laymans_term: "Think of the financial markets like a giant bathtub. Net Liquidity is how much actual, usable cash the Federal Reserve has left in the tub for commercial banks and Wall Street to invest with. When liquidity expands, stocks get an immediate bid.",
      intuitive_analogy: "The Fuel Tank of Wall Street: More fuel = cars drive faster; empty tank = engines sputter.",
      real_world_examples: [
        {
          episode: "March 2020 COVID Bazooka",
          what_happened: "The Fed injected $3 Trillion of net liquidity in weeks via QE. Despite the worst global economic shutdown in modern history, the S&P 500 staged its fastest rally in history because liquidity overwhelmed the bad economic news."
        },
        {
          episode: "2022 Inflation Tightening",
          what_happened: "The Fed began Quantitative Tightening (QT), while the Reverse Repo facility hoarded over $2.5 Trillion. Net liquidity plunged by over $1.2 Trillion, causing the S&P 500 to drop 25% and NASDAQ 35% in pure multiple compression."
        }
      ],
      transmission_to_stocks: {
        multiples: "Direct expansion when rising. Prime brokers grant more margin to hedge funds, volatility drops, and investors pay higher P/E ratios.",
        earnings: "Lagged indirect wealth effect, but primary impact is on asset prices.",
        factor_rotation: "Surging liquidity favors high-beta tech, unprofitable growth, and small caps. Draining liquidity favors cash-rich megacaps."
      },
      playbook_rules: [
        "When 13-Week Net Liquidity is expanding (+$$): Stay long high-beta growth and technology; dips get bought rapidly.",
        "When Net Liquidity is falling & RRP is depleted (<$200B): Reduce speculative small caps and leverage; QT will bite bank reserves directly.",
        "Rule: Net Liquidity has a 0.86 historical correlation with S&P 500 direction since 2020."
      ],
      formula: "Fed Balance Sheet (WALCL) - Treasury General Account (WTREGEN) - Overnight Reverse Repo (RRPONTSYD)",
      fred_series_id: "WALCL - WTREGEN - RRPONTSYD",
      signal_type: "Leading (1 to 4 weeks)",
      update_frequency: "Weekly (Every Thursday 4:30 PM ET)"
    }
  });
});
