export interface FarmOnboardingProfile {
  farmerName: string;
  district: string;
  village: string;
  state: string;
  language: string;
  farmSizeAcres: number;
  numFields: number;
  irrigationSource: string;
  waterAvailability: string;
  currentCrop: string;
  previousCrop: string;
  plantingDate: string;
  expectedHarvestDate: string;
  growthStage: string;
  farmingGoals: string[];
}

export interface FarmDailyDiary {
  checkInDate: string;
  irrigated: boolean;
  fertilizerApplied: boolean;
  fertilizerDetails?: string;
  pestsObserved: boolean;
  diseaseSymptoms?: string;
  rainfallObserved: boolean;
  laborersCount: number;
  notes?: string;
}

export interface DailyPlannerTask {
  id: string;
  taskName: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  estimatedTime: string;
  estimatedCost: string;
  requiredMaterials: string;
  reason: string;
  benefits: string;
  risk: string;
  deadline: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Skipped' | 'Delayed';
  dependencies: string[];
  aiConfidence: number;
}

export interface UpcomingTaskGroup {
  groupName: string;
  tasks: DailyPlannerTask[];
}

export interface TimelineMilestone {
  timelineId: string;
  stageNumber: number;
  stageName: string;
  task: string;
  startDate: string;
  endDate: string;
  actualCompletionDate?: string;
  progressPercent: number;
  currentStage: boolean;
  dependencies: string[];
  currentStatus: 'Completed' | 'In Progress' | 'Upcoming';
  delayImpact: string;
  nextAction: string;
  aiNotes: string;
}

export interface SmartAlert {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  reason: string;
  recommendedAction: string;
  deadline: string;
  impact: string;
  confidence: number;
  relatedTask?: string;
  weatherSource?: string;
  generatedTime: string;
}

export interface DashboardMetrics {
  currentCrop: string;
  currentStage: string;
  currentSeason: string;
  farmSizeAcres: number;
  numFields: number;
  healthScore: number;
  yieldPrediction: string;
  profitPrediction: string;
  harvestCountdownDays: number;
  roadmapProgressPercent: number;
  riskLevel: string;
  weatherSummary: string;
  soilSummary: string;
  waterBalancePercent: number;
  nutrientBalancePercent: number;
  marketOpportunity: string;
  aiConfidence: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  skippedTasksCount: number;
  delayedTasksCount: number;
}

export interface FarmChartsData {
  taskCompletionTrend: Array<{ month: string; completed: number; target: number }>;
  yieldForecastTrend: Array<{ stage: string; yieldQ: number }>;
  profitForecastTrend: Array<{ month: string; profit: number }>;
  waterUsageTrend: Array<{ stage: string; requiredMm: number; actualMm: number }>;
  nutrientTrend: Array<{ nutrient: string; current: number; benchmark: number }>;
  cropGrowthProgress: Array<{ week: string; heightCm: number; biomassIndex: number }>;
}

const API_BASE = '/api/farm';

export function getDefaultFarmProfile(district = 'Ludhiana'): FarmOnboardingProfile {
  let storedName = 'Gurpreet Singh';
  let storedCrop = 'Sugarcane';
  try {
    const raw = localStorage.getItem('agrismart_farmer_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.name) storedName = parsed.name;
      if (parsed.primaryCrops && parsed.primaryCrops[0]) storedCrop = parsed.primaryCrops[0];
    }
  } catch {}

  return {
    farmerName: storedName,
    district: district || 'Ludhiana',
    village: 'Gill',
    state: 'Punjab',
    language: 'English',
    farmSizeAcres: 2.5,
    numFields: 2,
    irrigationSource: 'Canal & Tube Well',
    waterAvailability: 'Good',
    currentCrop: storedCrop,
    previousCrop: 'Wheat',
    plantingDate: '2026-11-01',
    expectedHarvestDate: '2027-04-15',
    growthStage: 'Tillering Stage (Week 4)',
    farmingGoals: ['Maximize Yield', 'Optimize Fertilizer Cost', 'Pest Control'],
  };
}

