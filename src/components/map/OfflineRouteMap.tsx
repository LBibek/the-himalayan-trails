'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Landmark } from '@/types';
import { Mountain, Compass, Navigation, Play, Pause, ChevronLeft, ChevronRight, Locate } from 'lucide-react';
import AlpineGlareToggle from '@/components/ui/AlpineGlareToggle';
import { useAlpineGlare } from '@/components/providers/AlpineGlareProvider';
import { findNextLodgeOrCheckpoint, NextLodgeResult, haversineDistanceKm } from '@/lib/emergencySos';

interface OfflineRouteMapProps {
  routeCoordinates: [number, number, number?][];
  landmarks: Landmark[];
  trailName: string;
}

function MapBoundsController({
  coordinates,
  focusCoord,
}: {
  coordinates: [number, number, number?][];
  focusCoord?: [number, number];
}) {
  const map = useMap();
  const initialFitDone = useRef(false);
  const lastPanTime = useRef(0);

  useEffect(() => {
    if (!initialFitDone.current && coordinates && coordinates.length > 0) {
      const latLngs = coordinates.map((pt) => [pt[0], pt[1]] as [number, number]);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      initialFitDone.current = true;
    }
  }, [coordinates, map]);

  useEffect(() => {
    if (focusCoord && initialFitDone.current) {
      const now = Date.now();
      const isRapid = now - lastPanTime.current < 200;
      lastPanTime.current = now;
      map.panTo(focusCoord, { animate: !isRapid, duration: 0.3 });
    }
  }, [focusCoord, map]);

  return null;
}

