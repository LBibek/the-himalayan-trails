import type { WeatherReport } from '../types';
import type {
  PassCrossingAssessment,
  PassCrossingInterval,
  PassCrossingStatus,
  PassCrossingPeriod
} from '../types/routes';
import {
  HIMALAYAN_LAPSE_RATE_PER_METER,
  calculateWindChill,
  calculateFreezingLevel
} from './weatherPhysics.ts';

export interface HighPassConfig {
  id: string;
  name: string;
  nativeName?: string;
  elevation: number;
  region: 'Annapurna' | 'Everest' | 'Manaslu' | string;
  coordinates: { lat: number; lng: number };
  baseReferenceAltitude: number;
  baseMorningWindKm: number;
  gearRequired: string[];
  hazards: string[];
}

export const HIGH_PASS_CROSSING_REGISTRY: HighPassConfig[] = [
  {
    id: 'thorong-la',
    name: 'Thorong La',
    nativeName: 'थोरङ ला भञ्ज्याङ',
    elevation: 5416,
    region: 'Annapurna',
    coordinates: { lat: 28.7936, lng: 83.9351 },
    baseReferenceAltitude: 4850, // Thorong High Camp
    baseMorningWindKm: 28,
    gearRequired: [
      'Microspikes / Crampons',
      'Windproof GORE-TEX Hardshell',
      'Thermal Balaclava & Ski Goggles',
      'Trekking Poles with Snow Baskets',
      'Satellite SOS / InReach Beacon'
    ],
    hazards: [
      'Gale-force afternoon winds on Mustang col',
      'Active scree movement on High Camp ascent',
      'Rapid temperature plummet below -15°C'
    ]
  },
  {
    id: 'cho-la',
    name: 'Cho La',
    nativeName: 'छो ला भञ्ज्याङ',
    elevation: 5420,
    region: 'Everest',
    coordinates: { lat: 27.9250, lng: 86.7861 },
    baseReferenceAltitude: 4830, // Dzongla
    baseMorningWindKm: 30,
    gearRequired: [
      'Rigid Crampons & Boot Chains',
      'Lightweight Ice Axe',
      'Gaiters (Heavy-duty Waterproof)',
      'Grade 4 Polarized Glacier Glasses',
      'Emergency Bivouac Foil Sack'
    ],
    hazards: [
      'Active eastern glacier crevasses under seasonal snow',
      'Sub-surface verglas on icy ascent headwall',
      'Rockfall risk on steep western scree to Thangnak'
    ]
  },
  {
    id: 'larkya-la',
    name: 'Larkya La',
    nativeName: 'लार्के ला भञ्ज्याङ',
    elevation: 5106,
    region: 'Manaslu',
    coordinates: { lat: 28.6472, lng: 84.6225 },
    baseReferenceAltitude: 4460, // Dharmasala (Larkya Phedi)
    baseMorningWindKm: 26,
    gearRequired: [
      'Four-Season Mountaineering Boots',
      'Down Parka (-20°C rated)',
      'High-Lumen Headlamp + Spare Lithium Batteries',
      'Insulated Thermos Flask (1L minimum)',
      'GPS Track Log with Offline Waypoints'
    ],
    hazards: [
      'Extended 8-9 hour technical moraine traverse into Bimthang',
      'Extreme sub-zero dawn wind chill (-20°C)',
      'Zero emergency shelter options between Dharmasala and Bimthang'
    ]
  },
  {
    id: 'kongma-la',
    name: 'Kongma La',
    nativeName: 'कोङ्मा ला',
    elevation: 5535,
    region: 'Everest',
    coordinates: { lat: 27.9733, lng: 86.8378 },
    baseReferenceAltitude: 4940, // Lobuche / Chhukung
    baseMorningWindKm: 34,
    gearRequired: [
      'Full Technical Crampons',
      'Heavy-duty Ankle-Support Alpine Boots',
      'Double Thermal Base Layers',
      'High-Calorie Trail Rations (2,500 kcal)',
      'Altimeter Watch with Barometric Trend Alert'
    ],
    hazards: [
      'Highest pass in the Everest Three Passes circuit (5,535m)',
      'Rough boulder hopping across unstable Khumbu moraine',
      'Exposed crest subject to sudden katabatic downdrafts'
    ]
  },
  {
    id: 'renjo-la',
    name: 'Renjo La',
    nativeName: 'रेन्जो ला',
    elevation: 5360,
    region: 'Everest',
    coordinates: { lat: 27.9525, lng: 86.6917 },
    baseReferenceAltitude: 4790, // Gokyo
    baseMorningWindKm: 29,
    gearRequired: [
      'Microspikes / Lightweight Crampons',
      'Windproof Shell & Heavy Thermal Mittens',
      'UV400 Polarized Glacier Sunglasses',
      'Trekking Poles with Snow Baskets',
      'Insulated 1L Water Flask'
    ],
    hazards: [
      'Steep icy stone staircase descent towards Lungden',
      'Exposed high-altitude crest overlooking Gokyo Lakes',
      'Rapid temperature drop in shadow of Kyajo Ri'
    ]
  }
];

