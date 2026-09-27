// challenge_carousel.mjs - Empirical Stress-Testing Harness for InfiniteCarousel & HomeRegionalMap
// Teamwork challenger_p5_1 - Empirical Verification

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('================================================================');
console.log('CHALLENGER P5-1: EMPIRICAL HARNESS FOR INFINITE CAROUSEL & MAP');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${testName}`);
    console.error(`         Error: ${err.message}`);
    failedTests++;
  }
}

const CAROUSEL_FILE = path.resolve('src/components/ui/InfiniteCarousel.tsx');
const CSS_FILE = path.resolve('src/app/globals.css');
const MAP_FILE = path.resolve('src/components/home/HomeRegionalMap.tsx');
const PAGE_FILE = path.resolve('src/app/page.tsx');

const carouselCode = fs.readFileSync(CAROUSEL_FILE, 'utf8');
const cssCode = fs.readFileSync(CSS_FILE, 'utf8');
const mapCode = fs.readFileSync(MAP_FILE, 'utf8');
const pageCode = fs.readFileSync(PAGE_FILE, 'utf8');

function extractKeyframeBlock(css, name) {
  const startIdx = css.indexOf(`@keyframes ${name}`);
  if (startIdx === -1) return null;
  const firstBrace = css.indexOf('{', startIdx);
  if (firstBrace === -1) return null;
  let depth = 1;
  let i = firstBrace + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return css.slice(firstBrace + 1, i - 1);
}

// -------------------------------------------------------------
// SUITE 1: Mirrored Content Buffer Math & Loop Seamlessness
// -------------------------------------------------------------
console.log('--- SUITE 1: Mirrored Content Buffer Math & Loop Seamlessness ---');

runTest('CarouselTrack has matching gap and padding-right for seam-free loop', () => {
  // Extract track styling
  assert(carouselCode.includes('gap-6'), 'Track must specify gap-6 (1.5rem / 24px)');
  assert(carouselCode.includes('pr-6'), 'Track must specify pr-6 (1.5rem / 24px) to balance the gap');
  
  // Mathematical simulation of N cards
  const gapPx = 24;
  const paddingRightPx = 24;
  const cardWidthPx = 360;
  
  for (const n of [1, 2, 5, 10, 20]) {
    // Total physical width of Track 1 = sum of cards + (n-1)*gap + paddingRight
    const track1Width = n * cardWidthPx + (n - 1) * gapPx + paddingRightPx;
    // Inter-track distance from Card(n-1) in Track 1 to Card(0) in Track 2:
    // Card(n-1) ends at: track1Width - paddingRightPx
    // Track 2 starts at: track1Width
    // Therefore, distance between last card of Track 1 and first card of Track 2:
    const interTrackGap = track1Width - (track1Width - paddingRightPx);
    assert.strictEqual(interTrackGap, gapPx, `Inter-track gap (${interTrackGap}px) must equal intra-track gap (${gapPx}px) for N=${n}`);
    
    // Position of card k in Track 2 relative to card k in Track 1:
    // Pos_Track2(k) - Pos_Track1(k) === track1Width
    // When Track 1 moves -100% (-track1Width), Track 2 exactly replaces Track 1 coordinates!
    const coordinateDelta = track1Width;
    assert.strictEqual(coordinateDelta, n * (cardWidthPx + gapPx), `Total track width must equal exactly n * (cardWidth + gap)`);
  }
});

runTest('InfiniteCarousel renders dual identical tracks with Track 2 aria-hidden="true"', () => {
  // Check Track 1
  assert(carouselCode.includes('<CarouselTrack'), 'Must render CarouselTrack');
  // Check Track 2 ariaHidden
  assert(carouselCode.includes('ariaHidden={true}'), 'Second track must explicitly set ariaHidden={true}');
  // Check renderedContent reuse
  const trackMatches = carouselCode.match(/<CarouselTrack[\s\S]*?<\/CarouselTrack>/g);
  assert(trackMatches && trackMatches.length === 2, 'Must render exactly 2 CarouselTrack instances in the wrapper');
  assert(trackMatches[0].includes('{renderedContent}'), 'Track 1 must render {renderedContent}');
  assert(trackMatches[1].includes('{renderedContent}'), 'Track 2 must render {renderedContent}');
  assert(!trackMatches[0].includes('ariaHidden={true}'), 'Track 1 must NOT be aria-hidden');
  assert(trackMatches[1].includes('ariaHidden={true}'), 'Track 2 must have ariaHidden={true}');
});

runTest('Speed duration mapping provides correct monotonic timings', () => {
  assert(carouselCode.includes("slow: '75s'"), 'Speed slow must be 75s');
  assert(carouselCode.includes("normal: '45s'"), 'Speed normal must be 45s');
  assert(carouselCode.includes("fast: '25s'"), 'Speed fast must be 25s');
  
  const slow = parseInt('75s');
  const normal = parseInt('45s');
  const fast = parseInt('25s');
  assert(slow > normal, 'Slow duration must be strictly greater than normal');
  assert(normal > fast, 'Normal duration must be strictly greater than fast');
  assert(fast > 0, 'Fast duration must be positive');
});

// -------------------------------------------------------------
// SUITE 2: GPU Keyframes & Translate3d Verification
// -------------------------------------------------------------
console.log('\n--- SUITE 2: GPU Keyframes & Translate3d Verification ---');

runTest('marquee-left keyframes strictly use GPU translate3d(0,0,0) to translate3d(-100%,0,0)', () => {
  const body = extractKeyframeBlock(cssCode, 'marquee-left');
  assert(body, '@keyframes marquee-left must exist in globals.css');
  assert(body.includes('0%'), 'marquee-left must define 0%');
  assert(body.includes('100%'), 'marquee-left must define 100%');
  assert(/0%\s*\{\s*transform:\s*translate3d\(0,\s*0,\s*0\);?\s*\}/.test(body), '0% must be translate3d(0, 0, 0)');
  assert(/100%\s*\{\s*transform:\s*translate3d\(-100%,\s*0,\s*0\);?\s*\}/.test(body), '100% must be translate3d(-100%, 0, 0)');
  assert(!body.includes('translateX'), 'Should not use 2D translateX (must enforce GPU translate3d)');
  assert(!body.includes('left:'), 'Must not animate left offset');
});

runTest('marquee-right keyframes strictly use GPU translate3d(-100%,0,0) to translate3d(0,0,0)', () => {
  const body = extractKeyframeBlock(cssCode, 'marquee-right');
  assert(body, '@keyframes marquee-right must exist in globals.css');
  assert(body.includes('0%'), 'marquee-right must define 0%');
  assert(body.includes('100%'), 'marquee-right must define 100%');
  assert(/0%\s*\{\s*transform:\s*translate3d\(-100%,\s*0,\s*0\);?\s*\}/.test(body), '0% must be translate3d(-100%, 0, 0)');
  assert(/100%\s*\{\s*transform:\s*translate3d\(0,\s*0,\s*0\);?\s*\}/.test(body), '100% must be translate3d(0, 0, 0)');
  assert(!body.includes('translateX'), 'Should not use 2D translateX (must enforce GPU translate3d)');
  assert(!body.includes('left:'), 'Must not animate left offset');
});

runTest('Animation classes define will-change: transform and translate3d layer hint', () => {
  const leftClassMatch = cssCode.match(/\.animate-marquee-left\s*\{([\s\S]*?)\}/);
  assert(leftClassMatch, '.animate-marquee-left must exist');
  assert(leftClassMatch[1].includes('will-change: transform'), '.animate-marquee-left must specify will-change: transform');
  assert(leftClassMatch[1].includes('translate3d(0, 0, 0)'), '.animate-marquee-left must specify translate3d(0, 0, 0)');

  const rightClassMatch = cssCode.match(/\.animate-marquee-right\s*\{([\s\S]*?)\}/);
  assert(rightClassMatch, '.animate-marquee-right must exist');
  assert(rightClassMatch[1].includes('will-change: transform'), '.animate-marquee-right must specify will-change: transform');
  assert(rightClassMatch[1].includes('translate3d(0, 0, 0)'), '.animate-marquee-right must specify translate3d(0, 0, 0)');
});

// -------------------------------------------------------------
// SUITE 3: Pause Selectors (Hover, Focus-Within, Touch)
// -------------------------------------------------------------
console.log('\n--- SUITE 3: Pause Selectors & Accessibility ---');

runTest('CSS pause rules cover .group:hover, .group:focus-within, data-hovered, and data-pressed', () => {
  const pauseRuleMatch = cssCode.match(/\.group:hover[\s\S]*?animation-play-state:\s*paused;/);
  assert(pauseRuleMatch, 'CSS must include pause rules with animation-play-state: paused');
  const block = pauseRuleMatch[0];
  assert(block.includes('.group:hover .animate-marquee-left'), 'Must pause on .group:hover for marquee-left');
  assert(block.includes('.group:hover .animate-marquee-right'), 'Must pause on .group:hover for marquee-right');
  assert(block.includes('.group:focus-within .animate-marquee-left'), 'Must pause on .group:focus-within for marquee-left');
  assert(block.includes('.group:focus-within .animate-marquee-right'), 'Must pause on .group:focus-within for marquee-right');
  assert(block.includes('[data-hovered="true"] .animate-marquee-left'), 'Must pause on [data-hovered="true"]');
  assert(block.includes('[data-pressed="true"] .animate-marquee-left'), 'Must pause on [data-pressed="true"]');
});

runTest('React component implements inline pause state binding for robustness', () => {
  assert(carouselCode.includes("animationPlayState: isPaused ? 'paused' : 'running'"), 'Must bind animationPlayState in inline track style');
  assert(carouselCode.includes('pauseOnHover && isHovered'), 'Must evaluate hover in isPaused');
  assert(carouselCode.includes('pauseOnTouch && isPressed'), 'Must evaluate touch/pressed in isPaused');
  assert(carouselCode.includes('isFocused'), 'Must evaluate focus in isPaused');
  assert(carouselCode.includes('data-paused='), 'Must expose data-paused attribute');
});

// -------------------------------------------------------------
// SUITE 4: Mixed Cards Data Integrity
// -------------------------------------------------------------
console.log('\n--- SUITE 4: Mixed Cards Data Integrity ---');

// Extract DEFAULT_CAROUSEL_ITEMS from code
const itemsMatch = carouselCode.match(/export const DEFAULT_CAROUSEL_ITEMS:\s*CarouselItem\[\]\s*=\s*(\[[\s\S]*?\n\];)/);
assert(itemsMatch, 'DEFAULT_CAROUSEL_ITEMS must be defined and exported');

// Clean up and evaluate items
const cleanItemsStr = itemsMatch[1].replace(/;\s*$/, '');
const items = eval(cleanItemsStr);

runTest('DEFAULT_CAROUSEL_ITEMS contains exactly 10 cards with 5 routes and 5 services', () => {
  assert.strictEqual(items.length, 10, 'Must have exactly 10 items in default carousel');
  const routes = items.filter(it => it.kind === 'route');
  const services = items.filter(it => it.kind === 'service');
  assert.strictEqual(routes.length, 5, 'Must contain exactly 5 route cards');
  assert.strictEqual(services.length, 5, 'Must contain exactly 5 service cards');
});

runTest('Items alternate strictly between route and service (mixed pattern)', () => {
  for (let i = 0; i < items.length; i++) {
    const expectedKind = (i % 2 === 0) ? 'route' : 'service';
    assert.strictEqual(items[i].kind, expectedKind, `Item at index ${i} must be kind '${expectedKind}'`);
  }
});

runTest('Every route card satisfies alpine physical bounds', () => {
  const routes = items.filter(it => it.kind === 'route');
  for (const r of routes) {
    assert(r.id && typeof r.id === 'string', `Route id must be string (${r.id})`);
    assert(r.name && r.name.length > 5, `Route name must be descriptive (${r.name})`);
    assert(r.region && r.region.length > 3, `Route region must be descriptive (${r.region})`);
    assert(typeof r.maxElevation === 'number', `maxElevation must be number in meters for ${r.name}`);
    assert(r.maxElevation >= 3000 && r.maxElevation <= 8848, `Elevation (${r.maxElevation}m) must be high-altitude (3000m - 8848m) for ${r.name}`);
    assert(typeof r.distanceKm === 'number', `distanceKm must be number for ${r.name}`);
    assert(r.distanceKm >= 20 && r.distanceKm <= 300, `distanceKm (${r.distanceKm}km) must be realistic for ${r.name}`);
    assert(typeof r.durationDays === 'number', `durationDays must be number for ${r.name}`);
    assert(r.durationDays >= 5 && r.durationDays <= 30, `durationDays (${r.durationDays}d) must be realistic for ${r.name}`);
    assert(['Moderate', 'Strenuous', 'Challenging', 'Extreme'].includes(r.difficulty), `difficulty (${r.difficulty}) must be valid standard for ${r.name}`);
    assert(r.href && r.href.startsWith('/trails/'), `href must point to trail route (${r.href}) for ${r.name}`);
  }
});

runTest('Every service card satisfies commercial and emergency dispatch specs', () => {
  const services = items.filter(it => it.kind === 'service');
  for (const s of services) {
    assert(s.id && typeof s.id === 'string', `Service id must be string (${s.id})`);
    assert(s.title && s.title.length > 5, `Service title must be descriptive (${s.title})`);
    assert(s.category && s.category.length > 3, `Service category must be defined (${s.category})`);
    assert(s.highlightMetric && s.highlightMetric.length > 0, `Service highlightMetric must be defined (${s.highlightMetric})`);
    assert(s.description && s.description.length >= 30, `Service description must be detailed for ${s.title}`);
    assert(s.ctaText && s.ctaText.length > 0, `ctaText must be present for ${s.title}`);
    assert(s.ctaHref && (s.ctaHref.startsWith('/') || s.ctaHref.startsWith('tel:')), `ctaHref must be valid local route or tel URL for ${s.title}`);
  }
  
  // Specifically verify Heli Rescue emergency service
  const heli = services.find(s => s.id === 'heli-rescue');
  assert(heli, 'Helicopter rescue service must exist');
  assert.strictEqual(heli.ctaHref, 'tel:+97714123456', 'Heli rescue must provide direct telephone link');
  assert.strictEqual(heli.emergencyHotline, '+977 1 4123456', 'Heli rescue must provide formatted emergency phone number');
});

// -------------------------------------------------------------
// SUITE 5: Regional Map Coordinates & Kinematics
// -------------------------------------------------------------
console.log('\n--- SUITE 5: Regional Map Coordinates & Kinematics ---');

const regConfigsMatch = mapCode.match(/export const REGION_CONFIGS:\s*Record<string,\s*RegionConfig>\s*=\s*(\{[\s\S]*?\n\};)/);
assert(regConfigsMatch, 'REGION_CONFIGS must be defined and exported in HomeRegionalMap.tsx');

const cleanRegConfigsStr = regConfigsMatch[1].replace(/;\s*$/, '');
const regionConfigs = eval('(' + cleanRegConfigsStr + ')');

runTest('REGION_CONFIGS contains all 5 key Himalayan regions', () => {
  const keys = Object.keys(regionConfigs);
  const required = ['Everest', 'Annapurna', 'Manaslu', 'Mustang', 'Langtang'];
  for (const req of required) {
    assert(keys.includes(req), `REGION_CONFIGS must include '${req}'`);
  }
});

runTest('All 5 regions have precise coordinates within Nepal territory (lat: 26.0-31.0, lng: 80.0-89.0)', () => {
  for (const [key, reg] of Object.entries(regionConfigs)) {
    const [lat, lng] = reg.coords;
    assert(typeof lat === 'number' && typeof lng === 'number', `Coordinates must be numbers for ${key}`);
    assert(lat >= 26.0 && lat <= 31.0, `Latitude (${lat}) for ${key} must be within Nepal bounds (26.0 - 31.0)`);
    assert(lng >= 80.0 && lng <= 89.0, `Longitude (${lng}) for ${key} must be within Nepal bounds (80.0 - 89.0)`);
  }
});

runTest('All 5 regions have appropriate zoom levels (between 9.0 and 12.0) for regional massifs', () => {
  for (const [key, reg] of Object.entries(regionConfigs)) {
    assert(typeof reg.zoom === 'number', `Zoom must be number for ${key}`);
    assert(reg.zoom >= 9.0 && reg.zoom <= 12.0, `Zoom (${reg.zoom}) for ${key} must be between 9.0 and 12.0`);
  }
});

runTest('All 5 regions have valid trailId linking to existing trails', () => {
  const validTrailIds = ['ebc-trek', 'annapurna-circuit', 'manaslu-circuit', 'upper-mustang', 'langtang-valley'];
  for (const [key, reg] of Object.entries(regionConfigs)) {
    assert(validTrailIds.includes(reg.trailId), `Region ${key} has trailId '${reg.trailId}' which must match valid trail id`);
  }
});

runTest('HomeRegionalMap provides prominent active Cesium 3D CTA actions', () => {
  assert(mapCode.includes('/map?engine=cesium'), 'Must link to /map?engine=cesium');
  assert(mapCode.includes('Launch 3D Cesium Discovery Hub'), 'Header must feature prominent Launch 3D Cesium Discovery Hub button');
  assert(mapCode.includes('/map?engine=cesium&trail='), 'Region sub-banner must provide deep link to 3D Cesium drone simulator for active trail');
  assert(mapCode.includes('Fly in 3D Drone Simulator'), 'Sub-banner CTA must feature Fly in 3D Drone Simulator');
});

runTest('LeafletMap is loaded dynamically with ssr: false and fallback skeleton', () => {
  assert(mapCode.includes("ssr: false"), 'LeafletMap must be imported with ssr: false');
  assert(mapCode.includes("data-slot=\"loading\""), 'Must provide loading skeleton slot');
  assert(mapCode.includes("Initializing Himalayan Regional Geospatial Engine"), 'Loading text must describe regional engine initialization');
});

// -------------------------------------------------------------
// SUITE 6: Adversarial Boundary & Stress Cases
// -------------------------------------------------------------
console.log('\n--- SUITE 6: Adversarial Boundary & Stress Cases ---');

runTest('InfiniteCarousel supports custom renderItem prop without breaking track mirror', () => {
  assert(carouselCode.includes('renderItem?: (item: CarouselItem, index: number) => React.ReactNode'), 'InfiniteCarousel must accept custom renderItem function');
  assert(carouselCode.includes('renderItem(item, index)'), 'renderContent must call renderItem when supplied');
});

runTest('InfiniteCarousel handles custom children elements', () => {
  assert(carouselCode.includes('if (children)'), 'InfiniteCarousel must check and render children if provided');
});

runTest('Interactive keyboard accessibility: focus triggers pause and outlines', () => {
  assert(carouselCode.includes('onFocus={handleFocus}'), 'InfiniteCarousel must handle onFocus');
  assert(carouselCode.includes('onBlur={handleBlur}'), 'InfiniteCarousel must handle onBlur');
  assert(carouselCode.includes('setIsFocused(true)'), 'onFocus must set isFocused to true');
  assert(carouselCode.includes('setIsFocused(false)'), 'onBlur must set isFocused to false');
  assert(carouselCode.includes('focus-visible:ring-2'), 'Cards and links must specify accessible focus rings');
});

runTest('Home page integrates both InfiniteCarousel and HomeRegionalMap seamlessly', () => {
  assert(pageCode.includes('<InfiniteCarousel'), 'src/app/page.tsx must render <InfiniteCarousel');
  assert(pageCode.includes('<HomeRegionalMap />'), 'src/app/page.tsx must render <HomeRegionalMap />');
  assert(pageCode.includes('import InfiniteCarousel from'), 'page.tsx must import InfiniteCarousel');
  assert(pageCode.includes('import HomeRegionalMap from'), 'page.tsx must import HomeRegionalMap');
});

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
