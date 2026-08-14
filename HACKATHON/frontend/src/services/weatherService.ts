export interface PunjabLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  district: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
}

// All 23 Administrative Districts of Punjab, India with exact coordinates
export const PUNJAB_LOCATIONS: PunjabLocation[] = [
  { id: 'amritsar', name: 'Amritsar', lat: 31.6340, lon: 74.8723, district: 'Amritsar', region: 'North' },
  { id: 'barnala', name: 'Barnala', lat: 30.3819, lon: 75.5468, district: 'Barnala', region: 'Central' },
  { id: 'bathinda', name: 'Bathinda', lat: 30.2110, lon: 74.9455, district: 'Bathinda', region: 'South' },
  { id: 'faridkot', name: 'Faridkot', lat: 30.6769, lon: 74.7460, district: 'Faridkot', region: 'West' },
  { id: 'fatehgarh-sahib', name: 'Fatehgarh Sahib', lat: 30.6480, lon: 76.3980, district: 'Fatehgarh Sahib', region: 'East' },
  { id: 'fazilka', name: 'Fazilka', lat: 30.4037, lon: 74.0254, district: 'Fazilka', region: 'West' },
  { id: 'ferozepur', name: 'Ferozepur', lat: 30.9237, lon: 74.6122, district: 'Ferozepur', region: 'West' },
  { id: 'gurdaspur', name: 'Gurdaspur', lat: 32.0419, lon: 75.4053, district: 'Gurdaspur', region: 'North' },
  { id: 'hoshiarpur', name: 'Hoshiarpur', lat: 31.5143, lon: 75.9115, district: 'Hoshiarpur', region: 'East' },
  { id: 'jalandhar', name: 'Jalandhar', lat: 31.3260, lon: 75.5762, district: 'Jalandhar', region: 'Central' },
  { id: 'kapurthala', name: 'Kapurthala', lat: 31.3800, lon: 75.3800, district: 'Kapurthala', region: 'Central' },
  { id: 'ludhiana', name: 'Ludhiana', lat: 30.9010, lon: 75.8573, district: 'Ludhiana', region: 'Central' },
  { id: 'malerkotla', name: 'Malerkotla', lat: 30.5257, lon: 75.8812, district: 'Malerkotla', region: 'Central' },
  { id: 'mansa', name: 'Mansa', lat: 29.9875, lon: 75.3860, district: 'Mansa', region: 'South' },
  { id: 'moga', name: 'Moga', lat: 30.8165, lon: 75.1717, district: 'Moga', region: 'Central' },
  { id: 'mohali', name: 'Mohali (SAS Nagar)', lat: 30.7046, lon: 76.7179, district: 'SAS Nagar', region: 'East' },
  { id: 'muktsar', name: 'Sri Muktsar Sahib', lat: 30.4764, lon: 74.5168, district: 'Sri Muktsar Sahib', region: 'South' },
  { id: 'pathankot', name: 'Pathankot', lat: 32.2643, lon: 75.6421, district: 'Pathankot', region: 'North' },
  { id: 'patiala', name: 'Patiala', lat: 30.3398, lon: 76.3869, district: 'Patiala', region: 'East' },
  { id: 'rupnagar', name: 'Rupnagar (Ropar)', lat: 30.9664, lon: 76.5234, district: 'Rupnagar', region: 'East' },
  { id: 'sangrur', name: 'Sangrur', lat: 30.2458, lon: 75.8421, district: 'Sangrur', region: 'South' },
  { id: 'sbs-nagar', name: 'Nawanshahr (SBS Nagar)', lat: 31.1256, lon: 76.1187, district: 'Shaheed Bhagat Singh Nagar', region: 'East' },
  { id: 'tarn-taran', name: 'Tarn Taran', lat: 31.4517, lon: 74.9269, district: 'Tarn Taran', region: 'North' },
];

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  windSpeed: number;
  windDirection: number;
  surfacePressure: number;
  cloudCover: number;
  weatherCode: number;
  time: string;
}

export interface HourlyForecastItem {
  time: string;
  temp: number;
  humidity: number;
  precipitationProb: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
}

export interface DailyForecastItem {
  day: string;
  date: string;
  maxTemp: number;
  minTemp: number;
  avgTemp: number;
  precipitationSum: number;
  weatherCode: number;
}

export interface MonthlyClimateItem {
  month: string;
  monthFull: string;
  avgTemp: number;
  rainfall: number;
}

