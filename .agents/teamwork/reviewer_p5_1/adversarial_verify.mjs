import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const projectRoot = path.resolve('c:/Users/acer/Desktop/The Himalayan Trails');
const dbPath = path.join(projectRoot, 'data', 'himalayan_trails.db');

describe('Adversarial & Edge Case Verification — Milestone 1 & 2', () => {
  let db;

  test('Database connection and inquiries table sanity', () => {
    assert.ok(fs.existsSync(dbPath), 'Database file must exist');
    db = new DatabaseSync(dbPath);
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='inquiries';").get();
    assert.ok(table, 'inquiries table must exist in SQLite database');
  });

  test('InfiniteCarousel exports, item typing, and default items integrity', async () => {
    const carouselPath = path.join(projectRoot, 'src', 'components', 'ui', 'InfiniteCarousel.tsx');
    assert.ok(fs.existsSync(carouselPath), 'InfiniteCarousel.tsx must exist');
    const content = fs.readFileSync(carouselPath, 'utf8');

    // Integrity: Ensure no fake timeout or simulated delay
    assert.ok(!content.includes('setTimeout'), 'No setTimeout should exist in InfiniteCarousel');
    assert.ok(!content.includes('setInterval'), 'No setInterval should exist in InfiniteCarousel');

    // Dual tracks with aria-hidden
    assert.ok(content.includes('ariaHidden={true}'), 'Second track must set ariaHidden={true}');
    assert.ok(content.includes('translate3d'), 'Must use hardware accelerated translate3d');

    // HeroUI compound attachments
    assert.ok(content.includes('InfiniteCarousel.Track = CarouselTrack'), 'Must attach Track');
    assert.ok(content.includes('InfiniteCarousel.Card = CarouselCard'), 'Must attach Card');
    assert.ok(content.includes('InfiniteCarousel.RouteCard = CarouselRouteCard'), 'Must attach RouteCard');
    assert.ok(content.includes('InfiniteCarousel.ServiceCard = CarouselServiceCard'), 'Must attach ServiceCard');

    // Check mixed card data
    assert.ok(content.includes('DEFAULT_CAROUSEL_ITEMS'), 'Must export DEFAULT_CAROUSEL_ITEMS');
    assert.ok(content.includes('Everest Base Camp Trek'), 'Must include EBC trek');
    assert.ok(content.includes('Guided Alpine Expeditions'), 'Must include Guided Alpine Expeditions');
  });

  test('HomeRegionalMap dynamic SSR isolation and 5 region coordinates', () => {
    const mapSectionPath = path.join(projectRoot, 'src', 'components', 'home', 'HomeRegionalMap.tsx');
    assert.ok(fs.existsSync(mapSectionPath), 'HomeRegionalMap.tsx must exist');
    const content = fs.readFileSync(mapSectionPath, 'utf8');

    // SSR isolation
    assert.ok(content.includes('dynamic(() => import('), 'Must use next/dynamic for Leaflet');
    assert.ok(content.includes('ssr: false'), 'Must disable SSR for Leaflet map component');

    // 5 region configs
    const regions = ['Everest', 'Annapurna', 'Manaslu', 'Mustang', 'Langtang'];
    for (const r of regions) {
      assert.ok(content.includes(`key: '${r}'`), `Must include config for region ${r}`);
    }

    // Direct high-contrast 3D Cesium CTA
    assert.ok(content.includes('href="/map?engine=cesium"'), 'Must link directly to 3D Cesium discovery hub');
    assert.ok(content.includes('data-slot="trigger"'), 'CTA must have data-slot="trigger"');
    assert.ok(content.includes('bg-accent text-accent-foreground'), 'CTA must pair bg-accent with text-accent-foreground');
  });

  test('Alpine Services Matrix in page.tsx implements 5 services with real inquiry integration', () => {
    const pagePath = path.join(projectRoot, 'src', 'app', 'page.tsx');
    assert.ok(fs.existsSync(pagePath), 'page.tsx must exist');
    const content = fs.readFileSync(pagePath, 'utf8');

    // 5 core services
    const services = [
      'Guided Alpine Expeditions',
      'Custom 3D Itinerary Planning',
      'Sherpa & Porter Logistics',
      'Helicopter Rescue & High-Altitude Evac',
      'Conservation Permits & TIMS Passes'
    ];
    for (const s of services) {
      assert.ok(content.includes(s), `Home page must contain alpine service: ${s}`);
    }

    // Real persistence: fetch to /api/inquiries
    assert.ok(content.includes("fetch('/api/inquiries'"), 'Inquiry form must submit to /api/inquiries');
    assert.ok(content.includes("method: 'POST'"), 'Must submit via POST method');
  });

  test('Real end-to-end SQLite inquiry insertion and validation', () => {
    const testId = `adv_test_inq_${Date.now()}`;
    const stmt = db.prepare(`
      INSERT INTO inquiries (
        id, trail_id, trail_name, full_name, email, phone, country,
        group_size, preferred_start_date, fitness_level, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?);
    `);

    stmt.run(
      testId,
      'svc-heli-rescue',
      'Helicopter Rescue & High-Altitude Evac',
      'Ang Dorje Sherpa',
      'ang.dorje@example.com',
      '+977 9812345678',
      'Nepal',
      1,
      '2026-10-30',
      'Expert',
      'Adversarial test inquiry for helicopter rescue dispatch',
      new Date().toISOString()
    );

    const record = db.prepare('SELECT * FROM inquiries WHERE id = ?;').get(testId);
    assert.ok(record, 'Inquiry record must be persisted in SQLite');
    assert.equal(record.trail_id, 'svc-heli-rescue');
    assert.equal(record.status, 'PENDING');

    // Cleanup
    db.prepare('DELETE FROM inquiries WHERE id = ?;').run(testId);
    const cleaned = db.prepare('SELECT * FROM inquiries WHERE id = ?;').get(testId);
    assert.equal(cleaned, undefined, 'Cleaned up test record');
  });
});
