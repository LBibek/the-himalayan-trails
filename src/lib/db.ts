import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import type { Trail, Landmark, Itinerary, ItineraryDay, Story, WeatherReport, Booking, ContactMessage, Inquiry, SharedTrail, User, HimalayanRange, Guide, Teahouse, TeahouseReservation, TrailConditionReport, HighAltitudeCertificate, GroupExpedition, GroupMember, GroupExpeditionWithDetails, GroupSideTripOption, GroupGearOption, GroupSideTripTally, GearManifest, ManifestItemEntry, ExpeditionMessage } from '../types';
import crypto from 'node:crypto';

export function generateGroupReceiptNumber(): string {
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `REC-2026-GRP-${digits}`;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

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

export function initializeSchema(db: DatabaseSync) {
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

  // Ensure baseline weather telemetry exists for all 4 key Himalayan regions
  try {
    const insertReport = db.prepare(`
      INSERT OR IGNORE INTO weather_reports (
        id, location, region, elevation, temp_c, feels_like_c, wind_km,
        condition, avalanche_risk, hazards_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    const now = new Date().toISOString();
    insertReport.run('wr-everest', 'Gorak Shep & EBC Base', 'Everest', 5364, -9, -16, 34, 'Severe Frost & Clear Skies', 'Moderate (2/5)', JSON.stringify([
      { id: 'hz-1', type: 'Icy Ridges', severity: 'Moderate', location: 'Lobuche to Gorak Shep lateral moraine', description: 'Black ice under dusting of snow. Microspikes advised between km 56 and 59.', updatedAt: '2 hours ago' },
      { id: 'hz-2', type: 'Blizzard Warning', severity: 'High', location: 'South Col (7,900m+)', description: 'Gale force jetstream depression arriving over Khumbu summit ridges late afternoon.', updatedAt: '35 mins ago' }
    ]), now);
    insertReport.run('wr-annapurna', 'Thorong Phedi & High Camp', 'Annapurna', 4850, -6, -12, 28, 'Partly Cloudy', 'Moderate (2/5)', JSON.stringify([
      { id: 'hz-3', type: 'Landslide', severity: 'High', location: 'Thorong Phedi Scree Gully', description: 'Active scree movement reported by morning porters. Wear helmets and do not stop in gully.', updatedAt: '1 hour ago' }
    ]), now);
    insertReport.run('wr-manaslu', 'Dharmasala & Larkya Base', 'Manaslu', 4460, -11, -19, 34, 'Clear & Cold', 'Moderate (2/5)', JSON.stringify([
      { id: 'hz-manaslu-1', type: 'Freeze Alert', severity: 'Moderate', location: 'Larkya Glacier Moraine', description: 'Sub-zero verglas over glacial stones before dawn. Early crossing mandatory.', updatedAt: '1 hour ago' }
    ]), now);
    insertReport.run('wr-langtang', 'Kyanjin Gompa & Langshisha', 'Langtang', 3870, -4, -8, 22, 'Partly Sunny', 'Low (1/5)', JSON.stringify([
      { id: 'hz-langtang-1', type: 'Rockfall', severity: 'Low', location: 'Langtang Valley Upper Gorge', description: 'Minor loose rocks on switchbacks above Rimche. Standard caution advised.', updatedAt: '3 hours ago' }
    ]), now);
  } catch {}

  // Guides table
  db.exec(`
    CREATE TABLE IF NOT EXISTS guides (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sherpa_clan TEXT,
      certification TEXT NOT NULL,
      license_number TEXT UNIQUE NOT NULL,
      summit_count INTEGER NOT NULL DEFAULT 0,
      specialties TEXT NOT NULL, -- JSON array
      languages TEXT NOT NULL, -- JSON array
      daily_rate_usd REAL NOT NULL,
      rating REAL NOT NULL DEFAULT 5.0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      avatar_image TEXT NOT NULL,
      bio TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
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
      payment_option TEXT DEFAULT 'FULL',
      deposit_amount REAL DEFAULT 0,
      remaining_balance REAL DEFAULT 0,
      base_price REAL DEFAULT 0,
      permit_fee REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      receipt_number TEXT,
      invoice_breakdown TEXT,
      emergency_contact TEXT,
      guide_id TEXT,
      porter_count INTEGER DEFAULT 0,
      total_gear_weight_kg REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE,
      FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE SET NULL
    );
  `);

  // Migration for bookings columns if missing in existing database
  const bookingCols = [
    "ALTER TABLE bookings ADD COLUMN payment_option TEXT DEFAULT 'FULL';",
    "ALTER TABLE bookings ADD COLUMN deposit_amount REAL DEFAULT 0;",
    "ALTER TABLE bookings ADD COLUMN remaining_balance REAL DEFAULT 0;",
    "ALTER TABLE bookings ADD COLUMN base_price REAL DEFAULT 0;",
    "ALTER TABLE bookings ADD COLUMN permit_fee REAL DEFAULT 0;",
    "ALTER TABLE bookings ADD COLUMN tax_amount REAL DEFAULT 0;",
    "ALTER TABLE bookings ADD COLUMN receipt_number TEXT;",
    "ALTER TABLE bookings ADD COLUMN invoice_breakdown TEXT;",
    "ALTER TABLE bookings ADD COLUMN emergency_contact TEXT;",
    "ALTER TABLE bookings ADD COLUMN guide_id TEXT;",
    "ALTER TABLE bookings ADD COLUMN porter_count INTEGER DEFAULT 0;",
    "ALTER TABLE bookings ADD COLUMN total_gear_weight_kg REAL DEFAULT 0;"
  ];
  for (const colSql of bookingCols) {
    try {
      db.exec(colSql);
    } catch {
      // Column already exists
    }
  }

  // Reviews table - supports authenticated users as well as public explorer reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      trail_id TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT,
      user_email TEXT,
      user_avatar TEXT,
      overall_rating REAL NOT NULL,
      difficulty_rating INTEGER NOT NULL,
      scenic_rating INTEGER,
      safety_rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      photos_json TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      reviewer_name TEXT,
      scenery_rating INTEGER,
      condition_tags TEXT,
      FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migration for reviews columns if missing in existing database
  const reviewCols = [
    "ALTER TABLE reviews ADD COLUMN reviewer_name TEXT;",
    "ALTER TABLE reviews ADD COLUMN scenery_rating INTEGER;",
    "ALTER TABLE reviews ADD COLUMN condition_tags TEXT;"
  ];
  for (const colSql of reviewCols) {
    try {
      db.exec(colSql);
    } catch {
      // Column already exists
    }
  }

  // Ensure reviews table user_id is nullable for guest submissions
  try {
    const tableInfo = db.prepare("PRAGMA table_info(reviews);").all() as { name: string; notnull: number }[];
    const userIdCol = tableInfo.find((c) => c.name === 'user_id');
    if (userIdCol && userIdCol.notnull === 1) {
      db.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE reviews_migration_temp (
          id TEXT PRIMARY KEY,
          trail_id TEXT NOT NULL,
          user_id TEXT,
          user_name TEXT,
          user_email TEXT,
          user_avatar TEXT,
          overall_rating REAL NOT NULL,
          difficulty_rating INTEGER NOT NULL,
          scenic_rating INTEGER,
          safety_rating INTEGER NOT NULL,
          comment TEXT NOT NULL,
          photos_json TEXT,
          is_verified INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          reviewer_name TEXT,
          scenery_rating INTEGER,
          condition_tags TEXT,
          FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        INSERT INTO reviews_migration_temp (
          id, trail_id, user_id, user_name, user_email, user_avatar,
          overall_rating, difficulty_rating, scenic_rating, safety_rating,
          comment, photos_json, is_verified, created_at, reviewer_name,
          scenery_rating, condition_tags
        )
        SELECT
          id, trail_id, user_id, user_name, user_email, user_avatar,
          overall_rating, difficulty_rating, scenic_rating, safety_rating,
          comment, photos_json, is_verified, created_at,
          COALESCE(reviewer_name, user_name),
          COALESCE(scenery_rating, scenic_rating),
          condition_tags
        FROM reviews;
        DROP TABLE reviews;
        ALTER TABLE reviews_migration_temp RENAME TO reviews;
        PRAGMA foreign_keys = ON;
      `);
    }
  } catch {}

  // User badges table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      badge_name TEXT NOT NULL,
      badge_description TEXT NOT NULL,
      badge_icon TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, badge_id)
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

  // Teahouses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teahouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      village TEXT NOT NULL,
      elevation INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      room_types TEXT NOT NULL,
      price_per_night_usd REAL NOT NULL,
      amenities TEXT NOT NULL,
      food_menu TEXT NOT NULL,
      contact_phone TEXT,
      host_name TEXT,
      rating REAL NOT NULL DEFAULT 4.8,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      cover_image TEXT NOT NULL,
      is_verified INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // Teahouse reservations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS teahouse_reservations (
      id TEXT PRIMARY KEY,
      teahouse_id TEXT NOT NULL,
      user_id TEXT,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT,
      check_in_date TEXT NOT NULL,
      guests_count INTEGER NOT NULL,
      room_type TEXT NOT NULL,
      dietary_notes TEXT,
      total_price_usd REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at TEXT NOT NULL,
      FOREIGN KEY (teahouse_id) REFERENCES teahouses(id) ON DELETE CASCADE
    );
  `);

  // Trail condition reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trail_condition_reports (
      id TEXT PRIMARY KEY,
      trail_id TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_role TEXT NOT NULL,
      status_level TEXT NOT NULL,
      condition_type TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      location_name TEXT NOT NULL,
      elevation INTEGER NOT NULL,
      notes TEXT NOT NULL,
      gear_recommended TEXT,
      upvotes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // High-Altitude Completion Certificates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL UNIQUE,
      verification_code TEXT NOT NULL UNIQUE,
      adventurer_name TEXT NOT NULL,
      trail_name TEXT NOT NULL,
      trail_slug TEXT NOT NULL,
      max_elevation INTEGER NOT NULL,
      total_distance_km REAL NOT NULL,
      completion_date TEXT NOT NULL,
      chief_guide_name TEXT NOT NULL,
      chief_guide_title TEXT NOT NULL,
      digital_signature_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );
  `);

  // Group Expeditions table (Sprint 8.3)
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_expeditions (
      id TEXT PRIMARY KEY,
      share_token TEXT UNIQUE NOT NULL,
      trail_id TEXT NOT NULL,
      leader_user_id TEXT,
      leader_name TEXT NOT NULL,
      leader_email TEXT NOT NULL,
      expedition_title TEXT NOT NULL,
      target_start_date TEXT NOT NULL,
      target_group_size INTEGER NOT NULL,
      itinerary_customization TEXT,
      status TEXT NOT NULL DEFAULT 'ORGANIZING',
      created_at TEXT NOT NULL
    );
  `);

  // Group Members table (Sprint 8.3)
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      expedition_id TEXT NOT NULL,
      member_name TEXT NOT NULL,
      member_email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      side_trip_votes TEXT,
      personal_gear_rentals TEXT,
      share_amount_usd REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'UNPAID',
      receipt_number TEXT,
      paid_at TEXT,
      joined_at TEXT NOT NULL,
      FOREIGN KEY (expedition_id) REFERENCES group_expeditions(id) ON DELETE CASCADE
    );
  `);

  // Gear Manifests table (Sprint 9.1 - Porter Ethics & Load Balancer)
  db.exec(`
    CREATE TABLE IF NOT EXISTS gear_manifests (
      id TEXT PRIMARY KEY,
      expedition_id TEXT,
      booking_id TEXT,
      trekker_name TEXT NOT NULL,
      trekker_email TEXT,
      body_weight_kg REAL NOT NULL DEFAULT 70.0,
      target_altitude_m INTEGER NOT NULL DEFAULT 4500,
      group_size INTEGER NOT NULL DEFAULT 1,
      daypack_weight_kg REAL NOT NULL,
      duffel_weight_kg REAL NOT NULL,
      total_weight_kg REAL NOT NULL,
      effective_exertion_kg REAL NOT NULL,
      porter_count_recommended INTEGER NOT NULL DEFAULT 1,
      ippg_compliance TEXT NOT NULL DEFAULT 'COMPLIANT',
      items_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Expedition Messages / Team Dispatch Chat table (Sprint 9.2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS expedition_messages (
      id TEXT PRIMARY KEY,
      expedition_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_email TEXT,
      sender_role TEXT NOT NULL DEFAULT 'MEMBER',
      message_text TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'GENERAL',
      created_at TEXT NOT NULL,
      FOREIGN KEY (expedition_id) REFERENCES group_expeditions(id) ON DELETE CASCADE
    );
  `);



  // Ensure route_coordinates column exists on trails table
  try {
    db.exec('ALTER TABLE trails ADD COLUMN route_coordinates TEXT;');
  } catch {
    // Column already exists
  }

  seedInitialDataIfEmpty(db);

  // Ensure official guides are seeded if table is empty
  try {
    const guideCount = db.prepare('SELECT COUNT(*) as count FROM guides').get() as { count: number };
    if (!guideCount || guideCount.count === 0) {
      seedOfficialGuides(db);
    }
  } catch {
    // ignore
  }

  // Ensure official teahouses are seeded if table is empty
  try {
    const teahouseCount = db.prepare('SELECT COUNT(*) as count FROM teahouses').get() as { count: number };
    if (!teahouseCount || teahouseCount.count === 0) {
      seedOfficialTeahouses(db);
    }
  } catch {
    // ignore
  }

  // Ensure official trail condition reports are seeded if table is empty
  try {
    const condCount = db.prepare('SELECT COUNT(*) as count FROM trail_condition_reports').get() as { count: number };
    if (!condCount || condCount.count === 0) {
      seedOfficialTrailConditionReports(db);
    }
  } catch {
    // ignore
  }

  // Ensure authentic group expeditions are seeded if table is empty
  try {
    const expCount = db.prepare('SELECT COUNT(*) as count FROM group_expeditions').get() as { count: number };
    if (!expCount || expCount.count === 0) {
      seedOfficialGroupExpeditions(db);
    }
  } catch {
    // ignore
  }

  // Ensure authentic gear manifests are seeded if table is empty
  try {
    const manCount = db.prepare('SELECT COUNT(*) as count FROM gear_manifests').get() as { count: number };
    if (!manCount || manCount.count === 0) {
      seedOfficialGearManifests(db);
    }
  } catch {
    // ignore
  }

  // Ensure authentic expedition messages are seeded if table is empty
  try {
    const msgCount = db.prepare('SELECT COUNT(*) as count FROM expedition_messages').get() as { count: number };
    if (!msgCount || msgCount.count === 0) {
      seedOfficialExpeditionMessages(db);
    }
  } catch {
    // ignore
  }
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
      id: 'gokyo-ri-cho-la',
      slug: 'gokyo-ri-cho-la',
      name: 'Gokyo Ri & Cho La Pass Expedition',
      region: 'Everest',
      difficulty: 'Challenging',
      distanceKm: 98,
      durationDays: 13,
      maxElevation: 5420,
      elevationGain: 4200,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      description: 'Stunning alpine traverse through Gokyo Sacred Lakes, summiting Gokyo Ri (5,357m) and crossing the glaciated Cho La Pass (5,420m) into the Khumbu Valley.',
      highlights: ['Gokyo Sacred Lakes (Dudh Pokhari)', 'Gokyo Ri Summit (5,357m)', 'Glaciated Cho La Pass (5,420m)', 'Ngozumpa Glacier traverse'],
      bestMonths: ['Mar-May', 'Oct-Nov'],
      startPoint: 'Lukla (2,860m)',
      endPoint: 'Lukla (2,860m)',
      rating: 4.9,
      reviewsCount: 164,
      elevationProfile: [
        { distanceKm: 0, elevation: 2860, label: 'Lukla Trailhead' },
        { distanceKm: 8, elevation: 2610, label: 'Phakding' },
        { distanceKm: 19, elevation: 3440, label: 'Namche Bazaar' },
        { distanceKm: 31, elevation: 4110, label: 'Dole' },
        { distanceKm: 39, elevation: 4470, label: 'Machhermo' },
        { distanceKm: 46, elevation: 4790, label: 'Gokyo Lakes' },
        { distanceKm: 55, elevation: 5357, label: 'Gokyo Ri Summit' },
        { distanceKm: 65, elevation: 5420, label: 'Cho La Pass' },
        { distanceKm: 71, elevation: 4830, label: 'Dzongla' },
        { distanceKm: 83, elevation: 5164, label: 'Gorak Shep' },
        { distanceKm: 98, elevation: 2860, label: 'Return Lukla' }
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
    },
    {
      id: 'wr-manaslu',
      location: 'Dharmasala & Larkya Base',
      region: 'Manaslu',
      elevation: 4460,
      tempC: -11,
      feelsLikeC: -19,
      windKm: 34,
      condition: 'Clear & Cold',
      avalancheRisk: 'Moderate (2/5)',
      hazards: [
        {
          id: 'hz-manaslu-1',
          type: 'Freeze Alert',
          severity: 'Moderate',
          location: 'Larkya Glacier Moraine',
          description: 'Sub-zero verglas over glacial stones before dawn. Early crossing mandatory.',
          updatedAt: '1 hour ago'
        }
      ]
    },
    {
      id: 'wr-langtang',
      location: 'Kyanjin Gompa & Langshisha',
      region: 'Langtang',
      elevation: 3870,
      tempC: -4,
      feelsLikeC: -8,
      windKm: 22,
      condition: 'Partly Sunny',
      avalancheRisk: 'Low (1/5)',
      hazards: [
        {
          id: 'hz-langtang-1',
          type: 'Rockfall',
          severity: 'Low',
          location: 'Langtang Valley Upper Gorge',
          description: 'Minor loose rocks on switchbacks above Rimche. Standard caution advised.',
          updatedAt: '3 hours ago'
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

export function getTrailById(id: string): Trail | null {
  return getTrailBySlug(id);
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

export function getLandmarkById(id: string): Landmark | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM landmarks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    name: row.name as string,
    nativeName: (row.native_name as string) || undefined,
    category: row.category as string,
    elevation: Number(row.elevation),
    region: row.region as string,
    coordinates: {
      lat: Number(row.latitude),
      lng: Number(row.longitude)
    },
    image: row.image as string,
    description: row.description as string,
    permitRequired: row.permit_required as string,
    associatedTrail: row.associated_trail as string
  };
}

export function createLandmark(data: {
  name: string;
  nativeName?: string;
  category: string;
  elevation: number;
  region: string;
  coordinates: { lat: number; lng: number };
  image?: string;
  description: string;
  permitRequired?: string;
  associatedTrail?: string;
  id?: string;
}): Landmark {
  const db = getDatabase();
  const id = data.id || `lm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO landmarks (
      id, name, native_name, category, elevation, region,
      latitude, longitude, image, description, permit_required,
      associated_trail, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.name,
    data.nativeName || null,
    data.category,
    Math.round(data.elevation),
    data.region,
    data.coordinates.lat,
    data.coordinates.lng,
    data.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80',
    data.description || `${data.name} landmark situated in the ${data.region} region.`,
    data.permitRequired || 'None',
    data.associatedTrail || 'All Trails',
    now
  );

  return {
    id,
    name: data.name,
    nativeName: data.nativeName,
    category: data.category,
    elevation: Math.round(data.elevation),
    region: data.region,
    coordinates: data.coordinates,
    image: data.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80',
    description: data.description || `${data.name} landmark situated in the ${data.region} region.`,
    permitRequired: data.permitRequired || 'None',
    associatedTrail: data.associatedTrail || 'All Trails'
  };
}

export function deleteLandmark(id: string): boolean {
  const db = getDatabase();
  const res = db.prepare('DELETE FROM landmarks WHERE id = ?').run(id);
  return res.changes > 0;
}

export function updateLandmark(id: string, updates: Partial<Landmark>): Landmark | null {
  const db = getDatabase();
  const existing = getLandmarkById(id);
  if (!existing) return null;

  const updatedName = updates.name ?? existing.name;
  const updatedNativeName = updates.nativeName !== undefined ? updates.nativeName : existing.nativeName;
  const updatedCategory = updates.category ?? existing.category;
  const updatedElevation = updates.elevation ?? existing.elevation;
  const updatedRegion = updates.region ?? existing.region;
  const updatedLat = updates.coordinates?.lat ?? existing.coordinates.lat;
  const updatedLng = updates.coordinates?.lng ?? existing.coordinates.lng;
  const updatedImage = updates.image ?? existing.image;
  const updatedDescription = updates.description ?? existing.description;
  const updatedPermit = updates.permitRequired ?? existing.permitRequired;
  const updatedTrail = updates.associatedTrail ?? existing.associatedTrail;

  db.prepare(`
    UPDATE landmarks
    SET name = ?, native_name = ?, category = ?, elevation = ?, region = ?,
        latitude = ?, longitude = ?, image = ?, description = ?,
        permit_required = ?, associated_trail = ?
    WHERE id = ?
  `).run(
    updatedName,
    updatedNativeName || null,
    updatedCategory,
    Math.round(updatedElevation),
    updatedRegion,
    updatedLat,
    updatedLng,
    updatedImage,
    updatedDescription,
    updatedPermit,
    updatedTrail,
    id
  );

  return getLandmarkById(id);
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

  if (region && region.toLowerCase() !== 'all') {
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

export function getWeatherReports(): WeatherReport[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM weather_reports ORDER BY region ASC').all() as Record<string, unknown>[];
  return rows.map((row) => ({
    location: row.location as string,
    region: row.region as string,
    elevation: Number(row.elevation),
    tempC: Number(row.temp_c),
    feelsLikeC: Number(row.feels_like_c),
    windKm: Number(row.wind_km),
    condition: row.condition as string,
    avalancheRisk: row.avalanche_risk as string,
    hazards: JSON.parse((row.hazards_json as string) || '[]')
  }));
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
  paymentOption?: 'FULL' | 'DEPOSIT';
  depositAmount?: number;
  remainingBalance?: number;
  basePrice?: number;
  permitFee?: number;
  taxAmount?: number;
  receiptNumber?: string;
  invoiceBreakdown?: string;
  emergencyContact?: string;
  guideId?: string;
  porterCount?: number;
  totalGearWeightKg?: number;
}): Booking {
  const db = getDatabase();
  const id = `bkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const paymentOption = data.paymentOption || 'FULL';
  const depositAmount = data.depositAmount ?? (paymentOption === 'DEPOSIT' ? Math.round(data.totalPrice * 0.25 * 100) / 100 : data.totalPrice);
  const remainingBalance = data.remainingBalance ?? (paymentOption === 'DEPOSIT' ? Math.round((data.totalPrice - depositAmount) * 100) / 100 : 0);
  const basePrice = data.basePrice ?? data.totalPrice;
  const permitFee = data.permitFee ?? 0;
  const taxAmount = data.taxAmount ?? 0;
  const randomFive = Math.floor(10000 + Math.random() * 90000);
  const receiptNumber = data.receiptNumber || `REC-2026-${randomFive}`;
  const invoiceBreakdown = data.invoiceBreakdown || null;
  const emergencyContact = data.emergencyContact || null;
  const guideId = data.guideId || null;
  const porterCount = data.porterCount ?? 0;
  const totalGearWeightKg = data.totalGearWeightKg ?? 0;

  db.prepare(`
    INSERT INTO bookings (
      id, trail_id, user_id, full_name, email, phone, start_date, travelers,
      special_requests, total_price, status, payment_option, deposit_amount,
      remaining_balance, base_price, permit_fee, tax_amount, receipt_number,
      invoice_breakdown, emergency_contact, guide_id, porter_count, total_gear_weight_kg, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    paymentOption,
    depositAmount,
    remainingBalance,
    basePrice,
    permitFee,
    taxAmount,
    receiptNumber,
    invoiceBreakdown,
    emergencyContact,
    guideId,
    porterCount,
    totalGearWeightKg,
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
    paymentOption,
    depositAmount,
    remainingBalance,
    basePrice,
    permitFee,
    taxAmount,
    receiptNumber,
    invoiceBreakdown: invoiceBreakdown || undefined,
    emergencyContact: data.emergencyContact,
    guideId: data.guideId,
    porterCount,
    totalGearWeightKg,
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
    paymentOption: (r.payment_option as 'FULL' | 'DEPOSIT') || 'FULL',
    depositAmount: Number(r.deposit_amount || 0),
    remainingBalance: Number(r.remaining_balance || 0),
    basePrice: Number(r.base_price || 0),
    permitFee: Number(r.permit_fee || 0),
    taxAmount: Number(r.tax_amount || 0),
    receiptNumber: (r.receipt_number as string) || undefined,
    invoiceBreakdown: (r.invoice_breakdown as string) || undefined,
    emergencyContact: (r.emergency_contact as string) || undefined,
    guideId: (r.guide_id as string) || undefined,
    porterCount: Number(r.porter_count || 0),
    totalGearWeightKg: Number(r.total_gear_weight_kg || 0),
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
    paymentOption: (r.payment_option as 'FULL' | 'DEPOSIT') || 'FULL',
    depositAmount: Number(r.deposit_amount || 0),
    remainingBalance: Number(r.remaining_balance || 0),
    basePrice: Number(r.base_price || 0),
    permitFee: Number(r.permit_fee || 0),
    taxAmount: Number(r.tax_amount || 0),
    receiptNumber: (r.receipt_number as string) || undefined,
    invoiceBreakdown: (r.invoice_breakdown as string) || undefined,
    emergencyContact: (r.emergency_contact as string) || undefined,
    guideId: (r.guide_id as string) || undefined,
    porterCount: Number(r.porter_count || 0),
    totalGearWeightKg: Number(r.total_gear_weight_kg || 0),
    status: r.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
    createdAt: r.created_at as string,
    trailName: (r.trail_name as string) || undefined,
    trailSlug: (r.trail_slug as string) || undefined
  }));
}

export function getBookingById(id: string): (Booking & {
  trailName?: string;
  trailSlug?: string;
  region?: string;
  startPoint?: string;
  endPoint?: string;
  durationDays?: number;
  maxElevation?: number;
  trailDistanceKm?: number;
  image?: string;
  guideName?: string;
  guideLicense?: string;
  guideCertification?: string;
  guideAvatar?: string;
}) | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT b.*,
           t.name as trail_name,
           t.slug as trail_slug,
           t.region as trail_region,
           t.start_point as trail_start_point,
           t.end_point as trail_end_point,
           t.duration_days as trail_duration_days,
           t.max_elevation as trail_max_elevation,
           t.distance_km as trail_distance_km,
           t.image as trail_image,
           g.name as guide_name,
           g.license_number as guide_license,
           g.certification as guide_certification,
           g.avatar_image as guide_avatar
    FROM bookings b
    LEFT JOIN trails t ON b.trail_id = t.id
    LEFT JOIN guides g ON b.guide_id = g.id
    WHERE b.id = ? OR b.receipt_number = ?
  `).get(id, id) as Record<string, unknown> | undefined;

  if (!row) return null;

  return {
    id: row.id as string,
    trailId: row.trail_id as string,
    userId: (row.user_id as string) || undefined,
    fullName: row.full_name as string,
    email: row.email as string,
    phone: row.phone as string,
    startDate: row.start_date as string,
    travelers: Number(row.travelers),
    specialRequests: (row.special_requests as string) || undefined,
    totalPrice: Number(row.total_price),
    paymentOption: (row.payment_option as 'FULL' | 'DEPOSIT') || 'FULL',
    depositAmount: Number(row.deposit_amount || 0),
    remainingBalance: Number(row.remaining_balance || 0),
    basePrice: Number(row.base_price || 0),
    permitFee: Number(row.permit_fee || 0),
    taxAmount: Number(row.tax_amount || 0),
    receiptNumber: (row.receipt_number as string) || undefined,
    invoiceBreakdown: (row.invoice_breakdown as string) || undefined,
    emergencyContact: (row.emergency_contact as string) || undefined,
    guideId: (row.guide_id as string) || undefined,
    porterCount: Number(row.porter_count || 0),
    totalGearWeightKg: Number(row.total_gear_weight_kg || 0),
    status: row.status as 'CONFIRMED' | 'PENDING' | 'CANCELLED',
    createdAt: row.created_at as string,
    trailName: (row.trail_name as string) || undefined,
    trailSlug: (row.trail_slug as string) || undefined,
    region: (row.trail_region as string) || undefined,
    startPoint: (row.trail_start_point as string) || undefined,
    endPoint: (row.trail_end_point as string) || undefined,
    durationDays: row.trail_duration_days ? Number(row.trail_duration_days) : undefined,
    maxElevation: row.trail_max_elevation ? Number(row.trail_max_elevation) : undefined,
    trailDistanceKm: row.trail_distance_km ? Number(row.trail_distance_km) : undefined,
    image: (row.trail_image as string) || undefined,
    guideName: (row.guide_name as string) || undefined,
    guideLicense: (row.guide_license as string) || undefined,
    guideCertification: (row.guide_certification as string) || undefined,
    guideAvatar: (row.guide_avatar as string) || undefined
  };
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

// ───────────────────────────────────────────────────────────────
// Certified Sherpa Guides Catalog & Persistence
// ───────────────────────────────────────────────────────────────

function mapGuideRow(r: Record<string, unknown>): Guide {
  return {
    id: r.id as string,
    name: r.name as string,
    sherpaClan: (r.sherpa_clan as string) || undefined,
    certification: r.certification as string,
    licenseNumber: r.license_number as string,
    summitCount: Number(r.summit_count || 0),
    specialties: JSON.parse((r.specialties as string) || '[]'),
    languages: JSON.parse((r.languages as string) || '[]'),
    dailyRateUsd: Number(r.daily_rate_usd),
    rating: Number(r.rating || 5.0),
    reviewsCount: Number(r.reviews_count || 0),
    avatarImage: r.avatar_image as string,
    bio: r.bio as string,
    isAvailable: Number(r.is_available) === 1,
    createdAt: r.created_at as string
  };
}

export function getGuides(filters?: {
  certification?: string;
  region?: string;
  isAvailable?: boolean;
}): Guide[] {
  const db = getDatabase();
  let query = 'SELECT * FROM guides WHERE 1=1';
  const params: (string | number)[] = [];

  if (filters?.certification && filters.certification !== 'All') {
    query += ' AND certification LIKE ?';
    params.push(`%${filters.certification}%`);
  }

  if (filters?.region && filters.region !== 'All') {
    query += ' AND (specialties LIKE ? OR sherpa_clan LIKE ?)';
    params.push(`%${filters.region}%`, `%${filters.region}%`);
  }

  if (filters?.isAvailable !== undefined) {
    query += ' AND is_available = ?';
    params.push(filters.isAvailable ? 1 : 0);
  }

  query += ' ORDER BY rating DESC, summit_count DESC';

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  return rows.map(mapGuideRow);
}

export function getGuideById(id: string): Guide | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM guides WHERE id = ? OR license_number = ?').get(id, id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapGuideRow(row);
}

export function createGuide(data: Omit<Guide, 'rating' | 'reviewsCount'> & {
  rating?: number;
  reviewsCount?: number;
}): Guide {
  const db = getDatabase();
  const id = data.id || `guide-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const rating = data.rating ?? 5.0;
  const reviewsCount = data.reviewsCount ?? 0;
  const isAvailable = data.isAvailable ? 1 : 0;

  db.prepare(`
    INSERT INTO guides (
      id, name, sherpa_clan, certification, license_number, summit_count,
      specialties, languages, daily_rate_usd, rating, reviews_count,
      avatar_image, bio, is_available, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.sherpaClan || null,
    data.certification,
    data.licenseNumber,
    data.summitCount,
    JSON.stringify(data.specialties),
    JSON.stringify(data.languages),
    data.dailyRateUsd,
    rating,
    reviewsCount,
    data.avatarImage,
    data.bio,
    isAvailable,
    now
  );

  return {
    ...data,
    id,
    rating,
    reviewsCount,
    createdAt: now
  };
}

export function seedOfficialGuides(db: DatabaseSync) {
  const insertGuide = db.prepare(`
    INSERT OR IGNORE INTO guides (
      id, name, sherpa_clan, certification, license_number, summit_count,
      specialties, languages, daily_rate_usd, rating, reviews_count,
      avatar_image, bio, is_available, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const guides = [
    {
      id: 'guide-pasang-dawa',
      name: 'Pasang Dawa Sherpa',
      sherpaClan: 'Khumbu Sherpa',
      certification: 'IFMGA / UIAGM',
      licenseNumber: 'IFMGA-NP-012',
      summitCount: 18,
      specialties: ['Everest & Khumbu High Passes', 'High-Altitude Rescue', 'Glacier Navigation'],
      languages: ['Sherpa', 'Nepali', 'English', 'French'],
      dailyRateUsd: 120,
      rating: 5.0,
      reviewsCount: 48,
      avatarImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=80',
      bio: 'Senior IFMGA/UIAGM mountain guide from Pangboche with 18 successful Everest ascents. Renowned for icefall navigation and high-altitude emergency safety across the Mahalangur Himal.',
      isAvailable: 1
    },
    {
      id: 'guide-dawa-yangzum',
      name: 'Dawa Yangzum Sherpa',
      sherpaClan: 'Rolwaling Sherpa',
      certification: 'IFMGA / UIAGM',
      licenseNumber: 'IFMGA-NP-018',
      summitCount: 14,
      specialties: ['Makalu & K2 Technical Alpine', 'High-Altitude Leadership', 'Female Alpinist Mentorship'],
      languages: ['Sherpa', 'Nepali', 'English', 'Spanish'],
      dailyRateUsd: 135,
      rating: 5.0,
      reviewsCount: 56,
      avatarImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      bio: 'Nepal’s premier female IFMGA certified guide from the Rolwaling Valley. Climbed Everest, K2, Annapurna, and Makalu, specializing in technical mixed climbs and expedition leadership.',
      isAvailable: 1
    },
    {
      id: 'guide-mingma-dorchi',
      name: 'Mingma Dorchi Sherpa',
      sherpaClan: 'Solu Sherpa',
      certification: 'IFMGA / UIAGM',
      licenseNumber: 'IFMGA-NP-024',
      summitCount: 21,
      specialties: ['Speed Ascents & Ridge Traverses', 'Annapurna & Dhaulagiri Expeditions', 'Extreme Weather Tactics'],
      languages: ['Sherpa', 'Nepali', 'English', 'German'],
      dailyRateUsd: 130,
      rating: 4.9,
      reviewsCount: 42,
      avatarImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Guinness World Record holder for speed climbs between Everest and Lhotse. Decades of elite guiding experience on technical 8000m peaks and the high passes of Annapurna and Dhaulagiri.',
      isAvailable: 1
    },
    {
      id: 'guide-lakpa-nuru',
      name: 'Lakpa Nuru Sherpa',
      sherpaClan: 'Rolwaling Sherpa',
      certification: 'NNMGA Certified Alpine Guide',
      licenseNumber: 'NNMGA-G-2018',
      summitCount: 9,
      specialties: ['Rolwaling & Manaslu Circuit', 'Wilderness First Responder (WFR)', 'Crevasse Rescue'],
      languages: ['Sherpa', 'Nepali', 'English'],
      dailyRateUsd: 95,
      rating: 4.9,
      reviewsCount: 38,
      avatarImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'NNMGA Certified Alpine Guide and certified Wilderness First Responder with extensive route-finding expertise across the rugged Larkya La and Tashi Lapcha high passes.',
      isAvailable: 1
    },
    {
      id: 'guide-pemba-tshering',
      name: 'Pemba Tshering Sherpa',
      sherpaClan: 'Solu Sherpa',
      certification: 'NMA National Guide',
      licenseNumber: 'NMA-GL-1042',
      summitCount: 6,
      specialties: ['Langtang Valley & Gosainkunda', 'Upper Mustang Cultural Heritage', 'High Altitude Flora & Ecology'],
      languages: ['Sherpa', 'Nepali', 'English', 'Tibetan'],
      dailyRateUsd: 80,
      rating: 4.8,
      reviewsCount: 31,
      avatarImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      bio: 'Veteran NMA National Guide and cultural scholar specializing in the sacred hidden valleys of Langtang and Mustang. Deep knowledge of Tibetan Buddhist monasteries and alpine ecology.',
      isAvailable: 1
    }
  ];

  for (const g of guides) {
    insertGuide.run(
      g.id,
      g.name,
      g.sherpaClan,
      g.certification,
      g.licenseNumber,
      g.summitCount,
      JSON.stringify(g.specialties),
      JSON.stringify(g.languages),
      g.dailyRateUsd,
      g.rating,
      g.reviewsCount,
      g.avatarImage,
      g.bio,
      g.isAvailable,
      now
    );
  }
}

// ---------------- OFFICIAL TEAHOUSE LODGES SEED & METHODS ----------------

export function seedOfficialTeahouses(db: DatabaseSync) {
  const insertTeahouse = db.prepare(`
    INSERT OR IGNORE INTO teahouses (
      id, name, region, village, elevation, latitude, longitude,
      room_types, price_per_night_usd, amenities, food_menu,
      contact_phone, host_name, rating, reviews_count,
      cover_image, is_verified, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const teahouses = [
    {
      id: 'teahouse-namche-sherpa-bakery',
      name: 'Sherpa Lodge & Bakery',
      region: 'Everest',
      village: 'Namche Bazaar',
      elevation: 3440,
      latitude: 27.8069,
      longitude: 86.7140,
      roomTypes: ['Deluxe Double with Ensuite Bath', 'Twin Room with Kongde View', 'Standard Bunk Bed'],
      pricePerNightUsd: 35,
      amenities: ['Solar Hot Showers', 'Starlink / Wi-Fi', 'Heated Dining Room', 'Electric Blankets', '24/7 Device Charging'],
      foodMenu: ['Sherpa Stew (Syamkpa)', 'Freshly Baked Apple Pie', 'Yak Cheese Omelette', 'Dal Bhat 24-Hour Power', 'Himalayan French Press Coffee'],
      contactPhone: '+977 984-1234567',
      hostName: 'Ang Dawa Sherpa',
      rating: 4.9,
      reviewsCount: 142,
      coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
      isVerified: 1
    },
    {
      id: 'teahouse-dingboche-khangri',
      name: 'Hotel Khangri & Cafe',
      region: 'Everest',
      village: 'Dingboche',
      elevation: 4410,
      latitude: 27.8933,
      longitude: 86.8315,
      roomTypes: ['Insulated Private Twin', 'Ama Dablam View Double', 'Alpine Dormitory'],
      pricePerNightUsd: 40,
      amenities: ['Starlink / Wi-Fi', 'Solar Heated Showers', 'Central Yak-Dung Hearth', 'Oxygen Concentrators', 'Heated Dining Room'],
      foodMenu: ['Tibetan Bread & Organic Honey', 'Garlic Soup for Acclimatization', 'Yak Steak Sizzler', 'Thukpa Noodle Bowl', 'Ginger Lemon Honey Tea'],
      contactPhone: '+977 980-8765432',
      hostName: 'Pasang Nuru Sherpa',
      rating: 4.8,
      reviewsCount: 98,
      coverImage: 'https://images.unsplash.com/photo-1571401835393-8c5f35328320?auto=format&fit=crop&w=800&q=80',
      isVerified: 1
    },
    {
      id: 'teahouse-gokyo-namaste',
      name: 'Gokyo Namaste Lodge & Bakery',
      region: 'Everest',
      village: 'Gokyo',
      elevation: 4790,
      latitude: 27.9536,
      longitude: 86.6953,
      roomTypes: ['Turquoise Lake View Double', 'Panoramic Twin Room', 'Trekker Dorm Bed'],
      pricePerNightUsd: 45,
      amenities: ['Glacial Lake View Terrace', 'Starlink / Wi-Fi', 'Hot Showers (Gas)', 'Electric Bed Warmers', 'Drying Room'],
      foodMenu: ['Wood-Fired Apple Strudel', 'Sherpa Potato Pancake', 'Hot Lemon Ginger Tea', 'Hearty Veggie MoMo Platter', 'Dal Bhat Refills'],
      contactPhone: '+977 981-3344556',
      hostName: 'Mingma Lhamu Sherpa',
      rating: 4.9,
      reviewsCount: 86,
      coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      isVerified: 1
    },
    {
      id: 'teahouse-manang-tilicho-peak',
      name: 'Tilicho Peak Lodge & German Bakery',
      region: 'Annapurna',
      village: 'Manang',
      elevation: 3540,
      latitude: 28.6603,
      longitude: 84.0240,
      roomTypes: ['Deluxe Ensuite Double', 'Pine Wood Twin Room', 'Sunny Courtyard Dorm'],
      pricePerNightUsd: 30,
      amenities: ['Gas Hot Showers', 'Starlink / Wi-Fi', 'Bakery Courtyard Cafe', 'Heated Dining Room', 'Movie Screening Lounge'],
      foodMenu: ['Fresh Cinnamon Rolls', 'Buckwheat Dhindo with Ghee', 'Yak Cheese Pizza', 'Himalayan Trout Curry', 'Organic Seabuckthorn Juice'],
      contactPhone: '+977 985-6012345',
      hostName: 'Karma Gurung',
      rating: 4.8,
      reviewsCount: 115,
      coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      isVerified: 1
    },
    {
      id: 'teahouse-thorong-high-camp',
      name: 'High Camp Stone Sanctuary',
      region: 'Annapurna',
      village: 'Thorong High Camp',
      elevation: 4880,
      latitude: 28.7960,
      longitude: 83.9470,
      roomTypes: ['Insulated High Camp Twin', 'Pass Summit Dormitory'],
      pricePerNightUsd: 35,
      amenities: ['Pre-Pass 3AM Breakfast Service', 'Gravity Water Station', 'Heated Dining Room', 'Thermal Sleep Mats', 'Emergency Oxygen'],
      foodMenu: ['Summit Carb Energy Porridge', 'Heavy Garlic Noodle Soup', 'Hot Cocoa & Ginger Infusion', 'Spiced Dal Bhat'],
      contactPhone: '+977 984-6098765',
      hostName: 'Tenzing Gurung',
      rating: 4.7,
      reviewsCount: 79,
      coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
      isVerified: 1
    },
    {
      id: 'teahouse-kyanjin-eco-lodge',
      name: 'Kyanjin Organic Eco Lodge',
      region: 'Langtang',
      village: 'Kyanjin Gompa',
      elevation: 3870,
      latitude: 28.2125,
      longitude: 85.5681,
      roomTypes: ['Langtang Lirung View Double', 'Cedarwood Twin Room', 'Alpine Dorm'],
      pricePerNightUsd: 28,
      amenities: ['Solar Hot Showers', 'Organic Greenhouse Dining', 'Starlink / Wi-Fi', 'Traditional Stone Hearth', 'Local Yak Cheese Cellar Access'],
      foodMenu: ['Artisanal Kyanjin Yak Cheese Tasting', 'Garden Greens Sherpa Stew', 'Buckwheat Roti with Chhurpi', 'Warm Apple Crisp'],
      contactPhone: '+977 986-1122334',
      hostName: 'Dorje Tamang',
      rating: 4.9,
      reviewsCount: 104,
      coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      isVerified: 1
    },
    {
      id: 'teahouse-samagaun-mountain-oasis',
      name: 'Samagaun Mountain Oasis',
      region: 'Manaslu',
      village: 'Samagaun',
      elevation: 3530,
      latitude: 28.5875,
      longitude: 84.6339,
      roomTypes: ['Mt. Manaslu North Face Double', 'Stone Cottage Twin', 'Trekker Bunk Dorm'],
      pricePerNightUsd: 32,
      amenities: ['Starlink / Wi-Fi', 'Solar Heated Baths', 'Wood Pellet Stove', 'Expedition Staging Yard', 'Device Battery Bank'],
      foodMenu: ['Tibetan Tsampa Porridge with Yak Butter', 'Homemade Vegetable Momos', 'Spicy Mountain Mushroom Soup', 'Classic Manaslu Dal Bhat'],
      contactPhone: '+977 982-4455667',
      hostName: 'Lobsang Lama',
      rating: 4.8,
      reviewsCount: 67,
      coverImage: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&q=80',
      isVerified: 1
    },
    {
      id: 'teahouse-lama-hotel-haven',
      name: 'Lama Hotel Peaceful Haven',
      region: 'Langtang',
      village: 'Lama Hotel',
      elevation: 2470,
      latitude: 28.1517,
      longitude: 85.4222,
      roomTypes: ['Forest View Twin Room', 'Riverbank Double', 'Cozy Dorm Bed'],
      pricePerNightUsd: 25,
      amenities: ['Riverstone Hot Showers', 'Filtered Spring Water', 'Rhododendron Forest Garden', 'Heated Dining Room'],
      foodMenu: ['Wild Nettle Soup (Sisnu)', 'Wood-Fired Dal Bhat', 'Honey Banana Pancakes', 'Masala Mountain Tea'],
      contactPhone: '+977 980-1199887',
      hostName: 'Chhiring Tamang',
      rating: 4.7,
      reviewsCount: 58,
      coverImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      isVerified: 1
    }
  ];

  for (const th of teahouses) {
    insertTeahouse.run(
      th.id,
      th.name,
      th.region,
      th.village,
      th.elevation,
      th.latitude,
      th.longitude,
      JSON.stringify(th.roomTypes),
      th.pricePerNightUsd,
      JSON.stringify(th.amenities),
      JSON.stringify(th.foodMenu),
      th.contactPhone,
      th.hostName,
      th.rating,
      th.reviewsCount,
      th.coverImage,
      th.isVerified,
      now
    );
  }
}

export function seedOfficialTrailConditionReports(db: DatabaseSync) {
  const insertReport = db.prepare(`
    INSERT OR IGNORE INTO trail_condition_reports (
      id, trail_id, reporter_name, reporter_role, status_level,
      condition_type, latitude, longitude, location_name,
      elevation, notes, gear_recommended, upvotes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const reports = [
    {
      id: 'cond-cho-la-glacier',
      trailId: 'gokyo-ri-cho-la',
      reporterName: 'Dawa Yangzum Sherpa',
      reporterRole: 'Certified Sherpa Guide',
      statusLevel: 'CAUTION_HAZARD',
      conditionType: 'Snow / Ice on Pass',
      latitude: 27.9250,
      longitude: 86.7880,
      locationName: 'Cho La Pass Summit & Glacier Ridge',
      elevation: 5420,
      notes: 'Glacier tongue has hard blue ice on east flank. Fresh snowfall covered hidden crevasses near marker prayer flags. Early morning crossing recommended before 10 AM before sun softens snow bridges.',
      gearRecommended: 'Microspikes / crampons mandatory, trekking poles, alpine gaiters',
      upvotes: 42,
      createdAt: '2026-10-05T07:30:00Z'
    },
    {
      id: 'cond-thorong-la-ice',
      trailId: 'annapurna-circuit',
      reporterName: 'Mingma Dorchi Sherpa',
      reporterRole: 'Certified Sherpa Guide',
      statusLevel: 'CAUTION_HAZARD',
      conditionType: 'Snow / Ice on Pass',
      latitude: 28.7942,
      longitude: 83.9389,
      locationName: 'Thorong La Pass (Manang to Muktinath)',
      elevation: 5416,
      notes: 'Sustained -18°C wind chills at dawn. The descent towards Muktinath has frozen compacted scree between 5,200m and 4,800m. Start from High Camp no later than 4:30 AM to beat midday gusts.',
      gearRecommended: 'Kahtoola microspikes, balaclava, windproof outer hardshell, 800-fill down mittens',
      upvotes: 38,
      createdAt: '2026-10-04T16:15:00Z'
    },
    {
      id: 'cond-phakding-bridge',
      trailId: 'ebc-trek',
      reporterName: 'Ang Dawa Sherpa',
      reporterRole: 'Lodge Host',
      statusLevel: 'CLEAR_PASSABLE',
      conditionType: 'River Crossing / Bridge',
      latitude: 27.7408,
      longitude: 86.7114,
      locationName: 'Phakding Dudh Koshi Suspension Bridge',
      elevation: 2610,
      notes: 'Dudh Koshi suspension bridge inspected and cleared by Khumbu engineers. New galvanized steel cables and plank decking installed. Clear transit for both yaks and trekkers.',
      gearRecommended: 'Standard trekking footwear',
      upvotes: 29,
      createdAt: '2026-10-06T06:00:00Z'
    },
    {
      id: 'cond-larkya-la-pass',
      trailId: 'manaslu-circuit',
      reporterName: 'Lakpa Nuru Sherpa',
      reporterRole: 'Certified Sherpa Guide',
      statusLevel: 'CLEAR_PASSABLE',
      conditionType: 'Weather Window',
      latitude: 28.6475,
      longitude: 84.6225,
      locationName: 'Larkya La Pass (Dharamsala to Bimthang)',
      elevation: 5106,
      notes: 'Crystal clear morning window. Glacier traverse is dry and well-flagged with Buddhist prayer stones. Tea shop at high hut is operational with hot lemon ginger tea.',
      gearRecommended: 'Trekking poles, UV cat-4 sunglasses, sun protection',
      upvotes: 21,
      createdAt: '2026-10-05T12:00:00Z'
    },
    {
      id: 'cond-kyanjin-avalanche',
      trailId: 'langtang-valley',
      reporterName: 'Dorje Tamang',
      reporterRole: 'Lodge Host',
      statusLevel: 'CLEAR_PASSABLE',
      conditionType: 'Teahouse Capacity Full',
      latitude: 28.2125,
      longitude: 85.5681,
      locationName: 'Kyanjin Gompa Valley Basin',
      elevation: 3870,
      notes: 'Autumn trekking wave has arrived in upper Langtang. Lodges in Kyanjin Gompa are reaching 90% capacity by 3 PM. Trekking groups are strongly advised to reserve rooms ahead of time.',
      gearRecommended: 'Thermal sleeping bag (-10°C), advance teahouse reservation voucher',
      upvotes: 18,
      createdAt: '2026-10-06T08:00:00Z'
    }
  ];

  for (const rep of reports) {
    insertReport.run(
      rep.id,
      rep.trailId,
      rep.reporterName,
      rep.reporterRole,
      rep.statusLevel,
      rep.conditionType,
      rep.latitude,
      rep.longitude,
      rep.locationName,
      rep.elevation,
      rep.notes,
      rep.gearRecommended,
      rep.upvotes,
      rep.createdAt
    );
  }
}

export function getTeahouses(
  filterOrRegion?: {
    region?: string;
    village?: string;
    amenity?: string;
  } | string,
  villageParam?: string
): Teahouse[] {
  let regionFilter: string | undefined;
  let villageFilter: string | undefined;
  let amenityFilter: string | undefined;

  if (typeof filterOrRegion === 'string') {
    regionFilter = filterOrRegion;
    villageFilter = villageParam;
  } else if (filterOrRegion && typeof filterOrRegion === 'object') {
    regionFilter = filterOrRegion.region;
    villageFilter = filterOrRegion.village;
    amenityFilter = filterOrRegion.amenity;
  }

  const db = getDatabase();
  let query = 'SELECT * FROM teahouses WHERE 1=1';
  const params: (string | number)[] = [];

  if (regionFilter && regionFilter !== 'All') {
    query += ' AND LOWER(region) = LOWER(?)';
    params.push(regionFilter);
  }
  if (villageFilter && villageFilter !== 'All') {
    query += ' AND LOWER(village) = LOWER(?)';
    params.push(villageFilter);
  }

  query += ' ORDER BY elevation ASC, rating DESC';

  const rows = db.prepare(query).all(...params) as any[];

  let results: Teahouse[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    region: r.region,
    village: r.village,
    elevation: Number(r.elevation),
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    roomTypes: JSON.parse(r.room_types || '[]'),
    pricePerNightUsd: Number(r.price_per_night_usd),
    amenities: JSON.parse(r.amenities || '[]'),
    foodMenu: JSON.parse(r.food_menu || '[]'),
    contactPhone: r.contact_phone || undefined,
    hostName: r.host_name || undefined,
    rating: Number(r.rating),
    reviewsCount: Number(r.reviews_count),
    coverImage: r.cover_image,
    isVerified: Boolean(r.is_verified),
    createdAt: r.created_at,
  }));

  if (amenityFilter && amenityFilter !== 'All') {
    const target = amenityFilter.toLowerCase();
    results = results.filter((th) =>
      th.amenities.some((a) => a.toLowerCase().includes(target))
    );
  }

  return results;
}

export function getTeahouseById(id: string): Teahouse | null {
  const db = getDatabase();
  const r = db.prepare('SELECT * FROM teahouses WHERE id = ?').get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    region: r.region,
    village: r.village,
    elevation: Number(r.elevation),
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    roomTypes: JSON.parse(r.room_types || '[]'),
    pricePerNightUsd: Number(r.price_per_night_usd),
    amenities: JSON.parse(r.amenities || '[]'),
    foodMenu: JSON.parse(r.food_menu || '[]'),
    contactPhone: r.contact_phone || undefined,
    hostName: r.host_name || undefined,
    rating: Number(r.rating),
    reviewsCount: Number(r.reviews_count),
    coverImage: r.cover_image,
    isVerified: Boolean(r.is_verified),
    createdAt: r.created_at,
  };
}

export function createTeahouseReservation(data: {
  teahouseId: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  guestsCount: number;
  roomType: string;
  dietaryNotes?: string;
  totalPriceUsd?: number;
}): TeahouseReservation {
  const db = getDatabase();
  const th = getTeahouseById(data.teahouseId);
  if (!th) {
    throw new Error(`Teahouse with ID ${data.teahouseId} not found`);
  }
  const id = `res_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const totalPrice = typeof data.totalPriceUsd === 'number' && data.totalPriceUsd > 0
    ? data.totalPriceUsd
    : (th.pricePerNightUsd * Math.max(1, data.guestsCount));

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO teahouse_reservations (
        id, teahouse_id, user_id, guest_name, guest_email, guest_phone,
        check_in_date, guests_count, room_type, dietary_notes,
        total_price_usd, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.teahouseId,
      data.userId || null,
      data.guestName,
      data.guestEmail,
      data.guestPhone || null,
      data.checkInDate,
      data.guestsCount,
      data.roomType,
      data.dietaryNotes || null,
      totalPrice,
      'CONFIRMED',
      now
    );
    db.exec('COMMIT;');
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    throw err;
  }

  return {
    id,
    teahouseId: data.teahouseId,
    userId: data.userId,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    guestPhone: data.guestPhone,
    checkInDate: data.checkInDate,
    guestsCount: data.guestsCount,
    roomType: data.roomType,
    dietaryNotes: data.dietaryNotes,
    totalPriceUsd: totalPrice,
    status: 'CONFIRMED',
    createdAt: now,
    teahouseName: th.name,
    village: th.village,
  };
}

export function getTrailConditionReports(
  filterOrTrailId?: {
    trailId?: string;
    statusLevel?: string;
  } | string,
  statusLevelParam?: string
): TrailConditionReport[] {
  let trailIdFilter: string | undefined;
  let statusLevelFilter: string | undefined;

  if (typeof filterOrTrailId === 'string') {
    trailIdFilter = filterOrTrailId;
    statusLevelFilter = statusLevelParam;
  } else if (filterOrTrailId && typeof filterOrTrailId === 'object') {
    trailIdFilter = filterOrTrailId.trailId;
    statusLevelFilter = filterOrTrailId.statusLevel;
  }

  const db = getDatabase();
  let query = `
    SELECT c.*, t.name as trail_name
    FROM trail_condition_reports c
    LEFT JOIN trails t ON c.trail_id = t.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (trailIdFilter && trailIdFilter !== 'All') {
    query += ' AND c.trail_id = ?';
    params.push(trailIdFilter);
  }
  if (statusLevelFilter && statusLevelFilter !== 'All') {
    query += ' AND c.status_level = ?';
    params.push(statusLevelFilter);
  }

  query += ' ORDER BY c.created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((r) => ({
    id: r.id,
    trailId: r.trail_id,
    reporterName: r.reporter_name,
    reporterRole: r.reporter_role,
    statusLevel: r.status_level,
    conditionType: r.condition_type,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    locationName: r.location_name,
    elevation: Number(r.elevation),
    notes: r.notes,
    gearRecommended: r.gear_recommended || undefined,
    upvotes: Number(r.upvotes),
    createdAt: r.created_at,
    trailName: r.trail_name || undefined,
  }));
}

export function createTrailConditionReport(data: {
  trailId: string;
  reporterName: string;
  reporterRole: string;
  statusLevel: string;
  conditionType: string;
  latitude: number;
  longitude: number;
  locationName: string;
  elevation: number;
  notes: string;
  gearRecommended?: string;
}): TrailConditionReport {
  const db = getDatabase();
  const id = `rep_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO trail_condition_reports (
      id, trail_id, reporter_name, reporter_role, status_level,
      condition_type, latitude, longitude, location_name,
      elevation, notes, gear_recommended, upvotes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.trailId,
    data.reporterName,
    data.reporterRole,
    data.statusLevel,
    data.conditionType,
    data.latitude,
    data.longitude,
    data.locationName,
    data.elevation,
    data.notes,
    data.gearRecommended || null,
    0,
    now
  );

  return {
    id,
    trailId: data.trailId,
    reporterName: data.reporterName,
    reporterRole: data.reporterRole,
    statusLevel: data.statusLevel,
    conditionType: data.conditionType,
    latitude: data.latitude,
    longitude: data.longitude,
    locationName: data.locationName,
    elevation: data.elevation,
    notes: data.notes,
    gearRecommended: data.gearRecommended,
    upvotes: 0,
    createdAt: now,
  };
}

export function upvoteTrailConditionReport(id: string): { id: string; upvotes: number } {
  const db = getDatabase();
  const row = db.prepare(
    'UPDATE trail_condition_reports SET upvotes = upvotes + 1 WHERE id = ? RETURNING id, upvotes'
  ).get(id) as any;
  if (!row) {
    throw new Error(`Trail condition report with ID ${id} not found`);
  }
  return { id: row.id, upvotes: Number(row.upvotes) };
}

/* ─────────────────────────────────────────────────────────────── */
/* High-Altitude Completion Certificates Helper Functions          */
/* ─────────────────────────────────────────────────────────────── */

export function getCertificateById(id: string): HighAltitudeCertificate | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM certificates WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    verificationCode: row.verification_code as string,
    adventurerName: row.adventurer_name as string,
    trailName: row.trail_name as string,
    trailSlug: row.trail_slug as string,
    maxElevation: Number(row.max_elevation),
    totalDistanceKm: Number(row.total_distance_km),
    completionDate: row.completion_date as string,
    chiefGuideName: row.chief_guide_name as string,
    chiefGuideTitle: row.chief_guide_title as string,
    digitalSignatureHash: row.digital_signature_hash as string,
    createdAt: row.created_at as string,
  };
}

export function getCertificateByBookingId(bookingId: string): HighAltitudeCertificate | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM certificates WHERE booking_id = ?').get(bookingId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    verificationCode: row.verification_code as string,
    adventurerName: row.adventurer_name as string,
    trailName: row.trail_name as string,
    trailSlug: row.trail_slug as string,
    maxElevation: Number(row.max_elevation),
    totalDistanceKm: Number(row.total_distance_km),
    completionDate: row.completion_date as string,
    chiefGuideName: row.chief_guide_name as string,
    chiefGuideTitle: row.chief_guide_title as string,
    digitalSignatureHash: row.digital_signature_hash as string,
    createdAt: row.created_at as string,
  };
}

