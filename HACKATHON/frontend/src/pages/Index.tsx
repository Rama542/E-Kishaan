import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LanguageToggle from '@/components/LanguageToggle';
import { Bell, CloudRain, Leaf, TrendingUp, Zap, LogOut, Map, Edit3 } from 'lucide-react';
import WeatherDashboard from '@/components/WeatherDashboard';
import SoilFertility from '@/components/SoilFertility';
import CropGrowth from '@/components/CropGrowth';
import MarketAnalysis from '@/components/MarketAnalysis';
import FrankensteinSolver from '@/components/FrankensteinSolver';
import FarmRoadmap from '@/components/FarmRoadmap';
import CropRoadmapView from '@/components/CropRoadmapView';
import FarmJournalView from '@/components/FarmJournalView';
import FarmerOnboarding, { clearProfile } from '@/components/FarmerOnboarding';
import AlertsCenter, { AlertItem } from '@/components/AlertsCenter';
import OfflineBanner from '@/components/OfflineBanner';
import LiveExecutiveDashboard from '@/components/LiveExecutiveDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

// ─── Farmer profile shape ────────────────────────────────────────────────────
interface FarmerProfile {
  name: string;
  location: string;
  state: string;
  primaryCrops: string[];
  points?: number;
  level?: string;
}

const PROFILE_KEY = 'agrismart_farmer_profile';
const SESSION_CROP_KEY = 'ekisaan_session_crop_selected';
const ALERTS_STORAGE_KEY = 'ekisaan_user_alerts';

