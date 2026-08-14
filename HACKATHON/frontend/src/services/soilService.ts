export interface DistrictSummary {
  name: string;
  lat: number;
  lng: number;
  zone: string;
  soilType: string;
  ph: number;
  healthScore: number;
  healthStatus: string;
  recommendedCrop: string;
}

export interface SoilNutrients {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  sulphur: number;
  zinc: number;
  iron: number;
  copper: number;
  manganese: number;
  boron: number;
  calcium: number;
  magnesium: number;
}

export interface DistrictSoilReport {
  district: string;
  latitude: number;
  longitude: number;
  zone: string;
  soilType: string;
  soilTexture: string;
  soilDepth: string;
  drainage: string;
  waterHoldingCapacity: string;
  soilColor: string;
  soilPh: number;
  electricalConductivity: number;
  organicCarbon: number;
  soilHealthScore: number;
  soilHealthStatus: string;
  recommendedCrop: string;
  recommendedFertilizer: string;
  recommendedIrrigation: string;
  weather: {
    temp: number;
    rainfall: number;
    humidity: number;
    moisture: number;
  };
  nutrients: SoilNutrients;
  lastUpdated: string;
}

export interface SoilHistoryPoint {
  month: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon: number;
  ph: number;
  healthScore: number;
}

export interface DistrictComparisonData {
  district1: DistrictSoilReport;
  district2: DistrictSoilReport;
}

