'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, ExternalLink, Layers, SlidersHorizontal, Mountain, MapPin, Eye, Calendar } from 'lucide-react';
import { Landmark, Trail, HimalayanRange, ItineraryDay } from '@/types';
import { ROUTE_TRACKS } from '@/data/routeTracks';
import { HIMALAYAN_SUMMITS, ApexSummit } from '@/data/summitTours';
import FloatingMapPanel from '@/components/ui/FloatingMapPanel';
import Link from 'next/link';

// Custom Map Controller to programmatically fly to location
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Create custom divIcon for Leaflet markers
function createCustomIcon(category: string, isSelected: boolean) {
  let badgeColor = 'bg-[#B68D40] text-black border-[#E2C085]';
  let iconSymbol = '📍';
  if (category === 'Base Camp') { badgeColor = 'bg-red-600 text-white border-red-400'; iconSymbol = '⛺'; }
  if (category === 'High Pass') { badgeColor = 'bg-amber-500 text-black border-amber-300'; iconSymbol = '🚩'; }
  if (category === 'Monastery') { badgeColor = 'bg-purple-600 text-white border-purple-400'; iconSymbol = '🛕'; }
  if (category === 'Sacred Lake') { badgeColor = 'bg-cyan-500 text-black border-cyan-300'; iconSymbol = '💧'; }
  if (category === 'Village') { badgeColor = 'bg-emerald-600 text-white border-emerald-300'; iconSymbol = '🏘️'; }
  if (category === 'Hotel') { badgeColor = 'bg-indigo-600 text-white border-indigo-300'; iconSymbol = '🏨'; }
  if (category === 'Community Homestay') { badgeColor = 'bg-emerald-600 text-white border-emerald-300'; iconSymbol = '🏡'; }
  if (category === 'Airport') { badgeColor = 'bg-sky-500 text-black border-sky-300'; iconSymbol = '🛫'; }
  if (category === 'Hot Spring') { badgeColor = 'bg-amber-600 text-white border-amber-300'; iconSymbol = '♨️'; }

  const html = `
    <div class="relative group cursor-pointer flex flex-col items-center">
      <div class="w-8 h-8 rounded-full ${badgeColor} border-2 shadow-xl flex items-center justify-center font-bold text-xs transform transition-transform ${isSelected ? 'scale-125 ring-4 ring-amber-400/50' : 'hover:scale-110'}">
        ${iconSymbol}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// Create custom divIcon for Itinerary Day milestone markers
function createItineraryDayIcon(day: number, isSelected: boolean) {
  const html = `
    <div class="relative group cursor-pointer flex flex-col items-center">
      <div class="px-2 py-0.5 rounded-lg bg-[#B68D40] text-black border-2 border-white shadow-2xl flex items-center justify-center font-black text-xs transform transition-all ${
        isSelected ? 'scale-125 ring-4 ring-amber-400 bg-amber-400 font-extrabold' : 'hover:scale-110'
      }">
        <span>D${day}</span>
      </div>
      <div class="w-1.5 h-1.5 bg-[#B68D40] rounded-full mt-0.5 shadow"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-itinerary-day-marker',
    iconSize: [36, 28],
    iconAnchor: [18, 28],
    popupAnchor: [0, -28],
  });
}

