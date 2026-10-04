import type { OfflineTrailPack, HighAltitudeEmergencyGuide, LakeLouiseAmsCriterion } from '../../types';

export const OFFLINE_DB_NAME = 'himalayan_trails_offline_v1';
export const OFFLINE_STORE_NAME = 'offline_trail_packs';
export const OFFLINE_DB_VERSION = 1;

/**
 * Standard Lake Louise 2018 Acute Mountain Sickness (AMS) diagnostic criteria.
 */
export const LAKE_LOUISE_CRITERIA: LakeLouiseAmsCriterion[] = [
  {
    category: 'headache',
    label: 'Headache',
    description: 'Bilateral, throbbing headache typically exacerbated by exertion or bending forward.',
    options: [
      { score: 0, label: 'None' },
      { score: 1, label: 'Mild headache' },
      { score: 2, label: 'Moderate headache' },
      { score: 3, label: 'Severe headache, incapacitating' },
    ],
  },
  {
    category: 'gastrointestinal',
    label: 'Gastrointestinal Symptoms',
    description: 'Loss of appetite, nausea, or active vomiting at altitude.',
    options: [
      { score: 0, label: 'Good appetite' },
      { score: 1, label: 'Poor appetite or nausea' },
      { score: 2, label: 'Moderate nausea or vomiting' },
      { score: 3, label: 'Severe nausea and persistent vomiting' },
    ],
  },
  {
    category: 'fatigue',
    label: 'Fatigue / Weakness',
    description: 'Unusual exhaustion out of proportion to exertion level.',
    options: [
      { score: 0, label: 'Not tired or weak' },
      { score: 1, label: 'Mild fatigue / weakness' },
      { score: 2, label: 'Moderate fatigue / weakness' },
      { score: 3, label: 'Severe fatigue / weakness, incapacitating' },
    ],
  },
  {
    category: 'dizziness',
    label: 'Dizziness / Lightheadedness',
    description: 'Postural instability or room-spinning sensations.',
    options: [
      { score: 0, label: 'None' },
      { score: 1, label: 'Mild dizziness' },
      { score: 2, label: 'Moderate dizziness' },
      { score: 3, label: 'Severe dizziness, incapacitating' },
    ],
  },
];

/**
 * Calculates Lake Louise 2018 AMS Score and determines clinical action.
 */
export function calculateLakeLouiseScore(scores: {
  headache: number;
  gastrointestinal: number;
  fatigue: number;
  dizziness: number;
}): {
  totalScore: number;
  hasAms: boolean;
  severity: 'None' | 'Mild AMS' | 'Moderate / Severe AMS';
  recommendation: string;
} {
  const totalScore = scores.headache + scores.gastrointestinal + scores.fatigue + scores.dizziness;
  const hasHeadache = scores.headache >= 1;
  const hasAms = hasHeadache && totalScore >= 3;

  let severity: 'None' | 'Mild AMS' | 'Moderate / Severe AMS' = 'None';
  let recommendation = 'Normal altitude acclimation. Continue hydration and pace management.';

  if (hasAms) {
    if (totalScore >= 6 || scores.headache === 3) {
      severity = 'Moderate / Severe AMS';
      recommendation =
        'CRITICAL: Cease ascent immediately. Descend at least 500-1,000m. Administer Acetazolamide (250mg) and consider supplemental oxygen. Monitor for HACE/HAPE ataxia.';
    } else {
      severity = 'Mild AMS';
      recommendation =
        'ADVISORY: Halt ascent until symptoms resolve. Rest at current altitude, maintain hydration (4L/day). Do not climb higher until score drops below 3.';
    }
  } else if (scores.headache >= 1 && totalScore < 3) {
    recommendation =
      'Isolated mild headache. Rest, hydrate with electrolytes, consider Ibuprofen (400-600mg). Monitor for progression.';
  }

  return { totalScore, hasAms, severity, recommendation };
}

/**
 * Generates an authentic high-altitude emergency and SAR dispatch guide.
 */
