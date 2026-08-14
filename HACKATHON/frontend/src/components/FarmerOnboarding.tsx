import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sprout, CheckCircle2 } from 'lucide-react';

// ─── All crops available (Punjab-focused + common Indian crops) ───────────────
const CROP_OPTIONS = [
  { name: 'Wheat',      emoji: '🌾', season: 'Rabi (Oct–Apr)'   },
  { name: 'Rice',       emoji: '🍚', season: 'Kharif (Jun–Nov)' },
  { name: 'Maize',      emoji: '🌽', season: 'Kharif (Jun–Sep)' },
  { name: 'Cotton',     emoji: '🌿', season: 'Kharif (May–Nov)' },
  { name: 'Sugarcane',  emoji: '🎋', season: 'Year-round'        },
  { name: 'Potato',     emoji: '🥔', season: 'Rabi (Oct–Mar)'   },
  { name: 'Onion',      emoji: '🧅', season: 'Rabi (Nov–Apr)'   },
  { name: 'Tomato',     emoji: '🍅', season: 'Year-round'        },
  { name: 'Soybean',    emoji: '🫘', season: 'Kharif (Jun–Oct)' },
  { name: 'Groundnut',  emoji: '🥜', season: 'Kharif (Jun–Oct)' },
  { name: 'Turmeric',   emoji: '🟡', season: 'Kharif (Jun–Jan)' },
  { name: 'Banana',     emoji: '🍌', season: 'Year-round'        },
  { name: 'Mango',      emoji: '🥭', season: 'Summer (Mar–Jun)' },
  { name: 'Coconut',    emoji: '🥥', season: 'Year-round'        },
  { name: 'Pepper',     emoji: '🫙', season: 'Kharif (Aug–Feb)' },
];

export interface FarmerProfile {
  name: string;
  state: string;
  location: string;
  primaryCrops: string[];
  points: number;
  level: string;
}

const STORAGE_KEY = 'agrismart_farmer_profile';

export function loadProfile(): FarmerProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: FarmerProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  localStorage.removeItem(STORAGE_KEY);
}

interface Props {
  onComplete: (profile: FarmerProfile) => void;
  defaultName?: string;
  defaultState?: string;
  defaultLocation?: string;
}

export default function FarmerOnboarding({ 
  onComplete, 
  defaultName = 'Farmer',
  defaultState = 'Punjab',
  defaultLocation = 'Ludhiana, Punjab'
}: Props) {
  const { t } = useTranslation();
  // Start with empty selected crops so nothing is highlighted beforehand
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropError, setCropError] = useState('');
  const [isDone, setIsDone] = useState(false);

  function toggleCrop(crop: string) {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
    setCropError('');
  }

  function handleFinish() {
    if (selectedCrops.length === 0) {
      setCropError(t('onboarding.selectAtLeastOne'));
      return;
    }
    const profile: FarmerProfile = {
      name: defaultName,
      state: defaultState,
      location: defaultLocation,
      primaryCrops: selectedCrops,
      points: 1250,
      level: 'Advanced Farmer',
    };
    saveProfile(profile);
    setIsDone(true);
    setTimeout(() => onComplete(profile), 800);
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t('onboarding.settingUp')}</h2>
          <div className="flex justify-center gap-1 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sprout className="w-6 h-6 text-green-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('onboarding.title')}</h2>
            <p className="text-sm text-gray-500">{t('onboarding.subtitle')}</p>
          </div>
        </div>

        {/* Crop Grid */}
        <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {CROP_OPTIONS.map((crop) => {
            const selected = selectedCrops.includes(crop.name);
            return (
              <button
                key={crop.name}
                type="button"
                onClick={() => toggleCrop(crop.name)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? 'border-green-500 bg-green-50/80 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <span className="text-2xl">{crop.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-sm ${selected ? 'text-green-900' : 'text-gray-700'}`}>
                    {crop.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{crop.season}</p>
                </div>
                {selected && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Selected Crop Badges */}
        {selectedCrops.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedCrops.map((c) => (
              <Badge key={c} className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer text-xs py-1 px-2.5"
                onClick={() => toggleCrop(c)}>
                {c} ✕
              </Badge>
            ))}
          </div>
        )}

        {cropError && <p className="text-red-500 text-sm font-medium">{cropError}</p>}

        {/* Start Farming Button */}
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold rounded-xl shadow-lg shadow-emerald-600/20"
          onClick={handleFinish}
        >
          {t('onboarding.startFarming')}
        </Button>
      </div>
    </div>
  );
}
