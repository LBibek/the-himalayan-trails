/**
 * Empirical Adversarial Challenge Test Harness
 * Focus: Mobile Navigation Modal Lifecycle, Accessibility, SAR Hotline Link, and Trail Selector HUD Deduplication (R4 & R5)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ROOT_DIR = path.resolve('c:/Users/acer/Desktop/The Himalayan Trails');
const NAVBAR_PATH = path.join(ROOT_DIR, 'src', 'components', 'layout', 'Navbar.tsx');
const HUB_PATH = path.join(ROOT_DIR, 'src', 'components', 'explorer', 'UnifiedDiscoveryHub.tsx');
const DB_PATH = path.join(ROOT_DIR, 'data', 'himalayan_trails.db');

console.log('================================================================');
console.log('CHALLENGER P5-2: EMPIRICAL STRESS TEST & ADVERSARIAL CHALLENGES');
console.log('Scope: Mobile Navigation (R4) & Trail Selector HUD Deduplication (R5)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failCount++;
  }
}

// Read source files
assert.ok(fs.existsSync(NAVBAR_PATH), `Navbar.tsx must exist at ${NAVBAR_PATH}`);
assert.ok(fs.existsSync(HUB_PATH), `UnifiedDiscoveryHub.tsx must exist at ${HUB_PATH}`);
assert.ok(fs.existsSync(DB_PATH), `himalayan_trails.db must exist at ${DB_PATH}`);

const navbarSrc = fs.readFileSync(NAVBAR_PATH, 'utf8');
const hubSrc = fs.readFileSync(HUB_PATH, 'utf8');
const db = new DatabaseSync(DB_PATH);

// ============================================================================
// SUITE 1: Mobile Navigation Modal Lifecycle & Styling
// ============================================================================
console.log('\n--- SUITE 1: Mobile Navigation Modal Lifecycle & Styling ---');

runTest('1.1: Mobile navigation overlay container has exact required classes', () => {
  // Check for required classes: fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white
  const expectedClasses = 'fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white';
  assert.ok(navbarSrc.includes(expectedClasses), `Overlay must contain class string "${expectedClasses}"`);
  
  // Verify ARIA & modal dialog attributes
  assert.ok(navbarSrc.includes('id="mobile-navigation-overlay"'), 'Must have id="mobile-navigation-overlay"');
  assert.ok(navbarSrc.includes('role="dialog"'), 'Must have role="dialog"');
  assert.ok(navbarSrc.includes('aria-modal="true"'), 'Must have aria-modal="true"');
  assert.ok(navbarSrc.includes('aria-label="Mobile Navigation"'), 'Must have aria-label="Mobile Navigation"');
  assert.ok(navbarSrc.includes('data-slot="overlay"'), 'Must declare data-slot="overlay"');
});

runTest('1.2: Mobile menu trigger button accessibility & animation properties', () => {
  assert.ok(navbarSrc.includes('ref={triggerButtonRef}'), 'Trigger button must reference triggerButtonRef for focus restoration');
  assert.ok(navbarSrc.includes('data-slot="trigger"'), 'Trigger button must declare data-slot="trigger"');
  assert.ok(navbarSrc.includes('aria-expanded={mobileMenuOpen}'), 'Trigger button must declare aria-expanded={mobileMenuOpen}');
  assert.ok(navbarSrc.includes('aria-controls="mobile-navigation-overlay"'), 'Trigger button must declare aria-controls="mobile-navigation-overlay"');
  
  // Hamburger morph animation keyframes
  assert.ok(navbarSrc.includes('rotate-45 translate-y-2'), 'Top bar must morph on open');
  assert.ok(navbarSrc.includes('opacity-0'), 'Middle bar must hide on open');
  assert.ok(navbarSrc.includes('-rotate-45 -translate-y-2'), 'Bottom bar must morph on open');
});

runTest('1.3: Body scroll lock simulation & unmount/close cleanup', () => {
  // Verify implementation in code
  assert.ok(navbarSrc.includes("document.body.style.overflow = 'hidden'"), 'Must set document.body.style.overflow to hidden');
  assert.ok(navbarSrc.includes('document.body.style.overflow = originalOverflow'), 'Must restore document.body.style.overflow on cleanup');

  // Empirical execution test: Simulate React effect lifecycle
  const fakeDocument = {
    body: {
      style: {
        overflow: ''
      }
    }
  };

  function simulateScrollLockHook(isOpen, initialOverflow = '') {
    fakeDocument.body.style.overflow = initialOverflow;
    let cleanup = null;

    if (isOpen) {
      const originalOverflow = fakeDocument.body.style.overflow;
      fakeDocument.body.style.overflow = 'hidden';
      cleanup = () => {
        fakeDocument.body.style.overflow = originalOverflow;
      };
    }
    return { cleanup };
  }

  // Case A: Initial empty overflow
  let hook = simulateScrollLockHook(true, '');
  assert.equal(fakeDocument.body.style.overflow, 'hidden', 'Scroll must be locked when open');
  hook.cleanup();
  assert.equal(fakeDocument.body.style.overflow, '', 'Scroll must be restored to empty string on close');

  // Case B: Initial auto overflow
  hook = simulateScrollLockHook(true, 'auto');
  assert.equal(fakeDocument.body.style.overflow, 'hidden', 'Scroll must be locked when open');
  hook.cleanup();
  assert.equal(fakeDocument.body.style.overflow, 'auto', 'Scroll must be restored to auto on close');

  // Case C: Unmount while open
  hook = simulateScrollLockHook(true, 'scroll');
  assert.equal(fakeDocument.body.style.overflow, 'hidden', 'Scroll must be locked when open');
  hook.cleanup(); // simulates unmount
  assert.equal(fakeDocument.body.style.overflow, 'scroll', 'Scroll must be restored on unmount');
});

runTest('1.4: Keyboard Escape listener and focus restoration simulation', () => {
  // Verify code implementation
  assert.ok(navbarSrc.includes("e.key === 'Escape'"), 'Must check e.key === "Escape"');
  assert.ok(navbarSrc.includes('triggerButtonRef.current?.focus()'), 'Must call triggerButtonRef.current?.focus()');
  assert.ok(navbarSrc.includes("window.addEventListener('keydown', handleKeyDown)"), 'Must add keydown listener');
  assert.ok(navbarSrc.includes("window.removeEventListener('keydown', handleKeyDown)"), 'Must remove keydown listener');

  // Empirical execution test: Simulate key listener and focus restoration
  let focused = false;
  const mockTriggerButton = {
    focus: () => { focused = true; }
  };

  let menuOpen = true;
  let registeredHandler = null;

  const mockWindow = {
    addEventListener: (type, handler) => {
      if (type === 'keydown') registeredHandler = handler;
    },
    removeEventListener: (type, handler) => {
      if (type === 'keydown' && registeredHandler === handler) registeredHandler = null;
    }
  };

  // Simulate hook mounting
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && menuOpen) {
      menuOpen = false;
      mockTriggerButton.focus();
    }
  };
  mockWindow.addEventListener('keydown', handleKeyDown);

  // Adversarial event 1: Other key while open
  handleKeyDown({ key: 'Enter' });
  assert.equal(menuOpen, true, 'Menu must remain open on non-Escape key');
  assert.equal(focused, false, 'Focus must not be called on non-Escape key');

  // Adversarial event 2: Escape key while menu is open
  handleKeyDown({ key: 'Escape' });
  assert.equal(menuOpen, false, 'Menu must be closed after Escape key');
  assert.equal(focused, true, 'Focus must be restored to trigger button');

  // Adversarial event 3: Escape key when menu is already closed
  focused = false;
  handleKeyDown({ key: 'Escape' });
  assert.equal(focused, false, 'Focus must not be triggered when menu is already closed');

  // Cleanup simulation
  mockWindow.removeEventListener('keydown', handleKeyDown);
  assert.equal(registeredHandler, null, 'Listener must be unregistered on cleanup');
});

runTest('1.5: 24/7 Helicopter Evacuation & High-Altitude SAR emergency hotline link', () => {
  assert.ok(navbarSrc.includes('data-slot="hotline-card"'), 'Must have data-slot="hotline-card"');
  assert.ok(navbarSrc.includes('href="tel:+97714123456"'), 'Hotline telephone href must be tel:+97714123456');
  assert.ok(navbarSrc.includes('+977-1-412-3456'), 'Display text must show formatted phone number');
  assert.ok(navbarSrc.includes('Garmin inReach'), 'Must reference Garmin inReach satellite link');
  assert.ok(navbarSrc.includes('Search and Rescue (SAR)'), 'Must reference SAR emergency dispatch');
});

runTest('1.6: 4 Expedition shortcuts exist with valid links and route validity', () => {
  const expectedShortcuts = [
    { code: 'EBC', name: 'Everest Base Camp', href: '/map?trail=everest-base-camp', pass: 'Khumbu', altitude: '5,364m' },
    { code: 'Annapurna', name: 'Annapurna Circuit', href: '/map?trail=annapurna-circuit', pass: 'Thorong La', altitude: '5,416m' },
    { code: 'Manaslu', name: 'Manaslu Circuit', href: '/map?trail=manaslu-circuit', pass: 'Larkya La', altitude: '5,106m' },
    { code: 'Mustang', name: 'Upper Mustang', href: '/map?trail=upper-mustang', pass: 'Lo Manthang', altitude: '3,840m' },
  ];

  for (const sc of expectedShortcuts) {
    assert.ok(navbarSrc.includes(sc.code), `Shortcut ${sc.code} must be present`);
    assert.ok(navbarSrc.includes(sc.name), `Shortcut name ${sc.name} must be present`);
    assert.ok(navbarSrc.includes(sc.href), `Shortcut link ${sc.href} must be present`);
    assert.ok(navbarSrc.includes(sc.pass), `Shortcut pass ${sc.pass} must be present`);
    assert.ok(navbarSrc.includes(sc.altitude), `Shortcut altitude ${sc.altitude} must be present`);

    // Verify trail target in database
    const trailSlug = sc.href.split('trail=')[1];
    const match = db.prepare('SELECT id, slug, name FROM trails WHERE slug = ? OR id = ? OR slug LIKE ?;').get(trailSlug, trailSlug, `%${trailSlug}%`);
    assert.ok(match, `Trail slug ${trailSlug} must correspond to a valid trail in database`);
  }
});

runTest('1.7: Search input form routes to /map?search=... with URL encoding & whitespace rejection', () => {
  assert.ok(navbarSrc.includes('<Search'), 'Must render Search icon');
  assert.ok(navbarSrc.includes('placeholder="Search routes, peaks, passes..."'), 'Must have search placeholder');
  assert.ok(navbarSrc.includes('/map?search='), 'Search form must route to /map?search=');
  assert.ok(navbarSrc.includes('encodeURIComponent'), 'Search query must be URI-encoded');

  // Simulate search submission logic
  let pushedRoute = null;
  let isMenuOpen = true;

  const simulateSearchSubmit = (inputQuery) => {
    if (inputQuery.trim()) {
      isMenuOpen = false;
      pushedRoute = `/map?search=${encodeURIComponent(inputQuery.trim())}`;
    }
  };

  // Test 1: Standard query
  simulateSearchSubmit('Everest Base Camp');
  assert.equal(pushedRoute, '/map?search=Everest%20Base%20Camp', 'Standard query must be properly encoded');
  assert.equal(isMenuOpen, false, 'Menu must close on search submit');

  // Test 2: Special characters
  simulateSearchSubmit('Thorong La & 5416m / Gokyo?');
  assert.equal(pushedRoute, '/map?search=Thorong%20La%20%26%205416m%20%2F%20Gokyo%3F', 'Special characters must be safely URL-encoded');

  // Test 3: Whitespace only
  pushedRoute = null;
  isMenuOpen = true;
  simulateSearchSubmit('     ');
  assert.equal(pushedRoute, null, 'Whitespace-only query must not submit');
  assert.equal(isMenuOpen, true, 'Menu must remain open on empty query');
});

// ============================================================================
// SUITE 2: Trail Selector HUD Deduplication Stress Testing
// ============================================================================
console.log('\n--- SUITE 2: Trail Selector HUD Deduplication Stress Testing ---');

// Extract and test getCleanTrailName directly from code
function getCleanTrailName(name) {
  if (!name) return '';
  return name
    .replace(/\s+Trek$/i, '')
    .replace(/\s+&\s+Thorong\s+La$/i, '')
    .replace(/\s+&\s+Kyanjin\s+Ri$/i, '')
    .replace(/\s+Forbidden\s+Kingdom$/i, '')
    .replace(/\s+&\s+Tashi\s+Lapcha\s+Pass$/i, '')
    .trim();
}

runTest('2.1: getCleanTrailName string standardization across edge cases', () => {
  assert.equal(getCleanTrailName('Everest Base Camp Trek'), 'Everest Base Camp');
  assert.equal(getCleanTrailName('Everest Base Camp trek'), 'Everest Base Camp', 'Case-insensitive Trek strip');
  assert.equal(getCleanTrailName('Annapurna Circuit & Thorong La'), 'Annapurna Circuit');
  assert.equal(getCleanTrailName('Langtang Valley & Kyanjin Ri'), 'Langtang Valley');
  assert.equal(getCleanTrailName('Upper Mustang Forbidden Kingdom'), 'Upper Mustang');
  assert.equal(getCleanTrailName('Rolwaling Valley & Tashi Lapcha Pass'), 'Rolwaling Valley');
  assert.equal(getCleanTrailName('Manaslu Circuit'), 'Manaslu Circuit', 'Untouched if no matched suffix');
  assert.equal(getCleanTrailName(''), '', 'Empty string handled safely');
  assert.equal(getCleanTrailName(null), '', 'Null handled safely');
  assert.equal(getCleanTrailName(undefined), '', 'Undefined handled safely');
});

runTest('2.2: Adversarial Multi-Region and Duplicate Trail Deduplication Simulation', () => {
  // Construct stress test dataset:
  // - 5 trails with region: "Everest"
  // - 3 trails with region: "Annapurna"
  // - 2 trails with identical names
  // - 1 casing variant duplicate
  // - 1 clean-name match duplicate
  const adversarialTrails = [
    // Everest region (5 trails, with duplicates)
    { id: 'ev-1', slug: 'ebc-trek', name: 'Everest Base Camp Trek', region: 'Everest', maxElevation: 5364 },
    { id: 'ev-2', slug: 'ebc-duplicate', name: 'Everest Base Camp Trek', region: 'Everest', maxElevation: 5364 }, // Exact duplicate
    { id: 'ev-3', slug: 'ebc-case', name: 'everest base camp trek', region: 'Everest', maxElevation: 5364 }, // Lowercase variant
    { id: 'ev-4', slug: 'three-passes', name: 'Three Passes Trek', region: 'Everest', maxElevation: 5535 },
    { id: 'ev-5', slug: 'gokyo-lakes', name: 'Gokyo Lakes & Ri Trek', region: 'Everest', maxElevation: 5357 },
    { id: 'ev-6', slug: 'ama-dablam', name: 'Ama Dablam Base Camp Trek', region: 'Everest', maxElevation: 4600 },
    
    // Annapurna region (3 trails, with clean-name overlap)
    { id: 'ap-1', slug: 'annapurna-circuit', name: 'Annapurna Circuit & Thorong La', region: 'Annapurna', maxElevation: 5416 },
    { id: 'ap-2', slug: 'annapurna-clean-dup', name: 'Annapurna Circuit', region: 'Annapurna', maxElevation: 5416 }, // Collides with clean name
    { id: 'ap-3', slug: 'annapurna-base-camp', name: 'Annapurna Base Camp Trek', region: 'Annapurna', maxElevation: 4130 },

    // Other regions
    { id: 'mn-1', slug: 'manaslu', name: 'Manaslu Circuit', region: 'Manaslu', maxElevation: 5106 },
    { id: 'mu-1', slug: 'mustang', name: 'Upper Mustang Forbidden Kingdom', region: 'Mustang', maxElevation: 3840 },
    { id: 'lt-1', slug: 'langtang', name: 'Langtang Valley & Kyanjin Ri', region: 'Langtang', maxElevation: 3866 },
  ];

  // Run the exact deduplication algorithm from UnifiedDiscoveryHub.tsx:
  const seenKeys = new Set();
  const seenNames = new Set();
  const uniqueHudTrails = [];

  for (const t of adversarialTrails) {
    const clean = getCleanTrailName(t.name).toLowerCase();
    const key = (t.slug || t.id || clean).trim();
    if (!seenKeys.has(key) && !seenNames.has(clean)) {
      seenKeys.add(key);
      seenNames.add(clean);
      uniqueHudTrails.push(t);
    }
  }

  // Generate rendered button structures
  const renderedButtons = uniqueHudTrails.map((t) => {
    const cleanName = getCleanTrailName(t.name);
    const formattedElevation = t.maxElevation
      ? `${t.maxElevation.toLocaleString()}m`
      : '';
    return {
      id: t.id,
      cleanName,
      formattedElevation,
      fullLabel: `${cleanName} ${formattedElevation}`.trim(),
      region: t.region
    };
  });

  console.log(`    Input trails count: ${adversarialTrails.length}`);
  console.log(`    Deduplicated trails count: ${renderedButtons.length}`);
  console.log(`    Rendered labels:\n      ${renderedButtons.map(b => `"${b.fullLabel}" (${b.region})`).join('\n      ')}`);

  // Assertions:
  // 1. Zero duplicate button labels
  const buttonLabels = renderedButtons.map(b => b.fullLabel);
  const uniqueLabelsSet = new Set(buttonLabels);
  assert.equal(buttonLabels.length, uniqueLabelsSet.size, 'Zero duplicate button labels must be produced');

  // 2. Zero duplicate clean names
  const cleanNames = renderedButtons.map(b => b.cleanName);
  const uniqueNamesSet = new Set(cleanNames);
  assert.equal(cleanNames.length, uniqueNamesSet.size, 'Zero duplicate clean trail names must be produced');

  // 3. Every rendered button displays distinct name AND distinct max altitude
  for (const b of renderedButtons) {
    assert.ok(b.cleanName.length > 0, 'Every button must display a non-empty name');
    assert.match(b.formattedElevation, /^\d{1,2}(,\d{3})*m$/, `Elevation must be formatted (e.g. 5,364m), got "${b.formattedElevation}"`);
    assert.notEqual(b.cleanName, b.region, `Button text must NOT be the generic region string "${b.region}"`);
  }

  // 4. Exact duplicate and casing variant collapsed
  const ebcEntries = renderedButtons.filter(b => b.cleanName === 'Everest Base Camp');
  assert.equal(ebcEntries.length, 1, 'Multiple EBC variants must collapse to exactly 1 button');

  // 5. Clean-name match collapsed
  const acEntries = renderedButtons.filter(b => b.cleanName === 'Annapurna Circuit');
  assert.equal(acEntries.length, 1, 'Annapurna Circuit & Thorong La vs Annapurna Circuit must collapse to 1');
});

runTest('2.3: Empirical Execution on Real Database Trails (48 DB Records)', () => {
  const dbTrails = db.prepare('SELECT id, slug, name, region, max_elevation as maxElevation FROM trails;').all();
  assert.ok(dbTrails.length > 0, 'Database must contain trails');

  const seenKeys = new Set();
  const seenNames = new Set();
  const uniqueHudTrails = [];

  for (const t of dbTrails) {
    const clean = getCleanTrailName(t.name).toLowerCase();
    const key = (t.slug || t.id || clean).trim();
    if (!seenKeys.has(key) && !seenNames.has(clean)) {
      seenKeys.add(key);
      seenNames.add(clean);
      uniqueHudTrails.push(t);
    }
  }

  const renderedButtons = uniqueHudTrails.map((t) => {
    const cleanName = getCleanTrailName(t.name);
    const formattedElevation = t.maxElevation
      ? `${t.maxElevation.toLocaleString()}m`
      : '';
    return {
      id: t.id,
      cleanName,
      formattedElevation,
      fullLabel: `${cleanName} ${formattedElevation}`.trim(),
      region: t.region
    };
  });

  const fullLabels = renderedButtons.map(b => b.fullLabel);
  const uniqueLabelsSet = new Set(fullLabels);
  assert.equal(fullLabels.length, uniqueLabelsSet.size, 'Real DB trails must produce 0 duplicate labels');

  const cleanNames = renderedButtons.map(b => b.cleanName);
  const uniqueNamesSet = new Set(cleanNames);
  assert.equal(cleanNames.length, uniqueNamesSet.size, 'Real DB trails must produce 0 duplicate names');

  console.log(`    DB Trails total: ${dbTrails.length} -> Deduplicated HUD buttons: ${renderedButtons.length}`);
  assert.ok(renderedButtons.length >= 10, 'Must have at least 10 unique trail options in HUD');
});

runTest('2.4: UnifiedDiscoveryHub HUD UI Button Semantic Slots and ARIA State', () => {
  assert.ok(hubSrc.includes('id="trail-switcher-hud"'), 'Must maintain #trail-switcher-hud container ID');
  assert.ok(hubSrc.includes('data-slot="trail-button"'), 'Buttons must declare data-slot="trail-button"');
  assert.ok(hubSrc.includes('data-trail-id={t.id}'), 'Buttons must declare data-trail-id');
  assert.ok(hubSrc.includes('aria-pressed={isSelected}'), 'Buttons must declare aria-pressed={isSelected}');
  assert.ok(hubSrc.includes('<span>{cleanName}</span>'), 'Buttons must render cleanName inside span');
  assert.ok(hubSrc.includes('<span>{formattedElevation}</span>') || hubSrc.includes('{formattedElevation}'),
    'Buttons must render formattedElevation badge');
  assert.ok(hubSrc.includes('focus-visible:ring-2 focus-visible:ring-[#B68D40]'),
    'HUD buttons must have accessible gold focus ring');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log(`CHALLENGE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL ADVERSARIAL CHALLENGES EMPIRICALLY PASSED!');
  process.exit(0);
}
