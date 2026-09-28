import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { Trail, Landmark, Itinerary, ItineraryDay, Story, WeatherReport, Booking, ContactMessage, Inquiry, SharedTrail, User, HimalayanRange } from '@/types';
import { hashPassword } from './auth';

// Ensure data directory exists with Vercel serverless support
const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? path.join('/tmp', 'himalayan_trails_data') : path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'himalayan_trails.db');

// If running in Vercel and a pre-seeded DB is bundled, copy it to writable /tmp
if (isVercel) {
  const bundledDbPath = path.join(process.cwd(), 'data', 'himalayan_trails.db');
  if (fs.existsSync(bundledDbPath) && !fs.existsSync(DB_PATH)) {
    try {
      fs.copyFileSync(bundledDbPath, DB_PATH);
    } catch {
      // Fallback to fresh creation
    }
  }
}

// Singleton database instance
let _db: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    try {
      _db.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // WAL may not be supported on some serverless FS, ignore if fallback to default
    }
    _db.exec('PRAGMA foreign_keys = ON;');
    initializeSchema(_db);
  }
  return _db;
}

function initializeSchema(db: DatabaseSync) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'TREKKER',
      created_at TEXT NOT NULL
    );
  `);

  // Trails table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trails (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      distance_km REAL NOT NULL,
      duration_days INTEGER NOT NULL,
      max_elevation INTEGER NOT NULL,
      elevation_gain INTEGER NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      highlights TEXT NOT NULL, -- JSON array
      best_months TEXT NOT NULL, -- JSON array
      start_point TEXT NOT NULL,
      end_point TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 5.0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      elevation_profile TEXT, -- JSON array
      created_at TEXT NOT NULL
    );
  `);

  // Landmarks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS landmarks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      native_name TEXT,
      category TEXT NOT NULL,
      elevation INTEGER NOT NULL,
      region TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      permit_required TEXT NOT NULL,
      associated_trail TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Itineraries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS itineraries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      trail_name TEXT NOT NULL,
      author TEXT NOT NULL,
      author_avatar TEXT NOT NULL,
      total_days INTEGER NOT NULL,
      max_altitude INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      estimated_cost_usd REAL NOT NULL,
      likes INTEGER NOT NULL DEFAULT 0,
      clones INTEGER NOT NULL DEFAULT 0,
      days_json TEXT NOT NULL, -- JSON array
      created_at TEXT NOT NULL
    );
  `);

  // Stories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      author TEXT NOT NULL,
      author_avatar TEXT NOT NULL,
      author_role TEXT NOT NULL,
      region TEXT NOT NULL,
      trail_name TEXT NOT NULL,
      read_time TEXT NOT NULL,
      date TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER NOT NULL DEFAULT 0,
      comments INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Weather reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS weather_reports (
      id TEXT PRIMARY KEY,
      location TEXT NOT NULL,
      region TEXT NOT NULL,
      elevation INTEGER NOT NULL,
      temp_c INTEGER NOT NULL,
      feels_like_c INTEGER NOT NULL,
      wind_km INTEGER NOT NULL,
      condition TEXT NOT NULL,
      avalanche_risk TEXT NOT NULL,
      hazards_json TEXT NOT NULL, -- JSON array
      updated_at TEXT NOT NULL
    );
  `);

  // Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      trail_id TEXT NOT NULL,
      user_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      start_date TEXT NOT NULL,
      travelers INTEGER NOT NULL,
      special_requests TEXT,
      total_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at TEXT NOT NULL,
      FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE
    );
  `);

  // Contact messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'UNREAD',
      created_at TEXT NOT NULL
    );
  `);

  // Migration for status column if missing in existing contact_messages table
  try {
    db.exec("ALTER TABLE contact_messages ADD COLUMN status TEXT DEFAULT 'UNREAD';");
  } catch {
    // Column already exists
  }

  // Inquiries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      trail_id TEXT NOT NULL,
      trail_name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      country TEXT,
      group_size INTEGER NOT NULL,
      preferred_start_date TEXT,
      fitness_level TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL
    );
  `);

  // Shared trails table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shared_trails (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      region TEXT NOT NULL,
      elevation INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      distance TEXT NOT NULL,
      duration TEXT NOT NULL,
      description TEXT NOT NULL,
      creator_name TEXT NOT NULL,
      creator_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL
    );
  `);

  // Himalayan Ranges table
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

  // Ensure route_coordinates column exists on trails table
  try {
    db.exec('ALTER TABLE trails ADD COLUMN route_coordinates TEXT;');
  } catch {
    // Column already exists
  }

  seedInitialDataIfEmpty(db);
}