export async function getFarmProfile(district = 'Ludhiana'): Promise<FarmOnboardingProfile> {
  try {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    const res = await fetch(`${API_BASE}/profile${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.profile && data.profile.farmerName) return data.profile;
    }
  } catch {}
  return getDefaultFarmProfile(district);
}

export async function saveFarmProfile(profile: Partial<FarmOnboardingProfile>): Promise<FarmOnboardingProfile> {
  const current = getDefaultFarmProfile(profile.district);
  const updated = { ...current, ...profile };
  try {
    localStorage.setItem('agrismart_farmer_profile', JSON.stringify({
      name: updated.farmerName,
      state: updated.state,
      location: `${updated.village}, ${updated.district}`,
      primaryCrops: [updated.currentCrop],
      points: 120,
      level: 'Level 2 Agri Master',
    }));

    await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  } catch {}
  return updated;
}

export async function getFarmDashboard(district = 'Ludhiana'): Promise<DashboardMetrics> {
  try {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    const res = await fetch(`${API_BASE}/dashboard${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.dashboard) return data.dashboard;
    }
  } catch {}

  const prof = getDefaultFarmProfile(district);
  return {
    currentCrop: prof.currentCrop,
    currentStage: prof.growthStage,
    currentSeason: 'Rabi Season 2026-27',
    farmSizeAcres: prof.farmSizeAcres,
    numFields: prof.numFields,
    healthScore: 92,
    yieldPrediction: `${(24.5 * prof.farmSizeAcres).toFixed(1)} Quintals total (${prof.farmSizeAcres} Acres)`,
    profitPrediction: `₹${(42500 * prof.farmSizeAcres).toLocaleString('en-IN')}`,
    harvestCountdownDays: 62,
    roadmapProgressPercent: 35,
    riskLevel: 'Low Risk',
    weatherSummary: `Clear skies in ${district}, optimal 24°C, wind 8 km/h`,
    soilSummary: 'Soil NPK & Organic Carbon balanced (pH 7.2)',
    waterBalancePercent: 82,
    nutrientBalancePercent: 88,
    marketOpportunity: `APMC Mandi rate ₹2,275/q (MSP +₹150 premium)`,
    aiConfidence: 94,
    completedTasksCount: 8,
    pendingTasksCount: 3,
    skippedTasksCount: 0,
    delayedTasksCount: 1,
  };
}

export function getDefaultTodayTasks(district = 'Ludhiana', crop = 'Sugarcane'): DailyPlannerTask[] {
  return [
    {
      id: 'task-101',
      taskName: `Check Soil Moisture & Root Zone Hydration for ${crop}`,
      description: `Inspect upper 15cm soil profile across Field 1 & Field 2 in ${district}. Ensure field is moist before fertilizer application.`,
      priority: 'Critical',
      estimatedTime: '30 mins',
      estimatedCost: '₹0',
      requiredMaterials: 'Moisture Probe / Soil Auger',
      reason: `Root zone moisture is at 82%, which is optimal for fertilizer uptake. Avoid irrigation if rain is forecasted.`,
      benefits: `Prevents root rot and optimizes fertilizer dissolution speed.`,
      risk: `Low moisture causes root tip burn when applying top-dressing fertilizer.`,
      deadline: 'Today 05:00 PM',
      status: 'In Progress',
      dependencies: ['Sowing completed'],
      aiConfidence: 96,
    },
    {
      id: 'task-102',
      taskName: `1st Split Neem-Coated Urea Top-Dressing (${crop})`,
      description: `Broadcast 25kg/acre Neem-Coated Urea evenly along crop rows. Sub-surface placement recommended for max absorption.`,
      priority: 'High',
      estimatedTime: '45 mins',
      estimatedCost: '₹267 (1 Bag Urea)',
      requiredMaterials: 'Neem-Coated Urea 50kg bag',
      reason: `${crop} is in active tillering phase; nitrogen demand peaks during stem elongation.`,
      benefits: `Increases productive tillers by 22% and leaf chlorophyll content.`,
      risk: `Delayed application reduces total earhead count per m².`,
      deadline: 'Today 06:30 PM',
      status: 'Not Started',
      dependencies: ['Soil moisture check'],
      aiConfidence: 92,
    },
    {
      id: 'task-103',
      taskName: `Scout Lower Leaf Canopy for Aphids & Rust Symptoms`,
      description: `Inspect 20 random plants per acre in ${district}. Check under leaves for yellow rust pustules or aphid clusters.`,
      priority: 'Medium',
      estimatedTime: '20 mins',
      estimatedCost: '₹0',
      requiredMaterials: 'Magnifying Glass / Field Journal',
      reason: `Humidity at 78% creates micro-climate favorable for early yellow rust spores.`,
      benefits: `Early detection allows targeted spot-spray before widespread infection.`,
      risk: `Uncontrolled infestation reduces grain weight by up to 30%.`,
      deadline: 'Today 07:00 PM',
      status: 'Not Started',
      dependencies: [],
      aiConfidence: 89,
    },
  ];
}

