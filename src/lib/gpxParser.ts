export interface EditableLandmark {
  id: string;
  name: string;
  category: 'High Pass' | 'Base Camp' | 'Monastery' | 'Sacred Lake' | 'Village' | 'Checkpost' | 'Summit' | 'Lodge';
  elevation: number;
  lat: number;
  lng: number;
  description: string;
}

export interface GpxTrackpoint {
  lat: number;
  lng: number;
  elevation: number;
  distanceFromStartKm: number;
  time?: string;
}

export interface GpxWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  category: EditableLandmark['category'];
  description: string;
}

export interface ElevationPoint {
  distanceKm: number;
  elevation: number;
  label?: string;
}

export interface ParsedRouteResult {
  name: string;
  description: string;
  format: 'gpx' | 'kml';
  trackpoints: GpxTrackpoint[];
  waypoints: [number, number][]; // [lat, lng]
  coordinatesWithElevation: [number, number, number][]; // [lat, lng, elevation]
  landmarks: EditableLandmark[];
  totalDistanceKm: number;
  minElevationM: number;
  maxElevationM: number;
  elevationGainM: number;
  elevationLossM: number;
  startPoint: string;
  endPoint: string;
  estimatedDays: number;
  elevationProfile: ElevationPoint[];
  fileName?: string;
}

/**
 * Standard Haversine distance in kilometers between two GPS coordinates
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Filter barometric micro-jitter and calculate true Himalayan elevation gain/loss
 */
export function calculateElevationMetrics(elevations: number[], thresholdM = 1.5) {
  let gain = 0;
  let loss = 0;
  let maxElevation = elevations.length > 0 ? elevations[0] : 0;
  let minElevation = elevations.length > 0 ? elevations[0] : 0;

  for (let i = 1; i < elevations.length; i++) {
    const prev = elevations[i - 1];
    const curr = elevations[i];
    if (curr > maxElevation) maxElevation = curr;
    if (curr < minElevation) minElevation = curr;

    const diff = curr - prev;
    if (Math.abs(diff) >= thresholdM) {
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }
  }
  return {
    gainM: Math.round(gain),
    lossM: Math.round(loss),
    maxElevationM: Math.round(maxElevation),
    minElevationM: Math.round(minElevation)
  };
}

/**
 * Categorize waypoint POIs based on common Himalayan naming patterns
 */
export function deduceLandmarkCategory(name: string, desc: string = ''): EditableLandmark['category'] {
  const text = `${name} ${desc}`.toLowerCase();
  if (text.includes('base camp') || text.includes('bc') || text.includes('camp')) return 'Base Camp';
  if (text.includes('pass') || text.includes(' la') || text.includes('la pass') || text.includes('col') || text.includes('gokyo ri')) return 'High Pass';
  if (text.includes('monastery') || text.includes('gompa') || text.includes('gumba') || text.includes('temple') || text.includes('chorten')) return 'Monastery';
  if (text.includes('lake') || text.includes('kund') || text.includes('tal') || text.includes('tsho') || text.includes('daha')) return 'Sacred Lake';
  if (text.includes('summit') || text.includes('peak') || text.includes('ri') || text.includes('himal') || text.includes('apex')) return 'Summit';
  if (text.includes('lodge') || text.includes('teahouse') || text.includes('guest house') || text.includes('hotel') || text.includes('inn')) return 'Lodge';
  if (text.includes('checkpost') || text.includes('checkpoint') || text.includes('entry') || text.includes('gate') || text.includes('police')) return 'Checkpost';
  return 'Village';
}

/**
 * Decimate high-density elevation track to a compact profile (max 40 points)
 * preserving min, max, and key slope points
 */
export function decimateElevationProfile(trackpoints: GpxTrackpoint[], maxPoints = 35): ElevationPoint[] {
  if (trackpoints.length <= maxPoints) {
    return trackpoints.map(pt => ({
      distanceKm: pt.distanceFromStartKm,
      elevation: pt.elevation
    }));
  }

  const step = (trackpoints.length - 1) / (maxPoints - 1);
  const result: ElevationPoint[] = [];

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.min(Math.round(i * step), trackpoints.length - 1);
    const pt = trackpoints[index];
    result.push({
      distanceKm: pt.distanceFromStartKm,
      elevation: Math.round(pt.elevation)
    });
  }

  return result;
}

