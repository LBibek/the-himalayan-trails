import type { Trail } from '../types';
import type {
  MatchmakerPreferences,
  TrueCostBreakdown,
  ExpeditionMatchResult,
  ComfortPreference
} from '../types/matchmaker';

/**
 * Calculates a complete realistic door-to-door cost breakdown for an expedition
 * covering base package, domestic STOL flights/jeeps, daily food & hot shower,
 * national park permits/TIMS, and recommended guide/porter tipping.
 */
export function calculateTrueCost(
  trail: Trail,
  comfort: ComfortPreference = 'authentic_teahouse'
): TrueCostBreakdown {
  const duration = Math.max(1, trail.durationDays);
  const region = (trail.region || '').toLowerCase();
  const slug = (trail.slug || '').toLowerCase();
  const maxElev = trail.maxElevation || 4000;

  // 1. Base package (Daily guiding, lodge accommodation, logistics)
  const baseDailyRate = comfort === 'premium_lodge' ? 140 : 95;
  const basePackageUsd = Math.round(duration * baseDailyRate);

  // 2. Domestic transit / flights
  let domesticTransitUsd = 100;
  let domesticTransitDetails = 'Kathmandu ↔ Trailhead roundtrip overland private transit';

  if (region.includes('everest') || slug.includes('everest') || slug.includes('ebc') || slug.includes('gokyo')) {
    domesticTransitUsd = 420;
    domesticTransitDetails = 'Kathmandu ↔ Lukla (LUA) roundtrip STOL mountain flights ($420)';
  } else if (region.includes('mustang') || slug.includes('mustang')) {
    domesticTransitUsd = 320;
    domesticTransitDetails = 'Kathmandu ↔ Pokhara & Jomsom mountain hopper flights + 4WD high clearance ($320)';
  } else if (region.includes('manaslu') || slug.includes('manaslu')) {
    domesticTransitUsd = 150;
    domesticTransitDetails = 'Kathmandu ↔ Soti Khola / Machha Khola & Besisahar roundtrip 4WD expedition jeep ($150)';
  } else if (region.includes('annapurna') || slug.includes('annapurna') || slug.includes('poon')) {
    domesticTransitUsd = 80;
    domesticTransitDetails = 'Kathmandu ↔ Pokhara tourist coach + Besisahar/Nayapul local 4WD ($80)';
  } else if (region.includes('langtang') || slug.includes('langtang')) {
    domesticTransitUsd = 70;
    domesticTransitDetails = 'Kathmandu ↔ Syabrubesi roundtrip private mountain jeep ($70)';
  } else if (region.includes('rolwaling') || slug.includes('rolwaling')) {
    domesticTransitUsd = 310;
    domesticTransitDetails = 'Kathmandu ↔ Chhetchhet private 4WD ($100) + Lukla ↔ Kathmandu return flight ($210)';
  }

  // 3. Daily food & hot shower budget
  let dailyFoodRateUsd = 30;
  let foodAndShowerDetails = '';

  if (comfort === 'premium_lodge') {
    dailyFoodRateUsd = 65;
    foodAndShowerDetails = `$65/day: Luxury lodge à la carte dining, barista coffee, private attached bath hot water & electric heating (${duration} days)`;
  } else {
    if (maxElev > 4500) {
      dailyFoodRateUsd = 35;
      foodAndShowerDetails = `$35/day: High-altitude hearty Sherpa stew, Dal Bhat refills, ginger lemon tea & gas/solar hot shower credits (${duration} days)`;
    } else if (maxElev > 3500) {
      dailyFoodRateUsd = 30;
      foodAndShowerDetails = `$30/day: Traditional teahouse three-course meals, boiled drinking water & bucket hot shower (${duration} days)`;
    } else {
      dailyFoodRateUsd = 25;
      foodAndShowerDetails = `$25/day: Wholesome local teahouse meals, hot beverages & village lodge hot showers (${duration} days)`;
    }
  }
  const dailyFoodAndShowerUsd = Math.round(duration * dailyFoodRateUsd);

  // 4. National Park Permits & TIMS
  let permitsAndTimsUsd = 50;
  let permitsDetails = 'Nepal National Park Entry ($30) + TIMS Trekkers Card ($20)';

  if (region.includes('everest') || slug.includes('everest') || slug.includes('ebc') || slug.includes('gokyo')) {
    permitsAndTimsUsd = 70;
    permitsDetails = 'Sagarmatha National Park Permit ($30) + Khumbu Pasang Lhamu Entry ($20) + TIMS Card ($20)';
  } else if (region.includes('mustang') || slug.includes('mustang')) {
    permitsAndTimsUsd = 550;
    permitsDetails = 'Upper Mustang Restricted Area Permit (RAP $500) + Annapurna ACAP Permit ($30) + TIMS Card ($20)';
  } else if (region.includes('manaslu') || slug.includes('manaslu')) {
    permitsAndTimsUsd = 180;
    permitsDetails = 'Manaslu Restricted Area Permit (RAP $100) + MCAP ($30) + ACAP ($30) + TIMS Card ($20)';
  } else if (region.includes('annapurna') || slug.includes('annapurna') || slug.includes('poon')) {
    permitsAndTimsUsd = 50;
    permitsDetails = 'Annapurna Conservation Area Project (ACAP) Permit ($30) + TIMS Card ($20)';
  } else if (region.includes('langtang') || slug.includes('langtang')) {
    permitsAndTimsUsd = 50;
    permitsDetails = 'Langtang National Park Permit ($30) + TIMS Card ($20)';
  } else if (region.includes('rolwaling') || slug.includes('rolwaling')) {
    permitsAndTimsUsd = 80;
    permitsDetails = 'Gaurishankar Conservation Area (GCAP $30) + Sagarmatha NP Entry ($30) + TIMS Card ($20)';
  }

  // 5. Recommended guide/porter tipping budget (15% standard expedition gratuity)
  const tippingRatePercent = 15;
  const tippingBudgetUsd = Math.round(basePackageUsd * (tippingRatePercent / 100));

  // Total door-to-door investment
  const totalEstimatedInvestmentUsd =
    basePackageUsd +
    domesticTransitUsd +
    dailyFoodAndShowerUsd +
    permitsAndTimsUsd +
    tippingBudgetUsd;

  return {
    basePackageUsd,
    domesticTransitUsd,
    domesticTransitDetails,
    dailyFoodAndShowerUsd,
    dailyFoodRateUsd,
    foodAndShowerDetails,
    permitsAndTimsUsd,
    permitsDetails,
    tippingBudgetUsd,
    tippingRatePercent,
    totalEstimatedInvestmentUsd,
    comfortMode: comfort
  };
}

