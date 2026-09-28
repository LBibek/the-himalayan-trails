'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Info, Sparkles, Move, Trash2, Edit3, MapPin, Route, Plus } from 'lucide-react';
import { ActivityType, PlannerWaypoint, ACTIVITY_CONFIG } from '@/types/planner';
import { Landmark } from '@/types';

// Create custom leaflet marker icon for Planner Waypoints with Glassmorphic Badges
function createPlannerMarkerIcon(activityType: ActivityType, dayNumber: number, isSelected: boolean, isHovered: boolean) {
  const config = ACTIVITY_CONFIG[activityType] || ACTIVITY_CONFIG.trekking;

  const isActiveState = isSelected || isHovered;

  const html = `
    <div class="relative group cursor-pointer flex flex-col items-center transition-all transform ${isActiveState ? 'scale-125 z-50' : 'hover:scale-110'}">
      <div class="relative w-10 h-10 rounded-full ${config.badgeBg} text-white border-2 ${config.borderColor} shadow-2xl flex items-center justify-center font-extrabold text-sm backdrop-blur-md ${isActiveState ? 'ring-4 ring-amber-400/80 shadow-amber-500/50' : ''}">
        <span class="text-sm">${config.iconSymbol}</span>
        <span class="absolute -top-2.5 -right-2 bg-black/90 text-amber-400 border border-[#B68D40] text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold shadow-lg">
          D${dayNumber}
        </span>
      </div>
      <div class="w-2 h-2 rounded-full bg-amber-400 -mt-1 border border-black shadow-md"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-planner-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 36],
    popupAnchor: [0, -36],
  });
}

// Create custom leaflet marker icon for Regional Landmarks
function createLandmarkMarkerIcon(category: string) {
  let badgeColor = 'bg-[#B68D40] text-black border-amber-300 ring-2 ring-[#B68D40]/50';
  let iconSymbol = '📍';
  if (category === 'Base Camp') { badgeColor = 'bg-rose-600 text-white border-rose-300 ring-2 ring-rose-500/50'; iconSymbol = '⛺'; }
  if (category === 'High Pass') { badgeColor = 'bg-amber-500 text-black border-amber-200 ring-2 ring-amber-400/50'; iconSymbol = '🚩'; }
  if (category === 'Monastery') { badgeColor = 'bg-purple-600 text-white border-purple-300 ring-2 ring-purple-500/50'; iconSymbol = '🛕'; }
  if (category === 'Sacred Lake') { badgeColor = 'bg-cyan-500 text-black border-cyan-200 ring-2 ring-cyan-400/50'; iconSymbol = '🏔️'; }
  if (category === 'Summit') { badgeColor = 'bg-yellow-400 text-black border-yellow-200 ring-2 ring-yellow-400/50'; iconSymbol = '🏔️'; }
  if (category === 'Village' || category === 'Lodge') { badgeColor = 'bg-emerald-600 text-white border-emerald-200 ring-2 ring-emerald-500/50'; iconSymbol = '🏡'; }

  const html = `
    <div class="relative group cursor-pointer flex flex-col items-center transition-all transform hover:scale-125 z-40">
      <div class="w-8 h-8 rounded-full ${badgeColor} border shadow-xl flex items-center justify-center font-bold text-xs">
        ${iconSymbol}
      </div>
      <div class="w-1.5 h-1.5 rounded-full bg-white -mt-0.5 border border-black shadow"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-landmark-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    popupAnchor: [0, -28],
  });
}

// Map Click Listener to add waypoint on map click
function MapClickListener({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Programmatic Map Fly-To controller
function MapFlyController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.0 });
  }, [center, map]);
  return null;
}

