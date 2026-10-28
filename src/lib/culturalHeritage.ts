/**
 * Himalayan Sherpa & Tibetan Cultural Heritage Registry
 * Native phonetics, syllable cadences, spiritual significance, and Buddhist trail etiquette.
 */

export interface CulturalItem {
  id: string;
  name: string;
  nativeScript: string;
  phonetics: string;
  syllables: string[];
  englishMeaning: string;
  category: 'Sacred Peak' | 'High Pass' | 'Monastery' | 'Sacred Lake' | 'Holy Shrine' | string;
  region: 'Khumbu' | 'Annapurna' | 'Langtang' | 'Mustang' | 'Manaslu' | string;
  elevationMeters: number;
  lore: string;
  audioGuideNote: string;
  associatedTrailSlug?: string;
  tibetanFrequencyHz?: number; // Base harmonic frequency (e.g. 432 Hz, 528 Hz)
  aliases?: string[];
}

export interface BuddhistEtiquetteRule {
  id: string;
  title: string;
  nepaliTibetanTerm: string;
  summary: string;
  detailedPractice: string;
  iconType: 'kora' | 'gear' | 'mountain' | 'monastery' | 'flags';
  severity: 'Strict Taboo' | 'Sacred Custom' | 'Spiritual Etiquette';
}

/**
 * Authentic Himalayan Cultural & Phonetic Registry
 */