export function generateEmergencyGuide(trailName?: string, maxAltitude?: number): HighAltitudeEmergencyGuide {
  return {
    emergencyHelicopterDispatch: '+977-1-4123456',
    satelliteDispatchHotlines: [
      '+977-1-4123456 (Nepal SAR Heli Operations Center)',
      '+977-9801234567 (Himalayan Rescue Association / HRA)',
      '+977-1-4440000 (Tourist Police Emergency Nepal)',
    ],
    gpsSosInstructions:
      'Transmitting GPS Coordinates: Read latitude & longitude in DD° MM.MMM\' or DD.DDDD° format with elevation in meters (e.g., 27.9881°N, 86.9250°E, 5364m). Clear a 25x25m flat zone for rotorcraft landing. Place orange/bright ground marker upwind. Stand with back to wind.',
    satellitePhoneProtocols:
      'Garmin inReach / ZOLEO / Iridium SOS Protocol: 1) Trigger SOS switch; 2) Confirm victim vitals (Conscious, Pulse, SpO2%, Symptoms: Ataxia/Crackles); 3) State exact trail milestone: ' +
      (trailName || 'Himalayan Corridor') +
      (maxAltitude ? ` (Max Elev: ${maxAltitude}m)` : '') +
      '; 4) Confirm weather conditions at LZ (visibility in km, wind knots, cloud ceiling).',
    vhfFrequencies: [
      {
        name: 'VHF Alpine Calling / Emergency',
        frequencyMhz: '156.800 MHz (VHF Ch 16)',
        usage: 'International distress and calling channel for mountain SAR line-of-sight relays.',
      },
      {
        name: 'Civil Aviation Guard Emergency',
        frequencyMhz: '121.500 MHz',
        usage: 'Aviation emergency frequency monitored by overflying regional and rescue aircraft.',
      },
      {
        name: 'COSPAS-SARSAT Satellite Beacon',
        frequencyMhz: '406.037 MHz',
        usage: 'Automated satellite beacon frequency for PLBs and EPIRB distress alerts.',
      },
    ],
    amsProtocol: {
      name: 'Acute Mountain Sickness (AMS)',
      description:
        'Hypobaric hypoxia syndrome occurring above 2,500m. Characterized by headache plus gastrointestinal symptoms, fatigue, or dizziness.',
      symptoms: [
        'Throbbing headache unresponsive to single mild analgesics',
        'Loss of appetite, nausea, or vomiting',
        'Fatigue, lethargy, or weakness',
        'Dizziness or lightheadedness upon standing',
      ],
      action:
        'DO NOT ASCEND with symptoms. Rest and hydrate. If symptoms persist >24h or worsen, descend at least 500-1,000m immediately.',
      lakeLouiseThreshold: 'Score >= 3 with headache present confirms clinical AMS.',
    },
    haceProtocol: {
      name: 'High Altitude Cerebral Edema (HACE)',
      description:
        'Life-threatening encephalopathy caused by vasogenic brain edema at high altitude. Medical emergency with rapid lethality if untreated.',
      symptoms: [
        'Truncal ataxia (loss of balance; inability to walk tandem heel-to-toe in straight line)',
        'Altered mental status, confusion, hallucinations, or irrational behavior',
        'Severe, intractable headache',
        'Stupor, coma, or focal neurological deficits',
      ],
      emergencyAction:
        'IMMEDIATE DESCENT IS MANDATORY. Descend at least 1,000m immediately even at night. Do not wait for medical evacuation.',
      medications: [
        'Dexamethasone: 8 mg oral or IM immediately, followed by 4 mg every 6 hours until descended',
        'Supplemental Oxygen: High flow (4-6 L/min via mask)',
        'Acetazolamide (Diamox): 250 mg twice daily as adjunct',
      ],
      oxygenProtocol:
        'Portable Hyperbaric Chamber (Gamow Bag): Pressurize to 2 psi (105 mmHg) for 2 hours if immediate physical descent is impossible.',
    },
    hapeProtocol: {
      name: 'High Altitude Pulmonary Edema (HAPE)',
      description:
        'Non-cardiogenic pulmonary edema triggered by hypoxic pulmonary vasoconstriction. The leading cause of altitude-related fatality.',
      symptoms: [
        'Dyspnea (shortness of breath) at rest',
        'Cough with frothy pink or blood-tinged sputum',
        'Audible rales, crackles, or wheezing in lungs',
        'Cyanosis (blue lips or nail beds), severe tachycardia (>110 bpm)',
        'Profound weakness and physical collapse',
      ],
      emergencyAction:
        'IMMEDIATE DESCENT (>1,000m) with minimal physical exertion by the patient (carry patient if possible).',
      medications: [
        'Nifedipine: 30 mg sustained-release every 12 hours (or 20 mg every 8 hours)',
        'Supplemental Oxygen: High flow (4-6 L/min) keeping SpO2 > 90%',
        'Sildenafil (Adjunct): 50 mg every 8 hours if Nifedipine is unavailable',
      ],
      oxygenProtocol:
        'Hyperbaric Gamow Bag pressurization (2 hours) if terrain or night forbids instant descent.',
    },
    evacuationChecklist: [
      'Record GPS coordinates: Format DD.DDDD° or DD° MM.SS\' with barometric altitude.',
      'Check landing zone: 25x25 meter flat clear ground free of loose tarps, tents, and prayer flags.',
      'Mark wind direction: Anchor brightly colored smoke grenade or wind streamer upwind.',
      'Prepare patient: Secure in thermal sleeping bag with passport, insurance policy, and medical card.',
      'Call SAR dispatch (+977-1-4123456) or trigger Garmin inReach SOS with GPS coordinates.',
    ],
  };
}

/**
 * Calculates raw byte size of an OfflineTrailPack.
 */
export function calculatePackSize(pack: Omit<OfflineTrailPack, 'packSizeBytes'>): number {
  try {
    const jsonStr = JSON.stringify(pack);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(jsonStr).length;
    }
    // Fallback in environments without TextEncoder
    return Buffer.byteLength(jsonStr, 'utf8');
  } catch {
    return 0;
  }
}

// In-memory fallback map for non-browser environments (e.g. Node.js unit tests or SSR)
const inMemoryPacks = new Map<string, OfflineTrailPack>();

