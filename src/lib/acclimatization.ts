import type {
  StageSafetyRating,
  WmsAscentStatus,
  AmsRiskLevel,
  ItineraryStageInput,
  DailyPacingAudit,
  AcclimatizationReport,
} from '@/types/acclimatization';

/**
 * Wilderness Medical Society (WMS) Clinical Practice Guidelines for Altitude Illness
 * Resting arterial oxygen saturation (SpO2) estimation:
 * SpO2 ≈ 98 - (elevation / 1000) * 3.2
 *
 * Examples:
 * - Sea level (0m): ~98%
 * - Lukla (2,860m): ~89%
 * - Namche Bazaar (3,440m): ~87%
 * - Dingboche (4,410m): ~84%
 * - Everest Base Camp (5,364m): ~81%
 * - Thorong La Pass (5,416m): ~81%
 */
export function calculateEstimatedSpO2(elevationMeters: number): number {
  if (elevationMeters <= 0) return 98;
  const rawSpO2 = 98 - (elevationMeters / 1000) * 3.2;
  const clamped = Math.max(60, Math.min(99, rawSpO2));
  return Math.round(clamped * 10) / 10;
}

/**
 * Predicts Lake Louise Acute Mountain Sickness (AMS) risk score and clinical level
 * based on altitude, ascent velocity, and adaptation days.
 */
export function predictAmsRiskScore(
  sleepingElevation: number,
  dailyAscentMeters: number,
  daysAbove3000m: number,
  hadRestDayRecently: boolean = true
): {
  riskLevel: AmsRiskLevel;
  estimatedScore: number;
  details: string;
} {
  if (sleepingElevation < 2500) {
    return {
      riskLevel: 'LOW',
      estimatedScore: 0,
      details: 'Sub-threshold elevation (<2,500m). Hypobaric hypoxia is clinically negligible.',
    };
  }

  let baseScore = 0;

  // Altitude elevation bands
  if (sleepingElevation >= 5000) {
    baseScore += 4;
  } else if (sleepingElevation >= 4000) {
    baseScore += 3;
  } else if (sleepingElevation >= 3000) {
    baseScore += 2;
  } else {
    baseScore += 1;
  }

  // Ascent velocity impact
  if (dailyAscentMeters > 700) {
    baseScore += 4;
  } else if (dailyAscentMeters > 500) {
    baseScore += 2.5;
  } else if (dailyAscentMeters > 300) {
    baseScore += 1;
  } else if (dailyAscentMeters <= 0) {
    baseScore -= 1.5; // Rest or descent day
  }

  // Acclimatization discount
  if (daysAbove3000m >= 3 && hadRestDayRecently) {
    baseScore -= 2;
  } else if (!hadRestDayRecently && daysAbove3000m >= 3) {
    baseScore += 1.5; // Fatigue & hypoxia accumulation
  }

  const score = Math.max(0, Math.min(12, Math.round(baseScore)));

  let riskLevel: AmsRiskLevel = 'LOW';
  let details = 'Low physiological AMS likelihood. Maintain normal hydration.';

  if (score >= 6) {
    riskLevel = 'CRITICAL';
    details =
      'High likelihood of acute mountain sickness (AMS) and potential progression to HAPE/HACE. Mandatory rest or descend.';
  } else if (score >= 4) {
    riskLevel = 'HIGH';
    details =
      'Elevated AMS risk (Lake Louise ≥3 expected). Watch for throbbing headache, nausea, and peripheral ataxia.';
  } else if (score >= 2) {
    riskLevel = 'MODERATE';
    details =
      'Mild AMS risk. Normal physiological acclimatization symptoms likely (mild fatigue, elevated resting pulse).';
  }

  return { riskLevel, estimatedScore: score, details };
}

/**
 * Calculates "Climb High, Sleep Low" (CHSL) differential.
 * Compares daytime excursion peak altitude with evening sleeping camp altitude.
 * Positive delta indicates successful altitude stimulation while sleeping in safer, oxygen-dense conditions.
 */
export function calculateClimbHighSleepLowDelta(
  dayPeakElevation: number,
  sleepingElevation: number
): number {
  return Math.max(0, dayPeakElevation - sleepingElevation);
}

/**
 * Extracts peak or pass altitude from stage title string, e.g. "(5,416m)" or "(4,773m)".
 */
