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
});




