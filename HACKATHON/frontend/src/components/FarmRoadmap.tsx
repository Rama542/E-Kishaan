import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MapPin,
  Calendar,
  Clock,
  Droplets,
  Zap,
  TrendingUp,
  Sparkles,
  User,
  ShieldCheck,
  Bell,
  BookOpen,
  Send,
  BarChart3,
  Layers,
  Bot,
  Filter,
  CheckCircle2,
  AlertTriangle,
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
  LineChart,
  Line,
} from 'recharts';
import { toast } from '@/components/ui/sonner';

import {
  getFarmProfile,
  saveFarmProfile,
  getFarmDashboard,
  getTodayTasks,
  getUpcomingTasks,
  getRoadmapTimeline,
  getSmartAlerts,
  getDiaryHistory,
  submitDailyDiary,
  getFarmCharts,
  updateTaskStatus,
  FarmOnboardingProfile,
  DashboardMetrics,
  DailyPlannerTask,
  UpcomingTaskGroup,
  TimelineMilestone,
  SmartAlert,
  FarmDailyDiary,
  FarmChartsData,
} from '@/services/roadmapService';
import { DEFAULT_DISTRICTS_LIST } from '@/services/soilService';

export default function FarmRoadmap() {
  const { t } = useTranslation();
  const [district, setDistrict] = useState<string>('Ludhiana');
  const [fieldFilter, setFieldFilter] = useState<string>('All Fields');
  const [cropFilter, setCropFilter] = useState<string>('All Crops');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<FarmOnboardingProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [todayTasks, setTodayTasks] = useState<DailyPlannerTask[]>([]);
  const [upcomingGroups, setUpcomingGroups] = useState<UpcomingTaskGroup[]>([]);
  const [timeline, setTimeline] = useState<TimelineMilestone[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [diaryHistory, setDiaryHistory] = useState<FarmDailyDiary[]>([]);
  const [charts, setCharts] = useState<FarmChartsData | null>(null);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState<boolean>(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<Partial<FarmOnboardingProfile>>({});

  // Diary Form State
  const [diaryForm, setDiaryForm] = useState<FarmDailyDiary>({
    checkInDate: new Date().toISOString().split('T')[0],
    irrigated: false,
    fertilizerApplied: false,
    fertilizerDetails: '',
    pestsObserved: false,
    diseaseSymptoms: '',
    rainfallObserved: false,
    laborersCount: 2,
    notes: '',
  });

  // Assistant Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [inputQuery, setInputQuery] = useState<string>('');

  // Fetch all backend API data dynamically
  const loadAllBackendData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        profRes,
        dashRes,
        todayRes,
        upcomingRes,
        timelineRes,
        alertsRes,
        diaryRes,
        chartsRes,
      ] = await Promise.all([
        getFarmProfile(district),
        getFarmDashboard(district),
        getTodayTasks(district),
        getUpcomingTasks(district),
        getRoadmapTimeline(district),
        getSmartAlerts(district),
        getDiaryHistory(),
        getFarmCharts(district),
      ]);

      setProfile(profRes);
      setProfileForm(profRes);
      setDashboard(dashRes);
      setTodayTasks(todayRes);
      setUpcomingGroups(upcomingRes);
      setTimeline(timelineRes);
      setAlerts(alertsRes);
      setDiaryHistory(diaryRes);
      setCharts(chartsRes);

      if (chatMessages.length === 0) {
        setChatMessages([
          {
            sender: 'ai',
            text: t('roadmap.assistant.greeting', {
              name: profRes.farmerName,
              district: profRes.district,
              crop: profRes.currentCrop,
            }),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch roadmap API data:', err);
      toast.error(t('roadmap.toast.backendError'));
    } finally {
      setIsLoading(false);
    }
  }, [district]);

  useEffect(() => {
    loadAllBackendData();
  }, [loadAllBackendData]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveFarmProfile(profileForm);
      toast.success(t('roadmap.toast.profileUpdated'));
      setIsOnboardingOpen(false);
      await loadAllBackendData();
    } catch (err) {
      toast.error(t('roadmap.toast.profileUpdateFailed'));
    }
  };

  const handleDiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitDailyDiary(diaryForm);
      toast.success(t('roadmap.toast.diarySuccess'));
      setIsDiaryOpen(false);
      setDiaryForm({
        checkInDate: new Date().toISOString().split('T')[0],
        irrigated: false,
        fertilizerApplied: false,
        fertilizerDetails: '',
        pestsObserved: false,
        diseaseSymptoms: '',
        rainfallObserved: false,
        laborersCount: 2,
        notes: '',
      });
      await loadAllBackendData();
    } catch (err) {
      toast.error(t('roadmap.toast.diaryFailed'));
    }
  };

  const handleTaskAction = async (taskId: string, status: 'Completed' | 'Skipped' | 'Delayed') => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success(t('roadmap.toast.taskStatusSuccess', { status: t(`roadmap.status.${status}`, status) }));
      await loadAllBackendData();
    } catch (err) {
      toast.error(t('roadmap.toast.taskStatusFailed'));
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const newMessages = [...chatMessages, { sender: 'user' as const, text: q }];
    setChatMessages(newMessages);
    if (!textToSend) setInputQuery('');

    setTimeout(() => {
      let aiAns = t('roadmap.assistant.waterBalanceAnswer', {
        name: profile?.farmerName || t('roadmap.assistant.defaultFarmerName'),
        value: dashboard?.waterBalancePercent || 80,
      });
      const qLower = q.toLowerCase();
      if (qLower.includes('irrigate') || qLower.includes('water')) {
        aiAns = t('roadmap.assistant.irrigateAnswer', { district });
      } else if (qLower.includes('fertilizer') || qLower.includes('urea')) {
        aiAns = t('roadmap.assistant.fertilizerAnswer', { stage: profile?.growthStage || t('roadmap.assistant.defaultGrowthStage') });
      } else if (qLower.includes('today')) {
        aiAns = t('roadmap.assistant.todayAnswer', { task: todayTasks[0]?.taskName || t('roadmap.assistant.defaultTaskName') });
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: aiAns }]);
    }, 600);
  };

  const getPriorityColor = (p: string) => {
    if (p === 'Critical') return 'bg-red-600 text-white';
    if (p === 'High') return 'bg-amber-600 text-white';
    if (p === 'Medium') return 'bg-blue-600 text-white';
    return 'bg-emerald-600 text-white';
  };

  if (isLoading && !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-xl bg-slate-200" />
          <Skeleton className="h-28 w-full rounded-xl bg-slate-200" />
          <Skeleton className="h-28 w-full rounded-xl bg-slate-200" />
          <Skeleton className="h-28 w-full rounded-xl bg-slate-200" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Profile Header */}
      <Card className="shadow-sm border-emerald-100 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-400 text-emerald-950 font-bold px-2.5 py-0.5">
                  {t('roadmap.aiTwinBadge')}
                </Badge>
                <span className="text-emerald-200 text-xs font-semibold">
                  {t('roadmap.districtVillageLabel', {
                    district: profile?.district || district || 'Ludhiana',
                    village: profile?.village || 'Gill',
                  })}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
                {t('roadmap.pageTitle')}
              </h1>
              <p className="text-emerald-100 text-sm">
                {t('roadmap.farmerLine', {
                  name: profile?.farmerName || 'Gurpreet Singh',
                  acres: profile?.farmSizeAcres || 2.5,
                  fields: profile?.numFields || 2,
                  crop: profile?.currentCrop || 'Sugarcane',
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Onboarding Dialog Trigger */}
              <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold shadow-sm">
                    <User className="w-4 h-4 mr-2" />
                    {t('roadmap.editProfile')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-emerald-950">{t('roadmap.profileDialog.title')}</DialogTitle>
                    <DialogDescription>
                      {t('roadmap.profileDialog.description')}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleProfileSave} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('roadmap.profileDialog.farmerName')}</Label>
                        <Input
                          value={profileForm.farmerName || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, farmerName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{t('roadmap.profileDialog.district')}</Label>
                        <select
                          value={profileForm.district || district}
                          onChange={(e) => {
                            setProfileForm({ ...profileForm, district: e.target.value });
                            setDistrict(e.target.value);
                          }}
                          className="w-full mt-1 p-2 border rounded-md font-medium"
                        >
                          {DEFAULT_DISTRICTS_LIST.map((d) => (
                            <option key={d.name} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('roadmap.profileDialog.village')}</Label>
                        <Input
                          value={profileForm.village || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, village: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{t('roadmap.profileDialog.landArea')}</Label>
                        <Input
                          type="number"
                          value={profileForm.farmSizeAcres || 5}
                          onChange={(e) => setProfileForm({ ...profileForm, farmSizeAcres: parseFloat(e.target.value) || 1 })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('roadmap.profileDialog.currentCrop')}</Label>
                        <Input
                          value={profileForm.currentCrop || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, currentCrop: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>{t('roadmap.profileDialog.growthStage')}</Label>
                        <Input
                          value={profileForm.growthStage || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, growthStage: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <DialogFooter className="mt-4">
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                        {t('roadmap.profileDialog.save')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* End-of-Day Check-In Trigger */}
              <Dialog open={isDiaryOpen} onOpenChange={setIsDiaryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-amber-400 text-amber-300 hover:bg-emerald-950 font-bold">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t('roadmap.checkIn')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-emerald-950">{t('roadmap.diaryDialog.title')}</DialogTitle>
                    <DialogDescription>
                      {t('roadmap.diaryDialog.description')}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleDiarySubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="irrigated"
                          checked={diaryForm.irrigated}
                          onChange={(e) => setDiaryForm({ ...diaryForm, irrigated: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="irrigated" className="font-semibold">{t('roadmap.diaryDialog.irrigatedQuestion')}</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="fertilizerApplied"
                          checked={diaryForm.fertilizerApplied}
                          onChange={(e) => setDiaryForm({ ...diaryForm, fertilizerApplied: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="fertilizerApplied" className="font-semibold">{t('roadmap.diaryDialog.fertilizerQuestion')}</Label>
                      </div>

                      {diaryForm.fertilizerApplied && (
                        <div>
                          <Label className="text-xs">{t('roadmap.diaryDialog.fertilizerDetailsLabel')}</Label>
                          <Input
                            placeholder={t('roadmap.diaryDialog.fertilizerPlaceholder')}
                            value={diaryForm.fertilizerDetails}
                            onChange={(e) => setDiaryForm({ ...diaryForm, fertilizerDetails: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="pestsObserved"
                          checked={diaryForm.pestsObserved}
                          onChange={(e) => setDiaryForm({ ...diaryForm, pestsObserved: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="pestsObserved" className="font-semibold">{t('roadmap.diaryDialog.pestsQuestion')}</Label>
                      </div>

                      <div>
                        <Label className="text-xs">{t('roadmap.diaryDialog.laborersLabel')}</Label>
                        <Input
                          type="number"
                          value={diaryForm.laborersCount}
                          onChange={(e) => setDiaryForm({ ...diaryForm, laborersCount: parseInt(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">{t('roadmap.diaryDialog.notesLabel')}</Label>
                        <Input
                          placeholder={t('roadmap.diaryDialog.notesPlaceholder')}
                          value={diaryForm.notes}
                          onChange={(e) => setDiaryForm({ ...diaryForm, notes: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                        {t('roadmap.diaryDialog.submit')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Interactive Filter Toolbar */}
      <Card className="shadow-sm bg-slate-50 border-slate-200">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-sm text-gray-800">{t('roadmap.filters.label')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-gray-600">{t('roadmap.filters.district')}</Label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900"
              >
                {DEFAULT_DISTRICTS_LIST.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-gray-600">{t('roadmap.filters.field')}</Label>
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-900"
              >
                <option value="All Fields">{t('roadmap.filters.allFields')}</option>
                <option value="Field 1">{t('roadmap.filters.field1')}</option>
                <option value="Field 2">{t('roadmap.filters.field2')}</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-gray-600">{t('roadmap.filters.crop')}</Label>
              <select
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-900"
              >
                <option value="All Crops">{t('roadmap.filters.allCrops')}</option>
                <option value="Wheat">Wheat</option>
                <option value="Paddy">Paddy</option>
                <option value="Mustard">Mustard</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Digital Farm Twin Overview Metric Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-t-4 border-t-blue-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                {t('roadmap.dashboard.soilWaterBalance')}
                <Droplets className="w-4 h-4 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboard.waterBalancePercent}%</div>
              <Progress value={dashboard.waterBalancePercent} className="h-2 mt-2 bg-gray-200" />
              <p className="text-xs text-gray-500 mt-1">{dashboard.weatherSummary}</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                {t('roadmap.dashboard.nutrientAvailability')}
                <Zap className="w-4 h-4 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboard.nutrientBalancePercent}%</div>
              <Progress value={dashboard.nutrientBalancePercent} className="h-2 mt-2 bg-gray-200" />
              <p className="text-xs text-gray-500 mt-1">{dashboard.soilSummary}</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                {t('roadmap.dashboard.expectedTotalYield')}
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-amber-900">{dashboard.yieldPrediction}</div>
              <p className="text-xs text-gray-500 mt-1">{t('roadmap.dashboard.aiConfidence', { value: dashboard.aiConfidence })}</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                {t('roadmap.dashboard.expectedNetProfit')}
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{dashboard.profitPrediction}</div>
              <p className="text-xs text-gray-500 mt-1">
                {t('roadmap.dashboard.harvestCountdown', { days: dashboard.harvestCountdownDays })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dynamic Sections: Daily Planner, Upcoming, Timeline, Alerts, Charts & AI Assistant */}
      <Tabs defaultValue="planner" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="planner">{t('roadmap.tabs.planner')}</TabsTrigger>
          <TabsTrigger value="upcoming">{t('roadmap.tabs.upcoming')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('roadmap.tabs.alerts')}</TabsTrigger>
          <TabsTrigger value="timeline">{t('roadmap.tabs.timeline')}</TabsTrigger>
          <TabsTrigger value="charts">{t('roadmap.tabs.charts')}</TabsTrigger>
          <TabsTrigger value="assistant">{t('roadmap.tabs.assistant')}</TabsTrigger>
        </TabsList>

        {/* Today's Farm Plan Tab */}
        <TabsContent value="planner" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    {t('roadmap.planner.title')} (`GET /api/farm/today`)
                  </CardTitle>
                  <CardDescription>
                    {t('roadmap.planner.fetchedFor', {
                      crop: profile?.currentCrop || 'Sugarcane',
                      district: district || 'Ludhiana',
                    })}
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-700 text-white font-bold">{t('roadmap.planner.tasksReturned', { count: todayTasks.length })}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">{t('roadmap.planner.noTasks')}</div>
              ) : (
                todayTasks.map((t2) => (
                  <div key={t2.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(t2.priority)}>
                          {t('roadmap.planner.prioritySuffix', { priority: t(`roadmap.priority.${t2.priority}`, t2.priority) })}
                        </Badge>
                        <h4 className="font-bold text-gray-900 text-base">{t2.taskName}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          <Clock className="w-3 h-3 mr-1" /> {t2.estimatedTime}
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-800">
                          {t('roadmap.planner.dueLabel', { deadline: t2.deadline })}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600">{t2.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3 border rounded-lg">
                      <div>
                        <span className="font-semibold text-gray-700">{t('roadmap.planner.aiContextLabel')}</span>
                        <p className="text-gray-600 mt-0.5">{t2.reason}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-800">{t('roadmap.planner.expectedBenefitLabel')}</span>
                        <p className="text-emerald-700 mt-0.5">{t2.benefits}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="text-xs text-red-600 font-medium">
                        {t('roadmap.planner.consequenceLabel', { risk: t2.risk })}
                      </div>

                      <div className="flex items-center gap-2">
                        {t2.status === 'Completed' ? (
                          <Badge className="bg-emerald-600">{t('roadmap.planner.completedBadge')}</Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleTaskAction(t2.id, 'Completed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                            >
                              {t('roadmap.planner.markCompleted')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTaskAction(t2.id, 'Skipped')}
                              className="text-gray-600 hover:bg-gray-100 font-medium text-xs"
                            >
                              {t('roadmap.planner.skip')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTaskAction(t2.id, 'Delayed')}
                              className="text-amber-700 border-amber-300 hover:bg-amber-50 font-medium text-xs"
                            >
                              {t('roadmap.planner.delay')}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Tasks Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">
                {t('roadmap.upcoming.title')} (`GET /api/farm/upcoming`)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {upcomingGroups.map((g) => (
                <div key={g.groupName} className="space-y-3">
                  <h3 className="font-bold text-lg text-emerald-950 flex items-center gap-2 border-b pb-1">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    {g.groupName}
                  </h3>
                  {g.tasks.map((t2) => (
                    <div key={t2.id} className="p-3 bg-white border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(t2.priority)}>{t(`roadmap.priority.${t2.priority}`, t2.priority)}</Badge>
                          <span className="font-bold text-gray-900 text-sm">{t2.taskName}</span>
                        </div>
                        <span className="text-xs text-emerald-700 font-semibold">{t2.deadline}</span>
                      </div>
                      <p className="text-xs text-gray-600">{t2.reason}</p>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                {t('roadmap.alerts.title')} (`GET /api/farm/alerts`)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 border rounded-xl space-y-2 ${
                    a.severity === 'Critical'
                      ? 'bg-red-50/70 border-red-200'
                      : a.severity === 'High'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-blue-50/70 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(a.severity)}>{t(`roadmap.priority.${a.severity}`, a.severity)}</Badge>
                      <h4 className="font-bold text-gray-900 text-base">{a.title}</h4>
                    </div>
                    <span className="text-xs text-gray-500">{a.generatedTime}</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div>
                      <strong className="text-gray-900">{t('roadmap.alerts.whyLabel')}</strong> {a.reason}
                    </div>
                    <div>
                      <strong className="text-emerald-900">{t('roadmap.alerts.recommendedActionLabel')}</strong> {a.recommendedAction}
                    </div>
                    <div>
                      <strong className="text-red-900">{t('roadmap.alerts.impactLabel')}</strong> {a.impact}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 14-Phase Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                {t('roadmap.timeline.title')} (`GET /api/farm/timeline`)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-emerald-300 ml-4 space-y-6 pl-6 py-2">
                {timeline.map((p) => (
                  <div key={p.timelineId} className="relative group">
                    <div
                      className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${
                        p.currentStatus === 'Completed'
                          ? 'bg-emerald-600'
                          : p.currentStatus === 'In Progress'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-slate-400'
                      }`}
                    >
                      {p.stageNumber}
                    </div>

                    <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-lg">
                            {t('roadmap.timeline.phaseLabel', { num: p.stageNumber, name: p.stageName })}
                          </h4>
                          <Badge
                            className={
                              p.currentStatus === 'Completed'
                                ? 'bg-emerald-600'
                                : p.currentStatus === 'In Progress'
                                ? 'bg-amber-500'
                                : 'bg-slate-500'
                            }
                          >
                            {t(`roadmap.status.${p.currentStatus}`, p.currentStatus)}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {p.startDate} → {p.endDate}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 font-medium">
                        <strong>{t('roadmap.timeline.aiStrategyLabel')}</strong> {p.aiNotes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {charts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    {t('roadmap.charts.taskCompletionTitle')} (`GET /api/farm/charts`)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.taskCompletionTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" fill="#059669" name={t('roadmap.charts.completedLegend')} />
                        <Bar dataKey="target" fill="#94a3b8" name={t('roadmap.charts.targetLegend')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    {t('roadmap.charts.yieldTrendTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={charts.yieldForecastTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="stage" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="yieldQ" stroke="#d97706" strokeWidth={3} name={t('roadmap.charts.predictedYieldLegend')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="assistant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-600" />
                {t('roadmap.assistant.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 overflow-y-auto border rounded-xl p-4 bg-slate-50 space-y-3">
                {chatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-xl text-sm ${
                        m.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-white border text-gray-900 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder={t('roadmap.assistant.inputPlaceholder')}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
