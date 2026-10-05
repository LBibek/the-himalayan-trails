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
