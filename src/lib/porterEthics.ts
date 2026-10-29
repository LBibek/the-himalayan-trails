import type {
  GearCategory,
  ManifestItemEntry,
  PorterEthicsAssessment,
  GearManifest
} from '@/types/gear';

/**
 * International Porter Protection Group (IPPG) & TAAN Standards
 * The 5 IPPG Guidelines for Himalayan Porters:
 * 1. Clothing & footwear appropriate for the season and altitude.
 * 2. Adequate shelter, food, and warm sleeping conditions.
 * 3. Medical care identical to that given to clients.
 * 4. Insurance coverage covering evacuation and disability.
 * 5. Weight limit strictly capped at 25-30kg max per porter (ideally 20-25kg in high passes).
 */
export const IPPG_CONSTANTS = {
  MAX_PORTER_LOAD_KG: 25.0,
  TARGET_PORTER_LOAD_KG: 20.0,
  MAX_DUFFEL_PER_TREKKER_SHARED_KG: 12.5, // 2 trekkers per 1 porter
  MAX_DUFFEL_PER_TREKKER_SOLO_KG: 20.0,   // 1 trekker dedicated porter
  RECOMMENDED_DAYPACK_RATIO: 0.12,        // 12% body weight
  MAX_DAYPACK_RATIO: 0.15,                // 15% body weight warning threshold
  DANGEROUS_DAYPACK_RATIO: 0.20,          // 20% body weight danger threshold
  STANDARD_DAILY_PORTER_WAGE_NPR: 3000,   // Fair baseline wage
  STANDARD_DAILY_PORTER_WAGE_USD: 22.50,
  INSURANCE_PER_PORTER_USD: 25.00,
  GEAR_ALLOWANCE_PER_PORTER_USD: 40.00,
  BASE_ALTITUDE_METERS: 2500,
  ALTITUDE_PENALTY_PER_1000M: 0.12
} as const;

/**
 * Calculate the physiological exertion multiplier at high altitude.
 * Above 2,500m, effective physical workload increases due to declining partial oxygen pressure.
 */
export function calculateAltitudeExertionMultiplier(altitudeMeters: number): number {
  if (altitudeMeters <= IPPG_CONSTANTS.BASE_ALTITUDE_METERS) {
    return 1.0;
  }
  const deltaThousands = (altitudeMeters - IPPG_CONSTANTS.BASE_ALTITUDE_METERS) / 1000;
  const factor = 1.0 + deltaThousands * IPPG_CONSTANTS.ALTITUDE_PENALTY_PER_1000M;
  return Math.round(factor * 100) / 100;
}

/**
 * Comprehensive Porter Ethics & Trekker Ergonomic Assessment
 */
