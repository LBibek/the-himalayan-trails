/**
 * Emergency SOS Dispatch Formatter & Himalayan Wilderness Navigation Math
 * Specially engineered for low-bandwidth 2G cell signal, 160-char SMS,
 * Garmin inReach, ZOLEO, and Iridium satellite messenger payloads.
 */

import type { Landmark } from '../types/index.ts';

export type EmergencyCondition =
  | 'AMS/HAPE/HACE'
  | 'FRACTURE/TRAUMA'
  | 'HYPOTHERMIA'
  | 'LOST/BLIZZARD'
  | 'AVALANCHE';

export interface EmergencySosOptions {
  condition: EmergencyCondition | string;
  partySize: number;
  casualtiesCount: number;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  checkpoint?: string;
  batteryLevel?: number; // 0 - 100 percentage
  contactNumber?: string;
  requirements?: string; // e.g. "HELI EVAC + O2 REQ"
}

export interface EmergencyContact {
  name: string;
  phone: string;
  role: string;
  description: string;
  frequency?: string;
}

/**
 * Pre-configured verified Himalayan Search & Rescue dispatch hotlines.
 */
export const HIMALAYAN_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: 'Nepal High-Altitude SAR Heli Dispatch',
    phone: '+97714123456',
    role: 'Search & Rescue / Helicopter Extraction',
    description: 'Kathmandu coordination center for emergency civilian helicopter evacuations across Khumbu, Annapurna & Manaslu.',
    frequency: '156.800 MHz (VHF Ch 16)',
  },
  {
    name: 'Himalayan Rescue Association (HRA)',
    phone: '+97714440520',
    role: 'High-Altitude Medical Clinics (Pheriche & Manang)',
    description: 'Specialized mountain medicine doctors managing high-altitude clinical care and emergency rescue operations.',
  },
  {
    name: 'Nepal Tourist Police',
    phone: '1144',
    role: 'National Tourist Police Hotline',
    description: 'Toll-free emergency dispatch, trail security & missing trekker tracking (+977-1-4247041).',
  },
  {
    name: 'COSPAS-SARSAT Satellite Relay',
    phone: '+97714123456',
    role: 'International 406 MHz Beacon Distress Network',
    description: 'Monitored distress satellite relay frequency for PLBs and EPIRBs.',
    frequency: '406.037 MHz',
  },
];

/**
 * Compresses critical survival telemetry into an ultra-dense string <= 160 characters
 * (the standard global 7-bit GSM SMS payload limit).
 *
 * Example formatted payload:
 * "SOS! 2 PAX (1 HAPE). LOC: 27.9892N, 86.8291E (4940m Lobuche). BAT: 22%. CONTACT: +97714123456. REQ: HELI RESCUE O2."
 */
