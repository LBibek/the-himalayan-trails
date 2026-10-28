import { Trail } from './index';

export type VacationDuration = 'short' | 'medium' | 'long';
export type ExpeditionSeason = 'spring' | 'autumn' | 'winter' | 'monsoon';
export type FitnessLevel = 'casual' | 'intermediate' | 'extreme';
export type ExpeditionVibe = 'classic_iconic' | 'remote_wilderness' | 'cultural_immersion';
export type ComfortPreference = 'authentic_teahouse' | 'premium_lodge';

export interface MatchmakerPreferences {
  duration: VacationDuration;
  season: ExpeditionSeason;
  fitness: FitnessLevel;
  vibe: ExpeditionVibe;
  comfort: ComfortPreference;
}

export interface TrueCostBreakdown {
  basePackageUsd: number;
  domesticTransitUsd: number;
  domesticTransitDetails: string;
  dailyFoodAndShowerUsd: number;
  dailyFoodRateUsd: number;
  foodAndShowerDetails: string;
  permitsAndTimsUsd: number;
  permitsDetails: string;
  tippingBudgetUsd: number;
  tippingRatePercent: number;
  totalEstimatedInvestmentUsd: number;
  comfortMode: ComfortPreference;
}

export interface ExpeditionMatchResult {
  trail: Trail;
  matchPercentage: number;
  matchScore: number;
  matchReasons: string[];
  pacingSummary: string;
  costBreakdown: TrueCostBreakdown;
}