function seedInitialDataIfEmpty(db: DatabaseSync) {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM trails').get() as { count: number };
  if (countRow && countRow.count > 0) {
    try {
      const itinCount = db.prepare('SELECT COUNT(*) as count FROM itineraries').get() as { count: number };
      if (!itinCount || itinCount.count < 6) {
        seedOfficialItineraries(db);
      }
    } catch {
      // ignore
    }
    return; // Already seeded
  }

  // Seed Admin user
  const adminId = 'usr_admin_1';
  const adminPass = hashPassword('AdminPass123!');
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(adminId, 'Pasang Sherpa (Chief Guide)', 'admin@himalayantrails.com', adminPass, 'ADMIN', new Date().toISOString());

  // Seed demo trekker user
  const trekkerId = 'usr_trekker_1';
  const trekkerPass = hashPassword('Trekker2026!');
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(trekkerId, 'Alex Morgan', 'alex@example.com', trekkerPass, 'TREKKER', new Date().toISOString());

  // Seed official Trails
  const trails = [
    {
      id: 'ebc-trek',
      slug: 'everest-base-camp',
      name: 'Everest Base Camp Trek',
      region: 'Everest',
      difficulty: 'Strenuous',
      distanceKm: 130,
      durationDays: 14,
      maxElevation: 5364,
      elevationGain: 4800,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      description: 'Walk in the footsteps of legendary mountaineers through Sherpa capital Namche Bazaar to the foot of Mt. Everest.',
      highlights: ['Kala Patthar (5,545m) sunrise view', 'Tengboche Monastery', 'Hillary Suspension Bridge', 'Khumbu Glacier'],
      bestMonths: ['Mar-May', 'Sep-Nov'],
      startPoint: 'Lukla (2,860m)',
      endPoint: 'Lukla (2,860m)',
      rating: 4.9,
      reviewsCount: 342,
      elevationProfile: [
        { distanceKm: 0, elevation: 2860, label: 'Lukla Airport' },
        { distanceKm: 8, elevation: 2610, label: 'Phakding' },
        { distanceKm: 19, elevation: 3440, label: 'Namche Bazaar' },
        { distanceKm: 29, elevation: 3867, label: 'Tengboche' },
        { distanceKm: 40, elevation: 4410, label: 'Dingboche' },
        { distanceKm: 52, elevation: 4940, label: 'Lobuche' },
        { distanceKm: 60, elevation: 5164, label: 'Gorak Shep' },
        { distanceKm: 65, elevation: 5364, label: 'Everest Base Camp' },
        { distanceKm: 68, elevation: 5545, label: 'Kala Patthar' },
        { distanceKm: 80, elevation: 4370, label: 'Pheriche' },
        { distanceKm: 130, elevation: 2860, label: 'Return Lukla' }
      ]
    },
    {
      id: 'annapurna-circuit',
      slug: 'annapurna-circuit',
      name: 'Annapurna Circuit & Thorong La',
      region: 'Annapurna',
      difficulty: 'Strenuous',
      distanceKm: 160,
      durationDays: 16,
      maxElevation: 5416,
      elevationGain: 5200,
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      description: 'Cross the formidable Thorong La Pass (5,416m) transitioning from subtropical river valleys to Mustang high desert.',
      highlights: ['Thorong La Pass', 'Muktinath Temple', 'Tilicho Lake Detour', 'Tatopani Hot Springs'],
      bestMonths: ['Mar-May', 'Oct-Nov'],
      startPoint: 'Besisahar',
      endPoint: 'Naya Pul / Pokhara',
      rating: 4.8,
      reviewsCount: 289,
      elevationProfile: [
        { distanceKm: 0, elevation: 820, label: 'Besisahar' },
        { distanceKm: 35, elevation: 2670, label: 'Chame' },
        { distanceKm: 49, elevation: 3300, label: 'Pisang' },
        { distanceKm: 68, elevation: 3540, label: 'Manang' },
        { distanceKm: 81, elevation: 4450, label: 'Thorong Phedi' },
        { distanceKm: 90, elevation: 5416, label: 'Thorong La Pass' },
        { distanceKm: 106, elevation: 3760, label: 'Muktinath Temple' },
        { distanceKm: 125, elevation: 2720, label: 'Jomsom' },
        { distanceKm: 145, elevation: 1190, label: 'Tatopani' },
        { distanceKm: 160, elevation: 1070, label: 'Naya Pul' }
      ]
    },
    {
      id: 'langtang-valley',
      slug: 'langtang-valley',
      name: 'Langtang Valley & Kyanjin Ri',
      region: 'Langtang',
      difficulty: 'Moderate',
      distanceKm: 77,
      durationDays: 8,
      maxElevation: 4773,
      elevationGain: 3100,
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
      description: 'The Valley of Glaciers offers rich Tamang culture, yak cheese factories, and dramatic peaks close to Kathmandu.',
      highlights: ['Kyanjin Gompa', 'Kyanjin Ri (4,773m)', 'Langtang Lirung view', 'Tamang Heritage Experience'],
      bestMonths: ['Feb-May', 'Sep-Dec'],
      startPoint: 'Syabrubesi',
      endPoint: 'Syabrubesi',
      rating: 4.7,
      reviewsCount: 178,
      elevationProfile: [
        { distanceKm: 0, elevation: 1550, label: 'Syabrubesi' },
        { distanceKm: 15, elevation: 2380, label: 'Lama Hotel' },
        { distanceKm: 28, elevation: 3430, label: 'Langtang Village' },
        { distanceKm: 38, elevation: 3870, label: 'Kyanjin Gompa' },
        { distanceKm: 43, elevation: 4773, label: 'Kyanjin Ri Peak' },
        { distanceKm: 77, elevation: 1550, label: 'Return Syabrubesi' }
      ]
    },
    {
      id: 'manaslu-circuit',
      slug: 'manaslu-circuit',
      name: 'Manaslu Circuit Trek',
      region: 'Manaslu',
      difficulty: 'Challenging',
      distanceKm: 177,
      durationDays: 14,
      maxElevation: 5106,
      elevationGain: 5600,
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      description: 'A pristine wilderness trek circumnavigating Mt. Manaslu (8,163m) across Larkya La Pass.',
      highlights: ['Larkya La Pass (5,106m)', 'Birendra Tal', 'Tibetan border influence', 'Uncrowded remote trails'],
      bestMonths: ['Mar-May', 'Sep-Nov'],
      startPoint: 'Soti Khola',
      endPoint: 'Dharapani',
      rating: 4.9,
      reviewsCount: 145,
      elevationProfile: [
        { distanceKm: 0, elevation: 700, label: 'Soti Khola' },
        { distanceKm: 20, elevation: 870, label: 'Machha Khola' },
        { distanceKm: 42, elevation: 1340, label: 'Jagat' },
        { distanceKm: 78, elevation: 2630, label: 'Namrung' },
        { distanceKm: 95, elevation: 3530, label: 'Samagaon' },
        { distanceKm: 120, elevation: 4460, label: 'Larkya Phedi' },
        { distanceKm: 132, elevation: 5106, label: 'Larkya La Pass' },
        { distanceKm: 148, elevation: 3720, label: 'Bimthang' },
        { distanceKm: 177, elevation: 1860, label: 'Dharapani' }
      ]
    },
    {
      id: 'upper-mustang',
      slug: 'upper-mustang',
      name: 'Upper Mustang Forbidden Kingdom',
      region: 'Mustang',
      difficulty: 'Moderate',
      distanceKm: 125,
      durationDays: 12,
      maxElevation: 3840,
      elevationGain: 2800,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      description: 'Journey to the walled ancient Tibetan capital of Lo Manthang in Nepal’s rain-shadow plateau.',
      highlights: ['Lo Manthang Royal Palace', 'Chhoser Cave Dwellings', 'Red Cliff Canyons', 'Tiji Festival'],
      bestMonths: ['May-Oct'],
      startPoint: 'Jomsom',
      endPoint: 'Jomsom',
      rating: 4.8,
      reviewsCount: 96,
      elevationProfile: [
        { distanceKm: 0, elevation: 2720, label: 'Jomsom' },
        { distanceKm: 11, elevation: 2810, label: 'Kagbeni' },
        { distanceKm: 28, elevation: 3050, label: 'Chele' },
        { distanceKm: 62, elevation: 3520, label: 'Ghami' },
        { distanceKm: 78, elevation: 3560, label: 'Tsarang' },
        { distanceKm: 95, elevation: 3840, label: 'Lo Manthang' },
        { distanceKm: 125, elevation: 2720, label: 'Return Jomsom' }
      ]
    },
    {
      id: 'rolwaling-valley',
      slug: 'rolwaling-valley',
      name: 'Rolwaling Valley & Tashi Lapcha Pass',
      region: 'Rolwaling',
      difficulty: 'Extreme',
      distanceKm: 110,
      durationDays: 15,
      maxElevation: 5755,
      elevationGain: 6100,
      image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
      description: 'One of Nepal’s wildest technical traverses linking Rolwaling to the Everest region via the glaciated Tashi Lapcha Pass.',
      highlights: ['Tsho Rolpa Glacial Lake', 'Tashi Lapcha Pass (5,755m)', 'Mount Gauri Shankar views', 'True alpine bivouac'],
      bestMonths: ['Apr-May', 'Oct-Nov'],
      startPoint: 'Gonggar / Chhetchhet',
      endPoint: 'Namche Bazaar',
      rating: 4.9,
      reviewsCount: 52,
      elevationProfile: [
        { distanceKm: 0, elevation: 1370, label: 'Chhetchhet' },
        { distanceKm: 12, elevation: 2820, label: 'Simigaon' },
        { distanceKm: 28, elevation: 3690, label: 'Beding' },
        { distanceKm: 42, elevation: 4180, label: 'Na Village' },
        { distanceKm: 50, elevation: 4580, label: 'Tsho Rolpa Lake' },
        { distanceKm: 68, elevation: 5755, label: 'Tashi Lapcha' },
        { distanceKm: 85, elevation: 4470, label: 'Thame' },
        { distanceKm: 110, elevation: 3440, label: 'Namche' }
      ]
    }
  ];

  const insertTrail = db.prepare(`
    INSERT INTO trails (
      id, slug, name, region, difficulty, distance_km, duration_days, max_elevation,
      elevation_gain, image, description, highlights, best_months, start_point, end_point,
      rating, reviews_count, elevation_profile, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const t of trails) {
    insertTrail.run(
      t.id,
      t.slug,
      t.name,
      t.region,
      t.difficulty,
      t.distanceKm,
      t.durationDays,
      t.maxElevation,
      t.elevationGain,
      t.image,
      t.description,
      JSON.stringify(t.highlights),
      JSON.stringify(t.bestMonths),
      t.startPoint,
      t.endPoint,
      t.rating,
      t.reviewsCount,
      JSON.stringify(t.elevationProfile),
      now
    );
  }

  // Seed Landmarks
  const landmarks = [
    {
      id: 'lm-ebc',
      name: 'Everest Base Camp (South)',
      nativeName: 'सगरमाथा आधार शिविर',
      category: 'Base Camp',
      elevation: 5364,
      region: 'Everest',
      latitude: 28.0044,
      longitude: 86.8569,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      description: 'The world-famous staging ground for summit attempts on Mount Everest sitting directly on the Khumbu Glacier.',
      permitRequired: 'Sagarmatha National Park Permit + Khumbu Pasang Lhamu Entry Permit',
      associatedTrail: 'Everest Base Camp Trek'
    },
    {
      id: 'lm-tengboche',
      name: 'Tengboche Monastery (Dawa Choling Gompa)',
      nativeName: 'तेङ्बोचे गुम्बा',
      category: 'Monastery',
      elevation: 3867,
      region: 'Everest',
      latitude: 27.8357,
      longitude: 86.7643,
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
      description: 'The spiritual heart of the Khumbu Sherpa community, boasting unforgettable panoramic views of Ama Dablam and Everest.',
      permitRequired: 'Sagarmatha National Park Permit',
      associatedTrail: 'Everest Base Camp Trek'
    },
    {
      id: 'lm-thorong-la',
      name: 'Thorong La High Mountain Pass',
      nativeName: 'थोरङ ला भञ्ज्याङ',
      category: 'High Pass',
      elevation: 5416,
      region: 'Annapurna',
      latitude: 28.7936,
      longitude: 83.9351,
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      description: 'The apex crossing of the Annapurna Circuit, linking the sacred valley of Manang with the spiritual enclave of Muktinath.',
      permitRequired: 'ACAP Permit + TIMS Card',
      associatedTrail: 'Annapurna Circuit & Thorong La'
    },
    {
      id: 'lm-tilicho',
      name: 'Tilicho Glacial Lake',
      nativeName: 'तिलिचो ताल',
      category: 'Sacred Lake',
      elevation: 4919,
      region: 'Annapurna',
      latitude: 28.6983,
      longitude: 83.8569,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      description: 'One of the highest alpine lakes in the world, shrouded by jagged frozen peaks and referenced in sacred Hindu literature.',
      permitRequired: 'ACAP Permit',
      associatedTrail: 'Annapurna Circuit & Thorong La'
    },
    {
      id: 'lm-kyanjin-ri',
      name: 'Kyanjin Ri Peak & Gompa',
      nativeName: 'क्यान्जिङ री',
      category: 'High Pass',
      elevation: 4773,
      region: 'Langtang',
      latitude: 28.2127,
      longitude: 85.5684,
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      description: 'A stellar vantage point above Kyanjin Gompa offering 360-degree vistas of Langtang Lirung and surrounding ice falls.',
      permitRequired: 'Langtang National Park Permit',
      associatedTrail: 'Langtang Valley & Kyanjin Ri'
    },
    {
      id: 'lm-larkya-la',
      name: 'Larkya La Pass',
      nativeName: 'लार्के ला भञ्ज्याङ',
      category: 'High Pass',
      elevation: 5106,
      region: 'Manaslu',
      latitude: 28.6472,
      longitude: 84.6225,
      image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
      description: 'The dramatic glaciated crest separating the northern Tibetan steppes of Manaslu from the Annapurna sanctuary.',
      permitRequired: 'Manaslu Restricted Area Permit (RAP) + MCAP + ACAP',
      associatedTrail: 'Manaslu Circuit Trek'
    },
    {
      id: 'lm-lo-manthang',
      name: 'Walled Capital of Lo Manthang',
      nativeName: 'लो मान्थाङ',
      category: 'Village',
      elevation: 3840,
      region: 'Mustang',
      latitude: 29.1825,
      longitude: 83.9575,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      description: 'An ancient mud-brick fortified city preserved in time, featuring 15th-century Tibetan Buddhist gompas and royal lineage.',
      permitRequired: 'Upper Mustang Special Restricted Area Permit ($500/10 days)',
      associatedTrail: 'Upper Mustang Forbidden Kingdom'
    },
    {
      id: 'lm-tsho-rolpa',
      name: 'Tsho Rolpa Glacial Lake',
      nativeName: 'छो रोल्पा ताल',
      category: 'Sacred Lake',
      elevation: 4580,
      region: 'Rolwaling',
      latitude: 27.8547,
      longitude: 86.4789,
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      description: 'The largest glacial lake in Nepal, hemmed in by lateral moraines and the sheer face of Bigphera Go-Shar.',
      permitRequired: 'Gaurishankar Conservation Area Project (GCAP) Permit',
      associatedTrail: 'Rolwaling Valley & Tashi Lapcha Pass'
    }
  ];

  const insertLandmark = db.prepare(`
    INSERT INTO landmarks (
      id, name, native_name, category, elevation, region, latitude, longitude,
      image, description, permit_required, associated_trail, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const lm of landmarks) {
    insertLandmark.run(
      lm.id,
      lm.name,
      lm.nativeName || null,
      lm.category,
      lm.elevation,
      lm.region,
      lm.latitude,
      lm.longitude,
      lm.image,
      lm.description,
      lm.permitRequired,
      lm.associatedTrail,
      now
    );
  }

  // Seed Itineraries
  seedOfficialItineraries(db);

  function seedOfficialItineraries(db: DatabaseSync) {
    const itineraries = [
    {
      id: 'itin-ebc-express',
      title: 'Everest Base Camp & Kala Patthar High Route',
      trailName: 'Everest Base Camp Trek',
      author: 'Ang Dawa Sherpa',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      totalDays: 12,
      maxAltitude: 5545,
      difficulty: 'Strenuous',
      estimatedCostUSD: 1450,
      likes: 128,
      clones: 34,
      days: [
        { day: 1, title: 'Flight to Lukla & Trek to Phakding', route: 'Lukla (2,860m) -> Phakding (2,610m)', distanceKm: 8, hours: 3.5, sleepingAltitude: 2610, altitudeGain: -250, highlights: 'Scenic STOL flight, Dudh Koshi River suspension bridges' },
        { day: 2, title: 'Climb to Sherpa Capital Namche', route: 'Phakding (2,610m) -> Namche Bazaar (3,440m)', distanceKm: 11, hours: 5.5, sleepingAltitude: 3440, altitudeGain: 830, highlights: 'Hillary Suspension Bridge, first glimpse of Everest' },
        { day: 3, title: 'Acclimatization Day at Namche', route: 'Namche -> Hotel Everest View -> Khumjung -> Namche', distanceKm: 6, hours: 4, sleepingAltitude: 3440, altitudeGain: 440, highlights: 'Panoramic vistas of Ama Dablam, Lhotse, and Everest' },
        { day: 4, title: 'Trek to Tengboche Monastery', route: 'Namche (3,440m) -> Tengboche (3,867m)', distanceKm: 10, hours: 5, sleepingAltitude: 3867, altitudeGain: 427, highlights: 'Afternoon monk prayer chanting, rhododendron forests' },
        { day: 5, title: 'Tengboche to Dingboche', route: 'Tengboche (3,867m) -> Dingboche (4,410m)', distanceKm: 11, hours: 5.5, sleepingAltitude: 4410, altitudeGain: 543, highlights: 'Pangboche Gompa, crossing the tree line' },
        { day: 6, title: 'Second Acclimatization at Dingboche', route: 'Dingboche -> Nangkartshang Peak (5,083m) -> Dingboche', distanceKm: 5, hours: 4.5, sleepingAltitude: 4410, altitudeGain: 673, highlights: 'Makalu (8,485m) view, steep ridge climbing' },
        { day: 7, title: 'Dingboche to Lobuche', route: 'Dingboche (4,410m) -> Lobuche (4,940m)', distanceKm: 12, hours: 5.5, sleepingAltitude: 4940, altitudeGain: 530, highlights: 'Chukpo Lari memorial shrines for fallen climbers' },
        { day: 8, title: 'Lobuche to Gorak Shep & Everest Base Camp', route: 'Lobuche (4,940m) -> Gorak Shep (5,164m) -> EBC (5,364m) -> Gorak Shep', distanceKm: 13, hours: 7.5, sleepingAltitude: 5164, altitudeGain: 424, highlights: 'Standing on Khumbu Glacier at Everest Base Camp' },
        { day: 9, title: 'Kala Patthar Sunrise & Descend to Pheriche', route: 'Gorak Shep (5,164m) -> Kala Patthar (5,545m) -> Pheriche (4,371m)', distanceKm: 15, hours: 6.5, sleepingAltitude: 4371, altitudeGain: 381, highlights: 'Sublime sunrise over Everest and Nuptse face' },
        { day: 10, title: 'Pheriche to Namche Bazaar', route: 'Pheriche (4,371m) -> Namche Bazaar (3,440m)', distanceKm: 20, hours: 6.5, sleepingAltitude: 3440, altitudeGain: -931, highlights: 'Warm bakeries and hot showers in Namche' },
        { day: 11, title: 'Namche Bazaar back to Lukla', route: 'Namche Bazaar (3,440m) -> Lukla (2,860m)', distanceKm: 19, hours: 7, sleepingAltitude: 2860, altitudeGain: -580, highlights: 'Final celebration dinner with local guide & porters' },
        { day: 12, title: 'Morning Flight Lukla to Kathmandu', route: 'Lukla (2,860m) -> Kathmandu (1,400m)', distanceKm: 0, hours: 0.5, sleepingAltitude: 1400, altitudeGain: -1460, highlights: 'Aerial panorama of the high Himalayan ramparts' }
      ]
    },
    {
      id: 'itin-annapurna-circuit',
      title: 'Full Annapurna Circuit via Thorong La & Poon Hill',
      trailName: 'Annapurna Circuit & Thorong La',
      author: 'Maya Gurung',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      totalDays: 14,
      maxAltitude: 5416,
      difficulty: 'Challenging',
      estimatedCostUSD: 1100,
      likes: 94,
      clones: 21,
      days: [
        { day: 1, title: 'Drive Besisahar to Chame', route: 'Besisahar (820m) -> Chame (2,670m)', distanceKm: 35, hours: 5, sleepingAltitude: 2670, altitudeGain: 1850, highlights: 'Cascading waterfalls, deep Marsyangdi Gorge' },
        { day: 2, title: 'Chame to Upper Pisang', route: 'Chame (2,670m) -> Upper Pisang (3,300m)', distanceKm: 14, hours: 5, sleepingAltitude: 3300, altitudeGain: 630, highlights: 'Paungda Danda curved rock face, pine forest' },
        { day: 3, title: 'Upper Pisang to Manang via Ghyaru', route: 'Upper Pisang (3,300m) -> Manang (3,540m)', distanceKm: 19, hours: 6.5, sleepingAltitude: 3540, altitudeGain: 240, highlights: 'Stunning high route vistas of Annapurna II and IV' },
        { day: 4, title: 'Acclimatization Day in Manang', route: 'Manang -> Gangapurna Lake / Ice Lake', distanceKm: 8, hours: 4, sleepingAltitude: 3540, altitudeGain: 600, highlights: 'Himalayan Rescue Association high altitude talk' },
        { day: 5, title: 'Manang to Yak Kharka', route: 'Manang (3,540m) -> Yak Kharka (4,050m)', distanceKm: 10, hours: 4, sleepingAltitude: 4050, altitudeGain: 510, highlights: 'Alpine meadows, spotting Himalayan blue sheep' },
        { day: 6, title: 'Yak Kharka to Thorong High Camp', route: 'Yak Kharka (4,050m) -> Thorong High Camp (4,850m)', distanceKm: 8, hours: 4.5, sleepingAltitude: 4850, altitudeGain: 800, highlights: 'Dramatic rock slopes, preparing for pass crossing' },
        { day: 7, title: 'Cross Thorong La Pass to Muktinath', route: 'High Camp (4,850m) -> Thorong La (5,416m) -> Muktinath (3,760m)', distanceKm: 16, hours: 8, sleepingAltitude: 3760, altitudeGain: 566, highlights: 'Pass summit prayer flags, eternal flame at Muktinath' },
        { day: 8, title: 'Muktinath to Marpha', route: 'Muktinath (3,760m) -> Kagbeni -> Marpha (2,670m)', distanceKm: 20, hours: 6, sleepingAltitude: 2670, altitudeGain: -1090, highlights: 'World famous apple orchards & cider in Marpha' }
      ]
    },
    {
      id: 'itin-annapurna-circuit',
      title: 'Full Annapurna Circuit via Thorong La & Poon Hill',
      trailName: 'Annapurna Circuit & Thorong La',
      author: 'Maya Gurung',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      totalDays: 14,
      maxAltitude: 5416,
      difficulty: 'Challenging',
      estimatedCostUSD: 1100,
      likes: 94,
      clones: 21,
      days: [
        { day: 1, title: 'Drive Besisahar to Chame', route: 'Besisahar (820m) -> Chame (2,670m)', distanceKm: 35, hours: 5, sleepingAltitude: 2670, altitudeGain: 1850, highlights: 'Cascading waterfalls, deep Marsyangdi Gorge' },
        { day: 2, title: 'Chame to Upper Pisang', route: 'Chame (2,670m) -> Upper Pisang (3,300m)', distanceKm: 14, hours: 5, sleepingAltitude: 3300, altitudeGain: 630, highlights: 'Paungda Danda curved rock face, pine forest' },
        { day: 3, title: 'Upper Pisang to Manang via Ghyaru', route: 'Upper Pisang (3,300m) -> Manang (3,540m)', distanceKm: 19, hours: 6.5, sleepingAltitude: 3540, altitudeGain: 240, highlights: 'Stunning high route vistas of Annapurna II and IV' },
        { day: 4, title: 'Acclimatization Day in Manang', route: 'Manang -> Gangapurna Lake / Ice Lake', distanceKm: 8, hours: 4, sleepingAltitude: 3540, altitudeGain: 600, highlights: 'Himalayan Rescue Association high altitude talk' },
        { day: 5, title: 'Manang to Yak Kharka', route: 'Manang (3,540m) -> Yak Kharka (4,050m)', distanceKm: 10, hours: 4, sleepingAltitude: 4050, altitudeGain: 510, highlights: 'Alpine meadows, spotting Himalayan blue sheep' },
        { day: 6, title: 'Yak Kharka to Thorong High Camp', route: 'Yak Kharka (4,050m) -> Thorong High Camp (4,850m)', distanceKm: 8, hours: 4.5, sleepingAltitude: 4850, altitudeGain: 800, highlights: 'Dramatic rock slopes, preparing for pass crossing' },
        { day: 7, title: 'Cross Thorong La Pass to Muktinath', route: 'High Camp (4,850m) -> Thorong La (5,416m) -> Muktinath (3,760m)', distanceKm: 16, hours: 8, sleepingAltitude: 3760, altitudeGain: 566, highlights: 'Pass summit prayer flags, eternal flame at Muktinath' },
        { day: 8, title: 'Muktinath to Marpha', route: 'Muktinath (3,760m) -> Kagbeni -> Marpha (2,670m)', distanceKm: 20, hours: 6, sleepingAltitude: 2670, altitudeGain: -1090, highlights: 'World famous apple orchards & cider in Marpha' },
        { day: 9, title: 'Marpha to Ghasa', route: 'Marpha (2,670m) -> Kalopani -> Ghasa (2,010m)', distanceKm: 18, hours: 5.5, sleepingAltitude: 2010, altitudeGain: -660, highlights: 'Deepest river gorge in the world (Kali Gandaki), views of Dhaulagiri' },
        { day: 10, title: 'Ghasa to Tatopani Hot Springs', route: 'Ghasa (2,010m) -> Tatopani (1,190m)', distanceKm: 14, hours: 4.5, sleepingAltitude: 1190, altitudeGain: -820, highlights: 'Rupse Chhahara waterfall, relaxing in natural riverside hot springs' },
        { day: 11, title: 'Tatopani to Ghorepani', route: 'Tatopani (1,190m) -> Shikha -> Ghorepani (2,860m)', distanceKm: 17, hours: 7, sleepingAltitude: 2860, altitudeGain: 1670, highlights: 'Ascent through ancient rhododendron and magnolia forests' },
        { day: 12, title: 'Poon Hill Sunrise & Trek to Tadapani', route: 'Ghorepani -> Poon Hill (3,210m) -> Tadapani (2,630m)', distanceKm: 12, hours: 5.5, sleepingAltitude: 2630, altitudeGain: 350, highlights: 'Golden sunrise across 32 Himalayan peaks including Machapuchare' },
        { day: 13, title: 'Tadapani to Ghandruk & Naya Pul', route: 'Tadapani (2,630m) -> Ghandruk (1,940m) -> Naya Pul (1,070m)', distanceKm: 14, hours: 5, sleepingAltitude: 1070, altitudeGain: -1560, highlights: 'Picturesque stone-paved Gurung village and terraced farmlands' },
        { day: 14, title: 'Drive Naya Pul to Pokhara', route: 'Naya Pul (1,070m) -> Pokhara (820m)', distanceKm: 42, hours: 1.5, sleepingAltitude: 820, altitudeGain: -250, highlights: 'Relaxation beside Phewa Lake, celebratory dinner' }
      ]
    },
    {
      id: 'itin-langtang-valley',
      title: 'Langtang Valley & Kyanjin Ri Glacier Trek',
      trailName: 'Langtang Valley & Kyanjin Ri',
      author: 'Tenzing Norbu Tamang',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      totalDays: 8,
      maxAltitude: 4773,
      difficulty: 'Moderate',
      estimatedCostUSD: 850,
      likes: 82,
      clones: 19,
      days: [
        { day: 1, title: 'Drive Kathmandu to Syabrubesi', route: 'Kathmandu (1,400m) -> Syabrubesi (1,550m)', distanceKm: 145, hours: 7, sleepingAltitude: 1550, altitudeGain: 150, highlights: 'Scenic drive along Trishuli river valley and Nuwakot hills' },
        { day: 2, title: 'Syabrubesi to Lama Hotel', route: 'Syabrubesi (1,550m) -> Lama Hotel (2,470m)', distanceKm: 11, hours: 5.5, sleepingAltitude: 2470, altitudeGain: 920, highlights: 'Bamboo groves, suspension bridges, waterfalls along Langtang Khola' },
        { day: 3, title: 'Lama Hotel to Langtang Village', route: 'Lama Hotel (2,470m) -> Langtang Village (3,430m)', distanceKm: 14, hours: 5, sleepingAltitude: 3430, altitudeGain: 960, highlights: 'Ghimna alpine meadows, water-powered prayer wheels, rebuilt Tamang heritage' },
        { day: 4, title: 'Langtang Village to Kyanjin Gompa', route: 'Langtang Village (3,430m) -> Kyanjin Gompa (3,870m)', distanceKm: 7, hours: 3.5, sleepingAltitude: 3870, altitudeGain: 440, highlights: 'Historic monastery, artisanal yak cheese factory, alpine amphitheater' },
        { day: 5, title: 'Acclimatization & Kyanjin Ri Summit', route: 'Kyanjin Gompa -> Kyanjin Ri Peak (4,773m) -> Kyanjin Gompa', distanceKm: 5, hours: 4.5, sleepingAltitude: 3870, altitudeGain: 903, highlights: '360° panoramas of Langtang Lirung, Kinshung, and glacier ice falls' },
        { day: 6, title: 'Kyanjin Gompa to Lama Hotel', route: 'Kyanjin Gompa (3,870m) -> Lama Hotel (2,470m)', distanceKm: 21, hours: 6, sleepingAltitude: 2470, altitudeGain: -1400, highlights: 'Fast downhill descent through rhododendron forest' },
        { day: 7, title: 'Lama Hotel back to Syabrubesi', route: 'Lama Hotel (2,470m) -> Syabrubesi (1,550m)', distanceKm: 11, hours: 4.5, sleepingAltitude: 1550, altitudeGain: -920, highlights: 'Sherpa gaon vistas and soothing riverside hot spring bath' },
        { day: 8, title: 'Drive Syabrubesi back to Kathmandu', route: 'Syabrubesi (1,550m) -> Kathmandu (1,400m)', distanceKm: 145, hours: 6.5, sleepingAltitude: 1400, altitudeGain: -150, highlights: 'Return to capital, farewell dinner' }
      ]
    },
    {
      id: 'itin-manaslu-circuit',
      title: 'Manaslu Circuit & Larkya La Alpine Traverse',
      trailName: 'Manaslu Circuit Trek',
      author: 'Karsang Lama',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      totalDays: 14,
      maxAltitude: 5106,
      difficulty: 'Challenging',
      estimatedCostUSD: 1350,
      likes: 110,
      clones: 28,
      days: [
        { day: 1, title: 'Drive Kathmandu to Soti Khola', route: 'Kathmandu (1,400m) -> Soti Khola (700m)', distanceKm: 140, hours: 7, sleepingAltitude: 700, altitudeGain: -700, highlights: 'Passing Arughat along the rugged Budhi Gandaki river' },
        { day: 2, title: 'Soti Khola to Machha Khola', route: 'Soti Khola (700m) -> Machha Khola (870m)', distanceKm: 14, hours: 5.5, sleepingAltitude: 870, altitudeGain: 170, highlights: 'Sal forests, canyon rim paths, suspension bridge crossings' },
        { day: 3, title: 'Machha Khola to Jagat', route: 'Machha Khola (870m) -> Tatopani -> Jagat (1,340m)', distanceKm: 16, hours: 6, sleepingAltitude: 1340, altitudeGain: 470, highlights: 'Cantilever trail pinned to cliff face, MCAP checkpoint at Jagat' },
        { day: 4, title: 'Jagat to Deng', route: 'Jagat (1,340m) -> Philim -> Deng (1,860m)', distanceKm: 18, hours: 6.5, sleepingAltitude: 1860, altitudeGain: 520, highlights: 'Entrance to Tibetan Buddhist cultural zone, bamboo forests' },
        { day: 5, title: 'Deng to Namrung', route: 'Deng (1,860m) -> Ghap -> Namrung (2,630m)', distanceKm: 19, hours: 7, sleepingAltitude: 2630, altitudeGain: 770, highlights: 'Intricate mani stone walls, first views of Ganesh Himal' },
        { day: 6, title: 'Namrung to Samagaon', route: 'Namrung (2,630m) -> Lho -> Samagaon (3,530m)', distanceKm: 17, hours: 5.5, sleepingAltitude: 3530, altitudeGain: 900, highlights: 'Ribung Gompa in Lho, majestic close-up of Mt. Manaslu (8,163m)' },
        { day: 7, title: 'Acclimatization Day at Samagaon', route: 'Samagaon -> Birendra Tal / Manaslu Base Camp -> Samagaon', distanceKm: 8, hours: 4.5, sleepingAltitude: 3530, altitudeGain: 470, highlights: 'Glacial Birendra Tal, prayer wheels, mountaineering staging camp' },
        { day: 8, title: 'Samagaon to Samdo', route: 'Samagaon (3,530m) -> Samdo (3,860m)', distanceKm: 16, hours: 4, sleepingAltitude: 3860, altitudeGain: 330, highlights: 'Tibetan border trading route, juniper scrublands' },
        { day: 9, title: 'Samdo to Dharmasala (Larkya Phedi)', route: 'Samdo (3,860m) -> Dharmasala (4,460m)', distanceKm: 12, hours: 4.5, sleepingAltitude: 4460, altitudeGain: 600, highlights: 'Rugged moraine climbing, preparing high gear for Larkya La pass' },
        { day: 10, title: 'Cross Larkya La Pass to Bimthang', route: 'Dharmasala (4,460m) -> Larkya La (5,106m) -> Bimthang (3,720m)', distanceKm: 24, hours: 9, sleepingAltitude: 3720, altitudeGain: 646, highlights: 'Glacial crest at 5,106m, prayer flags, vistas of Annapurna II and Himlung' },
        { day: 11, title: 'Bimthang to Tilije', route: 'Bimthang (3,720m) -> Gho -> Tilije (2,300m)', distanceKm: 26, hours: 6, sleepingAltitude: 2300, altitudeGain: -1420, highlights: 'Descent through pristine pine, rhododendron, and fig orchards' },
        { day: 12, title: 'Tilije to Dharapani & drive Besisahar', route: 'Tilije (2,300m) -> Dharapani (1,860m) -> Besisahar (820m)', distanceKm: 15, hours: 4, sleepingAltitude: 820, altitudeGain: -1040, highlights: 'Joining Annapurna Circuit junction at Dharapani, celebratory drive' }
      ]
    },
    {
      id: 'itin-upper-mustang',
      title: 'Upper Mustang Walled Kingdom of Lo Manthang',
      trailName: 'Upper Mustang Forbidden Kingdom',
      author: 'Palden Bista',
      authorAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
      totalDays: 12,
      maxAltitude: 3840,
      difficulty: 'Moderate',
      estimatedCostUSD: 1850,
      likes: 98,
      clones: 24,
      days: [
        { day: 1, title: 'Flight Pokhara to Jomsom & Trek to Kagbeni', route: 'Jomsom (2,720m) -> Kagbeni (2,810m)', distanceKm: 11, hours: 3.5, sleepingAltitude: 2810, altitudeGain: 90, highlights: 'Windy Kali Gandaki gorge, ancient gateway town of Kagbeni' },
        { day: 2, title: 'Kagbeni to Chele', route: 'Kagbeni (2,810m) -> Tangbe -> Chhusang -> Chele (3,050m)', distanceKm: 16, hours: 5, sleepingAltitude: 3050, altitudeGain: 240, highlights: 'Red sandstone cliffs, apple orchards, crossing Kali Gandaki bridge' },
        { day: 3, title: 'Chele to Syangboche', route: 'Chele (3,050m) -> Taklam La -> Syangboche (3,800m)', distanceKm: 17, hours: 6, sleepingAltitude: 3800, altitudeGain: 750, highlights: 'Ramche cave, high passes with views of Nilgiri and Tilicho' },
        { day: 4, title: 'Syangboche to Ghami', route: 'Syangboche (3,800m) -> Nyi La (4,010m) -> Ghami (3,520m)', distanceKm: 12, hours: 5, sleepingAltitude: 3520, altitudeGain: 210, highlights: 'Crossing the Nyi La pass, descending into fertile Ghami valley' },
        { day: 5, title: 'Ghami to Tsarang', route: 'Ghami (3,520m) -> Longest Mani Wall -> Tsarang (3,560m)', distanceKm: 11, hours: 4.5, sleepingAltitude: 3560, altitudeGain: 40, highlights: 'Longest sculpted Mani wall in Nepal, 14th-century Tsarang Dzong' },
        { day: 6, title: 'Tsarang to Walled Capital Lo Manthang', route: 'Tsarang (3,560m) -> Lo La Pass (3,950m) -> Lo Manthang (3,840m)', distanceKm: 13, hours: 4.5, sleepingAltitude: 3840, altitudeGain: 280, highlights: 'First sight of the ancient mud-brick walled kingdom of Lo' },
        { day: 7, title: 'Explore Lo Manthang & Chhoser Caves', route: 'Lo Manthang -> Chhoser Shija Jhong Cave -> Lo Manthang', distanceKm: 9, hours: 4, sleepingAltitude: 3840, altitudeGain: 0, highlights: '5-story ancient cliff-dwelling caves, royal palace, Jampa Gompa' },
        { day: 8, title: 'Lo Manthang to Dhakmar via Ghar Gompa', route: 'Lo Manthang (3,840m) -> Ghar Gompa -> Dhakmar (3,820m)', distanceKm: 16, hours: 6, sleepingAltitude: 3820, altitudeGain: -20, highlights: '8th-century Guru Rinpoche Ghar Gompa, crimson red cliff bluffs' },
        { day: 9, title: 'Dhakmar to Ghiling', route: 'Dhakmar (3,820m) -> Ja-Te La -> Ghiling (3,570m)', distanceKm: 15, hours: 5.5, sleepingAltitude: 3570, altitudeGain: -250, highlights: 'Dry desert plateaus, sweeping views of Dhaulagiri range' },
        { day: 10, title: 'Ghiling to Chhusang', route: 'Ghiling (3,570m) -> Chele -> Chhusang (2,980m)', distanceKm: 18, hours: 6, sleepingAltitude: 2980, altitudeGain: -590, highlights: 'Eroded canyon amphitheaters, wind-carved caves' },
        { day: 11, title: 'Chhusang to Jomsom', route: 'Chhusang (2,980m) -> Kagbeni -> Jomsom (2,720m)', distanceKm: 22, hours: 6.5, sleepingAltitude: 2720, altitudeGain: -260, highlights: 'Completing the restricted corridor, celebrating with local apple cider' },
        { day: 12, title: 'Flight Jomsom to Pokhara', route: 'Jomsom (2,720m) -> Pokhara (820m)', distanceKm: 0, hours: 0.5, sleepingAltitude: 820, altitudeGain: -1900, highlights: 'Thrilling flight through the Annapurna-Dhaulagiri chasm' }
      ]
    },
    {
      id: 'itin-rolwaling-valley',
      title: 'Rolwaling Valley & Tashi Lapcha High Pass Traverse',
      trailName: 'Rolwaling Valley & Tashi Lapcha Pass',
      author: 'Mingma Tenzi Sherpa',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      totalDays: 14,
      maxAltitude: 5755,
      difficulty: 'Extreme',
      estimatedCostUSD: 1750,
      likes: 74,
      clones: 16,
      days: [
        { day: 1, title: 'Drive Kathmandu to Gonggar / Chhetchhet', route: 'Kathmandu (1,400m) -> Chhetchhet (1,370m)', distanceKm: 190, hours: 8, sleepingAltitude: 1370, altitudeGain: -30, highlights: 'Tama Koshi river gorge and roaring hydropower waterfalls' },
        { day: 2, title: 'Chhetchhet to Simigaon', route: 'Chhetchhet (1,370m) -> Simigaon (2,020m)', distanceKm: 6, hours: 4, sleepingAltitude: 2020, altitudeGain: 650, highlights: 'Steep stone staircase through terraces to cliffside Sherpa village' },
        { day: 3, title: 'Simigaon to Dongang', route: 'Simigaon (2,020m) -> Kelche -> Dongang (2,790m)', distanceKm: 12, hours: 5.5, sleepingAltitude: 2790, altitudeGain: 770, highlights: 'Rhododendron groves, deep river canyon, view of Gauri Shankar' },
        { day: 4, title: 'Dongang to Beding', route: 'Dongang (2,790m) -> Beding (3,740m)', distanceKm: 14, hours: 6, sleepingAltitude: 3740, altitudeGain: 950, highlights: 'Entering wide glacial valley, sacred Beding Gompa founded by Padmasambhava' },
        { day: 5, title: 'Beding to Na Gaon', route: 'Beding (3,740m) -> Na Gaon (4,180m)', distanceKm: 7, hours: 3.5, sleepingAltitude: 4180, altitudeGain: 440, highlights: 'Summer yak grazing pastures, massive rock faces, Chobutse vista' },
        { day: 6, title: 'Acclimatization Day at Na Gaon', route: 'Na Gaon -> Yalung Glacier / Sangma Lake -> Na Gaon', distanceKm: 6, hours: 4, sleepingAltitude: 4180, altitudeGain: 400, highlights: 'Acclimatization climb toward Yalung Base Camp, crystal lake' },
        { day: 7, title: 'Na Gaon to Tsho Rolpa Glacial Lake', route: 'Na Gaon (4,180m) -> Tsho Rolpa (4,580m)', distanceKm: 8, hours: 4.5, sleepingAltitude: 4580, altitudeGain: 400, highlights: 'Camp beside the turquoise glacial lake surrounded by sheer moraines' },
        { day: 8, title: 'Tsho Rolpa to Drolambau Glacier Camp', route: 'Tsho Rolpa (4,580m) -> Glacier Camp (4,820m)', distanceKm: 8, hours: 5, sleepingAltitude: 4820, altitudeGain: 240, highlights: 'Technical moraine scrambling, crampon fitting on Drolambau ice' },
        { day: 9, title: 'Glacier Camp to Tashi Lapcha High Camp', route: 'Glacier Camp (4,820m) -> High Camp (5,400m)', distanceKm: 6, hours: 5.5, sleepingAltitude: 5400, altitudeGain: 580, highlights: 'Frozen seracs, sheer ice pinnacles, high alpine bivouac' },
        { day: 10, title: 'Technical Crossing of Tashi Lapcha Pass', route: 'High Camp (5,400m) -> Tashi Lapcha (5,755m) -> Ngole (5,110m)', distanceKm: 9, hours: 8.5, sleepingAltitude: 5110, altitudeGain: 355, highlights: 'Glacial apex at 5,755m, panoramic gateway into Everest Khumbu region' },
        { day: 11, title: 'Ngole to Thame Village', route: 'Ngole (5,110m) -> Thame (3,820m)', distanceKm: 14, hours: 6, sleepingAltitude: 3820, altitudeGain: -1290, highlights: 'Descent into Khumbu valley, historic Thame Monastery' },
        { day: 12, title: 'Thame to Namche Bazaar', route: 'Thame (3,820m) -> Namche Bazaar (3,440m)', distanceKm: 10, hours: 4, sleepingAltitude: 3440, altitudeGain: -380, highlights: 'Return to Sherpa capital, hot showers and mountain bakeries' },
        { day: 13, title: 'Namche Bazaar down to Lukla', route: 'Namche Bazaar (3,440m) -> Lukla (2,860m)', distanceKm: 19, hours: 7, sleepingAltitude: 2860, altitudeGain: -580, highlights: 'Crossing suspension bridges, celebration with expedition crew' },
        { day: 14, title: 'Morning Flight Lukla to Kathmandu', route: 'Lukla (2,860m) -> Kathmandu (1,400m)', distanceKm: 0, hours: 0.5, sleepingAltitude: 1400, altitudeGain: -1460, highlights: 'Final scenic flight past Himalayan ranges back to capital' }
      ]
    }
  ];

  const insertItinerary = db.prepare(`
    INSERT OR REPLACE INTO itineraries (
      id, title, trail_name, author, author_avatar, total_days, max_altitude,
      difficulty, estimated_cost_usd, likes, clones, days_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const itin of itineraries) {
    insertItinerary.run(
      itin.id,
      itin.title,
      itin.trailName,
      itin.author,
      itin.authorAvatar,
      itin.totalDays,
      itin.maxAltitude,
      itin.difficulty,
      itin.estimatedCostUSD,
      itin.likes,
      itin.clones,
      JSON.stringify(itin.days),
      now
    );
  }
}

  // Seed Weather
  const weatherReports = [
    {
      id: 'wr-everest',
      location: 'Gorak Shep & EBC Base',
      region: 'Everest',
      elevation: 5364,
      tempC: -9,
      feelsLikeC: -17,
      windKm: 34,
      condition: 'Clear Skies',
      avalancheRisk: 'Low (1/5)',
      hazards: [
        {
          id: 'hz-1',
          type: 'Ice Patch',
          severity: 'Medium',
          location: 'Lobuche to Gorak Shep lateral moraine',
          description: 'Black ice under dusting of snow. Microspikes advised between km 56 and 59.',
          updatedAt: '2 hours ago'
        },
        {
          id: 'hz-2',
          type: 'Blizzard Warning',
          severity: 'High',
          location: 'South Col (7,900m+)',
          description: 'Gale force jetstream depression arriving over Khumbu summit ridges late afternoon.',
          updatedAt: '35 mins ago'
        }
      ]
    },
    {
      id: 'wr-annapurna',
      location: 'Thorong Phedi & High Camp',
      region: 'Annapurna',
      elevation: 4850,
      tempC: -6,
      feelsLikeC: -12,
      windKm: 28,
      condition: 'Partly Cloudy',
      avalancheRisk: 'Moderate (2/5)',
      hazards: [
        {
          id: 'hz-3',
          type: 'Landslide',
          severity: 'High',
          location: 'Thorong Phedi Scree Gully',
          description: 'Active scree movement reported by morning porters. Wear helmets and do not stop in gully.',
          updatedAt: '1 hour ago'
        }
      ]
    }
  ];

  const insertWeather = db.prepare(`
    INSERT INTO weather_reports (
      id, location, region, elevation, temp_c, feels_like_c, wind_km,
      condition, avalanche_risk, hazards_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const wr of weatherReports) {
    insertWeather.run(
      wr.id,
      wr.location,
      wr.region,
      wr.elevation,
      wr.tempC,
      wr.feelsLikeC,
      wr.windKm,
      wr.condition,
      wr.avalancheRisk,
      JSON.stringify(wr.hazards),
      now
    );
  }

  // Seed Stories
  const stories = [
    {
      id: 'story-ebc-winter',
      title: 'Solo Through the Winter Frost: A Quiet Khumbu Journey',
      subtitle: 'Why trekking to Everest Base Camp in January revealed a sacred stillness unseen in peak seasons.',
      author: 'David Chen',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      authorRole: 'Alpine Photographer',
      region: 'Everest',
      trailName: 'Everest Base Camp Trek',
      readTime: '6 min read',
      date: 'Jan 14, 2026',
      coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      content: `The temperature in Namche Bazaar had plunged to -14°C by twilight. The vibrant souvenir stalls and tea houses, packed to the gills during the October rush, were shuttered under heavy wooden planks.

Only the wood-burning stoves of local Sherpa hearths emitted fragrant plumes of cedar smoke into the crisp air. Traveling through the Khumbu in mid-winter demands unwavering respect for cold-weather logistics: boiling water bottles before bed, double-insulating lithium batteries, and pacing every uphill breath against dry sub-zero air.

When I reached Kala Patthar at dawn, there was not another soul in sight. Mount Everest stood majestic, glistening under a cloudless turquoise sky. It was raw, humbling, and completely unforgettable.`,
      likes: 87,
      comments: 14
    },
    {
      id: 'story-thorong-la-dawn',
      title: 'The Breath at 5,416 Meters: Crossing Thorong La at 4 AM',
      subtitle: 'Headlamps in the dark, crunching frozen scree, and the unforgettable cup of hot tea at the pass summit.',
      author: 'Sophie Martin',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      authorRole: 'Ultralight Hiker',
      region: 'Annapurna',
      trailName: 'Annapurna Circuit & Thorong La',
      readTime: '8 min read',
      date: 'Nov 02, 2025',
      coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      content: `The wake-up alarm in Thorong High Camp sounded at 3:15 AM. The stone dorm room was freezing; ice crystals coated the inside of the single-pane glass.

We laced our frozen boots, adjusted our trekking poles, and stepped out into a pitch-black abyss illuminated solely by a string of LED headlamps snaking up the mountain wall. Every step above 5,000 meters requires conscious breathing: inhale on the left foot, exhale on the right.

As dawn cracked over the Annapurna massifs, golden light bathed the Tibetan borderlands. We touched the prayer-flag-draped sign at Thorong La summit just as the small wooden teahouse opened, serving cardamom black tea that tasted like pure victory.`,
      likes: 112,
      comments: 29
    }
  ];

  const insertStory = db.prepare(`
    INSERT INTO stories (
      id, title, subtitle, author, author_avatar, author_role, region,
      trail_name, read_time, date, cover_image, content, likes, comments, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const st of stories) {
    insertStory.run(
      st.id,
      st.title,
      st.subtitle,
      st.author,
      st.authorAvatar,
      st.authorRole,
      st.region,
      st.trailName,
      st.readTime,
      st.date,
      st.coverImage,
      st.content,
      st.likes,
      st.comments,
      now
    );
  }
}

// ---------------- DATABASE DATA ACCESS METHODS ----------------

export function getAllTrails(filter?: {
  search?: string;
  region?: string;
  difficulty?: string;
  maxElevation?: number;
}): Trail[] {
  const db = getDatabase();
  let query = 'SELECT * FROM trails WHERE 1=1';
  const params: (string | number)[] = [];

  if (filter?.region && filter.region !== 'All') {
    query += ' AND region = ?';
    params.push(filter.region);
  }

  if (filter?.difficulty && filter.difficulty !== 'All') {
    query += ' AND difficulty = ?';
    params.push(filter.difficulty);
  }

  if (filter?.maxElevation) {
    query += ' AND max_elevation <= ?';
    params.push(filter.maxElevation);
  }

  if (filter?.search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    const searchPattern = `%${filter.search}%`;
    params.push(searchPattern, searchPattern);
  }

  query += ' ORDER BY rating DESC, name ASC';

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    region: r.region as string,
    difficulty: r.difficulty as string,
    distanceKm: Number(r.distance_km),
    durationDays: Number(r.duration_days),
    maxElevation: Number(r.max_elevation),
    elevationGain: Number(r.elevation_gain),
    image: r.image as string,
    description: r.description as string,
    highlights: JSON.parse((r.highlights as string) || '[]'),
    bestMonths: JSON.parse((r.best_months as string) || '[]'),
    startPoint: r.start_point as string,
    endPoint: r.end_point as string,
    rating: Number(r.rating),
    reviewsCount: Number(r.reviews_count),
    elevationProfile: r.elevation_profile ? JSON.parse(r.elevation_profile as string) : undefined,
    routeCoordinates: r.route_coordinates ? JSON.parse(r.route_coordinates as string) : undefined
  }));
}

export function getTrailBySlug(slug: string): Trail | null {
  const db = getDatabase();
  const r = db.prepare('SELECT * FROM trails WHERE slug = ? OR id = ?').get(slug, slug) as Record<string, unknown> | undefined;
  if (!r) return null;

  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    region: r.region as string,
    difficulty: r.difficulty as string,
    distanceKm: Number(r.distance_km),
    durationDays: Number(r.duration_days),
    maxElevation: Number(r.max_elevation),
    elevationGain: Number(r.elevation_gain),
    image: r.image as string,
    description: r.description as string,
    highlights: JSON.parse((r.highlights as string) || '[]'),
    bestMonths: JSON.parse((r.best_months as string) || '[]'),
    startPoint: r.start_point as string,
    endPoint: r.end_point as string,
    rating: Number(r.rating),
    reviewsCount: Number(r.reviews_count),
    elevationProfile: r.elevation_profile ? JSON.parse(r.elevation_profile as string) : undefined,
    routeCoordinates: r.route_coordinates ? JSON.parse(r.route_coordinates as string) : undefined
  };
}

export function createTrail(trail: Omit<Trail, 'rating' | 'reviewsCount'>): Trail {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO trails (
      id, slug, name, region, difficulty, distance_km, duration_days, max_elevation,
      elevation_gain, image, description, highlights, best_months, start_point, end_point,
      rating, reviews_count, elevation_profile, route_coordinates, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 0, ?, ?, ?)
  `).run(
    trail.id,
    trail.slug,
    trail.name,
    trail.region,
    trail.difficulty,
    trail.distanceKm,
    trail.durationDays,
    trail.maxElevation,
    trail.elevationGain,
    trail.image,
    trail.description,
    JSON.stringify(trail.highlights),
    JSON.stringify(trail.bestMonths),
    trail.startPoint,
    trail.endPoint,
    JSON.stringify(trail.elevationProfile || []),
    trail.routeCoordinates ? JSON.stringify(trail.routeCoordinates) : null,
    now
  );

  return {
    ...trail,
    rating: 5.0,
    reviewsCount: 0
  };
}

export function updateTrail(idOrSlug: string, data: Partial<Trail>): Trail | null {
  const db = getDatabase();
  const existing = getTrailBySlug(idOrSlug);
  if (!existing) return null;

  const updated: Trail = {
    ...existing,
    ...data,
    id: existing.id,
    slug: data.slug || existing.slug
  };

  db.prepare(`
    UPDATE trails SET
      slug = ?,
      name = ?,
      region = ?,
      difficulty = ?,
      distance_km = ?,
      duration_days = ?,
      max_elevation = ?,
      elevation_gain = ?,
      image = ?,
      description = ?,
      highlights = ?,
      best_months = ?,
      start_point = ?,
      end_point = ?,
      elevation_profile = ?,
      route_coordinates = ?
    WHERE id = ?
  `).run(
    updated.slug,
    updated.name,
    updated.region,
    updated.difficulty,
    updated.distanceKm,
    updated.durationDays,
    updated.maxElevation,
    updated.elevationGain,
    updated.image,
    updated.description,
    JSON.stringify(updated.highlights || []),
    JSON.stringify(updated.bestMonths || []),
    updated.startPoint,
    updated.endPoint,
    JSON.stringify(updated.elevationProfile || []),
    updated.routeCoordinates ? JSON.stringify(updated.routeCoordinates) : null,
    existing.id
  );

  return getTrailBySlug(existing.id);
}

export function deleteTrail(idOrSlug: string): boolean {
  const db = getDatabase();
  const trail = db.prepare('SELECT id FROM trails WHERE id = ? OR slug = ?').get(idOrSlug, idOrSlug) as { id: string } | undefined;
  if (!trail) return false;

  db.prepare('DELETE FROM bookings WHERE trail_id = ?').run(trail.id);
  const result = db.prepare('DELETE FROM trails WHERE id = ?').run(trail.id);
  return result.changes > 0;
}


export function getAllRanges(): HimalayanRange[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM ranges ORDER BY name ASC').all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    center: [Number(r.center_lat), Number(r.center_lng)],
    bounds: JSON.parse((r.bounds_json as string) || '[]'),
    pois: JSON.parse((r.pois_json as string) || '[]'),
  }));
}

