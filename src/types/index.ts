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
}

export interface Landmark {
  id: string;
  name: string;
  nativeName?: string;
  category: 'High Pass' | 'Base Camp' | 'Monastery' | 'Sacred Lake' | 'Village' | string;
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
  createdAt: string;
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