export function assessPorterEthicsAndSafety(params: {
  daypackWeightKg: number;
  duffelWeightKg: number;
  trekkerBodyWeightKg?: number;
  groupSize?: number;
  targetAltitudeMeters?: number;
}): PorterEthicsAssessment {
  const daypackKg = Math.max(0, Number(params.daypackWeightKg) || 0);
  const duffelKg = Math.max(0, Number(params.duffelWeightKg) || 0);
  const bodyWeightKg = Math.max(40, Number(params.trekkerBodyWeightKg) || 70);
  const groupSize = Math.max(1, Math.floor(Number(params.groupSize) || 1));
  const altitudeM = Math.max(1300, Number(params.targetAltitudeMeters) || 4500);

  // Group aggregate duffel
  const totalDuffelForTeamKg = duffelKg * groupSize;
  const portersRequired = Math.max(1, Math.ceil(totalDuffelForTeamKg / IPPG_CONSTANTS.MAX_PORTER_LOAD_KG));

  // Max duffel per trekker based on standard 2-person sharing model
  const maxAllowedDuffelPerTrekkerKg = groupSize === 1
    ? IPPG_CONSTANTS.MAX_DUFFEL_PER_TREKKER_SOLO_KG
    : IPPG_CONSTANTS.MAX_DUFFEL_PER_TREKKER_SHARED_KG;

  // Daypack to body weight ratio
  const daypackToBodyRatio = Math.round((daypackKg / bodyWeightKg) * 1000) / 1000;

  // Daypack safety evaluation
  let daypackSafetyStatus: 'SAFE' | 'CAUTION' | 'DANGEROUS' = 'SAFE';
  if (daypackToBodyRatio > IPPG_CONSTANTS.DANGEROUS_DAYPACK_RATIO) {
    daypackSafetyStatus = 'DANGEROUS';
  } else if (daypackToBodyRatio > IPPG_CONSTANTS.MAX_DAYPACK_RATIO) {
    daypackSafetyStatus = 'CAUTION';
  }

  // IPPG Compliance evaluation
  const averageWeightPerPorter = totalDuffelForTeamKg / portersRequired;
  let ippgCompliance: 'COMPLIANT' | 'WARNING' | 'VIOLATION' = 'COMPLIANT';
  let ippgStandardsPassed = true;

  if (averageWeightPerPorter > IPPG_CONSTANTS.MAX_PORTER_LOAD_KG) {
    ippgCompliance = 'VIOLATION';
    ippgStandardsPassed = false;
  } else if (averageWeightPerPorter > IPPG_CONSTANTS.TARGET_PORTER_LOAD_KG) {
    ippgCompliance = 'WARNING';
    ippgStandardsPassed = true;
  }

  // Altitude exertion calculation
  const altitudeMultiplier = calculateAltitudeExertionMultiplier(altitudeM);
  const effectiveDaypackExertion = Math.round(daypackKg * altitudeMultiplier * 10) / 10;

  // Guidance notes
  const notes: string[] = [];
  if (ippgCompliance === 'VIOLATION') {
    notes.push(
      `CRITICAL IPPG VIOLATION: Team duffel weight (${totalDuffelForTeamKg.toFixed(1)} kg) exceeds legal limits for ${portersRequired} porter(s). Additional porter required to ensure loads <= 25 kg.`
    );
  } else if (ippgCompliance === 'WARNING') {
    notes.push(
      `Load (${averageWeightPerPorter.toFixed(1)} kg/porter) approaches the 25 kg legal maximum. On high passes above 5,000m, target <= 20 kg per porter for safety.`
    );
  } else {
    notes.push(
      `Fully compliant with IPPG guidelines (${averageWeightPerPorter.toFixed(1)} kg/porter). Load allows comfortable pacing and fair working conditions.`
    );
  }

  if (daypackSafetyStatus === 'DANGEROUS') {
    notes.push(
      `DANGEROUS DAYPACK: Your daypack is ${(daypackToBodyRatio * 100).toFixed(1)}% of your body weight. Carrying >20% at ${altitudeM}m creates extreme lumbar fatigue and elevates stumble risk on loose scree.`
    );
  } else if (daypackSafetyStatus === 'CAUTION') {
    notes.push(
      `HEAVY DAYPACK: Daypack is ${(daypackToBodyRatio * 100).toFixed(1)}% of body weight. Consider transferring heavy non-emergencies (toiletries, spare footwear) to your duffel.`
    );
  } else {
    notes.push(
      `Optimal daypack weight (${daypackKg.toFixed(1)} kg = ${(daypackToBodyRatio * 100).toFixed(1)}% body weight). Well within the safe 15% ergonomic threshold.`
    );
  }

  if (altitudeMultiplier > 1.2) {
    notes.push(
      `High-Altitude Factor: At ${altitudeM}m, your ${daypackKg.toFixed(1)} kg daypack imposes an effective physiological strain equivalent to ${effectiveDaypackExertion.toFixed(1)} kg at sea level (+${Math.round((altitudeMultiplier - 1) * 100)}%).`
    );
  }

  return {
    maxAllowedDuffelPerTrekkerKg,
    totalDuffelKg: totalDuffelForTeamKg,
    totalDaypackKg: daypackKg * groupSize,
    portersRequired,
    estimatedDailyPorterWageNpr: portersRequired * IPPG_CONSTANTS.STANDARD_DAILY_PORTER_WAGE_NPR,
    estimatedDailyPorterWageUsd: portersRequired * IPPG_CONSTANTS.STANDARD_DAILY_PORTER_WAGE_USD,
    ippgCompliance,
    ippgStandardsPassed,
    daypackToBodyWeightRatio: daypackToBodyRatio,
    daypackSafetyStatus,
    altitudeExertionMultiplier: altitudeMultiplier,
    effectiveExertionKg: effectiveDaypackExertion,
    guidanceNotes: notes
  };
}

/**
 * Standard Curated Packing Manifest Presets
 */
export const MANIFEST_PRESETS: Record<
  'LIGHTWEIGHT_10_DAY' | 'HIGH_PASS_16_DAY' | 'WINTER_GLACIER_21_DAY',
  {
    name: string;
    description: string;
    targetAltitudeM: number;
    daypackKg: number;
    duffelKg: number;
    items: ManifestItemEntry[];
  }