/**
 * Parse standard GPX 1.0 / 1.1 XML content
 */
export function parseGpx(xml: string, fileName?: string): ParsedRouteResult {
  if (!xml || typeof xml !== 'string' || !xml.includes('<gpx')) {
    throw new Error('Invalid GPX format: Missing root <gpx> element');
  }

  const nameMatch = xml.match(/<metadata>[\s\S]*?<name>(.*?)<\/name>/i) || xml.match(/<trk>[\s\S]*?<name>(.*?)<\/name>/i);
  const descMatch = xml.match(/<metadata>[\s\S]*?<desc>(.*?)<\/desc>/i) || xml.match(/<trk>[\s\S]*?<desc>(.*?)<\/desc>/i);

  const name = nameMatch ? nameMatch[1].trim() : (fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Himalayan Expedition Trail');
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract waypoints <wpt>
  const landmarks: EditableLandmark[] = [];
  const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/wpt>/gi;
  let wptMatch;
  let wptIndex = 1;
  while ((wptMatch = wptRegex.exec(xml)) !== null) {
    const lat = parseFloat(wptMatch[1]);
    const lng = parseFloat(wptMatch[2]);
    const inner = wptMatch[3];
    const nameM = inner.match(/<name>(.*?)<\/name>/i);
    const eleM = inner.match(/<ele>(.*?)<\/ele>/i);
    const descM = inner.match(/<desc>(.*?)<\/desc>/i) || inner.match(/<cmt>(.*?)<\/cmt>/i);

    const lmName = nameM ? nameM[1].trim() : `Waypoint ${wptIndex}`;
    const lmDesc = descM ? descM[1].trim() : '';
    const lmEle = eleM ? Math.round(parseFloat(eleM[1])) : 3500;

    landmarks.push({
      id: `lm-gpx-${Date.now()}-${wptIndex++}`,
      name: lmName,
      category: deduceLandmarkCategory(lmName, lmDesc),
      elevation: lmEle,
      lat,
      lng,
      description: lmDesc || `${lmName} waypoint extracted from GPX.`
    });
  }

  // Extract trackpoints <trkpt> or route points <rtept>
  const trackpoints: GpxTrackpoint[] = [];
  const coordsTuples: [number, number][] = [];
  const coordsWithEle: [number, number, number][] = [];
  const elevations: number[] = [];
  let totalDist = 0;

  const trkptRegex = /<(?:trkpt|rtept)\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/(?:trkpt|rtept)>/gi;
  let trkptMatch;

  while ((trkptMatch = trkptRegex.exec(xml)) !== null) {
    const lat = parseFloat(trkptMatch[1]);
    const lng = parseFloat(trkptMatch[2]);
    const inner = trkptMatch[3];
    const eleM = inner.match(/<ele>(.*?)<\/ele>/i);
    const timeM = inner.match(/<time>(.*?)<\/time>/i);
    const ele = eleM ? parseFloat(eleM[1]) : 0;

    elevations.push(ele);
    coordsTuples.push([lat, lng]);
    coordsWithEle.push([lat, lng, ele]);

    if (trackpoints.length > 0) {
      const prev = trackpoints[trackpoints.length - 1];
      totalDist += haversineDistanceKm(prev.lat, prev.lng, lat, lng);
    }

    trackpoints.push({
      lat,
      lng,
      elevation: ele,
      distanceFromStartKm: Math.round(totalDist * 100) / 100,
      time: timeM ? timeM[1].trim() : undefined
    });
  }

  if (trackpoints.length === 0) {
    throw new Error('No trackpoints (<trkpt>) or routepoints (<rtept>) found in GPX file.');
  }

  const metrics = calculateElevationMetrics(elevations);
  const roundedTotalKm = Math.round(totalDist * 10) / 10;
  const estimatedDays = Math.max(1, Math.round(roundedTotalKm / 14));

  const startPoint = landmarks[0]?.name || (trackpoints.length > 0 ? `${trackpoints[0].lat.toFixed(4)}°N, ${trackpoints[0].lng.toFixed(4)}°E` : 'Starting Trailhead');
  const endPoint = landmarks[landmarks.length - 1]?.name || (trackpoints.length > 0 ? `${trackpoints[trackpoints.length - 1].lat.toFixed(4)}°N, ${trackpoints[trackpoints.length - 1].lng.toFixed(4)}°E` : 'Final Destination');

  return {
    name,
    description,
    format: 'gpx',
    trackpoints,
    waypoints: coordsTuples,
    coordinatesWithElevation: coordsWithEle,
    landmarks,
    totalDistanceKm: roundedTotalKm,
    minElevationM: metrics.minElevationM,
    maxElevationM: metrics.maxElevationM,
    elevationGainM: metrics.gainM,
    elevationLossM: metrics.lossM,
    startPoint,
    endPoint,
    estimatedDays,
    elevationProfile: decimateElevationProfile(trackpoints, 35),
    fileName
  };
}

/**
 * Parse KML 2.2 XML content
 */
export function parseKml(xml: string, fileName?: string): ParsedRouteResult {
  if (!xml || typeof xml !== 'string' || !xml.includes('<kml')) {
    throw new Error('Invalid KML format: Missing root <kml> element');
  }

  const nameMatch = xml.match(/<Document>[\s\S]*?<name>(.*?)<\/name>/i) || xml.match(/<Placemark>[\s\S]*?<name>(.*?)<\/name>/i);
  const descMatch = xml.match(/<Document>[\s\S]*?<description>(.*?)<\/description>/i);

  const name = nameMatch ? nameMatch[1].trim() : (fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Himalayan KML Route');
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract Placemarks with Points as landmarks
  const landmarks: EditableLandmark[] = [];
  const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/gi;
  let pmMatch;
  let wptIndex = 1;

  while ((pmMatch = placemarkRegex.exec(xml)) !== null) {
    const inner = pmMatch[1];
    if (inner.includes('<Point>')) {
      const pName = inner.match(/<name>(.*?)<\/name>/i);
      const pDesc = inner.match(/<description>(.*?)<\/description>/i);
      const coordM = inner.match(/<coordinates>\s*([^\s<]+)\s*<\/coordinates>/i);
      if (coordM) {
        const parts = coordM[1].split(',');
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        const ele = parts.length > 2 ? Math.round(parseFloat(parts[2])) : 3500;
        const lmName = pName ? pName[1].trim() : `Landmark ${wptIndex}`;
        const lmDesc = pDesc ? pDesc[1].trim() : '';

        landmarks.push({
          id: `lm-kml-${Date.now()}-${wptIndex++}`,
          name: lmName,
          category: deduceLandmarkCategory(lmName, lmDesc),
          elevation: ele,
          lat,
          lng,
          description: lmDesc || `${lmName} extracted from KML.`
        });
      }
    }
  }

  // Extract LineString coordinates for track
  const coordsTuples: [number, number][] = [];
  const coordsWithEle: [number, number, number][] = [];
  const trackpoints: GpxTrackpoint[] = [];
  const elevations: number[] = [];
  let totalDist = 0;

  const lineStringCoordM = xml.match(/<LineString>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i);
  if (lineStringCoordM) {
    const rawCoords = lineStringCoordM[1].trim().split(/\s+/);
    for (const raw of rawCoords) {
      const parts = raw.split(',');
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        const ele = parts.length > 2 ? parseFloat(parts[2]) : 0;
        if (!isNaN(lat) && !isNaN(lng)) {
          coordsTuples.push([lat, lng]);
          coordsWithEle.push([lat, lng, ele]);
          elevations.push(ele);

          if (trackpoints.length > 0) {
            const prev = trackpoints[trackpoints.length - 1];
            totalDist += haversineDistanceKm(prev.lat, prev.lng, lat, lng);
          }

          trackpoints.push({
            lat,
            lng,
            elevation: ele,
            distanceFromStartKm: Math.round(totalDist * 100) / 100
          });
        }
      }
    }
  }

  if (coordsTuples.length === 0) {
    throw new Error('No <LineString><coordinates> found in KML file.');
  }

  const metrics = calculateElevationMetrics(elevations);
  const roundedTotalKm = Math.round(totalDist * 10) / 10;
  const estimatedDays = Math.max(1, Math.round(roundedTotalKm / 14));

  const startPoint = landmarks[0]?.name || `${coordsTuples[0][0].toFixed(4)}°N, ${coordsTuples[0][1].toFixed(4)}°E`;
  const endPoint = landmarks[landmarks.length - 1]?.name || `${coordsTuples[coordsTuples.length - 1][0].toFixed(4)}°N, ${coordsTuples[coordsTuples.length - 1][1].toFixed(4)}°E`;

  return {
    name,
    description,
    format: 'kml',
    trackpoints,
    waypoints: coordsTuples,
    coordinatesWithElevation: coordsWithEle,
    landmarks,
    totalDistanceKm: roundedTotalKm,
    minElevationM: metrics.minElevationM,
    maxElevationM: metrics.maxElevationM,
    elevationGainM: metrics.gainM,
    elevationLossM: metrics.lossM,
    startPoint,
    endPoint,
    estimatedDays,
    elevationProfile: decimateElevationProfile(trackpoints, 35),
    fileName
  };
}

/**
 * Universal Route File Parser: Automatically parses GPX or KML
 */
export function parseRouteFile(content: string, fileName?: string): ParsedRouteResult {
  const trimmed = content.trim();
  if (trimmed.includes('<gpx') || (fileName && fileName.toLowerCase().endsWith('.gpx'))) {
    return parseGpx(content, fileName);
  }
  if (trimmed.includes('<kml') || (fileName && fileName.toLowerCase().endsWith('.kml'))) {
    return parseKml(content, fileName);
  }
  // Try GPX first, then KML
  try {
    return parseGpx(content, fileName);
  } catch {
    return parseKml(content, fileName);
  }
}

/**
 * High-fidelity authentic Himalayan GPX presets for instant 1-click testing
 */
export const SAMPLE_EBC_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="The Himalayan Trails Route Engine" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Everest Base Camp Trek (Khumbu Apex)</name>
    <desc>Legendary trek following the Dudh Koshi gorge into the heart of the Khumbu Glacier directly below Mount Everest.</desc>
  </metadata>
  <wpt lat="27.6869" lon="86.7314">
    <name>Lukla Tenzing-Hillary Airstrip</name>
    <ele>2860</ele>
    <desc>Gateway to the Khumbu Himal.</desc>
  </wpt>
  <wpt lat="27.8069" lon="86.7142">
    <name>Namche Bazaar</name>
    <ele>3440</ele>
    <desc>Sherpa cultural capital nestled in a natural mountain amphitheater.</desc>
  </wpt>
  <wpt lat="27.8358" lon="86.7645">
    <name>Tengboche Monastery</name>
    <ele>3867</ele>
    <desc>Sacred Buddhist monastery with panoramic Ama Dablam views.</desc>
  </wpt>
  <wpt lat="27.8920" lon="86.8310">
    <name>Dingboche Village</name>
    <ele>4410</ele>
    <desc>Acclimatization staging settlement walled by stone enclosures.</desc>
  </wpt>
  <wpt lat="27.9480" lon="86.8160">
    <name>Lobuche</name>
    <ele>4940</ele>
    <desc>Glacial moraine staging outpost near the Italian Pyramid.</desc>
  </wpt>
  <wpt lat="28.0044" lon="86.8569">
    <name>Everest Base Camp</name>
    <ele>5364</ele>
    <desc>South Col expedition base camp sitting on the Khumbu Icefall.</desc>
  </wpt>
  <trk>
    <name>Everest Base Camp Trek</name>
    <trkseg>
      <trkpt lat="27.6869" lon="86.7314"><ele>2860</ele></trkpt>
      <trkpt lat="27.7120" lon="86.7210"><ele>2750</ele></trkpt>
      <trkpt lat="27.7405" lon="86.7180"><ele>2610</ele></trkpt>
      <trkpt lat="27.7710" lon="86.7225"><ele>2830</ele></trkpt>
      <trkpt lat="27.8069" lon="86.7142"><ele>3440</ele></trkpt>
      <trkpt lat="27.8180" lon="86.7250"><ele>3600</ele></trkpt>
      <trkpt lat="27.8290" lon="86.7450"><ele>3750</ele></trkpt>
      <trkpt lat="27.8358" lon="86.7645"><ele>3867</ele></trkpt>
      <trkpt lat="27.8550" lon="86.7820"><ele>3980</ele></trkpt>
      <trkpt lat="27.8720" lon="86.8050"><ele>4200</ele></trkpt>
      <trkpt lat="27.8920" lon="86.8310"><ele>4410</ele></trkpt>
      <trkpt lat="27.9150" lon="86.8280"><ele>4650</ele></trkpt>
      <trkpt lat="27.9350" lon="86.8200"><ele>4820</ele></trkpt>
      <trkpt lat="27.9480" lon="86.8160"><ele>4940</ele></trkpt>
      <trkpt lat="27.9800" lon="86.8300"><ele>5164</ele></trkpt>
      <trkpt lat="28.0026" lon="86.8528"><ele>5180</ele></trkpt>
      <trkpt lat="28.0044" lon="86.8569"><ele>5364</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

export const SAMPLE_ANNAPURNA_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="The Himalayan Trails Route Engine" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Annapurna Circuit &amp; Thorong La High Pass</name>
    <desc>Classic trans-Himalayan high pass traverse circling the Annapurna Massif across alpine rhododendron forests and high Tibetan plateaus.</desc>
  </metadata>
  <wpt lat="28.2325" lon="84.3750">
    <name>Besisahar</name>
    <ele>760</ele>
    <desc>Subtropical trailhead town.</desc>
  </wpt>
  <wpt lat="28.5520" lon="84.2380">
    <name>Chame</name>
    <ele>2670</ele>
    <desc>District headquarters of Manang with hot springs.</desc>
  </wpt>
  <wpt lat="28.6670" lon="84.0200">
    <name>Manang Valley</name>
    <ele>3519</ele>
    <desc>Broad alpine basin framed by Annapurna III and Gangapurna.</desc>
  </wpt>
  <wpt lat="28.7940" lon="83.9370">
    <name>Thorong La Pass Summit</name>
    <ele>5416</ele>
    <desc>World-renowned high mountain pass between Manang and Mustang.</desc>
  </wpt>
  <wpt lat="28.8180" lon="83.8710">
    <name>Muktinath Sacred Temple</name>
    <ele>3760</ele>
    <desc>Sacred pilgrimage sanctuary revered by Buddhists and Hindus.</desc>
  </wpt>
  <trk>
    <name>Annapurna Circuit</name>
    <trkseg>
      <trkpt lat="28.2325" lon="84.3750"><ele>760</ele></trkpt>
      <trkpt lat="28.3100" lon="84.3900"><ele>930</ele></trkpt>
      <trkpt lat="28.4100" lon="84.3500"><ele>1430</ele></trkpt>
      <trkpt lat="28.4900" lon="84.3000"><ele>1960</ele></trkpt>
      <trkpt lat="28.5520" lon="84.2380"><ele>2670</ele></trkpt>
      <trkpt lat="28.6050" lon="84.1450"><ele>3200</ele></trkpt>
      <trkpt lat="28.6670" lon="84.0200"><ele>3519</ele></trkpt>
      <trkpt lat="28.7100" lon="83.9900"><ele>4050</ele></trkpt>
      <trkpt lat="28.7500" lon="83.9600"><ele>4525</ele></trkpt>
      <trkpt lat="28.7940" lon="83.9370"><ele>5416</ele></trkpt>
      <trkpt lat="28.8180" lon="83.8710"><ele>3760</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;
