export interface Teahouse {
  id: string;
  name: string;
  region: string;
  village: string;
  elevation: number;
  latitude: number;
  longitude: number;
  roomTypes: string[];
  pricePerNightUsd: number;
  amenities: string[];
  foodMenu: string[];
  contactPhone?: string;
  hostName?: string;
  rating: number;
  reviewsCount: number;
  coverImage: string;
  isVerified: boolean;
  createdAt: string;
}

export interface TeahouseReservation {
  id: string;
  teahouseId: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  guestsCount: number;
  roomType: string;
  dietaryNotes?: string;
  totalPriceUsd: number;
  status: 'CONFIRMED' | 'CANCELLED' | string;
  createdAt: string;
  teahouseName?: string;
  village?: string;
}

export interface TrailConditionReport {
  id: string;
  trailId: string;
  reporterName: string;
  reporterRole: 'Certified Sherpa Guide' | 'Verified Adventurer' | 'Lodge Host' | string;
  statusLevel: 'CLEAR_PASSABLE' | 'CAUTION_HAZARD' | 'BLOCKED_IMPASSABLE' | string;
  conditionType: 'Snow / Ice on Pass' | 'River Crossing / Bridge' | 'Landslide / Rockfall' | 'Weather Window' | 'Teahouse Capacity Full' | string;
  latitude: number;
  longitude: number;
  locationName: string;
  elevation: number;
  notes: string;
  gearRecommended?: string;
  upvotes: number;
  createdAt: string;
  trailName?: string;
}
