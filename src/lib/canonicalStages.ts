import type { ItineraryStageInput } from '@/types/acclimatization';

export interface CanonicalExpeditionTrail {
  slug: string;
  name: string;
  region: string;
  maxElevation: number;
  durationDays: number;
  stages: ItineraryStageInput[];
}

export const CANONICAL_EXPEDITION_TRAILS: CanonicalExpeditionTrail[] = [
  {
    slug: 'everest-base-camp',
    name: 'Everest Base Camp Trek',
    region: 'Everest',
    maxElevation: 5364,
    durationDays: 12,
    stages: [
      { day: 1, title: 'Lukla Airstrip to Phakding', elevation: 2610, distanceKm: 8 },
      { day: 2, title: 'Phakding to Namche Bazaar', elevation: 3440, distanceKm: 11 },
      { day: 3, title: 'Namche Bazaar Acclimatization Rest Day', elevation: 3440, distanceKm: 5, dayPeakElevation: 3880 },
      { day: 4, title: 'Namche Bazaar to Tengboche Monastery', elevation: 3867, distanceKm: 10 },
      { day: 5, title: 'Tengboche to Dingboche Alpine Valley', elevation: 4410, distanceKm: 11 },
      { day: 6, title: 'Dingboche Acclimatization & Nangkartshang Ridge', elevation: 4410, distanceKm: 4, dayPeakElevation: 5083 },
      { day: 7, title: 'Dingboche to Lobuche High Moraine', elevation: 4940, distanceKm: 12 },
      { day: 8, title: 'Lobuche to Gorak Shep & Everest Base Camp', elevation: 5164, distanceKm: 14, dayPeakElevation: 5364 },
      { day: 9, title: 'Kala Patthar Sunrise & Descend to Pheriche', elevation: 4240, distanceKm: 15, dayPeakElevation: 5550 },
      { day: 10, title: 'Pheriche to Namche Bazaar', elevation: 3440, distanceKm: 18 },
      { day: 11, title: 'Namche Bazaar to Lukla', elevation: 2860, distanceKm: 19 },
      { day: 12, title: 'Lukla Mountain Flight to Kathmandu', elevation: 1400, distanceKm: 0 },
    ],
  },
  {
    slug: 'annapurna-circuit',
    name: 'Annapurna Circuit & Thorong La',
    region: 'Annapurna',
    maxElevation: 5416,
    durationDays: 12,
    stages: [
      { day: 1, title: 'Besisahar to Dharapani', elevation: 1860, distanceKm: 16 },
      { day: 2, title: 'Dharapani to Chame', elevation: 2670, distanceKm: 15 },
      { day: 3, title: 'Chame to Upper Pisang', elevation: 3200, distanceKm: 14 },
      { day: 4, title: 'Upper Pisang to Manang Valley', elevation: 3519, distanceKm: 16 },
      { day: 5, title: 'Manang Acclimatization & Praken Gompa', elevation: 3519, distanceKm: 6, dayPeakElevation: 3950 },
      { day: 6, title: 'Manang to Yak Kharka', elevation: 4050, distanceKm: 10 },
      { day: 7, title: 'Yak Kharka to Thorong Phedi High Camp', elevation: 4525, distanceKm: 8 },
      { day: 8, title: 'Thorong Phedi over Thorong La Pass (5,416m) to Muktinath', elevation: 3760, distanceKm: 16, dayPeakElevation: 5416 },
      { day: 9, title: 'Muktinath to Marpha Apple Orchards', elevation: 2670, distanceKm: 18 },
      { day: 10, title: 'Marpha to Tatopani Hot Springs', elevation: 1190, distanceKm: 21 },
      { day: 11, title: 'Tatopani to Ghorepani Ridge', elevation: 2860, distanceKm: 14 },
      { day: 12, title: 'Poon Hill Sunrise to Nayapul & Pokhara', elevation: 820, distanceKm: 12, dayPeakElevation: 3210 },
    ],
  },
  {
    slug: 'manaslu-circuit',
    name: 'Manaslu Circuit Trek',
    region: 'Manaslu',
    maxElevation: 5106,
    durationDays: 13,
    stages: [
      { day: 1, title: 'Soti Khola to Machha Khola', elevation: 869, distanceKm: 14 },
      { day: 2, title: 'Machha Khola to Jagat Checkpost', elevation: 1340, distanceKm: 15 },
      { day: 3, title: 'Jagat to Deng', elevation: 1804, distanceKm: 17 },
      { day: 4, title: 'Deng to Namrung Tibetan Gateway', elevation: 2660, distanceKm: 19 },
      { day: 5, title: 'Namrung to Lho Monastery', elevation: 3180, distanceKm: 11 },
      { day: 6, title: 'Lho to Samagaon Village', elevation: 3530, distanceKm: 8 },
      { day: 7, title: 'Samagaon Acclimatization & Manaslu Base Camp Hike', elevation: 3530, distanceKm: 9, dayPeakElevation: 4400 },
      { day: 8, title: 'Samagaon to Samdo Border Outpost', elevation: 3860, distanceKm: 9 },
      { day: 9, title: 'Samdo Acclimatization & Tibetan Border Walk', elevation: 3860, distanceKm: 6, dayPeakElevation: 4200 },
      { day: 10, title: 'Samdo to Dharmasala / Larkya Phedi', elevation: 4460, distanceKm: 12 },
      { day: 11, title: 'Dharmasala over Larkya La Pass (5,106m) to Bimthang', elevation: 3720, distanceKm: 16, dayPeakElevation: 5106 },
      { day: 12, title: 'Bimthang to Tilije Village', elevation: 2300, distanceKm: 14 },
      { day: 13, title: 'Tilije to Dharapani & Drive to Besisahar', elevation: 1860, distanceKm: 8 },
    ],
  },
  {
    slug: 'langtang-valley',
    name: 'Langtang Valley & Kyanjin Ri',
    region: 'Langtang',
    maxElevation: 4773,
    durationDays: 7,
    stages: [
      { day: 1, title: 'Drive Kathmandu to Syabrubesi', elevation: 1460, distanceKm: 0 },
      { day: 2, title: 'Syabrubesi to Lama Hotel', elevation: 2470, distanceKm: 11 },
      { day: 3, title: 'Lama Hotel to Langtang Village', elevation: 3430, distanceKm: 10 },
      { day: 4, title: 'Langtang Village to Kyanjin Gompa', elevation: 3870, distanceKm: 7 },
      { day: 5, title: 'Kyanjin Gompa to Kyanjin Ri Summit Ascent (4,773m)', elevation: 3870, distanceKm: 6, dayPeakElevation: 4773 },
      { day: 6, title: 'Kyanjin Gompa to Lama Hotel', elevation: 2470, distanceKm: 17 },
      { day: 7, title: 'Lama Hotel to Syabrubesi & Kathmandu Return', elevation: 1400, distanceKm: 11 },
    ],
  },
  {
    slug: 'gokyo-ri-cho-la',
    name: 'Gokyo Ri & Cho La Pass Expedition',
    region: 'Everest',
    maxElevation: 5357,
    durationDays: 13,
    stages: [
      { day: 1, title: 'Lukla Airstrip to Phakding', elevation: 2610, distanceKm: 8 },
      { day: 2, title: 'Phakding to Namche Bazaar', elevation: 3440, distanceKm: 11 },
      { day: 3, title: 'Namche Bazaar Acclimatization Rest Day', elevation: 3440, distanceKm: 5, dayPeakElevation: 3880 },
      { day: 4, title: 'Namche Bazaar to Dole Fir Forest', elevation: 4110, distanceKm: 12 },
      { day: 5, title: 'Dole to Machhermo Valley', elevation: 4470, distanceKm: 8 },
      { day: 6, title: 'Machhermo Acclimatization & Altitude Lecture', elevation: 4470, distanceKm: 4, dayPeakElevation: 4800 },
      { day: 7, title: 'Machhermo to Gokyo Sacred Third Lake', elevation: 4790, distanceKm: 7 },
      { day: 8, title: 'Gokyo Ri Apex (5,357m) Sunrise & Thangnak', elevation: 4700, distanceKm: 9, dayPeakElevation: 5357 },
      { day: 9, title: 'Thangnak over Glaciated Cho La Pass (5,420m) to Dzongla', elevation: 4830, distanceKm: 10, dayPeakElevation: 5420 },
      { day: 10, title: 'Dzongla to Lobuche Moraine', elevation: 4940, distanceKm: 6 },
      { day: 11, title: 'Lobuche to Gorak Shep & EBC Staging', elevation: 5164, distanceKm: 12, dayPeakElevation: 5364 },
      { day: 12, title: 'Gorak Shep Descend to Namche Bazaar', elevation: 3440, distanceKm: 22 },
      { day: 13, title: 'Namche Bazaar to Lukla Trailhead', elevation: 2860, distanceKm: 19 },
    ],
  },
  {
    slug: 'three-passes-trek',
    name: 'Three Passes Trek (Kongma La, Cho La, Renjo La)',
    region: 'Everest',
    maxElevation: 5535,
    durationDays: 16,
    stages: [
      { day: 1, title: 'Lukla to Phakding', elevation: 2610, distanceKm: 8 },
      { day: 2, title: 'Phakding to Namche Bazaar', elevation: 3440, distanceKm: 11 },
      { day: 3, title: 'Namche Acclimatization Rest', elevation: 3440, distanceKm: 5, dayPeakElevation: 3880 },
      { day: 4, title: 'Namche to Tengboche Monastery', elevation: 3867, distanceKm: 10 },
      { day: 5, title: 'Tengboche to Dingboche Valley', elevation: 4410, distanceKm: 11 },
      { day: 6, title: 'Dingboche to Chhukung Village', elevation: 4730, distanceKm: 7 },
      { day: 7, title: 'Chhukung over Kongma La Pass (5,535m) to Lobuche', elevation: 4940, distanceKm: 11, dayPeakElevation: 5535 },
      { day: 8, title: 'Lobuche to Gorak Shep & Everest Base Camp', elevation: 5164, distanceKm: 12, dayPeakElevation: 5364 },
      { day: 9, title: 'Kala Patthar Ascent & Dzongla High Camp', elevation: 4830, distanceKm: 11, dayPeakElevation: 5550 },
      { day: 10, title: 'Dzongla over Cho La Pass (5,420m) to Thangnak', elevation: 4700, distanceKm: 10, dayPeakElevation: 5420 },
      { day: 11, title: 'Thangnak to Gokyo Sacred Lakes', elevation: 4790, distanceKm: 5 },
      { day: 12, title: 'Gokyo Ri Summit (5,357m) Acclimatization Rest', elevation: 4790, distanceKm: 4, dayPeakElevation: 5357 },
      { day: 13, title: 'Gokyo over Renjo La Pass (5,360m) to Lungden', elevation: 4380, distanceKm: 12, dayPeakElevation: 5360 },
      { day: 14, title: 'Lungden to Thame Ancient Monastery', elevation: 3820, distanceKm: 11 },
      { day: 15, title: 'Thame to Namche Bazaar', elevation: 3440, distanceKm: 10 },
      { day: 16, title: 'Namche Bazaar to Lukla Airstrip', elevation: 2860, distanceKm: 19 },
    ],
  },
];

export function getCanonicalTrailBySlug(slug: string): CanonicalExpeditionTrail | undefined {
  const norm = slug.toLowerCase().replace(/-trek$/, '');
  return CANONICAL_EXPEDITION_TRAILS.find(
    (t) =>
      t.slug === slug ||
      t.slug.toLowerCase().includes(norm) ||
      norm.includes(t.slug.toLowerCase())
  );
}