export function getCertificateByVerificationCode(code: string): HighAltitudeCertificate | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM certificates WHERE verification_code = ?').get(code) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    verificationCode: row.verification_code as string,
    adventurerName: row.adventurer_name as string,
    trailName: row.trail_name as string,
    trailSlug: row.trail_slug as string,
    maxElevation: Number(row.max_elevation),
    totalDistanceKm: Number(row.total_distance_km),
    completionDate: row.completion_date as string,
    chiefGuideName: row.chief_guide_name as string,
    chiefGuideTitle: row.chief_guide_title as string,
    digitalSignatureHash: row.digital_signature_hash as string,
    createdAt: row.created_at as string,
  };
}

export function createCertificate(data: Omit<HighAltitudeCertificate, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): HighAltitudeCertificate {
  const db = getDatabase();
  const id = data.id || `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = data.createdAt || new Date().toISOString();

  db.prepare(`
    INSERT INTO certificates (
      id, booking_id, verification_code, adventurer_name, trail_name,
      trail_slug, max_elevation, total_distance_km, completion_date,
      chief_guide_name, chief_guide_title, digital_signature_hash, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.bookingId,
    data.verificationCode,
    data.adventurerName,
    data.trailName,
    data.trailSlug,
    data.maxElevation,
    data.totalDistanceKm,
    data.completionDate,
    data.chiefGuideName,
    data.chiefGuideTitle,
    data.digitalSignatureHash,
    now
  );

  return {
    id,
    bookingId: data.bookingId,
    verificationCode: data.verificationCode,
    adventurerName: data.adventurerName,
    trailName: data.trailName,
    trailSlug: data.trailSlug,
    maxElevation: data.maxElevation,
    totalDistanceKm: data.totalDistanceKm,
    completionDate: data.completionDate,
    chiefGuideName: data.chiefGuideName,
    chiefGuideTitle: data.chiefGuideTitle,
    digitalSignatureHash: data.digitalSignatureHash,
    createdAt: now,
  };
}