export function getRangeByName(name: string): HimalayanRange | null {
  const db = getDatabase();
  const r = db.prepare('SELECT * FROM ranges WHERE LOWER(name) = LOWER(?)').get(name) as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    id: r.id as string,
    name: r.name as string,
    center: [Number(r.center_lat), Number(r.center_lng)],
    bounds: JSON.parse((r.bounds_json as string) || '[]'),
    pois: JSON.parse((r.pois_json as string) || '[]'),
  };
}

export function getAllLandmarks(category?: string, region?: string, trail?: string): Landmark[] {
  const db = getDatabase();
  let query = 'SELECT * FROM landmarks';
  const params: string[] = [];
  const conditions: string[] = [];

  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (region && region !== 'All') {
    conditions.push('region = ?');
    params.push(region);
  }
  if (trail && trail !== 'All') {
    conditions.push('(associated_trail LIKE ? OR associated_trail = ?)');
    params.push(`%${trail}%`, trail);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY elevation DESC';

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    nativeName: (r.native_name as string) || undefined,
    category: r.category as string,
    elevation: Number(r.elevation),
    region: r.region as string,
    coordinates: {
      lat: Number(r.latitude),
      lng: Number(r.longitude)
    },
    image: r.image as string,
    description: r.description as string,
    permitRequired: r.permit_required as string,
    associatedTrail: r.associated_trail as string
  }));
}