export const HIMALAYAN_CULTURAL_REGISTRY: CulturalItem[] = [
  {
    id: 'chomolungma',
    name: 'Chomolungma',
    nativeScript: 'ཇོ་མོ་གླང་མ',
    phonetics: 'Cho-mo-lung-ma',
    syllables: ['Cho', 'mo', 'lung', 'ma'],
    englishMeaning: 'Mother Goddess of the World',
    category: 'Sacred Peak',
    region: 'Khumbu',
    elevationMeters: 8848.86,
    lore: 'Revered across the Himalayas as the sacred home of Miyolangsangma, one of the Five Sisters of Long Life (Tseringma), who bestows nourishment and agricultural bounty. Sherpa mountaineers hold solemn puja ceremonies asking the mountain goddess for forgiveness and safe passage before stepping foot on her flanks.',
    audioGuideNote: 'Pronounced with a soft, resonant "Cho" followed by rhythmic emphasis on "lung" and melodic ending on "ma".',
    associatedTrailSlug: 'everest-base-camp',
    tibetanFrequencyHz: 432,
    aliases: ['Everest', 'Mount Everest', 'Mt Everest', 'Mt. Everest', 'Sagarmatha', 'Qomolangma'],
  },
  {
    id: 'lhotse',
    name: 'Lhotse',
    nativeScript: 'ལྷོ་རྩེ',
    phonetics: 'Lho-tse',
    syllables: ['Lho', 'tse'],
    englishMeaning: 'South Peak',
    category: 'Sacred Peak',
    region: 'Khumbu',
    elevationMeters: 8516,
    lore: 'Derived from Tibetan "Lho" (meaning South) and "Tse" (meaning Peak), signifying its geographic position towering immediately south of Chomolungma across the 7,986m South Col. Lhotse forms the monumental southern pillar of the Khumbu amphitheater.',
    audioGuideNote: 'Crisp aspirate "Lh" with a light dental "tse" release.',
    associatedTrailSlug: 'everest-base-camp',
    tibetanFrequencyHz: 480,
    aliases: ['Lhotse Shar', 'Lhotse Face', 'South Col'],
  },
  {
    id: 'ama-dablam',
    name: 'Ama Dablam',
    nativeScript: 'ཨ་མ་ཟླ་བླམ',
    phonetics: 'Ah-mah Dah-blahm',
    syllables: ['Ah', 'mah', 'Dah', 'blahm'],
    englishMeaning: "Mother's Necklace",
    category: 'Sacred Peak',
    region: 'Khumbu',
    elevationMeters: 6812,
    lore: '"Ama" means Mother, while "Dablam" refers to the traditional double-sided gold and turquoise jewel-box pendant worn by Sherpa mothers. The hanging hanging serac glacier suspended on the peak\'s vertical southwestern wall mirrors this sacred pendant, while its ridges resemble a mother embracing her children.',
    audioGuideNote: 'Soft open vowels: "Ah-mah" with smooth rolling transition into "Dah-blahm".',
    associatedTrailSlug: 'everest-base-camp',
    tibetanFrequencyHz: 528,
    aliases: ['Amadablam', 'Ama Dablam Base Camp', 'Dablam Peak'],
  },
  {
    id: 'tengboche',
    name: 'Tengboche',
    nativeScript: 'སྟེང་པོ་ཆེ',
    phonetics: 'Teng-bo-che',
    syllables: ['Teng', 'bo', 'che'],
    englishMeaning: 'Dawa Choling Gompa (High Sanctuary)',
    category: 'Monastery',
    region: 'Khumbu',
    elevationMeters: 3867,
    lore: 'Founded in 1916 by Lama Gulu, Tengboche is the leading spiritual sanctuary of the Khumbu Sherpa people. Situated on a ridge with panoramic vistas of Everest and Ama Dablam, it hosts the sacred Mani Rimdu festival each autumn, where red-robed monks perform sacred cham masked dances depicting the triumph of Dharma.',
    audioGuideNote: 'Resonant "Teng", rounded "bo", and crisp "che".',
    associatedTrailSlug: 'everest-base-camp',
    tibetanFrequencyHz: 396,
    aliases: ['Tengboche Monastery', 'Tyangboche', 'Thyangboche', 'Dawa Choling Gompa'],
  },
  {
    id: 'thorong-la',
    name: 'Thorong La',
    nativeScript: 'ཐོ་རོང་ལ',
    phonetics: 'Tho-rong Lah',
    syllables: ['Tho', 'rong', 'Lah'],
    englishMeaning: 'Thorong High Mountain Pass ("La" = Pass)',
    category: 'High Pass',
    region: 'Annapurna',
    elevationMeters: 5416,
    lore: 'The apex crossing of the Annapurna Circuit linking Manang with the high desert of Mustang. In Tibetan geography, "La" designates a sacred mountain pass. Trekkers and Tibetan traders drape colorful prayer flags across the crest and traditionally shout "Ki Ki So So Lha Gyalo!" ("Victory to the Gods!") upon safe arrival.',
    audioGuideNote: 'Firm "Tho", trilled "rong", and open, resonant "Lah".',
    associatedTrailSlug: 'annapurna-circuit',
    tibetanFrequencyHz: 432,
    aliases: ['Thorong La Pass', 'Thorung La', 'Thorong Phedi', 'Thorung Pass'],
  },
  {
    id: 'muktinath',
    name: 'Muktinath',
    nativeScript: 'མུ་ཏིག་གནས / मुक्तिनाथ',
    phonetics: 'Muk-ti-nath',
    syllables: ['Muk', 'ti', 'nath'],
    englishMeaning: 'Place of Liberation / Chumig Gyatsa (Hundred Sacred Waters)',
    category: 'Holy Shrine',
    region: 'Mustang',
    elevationMeters: 3760,
    lore: 'One of the most sacred pilgrimage shrines in high Asia, revered jointly by Hindus as Muktidham and Tibetan Buddhists as Chumig Gyatsa. The sanctuary features 108 icy waterspouts carved from stone and an eternal natural methane gas flame burning perpetually behind the sacred waters of Jwala Mai.',
    audioGuideNote: 'Short "Muk", sharp dental "ti", and softly exhaled "nath".',
    associatedTrailSlug: 'annapurna-circuit',
    tibetanFrequencyHz: 639,
    aliases: ['Muktinath Temple', 'Chumig Gyatsa', 'Muktidham', 'Muktinath Shrine'],
  },
  {
    id: 'kyanjin-gompa',
    name: 'Kyanjin Gompa',
    nativeScript: 'མཁྱེན་སྦྱིན་དགོན་པ',
    phonetics: 'Kyan-jin Gom-pah',
    syllables: ['Kyan', 'jin', 'Gom', 'pah'],
    englishMeaning: 'Sacred Langtang Monastery of Blessings',
    category: 'Monastery',
    region: 'Langtang',
    elevationMeters: 3870,
    lore: 'The crown jewel of the Langtang Valley, nestled in a glacier-carved valley directly below Langtang Lirung (7,227m). Built centuries ago by Nyingma Buddhist lamas, it features ancient prayer wheels, historic prayer halls, and the legendary high-altitude yak cheese dairy established in 1955.',
    audioGuideNote: 'Fluid "Kyan", steady "jin", grounded "Gom", and gentle "pah".',
    associatedTrailSlug: 'langtang-valley',
    tibetanFrequencyHz: 432,
    aliases: ['Kyanjin', 'Kyanjin Ri', 'Kyanging Gompa', 'Langtang Gompa'],
  },
  {
    id: 'machapuchare',
    name: 'Machapuchare',
    nativeScript: 'माछापुच्छ्रे',
    phonetics: 'Mah-chah-poo-chray',
    syllables: ['Mah', 'chah', 'poo', 'chray'],
    englishMeaning: "Fish's Tail (Sacred Abode of Shiva)",
    category: 'Sacred Peak',
    region: 'Annapurna',
    elevationMeters: 6993,
    lore: 'With its distinctive double summit resembling a fish tail, Machapuchare is venerated as the pure, inviolate home of the Hindu deity Lord Shiva. In 1957, following an agreement between British expedition leader Jimmy Roberts and King Mahendra, the mountain was declared permanently sacred and remains strictly closed to all summit climbers.',
    audioGuideNote: 'Rhythmic four-syllable cadence with trilled Nepali "-chray".',
    associatedTrailSlug: 'annapurna-sanctuary',
    tibetanFrequencyHz: 528,
    aliases: ['Machhapuchhre', 'Machhapuchre', 'Fishtail', 'Fish Tail Peak'],
  },
];