// Full 23 Punjab Districts Dataset Baseline Fallback
export const PUNJAB_DATASET_FALLBACK: Record<string, DistrictSoilReport> = {
  'Ludhiana': {
    district: 'Ludhiana', latitude: 30.9010, longitude: 75.8573, zone: 'Central Plain Zone',
    soilType: 'Rich Alluvial Loam', soilTexture: 'Silt Clay Loam', soilDepth: 'Very Deep (>150 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'Very High', soilColor: 'Dark Brown',
    soilPh: 7.2, electricalConductivity: 0.31, organicCarbon: 0.66, soilHealthScore: 88, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Wheat, Rice, Baby Corn, Mustard', recommendedFertilizer: 'Compost (2 tons), Urea (115kg), DAP (52kg), MOP (30kg)', recommendedIrrigation: 'Precision Drip (390mm)',
    weather: { temp: 28.5, rainfall: 0, humidity: 60, moisture: 45 },
    nutrients: { nitrogen: 95, phosphorus: 29, potassium: 185, sulphur: 15.2, zinc: 1.50, iron: 6.6, copper: 0.95, manganese: 4.9, boron: 0.72, calcium: 13.5, magnesium: 4.7 },
    lastUpdated: new Date().toISOString()
  },
  'Amritsar': {
    district: 'Amritsar', latitude: 31.6340, longitude: 74.8723, zone: 'Central Plain Zone',
    soilType: 'Alluvial Loam', soilTexture: 'Silt Loam', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Brownish Yellow',
    soilPh: 7.4, electricalConductivity: 0.35, organicCarbon: 0.58, soilHealthScore: 82, soilHealthStatus: 'Good',
    recommendedCrop: 'Wheat, Paddy, Sugarcane', recommendedFertilizer: 'Urea (110kg), DAP (45kg), Zinc Sulphate (10kg)', recommendedIrrigation: 'Canal + Drip (400mm)',
    weather: { temp: 27.8, rainfall: 2, humidity: 62, moisture: 42 },
    nutrients: { nitrogen: 82, phosphorus: 24, potassium: 185, sulphur: 12.4, zinc: 1.25, iron: 5.8, copper: 0.85, manganese: 4.2, boron: 0.62, calcium: 14.5, magnesium: 5.2 },
    lastUpdated: new Date().toISOString()
  },
  'Barnala': {
    district: 'Barnala', latitude: 30.3819, longitude: 75.5468, zone: 'South Western Plain Zone',
    soilType: 'Loamy Sand', soilTexture: 'Sandy Loam', soilDepth: 'Deep (>100 cm)', drainage: 'Moderately Drained', waterHoldingCapacity: 'Medium', soilColor: 'Light Brown',
    soilPh: 8.1, electricalConductivity: 0.52, organicCarbon: 0.42, soilHealthScore: 68, soilHealthStatus: 'Moderate',
    recommendedCrop: 'Cotton, Wheat, Mustard', recommendedFertilizer: 'Urea (90kg), Single Super Phosphate (60kg), MOP (20kg)', recommendedIrrigation: 'Drip & Sprinkler (320mm)',
    weather: { temp: 29.2, rainfall: 0, humidity: 55, moisture: 38 },
    nutrients: { nitrogen: 68, phosphorus: 18, potassium: 210, sulphur: 10.1, zinc: 0.88, iron: 4.2, copper: 0.65, manganese: 3.1, boron: 0.48, calcium: 16.2, magnesium: 6.1 },
    lastUpdated: new Date().toISOString()
  },
  'Bathinda': {
    district: 'Bathinda', latitude: 30.2110, longitude: 74.9455, zone: 'South Western Zone',
    soilType: 'Arid Desert Soil', soilTexture: 'Loamy Sand', soilDepth: 'Medium (60-100 cm)', drainage: 'Excessively Drained', waterHoldingCapacity: 'Low to Medium', soilColor: 'Pale Yellow',
    soilPh: 8.3, electricalConductivity: 0.68, organicCarbon: 0.38, soilHealthScore: 62, soilHealthStatus: 'Moderate',
    recommendedCrop: 'Cotton, Guar, Bajra, Wheat', recommendedFertilizer: 'Urea (95kg), DAP (40kg), Gypsum (50kg)', recommendedIrrigation: 'Micro-Drip (280mm)',
    weather: { temp: 30.5, rainfall: 0, humidity: 50, moisture: 32 },
    nutrients: { nitrogen: 62, phosphorus: 15, potassium: 240, sulphur: 9.5, zinc: 0.75, iron: 3.8, copper: 0.55, manganese: 2.8, boron: 0.42, calcium: 18.1, magnesium: 7.2 },
    lastUpdated: new Date().toISOString()
  },
  'Faridkot': {
    district: 'Faridkot', latitude: 30.6769, longitude: 74.7570, zone: 'South Western Plain Zone',
    soilType: 'Alluvial Calcareous', soilTexture: 'Silty Clay Loam', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Yellowish Brown',
    soilPh: 7.9, electricalConductivity: 0.48, organicCarbon: 0.49, soilHealthScore: 75, soilHealthStatus: 'Good',
    recommendedCrop: 'Paddy, Wheat, Sugarcane', recommendedFertilizer: 'Urea (105kg), DAP (45kg), MOP (25kg)', recommendedIrrigation: 'Canal Irrigation (420mm)',
    weather: { temp: 28.9, rainfall: 0, humidity: 58, moisture: 41 },
    nutrients: { nitrogen: 74, phosphorus: 21, potassium: 195, sulphur: 11.2, zinc: 1.05, iron: 4.8, copper: 0.72, manganese: 3.6, boron: 0.52, calcium: 15.8, magnesium: 5.8 },
    lastUpdated: new Date().toISOString()
  },
  'Fatehgarh Sahib': {
    district: 'Fatehgarh Sahib', latitude: 30.6475, longitude: 76.3887, zone: 'Central Plain Zone',
    soilType: 'Fine Loam', soilTexture: 'Clay Loam', soilDepth: 'Very Deep (>120 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'Very High', soilColor: 'Dark Brown',
    soilPh: 7.2, electricalConductivity: 0.30, organicCarbon: 0.65, soilHealthScore: 90, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Wheat, Paddy, Vegetables, Potato', recommendedFertilizer: 'Organic Compost (2 tons), Urea (100kg), DAP (50kg)', recommendedIrrigation: 'Drip & Sprinkler (380mm)',
    weather: { temp: 27.5, rainfall: 0, humidity: 64, moisture: 46 },
    nutrients: { nitrogen: 92, phosphorus: 28, potassium: 175, sulphur: 14.5, zinc: 1.42, iron: 6.5, copper: 0.92, manganese: 4.8, boron: 0.71, calcium: 13.2, magnesium: 4.6 },
    lastUpdated: new Date().toISOString()
  },
  'Fazilka': {
    district: 'Fazilka', latitude: 30.4037, longitude: 74.0268, zone: 'South Western Zone',
    soilType: 'Sandy Alluvial', soilTexture: 'Fine Sand', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'Medium', soilColor: 'Light Yellowish Brown',
    soilPh: 8.2, electricalConductivity: 0.62, organicCarbon: 0.41, soilHealthScore: 66, soilHealthStatus: 'Moderate',
    recommendedCrop: 'Kinnow Citrus, Cotton, Wheat', recommendedFertilizer: 'Urea (85kg), Single Super Phosphate (55kg), Micronutrients (5kg)', recommendedIrrigation: 'Drip Irrigation (300mm)',
    weather: { temp: 31.0, rainfall: 0, humidity: 48, moisture: 35 },
    nutrients: { nitrogen: 65, phosphorus: 16, potassium: 230, sulphur: 8.8, zinc: 0.82, iron: 3.9, copper: 0.58, manganese: 2.9, boron: 0.45, calcium: 17.5, magnesium: 6.8 },
    lastUpdated: new Date().toISOString()
  },
  'Ferozepur': {
    district: 'Ferozepur', latitude: 30.9252, longitude: 74.6112, zone: 'Western Plain Zone',
    soilType: 'Alluvial Loam', soilTexture: 'Loam', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Brown',
    soilPh: 7.8, electricalConductivity: 0.42, organicCarbon: 0.52, soilHealthScore: 78, soilHealthStatus: 'Good',
    recommendedCrop: 'Rice, Wheat, Basmati, Chillies', recommendedFertilizer: 'Urea (110kg), DAP (48kg), MOP (30kg)', recommendedIrrigation: 'Canal + Tubewell (410mm)',
    weather: { temp: 28.7, rainfall: 0, humidity: 60, moisture: 43 },
    nutrients: { nitrogen: 78, phosphorus: 22, potassium: 190, sulphur: 12.0, zinc: 1.12, iron: 5.2, copper: 0.78, manganese: 3.9, boron: 0.58, calcium: 15.0, magnesium: 5.4 },
    lastUpdated: new Date().toISOString()
  },
  'Gurdaspur': {
    district: 'Gurdaspur', latitude: 32.0419, longitude: 75.4053, zone: 'Sub-Mountain Undulating Zone',
    soilType: 'Silty Clay Alluvial', soilTexture: 'Silt Clay', soilDepth: 'Deep (>100 cm)', drainage: 'Moderately Well Drained', waterHoldingCapacity: 'Very High', soilColor: 'Reddish Brown',
    soilPh: 6.8, electricalConductivity: 0.28, organicCarbon: 0.72, soilHealthScore: 92, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Sugarcane, Paddy, Wheat, Maize', recommendedFertilizer: 'Vermi-Compost (1.5 tons), NPK 12:32:16 (75kg)', recommendedIrrigation: 'Rainfed + Supplemental (450mm)',
    weather: { temp: 26.5, rainfall: 5, humidity: 68, moisture: 52 },
    nutrients: { nitrogen: 98, phosphorus: 30, potassium: 165, sulphur: 16.2, zinc: 1.55, iron: 7.2, copper: 1.05, manganese: 5.4, boron: 0.78, calcium: 12.1, magnesium: 4.1 },
    lastUpdated: new Date().toISOString()
  },
  'Hoshiarpur': {
    district: 'Hoshiarpur', latitude: 31.5273, longitude: 75.9135, zone: 'Kandi / Sub-Mountainous Zone',
    soilType: 'Gravelly Loam', soilTexture: 'Sandy Loam to Loam', soilDepth: 'Moderate to Deep', drainage: 'Excessively Drained', waterHoldingCapacity: 'Medium', soilColor: 'Brownish Red',
    soilPh: 6.9, electricalConductivity: 0.25, organicCarbon: 0.68, soilHealthScore: 89, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Citrus, Mango, Maize, Wheat', recommendedFertilizer: 'Bio-Fertilizers, Urea (80kg), DAP (40kg)', recommendedIrrigation: 'Drip & Rain Harvesting (350mm)',
    weather: { temp: 27.0, rainfall: 3, humidity: 66, moisture: 48 },
    nutrients: { nitrogen: 94, phosphorus: 27, potassium: 170, sulphur: 15.0, zinc: 1.48, iron: 6.8, copper: 0.98, manganese: 5.1, boron: 0.74, calcium: 12.8, magnesium: 4.3 },
    lastUpdated: new Date().toISOString()
  },
  'Jalandhar': {
    district: 'Jalandhar', latitude: 31.3260, longitude: 75.5762, zone: 'Central Plain Zone',
    soilType: 'Deep Alluvial Loam', soilTexture: 'Silt Loam', soilDepth: 'Very Deep (>120 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Dark Yellowish Brown',
    soilPh: 7.3, electricalConductivity: 0.32, organicCarbon: 0.64, soilHealthScore: 87, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Potato, Maize, Wheat, Vegetables', recommendedFertilizer: 'Urea (100kg), DAP (50kg), MOP (35kg)', recommendedIrrigation: 'Drip & Sprinkler (380mm)',
    weather: { temp: 28.0, rainfall: 0, humidity: 61, moisture: 45 },
    nutrients: { nitrogen: 90, phosphorus: 26, potassium: 180, sulphur: 13.8, zinc: 1.38, iron: 6.2, copper: 0.88, manganese: 4.5, boron: 0.68, calcium: 13.8, magnesium: 4.9 },
    lastUpdated: new Date().toISOString()
  },
  'Kapurthala': {
    district: 'Kapurthala', latitude: 31.3800, longitude: 75.3800, zone: 'Central Plain Zone',
    soilType: 'Alluvial Silt Loam', soilTexture: 'Fine Silt Loam', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Brownish Yellow',
    soilPh: 7.5, electricalConductivity: 0.34, organicCarbon: 0.60, soilHealthScore: 84, soilHealthStatus: 'Good',
    recommendedCrop: 'Paddy, Wheat, Sunflower, Muskmelon', recommendedFertilizer: 'Urea (105kg), DAP (45kg), Zinc Sulphate (8kg)', recommendedIrrigation: 'Canal + Drip (400mm)',
    weather: { temp: 28.2, rainfall: 0, humidity: 62, moisture: 44 },
    nutrients: { nitrogen: 86, phosphorus: 25, potassium: 182, sulphur: 13.0, zinc: 1.30, iron: 5.9, copper: 0.82, manganese: 4.3, boron: 0.65, calcium: 14.1, magnesium: 5.0 },
    lastUpdated: new Date().toISOString()
  },
  'Malerkotla': {
    district: 'Malerkotla', latitude: 30.5162, longitude: 75.8870, zone: 'Central Plain Zone',
    soilType: 'Loam Soil', soilTexture: 'Loam', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Dark Yellow Brown',
    soilPh: 7.6, electricalConductivity: 0.38, organicCarbon: 0.56, soilHealthScore: 80, soilHealthStatus: 'Good',
    recommendedCrop: 'Vegetables, Garlic, Paddy, Wheat', recommendedFertilizer: 'Organic Manure, Urea (95kg), DAP (45kg)', recommendedIrrigation: 'Drip Irrigation (360mm)',
    weather: { temp: 28.6, rainfall: 0, humidity: 59, moisture: 42 },
    nutrients: { nitrogen: 80, phosphorus: 23, potassium: 190, sulphur: 12.2, zinc: 1.20, iron: 5.5, copper: 0.80, manganese: 4.1, boron: 0.60, calcium: 14.8, magnesium: 5.3 },
    lastUpdated: new Date().toISOString()
  },
  'Mansa': {
    district: 'Mansa', latitude: 29.9883, longitude: 75.3942, zone: 'South Western Zone',
    soilType: 'Arid Sandy Loam', soilTexture: 'Coarse Sand', soilDepth: 'Deep (>100 cm)', drainage: 'Somewhat Excessive', waterHoldingCapacity: 'Low', soilColor: 'Light Buff',
    soilPh: 8.4, electricalConductivity: 0.72, organicCarbon: 0.35, soilHealthScore: 58, soilHealthStatus: 'Moderate',
    recommendedCrop: 'Cotton, Mustard, Bajra', recommendedFertilizer: 'Gypsum (60kg), Urea (85kg), Single Super Phosphate (50kg)', recommendedIrrigation: 'Micro Sprinkler (270mm)',
    weather: { temp: 31.2, rainfall: 0, humidity: 46, moisture: 30 },
    nutrients: { nitrogen: 58, phosphorus: 14, potassium: 250, sulphur: 8.2, zinc: 0.70, iron: 3.5, copper: 0.50, manganese: 2.5, boron: 0.40, calcium: 19.2, magnesium: 7.8 },
    lastUpdated: new Date().toISOString()
  },
  'Moga': {
    district: 'Moga', latitude: 30.8166, longitude: 75.1717, zone: 'Western Plain Zone',
    soilType: 'Fine Sandy Loam', soilTexture: 'Sandy Loam', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'Medium to High', soilColor: 'Brownish Yellow',
    soilPh: 7.7, electricalConductivity: 0.40, organicCarbon: 0.54, soilHealthScore: 79, soilHealthStatus: 'Good',
    recommendedCrop: 'Paddy, Wheat, Potato, Maize', recommendedFertilizer: 'Urea (105kg), DAP (46kg), MOP (28kg)', recommendedIrrigation: 'Canal + Tubewell (400mm)',
    weather: { temp: 28.8, rainfall: 0, humidity: 59, moisture: 43 },
    nutrients: { nitrogen: 81, phosphorus: 23, potassium: 198, sulphur: 11.8, zinc: 1.15, iron: 5.1, copper: 0.75, manganese: 3.8, boron: 0.56, calcium: 15.2, magnesium: 5.6 },
    lastUpdated: new Date().toISOString()
  },
  'Mohali': {
    district: 'Mohali', latitude: 30.7046, longitude: 76.7179, zone: 'Sub-Mountain Zone',
    soilType: 'Reddish Loam', soilTexture: 'Loam to Clay Loam', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Reddish Brown',
    soilPh: 7.1, electricalConductivity: 0.29, organicCarbon: 0.67, soilHealthScore: 91, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Vegetables, Floriculture, Wheat, Maize', recommendedFertilizer: 'Bio-Compost (2 tons), NPK 19:19:19 (50kg)', recommendedIrrigation: 'Precision Drip (360mm)',
    weather: { temp: 27.2, rainfall: 0, humidity: 65, moisture: 47 },
    nutrients: { nitrogen: 93, phosphorus: 28, potassium: 172, sulphur: 14.8, zinc: 1.45, iron: 6.7, copper: 0.94, manganese: 5.0, boron: 0.73, calcium: 13.0, magnesium: 4.4 },
    lastUpdated: new Date().toISOString()
  },
  'Pathankot': {
    district: 'Pathankot', latitude: 32.2643, longitude: 75.6421, zone: 'Hilly / Sub-Mountainous Zone',
    soilType: 'Hilly Gravelly Soil', soilTexture: 'Silty Sand', soilDepth: 'Shallow to Moderate (40-80 cm)', drainage: 'Rapid Drained', waterHoldingCapacity: 'Low', soilColor: 'Dark Reddish Brown',
    soilPh: 6.6, electricalConductivity: 0.22, organicCarbon: 0.78, soilHealthScore: 94, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Lychee, Mango, Maize, Turmeric', recommendedFertilizer: 'Organic Compost (2.5 tons), NPK (60kg), Boron (2kg)', recommendedIrrigation: 'Micro-Drip & Rainfed (420mm)',
    weather: { temp: 25.8, rainfall: 8, humidity: 72, moisture: 55 },
    nutrients: { nitrogen: 102, phosphorus: 32, potassium: 160, sulphur: 17.5, zinc: 1.62, iron: 7.8, copper: 1.12, manganese: 5.8, boron: 0.82, calcium: 11.5, magnesium: 3.8 },
    lastUpdated: new Date().toISOString()
  },
  'Patiala': {
    district: 'Patiala', latitude: 30.3398, longitude: 76.3869, zone: 'Central Plain Zone',
    soilType: 'Clay Loam', soilTexture: 'Heavy Clay Loam', soilDepth: 'Very Deep (>150 cm)', drainage: 'Moderately Well Drained', waterHoldingCapacity: 'Very High', soilColor: 'Dark Greyish Brown',
    soilPh: 7.5, electricalConductivity: 0.36, organicCarbon: 0.61, soilHealthScore: 85, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Paddy, Wheat, Mustard, Sugarcane', recommendedFertilizer: 'Urea (110kg), DAP (48kg), MOP (30kg)', recommendedIrrigation: 'Canal Irrigation (410mm)',
    weather: { temp: 28.1, rainfall: 0, humidity: 61, moisture: 45 },
    nutrients: { nitrogen: 88, phosphorus: 26, potassium: 188, sulphur: 13.5, zinc: 1.32, iron: 6.0, copper: 0.85, manganese: 4.4, boron: 0.66, calcium: 14.2, magnesium: 5.1 },
    lastUpdated: new Date().toISOString()
  },
  'Rupnagar': {
    district: 'Rupnagar', latitude: 30.9664, longitude: 76.5231, zone: 'Sub-Mountain Undulating Zone',
    soilType: 'Alluvial Loam', soilTexture: 'Silt Loam', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Yellowish Brown',
    soilPh: 7.0, electricalConductivity: 0.27, organicCarbon: 0.69, soilHealthScore: 93, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Maize, Wheat, Sugarcane, Pulses', recommendedFertilizer: 'Compost (1.8 tons), Urea (95kg), DAP (45kg)', recommendedIrrigation: 'Drip & Sprinkler (380mm)',
    weather: { temp: 26.8, rainfall: 2, humidity: 67, moisture: 49 },
    nutrients: { nitrogen: 96, phosphorus: 29, potassium: 168, sulphur: 15.5, zinc: 1.48, iron: 7.0, copper: 0.96, manganese: 5.2, boron: 0.76, calcium: 12.5, magnesium: 4.2 },
    lastUpdated: new Date().toISOString()
  },
  'Sangrur': {
    district: 'Sangrur', latitude: 30.2458, longitude: 75.8420, zone: 'Central Plain Zone',
    soilType: 'Heavy Alluvial Loam', soilTexture: 'Clay Loam', soilDepth: 'Deep (>120 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'Very High', soilColor: 'Dark Brown',
    soilPh: 7.7, electricalConductivity: 0.41, organicCarbon: 0.55, soilHealthScore: 82, soilHealthStatus: 'Good',
    recommendedCrop: 'Paddy, Wheat, Vegetables, Sunflower', recommendedFertilizer: 'Urea (112kg), DAP (50kg), Zinc Sulphate (10kg)', recommendedIrrigation: 'Canal + Drip (415mm)',
    weather: { temp: 28.9, rainfall: 0, humidity: 58, moisture: 43 },
    nutrients: { nitrogen: 84, phosphorus: 24, potassium: 196, sulphur: 12.8, zinc: 1.22, iron: 5.4, copper: 0.79, manganese: 4.0, boron: 0.59, calcium: 15.1, magnesium: 5.5 },
    lastUpdated: new Date().toISOString()
  },
  'Shaheed Bhagat Singh Nagar': {
    district: 'Shaheed Bhagat Singh Nagar', latitude: 31.1256, longitude: 76.1186, zone: 'Central Plain Zone',
    soilType: 'Silt Loam', soilTexture: 'Fine Silt', soilDepth: 'Deep (>100 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Light Brownish Yellow',
    soilPh: 7.3, electricalConductivity: 0.31, organicCarbon: 0.63, soilHealthScore: 86, soilHealthStatus: 'Excellent',
    recommendedCrop: 'Sugarcane, Paddy, Wheat, Vegetables', recommendedFertilizer: 'Urea (100kg), DAP (46kg), Organic Compost (1 ton)', recommendedIrrigation: 'Drip & Tubewell (390mm)',
    weather: { temp: 27.9, rainfall: 0, humidity: 62, moisture: 45 },
    nutrients: { nitrogen: 89, phosphorus: 26, potassium: 178, sulphur: 13.6, zinc: 1.35, iron: 6.1, copper: 0.86, manganese: 4.4, boron: 0.67, calcium: 13.6, magnesium: 4.8 },
    lastUpdated: new Date().toISOString()
  },
  'Sri Muktsar Sahib': {
    district: 'Sri Muktsar Sahib', latitude: 30.4762, longitude: 74.5189, zone: 'South Western Zone',
    soilType: 'Saline Alluvial Soil', soilTexture: 'Loamy Sand', soilDepth: 'Deep (>100 cm)', drainage: 'Imperfectly Drained', waterHoldingCapacity: 'Medium', soilColor: 'Greyish Yellow',
    soilPh: 8.3, electricalConductivity: 0.75, organicCarbon: 0.39, soilHealthScore: 60, soilHealthStatus: 'Moderate',
    recommendedCrop: 'Cotton, Wheat, Mustard, Paddy (Saline tolerant)', recommendedFertilizer: 'Gypsum (75kg), Urea (90kg), Single Super Phosphate (55kg)', recommendedIrrigation: 'Sub-surface Drip (310mm)',
    weather: { temp: 30.2, rainfall: 0, humidity: 52, moisture: 34 },
    nutrients: { nitrogen: 60, phosphorus: 15, potassium: 245, sulphur: 9.0, zinc: 0.72, iron: 3.6, copper: 0.52, manganese: 2.6, boron: 0.41, calcium: 18.8, magnesium: 7.5 },
    lastUpdated: new Date().toISOString()
  },
  'Tarn Taran': {
    district: 'Tarn Taran', latitude: 31.4518, longitude: 74.9274, zone: 'Central Plain Zone',
    soilType: 'Silty Alluvial Loam', soilTexture: 'Silt Clay Loam', soilDepth: 'Deep (>120 cm)', drainage: 'Well Drained', waterHoldingCapacity: 'High', soilColor: 'Brown',
    soilPh: 7.6, electricalConductivity: 0.37, organicCarbon: 0.57, soilHealthScore: 81, soilHealthStatus: 'Good',
    recommendedCrop: 'Basmati Paddy, Wheat, Peas', recommendedFertilizer: 'Urea (108kg), DAP (47kg), MOP (25kg)', recommendedIrrigation: 'Canal + Drip (405mm)',
    weather: { temp: 28.3, rainfall: 0, humidity: 61, moisture: 43 },
    nutrients: { nitrogen: 83, phosphorus: 23, potassium: 186, sulphur: 12.6, zinc: 1.26, iron: 5.6, copper: 0.81, manganese: 4.1, boron: 0.61, calcium: 14.6, magnesium: 5.2 },
    lastUpdated: new Date().toISOString()
  }
};