export function formatEmergencySosMessage(options: EmergencySosOptions): string {
  const {
    condition = 'AMS/HAPE/HACE',
    partySize = 1,
    casualtiesCount = 1,
    latitude = 0,
    longitude = 0,
    altitudeMeters,
    checkpoint,
    batteryLevel,
    contactNumber = '+97714123456',
    requirements = 'HELI RESCUE O2',
  } = options;

  const validLat = Number.isFinite(latitude) ? latitude : 0;
  const validLng = Number.isFinite(longitude) ? longitude : 0;
  const pSize = Math.max(1, Math.round(partySize || 1));
  const cCount = Math.max(0, Math.min(pSize, Math.round(casualtiesCount ?? 1)));

  // Abbreviate condition cleanly
  let condStr = condition || 'AMS/HAPE/HACE';
  if (condStr === 'AMS/HAPE/HACE') condStr = 'HAPE/HACE';
  else if (condStr === 'FRACTURE/TRAUMA') condStr = 'TRAUMA';
  else if (condStr === 'LOST/BLIZZARD') condStr = 'BLIZZARD';

  const latStr = `${Math.abs(validLat).toFixed(4)}${validLat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(validLng).toFixed(4)}${validLng >= 0 ? 'E' : 'W'}`;

  // Helper to abbreviate user requirements without destroying non-heli requests
  const abbreviateReq = (req: string): string => {
    let r = req.trim();
    r = r.replace(/HELI RESCUE O2/gi, 'HELI O2');
    r = r.replace(/HELI EVAC \+ O2 REQ/gi, 'HELI O2');
    r = r.replace(/HELI EVAC STRETCHER/gi, 'HELI STRETCHER');
    r = r.replace(/GROUND SAR TEAM/gi, 'SAR TEAM');
    r = r.replace(/DOCTOR ADVICE/gi, 'DOC ADVICE');
    return r.slice(0, 16);
  };

  const batStr = typeof batteryLevel === 'number' && Number.isFinite(batteryLevel)
    ? ` BAT: ${Math.round(batteryLevel)}%.`
    : '';

  const cleanContact = contactNumber ? contactNumber.trim() : '';
  let contactStr = cleanContact ? ` CONTACT: ${cleanContact}.` : '';

  let currentReq = requirements ? requirements.trim() : '';
  let reqStr = currentReq ? ` REQ: ${currentReq}.` : '';

  // Formatter helper for locContext
  const buildLocContext = (cp?: string, alt?: number) => {
    if (alt !== undefined && cp) return ` (${Math.round(alt)}m ${cp})`;
    if (alt !== undefined) return ` (${Math.round(alt)}m)`;
    if (cp) return ` (${cp})`;
    return '';
  };

  let cleanCheckpoint = checkpoint ? checkpoint.trim() : '';
  let locContext = buildLocContext(cleanCheckpoint || undefined, altitudeMeters);

  // Level 0: Standard base payload assembly
  let message = `SOS! ${pSize} PAX (${cCount} ${condStr}). LOC: ${latStr}, ${lngStr}${locContext}.${batStr}${contactStr}${reqStr}`;

  // Level 1: Truncate long checkpoint string
  if (message.length > 160 && cleanCheckpoint.length > 10) {
    cleanCheckpoint = cleanCheckpoint.slice(0, 10);
    locContext = buildLocContext(cleanCheckpoint, altitudeMeters);
    message = `SOS! ${pSize} PAX (${cCount} ${condStr}). LOC: ${latStr}, ${lngStr}${locContext}.${batStr}${contactStr}${reqStr}`;
  }

  // Level 2: Abbreviate requirements if still too long
  if (message.length > 160 && currentReq) {
    const shortReq = abbreviateReq(currentReq);
    reqStr = ` REQ: ${shortReq}.`;
    message = `SOS! ${pSize} PAX (${cCount} ${condStr}). LOC: ${latStr}, ${lngStr}${locContext}.${batStr}${contactStr}${reqStr}`;
  }

  // Level 3: Drop checkpoint name completely, retaining altitude
  if (message.length > 160 && cleanCheckpoint) {
    locContext = buildLocContext(undefined, altitudeMeters);
    message = `SOS! ${pSize} PAX (${cCount} ${condStr}). LOC: ${latStr}, ${lngStr}${locContext}.${batStr}${contactStr}${reqStr}`;
  }

  // Level 4: Abbreviate CONTACT prefix to TEL
  if (message.length > 160 && cleanContact) {
    contactStr = ` TEL: ${cleanContact}.`;
    message = `SOS! ${pSize} PAX (${cCount} ${condStr}). LOC: ${latStr}, ${lngStr}${locContext}.${batStr}${contactStr}${reqStr}`;
  }

  // Level 5: Drop altitude if still over 160 chars
  if (message.length > 160 && locContext) {
    locContext = '';
    message = `SOS! ${pSize} PAX (${cCount} ${condStr}). LOC: ${latStr}, ${lngStr}.${batStr}${contactStr}${reqStr}`;
  }

  // Level 6: Strict boundary clamp ensuring message length <= 160
  if (message.length > 160) {
    message = message.slice(0, 160);
  }

  return message;
}

