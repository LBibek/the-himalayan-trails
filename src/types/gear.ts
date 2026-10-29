export type GearCategory =
  | 'Alpine Technical Layering'
  | 'Footwear & Mountain Traction'
  | 'Packs & Load Carrying'
  | 'Sleep System & Warmth'
  | 'High-Altitude Medical & First Aid'
  | 'Electronics & Navigation';

export type Season = 'Spring' | 'Autumn' | 'Winter' | 'Monsoon' | 'All Seasons';

export type ElevationTier = 'Sub-Alpine' | 'High-Pass' | 'Extreme Summit';

export type PorterStatus = 'Self-Supported' | 'Porter-Supported';

export interface GearItem {
  id: string;
  name: string;
  category: GearCategory;
  weightGrams: number;
  essential: boolean;
  description: string;
  applicableSeasons: Season[];
  minElevationTier: ElevationTier;
  carrier: 'daypack' | 'duffel' | 'worn' | 'either';
}

export interface PackWeightAudit {
  totalWeightGrams: number;
  totalWeightKg: number;
  daypackWeightKg: number;
  duffelWeightKg: number;
  status: 'OPTIMAL' | 'HEAVY' | 'OVERLOADED';
  statusLabel: string;
  porterLimitKg: number;
  ippgAdvisory: string;
  categoryBreakdown: Record<GearCategory, { count: number; weightGrams: number }>;
}

export interface ManifestItemEntry {
  itemId: string;
  name: string;
  category: GearCategory;
  weightGrams: number;
  carrier: 'daypack' | 'duffel' | 'worn';
}

export interface PorterEthicsAssessment {
  maxAllowedDuffelPerTrekkerKg: number;
  totalDuffelKg: number;
  totalDaypackKg: number;
  portersRequired: number;
  estimatedDailyPorterWageNpr: number;
  estimatedDailyPorterWageUsd: number;
  ippgCompliance: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  ippgStandardsPassed: boolean;
  daypackToBodyWeightRatio: number;
  daypackSafetyStatus: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  altitudeExertionMultiplier: number;
  effectiveExertionKg: number;
  guidanceNotes: string[];
}

export interface GearManifest {
  id: string;
  expeditionId?: string;
  bookingId?: string;
  trekkerName: string;
  trekkerEmail?: string;
  bodyWeightKg: number;
  targetAltitudeM: number;
  groupSize: number;
  daypackWeightKg: number;
  duffelWeightKg: number;
  totalWeightKg: number;
  effectiveExertionKg: number;
  porterCountRecommended: number;
  ippgCompliance: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  items: ManifestItemEntry[];
  notes?: string;
  createdAt: string;
}