/**
 * Authentic Buddhist Trail Etiquette & Mountain Philosophy Guide
 */
export const BUDDHIST_TRAIL_ETIQUETTE: BuddhistEtiquetteRule[] = [
  {
    id: 'clockwise-kora',
    title: 'Clockwise Kora Circumambulation',
    nepaliTibetanTerm: 'Kora (སྐོར་ར)',
    summary: 'Always pass chortens, stupas, and mani stone walls on your left side (clockwise motion).',
    detailedPractice: 'In Tibetan Buddhist tradition, walking clockwise mirrors the celestial rotation of the sun and stars across the cosmos. When approaching a stupa, chorten, or long mani stone wall in the middle of a trail, keep it to your right hand side as you walk past. Walking counter-clockwise disrupts spiritual balance.',
    iconType: 'kora',
    severity: 'Sacred Custom',
  },
  {
    id: 'dining-gear-respect',
    title: 'Dining Hall Gear & Footwear Taboo',
    nepaliTibetanTerm: 'Lhak-kye (Respect of Soles)',
    summary: 'Never step over someone’s mountaineering gear, clothes, cookware, or outstretched legs.',
    detailedPractice: 'In Sherpa and Himalayan hospitality culture, the soles of shoes and feet are considered the lowest and most spiritually impure part of the physical body. Stepping over a fellow trekker’s backpack, jacket, cookware, or legs in a warm teahouse dining room is considered profoundly disrespectful. Step around instead.',
    iconType: 'gear',
    severity: 'Strict Taboo',
  },
  {
    id: 'sacred-mountain-sanctity',
    title: 'Sacred Peaks as Divine Abodes',
    nepaliTibetanTerm: 'Yul-Lha (Protective Mountain Deities)',
    summary: 'Mountains are living shrines, not conquests. Respect peaks that remain unclimbed.',
    detailedPractice: 'Himalayan peaks are not viewed merely as geographic challenges, but as sacred sanctuaries inhabited by protective deities (Yul-Lha). Certain peaks such as Machapuchare and Khumbila remain completely off-limits to mountaineering out of religious reverence. Never throw litter, light open bonfires on high passes, or shout obscenities toward sacred summits.',
    iconType: 'mountain',
    severity: 'Sacred Custom',
  },
  {
    id: 'monastery-puja-etiquette',
    title: 'Monastery Puja & Photography Protocols',
    nepaliTibetanTerm: 'Gompa Chod (Sanctuary Courtesy)',
    summary: 'Remove hats and boots, never point shoe soles at the altar, and request photo permissions.',
    detailedPractice: 'Before entering the inner sanctuary of a gompa (monastery), remove headwear and shoes. When sitting on rugs, sit cross-legged or tuck your feet backward beneath you—never stretch your legs forward so your soles point toward the Buddha statue or the presiding lama. Always ask monk permission before recording audio or taking photos during sacred puja ceremonies.',
    iconType: 'monastery',
    severity: 'Spiritual Etiquette',
  },
  {
    id: 'prayer-flags-and-mani-stones',
    title: 'Prayer Flags & Mani Stones Dignity',
    nepaliTibetanTerm: 'Lung Ta & Mani Doh',
    summary: 'Never step on carved mani stones or allow prayer flags to drag along the dirt.',
    detailedPractice: 'Mani stones are hand-chiseled with the six-syllable compassion mantra "Om Mani Padme Hum". Never sit on them, displace them, or pick them up as souvenirs. When stringing vibrant prayer flags (Lung Ta: Wind Horse) at high passes, ensure the lower cords are tied securely so the sacred cloth never touches the mud or mule dung on the ground.',
    iconType: 'flags',
    severity: 'Strict Taboo',
  },
];