// ───────────────────────────────────────────────────────────────
// Sprint 8.3: Collaborative Expedition Sharing & Split-Deposit Checkout
// ───────────────────────────────────────────────────────────────

export const DEFAULT_HIMALAYAN_SIDE_TRIPS: Record<string, GroupSideTripOption[]> = {
  'ebc-trek': [
    {
      id: 'side-trip-kala-patthar',
      name: 'Kala Patthar Sunrise',
      elevationMeters: 5644,
      elevationGainMeters: 410,
      durationHours: 3.5,
      description: 'Iconic pre-dawn summit ascent offering panoramic sunrise views over Mt. Everest, Nuptse, and the Khumbu Glacier.',
      highlight: 'Highest unobstructed viewpoint of Mount Everest summit pyramid'
    },
    {
      id: 'side-trip-gokyo-lakes',
      name: 'Gokyo Lakes Detour',
      elevationMeters: 5420,
      elevationGainMeters: 750,
      durationHours: 6.5,
      description: 'Detour across Cho La Pass to the sacred turquoise glacial lakes of Gokyo Valley and Gokyo Ri summit.',
      highlight: 'Sacred turquoise alpine lakes and Ngozumpa Glacier traverse'
    },
    {
      id: 'side-trip-ama-dablam-bc',
      name: 'Ama Dablam Base Camp Hike',
      elevationMeters: 4600,
      elevationGainMeters: 600,
      durationHours: 4.5,
      description: 'Acclimatization day hike climbing to the foot of Ama Dablam, widely regarded as the Matterhorn of the Himalayas.',
      highlight: 'Intimate close-up view of the southwest ridge of Ama Dablam'
    }
  ],
  'annapurna-circuit': [
    {
      id: 'side-trip-tilicho-lake',
      name: 'Tilicho Lake Excursion',
      elevationMeters: 4919,
      elevationGainMeters: 1400,
      durationHours: 8.0,
      description: 'Dramatic high-altitude side trip from Manang to one of the highest alpine glacial lakes on Earth.',
      highlight: 'Glacial amphitheater surrounded by Tilicho Peak & Great Barrier'
    },
    {
      id: 'side-trip-poon-hill',
      name: 'Poon Hill Dawn Ascent',
      elevationMeters: 3210,
      elevationGainMeters: 350,
      durationHours: 2.0,
      description: 'Pre-dawn climb to view the glowing golden sunrise across the Annapurna and Dhaulagiri mountain massifs.',
      highlight: 'World-renowned 360-degree Himalayan sunrise panorama'
    },
    {
      id: 'side-trip-ice-lake',
      name: 'Ice Lake (Kicho Tal) Climb',
      elevationMeters: 4620,
      elevationGainMeters: 1100,
      durationHours: 6.0,
      description: 'Challenging acclimatization climb above Braga village to crystal turquoise sacred alpine lakes.',
      highlight: 'Stunning aerial view across the entire Pisang and Manang valley'
    }
  ],
  'default': [
    {
      id: 'side-trip-kala-patthar',
      name: 'Kala Patthar Sunrise',
      elevationMeters: 5644,
      elevationGainMeters: 410,
      durationHours: 3.5,
      description: 'Pre-dawn summit ascent offering panoramic views over the highest peaks of the Himalayas.',
      highlight: 'High alpine panoramic sunrise viewpoint'
    },
    {
      id: 'side-trip-tilicho-lake',
      name: 'Tilicho Lake Excursion',
      elevationMeters: 4919,
      elevationGainMeters: 1400,
      durationHours: 8.0,
      description: 'Dramatic high-altitude side trip to an authentic high alpine glacial lake.',
      highlight: 'Glacial cirque amphitheater'
    },
    {
      id: 'side-trip-gokyo-ri',
      name: 'Gokyo Ri Summit',
      elevationMeters: 5357,
      elevationGainMeters: 600,
      durationHours: 4.5,
      description: 'Acclimatization peak climb above the Gokyo glacial lakes with panoramic views of 4 eight-thousanders.',
      highlight: 'Four 8,000m summits visible from one spot'
    }
  ]
};

