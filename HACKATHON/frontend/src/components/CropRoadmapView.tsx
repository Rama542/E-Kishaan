import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flame,
  Printer,
  ShieldAlert,
  Sprout,
  Users,
  Zap,
  Sliders,
  DollarSign,
  AlertCircle,
  FileText,
  Sparkles,
  HelpCircle,
  Info,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { calculateFertilizerDosage, calculateKnapsackPumpDosage } from '@/services/agriMathService';

export interface FertilizerInput {
  name: string;
  dose_per_acre: string;
  pump_15l_dose: string;
  purpose: string;
}

export interface WeeklyExecutionStep {
  week_number: number;
  bbch_stage_code: number;
  stage_name: string;
  gdd_target_accumulated: number;
  primary_operation: string;
  fertilizer_inputs: FertilizerInput[];
  ipm_scouting_guidelines: string[];
  frac_irac_codes: string[];
  phi_days_countdown: number;
  labor_mandays_required: number;
  estimated_cost_inr: number;
  risk_mitigation_notes: string;
}

export interface RoadmapData {
  farm_id: string;
  crop_name: string;
  area_acres: number;
  sowing_date: string;
  total_gdd_target: number;
  estimated_total_cost_inr: number;
  estimated_yield_q_per_acre: number;
  execution_steps: WeeklyExecutionStep[];
}

interface CropRoadmapViewProps {
  cropName?: string;
  areaAcres?: number;
}

// Plain language translation helper for small farmers
function getSimpleStageName(weekNum: number, cropName: string): { title: string; subtitle: string; icon: string } {
  if (weekNum === 1) return { title: 'Seed Sowing & Field Preparation', subtitle: 'Land leveling, basal fertilizer & initial seed sowing', icon: '🌰' };
  if (weekNum === 2) return { title: 'First Green Sprouts Emerging', subtitle: 'Light watering & checking seed germination', icon: '🌱' };
  if (weekNum === 3) return { title: 'Early Leaf Growth & Weed Check', subtitle: 'Remove unwanted weeds & inspect young leaves', icon: '🌿' };
  if (weekNum === 4) return { title: 'Branching & First Fertilizer Top-Dressing', subtitle: 'Apply 1st split Urea fertilizer for strong stems', icon: '🌾' };
  if (weekNum === 5) return { title: 'Full Crop Canopy Growth', subtitle: 'Ensure proper soil moisture & inspect for insects', icon: '☘️' };
  if (weekNum === 6) return { title: 'Stem Jointing & Strength Phase', subtitle: 'Spraying nutrients (0-52-34) to make stems strong', icon: '🎋' };
  if (weekNum === 7) return { title: 'Flag Leaf Protection Stage', subtitle: 'Protect upper main leaf — gives 50% grain weight!', icon: '🍃' };
  if (weekNum === 8) return { title: 'Bud Swelling & Earhead Formation', subtitle: 'Ensure field is moist; crop is building flower buds', icon: '🌾' };
  if (weekNum === 9) return { title: 'Flower Head Emergence', subtitle: 'Earheads popping out. Spray Boron for pollen health', icon: '🌼' };
  if (weekNum === 10) return { title: 'Peak Flowering Stage (NO CHEMICAL SPRAY)', subtitle: 'Let bees pollinate naturally. Do NOT spray pesticides now!', icon: '🌸' };
  if (weekNum === 11) return { title: 'Watery Milk Grain Filling', subtitle: 'Grains are filling with watery milk. Maintain moist soil', icon: '🥛' };
  if (weekNum === 12) return { title: 'Thick Milk & Grain Weight Build', subtitle: 'Potassium spray to make grains heavy and shiny', icon: '🌽' };
  if (weekNum === 13) return { title: 'Soft Dough Grain Hardening', subtitle: 'Grains getting solid. Stop flood watering gradually', icon: '🌾' };
  if (weekNum === 14) return { title: 'Field Drying & Golden Color', subtitle: 'Crop turning golden brown. Stop irrigation completely', icon: '☀️' };
  if (weekNum === 15) return { title: 'Harvesting Day & Grain Moisture Test', subtitle: 'Harvest with combine/reaper when grains reach 14% moisture', icon: '🚜' };
  return { title: 'Threshing, Storage & Selling at Mandi', subtitle: 'Sell produce at high market rate & clear field stubble', icon: '💰' };
}

