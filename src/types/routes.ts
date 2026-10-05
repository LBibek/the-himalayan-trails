import { Trail, ItineraryDay, Landmark } from './index';

export type PassCrossingStatus = 'OPTIMAL_WINDOW' | 'CAUTION_WINDOW' | 'HIGH_RISK_CLOSED';

export type PassCrossingPeriod = 'today_morning' | 'today_afternoon' | 'tomorrow_morning' | 'tomorrow_afternoon';

export interface PassCrossingInterval {
  period: PassCrossingPeriod;
  label: string; // e.g. "Today Morning (05:00 - 09:30 AM)"
  timeRange: string;
  status: PassCrossingStatus;
  statusLabel: string; // e.g. "Optimal Window", "Caution Required", "High Risk / Closed"
  windSpeedKm: number;
  windSpeedCategory: 'Optimal (<35 km/h)' | 'Moderate Caution (35-50 km/h)' | 'Severe / Whiteout (>50 km/h)';
  tempC: number;
  windChillC: number;
  freezingLevelM: number;
  snowRisk: 'Low' | 'Moderate' | 'Heavy / Whiteout';
  recommendation: string;
  departureAdvice: string;
}

export interface PassCrossingAssessment {
  passId: 'thorong-la' | 'cho-la' | 'larkya-la' | 'kongma-la' | 'renjo-la' | string;
  passName: string;
  nativeName?: string;
  elevationM: number;
  region: string;
  coordinates: { lat: number; lng: number };
  currentStatus: PassCrossingStatus;
  morningWindowRecommendation: string;
  baseReferenceAltitude: number;
  intervals: PassCrossingInterval[];
  gearRequired: string[];
  hazards: string[];
  updatedAt: string;
}

export interface ConnectorBridge {
  fromSegmentIndex: number;
  toSegmentIndex: number;
  distanceKm: number;
  interpolatedPointsCount: number;
  startCoord: [number, number, number?];
  endCoord: [number, number, number?];
  interpolatedPoints?: [number, number, number?][];
}

export interface StitchSegment {
  id: string;
  trailId: string;
  trailSlug: string;
  trailName: string;
  region: string;
  distanceKm: number;
  elevationGain: number;
  maxElevation: number;
  durationDays: number;
  startPoint: string;
  endPoint: string;
  coordinates: [number, number, number?][];
  elevationProfile?: {
    distanceKm: number;
    elevation: number;
    label?: string;
  }[];
  stages?: ItineraryDay[];
}

export interface StitchedMetrics {
  totalDistanceKm: number;
  totalElevationGainM: number;
  totalElevationLossM: number;
  maxAltitudeM: number;
  minAltitudeM: number;
  totalDays: number;
  segmentCount: number;
  highPassesCount: number;
  connectorDistanceKm: number;
}

export interface StitchedElevationPoint {
  distanceKm: number;
  altitudeMeters: number;
  lat: number;
  lng: number;
  landmarkName?: string;
  segmentIndex: number;
  isConnector?: boolean;
}

export interface StitchedRoute {
  id: string;
  title: string;
  description: string;
  segments: StitchSegment[];
  connectors: ConnectorBridge[];
  metrics: StitchedMetrics;
  coordinates: [number, number, number?][];
  elevationProfile: StitchedElevationPoint[];
  mergedItinerary: ItineraryDay[];
  traversedPasses: PassCrossingAssessment[];
  createdAt: string;
}

export interface StitchRouteRequest {
  trailIds: string[];
  customTitle?: string;
}
