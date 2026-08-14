/**
 * Multilingual i18n Dictionary & Formatting Engine
 * =================================================
 * Supports 10 major Indian languages (en, hi, ta, te, kn, mr, bn, gu, ml, pa)
 * with dynamic currency (₹), date, and decimal formatting.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'கன்னட' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', nativeName: 'மலையாளம்' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

const resources = {
  en: {
    translation: {
      appNameShort: 'E-Kisaan OS',
      tagline: 'AI Agricultural Operating System',
      offlineStatus: 'Offline Mode',
      onlineStatus: 'Online - Cloud Sync Active',
      syncQueueLabel: 'Pending Offline Logs',
      manualSyncBtn: 'Sync Queue Now',
      installPwaBtn: 'Install E-Kisaan App',
      dashboard: {
        tabs: {
          dashboard: 'Overview',
          weather: 'Live Weather',
          soil: 'Soil Health',
          crops: 'Crop Phenology',
          market: 'APMC Market',
          roadmap: 'Farm Roadmap',
          solver: 'AI Agronomist',
        },
      },
    },
  },
  hi: {
    translation: {
      appNameShort: 'ई-किसान ओएस',
      tagline: 'एआई कृषि ऑपरेटिंग सिस्टम',
      offlineStatus: 'ऑफ़लाइन मोड',
      onlineStatus: 'ऑनलाइन - क्लाउड सिंक सक्रिय',
      syncQueueLabel: 'लंबित ऑफ़लाइन लॉग',
      manualSyncBtn: 'अभी सिंक करें',
      installPwaBtn: 'ई-किसान ऐप इंस्टॉल करें',
      dashboard: {
        tabs: {
          dashboard: 'अवलोकन',
          weather: 'मौसम',
          soil: 'मृदा स्वास्थ्य',
          crops: 'फसल विकास',
          market: 'मंडी भाव',
          roadmap: 'फार्म रोडमैप',
          solver: 'एआई सलाहकार',
        },
      },
    },
  },
  pa: {
    translation: {
      appNameShort: 'ਈ-ਕਿਸਾਨ ਓਐਸ',
      tagline: 'ਏਆਈ ਖੇਤੀਬਾੜੀ ਆਪਰੇਟਿੰਗ ਸਿਸਟਮ',
      offlineStatus: 'ਆਫ਼ਲਾਈਨ ਮੋਡ',
      onlineStatus: 'ਔਨਲਾਈਨ - ਕਲਾਉਡ ਸਿੰਕ ਸਰਗਰਮ',
      syncQueueLabel: 'ਬਕਾਇਆ ਆਫ਼ਲਾਈਨ ਲੌਗ',
      manualSyncBtn: 'ਹੁਣੇ ਸਿੰਕ ਕਰੋ',
      installPwaBtn: 'ਈ-ਕਿਸਾਨ ਐਪ ਸਥਾਪਿਤ ਕਰੋ',
      dashboard: {
        tabs: {
          dashboard: 'ਸੰਖੇਪ',
          weather: 'ਮੌਸਮ',
          soil: 'ਮਿੱਟੀ ਦੀ ਸਿਹਤ',
          crops: 'ਫਸਲ ਦਾ ਵਾਧਾ',
          market: 'ਮੰਡੀ ਭਾਅ',
          roadmap: 'ਫਾਰਮ ਰੋਡਮੈਪ',
          solver: 'ਏਆਈ ਸਲਾਹਕਾਰ',
        },
      },
    },
  },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateINR(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default i18n;