export function extractPeakElevationFromTitle(title: string): number | null {
  const match = title.match(/\(([0-9]{1,2},[0-9]{3}|[0-9]{4,5})\s*m\)/i);
  if (match) {
    const raw = match[1].replace(/,/g, '');
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return null;
}

/**
 * Checks whether an itinerary day should be recognized as a rest or acclimatization day.
 * Avoids false substring matches (e.g. 'Everest', 'Forest') via word boundaries,
 * and ensures downhill trekking descent stages are not mistakenly marked as rest days.
 */
export function isStageRestDay(title: string, dailyGain: number): boolean {
  const normalized = title.toLowerCase();
  const restRegex = /\b(rest|acclimatiz\w*|layover|halt|buffer|reserve)\b/i;
  if (restRegex.test(normalized)) {
    return true;
  }
  if (/\bexplore\b/i.test(normalized)) {
    return true;
  }
  const isTransit = /\bto\b/i.test(normalized) || /->|—|-/.test(normalized);
  return !isTransit && Math.abs(dailyGain) <= 50;
}

/**
 * Type-safe comprehensive Wilderness Medical Society (WMS) Itinerary Pacing Audit.
 *
 * Implements:
 * 1. Night sleep elevation gain tracking above 3,000m (≤500m optimal, >600m high-risk danger).
 * 2. Mandatory rest/acclimatization day check every 3–4 days or after ≥1,000m cumulative ascent.
 * 3. "Climb high, sleep low" calculation (day peak elevation vs night camp elevation).
 * 4. Estimated resting arterial blood oxygen saturation (SpO2) curve.
 * 5. Lake Louise AMS risk score prediction.
 */
export function auditItineraryPacing(stages: ItineraryStageInput[]): AcclimatizationReport {
  if (!stages || stages.length === 0) {
    return {
      stages: [],
      overallSafety: 'SAFE',
      totalAscentMeters: 0,
      maxSleepingElevation: 0,
      restDayCount: 0,
      daysAbove3000m: 0,
      consecutiveAscentDays: 0,
      wmsComplianceScore: 100,
      wmsViolations: [],
      recommendations: ['Add expedition stages to generate altitude acclimatization pacing insights.'],
      summaryText: 'Empty itinerary. No stages provided for medical audit.',
    };
  }

  const auditedStages: DailyPacingAudit[] = [];
  const violations: string[] = [];
  const recommendations: string[] = [];

  let totalAscentMeters = 0;
  let maxSleepingElevation = 0;
  let restDayCount = 0;
  let daysAbove3000m = 0;
  let consecutiveAscentDays = 0;
  let maxConsecutiveAscentDays = 0;
  let cumulativeAscentSinceRest = 0;
  let deductions = 0;

  for (let i = 0; i < stages.length; i++) {
    const current = stages[i];
    const prev = i > 0 ? stages[i - 1] : null;

    if (current.elevation > maxSleepingElevation) {
      maxSleepingElevation = current.elevation;
    }

    const dailyGain = prev ? current.elevation - prev.elevation : 0;
    if (dailyGain > 0) {
      totalAscentMeters += dailyGain;
    }

    const isAbove3000 = current.elevation >= 3000;
    if (isAbove3000) {
      daysAbove3000m++;
    }

    const restDay = i > 0 ? isStageRestDay(current.title, dailyGain) : false;
    if (restDay) {
      restDayCount++;
      consecutiveAscentDays = 0;
      cumulativeAscentSinceRest = 0;
    } else if (dailyGain > 0) {
      consecutiveAscentDays++;
      if (consecutiveAscentDays > maxConsecutiveAscentDays) {
        maxConsecutiveAscentDays = consecutiveAscentDays;
      }
      if (isAbove3000) {
        cumulativeAscentSinceRest += dailyGain;
      }
    } else if (dailyGain < 0) {
      // Descent day resets consecutive ascent counters
      consecutiveAscentDays = 0;
      cumulativeAscentSinceRest = 0;
    }

    // Calculate sleep elevation gain above 3000m according to WMS guidelines
    let sleepGainAbove3000 = 0;
    if (prev) {
      if (prev.elevation >= 3000 && current.elevation >= 3000) {
        sleepGainAbove3000 = Math.max(0, current.elevation - prev.elevation);
      } else if (prev.elevation < 3000 && current.elevation >= 3000) {
        sleepGainAbove3000 = Math.max(0, current.elevation - 3000);
      }
    }

    // Detect severe direct jump from low altitude into high altitude
    let isSevereJump = false;
    if (prev && prev.elevation < 3000 && current.elevation >= 3000 && dailyGain > 1000) {
      isSevereJump = true;
    }

    // Calculate "Climb high, sleep low" excursion
    const parsedPeak = extractPeakElevationFromTitle(current.title);
    const dayPeakElevation =
      current.dayPeakElevation ||
      (parsedPeak && parsedPeak > current.elevation ? parsedPeak : current.elevation);
    const climbHighSleepLowDelta = calculateClimbHighSleepLowDelta(
      dayPeakElevation,
      current.elevation
    );

    // Determine baseline rating and WMS status from ascent velocity
    let rating: StageSafetyRating = 'SAFE';
    let ratingLabel = 'Safe Pacing';
    let wmsStatus: WmsAscentStatus = 'Optimal Ascent';
    let advisory = 'Ascent velocity conforms to WMS guidelines. Maintain 3-4L hydration and steady pacing.';

    if (restDay) {
      rating = 'SAFE';
      ratingLabel = 'Rest & Acclimatization';
      wmsStatus = 'Optimal Ascent';
      if (climbHighSleepLowDelta >= 200) {
        advisory = `Acclimatization day active excursion reached ${dayPeakElevation.toLocaleString()}m (+${climbHighSleepLowDelta}m above camp). Excellent "climb high, sleep low" application.`;
      } else {
        advisory =
          'Acclimatization day: practice "climb high, sleep low" by doing an active ridge hike (+200-400m) and returning to sleep.';
      }
    } else if (isSevereJump) {
      rating = 'DANGER';
      ratingLabel = 'Severe Altitude Jump';
      wmsStatus = 'Steep Velocity Alert';
      advisory = `CRITICAL: Rapid single-day ascent (+${dailyGain}m) entering high altitude (≥3,000m). Massive hypobaric hypoxia shock. Strict rest and Acetazolamide prophylaxis required.`;
      deductions += 25;
      violations.push(
        `Day ${current.day} (${current.title}): Direct +${dailyGain}m ascent jump to ${current.elevation}m violates WMS gradual ascent rules.`
      );
    } else if (isAbove3000) {
      if (sleepGainAbove3000 > 600) {
        rating = 'DANGER';
        ratingLabel = 'Excessive Altitude Gain';
        wmsStatus = 'Steep Velocity Alert';
        advisory = `CRITICAL: Sleep elevation gain (+${sleepGainAbove3000}m) significantly exceeds WMS limit (max 500m/night above 3,000m). High risk of Acute Mountain Sickness (AMS). Insert an intermediate camp or rest day.`;
        deductions += 25;
        violations.push(
          `Day ${current.day} (${current.title}): +${sleepGainAbove3000}m sleeping gain above 3,000m exceeds clinical threshold (>600m).`
        );
      } else if (sleepGainAbove3000 > 500) {
        rating = 'CAUTION';
        ratingLabel = 'Elevated Velocity';
        wmsStatus = 'Moderate Caution';
        advisory = `ADVISORY: Sleeping elevation gain (+${sleepGainAbove3000}m) exceeds optimal 500m/night threshold. Monitor for early headache and consider Acetazolamide (Diamox 125mg bid) prophylaxis.`;
        deductions += 8;
        violations.push(
          `Day ${current.day} (${current.title}): +${sleepGainAbove3000}m sleeping gain exceeds recommended 500m limit.`
        );
      } else if (consecutiveAscentDays >= 4 && isAbove3000) {
        rating = 'CAUTION';
        ratingLabel = 'Acclimatization Due';
        wmsStatus = 'Moderate Caution';
        advisory = `ADVISORY: 4 consecutive ascent days above 3,000m without a dedicated rest day. WMS recommends taking a rest day every 3-4 days.`;
        deductions += 10;
        violations.push(
          `Day ${current.day} (${current.title}): 4+ consecutive ascent days above 3,000m without rest day.`
        );
      } else if (cumulativeAscentSinceRest >= 1000 && isAbove3000) {
        rating = 'CAUTION';
        ratingLabel = 'Cumulative Ascent Alert';
        wmsStatus = 'Moderate Caution';
        advisory = `ADVISORY: Cumulative ascent since last rest day reached ${cumulativeAscentSinceRest}m above 3,000m. Plan an acclimatization layover day soon.`;
        deductions += 10;
        violations.push(
          `Day ${current.day} (${current.title}): Cumulative ascent of ${cumulativeAscentSinceRest}m above 3,000m without rest.`
        );
      } else if (climbHighSleepLowDelta >= 250) {
        advisory = `Ascent conforms to WMS guidelines. Beneficial "climb high, sleep low" profile: daylight summit/pass excursion reached ${dayPeakElevation.toLocaleString()}m (+${climbHighSleepLowDelta}m above camp).`;
      }
    } else {
      // Below 3000m
      if (dailyGain > 1200) {
        rating = 'CAUTION';
        ratingLabel = 'Strenuous Gain';
        wmsStatus = 'Moderate Caution';
        advisory = `Heavy single-day elevation gain (+${dailyGain}m). Although below 3,000m, high physical strain may impair subsequent acclimatization.`;
        deductions += 5;
      }
    }

    const spO2 = calculateEstimatedSpO2(current.elevation);
    const hadRestRecently = restDayCount > 0 && consecutiveAscentDays <= 3;
    const amsPrediction = predictAmsRiskScore(
      current.elevation,
      dailyGain,
      daysAbove3000m,
      hadRestRecently
    );

    auditedStages.push({
      day: current.day,
      title: current.title,
      elevation: current.elevation,
      distanceKm: current.distanceKm,
      dayPeakElevation,
      climbHighSleepLowDelta,
      dailyGain,
      sleepGainAbove3000,
      isRestDay: restDay,
      rating,
      ratingLabel,
      wmsStatus,
      estimatedSpO2: spO2,
      amsRiskLevel: amsPrediction.riskLevel,
      clinicalAdvisory: advisory,
    });
  }

  // Global rest day check across whole itinerary
  if (daysAbove3000m >= 4 && restDayCount === 0) {
    deductions += 20;
    violations.push('Itinerary spends 4+ days above 3,000m without any designated rest/acclimatization day.');
  }

  // Calculate overall safety
  let overallSafety: StageSafetyRating = 'SAFE';
  if (auditedStages.some((s) => s.rating === 'DANGER')) {
    overallSafety = 'DANGER';
  } else if (auditedStages.some((s) => s.rating === 'CAUTION')) {
    overallSafety = 'CAUTION';
  }

  const wmsComplianceScore = Math.max(10, Math.min(100, 100 - deductions));

  // Synthesize personalized clinical recommendations
  if (overallSafety === 'DANGER') {
    recommendations.push(
      'Restructure stages that exceed +600m sleeping gain per night. Break long stages with intermediate wilderness tea houses.'
    );
  }
  if (daysAbove3000m >= 3 && restDayCount < Math.floor(daysAbove3000m / 3)) {
    recommendations.push(
      `Add at least ${Math.max(1, Math.floor(daysAbove3000m / 3) - restDayCount)} additional acclimatization rest day(s) at strategic milestone towns (e.g., Namche Bazaar 3,440m or Manang 3,540m).`
    );
  }
  if (maxSleepingElevation >= 4500) {
    recommendations.push(
      'High Pass / Extreme Altitude Protocol: Carry prophylactic Acetazolamide (Diamox 125mg), pulse oximeter, and ensure emergency evacuation insurance covers up to 6,000m.'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      'Excellent itinerary pacing! Ascent velocities and acclimatization rest stages fully comply with Wilderness Medical Society standards.'
    );
    recommendations.push(
      'Maintain standard alpine discipline: drink 4–5 liters of water daily, consume 3,500+ kcal, and report any persistent headache immediately.'
    );
  }

  // Generate summary text
  let summaryText = '';
  if (overallSafety === 'SAFE') {
    summaryText = `This ${stages.length}-day expedition shows optimal pacing with a WMS Compliance Score of ${wmsComplianceScore}%. Elevation gains are within safe physiological limits (max ${maxSleepingElevation}m).`;
  } else if (overallSafety === 'CAUTION') {
    summaryText = `This ${stages.length}-day expedition has a moderate pacing profile (WMS Compliance Score: ${wmsComplianceScore}%). Some ascent stages require conscious monitoring, hydration pacing, and possible layover rest.`;
  } else {
    summaryText = `CRITICAL ALERT: This itinerary contains rapid altitude jumps that violate Wilderness Medical Society safety guidelines (WMS Compliance Score: ${wmsComplianceScore}%). High vulnerability to Acute Mountain Sickness.`;
  }

  return {
    stages: auditedStages,
    overallSafety,
    totalAscentMeters,
    maxSleepingElevation,
    restDayCount,
    daysAbove3000m,
    consecutiveAscentDays: maxConsecutiveAscentDays,
    wmsComplianceScore,
    wmsViolations: violations,
    recommendations,
    summaryText,
  };
}
