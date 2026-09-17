import { EarningsEvent, EconomicRelease } from "@wireforge/shared";

const EARNINGS_CALENDAR: EarningsEvent[] = [
  {
    id: "earn-1",
    ticker: "FDX",
    companyName: "FedEx Corporation",
    date: "2026-09-17",
    timing: "AMC",
    epsEstimate: 4.82,
    epsActual: null,
    revEstimate: "$22.1B",
    revActual: null,
    fiscalQuarter: "Q1 2027",
  },
  {
    id: "earn-2",
    ticker: "LEN",
    companyName: "Lennar Corporation",
    date: "2026-09-17",
    timing: "AMC",
    epsEstimate: 3.65,
    epsActual: null,
    revEstimate: "$8.9B",
    revActual: null,
    fiscalQuarter: "Q3 2026",
  },
  {
    id: "earn-3",
    ticker: "DRI",
    companyName: "Darden Restaurants",
    date: "2026-09-18",
    timing: "BMO",
    epsEstimate: 1.74,
    epsActual: null,
    revEstimate: "$2.8B",
    revActual: null,
    fiscalQuarter: "Q1 2027",
  },
  {
    id: "earn-4",
    ticker: "MU",
    companyName: "Micron Technology",
    date: "2026-09-23",
    timing: "AMC",
    epsEstimate: 1.12,
    epsActual: null,
    revEstimate: "$7.65B",
    revActual: null,
    fiscalQuarter: "Q4 2026",
  },
  {
    id: "earn-5",
    ticker: "COST",
    companyName: "Costco Wholesale",
    date: "2026-09-24",
    timing: "AMC",
    epsEstimate: 5.08,
    epsActual: null,
    revEstimate: "$79.9B",
    revActual: null,
    fiscalQuarter: "Q4 2026",
  },
  {
    id: "earn-6",
    ticker: "NKE",
    companyName: "Nike Inc.",
    date: "2026-09-29",
    timing: "AMC",
    epsEstimate: 0.52,
    epsActual: null,
    revEstimate: "$11.6B",
    revActual: null,
    fiscalQuarter: "Q1 2027",
  },
];

const ECONOMIC_CALENDAR: EconomicRelease[] = [
  {
    id: "eco-1",
    name: "Initial Jobless Claims",
    country: "US",
    date: "2026-09-17",
    time: "08:30 EDT",
    impact: "high",
    actual: null,
    forecast: "219K",
    previous: "222K",
  },
  {
    id: "eco-2",
    name: "Philadelphia Fed Manufacturing Index",
    country: "US",
    date: "2026-09-17",
    time: "08:30 EDT",
    impact: "medium",
    actual: null,
    forecast: "1.0",
    previous: "-7.0",
  },
  {
    id: "eco-3",
    name: "Existing Home Sales (MoM)",
    country: "US",
    date: "2026-09-18",
    time: "10:00 EDT",
    impact: "medium",
    actual: null,
    forecast: "3.90M",
    previous: "3.95M",
  },
  {
    id: "eco-4",
    name: "S&P Global US Manufacturing PMI",
    country: "US",
    date: "2026-09-22",
    time: "09:45 EDT",
    impact: "medium",
    actual: null,
    forecast: "48.5",
    previous: "47.9",
  },
  {
    id: "eco-5",
    name: "Core PCE Price Index (MoM / YoY)",
    country: "US",
    date: "2026-09-25",
    time: "08:30 EDT",
    impact: "high",
    actual: null,
    forecast: "+0.2% / +2.6%",
    previous: "+0.2% / +2.6%",
  },
];

export class CalendarsService {
  getEarnings(timing?: "BMO" | "AMC" | "DURING", ticker?: string): EarningsEvent[] {
    let list = [...EARNINGS_CALENDAR];
    if (timing) list = list.filter((e) => e.timing === timing);
    if (ticker) list = list.filter((e) => e.ticker === ticker.toUpperCase());
    return list;
  }

  getEconomic(impact?: "high" | "medium" | "low"): EconomicRelease[] {
    let list = [...ECONOMIC_CALENDAR];
    if (impact) list = list.filter((e) => e.impact === impact);
    return list;
  }
}

export const globalCalendarsService = new CalendarsService();
