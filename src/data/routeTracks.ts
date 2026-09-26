// Standalone GPS Route Tracks dataset (SSR-safe)
export const ROUTE_TRACKS: Record<string, { name: string; color: string; coords: [number, number][] }> = {
  'ebc-trek': {
    name: 'Everest Base Camp Route',
    color: '#eab308', // Amber
    coords: [
      [27.6869, 86.7314], // Lukla
      [27.7380, 86.7212], // Phakding
      [27.8069, 86.7142], // Namche Bazaar
      [27.8358, 86.7645], // Tengboche
      [27.8920, 86.8310], // Dingboche
      [27.9480, 86.8160], // Lobuche
      [27.9790, 86.8280], // Gorak Shep
      [28.0026, 86.8528], // Everest Base Camp
    ]
  },
  'annapurna-circuit': {
    name: 'Annapurna Circuit Route',
    color: '#06b6d4', // Cyan
    coords: [
      [28.2300, 84.3700], // Besisahar
      [28.5500, 84.2300], // Chame
      [28.6000, 84.1100], // Pisang
      [28.6500, 84.0200], // Manang
      [28.6917, 83.8617], // Tilicho Lake
      [28.7947, 83.9388], // Thorong La Pass
      [28.8167, 83.8667], // Muktinath
      [28.7800, 83.7300], // Jomsom
    ]
  },
  'langtang-valley': {
    name: 'Langtang Valley Route',
    color: '#10b981', // Emerald
    coords: [
      [28.1630, 85.3270], // Syabrubesi
      [28.1900, 85.4200], // Lama Hotel
      [28.2140, 85.5000], // Langtang Village
      [28.2100, 85.5650], // Kyanjin Gompa
      [28.2250, 85.5780], // Kyanjin Ri (4773m)
    ]
  },
  'manaslu-circuit': {
    name: 'Manaslu Circuit Route',
    color: '#a855f7', // Purple
    coords: [
      [28.1300, 84.8200], // Soti Khola
      [28.2600, 84.9000], // Jagat
      [28.5100, 84.6600], // Samagaon
      [28.6400, 84.6100], // Larkya La Pass (5106m)
      [28.5700, 84.3900], // Dharapani
    ]
  },
  'upper-mustang': {
    name: 'Upper Mustang Route',
    color: '#f97316', // Orange
    coords: [
      [28.7800, 83.7300], // Jomsom
      [28.9900, 83.8400], // Kagbeni
      [29.1300, 83.9600], // Ghami
      [29.1800, 83.9700], // Tsarang
      [29.1833, 83.9667], // Lo Manthang
    ]
  },
  'rolwaling-valley': {
    name: 'Rolwaling Valley & Tashi Lapcha Route',
    color: '#ec4899', // Rose/Pink
    coords: [
      [27.7600, 86.1300], // Shigati
      [27.8100, 86.2000], // Simigaon
      [27.8500, 86.2800], // Dongang
      [27.8700, 86.3500], // Bedding
      [27.8850, 86.4200], // Na Village
      [27.8900, 86.4800], // Tsho Rolpa Lake (4580m)
      [27.9000, 86.5500], // Tashi Lapcha Pass (5755m)
      [27.8300, 86.6500], // Thame
      [27.6869, 86.7314], // Lukla
    ]
  }
};