function classifyWindSpeed(windSpeedKm: number): {
  category: 'Optimal (<35 km/h)' | 'Moderate Caution (35-50 km/h)' | 'Severe / Whiteout (>50 km/h)';
  status: PassCrossingStatus;
  statusLabel: string;
} {
  if (windSpeedKm > 50) {
    return {
      category: 'Severe / Whiteout (>50 km/h)',
      status: 'HIGH_RISK_CLOSED',
      statusLabel: 'High Risk / Severe Gale'
    };
  }
  if (windSpeedKm >= 35) {
    return {
      category: 'Moderate Caution (35-50 km/h)',
      status: 'CAUTION_WINDOW',
      statusLabel: 'Caution Window'
    };
  }
  return {
    category: 'Optimal (<35 km/h)',
    status: 'OPTIMAL_WINDOW',
    statusLabel: 'Optimal Window'
  };
}

/**
 * Evaluates a single 48-hour forecast interval for a Himalayan high pass.
 */
function createCrossingInterval(
  period: PassCrossingPeriod,
  label: string,
  timeRange: string,
  passElevation: number,
  baseElevation: number,
  baseTempC: number,
  nominalWindKm: number,
  isAfternoon: boolean,
  isTomorrow: boolean
): PassCrossingInterval {
  // Lapse rate adjustment for elevation difference
  const deltaH = passElevation - baseElevation;
  let tempC = Math.round((baseTempC - (deltaH * HIMALAYAN_LAPSE_RATE_PER_METER)) * 10) / 10;

  // Diurnal variation: afternoon is ~2.5°C warmer at surface, but wind accelerates significantly
  // Valley thermal updrafts converge over Himalayan ridgelines in the afternoon (+12 to +16 km/h)
  let windSpeedKm = nominalWindKm;
  if (isAfternoon) {
    tempC = Math.round((tempC + 2.5) * 10) / 10;
    windSpeedKm = Math.round(nominalWindKm + 15);
  }
  if (isTomorrow) {
    // Tomorrow slight synoptic shift (+2 km/h wind, -0.5°C)
    windSpeedKm = Math.round(windSpeedKm + 2);
    tempC = Math.round((tempC - 0.5) * 10) / 10;
  }

  // Crest wind acceleration for high altitudes
  const crestBoost = Math.max(0, Math.round((deltaH / 100) * 1.2));
  windSpeedKm += crestBoost;

  const windChillC = calculateWindChill(tempC, windSpeedKm);
  const freezingLevelM = calculateFreezingLevel(passElevation, tempC);

  const windClass = classifyWindSpeed(windSpeedKm);

  // Status adjustment: if wind chill is critically low (<-26°C), elevate risk to closed
  let status: PassCrossingStatus = windClass.status;
  let statusLabel = windClass.statusLabel;

  if (windChillC <= -26 && status === 'CAUTION_WINDOW') {
    status = 'HIGH_RISK_CLOSED';
    statusLabel = 'Extreme Wind Chill Hazard';
  } else if (windChillC <= -16 && status === 'OPTIMAL_WINDOW') {
    status = 'CAUTION_WINDOW';
    statusLabel = 'Sub-Zero Caution';
  }

  let snowRisk: 'Low' | 'Moderate' | 'Heavy / Whiteout' = 'Low';
  if (isAfternoon && windSpeedKm >= 45) {
    snowRisk = 'Heavy / Whiteout';
  } else if (isAfternoon || windSpeedKm >= 35) {
    snowRisk = 'Moderate';
  }

  let recommendation = '';
  let departureAdvice = '';

  if (status === 'OPTIMAL_WINDOW') {
    recommendation = isAfternoon
      ? 'Favorable conditions, though afternoon cloud cover is developing. Descend promptly before sunset.'
      : 'Optimal crossing window. Stable barometric pressure and calm ridge winds. Clear visibility across the pass.';
    departureAdvice = isAfternoon
      ? 'Ensure you are descending towards next camp by 14:00 PM.'
      : 'Strict 05:00 - 06:00 AM departure recommended to clear the pass crest before 09:30 AM.';
  } else if (status === 'CAUTION_WINDOW') {
    recommendation = `Moderate caution required. Wind speeds gusting to ${windSpeedKm} km/h with wind chill of ${windChillC}°C. Crampons and hardshell gear mandatory.`;
    departureAdvice = isAfternoon
      ? 'Afternoon traversal not advised. Consider delaying until tomorrow morning window.'
      : 'Depart promptly at 04:30 AM with certified guide. Turn back if winds exceed 45 km/h on ascent.';
  } else {
    recommendation = `High hazard warning: Gale winds of ${windSpeedKm} km/h and lethal wind chill (${windChillC}°C). Whiteout conditions and frostbite danger on crest.`;
    departureAdvice = 'Crossings strictly discouraged. Remain at high camp / base lodge until winds abate.';
  }

  return {
    period,
    label,
    timeRange,
    status,
    statusLabel,
    windSpeedKm,
    windSpeedCategory: windClass.category,
    tempC,
    windChillC,
    freezingLevelM,
    snowRisk,
    recommendation,
    departureAdvice
  };
}