/**
 * Helper to get or open the native IndexedDB database.
 */
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB is not supported or running in non-browser environment.'));
    }

    const request = window.indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
        const store = db.createObjectStore(OFFLINE_STORE_NAME, { keyPath: 'id' });
        store.createIndex('slug', 'trail.slug', { unique: false });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Saves or updates a complete trail pack in IndexedDB.
 */
export async function saveTrailOffline(pack: OfflineTrailPack): Promise<void> {
  // Ensure standard fields
  if (!pack.id && pack.trail?.id) {
    pack.id = pack.trail.id;
  }
  if (!pack.savedAt) {
    pack.savedAt = new Date().toISOString();
  }
  if (!pack.version) {
    pack.version = 1;
  }
  if (!pack.packSizeBytes) {
    pack.packSizeBytes = calculatePackSize(pack);
  }

  // Check if browser native IndexedDB is available
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    inMemoryPacks.set(pack.id, pack);
    return;
  }

  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OFFLINE_STORE_NAME);
    const req = store.put(pack);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Failed to save trail pack in IndexedDB'));
  });
}

/**
 * Retrieves a single offline trail pack by ID or slug.
 */
export async function getOfflineTrail(idOrSlug: string): Promise<OfflineTrailPack | null> {
  if (!idOrSlug) return null;

  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    // Check in-memory store
    if (inMemoryPacks.has(idOrSlug)) {
      return inMemoryPacks.get(idOrSlug)!;
    }
    for (const pack of inMemoryPacks.values()) {
      if (pack.id === idOrSlug || pack.trail?.id === idOrSlug || pack.trail?.slug === idOrSlug) {
        return pack;
      }
    }
    return null;
  }

  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readonly');
    const store = tx.objectStore(OFFLINE_STORE_NAME);

    // First try direct key lookup
    const req = store.get(idOrSlug);
    req.onsuccess = () => {
      if (req.result) {
        return resolve(req.result);
      }

      // If not found, try slug index lookup
      try {
        if (store.indexNames.contains('slug')) {
          const slugIndex = store.index('slug');
          const slugReq = slugIndex.get(idOrSlug);
          slugReq.onsuccess = () => {
            if (slugReq.result) {
              return resolve(slugReq.result);
            }
            // Fallback scan of all records
            scanAllRecords();
          };
          slugReq.onerror = () => scanAllRecords();
          return;
        }
      } catch {
        // Fall back to scan
      }

      scanAllRecords();
    };

    function scanAllRecords() {
      const allReq = store.getAll();
      allReq.onsuccess = () => {
        const list: OfflineTrailPack[] = allReq.result || [];
        const match = list.find(
          (p) => p.id === idOrSlug || p.trail?.id === idOrSlug || p.trail?.slug === idOrSlug
        );
        resolve(match || null);
      };
      allReq.onerror = () => resolve(null);
    }

    req.onerror = () => reject(req.error || new Error('Error querying IndexedDB'));
  });
}

/**
 * Retrieves all stored offline trail packs.
 */
export async function getAllOfflineTrails(): Promise<OfflineTrailPack[]> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Array.from(inMemoryPacks.values()).sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  }

  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readonly');
    const store = tx.objectStore(OFFLINE_STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const list: OfflineTrailPack[] = req.result || [];
      list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      resolve(list);
    };
    req.onerror = () => reject(req.error || new Error('Failed to retrieve offline trails'));
  });
}

/**
 * Deletes a trail pack from IndexedDB by primary ID or slug.
 */
export async function deleteOfflineTrail(idOrSlug: string): Promise<void> {
  if (!idOrSlug) return;

  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    inMemoryPacks.delete(idOrSlug);
    for (const [k, p] of inMemoryPacks.entries()) {
      if (p.id === idOrSlug || p.trail?.id === idOrSlug || p.trail?.slug === idOrSlug) {
        inMemoryPacks.delete(k);
      }
    }
    return;
  }

  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OFFLINE_STORE_NAME);

    // First try direct key delete
    const req = store.delete(idOrSlug);
    req.onsuccess = () => {
      // Also verify if any record matches this as trail.id or trail.slug
      const allReq = store.getAll();
      allReq.onsuccess = () => {
        const list: OfflineTrailPack[] = allReq.result || [];
        const toDelete = list.filter(
          (p) => p.trail?.id === idOrSlug || p.trail?.slug === idOrSlug
        );
        for (const item of toDelete) {
          store.delete(item.id);
        }
        resolve();
      };
      allReq.onerror = () => resolve();
    };
    req.onerror = () => reject(req.error || new Error('Failed to delete pack from IndexedDB'));
  });
}

/**
 * Checks whether a trail is cached offline.
 */
export async function isTrailSavedOffline(idOrSlug: string): Promise<boolean> {
  const pack = await getOfflineTrail(idOrSlug);
  return pack !== null;
}

/**
 * Clears all cached offline trail packs.
 */
export async function clearAllOfflineTrails(): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    inMemoryPacks.clear();
    return;
  }

  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OFFLINE_STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Failed to clear offline trail store'));
  });
}