function createOfflineIcon(category: string, label: string) {
  let badgeColor = 'bg-[#B68D40] text-black border-[#E2C085]';
  let iconSymbol = '📍';
  if (category === 'Base Camp') { badgeColor = 'bg-red-600 text-white border-red-400'; iconSymbol = '⛺'; }
  else if (category === 'High Pass') { badgeColor = 'bg-amber-500 text-black border-amber-300'; iconSymbol = '🚩'; }
  else if (category === 'Monastery') { badgeColor = 'bg-purple-600 text-white border-purple-400'; iconSymbol = '🛕'; }
  else if (category === 'Sacred Lake') { badgeColor = 'bg-cyan-500 text-black border-cyan-300'; iconSymbol = '💧'; }
  else if (category === 'Village' || category === 'Lodge') { badgeColor = 'bg-emerald-600 text-white border-emerald-300'; iconSymbol = '🏘️'; }
  else if (category === 'Start') { badgeColor = 'bg-emerald-500 text-white border-white'; iconSymbol = '🟢'; }
  else if (category === 'Summit') { badgeColor = 'bg-rose-500 text-white border-amber-300'; iconSymbol = '🏔️'; }

  const html = `
    <div class="relative group cursor-pointer flex flex-col items-center">
      <div class="w-8 h-8 rounded-full ${badgeColor} border-2 shadow-2xl flex items-center justify-center font-bold text-xs transform transition-transform hover:scale-125">
        ${iconSymbol}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'offline-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

/**
 * High-visibility trekker position beacon with animated radar pulse
 */
function createCurrentTrekkerIcon() {
  const html = `
    <div class="relative flex items-center justify-center">
      <div class="absolute -inset-2.5 rounded-full bg-amber-400/30 animate-ping"></div>
      <div class="w-7 h-7 rounded-full bg-amber-400 border-2 border-white shadow-2xl flex items-center justify-center text-black font-black text-xs ring-4 ring-amber-400/40">
        🧭
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'trekker-position-beacon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function OfflineRouteMap({
  routeCoordinates,
  landmarks = [],
  trailName,
}: OfflineRouteMapProps) {
  const { isAlpineGlare } = useAlpineGlare();

  // Location scrubber state: waypoint index along trail polyline
  const [waypointIndex, setWaypointIndex] = useState<number>(0);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Bounds safety
  const totalWaypoints = routeCoordinates?.length || 0;
  const safeIndex = totalWaypoints > 0 ? Math.min(Math.max(0, waypointIndex), totalWaypoints - 1) : 0;

  const currentCoord: [number, number] = useMemo(() => {
    if (totalWaypoints > 0 && routeCoordinates[safeIndex]) {
      return [routeCoordinates[safeIndex][0], routeCoordinates[safeIndex][1]];
    }
    return [27.9881, 86.925]; // Default Khumbu
  }, [routeCoordinates, safeIndex, totalWaypoints]);

  const currentAltitude = useMemo(() => {
    if (totalWaypoints > 0 && routeCoordinates[safeIndex]) {
      return routeCoordinates[safeIndex][2] ?? 3500;
    }
    return 3500;
  }, [routeCoordinates, safeIndex, totalWaypoints]);

  // Compute Next Lodge Telemetry & Tobler Hiking Time
  const nextLodgeData: NextLodgeResult = useMemo(() => {
    return findNextLodgeOrCheckpoint(
      currentCoord,
      routeCoordinates,
      landmarks,
      currentAltitude
    );
  }, [currentCoord, routeCoordinates, landmarks, currentAltitude]);

  const polylineCoords = useMemo(() => {
    return (routeCoordinates || []).map((pt) => [pt[0], pt[1]] as [number, number]);
  }, [routeCoordinates]);

  const startCoord = polylineCoords[0];
  const endCoord = polylineCoords[polylineCoords.length - 1];

  // Geolocation tracking
  const handleGpsLocate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('GPS not supported on device');
      return;
    }
    setGpsError(null);
    setIsGpsActive(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsActive(false);
        const trekkerLat = pos.coords.latitude;
        const trekkerLng = pos.coords.longitude;

        // Snap to nearest route waypoint index
        let closestIdx = 0;
        let minD = Infinity;
        for (let i = 0; i < totalWaypoints; i++) {
          const pt = routeCoordinates[i];
          const d = haversineDistanceKm(trekkerLat, trekkerLng, pt[0], pt[1]);
          if (d < minD) {
            minD = d;
            closestIdx = i;
          }
        }
        setWaypointIndex(closestIdx);
      },
      (err) => {
        setIsGpsActive(false);
        setGpsError('GPS fix unavailable: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const progressPercent = totalWaypoints > 1
    ? Math.round((safeIndex / (totalWaypoints - 1)) * 100)
    : 0;

  return (
    <div
      data-slot="base"
      className="relative w-full rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950 flex flex-col"
    >
      {/* ──────── MAP CANVAS CONTAINER ──────── */}
      <div className="relative w-full h-[360px] sm:h-[420px]">
        <MapContainer
          center={currentCoord}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full z-10 !bg-transparent"
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={18}
            minZoom={6}
          />

          <MapBoundsController
            coordinates={routeCoordinates}
            focusCoord={currentCoord}
          />

          {polylineCoords.length > 0 && (
            <>
              {/* Background shadow glow */}
              <Polyline
                positions={polylineCoords}
                pathOptions={{
                  color: '#000000',
                  weight: 8,
                  opacity: 0.6,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Primary trail GPS line */}
              <Polyline
                positions={polylineCoords}
                pathOptions={{
                  color: isAlpineGlare ? '#FFFF00' : '#B68D40',
                  weight: isAlpineGlare ? 6 : 4.5,
                  opacity: 1,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </>
          )}

          {/* Start Landmark */}
          {startCoord && (
            <Marker position={startCoord} icon={createOfflineIcon('Start', 'Trailhead')}>
              <Popup className="dark-leaflet-popup">
                <div className="p-1 text-slate-900">
                  <p className="font-bold text-xs">🟢 Trailhead / Start</p>
                  <p className="text-[11px] text-slate-600">{trailName}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* End / Apex Landmark */}
          {endCoord && endCoord !== startCoord && (
            <Marker position={endCoord} icon={createOfflineIcon('Summit', 'Apex Destination')}>
              <Popup className="dark-leaflet-popup">
                <div className="p-1 text-slate-900">
                  <p className="font-bold text-xs">🏔️ Apex / Destination</p>
                  <p className="text-[11px] text-slate-600">{trailName}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Waypoint Landmarks */}
          {(landmarks || []).map((lm) => (
            <Marker
              key={lm.id}
              position={[lm.coordinates.lat, lm.coordinates.lng]}
              icon={createOfflineIcon(lm.category, lm.name)}
            >
              <Popup className="dark-leaflet-popup">
                <div className="p-1 text-slate-900 max-w-[200px]">
                  <p className="font-bold text-xs">{lm.name}</p>
                  <p className="text-[11px] text-slate-700">
                    {lm.category} • {lm.elevation}m
                  </p>
                  {lm.description && (
                    <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                      {lm.description}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Current Scrubber / Trekker Beacon Marker */}
          {totalWaypoints > 0 && (
            <Marker position={currentCoord} icon={createCurrentTrekkerIcon()}>
              <Popup className="dark-leaflet-popup">
                <div className="p-1 text-slate-900">
                  <p className="font-bold text-xs">🧭 Current Position</p>
                  <p className="text-[11px] text-slate-700 font-mono">
                    Alt: {Math.round(currentAltitude)}m • Waypoint {safeIndex + 1}/{totalWaypoints}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Floating Top Controls Overlay */}
        <div className="absolute top-3 left-3 z-[400] pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-[#B68D40]/40 text-white flex items-center gap-2 shadow-xl">
            <Compass className="w-3.5 h-3.5 text-[#B68D40]" />
            <span className="text-[11px] font-bold text-[#E2C085]">
              Offline Vector GPS Canvas
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
              Live Topo
            </span>
          </div>
        </div>

        <div className="absolute top-3 right-3 z-[400] pointer-events-auto">
          <AlpineGlareToggle variant="map-floating" />
        </div>
      </div>

      {/* ──────── TACTICAL HIGH-CONTRAST "DISTANCE TO NEXT LODGE" HUD STRIP ──────── */}
      <div
        data-slot="footer"
        className={`p-4 border-t transition-colors ${
          isAlpineGlare
            ? 'bg-black text-[#FFFF00] border-[#FFFF00]'
            : 'bg-slate-900/95 text-slate-100 border-slate-800'
        }`}
      >
        {/* Main HUD Banner Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <div>
              <p className={`text-xs sm:text-sm font-black tracking-wide ${isAlpineGlare ? 'text-[#FFFF00]' : 'text-white'}`}>
                {nextLodgeData.formattedHud}
              </p>
              <p className="text-[11px] text-slate-400">
                Pacing based on Tobler&apos;s Hiking Function (3.0 km/h baseline with vertical ascent penalty)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGpsLocate}
            disabled={isGpsActive}
            data-slot="trigger"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border ${
              isAlpineGlare
                ? 'bg-[#FFFF00] text-black border-[#FFFF00]'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <Locate className={`w-3.5 h-3.5 ${isGpsActive ? 'animate-spin' : ''}`} />
            <span>{isGpsActive ? 'Locating...' : 'GPS My Location'}</span>
          </button>
        </div>

        {/* Interactive Location Scrubber Control */}
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400">
              Scrub Trail Progress: <strong className={isAlpineGlare ? 'text-[#FFFF00]' : 'text-[#E2C085]'}>{progressPercent}%</strong>
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Waypoint {safeIndex + 1} of {totalWaypoints} • {Math.round(currentAltitude)}m Alt
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setWaypointIndex((prev) => Math.max(0, prev - 1))}
              disabled={safeIndex <= 0}
              aria-label="Previous waypoint"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="0"
              max={Math.max(0, totalWaypoints - 1)}
              value={safeIndex}
              onChange={(e) => setWaypointIndex(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#B68D40]"
              aria-label="Route polyline progress scrubber"
            />

            <button
              type="button"
              onClick={() => setWaypointIndex((prev) => Math.min(totalWaypoints - 1, prev + 1))}
              disabled={safeIndex >= totalWaypoints - 1}
              aria-label="Next waypoint"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {gpsError && (
            <p className="text-[10px] text-rose-400 italic">{gpsError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