/**
 * Matches canonical database trails against 4-step wizard preferences.
 * Returns scored and sorted expeditions with match percentage and true cost simulation.
 */
export function matchExpeditions(
  trails: Trail[],
  preferences: MatchmakerPreferences
): ExpeditionMatchResult[] {
  if (!trails || trails.length === 0) return [];

  const results: ExpeditionMatchResult[] = trails.map((trail) => {
    let score = 0;
    const matchReasons: string[] = [];

    // ── 1. Duration Scoring (Max 30 pts) ──
    const d = trail.durationDays;
    if (preferences.duration === 'short') {
      if (d >= 6 && d <= 8) {
        score += 30;
        matchReasons.push(`Fits your 1-week vacation window perfectly (${d} days).`);
      } else if (d < 6) {
        score += 24;
        matchReasons.push(`Short quick getaway (${d} days).`);
      } else if (d <= 10) {
        score += 18;
        matchReasons.push(`Slightly exceeds 8 days (${d} days), but manageable with rapid descent.`);
      } else {
        score += 5;
      }
    } else if (preferences.duration === 'medium') {
      if (d >= 9 && d <= 14) {
        score += 30;
        matchReasons.push(`Ideal 2-week classic duration (${d} days) allowing steady acclimatization.`);
      } else if (d === 8 || d === 15 || d === 16) {
        score += 22;
        matchReasons.push(`Close to your 9–14 day target (${d} days).`);
      } else {
        score += 8;
      }
    } else if (preferences.duration === 'long') {
      if (d >= 14) {
        score += 30;
        matchReasons.push(`Comprehensive grand expedition circuit (${d} days).`);
      } else if (d >= 11) {
        score += 22;
        matchReasons.push(`Substantial mountain journey (${d} days).`);
      } else {
        score += 8;
      }
    }

    // ── 2. Season Scoring (Max 25 pts) ──
    const bestMonths = (trail.bestMonths || []).join(' ').toLowerCase();
    const isMustang = (trail.region || '').toLowerCase().includes('mustang') || (trail.slug || '').includes('mustang');

    if (preferences.season === 'spring') {
      if (bestMonths.includes('mar') || bestMonths.includes('apr') || bestMonths.includes('may') || bestMonths.includes('spring')) {
        score += 25;
        matchReasons.push('Peak Spring trekking season with blooming rhododendrons & stable mornings.');
      } else {
        score += 10;
      }
    } else if (preferences.season === 'autumn') {
      if (bestMonths.includes('sep') || bestMonths.includes('oct') || bestMonths.includes('nov') || bestMonths.includes('autumn')) {
        score += 25;
        matchReasons.push('Golden Autumn season offering crystalline high-altitude summit clarity.');
      } else {
        score += 10;
      }
    } else if (preferences.season === 'winter') {
      if (trail.maxElevation < 4500 || bestMonths.includes('dec') || bestMonths.includes('feb')) {
        score += 25;
        matchReasons.push('Crisp, quiet winter trails with minimal crowds and deep blue skies.');
      } else {
        score += 12;
        matchReasons.push('Requires thermal alpine preparation for sub-zero winter temperatures.');
      }
    } else if (preferences.season === 'monsoon') {
      if (isMustang) {
        score += 25;
        matchReasons.push('Located in the Himalayan Rain Shadow — completely dry and sunny during summer monsoon!');
      } else {
        score += 8;
        matchReasons.push('Monsoon season brings lush greenery, but expect slippery trails and cloud cover.');
      }
    }

    // ── 3. Fitness Level Scoring (Max 25 pts) ──
    const diff = (trail.difficulty || '').toLowerCase();
    const maxElev = trail.maxElevation || 4000;

    if (preferences.fitness === 'casual') {
      if ((diff.includes('moderate') || diff.includes('easy')) && maxElev <= 5000) {
        score += 25;
        matchReasons.push(`Moderate daily ascents and comfortable sleeping elevation (${maxElev}m).`);
      } else if (maxElev <= 5200) {
        score += 16;
        matchReasons.push(`Achievable moderate pace, reaches ${maxElev}m with proper hydration.`);
      } else {
        score += 4;
      }
    } else if (preferences.fitness === 'intermediate') {
      if (maxElev >= 4000 && maxElev <= 5450) {
        score += 25;
        matchReasons.push(`Perfect balance of high pass challenge (${maxElev}m) and established teahouse support.`);
      } else if (maxElev > 5450) {
        score += 20;
        matchReasons.push(`High summit reach (${maxElev}m) rewarding good cardiovascular stamina.`);
      } else {
        score += 16;
      }
    } else if (preferences.fitness === 'extreme') {
      if (diff.includes('strenuous') || diff.includes('challenging') || diff.includes('extreme') || maxElev > 5000) {
        score += 25;
        matchReasons.push(`Demands elite endurance, crossing extreme altitude (${maxElev}m) near the death zone.`);
      } else {
        score += 10;
      }
    }

    // ── 4. Expedition Vibe Scoring (Max 20 pts) ──
    const reg = (trail.region || '').toLowerCase();
    const name = (trail.name || '').toLowerCase();

    if (preferences.vibe === 'classic_iconic') {
      if (reg.includes('everest') || name.includes('everest') || name.includes('annapurna circuit') || name.includes('base camp')) {
        score += 20;
        matchReasons.push('Iconic Himalayan panoramas and legendary mountaineering history.');
      } else {
        score += 8;
      }
    } else if (preferences.vibe === 'remote_wilderness') {
      if (reg.includes('manaslu') || name.includes('manaslu') || name.includes('circuit') || name.includes('cho la') || name.includes('gokyo') || name.includes('three passes') || reg.includes('rolwaling') || name.includes('rolwaling') || name.includes('tashi lapcha')) {
        score += 20;
        matchReasons.push('Untamed wilderness, rugged glacial valleys and rare high-pass isolation.');
      } else if (reg.includes('langtang')) {
        score += 14;
      } else {
        score += 8;
      }
    } else if (preferences.vibe === 'cultural_immersion') {
      if (reg.includes('mustang') || reg.includes('langtang') || name.includes('mustang') || name.includes('tamang') || name.includes('langtang')) {
        score += 20;
        matchReasons.push('Deep Tibetan Buddhist culture, ancient walled cities and sacred Gompas.');
      } else if (reg.includes('everest')) {
        score += 14;
        matchReasons.push('Rich Sherpa Buddhist monasteries and living mountain heritage.');
      } else {
        score += 10;
      }
    }

    // Normalize to percentage (min 58%, max 99%)
    const matchPercentage = Math.min(99, Math.max(58, Math.round(score)));

    // Generate pacing summary
    const pacingSummary = `${trail.durationDays} Days • ${trail.distanceKm} km • Max Alt: ${trail.maxElevation}m (${trail.difficulty})`;

    // Calculate True Cost
    const costBreakdown = calculateTrueCost(trail, preferences.comfort);

    return {
      trail,
      matchPercentage,
      matchScore: score,
      matchReasons: matchReasons.slice(0, 3),
      pacingSummary,
      costBreakdown
    };
  });

  // Sort descending by match percentage
  return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
}
