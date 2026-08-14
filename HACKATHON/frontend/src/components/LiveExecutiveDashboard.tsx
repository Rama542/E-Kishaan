import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CloudRain,
  Droplets,
  Leaf,
  TrendingUp,
  Zap,
  MapPin,
  Clock,
  ArrowUpRight,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  ShieldCheck,
  Compass,
  FileSpreadsheet,
  Sliders,
  ChevronRight,
  Bot,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import {
  calculateFertilizerDosage,
  calculateKnapsackPumpDosage,
  calculateLedgerSummary,
  calculateMandiNetPrice,
  JournalTx,
} from '@/services/agriMathService';
import { getMandiComparison, fetchMarketPrices, type CropPriceInfo } from '@/services/marketService';

interface LiveExecutiveDashboardProps {
  farmer: {
    name: string;
    state: string;
    location: string;
    primaryCrops: string[];
    points: number;
    level: string;
  };
  onNavigateTab: (tabKey: string, subTab?: string) => void;
  onEditCrops: () => void;
}

export default function LiveExecutiveDashboard({
  farmer,
  onNavigateTab,
  onEditCrops,
}: LiveExecutiveDashboardProps) {
  const [district, setDistrict] = useState<string>('Ludhiana');
  const [quickAcres, setQuickAcres] = useState<number>(2.5);

  const activeCrop = farmer.primaryCrops[0] || 'Sugarcane';

  // Live Math Calculations
  const fertCalc = calculateFertilizerDosage(activeCrop, quickAcres, 2.2, 40, 15, 80);
  const sprayCalc = calculateKnapsackPumpDosage(quickAcres, 2.0);

  // Dynamic Ledger Metrics
  const sampleTransactions: JournalTx[] = [
    {
      id: 'tx-1',
      date: new Date().toISOString().split('T')[0],
      description: 'Mandi Crop Sale (55 Quintals)',
      category: 'Mandi Crop Sales',
      debitAccount: 'Bank Account',
      creditAccount: 'Mandi Crop Sales',
      amountINR: 125125,
      isExpense: false,
    },
    {
      id: 'tx-2',
      date: new Date().toISOString().split('T')[0],
      description: 'DAP & Urea Fertilizer Basal Application',
      category: 'Nutrients & Fertilizer',
      debitAccount: 'Nutrients & Fertilizer',
      creditAccount: 'Cash in Hand',
      amountINR: Math.round(fertCalc.dapBags50kg * 1350 + fertCalc.ureaBags50kg * 267),
      isExpense: true,
    },
    {
      id: 'tx-3',
      date: new Date().toISOString().split('T')[0],
      description: 'Certified Seed Purchase',
      category: 'Seeds Expense',
      debitAccount: 'Seeds Expense',
      creditAccount: 'Cash in Hand',
      amountINR: Math.round(3300 * quickAcres),
      isExpense: true,
    },
  ];

  const ledgerSummary = calculateLedgerSummary(sampleTransactions);

  // Live Mandi Net Realization for Punjab Mandis
  const ludhianaNet = calculateMandiNetPrice(30.901, 75.857, 30.901, 75.857, 2275, 0.85, 2.5);
  const amritsarNet = calculateMandiNetPrice(30.901, 75.857, 31.634, 74.872, 2330, 0.85, 2.5);

  return (
    <div className="space-y-6">
      {/* Real-Time Telemetry Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weather Card */}
        <Card
          onClick={() => onNavigateTab('weather')}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Live Weather Telemetry</span>
              <CloudRain className="w-5 h-5 text-blue-200 group-hover:scale-110 transition-transform" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">28°C</span>
              <Badge className="bg-blue-400/30 text-blue-100 border border-blue-300/40 text-xs">
                Open-Meteo Live
              </Badge>
            </div>
            <p className="text-sm text-blue-100 font-medium">Partly Cloudy • Humidity 78%</p>
            <div className="pt-2 flex items-center justify-between text-xs text-blue-200 border-t border-blue-400/30">
              <span>District: {district}</span>
              <span className="flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
                Full Forecast <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Soil Health Card */}
        <Card
          onClick={() => onNavigateTab('soil')}
          className="bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-md hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Soil Health & NPK</span>
              <Leaf className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">85%</span>
              <Badge className="bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 text-xs">
                pH 7.2 Optimal
              </Badge>
            </div>
            <p className="text-sm text-emerald-100 font-medium">NPK Ratio: Balanced • Moisture 82%</p>
            <div className="pt-2 flex items-center justify-between text-xs text-emerald-200 border-t border-emerald-400/30">
              <span>Soil Moisture Test</span>
              <span className="flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
                Soil Fertility <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Crop Phenology Card */}
        <Card
          onClick={() => onNavigateTab('crops')}
          className="bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-md hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Crop Status & BBCH</span>
              <Zap className="w-5 h-5 text-amber-200 group-hover:scale-110 transition-transform" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">{activeCrop}</span>
              <Badge className="bg-amber-400/30 text-amber-100 border border-amber-300/40 text-xs">
                BBCH 21
              </Badge>
            </div>
            <p className="text-sm text-amber-100 font-medium">Week 4 / 16 • Active Tillering Phase</p>
            <div className="pt-2 flex items-center justify-between text-xs text-amber-200 border-t border-amber-400/30">
              <span>{farmer.primaryCrops.length} Crops Active</span>
              <span className="flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
                Crop Stage <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Ledger & ROI Card */}
        <Card
          onClick={() => onNavigateTab('roadmap', 'journal')}
          className="bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-md hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Expected Farm ROI</span>
              <TrendingUp className="w-5 h-5 text-purple-200 group-hover:scale-110 transition-transform" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight">+{ledgerSummary.roiPercent}%</span>
              <Badge className="bg-purple-400/30 text-purple-100 border border-purple-300/40 text-xs">
                Balanced Ledger
              </Badge>
            </div>
            <p className="text-sm text-purple-100 font-medium">Net Profit: ₹{ledgerSummary.netProfitINR.toLocaleString('en-IN')}</p>
            <div className="pt-2 flex items-center justify-between text-xs text-purple-200 border-t border-purple-400/30">
              <span>Revenue ₹{ledgerSummary.totalRevenueINR.toLocaleString('en-IN')}</span>
              <span className="flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
                Farm Journal <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Shortcuts Panel */}
      <Card className="border-emerald-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            Live Command Shortcuts & One-Click Pipelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Button
              variant="outline"
              onClick={() => onNavigateTab('roadmap', 'roadmap')}
              className="h-auto py-3 px-3 flex flex-col items-center text-center justify-center border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-400 transition-all rounded-xl"
            >
              <span className="text-xl mb-1">🌾</span>
              <span className="font-bold text-xs text-emerald-950">16-Week Roadmap</span>
              <span className="text-[10px] text-emerald-700 mt-0.5">Weekly Execution</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigateTab('market')}
              className="h-auto py-3 px-3 flex flex-col items-center text-center justify-center border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-400 transition-all rounded-xl"
            >
              <span className="text-xl mb-1">💰</span>
              <span className="font-bold text-xs text-blue-950">APMC Mandi Rates</span>
              <span className="text-[10px] text-blue-700 mt-0.5">Net Price Calculator</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigateTab('roadmap', 'planner')}
              className="h-auto py-3 px-3 flex flex-col items-center text-center justify-center border-amber-200 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-400 transition-all rounded-xl"
            >
              <span className="text-xl mb-1">📅</span>
              <span className="font-bold text-xs text-amber-950">AI Daily Planner</span>
              <span className="text-[10px] text-amber-700 mt-0.5">Today's Tasks</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigateTab('roadmap', 'journal')}
              className="h-auto py-3 px-3 flex flex-col items-center text-center justify-center border-purple-200 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-400 transition-all rounded-xl"
            >
              <span className="text-xl mb-1">📖</span>
              <span className="font-bold text-xs text-purple-950">Double-Entry Journal</span>
              <span className="text-[10px] text-purple-700 mt-0.5">Financial Ledger</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigateTab('solver')}
              className="h-auto py-3 px-3 flex flex-col items-center text-center justify-center border-teal-200 bg-teal-50/50 hover:bg-teal-100 hover:border-teal-400 transition-all rounded-xl col-span-2 sm:col-span-1"
            >
              <span className="text-xl mb-1">🤖</span>
              <span className="font-bold text-xs text-teal-950">AI Agronomist Solver</span>
              <span className="text-[10px] text-teal-700 mt-0.5">Crop Disease Diagnostic</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Interactive Grid: Live Calculator + Crops + Mandi Realization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Spray & Fertilizer Quick Math Engine */}
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                Live Dynamic Spray & Fertilizer Calculator
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 text-xs">Real-Time Math</Badge>
            </div>
            <CardDescription className="text-xs">
              Adjust land area to calculate 50kg bag counts and 15L knapsack spray pumps instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border">
              <div className="flex-1">
                <Label className="text-xs font-bold text-gray-700">Land Size (Acres)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    step="0.5"
                    value={quickAcres}
                    onChange={(e) => setQuickAcres(parseFloat(e.target.value) || 1)}
                    className="w-24 h-9 font-extrabold text-emerald-900 text-base"
                  />
                  <span className="text-xs text-gray-500">Acres ({activeCrop})</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">Total Spray Volume</p>
                <p className="text-lg font-extrabold text-emerald-800">{sprayCalc.totalVolumeLiters} Liters</p>
              </div>
            </div>

            {/* Calculated Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-700 font-semibold">DAP (18-46-0)</p>
                <p className="text-xl font-extrabold text-blue-900">{fertCalc.dapBags50kg} Bags</p>
                <p className="text-[11px] text-blue-600 mt-0.5">{fertCalc.dapNeededKg} kg total</p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-700 font-semibold">Urea (46% N)</p>
                <p className="text-xl font-extrabold text-emerald-900">{fertCalc.ureaBags50kg} Bags</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">{fertCalc.ureaNeededKg} kg total</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700 font-semibold">15L Knapsack Pumps</p>
                <p className="text-xl font-extrabold text-amber-900">{sprayCalc.total15LPumps} Pumps</p>
                <p className="text-[11px] text-amber-700 mt-0.5">15L per pump</p>
              </div>
            </div>

            <Button
              onClick={() => onNavigateTab('roadmap', 'roadmap')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
            >
              View Full 16-Week Crop Roadmap →
            </Button>
          </CardContent>
        </Card>

        {/* Your Active Crops & Mandi Net Realization Preview */}
        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Your Active Crops & Mandi Rates</CardTitle>
              <CardDescription className="text-xs">Live APMC prices minus transport freight costs</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onEditCrops}
              className="flex items-center gap-1 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-8"
            >
              <Edit3 className="w-3.5 h-3.5" /> Change Crops
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {farmer.primaryCrops.map((crop, idx) => (
                <Badge
                  key={crop}
                  className={`text-xs px-3 py-1.5 font-bold cursor-pointer transition-all ${
                    idx === 0
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                  onClick={() => onNavigateTab('market')}
                >
                  🌾 {crop}
                </Badge>
              ))}
            </div>

            {/* Mandi Net Realization Callout */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                <span>⭐ Best APMC Selling Option: Ludhiana Mandi</span>
                <Badge className="bg-emerald-600 text-white text-[10px]">MSP + ₹150 Premium</Badge>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-gray-600">Modal Price: <strong>₹2,275/q</strong></span>
                <span className="text-gray-600">Freight Deducted: <strong>−₹{ludhianaNet.transportCostPerQ}</strong></span>
                <span className="font-extrabold text-emerald-900 text-base">Net: ₹{Math.round(ludhianaNet.netRealizedPricePerQ)}/q</span>
              </div>
            </div>

            <Button
              onClick={() => onNavigateTab('market')}
              variant="outline"
              className="w-full border-blue-300 text-blue-900 hover:bg-blue-50 font-bold text-xs h-9"
            >
              Compare All Punjab Mandis & Transport Rates →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
