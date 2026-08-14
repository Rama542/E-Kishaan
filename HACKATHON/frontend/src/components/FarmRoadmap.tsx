import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  BookOpen,
  Send,
  Bot,
  Filter,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
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
  updateTaskStatus,
  FarmOnboardingProfile,
  DashboardMetrics,
  DailyPlannerTask,
  UpcomingTaskGroup,
  TimelineMilestone,
  SmartAlert,
  FarmDailyDiary,
} from '@/services/roadmapService';
import { DEFAULT_DISTRICTS_LIST, PUNJAB_DATASET_FALLBACK } from '@/services/soilService';
import {
  calculateFertilizerDosage,
  calculateKnapsackPumpDosage,
} from '@/services/agriMathService';

export default function FarmRoadmap() {
  const { t } = useTranslation();
  const [district, setDistrict] = useState<string>('Ludhiana');
  const [fieldFilter, setFieldFilter] = useState<string>('All Fields');
  const [cropFilter, setCropFilter] = useState<string>('All Crops');

  // Simple Farmer Inputs (AI computes NPK automatically from District + Previous Crop History)
  const [previousCropHistory, setPreviousCropHistory] = useState<string>('Legumes / Moong (Natural N Fixation)');
  const [targetYieldQ, setTargetYieldQ] = useState<number>(25.0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<FarmOnboardingProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [todayTasks, setTodayTasks] = useState<DailyPlannerTask[]>([]);
  const [upcomingGroups, setUpcomingGroups] = useState<UpcomingTaskGroup[]>([]);
  const [timeline, setTimeline] = useState<TimelineMilestone[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [diaryHistory, setDiaryHistory] = useState<FarmDailyDiary[]>([]);

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
      ] = await Promise.all([
        getFarmProfile(district),
        getFarmDashboard(district),
        getTodayTasks(district),
        getUpcomingTasks(district),
        getRoadmapTimeline(district),
        getSmartAlerts(district),
        getDiaryHistory(),
      ]);

      setProfile(profRes);
      setProfileForm(profRes);
      setDashboard(dashRes);
      setTimeline(timelineRes);
      setAlerts(alertsRes);
      setDiaryHistory(diaryRes);

      // AI Automated Soil NPK Calculation based on District Location & Previous Crop History
      const districtSoilData = PUNJAB_DATASET_FALLBACK[district] || PUNJAB_DATASET_FALLBACK['Ludhiana'];
      let aiSoilN = districtSoilData?.nutrients?.nitrogen || 95;
      const aiSoilP = districtSoilData?.nutrients?.phosphorus || 29;
      const aiSoilK = districtSoilData?.nutrients?.potassium || 185;

      if (previousCropHistory.includes('Legumes')) aiSoilN += 25;
      else if (previousCropHistory.includes('Paddy')) aiSoilN = Math.max(20, aiSoilN - 15);
      else if (previousCropHistory.includes('Sugarcane')) aiSoilN = Math.max(20, aiSoilN - 20);
      else if (previousCropHistory.includes('Fallow')) aiSoilN += 10;

      const currentCrop = profRes.currentCrop || 'Sugarcane';
      const acres = profRes.farmSizeAcres || 2.5;
      const fertCalc = calculateFertilizerDosage(currentCrop, acres, targetYieldQ, aiSoilN, aiSoilP, aiSoilK);
      const sprayCalc = calculateKnapsackPumpDosage(acres, 2.0);

      const dynamicTasks: DailyPlannerTask[] = [
        {
          id: 'dyn-task-1',
          taskName: `Soil Moisture & Root Zone Hydration Check (${currentCrop})`,
          description: `Inspect upper 15cm soil profile across Field 1 & 2 in ${district}. AI Estimated Soil NPK: ${aiSoilN}-${aiSoilP}-${aiSoilK} kg/ha.`,
          priority: 'Critical',
          estimatedTime: '30 mins',
          estimatedCost: '₹0',
          requiredMaterials: 'Moisture Probe / Soil Auger',
          reason: `AI soil telemetry for ${district} (${aiSoilN}-${aiSoilP}-${aiSoilK} kg/ha NPK) recommends root zone hydration before fertilizing.`,
          benefits: `Prevents root burn and optimizes nutrient absorption speed.`,
          risk: `Dry soil application causes nitrogen volatilization loss.`,
          deadline: 'Today 05:00 PM',
          status: 'In Progress',
          dependencies: ['Sowing complete'],
          aiConfidence: 96,
        },
        {
          id: 'dyn-task-2',
          taskName: `Apply ${fertCalc.dapBags50kg} Bags DAP (${fertCalc.dapNeededKg}kg) & ${fertCalc.ureaBags50kg} Bags Urea (${fertCalc.ureaNeededKg}kg)`,
          description: `Apply basal DAP (18-46-0) and Urea (46% N) top-dressing for target yield of ${targetYieldQ} q/acre across ${acres} acres.`,
          priority: 'High',
          estimatedTime: '45 mins',
          estimatedCost: `₹${Math.round(fertCalc.dapBags50kg * 1350 + fertCalc.ureaBags50kg * 267).toLocaleString('en-IN')}`,
          requiredMaterials: `${fertCalc.dapBags50kg} Bags DAP (50kg) + ${fertCalc.ureaBags50kg} Bags Urea (50kg)`,
          reason: `AI automated formula: $(\\text{Target Yield} \\times \\text{Uptake}) - \\text{Regional Soil NPK} = ${fertCalc.dapNeededKg}kg DAP, ${fertCalc.ureaNeededKg}kg Urea$.`,
          benefits: `Provides ${fertCalc.phosphorusNeededKg}kg P₂O₅ and ${fertCalc.nitrogenNeededKg}kg N for vigorous tiller development.`,
          risk: `Under-application reduces target yield by up to 25%.`,
          deadline: 'Today 06:30 PM',
          status: 'Not Started',
          dependencies: ['Moisture check'],
          aiConfidence: 94,
        },
        {
          id: 'dyn-task-3',
          taskName: `Foliar Spray 19-19-19 NPK (${sprayCalc.total15LPumps} Pumps of 15L Needed)`,
          description: `Mix chemical dosage per 15L tank for total spray volume of ${sprayCalc.totalVolumeLiters}L across ${acres} acres.`,
          priority: 'Medium',
          estimatedTime: '40 mins',
          estimatedCost: `₹${Math.round(acres * 250)}`,
          requiredMaterials: `${sprayCalc.total15LPumps} Knapsack Pumps (15L tanks), 19-19-19 NPK`,
          reason: `Dynamic spray formula: $\\lceil (\\text{Acres} \\times 200)/15 \\rceil = ${sprayCalc.total15LPumps}$ pumps.`,
          benefits: `Direct foliar absorption bypasses soil lockup during active growth.`,
          risk: `Skipping foliar spray slows down stem elongation.`,
          deadline: 'Today 07:00 PM',
          status: 'Not Started',
          dependencies: [],
          aiConfidence: 91,
        },
      ];

      setTodayTasks(todayRes.length > 0 ? todayRes : dynamicTasks);

      const dynamicUpcoming: UpcomingTaskGroup[] = [
        {
          groupName: 'Week 5 - Flag Leaf & Jointing Phase',
          tasks: [
            {
              id: 'task-up-1',
              taskName: `Apply ${fertCalc.mopBags50kg} Bags MOP Potash (${fertCalc.mopNeededKg}kg) + Boron Foliar Spray`,
              description: `Potash boost for grain filling weight across ${acres} acres (${sprayCalc.total15LPumps} 15L pumps).`,
              priority: 'High',
              estimatedTime: '1 hour',
              estimatedCost: `₹${Math.round(fertCalc.mopBags50kg * 1700)}`,
              requiredMaterials: `${fertCalc.mopBags50kg} Bags MOP (60% K₂O), Soluble Boron`,
              reason: `Potassium requirement is ${fertCalc.potassiumNeededKg}kg K₂O for high grain test weight.`,
              benefits: `Increases 1000-grain test weight and drought tolerance.`,
              risk: `Potassium deficiency causes weak straw lodging.`,
              deadline: 'In 5 Days',
              status: 'Not Started',
              dependencies: ['Tillering complete'],
              aiConfidence: 95,
            },
          ],
        },
      ];

      setUpcomingGroups(upcomingRes.length > 0 ? upcomingRes : dynamicUpcoming);

      if (chatMessages.length === 0) {
        setChatMessages([
          {
            sender: 'ai',
            text: t('roadmap.assistant.greeting', {
              name: profRes.farmerName || 'Farmer',
              district,
              acres,
              crop: currentCrop,
              npk: `${aiSoilN}-${aiSoilP}-${aiSoilK}`,
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
  }, [district, previousCropHistory, targetYieldQ, chatMessages.length]);

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
    } catch {
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
    } catch {
      toast.error(t('roadmap.toast.diaryFailed'));
    }
  };

  const handleTaskAction = async (taskId: string, status: 'Completed' | 'Skipped' | 'Delayed') => {
    try {
      await updateTaskStatus(taskId, status);
      toast.success(t('roadmap.toast.taskStatusSuccess', { status: t(`roadmap.status.${status}`, status) }));
      await loadAllBackendData();
    } catch {
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
      let aiAns = t('roadmap.assistant.telemetryAnswer', {
        name: profile?.farmerName || 'Farmer',
        district,
        value: dashboard?.waterBalancePercent || 80,
        crop: profile?.currentCrop || 'Sugarcane',
      });
      const qLower = q.toLowerCase();
      if (qLower.includes('irrigate') || qLower.includes('water')) {
        aiAns = t('roadmap.assistant.irrigateAnswer', { district });
      } else if (qLower.includes('fertilizer') || qLower.includes('urea') || qLower.includes('dap')) {
        const districtSoilData = PUNJAB_DATASET_FALLBACK[district] || PUNJAB_DATASET_FALLBACK['Ludhiana'];
        let chatSoilN = districtSoilData?.nutrients?.nitrogen || 95;
        const chatSoilP = districtSoilData?.nutrients?.phosphorus || 29;
        const chatSoilK = districtSoilData?.nutrients?.potassium || 185;
        if (previousCropHistory.includes('Legumes')) chatSoilN += 25;
        else if (previousCropHistory.includes('Paddy')) chatSoilN = Math.max(20, chatSoilN - 15);
        else if (previousCropHistory.includes('Sugarcane')) chatSoilN = Math.max(20, chatSoilN - 20);
        else if (previousCropHistory.includes('Fallow')) chatSoilN += 10;
        const fertCalc = calculateFertilizerDosage(profile?.currentCrop || 'Sugarcane', profile?.farmSizeAcres || 2.5, targetYieldQ, chatSoilN, chatSoilP, chatSoilK);
        aiAns = t('roadmap.assistant.fertilizerDynamicAnswer', {
          acres: profile?.farmSizeAcres || 2.5,
          dapBags: fertCalc.dapBags50kg,
          dapKg: fertCalc.dapNeededKg,
          ureaBags: fertCalc.ureaBags50kg,
          ureaKg: fertCalc.ureaNeededKg,
        });
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
<<<<<<< HEAD
                  {t('roadmap.aiTwinBadge')}
=======
                  🤖 Smart AI Farm Assistant Active
>>>>>>> 97135bcf (fix(roadmap): convert all technical titles, cards, buttons, and API labels into simple layman farmer terms)
                </Badge>
                <span className="text-emerald-200 text-xs font-semibold">
                  {t('roadmap.districtVillageLabel', {
                    district: profile?.district || district || 'Ludhiana',
                    village: profile?.village || 'Gill',
                  })}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
<<<<<<< HEAD
                {t('roadmap.pageTitle')}
              </h1>
              <p className="text-emerald-100 text-sm">
                {t('roadmap.farmerLine', {
                  name: profile?.farmerName || 'Gurpreet Singh',
                  acres: profile?.farmSizeAcres || 2.5,
                  fields: profile?.numFields || 2,
                  crop: profile?.currentCrop || 'Sugarcane',
                })}
=======
                🌾 My Farm Care Guide & Daily Helper
              </h1>
              <p className="text-emerald-100 text-sm">
                Farmer: <span className="font-bold text-white">{profile?.farmerName || 'Gurpreet Singh'}</span> • Field Area:{' '}
                <span className="font-bold text-amber-300">{profile?.farmSizeAcres || 2.5} Acres</span> ({profile?.numFields || 2} Plots) • Crop:{' '}
                <span className="font-bold text-white">{profile?.currentCrop || 'Sugarcane'}</span>
>>>>>>> 97135bcf (fix(roadmap): convert all technical titles, cards, buttons, and API labels into simple layman farmer terms)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Onboarding Dialog Trigger */}
              <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
                <DialogTrigger asChild>
<<<<<<< HEAD
                  <Button className="bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold shadow-sm">
                    <User className="w-4 h-4 mr-2" />
                    {t('roadmap.editProfile')}
=======
                  <Button className="bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold shadow-sm text-xs">
                    <User className="w-4 h-4 mr-1.5" />
                    👤 Change Farm Details
>>>>>>> 97135bcf (fix(roadmap): convert all technical titles, cards, buttons, and API labels into simple layman farmer terms)
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
                          className="w-full mt-1 p-2 bg-white border rounded text-sm"
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
                          value={profileForm.farmSizeAcres || 2.5}
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
<<<<<<< HEAD
                  <Button variant="outline" className="border-amber-400 text-amber-300 hover:bg-emerald-950 font-bold">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t('roadmap.checkIn')}
=======
                  <Button variant="outline" className="border-amber-400 text-amber-300 hover:bg-emerald-950 font-bold text-xs">
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    📖 Daily Farm Record Book
>>>>>>> 97135bcf (fix(roadmap): convert all technical titles, cards, buttons, and API labels into simple layman farmer terms)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
<<<<<<< HEAD
                    <DialogTitle className="text-xl font-bold text-emerald-950">{t('roadmap.diaryDialog.title')}</DialogTitle>
                    <DialogDescription>
                      {t('roadmap.diaryDialog.description')}
=======
                    <DialogTitle className="text-xl font-bold text-emerald-950">📖 Record Today's Farm Work</DialogTitle>
                    <DialogDescription>
                      Check what you did in your field today so the AI can update tomorrow's plan.
>>>>>>> 97135bcf (fix(roadmap): convert all technical titles, cards, buttons, and API labels into simple layman farmer terms)
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
                          value={diaryForm.notes || ''}
                          onChange={(e) => setDiaryForm({ ...diaryForm, notes: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <DialogFooter className="mt-4">
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

      {/* Simple Farmer Inputs & AI Automated Soil Controller Bar */}
      <Card className="bg-emerald-50/90 border-2 border-emerald-300 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-emerald-950 text-base">🌱 {t('roadmap.soilInput.aiTitle')}</h3>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-bold">
                🤖 {t('roadmap.soilInput.aiBadge')}
              </Badge>
            </div>
            <p className="text-xs text-emerald-700 font-medium">
              {t('roadmap.soilInput.aiDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold text-emerald-900">📍 {t('roadmap.soilInput.districtLabel')}</Label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-gray-900 shadow-sm"
              >
                {DEFAULT_DISTRICTS_LIST.map((d) => (
                  <option key={d.name} value={d.name}>{d.name} District</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-emerald-900">🔄 {t('roadmap.soilInput.previousCropLabel')}</Label>
              <select
                value={previousCropHistory}
                onChange={(e) => setPreviousCropHistory(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-gray-900 shadow-sm"
              >
                <option value="Legumes / Moong (Natural N Fixation)">🌱 {t('roadmap.soilInput.previousCropOptions.legumes')}</option>
                <option value="Paddy / Rice">🌾 {t('roadmap.soilInput.previousCropOptions.paddy')}</option>
                <option value="Wheat / Maize">🌽 {t('roadmap.soilInput.previousCropOptions.wheatMaize')}</option>
                <option value="Sugarcane / Cotton">🎋 {t('roadmap.soilInput.previousCropOptions.sugarcaneCotton')}</option>
                <option value="Fallow / Rested Soil">☀️ {t('roadmap.soilInput.previousCropOptions.fallow')}</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-emerald-900">🎯 {t('roadmap.soilInput.targetYieldLabelAi')}</Label>
              <Input
                type="number"
                step="0.5"
                value={targetYieldQ}
                onChange={(e) => setTargetYieldQ(parseFloat(e.target.value) || 20.0)}
                className="mt-1 h-9 bg-white border-emerald-300 text-xs font-bold text-emerald-900 shadow-sm"
              />
            </div>
          </div>

          {/* AI Soil Intelligence Information Banner */}
          <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 text-xs flex items-center justify-between flex-wrap gap-2">
            <span className="text-emerald-900 font-medium">
              ✨ <strong>{t('roadmap.soilInput.aiStatusPrefix', { district })}</strong> {t('roadmap.soilInput.aiStatusSuffix', { crop: previousCropHistory.split(' ')[0] })}
            </span>
            <span className="text-emerald-700 font-bold">{t('roadmap.soilInput.aiStatusFooter')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Digital Farm Twin Overview Metric Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-t-4 border-t-blue-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-700 flex items-center justify-between">
                💧 Water In Soil
                <Droplets className="w-4 h-4 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboard.waterBalancePercent}% Moisture</div>
              <Progress value={dashboard.waterBalancePercent} className="h-2 mt-2 bg-gray-200" />
              <p className="text-xs text-gray-500 mt-1">{dashboard.weatherSummary}</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-700 flex items-center justify-between">
                🌱 Plant Food & Soil Health
                <Zap className="w-4 h-4 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboard.nutrientBalancePercent}% Healthy</div>
              <Progress value={dashboard.nutrientBalancePercent} className="h-2 mt-2 bg-gray-200" />
              <p className="text-xs text-gray-500 mt-1">{dashboard.soilSummary}</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-700 flex items-center justify-between">
                🌾 Expected Total Harvest Produce
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-amber-900">{dashboard.yieldPrediction}</div>
              <p className="text-xs text-gray-500 mt-1">AI Accuracy: {dashboard.aiConfidence}%</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-700 flex items-center justify-between">
                💰 Expected Net Profit Earnings
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-purple-900">{dashboard.profitPrediction}</div>
              <p className="text-xs text-gray-500 mt-1">
                Harvest Countdown: <span className="font-bold text-purple-700">{dashboard.harvestCountdownDays} days left</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dynamic Sections: Daily Planner, Upcoming, Timeline, Alerts & AI Assistant */}
      <Tabs defaultValue="planner" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="planner">📅 Today's Work List</TabsTrigger>
          <TabsTrigger value="upcoming">⏳ Upcoming Work</TabsTrigger>
          <TabsTrigger value="alerts">⚠️ Urgent Alerts</TabsTrigger>
          <TabsTrigger value="timeline">🌾 Crop Growth Timeline</TabsTrigger>
          <TabsTrigger value="assistant">🤖 Ask Doctor AI</TabsTrigger>
        </TabsList>

        {/* Today's Farm Plan Tab */}
        <TabsContent value="planner" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    📅 Today's Field Work List
                  </CardTitle>
                  <CardDescription>
                    Auto-calculated for {profile?.currentCrop || 'Sugarcane'} in {district || 'Ludhiana'}
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-700 text-white font-bold">{todayTasks.length} Field Tasks Today</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No active tasks for today. Check back tomorrow!</div>
              ) : (
                todayTasks.map((t2) => (
                  <div key={t2.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(t2.priority)}>{t2.priority} Priority</Badge>
                        <h4 className="font-bold text-gray-900 text-base">{t2.taskName}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          <Clock className="w-3 h-3 mr-1" /> {t2.estimatedTime}
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-800">
                          Complete By: {t2.deadline}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600">{t2.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3 border rounded-lg">
                      <div>
                        <span className="font-bold text-gray-800">💡 Why this is important:</span>
                        <p className="text-gray-600 mt-0.5">{t2.reason}</p>
                      </div>
                      <div>
                        <span className="font-bold text-emerald-800">🌾 How it helps your crop:</span>
                        <p className="text-emerald-700 mt-0.5">{t2.benefits}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="text-xs text-gray-600 font-medium">
                        Items to use / buy: <span className="font-bold text-gray-900">{t2.requiredMaterials}</span> • Cost:{' '}
                        <span className="font-bold text-amber-700">{t2.estimatedCost}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskAction(t2.id, 'Delayed')}
                          className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                        >
                          ⏰ Do Tomorrow
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleTaskAction(t2.id, 'Completed')}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          ✅ Done Today
                        </Button>
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
          {upcomingGroups.map((grp) => (
            <Card key={grp.groupName}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900">{grp.groupName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {grp.tasks.map((ut) => (
                  <div key={ut.id} className="p-3 bg-gray-50 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h5 className="font-bold text-gray-900 text-sm">{ut.taskName}</h5>
                      <p className="text-xs text-gray-600 mt-0.5">{ut.description}</p>
                      <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                        {t('roadmap.upcoming.materialsLabel')} {ut.requiredMaterials} ({ut.estimatedCost})
                      </span>
                    </div>
                    <Badge className={getPriorityColor(ut.priority)}>{t(`roadmap.priority.${ut.priority}`, ut.priority)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* AI Smart Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                {t('roadmap.alerts.title')} (`GET /api/farm/alerts`)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((al) => (
                <div key={al.id} className="p-4 border-l-4 border-l-amber-500 bg-amber-50 rounded-r-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-amber-950 text-base">{al.title}</h4>
                    <Badge className="bg-amber-600 text-white text-xs">
                      {t('roadmap.alerts.severitySuffix', { severity: t(`roadmap.priority.${al.severity}`, al.severity) })}
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-900">{al.reason}</p>
                  <div className="bg-white p-2.5 rounded border border-amber-200 text-xs">
                    <span className="font-bold text-emerald-900">{t('roadmap.alerts.recommendedActionLabel')} </span>
                    <span className="text-gray-800">{al.recommendedAction}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                {t('roadmap.timeline.title')}
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
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  <Send className="w-4 h-4 mr-1" />
                  {t('roadmap.assistant.askAi')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