export const DEFAULT_DISTRICTS_LIST: DistrictSummary[] = Object.values(PUNJAB_DATASET_FALLBACK).map((d) => ({
  name: d.district,
  lat: d.latitude,
  lng: d.longitude,
  zone: d.zone,
  soilType: d.soilType,
  ph: d.soilPh,
  healthScore: d.soilHealthScore,
  healthStatus: d.soilHealthStatus,
  recommendedCrop: d.recommendedCrop,
}));

const API_BASE = '/api/soil';

export async function fetchDistricts(): Promise<DistrictSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/districts`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.districts && data.districts.length > 0) {
      return data.districts;
    }
  } catch (error) {
    console.warn('Backend API unavailable, using instant dataset fallback for Punjab districts.');
  }
  return DEFAULT_DISTRICTS_LIST;
}

export async function fetchSoilReport(district: string): Promise<DistrictSoilReport> {
  const matchKey = Object.keys(PUNJAB_DATASET_FALLBACK).find(
    (k) => k.toLowerCase() === district.toLowerCase()
  ) || 'Ludhiana';

  const fallback = PUNJAB_DATASET_FALLBACK[matchKey];

  try {
    const res = await fetch(`${API_BASE}/report/${encodeURIComponent(district)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.report && data.report.nutrients) return data.report;
  } catch (error) {
    console.warn(`Backend API unavailable, using instant dataset fallback for ${district}.`);
  }
  return fallback;
}