export const DEFAULT_HIMALAYAN_GEAR_OPTIONS: GroupGearOption[] = [
  {
    id: 'gear-sleeping-bag-20c',
    name: '-20C Down Sleeping Bag',
    dailyRateUsd: 5,
    weightKg: 1.8,
    category: 'SLEEPING',
    description: '800-fill goose down expedition sleeping bag rated for extreme sub-zero Himalayan nights.'
  },
  {
    id: 'gear-crampons-spikes',
    name: 'Crampons / Microspikes',
    dailyRateUsd: 3,
    weightKg: 0.8,
    category: 'FOOTWEAR',
    description: 'Hardened steel 10-point traction spikes for verglas, frozen high passes, and icy moraines.'
  },
  {
    id: 'gear-trekking-poles',
    name: 'Carbon Trekking Poles',
    dailyRateUsd: 2,
    weightKg: 0.45,
    category: 'ACCESSORY',
    description: 'Ultra-light carbon fiber 3-section collapsible trekking poles with quick-lock flick mechanism.'
  },
  {
    id: 'gear-hardshell-parka',
    name: 'GORE-TEX Pro Expedition Parka',
    dailyRateUsd: 4,
    weightKg: 0.9,
    category: 'CLOTHING',
    description: '3-layer waterproof, windproof breathable technical mountain shell with helmet-compatible hood.'
  },
  {
    id: 'gear-alpine-headlamp',
    name: '450-Lumen Alpine Headlamp',
    dailyRateUsd: 1.5,
    weightKg: 0.2,
    category: 'ACCESSORY',
    description: 'Waterproof high-output LED headlamp with red night-vision mode and cold-resistant rechargeable battery.'
  }
];