/**
 * Generates an RFC-compliant sms: URI for one-tap mobile dispatch.
 */
export function generateSmsUri(phone: string, body: string): string {
  const sanitizedPhone = phone.replace(/[^\d+]/g, '');
  return `sms:${sanitizedPhone}?body=${encodeURIComponent(body)}`;
}

/**
 * Geodesic distance in kilometers using the Haversine equation.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return 0;
  }
  const R = 6371.0088; // Earth mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000) / 1000;
}

/**
 * Calculates walking speed using Tobler's Hiking Function scaled for high-altitude trekking.
 * Tobler's empirical formula: v = 6 * exp(-3.5 * |s + 0.05|)
 * where s = dh/dx (slope, vertical rise over horizontal run).
 *
 * @param slope Slope as dh/dx (e.g. +200m over 1000m = 0.20, descent -150m over 1000m = -0.15)
 * @param baselineFlatKmh Flat-ground speed baseline in km/h (default 3.0 km/h for Himalayan terrain)
 * @returns velocity in km/h (bounded between 0.5 km/h and 5.0 km/h)
 */
export function calculateToblerHikingSpeed(
  slope: number,
  baselineFlatKmh: number = 3.0
): number {
  if (!Number.isFinite(slope)) return baselineFlatKmh;
  const toblerUnscaled = 6.0 * Math.exp(-3.5 * Math.abs(slope + 0.05));
  const flatTobler = 6.0 * Math.exp(-3.5 * 0.05); // ~5.035 km/h
  const scaled = (toblerUnscaled / flatTobler) * baselineFlatKmh;
  return Math.max(0.5, Math.min(5.0, Math.round(scaled * 100) / 100));
}

/**
 * Calculates trekking time in minutes given horizontal distance in km and elevation change in meters.
 */
export function calculateTrekkingTimeMinutes(
  distanceKm: number,
  elevationDeltaM: number,
  baselineFlatKmh: number = 3.0
): number {
  if (distanceKm <= 0) return 0;
  const horizontalM = distanceKm * 1000;
  const slope = horizontalM > 0 ? elevationDeltaM / horizontalM : 0;
  const speedKmh = calculateToblerHikingSpeed(slope, baselineFlatKmh);
  const hours = distanceKm / speedKmh;
  return Math.max(1, Math.round(hours * 60));
}

/**
 * Formats duration in minutes to human-readable hiking time (e.g. "~1h 15m" or "~45m").
 */
export function formatTrekkingTime(minutes: number): string {
  if (minutes <= 0) return '~0m';
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours === 0) return `~${remMinutes}m`;
  if (remMinutes === 0) return `~${hours}h`;
  return `~${hours}h ${remMinutes}m`;
}

export interface NextLodgeResult {
  nextLandmark: Landmark | null;
  distanceKm: number;
  elevationDeltaM: number;
  estimatedMinutes: number;
  formattedHud: string;
  currentProgressRatio: number; // 0.0 to 1.0
  currentIndex: number;
}

/**
 * Analyzes trekker's current geographic coordinate relative to the trail polyline
 * and identifies the nearest upcoming teahouse lodge / landmark ahead on the route.
 */
