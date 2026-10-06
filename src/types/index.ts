export interface Trail {
  id: string;
  slug: string;
  name: string;
  region: 'Everest' | 'Annapurna' | 'Langtang' | 'Manaslu' | 'Mustang' | 'Rolwaling' | string;
  difficulty: 'Moderate' | 'Strenuous' | 'Challenging' | 'Extreme' | string;
  distanceKm: number;
  durationDays: number;
  maxElevation: number;
  elevationGain: number;
  image: string;
  description: string;
  highlights: string[];
  bestMonths: string[];
  startPoint: string;
  endPoint: string;
  rating: number;
  reviewsCount: number;
  elevationProfile?: {
    distanceKm: number;
    elevation: number;
    label?: string;
  }[];
  routeCoordinates?: [number, number, number?][];
}

export interface HimalayanRange {
  id?: string;
  name: string;
  center: [number, number]; // [lat, lng]
  bounds: [number, number, number][]; // [lng, lat, elevation]
  pois: { name: string; coord: [number, number] }[];
  description?: string;
}

export interface Landmark {
  id: string;
  name: string;
  nativeName?: string;
  category: 'High Pass' | 'Base Camp' | 'Monastery' | 'Sacred Lake' | 'Village' | 'Hotel' | 'Community Homestay' | 'Airport' | 'Hot Spring' | 'Summit' | 'Lodge' | 'Viewpoint' | 'Checkpost' | string;
  elevation: number;
  region: string;
  coordinates: { lat: number; lng: number };
  image: string;
  description: string;
  permitRequired: string;
  associatedTrail: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  route: string;
  distanceKm: number;
  hours: number;
  sleepingAltitude: number;
  altitudeGain: number;
  highlights: string;
}

export interface Itinerary {
  id: string;
  title: string;
  trailName: string;
  author: string;
  authorAvatar: string;
  totalDays: number;
  maxAltitude: number;
  difficulty: string;
  estimatedCostUSD: number;
  likes: number;
  clones: number;
  days: ItineraryDay[];
}

export interface WeatherHazard {
  id: string;
  type: 'Landslide' | 'Ice Patch' | 'Bridge Damage' | 'Blizzard Warning' | string;
  severity: 'Medium' | 'High' | 'Critical' | string;
  location: string;
  description: string;
  updatedAt: string;
}

export interface WeatherReport {
  location: string;
  region: string;
  elevation: number;
  tempC: number;
  feelsLikeC: number;
  windKm: number;
  condition: 'Clear Skies' | 'Snow Flurries' | 'Freezing Fog' | 'Heavy Snow' | 'Partly Cloudy' | string;
  avalancheRisk: 'Low (1/5)' | 'Moderate (2/5)' | 'Considerable (3/5)' | 'High (4/5)' | string;
  hazards: WeatherHazard[];
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  authorAvatar: string;
  authorRole: string;
  region: string;
  trailName: string;
  readTime: string;
  date: string;
  coverImage: string;
  content: string;
  likes: number;
  comments: number;
}

export interface Booking {
  id: string;
  trailId: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  startDate: string;
  travelers: number;
  specialRequests?: string;
  totalPrice: number;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  paymentOption?: 'FULL' | 'DEPOSIT';
  depositAmount?: number;
  remainingBalance?: number;
  basePrice?: number;
  permitFee?: number;
  taxAmount?: number;
  receiptNumber?: string;
  invoiceBreakdown?: string;
  emergencyContact?: string;
  guideId?: string;
  porterCount?: number;
  totalGearWeightKg?: number;
  guideName?: string;
  guideLicense?: string;
  guideCertification?: string;
  guideAvatar?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  trailId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  reviewerName?: string;
  overallRating: number;
  difficultyRating: number;
  scenicRating: number;
  sceneryRating?: number;
  safetyRating: number;
  comment: string;
  conditionTags?: string;
  photos?: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  unlockedAt: string;
}

