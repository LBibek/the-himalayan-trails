import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/himalayan_trails.db');
console.log('--- DATABASE TABLES ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name));

console.log('\n--- INQUIRIES SCHEMA ---');
const schema = db.prepare("PRAGMA table_info(inquiries)").all();
console.log(schema);

console.log('\n--- INQUIRIES COUNT & RECENT RECORDS ---');
const count = db.prepare('SELECT count(*) as count FROM inquiries').get();
console.log('Total inquiries:', count);

const recent = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 5').all();
console.log('Recent inquiries:', JSON.stringify(recent, null, 2));

// Test inserting an inquiry directly and querying it back
const testId = `audit_inq_${Date.now()}`;
const now = new Date().toISOString();
db.prepare(`
  INSERT INTO inquiries (
    id, trail_id, trail_name, full_name, email, phone, country,
    group_size, preferred_start_date, fitness_level, notes, status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
`).run(
  testId,
  'svc-guided-alpine-expeditions',
  'Guided Alpine Expeditions',
  'Auditor Forensic Test',
  'auditor@himalayantrails.com',
  '+977-1-4123456',
  'Nepal',
  2,
  '2026-10-15',
  'Advanced',
  'Forensic audit verification of persistence',
  now
);

const retrieved = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(testId);
console.log('\n--- INSERTED RECORD RETRIEVAL TEST ---');
console.log('Retrieved successfully:', retrieved?.id === testId);
console.log('Retrieved data:', retrieved);

// Clean up the test row
db.prepare('DELETE FROM inquiries WHERE id = ?').run(testId);
const checkDeleted = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(testId);
console.log('Cleaned up test row:', checkDeleted === undefined);