export function getAllItineraries(): Itinerary[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM itineraries ORDER BY likes DESC').all() as Record<string, unknown>[];

  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    trailName: r.trail_name as string,
    author: r.author as string,
    authorAvatar: r.author_avatar as string,
    totalDays: Number(r.total_days),
    maxAltitude: Number(r.max_altitude),
    difficulty: r.difficulty as string,
    estimatedCostUSD: Number(r.estimated_cost_usd),
    likes: Number(r.likes),
    clones: Number(r.clones),
    days: JSON.parse((r.days_json as string) || '[]')
  }));
}

export function createItinerary(data: {
  id?: string;
  title: string;
  trailName: string;
  author: string;
  authorAvatar?: string;
  totalDays: number;
  maxAltitude: number;
  difficulty: string;
  estimatedCostUSD: number;
  likes?: number;
  clones?: number;
  days: ItineraryDay[];
}): Itinerary {
  const db = getDatabase();
  const id = data.id || `itin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const authorAvatar = data.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
  const likes = data.likes ?? 0;
  const clones = data.clones ?? 0;

  db.prepare(`
    INSERT INTO itineraries (
      id, title, trail_name, author, author_avatar, total_days, max_altitude,
      difficulty, estimated_cost_usd, likes, clones, days_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title,
    data.trailName,
    data.author,
    authorAvatar,
    data.totalDays,
    data.maxAltitude,
    data.difficulty,
    data.estimatedCostUSD,
    likes,
    clones,
    JSON.stringify(data.days || []),
    now
  );

  return {
    id,
    title: data.title,
    trailName: data.trailName,
    author: data.author,
    authorAvatar,
    totalDays: data.totalDays,
    maxAltitude: data.maxAltitude,
    difficulty: data.difficulty,
    estimatedCostUSD: data.estimatedCostUSD,
    likes,
    clones,
    days: data.days || []
  };
}