export default function CropRoadmapView({ cropName = 'Wheat', areaAcres = 2.5 }: CropRoadmapViewProps) {
  const [selectedCrop, setSelectedCrop] = useState(cropName);
  const [acres, setAcres] = useState(areaAcres);
  const [sowingDate, setSowingDate] = useState('2026-11-01');
  const [soilType, setSoilType] = useState('Alluvial / Sandy Loam');
  const [budget, setBudget] = useState(50000);

  const [viewMode, setViewMode] = useState<'simple' | 'scientific'>('simple');
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeWeek, setActiveWeek] = useState<number>(4);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 4: true, 1: true });
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Fetch or generate roadmap
  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const fertCalc = calculateFertilizerDosage(selectedCrop, acres, 2.2, 40, 15, 80);
      const sprayCalc = calculateKnapsackPumpDosage(acres, 2.0);

      const steps: WeeklyExecutionStep[] = Array.from({ length: 16 }, (_, i) => {
        const w = i + 1;
        const bbch = w === 1 ? 0 : w === 2 ? 10 : w <= 5 ? 21 : w <= 8 ? 35 : w <= 10 ? 60 : w <= 14 ? 75 : 90;
        
        let fertName = '19-19-19 Foliar NPK';
        let fertDose = `${(3 * acres).toFixed(1)} kg total`;
        let pumpDose = `${(225 * acres).toFixed(0)}g per 15L pump (${sprayCalc.total15LPumps} pumps needed)`;

        if (w === 1) {
          fertName = `DAP (18-46-0) & MOP (0-0-60)`;
          fertDose = `${fertCalc.dapBags50kg} Bags DAP (${fertCalc.dapNeededKg}kg) + ${fertCalc.mopBags50kg} Bags MOP (${fertCalc.mopNeededKg}kg)`;
          pumpDose = `Basal soil application (${acres} acres total)`;
        } else if (w === 4) {
          fertName = `Urea (46% N) 1st Split`;
          fertDose = `${fertCalc.ureaBags50kg} Bags Urea (${fertCalc.ureaNeededKg}kg total)`;
          pumpDose = `Top-dressing broadcast / fertigation (${acres} acres)`;
        }

        return {
          week_number: w,
          bbch_stage_code: bbch,
          stage_name: `BBCH ${bbch} - ${w <= 2 ? 'Germination & Seedling' : w <= 5 ? 'Active Tillering' : w <= 8 ? 'Stem Jointing & Booting' : w <= 10 ? 'Anthesis & Flowering' : w <= 14 ? 'Grain Milking & Dough' : 'Harvest & Storage'}`,
          gdd_target_accumulated: Math.round((w / 16) * 1650),
          primary_operation: w === 1 ? 'Land preparation & basal DAP/MOP broadcast' : w === 4 ? 'Tillering boost & Urea split application' : w === 8 ? 'Flag leaf protection & Boron spray' : w === 15 ? 'Combine harvesting & grain moisture test' : `Field operation & irrigation split W${w}`,
          fertilizer_inputs: [
            {
              name: fertName,
              dose_per_acre: fertDose,
              pump_15l_dose: pumpDose,
              purpose: 'NPK Crop Nutrition',
            }
          ],
          ipm_scouting_guidelines: [`Scout field for ${w <= 5 ? 'weeds & aphids' : 'rust pustules & blights'}`, 'Inspect plant density per m²'],
          frac_irac_codes: [w <= 4 ? 'FRAC M03' : 'FRAC 3 + IRAC 4A'],
          phi_days_countdown: Math.max(0, 120 - w * 7),
          labor_mandays_required: Number((2.0 * Math.sqrt(acres)).toFixed(1)),
          estimated_cost_inr: Math.round(2500 * acres * (w === 1 || w === 15 ? 1.5 : 0.8)),
          risk_mitigation_notes: w === 4 ? 'CRI stage is critical for irrigation; avoid water stress.' : 'Maintain ideal soil moisture.',
        };
      });

      setRoadmap({
        farm_id: `FARM-${selectedCrop.toUpperCase()}-LOCAL`,
        crop_name: selectedCrop,
        area_acres: acres,
        sowing_date: sowingDate,
        total_gdd_target: 1650,
        estimated_total_cost_inr: Math.round(45000 * acres),
        estimated_yield_q_per_acre: Number((24.5 * acres).toFixed(1)),
        execution_steps: steps,
      });

      // Try server endpoint if available
      try {
        const res = await fetch('/api/roadmap/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop_name: selectedCrop,
            area_acres: acres,
            sowing_date: sowingDate,
            soil_type: soilType,
            budget_inr: budget,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.execution_steps && data.execution_steps.length) {
            setRoadmap(data);
          }
        }
      } catch {
        // Keep local dynamic calculation
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [selectedCrop, acres]);

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      toast.success(updated[taskId] ? 'Task completed! 🌾' : 'Task pending.');
      return updated;
    });
  };

  const currentStep = roadmap?.execution_steps?.find((s) => s.week_number === activeWeek) || roadmap?.execution_steps?.[3];
  const simpleCurrent = getSimpleStageName(activeWeek, selectedCrop);
  const gddProgressPct = roadmap ? Math.min(100, Math.round(((currentStep?.gdd_target_accumulated || 310) / (roadmap.total_gdd_target || 1650)) * 100)) : 25;

  const weeklyExpenseINR = currentStep?.estimated_cost_inr ?? Math.round(2500 * acres * (activeWeek === 1 || activeWeek === 15 ? 1.5 : 0.8));
  const laborMandays = currentStep?.labor_mandays_required ?? Number((2.0 * Math.sqrt(acres)).toFixed(1));
  const targetYieldQ = roadmap?.estimated_yield_q_per_acre ?? Number((24.5 * acres).toFixed(1));

  return (
    <div className="space-y-6">
      {/* View Mode Switcher Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-2xl border border-green-200 shadow-sm gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
            👨‍🌾
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Farmer Road Guide</h3>
            <p className="text-xs text-gray-500">Simple step-by-step instructions for small & marginal farmers</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('simple')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              viewMode === 'simple'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👨‍🌾 Simple Farmer Guide
          </button>
          <button
            onClick={() => setViewMode('scientific')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              viewMode === 'scientific'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔬 Scientific (BBCH & GDD)
          </button>
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs px-3 py-1">
                {selectedCrop} — {acres} Acres
              </Badge>
              <Badge className="bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs px-3 py-1">
                Week {activeWeek} of 16
              </Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span>{simpleCurrent.icon}</span> {viewMode === 'simple' ? simpleCurrent.title : currentStep?.stage_name}
            </h2>
            <p className="text-sm text-emerald-100/90 mt-1 max-w-xl">
              {viewMode === 'simple' ? simpleCurrent.subtitle : currentStep?.primary_operation}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setConfigModalOpen(true)}
              className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold shadow-md text-xs h-10 px-4"
            >
              <Sliders className="w-4 h-4 mr-1.5 text-emerald-700" />
              Change Crop / Acres
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className="bg-emerald-900/60 hover:bg-emerald-900 text-white border border-emerald-400/40 text-xs h-10 px-3 flex items-center justify-center shadow-sm"
              title="Print Farm Guide"
            >
              <Printer className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="mt-6 pt-5 border-t border-emerald-600/40 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-900/40 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-500/30">
            <p className="text-xs text-emerald-200 font-medium">Crop Growth Progress</p>
            <div className="flex items-center justify-between text-base font-bold text-white mt-1">
              <span>Week {activeWeek} / 16</span>
              <span className="text-emerald-300">{gddProgressPct}%</span>
            </div>
            <Progress value={gddProgressPct} className="h-2 bg-emerald-950 mt-2" />
          </div>

          <div className="bg-emerald-900/40 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-500/30">
            <p className="text-xs text-emerald-200 font-medium">Weekly Expense</p>
            <p className="text-lg font-bold text-amber-300 mt-0.5">₹{weeklyExpenseINR.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-emerald-300">For total {acres} acres</p>
          </div>

          <div className="bg-emerald-900/40 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-500/30">
            <p className="text-xs text-emerald-200 font-medium">Labor Needed</p>
            <p className="text-lg font-bold text-white mt-0.5">{laborMandays} Mandays</p>
            <p className="text-[11px] text-emerald-300">Worker days this week</p>
          </div>

          <div className="bg-emerald-900/40 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-500/30">
            <p className="text-xs text-emerald-200 font-medium">Target Harvest Yield</p>
            <p className="text-lg font-bold text-emerald-300 mt-0.5">{targetYieldQ} Quintals</p>
            <p className="text-[11px] text-emerald-300">Total expected produce</p>
          </div>
        </div>
      </div>

      {/* Week Buttons Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {roadmap?.execution_steps.map((step) => {
          const isActive = step.week_number === activeWeek;
          const isDone = step.week_number < activeWeek;
          const simpleInfo = getSimpleStageName(step.week_number, selectedCrop);

          return (
            <button
              key={step.week_number}
              onClick={() => {
                setActiveWeek(step.week_number);
                setExpandedWeeks((prev) => ({ ...prev, [step.week_number]: true }));
              }}
              className={`flex-shrink-0 px-3 py-2.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-300 scale-105'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                  {simpleInfo.icon} W{step.week_number}
                </span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <p className={`text-[10px] truncate max-w-[85px] mt-0.5 ${isActive ? 'text-emerald-100' : 'text-gray-500'}`}>
                {viewMode === 'simple' ? `Stage ${step.week_number}` : `BBCH ${step.bbch_stage_code}`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Simple 16-Week Cards List */}
      <div className="space-y-4">
        {roadmap?.execution_steps.map((step) => {
          const isExpanded = expandedWeeks[step.week_number] ?? false;
          const isActive = step.week_number === activeWeek;
          const simpleInfo = getSimpleStageName(step.week_number, selectedCrop);
          const task1Id = `w${step.week_number}_t1`;
          const task2Id = `w${step.week_number}_t2`;

          return (
            <Card
              key={step.week_number}
              className={`transition-all border-2 ${
                isActive
                  ? 'border-emerald-500 shadow-lg ring-1 ring-emerald-400 bg-white'
                  : 'border-gray-200 hover:border-emerald-300 bg-white'
              }`}
            >
              <CardHeader
                className="p-4 cursor-pointer select-none flex flex-row items-center justify-between bg-gray-50/50 hover:bg-emerald-50/30 transition-colors"
                onClick={() => toggleWeek(step.week_number)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {simpleInfo.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-gray-900 truncate">
                        Week {step.week_number}: {viewMode === 'simple' ? simpleInfo.title : step.stage_name}
                      </h3>
                      {viewMode === 'scientific' && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px]">
                          BBCH {step.bbch_stage_code}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 font-medium truncate">
                      👉 {simpleInfo.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gray-900">₹{step.estimated_cost_inr.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-gray-500">{step.labor_mandays_required} Labor Days</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="p-5 pt-3 border-t border-gray-100 space-y-4">
                  {/* Farmer Action Guide Boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. What to Apply (Fertilizer & Spray) */}
                    <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                        <Droplets className="w-4 h-4 text-emerald-700" /> 1. Fertilizer & Spray Recipe
                      </div>

                      {step.fertilizer_inputs.length === 0 ? (
                        <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-emerald-100">
                          ℹ️ No fertilizer needed this week. Just ensure regular light watering if soil gets dry.
                        </p>
                      ) : (
                        step.fertilizer_inputs.map((f, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                              <span>🌾 {f.name}</span>
                              <Badge className="bg-emerald-600 text-white text-[11px]">{f.dose_per_acre}</Badge>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg text-xs text-emerald-900 font-medium flex items-center justify-between">
                              <span>🪣 How to spray in 15L tank:</span>
                              <span className="font-bold text-emerald-700">{f.pump_15l_dose}</span>
                            </div>
                            <p className="text-[11px] text-gray-500">Why apply this: {f.purpose}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* 2. What to Watch Out For (Scouting & Warnings) */}
                    <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                          <ShieldAlert className="w-4 h-4 text-amber-700" /> 2. Field Inspection & Warnings
                        </div>
                        {step.phi_days_countdown > 0 && (
                          <Badge className="bg-amber-600 text-white text-[10px]">
                            Safety Window: {step.phi_days_countdown} Days
                          </Badge>
                        )}
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-amber-200/80 space-y-2">
                        {step.ipm_scouting_guidelines.map((guide, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-gray-800 font-medium">
                            <span className="text-amber-600 font-bold">🔍</span>
                            <span>{guide}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-2.5 bg-amber-100/70 rounded-xl text-xs text-amber-950 font-medium flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <span><strong>Farmer Tip:</strong> {step.risk_mitigation_notes}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Interactive Completion Checkboxes */}
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!completedTasks[task1Id]}
                          onChange={() => toggleTask(task1Id)}
                          className="w-4 h-4 accent-emerald-600 rounded"
                        />
                        <span className={`text-xs font-semibold ${completedTasks[task1Id] ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          ✅ Done Fertilizer / Spray for Week {step.week_number}
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!completedTasks[task2Id]}
                          onChange={() => toggleTask(task2Id)}
                          className="w-4 h-4 accent-emerald-600 rounded"
                        />
                        <span className={`text-xs font-semibold ${completedTasks[task2Id] ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          👨‍🌾 Done {step.labor_mandays_required} Labor Days
                        </span>
                      </label>
                    </div>

                    <div className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Cost: ₹{step.estimated_cost_inr.toLocaleString('en-IN')}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Configurator Modal */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <Sliders className="w-5 h-5 text-emerald-600" /> Change Crop or Farm Size
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Select your crop and farm size to calculate exact fertilizer bags and spray pump doses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-gray-700">Select Your Crop</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full mt-1 p-2.5 border rounded-xl text-sm font-semibold bg-white"
              >
                <option value="Wheat">Wheat (Kanak / Gehu)</option>
                <option value="Rice">Paddy Rice (Dhan)</option>
                <option value="Maize">Maize (Makki)</option>
                <option value="Cotton">Cotton (Narma)</option>
                <option value="Potato">Potato (Aloo)</option>
                <option value="Tomato">Tomato (Tamatar)</option>
                <option value="Sugarcane">Sugarcane (Ganna)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Land Area (Acres)</label>
                <input
                  type="number"
                  step="0.5"
                  value={acres}
                  onChange={(e) => setAcres(parseFloat(e.target.value) || 1)}
                  className="w-full mt-1 p-2.5 border rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Sowing Date</label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full mt-1 p-2.5 border rounded-xl text-sm font-semibold"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                setConfigModalOpen(false);
                fetchRoadmap();
                toast.success('Updated farmer execution plan!');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg"
            >
              Generate Farmer Execution Guide 🌾
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