export async function getTodayTasks(district = 'Ludhiana'): Promise<DailyPlannerTask[]> {
  try {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    const res = await fetch(`${API_BASE}/today${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.tasks && data.tasks.length > 0) return data.tasks;
    }
  } catch {}

  const prof = getDefaultFarmProfile(district);
  return getDefaultTodayTasks(district, prof.currentCrop);
}

export async function getUpcomingTasks(district = 'Ludhiana'): Promise<UpcomingTaskGroup[]> {
  try {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    const res = await fetch(`${API_BASE}/upcoming${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.groups && data.groups.length > 0) return data.groups;
    }
  } catch {}

  const prof = getDefaultFarmProfile(district);
  return [
    {
      groupName: 'Week 5 - Flag Leaf & Jointing Phase',
      tasks: [
        {
          id: 'task-201',
          taskName: `Foliar Spray Soluble NPK (19-19-19) + Boron 20%`,
          description: `Spray 1kg 19-19-19 + 250g Boron per acre using 15L knapsack pump (13 pumps/acre).`,
          priority: 'High',
          estimatedTime: '1 hour',
          estimatedCost: '₹450',
          requiredMaterials: '19-19-19 NPK, Soluble Boron 20%, Knapsack Sprayer',
          reason: `Boron ensures healthy pollen tube development during earhead emergence.`,
          benefits: `Increases grain filling percentage and reduces sterile spikelets.`,
          risk: `Boron deficiency causes tip dieback and empty grain heads.`,
          deadline: 'In 5 Days',
          status: 'Not Started',
          dependencies: ['Tillering complete'],
          aiConfidence: 94,
        },
      ],
    },
    {
      groupName: 'Week 8 - Anthesis & Flowering Protection',
      tasks: [
        {
          id: 'task-202',
          taskName: `Flag Leaf Protection Spray (Tebuconazole 25.9% EC)`,
          description: `Apply protective fungicide to top flag leaf — responsible for 50% grain weight!`,
          priority: 'Critical',
          estimatedTime: '45 mins',
          estimatedCost: '₹620',
          requiredMaterials: 'Tebuconazole 25.9% EC fungicide',
          reason: `Flag leaf must remain green and spot-free during grain milking stage.`,
          benefits: `Boosts 1000-grain test weight by 3.5 grams.`,
          risk: `Foliar blights on flag leaf decrease yield by 25-40%.`,
          deadline: 'In 12 Days',
          status: 'Not Started',
          dependencies: ['Boron spray'],
          aiConfidence: 95,
        },
      ],
    },
  ];
}

