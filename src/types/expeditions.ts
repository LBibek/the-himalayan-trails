export interface GroupSideTripOption {
  id: string;
  name: string;
  elevationMeters: number;
  elevationGainMeters: number;
  durationHours: number;
  description: string;
  highlight: string;
}

export interface GroupGearOption {
  id: string;
  name: string;
  dailyRateUsd: number;
  weightKg: number;
  category: 'SLEEPING' | 'FOOTWEAR' | 'NAVIGATION' | 'CLOTHING' | 'ACCESSORY';
  description: string;
}

export interface GroupExpeditionItineraryCustomization {
  availableSideTrips?: GroupSideTripOption[];
  gearRentalCatalog?: GroupGearOption[];
  notes?: string;
  targetSummit?: string;
}

export interface GroupExpedition {
  id: string;
  shareToken: string;
  trailId: string;
  leaderUserId?: string;
  leaderName: string;
  leaderEmail: string;
  expeditionTitle: string;
  targetStartDate: string;
  targetGroupSize: number;
  itineraryCustomization?: GroupExpeditionItineraryCustomization;
  status: 'ORGANIZING' | 'CONFIRMED' | 'EXPEDITION_READY' | 'CANCELLED';
  createdAt: string;
}

export interface GroupMember {
  id: string;
  expeditionId: string;
  memberName: string;
  memberEmail: string;
  role: 'LEADER' | 'MEMBER';
  sideTripVotes: string[];
  personalGearRentals: string[];
  shareAmountUsd: number;
  paymentStatus: 'UNPAID' | 'DEPOSIT_PAID' | 'PAID_FULL';
  receiptNumber?: string;
  paidAt?: string;
  joinedAt: string;
}

export interface GroupSideTripTally {
  id: string;
  name: string;
  elevationMeters: number;
  elevationGainMeters: number;
  durationHours: number;
  description: string;
  votesCount: number;
  voterNames: string[];
}

export interface GroupExpeditionWithDetails extends GroupExpedition {
  trail?: {
    id: string;
    slug: string;
    name: string;
    region: string;
    difficulty: string;
    distanceKm: number;
    durationDays: number;
    maxElevation: number;
    elevationGain: number;
    image: string;
    startPoint: string;
    endPoint: string;
  };
  members: GroupMember[];
  paidMembersCount: number;
  totalMembersCount: number;
  depositPerPersonUsd: number;
  totalCollectedUsd: number;
  targetGroupSize: number;
  sideTripTallies: GroupSideTripTally[];
  availableSideTrips: GroupSideTripOption[];
  availableGearOptions: GroupGearOption[];
  isFullyFunded: boolean;
  inviteLink: string;
}
