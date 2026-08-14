import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf, Droplets, Zap, AlertCircle, TrendingUp, Plus, RefreshCw, Layers, ShieldCheck, CloudRain } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

import { useUserStats } from '@/contexts/UserStatsContext';
import { toast } from '@/components/ui/sonner';
import { PunjabMapSelector } from '@/components/PunjabMapSelector';
import {
  fetchDistricts,
  fetchSoilReport,
  fetchSoilHistory,
  fetchSoilRecommendations,
  compareDistricts,
  triggerAdminETLSync,
  postFertilizerLog,
  DEFAULT_DISTRICTS_LIST,
  PUNJAB_DATASET_FALLBACK,
  DistrictSummary,
  DistrictSoilReport,
  SoilHistoryPoint,
  DistrictComparisonData,
} from '@/services/soilService';

export default function SoilFertility() {
  const { t } = useTranslation();
  const { recordFertilizerLog } = useUserStats();

  const [districts, setDistricts] = useState<DistrictSummary[]>(DEFAULT_DISTRICTS_LIST);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Ludhiana');
  const [comparisonDistrict, setComparisonDistrict] = useState<string>('Amritsar');

  const [soilReport, setSoilReport] = useState<DistrictSoilReport>(PUNJAB_DATASET_FALLBACK['Ludhiana']);
  const [history, setHistory] = useState<SoilHistoryPoint[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<DistrictComparisonData | null>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [fertilizerInput, setFertilizerInput] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Load districts list on mount
  useEffect(() => {
    async function loadDistrictsList() {
      const list = await fetchDistricts();
      if (list.length > 0) {
        setDistricts(list);
      }
    }
    loadDistrictsList();
  }, []);

  // Sync report, history, recommendations whenever selectedDistrict changes
  useEffect(() => {
    async function loadDistrictData() {
      const [rep, hist, rec] = await Promise.all([
        fetchSoilReport(selectedDistrict),
        fetchSoilHistory(selectedDistrict),
        fetchSoilRecommendations(selectedDistrict),
      ]);
      if (rep) setSoilReport(rep);
      if (hist) setHistory(hist);
      if (rec) setRecommendations(rec);
    }
    loadDistrictData();
  }, [selectedDistrict]);

  // Sync comparison data whenever comparison district or selected district changes
  useEffect(() => {
    async function loadComparison() {
      if (selectedDistrict === comparisonDistrict) return;
      const comp = await compareDistricts(selectedDistrict, comparisonDistrict);
      if (comp) setComparisonData(comp);
    }
    loadComparison();
  }, [selectedDistrict, comparisonDistrict]);

  const handleDistrictChange = (name: string) => {
    setSelectedDistrict(name);
    if (PUNJAB_DATASET_FALLBACK[name]) {
      setSoilReport(PUNJAB_DATASET_FALLBACK[name]);
    }
  };

  const handleAdminETLSync = async () => {
    setIsSyncing(true);
    const ok = await triggerAdminETLSync();
    if (ok) {
      toast.success(t('soil.toast.syncSuccess'));
      const rep = await fetchSoilReport(selectedDistrict);
      if (rep) setSoilReport(rep);
    } else {
      toast.error(t('soil.toast.syncError'));
    }
    setIsSyncing(false);
  };

  const handleFertilizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(fertilizerInput.nitrogen) || 0;
    const p = parseFloat(fertilizerInput.phosphorus) || 0;
    const k = parseFloat(fertilizerInput.potassium) || 0;

    if (n === 0 && p === 0 && k === 0) {
      toast.error(t('soil.toast.fertilizerEmptyError'));
      return;
    }

    const success = await postFertilizerLog({
      nitrogen: n,
      phosphorus: p,
      potassium: k,
      date: fertilizerInput.date,
    });

    if (success) {
      recordFertilizerLog();
      toast.success(t('soil.toast.fertilizerSuccess', { district: selectedDistrict }));
      setFertilizerInput({
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        date: new Date().toISOString().split('T')[0],
      });
    } else {
      toast.error(t('soil.toast.fertilizerError'));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-teal-600 bg-teal-50 border-teal-200';
    if (score >= 55) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const npkBarData = soilReport
    ? [
        { name: t('soil.overview.nitrogen'), current: soilReport.nutrients.nitrogen, benchmark: 90, unit: 'kg/ha' },
        { name: t('soil.overview.phosphorus'), current: soilReport.nutrients.phosphorus, benchmark: 25, unit: 'kg/ha' },
        { name: t('soil.overview.potassium'), current: soilReport.nutrients.potassium, benchmark: 180, unit: 'kg/ha' },
      ]
    : [];

  const radarData = soilReport
    ? [
        { subject: t('soil.overview.nitrogen'), A: Math.min(100, Math.round((soilReport.nutrients.nitrogen / 100) * 100)), fullMark: 100 },
        { subject: t('soil.overview.phosphorus'), A: Math.min(100, Math.round((soilReport.nutrients.phosphorus / 30) * 100)), fullMark: 100 },
        { subject: t('soil.overview.potassium'), A: Math.min(100, Math.round((soilReport.nutrients.potassium / 200) * 100)), fullMark: 100 },
        { subject: t('soil.cards.organicCarbon'), A: Math.min(100, Math.round((soilReport.organicCarbon / 0.75) * 100)), fullMark: 100 },
        { subject: t('soil.overview.sulphur'), A: Math.min(100, Math.round((soilReport.nutrients.sulphur / 15) * 100)), fullMark: 100 },
        { subject: t('soil.overview.zinc'), A: Math.min(100, Math.round((soilReport.nutrients.zinc / 1.5) * 100)), fullMark: 100 },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header with District Selector & Admin Sync */}
      <Card className="shadow-sm border-emerald-100 bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/30">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Leaf className="w-6 h-6 text-emerald-600" />
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t('soil.headerTitle')}
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600 mt-1">
                {t('soil.headerSubtitle')}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-gray-700">{t('soil.districtLabel')}</Label>
                <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                  <SelectTrigger className="w-48 bg-white border-emerald-300 shadow-sm font-bold text-emerald-900">
                    <SelectValue placeholder={t('soil.districtLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d.name} value={d.name} className="font-medium">
                        {d.name} ({d.healthScore} pts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={handleAdminETLSync}
                disabled={isSyncing}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? t('soil.syncingEtl') : t('soil.refreshDatasets')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Punjab Map & District Selector Grid */}
      <PunjabMapSelector
        districts={districts}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleDistrictChange}
      />

      {/* Main Key Indicators Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border-t-4 border-t-emerald-500 shadow-sm ${getScoreColor(soilReport.soilHealthScore)}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              {t('soil.cards.soilHealthScore')}
              <ShieldCheck className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{soilReport.soilHealthScore} / 100</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-emerald-700 text-white">{soilReport.soilHealthStatus}</Badge>
              <span className="text-xs text-gray-500">{t('soil.cards.icarBenchmark')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              {t('soil.cards.soilTypeTexture')}
              <Layers className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">{soilReport.soilType}</div>
            <p className="text-xs text-gray-500 mt-1">
              {soilReport.soilTexture} • {soilReport.soilDepth}
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              {t('soil.cards.soilPhSalinity')}
              <Zap className="w-4 h-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              pH {soilReport.soilPh} <span className="text-sm font-normal text-gray-500">({soilReport.electricalConductivity} dS/m)</span>
            </div>
            <Progress value={Math.min(100, (soilReport.soilPh / 14) * 100)} className="h-2 mt-2 bg-gray-200" />
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              {t('soil.cards.organicCarbon')}
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{soilReport.organicCarbon}%</div>
            <p className="text-xs text-gray-500 mt-1">{t('soil.cards.organicCarbonTarget')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualizations & Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('soil.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="history">{t('soil.tabs.history')}</TabsTrigger>
          <TabsTrigger value="recommendations">{t('soil.tabs.recommendations')}</TabsTrigger>
          <TabsTrigger value="compare">{t('soil.tabs.compare')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('soil.overview.macronutrientsTitle')}</CardTitle>
                <CardDescription>{t('soil.overview.macronutrientsDesc', { district: selectedDistrict })}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={npkBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#059669" name={t('soil.overview.currentLevel')} />
                      <Bar dataKey="benchmark" fill="#94a3b8" name={t('soil.overview.idealBenchmark')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('soil.overview.radarTitle')}</CardTitle>
                <CardDescription>{t('soil.overview.radarDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name={selectedDistrict} dataKey="A" stroke="#059669" fill="#10b981" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Micronutrients Breakdown Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                {t('soil.overview.micronutrientsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-xs text-gray-500">{t('soil.overview.sulphur')}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{soilReport.nutrients.sulphur} ppm</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-xs text-gray-500">{t('soil.overview.zinc')}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{soilReport.nutrients.zinc} ppm</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-xs text-gray-500">{t('soil.overview.iron')}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{soilReport.nutrients.iron} ppm</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-xs text-gray-500">{t('soil.overview.copper')}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{soilReport.nutrients.copper} ppm</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-xs text-gray-500">{t('soil.overview.manganese')}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{soilReport.nutrients.manganese} ppm</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-xs text-gray-500">{t('soil.overview.boron')}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{soilReport.nutrients.boron} ppm</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-xs text-gray-500">{t('soil.overview.calcium')}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{soilReport.nutrients.calcium} meq</div>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <div className="text-xs text-gray-500">{t('soil.overview.magnesium')}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{soilReport.nutrients.magnesium} meq</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('soil.history.title')}</CardTitle>
              <CardDescription>{t('soil.history.description', { district: selectedDistrict })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.length > 0 ? history : [
                    { month: 'Jun', nitrogen: 90, phosphorus: 27, potassium: 180, healthScore: 84 },
                    { month: 'Jul', nitrogen: 92, phosphorus: 28, potassium: 182, healthScore: 85 },
                    { month: 'Aug', nitrogen: 93, phosphorus: 28, potassium: 183, healthScore: 86 },
                    { month: 'Sep', nitrogen: 94, phosphorus: 29, potassium: 184, healthScore: 87 },
                    { month: 'Oct', nitrogen: 95, phosphorus: 29, potassium: 185, healthScore: 88 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="nitrogen" stroke="#0088FE" name={t('soil.history.chart.nitrogen')} strokeWidth={2} />
                    <Line type="monotone" dataKey="phosphorus" stroke="#00C49F" name={t('soil.history.chart.phosphorus')} strokeWidth={2} />
                    <Line type="monotone" dataKey="potassium" stroke="#FFBB28" name={t('soil.history.chart.potassium')} strokeWidth={2} />
                    <Line type="monotone" dataKey="healthScore" stroke="#10b981" name={t('soil.history.chart.healthScore')} strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Fertilizer Logger Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                {t('soil.history.loggerTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFertilizerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="nitrogen">{t('soil.history.nitrogenAdded')}</Label>
                    <Input
                      id="nitrogen"
                      type="number"
                      placeholder="e.g. 25"
                      value={fertilizerInput.nitrogen}
                      onChange={(e) => setFertilizerInput({ ...fertilizerInput, nitrogen: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phosphorus">{t('soil.history.phosphorusAdded')}</Label>
                    <Input
                      id="phosphorus"
                      type="number"
                      placeholder="e.g. 18"
                      value={fertilizerInput.phosphorus}
                      onChange={(e) => setFertilizerInput({ ...fertilizerInput, phosphorus: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="potassium">{t('soil.history.potassiumAdded')}</Label>
                    <Input
                      id="potassium"
                      type="number"
                      placeholder="e.g. 20"
                      value={fertilizerInput.potassium}
                      onChange={(e) => setFertilizerInput({ ...fertilizerInput, potassium: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">{t('soil.history.applicationDate')}</Label>
                    <Input
                      id="date"
                      type="date"
                      value={fertilizerInput.date}
                      onChange={(e) => setFertilizerInput({ ...fertilizerInput, date: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {t('soil.history.recordLogEntry')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  {t('soil.recommendations.fertilizerDosageTitle')}
                </CardTitle>
                <CardDescription>{t('soil.recommendations.fertilizerDosageDesc', { district: selectedDistrict })}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(recommendations?.fertilizers || [
                    { name: 'Urea', dosage_kg_per_acre: 115, stage: 'Split dose: 50% Basal, 25% Tillering', frequency: '3 Splits' },
                    { name: 'DAP (Di-ammonium Phosphate)', dosage_kg_per_acre: 52, stage: 'Full dose at Sowing', frequency: 'Single' },
                    { name: 'MOP (Muriate of Potash)', dosage_kg_per_acre: 30, stage: 'Basal Dose at Sowing', frequency: 'Single' },
                    { name: 'Organic Vermicompost', dosage_kg_per_acre: 1000, stage: 'Land Preparation', frequency: 'Annual' },
                  ]).map((f: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{f.name || f.fertilizer_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{f.stage || f.application_stage}</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-600 text-white font-bold">
                          {f.dosage_kg_per_acre || f.dosageKgPerAcre} kg/acre
                        </Badge>
                        <div className="text-[11px] text-gray-500 mt-0.5">{f.frequency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-blue-600" />
                  {t('soil.recommendations.irrigationTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="font-semibold text-blue-900">{t('soil.recommendations.recommendedIrrigation')}</div>
                  <p className="text-sm text-blue-700 mt-1">{soilReport.recommendedIrrigation}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <div className="text-xs text-gray-500">{t('soil.recommendations.liveTemperature')}</div>
                    <div className="font-bold text-gray-900 mt-0.5">{soilReport.weather.temp}°C</div>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <div className="text-xs text-gray-500">{t('soil.recommendations.soilMoisture')}</div>
                    <div className="font-bold text-blue-600 mt-0.5">{soilReport.weather.moisture}%</div>
                  </div>
                </div>

                <Alert className="bg-emerald-50 border-emerald-200">
                  <AlertCircle className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-800">{t('soil.recommendations.topRecommendedCrop')}</AlertTitle>
                  <AlertDescription className="text-emerald-700 font-medium">
                    {soilReport.recommendedCrop}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>{t('soil.compare.title')}</CardTitle>
                  <CardDescription>{t('soil.compare.description')}</CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger className="w-36 bg-white">
                      <SelectValue placeholder={districts[0]?.name} />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm font-bold text-gray-400">{t('soil.compare.vs')}</span>
                  <Select value={comparisonDistrict} onValueChange={setComparisonDistrict}>
                    <SelectTrigger className="w-36 bg-white">
                      <SelectValue placeholder={districts[1]?.name} />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {comparisonData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg text-emerald-950">{comparisonData.district1.district}</h4>
                      <Badge className="bg-emerald-600">{comparisonData.district1.soilHealthScore} pts</Badge>
                    </div>
                    <div className="text-sm text-emerald-800">
                      <div><strong>{t('soil.compare.soilType')}</strong> {comparisonData.district1.soilType}</div>
                      <div><strong>{t('soil.compare.ph')}</strong> {comparisonData.district1.soilPh}</div>
                      <div><strong>{t('soil.compare.organicCarbon')}</strong> {comparisonData.district1.organicCarbon}%</div>
                      <div><strong>{t('soil.compare.nitrogen')}</strong> {comparisonData.district1.nutrients.nitrogen} kg/ha</div>
                      <div><strong>{t('soil.compare.recommendedCrop')}</strong> {comparisonData.district1.recommendedCrop}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg text-teal-950">{comparisonData.district2.district}</h4>
                      <Badge className="bg-teal-600">{comparisonData.district2.soilHealthScore} pts</Badge>
                    </div>
                    <div className="text-sm text-teal-800">
                      <div><strong>{t('soil.compare.soilType')}</strong> {comparisonData.district2.soilType}</div>
                      <div><strong>{t('soil.compare.ph')}</strong> {comparisonData.district2.soilPh}</div>
                      <div><strong>{t('soil.compare.organicCarbon')}</strong> {comparisonData.district2.organicCarbon}%</div>
                      <div><strong>{t('soil.compare.nitrogen')}</strong> {comparisonData.district2.nutrients.nitrogen} kg/ha</div>
                      <div><strong>{t('soil.compare.recommendedCrop')}</strong> {comparisonData.district2.recommendedCrop}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">{t('soil.compare.loading')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}