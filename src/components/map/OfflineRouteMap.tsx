'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Landmark } from '@/types';
import { Mountain, Compass } from 'lucide-react';

interface OfflineRouteMapProps {
  routeCoordinates: [number, number, number?][];
  landmarks: Landmark[];
  trailName: string;
}

function MapBoundsController({ coordinates }: { coordinates: [number, number, number?][] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const latLngs = coordinates.map((pt) => [pt[0], pt[1]] as [number, number]);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [coordinates, map]);

  return null;
}

function createOfflineIcon(category: string, label: string) {
  let badgeColor = 'bg-[#B68D40] text-black border-[#E2C085]';
  let iconSymbol = '📍';
  if (category === 'Base Camp') { badgeColor = 'bg-red-600 text-white border-red-400'; iconSymbol = '⛺'; }
  else if (category === 'High Pass') { badgeColor = 'bg-amber-500 text-black border-amber-300'; iconSymbol = '🚩'; }
  else if (category === 'Monastery') { badgeColor = 'bg-purple-600 text-white border-purple-400'; iconSymbol = '🛕'; }
  else if (category === 'Sacred Lake') { badgeColor = 'bg-cyan-500 text-black border-cyan-300'; iconSymbol = '💧'; }
  else if (category === 'Village') { badgeColor = 'bg-emerald-600 text-white border-emerald-300'; iconSymbol = '🏘️'; }
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

export default function OfflineRouteMap({
  routeCoordinates,
  landmarks,
  trailName,
}: OfflineRouteMapProps) {
  const center: [number, number] = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      return [routeCoordinates[0][0], routeCoordinates[0][1]];
    }
    return [27.9881, 86.925]; // Default Khumbu
  }, [routeCoordinates]);

  const polylineCoords = useMemo(() => {
    return (routeCoordinates || []).map((pt) => [pt[0], pt[1]] as [number, number]);
  }, [routeCoordinates]);

  const startCoord = polylineCoords[0];
  const endCoord = polylineCoords[polylineCoords.length - 1];

  return (
    <div
      data-slot="base"
      className="relative w-full h-[380px] sm:h-[460px] rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:24px_24px]"
    >
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full z-10 !bg-transparent"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={18}
          minZoom={6}
        />

        <MapBoundsController coordinates={routeCoordinates} />

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
                color: '#B68D40',
                weight: 4.5,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: undefined,
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

        {/* Landmark Markers */}
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
      </MapContainer>

      {/* Floating Offline Map Overlay Watermark */}
      <div className="absolute top-3 left-3 z-[400] pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-[#B68D40]/40 text-white flex items-center gap-2 shadow-xl">
          <Compass className="w-3.5 h-3.5 text-[#B68D40]" />
          <span className="text-[11px] font-bold text-[#E2C085]">
            Offline Vector GPS Canvas
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
            Cached
          </span>
        </div>
      </div>
    </div>
  );
}
