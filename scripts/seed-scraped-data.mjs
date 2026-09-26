import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function readDump(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const jsonStart = lines.findIndex(l => l.trim().startsWith('[') || l.trim().startsWith('{'));
  const jsonEnd = lines.length - 1 - [...lines].reverse().findIndex(l => l.trim().endsWith(']') || l.trim().endsWith('}'));
  const jsonStr = lines.slice(jsonStart, jsonEnd + 1).join('\n');
  return JSON.parse(jsonStr);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function analyzeRoute(route) {
  let totalDist = 0;
  let minElev = Infinity;
  let maxElev = -Infinity;
  let elevGain = 0;

  for (let i = 0; i < route.length; i++) {
    const [lon, lat, elev] = route[i];
    if (elev < minElev) minElev = elev;
    if (elev > maxElev) maxElev = elev;
    if (i > 0) {
      const [prevLon, prevLat, prevElev] = route[i - 1];
      totalDist += haversineKm(prevLat, prevLon, lat, lon);
      if (elev > prevElev) elevGain += (elev - prevElev);
    }
  }

  return {
    distanceKm: Math.round(totalDist * 10) / 10,
    minElevation: Math.round(minElev),
    maxElevation: Math.round(maxElev),
    elevationGain: Math.round(elevGain),
  };
}

function generateElevationProfile(route, numSamples = 20) {
  let cumDist = 0;
  const pointsWithDist = route.map((pt, i) => {
    if (i > 0) {
      cumDist += haversineKm(route[i - 1][1], route[i - 1][0], pt[1], pt[0]);
    }
    return {
      distanceKm: Math.round(cumDist * 10) / 10,
      elevation: Math.round(pt[2]),
    };
  });

  const step = Math.max(1, Math.floor(pointsWithDist.length / numSamples));
  const sampled = [];
  for (let i = 0; i < pointsWithDist.length; i += step) {
    sampled.push(pointsWithDist[i]);
  }
  const last = pointsWithDist[pointsWithDist.length - 1];
  if (sampled[sampled.length - 1].distanceKm !== last.distanceKm) {
    sampled.push(last);
  }
  return sampled;
}

// Slugs and metadata for scraped trails
const METADATA = {
  'Everest Base Camp': {
    id: 'ebc-trek',
    slug: 'everest-base-camp',
    region: 'Everest',
    difficulty: 'Strenuous',
    durationDays: 14,
    startPoint: 'Lukla (2,860m)',
    endPoint: 'Everest Base Camp (5,364m)',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    description: 'Walk in the footsteps of legendary mountaineers through Sherpa capital Namche Bazaar to the foot of Mt. Everest.',
    highlights: ['Kala Patthar (5,545m) sunrise view', 'Tengboche Monastery', 'Hillary Suspension Bridge', 'Khumbu Glacier & Icefall'],
    bestMonths: ['Mar-May', 'Sep-Nov'],
    rating: 4.9,
    reviewsCount: 342
  },
  'Three Passes Circuit': {
    id: 'three-passes-trek',
    slug: 'three-passes-circuit',
    region: 'Everest',
    difficulty: 'Extreme',
    durationDays: 20,
    startPoint: 'Lukla (2,860m)',
    endPoint: 'Lukla (2,860m)',
    image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=1200&q=80',
    description: 'The ultimate Khumbu expedition traversing Kongma La, Cho La, and Renjo La with panoramic vistas of four 8,000m summits.',
    highlights: ['Kongma La Pass (5,535m)', 'Cho La Pass (5,420m)', 'Renjo La Pass (5,360m)', 'Turquoise Gokyo Lakes & Ri'],
    bestMonths: ['Mar-May', 'Oct-Nov'],
    rating: 4.9,
    reviewsCount: 195
  },
  'Langtang Valley': {
    id: 'langtang-valley',
    slug: 'langtang-valley',
    region: 'Langtang',
    difficulty: 'Moderate',
    durationDays: 8,
    startPoint: 'Syabrubesi (1,550m)',
    endPoint: 'Kyanjin Gompa (3,870m)',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    description: 'The Valley of Glaciers offers rich Tamang culture, yak cheese factories, and dramatic peaks close to Kathmandu.',
    highlights: ['Kyanjin Gompa', 'Kyanjin Ri (4,773m)', 'Langtang Lirung view', 'Tamang Heritage Experience'],
    bestMonths: ['Feb-May', 'Sep-Dec'],
    rating: 4.8,
    reviewsCount: 178
  },
  'Dunche - Gosaikunda': {
    id: 'dunche-gosaikunda',
    slug: 'dunche-gosaikunda',
    region: 'Langtang',
    difficulty: 'Strenuous',
    durationDays: 6,
    startPoint: 'Dunche (1,960m)',
    endPoint: 'Gosaikunda Lake (4,380m)',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    description: 'Ascend through pine and rhododendron groves to the sacred glacial lakes of Gosaikunda, holy to both Hindus and Buddhists.',
    highlights: ['Holy Gosaikunda Lake (4,380m)', 'Sing Gompa Yak Cheese Dairy', 'Lauribina Pass Vistas', 'Bhairav Kunda Lake'],
    bestMonths: ['Apr-May', 'Aug-Nov'],
    rating: 4.7,
    reviewsCount: 114
  },
  'Syabru - Gosaikunda': {
    id: 'syabru-gosaikunda',
    slug: 'syabru-gosaikunda',
    region: 'Langtang',
    difficulty: 'Strenuous',
    durationDays: 5,
    startPoint: 'Thulo Syabru (2,210m)',
    endPoint: 'Gosaikunda Lake (4,380m)',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    description: 'A scenic ridge ascent connecting the terraced slopes of Thulo Syabru directly with the high alpine tarns of Gosaikunda.',
    highlights: ['Thulo Syabru heritage village', 'Panoramic Ganesh Himal vistas', 'Lauribina Yak ridge', 'High altitude glacial waters'],
    bestMonths: ['Mar-May', 'Oct-Nov'],
    rating: 4.6,
    reviewsCount: 89
  },
  'Tamang Heritage': {
    id: 'tamang-heritage',
    slug: 'tamang-heritage',
    region: 'Langtang',
    difficulty: 'Moderate',
    durationDays: 7,
    startPoint: 'Syabrubesi (1,550m)',
    endPoint: 'Bridhim / Syabrubesi',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    description: 'Immerse in indigenous Tamang shamanic traditions, stay in stone homestays, and soak in natural hot springs near the Tibetan frontier.',
    highlights: ['Tatopani Natural Hot Springs', 'Nagthali Danda viewpoint (3,165m)', 'Gatlang stone house architecture', 'Parvati Kunda sacred tarn'],
    bestMonths: ['Oct-Dec', 'Mar-May'],
    rating: 4.7,
    reviewsCount: 132
  },
  'Ganja La Pass': {
    id: 'ganja-la-pass',
    slug: 'ganja-la-pass',
    region: 'Langtang',
    difficulty: 'Extreme',
    durationDays: 12,
    startPoint: 'Syabrubesi (1,550m)',
    endPoint: 'Melamchi Pul (870m)',
    image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
    description: 'A demanding technical mountaineering crossing over Ganja La Pass (5,122m) linking glaciated Langtang to the green Helambu ridge.',
    highlights: ['Ganja La Pass crossing (5,122m)', 'Keldang wilderness traverse', 'Alpine glacier moraine route', 'Helambu rhododendron forests'],
    bestMonths: ['Apr-May', 'Oct-Nov'],
    rating: 4.8,
    reviewsCount: 67
  },
  'Ama Yangri': {
    id: 'ama-yangri',
    slug: 'ama-yangri',
    region: 'Langtang',
    difficulty: 'Moderate',
    durationDays: 3,
    startPoint: 'Tarkeghyang (2,600m)',
    endPoint: 'Ama Yangri Peak (3,771m)',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    description: 'Ascend to the highest peak in Helambu, consecrated to the protective deity Ama Yangri, with unobstructed views of the Jugal Himal.',
    highlights: ['Ama Yangri Summit Stupa (3,771m)', 'Dakini protective deity shrine', 'Jugal and Langtang massif panoramas', 'Tarkeghyang monastery'],
    bestMonths: ['Feb-May', 'Sep-Dec'],
    rating: 4.9,
    reviewsCount: 92
  },
  'Chisapani - Gosainkunda': {
    id: 'chisapani-gosainkunda',
    slug: 'chisapani-gosainkunda',
    region: 'Langtang',
    difficulty: 'Strenuous',
    durationDays: 9,
    startPoint: 'Sundarijal (1,460m)',
    endPoint: 'Dunche (1,960m)',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    description: 'Traverse from the Kathmandu Valley rim through Shivapuri forest and along the Helambu ridge to high sacred lakes.',
    highlights: ['Shivapuri National Park canopy', 'Chisapani sunrise panoramic ridge', 'Kutumsang village', 'Laurebina Pass (4,610m)'],
    bestMonths: ['Mar-May', 'Oct-Nov'],
    rating: 4.7,
    reviewsCount: 108
  },
  'Helambu Circuit': {
    id: 'helambu-circuit',
    slug: 'helambu-circuit',
    region: 'Langtang',
    difficulty: 'Moderate',
    durationDays: 7,
    startPoint: 'Sundarijal (1,460m)',
    endPoint: 'Melamchi Bazaar (870m)',
    image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    description: 'Gentle village-to-village trekking through Hyolmo Buddhist settlements, ancient painted monasteries, and terraced apple orchards.',
    highlights: ['Hyolmo Buddhist cultural immersion', 'Melamchigaon meditation caves', 'Tarkeghyang gompa', 'Sermathang apple groves'],
    bestMonths: ['Sep-May'],
    rating: 4.6,
    reviewsCount: 145
  },
  'Tilman Pass': {
    id: 'tilman-pass',
    slug: 'tilman-pass',
    region: 'Langtang',
    difficulty: 'Extreme',
    durationDays: 15,
    startPoint: 'Syabrubesi (1,550m)',
    endPoint: 'Chautara (1,410m)',
    image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
    description: 'An expedition-grade pass discovered by mountaineer Bill Tilman connecting Langtang Valley with Panch Pokhari across icy glaciers.',
    highlights: ['Tilman Pass (5,308m) glaciated col', 'Tin Pokhari secluded alpine lakes', 'Panch Pokhari holy pilgrimage basin', 'True wilderness camping'],
    bestMonths: ['May', 'Sep-Oct'],
    rating: 4.9,
    reviewsCount: 43
  }
};

async function main() {
  const dbPath = path.join(process.cwd(), 'data', 'himalayan_trails.db');
  console.log(`Connecting to database at ${dbPath}...`);
  const db = new DatabaseSync(dbPath);

  // 1. Ensure schema supports ranges and route_coordinates
  db.exec(`
    CREATE TABLE IF NOT EXISTS ranges (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      center_lat REAL NOT NULL,
      center_lng REAL NOT NULL,
      bounds_json TEXT NOT NULL,
      pois_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  try {
    db.exec('ALTER TABLE trails ADD COLUMN route_coordinates TEXT;');
    console.log('Added route_coordinates column to trails table.');
  } catch {
    // Already present
  }

  // 2. Read scraped ranges from output.txt
  const rangesPath = path.resolve('C:/Users/acer/.gemini/antigravity/brain/ea7dafac-2da4-45ca-bf2e-b91c26acbe78/.system_generated/steps/1369/output.txt');
  console.log(`Reading ranges from ${rangesPath}...`);
  const ranges = readDump(rangesPath);
  console.log(`Loaded ${ranges.length} ranges.`);

  const upsertRange = db.prepare(`
    INSERT INTO ranges (id, name, center_lat, center_lng, bounds_json, pois_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      center_lat = excluded.center_lat,
      center_lng = excluded.center_lng,
      bounds_json = excluded.bounds_json,
      pois_json = excluded.pois_json
  `);

  const insertLandmark = db.prepare(`
    INSERT INTO landmarks (
      id, name, native_name, category, elevation, region, latitude, longitude,
      image, description, permit_required, associated_trail, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      latitude = excluded.latitude,
      longitude = excluded.longitude
  `);

  for (const r of ranges) {
    const rangeId = `range_${r.name.toLowerCase()}`;
    upsertRange.run(
      rangeId,
      r.name,
      r.center[0],
      r.center[1],
      JSON.stringify(r.bounds),
      JSON.stringify(r.pois),
      new Date().toISOString()
    );
    console.log(`  ✓ Range saved: ${r.name} (${r.bounds.length} boundary points, ${r.pois.length} POIs)`);

    // Ingest POIs into landmarks table
    for (const poi of r.pois) {
      const lmId = `poi-${r.name.toLowerCase()}-${poi.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      insertLandmark.run(
        lmId,
        poi.name,
        null,
        'Mountain Peak',
        r.name === 'Everest' && poi.name.includes('Everest') ? 8848 : 7000,
        r.name,
        poi.coord[0],
        poi.coord[1],
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
        `Iconic mountain peak landmark in the ${r.name} Range.`,
        'Mountaineering Permit Required',
        `${r.name} Region Trek`,
        new Date().toISOString()
      );
    }
  }

  // 3. Read scraped trails (Everest + Langtang)
  const evPath = path.resolve('C:/Users/acer/.gemini/antigravity/brain/ea7dafac-2da4-45ca-bf2e-b91c26acbe78/.system_generated/steps/1371/output.txt');
  const ltPath = path.resolve('C:/Users/acer/.gemini/antigravity/brain/ea7dafac-2da4-45ca-bf2e-b91c26acbe78/.system_generated/steps/1373/output.txt');

  const evTrails = readDump(evPath);
  const ltTrails = readDump(ltPath);
  const allScrapedTrails = [...evTrails, ...ltTrails];

  console.log(`Ingesting ${allScrapedTrails.length} scraped trails into database...`);

  const upsertTrail = db.prepare(`
    INSERT INTO trails (
      id, slug, name, region, difficulty, distance_km, duration_days,
      max_elevation, elevation_gain, image, description, highlights,
      best_months, start_point, end_point, rating, reviews_count,
      elevation_profile, route_coordinates, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      distance_km = excluded.distance_km,
      duration_days = excluded.duration_days,
      max_elevation = excluded.max_elevation,
      elevation_gain = excluded.elevation_gain,
      highlights = excluded.highlights,
      best_months = excluded.best_months,
      elevation_profile = excluded.elevation_profile,
      route_coordinates = excluded.route_coordinates
  `);

  for (const t of allScrapedTrails) {
    const meta = METADATA[t.name];
    if (!meta) {
      console.warn(`No metadata found for ${t.name}, skipping`);
      continue;
    }

    const stats = analyzeRoute(t.route);
    const elevationProfile = generateElevationProfile(t.route, 25);
    // route coordinates formatted as [lat, lng, elev] for universal Leaflet & Cesium compatibility
    const latLngElevCoords = t.route.map(pt => [pt[1], pt[0], pt[2]]);

    upsertTrail.run(
      meta.id,
      meta.slug,
      meta.id === 'ebc-trek' ? 'Everest Base Camp Trek' : t.name,
      meta.region,
      meta.difficulty,
      stats.distanceKm,
      meta.durationDays,
      stats.maxElevation,
      stats.elevationGain,
      meta.image,
      meta.description,
      JSON.stringify(meta.highlights),
      JSON.stringify(meta.bestMonths),
      meta.startPoint,
      meta.endPoint,
      meta.rating,
      meta.reviewsCount,
      JSON.stringify(elevationProfile),
      JSON.stringify(latLngElevCoords),
      new Date().toISOString()
    );

    console.log(`  ✓ Trail ingested: ${t.name} -> ID: ${meta.id} (${stats.distanceKm} km, +${stats.elevationGain}m gain, ${stats.maxElevation}m max)`);
  }

  // Verify total trails count
  const countRow = db.prepare('SELECT COUNT(*) as count FROM trails').get();
  const rangesCount = db.prepare('SELECT COUNT(*) as count FROM ranges').get();
  console.log(`\nVerification successful:`);
  console.log(`  Trails in DB: ${countRow.count}`);
  console.log(`  Himalayan Ranges in DB: ${rangesCount.count}`);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