export function getAllStories(): Story[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM stories ORDER BY created_at DESC').all() as Record<string, unknown>[];

  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    subtitle: r.subtitle as string,
    author: r.author as string,
    authorAvatar: r.author_avatar as string,
    authorRole: r.author_role as string,
    region: r.region as string,
    trailName: r.trail_name as string,
    readTime: r.read_time as string,
    date: r.date as string,
    coverImage: r.cover_image as string,
    content: r.content as string,
    likes: Number(r.likes),
    comments: Number(r.comments)
  }));
}

export function likeStory(storyId: string): number {
  const db = getDatabase();
  db.prepare('UPDATE stories SET likes = likes + 1 WHERE id = ?').run(storyId);
  const row = db.prepare('SELECT likes FROM stories WHERE id = ?').get(storyId) as { likes: number } | undefined;
  return row ? row.likes : 0;
}

export function getWeatherReport(region?: string): WeatherReport {
  const db = getDatabase();
  let row: Record<string, unknown> | undefined;

  if (region) {
    row = db.prepare('SELECT * FROM weather_reports WHERE region = ?').get(region) as Record<string, unknown> | undefined;
  }
  if (!row) {
    row = db.prepare('SELECT * FROM weather_reports ORDER BY updated_at DESC LIMIT 1').get() as Record<string, unknown> | undefined;
  }

  if (!row) {
    return {
      location: 'Khumbu Alpine Region',
      region: 'Everest',
      elevation: 5364,
      tempC: -8,
      feelsLikeC: -15,
      windKm: 25,
      condition: 'Clear Skies',
      avalancheRisk: 'Low (1/5)',
      hazards: []
    };
  }

  return {
    location: row.location as string,
    region: row.region as string,
    elevation: Number(row.elevation),
    tempC: Number(row.temp_c),
    feelsLikeC: Number(row.feels_like_c),
    windKm: Number(row.wind_km),
    condition: row.condition as string,
    avalancheRisk: row.avalanche_risk as string,
    hazards: JSON.parse((row.hazards_json as string) || '[]')
  };
}

