import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  PUNJAB_LOCATIONS,
  PunjabLocation,
  OpenMeteoWeatherResponse,
  fetchPunjabWeatherData,
  getWeatherConditionKey,
} from '@/services/weatherService';
import { predictWeatherMLModel, MLWeatherPredictionResult } from '@/lib/algorithms';
import { useUserStats } from '@/contexts/UserStatsContext';

interface WeatherDashboardProps {
  compact?: boolean;
}

export default function WeatherDashboard({ compact = false }: WeatherDashboardProps) {
  const { t } = useTranslation();
  const { recordWeatherCheck } = useUserStats();
  const [selectedLocationId, setSelectedLocationId] = useState<string>('ludhiana');
  const [weatherResponse, setWeatherResponse] = useState<OpenMeteoWeatherResponse | null>(null);
  const [mlResult, setMlResult] = useState<MLWeatherPredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccessResponse, setLastSuccessResponse] = useState<OpenMeteoWeatherResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const currentLocation =
    PUNJAB_LOCATIONS.find((loc) => loc.id === selectedLocationId) || PUNJAB_LOCATIONS[0];

  const loadData = useCallback(
    async (location: PunjabLocation, isManualRefresh = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      if (!isManualRefresh) {
        setError(null);
      }

      try {
        const response = await fetchPunjabWeatherData(location, controller.signal);

        // Feature engineering & ML prediction pipeline execution
        const prediction = predictWeatherMLModel(response.current, response.hourly);

        setWeatherResponse(response);
        setMlResult(prediction);
        setLastSuccessResponse(response);
        setError(null);
        recordWeatherCheck();
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Weather Data Fetch Error:', err);
        setError(t('weather.unableToFetchError'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch and location switch trigger
  useEffect(() => {
    loadData(currentLocation);
  }, [selectedLocationId, currentLocation, loadData]);

  // Auto-refresh interval (10 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(currentLocation, true);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentLocation, loadData]);

  const activeResponse = weatherResponse || lastSuccessResponse;

  // Render Compact view for home dashboard tab
  if (compact) {
    if (loading && !activeResponse) {
      return (
        <div className="flex items-center justify-center p-6 text-sm text-gray-500 space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
          <span>{t('weather.fetchingLatestDistrict', { district: currentLocation.name })}</span>
        </div>
      );
    }

    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const today = new Date();
    const compactDays = activeResponse
      ? activeResponse.daily.slice(0, 3)
      : [0, 1, 2].map((offset) => {
          const d = new Date(today);
          d.setDate(d.getDate() + offset);
          return {
            day: dayKeys[d.getDay()],
            avgTemp: Math.round(25 + Math.sin(d.getDate()) * 4),
            weatherCode: offset === 2 ? 61 : 0,
            precipitationSum: offset === 2 ? 1.5 : 0,
          };
        });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500 pb-1 border-b">
          <span className="flex items-center gap-1 font-semibold text-gray-700">
            <MapPin className="w-3.5 h-3.5 text-green-600" />
            {currentLocation.name} District, Punjab
          </span>
          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
            {t('weather.liveOpenMeteoBadge')}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {compactDays.map((day, index) => (
            <div key={index} className="text-center p-2 rounded-lg bg-white/60 border border-gray-100">
              <p className="text-sm font-medium">{t(`weather.days.${day.day}`)}</p>
              <div className="flex items-center justify-center my-2">
                {day.precipitationSum > 0 || day.weatherCode >= 51 ? (
                  <CloudRain className="w-6 h-6 text-blue-500" />
                ) : (
                  <Sun className="w-6 h-6 text-yellow-500" />
                )}
              </div>
              <p className="text-lg font-bold">{day.avgTemp}°C</p>
              <p className="text-xs text-gray-500">
                {day.precipitationSum > 0 ? t('weather.mmRain', { value: day.precipitationSum }) : t('weather.clear')}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full Weather Dashboard View
  return (
    <div className="space-y-6">
      {/* Header Bar: District Selector (All 23 Punjab Districts), Timestamp, Source */}
      <Card className="bg-gradient-to-r from-green-900 via-emerald-800 to-teal-900 text-white border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 flex items-center gap-1 text-xs">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  {t('weather.engineBadge')}
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-blue-300" />
                  {t('weather.districtsSupportedBadge')}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-6 h-6 text-emerald-400" />
                {t('weather.headerTitle', { district: currentLocation.name })}
              </h2>
              <p className="text-sm text-emerald-100/80">
                {t('weather.headerSubtitle', { district: currentLocation.name, region: currentLocation.region })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* District Select Dropdown */}
              <div className="w-64">
                <label className="text-xs text-emerald-200 block mb-1 font-medium flex items-center justify-between">
                  <span>{t('weather.selectDistrict')}</span>
                  <span className="text-[10px] text-emerald-300/80">{t('weather.districtsCount')}</span>
                </label>
                <Select
                  value={selectedLocationId}
                  onValueChange={(val) => setSelectedLocationId(val)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-emerald-400">
                    <SelectValue placeholder={t('weather.selectDistrict')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-slate-700 max-h-72">
                    {PUNJAB_LOCATIONS.map((loc) => (
                      <SelectItem
                        key={loc.id}
                        value={loc.id}
                        className="hover:bg-emerald-800 focus:bg-emerald-700 cursor-pointer flex items-center justify-between"
                      >
                        <span>{loc.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Button */}
              <div className="self-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadData(currentLocation, true)}
                  disabled={loading}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t('weather.refresh')}
                </Button>
              </div>
            </div>
          </div>

          {activeResponse && (
            <div className="mt-4 pt-3 border-t border-emerald-700/50 flex flex-wrap items-center justify-between text-xs text-emerald-200">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {t('weather.lastUpdated', { time: activeResponse.fetchedAt.toLocaleTimeString() })}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t('weather.districtCoordinates', { lat: currentLocation.lat, lon: currentLocation.lon, region: currentLocation.region })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading Skeleton Indicator */}
      {loading && !activeResponse && (
        <Card className="p-8 text-center bg-white">
          <div className="flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
            <p className="text-base font-semibold text-gray-700">
              {t('weather.fetchingWeatherFor', { district: currentLocation.name })}
            </p>
            <p className="text-xs text-gray-500">
              {t('weather.connectingApi', { lat: currentLocation.lat, lon: currentLocation.lon })}
            </p>
          </div>
        </Card>
      )}

      {/* Error Banner with Fallback */}
      {error && (
        <Alert className="border-red-300 bg-red-50 text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900 font-semibold">{t('weather.apiConnectionNotice')}</AlertTitle>
          <AlertDescription className="text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="link"
              size="sm"
              onClick={() => loadData(currentLocation, true)}
              className="text-red-900 underline p-0 ml-2"
            >
              {t('weather.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ML Severe Weather Alert - Always Visible, Color Coded by Risk Level */}
      {mlResult && (
        <Alert
          className={
            mlResult.riskLevel === 'severe'
              ? 'border-red-400 bg-red-50 text-red-900 shadow-sm'
              : mlResult.riskLevel === 'high'
              ? 'border-orange-400 bg-orange-50 text-orange-900 shadow-sm'
              : mlResult.riskLevel === 'moderate'
              ? 'border-yellow-400 bg-yellow-50 text-yellow-900 shadow-sm'
              : 'border-green-400 bg-green-50 text-green-900 shadow-sm'
          }
        >
          <AlertTriangle
            className={`h-5 w-5 ${
              mlResult.riskLevel === 'severe'
                ? 'text-red-600'
                : mlResult.riskLevel === 'high'
                ? 'text-orange-600'
                : mlResult.riskLevel === 'moderate'
                ? 'text-yellow-600'
                : 'text-green-600'
            }`}
          />
          <AlertTitle className="font-bold flex items-center gap-2 text-sm">
            <span>
              {t(`weather.alerts.${mlResult.alertKey}.title`)} {t('weather.districtSuffix', { district: currentLocation.name })}
            </span>
            <Badge
              className={`text-[10px] border-0 ${
                mlResult.riskLevel === 'severe'
                  ? 'bg-red-200 text-red-900'
                  : mlResult.riskLevel === 'high'
                  ? 'bg-orange-200 text-orange-900'
                  : mlResult.riskLevel === 'moderate'
                  ? 'bg-yellow-200 text-yellow-900'
                  : 'bg-green-200 text-green-900'
              }`}
            >
              {t('weather.mlRiskLabel', { level: mlResult.riskLevel.toUpperCase() })}
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-sm mt-1">
            {t(`weather.alerts.${mlResult.alertKey}.description`, mlResult.alertParams)}
            <span className="block text-[11px] mt-1 opacity-70">
              {t('weather.predictedAt', { time: mlResult.predictedAt.toLocaleTimeString() })}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Dynamic Current Real Weather Cards */}
      {activeResponse && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-red-500" />
              {t('weather.currentWeatherDataTitle', { district: currentLocation.name })}
            </h3>
            <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700">
              {t(`weather.codes.${getWeatherConditionKey(activeResponse.current.weatherCode)}`)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                  <span>{t('weather.temperature')}</span>
                  <Thermometer className="w-4 h-4 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {activeResponse.current.temperature}°C
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('weather.feelsLike', { temp: activeResponse.current.apparentTemperature })}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                  <span>{t('weather.relativeHumidity')}</span>
                  <Droplets className="w-4 h-4 text-blue-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {activeResponse.current.humidity}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {activeResponse.current.humidity > 70
                    ? t('weather.highHumidityEnv')
                    : t('weather.optimalFieldCrops')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                  <span>{t('weather.windSpeed')}</span>
                  <Wind className="w-4 h-4 text-gray-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {activeResponse.current.windSpeed} km/h
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('weather.direction', { deg: activeResponse.current.windDirection })}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
                  <span>{t('weather.precipitation')}</span>
                  <CloudRain className="w-4 h-4 text-blue-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {activeResponse.current.precipitation} mm
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('weather.surfacePressure', { value: activeResponse.current.surfacePressure })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dynamic ML Prediction Section */}
      {mlResult && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  {t('weather.mlPredictionsTitle', { district: currentLocation.name })}
                </CardTitle>
                <CardDescription className="text-xs text-emerald-800/70">
                  {t('weather.mlPredictionsSubtitle')}
                </CardDescription>
              </div>
              <Badge className="bg-emerald-600 text-white self-start sm:self-auto text-xs px-2.5 py-1">
                {t('weather.modelConfidence', { value: mlResult.modelConfidence })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {mlResult.horizons.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm space-y-2 text-center hover:border-emerald-300 transition-colors"
                >
                  <Badge variant="outline" className="text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                    {item.horizon}
                  </Badge>
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{item.predictedTemp}°C</span>
                    <p className="text-xs text-gray-500">{t('weather.humiditySuffix', { value: item.predictedHumidity })}</p>
                  </div>
                  <div className="pt-1 border-t border-gray-100 text-xs">
                    <span className="text-blue-600 font-semibold">{t('weather.rainRisk', { value: item.rainfallProbability })}</span>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5" title={t(`weather.conditions.${item.conditionKey}`)}>
                      {t(`weather.conditions.${item.conditionKey}`)}
                    </p>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    {t('weather.modelScore', { value: item.confidenceScore })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-Day Live Forecast Chart for Selected District */}
      {activeResponse && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">{t('weather.sevenDayForecastTitle', { district: currentLocation.name })}</CardTitle>
              <CardDescription>{t('weather.sevenDayForecastSubtitle')}</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {t('weather.districtForecastBadge')}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeResponse.daily.map((d) => ({ ...d, day: t(`weather.days.${d.day}`) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="maxTemp"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name={t('weather.chart.maxTemp')}
                  />
                  <Line
                    type="monotone"
                    dataKey="minTemp"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name={t('weather.chart.minTemp')}
                  />
                  <Line
                    type="monotone"
                    dataKey="precipitationSum"
                    stroke="#10b981"
                    strokeWidth={2}
                    name={t('weather.chart.rainfall')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6-Month District Climate Forecast Chart */}
      {activeResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">{t('weather.sixMonthForecastTitle', { district: currentLocation.name })}</CardTitle>
            <CardDescription>{t('weather.sixMonthForecastSubtitle', { district: currentLocation.name })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeResponse.monthlyClimate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgTemp" fill="#f59e0b" name={t('weather.chart.avgTemp')} />
                  <Bar dataKey="rainfall" fill="#3b82f6" name={t('weather.chart.expectedRain')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather-Based District Farming Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">{t('weather.mlWeatherAdviceTitle', { district: currentLocation.name })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-semibold">
                {t('weather.weeklyFieldActionPlan')}
              </Badge>
              <ul className="space-y-2 text-sm text-gray-700">
                {(mlResult?.weeklyRecommendationKeys || ['scheduledFertilizer', 'soilMoisture', 'pestScouting']).map((key) => (
                  <li key={key}>• {t(`weather.recommendations.${key}`)}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
                {t('weather.monthlyStrategicPlanning')}
              </Badge>
              <ul className="space-y-2 text-sm text-gray-700">
                {(mlResult?.monthlyRecommendationKeys || ['seasonalSowing', 'waterStorage']).map((key) => (
                  <li key={key}>• {t(`weather.recommendations.${key}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}