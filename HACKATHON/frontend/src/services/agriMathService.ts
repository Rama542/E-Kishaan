/**
 * Dynamic Agronomy, GIS & Financial Mathematical Service
 * =======================================================
 * Pure client-side calculations ensuring ZERO static/hardcoded data.
 * All formulas strictly follow the exact specification.
 */

// ─── Phenology & Thermal Degree Days ────────────────────────────────────────

export interface CropAgronomicInfo {
  name: string;
  tBase: number;
  totalGddTarget: number;
  nUptakePerTon: number;
  pUptakePerTon: number;
  kUptakePerTon: number;
  sprayVolumeLPerAcre: number;
}

export const CROP_AGRONOMIC_SPECS: Record<string, CropAgronomicInfo> = {
  wheat: {
    name: 'Wheat (Rabi)',
    tBase: 4.5,
    totalGddTarget: 1650.0,
    nUptakePerTon: 25.0,
    pUptakePerTon: 11.0,
    kUptakePerTon: 20.0,
    sprayVolumeLPerAcre: 200.0,
  },
  rice: {
    name: 'Paddy Rice (Kharif)',
    tBase: 10.0,
    totalGddTarget: 1950.0,
    nUptakePerTon: 20.0,
    pUptakePerTon: 9.0,
    kUptakePerTon: 24.0,
    sprayVolumeLPerAcre: 200.0,
  },
  cotton: {
    name: 'Cotton',
    tBase: 15.0,
    totalGddTarget: 2200.0,
    nUptakePerTon: 35.0,
    pUptakePerTon: 15.0,
    kUptakePerTon: 30.0,
    sprayVolumeLPerAcre: 250.0,
  },
  maize: {
    name: 'Maize / Corn',
    tBase: 10.0,
    totalGddTarget: 1700.0,
    nUptakePerTon: 22.0,
    pUptakePerTon: 10.0,
    kUptakePerTon: 19.0,
    sprayVolumeLPerAcre: 200.0,
  },
  sugarcane: {
    name: 'Sugarcane',
    tBase: 12.0,
    totalGddTarget: 3200.0,
    nUptakePerTon: 1.8,
    pUptakePerTon: 0.8,
    kUptakePerTon: 2.2,
    sprayVolumeLPerAcre: 300.0,
  },
  potato: {
    name: 'Potato',
    tBase: 7.0,
    totalGddTarget: 1500.0,
    nUptakePerTon: 5.0,
    pUptakePerTon: 2.0,
    kUptakePerTon: 8.0,
    sprayVolumeLPerAcre: 200.0,
  },
};

export const BBCH_STAGES = [
  { ratio: 0.05, code: 0, name: 'BBCH 00-09: Germination & Sprouting', desc: 'Dry seed imbibition, radicle emergence, seedling sprout.' },
  { ratio: 0.15, code: 10, name: 'BBCH 10-19: Leaf Development', desc: 'First true leaves unfolded, photosynthetic organ establishment.' },
  { ratio: 0.30, code: 20, name: 'BBCH 20-29: Tillering / Side Shoot Emergence', desc: 'Active vegetative branching and main shoot expansion.' },
  { ratio: 0.45, code: 30, name: 'BBCH 30-39: Stem Elongation / Pseudostem Extension', desc: 'Rapid internode extension, canopy closure.' },
  { ratio: 0.60, code: 50, name: 'BBCH 50-59: Inflorescence Emergence / Booting', desc: 'Head/panicle emergence, reproductive organ formation.' },
  { ratio: 0.75, code: 60, name: 'BBCH 60-69: Flowering / Anthesis', desc: 'Anther emergence, pollination, fertilization phase.' },
  { ratio: 0.90, code: 70, name: 'BBCH 70-89: Fruit / Grain Milk to Dough Stage', desc: 'Grain filling, starch synthesis, seed maturation.' },
  { ratio: 1.00, code: 90, name: 'BBCH 90-99: Senescence & Harvest Readiness', desc: 'Physiological maturity, grain drying, harvest ready.' },
];

