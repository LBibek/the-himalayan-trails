import type { Trail, ItineraryDay } from '../types';
import type {
  StitchSegment,
  ConnectorBridge,
  StitchedMetrics,
  StitchedElevationPoint,
  StitchedRoute,
  PassCrossingAssessment
} from '../types/routes';
import {
  HIGH_PASS_CROSSING_REGISTRY,
  evaluatePassCrossingWindow
} from './passCrossingWindow.ts';
import { getCanonicalTrailBySlug } from './canonicalStages.ts';
import { ROUTE_TRACKS } from '../data/routeTracks.ts';

/**
 * Calculates geodesic surface distance in kilometers using the Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return 0;
  }
  const R = 6371.0088; // Mean Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Great-Circle spherical linear interpolation between two geographic points with linear altitude transition.
 */
export function interpolateGreatCirclePoints(
  p1: [number, number, number?],
  p2: [number, number, number?],
  count: number
): [number, number, number?][] {
  if (count <= 0) return [];
  const lat1 = (p1[0] * Math.PI) / 180;
  const lon1 = (p1[1] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const lon2 = (p2[1] * Math.PI) / 180;
  const ele1 = p1[2] ?? 3000;
  const ele2 = p2[2] ?? 3000;

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
    )
  );

  if (d < 1e-6) {
    return [];
  }

  const results: [number, number, number?][] = [];
  for (let i = 1; i <= count; i++) {
    const f = i / (count + 1);
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    const ele = Math.round(ele1 + f * (ele2 - ele1));

    results.push([
      Math.round(((lat * 180) / Math.PI) * 100000) / 100000,
      Math.round(((lon * 180) / Math.PI) * 100000) / 100000,
      ele
    ]);
  }
  return results;
}

/**
 * Resolves authentic route coordinates for a trail, prioritizing database trackpoints and ROUTE_TRACKS GPS dataset.
 */
function ensureTrailCoordinates(trail: Trail): [number, number, number?][] {
  if (trail.routeCoordinates && trail.routeCoordinates.length > 0) {
    return trail.routeCoordinates;
  }

  // Check authentic GPS trackpoints in ROUTE_TRACKS
  const track = ROUTE_TRACKS[trail.id] || ROUTE_TRACKS[trail.slug];
  if (track && track.coords && track.coords.length > 0) {
    const coords = track.coords;
    const n = coords.length;
    const profile = trail.elevationProfile;
    const minAlt = 2600;
    const maxAlt = trail.maxElevation || 5000;

    return coords.map((c, i) => {
      const frac = n > 1 ? i / (n - 1) : 0;
      let ele: number;
      if (profile && profile.length > 0) {
        const profIdx = frac * (profile.length - 1);
        const pLow = profile[Math.floor(profIdx)];
        const pHigh = profile[Math.ceil(profIdx)];
        const pFrac = profIdx - Math.floor(profIdx);
        ele = Math.round(pLow.elevation + pFrac * (pHigh.elevation - pLow.elevation));
      } else {
        ele = Math.round(minAlt + Math.sin(frac * Math.PI) * (maxAlt - minAlt));
      }
      return [
        Math.round(c[0] * 100000) / 100000,
        Math.round(c[1] * 100000) / 100000,
        ele
      ];
    });
  }

  // Regional anchors fallback
  const anchors: Record<string, [number, number]> = {
    Everest: [27.8069, 86.7142], // Namche
    Annapurna: [28.5355, 83.9856], // Pokhara / Annapurna
    Manaslu: [28.6472, 84.6225], // Manaslu Larkya
    Langtang: [28.2125, 85.5683], // Langtang Kyanjin
    Mustang: [29.1822, 83.9566], // Lo Manthang
    Rolwaling: [27.8833, 86.4333] // Tsho Rolpa
  };

  const center = anchors[trail.region] || [27.9, 86.7];
  const points: [number, number, number?][] = [];
  const steps = 6;
  const startAlt = 2200;
  const maxAlt = trail.maxElevation || 5000;

  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const lat = center[0] + (fraction - 0.5) * 0.15;
    const lng = center[1] + (fraction - 0.5) * 0.12;
    const ele = Math.round(startAlt + Math.sin(fraction * Math.PI) * (maxAlt - startAlt));
    points.push([
      Math.round(lat * 100000) / 100000,
      Math.round(lng * 100000) / 100000,
      ele
    ]);
  }

  return points;
}