export function seedOfficialGroupExpeditions(db: DatabaseSync) {
  const insertExp = db.prepare(`
    INSERT OR IGNORE INTO group_expeditions (
      id, share_token, trail_id, leader_user_id, leader_name, leader_email,
      expedition_title, target_start_date, target_group_size,
      itinerary_customization, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO group_members (
      id, expedition_id, member_name, member_email, role,
      side_trip_votes, personal_gear_rentals, share_amount_usd,
      payment_status, receipt_number, paid_at, joined_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();

  // 1. Team Sagarmatha 2026 (Everest Base Camp - 3 of 4 Members Confirmed)
  const exp1Id = 'grp_exp_sagarmatha_2026';
  const exp1Token = 'exp-sagarmatha-2026-x8k';
  insertExp.run(
    exp1Id,
    exp1Token,
    'ebc-trek',
    'usr_admin_1',
    'Tenzing Norgay Jr.',
    'tenzing@expeditions.org',
    'Team Sagarmatha 2026: EBC & Kala Patthar Ascent',
    '2026-11-15',
    4,
    JSON.stringify({
      availableSideTrips: DEFAULT_HIMALAYAN_SIDE_TRIPS['ebc-trek'],
      gearRentalCatalog: DEFAULT_HIMALAYAN_GEAR_OPTIONS,
      targetSummit: 'Kala Patthar (5,644m)'
    }),
    'ORGANIZING',
    '2026-10-15T08:00:00Z'
  );

  insertMember.run(
    'grp_mbr_tenzing_1',
    exp1Id,
    'Tenzing Norgay Jr.',
    'tenzing@expeditions.org',
    'LEADER',
    JSON.stringify(['Kala Patthar Sunrise', 'Ama Dablam Base Camp Hike']),
    JSON.stringify(['-20C Down Sleeping Bag', 'Crampons / Microspikes']),
    187.50,
    'DEPOSIT_PAID',
    'REC-2026-GRP-74821',
    '2026-10-15T08:30:00Z',
    '2026-10-15T08:00:00Z'
  );

  insertMember.run(
    'grp_mbr_alex_2',
    exp1Id,
    'Alex Morgan',
    'alex@example.com',
    'MEMBER',
    JSON.stringify(['Kala Patthar Sunrise', 'Gokyo Lakes Detour']),
    JSON.stringify(['-20C Down Sleeping Bag', 'Carbon Trekking Poles']),
    187.50,
    'DEPOSIT_PAID',
    'REC-2026-GRP-89214',
    '2026-10-16T11:45:00Z',
    '2026-10-16T10:00:00Z'
  );

  insertMember.run(
    'grp_mbr_sarah_3',
    exp1Id,
    'Sarah Jenkins',
    'sarah.j@alpine-club.uk',
    'MEMBER',
    JSON.stringify(['Kala Patthar Sunrise']),
    JSON.stringify(['Crampons / Microspikes']),
    187.50,
    'DEPOSIT_PAID',
    'REC-2026-GRP-91043',
    '2026-10-18T14:20:00Z',
    '2026-10-17T16:30:00Z'
  );

  // 2. Annapurna High-Pass Traverse
  const exp2Id = 'grp_exp_annapurna_2026';
  const exp2Token = 'exp-annapurna-traverse-2026-p4m';
  insertExp.run(
    exp2Id,
    exp2Token,
    'annapurna-circuit',
    'usr_guide_maya',
    'Maya Sherpa',
    'maya@himalayantrails.com',
    'Annapurna High-Pass Traverse: Thorong La & Tilicho Lake',
    '2026-10-08',
    4,
    JSON.stringify({
      availableSideTrips: DEFAULT_HIMALAYAN_SIDE_TRIPS['annapurna-circuit'],
      gearRentalCatalog: DEFAULT_HIMALAYAN_GEAR_OPTIONS,
      targetSummit: 'Thorong La Pass (5,416m)'
    }),
    'ORGANIZING',
    '2026-10-01T08:00:00Z'
  );

  insertMember.run(
    'grp_mbr_maya_1',
    exp2Id,
    'Maya Sherpa',
    'maya@himalayantrails.com',
    'LEADER',
    JSON.stringify(['Tilicho Lake Excursion', 'Poon Hill Dawn Ascent']),
    JSON.stringify(['-20C Down Sleeping Bag', 'Crampons / Microspikes']),
    187.50,
    'DEPOSIT_PAID',
    'REC-2026-GRP-33102',
    '2026-10-01T09:00:00Z',
    '2026-10-01T08:00:00Z'
  );

  insertMember.run(
    'grp_mbr_liam_2',
    exp2Id,
    'Liam O\'Connor',
    'liam@dublin-climbers.ie',
    'MEMBER',
    JSON.stringify(['Tilicho Lake Excursion']),
    JSON.stringify(['Carbon Trekking Poles']),
    187.50,
    'DEPOSIT_PAID',
    'REC-2026-GRP-44192',
    '2026-10-02T13:15:00Z',
    '2026-10-02T12:00:00Z'
  );

  insertMember.run(
    'grp_mbr_elena_3',
    exp2Id,
    'Elena Rostova',
    'elena@alpinist.org',
    'MEMBER',
    JSON.stringify(['Tilicho Lake Excursion']),
    JSON.stringify(['-20C Down Sleeping Bag']),
    187.50,
    'UNPAID',
    null,
    null,
    '2026-10-03T15:30:00Z'
  );
}

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createGroupExpedition(data: {
  trailId: string;
  leaderUserId?: string;
  leaderName: string;
  leaderEmail: string;
  expeditionTitle: string;
  targetStartDate: string;
  targetGroupSize: number;
  itineraryCustomization?: any;
  shareToken?: string;
  shareAmountUsd?: number;
}): GroupExpeditionWithDetails {
  const db = getDatabase();
  const id = `grp_exp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();

  // Find trail
  const trail = getTrailById(data.trailId) || getTrailBySlug(data.trailId);
  const trailSlug = trail?.slug || data.trailId.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Generate share token if not supplied
  const shareToken = data.shareToken && data.shareToken.trim().length > 0
    ? data.shareToken.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    : `exp-${trailSlug}-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex')}`;

  const targetGroupSize = Math.max(2, Math.min(20, Math.floor(data.targetGroupSize || 4)));
  const defaultShareAmount = typeof data.shareAmountUsd === 'number' && data.shareAmountUsd > 0
    ? data.shareAmountUsd
    : 187.50;

  const customization = data.itineraryCustomization || {
    availableSideTrips: DEFAULT_HIMALAYAN_SIDE_TRIPS[data.trailId] || DEFAULT_HIMALAYAN_SIDE_TRIPS.default,
    gearRentalCatalog: DEFAULT_HIMALAYAN_GEAR_OPTIONS
  };

  db.prepare(`
    INSERT INTO group_expeditions (
      id, share_token, trail_id, leader_user_id, leader_name, leader_email,
      expedition_title, target_start_date, target_group_size,
      itinerary_customization, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ORGANIZING', ?)
  `).run(
    id,
    shareToken,
    trail?.id || data.trailId,
    data.leaderUserId || null,
    data.leaderName,
    data.leaderEmail.toLowerCase(),
    data.expeditionTitle,
    data.targetStartDate,
    targetGroupSize,
    JSON.stringify(customization),
    now
  );

  // Auto-register leader as first team member
  const leaderMemberId = `grp_mbr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  db.prepare(`
    INSERT INTO group_members (
      id, expedition_id, member_name, member_email, role,
      side_trip_votes, personal_gear_rentals, share_amount_usd,
      payment_status, receipt_number, paid_at, joined_at
    ) VALUES (?, ?, ?, ?, 'LEADER', '[]', '[]', ?, 'UNPAID', NULL, NULL, ?)
  `).run(
    leaderMemberId,
    id,
    data.leaderName,
    data.leaderEmail.toLowerCase(),
    defaultShareAmount,
    now
  );

  const created = getGroupExpeditionByToken(shareToken);
  if (!created) {
    throw new Error('Failed to retrieve newly created group expedition');
  }
  return created;
}

export function getGroupExpeditionByToken(tokenOrId: string): GroupExpeditionWithDetails | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM group_expeditions
    WHERE share_token = ? OR id = ?
  `).get(tokenOrId, tokenOrId) as Record<string, unknown> | undefined;

  if (!row) return null;

  const expeditionId = row.id as string;
  const trailId = row.trail_id as string;

  // Retrieve trail
  const trail = getTrailById(trailId) || getTrailBySlug(trailId);

  // Retrieve members
  const memberRows = db.prepare(`
    SELECT * FROM group_members
    WHERE expedition_id = ?
    ORDER BY joined_at ASC
  `).all(expeditionId) as Record<string, unknown>[];

  const members: GroupMember[] = memberRows.map((m) => ({
    id: m.id as string,
    expeditionId: m.expedition_id as string,
    memberName: m.member_name as string,
    memberEmail: m.member_email as string,
    role: (m.role as 'LEADER' | 'MEMBER') || 'MEMBER',
    sideTripVotes: parseJsonArray(m.side_trip_votes as string),
    personalGearRentals: parseJsonArray(m.personal_gear_rentals as string),
    shareAmountUsd: Number(m.share_amount_usd || 187.50),
    paymentStatus: (m.payment_status as 'UNPAID' | 'DEPOSIT_PAID' | 'PAID_FULL') || 'UNPAID',
    receiptNumber: (m.receipt_number as string) || undefined,
    paidAt: (m.paid_at as string) || undefined,
    joinedAt: m.joined_at as string
  }));

  // Parse itinerary customization
  let customization: any = {};
  try {
    customization = row.itinerary_customization ? JSON.parse(row.itinerary_customization as string) : {};
  } catch {
    customization = {};
  }

  const availableSideTrips: GroupSideTripOption[] = customization.availableSideTrips
    || DEFAULT_HIMALAYAN_SIDE_TRIPS[trailId]
    || DEFAULT_HIMALAYAN_SIDE_TRIPS.default;

  const availableGearOptions: GroupGearOption[] = customization.gearRentalCatalog
    || DEFAULT_HIMALAYAN_GEAR_OPTIONS;

  // Compute live tallies for side trips
  const sideTripTallies: GroupSideTripTally[] = availableSideTrips.map((st) => {
    const voters = members.filter((m) => m.sideTripVotes.some((v) =>
      v.toLowerCase() === st.name.toLowerCase() || v.toLowerCase() === st.id.toLowerCase()
    ));
    return {
      id: st.id,
      name: st.name,
      elevationMeters: st.elevationMeters,
      elevationGainMeters: st.elevationGainMeters,
      durationHours: st.durationHours,
      description: st.description,
      votesCount: voters.length,
      voterNames: voters.map((v) => v.memberName)
    };
  });

  const paidMembersCount = members.filter((m) => m.paymentStatus !== 'UNPAID').length;
  const targetGroupSize = Number(row.target_group_size || 4);
  const totalCollectedUsd = members
    .filter((m) => m.paymentStatus !== 'UNPAID')
    .reduce((sum, m) => sum + m.shareAmountUsd, 0);

  const depositPerPersonUsd = members[0]?.shareAmountUsd || 187.50;
  const isFullyFunded = paidMembersCount >= targetGroupSize;

  let currentStatus = row.status as 'ORGANIZING' | 'CONFIRMED' | 'EXPEDITION_READY' | 'CANCELLED';
  if (isFullyFunded && currentStatus === 'ORGANIZING') {
    currentStatus = 'CONFIRMED';
    try {
      db.prepare('UPDATE group_expeditions SET status = ? WHERE id = ?').run(currentStatus, expeditionId);
    } catch {}
  }

  return {
    id: expeditionId,
    shareToken: row.share_token as string,
    trailId,
    leaderUserId: (row.leader_user_id as string) || undefined,
    leaderName: row.leader_name as string,
    leaderEmail: row.leader_email as string,
    expeditionTitle: row.expedition_title as string,
    targetStartDate: row.target_start_date as string,
    targetGroupSize,
    itineraryCustomization: customization,
    status: currentStatus,
    createdAt: row.created_at as string,
    trail: trail ? {
      id: trail.id,
      slug: trail.slug,
      name: trail.name,
      region: trail.region,
      difficulty: trail.difficulty,
      distanceKm: trail.distanceKm,
      durationDays: trail.durationDays,
      maxElevation: trail.maxElevation,
      elevationGain: trail.elevationGain,
      image: trail.image,
      startPoint: trail.startPoint,
      endPoint: trail.endPoint
    } : undefined,
    members,
    paidMembersCount,
    totalMembersCount: members.length,
    depositPerPersonUsd,
    totalCollectedUsd,
    sideTripTallies,
    availableSideTrips,
    availableGearOptions,
    isFullyFunded,
    inviteLink: `/trips/join/${row.share_token as string}`
  };
}