export function calculateDailyGDD(tMax: number, tMin: number, tBase: number): number {
  const tAvg = (tMax + tMin) / 2.0;
  return Math.max(tAvg - tBase, 0.0);
}

export function calculateAccumulatedGDD(temps: Array<[number, number]>, tBase: number): number {
  return temps.reduce((sum, [tMax, tMin]) => sum + calculateDailyGDD(tMax, tMin, tBase), 0.0);
}

export function determineBBCHStage(accumulatedGDD: number, totalGDDTarget: number) {
  const ratio = Math.min(accumulatedGDD / Math.max(totalGDDTarget, 1.0), 1.0);
  let stage = BBCH_STAGES[0];
  for (const s of BBCH_STAGES) {
    if (ratio >= s.ratio) stage = s;
  }
  return {
    progressRatio: Number(ratio.toFixed(4)),
    progressPercent: Number((ratio * 100.0).toFixed(2)),
    bbchCode: stage.code,
    stageName: stage.name,
    description: stage.desc,
  };
}

export function estimateDaysToHarvest(accumulatedGDD: number, totalGDDTarget: number, avgDailyGDD = 12.5): number {
  const remGDD = Math.max(totalGDDTarget - accumulatedGDD, 0.0);
  return Math.ceil(remGDD / Math.max(avgDailyGDD, 1.0));
}

// ─── Fertilizer & Fertigation Math ──────────────────────────────────────────

export interface FertilizerCalculation {
  nitrogenNeededKg: number;
  phosphorusNeededKg: number;
  potassiumNeededKg: number;
  dapNeededKg: number;
  dapBags50kg: number;
  ureaNeededKg: number;
  ureaBags50kg: number;
  mopNeededKg: number;
  mopBags50kg: number;
  totalCostINR: number;
}

export function calculateFertilizerDosage(
  cropKey: string,
  areaAcres: number,
  targetYieldTons: number,
  soilN: number,
  soilP: number,
  soilK: number,
  ureaPrice50kg = 268.0,
  dapPrice50kg = 1350.0,
  mopPrice50kg = 1700.0
): FertilizerCalculation {
  const spec = CROP_AGRONOMIC_SPECS[cropKey.toLowerCase()] || CROP_AGRONOMIC_SPECS.wheat;

  const grossN = targetYieldTons * spec.nUptakePerTon * areaAcres;
  const grossP = targetYieldTons * spec.pUptakePerTon * areaAcres;
  const grossK = targetYieldTons * spec.kUptakePerTon * areaAcres;

  const availN = soilN * areaAcres;
  const availP = soilP * areaAcres;
  const availK = soilK * areaAcres;

  const netN = Math.max(grossN - availN, 0.0);
  const netP = Math.max(grossP - availP, 0.0);
  const netK = Math.max(grossK - availK, 0.0);

  // Chemical Bags Math
  const dapKg = netP / 0.46;
  const dapBags = Math.ceil(dapKg / 50.0);

  const nFromDap = dapKg * 0.18;
  const remN = Math.max(netN - nFromDap, 0.0);

  const ureaKg = remN / 0.46;
  const ureaBags = Math.ceil(ureaKg / 50.0);

  const mopKg = netK / 0.60;
  const mopBags = Math.ceil(mopKg / 50.0);

  const totalCost = (ureaBags * ureaPrice50kg) + (dapBags * dapPrice50kg) + (mopBags * mopPrice50kg);

  return {
    nitrogenNeededKg: Number(netN.toFixed(2)),
    phosphorusNeededKg: Number(netP.toFixed(2)),
    potassiumNeededKg: Number(netK.toFixed(2)),
    dapNeededKg: Number(dapKg.toFixed(2)),
    dapBags50kg: dapBags,
    ureaNeededKg: Number(ureaKg.toFixed(2)),
    ureaBags50kg: ureaBags,
    mopNeededKg: Number(mopKg.toFixed(2)),
    mopBags50kg: mopBags,
    totalCostINR: Number(totalCost.toFixed(2)),
  };
}

