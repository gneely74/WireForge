/**
 * @fileoverview Interactive Explanation & Intelligence Modal for Stablecoin Items.
 * Provides institutional and layman explanations, macro transmission mechanics,
 * and tactical trading playbooks for:
 *  - Total Stablecoin Market Capitalization
 *  - 24-Hour Net Supply Flow (Mints vs. Burns)
 *  - U.S. Treasury Bill Absorption & Sovereign Banking Conduit
 *  - Peg Health Index & Basis Point Parity Deviations
 *  - Multi-Year Historical Total Supply Cycles (2017 to Present)
 *  - Market Share Dominance & Concentration Risk
 *  - Individual Asset Deep-Dives (USDT, USDC, USDS, USDe, DAI, USD1, USDG, PYUSD)
 *
 * Upstream Sources:
 *  - Invoked from StablecoinStatusCard.tsx upon clicking any KPI card, chart, or table item.
 * Downstream Interactions:
 *  - Tab switching between Plain English, Macro Transmission, and Tactical Playbook.
 *  - ESC key or backdrop click to dismiss.
 */

import React, { useEffect, useState } from "react";
import {
  X,
  BookOpen,
  Lightbulb,
  Cpu,
  TrendingUp,
  ShieldAlert,
  DollarSign,
  Activity,
  Landmark,
  ShieldCheck,
  Layers,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export type StablecoinTopicId =
  | "total_market_cap"
  | "supply_flow_24h"
  | "tbill_absorption"
  | "peg_health"
  | "historical_supply_chart"
  | "market_share_dominance"
  | "asset_detail";

export interface StablecoinAssetDetail {
  id: string;
  symbol: string;
  name: string;
  price: number;
  pegDeviationBps: number;
  circulatingUsd: number;
  change1dUsd: number;
  change1dPct: number;
  change30dUsd: number;
  change30dPct: number;
  dominancePct: number;
  pegMechanism: string;
  status: "pristine" | "normal" | "warning" | "depeg";
}

export interface StablecoinExplainerPayload {
  topicId: StablecoinTopicId;
  asset?: StablecoinAssetDetail;
}

interface StablecoinExplainerModalProps {
  payload: StablecoinExplainerPayload | null;
  onClose: () => void;
}

interface TopicContent {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badgeText: string;
  badgeColor: string;
  layman: {
    summary: string;
    metaphor: string;
    howItWorks: string;
  };
  transmission: {
    title: string;
    mechanisms: Array<{ header: string; detail: string }>;
  };
  playbook: {
    rules: string[];
    thresholds: Array<{ label: string; condition: string; action: string }>;
  };
}

/**
 * Static institutional knowledge base for stablecoin macro intelligence.
 */
const TOPIC_KNOWLEDGE: Record<Exclude<StablecoinTopicId, "asset_detail">, TopicContent> = {
  total_market_cap: {
    title: "Total Stablecoin Market Cap ($312B+)",
    subtitle: "Aggregate High-Powered Digital Dollar Supply",
    icon: <DollarSign size={20} className="text-cyan-400" />,
    badgeText: "MACRO LIQUIDITY PULSE",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    layman: {
      summary:
        "Stablecoin market capitalization represents the total volume of private U.S. dollars tokenized on public blockchains. Unlike traditional fractional-reserve bank deposits, fiat-backed stablecoins operate like digital 100%-reserve currency boards. When market cap expands, real fiat capital is entering the digital asset ecosystem to purchase risk assets, act as derivatives margin, or settle global commerce.",
      metaphor:
        "Think of total stablecoin supply as the fuel tank of the digital financial system. When market participants sell volatile assets like Bitcoin, tech equities, or commodities, they don't cash out into paper currency—they park in stablecoins. An expanding supply means fresh fuel (dry powder) has been added to the tank.",
      howItWorks:
        "Users and institutions wire physical USD into issuer custodial bank accounts (e.g. BNY Mellon, Cantor Fitzgerald). The issuer mints an exact 1:1 equivalent in digital tokens onto blockchains (Ethereum, Solana, Tron). When users redeem tokens for fiat cash, the digital tokens are burned and the fiat is wired back.",
    },
    transmission: {
      title: "Transmission to Equities & Risk Assets",
      mechanisms: [
        {
          header: "High-Beta Tech & Fintech Beta",
          detail:
            "Public companies tied to crypto trading, custody, and payments (Coinbase, Robinhood, Block, Circle IPO candidates) display a 0.78+ statistical correlation to stablecoin supply acceleration. Rising supply signals expanding transactional fee revenue.",
        },
        {
          header: "Dry Powder Velocity",
          detail:
            "When stablecoins sit on exchange order books, the friction to buy risk assets is virtually zero (milliseconds). Expanding supply directly suppresses market liquidity discounts and tightens bid-ask spreads across major asset classes.",
        },
        {
          header: "Global Dollarization",
          detail:
            "Stablecoins act as synthetic offshore dollars in emerging markets experiencing high inflation (Argentina, Nigeria, Turkey). This creates structural foreign demand for USD, reinforcing the dollar's global reserve hegemony.",
        },
      ],
    },
    playbook: {
      rules: [
        "Rule 1: Sustained 30-Day Growth > +2.0% signals positive macroeconomic liquidity tailwinds for digital assets and speculative growth stocks.",
        "Rule 2: Flat or decelerating supply (0% to +0.5%) indicates consolidation; market rallies during these periods are usually rotational rather than backed by fresh fiat inflow.",
        "Rule 3: Net monthly contraction (< -1.0%) warns of liquidity drainage. Reduce leverage and tighten stops on high-multiple equities.",
      ],
      thresholds: [
        { label: "Surge (> +3% 30d)", condition: "Aggressive fiat inflows", action: "Aggressive long posture on high-beta growth" },
        { label: "Steady (+0.5% to +2%)", condition: "Healthy organic liquidity", action: "Trend continuation / buy structural dips" },
        { label: "Contraction (< 0% 30d)", condition: "Capital flight to fiat banks", action: "Defensive positioning / raise cash" },
      ],
    },
  },

  supply_flow_24h: {
    title: "24-Hour Net Supply Flow (Mints vs. Burns)",
    subtitle: "Real-Time Institutional Dollar Velocity",
    icon: <Activity size={20} className="text-blue-400" />,
    badgeText: "HIGH FREQUENCY VELOCITY",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    layman: {
      summary:
        "24H Net Supply Flow measures the net difference between newly minted tokens and burned (redeemed) tokens over the trailing 24 hours. Because only verified institutional market makers (Wintermute, Jump, Flow Traders) can mint or burn directly with issuers in nine-figure blocks, this metric offers a real-time window into institutional capital posture.",
      metaphor:
        "It is the digital equivalent of tracking armored cars arriving at or leaving the central bank. A positive flow means institutions are loading armored cars with cash to deploy onto the digital trading floor; a negative flow means they are packing up and heading home.",
      howItWorks:
        "DeFiLlama scrapes on-chain smart contracts every minute across all chains. When a mint contract increases circulating supply, it is added to the inflow tally. When tokens are sent to the burn address (0x0000...0000), it registers as an outflow.",
    },
    transmission: {
      title: "Market Impact & Fast Execution Signals",
      mechanisms: [
        {
          header: "Leading Lead-Time (12–36 Hours)",
          detail:
            "Large institutional mints usually occur 12 to 36 hours BEFORE major spot price impulses. Institutions wire fiat during business banking hours, receive newly minted tokens, and stage them on centralized exchanges ahead of execution.",
        },
        {
          header: "Derivatives Liquidation Buffering",
          detail:
            "Positive net supply inflows increase available margin collateral on derivatives exchanges (Binance, Bybit, Deribit), dampening downside cascade volatility during intraday selloffs.",
        },
      ],
    },
    playbook: {
      rules: [
        "Rule 1: Flash Mint Prints > +$500M in a 24-hour window represent strong institutional accumulation; bias intraday setups to the long side.",
        "Rule 2: Consecutive negative days (< -$200M/day for 3+ days) indicate structured capital withdrawal; anticipate volatility spikes.",
      ],
      thresholds: [
        { label: "> +$500M / 24h", condition: "Institutional accumulation", action: "Expect bullish momentum continuation" },
        { label: "±$100M / 24h", condition: "Equilibrium trading", action: "Rangebound execution / mean-reversion" },
        { label: "< -$300M / 24h", condition: "Aggressive redemptions", action: "Heighten risk stops / anticipate pullbacks" },
      ],
    },
  },

  tbill_absorption: {
    title: "U.S. Treasury Bill Absorption ($230B+)",
    subtitle: "Shadow Banking Monetization of U.S. National Debt",
    icon: <Landmark size={20} className="text-amber-400" />,
    badgeText: "SOVEREIGN DEBT CONDUIT",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    layman: {
      summary:
        "To back their digital tokens 1:1 with authentic collateral, major stablecoin issuers (Tether and Circle) invest the vast majority (~73.8%) of their cash reserves into short-term U.S. Treasury Bills (1-month to 3-month maturities) and overnight reverse repo agreements. Collectively holding over $230 Billion in Treasuries, stablecoin issuers are now the 15th largest sovereign holder of U.S. government debt on Earth.",
      metaphor:
        "Stablecoin issuers are effectively modern shadow banks operating with near-zero operating costs. Users deposit non-interest-bearing cash; issuers buy 4.5%–5.0% yield-bearing U.S. government debt with that cash, keep the entire interest spread as pure corporate profit, and hand the user a zero-yield digital receipt (USDT/USDC).",
      howItWorks:
        "Tether partners with primary dealer Cantor Fitzgerald to purchase Treasury bills. Circle holds reserves in the Circle Reserve Fund, an SEC-registered institutional government money market fund managed by BlackRock and custodied by BNY Mellon.",
    },
    transmission: {
      title: "Geopolitical & Monetary Transmission",
      mechanisms: [
        {
          header: "Fiscal Deficit Monetization",
          detail:
            "As the U.S. Treasury issues trillions in short-term T-Bills to finance national debt, stablecoin issuers provide a persistent, non-price-sensitive buyer, capping short-term yields.",
        },
        {
          header: "Ranking Above Foreign Sovereign States",
          detail:
            "Stablecoins hold more U.S. debt than major industrial nations including Germany, South Korea, Saudi Arabia, and the UAE. This gives digital dollar issuers profound geopolitical leverage in Washington.",
        },
        {
          header: "Issuer Super-Profits",
          detail:
            "With $230B+ invested at ~4.5% yields, issuers generate over $10 Billion in annual interest income with virtually zero headcount (~150 employees at Tether), creating massive capital reserves.",
        },
      ],
    },
    playbook: {
      rules: [
        "Rule 1: T-Bill absorption scale guarantees bipartisan regulatory support for fiat-backed stablecoins in the U.S. Congress, as they serve as an essential buyer of U.S. sovereign debt.",
        "Rule 2: As long as short-term rates remain above 3.5%, issuer balance sheets accumulate hundreds of millions in excess capital reserves every month, bolstering solvency buffers.",
      ],
      thresholds: [
        { label: "> $250B Absorption", condition: "Top 12 sovereign holder scale", action: "Regulatory protection fully entrenched" },
        { label: "Reserve Share > 70%", condition: "Pristine liquidity backing", action: "Run-on-bank risk minimized" },
        { label: "Reserve Share < 60%", condition: "Alternative asset exposure", action: "Scrutinize commercial paper/crypto risks" },
      ],
    },
  },

  peg_health: {
    title: "Peg Health Index & Basis Point Deviations",
    subtitle: "Parity Integrity & De-Peg Contagion Radar",
    icon: <ShieldCheck size={20} className="text-emerald-400" />,
    badgeText: "SYSTEMIC SOLVENCY RADAR",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    layman: {
      summary:
        "Every USD stablecoin promises to maintain exactly $1.0000 parity. In secondary exchange markets, micro-imbalances between buyers and sellers cause prices to fluctuate by fractions of a cent, measured in basis points (1 bp = 0.01% = $0.0001). The Peg Health Index evaluates whether top issuers are trading within safe arbitrage tolerances.",
      metaphor:
        "Think of basis point peg deviations like blood pressure in the financial system. Normal fluctuations (2–5 bps) are completely healthy. A reading of 20 bps is a mild fever. A reading of 50 bps or more is an emergency that triggers automated liquidation cascades across the entire banking system.",
      howItWorks:
        "Arbitrageurs maintain the peg. If USDT dips to $0.9980, arbitrageurs buy USDT on the open market and redeem it directly with Tether for $1.0000 cash, locking in an immediate profit while absorbing selling pressure. As long as redemptions function smoothly, the peg snaps back.",
    },
    transmission: {
      title: "De-Peg Contagion Mechanics",
      mechanisms: [
        {
          header: "DeFi Collateral Cascades",
          detail:
            "Decentralized lending protocols (Aave, Maker, Compound) use stablecoins as $1.00 collateral. If a stablecoin drops below $0.98, hundreds of millions in automated liquidations are triggered simultaneously.",
        },
        {
          header: "Exchange Flight to Safety",
          detail:
            "During de-peg events, traders rapidly dump the distressed stablecoin into alternative stablecoins (e.g. dumping USDC for USDT during the March 2023 SVB banking crisis).",
        },
      ],
    },
    playbook: {
      rules: [
        "Rule 1: Pristine Status (< 5 bps deviation): Optimal execution; zero slippage across digital dollar trading pairs.",
        "Rule 2: Warning Status (15–50 bps deviation): Flag potential redemption bottlenecks or localized liquidity pool imbalances.",
        "Rule 3: Depeg Alert (> 50 bps deviation on top 3 issuer): Immediate systemic risk signal. Reduce exposure across crypto equities and DeFi protocols immediately.",
      ],
      thresholds: [
        { label: "Pristine (< 5 bps)", condition: "Flawless parity ($0.9995–$1.0005)", action: "Normal trading / full position sizes" },
        { label: "Normal (5–15 bps)", condition: "Ordinary market noise", action: "Standard execution monitoring" },
        { label: "Depeg (> 50 bps)", condition: "Severe counterparty distress", action: "Emergency hedging / flight to fiat cash" },
      ],
    },
  },

  historical_supply_chart: {
    title: "Historical Total Supply Time-Series",
    subtitle: "Macro Liquidity Cycles (2017 to Present)",
    icon: <TrendingUp size={20} className="text-cyan-400" />,
    badgeText: "MULTI-YEAR MACRO CYCLE",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    layman: {
      summary:
        "The historical supply curve traces the complete lifecycle of private digital currency from early experimental beginnings in 2017 to the $310B+ institutional financial infrastructure of today. Because stablecoin supply is unconstrained by fractional reserves, it serves as the purest real-time barometer of private speculative liquidity in existence.",
      metaphor:
        "Central bank balance sheets are like giant ocean liners—they take months to turn around with scheduled FOMC meetings. The stablecoin supply curve is like a speedboat—it reacts instantaneously to changes in risk appetite, banking liquidity, and global capital flows.",
      howItWorks:
        "This chart aggregates daily historical snapshots from DeFiLlama over 3,220+ days. The interactive timeframe selector allows toggling between tactical short-term momentum (30D, 90D) and secular macro regimes (1Y, 3Y, ALL).",
    },
    transmission: {
      title: "The 4 Historical Regimes",
      mechanisms: [
        {
          header: "2017–2019: Early Discovery (< $5B)",
          detail:
            "Used almost exclusively for offshore exchange arbitrage between Bitfinex, Poloniex, and Bittrex without traditional wire delays.",
        },
        {
          header: "2020–2021: Zero-Rate QE Explosion ($5B ➔ $180B)",
          detail:
            "COVID-era stimulus, 0% interest rates, and DeFi yield farming drove a 36x expansion in private digital dollars in under 24 months.",
        },
        {
          header: "2022–2023: Quantitative Tightening & Contraction ($180B ➔ $120B)",
          detail:
            "The algorithmic collapse of Terra/UST, 500 bps in Federal Reserve rate hikes, and the FTX collapse triggered a 33% contraction as yield moved back to traditional cash.",
        },
        {
          header: "2024–2026: Institutional All-Time Highs (> $312B+)",
          detail:
            "Surpassed previous bull market peaks, driven by spot ETF inflows, institutional cross-border settlements, and high-yield reserve management.",
        },
      ],
    },
    playbook: {
      rules: [
        "Rule 1: Historical breakouts to new all-time highs in aggregate supply consistently precede multi-month expansions in digital asset valuations.",
        "Rule 2: When the 1Y curve breaks below its 90-day moving average, a macro risk-off regime is underway.",
      ],
      thresholds: [
        { label: "ATH Breakout", condition: "Supply establishing all-time highs", action: "Aggressive multi-month bull regime" },
        { label: "Consolidation", condition: "Supply moving sideways (±2%)", action: "Stock-picking & relative value trades" },
        { label: "Regime Breakdown", condition: "Persistent 3-month contraction", action: "De-risk portfolios and favor defensive cash" },
      ],
    },
  },

  market_share_dominance: {
    title: "Market Share & Concentration Risk",
    subtitle: "The Tether & Circle Duopoly",
    icon: <Layers size={20} className="text-purple-400" />,
    badgeText: "DUOPOLY RISK AUDIT",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    layman: {
      summary:
        "The stablecoin ecosystem displays extreme market concentration. Tether (USDT) controls ~59% and Circle (USDC) controls ~24%. Together, two private corporate entities govern over 83% of all digital dollar liquidity in existence. Understanding their market share explains where global liquidity is flowing.",
      metaphor:
        "It is like having two giant commercial airlines that operate 83% of all global flights. If one airline has maintenance issues, flights around the entire world get grounded immediately. Monitoring the balance of power between them is critical for structural risk management.",
      howItWorks:
        "Market share is calculated as an asset's circulating market cap divided by the aggregate circulating market cap of all tracked stablecoins.",
    },
    transmission: {
      title: "Offshore vs. Onshore Liquidity Transmission",
      mechanisms: [
        {
          header: "Tether (USDT) Offshore Dominance (~59%)",
          detail:
            "USDT is the currency of offshore derivatives, peer-to-peer cross-border trade in emerging markets, and high-volume crypto exchanges. It thrives outside direct U.S. regulatory jurisdiction.",
        },
        {
          header: "Circle (USDC) Onshore & Institutional (~24%)",
          detail:
            "USDC is the standard for regulated U.S. institutions, SEC-registered investment funds, public corporate balance sheets, and DeFi protocols requiring onshore compliance.",
        },
        {
          header: "New Challenger Networks (USDe, USD1, USDG)",
          detail:
            "Synthetic delta-neutral yield models (Ethena) and consortium-backed yield-sharing networks (Global Dollar) are competing to erode the duopoly's 0%-yield monopoly.",
        },
      ],
    },
    playbook: {
      rules: [
        "Rule 1: A rapid flight from USDT to USDC signals fear of regulatory enforcement or offshore banking actions.",
        "Rule 2: A rapid flight from USDC to USDT signals institutional panic regarding U.S. regional banking insolvency (as seen during SVB).",
      ],
      thresholds: [
        { label: "USDT Dominance > 60%", condition: "Heavy offshore dependency", action: "Monitor offshore liquidity spreads" },
        { label: "USDC Share Rising", condition: "U.S. institutional onboarding", action: "Constructive for regulated fintechs" },
        { label: "DeFi/Synthetic Share > 10%", condition: "High-yield appetite returning", action: "Early signal of speculative fervor" },
      ],
    },
  },
};

/**
 * Dedicated knowledge profiles for individual stablecoin assets.
 */
const ASSET_PROFILES: Record<
  string,
  {
    issuer: string;
    jurisdiction: string;
    reserves: string;
    auditor: string;
    stressTest: string;
    profileSummary: string;
  }
> = {
  USDT: {
    issuer: "Tether Holdings Limited",
    jurisdiction: "British Virgin Islands / El Salvador",
    reserves: "Short-Term U.S. Treasury Bills (~85%), Overnight Reverse Repos, Physical Gold, Bitcoin, Secured Loans",
    auditor: "BDO Italia (Quarterly Attestations)",
    stressTest: "May 2022 Terra Crash: Processed $10B in fiat redemptions in 72 hours with 0 delays; temporary 100 bps de-peg resolved swiftly.",
    profileSummary:
      "The undisputed global market leader and most liquid trading instrument in digital asset history. Dominates offshore crypto derivatives, Asian trading volume, and emerging market remittance rails.",
  },
  USDC: {
    issuer: "Circle Internet Financial LLC",
    jurisdiction: "United States (State-regulated money transmitter)",
    reserves: "Circle Reserve Fund (managed by BlackRock), cash deposits at Tier-1 U.S. banks (BNY Mellon)",
    auditor: "Deloitte & Touche (Monthly Attestations)",
    stressTest: "March 2023 SVB Crisis: De-pegged to $0.87 when $3.3B was trapped at Silicon Valley Bank; returned to parity after FDIC backstop.",
    profileSummary:
      "The gold standard for regulated U.S. financial institutions. Deeply integrated with BlackRock, Visa, Stripe, and leading DeFi protocols.",
  },
  USDS: {
    issuer: "Sky Protocol (formerly MakerDAO)",
    jurisdiction: "Decentralized Autonomous Organization (DAO)",
    reserves: "Overcollateralized Ethereum, Wrapped BTC, and Real World Assets (U.S. Treasuries via tokenized vaults)",
    auditor: "On-Chain Smart Contract Verifications",
    stressTest: "The upgraded evolution of DAI, featuring native Sky Savings Rate (SSR) yields directly on-chain.",
    profileSummary:
      "The premier decentralized dollar, allowing holders to earn native protocol yields funded directly by protocol stability fees.",
  },
  USDE: {
    issuer: "Ethena Labs",
    jurisdiction: "Decentralized / Synthetic",
    reserves: "Delta-neutral spot staked ETH/BTC combined with short perpetual futures positions across centralized exchanges",
    auditor: "On-Chain Attestations & Chaos Labs Risk Audits",
    stressTest: "Survives by capturing the perpetual funding rate; susceptible to basis inversion during prolonged bear markets.",
    profileSummary:
      "Synthetic dollar that generates double-digit yields by harvesting the basis spread between spot crypto and perpetual futures contracts.",
  },
  DAI: {
    issuer: "MakerDAO / Sky Protocol",
    jurisdiction: "Decentralized Autonomous Organization",
    reserves: "Overcollateralized multi-asset vault system (ETH, USDC, Treasury RWA vaults)",
    auditor: "On-Chain Verified Since 2017",
    stressTest: "March 2020 'Black Thursday': Survived violent ETH liquidation cascades and pioneered decentralized lending.",
    profileSummary:
      "The original decentralized stablecoin. Battle-tested through three major market cycles with autonomous liquidation mechanisms.",
  },
  USD1: {
    issuer: "World Liberty Financial USD",
    jurisdiction: "United States Regulated Custody",
    reserves: "100% Cash and Cash Equivalents / Short-Term U.S. Treasuries in segregated accounts",
    auditor: "Third-party institutional accounting firm",
    stressTest: "Rapid institutional adoption in decentralized finance and payment settlement rails.",
    profileSummary:
      "Institutional-grade fiat-backed digital dollar designed for high-throughput institutional settlement and cross-border trade.",
  },
  USDG: {
    issuer: "Global Dollar Network (Paxos, Robinhood, Kraken, Galaxy)",
    jurisdiction: "Singapore / Abu Dhabi / United States",
    reserves: "U.S. Treasury Bills and overnight repos custodied with licensed trust companies",
    auditor: "Top-tier independent accounting firm",
    stressTest: "Designed to disrupt the zero-yield model by returning up to 100% of reserve interest back to participating platform partners.",
    profileSummary:
      "Consortium-backed stablecoin network created by leading fintechs to establish an open standard where yield flows back to partners.",
  },
  PYUSD: {
    issuer: "PayPal Inc. / Paxos Trust Company",
    jurisdiction: "New York, USA (NYDFS Regulated)",
    reserves: "U.S. Treasury reverse repurchase agreements and cash deposits",
    auditor: "WithumSmith+Brown (Monthly Attestations)",
    stressTest: "Protected by New York State Department of Financial Services (NYDFS) strict consumer protection and bankruptcy-remote trust framework.",
    profileSummary:
      "The first stablecoin issued by a major Fortune 500 payments giant. Direct consumer rails across PayPal and Venmo merchant networks.",
  },
};

export const StablecoinExplainerModal: React.FC<StablecoinExplainerModalProps> = ({
  payload,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"layman" | "transmission" | "playbook">("layman");

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!payload) return null;

  const isAssetDetail = payload.topicId === "asset_detail" && payload.asset;
  const asset = payload.asset;
  const assetProfile = asset ? ASSET_PROFILES[asset.symbol] || null : null;
  const topicContent = isAssetDetail ? null : TOPIC_KNOWLEDGE[payload.topicId as Exclude<StablecoinTopicId, "asset_detail">];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-[#0f1420] border border-[#263147] shadow-2xl text-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f283d] bg-[#131929]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {isAssetDetail ? <DollarSign size={20} /> : topicContent?.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {isAssetDetail ? `${asset?.name} (${asset?.symbol})` : topicContent?.title}
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    isAssetDetail
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : topicContent?.badgeColor
                  }`}
                >
                  {isAssetDetail ? `${asset?.pegMechanism.toUpperCase()}` : topicContent?.badgeText}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isAssetDetail
                  ? `Live Price: $${asset?.price.toFixed(4)} • Deviation: ${asset?.pegDeviationBps} bps • Supply: $${(
                      (asset?.circulatingUsd || 0) / 1e9
                    ).toFixed(2)}B`
                  : topicContent?.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1e2638] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Sub-Tab Switcher */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#1f283d] bg-[#111624] text-xs">
          <button
            onClick={() => setActiveSubTab("layman")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeSubTab === "layman"
                ? "border-cyan-500 text-cyan-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Lightbulb size={14} />
            <span>Plain English (Layman's)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("transmission")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeSubTab === "transmission"
                ? "border-cyan-500 text-cyan-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <TrendingUp size={14} />
            <span>Macro Transmission</span>
          </button>

          <button
            onClick={() => setActiveSubTab("playbook")}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
              activeSubTab === "playbook"
                ? "border-cyan-500 text-cyan-400 font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShieldAlert size={14} />
            <span>Tactical Playbook</span>
          </button>
        </div>

        {/* 3. Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-sm leading-relaxed">
          {/* ==================== INDIVIDUAL ASSET DETAIL VIEW ==================== */}
          {isAssetDetail && asset ? (
            <>
              {activeSubTab === "layman" && (
                <div className="space-y-4">
                  {/* Live Telemetry Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#141b2b] border border-[#232f48] font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">PEG PRICE</span>
                      <span className="text-base font-bold text-white">${asset.price.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">DEVIATION</span>
                      <span
                        className={`text-base font-bold ${
                          Math.abs(asset.pegDeviationBps) < 5
                            ? "text-emerald-400"
                            : Math.abs(asset.pegDeviationBps) < 15
                            ? "text-cyan-400"
                            : "text-amber-400"
                        }`}
                      >
                        {asset.pegDeviationBps > 0 ? `+${asset.pegDeviationBps}` : asset.pegDeviationBps} bps
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">CIRCULATING</span>
                      <span className="text-base font-bold text-white">
                        ${(asset.circulatingUsd / 1e9).toFixed(2)}B
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">MARKET SHARE</span>
                      <span className="text-base font-bold text-cyan-400">
                        {asset.dominancePct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Plain English Summary */}
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1.5">
                      <Lightbulb size={14} />
                      <span>About {asset.name}</span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {assetProfile?.profileSummary ||
                        `${asset.name} is a ${asset.pegMechanism} stablecoin representing $${(
                          asset.circulatingUsd / 1e9
                        ).toFixed(2)}B in active circulating dollar supply.`}
                    </p>
                  </div>

                  {/* Reserve & Regulatory Architecture */}
                  {assetProfile && (
                    <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                        <Landmark size={14} />
                        <span>Reserve Collateral &amp; Custody</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400 block">Issuer / Entity:</span>
                          <span className="font-semibold text-gray-200">{assetProfile.issuer}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Jurisdiction:</span>
                          <span className="font-semibold text-gray-200">{assetProfile.jurisdiction}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-gray-400 block">Reserve Composition:</span>
                          <span className="font-semibold text-cyan-300 font-mono">
                            {assetProfile.reserves}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-gray-400 block">Attestation / Audit:</span>
                          <span className="font-semibold text-gray-200">{assetProfile.auditor}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === "transmission" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                      <TrendingUp size={14} />
                      <span>Role in Global Dollar Transmission</span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      {asset.symbol === "USDT"
                        ? "USDT functions as the primary base currency for global derivatives markets and emerging market capital flight. It represents over 75% of offshore crypto exchange turnover."
                        : asset.symbol === "USDC"
                        ? "USDC serves as the institutional gateway for regulated corporate treasuries, clearinghouses, and U.S. compliant decentralized protocols."
                        : `${asset.name} provides specialized liquidity and collateral functionality within decentralized finance protocols.`}
                    </p>
                  </div>

                  {assetProfile?.stressTest && (
                    <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-2">
                      <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
                        <AlertTriangle size={14} />
                        <span>Historical Stress Test &amp; Resilience</span>
                      </div>
                      <p className="text-gray-300 text-sm">{assetProfile.stressTest}</p>
                    </div>
                  )}
                </div>
              )}

              {activeSubTab === "playbook" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">
                      Parity Status: {asset.status.toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-200">
                      Currently deviating by {Math.abs(asset.pegDeviationBps)} basis points.
                      {Math.abs(asset.pegDeviationBps) < 5
                        ? " Parity is pristine. Zero execution risk across spot or collateral borrowing."
                        : Math.abs(asset.pegDeviationBps) < 15
                        ? " Parity is within standard market noise tolerances."
                        : " Basis point deviation is elevated; monitor redemption queues."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-2">
                    <div className="text-xs font-mono uppercase tracking-wider text-gray-400">
                      Trading &amp; Collateral Rules
                    </div>
                    <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4">
                      <li>Use for primary spot and perpetual pairs when deviation is under 5 bps.</li>
                      <li>
                        30-Day Flow:{" "}
                        <span className={asset.change30dUsd >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {asset.change30dUsd >= 0 ? "+" : ""}$
                          {(Math.abs(asset.change30dUsd) / 1e6).toFixed(1)}M ({asset.change30dPct.toFixed(2)}%)
                        </span>
                        . Positive momentum reflects expanding secondary market adoption.
                      </li>
                      <li>
                        If basis points exceed ±25 bps, avoid using as single-asset collateral on automated lending protocols.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : topicContent ? (
            /* ==================== GENERAL TOPIC EXPLAINER VIEW ==================== */
            <>
              {activeSubTab === "layman" && (
                <div className="space-y-4">
                  {/* Plain English Summary */}
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1.5">
                      <Lightbulb size={14} />
                      <span>In Plain English</span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {topicContent.layman.summary}
                    </p>
                  </div>

                  {/* Intuitive Metaphor */}
                  <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42]">
                    <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1.5">
                      <Cpu size={14} />
                      <span>The Intuitive Metaphor</span>
                    </div>
                    <p className="text-gray-300 italic text-sm">
                      "{topicContent.layman.metaphor}"
                    </p>
                  </div>

                  {/* How It Works Technically */}
                  <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-2">
                    <div className="text-xs font-mono uppercase tracking-wider text-gray-400">
                      Plumbing &amp; Architecture
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {topicContent.layman.howItWorks}
                    </p>
                  </div>
                </div>
              )}

              {activeSubTab === "transmission" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                      <TrendingUp size={14} />
                      <span>{topicContent.transmission.title}</span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {topicContent.transmission.mechanisms.map((mech, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#0b0e17] border border-[#1b2333]">
                          <span className="font-bold text-xs text-white block mb-1">
                            {idx + 1}. {mech.header}
                          </span>
                          <p className="text-xs text-gray-300 leading-relaxed">{mech.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === "playbook" && (
                <div className="space-y-4">
                  {/* Tactical Rules */}
                  <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                      <CheckCircle2 size={14} />
                      <span>Execution Rules</span>
                    </div>
                    <div className="space-y-2 pt-1">
                      {topicContent.playbook.rules.map((rule, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#0b0e17] border border-[#1b2333] text-xs text-gray-200">
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Threshold Matrix */}
                  <div className="p-4 rounded-xl bg-[#141a29] border border-[#232d42] space-y-2">
                    <div className="text-xs font-mono uppercase tracking-wider text-gray-400">
                      Indicator Action Matrix
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-[#1b2333] text-gray-400 text-[10px]">
                            <th className="pb-2">SIGNAL / LEVEL</th>
                            <th className="pb-2">MARKET CONDITION</th>
                            <th className="pb-2">TACTICAL ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1b2333]">
                          {topicContent.playbook.thresholds.map((row, idx) => (
                            <tr key={idx} className="hover:bg-[#141c2c]/40">
                              <td className="py-2.5 font-bold text-cyan-300">{row.label}</td>
                              <td className="py-2.5 text-gray-300">{row.condition}</td>
                              <td className="py-2.5 text-emerald-400">{row.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* 4. Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#1f283d] bg-[#111624] text-xs">
          <span className="text-[11px] text-gray-500 font-mono">
            Powered by DeFiLlama Public Telemetry • WireForge Macro Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold font-mono text-xs transition-colors"
          >
            Close Explainer
          </button>
        </div>
      </div>
    </div>
  );
};
