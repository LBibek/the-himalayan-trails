'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Plus,
  Trash2,
  Mountain,
  Compass,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  Eye,
  Info
} from 'lucide-react';
import { Landmark, Trail } from '@/types';

// Category color and icon map
const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'High Pass': { bg: 'bg-amber-500', border: 'border-amber-300', text: 'text-black', icon: '🚩' },
  'Base Camp': { bg: 'bg-rose-600', border: 'border-rose-300', text: 'text-white', icon: '⛺' },
  'Monastery': { bg: 'bg-purple-600', border: 'border-purple-300', text: 'text-white', icon: '🛕' },
  'Sacred Lake': { bg: 'bg-cyan-500', border: 'border-cyan-300', text: 'text-black', icon: '💧' },
  'Village': { bg: 'bg-emerald-600', border: 'border-emerald-300', text: 'text-white', icon: '🏡' },
  'Summit': { bg: 'bg-yellow-400', border: 'border-yellow-200', text: 'text-black', icon: '🏔️' },
  'Lodge': { bg: 'bg-teal-600', border: 'border-teal-300', text: 'text-white', icon: '🛖' },
  'Viewpoint': { bg: 'bg-indigo-600', border: 'border-indigo-300', text: 'text-white', icon: '🔭' },
  'Checkpost': { bg: 'bg-blue-600', border: 'border-blue-300', text: 'text-white', icon: '🛡️' },
};

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] || { bg: 'bg-[#B68D40]', border: 'border-amber-400', text: 'text-black', icon: '📍' };
}

