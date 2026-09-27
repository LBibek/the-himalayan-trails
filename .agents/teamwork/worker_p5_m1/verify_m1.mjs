import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve('c:/Users/acer/Desktop/The Himalayan Trails');

test('Milestone 1 Verification — InfiniteCarousel, GlassBadge, GlassCard, and globals.css', async (t) => {
  await t.test('1. globals.css contains marquee-left, marquee-right, and pause rules', () => {
    const cssPath = path.join(projectRoot, 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert.ok(cssContent.includes('@keyframes marquee-left'), 'globals.css must define @keyframes marquee-left');
    assert.ok(cssContent.includes('@keyframes marquee-right'), 'globals.css must define @keyframes marquee-right');
    assert.ok(cssContent.includes('translate3d'), 'Keyframes must use GPU-accelerated translate3d');
    assert.ok(cssContent.includes('.animate-marquee-left'), 'globals.css must have .animate-marquee-left');
    assert.ok(cssContent.includes('.animate-marquee-right'), 'globals.css must have .animate-marquee-right');
    assert.ok(cssContent.includes('animation-play-state: paused'), 'globals.css must support animation-play-state: paused');
    assert.ok(cssContent.includes('.group:hover'), 'globals.css must support .group:hover pause');
  });

  await t.test('2. GlassBadge.tsx contains root data-slot="base", state attributes, and focus rings', () => {
    const badgePath = path.join(projectRoot, 'src/components/ui/GlassBadge.tsx');
    const badgeContent = fs.readFileSync(badgePath, 'utf8');

    assert.ok(badgeContent.includes('data-slot="base"'), 'GlassBadge root container must have data-slot="base"');
    assert.ok(badgeContent.includes('data-hovered'), 'GlassBadge must support data-hovered');
    assert.ok(badgeContent.includes('data-pressed'), 'GlassBadge must support data-pressed');
    assert.ok(badgeContent.includes('data-focus-visible'), 'GlassBadge must support data-focus-visible');
    assert.ok(badgeContent.includes('focus-visible:ring-focus'), 'GlassBadge must include focus-visible:ring-focus');
    assert.ok(badgeContent.includes('focus-visible:ring-2'), 'GlassBadge must include focus-visible:ring-2');
  });

  await t.test('3. GlassCard.tsx contains data-slot="base", keyboard activation, and focus rings', () => {
    const cardPath = path.join(projectRoot, 'src/components/ui/GlassCard.tsx');
    const cardContent = fs.readFileSync(cardPath, 'utf8');

    assert.ok(cardContent.includes('data-slot="base"'), 'GlassCard root container must have data-slot="base"');
    assert.ok(cardContent.includes('data-hovered'), 'GlassCard must support data-hovered');
    assert.ok(cardContent.includes('data-pressed'), 'GlassCard must support data-pressed');
    assert.ok(cardContent.includes('data-focus-visible'), 'GlassCard must support data-focus-visible');
    assert.ok(cardContent.includes('focus-visible:ring-focus'), 'GlassCard must include focus-visible:ring-focus');
    assert.ok(cardContent.includes('focus-visible:ring-2'), 'GlassCard must include focus-visible:ring-2');
    assert.ok(cardContent.includes('handleKeyDown'), 'GlassCard must support keyboard activation via handleKeyDown');
    assert.ok(cardContent.includes("e.key === 'Enter' || e.key === ' '"), 'GlassCard must activate on Enter or Space');
    assert.ok(cardContent.includes('GlassCard.Header = GlassCardHeader'), 'GlassCard must attach Header compound');
    assert.ok(cardContent.includes('GlassCard.Body = GlassCardBody'), 'GlassCard must attach Body compound');
    assert.ok(cardContent.includes('GlassCard.Footer = GlassCardFooter'), 'GlassCard must attach Footer compound');
  });

  await t.test('4. InfiniteCarousel.tsx implements full HeroUI compound specs, dual tracks, and mixed cards', () => {
    const carouselPath = path.join(projectRoot, 'src/components/ui/InfiniteCarousel.tsx');
    assert.ok(fs.existsSync(carouselPath), 'src/components/ui/InfiniteCarousel.tsx must exist');
    const content = fs.readFileSync(carouselPath, 'utf8');

    // Semantic slots
    assert.ok(content.includes('data-slot="base"'), 'Must have root data-slot="base"');
    assert.ok(content.includes('data-slot="track"'), 'Must have data-slot="track"');
    assert.ok(content.includes('data-slot="card"'), 'Must have data-slot="card"');
    assert.ok(content.includes('data-slot="header"'), 'Must have data-slot="header"');
    assert.ok(content.includes('data-slot="body"'), 'Must have data-slot="body"');
    assert.ok(content.includes('data-slot="footer"'), 'Must have data-slot="footer"');

    // Dual mirrored tracks
    assert.ok(content.includes('aria-hidden'), 'Must have aria-hidden on mirrored track');
    assert.ok(content.includes('translate3d'), 'Must have GPU translate3d transforms');

    // Props & controls
    assert.ok(content.includes('speed'), 'Must support speed prop');
    assert.ok(content.includes('direction'), 'Must support direction prop');
    assert.ok(content.includes('pauseOnHover'), 'Must support pauseOnHover prop');
    assert.ok(content.includes('pauseOnTouch'), 'Must support pauseOnTouch prop');

    // Compound subcomponents
    assert.ok(content.includes('CarouselTrack'), 'Must export CarouselTrack');
    assert.ok(content.includes('CarouselCard'), 'Must export CarouselCard');
    assert.ok(content.includes('CarouselRouteCard'), 'Must export CarouselRouteCard');
    assert.ok(content.includes('CarouselServiceCard'), 'Must export CarouselServiceCard');
    assert.ok(content.includes('InfiniteCarousel.Track = CarouselTrack'), 'Must attach Track compound');
    assert.ok(content.includes('InfiniteCarousel.Card = CarouselCard'), 'Must attach Card compound');

    // Mixed models
    assert.ok(content.includes('DEFAULT_CAROUSEL_ITEMS'), 'Must define DEFAULT_CAROUSEL_ITEMS');
    assert.ok(content.includes('Everest Base Camp Trek'), 'Default items must include Everest Base Camp');
    assert.ok(content.includes('Guided Alpine Expeditions'), 'Default items must include Guided Alpine Expeditions');
    assert.ok(content.includes('100% IFMGA Sherpa'), 'Default items must include IFMGA Sherpa metric');
    assert.ok(content.includes('24/7 Garmin SAR'), 'Default items must include Garmin SAR metric');
    assert.ok(content.includes('100% Legal RAP Permits'), 'Default items must include RAP Permits metric');
  });
});