// Create custom divIcon for Apex Summit pins
function createSummitIcon(isSelected: boolean) {
  const html = `
    <div class="relative group cursor-pointer flex flex-col items-center">
      <div class="w-9 h-9 rounded-2xl bg-amber-500 text-black border-2 border-white shadow-2xl flex items-center justify-center font-black text-sm transform transition-all ${isSelected ? 'scale-125 ring-4 ring-[#B68D40]' : 'hover:scale-115'}">
        ⛰️
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-summit-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

export interface LeafletMapProps {
  selectedRegion?: string;
  focusedCoords?: [number, number];
  activeTrailId?: string;
  itineraryDays?: ItineraryDay[];
  activeItineraryDay?: number | null;
  onSelectItineraryDay?: (day: ItineraryDay, coords: [number, number]) => void;
  landmarks?: Landmark[];
  onSelectLandmark?: (landmark: Landmark) => void;
  onSelectTrail?: (trailId: string) => void;
  onSelectRegion?: (region: string) => void;
  height?: string;
  hideHeaderControls?: boolean;
}

export default function LeafletMap({
  selectedRegion = 'All',
  focusedCoords,
  activeTrailId,
  itineraryDays,
  activeItineraryDay,
  onSelectItineraryDay,
  landmarks: propLandmarks,
  onSelectLandmark,
  onSelectTrail,
  onSelectRegion,
  height = 'h-[75vh]',
  hideHeaderControls = false
}: LeafletMapProps) {
  const [tileLayerType, setTileLayerType] = useState<'topo' | 'satellite' | 'street'>('topo');
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.1500, 85.5000]);
  const [mapZoom, setMapZoom] = useState<number>(8);
  const [fetchedLandmarks, setFetchedLandmarks] = useState<Landmark[]>([]);
  const [ranges, setRanges] = useState<HimalayanRange[]>([]);
  const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
  const [activeSummit, setActiveSummit] = useState<string | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showRanges, setShowRanges] = useState(true);
  const [showSummits, setShowSummits] = useState(true);
  const [showItinerary, setShowItinerary] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Compute waypoint coordinates along active trail for each itinerary day
  const mappedItineraryWaypoints = useMemo(() => {
    if (!itineraryDays || itineraryDays.length === 0 || !activeTrailId) return [];
    const track = ROUTE_TRACKS[activeTrailId];
    if (!track || !track.coords || track.coords.length < 2) return [];

    const totalDays = itineraryDays.length;
    let runningKm = 0;
    const totalDayKm = itineraryDays.reduce((acc, d) => acc + (d.distanceKm || 0), 0);

    return itineraryDays.map((day, idx) => {
      if (idx === 0) {
        runningKm = day.distanceKm > 0 ? day.distanceKm : 10;
      } else {
        runningKm += day.distanceKm > 0 ? day.distanceKm : (totalDayKm ? totalDayKm / totalDays : 12);
      }
      const ratio = totalDayKm > 0 ? Math.min(1, runningKm / totalDayKm) : Math.min(1, (idx + 1) / totalDays);
      const targetIdx = Math.min(track.coords.length - 1, Math.floor(ratio * (track.coords.length - 1)));
      const coord = track.coords[targetIdx];

      return {
        ...day,
        coords: coord as [number, number],
      };
    });
  }, [itineraryDays, activeTrailId]);

  // Fetch official ranges & landmarks from persistent DB APIs
  useEffect(() => {
    fetch('/api/ranges')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: HimalayanRange[]) => {
        if (Array.isArray(data)) setRanges(data);
      })
      .catch((err) => console.warn('Failed to load ranges in 2D:', err));

    if (!propLandmarks) {
      fetch('/api/landmarks')
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Landmark[]) => {
          setFetchedLandmarks(data);
          if (data.length > 0 && !activeLandmark) {
            setActiveLandmark(data[0]);
          }
        })
        .catch(console.error);
    }
  }, [propLandmarks]);

  const allLandmarks = propLandmarks || fetchedLandmarks;

  // Sync focused coordinates if passed
  useEffect(() => {
    if (focusedCoords) {
      setMapCenter(focusedCoords);
      setMapZoom(11);
    }
  }, [focusedCoords]);

  // Filter landmarks by region if selected
  const filteredLandmarks = selectedRegion === 'All' 
    ? allLandmarks 
    : allLandmarks.filter(l => l.region.toLowerCase().includes(selectedRegion.toLowerCase()));

  const regionFocusCoords: Record<string, { center: [number, number]; zoom: number }> = {
    'All': { center: [28.2500, 85.4000], zoom: 7.5 },
    'Everest': { center: [27.9881, 86.9250], zoom: 10.5 },
    'Annapurna': { center: [28.6000, 83.9500], zoom: 10 },
    'Langtang': { center: [28.2000, 85.4500], zoom: 11 },
    'Manaslu': { center: [28.4500, 84.6500], zoom: 10.5 },
    'Mustang': { center: [29.0000, 83.8500], zoom: 10 },
    'Rolwaling': { center: [27.8800, 86.4200], zoom: 10.5 },
    'Kanchenjunga': { center: [27.7025, 88.1475], zoom: 10.5 },
  };

  const handleRegionClick = (regionKey: string) => {
    const target = regionFocusCoords[regionKey] || regionFocusCoords['All'];
    setMapCenter(target.center);
    setMapZoom(target.zoom);
    if (onSelectRegion) onSelectRegion(regionKey);
  };

  const handleSummitClick = (summit: ApexSummit) => {
    setActiveSummit(summit.name);
    setMapCenter([summit.coords.lat, summit.coords.lng]);
    setMapZoom(12);
  };

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

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col`}>
      
      {/* MAP CONTROLS FLOATING PANEL (DRAG, MINIMIZE, MAXIMIZE, CLOSE) */}
      {!hideHeaderControls && showControls && (
        <div className="absolute top-4 left-4 z-[1000]">
          <FloatingMapPanel
            id="2d-leaflet-hud"
            title="2D Geospatial Navigator"
            icon={<Compass className="h-4 w-4 text-[#B68D40]" />}
            badge={
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                {mapCenter[0].toFixed(2)}°N, {mapCenter[1].toFixed(2)}°E
              </span>
            }
            allowDrag={true}
            allowResize={true}
            allowMinimize={true}
            allowMaximize={true}
            allowClose={true}
            onClose={() => setShowControls(false)}
            defaultWidth="max-w-2xl w-full"
          >
            <div className="space-y-3">
              {/* 1. Himalayan Ranges Navigator */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                  Select Himalayan Region / Range:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.keys(regionFocusCoords).map((reg) => {
                    const isSelected = selectedRegion.toLowerCase() === reg.toLowerCase() || (selectedRegion === 'All' && reg === 'All');
                    return (
                      <button
                        key={reg}
                        onClick={() => handleRegionClick(reg)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#B68D40] text-black border-[#B68D40] font-bold shadow'
                            : 'bg-neutral-900/80 hover:bg-neutral-800 text-gray-300 border-border/40 hover:border-[#B68D40]/40'
                        }`}
                      >
                        <Layers className="w-3 h-3 text-[#B68D40]" />
                        <span>{reg}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Apex Summits Quick Fly-To */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                  Apex Summits (8,000m+ Giants):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {HIMALAYAN_SUMMITS.map((summit) => {
                    const isActive = activeSummit === summit.name;
                    return (
                      <button
                        key={summit.name}
                        onClick={() => handleSummitClick(summit)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 border ${
                          isActive
                            ? 'bg-[#B68D40] text-black border-[#B68D40] font-bold shadow scale-105'
                            : 'bg-neutral-900/80 hover:bg-neutral-800 text-gray-300 border-border/40 hover:border-[#B68D40]/40'
                        }`}
                      >
                        <span>⛰️ {summit.name}</span>
                        <span className="text-[10px] font-mono opacity-80">{summit.elevation}m</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Layer Types & Feature Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Layer:</span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-900/90 border border-neutral-800">
                    {(['topo', 'satellite', 'street'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTileLayerType(mode)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase transition-all ${
                          tileLayerType === mode
                            ? 'bg-[#B68D40] text-black font-bold shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white text-[11px]">
                    <input
                      type="checkbox"
                      checked={showRoutes}
                      onChange={(e) => setShowRoutes(e.target.checked)}
                      className="accent-[#B68D40] rounded"
                    />
                    <span>Route Tracks</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white text-[11px]">
                    <input
                      type="checkbox"
                      checked={showRanges}
                      onChange={(e) => setShowRanges(e.target.checked)}
                      className="accent-[#B68D40] rounded"
                    />
                    <span>Massif Bounds</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white text-[11px]">
                    <input
                      type="checkbox"
                      checked={showSummits}
                      onChange={(e) => setShowSummits(e.target.checked)}
                      className="accent-[#B68D40] rounded"
                    />
                    <span>Summits</span>
                  </label>
                </div>
              </div>
            </div>
          </FloatingMapPanel>
        </div>
      )}

      {/* RESTORE 2D CONTROLS BUTTON IF CLOSED */}
      {!hideHeaderControls && !showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute top-4 left-4 z-[1000] px-3.5 py-1.5 rounded-xl bg-black/90 border border-[#B68D40]/60 text-[#B68D40] hover:text-white hover:bg-neutral-900 font-bold text-xs flex items-center gap-2 shadow-2xl transition backdrop-blur-md"
        >
          <Compass className="h-4 w-4" />
          <span>Show 2D Map Controls</span>
        </button>
      )}

      {/* LEAFLET MAP CANVAS */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        <TileLayer
          url={tileUrls[tileLayerType].url}
          attribution={tileUrls[tileLayerType].attribution}
          maxZoom={18}
        />

        {/* Himalayan Range Massif Boundary Polygons */}
        {showRanges && ranges.map((range) => {
          const isSelected = selectedRegion.toLowerCase().includes(range.name.toLowerCase()) || range.name.toLowerCase().includes(selectedRegion.toLowerCase());
          const polygonPositions: [number, number][] = range.bounds.map((b) => [b[1], b[0]]);
          return (
            <Polygon
              key={range.id || range.name}
              positions={polygonPositions}
              pathOptions={{
                color: isSelected ? '#B68D40' : 'rgba(182, 141, 64, 0.6)',
                weight: isSelected ? 3 : 1.5,
                fillColor: '#B68D40',
                fillOpacity: isSelected ? 0.15 : 0.05,
                dashArray: isSelected ? undefined : '4, 4'
              }}
              eventHandlers={{
                click: () => {
                  handleRegionClick(range.name);
                }
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <h4 className="font-bold text-sm text-neutral-900">{range.name} Range</h4>
                  <p className="text-neutral-600 text-[11px]">{range.description}</p>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Route Polylines with Active Highlight */}
        {showRoutes && Object.entries(ROUTE_TRACKS).map(([key, route]) => {
          const isHighlighted = activeTrailId === key;
          return (
            <Polyline
              key={key}
              positions={route.coords}
              eventHandlers={{
                click: () => {
                  if (onSelectTrail) onSelectTrail(key);
                }
              }}
              pathOptions={{
                color: isHighlighted ? '#f59e0b' : route.color,
                weight: isHighlighted ? 7 : 4,
                opacity: isHighlighted ? 1.0 : 0.8,
                dashArray: isHighlighted ? undefined : '8, 8'
              }}
            />
          );
        })}

        {/* Apex Summit Markers */}
        {showSummits && HIMALAYAN_SUMMITS.map((summit) => {
          const isSelected = activeSummit === summit.name;
          return (
            <Marker
              key={summit.name}
              position={[summit.coords.lat, summit.coords.lng]}
              icon={createSummitIcon(isSelected)}
              eventHandlers={{
                click: () => handleSummitClick(summit)
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-sm text-neutral-900">{summit.name}</span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-black">
                      {summit.elevation}m
                    </span>
                  </div>
                  <p className="text-neutral-500 font-mono text-[10px]">
                    GPS: {summit.coords.lat.toFixed(4)}°N, {summit.coords.lng.toFixed(4)}°E
                  </p>
                  <p className="text-neutral-600 text-[11px]">{summit.region} Massif</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Scrubber Hover Pin Marker */}
        {focusedCoords && (
          <Marker
            position={focusedCoords}
            icon={L.divIcon({
              html: `
                <div class="relative flex items-center justify-center">
                  <div class="w-7 h-7 rounded-full bg-[#B68D40] border-2 border-white shadow-2xl flex items-center justify-center text-xs font-bold text-black animate-bounce">
                    📍
                  </div>
                  <div class="absolute -inset-1 rounded-full bg-[#B68D40]/60 animate-ping pointer-events-none"></div>
                </div>
              `,
              className: 'custom-scrubber-marker',
              iconSize: [28, 28],
              iconAnchor: [14, 28]
            })}
          />
        )}

        {/* Landmark Markers */}
        {filteredLandmarks.map((landmark) => {
          const isSelected = activeLandmark?.id === landmark.id;
          return (
            <Marker
              key={landmark.id}
              position={[landmark.coordinates.lat, landmark.coordinates.lng]}
              icon={createCustomIcon(landmark.category, isSelected)}
              eventHandlers={{
                click: () => {
                  setActiveLandmark(landmark);
                  if (onSelectLandmark) onSelectLandmark(landmark);
                }
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-2 max-w-xs">
                  <img
                    src={landmark.image}
                    alt={landmark.name}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-[#B68D40] border border-[#B68D40]/40 uppercase">
                      {landmark.category}
                    </span>
                    <span className="text-xs font-extrabold text-amber-500">{landmark.elevation}m</span>
                  </div>
                  <h4 className="font-bold text-sm text-neutral-900 leading-snug">{landmark.name}</h4>
                  <p className="text-xs text-neutral-600 line-clamp-2">{landmark.description}</p>
                  <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-semibold">{landmark.region} Region</span>
                    <Link
                      href="/itinerary/planner"
                      className="text-cyan-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Plan Trek</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Itinerary Day Waypoint Markers */}
        {showItinerary && mappedItineraryWaypoints.map((dayWp) => {
          const isSelected = activeItineraryDay === dayWp.day;
          return (
            <Marker
              key={`itin-marker-${dayWp.day}`}
              position={dayWp.coords}
              icon={createItineraryDayIcon(dayWp.day, isSelected)}
              eventHandlers={{
                click: () => {
                  onSelectItineraryDay?.(dayWp, dayWp.coords);
                }
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-2 max-w-xs text-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#B68D40] text-black">
                      Day {dayWp.day}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-600">
                      {dayWp.sleepingAltitude}m
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-neutral-900 leading-snug">{dayWp.title}</h4>
                  <p className="text-neutral-600 font-mono text-[11px]">{dayWp.route}</p>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                    <span>{dayWp.distanceKm} km</span>
                    <span>•</span>
                    <span>{dayWp.hours} hrs</span>
                    <span>•</span>
                    <span className={dayWp.altitudeGain >= 0 ? 'text-emerald-600' : 'text-blue-600'}>
                      {dayWp.altitudeGain >= 0 ? `+${dayWp.altitudeGain}m` : `${dayWp.altitudeGain}m`}
                    </span>
                  </div>
                  {dayWp.highlights && (
                    <p className="text-[11px] text-neutral-700 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 italic">
                      ✨ {dayWp.highlights}
                    </p>
                  )}
                  <button
                    onClick={() => onSelectItineraryDay?.(dayWp, dayWp.coords)}
                    className="w-full py-1 text-center font-bold text-[11px] rounded bg-neutral-900 text-[#B68D40] hover:bg-neutral-800 transition cursor-pointer"
                  >
                    Select Day {dayWp.day}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* MAP BOTTOM CONTROL TOOLBAR */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
        {mappedItineraryWaypoints.length > 0 && (
          <button
            onClick={() => setShowItinerary(!showItinerary)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-xl transition-all flex items-center gap-1.5 ${
              showItinerary 
                ? 'bg-[#B68D40] text-black border-[#E2C085]' 
                : 'bg-black/80 text-gray-300 border-neutral-800'
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>{showItinerary ? '✓' : ''} Itinerary ({mappedItineraryWaypoints.length}d)</span>
          </button>
        )}
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-xl transition-all ${
            showRoutes 
              ? 'bg-[#B68D40] text-black border-[#E2C085]' 
              : 'bg-black/80 text-gray-300 border-neutral-800'
          }`}
        >
          {showRoutes ? '✓ GPS Tracks' : 'GPS Tracks'}
        </button>
        <button
          onClick={() => setShowRanges(!showRanges)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-xl transition-all ${
            showRanges 
              ? 'bg-[#B68D40] text-black border-[#E2C085]' 
              : 'bg-black/80 text-gray-300 border-neutral-800'
          }`}
        >
          {showRanges ? '✓ Massif Bounds' : 'Massif Bounds'}
        </button>
        <button
          onClick={() => setShowSummits(!showSummits)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-xl transition-all ${
            showSummits 
              ? 'bg-[#B68D40] text-black border-[#E2C085]' 
              : 'bg-black/80 text-gray-300 border-neutral-800'
          }`}
        >
          {showSummits ? '✓ Apex Summits' : 'Apex Summits'}
        </button>
      </div>

    </div>
  );
}
