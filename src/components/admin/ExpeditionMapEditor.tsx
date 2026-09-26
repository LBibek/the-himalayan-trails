'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Trash2, MapPin, Route, Undo, Save, Info, Mountain } from 'lucide-react';
import { Landmark } from '@/types';

export interface EditableLandmark {
  id: string;
  name: string;
  category: 'High Pass' | 'Base Camp' | 'Monastery' | 'Sacred Lake' | 'Village' | 'Checkpost' | 'Summit' | 'Lodge';
  elevation: number;
  lat: number;
  lng: number;
  description: string;
}

export interface ExpeditionMapEditorProps {
  initialWaypoints?: [number, number][];
  initialLandmarks?: EditableLandmark[];
  onWaypointsChange: (waypoints: [number, number][]) => void;
  onLandmarksChange: (landmarks: EditableLandmark[]) => void;
}

// Map Click Listener component
function MapEventsHandler({
  mode,
  onAddWaypoint,
  onSelectLocationForLandmark
}: {
  mode: 'drawTrail' | 'addLandmark' | 'view';
  onAddWaypoint: (lat: number, lng: number) => void;
  onSelectLocationForLandmark: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (mode === 'drawTrail') {
        onAddWaypoint(e.latlng.lat, e.latlng.lng);
      } else if (mode === 'addLandmark') {
        onSelectLocationForLandmark(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Calculate total distance along polyline coords in kilometers
function calculatePolylineDistance(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let totalMeters = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const latlng1 = L.latLng(coords[i][0], coords[i][1]);
    const latlng2 = L.latLng(coords[i+1][0], coords[i+1][1]);
    totalMeters += latlng1.distanceTo(latlng2);
  }
  return Number((totalMeters / 1000).toFixed(2));
}

function createLandmarkIcon(category: string) {
  let badgeColor = 'bg-[#B68D40] text-black border-amber-300';
  let iconSymbol = '📍';
  if (category === 'Base Camp') { badgeColor = 'bg-red-600 text-white border-red-300'; iconSymbol = '⛺'; }
  if (category === 'High Pass') { badgeColor = 'bg-amber-500 text-black border-amber-200'; iconSymbol = '🚩'; }
  if (category === 'Monastery') { badgeColor = 'bg-purple-600 text-white border-purple-300'; iconSymbol = '🛕'; }
  if (category === 'Sacred Lake') { badgeColor = 'bg-cyan-500 text-black border-cyan-200'; iconSymbol = '🏔️'; }
  if (category === 'Summit') { badgeColor = 'bg-yellow-400 text-black border-yellow-200'; iconSymbol = '🏔️'; }
  if (category === 'Village' || category === 'Lodge') { badgeColor = 'bg-emerald-600 text-white border-emerald-200'; iconSymbol = '🏡'; }

  const html = `
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 rounded-full ${badgeColor} border-2 shadow-xl flex items-center justify-center font-bold text-xs transform transition-transform hover:scale-110">
        ${iconSymbol}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-admin-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export default function ExpeditionMapEditor({
  initialWaypoints = [],
  initialLandmarks = [],
  onWaypointsChange,
  onLandmarksChange
}: ExpeditionMapEditorProps) {
  const [mode, setMode] = useState<'drawTrail' | 'addLandmark' | 'view'>('drawTrail');
  const [waypoints, setWaypoints] = useState<[number, number][]>(initialWaypoints);
  const [landmarks, setLandmarks] = useState<EditableLandmark[]>(initialLandmarks);

  // New Landmark Modal / Form State
  const [pendingLandmarkCoords, setPendingLandmarkCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [landmarkName, setLandmarkName] = useState('');
  const [landmarkCategory, setLandmarkCategory] = useState<EditableLandmark['category']>('High Pass');
  const [landmarkElevation, setLandmarkElevation] = useState<number>(4500);
  const [landmarkDesc, setLandmarkDesc] = useState('');

  const totalKm = calculatePolylineDistance(waypoints);

  // Notify parent component on state changes
  useEffect(() => {
    onWaypointsChange(waypoints);
  }, [waypoints, onWaypointsChange]);

  useEffect(() => {
    onLandmarksChange(landmarks);
  }, [landmarks, onLandmarksChange]);

  const handleAddWaypoint = (lat: number, lng: number) => {
    setWaypoints((prev) => [...prev, [lat, lng]]);
  };

  const handleUndoWaypoint = () => {
    setWaypoints((prev) => prev.slice(0, -1));
  };

  const handleClearTrail = () => {
    if (confirm('Clear all mapped trail waypoints?')) {
      setWaypoints([]);
    }
  };

  const handleSelectLocationForLandmark = (lat: number, lng: number) => {
    setPendingLandmarkCoords({ lat, lng });
  };

  const handleSaveLandmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLandmarkCoords || !landmarkName.trim()) return;

    const newLandmark: EditableLandmark = {
      id: `lm-${Date.now()}`,
      name: landmarkName.trim(),
      category: landmarkCategory,
      elevation: Number(landmarkElevation),
      lat: pendingLandmarkCoords.lat,
      lng: pendingLandmarkCoords.lng,
      description: landmarkDesc.trim() || 'Custom expedition point of interest.',
    };

    setLandmarks((prev) => [...prev, newLandmark]);

    // Reset Form
    setPendingLandmarkCoords(null);
    setLandmarkName('');
    setLandmarkDesc('');
    setMode('view');
  };

  const handleDeleteLandmark = (id: string) => {
    setLandmarks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-4">
      
      {/* EDITOR TOOLBAR HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        
        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold mr-1">Map Tool Mode:</span>
          
          <button
            type="button"
            onClick={() => setMode('drawTrail')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'drawTrail'
                ? 'bg-[#B68D40] text-black shadow-lg'
                : 'bg-black text-gray-300 border border-neutral-800 hover:border-[#B68D40]'
            }`}
          >
            <Route className="h-4 w-4" />
            <span>Click to Draw Trail</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('addLandmark')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              mode === 'addLandmark'
                ? 'bg-[#B68D40] text-black shadow-lg'
                : 'bg-black text-gray-300 border border-neutral-800 hover:border-[#B68D40]'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Click to Add Landmark</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('view')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              mode === 'view'
                ? 'bg-neutral-700 text-white'
                : 'bg-black text-gray-400 border border-neutral-800'
            }`}
          >
            <span>Pan / View</span>
          </button>
        </div>

        {/* Trail Stats & Actions */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-gray-300 font-mono">
            Waypoints: <strong className="text-[#B68D40]">{waypoints.length}</strong> | Distance: <strong className="text-[#B68D40]">{totalKm} km</strong>
          </div>

          <button
            type="button"
            onClick={handleUndoWaypoint}
            disabled={waypoints.length === 0}
            className="p-2 rounded-xl bg-black border border-neutral-800 text-gray-300 hover:text-white disabled:opacity-40"
            title="Undo Last Waypoint"
          >
            <Undo className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleClearTrail}
            disabled={waypoints.length === 0}
            className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-40"
            title="Clear Trail Polyline"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MODE INSTRUCTION BANNER */}
      <div className="px-4 py-2 rounded-xl bg-black border border-neutral-800 text-xs flex items-center justify-between text-gray-300">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-[#B68D40]" />
          <span>
            {mode === 'drawTrail' && 'Click anywhere on the map to draw trail waypoints sequentially.'}
            {mode === 'addLandmark' && 'Click on the map location where you want to place a landmark.'}
            {mode === 'view' && 'Pan and inspect your expedition trail and landmarks.'}
          </span>
        </div>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Active Mode: {mode}</span>
      </div>

      {/* LEAFLET MAP CANVAS */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
        <MapContainer
          center={[28.2500, 85.4000]}
          zoom={8}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution="OpenTopoMap"
          />

          <MapEventsHandler
            mode={mode}
            onAddWaypoint={handleAddWaypoint}
            onSelectLocationForLandmark={handleSelectLocationForLandmark}
          />

          {/* Draw Polyline for Trail */}
          {waypoints.length > 0 && (
            <Polyline
              positions={waypoints}
              pathOptions={{ color: '#eab308', weight: 4, opacity: 0.95 }}
            />
          )}

          {/* Polyline Waypoint Small Markers */}
          {waypoints.map((pt, idx) => (
            <Marker
              key={`wp-${idx}`}
              position={pt}
              icon={L.divIcon({
                html: `<div style="background:#eab308; width:10px; height:10px; border-radius:50%; border:2px solid black;"></div>`,
                className: 'wp-dot-icon',
                iconSize: [10, 10],
                iconAnchor: [5, 5]
              })}
            />
          ))}

          {/* Landmarks Markers */}
          {landmarks.map((lm) => (
            <Marker
              key={lm.id}
              position={[lm.lat, lm.lng]}
              icon={createLandmarkIcon(lm.category)}
            >
              <Popup>
                <div className="p-1 space-y-2 max-w-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-[#B68D40] uppercase">
                      {lm.category}
                    </span>
                    <span className="text-xs font-bold text-amber-500">{lm.elevation}m</span>
                  </div>
                  <h4 className="font-bold text-sm text-black">{lm.name}</h4>
                  <p className="text-xs text-gray-700">{lm.description}</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteLandmark(lm.id)}
                    className="w-full mt-2 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete Landmark</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Pending Landmark Placement Preview Marker */}
          {pendingLandmarkCoords && (
            <Marker
              position={[pendingLandmarkCoords.lat, pendingLandmarkCoords.lng]}
              icon={L.divIcon({
                html: `<div className="w-8 h-8 rounded-full bg-[#B68D40] border-2 border-white animate-bounce flex items-center justify-center font-bold">📍</div>`,
                className: 'pending-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
              })}
            />
          )}

        </MapContainer>
      </div>

      {/* NEW LANDMARK DETAILS FORM MODAL */}
      {pendingLandmarkCoords && (
        <form 
          onSubmit={handleSaveLandmark}
          className="bg-neutral-900 border border-[#B68D40]/50 p-6 rounded-2xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#B68D40]" />
              <span>Configure New Landmark at Selected Coordinates</span>
            </h3>
            <span className="text-xs font-mono text-[#B68D40]">
              [{pendingLandmarkCoords.lat.toFixed(4)}, {pendingLandmarkCoords.lng.toFixed(4)}]
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Landmark Name *</label>
              <input
                type="text"
                required
                value={landmarkName}
                onChange={(e) => setLandmarkName(e.target.value)}
                placeholder="e.g. Cho La Pass Summit"
                className="w-full p-2.5 rounded-xl bg-black border border-neutral-700 text-white text-xs focus:outline-none focus:border-[#B68D40]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Landmark Type *</label>
              <select
                value={landmarkCategory}
                onChange={(e) => setLandmarkCategory(e.target.value as EditableLandmark['category'])}
                className="w-full p-2.5 rounded-xl bg-black border border-neutral-700 text-white text-xs focus:outline-none focus:border-[#B68D40]"
              >
                <option value="High Pass">High Pass (Mountain Pass)</option>
                <option value="Base Camp">Base Camp</option>
                <option value="Summit">Summit Peak</option>
                <option value="Monastery">Monastery / Temple</option>
                <option value="Sacred Lake">Sacred Lake</option>
                <option value="Village">Village</option>
                <option value="Lodge">Teahouse Lodge</option>
                <option value="Checkpost">Checkpost / Gate</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Elevation (Meters) *</label>
              <input
                type="number"
                required
                value={landmarkElevation}
                onChange={(e) => setLandmarkElevation(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-black border border-neutral-700 text-white text-xs focus:outline-none focus:border-[#B68D40]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Description & Notes</label>
            <textarea
              rows={2}
              value={landmarkDesc}
              onChange={(e) => setLandmarkDesc(e.target.value)}
              placeholder="Describe landmark features, permit requirements, or hazards..."
              className="w-full p-2.5 rounded-xl bg-black border border-neutral-700 text-white text-xs focus:outline-none focus:border-[#B68D40]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPendingLandmarkCoords(null)}
              className="px-4 py-2 rounded-xl bg-neutral-800 text-gray-300 text-xs font-semibold hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#B68D40] text-black text-xs font-bold hover:bg-[#c99e4b] flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Add Landmark to Map</span>
            </button>
          </div>
        </form>
      )}

      {/* LANDMARKS LIST PREVIEW TABLE */}
      {landmarks.length > 0 && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#B68D40]" />
            <span>Configured Expedition Landmarks ({landmarks.length})</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {landmarks.map((lm) => (
              <div key={lm.id} className="p-3 rounded-xl bg-black border border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{lm.name}</div>
                  <div className="text-[11px] text-[#B68D40] font-semibold">{lm.category} • {lm.elevation}m</div>
                  <div className="text-[10px] text-gray-500 font-mono">[{lm.lat.toFixed(4)}, {lm.lng.toFixed(4)}]</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteLandmark(lm.id)}
                  className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