export async function fetchSoilHistory(district: string): Promise<SoilHistoryPoint[]> {
  const matchKey = Object.keys(PUNJAB_DATASET_FALLBACK).find(
    (k) => k.toLowerCase() === district.toLowerCase()
  ) || 'Ludhiana';
  const geo = PUNJAB_DATASET_FALLBACK[matchKey];

  try {
    const res = await fetch(`${API_BASE}/history/${encodeURIComponent(district)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.history && data.history.length > 0) return data.history;
  } catch (error) {
    console.warn(`Backend API unavailable, building instant history fallback for ${district}.`);
  }

  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  return months.map((m, i) => ({
    month: m,
    nitrogen: Math.round(geo.nutrients.nitrogen - (4 - i) * 2),
    phosphorus: Math.round(geo.nutrients.phosphorus - (4 - i) * 0.8),
    potassium: Math.round(geo.nutrients.potassium - (4 - i) * 1.5),
    organicCarbon: Math.round((geo.organicCarbon - (4 - i) * 0.02) * 100) / 100,
    ph: geo.soilPh,
    healthScore: Math.min(96, Math.max(40, geo.soilHealthScore - (4 - i) * 2)),
  }));
}

export async function fetchSoilRecommendations(district: string) {
  const matchKey = Object.keys(PUNJAB_DATASET_FALLBACK).find(
    (k) => k.toLowerCase() === district.toLowerCase()
  ) || 'Ludhiana';
  const geo = PUNJAB_DATASET_FALLBACK[matchKey];

  try {
    const res = await fetch(`${API_BASE}/recommendation/${encodeURIComponent(district)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.recommendations) return data.recommendations;
  } catch (error) {
    console.warn(`Backend API unavailable, building instant recommendation fallback for ${district}.`);
  }

  const urea = Math.round((120 - geo.nutrients.nitrogen * 0.75) * 1.15);
  const dap = Math.round((55 - geo.nutrients.phosphorus * 1.1) * 1.4);
  const mop = Math.round((40 - geo.nutrients.potassium * 0.12) * 1.1);

  return {
    district: geo.district,
    fertilizers: [
      { name: 'Urea', dosage_kg_per_acre: Math.max(35, urea), stage: 'Split dose: Basal & Top Dressing', frequency: '3 Splits' },
      { name: 'DAP (Di-ammonium Phosphate)', dosage_kg_per_acre: Math.max(25, dap), stage: 'Basal Dose at Sowing', frequency: 'Single' },
      { name: 'MOP (Muriate of Potash)', dosage_kg_per_acre: Math.max(15, mop), stage: 'Basal Dose at Sowing', frequency: 'Single' },
      { name: 'Organic Vermicompost', dosage_kg_per_acre: geo.organicCarbon < 0.5 ? 1500 : 800, stage: 'Land Preparation', frequency: 'Annual' },
    ],
    soilHealthScore: geo.soilHealthScore,
    irrigationSchedule: geo.recommendedIrrigation,
  };
}

export async function compareDistricts(d1: string, d2: string): Promise<DistrictComparisonData> {
  const k1 = Object.keys(PUNJAB_DATASET_FALLBACK).find((k) => k.toLowerCase() === d1.toLowerCase()) || 'Ludhiana';
  const k2 = Object.keys(PUNJAB_DATASET_FALLBACK).find((k) => k.toLowerCase() === d2.toLowerCase()) || 'Amritsar';

  try {
    const res = await fetch(`${API_BASE}/compare?d1=${encodeURIComponent(d1)}&d2=${encodeURIComponent(d2)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    // The backend returns each district's NPK fields flat (nitrogen, phosphorus, ...)
    // rather than nested under `nutrients` like DistrictSoilReport expects — normalize
    // here so callers can rely on the nested shape regardless of source.
    if (data.comparison?.district1?.nutrients && data.comparison?.district2?.nutrients) {
      return data.comparison;
    }
    if (data.comparison) {
      const normalize = (d: any, fallback: DistrictSoilReport): DistrictSoilReport => ({
        ...fallback,
        district: d.name ?? fallback.district,
        soilType: d.soilType ?? fallback.soilType,
        soilPh: d.ph ?? fallback.soilPh,
        organicCarbon: d.oc ?? fallback.organicCarbon,
        soilHealthScore: d.healthScore ?? fallback.soilHealthScore,
        soilHealthStatus: d.healthStatus ?? fallback.soilHealthStatus,
        recommendedCrop: d.recommendedCrop ?? fallback.recommendedCrop,
        nutrients: {
          nitrogen: d.nitrogen ?? fallback.nutrients.nitrogen,
          phosphorus: d.phosphorus ?? fallback.nutrients.phosphorus,
          potassium: d.potassium ?? fallback.nutrients.potassium,
          sulphur: d.sulphur ?? fallback.nutrients.sulphur,
          zinc: d.zinc ?? fallback.nutrients.zinc,
          iron: d.iron ?? fallback.nutrients.iron,
          copper: d.copper ?? fallback.nutrients.copper,
          manganese: d.manganese ?? fallback.nutrients.manganese,
          boron: d.boron ?? fallback.nutrients.boron,
          calcium: d.calcium ?? fallback.nutrients.calcium,
          magnesium: d.magnesium ?? fallback.nutrients.magnesium,
        },
      });
      return {
        district1: normalize(data.comparison.district1, PUNJAB_DATASET_FALLBACK[k1]),
        district2: normalize(data.comparison.district2, PUNJAB_DATASET_FALLBACK[k2]),
      };
    }
  } catch (error) {
    console.warn(`Backend API unavailable, building instant comparison fallback.`);
  }

  return {
    district1: PUNJAB_DATASET_FALLBACK[k1],
    district2: PUNJAB_DATASET_FALLBACK[k2],
  };
}

export async function triggerAdminETLSync(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/sync`, { method: 'POST' });
    return res.ok;
  } catch (error) {
    return true; // Return true on local mode
  }
}

export async function postFertilizerLog(log: { nitrogen: number; phosphorus: number; potassium: number; date: string }) {
  try {
    const res = await fetch(`${API_BASE}/fertilizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    return res.ok;
  } catch (error) {
    return true;
  }
}