/**
 * Evaluates the full 48-hour crossing window assessment for a specific Himalayan pass.
 */
export function evaluatePassCrossingWindow(
  passId: string,
  baseReport?: WeatherReport | WeatherReport[]
): PassCrossingAssessment | null {
  const config = HIGH_PASS_CROSSING_REGISTRY.find(
    (p) => p.id.toLowerCase() === passId.toLowerCase()
  );
  if (!config) return null;

  const reportsList: WeatherReport[] = Array.isArray(baseReport)
    ? baseReport
    : baseReport ? [baseReport] : [];

  const matched = reportsList.find(
    (r) => r.region.toLowerCase() === config.region.toLowerCase()
  ) || reportsList.find((r) => r.region.toLowerCase() === 'all')
    || (reportsList.length > 0 ? reportsList[0] : undefined);

  let baseTemp = -6;
  let baseAlt = config.baseReferenceAltitude;
  let baseWind = config.baseMorningWindKm;

  if (matched) {
    baseTemp = matched.tempC;
    baseAlt = matched.elevation;
    if (matched.windKm) {
      baseWind = Math.round((config.baseMorningWindKm * 0.5) + (matched.windKm * 0.5));
    }
  }

  // 48-hour periods
  const todayMorning = createCrossingInterval(
    'today_morning',
    'Today Morning',
    '05:00 - 09:30 AM',
    config.elevation,
    baseAlt,
    baseTemp,
    baseWind,
    false,
    false
  );

  const todayAfternoon = createCrossingInterval(
    'today_afternoon',
    'Today Afternoon',
    '12:00 - 16:30 PM',
    config.elevation,
    baseAlt,
    baseTemp,
    baseWind,
    true,
    false
  );

  const tomorrowMorning = createCrossingInterval(
    'tomorrow_morning',
    'Tomorrow Morning',
    '05:00 - 09:30 AM',
    config.elevation,
    baseAlt,
    baseTemp,
    baseWind,
    false,
    true
  );

  const tomorrowAfternoon = createCrossingInterval(
    'tomorrow_afternoon',
    'Tomorrow Afternoon',
    '12:00 - 16:30 PM',
    config.elevation,
    baseAlt,
    baseTemp,
    baseWind,
    true,
    true
  );

  const intervals: PassCrossingInterval[] = [
    todayMorning,
    todayAfternoon,
    tomorrowMorning,
    tomorrowAfternoon
  ];

  // Current status reflects the immediate upcoming morning window
  const currentStatus = todayMorning.status;

  const morningWindowRecommendation =
    'Optimal traversal window is strictly 05:00 - 09:30 AM. Solar radiative heating creates high-velocity thermal downdrafts and convective snow flurries over passes after 11:00 AM.';

  return {
    passId: config.id,
    passName: config.name,
    nativeName: config.nativeName,
    elevationM: config.elevation,
    region: config.region,
    coordinates: config.coordinates,
    currentStatus,
    morningWindowRecommendation,
    baseReferenceAltitude: config.baseReferenceAltitude,
    intervals,
    gearRequired: config.gearRequired,
    hazards: config.hazards,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Returns 48-hour assessments for all 5 iconic Himalayan high passes.
 */
export function getAllPassCrossingAssessments(
  baseReport?: WeatherReport | WeatherReport[]
): PassCrossingAssessment[] {
  return HIGH_PASS_CROSSING_REGISTRY
    .map((cfg) => evaluatePassCrossingWindow(cfg.id, baseReport))
    .filter((a): a is PassCrossingAssessment => a !== null);
}