/**
 * Derives itinerary stages for a trail from canonical stages or elevation profiles.
 */
function deriveTrailStages(trail: Trail): ItineraryDay[] {
  const canonical = getCanonicalTrailBySlug(trail.slug);
  if (canonical && canonical.stages && canonical.stages.length > 0) {
    return canonical.stages.map((st, i) => ({
      day: st.day || i + 1,
      title: st.title,
      route: `${trail.name} — Stage ${st.day || i + 1}`,
      distanceKm: st.distanceKm || Math.round((trail.distanceKm / canonical.stages.length) * 10) / 10,
      hours: Math.max(3, Math.round(((st.distanceKm || 10) / 2.5) * 10) / 10),
      sleepingAltitude: st.elevation,
      altitudeGain: Math.round((trail.elevationGain || 2000) / canonical.stages.length),
      highlights: `${trail.name} alpine stage`
    }));
  }

  // Fallback: create reasonable daily stages based on durationDays
  const days = Math.max(1, trail.durationDays || 5);
  const dailyKm = Math.round((trail.distanceKm / days) * 10) / 10;
  const dailyGain = Math.round((trail.elevationGain / days) * 10) / 10;
  const stages: ItineraryDay[] = [];

  for (let d = 1; d <= days; d++) {
    const isSummit = d === Math.ceil(days * 0.7);
    const sleepingAlt = Math.min(
      trail.maxElevation,
      Math.round(2000 + (d / days) * (trail.maxElevation - 2000))
    );
    stages.push({
      day: d,
      title: isSummit
        ? `${trail.name} High Apex Crossing`
        : `${trail.name} Stage ${d}`,
      route: `Trail segment through ${trail.region} valley`,
      distanceKm: dailyKm,
      hours: Math.max(4, Math.round(dailyKm / 2.5)),
      sleepingAltitude: sleepingAlt,
      altitudeGain: dailyGain,
      highlights: trail.highlights?.[(d - 1) % (trail.highlights.length || 1)] || `${trail.name} vista`
    });
  }

  return stages;
}

/**
 * Detects which iconic high passes are traversed by or adjacent to a set of coordinates.
 */