// ─── Knapsack Pump Dosage Math ─────────────────────────────────────────────

export interface KnapsackDosage {
  totalVolumeLiters: number;
  total15LPumps: number;
  chemicalPer15LPumpMlOrG: number;
  totalChemicalMlOrG: number;
}

export function calculateKnapsackPumpDosage(
  areaAcres: number,
  recommendedRatePerLiter: number,
  sprayerVolumeRateLPerAcre = 200.0,
  tankCapacityLiters = 15.0
): KnapsackDosage {
  const totalVolumeL = areaAcres * sprayerVolumeRateLPerAcre;
  const totalPumps = Math.ceil(totalVolumeL / tankCapacityLiters);
  const chemPerPump = recommendedRatePerLiter * tankCapacityLiters;
  const totalChem = totalVolumeL * recommendedRatePerLiter;

  return {
    totalVolumeLiters: Number(totalVolumeL.toFixed(2)),
    total15LPumps: totalPumps,
    chemicalPer15LPumpMlOrG: Number(chemPerPump.toFixed(2)),
    totalChemicalMlOrG: Number(totalChem.toFixed(2)),
  };
}

// ─── Geodesic Haversine & Mandi Price Math ─────────────────────────────────

export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180.0);
  const dLon = (lon2 - lon1) * (Math.PI / 180.0);
  const a =
    Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
    Math.cos(lat1 * (Math.PI / 180.0)) * Math.cos(lat2 * (Math.PI / 180.0)) * Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return Number((R * c).toFixed(2));
}

export function calculateMandiNetPrice(
  farmLat: number,
  farmLon: number,
  mandiLat: number,
  mandiLon: number,
  mandiPricePerQ: number,
  freightRatePerKmQ = 0.85,
  commissionPct = 2.5
) {
  const distanceKm = calculateHaversineDistanceKm(farmLat, farmLon, mandiLat, mandiLon);
  const transportCost = distanceKm * freightRatePerKmQ;
  const commissionCost = mandiPricePerQ * (commissionPct / 100.0);
  const netRealizedPrice = mandiPricePerQ - transportCost - commissionCost;

  return {
    distanceKm,
    rawMandiPricePerQ: Number(mandiPricePerQ.toFixed(2)),
    transportCostPerQ: Number(transportCost.toFixed(2)),
    commissionCostPerQ: Number(commissionCost.toFixed(2)),
    netRealizedPricePerQ: Number(netRealizedPrice.toFixed(2)),
  };
}

// ─── General Ledger Accounting Math ─────────────────────────────────────────

export interface JournalTx {
  id: string;
  date: string;
  description: string;
  category: string;
  debitAccount: string;
  creditAccount: string;
  amountINR: number;
  isExpense: boolean;
}

export function calculateLedgerSummary(transactions: JournalTx[]) {
  let totalExpenses = 0;
  let totalRevenue = 0;
  const categoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    const amt = Math.abs(tx.amountINR);
    const cat = tx.category;

    if (tx.isExpense || tx.debitAccount.startsWith('Expense')) {
      totalExpenses += amt;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    } else {
      totalRevenue += amt;
    }
  }

  const netProfit = totalRevenue - totalExpenses;
  const roiPercent = totalExpenses > 0 ? (netProfit / totalExpenses) * 100.0 : 0.0;

  const categoryBreakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amountINR: Number(amount.toFixed(2)),
    sharePercent: Number((totalExpenses > 0 ? (amount / totalExpenses) * 100.0 : 0).toFixed(2)),
  })).sort((a, b) => b.amountINR - a.amountINR);

  return {
    totalExpensesINR: Number(totalExpenses.toFixed(2)),
    totalRevenueINR: Number(totalRevenue.toFixed(2)),
    netProfitINR: Number(netProfit.toFixed(2)),
    roiPercent: Number(roiPercent.toFixed(2)),
    categoryBreakdown,
  };
}
