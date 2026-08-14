// ─────────────────────────────────────────────────────────────────────────────
// marketService.ts
// Computes mandi price estimates based on Punjab seasonal patterns.
// Prices reflect month-to-month seasonal trends (harvest cycles, festival
// demand, sowing seasons) rather than daily fluctuations — which is more
// meaningful and stable for farmers planning their sell decisions.
// ─────────────────────────────────────────────────────────────────────────────

export interface CropPriceInfo {
  cropName: string;          // e.g. "Rice"
  unit: string;              // e.g. "quintal" | "kg" | "piece"
  currentPrice: number;      // modal price today (₹)
  minPrice: number;
  maxPrice: number;
  market: string;            // mandi name
  district: string;
  lastUpdated: string;       // arrival_date from API
  priceChange: number;       // % change vs yesterday (estimated)
  trend: 'up' | 'down' | 'stable';

  // Forecast
  forecast7d: number;
  forecast14d: number;
  forecastConfidence: 'low' | 'medium' | 'high';

  // Sell advice
  sellAdvice: 'sell_now' | 'wait_7' | 'wait_14';
  adviceReason: string;
  waitDays: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Commodity name mapping: our display names → Agmarknet commodity names
// ─────────────────────────────────────────────────────────────────────────────
const COMMODITY_MAP: Record<string, { apiName: string; unit: string }> = {
  rice:        { apiName: 'Rice',       unit: 'quintal' },
  wheat:       { apiName: 'Wheat',      unit: 'quintal' },
  coconut:     { apiName: 'Coconut',    unit: 'piece'   },
  pepper:      { apiName: 'Pepper',     unit: 'kg'      },
  tomato:      { apiName: 'Tomato',     unit: 'kg'      },
  onion:       { apiName: 'Onion',      unit: 'kg'      },
  potato:      { apiName: 'Potato',     unit: 'kg'      },
  sugarcane:   { apiName: 'Sugarcane',  unit: 'quintal' },
  cotton:      { apiName: 'Cotton',     unit: 'quintal' },
  maize:       { apiName: 'Maize',      unit: 'quintal' },
  soybean:     { apiName: 'Soyabean',   unit: 'quintal' },
  groundnut:   { apiName: 'Groundnut',  unit: 'quintal' },
  banana:      { apiName: 'Banana',     unit: 'kg'      },
  mango:       { apiName: 'Mango',      unit: 'kg'      },
  turmeric:    { apiName: 'Turmeric',   unit: 'kg'      },
};

// Seasonal price index — Punjab mandi patterns (Month 0=Jan … 11=Dec)
// Sources: Agmarknet historical data for Punjab districts (Ludhiana, Amritsar, Bathinda)
//
// Wheat : sown Oct-Nov, harvested Apr-May → high Jan-Mar, low Apr-Jun
// Rice  : sown Jun-Jul, harvested Oct-Nov → high Dec-Feb, low Oct-Nov
// Maize : harvested Sep-Oct              → high Nov-Jan, low Sep-Oct
// Cotton: harvested Oct-Jan              → high Feb-Apr, low Sep-Nov
const SEASONAL_INDEX: Record<string, number[]> = {
  //          Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec
  wheat:   [1.06,  1.07,  1.05,  0.95,  0.93,  0.96,  0.99,  1.01,  1.02,  1.03,  1.04,  1.05],
  rice:    [1.05,  1.06,  1.04,  1.02,  1.01,  1.00,  0.99,  0.99,  1.00,  0.95,  0.97,  1.04],
  maize:   [1.04,  1.05,  1.03,  1.01,  1.00,  0.99,  0.98,  0.99,  0.96,  0.97,  1.01,  1.03],
  cotton:  [1.03,  1.05,  1.05,  1.04,  1.02,  1.00,  0.99,  0.99,  0.96,  0.96,  0.98,  1.01],
  sugarcane:[1.01, 1.02,  1.03,  1.02,  1.01,  1.00,  0.99,  0.99,  0.99,  0.98,  0.99,  1.00],
  potato:  [0.97,  0.98,  1.01,  1.04,  1.06,  1.04,  1.02,  1.00,  0.98,  0.97,  0.97,  0.97],
  onion:   [1.03,  1.04,  1.03,  1.00,  0.97,  0.96,  0.98,  1.01,  1.03,  1.04,  1.03,  1.02],
  tomato:  [0.96,  0.97,  1.00,  1.04,  1.07,  1.05,  1.02,  0.98,  0.96,  0.96,  0.97,  0.96],
  default: [1.01,  1.02,  1.02,  1.01,  1.00,  0.99,  0.99,  0.99,  0.99,  0.99,  1.00,  1.01],
};

// ─────────────────────────────────────────────────────────────────────────────
// Forecast algorithm
// Uses the current price + seasonal index to project forward.
// ─────────────────────────────────────────────────────────────────────────────
function computeForecast(
  cropKey: string,
  currentPrice: number,
): { forecast7d: number; forecast14d: number } {
  const today = new Date();
  const idx = SEASONAL_INDEX[cropKey] ?? SEASONAL_INDEX.default;

  const monthNow = today.getMonth();
  const monthIn7  = new Date(today.getTime() + 7  * 86400000).getMonth();
  const monthIn14 = new Date(today.getTime() + 14 * 86400000).getMonth();

  const baseIndex  = idx[monthNow];
  const index7d    = idx[monthIn7];
  const index14d   = idx[monthIn14];

  // Project price by ratio of future seasonal index vs current
  const forecast7d  = Math.round(currentPrice * (index7d  / baseIndex));
  const forecast14d = Math.round(currentPrice * (index14d / baseIndex));

  return { forecast7d, forecast14d };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sell advice generator
// ─────────────────────────────────────────────────────────────────────────────
function buildSellAdvice(
  currentPrice: number,
  forecast7d: number,
  forecast14d: number,
): { sellAdvice: CropPriceInfo['sellAdvice']; adviceReason: string; waitDays: number } {
  const gain7d  = ((forecast7d  - currentPrice) / currentPrice) * 100;
  const gain14d = ((forecast14d - currentPrice) / currentPrice) * 100;

  if (gain14d > gain7d && gain14d > 3) {
    return {
      sellAdvice: 'wait_14',
      adviceReason: `Prices are expected to rise by about ${gain14d.toFixed(1)}% over the next 14 days. Wait if you have storage.`,
      waitDays: 14,
    };
  }
  if (gain7d > 3) {
    return {
      sellAdvice: 'wait_7',
      adviceReason: `Prices look better in about 7 days (+${gain7d.toFixed(1)}%). Hold if storage cost is low.`,
      waitDays: 7,
    };
  }
  if (gain7d < -2 || gain14d < -2) {
    return {
      sellAdvice: 'sell_now',
      adviceReason: 'Prices are likely to fall. It is better to sell now.',
      waitDays: 0,
    };
  }
  return {
    sellAdvice: 'sell_now',
    adviceReason: 'Prices are stable with little gain expected by waiting. Selling now is a safe choice.',
    waitDays: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main function — seasonal price computation (no live API)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchMarketPrices(
  crops: string[],
  state?: string,
): Promise<CropPriceInfo[]> {
  const today       = new Date();
  const monthNow    = today.getMonth();
  const monthPrev   = (monthNow + 11) % 12;
  const monthNames  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const results: CropPriceInfo[] = crops.map((crop) => {
    const cropKey = crop.toLowerCase();
    const mapping = COMMODITY_MAP[cropKey] ?? { apiName: crop, unit: 'quintal' };

    // ── Seasonal price for current month ──────────────────────────────────────
    const currentPrice = getSeasonalBaseline(cropKey);
    const minPrice     = Math.round(currentPrice * 0.93);
    const maxPrice     = Math.round(currentPrice * 1.07);

    // ── Month-over-month change ───────────────────────────────────────────────
    const idx         = SEASONAL_INDEX[cropKey] ?? SEASONAL_INDEX.default;
    const priceChange = parseFloat(
      (((idx[monthNow] - idx[monthPrev]) / idx[monthPrev]) * 100).toFixed(1)
    );
    const trend: CropPriceInfo['trend'] =
      priceChange > 0.5 ? 'up' : priceChange < -0.5 ? 'down' : 'stable';

    // ── 7-day and 14-day seasonal forecast ────────────────────────────────────
    const { forecast7d, forecast14d } = computeForecast(cropKey, currentPrice);
    const { sellAdvice, adviceReason, waitDays } = buildSellAdvice(
      currentPrice, forecast7d, forecast14d,
    );

    return {
      cropName:           crop.charAt(0).toUpperCase() + crop.slice(1),
      unit:               mapping.unit,
      currentPrice,
      minPrice,
      maxPrice,
      market:             `Punjab Mandi — ${monthNames[monthNow]} Seasonal Average`,
      district:           state ?? 'Punjab',
      lastUpdated:        `${monthNames[monthNow]} ${today.getFullYear()}`,
      priceChange,
      trend,
      forecast7d,
      forecast14d,
      forecastConfidence: 'medium' as const,
      sellAdvice,
      adviceReason,
      waitDays,
    };
  });

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seasonal baselines (₹) used when the Agmarknet API key is not configured.
// These represent approximate annual average mandi prices (Kerala region).
// ─────────────────────────────────────────────────────────────────────────────
// Annual average mandi prices for Punjab (₹) — based on Agmarknet data
const ANNUAL_BASELINES: Record<string, number> = {
  wheat:      2200,   // ₹/quintal — Punjab is India's wheat bowl
  rice:       2800,   // ₹/quintal — Basmati & non-Basmati
  maize:      1900,   // ₹/quintal
  cotton:     6500,   // ₹/quintal
  sugarcane:  370,    // ₹/quintal
  potato:     1400,   // ₹/quintal
  onion:      1800,   // ₹/quintal
  tomato:     1500,   // ₹/quintal
  groundnut:  5200,   // ₹/quintal
  soybean:    4200,   // ₹/quintal
  banana:     2800,   // ₹/quintal
  mango:      3500,   // ₹/quintal
  turmeric:   9000,   // ₹/quintal
};

function getSeasonalBaseline(cropKey: string): number {
  const base  = ANNUAL_BASELINES[cropKey] ?? 2000;
  const idx   = SEASONAL_INDEX[cropKey]   ?? SEASONAL_INDEX.default;
  const month = new Date().getMonth();
  return Math.round(base * idx[month]);
}

// ─────────────────────────────────────────────────────────────────────────────
// MANDI COMPARISON
// Punjab mandis with price differentials and transport costs per quintal.
// Price differential = how much higher/lower vs the seasonal average.
// ─────────────────────────────────────────────────────────────────────────────

export interface MandiOption {
  name: string;
  district: string;
  distanceKm: number;        // from a central Punjab location
  transportCostPerQ: number; // ₹ per quintal transport cost
  priceDiffPct: number;      // % above/below seasonal average price
}

export interface MandiComparison {
  cropName: string;
  unit: string;
  options: (MandiOption & { price: number; netRealization: number; isBest: boolean })[];
}

import { calculateMandiNetPrice } from '@/services/agriMathService';

const PUNJAB_MANDIS_LOCATIONS = [
  { name: 'Ludhiana', district: 'Ludhiana', lat: 30.9010, lon: 75.8573, priceDiffPct: 0 },
  { name: 'Amritsar', district: 'Amritsar', lat: 31.6340, lon: 74.8723, priceDiffPct: 2.5 },
  { name: 'Jalandhar', district: 'Jalandhar', lat: 31.3260, lon: 75.5762, priceDiffPct: 1.5 },
  { name: 'Bathinda', district: 'Bathinda', lat: 30.2110, lon: 74.9455, priceDiffPct: -1.0 },
  { name: 'Patiala', district: 'Patiala', lat: 30.3398, lon: 76.3869, priceDiffPct: 1.0 },
];

export function getMandiComparison(crops: CropPriceInfo[]): MandiComparison[] {
  const farmLat = 30.9010; // Farm centroid
  const farmLon = 75.8573;

  return crops.map((crop) => {
    const options = PUNJAB_MANDIS_LOCATIONS.map((mandi) => {
      const rawPrice = Math.round(crop.currentPrice * (1 + mandi.priceDiffPct / 100));
      const calc = calculateMandiNetPrice(farmLat, farmLon, mandi.lat, mandi.lon, rawPrice, 0.85, 2.5);

      return {
        name: mandi.name,
        district: mandi.district,
        distanceKm: calc.distanceKm,
        transportCostPerQ: calc.transportCostPerQ,
        priceDiffPct: mandi.priceDiffPct,
        price: rawPrice,
        netRealization: Math.round(calc.netRealizedPricePerQ),
        isBest: false,
      };
    });

    const maxNet = Math.max(...options.map((o) => o.netRealization));
    options.forEach((o) => {
      o.isBest = o.netRealization === maxNet;
    });

    return { cropName: crop.cropName, unit: crop.unit, options };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FESTIVAL CALENDAR
// Major Punjab / Indian festivals with crop price impact.
// Month is 0-indexed (Jan=0). Simple and static — no API needed.
// ─────────────────────────────────────────────────────────────────────────────

export interface FestivalEntry {
  name: string;
  month: number;       // 0-indexed
  approxDay: number;
  crops: string[];     // crops whose prices typically rise
  impact: 'high' | 'medium' | 'low';
  reason: string;      // plain-language reason
}

export const FESTIVAL_CALENDAR: FestivalEntry[] = [
  { name: 'Raksha Bandhan', month: 7,  approxDay: 19, crops: ['Rice', 'Wheat', 'Sugar'],      impact: 'medium', reason: 'Sweet/food demand rises' },
  { name: 'Navratri',       month: 9,  approxDay: 3,  crops: ['Wheat', 'Rice', 'Potato'],      impact: 'high',   reason: 'Fasting food demand spikes' },
  { name: 'Dussehra',       month: 9,  approxDay: 12, crops: ['Rice', 'Wheat'],                impact: 'medium', reason: 'Harvest celebrations boost buying' },
  { name: 'Diwali',         month: 9,  approxDay: 31, crops: ['Wheat', 'Rice', 'Maize'],       impact: 'high',   reason: 'High gifting & food demand' },
  { name: 'Gurpurab',       month: 10, approxDay: 15, crops: ['Wheat', 'Rice'],                impact: 'medium', reason: 'Langar supplies increase demand' },
  { name: 'Lohri',          month: 0,  approxDay: 13, crops: ['Maize', 'Sugarcane', 'Wheat'],  impact: 'high',   reason: 'Festival harvest celebration, prices peak' },
  { name: 'Makar Sankranti',month: 0,  approxDay: 14, crops: ['Maize', 'Rice', 'Sugarcane'],   impact: 'medium', reason: 'Traditional food purchases' },
  { name: 'Holi',           month: 2,  approxDay: 25, crops: ['Wheat', 'Rice'],                impact: 'medium', reason: 'Food demand rises before harvest' },
  { name: 'Baisakhi',       month: 3,  approxDay: 13, crops: ['Wheat'],                        impact: 'low',    reason: 'Harvest begins — prices stabilise' },
  { name: 'Eid',            month: 3,  approxDay: 10, crops: ['Rice', 'Wheat', 'Onion'],       impact: 'medium', reason: 'Festive cooking demand' },
  { name: 'Christmas',      month: 11, approxDay: 25, crops: ['Wheat', 'Rice', 'Potato'],      impact: 'low',    reason: 'Moderate food demand increase' },
];

/** Returns the next N upcoming festivals from today */
export function getUpcomingFestivals(count = 4): FestivalEntry[] {
  const today   = new Date();
  const thisYear = today.getFullYear();

  const withDates = FESTIVAL_CALENDAR.map((f) => {
    let date = new Date(thisYear, f.month, f.approxDay);
    if (date < today) date = new Date(thisYear + 1, f.month, f.approxDay);
    return { ...f, date };
  });

  withDates.sort((a, b) => a.date.getTime() - b.date.getTime());
  return withDates.slice(0, count);
}