// Leaflet DivIcon for Landmark Markers
function createLandmarkMarkerIcon(category: string, isDraft = false) {
  const style = getCategoryStyle(category);
  const pulse = isDraft ? 'ring-4 ring-amber-400 animate-bounce' : 'shadow-xl';

  const html = `
    <div class="relative group cursor-pointer flex flex-col items-center transition-transform hover:scale-125 z-40">
      <div class="w-8 h-8 rounded-full ${style.bg} ${style.border} ${style.text} border-2 ${pulse} flex items-center justify-center font-bold text-xs shadow-md">
        ${isDraft ? '✨' : style.icon}
      </div>
      <div class="w-1.5 h-1.5 rounded-full ${isDraft ? 'bg-amber-400' : 'bg-white'} -mt-0.5 border border-black shadow"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-admin-landmark-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    popupAnchor: [0, -28],
  });
}

// Map Click Listener to capture coordinates
function MapClickCapture({ onCoordPicked }: { onCoordPicked: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onCoordPicked(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Fly controller
function MapFlyController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Pre-packaged Himalayan Quick Presets for high efficiency
const HIMALAYAN_PRESETS = [
  { name: 'Lukla Tenzing-Hillary Airstrip', nativeName: 'लुक्ला', category: 'Village', elevation: 2846, region: 'Everest', lat: 27.6869, lng: 86.7314, permit: 'Khumbu Pasang Lhamu Entry Fee', trail: 'Everest Base Camp Trek', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'Gateway settlement with mountain runway airport to Sagarmatha National Park.' },
  { name: 'Namche Bazaar Sherpa Capital', nativeName: 'नाम्चे बजार', category: 'Village', elevation: 3440, region: 'Everest', lat: 27.8069, lng: 86.7142, permit: 'Sagarmatha National Park Permit', trail: 'Everest Base Camp Trek', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'Historic trading hub and amphitheater town with acclimatization bakeries and Sherpa culture.' },
  { name: 'Tengboche Monastery', nativeName: 'तेङ्बोचे गुम्बा', category: 'Monastery', elevation: 3867, region: 'Everest', lat: 27.8361, lng: 86.7644, permit: 'Sagarmatha National Park Permit', trail: 'Everest Base Camp Trek', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'The spiritual heart of Khumbu surrounded by towering rhododendron forests and views of Ama Dablam.' },
  { name: 'Dingboche Valley', nativeName: 'दिङबोचे', category: 'Village', elevation: 4410, region: 'Everest', lat: 27.8936, lng: 86.8322, permit: 'Sagarmatha National Park Permit', trail: 'Everest Base Camp Trek', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'Acclimatization farming settlement sheltered beneath Lhotse and Island Peak ridges.' },
  { name: 'Kala Patthar Viewpoint', nativeName: 'कालापत्थर', category: 'Viewpoint', elevation: 5644, region: 'Everest', lat: 27.9972, lng: 86.8286, permit: 'Sagarmatha National Park Permit', trail: 'Everest Base Camp Trek', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'Famous dark peak overlooking Mount Everest summit, Pumori, and the Khumbu Glacier.' },
  { name: 'Everest Base Camp (South)', nativeName: 'सगरमाथा आधार शिविर', category: 'Base Camp', elevation: 5364, region: 'Everest', lat: 28.0044, lng: 86.8528, permit: 'Sagarmatha National Park Permit', trail: 'Everest Base Camp Trek', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'Expedition staging ground beneath the dramatic ice pinnacles of Khumbu Icefall.' },
  { name: 'Thorong Phedi', nativeName: 'थोरङ फेदी', category: 'Lodge', elevation: 4450, region: 'Annapurna', lat: 28.7905, lng: 83.9555, permit: 'ACAP & TIMS Card', trail: 'Annapurna Circuit & Thorong La', image: 'https://images.unsplash.com/photo-1486911278844-a81c5267e227?w=800&fit=crop&q=80', desc: 'Base camp settlement at foot of the massive scree ascent toward Thorong La Pass.' },
  { name: 'Thorong La Pass Summit', nativeName: 'थोरङ ला भञ्ज्याङ', category: 'High Pass', elevation: 5416, region: 'Annapurna', lat: 28.7936, lng: 83.9358, permit: 'ACAP & TIMS Card', trail: 'Annapurna Circuit & Thorong La', image: 'https://images.unsplash.com/photo-1486911278844-a81c5267e227?w=800&fit=crop&q=80', desc: 'The highest navigable pass on the Annapurna Circuit adorned with thousands of prayer flags.' },
  { name: 'Muktinath Sacred Temple', nativeName: 'मुक्तिनाथ', category: 'Monastery', elevation: 3760, region: 'Annapurna', lat: 28.8172, lng: 83.8711, permit: 'ACAP & TIMS Card', trail: 'Annapurna Circuit & Thorong La', image: 'https://images.unsplash.com/photo-1486911278844-a81c5267e227?w=800&fit=crop&q=80', desc: 'Venerated pilgrimage temple with 108 stone waterspouts and eternal natural gas flame.' },
  { name: 'Kyanjin Gompa', nativeName: 'क्यान्जिङ गुम्बा', category: 'Monastery', elevation: 3870, region: 'Langtang', lat: 28.2125, lng: 85.5683, permit: 'Langtang National Park Permit', trail: 'Langtang Valley & Kyanjin Ri', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'Ancient monastery village famed for yak cheese factories, fluted ice peaks, and glacier hikes.' },
  { name: 'Kyanjin Ri Peak', nativeName: 'क्यान्जिङ री', category: 'Summit', elevation: 4773, region: 'Langtang', lat: 28.2250, lng: 85.5720, permit: 'Langtang National Park Permit', trail: 'Langtang Valley & Kyanjin Ri', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'Panoramic summit ridge offering 360-degree views of Langtang Lirung and Yala Peak.' },
  { name: 'Larke Pass (Larkya La)', nativeName: 'लार्के ला', category: 'High Pass', elevation: 5106, region: 'Manaslu', lat: 28.6500, lng: 84.6167, permit: 'Manaslu Special Restricted Permit & MCAP', trail: 'Manaslu Circuit Trek', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'High alpine col connecting the Budhi Gandaki river gorge with the Marsyangdi valley.' },
  { name: 'Lo Manthang Walled Capital', nativeName: 'लो मान्थाङ', category: 'Village', elevation: 3840, region: 'Mustang', lat: 29.1822, lng: 83.9572, permit: 'Upper Mustang Restricted Area Permit ($500)', trail: 'Upper Mustang Forbidden Kingdom', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80', desc: 'Medieval walled fortress city of the ancient Kingdom of Lo in the rain shadow Himalayas.' },
];

export default function LandmarkAdminStudio({ trails = [] }: { trails?: Trail[] }) {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [category, setCategory] = useState<string>('High Pass');
  const [elevation, setElevation] = useState<number>(5364);
  const [region, setRegion] = useState<string>('Everest');
  const [latitude, setLatitude] = useState<string>('28.0044');
  const [longitude, setLongitude] = useState<string>('86.8528');
  const [associatedTrail, setAssociatedTrail] = useState<string>('Everest Base Camp Trek');
  const [permitRequired, setPermitRequired] = useState<string>('Sagarmatha National Park Permit');
  const [description, setDescription] = useState<string>('');
  const [image, setImage] = useState<string>('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Active Map Focus
  const [flyCenter, setFlyCenter] = useState<[number, number] | null>(null);

  // Load all existing landmarks from DB
  const loadLandmarks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/landmarks');
      if (res.ok) {
        const data: Landmark[] = await res.json();
        setLandmarks(data);
      }
    } catch (err) {
      console.error('Failed to load landmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLandmarks();
  }, []);

  // Handle map click to pin coordinates
  const handleMapCoordPicked = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));

    // Guess region based on coordinate bounding boxes
    if (lat >= 27.5 && lat <= 28.2 && lng >= 86.4 && lng <= 87.2) {
      setRegion('Everest');
      setAssociatedTrail('Everest Base Camp Trek');
      setPermitRequired('Sagarmatha National Park Permit');
    } else if (lat >= 28.2 && lat <= 29.0 && lng >= 83.5 && lng <= 84.4) {
      setRegion('Annapurna');
      setAssociatedTrail('Annapurna Circuit & Thorong La');
      setPermitRequired('ACAP & TIMS Card');
    } else if (lat >= 28.0 && lat <= 28.5 && lng >= 85.2 && lng <= 85.8) {
      setRegion('Langtang');
      setAssociatedTrail('Langtang Valley & Kyanjin Ri');
      setPermitRequired('Langtang National Park Permit');
    } else if (lat >= 28.3 && lat <= 28.8 && lng >= 84.4 && lng <= 85.2) {
      setRegion('Manaslu');
      setAssociatedTrail('Manaslu Circuit Trek');
      setPermitRequired('Manaslu Restricted Permit');
    } else if (lat >= 28.7 && lat <= 29.4 && lng >= 83.6 && lng <= 84.2) {
      setRegion('Mustang');
      setAssociatedTrail('Upper Mustang Forbidden Kingdom');
      setPermitRequired('Upper Mustang Restricted Permit');
    }

    setStatusMessage({
      type: 'success',
      text: `Coordinates captured: Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}! Fill in details below to persist.`,
    });
  };

  // Populate from Himalayan quick preset
  const handleApplyPreset = (preset: typeof HIMALAYAN_PRESETS[0]) => {
    setName(preset.name);
    setNativeName(preset.nativeName || '');
    setCategory(preset.category);
    setElevation(preset.elevation);
    setRegion(preset.region);
    setLatitude(preset.lat.toString());
    setLongitude(preset.lng.toString());
    setAssociatedTrail(preset.trail);
    setPermitRequired(preset.permit);
    setDescription(preset.desc);
    setImage(preset.image);
    setFlyCenter([preset.lat, preset.lng]);
    setStatusMessage({
      type: 'success',
      text: `Loaded preset "${preset.name}". Click "Persist Landmark" to save.`,
    });
  };

  // Submit new landmark to DB
  const handleCreateLandmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Landmark name is required.' });
      return;
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setStatusMessage({ type: 'error', text: 'Valid coordinates are required.' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const payload = {
        name: name.trim(),
        nativeName: nativeName.trim() || undefined,
        category,
        elevation: Number(elevation),
        region,
        coordinates: { lat: latNum, lng: lngNum },
        associatedTrail,
        permitRequired,
        description: description.trim() || `${name} situated in the ${region} region.`,
        image: image.trim() || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop&q=80',
      };

      const res = await fetch('/api/landmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create landmark');
      }

      setStatusMessage({
        type: 'success',
        text: `✓ Landmark "${data.landmark.name}" successfully created and saved to database! It is now instantly live on the map and itinerary planner.`,
      });

      // Reset form slightly, keep map focus
      setName('');
      setNativeName('');
      setDescription('');
      loadLandmarks();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error creating landmark' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete landmark
  const handleDeleteLandmark = async (id: string, lmName: string) => {
    if (!confirm(`Are you sure you want to delete landmark "${lmName}"? This will remove it from the map and itinerary planner.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/landmarks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete landmark');
      }

      setStatusMessage({
        type: 'success',
        text: `✓ Landmark "${lmName}" deleted successfully.`,
      });
      loadLandmarks();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting landmark' });
    }
  };

  // Filtered landmarks
  const filteredLandmarks = useMemo(() => {
    return landmarks.filter((lm) => {
      const matchesSearch =
        lm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lm.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lm.associatedTrail && lm.associatedTrail.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRegion = filterRegion === 'All' || lm.region === filterRegion;
      const matchesCategory = filterCategory === 'All' || lm.category === filterCategory;
      return matchesSearch && matchesRegion && matchesCategory;
    });
  }, [landmarks, searchQuery, filterRegion, filterCategory]);

  const draftLat = parseFloat(latitude);
  const draftLng = parseFloat(longitude);
  const hasValidDraftCoords = !isNaN(draftLat) && !isNaN(draftLng);

  return (
    <div data-slot="base" className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner & Live Stats */}
      <div className="p-6 rounded-3xl backdrop-blur-xl bg-gradient-to-r from-neutral-900/90 via-black/80 to-neutral-900/90 border border-neutral-800 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/30">
              <Compass className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Himalayan Landmarks &amp; POI Studio</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#B68D40] text-black font-mono font-bold text-xs">
              {landmarks.length} Active POIs
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Click directly on the map or apply alpine presets to add authentic passes, base camps, monasteries, and villages. All changes persist to SQLite and sync directly to the 2D/3D map and Itinerary Planner.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLandmarks}
          className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white font-bold text-xs flex items-center gap-2 transition shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* 2. Notification Alerts */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 3. Quick Himalayan Presets Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#B68D40] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>1-Click Popular Alpine Presets:</span>
          </span>
          <span className="text-[11px] text-gray-400">Click to instantly populate coordinates &amp; metadata</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {HIMALAYAN_PRESETS.map((p) => {
            const style = getCategoryStyle(p.category);
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-xs text-gray-200 hover:text-[#B68D40] flex items-center gap-1.5 transition font-medium cursor-pointer shadow-sm group"
              >
                <span>{style.icon}</span>
                <span>{p.name.split(' ')[0]}</span>
                <span className="text-[10px] text-gray-400 font-mono">({p.elevation}m)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Split Map & Form Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Leaflet Interactive Map Picker (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
              <MapPin className="h-4 w-4 text-[#B68D40]" />
              <span>Interactive Coordinate Picker: Click map to pin target location</span>
            </div>
            <span className="text-[11px] text-[#B68D40] font-mono font-bold">
              {landmarks.length} Markers on Map
            </span>
          </div>

          <div className="w-full h-[520px] rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl relative">
            <MapContainer
              center={[28.0044, 86.8528]}
              zoom={9}
              scrollWheelZoom={true}
              className="w-full h-full z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                maxZoom={17}
              />

              <MapClickCapture onCoordPicked={handleMapCoordPicked} />
              <MapFlyController center={flyCenter} />

              {/* Existing Landmarks on Map */}
              {landmarks.map((lm) => (
                <Marker
                  key={lm.id}
                  position={[lm.coordinates.lat, lm.coordinates.lng]}
                  icon={createLandmarkMarkerIcon(lm.category, false)}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-2 space-y-1.5 max-w-xs text-neutral-900">
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black text-[#B68D40] uppercase">
                          {lm.category}
                        </span>
                        <strong className="text-amber-600 font-mono text-xs">{lm.elevation}m</strong>
                      </div>
                      <h4 className="font-extrabold text-sm text-neutral-900">{lm.name}</h4>
                      {lm.nativeName && <p className="text-[11px] text-gray-500 font-serif">{lm.nativeName}</p>}
                      <p className="text-xs text-neutral-600 line-clamp-2">{lm.description}</p>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Lat: {lm.coordinates.lat.toFixed(4)}, Lng: {lm.coordinates.lng.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Draft Marker for the one currently being added */}
              {hasValidDraftCoords && (
                <Marker
                  position={[draftLat, draftLng]}
                  icon={createLandmarkMarkerIcon(category, true)}
                >
                  <Popup>
                    <div className="p-2 text-neutral-900 font-sans text-xs">
                      <strong>✨ New Target Pin:</strong> {name || 'Untitled Landmark'}
                      <br />
                      Elevation: {elevation}m ({region})
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Float badge explaining click-to-pin */}
            <div className="absolute top-3 right-3 z-10 pointer-events-none px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold shadow-lg flex items-center gap-1.5">
              <span>📍</span>
              <span>Click anywhere on map to capture Lat &amp; Lng</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Quick Add Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleCreateLandmark}
            className="p-5 rounded-3xl backdrop-blur-xl bg-neutral-900/90 border border-neutral-800 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#B68D40]" />
                <span>Create &amp; Persist Landmark</span>
              </h3>
              <span className="text-[10px] font-mono text-gray-400">Writes to SQLite</span>
            </div>

            {/* Name & Native Name */}
            <div className="space-y-1">
              <label className="font-bold text-gray-300">Landmark Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dingboche Valley"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">Native Name (Sherpa/Nepali)</label>
                <input
                  type="text"
                  value={nativeName}
                  onChange={(e) => setNativeName(e.target.value)}
                  placeholder="e.g. दिङबोचे"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
                >
                  <option value="High Pass">🚩 High Pass</option>
                  <option value="Base Camp">⛺ Base Camp</option>
                  <option value="Monastery">🛕 Monastery</option>
                  <option value="Sacred Lake">💧 Sacred Lake</option>
                  <option value="Village">🏡 Village</option>
                  <option value="Summit">🏔️ Summit</option>
                  <option value="Lodge">🛖 Lodge</option>
                  <option value="Viewpoint">🔭 Viewpoint</option>
                  <option value="Checkpost">🛡️ Checkpost</option>
                </select>
              </div>
            </div>

            {/* Elevation & Region */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">Elevation (Meters) *</label>
                <input
                  type="number"
                  required
                  value={elevation}
                  onChange={(e) => setElevation(Number(e.target.value))}
                  placeholder="4410"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Region *</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
                >
                  <option value="Everest">Everest / Khumbu</option>
                  <option value="Annapurna">Annapurna</option>
                  <option value="Langtang">Langtang</option>
                  <option value="Manaslu">Manaslu</option>
                  <option value="Mustang">Upper Mustang</option>
                  <option value="Rolwaling">Rolwaling</option>
                  <option value="Kangchenjunga">Kangchenjunga</option>
                </select>
              </div>
            </div>

            {/* Latitude & Longitude (Auto-filled on map click) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">Latitude *</label>
                <input
                  type="text"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="27.8936"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Longitude *</label>
                <input
                  type="text"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="86.8322"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
                />
              </div>
            </div>

            {/* Associated Trail */}
            <div className="space-y-1">
              <label className="font-bold text-gray-300">Associated Expedition Trail</label>
              <select
                value={associatedTrail}
                onChange={(e) => setAssociatedTrail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
              >
                <option value="All Trails">All Trails (Global Himalayan POI)</option>
                {trails.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Permit Required */}
            <div className="space-y-1">
              <label className="font-bold text-gray-300">Permit Required</label>
              <input
                type="text"
                value={permitRequired}
                onChange={(e) => setPermitRequired(e.target.value)}
                placeholder="e.g. Sagarmatha National Park Permit"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-bold text-gray-300">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key highlights, teahouse amenities, terrain description..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40] resize-none"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-1">
              <label className="font-bold text-gray-300">Image URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] disabled:opacity-50 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Persisting to Database...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Persist Landmark to Map &amp; Planner</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 5. Existing Landmarks Directory Table / Grid */}
      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#B68D40]" />
              <span>Database Landmarks Directory ({filteredLandmarks.length} of {landmarks.length})</span>
            </h3>
            <p className="text-xs text-gray-400">Search, filter, focus on map, or remove existing landmarks.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landmarks..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
              />
            </div>

            {/* Region Filter */}
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
            >
              <option value="All">All Regions</option>
              <option value="Everest">Everest</option>
              <option value="Annapurna">Annapurna</option>
              <option value="Langtang">Langtang</option>
              <option value="Manaslu">Manaslu</option>
              <option value="Mustang">Mustang</option>
              <option value="Rolwaling">Rolwaling</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]"
            >
              <option value="All">All Categories</option>
              <option value="High Pass">High Pass</option>
              <option value="Base Camp">Base Camp</option>
              <option value="Monastery">Monastery</option>
              <option value="Sacred Lake">Sacred Lake</option>
              <option value="Village">Village</option>
              <option value="Summit">Summit</option>
              <option value="Viewpoint">Viewpoint</option>
              <option value="Lodge">Lodge</option>
            </select>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLandmarks.map((lm) => {
            const style = getCategoryStyle(lm.category);
            return (
              <div
                key={lm.id}
                className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition space-y-3 flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md ${style.bg} ${style.text} text-[10px] font-extrabold uppercase flex items-center gap-1`}>
                      <span>{style.icon}</span>
                      <span>{lm.category}</span>
                    </span>
                    <span className="text-xs font-mono font-extrabold text-amber-400">
                      {lm.elevation.toLocaleString()}m
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-white">{lm.name}</h4>
                    {lm.nativeName && (
                      <p className="text-[11px] text-gray-400 font-serif">{lm.nativeName}</p>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {lm.description}
                  </p>

                  <div className="text-[11px] text-gray-400 space-y-0.5 font-mono pt-1 border-t border-neutral-800">
                    <div className="flex justify-between">
                      <span>Region:</span>
                      <span className="text-white font-semibold">{lm.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="text-gray-300">{lm.coordinates.lat.toFixed(4)}, {lm.coordinates.lng.toFixed(4)}</span>
                    </div>
                    {lm.associatedTrail && (
                      <div className="flex justify-between truncate">
                        <span>Trail:</span>
                        <span className="text-[#B68D40] truncate max-w-[160px]">{lm.associatedTrail}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFlyCenter([lm.coordinates.lat, lm.coordinates.lng]);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[#B68D40] font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Focus Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteLandmark(lm.id, lm.name)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredLandmarks.length === 0 && (
          <div className="p-8 text-center bg-neutral-900/40 rounded-2xl border border-neutral-800 text-gray-400 text-xs">
            No landmarks found matching current search/filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
