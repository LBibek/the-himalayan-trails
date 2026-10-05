export type StageSafetyRating = 'SAFE' | 'CAUTION' | 'DANGER';

export type WmsAscentStatus = 'Optimal Ascent' | 'Moderate Caution' | 'Steep Velocity Alert';

export type AmsRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface ItineraryStageInput {
  day: number;
  title: string;
  elevation: number;
  distanceKm?: number;
  dayPeakElevation?: number;
}

export interface DailyPacingAudit {
  day: number;
  title: string;
  elevation: number;
  distanceKm?: number;
  dayPeakElevation?: number;
  climbHighSleepLowDelta?: number;
  dailyGain: number;
  sleepGainAbove3000: number;
  isRestDay: boolean;
  rating: StageSafetyRating;
  ratingLabel: string;
  wmsStatus: WmsAscentStatus;
  estimatedSpO2: number;
  amsRiskLevel: AmsRiskLevel;
  clinicalAdvisory: string;
}

export interface AcclimatizationReport {
  stages: DailyPacingAudit[];
  overallSafety: StageSafetyRating;
  totalAscentMeters: number;
  maxSleepingElevation: number;
  restDayCount: number;
  daysAbove3000m: number;
  consecutiveAscentDays: number;
  wmsComplianceScore: number; // 0 to 100
  wmsViolations: string[];
  recommendations: string[];
  summaryText: string;
}