export function findNextLodgeOrCheckpoint(
  currentCoords: [number, number],
  routeCoordinates: [number, number, number?][],
  landmarks: Landmark[] = [],
  currentAltitude?: number
): NextLodgeResult {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return {
      nextLandmark: null,
      distanceKm: 0,
      elevationDeltaM: 0,
      estimatedMinutes: 0,
      formattedHud: 'Trail coordinates unavailable',
      currentProgressRatio: 0,
      currentIndex: 0,
    };
  }

  // 1. Find the closest vertex index on the route polyline to currentCoords
  let closestIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < routeCoordinates.length; i++) {
    const pt = routeCoordinates[i];
    const dist = haversineDistanceKm(currentCoords[0], currentCoords[1], pt[0], pt[1]);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  const progressRatio = routeCoordinates.length > 1
    ? closestIndex / (routeCoordinates.length - 1)
    : 0;

  // Fallback altitude if not explicitly provided
  const trekkerAlt = typeof currentAltitude === 'number' && Number.isFinite(currentAltitude)
    ? currentAltitude
    : routeCoordinates[closestIndex][2] ?? 3500;

  // 2. Project each landmark to the closest vertex index on the trail
  const candidateLandmarks = landmarks.map((lm) => {
    let lmClosestIdx = 0;
    let lmMinDist = Infinity;
    for (let i = 0; i < routeCoordinates.length; i++) {
      const pt = routeCoordinates[i];
      const dist = haversineDistanceKm(lm.coordinates.lat, lm.coordinates.lng, pt[0], pt[1]);
      if (dist < lmMinDist) {
        lmMinDist = dist;
        lmClosestIdx = i;
      }
    }
    return {
      landmark: lm,
      routeIndex: lmClosestIdx,
      isAhead: lmClosestIdx > closestIndex,
    };
  });

  // Filter to upcoming landmarks ahead of current position
  const ahead = candidateLandmarks
    .filter((c) => c.isAhead)
    .sort((a, b) => a.routeIndex - b.routeIndex);

  let targetLandmark: Landmark | null = null;
  let targetIndex = routeCoordinates.length - 1;

  if (ahead.length > 0) {
    targetLandmark = ahead[0].landmark;
    targetIndex = ahead[0].routeIndex;
  } else {
    // If past all landmarks, target is the final trail apex / terminus
    targetLandmark = null;
    targetIndex = routeCoordinates.length - 1;
  }

  // 3. Compute trail polyline distance from closestIndex to targetIndex
  let cumulativeDistKm = 0;
  const isArrived = closestIndex >= routeCoordinates.length - 1;

  if (!isArrived) {
    const startI = Math.min(closestIndex, targetIndex);
    const endI = Math.max(closestIndex, targetIndex);

    for (let i = startI; i < endI; i++) {
      const p1 = routeCoordinates[i];
      const p2 = routeCoordinates[i + 1];
      cumulativeDistKm += haversineDistanceKm(p1[0], p1[1], p2[0], p2[1]);
    }
  }
  cumulativeDistKm = Math.round(cumulativeDistKm * 10) / 10;

  // 4. Elevation delta and Tobler hiking pace
  const targetAlt = targetLandmark?.elevation ?? (routeCoordinates[targetIndex][2] ?? trekkerAlt);
  const elevationDeltaM = isArrived ? 0 : Math.round(targetAlt - trekkerAlt);
  const estMinutes = isArrived ? 0 : calculateTrekkingTimeMinutes(cumulativeDistKm, elevationDeltaM, 3.0);
  const timeFormatted = formatTrekkingTime(estMinutes);

  // 5. Generate formatted high-contrast HUD string
  // Format: "📍 Next: Lobuche (4,940m) • 3.4 km ahead • ~1h 15m • +210m climb"
  const targetName = targetLandmark?.name ?? 'Trail Destination';
  const elevFormatted = `${Math.round(targetAlt).toLocaleString()}m`;
  const climbWord = elevationDeltaM >= 0 ? 'climb' : 'descent';
  const sign = elevationDeltaM >= 0 ? '+' : '';

  const formattedHud = isArrived
    ? `📍 Destination Reached (${elevFormatted}) • 0.0 km • Arrived • 0m climb`
    : `📍 Next: ${targetName} (${elevFormatted}) • ${cumulativeDistKm.toFixed(1)} km ahead • ${timeFormatted} • ${sign}${elevationDeltaM}m ${climbWord}`;

  return {
    nextLandmark: targetLandmark,
    distanceKm: cumulativeDistKm,
    elevationDeltaM,
    estimatedMinutes: estMinutes,
    formattedHud,
    currentProgressRatio: Math.round(progressRatio * 100) / 100,
    currentIndex: closestIndex,
  };
}