export async function getRoadmapTimeline(district = 'Ludhiana'): Promise<TimelineMilestone[]> {
  try {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    const res = await fetch(`${API_BASE}/timeline${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.timeline && data.timeline.length > 0) return data.timeline;
    }
  } catch {}

  return [
    {
      timelineId: 'tm-1',
      stageNumber: 1,
      stageName: 'Germination & Seedling Emergence',
      task: 'Land preparation, basal DAP (50kg/acre) broadcast & seed sowing',
      startDate: '2026-11-01',
      endDate: '2026-11-14',
      actualCompletionDate: '2026-11-12',
      progressPercent: 100,
      currentStage: false,
      dependencies: [],
      currentStatus: 'Completed',
      delayImpact: 'None',
      nextAction: 'Proceed to tillering',
      aiNotes: 'Excellent germination rate (94% seed emergence observed).',
    },
    {
      timelineId: 'tm-2',
      stageNumber: 2,
      stageName: 'Active Tillering & Crown Root Initiation (CRI)',
      task: 'First split Urea application & CRI stage light irrigation',
      startDate: '2026-11-15',
      endDate: '2026-12-10',
      progressPercent: 65,
      currentStage: true,
      dependencies: ['tm-1'],
      currentStatus: 'In Progress',
      delayImpact: 'Low',
      nextAction: 'Complete 25kg Urea top-dressing',
      aiNotes: 'CRI phase is ongoing. Tillering density is 420 tillers/m².',
    },
    {
      timelineId: 'tm-3',
      stageNumber: 3,
      stageName: 'Stem Jointing & Booting',
      task: 'Flag leaf protection spray & Boron foliar nutrition',
      startDate: '2026-12-11',
      endDate: '2027-01-15',
      progressPercent: 0,
      currentStage: false,
      dependencies: ['tm-2'],
      currentStatus: 'Upcoming',
      delayImpact: 'Medium',
      nextAction: 'Prepare fungicide stock',
      aiNotes: 'Monitor temperature closely for early frost risk.',
    },
  ];
}

export async function getSmartAlerts(district = 'Ludhiana'): Promise<SmartAlert[]> {
  try {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    const res = await fetch(`${API_BASE}/alerts${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.alerts && data.alerts.length > 0) return data.alerts;
    }
  } catch {}

  return [
    {
      id: 'alert-1',
      title: `⚡ High Moisture & Nitrogen Uptake Window (${district})`,
      severity: 'Medium',
      reason: `Current relative humidity is 78% and soil moisture is 82%. Perfect atmospheric condition for Nitrogen absorption.`,
      recommendedAction: `Apply 1st split Urea top-dressing today before evening dew sets in.`,
      deadline: 'Today 06:00 PM',
      impact: `Increases nitrogen use efficiency (NUE) by 18%.`,
      confidence: 95,
      generatedTime: new Date().toISOString(),
    },
  ];
}

export async function getDiaryHistory(): Promise<FarmDailyDiary[]> {
  try {
    const res = await fetch(`${API_BASE}/diary`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.history) return data.history;
    }
  } catch {}
  return [];
}

export async function submitDailyDiary(diary: FarmDailyDiary): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/diary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diary),
    });
    return res.ok;
  } catch {}
  return true;
}

export async function getFarmCharts(district = 'Ludhiana'): Promise<FarmChartsData> {
  try {
    const query = district ? `?district=${encodeURIComponent(district)}` : '';
    const res = await fetch(`${API_BASE}/charts${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.charts) return data.charts;
    }
  } catch {}

  return {
    taskCompletionTrend: [
      { month: 'Nov', completed: 12, target: 12 },
      { month: 'Dec', completed: 8, target: 10 },
      { month: 'Jan', completed: 0, target: 8 },
    ],
    yieldForecastTrend: [
      { stage: 'Sowing', yieldQ: 20 },
      { stage: 'Tillering', yieldQ: 24.5 },
      { stage: 'Harvest', yieldQ: 25 },
    ],
    profitForecastTrend: [
      { month: 'Nov', profit: -8000 },
      { month: 'Dec', profit: -12000 },
      { month: 'Apr', profit: 106250 },
    ],
    waterUsageTrend: [
      { stage: 'Sowing', requiredMm: 50, actualMm: 52 },
      { stage: 'Tillering', requiredMm: 80, actualMm: 78 },
    ],
    nutrientTrend: [
      { nutrient: 'Nitrogen (N)', current: 82, benchmark: 100 },
      { nutrient: 'Phosphorus (P)', current: 95, benchmark: 100 },
      { nutrient: 'Potassium (K)', current: 90, benchmark: 100 },
    ],
    cropGrowthProgress: [
      { week: 'W1', heightCm: 5, biomassIndex: 10 },
      { week: 'W2', heightCm: 12, biomassIndex: 25 },
      { week: 'W4', heightCm: 28, biomassIndex: 60 },
    ],
  };
}

export async function updateTaskStatus(taskId: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/task/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, status }),
    });
    return res.ok;
  } catch {}
  return true;
}