/**
 * Cultural Lore lookup helpers
 */
export function getAllCulturalLore(): CulturalItem[] {
  return HIMALAYAN_CULTURAL_REGISTRY;
}

export function getCulturalLoreById(id: string): CulturalItem | undefined {
  return HIMALAYAN_CULTURAL_REGISTRY.find(
    (item) => item.id.toLowerCase() === id.toLowerCase()
  );
}

export function getCulturalLoreByLandmarkName(name: string): CulturalItem | undefined {
  if (!name) return undefined;
  const rawLower = name.toLowerCase().trim();
  const normalized = rawLower.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  return HIMALAYAN_CULTURAL_REGISTRY.find((item) => {
    const itemName = item.name.toLowerCase();
    const itemEn = item.englishMeaning.toLowerCase();

    // 1. Direct or substring match on primary name or English meaning
    if (
      itemName === rawLower ||
      rawLower.includes(itemName) ||
      itemName.includes(rawLower) ||
      itemEn.includes(rawLower)
    ) {
      return true;
    }

    // 2. Normalized alphanumeric token match
    const normItemName = itemName.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    if (normalized.includes(normItemName) || normItemName.includes(normalized)) {
      return true;
    }

    // 3. Match against known aliases
    if (item.aliases && item.aliases.length > 0) {
      return item.aliases.some((alias) => {
        const aLower = alias.toLowerCase();
        const aNorm = aLower.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        return (
          rawLower === aLower ||
          rawLower.includes(aLower) ||
          aLower.includes(rawLower) ||
          normalized.includes(aNorm) ||
          aNorm.includes(normalized)
        );
      });
    }

    return false;
  });
}

export function getEtiquetteGuidelines(): BuddhistEtiquetteRule[] {
  return BUDDHIST_TRAIL_ETIQUETTE;
}
