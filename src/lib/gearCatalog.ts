import type {
  GearCategory,
  Season,
  ElevationTier,
  PorterStatus,
  GearItem,
  PackWeightAudit,
} from '@/types/gear';

/**
 * Authentic Himalayan Expedition Gear Registry
 * Categorized according to UIAGM and Himalayan alpine standards.
 */
export const HIMALAYAN_GEAR_REGISTRY: GearItem[] = [
  // ─── Alpine Technical Layering ───
  {
    id: 'layer-base-top',
    name: 'Merino Wool 200g Base Layer (Top)',
    category: 'Alpine Technical Layering',
    weightGrams: 220,
    essential: true,
    description: '100% Merino wool long sleeve, anti-odor, moisture-wicking next-to-skin layer.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'worn',
  },
  {
    id: 'layer-base-bottom',
    name: 'Merino Wool 200g Thermal Leggings',
    category: 'Alpine Technical Layering',
    weightGrams: 190,
    essential: true,
    description: 'Next-to-skin insulation for sub-zero mornings and high passes.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'worn',
  },
  {
    id: 'layer-fleece-mid',
    name: 'Polartec High-Loft Fleece Mid-Layer',
    category: 'Alpine Technical Layering',
    weightGrams: 360,
    essential: true,
    description: 'Breathable active insulation for sustained climbing pacing.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },
  {
    id: 'layer-down-jacket',
    name: '800-Fill Goose Down Expedition Parka',
    category: 'Alpine Technical Layering',
    weightGrams: 680,
    essential: true,
    description: 'Hydrophobic down jacket with box-wall baffling rated to -20°C for high camps.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'All Seasons'],
    minElevationTier: 'High-Pass',
    carrier: 'daypack',
  },
  {
    id: 'layer-hardshell-jacket',
    name: '3-Layer Gore-Tex Pro Hardshell Jacket',
    category: 'Alpine Technical Layering',
    weightGrams: 440,
    essential: true,
    description: 'Windproof, storm-rated waterproof barrier against Himalayan blizzard gusts.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },
  {
    id: 'layer-hardshell-pants',
    name: 'Gore-Tex Paclite Waterproof Overpants',
    category: 'Alpine Technical Layering',
    weightGrams: 320,
    essential: false,
    description: 'Full side-zip storm trousers for sudden rain and snow flurries.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'High-Pass',
    carrier: 'daypack',
  },
  {
    id: 'layer-gloves-liner',
    name: 'Powerstretch Thermal Liner Gloves',
    category: 'Alpine Technical Layering',
    weightGrams: 60,
    essential: true,
    description: 'Touchscreen-compatible dexterous liners for active morning starts.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },
  {
    id: 'layer-summit-mittens',
    name: 'Primaloft Mountaineering Summit Mittens',
    category: 'Alpine Technical Layering',
    weightGrams: 240,
    essential: true,
    description: 'Extreme cold protection with reinforced leather palm for high pass crossings.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter'],
    minElevationTier: 'High-Pass',
    carrier: 'daypack',
  },
  {
    id: 'layer-neck-buff',
    name: 'Merino Wool Neck Gaiter / Khumbu Buff',
    category: 'Alpine Technical Layering',
    weightGrams: 50,
    essential: true,
    description: 'Crucial prevention against cold dust and dry alpine Khumbu cough.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'worn',
  },
  {
    id: 'layer-sun-hat',
    name: 'Wide-Brim UPF 50+ Sun Hat',
    category: 'Alpine Technical Layering',
    weightGrams: 85,
    essential: true,
    description: 'High UV protection for daytime valley marches under intense Himalayan sun.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'worn',
  },

  // ─── Footwear & Mountain Traction ───
  {
    id: 'boot-trekking',
    name: 'Broken-In Vibram Mountain Trekking Boots',
    category: 'Footwear & Mountain Traction',
    weightGrams: 1400,
    essential: true,
    description: 'Waterproof leather/synthetic high-ankle boots with stiff shank support.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'worn',
  },
  {
    id: 'traction-microspikes',
    name: 'Stainless Steel Trail Microspikes (12-Spike)',
    category: 'Footwear & Mountain Traction',
    weightGrams: 380,
    essential: true,
    description: 'Essential traction for hard-packed blue ice on Thorong La, Cho La, and moraines.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'All Seasons'],
    minElevationTier: 'High-Pass',
    carrier: 'daypack',
  },
  {
    id: 'traction-gaiters',
    name: 'Breathable Cordura Alpine Gaiters',
    category: 'Footwear & Mountain Traction',
    weightGrams: 210,
    essential: false,
    description: 'Keeps scree, glacier mud, and deep powder snow out of boots.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon'],
    minElevationTier: 'High-Pass',
    carrier: 'daypack',
  },
  {
    id: 'foot-merino-socks',
    name: 'Heavy Cushion Merino Wool Trekking Socks (x3)',
    category: 'Footwear & Mountain Traction',
    weightGrams: 280,
    essential: true,
    description: 'Moisture regulation and blister prevention across multiple expedition days.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'duffel',
  },
  {
    id: 'foot-camp-booties',
    name: 'Down Insulated Camp Booties / Slippers',
    category: 'Footwear & Mountain Traction',
    weightGrams: 160,
    essential: false,
    description: 'Relaxation footwear inside unheated teahouse dining halls.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'duffel',
  },
  {
    id: 'foot-trekking-poles',
    name: 'Carbon Fiber Flick-Lock Trekking Poles (Pair)',
    category: 'Footwear & Mountain Traction',
    weightGrams: 420,
    essential: true,
    description: 'Reduces knee joint impact by up to 25% during steep 1,000m descents.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },

  // ─── Packs & Load Carrying ───
  {
    id: 'pack-daypack',
    name: '32L Alpine Technical Daypack with Rain Cover',
    category: 'Packs & Load Carrying',
    weightGrams: 980,
    essential: true,
    description: 'Comfortable ventilated harness carrying water, layers, and medical kit.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },
  {
    id: 'pack-porter-duffel',
    name: '90L Heavy-Duty PVC Porter Duffel Bag',
    category: 'Packs & Load Carrying',
    weightGrams: 1250,
    essential: true,
    description: 'Weatherproof expedition duffel carried by Sherpa porter team or yaks.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'duffel',
  },
  {
    id: 'pack-dry-sacks',
    name: 'Ultralight Cordura Dry Compression Sacks (Set)',
    category: 'Packs & Load Carrying',
    weightGrams: 120,
    essential: true,
    description: 'Protects down sleeping bag and thermal layers from damp and torrential precipitation.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'duffel',
  },

  // ─── Sleep System & Warmth ───
  {
    id: 'sleep-bag-down',
    name: '-20°C Rated 850-Fill Down Sleeping Bag',
    category: 'Sleep System & Warmth',
    weightGrams: 1350,
    essential: true,
    description: 'Guarantees restorative thermal recovery in uninsulated rooms above 4,000m.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'All Seasons'],
    minElevationTier: 'High-Pass',
    carrier: 'duffel',
  },
  {
    id: 'sleep-silk-liner',
    name: 'Ripstop Silk Thermal Sleeping Bag Liner',
    category: 'Sleep System & Warmth',
    weightGrams: 130,
    essential: false,
    description: 'Adds +3°C to sleeping bag rating and keeps interior shell hygienic.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'duffel',
  },
  {
    id: 'sleep-earplugs-mask',
    name: 'Contoured Eye Mask & Silicone Earplugs',
    category: 'Sleep System & Warmth',
    weightGrams: 35,
    essential: false,
    description: 'Blocks lodge plywood noise, howling wind, and early dawn departures.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },

  // ─── High-Altitude Medical & First Aid ───
  {
    id: 'med-diamox',
    name: 'Acetazolamide (Diamox 250mg, 20 tabs)',
    category: 'High-Altitude Medical & First Aid',
    weightGrams: 30,
    essential: true,
    description: 'Carbonic anhydrase inhibitor accelerating metabolic acclimatization and periodic breathing relief.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'High-Pass',
    carrier: 'daypack',
  },
  {
    id: 'med-pulse-oximeter',
    name: 'Fingertip LED Pulse Oximeter with SpO2 Gauge',
    category: 'High-Altitude Medical & First Aid',
    weightGrams: 55,
    essential: true,
    description: 'Monitors resting arterial saturation (SpO2) and heart rate at each evening altitude check.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },
  {
    id: 'med-water-purification',
    name: 'SteriPEN UV Purifier + Chlorine Dioxide Tablets',
    category: 'High-Altitude Medical & First Aid',
    weightGrams: 140,
    essential: true,
    description: 'Dual-barrier water sterilization eliminating Cryptosporidium, Giardia, and bacteria.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },
  {
    id: 'med-blister-trauma-kit',
    name: 'Alpine Trauma, Blister & Electrolyte Kit',
    category: 'High-Altitude Medical & First Aid',
    weightGrams: 280,
    essential: true,
    description: 'Compeed hydrocolloid pads, SAM splint, Ibuprofen 400mg, oral rehydration salts, and antiseptic wash.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },

  // ─── Electronics & Navigation ───
  {
    id: 'elec-garmin-inreach',
    name: 'Garmin inReach Mini 2 Satellite SOS Communicator',
    category: 'Electronics & Navigation',
    weightGrams: 100,
    essential: true,
    description: '100% global Iridium satellite tracking, 2-way dispatch text, and GEOS SOS distress beacon.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },
  {
    id: 'elec-power-bank',
    name: '20,000mAh Cold-Insulated USB-C Power Bank',
    category: 'Electronics & Navigation',
    weightGrams: 375,
    essential: true,
    description: 'Maintains battery charge in sub-zero lodge conditions where wall charging costs $5-10/hour.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },
  {
    id: 'elec-headlamp',
    name: '450-Lumen Rechargeable Headlamp + AAA Spare Batteries',
    category: 'Electronics & Navigation',
    weightGrams: 120,
    essential: true,
    description: 'Vital illumination for 3:00 AM alpine starts over glaciated passes and dark moraines.',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'Sub-Alpine',
    carrier: 'daypack',
  },
  {
    id: 'elec-sun-glasses',
    name: 'Cat 4 Glacial Sunglasses with Side Shields',
    category: 'Electronics & Navigation',
    weightGrams: 60,
    essential: true,
    description: '100% UV400 and high visible light barrier preventing debilitating photokeratitis (snow blindness).',
    applicableSeasons: ['Spring', 'Autumn', 'Winter', 'Monsoon', 'All Seasons'],
    minElevationTier: 'High-Pass',
    carrier: 'daypack',
  },
];

export function getAllGearItems(): GearItem[] {
  return [...HIMALAYAN_GEAR_REGISTRY];
}

/**
 * Filter gear items by season, elevation tier, and porter status.
 */
export function getGearCatalog(filters?: {
  season?: Season;
  elevationTier?: ElevationTier;
  porterStatus?: PorterStatus;
}): GearItem[] {
  let items = [...HIMALAYAN_GEAR_REGISTRY];

  if (!filters) return items;

  if (filters.season && filters.season !== 'All Seasons') {
    items = items.filter(
      (item) =>
        item.applicableSeasons.includes('All Seasons') ||
        item.applicableSeasons.includes(filters.season!)
    );
  }

  if (filters.elevationTier) {
    const tierRanking: Record<ElevationTier, number> = {
      'Sub-Alpine': 1,
      'High-Pass': 2,
      'Extreme Summit': 3,
    };
    const maxRank = tierRanking[filters.elevationTier];
    items = items.filter((item) => tierRanking[item.minElevationTier] <= maxRank);
  }

  if (filters.porterStatus === 'Self-Supported') {
    // Self-supported trekkers carry their own gear; duffels meant for porter logistics are excluded
    items = items.filter((item) => item.id !== 'pack-porter-duffel');
  }

  return items;
}

/**
 * Calculates pack weight audit against International Porter Protection Group (IPPG)
 * and wilderness medical load-bearing guidelines.
 */
export function calculateTotalPackWeight(
  selectedItemIds: string[],
  porterStatus: PorterStatus = 'Porter-Supported',
  customItems?: GearItem[]
): PackWeightAudit {
  const allItems = customItems || HIMALAYAN_GEAR_REGISTRY;
  const itemMap = new Map(allItems.map((item) => [item.id, item]));

  const categoryBreakdown: Record<GearCategory, { count: number; weightGrams: number }> = {
    'Alpine Technical Layering': { count: 0, weightGrams: 0 },
    'Footwear & Mountain Traction': { count: 0, weightGrams: 0 },
    'Packs & Load Carrying': { count: 0, weightGrams: 0 },
    'Sleep System & Warmth': { count: 0, weightGrams: 0 },
    'High-Altitude Medical & First Aid': { count: 0, weightGrams: 0 },
    'Electronics & Navigation': { count: 0, weightGrams: 0 },
  };

  let totalWeightGrams = 0;
  let daypackWeightGrams = 0;
  let duffelWeightGrams = 0;

  for (const id of selectedItemIds) {
    const item = itemMap.get(id);
    if (!item) continue;

    totalWeightGrams += item.weightGrams;

    if (categoryBreakdown[item.category]) {
      categoryBreakdown[item.category].count++;
      categoryBreakdown[item.category].weightGrams += item.weightGrams;
    }

    if (porterStatus === 'Porter-Supported') {
      if (item.carrier === 'daypack') {
        daypackWeightGrams += item.weightGrams;
      } else if (item.carrier === 'duffel') {
        duffelWeightGrams += item.weightGrams;
      } else if (item.carrier === 'either') {
        daypackWeightGrams += item.weightGrams;
      }
      // 'worn' items are on the trekker's body, not adding to pack strain
    } else {
      // Self-Supported: all non-worn items are in trekker's full pack
      if (item.carrier !== 'worn') {
        daypackWeightGrams += item.weightGrams;
      }
    }
  }

  // Base allowance for 2L drinking water (2000g) and trail snacks (400g) in daypack when items selected
  const consumableAllowanceGrams = selectedItemIds.length > 0 ? 2400 : 0;
  const effectiveDaypackGrams = daypackWeightGrams + consumableAllowanceGrams;
  const effectiveTotalGrams = totalWeightGrams + consumableAllowanceGrams;

  const totalWeightKg = Math.round((effectiveTotalGrams / 1000) * 10) / 10;
  const daypackWeightKg = Math.round((effectiveDaypackGrams / 1000) * 10) / 10;
  const duffelWeightKg = Math.round((duffelWeightGrams / 1000) * 10) / 10;

  let status: 'OPTIMAL' | 'HEAVY' | 'OVERLOADED' = 'OPTIMAL';
  let statusLabel = 'Optimal Alpine Weight';
  let porterLimitKg = porterStatus === 'Porter-Supported' ? 6.0 : 15.0;
  let ippgAdvisory = 'Your load distribution conforms strictly to Himalayan safety recommendations.';

  if (porterStatus === 'Porter-Supported') {
    if (daypackWeightKg > 8.0) {
      status = 'OVERLOADED';
      statusLabel = 'Daypack Overloaded (>8.0 kg)';
      ippgAdvisory =
        'Your daypack exceeds safe continuous alpine carry weight. Shift non-essential layers and heavier electronics into your porter duffel.';
    } else if (daypackWeightKg > 6.0) {
      status = 'HEAVY';
      statusLabel = 'Daypack Heavy (6.0 - 8.0 kg)';
      ippgAdvisory =
        'Slightly heavy daypack. Ensure you only carry emergency layers, water, rain shell, and medical items on trail.';
    } else {
      status = 'OPTIMAL';
      statusLabel = 'Optimal Daypack (≤6.0 kg)';
      ippgAdvisory =
        'Ideal daypack load for sustained high-altitude aerobic output. Porters carry bulk baggage according to IPPG 25kg limits.';
    }
  } else {
    // Self-Supported: Target is <= 15.0 kg according to WMS/IPPG requirements
    if (daypackWeightKg > 18.0) {
      status = 'OVERLOADED';
      statusLabel = 'Pack Dangerously Heavy (>18.0 kg)';
      ippgAdvisory =
        'Extreme pack weight above 4,000m increases fatigue, accelerates AMS vulnerability, and escalates slip hazards on loose moraines.';
    } else if (daypackWeightKg > 15.0) {
      status = 'HEAVY';
      statusLabel = 'Heavy Backpack (15.0 - 18.0 kg)';
      ippgAdvisory =
        'Heavy load for unassisted trekking. Review discretionary items or consider hiring an ethical Sherpa porter.';
    } else {
      status = 'OPTIMAL';
      statusLabel = 'Target Weight (≤15.0 kg)';
      ippgAdvisory =
        'Outstanding self-supported packing discipline! Well within recommended alpine load parameters.';
    }
  }

  return {
    totalWeightGrams: effectiveTotalGrams,
    totalWeightKg,
    daypackWeightKg,
    duffelWeightKg,
    status,
    statusLabel,
    porterLimitKg,
    ippgAdvisory,
    categoryBreakdown,
  };
}