export interface OpenMeteoWeatherResponse {
  location: PunjabLocation;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  monthlyClimate: MonthlyClimateItem[];
  fetchedAt: Date;
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Punjab seasonal monthly climate baselines (Monthly Temp °C, Monthly Rainfall mm)
const PUNJAB_BASE_CLIMATE: Record<number, { temp: number; rain: number }> = {
  0: { temp: 13, rain: 25 },  // Jan
  1: { temp: 16, rain: 30 },  // Feb
  2: { temp: 22, rain: 20 },  // Mar
  3: { temp: 28, rain: 15 },  // Apr
  4: { temp: 34, rain: 18 },  // May
  5: { temp: 36, rain: 60 },  // Jun
  6: { temp: 32, rain: 210 }, // Jul
  7: { temp: 31, rain: 180 }, // Aug
  8: { temp: 30, rain: 100 }, // Sep
  9: { temp: 26, rain: 25 },  // Oct
  10: { temp: 20, rain: 10 }, // Nov
  11: { temp: 14, rain: 15 }, // Dec
};

export function calculateDynamic6MonthClimate(
  location: PunjabLocation,
  currentTemp: number,
  currentRain: number
): MonthlyClimateItem[] {
  const currentDate = new Date();
  const currentMonthIdx = currentDate.getMonth();

  // Regional adjustment multipliers for Punjab districts
  let tempShift = 0;
  let rainMult = 1.0;

  switch (location.region) {
    case 'North': // Sub-mountainous foothill zone (Pathankot, Gurdaspur)
      tempShift = -1.5;
      rainMult = 1.2;
      break;
    case 'South': // Semi-arid southern zone (Bathinda, Mansa, Muktsar)
      tempShift = 1.5;
      rainMult = 0.75;
      break;
    case 'West': // Border plain zone (Fazilka, Ferozepur)
      tempShift = 1.0;
      rainMult = 0.8;
      break;
    case 'East': // Eastern sub-plain (Mohali, Patiala, Ropar)
      tempShift = -0.5;
      rainMult = 1.1;
      break;
    case 'Central': // Central agricultural heartland (Ludhiana, Jalandhar)
    default:
      tempShift = 0;
      rainMult = 1.0;
      break;
  }

  // Calculate live temperature anomaly relative to current month's baseline
  const currentMonthBaseTemp = PUNJAB_BASE_CLIMATE[currentMonthIdx].temp;
  const tempAnomalyRatio = currentTemp > 0 ? currentTemp / currentMonthBaseTemp : 1.0;

  const result: MonthlyClimateItem[] = [];

  for (let i = 0; i < 6; i++) {
    const targetMonthIdx = (currentMonthIdx + i) % 12;
    const base = PUNJAB_BASE_CLIMATE[targetMonthIdx];

    // Compute dynamic temperature adjusting for baseline, regional zone, and live observation anomaly
    const rawTemp = (base.temp + tempShift) * (0.5 + 0.5 * tempAnomalyRatio);
    const avgTemp = Math.round(Math.max(8, Math.min(45, rawTemp)));

    // Compute dynamic monthly rainfall adjusting for district climate zone and live rain inputs
    const liveRainBonus = i === 0 && currentRain > 0 ? currentRain * 5 : 0;
    const rawRain = (base.rain * rainMult) + liveRainBonus;
    const rainfall = Math.round(Math.max(5, rawRain));

    const year = currentDate.getFullYear() + (currentMonthIdx + i >= 12 ? 1 : 0);

    result.push({
      month: MONTH_NAMES_SHORT[targetMonthIdx],
      monthFull: `${MONTH_NAMES_FULL[targetMonthIdx]} ${year}`,
      avgTemp,
      rainfall,
    });
  }

  return result;
}

const WEATHER_CODE_KEYS: Record<number, string> = {
  0: 'clearSky',
  1: 'mainlyClear',
  2: 'partlyCloudy',
  3: 'overcast',
  45: 'foggy',
  48: 'rimeFog',
  51: 'lightDrizzle',
  53: 'moderateDrizzle',
  55: 'denseDrizzle',
  61: 'slightRain',
  63: 'moderateRain',
  65: 'heavyRain',
  71: 'slightSnow',
  73: 'moderateSnow',
  75: 'heavySnow',
  80: 'slightRainShowers',
  81: 'moderateRainShowers',
  82: 'violentRainShowers',
  95: 'thunderstorm',
  96: 'thunderstormSlightHail',
  99: 'thunderstormHeavyHail',
};

/** Returns a translation key under `weather.codes.*` — pass through t('weather.codes.' + key) to render. */
export function getWeatherConditionKey(code: number): string {
  return WEATHER_CODE_KEYS[code] || 'partlyCloudy';
}

export async function fetchPunjabWeatherData(
  location: PunjabLocation,
  signal?: AbortSignal
): Promise<OpenMeteoWeatherResponse> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Asia%2FKolkata`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch weather data from Open-Meteo (${response.status})`);
  }

  const data = await response.json();

  const current: CurrentWeather = {
    temperature: Math.round(data.current.temperature_2m),
    apparentTemperature: Math.round(data.current.apparent_temperature),
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    rain: data.current.rain,
    windSpeed: Math.round(data.current.wind_speed_10m),
    windDirection: data.current.wind_direction_10m,
    surfacePressure: Math.round(data.current.surface_pressure),
    cloudCover: data.current.cloud_cover,
    weatherCode: data.current.weather_code,
    time: data.current.time,
  };

  const hourly: HourlyForecastItem[] = (data.hourly.time || []).slice(0, 24).map((timeStr: string, idx: number) => ({
    time: new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: Math.round(data.hourly.temperature_2m[idx]),
    humidity: data.hourly.relative_humidity_2m[idx],
    precipitationProb: data.hourly.precipitation_probability[idx] || 0,
    precipitation: data.hourly.precipitation[idx] || 0,
    weatherCode: data.hourly.weather_code[idx] || 0,
    windSpeed: Math.round(data.hourly.wind_speed_10m[idx] || 0),
  }));

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const daily: DailyForecastItem[] = (data.daily.time || []).map((dateStr: string, idx: number) => {
    const d = new Date(dateStr);
    const maxTemp = Math.round(data.daily.temperature_2m_max[idx]);
    const minTemp = Math.round(data.daily.temperature_2m_min[idx]);
    return {
      day: dayNames[d.getDay()],
      date: dateStr,
      maxTemp,
      minTemp,
      avgTemp: Math.round((maxTemp + minTemp) / 2),
      precipitationSum: Math.round((data.daily.precipitation_sum[idx] || 0) * 10) / 10,
      weatherCode: data.daily.weather_code[idx] || 0,
    };
  });

  // Calculate dynamic 6-month climate forecast for the selected Punjab district
  const monthlyClimate = calculateDynamic6MonthClimate(
    location,
    current.temperature,
    current.precipitation
  );

  return {
    location,
    current,
    hourly,
    daily,
    monthlyClimate,
    fetchedAt: new Date(),
  };
}

