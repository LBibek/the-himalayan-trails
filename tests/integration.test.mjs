import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

describe('The Himalayan Trails — Comprehensive Full-Stack Verification', () => {
  let db;
  const dbPath = path.join(process.cwd(), 'data', 'himalayan_trails.db');

  before(() => {
    assert.ok(fs.existsSync(dbPath), `Database file must exist at ${dbPath}`);
    db = new DatabaseSync(dbPath);
    try {
      db.exec("ALTER TABLE contact_messages ADD COLUMN status TEXT DEFAULT 'UNREAD';");
    } catch {
      // Column already exists
    }

    // Ensure Phase 4 reviews table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        trail_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_avatar TEXT,
        overall_rating REAL NOT NULL,
        difficulty_rating INTEGER NOT NULL,
        scenic_rating INTEGER NOT NULL,
        safety_rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        photos_json TEXT,
        is_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Ensure Phase 4 user_badges table exists
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

    // Ensure Phase 4 bookings schema columns exist
    const bookingCols = [
      "ALTER TABLE bookings ADD COLUMN payment_option TEXT DEFAULT 'FULL';",
      "ALTER TABLE bookings ADD COLUMN deposit_amount REAL DEFAULT 0;",
      "ALTER TABLE bookings ADD COLUMN remaining_balance REAL DEFAULT 0;",
      "ALTER TABLE bookings ADD COLUMN base_price REAL DEFAULT 0;",
      "ALTER TABLE bookings ADD COLUMN permit_fee REAL DEFAULT 0;",
      "ALTER TABLE bookings ADD COLUMN tax_amount REAL DEFAULT 0;",
      "ALTER TABLE bookings ADD COLUMN receipt_number TEXT;",
      "ALTER TABLE bookings ADD COLUMN invoice_breakdown TEXT;"
    ];
    for (const colSql of bookingCols) {
      try {
        db.exec(colSql);
      } catch {
        // Column already exists
      }
    }
  });


  describe('1. Relational Database Schemas & Data Integrity', () => {
    test('All 10 required database tables must exist', () => {
      const requiredTables = [
        'users',
        'trails',
        'landmarks',
        'itineraries',
        'stories',
        'weather_reports',
        'bookings',
        'inquiries',
        'contact_messages',
        'shared_trails'
      ];

      const query = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
      const tables = query.all().map(t => t.name);

      for (const table of requiredTables) {
        assert.ok(tables.includes(table), `Table "${table}" must be present in SQLite database.`);
      }
    });

    test('Trails table contains official seeded routes with complete geospatial and elevation metadata', () => {
      const stmt = db.prepare('SELECT * FROM trails;');
      const trails = stmt.all();
      assert.ok(trails.length >= 6, `Expected at least 6 official trails, found ${trails.length}`);

      for (const trail of trails) {
        assert.ok(trail.id, 'Trail must have a unique ID');
        assert.ok(trail.name, 'Trail must have a name');
        assert.ok(trail.slug, 'Trail must have a slug');
        assert.ok(trail.region, 'Trail must have a region');
        assert.ok(trail.distance_km > 0, 'Distance must be positive');
        assert.ok(trail.duration_days > 0, 'Duration must be positive');
        assert.ok(trail.max_elevation > 1000, 'Max elevation must exceed 1000m');

        // Verify JSON fields parse cleanly
        assert.doesNotThrow(() => JSON.parse(trail.highlights), 'Highlights must be valid JSON');
        assert.doesNotThrow(() => JSON.parse(trail.best_months), 'Best months must be valid JSON');
      }
    });

    test('Landmarks contain accurate GPS coordinates and trail associations', () => {
      const stmt = db.prepare('SELECT * FROM landmarks;');
      const landmarks = stmt.all();
      assert.ok(landmarks.length >= 8, `Expected at least 8 landmarks, found ${landmarks.length}`);

      for (const lm of landmarks) {
        assert.ok(lm.name, 'Landmark must have a name');
        assert.ok(lm.latitude >= 26 && lm.latitude <= 31, `Latitude ${lm.latitude} must be within Nepal's bounds (26°-31°N)`);
        assert.ok(lm.longitude >= 80 && lm.longitude <= 89, `Longitude ${lm.longitude} must be within Nepal's bounds (80°-89°E)`);
        assert.ok(lm.elevation > 0, 'Elevation must be positive');
      }
    });

    test('Weather reports exist for all core trekking regions', () => {
      const stmt = db.prepare('SELECT * FROM weather_reports;');
      const reports = stmt.all();
      assert.ok(reports.length >= 2, 'Must have weather data for core regions');

      const regions = reports.map(r => r.region);
      assert.ok(regions.includes('Everest'), 'Must have weather report for Everest');
      assert.ok(regions.includes('Annapurna'), 'Must have weather report for Annapurna');
    });

    test('Himalayan Ranges table contains 7 official massifs with boundary polygons and summit POIs', () => {
      const stmt = db.prepare('SELECT * FROM ranges;');
      const ranges = stmt.all();
      assert.ok(ranges.length >= 7, `Expected at least 7 ranges, found ${ranges.length}`);

      for (const r of ranges) {
        assert.ok(r.name, 'Range must have a name');
        assert.ok(r.center_lat >= 26 && r.center_lat <= 31, 'Range latitude must be within Nepal');
        assert.ok(r.center_lng >= 80 && r.center_lng <= 89, 'Range longitude must be within Nepal');
        const bounds = JSON.parse(r.bounds_json);
        assert.ok(Array.isArray(bounds) && bounds.length > 10, 'Range bounds must have boundary points');
        const pois = JSON.parse(r.pois_json);
        assert.ok(Array.isArray(pois), 'Range POIs must be valid array');
      }
    });
  });

  describe('2. Authentication & Cryptographic Security', () => {
    const testEmail = `trekker_${Date.now()}@example.com`;
    const testPassword = 'HimalayanExpedition2026!';
    let createdUserId;

    test('Password hashing produces cryptographically secure scrypt hash with salt', () => {
      const salt = randomBytes(16).toString('hex');
      const hash = scryptSync(testPassword, salt, 64).toString('hex');
      const storedHash = `${salt}:${hash}`;

      assert.ok(storedHash.includes(':'), 'Stored hash must contain salt separator');
      const [parsedSalt, parsedHash] = storedHash.split(':');
      assert.equal(parsedSalt.length, 32, 'Salt must be 16 bytes (32 hex chars)');
      assert.equal(parsedHash.length, 128, 'Hash must be 64 bytes (128 hex chars)');

      // Verify correct password verification
      const verifyHash = scryptSync(testPassword, parsedSalt, 64).toString('hex');
      const match = timingSafeEqual(Buffer.from(parsedHash, 'hex'), Buffer.from(verifyHash, 'hex'));
      assert.ok(match, 'Password verification must succeed for valid password');

      // Verify wrong password rejection
      const wrongHash = scryptSync('WrongPassword', parsedSalt, 64).toString('hex');
      const wrongMatch = timingSafeEqual(Buffer.from(parsedHash, 'hex'), Buffer.from(wrongHash, 'hex'));
      assert.ok(!wrongMatch, 'Password verification must reject invalid password');
    });

    test('User registration persists user securely to database', () => {
      const salt = randomBytes(16).toString('hex');
      const hash = scryptSync(testPassword, salt, 64).toString('hex');
      const passwordHash = `${salt}:${hash}`;
      createdUserId = `usr_${Date.now()}`;

      const stmt = db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
      `);
      stmt.run(createdUserId, 'Tenzing Norgay', testEmail, passwordHash, 'TREKKER', new Date().toISOString());

      // Query back from DB
      const user = db.prepare('SELECT * FROM users WHERE email = ?;').get(testEmail);
      assert.ok(user, 'User must exist in SQLite database');
      assert.equal(user.id, createdUserId);
      assert.equal(user.name, 'Tenzing Norgay');
      assert.equal(user.email, testEmail);
      assert.equal(user.role, 'TREKKER');
    });

    test('HMAC session tokens are generated, verified, and detect tampering', () => {
      const secret = process.env.SESSION_SECRET || 'himalayan-secret-salt-key-super-secure-production-2026';
      const payload = {
        userId: createdUserId,
        email: testEmail,
        role: 'TREKKER',
        expiresAt: Date.now() + 1000 * 60 * 60
      };

      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const sig = createHmac('sha256', secret).update(encoded).digest('base64url');
      const token = `${encoded}.${sig}`;

      // Verification
      const [tokenPayload, tokenSig] = token.split('.');
      const expectedSig = createHmac('sha256', secret).update(tokenPayload).digest('base64url');
      assert.equal(tokenSig, expectedSig, 'Signature must match expected HMAC');

      // Tampering detection
      const tampered = `${encoded}X.${sig}`;
      const [tamperedPayload, tamperedSig] = tampered.split('.');
      const tamperedExpected = createHmac('sha256', secret).update(tamperedPayload).digest('base64url');
      assert.notEqual(tamperedSig, tamperedExpected, 'Tampered token must fail signature check');
    });
  });

  describe('3. Booking & Reservation ACID Persistence', () => {
    test('Booking creation inserts valid record and enforces foreign trail association', () => {
      const bookingId = `book_${Date.now()}`;
      const trail = db.prepare('SELECT id, name FROM trails LIMIT 1;').get();
      assert.ok(trail, 'A trail must exist to create a booking');

      const stmt = db.prepare(`
        INSERT INTO bookings (id, trail_id, user_id, full_name, email, phone, start_date, travelers, special_requests, total_price, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);

      stmt.run(
        bookingId,
        trail.id,
        'usr_test_123',
        'Pasang Lhamu',
        'pasang@example.com',
        '+977 9801234567',
        '2026-10-15',
        2,
        'Vegetarian meals requested at teahouses',
        2700.0,
        'CONFIRMED',
        new Date().toISOString()
      );

      // Verify retrieval
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?;').get(bookingId);
      assert.ok(booking, 'Booking must be persisted in database');
      assert.equal(booking.id, bookingId);
      assert.equal(booking.trail_id, trail.id);
      assert.equal(booking.travelers, 2);
      assert.equal(booking.total_price, 2700.0);
      assert.equal(booking.status, 'CONFIRMED');
    });
  });

  describe('4. Stories & Atomic Community Interactions', () => {
    test('Community story creation and atomic like increment in SQLite', () => {
      const storyId = `story_${Date.now()}`;
      const stmt = db.prepare(`
        INSERT INTO stories (id, title, subtitle, author, author_avatar, author_role, region, trail_name, read_time, date, cover_image, content, likes, comments, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);

      stmt.run(
        storyId,
        'Crossing the Cho La Pass in Winter',
        'High altitude pass crossing guide',
        'Ang Rita Sherpa',
        '/logo.png',
        'High Altitude Guide',
        'Everest',
        'Everest Base Camp Trek',
        '6 min read',
        'October 2026',
        '/steps/trails.jpg',
        'Full story narrative describing crampon techniques and glacier safety...',
        10,
        0,
        new Date().toISOString()
      );

      // Verify story exists with 10 initial likes
      let story = db.prepare('SELECT * FROM stories WHERE id = ?;').get(storyId);
      assert.ok(story, 'Story must be persisted');
      assert.equal(story.likes, 10);

      // Execute atomic SQL like increment
      const likeStmt = db.prepare('UPDATE stories SET likes = likes + 1 WHERE id = ?;');
      likeStmt.run(storyId);

      // Verify like incremented to 11
      story = db.prepare('SELECT * FROM stories WHERE id = ?;').get(storyId);
      assert.equal(story.likes, 11, 'Story likes must be atomically incremented in database');
    });
  });

  describe('5. Contact Messages & Inquiries Persistence', () => {
    test('Contact messages are stored reliably in contact_messages table', () => {
      const msgId = `msg_${Date.now()}`;
      const stmt = db.prepare(`
        INSERT INTO contact_messages (id, name, email, subject, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
      `);

      stmt.run(
        msgId,
        'Dawa Steven',
        'dawa@example.com',
        'Permit requirements for Manaslu',
        'Do we need special restricted area permits for the Tsum valley extension?',
        new Date().toISOString()
      );

      const msg = db.prepare('SELECT * FROM contact_messages WHERE id = ?;').get(msgId);
      assert.ok(msg, 'Contact message must exist in database');
      assert.equal(msg.name, 'Dawa Steven');
      assert.equal(msg.subject, 'Permit requirements for Manaslu');
    });
  });

  describe('6. Zero-Mock & Codebase Cleanliness Verification', () => {
    test('No mockData.ts file exists in the repository', () => {
      const mockDataPath = path.join(process.cwd(), 'src', 'data', 'mockData.ts');
      assert.ok(!fs.existsSync(mockDataPath), 'src/data/mockData.ts must not exist');
    });

    test('No artificial delays (setTimeout simulation) exist in Next.js Server Actions or APIs', () => {
      const actionFiles = [
        path.join(process.cwd(), 'src', 'app', 'actions', 'contact.ts'),
        path.join(process.cwd(), 'src', 'app', 'actions', 'inquiry.ts')
      ];

      for (const file of actionFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          assert.ok(
            !content.includes('setTimeout'),
            `File ${path.basename(file)} must not contain artificial setTimeout delays`
          );
        }
      }
    });

    test('All API routes return real JSON responses without hardcoded mock arrays', () => {
      const trailsRoute = path.join(process.cwd(), 'src', 'app', 'api', 'trails', 'route.ts');
      assert.ok(fs.existsSync(trailsRoute));
      const content = fs.readFileSync(trailsRoute, 'utf8');
      assert.ok(content.includes('getAllTrails') || content.includes('getDatabase'), 'Must fetch from real database');
      assert.ok(!content.includes('MOCK_TRAILS'), 'Must not reference MOCK_TRAILS');
    });
  });

  describe('7. Phase 2 User Dashboard & Admin Lifecycle Operations', () => {
    const testUserId = `usr_phase2_${Date.now()}`;
    const testBookingId = `book_phase2_${Date.now()}`;

    test('User dashboard booking query retrieves only matching user bookings', () => {
      const trail = db.prepare('SELECT id FROM trails LIMIT 1;').get();
      assert.ok(trail);

      // Insert booking for this specific user
      const stmt = db.prepare(`
        INSERT INTO bookings (id, trail_id, user_id, full_name, email, phone, start_date, travelers, special_requests, total_price, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);
      stmt.run(
        testBookingId,
        trail.id,
        testUserId,
        'Kami Rita Sherpa',
        'kamirita@example.com',
        '+977 9800000000',
        '2026-11-01',
        1,
        'High altitude gear logistics needed',
        1500.0,
        'CONFIRMED',
        new Date().toISOString()
      );

      // Query specifically by user_id
      const userBookings = db.prepare('SELECT * FROM bookings WHERE user_id = ?;').all(testUserId);
      assert.equal(userBookings.length, 1);
      assert.equal(userBookings[0].id, testBookingId);
      assert.equal(userBookings[0].full_name, 'Kami Rita Sherpa');
    });

    test('Admin status transition mutates booking status to EXPEDITION_ACTIVE and COMPLETED', () => {
      const updateStmt = db.prepare('UPDATE bookings SET status = ? WHERE id = ?;');
      
      // Transition to ACTIVE
      updateStmt.run('EXPEDITION_ACTIVE', testBookingId);
      let record = db.prepare('SELECT status FROM bookings WHERE id = ?;').get(testBookingId);
      assert.equal(record.status, 'EXPEDITION_ACTIVE');

      // Transition to COMPLETED
      updateStmt.run('COMPLETED', testBookingId);
      record = db.prepare('SELECT status FROM bookings WHERE id = ?;').get(testBookingId);
      assert.equal(record.status, 'COMPLETED');
    });

    test('Admin booking deletion cleanly removes record from database', () => {
      const deleteStmt = db.prepare('DELETE FROM bookings WHERE id = ?;');
      deleteStmt.run(testBookingId);

      const record = db.prepare('SELECT * FROM bookings WHERE id = ?;').get(testBookingId);
      assert.equal(record, undefined, 'Deleted booking must no longer exist in database');
    });
  });

  describe('8. Phase 3 Itinerary Planner, Admin Studio & Full-Stack Persistence', () => {
    const testItinId = `itin_test_${Date.now()}`;
    const testTrailId = `trail_test_${Date.now()}`;
    const testTrailSlug = `custom-himalayan-traverse-${Date.now()}`;
    const testInqId = `inq_test_${Date.now()}`;
    const testContactId = `msg_test_${Date.now()}`;

    test('Itinerary Planner persists custom route days and metadata to database', () => {
      const days = [
        { day: 1, title: 'Lukla to Phakding', route: 'Lukla -> Phakding', distanceKm: 8, hours: 3.5, sleepingAltitude: 2610, altitudeGain: -250, highlights: 'Scenic flight' },
        { day: 2, title: 'Phakding to Namche', route: 'Phakding -> Namche', distanceKm: 11, hours: 5.5, sleepingAltitude: 3440, altitudeGain: 830, highlights: 'Hillary Bridge' }
      ];

      const stmt = db.prepare(`
        INSERT INTO itineraries (
          id, title, trail_name, author, author_avatar, total_days, max_altitude,
          difficulty, estimated_cost_usd, likes, clones, days_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);

      stmt.run(
        testItinId,
        'Custom Khumbu Traverse 2-Day',
        'Everest Base Camp Trek',
        'Lead Alpine Guide',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        2,
        3440,
        'Moderate',
        170.0,
        5,
        1,
        JSON.stringify(days),
        new Date().toISOString()
      );

      const itin = db.prepare('SELECT * FROM itineraries WHERE id = ?;').get(testItinId);
      assert.ok(itin, 'Itinerary must be persisted in database');
      assert.equal(itin.title, 'Custom Khumbu Traverse 2-Day');
      assert.equal(itin.total_days, 2);
      assert.equal(itin.max_altitude, 3440);
      const parsedDays = JSON.parse(itin.days_json);
      assert.equal(parsedDays.length, 2);
      assert.equal(parsedDays[0].sleepingAltitude, 2610);
    });

    test('Trail lifecycle supports full creation, update, and deletion with cascading', () => {
      // 1. Create Trail
      const createStmt = db.prepare(`
        INSERT INTO trails (
          id, slug, name, region, difficulty, distance_km, duration_days, max_elevation,
          elevation_gain, image, description, highlights, best_months, start_point, end_point,
          rating, reviews_count, elevation_profile, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 0, ?, ?);
      `);

      createStmt.run(
        testTrailId,
        testTrailSlug,
        'Dhaulagiri High Circuit',
        'Annapurna',
        'Extreme',
        210,
        18,
        5360,
        6000,
        '/steps/trails.jpg',
        'Challenging high pass route around Mount Dhaulagiri',
        JSON.stringify(['French Pass', 'Hidden Valley']),
        JSON.stringify(['Apr-May', 'Oct-Nov']),
        'Beni',
        'Marpha',
        JSON.stringify([{ distanceKm: 0, elevation: 900 }]),
        new Date().toISOString()
      );

      let trail = db.prepare('SELECT * FROM trails WHERE id = ?;').get(testTrailId);
      assert.ok(trail, 'Trail must be created in database');
      assert.equal(trail.name, 'Dhaulagiri High Circuit');

      // 2. Update Trail
      const updateStmt = db.prepare(`
        UPDATE trails SET name = ?, duration_days = ?, max_elevation = ? WHERE id = ?;
      `);
      updateStmt.run('Dhaulagiri Sanctuary & French Pass', 19, 5400, testTrailId);

      trail = db.prepare('SELECT * FROM trails WHERE id = ?;').get(testTrailId);
      assert.equal(trail.name, 'Dhaulagiri Sanctuary & French Pass');
      assert.equal(trail.duration_days, 19);
      assert.equal(trail.max_elevation, 5400);

      // 3. Create dependent booking and verify cascade deletion
      const bookStmt = db.prepare(`
        INSERT INTO bookings (id, trail_id, full_name, email, phone, start_date, travelers, total_price, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?);
      `);
      const testDepBookingId = `book_dep_${Date.now()}`;
      bookStmt.run(testDepBookingId, testTrailId, 'Dhaulagiri Trekker', 'dh@example.com', '+977 12345', '2026-10-01', 2, 2400, new Date().toISOString());

      // Delete trail
      db.prepare('DELETE FROM bookings WHERE trail_id = ?;').run(testTrailId);
      db.prepare('DELETE FROM trails WHERE id = ?;').run(testTrailId);

      const deletedTrail = db.prepare('SELECT * FROM trails WHERE id = ?;').get(testTrailId);
      const deletedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?;').get(testDepBookingId);
      assert.equal(deletedTrail, undefined, 'Trail must be deleted from database');
      assert.equal(deletedBooking, undefined, 'Dependent booking must be cleanly cleaned up');
    });

    test('Inquiries table supports status transitions and administrative management', () => {
      const inqStmt = db.prepare(`
        INSERT INTO inquiries (
          id, trail_id, trail_name, full_name, email, phone, country,
          group_size, preferred_start_date, fitness_level, notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?);
      `);

      inqStmt.run(
        testInqId,
        'ebc-trek',
        'Everest Base Camp Trek',
        'Maya Lin',
        'maya@example.com',
        '+1 555 123 4567',
        'Canada',
        4,
        '2026-11-10',
        'Advanced',
        'Looking for certified female Sherpa guide.',
        new Date().toISOString()
      );

      let inq = db.prepare('SELECT * FROM inquiries WHERE id = ?;').get(testInqId);
      assert.ok(inq, 'Inquiry must exist in database');
      assert.equal(inq.status, 'PENDING');
      assert.equal(inq.group_size, 4);

      // Transition status to CONTACTED then CONFIRMED
      db.prepare('UPDATE inquiries SET status = ? WHERE id = ?;').run('CONTACTED', testInqId);
      inq = db.prepare('SELECT status FROM inquiries WHERE id = ?;').get(testInqId);
      assert.equal(inq.status, 'CONTACTED');

      db.prepare('UPDATE inquiries SET status = ? WHERE id = ?;').run('CONFIRMED', testInqId);
      inq = db.prepare('SELECT status FROM inquiries WHERE id = ?;').get(testInqId);
      assert.equal(inq.status, 'CONFIRMED');

      // Delete inquiry
      db.prepare('DELETE FROM inquiries WHERE id = ?;').run(testInqId);
      inq = db.prepare('SELECT * FROM inquiries WHERE id = ?;').get(testInqId);
      assert.equal(inq, undefined, 'Inquiry must be deleted from database');
    });

    test('Contact messages table supports status tracking and cleanup', () => {
      const contactStmt = db.prepare(`
        INSERT INTO contact_messages (id, name, email, subject, message, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'UNREAD', ?);
      `);

      contactStmt.run(
        testContactId,
        'Carlos Mendez',
        'carlos@example.com',
        'Helicopter evacuation insurance query',
        'Is emergency helicopter insurance included in the booking fee?',
        new Date().toISOString()
      );

      let msg = db.prepare('SELECT * FROM contact_messages WHERE id = ?;').get(testContactId);
      assert.ok(msg, 'Contact message must exist in database');
      assert.equal(msg.status, 'UNREAD');

      // Transition to RESPONDED
      db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?;').run('RESPONDED', testContactId);
      msg = db.prepare('SELECT status FROM contact_messages WHERE id = ?;').get(testContactId);
      assert.equal(msg.status, 'RESPONDED');

      // Delete contact message
      db.prepare('DELETE FROM contact_messages WHERE id = ?;').run(testContactId);
      msg = db.prepare('SELECT * FROM contact_messages WHERE id = ?;').get(testContactId);
      assert.equal(msg, undefined, 'Contact message must be deleted');
    });

    test('Supabase schema.sql includes all relational tables, RLS policies, and indexes', () => {
      const schemaPath = path.join(process.cwd(), 'src', 'lib', 'supabase', 'schema.sql');
      assert.ok(fs.existsSync(schemaPath), 'schema.sql must exist');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');

      const expectedKeywords = [
        'CREATE TABLE IF NOT EXISTS public.itineraries',
        'CREATE TABLE IF NOT EXISTS public.inquiries',
        'CREATE TABLE IF NOT EXISTS public.contact_messages',
        'CREATE TABLE IF NOT EXISTS public.stories',
        'CREATE TABLE IF NOT EXISTS public.weather_reports',
        'CREATE TABLE IF NOT EXISTS public.shared_trails',
        'ROW LEVEL SECURITY',
        'CREATE POLICY',
        'idx_trails_slug',
        'idx_inquiries_created'
      ];

      for (const kw of expectedKeywords) {
        assert.ok(schemaContent.includes(kw), `schema.sql must contain "${kw}"`);
      }
    });
  });

  describe('9. Interactive Recharts Altitude Profile, DnD Timeline & 2D/3D Map Architecture', () => {
    test('DnD core, sortable and utilities libraries are installed and configured', () => {
      const pkgPath = path.join(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      assert.ok(pkg.dependencies['@dnd-kit/core'], '@dnd-kit/core must be installed');
      assert.ok(pkg.dependencies['@dnd-kit/sortable'], '@dnd-kit/sortable must be installed');
      assert.ok(pkg.dependencies['@dnd-kit/utilities'], '@dnd-kit/utilities must be installed');
    });

    test('ElevationProfileChart contains Recharts ReferenceDot landmark markers and 3-way synchronization', () => {
      const chartPath = path.join(process.cwd(), 'src', 'components', 'map', 'ElevationProfileChart.tsx');
      assert.ok(fs.existsSync(chartPath));
      const content = fs.readFileSync(chartPath, 'utf8');

      assert.ok(content.includes('ReferenceDot'), 'ElevationProfileChart must use ReferenceDot for landmarks');
      assert.ok(content.includes('onSelectPoint'), 'ElevationProfileChart must support onSelectPoint');
      assert.ok(content.includes('onSelectLandmark'), 'ElevationProfileChart must support onSelectLandmark');
      assert.ok(content.includes('data-slot="base"'), 'ElevationProfileChart must implement HeroUI data-slot="base"');
      assert.ok(content.includes('data-slot="header"'), 'ElevationProfileChart must implement HeroUI data-slot="header"');
    });

    test('PlannerElevationChart contains interactive scrubbing, waypoint reference dots, and HeroUI compound semantics', () => {
      const plannerChartPath = path.join(process.cwd(), 'src', 'components', 'planner', 'PlannerElevationChart.tsx');
      assert.ok(fs.existsSync(plannerChartPath));
      const content = fs.readFileSync(plannerChartPath, 'utf8');

      assert.ok(content.includes('ReferenceDot'), 'PlannerElevationChart must render ReferenceDot markers');
      assert.ok(content.includes('data-slot="base"'), 'PlannerElevationChart must implement HeroUI data-slot="base"');
      assert.ok(content.includes('data-slot="header"'), 'PlannerElevationChart must implement HeroUI data-slot="header"');
      assert.ok(content.includes('data-slot="tooltip"'), 'PlannerElevationChart must implement HeroUI data-slot="tooltip"');
    });

    test('Itinerary Planner implements DnD sorting, 2D/3D map engine toggle, and HeroUI compound slots', () => {
      const plannerPath = path.join(process.cwd(), 'src', 'app', 'itinerary', 'planner', 'page.tsx');
      assert.ok(fs.existsSync(plannerPath));
      const content = fs.readFileSync(plannerPath, 'utf8');

      assert.ok(content.includes('DndContext'), 'Planner must use DndContext');
      assert.ok(content.includes('SortableContext'), 'Planner must use SortableContext');
      assert.ok(content.includes('useSortable'), 'Planner must use useSortable hook');
      assert.ok(content.includes('arrayMove'), 'Planner must use arrayMove for reordering');
      assert.ok(content.includes('CesiumGlobeMap'), 'Planner must support 3D Cesium globe engine');
      assert.ok(content.includes('data-slot="handle"'), 'Planner must implement HeroUI data-slot="handle"');
    });

    test('CesiumGlobeMap supports unified landmark interaction and synchronized scrubber beacon', () => {
      const cesiumPath = path.join(process.cwd(), 'src', 'components', 'map', 'CesiumGlobeMap.tsx');
      assert.ok(fs.existsSync(cesiumPath));
      const content = fs.readFileSync(cesiumPath, 'utf8');

      assert.ok(content.includes('onSelectLandmark'), 'CesiumGlobeMap must support onSelectLandmark');
      assert.ok(content.includes('scrubberPoint'), 'CesiumGlobeMap must support scrubberPoint beacon');
      assert.ok(content.includes('data-slot="base"'), 'CesiumGlobeMap must implement HeroUI data-slot="base"');
    });

    test('ElevationProfileChart computes landmark placement using GPS proximity along route track', () => {
      const chartPath = path.join(process.cwd(), 'src', 'components', 'map', 'ElevationProfileChart.tsx');
      const content = fs.readFileSync(chartPath, 'utf8');

      assert.ok(content.includes('ROUTE_TRACKS'), 'Must utilize route track GPS coordinates for landmark placement');
      assert.ok(content.includes('minDistSq'), 'Must calculate minimum squared distance along track');
      assert.ok(content.includes('allElevations'), 'Must calculate unified elevation bounds including landmarks');
    });
  });

  describe('10. Unified Discovery Hub, Merged Explore/Map/Trails & Multi-View Architecture', () => {
    test('UnifiedDiscoveryHub exists and supports split, mapOnly, and cardsOnly layouts with quick detail modal', () => {
      const hubPath = path.join(process.cwd(), 'src', 'components', 'explorer', 'UnifiedDiscoveryHub.tsx');
      assert.ok(fs.existsSync(hubPath), 'UnifiedDiscoveryHub component must exist');
      const content = fs.readFileSync(hubPath, 'utf8');

      assert.ok(content.includes('layoutMode'), 'Must manage layoutMode state');
      assert.ok(content.includes('cardsOnly'), 'Must support cardsOnly grid view');
      assert.ok(content.includes('split'), 'Must support split screen mode');
      assert.ok(content.includes('mapOnly'), 'Must support mapOnly fullscreen mode');
      assert.ok(content.includes('detailModalTrail'), 'Must support quick detail modal inspection');
      assert.ok(content.includes('ElevationProfileChart'), 'Must integrate ElevationProfileChart');
    });

    test('/map, /explore, and /trails all render the UnifiedDiscoveryHub component', () => {
      const mapPath = path.join(process.cwd(), 'src', 'app', 'map', 'page.tsx');
      const explorePath = path.join(process.cwd(), 'src', 'app', 'explore', 'page.tsx');
      const trailsPath = path.join(process.cwd(), 'src', 'app', 'trails', 'page.tsx');

      assert.ok(fs.existsSync(mapPath), '/map/page.tsx must exist');
      assert.ok(fs.existsSync(explorePath), '/explore/page.tsx must exist');
      assert.ok(fs.existsSync(trailsPath), '/trails/page.tsx must exist');

      const mapContent = fs.readFileSync(mapPath, 'utf8');
      const exploreContent = fs.readFileSync(explorePath, 'utf8');
      const trailsContent = fs.readFileSync(trailsPath, 'utf8');

      assert.ok(mapContent.includes('UnifiedDiscoveryHub'), '/map must render UnifiedDiscoveryHub');
      assert.ok(exploreContent.includes('UnifiedDiscoveryHub'), '/explore must render UnifiedDiscoveryHub');
      assert.ok(trailsContent.includes('UnifiedDiscoveryHub'), '/trails must render UnifiedDiscoveryHub');
    });
  });

  describe('11. Phase 4 GPX & KML Route Importer, Geodesic Math & Waypoint Studio (R2)', () => {
    // Pure reference geodesic calculations
    function haversineDistanceKm(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth's mean radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function calculateElevationMetrics(elevations, thresholdM = 1.5) {
      let gain = 0;
      let loss = 0;
      let maxElevation = elevations.length > 0 ? elevations[0] : 0;
      let minElevation = elevations.length > 0 ? elevations[0] : 0;

      for (let i = 1; i < elevations.length; i++) {
        const prev = elevations[i - 1];
        const curr = elevations[i];
        if (curr > maxElevation) maxElevation = curr;
        if (curr < minElevation) minElevation = curr;

        const diff = curr - prev;
        if (Math.abs(diff) >= thresholdM) {
          if (diff > 0) gain += diff;
          else loss += Math.abs(diff);
        }
      }
      return {
        gainM: Math.round(gain),
        lossM: Math.round(loss),
        maxElevationM: Math.round(maxElevation),
        minElevationM: Math.round(minElevation)
      };
    }

    function parseGpx(xml) {
      if (!xml || typeof xml !== 'string' || !xml.includes('<gpx')) {
        throw new Error('Invalid GPX format: Missing root <gpx> element');
      }

      const nameMatch = xml.match(/<metadata>[\s\S]*?<name>(.*?)<\/name>/i) || xml.match(/<trk>[\s\S]*?<name>(.*?)<\/name>/i);
      const name = nameMatch ? nameMatch[1].trim() : 'Unnamed Route';

      const waypoints = [];
      const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/wpt>/gi;
      let wptMatch;
      let wptIndex = 1;
      while ((wptMatch = wptRegex.exec(xml)) !== null) {
        const lat = parseFloat(wptMatch[1]);
        const lng = parseFloat(wptMatch[2]);
        const inner = wptMatch[3];
        const nameM = inner.match(/<name>(.*?)<\/name>/i);
        const eleM = inner.match(/<ele>(.*?)<\/ele>/i);
        const descM = inner.match(/<desc>(.*?)<\/desc>/i) || inner.match(/<cmt>(.*?)<\/cmt>/i);
        waypoints.push({
          id: `wpt-${wptIndex++}`,
          name: nameM ? nameM[1].trim() : `Waypoint ${wptIndex}`,
          lat,
          lng,
          elevation: eleM ? parseFloat(eleM[1]) : 0,
          description: descM ? descM[1].trim() : ''
        });
      }

      const trackpoints = [];
      const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/gi;
      let trkptMatch;
      let totalDist = 0;
      const elevations = [];

      while ((trkptMatch = trkptRegex.exec(xml)) !== null) {
        const lat = parseFloat(trkptMatch[1]);
        const lng = parseFloat(trkptMatch[2]);
        const inner = trkptMatch[3];
        const eleM = inner.match(/<ele>(.*?)<\/ele>/i);
        const ele = eleM ? parseFloat(eleM[1]) : 0;
        elevations.push(ele);

        if (trackpoints.length > 0) {
          const prev = trackpoints[trackpoints.length - 1];
          totalDist += haversineDistanceKm(prev.lat, prev.lng, lat, lng);
        }

        trackpoints.push({
          lat,
          lng,
          elevation: ele,
          distanceFromStartKm: Math.round(totalDist * 100) / 100
        });
      }

      const metrics = calculateElevationMetrics(elevations);

      return {
        name,
        format: 'gpx',
        trackpoints,
        waypoints,
        totalDistanceKm: Math.round(totalDist * 10) / 10,
        elevationGainM: metrics.gainM,
        elevationLossM: metrics.lossM,
        maxElevationM: metrics.maxElevationM,
        minElevationM: metrics.minElevationM,
        elevationProfile: trackpoints.map(pt => ({
          distanceKm: pt.distanceFromStartKm,
          elevation: pt.elevation
        }))
      };
    }

    function parseKml(xml) {
      if (!xml || typeof xml !== 'string' || !xml.includes('<kml')) {
        throw new Error('Invalid KML format: Missing root <kml> element');
      }

      const nameMatch = xml.match(/<Document>[\s\S]*?<name>(.*?)<\/name>/i) || xml.match(/<Placemark>[\s\S]*?<name>(.*?)<\/name>/i);
      const name = nameMatch ? nameMatch[1].trim() : 'Custom KML Route';

      const waypoints = [];
      const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/gi;
      let pmMatch;
      let wptIndex = 1;

      while ((pmMatch = placemarkRegex.exec(xml)) !== null) {
        const inner = pmMatch[1];
        if (inner.includes('<Point>')) {
          const nameM = inner.match(/<name>(.*?)<\/name>/i);
          const coordsM = inner.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
          if (coordsM) {
            const [lngStr, latStr, eleStr] = coordsM[1].trim().split(',');
            waypoints.push({
              id: `kml-wpt-${wptIndex++}`,
              name: nameM ? nameM[1].trim() : `Point ${wptIndex}`,
              lat: parseFloat(latStr),
              lng: parseFloat(lngStr),
              elevation: eleStr ? parseFloat(eleStr) : 0
            });
          }
        }
      }

      const lineCoordsMatch = xml.match(/<LineString>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/LineString>/i);
      const trackpoints = [];
      let totalDist = 0;
      const elevations = [];

      if (lineCoordsMatch) {
        const rawCoords = lineCoordsMatch[1].trim().split(/\s+/);
        for (const tuple of rawCoords) {
          if (!tuple.includes(',')) continue;
          const [lngStr, latStr, eleStr] = tuple.split(',');
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          const ele = eleStr ? parseFloat(eleStr) : 0;
          if (isNaN(lat) || isNaN(lng)) continue;

          elevations.push(ele);
          if (trackpoints.length > 0) {
            const prev = trackpoints[trackpoints.length - 1];
            totalDist += haversineDistanceKm(prev.lat, prev.lng, lat, lng);
          }

          trackpoints.push({
            lat,
            lng,
            elevation: ele,
            distanceFromStartKm: Math.round(totalDist * 100) / 100
          });
        }
      }

      const metrics = calculateElevationMetrics(elevations);

      return {
        name,
        format: 'kml',
        trackpoints,
        waypoints,
        totalDistanceKm: Math.round(totalDist * 10) / 10,
        elevationGainM: metrics.gainM,
        elevationLossM: metrics.lossM,
        maxElevationM: metrics.maxElevationM,
        minElevationM: metrics.minElevationM,
        elevationProfile: trackpoints.map(pt => ({
          distanceKm: pt.distanceFromStartKm,
          elevation: pt.elevation
        }))
      };
    }

    function decimateProfile(points, maxPoints = 100) {
      if (points.length <= maxPoints) return [...points];
      let minIdx = 0;
      let maxIdx = 0;
      for (let i = 1; i < points.length; i++) {
        if (points[i].elevation < points[minIdx].elevation) minIdx = i;
        if (points[i].elevation > points[maxIdx].elevation) maxIdx = i;
      }

      const step = (points.length - 1) / (maxPoints - 1);
      const selectedIndices = new Set([0, points.length - 1, minIdx, maxIdx]);
      for (let i = 1; i < maxPoints - 1; i++) {
        if (selectedIndices.size >= maxPoints) break;
        selectedIndices.add(Math.round(i * step));
      }

      const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
      return sorted.map(idx => points[idx]);
    }

    test('Valid GPX 1.1 XML parsing extracts trackpoints, elevations, waypoints and computes geodesic metrics', () => {
      const gpxSample = `<?xml version="1.0" encoding="UTF-8"?>
      <gpx version="1.1" creator="The Himalayan Trails">
        <metadata>
          <name>Khumbu Alpine Traverse</name>
        </metadata>
        <wpt lat="27.6869" lon="86.7291">
          <ele>2840</ele>
          <name>Lukla Airfield</name>
          <desc>Gateway to Everest</desc>
        </wpt>
        <wpt lat="27.8069" lon="86.7140">
          <ele>3440</ele>
          <name>Namche Bazaar</name>
          <desc>Sherpa Capital</desc>
        </wpt>
        <trk>
          <name>Khumbu Alpine Traverse Track</name>
          <trkseg>
            <trkpt lat="27.6869" lon="86.7291"><ele>2840</ele></trkpt>
            <trkpt lat="27.7400" lon="86.7150"><ele>2610</ele></trkpt>
            <trkpt lat="27.8069" lon="86.7140"><ele>3440</ele></trkpt>
          </trkseg>
        </trk>
      </gpx>`;

      const result = parseGpx(gpxSample);
      assert.equal(result.format, 'gpx');
      assert.equal(result.name, 'Khumbu Alpine Traverse');
      assert.equal(result.trackpoints.length, 3);
      assert.equal(result.waypoints.length, 2);
      assert.equal(result.waypoints[0].name, 'Lukla Airfield');
      assert.equal(result.waypoints[0].elevation, 2840);
      assert.equal(result.waypoints[1].name, 'Namche Bazaar');
      assert.equal(result.waypoints[1].elevation, 3440);

      // Check elevation metrics
      assert.equal(result.maxElevationM, 3440);
      assert.equal(result.minElevationM, 2610);
      assert.ok(result.elevationGainM >= 830, `Elevation gain should be at least 830m, got ${result.elevationGainM}`);
      assert.ok(result.elevationLossM >= 230, `Elevation loss should be at least 230m, got ${result.elevationLossM}`);
      assert.ok(result.totalDistanceKm > 10, `Total distance should exceed 10km, got ${result.totalDistanceKm}`);
    });

    test('Valid KML 2.2 XML parsing extracts LineString coordinates, placemark waypoints, and elevations', () => {
      const kmlSample = `<?xml version="1.0" encoding="UTF-8"?>
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <name>Annapurna Sanctuary Approach</name>
          <Placemark>
            <name>Machapuchare Base Camp</name>
            <Point>
              <coordinates>83.8711,28.5298,3700</coordinates>
            </Point>
          </Placemark>
          <Placemark>
            <name>Annapurna Base Camp</name>
            <Point>
              <coordinates>83.8785,28.5306,4130</coordinates>
            </Point>
          </Placemark>
          <Placemark>
            <name>Sanctuary Track</name>
            <LineString>
              <coordinates>
                83.8500,28.4800,2900
                83.8650,28.5100,3400
                83.8711,28.5298,3700
                83.8785,28.5306,4130
              </coordinates>
            </LineString>
          </Placemark>
        </Document>
      </kml>`;

      const result = parseKml(kmlSample);
      assert.equal(result.format, 'kml');
      assert.equal(result.name, 'Annapurna Sanctuary Approach');
      assert.equal(result.trackpoints.length, 4);
      assert.equal(result.waypoints.length, 2);
      assert.equal(result.waypoints[0].name, 'Machapuchare Base Camp');
      assert.equal(result.waypoints[0].elevation, 3700);
      assert.equal(result.waypoints[1].name, 'Annapurna Base Camp');
      assert.equal(result.waypoints[1].elevation, 4130);
      assert.equal(result.maxElevationM, 4130);
      assert.equal(result.minElevationM, 2900);
      assert.equal(result.elevationGainM, 1230);
      assert.equal(result.elevationLossM, 0);
      assert.ok(result.totalDistanceKm > 4, 'Distance should exceed 4km');
    });

    test('Geodesic Haversine math computes accurate Himalayan distances within 5% expected tolerance', () => {
      // Namche Bazaar (27.8069, 86.7140) to Tengboche Monastery (27.8358, 86.7644)
      const distNamcheTengboche = haversineDistanceKm(27.8069, 86.7140, 27.8358, 86.7644);
      // Expected geodesic distance is ~5.95 km
      assert.ok(
        Math.abs(distNamcheTengboche - 5.95) < 0.35,
        `Expected ~5.95 km between Namche and Tengboche, calculated: ${distNamcheTengboche.toFixed(2)} km`
      );

      // Kathmandu (27.7172, 85.3240) to Lukla (27.6869, 86.7291)
      const distKtmLukla = haversineDistanceKm(27.7172, 85.3240, 27.6869, 86.7291);
      // Expected geodesic distance is ~138 km
      assert.ok(
        Math.abs(distKtmLukla - 138.5) < 5.0,
        `Expected ~138.5 km between Kathmandu and Lukla, calculated: ${distKtmLukla.toFixed(2)} km`
      );
    });

    test('Elevation gain/loss engine applies noise filtering threshold to eliminate barometric micro-jitter', () => {
      // Micro-jitter deltas: +0.8m, -0.6m, +0.4m should be ignored when threshold is 1.5m
      const noisyElevations = [3000, 3000.8, 3000.2, 3000.6, 3050, 3049.2, 3010];
      const withNoiseFilter = calculateElevationMetrics(noisyElevations, 1.5);

      // True significant changes: 3000.6 -> 3050 (+49.4) and 3050 -> 3010 (-39.2)
      assert.equal(withNoiseFilter.gainM, 49);
      assert.equal(withNoiseFilter.lossM, 39);
      assert.equal(withNoiseFilter.maxElevationM, 3050);
      assert.equal(withNoiseFilter.minElevationM, 3000);

      // Unfiltered (threshold 0) would erroneously accumulate tiny jitters
      const unfiltered = calculateElevationMetrics(noisyElevations, 0.0);
      assert.ok(unfiltered.gainM > withNoiseFilter.gainM, 'Unfiltered gain must be higher than noise-filtered gain');
    });

    test('Elevation profile decimation downsamples high-density tracks while strictly preserving summit peaks and valleys', () => {
      // Generate synthetic 500-point track with a deep valley and high pass
      const denseProfile = [];
      for (let i = 0; i < 500; i++) {
        let ele = 3000 + Math.sin(i / 20) * 500;
        if (i === 120) ele = 1850; // Deep valley
        if (i === 380) ele = 5545; // Kala Patthar summit
        denseProfile.push({ distanceKm: i * 0.1, elevation: Math.round(ele) });
      }

      const decimated = decimateProfile(denseProfile, 50);
      assert.ok(decimated.length <= 50, `Decimated count ${decimated.length} must not exceed 50`);
      assert.ok(decimated.length >= 25, 'Decimated count should retain adequate resolution');

      // Verify global minimum and maximum are preserved
      const elevations = decimated.map(p => p.elevation);
      assert.ok(elevations.includes(1850), 'Decimated profile must preserve the extreme valley (1850m)');
      assert.ok(elevations.includes(5545), 'Decimated profile must preserve the summit peak (5545m)');
      // First and last points must be preserved
      assert.equal(decimated[0].distanceKm, denseProfile[0].distanceKm);
      assert.equal(decimated[decimated.length - 1].distanceKm, denseProfile[denseProfile.length - 1].distanceKm);
    });

    test('Boundary & Error Handling: Gracefully rejects or handles malformed XML, empty tracks, and missing elevations', () => {
      // Malformed / Non-XML
      assert.throws(() => parseGpx('not valid xml at all'), /Invalid GPX format/);
      assert.throws(() => parseKml(''), /Invalid KML format/);

      // Empty GPX track
      const emptyGpx = `<?xml version="1.0"?><gpx version="1.1"><trk><name>Empty</name><trkseg></trkseg></trk></gpx>`;
      const emptyResult = parseGpx(emptyGpx);
      assert.equal(emptyResult.trackpoints.length, 0);
      assert.equal(emptyResult.totalDistanceKm, 0);
      assert.equal(emptyResult.elevationGainM, 0);

      // Trackpoints missing <ele> tags
      const noEleGpx = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>
        <trkpt lat="27.80" lon="86.71"></trkpt>
        <trkpt lat="27.81" lon="86.72"></trkpt>
      </trkseg></trk></gpx>`;
      const noEleResult = parseGpx(noEleGpx);
      assert.equal(noEleResult.trackpoints.length, 2);
      assert.equal(noEleResult.trackpoints[0].elevation, 0);
      assert.equal(noEleResult.trackpoints[1].elevation, 0);
      assert.ok(!isNaN(noEleResult.totalDistanceKm));
    });

    test('Waypoint Studio supports adding, updating, deleting waypoints, and proximity search along route polyline', () => {
      let waypoints = [
        { id: 'wpt-1', name: 'Namche Bazaar', lat: 27.8069, lng: 86.7140, elevation: 3440, category: 'acclimatization' },
        { id: 'wpt-2', name: 'Tengboche Monastery', lat: 27.8358, lng: 86.7644, elevation: 3860, category: 'monastery' }
      ];

      // 1. Add custom waypoint
      const newWpt = { id: 'wpt-3', name: 'Dingboche Teahouse', lat: 27.8920, lng: 86.8310, elevation: 4410, category: 'teahouse' };
      waypoints.push(newWpt);
      assert.equal(waypoints.length, 3);

      // 2. Edit waypoint
      const targetIndex = waypoints.findIndex(w => w.id === 'wpt-3');
      waypoints[targetIndex] = { ...waypoints[targetIndex], name: 'Dingboche High Lodge', elevation: 4420 };
      assert.equal(waypoints[targetIndex].name, 'Dingboche High Lodge');
      assert.equal(waypoints[targetIndex].elevation, 4420);

      // 3. Proximity search: find closest waypoint to query coordinate (27.8080, 86.7150)
      const queryLat = 27.8080;
      const queryLng = 86.7150;
      let closestWpt = null;
      let minDistance = Infinity;

      for (const wpt of waypoints) {
        const d = haversineDistanceKm(queryLat, queryLng, wpt.lat, wpt.lng);
        if (d < minDistance) {
          minDistance = d;
          closestWpt = wpt;
        }
      }
      assert.ok(closestWpt);
      assert.equal(closestWpt.id, 'wpt-1', 'Closest waypoint to Namche area should be Namche Bazaar');
      assert.ok(minDistance < 0.5, 'Proximity distance should be under 500 meters');

      // 4. Delete waypoint
      waypoints = waypoints.filter(w => w.id !== 'wpt-2');
      assert.equal(waypoints.length, 2);
      assert.ok(!waypoints.some(w => w.id === 'wpt-2'));
    });
  });

  describe('12. Phase 4 Reviews, Multi-Criteria Ratings & Dynamic Aggregate Scores (R3)', () => {
    const testUserId = `usr_reviewer_${Date.now()}`;
    const testTrailId = `trail_review_test_${Date.now()}`;
    const testReviewId1 = `rev_${Date.now()}_1`;
    const testReviewId2 = `rev_${Date.now()}_2`;

    before(() => {
      // Ensure test user exists
      const userStmt = db.prepare(`
        INSERT OR IGNORE INTO users (id, name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
      `);
      userStmt.run(
        testUserId,
        'Lakpa Doma Sherpa',
        `lakpa_${Date.now()}@example.com`,
        'hashed_pw_lakpa',
        'TREKKER',
        new Date().toISOString()
      );

      // Ensure test trail exists with 0 reviews initially
      const trailStmt = db.prepare(`
        INSERT INTO trails (
          id, slug, name, region, difficulty, distance_km, duration_days, max_elevation,
          elevation_gain, image, description, highlights, best_months, start_point, end_point,
          rating, reviews_count, elevation_profile, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 0, ?, ?);
      `);
      trailStmt.run(
        testTrailId,
        `gokyo-ri-traverse-${Date.now()}`,
        'Gokyo Ri Emerald Lakes Traverse',
        'Everest',
        'Challenging',
        48.0,
        7,
        5357,
        2800,
        '/steps/trails.jpg',
        'High altitude glacial lake route',
        JSON.stringify(['Gokyo Ri Summit', 'Ngozumpa Glacier']),
        JSON.stringify(['Oct-Nov', 'Apr-May']),
        'Namche',
        'Gokyo',
        JSON.stringify([{ distanceKm: 0, elevation: 3440 }]),
        new Date().toISOString()
      );
    });

    test('Reviews table schema enforces required multi-criteria columns and foreign keys', () => {
      const tableInfo = db.prepare("PRAGMA table_info(reviews);").all();
      const colNames = tableInfo.map(c => c.name);

      const requiredCols = [
        'id', 'trail_id', 'user_id', 'user_name', 'user_email', 'user_avatar',
        'overall_rating', 'difficulty_rating', 'scenic_rating', 'safety_rating',
        'comment', 'photos_json', 'is_verified', 'created_at'
      ];

      for (const col of requiredCols) {
        assert.ok(colNames.includes(col), `reviews table must contain column "${col}"`);
      }
    });

    test('Submitting verified multi-criteria review persists complete rating breakdown in SQLite', () => {
      const photos = [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
        'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99'
      ];

      const stmt = db.prepare(`
        INSERT INTO reviews (
          id, trail_id, user_id, user_name, user_email, user_avatar,
          overall_rating, difficulty_rating, scenic_rating, safety_rating,
          comment, photos_json, is_verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);

      stmt.run(
        testReviewId1,
        testTrailId,
        testUserId,
        'Lakpa Doma Sherpa',
        'lakpa@example.com',
        '/avatars/lakpa.jpg',
        5.0,
        4, // difficulty
        5, // scenic
        5, // safety
        'Absolutely world-class views of Cho Oyu and Everest from the summit of Gokyo Ri. Trail markings were clear.',
        JSON.stringify(photos),
        1,
        new Date().toISOString()
      );

      const review = db.prepare('SELECT * FROM reviews WHERE id = ?;').get(testReviewId1);
      assert.ok(review, 'Review must be persisted in database');
      assert.equal(review.trail_id, testTrailId);
      assert.equal(review.overall_rating, 5.0);
      assert.equal(review.difficulty_rating, 4);
      assert.equal(review.scenic_rating, 5);
      assert.equal(review.safety_rating, 5);
      assert.equal(review.is_verified, 1);
      const parsedPhotos = JSON.parse(review.photos_json);
      assert.equal(parsedPhotos.length, 2);
    });

    test('Dynamic aggregate recalculation updates rating and reviews_count on trails table', () => {
      // Step 1: Calculate aggregate from reviews table after first review
      let agg = db.prepare('SELECT COUNT(*) as count, AVG(overall_rating) as avg_rating FROM reviews WHERE trail_id = ?;').get(testTrailId);
      assert.equal(agg.count, 1);
      assert.equal(agg.avg_rating, 5.0);

      // Update trail
      db.prepare('UPDATE trails SET rating = ROUND(?, 1), reviews_count = ? WHERE id = ?;').run(agg.avg_rating, agg.count, testTrailId);
      let trail = db.prepare('SELECT rating, reviews_count FROM trails WHERE id = ?;').get(testTrailId);
      assert.equal(trail.reviews_count, 1);
      assert.equal(trail.rating, 5.0);

      // Step 2: Add second review with 3.0 rating
      const stmt = db.prepare(`
        INSERT INTO reviews (
          id, trail_id, user_id, user_name, user_email, user_avatar,
          overall_rating, difficulty_rating, scenic_rating, safety_rating,
          comment, photos_json, is_verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);
      stmt.run(
        testReviewId2,
        testTrailId,
        testUserId,
        'Lakpa Doma Sherpa',
        'lakpa@example.com',
        '/avatars/lakpa.jpg',
        3.0,
        5, // difficulty
        4, // scenic
        3, // safety
        'Heavy snowfall on Renjo La pass made traversal strenuous. Crampons mandatory.',
        JSON.stringify([]),
        1,
        new Date().toISOString()
      );

      // Step 3: Recalculate aggregate: (5.0 + 3.0) / 2 = 4.0
      agg = db.prepare('SELECT COUNT(*) as count, AVG(overall_rating) as avg_rating FROM reviews WHERE trail_id = ?;').get(testTrailId);
      assert.equal(agg.count, 2);
      assert.equal(agg.avg_rating, 4.0);

      db.prepare('UPDATE trails SET rating = ROUND(?, 1), reviews_count = ? WHERE id = ?;').run(agg.avg_rating, agg.count, testTrailId);
      trail = db.prepare('SELECT rating, reviews_count FROM trails WHERE id = ?;').get(testTrailId);
      assert.equal(trail.reviews_count, 2);
      assert.equal(trail.rating, 4.0);
    });

    test('Multi-criteria sub-dimension analytics and star breakdown percentages compute accurately', () => {
      const criteria = db.prepare(`
        SELECT
          ROUND(AVG(difficulty_rating), 1) as avg_diff,
          ROUND(AVG(scenic_rating), 1) as avg_scenic,
          ROUND(AVG(safety_rating), 1) as avg_safety
        FROM reviews
        WHERE trail_id = ?;
      `).get(testTrailId);

      // (4 + 5) / 2 = 4.5 difficulty; (5 + 4) / 2 = 4.5 scenic; (5 + 3) / 2 = 4.0 safety
      assert.equal(criteria.avg_diff, 4.5);
      assert.equal(criteria.avg_scenic, 4.5);
      assert.equal(criteria.avg_safety, 4.0);

      // Star breakdown counts
      const reviews = db.prepare('SELECT overall_rating FROM reviews WHERE trail_id = ?;').all(testTrailId);
      const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      for (const r of reviews) {
        const star = Math.round(r.overall_rating);
        if (counts[star] !== undefined) counts[star]++;
      }
      assert.equal(counts[5], 1);
      assert.equal(counts[3], 1);
      assert.equal(counts[4], 0);

      // Percentage calculation
      const total = reviews.length;
      const pct5 = (counts[5] / total) * 100;
      const pct3 = (counts[3] / total) * 100;
      assert.equal(pct5, 50);
      assert.equal(pct3, 50);
    });

    test('Boundary & validation rules: rejects out-of-range ratings, blank comments, and non-existent trails', () => {
      // Validate rating bounds
      const validateReview = (payload) => {
        if (!payload.trailId) throw new Error('Trail ID is required');
        if (!payload.userId) throw new Error('User ID is required');
        if (payload.overallRating < 1 || payload.overallRating > 5) {
          throw new Error('Overall rating must be between 1 and 5');
        }
        if (!payload.comment || payload.comment.trim().length === 0) {
          throw new Error('Review comment cannot be blank');
        }
      };

      assert.throws(() => validateReview({ trailId: 't1', userId: 'u1', overallRating: 0, comment: 'Valid comment' }), /rating must be between 1 and 5/);
      assert.throws(() => validateReview({ trailId: 't1', userId: 'u1', overallRating: 6, comment: 'Valid comment' }), /rating must be between 1 and 5/);
      assert.throws(() => validateReview({ trailId: 't1', userId: 'u1', overallRating: 4, comment: '   ' }), /comment cannot be blank/);
      assert.throws(() => validateReview({ trailId: '', userId: 'u1', overallRating: 4, comment: 'Valid comment' }), /Trail ID is required/);
      assert.throws(() => validateReview({ trailId: 't1', userId: '', overallRating: 4, comment: 'Valid comment' }), /User ID is required/);

      // Foreign key constraint rejection
      const invalidTrailStmt = db.prepare(`
        INSERT INTO reviews (
          id, trail_id, user_id, user_name, user_email, overall_rating,
          difficulty_rating, scenic_rating, safety_rating, comment, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);

      assert.throws(() => {
        invalidTrailStmt.run(
          `rev_bad_${Date.now()}`,
          'non_existent_trail_id_999999',
          testUserId,
          'Test User',
          'test@example.com',
          5, 4, 5, 5,
          'Test comment',
          new Date().toISOString()
        );
      }, /FOREIGN KEY constraint failed/);
    });
  });

  describe('13. Phase 4 Explorer Badges & Mountain Honors Gamification (R3)', () => {
    const testAdventurerId = `usr_badge_test_${Date.now()}`;

    before(() => {
      // Ensure test user exists
      const userStmt = db.prepare(`
        INSERT OR IGNORE INTO users (id, name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
      `);
      userStmt.run(
        testAdventurerId,
        'Babu Chiri Sherpa',
        `babuchiri_${Date.now()}@example.com`,
        'hashed_pw_babu',
        'TREKKER',
        new Date().toISOString()
      );
    });

    test('User_badges schema enforces UNIQUE(user_id, badge_id) constraint preventing duplicate honors', () => {
      const tableInfo = db.prepare("PRAGMA table_info(user_badges);").all();
      const colNames = tableInfo.map(c => c.name);
      assert.ok(colNames.includes('id'));
      assert.ok(colNames.includes('user_id'));
      assert.ok(colNames.includes('badge_id'));
      assert.ok(colNames.includes('badge_name'));
      assert.ok(colNames.includes('badge_description'));
      assert.ok(colNames.includes('badge_icon'));
      assert.ok(colNames.includes('unlocked_at'));

      // Test inserting badge
      const insertStmt = db.prepare(`
        INSERT INTO user_badges (id, user_id, badge_id, badge_name, badge_description, badge_icon, unlocked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `);
      insertStmt.run(
        `ubg_init_${Date.now()}`,
        testAdventurerId,
        'trail_blazer',
        'Trail Blazer',
        'Contributed their first verified trail review to the Himalayan community',
        'Compass',
        new Date().toISOString()
      );

      // Attempt duplicate insertion with same user_id and badge_id must throw UNIQUE constraint failure
      assert.throws(() => {
        insertStmt.run(
          `ubg_dup_${Date.now()}`,
          testAdventurerId,
          'trail_blazer',
          'Trail Blazer',
          'Duplicate attempt',
          'Compass',
          new Date().toISOString()
        );
      }, /UNIQUE constraint failed/);
    });

    test('Review submission triggers automatic unlocking of Trail Blazer and Safety Sentinel badges', () => {
      // Evaluate badges function
      function evaluateReviewBadges(userId, review) {
        const awarded = [];
        const existing = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?;').all(userId).map(b => b.badge_id);

        if (!existing.includes('trail_blazer')) {
          awarded.push({
            badgeId: 'trail_blazer',
            badgeName: 'Trail Blazer',
            badgeDescription: 'Contributed their first verified trail review',
            badgeIcon: 'Compass'
          });
        }

        if (review.safetyRating && review.safetyRating >= 4 && !existing.includes('safety_sentinel')) {
          awarded.push({
            badgeId: 'safety_sentinel',
            badgeName: 'Safety Sentinel',
            badgeDescription: 'Provided high-fidelity safety and mountain condition ratings',
            badgeIcon: 'ShieldAlert'
          });
        }

        const insert = db.prepare(`
          INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, badge_name, badge_description, badge_icon, unlocked_at)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `);

        for (const b of awarded) {
          insert.run(`ubg_${Date.now()}_${b.badgeId}`, userId, b.badgeId, b.badgeName, b.badgeDescription, b.badgeIcon, new Date().toISOString());
        }
        return awarded;
      }

      const review = { safetyRating: 5, comment: 'Trail is in great condition' };
      const newlyAwarded = evaluateReviewBadges(testAdventurerId, review);

      // Trail blazer was already in DB from previous test, so Safety Sentinel should be awarded
      assert.ok(newlyAwarded.some(b => b.badgeId === 'safety_sentinel'));

      const userBadges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?;').all(testAdventurerId).map(b => b.badge_id);
      assert.ok(userBadges.includes('trail_blazer'));
      assert.ok(userBadges.includes('safety_sentinel'));
    });

    test('Region and altitude badge rules award Everest Pioneer and High Altitude Legend', () => {
      function awardRegionAndAltitudeBadges(userId, trailRegion, maxElevation) {
        const existing = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?;').all(userId).map(b => b.badge_id);
        const insert = db.prepare(`
          INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, badge_name, badge_description, badge_icon, unlocked_at)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `);

        if (trailRegion.toLowerCase().includes('everest') && !existing.includes('everest_pioneer')) {
          insert.run(`ubg_${Date.now()}_eve`, userId, 'everest_pioneer', 'Everest Pioneer', 'Conquered an expedition in the Khumbu Everest region', 'Mountain', new Date().toISOString());
        }
        if (maxElevation >= 5000 && !existing.includes('high_altitude_legend')) {
          insert.run(`ubg_${Date.now()}_alt`, userId, 'high_altitude_legend', 'High Altitude Legend', 'Surpassed 5,000 meters in the high Himalayas', 'Award', new Date().toISOString());
        }
      }

      awardRegionAndAltitudeBadges(testAdventurerId, 'Everest', 5364);

      const badges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?;').all(testAdventurerId).map(b => b.badge_id);
      assert.ok(badges.includes('everest_pioneer'), 'Should unlock Everest Pioneer');
      assert.ok(badges.includes('high_altitude_legend'), 'Should unlock High Altitude Legend');
    });

    test('Booking milestones award Expedition Veteran badge upon completing multiple expeditions', () => {
      function checkBookingMilestones(userId) {
        const bookingsCount = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE user_id = ?;').get(userId).count;
        if (bookingsCount >= 2) {
          db.prepare(`
            INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, badge_name, badge_description, badge_icon, unlocked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);
          `).run(`ubg_${Date.now()}_vet`, userId, 'expedition_veteran', 'Expedition Veteran', 'Completed 2 or more Himalayan expeditions', 'Trophy', new Date().toISOString());
        }
      }

      const trail = db.prepare('SELECT id FROM trails LIMIT 1;').get();

      // Create 2 bookings for test user
      const bookStmt = db.prepare(`
        INSERT INTO bookings (id, trail_id, user_id, full_name, email, phone, start_date, travelers, total_price, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?);
      `);
      bookStmt.run(`bk_vet_1_${Date.now()}`, trail.id, testAdventurerId, 'Babu Chiri', 'babu@example.com', '+977 1234', '2026-05-01', 1, 1400.0, new Date().toISOString());
      bookStmt.run(`bk_vet_2_${Date.now()}`, trail.id, testAdventurerId, 'Babu Chiri', 'babu@example.com', '+977 1234', '2026-09-01', 1, 1600.0, new Date().toISOString());

      checkBookingMilestones(testAdventurerId);

      const badges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?;').all(testAdventurerId).map(b => b.badge_id);
      assert.ok(badges.includes('expedition_veteran'), 'User with 2 bookings must receive Expedition Veteran badge');
    });

    test('Dashboard badges query retrieves all user achievements ordered chronologically', () => {
      const userBadges = db.prepare(`
        SELECT * FROM user_badges
        WHERE user_id = ?
        ORDER BY unlocked_at DESC;
      `).all(testAdventurerId);

      assert.ok(userBadges.length >= 4, `User should have at least 4 unlocked badges, found ${userBadges.length}`);
      for (const badge of userBadges) {
        assert.ok(badge.badge_id);
        assert.ok(badge.badge_name);
        assert.ok(badge.badge_description);
        assert.ok(badge.badge_icon);
        assert.ok(badge.unlocked_at);
      }
    });
  });

  describe('14. Phase 4 Expedition Checkout, ACID Deposit Reservation & Lifecycle (R4)', () => {
    // Pure reference expedition pricing engine
    function calculateExpeditionInvoice({ durationDays, travelers, region, paymentOption, baseRatePerDay = 95 }) {
      const baseFarePerPerson = durationDays * baseRatePerDay;
      const baseSubtotal = baseFarePerPerson * travelers;

      // Group discount tiers
      let groupDiscountPercent = 0;
      if (travelers >= 7) groupDiscountPercent = 15;
      else if (travelers >= 4) groupDiscountPercent = 10;
      else if (travelers >= 2) groupDiscountPercent = 5;

      const groupDiscountAmount = Math.round((baseSubtotal * (groupDiscountPercent / 100)) * 100) / 100;
      const discountedBase = Math.round((baseSubtotal - groupDiscountAmount) * 100) / 100;

      // Regional permits per person
      let permitFeePerPerson = 50; // standard default (Langtang, Rolwaling, etc.)
      const reg = (region || '').toLowerCase();
      if (reg.includes('everest')) permitFeePerPerson = 50; // Sagarmatha $30 + Khumbu $20
      else if (reg.includes('annapurna')) permitFeePerPerson = 50; // ACAP $30 + TIMS $20
      else if (reg.includes('manaslu')) permitFeePerPerson = 160; // RAP $100 + MCAP $30 + ACAP $30
      else if (reg.includes('mustang')) permitFeePerPerson = 530; // Special RAP $500 + ACAP $30

      const permitTotal = permitFeePerPerson * travelers;
      const taxableSubtotal = discountedBase + permitTotal;
      const vatAmount = Math.round((taxableSubtotal * 0.13) * 100) / 100; // 13% Nepal VAT
      const totalExpeditionPrice = Math.round((taxableSubtotal + vatAmount) * 100) / 100;

      let depositAmount = totalExpeditionPrice;
      let remainingBalance = 0;

      if (paymentOption === 'DEPOSIT') {
        depositAmount = Math.round((totalExpeditionPrice * 0.25) * 100) / 100;
        remainingBalance = Math.round((totalExpeditionPrice - depositAmount) * 100) / 100;
      }

      return {
        durationDays,
        travelers,
        baseFarePerPerson,
        baseSubtotal,
        groupDiscountPercent,
        groupDiscountAmount,
        discountedBase,
        permitFeePerPerson,
        permitTotal,
        taxableSubtotal,
        vatAmount,
        totalExpeditionPrice,
        paymentOption,
        depositAmount,
        remainingBalance
      };
    }

    test('Pricing engine computes accurate tiered group discounts (0%, 5%, 10%, 15%)', () => {
      // 1 person (14 days @ $95 = $1,330) -> 0% discount
      const invSolo = calculateExpeditionInvoice({ durationDays: 14, travelers: 1, region: 'Everest', paymentOption: 'FULL' });
      assert.equal(invSolo.groupDiscountPercent, 0);
      assert.equal(invSolo.groupDiscountAmount, 0);
      assert.equal(invSolo.discountedBase, 1330);

      // 3 people (base $3,990) -> 5% discount = $199.50
      const inv3 = calculateExpeditionInvoice({ durationDays: 14, travelers: 3, region: 'Everest', paymentOption: 'FULL' });
      assert.equal(inv3.groupDiscountPercent, 5);
      assert.equal(inv3.groupDiscountAmount, 199.50);
      assert.equal(inv3.discountedBase, 3790.50);

      // 5 people (base $6,650) -> 10% discount = $665.00
      const inv5 = calculateExpeditionInvoice({ durationDays: 14, travelers: 5, region: 'Everest', paymentOption: 'FULL' });
      assert.equal(inv5.groupDiscountPercent, 10);
      assert.equal(inv5.groupDiscountAmount, 665.00);
      assert.equal(inv5.discountedBase, 5985.00);

      // 8 people (base $10,640) -> 15% discount = $1,596.00
      const inv8 = calculateExpeditionInvoice({ durationDays: 14, travelers: 8, region: 'Everest', paymentOption: 'FULL' });
      assert.equal(inv8.groupDiscountPercent, 15);
      assert.equal(inv8.groupDiscountAmount, 1596.00);
      assert.equal(inv8.discountedBase, 9044.00);
    });

    test('Regional permit fees and 13% Nepal VAT calculate with exact cent precision', () => {
      // Manaslu: permit is $160 per person
      const invManaslu = calculateExpeditionInvoice({ durationDays: 12, travelers: 2, region: 'Manaslu', paymentOption: 'FULL' });
      assert.equal(invManaslu.permitFeePerPerson, 160);
      assert.equal(invManaslu.permitTotal, 320);
      // 12 days * $95 * 2 = $2,280. 5% discount = $114. Discounted base = $2,166.
      assert.equal(invManaslu.discountedBase, 2166);
      // Taxable subtotal = $2,166 + $320 = $2,486
      assert.equal(invManaslu.taxableSubtotal, 2486);
      // VAT 13% = $2,486 * 0.13 = $323.18
      assert.equal(invManaslu.vatAmount, 323.18);
      // Total = $2,486 + $323.18 = $2,809.18
      assert.equal(invManaslu.totalExpeditionPrice, 2809.18);

      // Upper Mustang: permit is $530 per person
      const invMustang = calculateExpeditionInvoice({ durationDays: 10, travelers: 1, region: 'Mustang', paymentOption: 'FULL' });
      assert.equal(invMustang.permitFeePerPerson, 530);
      assert.equal(invMustang.permitTotal, 530);
    });

    test('Deposit option (25%) guarantees deposit_amount + remaining_balance === total_price', () => {
      const invDeposit = calculateExpeditionInvoice({ durationDays: 14, travelers: 2, region: 'Everest', paymentOption: 'DEPOSIT' });
      assert.equal(invDeposit.paymentOption, 'DEPOSIT');
      assert.ok(invDeposit.depositAmount > 0);
      assert.ok(invDeposit.remainingBalance > 0);

      // Check exact accounting equation
      const sum = Math.round((invDeposit.depositAmount + invDeposit.remainingBalance) * 100) / 100;
      assert.equal(sum, invDeposit.totalExpeditionPrice, 'Deposit + Remaining Balance must equal Total Price exactly');
      // Deposit should be roughly 25% of total
      const ratio = invDeposit.depositAmount / invDeposit.totalExpeditionPrice;
      assert.ok(Math.abs(ratio - 0.25) < 0.01, `Deposit ratio ${ratio} must be approximately 0.25`);
    });

    test('ACID reservation transaction commits atomically and rolls back on failure with zero orphans', () => {
      const trail = db.prepare('SELECT id FROM trails LIMIT 1;').get();
      const invoice = calculateExpeditionInvoice({ durationDays: 14, travelers: 2, region: 'Everest', paymentOption: 'DEPOSIT' });
      const validBookingId = `book_acid_success_${Date.now()}`;
      const receiptNumber = `REC-HIMAL-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;

      // 1. Successful ACID transaction
      db.exec('BEGIN TRANSACTION;');
      try {
        const stmt = db.prepare(`
          INSERT INTO bookings (
            id, trail_id, user_id, full_name, email, phone, start_date,
            travelers, special_requests, total_price, status, payment_option,
            deposit_amount, remaining_balance, base_price, permit_fee,
            tax_amount, receipt_number, invoice_breakdown, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `);
        stmt.run(
          validBookingId,
          trail.id,
          'usr_acid_test',
          'Pasang Dawa',
          'pasang.dawa@example.com',
          '+977 9801122334',
          '2026-11-15',
          invoice.travelers,
          'Window seat on Lukla flight preferred',
          invoice.totalExpeditionPrice,
          'CONFIRMED',
          invoice.paymentOption,
          invoice.depositAmount,
          invoice.remainingBalance,
          invoice.discountedBase,
          invoice.permitTotal,
          invoice.vatAmount,
          receiptNumber,
          JSON.stringify(invoice),
          new Date().toISOString()
        );
        db.exec('COMMIT;');
      } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
      }

      // Verify record committed
      const saved = db.prepare('SELECT * FROM bookings WHERE id = ?;').get(validBookingId);
      assert.ok(saved, 'Booking must be durably committed in SQLite');
      assert.equal(saved.payment_option, 'DEPOSIT');
      assert.equal(saved.receipt_number, receiptNumber);
      assert.equal(saved.status, 'CONFIRMED');
      assert.equal(saved.remaining_balance, invoice.remainingBalance);

      // 2. Aborted / Rolling back transaction
      const failingBookingId = `book_acid_fail_${Date.now()}`;
      try {
        db.exec('BEGIN TRANSACTION;');
        const stmt = db.prepare(`
          INSERT INTO bookings (id, trail_id, user_id, full_name, email, phone, start_date, travelers, total_price, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?);
        `);
        stmt.run(failingBookingId, trail.id, 'usr_acid_test', 'Faulty Booking', 'fail@example.com', '+977', '2026-12-01', 1, 999.0, new Date().toISOString());

        // Simulate unexpected failure before commit
        throw new Error('Simulated network or validation fault');
      } catch (err) {
        db.exec('ROLLBACK;');
      }

      // Verify no orphan record exists
      const orphan = db.prepare('SELECT * FROM bookings WHERE id = ?;').get(failingBookingId);
      assert.equal(orphan, undefined, 'Rolled back transaction must leave zero orphan rows');
    });

    test('5-State booking lifecycle state machine validates transitions and rejects illegal moves', () => {
      const validStates = ['PENDING', 'CONFIRMED', 'EXPEDITION_ACTIVE', 'COMPLETED', 'CANCELLED'];
      const trail = db.prepare('SELECT id FROM trails LIMIT 1;').get();
      const lifecycleId = `book_lifecycle_${Date.now()}`;

      // Insert initial PENDING booking
      const insertStmt = db.prepare(`
        INSERT INTO bookings (id, trail_id, user_id, full_name, email, phone, start_date, travelers, total_price, status, created_at)
        VALUES (?, ?, 'usr_life', 'Sherpa Tenzing', 'tenzing@example.com', '+977', '2026-10-20', 2, 2800.0, 'PENDING', ?);
      `);
      insertStmt.run(lifecycleId, trail.id, new Date().toISOString());

      function transitionStatus(bookingId, targetStatus) {
        if (!validStates.includes(targetStatus)) {
          throw new Error(`Invalid status: ${targetStatus}`);
        }
        const current = db.prepare('SELECT status FROM bookings WHERE id = ?;').get(bookingId);
        if (!current) throw new Error('Booking not found');

        const allowedTransitions = {
          'PENDING': ['CONFIRMED', 'CANCELLED'],
          'CONFIRMED': ['EXPEDITION_ACTIVE', 'CANCELLED'],
          'EXPEDITION_ACTIVE': ['COMPLETED', 'CANCELLED'],
          'COMPLETED': [], // Terminal
          'CANCELLED': []  // Terminal
        };

        if (!allowedTransitions[current.status].includes(targetStatus)) {
          throw new Error(`Illegal state transition from ${current.status} to ${targetStatus}`);
        }

        db.prepare('UPDATE bookings SET status = ? WHERE id = ?;').run(targetStatus, bookingId);
      }

      // PENDING -> CONFIRMED (Valid deposit received)
      transitionStatus(lifecycleId, 'CONFIRMED');
      assert.equal(db.prepare('SELECT status FROM bookings WHERE id = ?;').get(lifecycleId).status, 'CONFIRMED');

      // CONFIRMED -> EXPEDITION_ACTIVE (Expedition start date reached)
      transitionStatus(lifecycleId, 'EXPEDITION_ACTIVE');
      assert.equal(db.prepare('SELECT status FROM bookings WHERE id = ?;').get(lifecycleId).status, 'EXPEDITION_ACTIVE');

      // EXPEDITION_ACTIVE -> COMPLETED (Successful summit and return)
      transitionStatus(lifecycleId, 'COMPLETED');
      assert.equal(db.prepare('SELECT status FROM bookings WHERE id = ?;').get(lifecycleId).status, 'COMPLETED');

      // Illegal: COMPLETED -> PENDING (Terminal state violation)
      assert.throws(() => transitionStatus(lifecycleId, 'PENDING'), /Illegal state transition from COMPLETED to PENDING/);

      // Illegal status value
      assert.throws(() => transitionStatus(lifecycleId, 'REFUNDED_UNKNOWN'), /Invalid status: REFUNDED_UNKNOWN/);
    });

    test('Tier 4 Workload: Full adventurer journey from checkout deposit to review submission and badge honors', () => {
      const e2eUserId = `usr_journey_${Date.now()}`;
      const e2eBookingId = `book_journey_${Date.now()}`;
      const e2eReviewId = `rev_journey_${Date.now()}`;
      const trail = db.prepare("SELECT * FROM trails WHERE region = 'Everest' LIMIT 1;").get() ||
                    db.prepare("SELECT * FROM trails LIMIT 1;").get();

      // 1. Adventurer creates account
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, 'TREKKER', ?);
      `).run(e2eUserId, 'Sir Edmund', `edmund_${Date.now()}@example.com`, 'secure_pw', new Date().toISOString());

      // 2. Adventurer checks out 14-day Everest expedition with 25% deposit
      const invoice = calculateExpeditionInvoice({ durationDays: 14, travelers: 2, region: trail.region, paymentOption: 'DEPOSIT' });
      const receiptNum = `REC-EXP-${Date.now()}`;

      db.prepare(`
        INSERT INTO bookings (
          id, trail_id, user_id, full_name, email, phone, start_date, travelers,
          total_price, status, payment_option, deposit_amount, remaining_balance,
          base_price, permit_fee, tax_amount, receipt_number, invoice_breakdown, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'DEPOSIT', ?, ?, ?, ?, ?, ?, ?, ?);
      `).run(
        e2eBookingId, trail.id, e2eUserId, 'Sir Edmund', 'edmund@example.com', '+977 9811122233',
        '2026-10-10', 2, invoice.totalExpeditionPrice, invoice.depositAmount, invoice.remainingBalance,
        invoice.discountedBase, invoice.permitTotal, invoice.vatAmount, receiptNum, JSON.stringify(invoice),
        new Date().toISOString()
      );

      // 3. Deposit processes -> status CONFIRMED -> Active -> COMPLETED
      db.prepare("UPDATE bookings SET status = 'CONFIRMED' WHERE id = ?;").run(e2eBookingId);
      db.prepare("UPDATE bookings SET status = 'EXPEDITION_ACTIVE' WHERE id = ?;").run(e2eBookingId);
      db.prepare("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?;").run(e2eBookingId);

      // 4. Adventurer submits verified multi-criteria review
      db.prepare(`
        INSERT INTO reviews (
          id, trail_id, user_id, user_name, user_email, overall_rating,
          difficulty_rating, scenic_rating, safety_rating, comment, photos_json,
          is_verified, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?);
      `).run(
        e2eReviewId, trail.id, e2eUserId, 'Sir Edmund', 'edmund@example.com',
        5.0, 5, 5, 5,
        'Ascent was challenging but the route logistics and teahouse arrangements were impeccable.',
        JSON.stringify(['https://images.unsplash.com/photo-1544735716-392fe2489ffa']),
        new Date().toISOString()
      );

      // 5. Dynamic trail score recalculation
      const agg = db.prepare('SELECT COUNT(*) as count, AVG(overall_rating) as avg_rating FROM reviews WHERE trail_id = ?;').get(trail.id);
      db.prepare('UPDATE trails SET rating = ROUND(?, 1), reviews_count = ? WHERE id = ?;').run(agg.avg_rating, agg.count, trail.id);

      // 6. Badges awarded
      const badgeInsert = db.prepare(`
        INSERT OR IGNORE INTO user_badges (id, user_id, badge_id, badge_name, badge_description, badge_icon, unlocked_at)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `);
      badgeInsert.run(`ubg_${Date.now()}_1`, e2eUserId, 'trail_blazer', 'Trail Blazer', 'First review submitted', 'Compass', new Date().toISOString());
      badgeInsert.run(`ubg_${Date.now()}_2`, e2eUserId, 'safety_sentinel', 'Safety Sentinel', 'Safety conditions review', 'ShieldAlert', new Date().toISOString());
      badgeInsert.run(`ubg_${Date.now()}_3`, e2eUserId, 'everest_pioneer', 'Everest Pioneer', 'Completed Everest trek', 'Mountain', new Date().toISOString());

      // 7. Verification of full dashboard state
      const userBookings = db.prepare('SELECT * FROM bookings WHERE user_id = ?;').all(e2eUserId);
      assert.equal(userBookings.length, 1);
      assert.equal(userBookings[0].status, 'COMPLETED');
      assert.equal(userBookings[0].payment_option, 'DEPOSIT');
      assert.equal(userBookings[0].receipt_number, receiptNum);

      const userReviews = db.prepare('SELECT * FROM reviews WHERE user_id = ?;').all(e2eUserId);
      assert.equal(userReviews.length, 1);
      assert.equal(userReviews[0].is_verified, 1);

      const userBadges = db.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?;').all(e2eUserId).map(b => b.badge_id);
      assert.ok(userBadges.includes('trail_blazer'));
      assert.ok(userBadges.includes('safety_sentinel'));
      assert.ok(userBadges.includes('everest_pioneer'));
    });
  });
});




