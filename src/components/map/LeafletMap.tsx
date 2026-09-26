'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, ExternalLink } from 'lucide-react';
import { Landmark, Trail } from '@/types';
import { ROUTE_TRACKS } from '@/data/routeTracks';
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
  if (category === 'Base Camp') badgeColor = 'bg-red-600 text-white border-red-400';
  if (category === 'High Pass') badgeColor = 'bg-amber-500 text-black border-amber-300';
  if (category === 'Monastery') badgeColor = 'bg-purple-600 text-white border-purple-400';
  if (category === 'Sacred Lake') badgeColor = 'bg-cyan-500 text-black border-cyan-300';
  if (category === 'Village') badgeColor = 'bg-emerald-600 text-white border-emerald-300';

  const html = `
    <div class="relative group cursor-pointer flex flex-col items-center">
      <div class="w-8 h-8 rounded-full ${badgeColor} border-2 shadow-xl flex items-center justify-center font-bold text-xs transform transition-transform ${isSelected ? 'scale-125 ring-4 ring-amber-400/50' : 'hover:scale-110'}">
        🏔️
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

export interface LeafletMapProps {
  selectedRegion?: string;
  focusedCoords?: [number, number];
  activeTrailId?: string;
  landmarks?: Landmark[];
  onSelectLandmark?: (landmark: Landmark) => void;
  onSelectTrail?: (trailId: string) => void;
  height?: string;
  hideHeaderControls?: boolean;
}

export default function LeafletMap({
  selectedRegion = 'All',
  focusedCoords,
  activeTrailId,
  landmarks: propLandmarks,
  onSelectLandmark,
  onSelectTrail,
  height = 'h-[75vh]',
  hideHeaderControls = false
}: LeafletMapProps) {
  const [tileLayerType, setTileLayerType] = useState<'topo' | 'satellite' | 'street'>('topo');
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.1500, 85.5000]);
  const [mapZoom, setMapZoom] = useState<number>(8);
  const [fetchedLandmarks, setFetchedLandmarks] = useState<Landmark[]>([]);
  const [activeLandmark, setActiveLandmark] = useState<Landmark | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);

  useEffect(() => {
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
    'Everest': { center: [27.9200, 86.7800], zoom: 10 },
    'Annapurna': { center: [28.6000, 83.9500], zoom: 9.5 },
    'Langtang': { center: [28.2000, 85.4500], zoom: 11 },
    'Manaslu': { center: [28.4500, 84.6500], zoom: 10 },
    'Mustang': { center: [29.0000, 83.8500], zoom: 9.5 },
    'Rolwaling': { center: [27.8800, 86.4200], zoom: 10.5 },
  };

  const handleRegionClick = (regionKey: string) => {
    const target = regionFocusCoords[regionKey] || regionFocusCoords['All'];
    setMapCenter(target.center);
    setMapZoom(target.zoom);
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
      
      {/* MAP CONTROLS HEADER HUD */}
      {!hideHeaderControls && (
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          
          <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/85 border border-[#B68D40]/40 backdrop-blur-md shadow-2xl">
            <div className="w-8 h-8 rounded-lg bg-[#B68D40] text-black font-extrabold flex items-center justify-center">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>AllTrails-Style Himalayan Explorer</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">Live Sync</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                {mapCenter[0].toFixed(4)}° N, {mapCenter[1].toFixed(4)}° E
              </div>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-black/85 border border-neutral-800 backdrop-blur-md shadow-xl text-xs">
            {Object.keys(regionFocusCoords).map((reg) => (
              <button
                key={reg}
                onClick={() => handleRegionClick(reg)}
                className="px-3 py-1.5 rounded-lg font-semibold transition-all hover:bg-neutral-800 text-gray-300 hover:text-white"
              >
                {reg}
              </button>
            ))}
          </div>

          <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-black/85 border border-neutral-800 backdrop-blur-md shadow-xl text-xs">
            <button
              onClick={() => setTileLayerType('topo')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                tileLayerType === 'topo' ? 'bg-[#B68D40] text-black' : 'text-gray-300 hover:bg-neutral-800'
              }`}
            >
              Topo
            </button>
            <button
              onClick={() => setTileLayerType('satellite')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                tileLayerType === 'satellite' ? 'bg-[#B68D40] text-black' : 'text-gray-300 hover:bg-neutral-800'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setTileLayerType('street')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                tileLayerType === 'street' ? 'bg-[#B68D40] text-black' : 'text-gray-300 hover:bg-neutral-800'
              }`}
            >
              Street
            </button>
          </div>

        </div>
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
      </MapContainer>

      {/* MAP BOTTOM CONTROL TOOLBAR */}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-xl transition-all ${
            showRoutes 
              ? 'bg-[#B68D40] text-black border-[#E2C085]' 
              : 'bg-black/80 text-gray-300 border-neutral-800'
          }`}
        >
          {showRoutes ? '✓ GPS Route Tracks On' : 'GPS Route Tracks Off'}
        </button>
      </div>

    </div>
  );
}