export function detectPassesOnRoute(
  coordinates: [number, number, number?][],
  segments: StitchSegment[] = []
): PassCrossingAssessment[] {
  const detected: PassCrossingAssessment[] = [];

  for (const passConfig of HIGH_PASS_CROSSING_REGISTRY) {
    let matched = false;

    // Proximity check (< 12 km from pass coordinates)
    for (const pt of coordinates) {
      const dist = haversineDistanceKm(
        pt[0],
        pt[1],
        passConfig.coordinates.lat,
        passConfig.coordinates.lng
      );
      if (dist <= 12) {
        matched = true;
        break;
      }
    }

    // Name / keyword check in segment metadata if proximity didn't trigger
    if (!matched) {
      const passNameLower = passConfig.name.toLowerCase();
      const passIdLower = passConfig.id.toLowerCase();
      for (const seg of segments) {
        const stageTitles = (seg.stages || []).map((s) => `${s.title} ${s.highlights || ''}`).join(' ');
        const segText = `${seg.trailName} ${seg.region} ${seg.startPoint} ${seg.endPoint} ${stageTitles}`.toLowerCase();
        if (segText.includes(passNameLower) || segText.includes(passIdLower)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      const assessment = evaluatePassCrossingWindow(passConfig.id);
      if (assessment) {
        detected.push(assessment);
      }
    }
  }

  return detected;
}

/**
 * Core Route Stitcher Engine:
 * Stitches multiple trails into a continuous, geodesic-bridged alpine route.
 */
export function stitchRoutes(
  trails: Trail[],
  options?: { customTitle?: string; customDescription?: string }
): StitchedRoute {
  if (!trails || trails.length === 0) {
    return {
      id: `stitched_${Date.now()}`,
      title: 'Empty Stitched Route',
      description: 'No trail segments selected.',
      segments: [],
      connectors: [],
      metrics: {
        totalDistanceKm: 0,
        totalElevationGainM: 0,
        totalElevationLossM: 0,
        maxAltitudeM: 0,
        minAltitudeM: 0,
        totalDays: 0,
        segmentCount: 0,
        highPassesCount: 0,
        connectorDistanceKm: 0
      },
      coordinates: [],
      elevationProfile: [],
      mergedItinerary: [],
      traversedPasses: [],
      createdAt: new Date().toISOString()
    };
  }

  const segments: StitchSegment[] = [];
  const connectors: ConnectorBridge[] = [];
  const continuousCoordinates: [number, number, number?][] = [];
  const coordMeta: { segmentIndex: number; isConnector: boolean; landmarkName?: string }[] = [];
  const mergedItinerary: ItineraryDay[] = [];

  let dayOffset = 0;
  let totalConnectorDistanceKm = 0;

  for (let i = 0; i < trails.length; i++) {
    const trail = trails[i];
    const trailCoords = ensureTrailCoordinates(trail);
    const trailStages = deriveTrailStages(trail);

    const segment: StitchSegment = {
      id: `seg_${i + 1}_${trail.id}`,
      trailId: trail.id,
      trailSlug: trail.slug,
      trailName: trail.name,
      region: trail.region,
      distanceKm: trail.distanceKm,
      elevationGain: trail.elevationGain,
      maxElevation: trail.maxElevation,
      durationDays: trail.durationDays,
      startPoint: trail.startPoint,
      endPoint: trail.endPoint,
      coordinates: trailCoords,
      elevationProfile: trail.elevationProfile,
      stages: trailStages
    };
    segments.push(segment);

    // If not the first segment, bridge between segment i-1's last coordinate and segment i's first coordinate
    if (i > 0) {
      const prevCoords = segments[i - 1].coordinates;
      const prevLast = prevCoords[prevCoords.length - 1];
      const currFirst = trailCoords[0];

      const bridgeDist = haversineDistanceKm(
        prevLast[0],
        prevLast[1],
        currFirst[0],
        currFirst[1]
      );

      totalConnectorDistanceKm += bridgeDist;

      // If endpoints are separated by > 0.08 km, calculate great-circle geodesic interpolation
      if (bridgeDist > 0.08) {
        // Points count proportional to distance (approx 1 point per 1.5 km, between 2 and 20 points)
        const interpCount = Math.max(2, Math.min(20, Math.round(bridgeDist / 1.5)));
        const bridgePoints = interpolateGreatCirclePoints(prevLast, currFirst, interpCount);

        connectors.push({
          fromSegmentIndex: i - 1,
          toSegmentIndex: i,
          distanceKm: bridgeDist,
          interpolatedPointsCount: bridgePoints.length,
          startCoord: prevLast,
          endCoord: currFirst,
          interpolatedPoints: bridgePoints
        });

        // Add interpolated bridge points to the continuous polyline
        for (const pt of bridgePoints) {
          continuousCoordinates.push(pt);
          coordMeta.push({
            segmentIndex: i - 1,
            isConnector: true,
            landmarkName: `Geodesic Bridge ${i} ➔ ${i + 1}`
          });
        }
      }
    }

    // Append current segment coordinates (avoiding duplicating consecutive identical point)
    for (let sIdx = 0; sIdx < trailCoords.length; sIdx++) {
      const pt = trailCoords[sIdx];
      const last = continuousCoordinates[continuousCoordinates.length - 1];
      if (
        !last ||
        Math.abs(last[0] - pt[0]) > 1e-6 ||
        Math.abs(last[1] - pt[1]) > 1e-6
      ) {
        continuousCoordinates.push(pt);
        const lmName = sIdx === 0
          ? segment.startPoint
          : sIdx === trailCoords.length - 1
          ? segment.endPoint
          : undefined;

        coordMeta.push({
          segmentIndex: i,
          isConnector: false,
          landmarkName: lmName
        });
      }
    }

    // Sequentially merge day-by-day itineraries (re-indexing Day 1...N)
    for (const stage of trailStages) {
      dayOffset += 1;
      mergedItinerary.push({
        day: dayOffset,
        title: stage.title,
        route: stage.route || `${trail.name} (Day ${stage.day})`,
        distanceKm: stage.distanceKm,
        hours: stage.hours,
        sleepingAltitude: stage.sleepingAltitude,
        altitudeGain: stage.altitudeGain,
        highlights: stage.highlights
      });
    }
  }

  // Calculate merged elevation profile & cumulative metrics
  const elevationProfile: StitchedElevationPoint[] = [];
  let cumulativeDistKm = 0;
  let totalGainM = 0;
  let totalLossM = 0;
  let maxAltM = -Infinity;
  let minAltM = Infinity;

  for (let k = 0; k < continuousCoordinates.length; k++) {
    const pt = continuousCoordinates[k];
    const alt = pt[2] ?? 3000;
    maxAltM = Math.max(maxAltM, alt);
    minAltM = Math.min(minAltM, alt);

    if (k > 0) {
      const prev = continuousCoordinates[k - 1];
      const deltaKm = haversineDistanceKm(prev[0], prev[1], pt[0], pt[1]);
      cumulativeDistKm += deltaKm;

      const prevAlt = prev[2] ?? 3000;
      const altDiff = alt - prevAlt;
      if (altDiff > 0) {
        totalGainM += altDiff;
      } else {
        totalLossM += Math.abs(altDiff);
      }
    }

    const meta = coordMeta[k];
    elevationProfile.push({
      distanceKm: Math.round(cumulativeDistKm * 10) / 10,
      altitudeMeters: alt,
      lat: pt[0],
      lng: pt[1],
      segmentIndex: meta ? meta.segmentIndex : 0,
      isConnector: meta ? meta.isConnector : false,
      landmarkName: meta?.landmarkName
    });
  }

  // Ensure apex altitude incorporates all segment peaks
  const segmentMaxElevations = segments.map((s) => s.maxElevation || 0);
  if (segmentMaxElevations.length > 0) {
    maxAltM = Math.max(maxAltM, ...segmentMaxElevations);
  }

  if (!Number.isFinite(maxAltM)) maxAltM = 0;
  if (!Number.isFinite(minAltM)) minAltM = 0;

  // Detect high passes on this route
  const traversedPasses = detectPassesOnRoute(continuousCoordinates, segments);

  const totalSegmentDistance = segments.reduce((sum, s) => sum + s.distanceKm, 0);
  const finalDistanceKm = Math.round((totalSegmentDistance + totalConnectorDistanceKm) * 10) / 10;

  const defaultTitle = segments.map((s) => s.trailName).join(' ⟷ ');
  const defaultDesc = `Custom alpine expedition combining ${segments.length} trails across ${Array.from(new Set(segments.map((s) => s.region))).join(', ')} with ${traversedPasses.length} iconic high pass crossings.`;

  const metrics: StitchedMetrics = {
    totalDistanceKm: finalDistanceKm,
    totalElevationGainM: Math.round(totalGainM),
    totalElevationLossM: Math.round(totalLossM),
    maxAltitudeM: maxAltM,
    minAltitudeM: minAltM,
    totalDays: mergedItinerary.length,
    segmentCount: segments.length,
    highPassesCount: traversedPasses.length,
    connectorDistanceKm: Math.round(totalConnectorDistanceKm * 10) / 10
  };

  return {
    id: `stitched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: options?.customTitle || defaultTitle,
    description: options?.customDescription || defaultDesc,
    segments,
    connectors,
    metrics,
    coordinates: continuousCoordinates,
    elevationProfile,
    mergedItinerary,
    traversedPasses,
    createdAt: new Date().toISOString()
  };
}

/**
 * Generates an authentic, valid standard GPX 1.1 XML string ready for offline GPS devices, Garmin, Suunto, or AllTrails.
 */
export function exportStitchedGpx(stitchedRoute: StitchedRoute): string {
  const sanitize = (text: string) =>
    (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const now = new Date().toISOString();
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="The Himalayan Trails Multi-Trail Route Stitcher"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${sanitize(stitchedRoute.title)}</name>
    <desc>${sanitize(stitchedRoute.description)}</desc>
    <time>${now}</time>
    <keywords>Himalayas, Trekking, Multi-Trail, GPX, Nepal, Alpine</keywords>
  </metadata>
`;

  // 1. Output Start Trailhead waypoint first so standard GPX parsers recognize expedition start
  if (stitchedRoute.segments.length > 0 && stitchedRoute.segments[0].coordinates.length > 0) {
    const firstSeg = stitchedRoute.segments[0];
    const firstPt = firstSeg.coordinates[0];
    xml += `  <wpt lat="${firstPt[0]}" lon="${firstPt[1]}">
    <ele>${firstPt[2] ?? 0}</ele>
    <name>${sanitize(firstSeg.startPoint || 'Trailhead')}</name>
    <desc>Expedition Trailhead of ${sanitize(firstSeg.trailName)}</desc>
    <type>Trailhead</type>
  </wpt>
`;
  }

  // 2. Output waypoints for high passes traversed
  if (stitchedRoute.traversedPasses && stitchedRoute.traversedPasses.length > 0) {
    for (const pass of stitchedRoute.traversedPasses) {
      xml += `  <wpt lat="${pass.coordinates.lat}" lon="${pass.coordinates.lng}">
    <ele>${pass.elevationM}</ele>
    <name>${sanitize(pass.passName)}</name>
    <desc>High Alpine Pass (${pass.elevationM}m) - Status: ${pass.currentStatus}</desc>
    <type>High Pass</type>
  </wpt>
`;
    }
  }

  // 3. Output waypoints for intermediate segment transitions
  if (stitchedRoute.segments.length > 1) {
    for (let s = 1; s < stitchedRoute.segments.length; s++) {
      const seg = stitchedRoute.segments[s];
      if (seg.coordinates.length > 0) {
        const pt = seg.coordinates[0];
        xml += `  <wpt lat="${pt[0]}" lon="${pt[1]}">
    <ele>${pt[2] ?? 0}</ele>
    <name>${sanitize(seg.startPoint)}</name>
    <desc>Transition checkpoint to ${sanitize(seg.trailName)}</desc>
    <type>Checkpoint</type>
  </wpt>
`;
      }
    }
  }

  // 4. Output Terminus waypoint of final segment
  if (stitchedRoute.segments.length > 0) {
    const lastSeg = stitchedRoute.segments[stitchedRoute.segments.length - 1];
    if (lastSeg.coordinates.length > 0) {
      const lastPt = lastSeg.coordinates[lastSeg.coordinates.length - 1];
      xml += `  <wpt lat="${lastPt[0]}" lon="${lastPt[1]}">
    <ele>${lastPt[2] ?? 0}</ele>
    <name>${sanitize(lastSeg.endPoint || 'Terminus')}</name>
    <desc>Expedition Terminus of ${sanitize(lastSeg.trailName)}</desc>
    <type>Terminus</type>
  </wpt>
`;
    }
  }

  // Continuous Track
  xml += `  <trk>
    <name>${sanitize(stitchedRoute.title)}</name>
    <desc>Continuous stitched Himalayan multi-trail route with ${stitchedRoute.connectors.length} geodesic bridges</desc>
    <trkseg>
`;

  for (const pt of stitchedRoute.coordinates) {
    const eleTag = pt[2] !== undefined ? `\n        <ele>${pt[2]}</ele>` : '';
    xml += `      <trkpt lat="${pt[0]}" lon="${pt[1]}">${eleTag}
      </trkpt>
`;
  }

  xml += `    </trkseg>
  </trk>
</gpx>`;

  return xml;
}