export function createBooking(data: {
  trailId: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  startDate: string;
  travelers: number;
  specialRequests?: string;
  totalPrice: number;
}): Booking {
  const db = getDatabase();
  const id = `bkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO bookings (
      id, trail_id, user_id, full_name, email, phone, start_date, travelers,
      special_requests, total_price, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
  `).run(
    id,
    data.trailId,
    data.userId || null,
    data.fullName,
    data.email,
    data.phone,
    data.startDate,
    data.travelers,
    data.specialRequests || null,
    data.totalPrice,
    now
  );

  return {
    id,
    trailId: data.trailId,
    userId: data.userId,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    startDate: data.startDate,
    travelers: data.travelers,
    specialRequests: data.specialRequests,
    totalPrice: data.totalPrice,
    status: 'CONFIRMED',
    createdAt: now
  };
}

export function getBookings(): Booking[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    trailId: r.trail_id as string,
    userId: (r.user_id as string) || undefined,
    fullName: r.full_name as string,
    email: r.email as string,
    phone: r.phone as string,
    startDate: r.start_date as string,
    travelers: Number(r.travelers),
    specialRequests: (r.special_requests as string) || undefined,
    totalPrice: Number(r.total_price),
    status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
    createdAt: r.created_at as string
  }));
}

export function getBookingsByUserId(userId: string): (Booking & { trailName?: string; trailSlug?: string })[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT b.*, t.name as trail_name, t.slug as trail_slug 
    FROM bookings b
    LEFT JOIN trails t ON b.trail_id = t.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(userId) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: r.id as string,
    trailId: r.trail_id as string,
    userId: (r.user_id as string) || undefined,
    fullName: r.full_name as string,
    email: r.email as string,
    phone: r.phone as string,
    startDate: r.start_date as string,
    travelers: Number(r.travelers),
    specialRequests: (r.special_requests as string) || undefined,
    totalPrice: Number(r.total_price),
    status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
    createdAt: r.created_at as string,
    trailName: (r.trail_name as string) || undefined,
    trailSlug: (r.trail_slug as string) || undefined
  }));
}