> = {
  LIGHTWEIGHT_10_DAY: {
    name: 'Teahouse Fastpack (10 Days)',
    description: 'Minimalist load optimized for low-altitude circuits like Langtang Valley or Ghorepani Poon Hill.',
    targetAltitudeM: 3800,
    daypackKg: 5.2,
    duffelKg: 9.8,
    items: [
      { itemId: 'layer-base-top', name: 'Merino Wool 200g Base Top', category: 'Alpine Technical Layering', weightGrams: 220, carrier: 'worn' },
      { itemId: 'layer-fleece-mid', name: 'Polartec High-Loft Fleece', category: 'Alpine Technical Layering', weightGrams: 360, carrier: 'daypack' },
      { itemId: 'shell-jacket', name: 'GORE-TEX Pro Rain Shell', category: 'Alpine Technical Layering', weightGrams: 410, carrier: 'daypack' },
      { itemId: 'med-altitude-kit', name: 'AMS & Wilderness First Aid Kit', category: 'High-Altitude Medical & First Aid', weightGrams: 450, carrier: 'daypack' },
      { itemId: 'hydration-bottles', name: '2x 1L Nalgene Insulated Bottles', category: 'Packs & Load Carrying', weightGrams: 2400, carrier: 'daypack' },
      { itemId: 'electronics-bank', name: '20,000mAh Power Bank & Solar Cable', category: 'Electronics & Navigation', weightGrams: 420, carrier: 'daypack' },
      { itemId: 'sleep-liner', name: 'Silk Sleeping Bag Liner', category: 'Sleep System & Warmth', weightGrams: 160, carrier: 'duffel' },
      { itemId: 'spare-layers', name: '3x Merino Socks & Thermal Sets', category: 'Alpine Technical Layering', weightGrams: 1100, carrier: 'duffel' },
      { itemId: 'camp-shoes', name: 'Ultralight Down Camp Slippers', category: 'Footwear & Mountain Traction', weightGrams: 320, carrier: 'duffel' }
    ]
  },
  HIGH_PASS_16_DAY: {
    name: 'High-Pass Traverse (16 Days)',
    description: 'Balanced technical load for crossing Cho La, Thorong La, or Larkya La (>5,400m).',
    targetAltitudeM: 5416,
    daypackKg: 6.8,
    duffelKg: 12.4,
    items: [
      { itemId: 'layer-down-jacket', name: '800-Fill Expedition Down Parka', category: 'Alpine Technical Layering', weightGrams: 680, carrier: 'daypack' },
      { itemId: 'shell-jacket', name: 'GORE-TEX Alpine 3L Hardshell', category: 'Alpine Technical Layering', weightGrams: 440, carrier: 'daypack' },
      { itemId: 'microspikes', name: 'Kahtoola Steel Microspikes', category: 'Footwear & Mountain Traction', weightGrams: 380, carrier: 'daypack' },
      { itemId: 'med-altitude-kit', name: 'High-Altitude Medical Kit with Diamox', category: 'High-Altitude Medical & First Aid', weightGrams: 520, carrier: 'daypack' },
      { itemId: 'hydration-bottles', name: '2x 1L Insulated Wide-Mouth Hydration', category: 'Packs & Load Carrying', weightGrams: 2400, carrier: 'daypack' },
      { itemId: 'headlamp-batteries', name: 'Petzl Swift RL 900L & Spare Core', category: 'Electronics & Navigation', weightGrams: 160, carrier: 'daypack' },
      { itemId: 'sleep-bag-down', name: '-20°C Down Expedition Sleeping Bag', category: 'Sleep System & Warmth', weightGrams: 1450, carrier: 'duffel' },
      { itemId: 'spare-clothing-set', name: 'Technical Layering & Base Rotation', category: 'Alpine Technical Layering', weightGrams: 3200, carrier: 'duffel' },
      { itemId: 'trekking-poles', name: 'Black Diamond Carbon Distance FLZ', category: 'Packs & Load Carrying', weightGrams: 360, carrier: 'duffel' }
    ]
  },
  WINTER_GLACIER_21_DAY: {
    name: 'Glacial Expedition & 3 Passes (21 Days)',
    description: 'Maximum alpine insulation and technical hardware for late autumn, winter, or unassisted remote treks.',
    targetAltitudeM: 5545,
    daypackKg: 7.9,
    duffelKg: 14.8,
    items: [
      { itemId: 'layer-down-jacket', name: '900-Fill Sub-Zero Expedition Parka', category: 'Alpine Technical Layering', weightGrams: 890, carrier: 'daypack' },
      { itemId: 'glacier-glasses', name: 'Julbo Category 4 Glacier Goggles', category: 'Alpine Technical Layering', weightGrams: 140, carrier: 'daypack' },
      { itemId: 'crampons-hybrid', name: 'Petzl 10-Point Glacier Crampons', category: 'Footwear & Mountain Traction', weightGrams: 750, carrier: 'duffel' },
      { itemId: 'sleep-bag-extreme', name: '-30°C 1000g Goose Down Bag', category: 'Sleep System & Warmth', weightGrams: 1850, carrier: 'duffel' },
      { itemId: 'med-altitude-full', name: 'Expedition Pulse Oximeter & Dexamethasone', category: 'High-Altitude Medical & First Aid', weightGrams: 680, carrier: 'daypack' },
      { itemId: 'solar-satellite', name: 'Garmin inReach Mini 2 & Solar Panel', category: 'Electronics & Navigation', weightGrams: 510, carrier: 'daypack' }
    ]
  }
};