export interface HighPassHazardTelemetry {
  id: 'thorong-la' | 'cho-la' | 'larkya-la' | 'kongma-la' | string;
  name: string;
  nativeName?: string;
  elevation: number;
  region: string;
  coordinates: { lat: number; lng: number };
  tempC: number;
  windKm: number;
  windChillC: number;
  freezingLevelAltitudeMeters: number;
  avalancheRisk: 'Low (1/5)' | 'Moderate (2/5)' | 'Considerable (3/5)' | 'High (4/5)' | 'Very High (5/5)';
  avalancheRiskLevel: number;
  status: 'OPEN_CAUTION' | 'STRENUOUS' | 'EQUIPMENT_MANDATORY' | 'ADVISORY';
  safetyWarning: string;
  recommendedGear: string[];
  traversalWindow: string;
  updatedAt: string;
}

export interface WeatherTelemetryResponse extends WeatherReport {
  freezingLevelAltitudeMeters: number;
  windChillC: number;
  highPasses: HighPassHazardTelemetry[];
  radar: {
    radarTileUrl: string;
    cloudsTileUrl: string;
    attribution: string;
    timestamp: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'GUIDE' | 'TREKKER';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'UNREAD' | 'READ' | 'RESPONDED';
  createdAt: string;
}

export interface Inquiry {
  id: string;
  trailId: string;
  trailName: string;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  groupSize: number;
  preferredStartDate?: string;
  fitnessLevel?: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CONTACTED' | 'CANCELLED';
  createdAt: string;
}

export interface SharedTrail {
  id: string;
  title: string;
  region: string;
  elevation: number;
  difficulty: string;
  distance: string;
  duration: string;
  description: string;
  creatorName: string;
  creatorEmail: string;
  status: 'PENDING' | 'APPROVED';
  createdAt: string;
}

export interface LakeLouiseAmsCriterion {
  category: 'headache' | 'gastrointestinal' | 'fatigue' | 'dizziness';
  label: string;
  description: string;
  options: { score: number; label: string }[];
}

export interface HighAltitudeEmergencyGuide {
  emergencyHelicopterDispatch: string;
  satelliteDispatchHotlines: string[];
  gpsSosInstructions: string;
  satellitePhoneProtocols: string;
  vhfFrequencies: { name: string; frequencyMhz: string; usage: string }[];
  amsProtocol: {
    name: string;
    description: string;
    symptoms: string[];
    action: string;
    lakeLouiseThreshold: string;
  };
  haceProtocol: {
    name: string;
    description: string;
    symptoms: string[];
    emergencyAction: string;
    medications: string[];
    oxygenProtocol: string;
  };
  hapeProtocol: {
    name: string;
    description: string;
    symptoms: string[];
    emergencyAction: string;
    medications: string[];
    oxygenProtocol: string;
  };
  evacuationChecklist: string[];
}

export interface OfflineTrailPack {
  id: string;
  trail: Trail;
  routeCoordinates: [number, number, number?][];
  elevationProfile: {
    distanceKm: number;
    elevation: number;
    label?: string;
  }[];
  landmarks: Landmark[];
  itinerary: ItineraryDay[];
  emergencyGuide: HighAltitudeEmergencyGuide;
  savedAt: string;
  packSizeBytes: number;
  version: number;
}

export interface Guide {
  id: string;
  name: string;
  sherpaClan?: string;
  certification: 'IFMGA / UIAGM' | 'NNMGA Certified Alpine Guide' | 'NMA National Guide' | string;
  licenseNumber: string;
  summitCount: number;
  specialties: string[];
  languages: string[];
  dailyRateUsd: number;
  rating: number;
  reviewsCount: number;
  avatarImage: string;
  bio: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface PorterCalculationRequest {
  groupSize: number;
  durationDays: number;
  totalGearWeightKg?: number;
  personalGearWeightPerPersonKg?: number;
  groupCampingEquipmentKg?: number;
}

export interface PorterCalculationResult {
  groupSize: number;
  durationDays: number;
  totalGearWeightKg: number;
  recommendedPorters: number;
  weightPerPorterKg: number;
  complianceStatus: 'OPTIMAL' | 'LEGAL_MAXIMUM' | 'OVERLOADED';
  complianceLabel: string;
  dailyRatePerPorterUsd: number;
  insurancePerPorterUsd: number;
  equipmentAllowancePerPorterUsd: number;
  totalBaseWagesUsd: number;
  totalInsuranceUsd: number;
  totalEquipmentUsd: number;
  totalPorterCostUsd: number;
  guidelinesSummary: string;
}

export * from './acclimatization';
export * from './gear';
export * from './routes';
export * from './teahouses';
