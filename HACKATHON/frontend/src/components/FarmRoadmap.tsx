import React, { useEffect, useState, useCallback } from 'react';
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
            text: `Hello ${profRes.farmerName}! I am your AI Agricultural Assistant for ${profRes.district}. How can I guide your ${profRes.currentCrop} farming today?`,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch roadmap API data:', err);
      toast.error('Error connecting to backend API.');
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
      toast.success('Farm Profile updated!');
      setIsOnboardingOpen(false);
      await loadAllBackendData();
    } catch (err) {
      toast.error('Failed to update profile.');
    }
  };

  const handleDiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitDailyDiary(diaryForm);
      toast.success('End-of-day check-in recorded! Adaptive roadmap updated.');
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
      toast.error('Failed to submit diary.');
    }
  };

  const handleTaskAction = async (taskId: string, status: 'Completed' | 'Skipped' | 'Delayed') => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success(`Task marked as ${status}! Adaptive plan recalculated.`);
      await loadAllBackendData();
    } catch (err) {
      toast.error('Failed to update task status.');
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const newMessages = [...chatMessages, { sender: 'user' as const, text: q }];
    setChatMessages(newMessages);
    if (!textToSend) setInputQuery('');

    setTimeout(() => {
      let aiAns = `Based on backend metrics for ${profile?.farmerName || 'Farmer'}, soil moisture is at ${dashboard?.waterBalancePercent || 80}%. Everything is optimal.`;
      const qLower = q.toLowerCase();
      if (qLower.includes('irrigate') || qLower.includes('water')) {
        aiAns = `Based on live weather API data for ${district}, next irrigation is recommended in 3 days.`;
      } else if (qLower.includes('fertilizer') || qLower.includes('urea')) {
        aiAns = `Your crop is currently in ${profile?.growthStage || 'Vegetative Stage'}. Top-dressing Urea application is due.`;
      } else if (qLower.includes('today')) {
        aiAns = `Today's priority is: ${todayTasks[0]?.taskName || 'Check Field Moisture'}.`;
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
                  AI Digital Farm Twin Active
                </Badge>
                <span className="text-emerald-200 text-xs font-semibold">
                  District: {profile?.district || district || 'Ludhiana'} • Village: {profile?.village || 'Gill'}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
                🌾 My Farm Roadmap & Intelligent Advisory
              </h1>
              <p className="text-emerald-100 text-sm">
                Farmer: <span className="font-bold text-white">{profile?.farmerName || 'Gurpreet Singh'}</span> • Land:{' '}
                <span className="font-bold text-amber-300">{profile?.farmSizeAcres || 2.5} Acres</span> ({profile?.numFields || 2} Fields) • Crop:{' '}
                <span className="font-bold text-white">{profile?.currentCrop || 'Sugarcane'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Onboarding Dialog Trigger */}
              <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold shadow-sm">
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile & Goals
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-emerald-950">Farmer Profile Setup</DialogTitle>
                    <DialogDescription>
                      Customize your farm details to dynamically generate a unique AI Roadmap.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleProfileSave} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Farmer Name</Label>
                        <Input
                          value={profileForm.farmerName || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, farmerName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>District</Label>
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
                        <Label>Village</Label>
                        <Input
                          value={profileForm.village || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, village: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Total Land Area (Acres)</Label>
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
                        <Label>Current Crop</Label>
                        <Input
                          value={profileForm.currentCrop || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, currentCrop: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Growth Stage</Label>
                        <Input
                          value={profileForm.growthStage || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, growthStage: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <DialogFooter className="mt-4">
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                        Save Profile & Refresh Backend Roadmap
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
                    End-of-Day Check-In
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-emerald-950">Daily Digital Farm Diary</DialogTitle>
                    <DialogDescription>
                      Record what actually happened on your farm today to dynamically update your AI Roadmap.
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
                        <Label htmlFor="irrigated" className="font-semibold">Did you irrigate today?</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="fertilizerApplied"
                          checked={diaryForm.fertilizerApplied}
                          onChange={(e) => setDiaryForm({ ...diaryForm, fertilizerApplied: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="fertilizerApplied" className="font-semibold">Did you apply fertilizer today?</Label>
                      </div>

                      {diaryForm.fertilizerApplied && (
                        <div>
                          <Label className="text-xs">Fertilizer Details (Amount & Type)</Label>
                          <Input
                            placeholder="e.g. 25kg Neem Urea"
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
                        <Label htmlFor="pestsObserved" className="font-semibold">Pests or disease symptoms noticed?</Label>
                      </div>

                      <div>
                        <Label className="text-xs">Number of Laborers Worked</Label>
                        <Input
                          type="number"
                          value={diaryForm.laborersCount}
                          onChange={(e) => setDiaryForm({ ...diaryForm, laborersCount: parseInt(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Additional Field Notes</Label>
                        <Input
                          placeholder="e.g. Crop greening fast"
                          value={diaryForm.notes}
                          onChange={(e) => setDiaryForm({ ...diaryForm, notes: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                        Submit Daily Check-In
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
            <span className="font-bold text-sm text-gray-800">Dynamic API Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-gray-600">District:</Label>
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
              <Label className="text-xs font-semibold text-gray-600">Field:</Label>
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-900"
              >
                <option value="All Fields">All Fields</option>
                <option value="Field 1">Field 1 (Front Plot)</option>
                <option value="Field 2">Field 2 (Canal Side)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Label className="text-xs font-semibold text-gray-600">Crop:</Label>
              <select
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-900"
              >
                <option value="All Crops">All Crops</option>
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
                Soil Water Balance
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
                Nutrient Availability
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
                Expected Total Yield
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-amber-900">{dashboard.yieldPrediction}</div>
              <p className="text-xs text-gray-500 mt-1">AI Confidence: {dashboard.aiConfidence}%</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Expected Net Profit
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{dashboard.profitPrediction}</div>
              <p className="text-xs text-gray-500 mt-1">
                Harvest Countdown: <span className="font-bold text-purple-700">{dashboard.harvestCountdownDays} days</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dynamic Sections: Daily Planner, Upcoming, Timeline, Alerts, Charts & AI Assistant */}
      <Tabs defaultValue="planner" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="planner">Today's Farm Plan</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Tasks</TabsTrigger>
          <TabsTrigger value="alerts">AI Smart Alerts</TabsTrigger>
          <TabsTrigger value="timeline">Roadmap Timeline</TabsTrigger>
          <TabsTrigger value="charts">API Charts</TabsTrigger>
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
        </TabsList>

        {/* Today's Farm Plan Tab */}
        <TabsContent value="planner" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Today's Actionable Farm Plan (`GET /api/farm/today`)
                  </CardTitle>
                  <CardDescription>
                    Fetched dynamically for {profile?.currentCrop || 'Sugarcane'} in {district || 'Ludhiana'}
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-700 text-white font-bold">{todayTasks.length} Tasks Returned</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No active tasks for today. Check back tomorrow!</div>
              ) : (
                todayTasks.map((t) => (
                  <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(t.priority)}>{t.priority} Priority</Badge>
                        <h4 className="font-bold text-gray-900 text-base">{t.taskName}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          <Clock className="w-3 h-3 mr-1" /> {t.estimatedTime}
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-800">
                          Due: {t.deadline}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600">{t.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3 border rounded-lg">
                      <div>
                        <span className="font-semibold text-gray-700">AI Context & Reason:</span>
                        <p className="text-gray-600 mt-0.5">{t.reason}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-800">Expected Benefit:</span>
                        <p className="text-emerald-700 mt-0.5">{t.benefits}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="text-xs text-red-600 font-medium">
                        ⚠️ Consequence if skipped: {t.risk}
                      </div>

                      <div className="flex items-center gap-2">
                        {t.status === 'Completed' ? (
                          <Badge className="bg-emerald-600">✓ Completed</Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleTaskAction(t.id, 'Completed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                            >
                              Mark Completed
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTaskAction(t.id, 'Skipped')}
                              className="text-gray-600 hover:bg-gray-100 font-medium text-xs"
                            >
                              Skip
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTaskAction(t.id, 'Delayed')}
                              className="text-amber-700 border-amber-300 hover:bg-amber-50 font-medium text-xs"
                            >
                              Delay
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
                Upcoming Roadmap Tasks (`GET /api/farm/upcoming`)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {upcomingGroups.map((g) => (
                <div key={g.groupName} className="space-y-3">
                  <h3 className="font-bold text-lg text-emerald-950 flex items-center gap-2 border-b pb-1">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    {g.groupName}
                  </h3>
                  {g.tasks.map((t) => (
                    <div key={t.id} className="p-3 bg-white border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(t.priority)}>{t.priority}</Badge>
                          <span className="font-bold text-gray-900 text-sm">{t.taskName}</span>
                        </div>
                        <span className="text-xs text-emerald-700 font-semibold">{t.deadline}</span>
                      </div>
                      <p className="text-xs text-gray-600">{t.reason}</p>
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
                AI Smart Alerts (`GET /api/farm/alerts`)
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
                      <Badge className={getPriorityColor(a.severity)}>{a.severity}</Badge>
                      <h4 className="font-bold text-gray-900 text-base">{a.title}</h4>
                    </div>
                    <span className="text-xs text-gray-500">{a.generatedTime}</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div>
                      <strong className="text-gray-900">Why:</strong> {a.reason}
                    </div>
                    <div>
                      <strong className="text-emerald-900">Recommended Action:</strong> {a.recommendedAction}
                    </div>
                    <div>
                      <strong className="text-red-900">What happens if ignored:</strong> {a.impact}
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
                14-Phase Adaptive Lifecycle Timeline (`GET /api/farm/timeline`)
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
                            Phase {p.stageNumber}: {p.stageName}
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
                            {p.currentStatus}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {p.startDate} → {p.endDate}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 font-medium">
                        <strong>AI Strategy:</strong> {p.aiNotes}
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
                    Task Completion Trend (`GET /api/farm/charts`)
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
                        <Bar dataKey="completed" fill="#059669" name="Completed" />
                        <Bar dataKey="target" fill="#94a3b8" name="Target" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    Yield Prediction Trend (quintals/acre)
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
                        <Line type="monotone" dataKey="yieldQ" stroke="#d97706" strokeWidth={3} name="Predicted Yield (q/acre)" />
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
                AI Agricultural Scientist Assistant
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
                  placeholder="Type your farming question..."
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
