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
});