export function updateBookingStatus(id: string, status: string): boolean {
  const db = getDatabase();
  const result = db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
  return result.changes > 0;
}

export function deleteBooking(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
  return result.changes > 0;
}

export function createContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): ContactMessage {
  const db = getDatabase();
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO contact_messages (id, name, email, subject, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.email, data.subject, data.message, now);

  return {
    id,
    ...data,
    createdAt: now
  };
}

export function getContactMessages(): ContactMessage[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    subject: r.subject as string,
    message: r.message as string,
    status: (r.status as 'UNREAD' | 'READ' | 'RESPONDED') || 'UNREAD',
    createdAt: r.created_at as string
  }));
}

export function updateContactMessageStatus(id: string, status: string): boolean {
  const db = getDatabase();
  const result = db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, id);
  return result.changes > 0;
}

export function deleteContactMessage(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
  return result.changes > 0;
}

export function createSharedTrail(data: {
  title: string;
  region: string;
  elevation: number;
  difficulty: string;
  distance: string;
  duration: string;
  description: string;
  creatorName: string;
  creatorEmail: string;
}): SharedTrail {
  const db = getDatabase();
  const id = `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO shared_trails (
      id, title, region, elevation, difficulty, distance, duration,
      description, creator_name, creator_email, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?)
  `).run(
    id,
    data.title,
    data.region,
    data.elevation,
    data.difficulty,
    data.distance,
    data.duration,
    data.description,
    data.creatorName,
    data.creatorEmail,
    now
  );

  return {
    id,
    ...data,
    status: 'APPROVED',
    createdAt: now
  };
}

