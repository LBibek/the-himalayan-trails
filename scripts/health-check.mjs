import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? path.join('/tmp', 'himalayan_trails_data') : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'himalayan_trails.db');

console.log('--- The Himalayan Trails: System Health Check ---');
console.log('Environment:', isVercel ? 'Vercel Serverless' : 'Local / Node.js');
console.log('Database Path:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
  console.error('FAIL: Database file does not exist at', DB_PATH);
  process.exit(1);
}

try {
  const db = new DatabaseSync(DB_PATH);
  
  // Table check
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").all().map(t => t.name);
  console.log('Detected Tables (' + tables.length + '):', tables.join(', '));

  // Count checks
  const trailsCount = db.prepare('SELECT COUNT(*) as count FROM trails;').get().count;
  const landmarksCount = db.prepare('SELECT COUNT(*) as count FROM landmarks;').get().count;
  const storiesCount = db.prepare('SELECT COUNT(*) as count FROM stories;').get().count;
  const weatherCount = db.prepare('SELECT COUNT(*) as count FROM weather_reports;').get().count;
  const bookingsCount = db.prepare('SELECT COUNT(*) as count FROM bookings;').get().count;

  const healthReport = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      connected: true,
      path: DB_PATH,
      tablesCount: tables.length,
      metrics: {
        trails: trailsCount,
        landmarks: landmarksCount,
        stories: storiesCount,
        weatherReports: weatherCount,
        bookings: bookingsCount
      }
    }
  };

  console.log('\n[PASS] Health Status: HEALTHY');
  console.log(JSON.stringify(healthReport, null, 2));
  process.exit(0);
} catch (error) {
  console.error('[FAIL] Health check failed with error:', error);
  process.exit(1);
}