export function joinGroupExpedition(
  expeditionIdOrToken: string,
  memberData: {
    memberName: string;
    memberEmail: string;
    sideTripVotes?: string[];
    personalGearRentals?: string[];
    shareAmountUsd?: number;
  }
): GroupMember {
  const db = getDatabase();
  const expRow = db.prepare(`
    SELECT * FROM group_expeditions
    WHERE id = ? OR share_token = ?
  `).get(expeditionIdOrToken, expeditionIdOrToken) as Record<string, unknown> | undefined;

  if (!expRow) {
    throw new Error(`Group expedition '${expeditionIdOrToken}' not found`);
  }

  const expeditionId = expRow.id as string;
  const cleanEmail = memberData.memberEmail.trim().toLowerCase();
  const cleanName = memberData.memberName.trim();

  // Check if already a member
  const existingMember = db.prepare(`
    SELECT * FROM group_members
    WHERE expedition_id = ? AND LOWER(member_email) = ?
  `).get(expeditionId, cleanEmail) as Record<string, unknown> | undefined;

  if (existingMember) {
    throw new Error(`Adventurer with email '${cleanEmail}' has already joined this expedition`);
  }

  // Check capacity limits
  const currentMembersCount = (db.prepare(`
    SELECT COUNT(*) as count FROM group_members WHERE expedition_id = ?
  `).get(expeditionId) as { count: number }).count;
  const targetGroupSize = Number(expRow.target_group_size || 4);
  if (currentMembersCount >= targetGroupSize) {
    throw new Error(`Cannot join: group expedition has reached maximum capacity of ${targetGroupSize} members`);
  }

  // Insert new member
  const newMemberId = `grp_mbr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();
  const shareAmount = typeof memberData.shareAmountUsd === 'number' && memberData.shareAmountUsd > 0
    ? memberData.shareAmountUsd
    : 187.50;

  db.prepare(`
    INSERT INTO group_members (
      id, expedition_id, member_name, member_email, role,
      side_trip_votes, personal_gear_rentals, share_amount_usd,
      payment_status, receipt_number, paid_at, joined_at
    ) VALUES (?, ?, ?, ?, 'MEMBER', ?, ?, ?, 'UNPAID', NULL, NULL, ?)
  `).run(
    newMemberId,
    expeditionId,
    cleanName,
    cleanEmail,
    JSON.stringify(memberData.sideTripVotes || []),
    JSON.stringify(memberData.personalGearRentals || []),
    shareAmount,
    now
  );

  return {
    id: newMemberId,
    expeditionId,
    memberName: cleanName,
    memberEmail: cleanEmail,
    role: 'MEMBER',
    sideTripVotes: memberData.sideTripVotes || [],
    personalGearRentals: memberData.personalGearRentals || [],
    shareAmountUsd: shareAmount,
    paymentStatus: 'UNPAID',
    joinedAt: now
  };
}

export function voteGroupSideTrip(memberId: string, sideTripIdOrName: string): {
  memberId: string;
  sideTripVotes: string[];
} {
  const db = getDatabase();
  const memberRow = db.prepare('SELECT * FROM group_members WHERE id = ?').get(memberId) as Record<string, unknown> | undefined;
  if (!memberRow) {
    throw new Error(`Group member with ID ${memberId} not found`);
  }

  let votes = parseJsonArray(memberRow.side_trip_votes as string);
  const cleanTarget = sideTripIdOrName.trim();

  const existingIndex = votes.findIndex((v) => v.toLowerCase() === cleanTarget.toLowerCase());
  if (existingIndex >= 0) {
    // Toggle off
    votes.splice(existingIndex, 1);
  } else {
    // Toggle on
    votes.push(cleanTarget);
  }

  db.prepare('UPDATE group_members SET side_trip_votes = ? WHERE id = ?').run(
    JSON.stringify(votes),
    memberId
  );

  return {
    memberId,
    sideTripVotes: votes
  };
}

export function processGroupMemberPayment(
  memberId: string,
  paymentData?: {
    paymentMethod?: string;
    cardLast4?: string;
    amountUsd?: number;
  }
): {
  success: boolean;
  memberId: string;
  receiptNumber: string;
  paidAt: string;
  amountPaid: number;
  paymentStatus: 'DEPOSIT_PAID';
  expeditionStatus: string;
  paidMembersCount: number;
  targetGroupSize: number;
} {
  const db = getDatabase();

  db.exec('BEGIN TRANSACTION;');
  try {
    const memberRow = db.prepare('SELECT * FROM group_members WHERE id = ?').get(memberId) as Record<string, unknown> | undefined;
    if (!memberRow) {
      throw new Error(`Group member with ID '${memberId}' not found in roster`);
    }

    const expeditionId = memberRow.expedition_id as string;
    const expRow = db.prepare('SELECT * FROM group_expeditions WHERE id = ?').get(expeditionId) as Record<string, unknown> | undefined;
    if (!expRow) {
      throw new Error(`Parent group expedition '${expeditionId}' not found`);
    }

    const receiptNumber = generateGroupReceiptNumber();
    const paidAt = new Date().toISOString();
    const amountPaid = typeof paymentData?.amountUsd === 'number' && paymentData.amountUsd > 0
      ? paymentData.amountUsd
      : Number(memberRow.share_amount_usd || 187.50);

    db.prepare(`
      UPDATE group_members
      SET payment_status = 'DEPOSIT_PAID',
          receipt_number = ?,
          paid_at = ?,
          share_amount_usd = ?
      WHERE id = ?
    `).run(receiptNumber, paidAt, amountPaid, memberId);

    // Count paid members
    const countRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM group_members
      WHERE expedition_id = ? AND payment_status != 'UNPAID'
    `).get(expeditionId) as { count: number };

    const paidMembersCount = countRow ? Number(countRow.count) : 1;
    const targetGroupSize = Number(expRow.target_group_size || 4);

    let expeditionStatus = expRow.status as string;
    if (paidMembersCount >= targetGroupSize && expeditionStatus === 'ORGANIZING') {
      expeditionStatus = 'CONFIRMED';
      db.prepare('UPDATE group_expeditions SET status = ? WHERE id = ?').run(expeditionStatus, expeditionId);
    }

    db.exec('COMMIT;');

    return {
      success: true,
      memberId,
      receiptNumber,
      paidAt,
      amountPaid,
      paymentStatus: 'DEPOSIT_PAID',
      expeditionStatus,
      paidMembersCount,
      targetGroupSize
    };
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    throw err;
  }
}