function loadProfile(): FarmerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getStoredUnreadAlertsCount(): number {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (raw) {
      const items: AlertItem[] = JSON.parse(raw);
      return items.filter((i) => !i.read).length;
    }
  } catch {}
  return 3;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Index() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [roadmapSubTab, setRoadmapSubTab] = useState<'roadmap' | 'journal' | 'planner'>('roadmap');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(getStoredUnreadAlertsCount);

  // Farmer profile from onboarding (localStorage)
  const [farmer, setFarmer] = useState<FarmerProfile | null>(() => loadProfile());

  // Session-based flag to ensure crop selection is shown right after login
  const [cropSelectionDone, setCropSelectionDone] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_CROP_KEY) === 'true';
  });

  // Re-read profile if it changes
  useEffect(() => {
    const stored = loadProfile();
    if (stored) setFarmer(stored);
  }, []);

  // Sync unread count periodically or when dialog opens/closes
  useEffect(() => {
    setUnreadAlertsCount(getStoredUnreadAlertsCount());
  }, [alertsOpen]);

  const handleOnboardingComplete = (profile: FarmerProfile) => {
    sessionStorage.setItem(SESSION_CROP_KEY, 'true');
    setFarmer(profile);
    setCropSelectionDone(true);
  };

  const handleReopenCropSelection = () => {
    setCropSelectionDone(false);
  };

  // Show crop selection screen if profile is missing OR crop selection not done for this login session
  if (!farmer || !cropSelectionDone) {
    return (
      <FarmerOnboarding
        onComplete={handleOnboardingComplete}
        defaultName={authProfile?.name || authUser?.email?.split('@')[0] || farmer?.name || 'Farmer'}
        defaultLocation={authProfile?.location || farmer?.location || 'Ludhiana, Punjab'}
        defaultState={farmer?.state || 'Punjab'}
      />
    );
  }

  // Display name: prefer auth profile > onboarding name
  const displayName     = authProfile?.name || authUser?.email || farmer.name;
  const displayLocation = authProfile?.location || farmer.location;
  const initials = displayName
    .split(' ')
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem(SESSION_CROP_KEY);
      clearProfile();
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not log out.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
      {/* Offline Status & Sync Banner */}
      <OfflineBanner />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                  {t('common.appNameShort') || 'E-Kisaan'}
                </h1>
                <p className="text-sm text-gray-600">{t('common.tagline') || 'AI-Powered Farming Assistant'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Language toggle */}
              <LanguageToggle size="sm" />

              {/* Functional Alerts Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAlertsOpen(true)}
                className="relative flex items-center gap-1.5 hover:bg-green-50 border-green-300 transition-all"
              >
                <Bell className="w-4 h-4 text-green-700" />
                <span>{t('common.alerts') || 'Alerts'}</span>
                {unreadAlertsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 min-w-[20px] h-5 p-0.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold shadow-sm animate-pulse">
                    {unreadAlertsCount}
                  </Badge>
                )}
              </Button>

              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback>{initials || 'TF'}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{displayName}</p>
                  <p className="text-gray-500 text-xs">{displayLocation}</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t('common.logOut') || 'Log out'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('dashboard.tabs.dashboard') || 'Dashboard'}
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <CloudRain className="w-4 h-4" />
              {t('dashboard.tabs.weather') || 'Weather'}
            </TabsTrigger>
            <TabsTrigger value="soil" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              {t('dashboard.tabs.soil') || 'Soil Health'}
            </TabsTrigger>
            <TabsTrigger value="crops" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              {t('dashboard.tabs.crops') || 'Crop Growth'}
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('dashboard.tabs.market') || 'Market'}
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center gap-2">
              <Map className="w-4 h-4 text-emerald-600" />
              {t('dashboard.tabs.roadmap') || 'My Farm Roadmap'}
            </TabsTrigger>
            <TabsTrigger value="solver" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t('dashboard.tabs.solver') || 'AI Solver'}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <LiveExecutiveDashboard
              farmer={{
                ...farmer,
                points: farmer.points ?? 0,
                level: farmer.level ?? 'Beginner',
              }}
              onNavigateTab={(tabKey, subTab) => {
                setActiveTab(tabKey);
                if (subTab === 'roadmap' || subTab === 'journal' || subTab === 'planner') {
                  setRoadmapSubTab(subTab);
                }
              }}
              onEditCrops={handleReopenCropSelection}
            />
          </TabsContent>

          <TabsContent value="weather">
            <WeatherDashboard />
          </TabsContent>

          <TabsContent value="soil">
            <SoilFertility />
          </TabsContent>

          <TabsContent value="crops">
            <CropGrowth />
          </TabsContent>

          {/* Market — personalised with farmer's crops & state */}
          <TabsContent value="market">
            <MarketAnalysis
              primaryCrops={farmer.primaryCrops}
              state={farmer.state}
            />
          </TabsContent>

          {/* Farm Roadmap & Operating Journal */}
          <TabsContent value="roadmap" className="space-y-6">
            <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-green-200 shadow-sm flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRoadmapSubTab('roadmap')}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    roadmapSubTab === 'roadmap'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  🌾 16-Week Crop Roadmap
                </button>
                <button
                  onClick={() => setRoadmapSubTab('journal')}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    roadmapSubTab === 'journal'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  📓 Double-Entry Farm Journal
                </button>
                <button
                  onClick={() => setRoadmapSubTab('planner')}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    roadmapSubTab === 'planner'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  📋 AI Daily Planner & Tasks
                </button>
              </div>

              <div className="text-xs text-gray-500 font-medium px-2">
                Active Crop: <strong className="text-emerald-800">{farmer.primaryCrops[0] || 'Wheat'}</strong>
              </div>
            </div>

            {roadmapSubTab === 'roadmap' && (
              <CropRoadmapView cropName={farmer.primaryCrops[0] || 'Wheat'} areaAcres={2.5} />
            )}

            {roadmapSubTab === 'journal' && (
              <FarmJournalView farmId={`FARM-${(farmer.primaryCrops[0] || 'WHEAT').toUpperCase()}-101`} />
            )}

            {roadmapSubTab === 'planner' && (
              <FarmRoadmap />
            )}
          </TabsContent>

          <TabsContent value="solver">
            <FrankensteinSolver />
          </TabsContent>
        </Tabs>
      </main>

      {/* Interactive Alerts Center Modal */}
      <AlertsCenter
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        farmerCrops={farmer.primaryCrops}
        location={displayLocation}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