// Auto-fit bounds for waypoints and loaded expedition GPX track
function MapBoundsFitter({
  waypoints,
  expeditionPolyline,
}: {
  waypoints: PlannerWaypoint[];
  expeditionPolyline?: [number, number][];
}) {
  const map = useMap();
  useEffect(() => {
    const allCoords: [number, number][] = [];
    if (expeditionPolyline && expeditionPolyline.length > 0) {
      allCoords.push(...expeditionPolyline);
    } else if (waypoints.length > 0) {
      waypoints.forEach((w) => allCoords.push([w.coordinates.lat, w.coordinates.lng]));
    }
    if (allCoords.length > 1) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [expeditionPolyline, map]);
  return null;
}

export interface ItineraryPlannerMapProps {
  waypoints: PlannerWaypoint[];
  activeDayIndex: number | null;
  hoveredDayIndex: number | null;
  onSelectDayIndex: (index: number) => void;
  onHoverDayIndex: (index: number | null) => void;
  onAddWaypointOnMapClick: (lat: number, lng: number, activity: ActivityType) => void;
  onUpdateWaypointCoords: (index: number, lat: number, lng: number) => void;
  onDeleteWaypoint: (index: number) => void;
  selectedActivity: ActivityType;
  onSelectActivity: (activity: ActivityType) => void;
  height?: string;
  // Connected Expedition & Regional Landmarks
  landmarks?: Landmark[];
  expeditionPolyline?: [number, number][];
  onAddLandmarkToItinerary?: (landmark: Landmark) => void;
  expeditionName?: string;
  focusedCoords?: [number, number] | null;
}

export default function ItineraryPlannerMap({
  waypoints,
  activeDayIndex,
  hoveredDayIndex,
  onSelectDayIndex,
  onHoverDayIndex,
  onAddWaypointOnMapClick,
  onUpdateWaypointCoords,
  onDeleteWaypoint,
  selectedActivity,
  onSelectActivity,
  height = 'h-[520px]',
  landmarks = [],
  expeditionPolyline = [],
  onAddLandmarkToItinerary,
  expeditionName,
  focusedCoords
}: ItineraryPlannerMapProps) {
  const [mounted, setMounted] = useState(false);
  const [tileType, setTileType] = useState<'topo' | 'satellite' | 'street'>('topo');
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showGpxTrack, setShowGpxTrack] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-full ${height} bg-black/60 backdrop-blur-xl animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-2xl border border-white/10 shadow-2xl`}>
        Initializing Glassmorphic Leaflet Map Engine & Synced Markers...
      </div>
    );
  }

  // Calculate Polyline route coordinates
  const polylineCoords: [number, number][] = waypoints.map(w => [w.coordinates.lat, w.coordinates.lng]);

  // Center map on focusedCoords, active day or default to Khumbu / Everest region
  const activeWp = activeDayIndex !== null ? waypoints[activeDayIndex] : (hoveredDayIndex !== null ? waypoints[hoveredDayIndex] : waypoints[0]);
  const mapCenter: [number, number] = focusedCoords
    ? focusedCoords
    : activeWp?.coordinates
    ? [activeWp.coordinates.lat, activeWp.coordinates.lng]
    : [27.8500, 86.7500];

  const tileUrls = {
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'OpenTopoMap'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri World Imagery'
    },
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: 'OpenStreetMap'
    }
  };

  const totalDist = waypoints.reduce((acc, cur) => acc + cur.distanceKm, 0);
  const maxAlt = waypoints.length ? Math.max(...waypoints.map(w => w.sleepingAltitude)) : 0;

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl flex flex-col group`}>
      
      {/* 1. GLASSMORPHIC TOP HUD TOOLBAR */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        
        {/* Left Route Stats Badge */}
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-xl bg-black/75 border border-white/15 backdrop-blur-xl shadow-2xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#B68D40] to-amber-600 text-black font-extrabold flex items-center justify-center shadow-lg">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>AllTrails Route Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                {waypoints.length} Synced Waypoints
              </span>
            </div>
            <div className="text-[11px] text-gray-300 font-mono flex items-center gap-3">
              <span>Dist: <strong className="text-white">{totalDist} km</strong></span>
              <span>•</span>
              <span>Max Elev: <strong className="text-[#B68D40]">{maxAlt}m</strong></span>
            </div>
          </div>
        </div>

        {/* Center Activity Selector Bar */}
        <div className="pointer-events-auto hidden md:flex items-center gap-1 p-1 rounded-xl bg-black/75 border border-white/15 backdrop-blur-xl shadow-2xl">
          {(Object.keys(ACTIVITY_CONFIG) as ActivityType[]).map((actKey) => {
            const cfg = ACTIVITY_CONFIG[actKey];
            const isSelected = selectedActivity === actKey;
            return (
              <button
                key={actKey}
                onClick={() => onSelectActivity(actKey)}
                title={cfg.description}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? `${cfg.badgeBg} text-white shadow-lg font-bold ring-1 ${cfg.borderColor} scale-105`
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{cfg.iconSymbol}</span>
                <span className="hidden xl:inline">{cfg.label.split('/')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Right Map Tile Layer & Layer Toggles */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-xl bg-black/75 border border-white/15 backdrop-blur-xl shadow-2xl text-xs">
          {/* Landmarks Toggle */}
          {landmarks && landmarks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLandmarks(!showLandmarks)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showLandmarks
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Toggle regional landmarks in this area"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span>POIs ({landmarks.length})</span>
            </button>
          )}

          {/* GPX Track Toggle */}
          {expeditionPolyline && expeditionPolyline.length > 0 && (
            <button
              type="button"
              onClick={() => setShowGpxTrack(!showGpxTrack)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showGpxTrack
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Toggle official expedition GPX track"
            >
              <Route className="h-3.5 w-3.5 text-emerald-400" />
              <span>GPX Route</span>
            </button>
          )}

          <div className="h-4 w-px bg-white/20 mx-0.5" />

          <button
            onClick={() => setTileType('topo')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              tileType === 'topo' ? 'bg-[#B68D40] text-black font-bold' : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            Topo
          </button>
          <button
            onClick={() => setTileType('satellite')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              tileType === 'satellite' ? 'bg-[#B68D40] text-black font-bold' : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            Satellite
          </button>
        </div>

      </div>

      {/* 2. LEAFLET MAP CANVAS */}
      <MapContainer
        center={mapCenter}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full z-0 cursor-crosshair"
        zoomControl={false}
      >
        <MapFlyController center={mapCenter} />
        <MapBoundsFitter waypoints={waypoints} expeditionPolyline={expeditionPolyline} />
        
        <MapClickListener onMapClick={(lat, lng) => onAddWaypointOnMapClick(lat, lng, selectedActivity)} />

        <TileLayer
          url={tileUrls[tileType].url}
          attribution={tileUrls[tileType].attribution}
          maxZoom={18}
        />

        {/* Expedition Official GPX Route Track */}
        {showGpxTrack && expeditionPolyline && expeditionPolyline.length > 1 && (
          <>
            <Polyline
              positions={expeditionPolyline}
              pathOptions={{
                color: '#000000',
                weight: 7,
                opacity: 0.6,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            <Polyline
              positions={expeditionPolyline}
              pathOptions={{
                color: '#10b981',
                weight: 4,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Regional Landmarks in this area */}
        {showLandmarks && landmarks && landmarks.map((lm) => (
          <Marker
            key={lm.id}
            position={[lm.coordinates.lat, lm.coordinates.lng]}
            icon={createLandmarkMarkerIcon(lm.category)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-2 space-y-2 max-w-xs text-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-[#B68D40] uppercase">
                    {lm.category}
                  </span>
                  <span className="text-xs font-extrabold text-amber-600">{lm.elevation}m</span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-neutral-900 leading-snug">{lm.name}</h4>
                  {lm.nativeName && (
                    <div className="text-[11px] text-gray-500 font-serif">{lm.nativeName}</div>
                  )}
                </div>

                {lm.image && (
                  <img
                    src={lm.image}
                    alt={lm.name}
                    className="w-full h-24 object-cover rounded-lg border border-neutral-200 shadow-sm"
                  />
                )}

                <p className="text-xs text-neutral-600 line-clamp-2">{lm.description}</p>

                {lm.permitRequired && (
                  <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                    <strong>Permit:</strong> {lm.permitRequired}
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => onAddLandmarkToItinerary?.(lm)}
                    className="w-full py-1.5 px-3 rounded-lg bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Itinerary Day</span>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Polyline Track Connecting Itinerary Days */}
        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: '#B68D40',
              weight: 5,
              opacity: 0.9,
              dashArray: '10, 10'
            }}
          />
        )}

        {/* Day Waypoint Markers with Drag & Mouse Event Sync */}
        {waypoints.map((wp, idx) => {
          const isSelected = activeDayIndex === idx;
          const isHovered = hoveredDayIndex === idx;
          const cfg = ACTIVITY_CONFIG[wp.activityType] || ACTIVITY_CONFIG.trekking;

          return (
            <Marker
              key={wp.day}
              position={[wp.coordinates.lat, wp.coordinates.lng]}
              draggable={true}
              icon={createPlannerMarkerIcon(wp.activityType, wp.day, isSelected, isHovered)}
              eventHandlers={{
                click: () => onSelectDayIndex(idx),
                mouseover: () => onHoverDayIndex(idx),
                mouseout: () => onHoverDayIndex(null),
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  onUpdateWaypointCoords(idx, pos.lat, pos.lng);
                }
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-2 space-y-2 max-w-xs text-neutral-900">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-[#B68D40] uppercase">
                      Day {wp.day} • {cfg.label}
                    </span>
                    <span className="text-xs font-extrabold text-amber-600">{wp.sleepingAltitude}m</span>
                  </div>

                  <h4 className="font-extrabold text-sm text-neutral-900 leading-snug">{wp.title}</h4>

                  <div className="text-xs text-neutral-600 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Day Distance:</span>
                      <strong className="text-neutral-900">{wp.distanceKm} km</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Altitude Change:</span>
                      <strong className={wp.altitudeGain >= 0 ? 'text-green-600' : 'text-blue-600'}>
                        {wp.altitudeGain >= 0 ? `+${wp.altitudeGain}m` : `${wp.altitudeGain}m`}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-100">
                      <span>Coordinates:</span>
                      <span>{wp.coordinates.lat.toFixed(4)}°, {wp.coordinates.lng.toFixed(4)}°</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                      <Move className="h-3 w-3" />
                      <span>Drag to reposition</span>
                    </span>
                    <button
                      onClick={() => onDeleteWaypoint(idx)}
                      className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 3. GLASSMORPHIC BOTTOM HELPER INFOBAR */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto px-3.5 py-2 rounded-xl bg-black/75 border border-white/15 text-[11px] text-gray-200 backdrop-blur-xl shadow-2xl flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#B68D40]" />
          <span>Interactive Map: <strong>Click map</strong> to drop waypoints, or <strong>drag markers</strong> to update trail track live!</span>
        </div>
      </div>

    </div>
  );
}