export function getGroupExpeditionsForUser(emailOrUserId: string): GroupExpeditionWithDetails[] {
  const db = getDatabase();
  const clean = emailOrUserId.trim().toLowerCase();

  const rows = db.prepare(`
    SELECT DISTINCT ge.*
    FROM group_expeditions ge
    LEFT JOIN group_members gm ON ge.id = gm.expedition_id
    WHERE ge.leader_user_id = ?
       OR LOWER(ge.leader_email) = ?
       OR LOWER(gm.member_email) = ?
    ORDER BY ge.created_at DESC
  `).all(emailOrUserId, clean, clean) as Record<string, unknown>[];

  return rows
    .map((r) => getGroupExpeditionByToken(r.share_token as string))
    .filter((e): e is GroupExpeditionWithDetails => e !== null);
}

export function getAllGroupExpeditions(): GroupExpeditionWithDetails[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT share_token FROM group_expeditions ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return rows
    .map((r) => getGroupExpeditionByToken(r.share_token as string))
    .filter((e): e is GroupExpeditionWithDetails => e !== null);
}




// ==========================================
// GEAR MANIFEST & PORTER LOAD BALANCER (Sprint 9.1)
// ==========================================

export function createOrUpdateGearManifest(data: {
  id?: string;
  expeditionId?: string;
  bookingId?: string;
  trekkerName: string;
  trekkerEmail?: string;
  bodyWeightKg?: number;
  targetAltitudeM?: number;
  groupSize?: number;
  daypackWeightKg: number;
  duffelWeightKg: number;
  items?: ManifestItemEntry[];
  notes?: string;
}): GearManifest {
  const db = getDatabase();
  const id = data.id || `gman_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();
  const trekkerName = (data.trekkerName || 'Expedition Trekker').trim();
  const trekkerEmail = data.trekkerEmail?.trim().toLowerCase() || null;
  const bodyWeightKg = Number(data.bodyWeightKg) || 70.0;
  const targetAltitudeM = Number(data.targetAltitudeM) || 4500;
  const groupSize = Math.max(1, Math.floor(Number(data.groupSize) || 1));
  const daypackWeightKg = Math.round((Number(data.daypackWeightKg) || 0) * 10) / 10;
  const duffelWeightKg = Math.round((Number(data.duffelWeightKg) || 0) * 10) / 10;
  const totalWeightKg = Math.round((daypackWeightKg + duffelWeightKg) * 10) / 10;

  // Altitude factor
  const deltaThousands = Math.max(0, (targetAltitudeM - 2500) / 1000);
  const altitudeMultiplier = 1.0 + deltaThousands * 0.12;
  const effectiveExertionKg = Math.round(daypackWeightKg * altitudeMultiplier * 10) / 10;

  // Porter recommendation & compliance
  const totalDuffelKg = duffelWeightKg * groupSize;
  const porterCountRecommended = Math.max(1, Math.ceil(totalDuffelKg / 25.0));
  const avgPorterLoad = totalDuffelKg / porterCountRecommended;

  let ippgCompliance: 'COMPLIANT' | 'WARNING' | 'VIOLATION' = 'COMPLIANT';
  if (avgPorterLoad > 25.0) {
    ippgCompliance = 'VIOLATION';
  } else if (avgPorterLoad > 20.0) {
    ippgCompliance = 'WARNING';
  }

  const itemsJson = JSON.stringify(data.items || []);

  const existing = db.prepare('SELECT id FROM gear_manifests WHERE id = ?').get(id);
  if (existing) {
    db.prepare(`
      UPDATE gear_manifests
      SET expedition_id = ?,
          booking_id = ?,
          trekker_name = ?,
          trekker_email = ?,
          body_weight_kg = ?,
          target_altitude_m = ?,
          group_size = ?,
          daypack_weight_kg = ?,
          duffel_weight_kg = ?,
          total_weight_kg = ?,
          effective_exertion_kg = ?,
          porter_count_recommended = ?,
          ippg_compliance = ?,
          items_json = ?,
          notes = ?
      WHERE id = ?
    `).run(
      data.expeditionId || null,
      data.bookingId || null,
      trekkerName,
      trekkerEmail,
      bodyWeightKg,
      targetAltitudeM,
      groupSize,
      daypackWeightKg,
      duffelWeightKg,
      totalWeightKg,
      effectiveExertionKg,
      porterCountRecommended,
      ippgCompliance,
      itemsJson,
      data.notes || null,
      id
    );
  } else {
    db.prepare(`
      INSERT INTO gear_manifests (
        id, expedition_id, booking_id, trekker_name, trekker_email,
        body_weight_kg, target_altitude_m, group_size, daypack_weight_kg,
        duffel_weight_kg, total_weight_kg, effective_exertion_kg,
        porter_count_recommended, ippg_compliance, items_json, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.expeditionId || null,
      data.bookingId || null,
      trekkerName,
      trekkerEmail,
      bodyWeightKg,
      targetAltitudeM,
      groupSize,
      daypackWeightKg,
      duffelWeightKg,
      totalWeightKg,
      effectiveExertionKg,
      porterCountRecommended,
      ippgCompliance,
      itemsJson,
      data.notes || null,
      now
    );
  }

  return {
    id,
    expeditionId: data.expeditionId || undefined,
    bookingId: data.bookingId || undefined,
    trekkerName,
    trekkerEmail: trekkerEmail || undefined,
    bodyWeightKg,
    targetAltitudeM,
    groupSize,
    daypackWeightKg,
    duffelWeightKg,
    totalWeightKg,
    effectiveExertionKg,
    porterCountRecommended,
    ippgCompliance,
    items: data.items || [],
    notes: data.notes || undefined,
    createdAt: now
  };
}

