export type ActivityType = 'trekking' | 'acclimatization' | 'pass' | 'flight' | 'camp' | 'monastery';

export interface PlannerWaypoint {
  id?: string;
  day: number;
  title: string;
  distanceKm: number;
  sleepingAltitude: number;
  altitudeGain: number;
  activityType: ActivityType;
  coordinates: { lat: number; lng: number };
  landmarkName?: string;
  notes?: string;
}

export const ACTIVITY_CONFIG: Record<ActivityType, {
  label: string;
  iconSymbol: string;
  badgeBg: string;
  borderColor: string;
  textColor: string;
  hexColor: string;
  description: string;
}> = {
  trekking: {
    label: 'Trekking / Hiking',
    iconSymbol: '🥾',
    badgeBg: 'bg-emerald-600',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-400',
    hexColor: '#10b981',
    description: 'Trail walking & valley ascents'
  },
  acclimatization: {
    label: 'Acclimatization Rest',
    iconSymbol: '🧘',
    badgeBg: 'bg-cyan-600',
    borderColor: 'border-cyan-300',
    textColor: 'text-cyan-300',
    hexColor: '#06b6d4',
    description: 'Altitude adaptation day & ridge climb'
  },
  pass: {
    label: 'High Pass / Summit',
    iconSymbol: '🏔️',
    badgeBg: 'bg-[#B68D40]',
    borderColor: 'border-[#E2C085]',
    textColor: 'text-amber-300',
    hexColor: '#B68D40',
    description: 'Technical glacier pass or peak climb'
  },
  flight: {
    label: 'Flight / Helipad',
    iconSymbol: '🚁',
    badgeBg: 'bg-purple-600',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-300',
    hexColor: '#a855f7',
    description: 'High altitude mountain flight / charter'
  },
  camp: {
    label: 'High Camp / Lodge',
    iconSymbol: '⛺',
    badgeBg: 'bg-orange-600',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-300',
    hexColor: '#f97316',
    description: 'Teahouse overnight or wilderness camp'
  },
  monastery: {
    label: 'Monastery / Shrine',
    iconSymbol: '🛕',
    badgeBg: 'bg-red-600',
    borderColor: 'border-red-400',
    textColor: 'text-rose-400',
    hexColor: '#e11d48',
    description: 'Tibetan Buddhist gompa or sacred site'
  }
};