export function getSharedTrails(): SharedTrail[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM shared_trails ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    region: r.region as string,
    elevation: Number(r.elevation),
    difficulty: r.difficulty as string,
    distance: r.distance as string,
    duration: r.duration as string,
    description: r.description as string,
    creatorName: r.creator_name as string,
    creatorEmail: r.creator_email as string,
    status: r.status as 'PENDING' | 'APPROVED',
    createdAt: r.created_at as string
  }));
}

export function createUser(data: { name: string; email: string; passwordHash: string; role?: 'ADMIN' | 'GUIDE' | 'TREKKER' }): User {
  const db = getDatabase();
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const role = data.role || 'TREKKER';

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.email.toLowerCase(), data.passwordHash, role, now);

  return {
    id,
    name: data.name,
    email: data.email.toLowerCase(),
    role,
    createdAt: now
  };
}

export function getUserByEmail(email: string): (User & { passwordHash: string }) | null {
  const db = getDatabase();
  const r = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as Record<string, unknown> | undefined;
  if (!r) return null;

  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    role: r.role as 'ADMIN' | 'GUIDE' | 'TREKKER',
    passwordHash: r.password_hash as string,
    createdAt: r.created_at as string
  };
}

export function getUserById(id: string): User | null {
  const db = getDatabase();
  const r = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!r) return null;

  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    role: r.role as 'ADMIN' | 'GUIDE' | 'TREKKER',
    createdAt: r.created_at as string
  };
}

export function createInquiry(data: {
  trailId: string;
  trailName: string;
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  groupSize: number;
  preferredStartDate?: string;
  fitnessLevel?: string;
  notes?: string;
}): { id: string; createdAt: string } {
  const db = getDatabase();
  const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO inquiries (
      id, trail_id, trail_name, full_name, email, phone, country,
      group_size, preferred_start_date, fitness_level, notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
  `).run(
    id,
    data.trailId,
    data.trailName,
    data.fullName,
    data.email,
    data.phone || null,
    data.country || null,
    data.groupSize,
    data.preferredStartDate || null,
    data.fitnessLevel || null,
    data.notes || null,
    now
  );

  return { id, createdAt: now };
}

export function getInquiries(): Inquiry[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    trailId: r.trail_id as string,
    trailName: r.trail_name as string,
    fullName: r.full_name as string,
    email: r.email as string,
    phone: (r.phone as string) || undefined,
    country: (r.country as string) || undefined,
    groupSize: Number(r.group_size),
    preferredStartDate: (r.preferred_start_date as string) || undefined,
    fitnessLevel: (r.fitness_level as string) || undefined,
    notes: (r.notes as string) || undefined,
    status: (r.status as 'PENDING' | 'CONFIRMED' | 'CONTACTED' | 'CANCELLED') || 'PENDING',
    createdAt: r.created_at as string
  }));
}

export function updateInquiryStatus(id: string, status: string): boolean {
  const db = getDatabase();
  const result = db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, id);
  return result.changes > 0;
}

export function deleteInquiry(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
  return result.changes > 0;
}

