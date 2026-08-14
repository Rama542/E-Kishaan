import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Sprout,
  Droplets,
  Award,
  ShieldCheck,
  BarChart3,
  Clock,
  Sparkles,
  Bug,
  FlaskConical,
  Leaf as LeafOrganic,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

import {
  fetchCropRecommendations,
  type CropRecommendationResponse,
  type CropRecommendation,
} from '@/services/cropService';
import { fetchDistricts, type DistrictSummary } from '@/services/soilService';

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 bg-gray-200 rounded-xl" />
      <div className="h-24 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-56 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  );
}

export default function CropGrowth() {
  const { t } = useTranslation();
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Ludhiana');
  const [cropData, setCropData] = useState<CropRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDistricts().then(setDistricts).catch(() => setDistricts([]));
  }, []);

  const loadCrops = useCallback(async (district: string) => {
    setIsLoading(true);
    // fetchCropRecommendations always resolves — it falls back to a locally
    // computed estimate (cropOfflineEngine.ts) when the live backend isn't
    // reachable, so there's no error branch to handle here.
    const data = await fetchCropRecommendations(district);
    setCropData(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCrops(selectedDistrict);
  }, [selectedDistrict, loadCrops]);

  const topCrop: CropRecommendation | undefined = cropData?.recommendations?.[0];

  const barChartData = (cropData?.recommendations || []).map((c) => ({
    name: c.crop.split(' ')[0],
    score: c.score,
    confidence: c.confidence,
    profitability: c.profitabilityScore,
  }));

  const radarChartData = topCrop
    ? [
        { subject: t('crop.visualizations.factors.soilMatch'), A: topCrop.factors.soilMatch, fullMark: 100 },
        { subject: t('crop.visualizations.factors.nutrientBalance'), A: topCrop.factors.nutrientBalance, fullMark: 100 },
        { subject: t('crop.visualizations.factors.climateSuitability'), A: topCrop.factors.climateSuitability, fullMark: 100 },
        { subject: t('crop.visualizations.factors.seasonalFit'), A: topCrop.factors.seasonalFit, fullMark: 100 },
        { subject: t('crop.visualizations.factors.marketPotential'), A: topCrop.factors.marketPotential, fullMark: 100 },
      ]
    : [];

  const translatedAdvisory = cropData && topCrop
    ? t('crop.advisory', {
        district: cropData.district,
        ph: cropData.soilHealth.ph,
        oc: cropData.soilHealth.oc,
        nitrogen: cropData.soilHealth.nitrogen,
        temp: cropData.weather.temp,
        moisture: cropData.weather.moisture,
        crop: topCrop.crop,
        season: t(`crop.seasons.${cropData.season}`, cropData.season),
        score: topCrop.score,
        yield: topCrop.expectedYield,
        risk: t(`crop.disease.riskLevels.${topCrop.risk}`, topCrop.risk).toLowerCase(),
      })
    : '';

  if (isLoading && !cropData) {
    return <LoadingSkeleton />;
  }

  if (!cropData) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="shadow-sm border-emerald-100 bg-gradient-to-r from-emerald-50/50 via-white to-green-50/40">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sprout className="w-7 h-7 text-emerald-600" />
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t('crop.headerTitle')}
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600 mt-1">
                {t('crop.headerSubtitle')}
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-600 text-white text-sm py-1.5 px-3">
                {t('crop.seasonLabel', { season: t(`crop.seasons.${cropData.season}`, cropData.season) })}
              </Badge>

              {cropData.source === 'live' ? (
                <Badge variant="outline" className="gap-1 text-xs border-emerald-300 text-emerald-700">
                  <Wifi className="w-3 h-3" /> {t('crop.liveBadge')}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs border-amber-300 text-amber-700" title={t('crop.estimatedTooltip')}>
                  <WifiOff className="w-3 h-3" /> {t('crop.estimatedBadge')}
                </Badge>
              )}

              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-gray-700">{t('crop.districtLabel')}</Label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={isLoading}
                  className="px-3 py-2 bg-white border border-emerald-300 rounded-md font-bold text-emerald-900 shadow-sm text-sm disabled:opacity-60"
                >
                  {districts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* AI Advisory Summary Box */}
      <Alert className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 shadow-sm">
        <Sparkles className="h-5 w-5 text-emerald-600" />
        <AlertTitle className="text-emerald-950 font-bold text-lg flex items-center gap-2">
          {t('crop.advisoryTitle', { district: cropData.district })}
        </AlertTitle>
        <AlertDescription className="text-emerald-900 mt-1 text-base leading-relaxed font-medium">
          {translatedAdvisory}
        </AlertDescription>
      </Alert>

      {/* Top Crop Hero Card */}
      {topCrop && (
        <Card className="border-2 border-emerald-500 shadow-md bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-400" />
                  <span className="text-emerald-200 text-sm font-semibold uppercase tracking-wider">
                    {t('crop.topCropBadge')}
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-white">{topCrop.crop}</h2>
                <p className="text-emerald-100 text-sm">
                  {topCrop.category} • {t('crop.rankings.expectedYield')}: <span className="font-bold text-amber-300">{topCrop.expectedYield}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="text-center bg-emerald-950/60 p-3 rounded-xl border border-emerald-700/50">
                  <div className="text-xs text-emerald-300">{t('crop.suitabilityScore')}</div>
                  <div className="text-3xl font-bold text-amber-400">{topCrop.score} / 100</div>
                  <Badge className="mt-1 bg-emerald-600">{topCrop.status}</Badge>
                </div>

                <div className="text-center bg-emerald-950/60 p-3 rounded-xl border border-emerald-700/50">
                  <div className="text-xs text-emerald-300">{t('crop.confidenceIndex')}</div>
                  <div className="text-3xl font-bold text-emerald-300">{topCrop.confidence}%</div>
                  <div className="text-[11px] text-emerald-200 mt-1">{t('crop.aiVerified')}</div>
                </div>

                <div className="text-center bg-emerald-950/60 p-3 rounded-xl border border-emerald-700/50">
                  <div className="text-xs text-emerald-300">{t('crop.expectedMarketPrice')}</div>
                  <div className="text-2xl font-bold text-white">{topCrop.expectedPrice}</div>
                  <div className="text-[11px] text-emerald-200 mt-1">{t('crop.demandLabel', { demand: topCrop.marketDemand })}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="rankings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rankings">{t('crop.tabs.rankings')}</TabsTrigger>
          <TabsTrigger value="visualizations">{t('crop.tabs.visualizations')}</TabsTrigger>
          <TabsTrigger value="timeline">{t('crop.tabs.timeline')}</TabsTrigger>
          <TabsTrigger value="disease">{t('crop.tabs.disease')}</TabsTrigger>
        </TabsList>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(cropData.recommendations || []).map((c, idx) => (
              <Card key={c.crop} className="border-green-100 hover:border-emerald-400 transition-all shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-emerald-500 text-emerald-700 font-bold">
                      #{idx + 1} {c.category}
                    </Badge>
                    <Badge className={c.score >= 85 ? 'bg-emerald-600' : 'bg-teal-600'}>{c.score} pts</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mt-2">{c.crop}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-gray-500">{t('crop.rankings.expectedYield')}</span>
                    <span className="font-semibold text-gray-900">{c.expectedYield}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-gray-500">{t('crop.rankings.waterRequirement')}</span>
                    <span className="font-semibold text-blue-600">{c.waterRequirement}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-gray-500">{t('crop.rankings.fertilizerDose')}</span>
                    <span className="font-semibold text-emerald-800 text-xs">{c.fertilizer}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-gray-500">{t('crop.rankings.marketPriceTrend')}</span>
                    <span className="font-bold text-amber-700">{c.expectedPrice}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500">{t('crop.rankings.riskProfile')}</span>
                    <Badge className={c.risk === 'Low' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                      {t('crop.rankings.riskSuffix', { risk: t(`crop.disease.riskLevels.${c.risk}`, c.risk) })}
                    </Badge>
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{t('crop.rankings.aiModelConfidence')}</span>
                      <span className="font-bold text-gray-800">{c.confidence}%</span>
                    </div>
                    <Progress value={c.confidence} className="h-1.5 bg-gray-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Visualizations Tab */}
        <TabsContent value="visualizations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  {t('crop.visualizations.chartTitle')}
                </CardTitle>
                <CardDescription>{t('crop.visualizations.chartDesc', { district: selectedDistrict })}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="score" fill="#059669" name={t('crop.visualizations.suitabilityScoreLegend')} />
                      <Bar dataKey="profitability" fill="#d97706" name={t('crop.visualizations.profitabilityIndexLegend')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  {t('crop.visualizations.factorAnalysisTitle')}
                </CardTitle>
                <CardDescription>{t('crop.visualizations.factorAnalysisDesc', { crop: topCrop?.crop || t('crop.visualizations.theTopCrop') })}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarChartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name={topCrop?.crop || 'Crop'} dataKey="A" stroke="#059669" fill="#10b981" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Growth Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                {t('crop.timeline.title', { crop: topCrop?.crop || t('crop.timeline.topCrop') })}
              </CardTitle>
              <CardDescription>
                {t('crop.timeline.description', { crop: topCrop?.crop || t('crop.visualizations.theTopCrop'), days: topCrop?.growingDays ?? '–' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-center">
                {(topCrop?.growthStages || []).map((stage) => (
                  <div
                    key={stage.stage}
                    className={`p-4 border rounded-xl space-y-2 ${
                      stage.stage === topCrop?.growthStages.length
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 mx-auto text-white rounded-full flex items-center justify-center font-bold ${
                        stage.stage === topCrop?.growthStages.length ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}
                    >
                      {stage.stage}
                    </div>
                    <div className="font-bold text-gray-900">{stage.name}</div>
                    <div className="text-xs text-gray-500">{t('crop.timeline.dayRange', { start: stage.dayStart, end: stage.dayEnd })}</div>
                    <p className={`text-[11px] ${stage.stage === topCrop?.growthStages.length ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {stage.advice}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-blue-50/50">
            <CardContent className="p-4 flex items-start gap-3">
              <Droplets className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                {t('crop.timeline.waterFooter', { crop: topCrop?.crop, water: topCrop?.waterRequirement, days: topCrop?.growingDays })}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disease & Pest Alerts Tab */}
        <TabsContent value="disease" className="space-y-4">
          <Alert className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-sm">
            <Bug className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-950 font-bold">{t('crop.disease.alertTitle')}</AlertTitle>
            <AlertDescription className="text-red-900 mt-1 text-sm leading-relaxed">
              {t('crop.disease.alertDescription', {
                temp: cropData.weather?.temp,
                humidity: cropData.weather?.humidity,
                rainfall: cropData.weather?.rainfall,
                nitrogen: cropData.soilHealth?.nitrogen,
                district: selectedDistrict,
              })}
            </AlertDescription>
          </Alert>

          {(cropData.recommendations || []).map((c) => (
            <Card key={c.crop} className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                  {c.crop}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {c.diseaseRisks && c.diseaseRisks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.diseaseRisks.map((d) => (
                      <div
                        key={d.disease}
                        className={
                          d.riskLevel === 'High'
                            ? 'p-4 rounded-xl border border-red-300 bg-red-50'
                            : d.riskLevel === 'Medium'
                            ? 'p-4 rounded-xl border border-amber-300 bg-amber-50'
                            : 'p-4 rounded-xl border border-gray-200 bg-gray-50'
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Bug className="w-4 h-4 text-gray-600 shrink-0" />
                            <span className="font-bold text-gray-900">{d.disease}</span>
                          </div>
                          <Badge
                            className={
                              d.riskLevel === 'High'
                                ? 'bg-red-600 text-white'
                                : d.riskLevel === 'Medium'
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-400 text-white'
                            }
                          >
                            {t('crop.disease.riskSuffix', { risk: t(`crop.disease.riskLevels.${d.riskLevel}`, d.riskLevel) })}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{d.type} • {d.symptoms}</p>
                        <p className="text-xs text-gray-600 italic mt-2">{d.reason}</p>

                        <div className="mt-3 space-y-1.5 text-sm">
                          <div className="flex items-start gap-2">
                            <FlaskConical className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <span><span className="font-semibold text-gray-800">{t('crop.disease.pesticideLabel')} </span>{d.pesticide}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <LeafOrganic className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span><span className="font-semibold text-gray-800">{t('crop.disease.organicLabel')} </span>{d.organicAlternative}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                            <span><span className="font-semibold text-gray-800">{t('crop.disease.precautionLabel')} </span>{d.precaution}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{t('crop.disease.noData')}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