export function getGearManifestById(id: string): GearManifest | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM gear_manifests WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  let items: ManifestItemEntry[] = [];
  try {
    items = JSON.parse((row.items_json as string) || '[]');
  } catch {
    items = [];
  }

  return {
    id: row.id as string,
    expeditionId: (row.expedition_id as string) || undefined,
    bookingId: (row.booking_id as string) || undefined,
    trekkerName: row.trekker_name as string,
    trekkerEmail: (row.trekker_email as string) || undefined,
    bodyWeightKg: Number(row.body_weight_kg || 70.0),
    targetAltitudeM: Number(row.target_altitude_m || 4500),
    groupSize: Number(row.group_size || 1),
    daypackWeightKg: Number(row.daypack_weight_kg || 0),
    duffelWeightKg: Number(row.duffel_weight_kg || 0),
    totalWeightKg: Number(row.total_weight_kg || 0),
    effectiveExertionKg: Number(row.effective_exertion_kg || 0),
    porterCountRecommended: Number(row.porter_count_recommended || 1),
    ippgCompliance: (row.ippg_compliance as 'COMPLIANT' | 'WARNING' | 'VIOLATION') || 'COMPLIANT',
    items,
    notes: (row.notes as string) || undefined,
    createdAt: row.created_at as string
  };
}

export function getGearManifestsByExpeditionId(expeditionId: string): GearManifest[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT id FROM gear_manifests WHERE expedition_id = ? ORDER BY created_at DESC').all(expeditionId) as Record<string, unknown>[];
  return rows.map((r) => getGearManifestById(r.id as string)).filter((m): m is GearManifest => m !== null);
}

export function getGearManifestsByEmail(email: string): GearManifest[] {
  const db = getDatabase();
  const clean = email.trim().toLowerCase();
  const rows = db.prepare('SELECT id FROM gear_manifests WHERE LOWER(trekker_email) = ? ORDER BY created_at DESC').all(clean) as Record<string, unknown>[];
  return rows.map((r) => getGearManifestById(r.id as string)).filter((m): m is GearManifest => m !== null);
}

export function getAllGearManifests(): GearManifest[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT id FROM gear_manifests ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return rows.map((r) => getGearManifestById(r.id as string)).filter((m): m is GearManifest => m !== null);
}


export function seedOfficialGearManifests(db: DatabaseSync) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO gear_manifests (
      id, expedition_id, booking_id, trekker_name, trekker_email,
      body_weight_kg, target_altitude_m, group_size, daypack_weight_kg,
      duffel_weight_kg, total_weight_kg, effective_exertion_kg,
      porter_count_recommended, ippg_compliance, items_json, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Tenzing Norgay Jr. - Team Sagarmatha EBC
  insert.run(
    'gman_ebc_sagarmatha_tenzing',
    'grp_exp_sagarmatha_2026',
    null,
    'Tenzing Norgay Jr.',
    'tenzing@expeditions.org',
    74.0,
    5364,
    4,
    5.8,
    11.4,
    17.2,
    7.8,
    2,
    'COMPLIANT',
    JSON.stringify([
      { itemId: 'layer-down-jacket', name: '800-Fill Expedition Down Parka', category: 'Alpine Technical Layering', weightGrams: 680, carrier: 'daypack' },
      { itemId: 'microspikes', name: 'Kahtoola Steel Microspikes', category: 'Footwear & Mountain Traction', weightGrams: 380, carrier: 'daypack' },
      { itemId: 'hydration-bottles', name: '2x 1L Insulated Wide-Mouth Hydration', category: 'Packs & Load Carrying', weightGrams: 2400, carrier: 'daypack' },
      { itemId: 'med-altitude-kit', name: 'AMS & Wilderness First Aid Kit', category: 'High-Altitude Medical & First Aid', weightGrams: 520, carrier: 'daypack' },
      { itemId: 'sleep-bag-down', name: '-20°C Down Expedition Sleeping Bag', category: 'Sleep System & Warmth', weightGrams: 1450, carrier: 'duffel' }
    ]),
    'Fully optimized for EBC & Kala Patthar alpine traverse.',
    '2026-10-16T10:00:00Z'
  );

  // 2. Sarah Jenkins - Annapurna High-Pass Circuit
  insert.run(
    'gman_annapurna_circuit_sarah',
    null,
    'bkg_act_1',
    'Sarah Jenkins',
    'sarah.j@example.com',
    63.0,
    5416,
    2,
    5.4,
    10.8,
    16.2,
    7.3,
    1,
    'COMPLIANT',
    JSON.stringify([
      { itemId: 'layer-down-jacket', name: '800-Fill Expedition Down Parka', category: 'Alpine Technical Layering', weightGrams: 680, carrier: 'daypack' },
      { itemId: 'shell-jacket', name: 'GORE-TEX Alpine 3L Hardshell', category: 'Alpine Technical Layering', weightGrams: 440, carrier: 'daypack' },
      { itemId: 'hydration-bottles', name: '2x 1L Insulated Wide-Mouth Hydration', category: 'Packs & Load Carrying', weightGrams: 2400, carrier: 'daypack' },
      { itemId: 'sleep-bag-down', name: '-20°C Down Expedition Sleeping Bag', category: 'Sleep System & Warmth', weightGrams: 1450, carrier: 'duffel' }
    ]),
    'Thorong La Pass packing plan adhering to IPPG ethical load limits.',
    '2026-10-18T14:30:00Z'
  );
}


// ==========================================
// EXPEDITION TEAM DISPATCH CHAT (Sprint 9.2)
// ==========================================

export function createExpeditionMessage(data: {
  expeditionId: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: 'LEADER' | 'MEMBER' | 'GUIDE' | 'SYSTEM';
  messageText: string;
  category?: 'GENERAL' | 'LOGISTICS' | 'GEAR' | 'URGENT' | 'WEATHER';
}): ExpeditionMessage {
  const db = getDatabase();
  const id = `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();
  const cleanExpId = data.expeditionId.trim();
  const cleanName = (data.senderName || 'Expedition Member').trim();
  const cleanEmail = data.senderEmail?.trim().toLowerCase() || null;
  const role = data.senderRole || 'MEMBER';
  const category = data.category || 'GENERAL';
  const text = (data.messageText || '').trim();

  if (!text) {
    throw new Error('Message text cannot be empty');
  }

  db.prepare(`
    INSERT INTO expedition_messages (
      id, expedition_id, sender_name, sender_email, sender_role, message_text, category, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, cleanExpId, cleanName, cleanEmail, role, text, category, now);

  return {
    id,
    expeditionId: cleanExpId,
    senderName: cleanName,
    senderEmail: cleanEmail || undefined,
    senderRole: role,
    messageText: text,
    category,
    createdAt: now
  };
}

export function getExpeditionMessages(expeditionId: string): ExpeditionMessage[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM expedition_messages
    WHERE expedition_id = ?
    ORDER BY created_at ASC
  `).all(expeditionId.trim()) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: r.id as string,
    expeditionId: r.expedition_id as string,
    senderName: r.sender_name as string,
    senderEmail: (r.sender_email as string) || undefined,
    senderRole: (r.sender_role as 'LEADER' | 'MEMBER' | 'GUIDE' | 'SYSTEM') || 'MEMBER',
    messageText: r.message_text as string,
    category: (r.category as 'GENERAL' | 'LOGISTICS' | 'GEAR' | 'URGENT' | 'WEATHER') || 'GENERAL',
    createdAt: r.created_at as string
  }));
}

export function seedOfficialExpeditionMessages(db: DatabaseSync) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO expedition_messages (
      id, expedition_id, sender_name, sender_email, sender_role, message_text, category, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sagarmatha 2026 pre-flight logistics discussion
  const expId = 'grp_exp_sagarmatha_2026';
  insert.run(
    'msg_sagarmatha_welcome_1',
    expId,
    'Tenzing Norgay Jr.',
    'tenzing@expeditions.org',
    'LEADER',
    'Welcome team! We have 3 of 4 spots filled. Remember that Lukla flights strictly enforce 15kg total baggage (10kg duffel + 5kg daypack). Review the Gear Balancer before packing.',
    'LOGISTICS',
    '2026-10-16T09:00:00Z'
  );

  insert.run(
    'msg_sagarmatha_guide_2',
    expId,
    'Ang Dorjee Sherpa',
    'guide.ang@himalayantrails.org',
    'GUIDE',
    'Namaste team! Snow conditions around Kala Patthar (5,644m) are crisp and stable. Microspikes are required for the dawn ascent.',
    'WEATHER',
    '2026-10-17T11:20:00Z'
  );

  insert.run(
    'msg_sagarmatha_member_3',
    expId,
    'Elena Rostova',
    'elena@expeditions.org',
    'MEMBER',
    'Deposit paid! I have reserved a -20C down sleeping bag from the rental gear checklist.',
    'GEAR',
    '2026-10-18T14:15:00Z'
  );
}
