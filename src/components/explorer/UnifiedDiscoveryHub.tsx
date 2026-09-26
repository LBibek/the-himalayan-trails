'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Star,
  Clock,
  Gauge,
  Mountain,
  MapPin,
  Heart,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  ArrowUpRight,
  TrendingUp,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  Globe,
  Compass,
  Info,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Trail, Landmark } from '@/types';
import { ROUTE_TRACKS } from '@/data/routeTracks';
import ElevationProfileChart from '@/components/map/ElevationProfileChart';
import FloatingMapPanel from '@/components/ui/FloatingMapPanel';

// Dynamically import Leaflet Map without SSR
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-900 animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-2xl border border-neutral-800">
      Loading AllTrails Interactive Leaflet Engine...
    </div>
  )
});

// Dynamically import Cesium 3D Globe Map without SSR
const CesiumGlobeMap = dynamic(() => import('@/components/map/CesiumGlobeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-neutral-900 animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-2xl border border-neutral-800">
      Loading Cesium 3D Himalayan Terrain Engine...
    </div>
  )
});

export interface UnifiedDiscoveryHubProps {
  defaultLayout?: 'split' | 'mapOnly' | 'cardsOnly';
}

export function UnifiedDiscoveryHubContent({ defaultLayout = 'split' }: UnifiedDiscoveryHubProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlTrail = searchParams.get('trail');
  const urlEngine = searchParams.get('engine');
  const urlMode = searchParams.get('mode');
  const urlTour = searchParams.get('tour');
  const urlLayout = searchParams.get('layout') as 'split' | 'mapOnly' | 'cardsOnly' | null;
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  const urlLandmark = searchParams.get('landmark');
  const urlRange = searchParams.get('range');
  const urlRegion = searchParams.get('region');

  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [maxAltitude, setMaxAltitude] = useState<number>(6000);
  const [layoutMode, setLayoutMode] = useState<'split' | 'mapOnly' | 'cardsOnly'>(urlLayout || defaultLayout);
  const [mapEngine, setMapEngine] = useState<'2d' | '3d-freeroam' | '3d-summit-tours'>('2d');
  
  // Active Selected / Hovered Trail for Elevation Profile & Map Focus
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [hoveredTrailId, setHoveredTrailId] = useState<string | null>(null);
  const [focusedCoords, setFocusedCoords] = useState<[number, number] | undefined>(undefined);
  const [savedTrails, setSavedTrails] = useState<string[]>([]);
  const [showElevationProfile, setShowElevationProfile] = useState<boolean>(true);
  const [showTrailSwitcher, setShowTrailSwitcher] = useState<boolean>(true);

  // Quick Detail Modal / Slide-Over State
  const [detailModalTrail, setDetailModalTrail] = useState<Trail | null>(null);

  useEffect(() => {
    if (urlLayout) {
      setLayoutMode(urlLayout);
    }
  }, [urlLayout]);

  useEffect(() => {
    if (urlMode === 'summit-tours' || urlTour) {
      setMapEngine('3d-summit-tours');
    } else if (urlEngine === '3d') {
      setMapEngine('3d-freeroam');
    } else if (urlEngine === '2d') {
      setMapEngine('2d');
    }
  }, [urlEngine, urlMode, urlTour]);

  useEffect(() => {
    if (urlRange || urlRegion) {
      setSelectedRegion(urlRange || urlRegion || 'All');
    }
  }, [urlRange, urlRegion]);

  useEffect(() => {
    if (urlLat && urlLng) {
      const parsedLat = parseFloat(urlLat);
      const parsedLng = parseFloat(urlLng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setFocusedCoords([parsedLat, parsedLng]);
      }
    }
  }, [urlLat, urlLng]);

  useEffect(() => {
    if (urlLandmark) {
      fetch('/api/landmarks')
        .then((res) => (res.ok ? res.json() : []))
        .then((landmarks: Landmark[]) => {
          const match = landmarks.find(
            (lm) =>
              lm.id.toLowerCase() === urlLandmark.toLowerCase() ||
              lm.name.toLowerCase().includes(urlLandmark.toLowerCase())
          );
          if (match) {
            setFocusedCoords([match.coordinates.lat, match.coordinates.lng]);
            if (match.region) {
              setSelectedRegion(match.region);
            }
          }
        })
        .catch(console.error);
    }
  }, [urlLandmark]);

  useEffect(() => {
    fetch('/api/trails')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Trail[]) => {
        setTrails(data);
        if (data.length > 0) {
          if (urlTrail) {
            const match = data.find((t) => t.id === urlTrail || t.slug === urlTrail);
            setSelectedTrail(match || data[0]);
          } else if (!selectedTrail) {
            setSelectedTrail(data[0]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [urlTrail]);

  // Filter Trails
  const filteredTrails = trails.filter((trail) => {
    const matchesSearch = trail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          trail.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          trail.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || trail.region.toLowerCase().includes(selectedRegion.toLowerCase()) || selectedRegion.toLowerCase().includes(trail.region.toLowerCase());
    const matchesDiff = selectedDifficulty === 'All' || trail.difficulty === selectedDifficulty;
    const matchesAlt = trail.maxElevation <= maxAltitude;
    return matchesSearch && matchesRegion && matchesDiff && matchesAlt;
  });

  const toggleSaveTrail = (id: string) => {
    setSavedTrails((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTrailSelect = (trail: Trail, switchMode = false) => {
    setSelectedTrail(trail);
    setHoveredTrailId(trail.id);
    const track = ROUTE_TRACKS[trail.id];
    if (track && track.coords.length) {
      const midIdx = Math.floor(track.coords.length / 2);
      setFocusedCoords(track.coords[midIdx]);
    }
    if (switchMode && layoutMode === 'cardsOnly') {
      setLayoutMode('split');
    }
  };

  const handleTrailCardHover = (trail: Trail) => {
    setHoveredTrailId(trail.id);
    const track = ROUTE_TRACKS[trail.id];
    if (track && track.coords.length) {
      const midIdx = Math.floor(track.coords.length / 2);
      setFocusedCoords(track.coords[midIdx]);
    }
  };

  const activeTrail = selectedTrail || (hoveredTrailId ? trails.find((t: Trail) => t.id === hoveredTrailId) : trails[0]) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-black text-white overflow-hidden relative">
      
      {/* 1. DISCOVERY HUB TOP NAVIGATION & FILTER BAR */}
      <header className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0">
        
        {/* Left Search Bar */}
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trails, passes, valleys..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#B68D40]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Region Filter Pill */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-gray-200 font-medium focus:outline-none focus:border-[#B68D40] cursor-pointer"
          >
            <option value="All">Region: All</option>
            <option value="Everest">Everest / Khumbu</option>
            <option value="Annapurna">Annapurna</option>
            <option value="Langtang">Langtang</option>
            <option value="Manaslu">Manaslu</option>
            <option value="Mustang">Mustang</option>
            <option value="Rolwaling">Rolwaling Valley</option>
            <option value="Kanchenjunga">Kangchenjunga</option>
          </select>

          {/* Difficulty Filter Pill */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-gray-200 font-medium focus:outline-none focus:border-[#B68D40] cursor-pointer"
          >
            <option value="All">Difficulty: All</option>
            <option value="Moderate">Moderate</option>
            <option value="Strenuous">Strenuous</option>
            <option value="Challenging">Challenging</option>
          </select>

          {/* Elevation Slider Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-gray-200">
            <Gauge className="h-3.5 w-3.5 text-[#B68D40]" />
            <span>Max Elev: <strong className="text-[#B68D40]">{maxAltitude}m</strong></span>
            <input
              type="range"
              min="3000"
              max="6000"
              step="100"
              value={maxAltitude}
              onChange={(e) => setMaxAltitude(Number(e.target.value))}
              className="w-20 accent-[#B68D40] cursor-pointer"
            />
          </div>

        </div>

        {/* View Layout Toggle (Split Screen, Full Map, Grid View) */}
        <div className="flex items-center p-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold">
          <button
            onClick={() => setLayoutMode('split')}
            className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
              layoutMode === 'split' ? 'bg-[#B68D40] text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Split Screen</span>
          </button>

          <button
            onClick={() => setLayoutMode('mapOnly')}
            className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
              layoutMode === 'mapOnly' ? 'bg-[#B68D40] text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Full Map</span>
          </button>

          <button
            onClick={() => setLayoutMode('cardsOnly')}
            className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
              layoutMode === 'cardsOnly' ? 'bg-[#B68D40] text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Grid View</span>
          </button>
        </div>

        {/* Map Engine Toggle: 2D Leaflet vs 3D Free Roam vs 3D Summit Tours */}
        <div className="flex items-center p-1 rounded-full bg-neutral-900 border border-[#B68D40]/30 text-xs font-semibold shadow-lg">
          <button
            onClick={() => setMapEngine('2d')}
            className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
              mapEngine === '2d' ? 'bg-[#B68D40] text-black font-bold shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>2D Topo</span>
          </button>

          <button
            onClick={() => setMapEngine('3d-freeroam')}
            className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
              mapEngine === '3d-freeroam' ? 'bg-[#B68D40] text-black font-bold shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>3D Roam</span>
          </button>

          <button
            onClick={() => setMapEngine('3d-summit-tours')}
            className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
              mapEngine === '3d-summit-tours' ? 'bg-[#B68D40] text-black font-bold shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mountain className="h-3.5 w-3.5 text-amber-400" />
            <span>Summit Tours</span>
          </button>
        </div>

      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* A. LEFT SCROLLABLE TRAIL CARDS LIST (IN SPLIT MODE) */}
        {layoutMode === 'split' && (
          <div className="w-full lg:w-[40%] xl:w-[35%] h-full overflow-y-auto border-r border-neutral-800 bg-neutral-950 p-4 space-y-4 shrink-0">
            
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                {filteredTrails.length} Himalayan Expeditions Found
              </span>
              <span className="text-[11px] text-[#B68D40]">Click card to focus map & profile</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#B68D40] gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">Loading Trails Catalog...</span>
              </div>
            ) : filteredTrails.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-xs">
                No trails match the selected region or elevation criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTrails.map((trail) => {
                  const isSelected = activeTrail?.id === trail.id;
                  const isSaved = savedTrails.includes(trail.id);

                  return (
                    <div
                      key={trail.id}
                      onClick={() => handleTrailSelect(trail)}
                      onMouseEnter={() => handleTrailCardHover(trail)}
                      className={`group cursor-pointer rounded-2xl border transition-all duration-200 overflow-hidden bg-neutral-900/60 ${
                        isSelected
                          ? 'border-[#B68D40] shadow-xl shadow-[#B68D40]/10 bg-neutral-900'
                          : 'border-neutral-800/80 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex gap-3.5 p-3.5">
                        <div className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0 bg-neutral-800">
                          <img
                            src={trail.image}
                            alt={trail.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveTrail(trail.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-red-500 transition"
                          >
                            <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-[#B68D40] tracking-wider">
                                {trail.region}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">•</span>
                              <span className="text-[10px] text-gray-300 font-semibold">{trail.difficulty}</span>
                            </div>
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-[#E2C085] transition">
                              {trail.name}
                            </h3>
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                              {trail.description}
                            </p>
                          </div>

                          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-gray-300 font-semibold border-t border-neutral-900">
                            <div>{trail.distanceKm} km</div>
                            <div className="text-amber-400">+{trail.elevationGain}m</div>
                            <div>{trail.durationDays} Days</div>
                          </div>
                        </div>
                      </div>

                      <div className="px-3.5 pb-3 flex items-center justify-between text-xs border-t border-neutral-900 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModalTrail(trail);
                          }}
                          className="text-[#B68D40] text-[11px] font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Info className="h-3 w-3" />
                          <span>Quick Specs</span>
                        </button>
                        <Link
                          href={`/trails/${trail.slug || trail.id}`}
                          className="text-gray-300 hover:text-[#B68D40] flex items-center gap-1 font-bold text-xs"
                        >
                          <span>Full Detail</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* B. GRID CATALOG MODE (`layoutMode === 'cardsOnly'`) */}
        {layoutMode === 'cardsOnly' && (
          <div className="flex-1 h-full overflow-y-auto bg-black p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h2 className="text-2xl font-black text-white">Himalayan Expeditions Directory</h2>
                <p className="text-xs text-gray-400">
                  Showing {filteredTrails.length} verified alpine trekking routes with real-time GPS tracks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLayoutMode('split')}
                  className="px-4 py-2 rounded-xl bg-[#B68D40] text-black font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-[#c99e4b] transition"
                >
                  <MapIcon className="h-4 w-4" />
                  <span>Open Interactive Map</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 text-[#B68D40] gap-3">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm font-semibold">Loading Expeditions...</span>
              </div>
            ) : filteredTrails.length === 0 ? (
              <div className="text-center py-28 text-gray-500 text-sm">
                No expeditions match your current search and elevation filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTrails.map((trail) => {
                  const isSaved = savedTrails.includes(trail.id);
                  return (
                    <div
                      key={trail.id}
                      className="group rounded-3xl border border-neutral-800 bg-neutral-950/80 hover:border-[#B68D40]/60 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl"
                    >
                      <div>
                        <div className="relative h-52 w-full overflow-hidden bg-neutral-900">
                          <img
                            src={trail.image}
                            alt={trail.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                          
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#B68D40] text-[10px] font-bold border border-[#B68D40]/30 uppercase">
                              {trail.region}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-[10px] font-semibold border border-white/20">
                              {trail.difficulty}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleSaveTrail(trail.id)}
                            className="absolute top-3 right-3 p-2 rounded-full bg-black/70 backdrop-blur-md text-white hover:text-red-500 transition"
                          >
                            <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>

                          <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-xs text-white font-mono">
                            <span className="font-extrabold text-amber-400">{trail.maxElevation}m Max Alt</span>
                            <span>{trail.distanceKm} KM • {trail.durationDays} Days</span>
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          <h3 className="text-lg font-black text-white group-hover:text-[#E2C085] transition">
                            {trail.name}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                            {trail.description}
                          </p>

                          <div className="pt-2 flex flex-wrap items-center gap-1.5">
                            {trail.highlights?.slice(0, 3).map((hl, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-neutral-900 text-[10px] text-gray-300 font-medium border border-neutral-800"
                              >
                                ✓ {hl}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-2 border-t border-neutral-900">
                        <div className="pt-3 grid grid-cols-2 gap-2 text-xs">
                          <button
                            onClick={() => handleTrailSelect(trail, true)}
                            className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[#B68D40] font-bold flex items-center justify-center gap-1.5 transition"
                          >
                            <MapIcon className="h-3.5 w-3.5" />
                            <span>Focus Map</span>
                          </button>
                          <button
                            onClick={() => setDetailModalTrail(trail)}
                            className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-gray-200 font-bold flex items-center justify-center gap-1.5 transition"
                          >
                            <Info className="h-3.5 w-3.5" />
                            <span>Quick Specs</span>
                          </button>
                        </div>
                        <Link
                          href={`/trails/${trail.slug || trail.id}`}
                          className="w-full py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition"
                        >
                          <span>Explore Full Expedition</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* C. RIGHT INTERACTIVE MAP CANVAS (IN SPLIT & MAP-ONLY MODES) */}
        {(layoutMode === 'split' || layoutMode === 'mapOnly') && (
          <div className="flex-1 h-full relative flex flex-col justify-between">
            
            {/* MAP ENGINE CANVAS (2D LEAFLET OR 3D CESIUM GLOBE) */}
            <div className="flex-1 relative w-full h-full">
              {mapEngine === '2d' ? (
                <LeafletMap
                  selectedRegion={selectedRegion}
                  focusedCoords={focusedCoords}
                  activeTrailId={activeTrail?.id}
                  onSelectRegion={(reg) => setSelectedRegion(reg)}
                  onSelectTrail={(trailId) => {
                    const match = trails.find((t) => t.id === trailId);
                    if (match) handleTrailSelect(match);
                  }}
                  onSelectLandmark={(lm) => {
                    setFocusedCoords([lm.coordinates.lat, lm.coordinates.lng]);
                  }}
                  height="h-full"
                />
              ) : (
                <CesiumGlobeMap
                  height="h-full"
                  activeTrail={activeTrail}
                  mode={mapEngine === '3d-summit-tours' ? 'summit-tours' : 'freeroam'}
                  initialSummitSlug={urlTour || (selectedRegion.toLowerCase().includes('everest') ? 'everest' : selectedRegion.toLowerCase().includes('annapurna') ? 'annapurna' : selectedRegion.toLowerCase().includes('manaslu') ? 'manaslu' : 'everest')}
                  onSelectLandmark={(lm) => {
                    setFocusedCoords([lm.coordinates.lat, lm.coordinates.lng]);
                  }}
                  scrubberPoint={
                    focusedCoords
                      ? { lat: focusedCoords[0], lng: focusedCoords[1], altitude: 6000 }
                      : null
                  }
                  initialCenter={
                    focusedCoords
                      ? { lat: focusedCoords[0], lng: focusedCoords[1], altitude: 9000 }
                      : undefined
                  }
                  onClose3D={() => setMapEngine('2d')}
                />
              )}
            </div>

            {/* QUICK TRAIL ELEVATION SWITCHER PILLS BAR */}
            {showTrailSwitcher && (
              <div className="absolute bottom-16 left-4 z-[999]">
                <FloatingMapPanel
                  id="trail-switcher-hud"
                  title="Trail Profile Switcher"
                  icon={<TrendingUp className="h-3.5 w-3.5 text-[#B68D40]" />}
                  allowDrag={true}
                  allowResize={true}
                  allowMinimize={true}
                  allowMaximize={false}
                  allowClose={true}
                  onClose={() => setShowTrailSwitcher(false)}
                  defaultWidth="w-auto"
                >
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold px-1">
                      Select Trail:
                    </span>
                    {trails.map((t: Trail) => (
                      <button
                        key={t.id}
                        onClick={() => handleTrailSelect(t)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition ${
                          activeTrail?.id === t.id
                            ? 'bg-[#B68D40] text-black font-bold shadow'
                            : 'text-gray-300 hover:bg-neutral-800'
                        }`}
                      >
                        {t.region}
                      </button>
                    ))}
                  </div>
                </FloatingMapPanel>
              </div>
            )}

            {/* RESTORE TRAIL SWITCHER BUTTON IF CLOSED */}
            {!showTrailSwitcher && (
              <button
                onClick={() => setShowTrailSwitcher(true)}
                className="absolute bottom-16 left-4 z-[999] px-3 py-1.5 rounded-xl bg-slate-900/90 border border-[#B68D40]/50 text-[#B68D40] hover:text-white hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xl transition backdrop-blur-md"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Show Trail Switcher</span>
              </button>
            )}

          </div>
        )}

      </div>

      {/* 3. BOTTOM ALTITUDE ELEVATION PROFILE LINE GRAPH DRAWER */}
      {activeTrail && showElevationProfile && (layoutMode === 'split' || layoutMode === 'mapOnly') && (
        <div className="z-30 relative border-t border-neutral-800">
          <ElevationProfileChart
            trail={activeTrail}
            onClose={() => setShowElevationProfile(false)}
            onSelectPoint={(pt) => {
              if (pt.lat && pt.lng) {
                setFocusedCoords([pt.lat, pt.lng]);
              }
            }}
            onSelectLandmark={(lm) => {
              setFocusedCoords([lm.coordinates.lat, lm.coordinates.lng]);
            }}
            onHoverPoint={(pt) => {
              if (!pt || !activeTrail) {
                setFocusedCoords(undefined);
                return;
              }
              if (pt.lat && pt.lng) {
                setFocusedCoords([pt.lat, pt.lng]);
                return;
              }
              const track = ROUTE_TRACKS[activeTrail.id];
              if (track && track.coords.length > 0 && activeTrail.distanceKm > 0) {
                const ratio = Math.max(0, Math.min(1, pt.distanceKm / activeTrail.distanceKm));
                const targetIdx = Math.min(
                  track.coords.length - 1,
                  Math.floor(ratio * (track.coords.length - 1))
                );
                setFocusedCoords(track.coords[targetIdx]);
                return;
              }
              const ratio = activeTrail.distanceKm > 0 ? pt.distanceKm / activeTrail.distanceKm : 0;
              const regionCoords: Record<string, [number, number]> = {
                'Everest': [27.9881, 86.9250],
                'Annapurna': [28.5960, 83.8200],
                'Langtang': [28.2100, 85.5600],
                'Manaslu': [28.5500, 84.5600],
                'Mustang': [29.1800, 83.9500],
                'Rolwaling': [27.8700, 86.4500]
              };
              const base = regionCoords[activeTrail.region] || [28.3949, 84.1240];
              const interpolated: [number, number] = [
                base[0] + (ratio - 0.5) * 0.08,
                base[1] + (ratio - 0.5) * 0.08
              ];
              setFocusedCoords(interpolated);
            }}
          />
        </div>
      )}

      {/* RE-OPEN ALTITUDE GRAPH BUTTON IF CLOSED */}
      {!showElevationProfile && activeTrail && (layoutMode === 'split' || layoutMode === 'mapOnly') && (
        <button
          onClick={() => setShowElevationProfile(true)}
          className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full bg-[#B68D40] text-black font-bold text-xs flex items-center gap-2 shadow-2xl hover:bg-[#c99e4b] transition"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Show Altitude Line Graph</span>
        </button>
      )}

      {/* 4. QUICK TRAIL DETAIL SLIDE-OVER MODAL */}
      {detailModalTrail && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-950 border border-[#B68D40]/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header Image */}
            <div className="relative h-60 w-full overflow-hidden shrink-0">
              <img
                src={detailModalTrail.image}
                alt={detailModalTrail.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
              
              <button
                onClick={() => setDetailModalTrail(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-neutral-800 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#B68D40] text-black text-[10px] font-extrabold uppercase">
                    {detailModalTrail.region}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-900/90 text-gray-300 text-[10px] font-semibold border border-neutral-700">
                    {detailModalTrail.difficulty}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">{detailModalTrail.name}</h2>
              </div>
            </div>

            {/* Modal Body Specs */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Total Distance</span>
                  <p className="text-base font-extrabold text-white font-mono">{detailModalTrail.distanceKm} km</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Elevation Gain</span>
                  <p className="text-base font-extrabold text-amber-400 font-mono">+{detailModalTrail.elevationGain}m</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Max Altitude</span>
                  <p className="text-base font-extrabold text-[#B68D40] font-mono">{detailModalTrail.maxElevation}m</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Route Overview</h4>
                <p className="text-xs text-gray-300 leading-relaxed">{detailModalTrail.description}</p>
              </div>

              {/* Highlights */}
              {detailModalTrail.highlights && detailModalTrail.highlights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Key Highlights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailModalTrail.highlights.map((hl, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#B68D40] shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 pt-3 border-t border-neutral-900 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  handleTrailSelect(detailModalTrail, true);
                  setDetailModalTrail(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-bold flex items-center gap-2 transition"
              >
                <MapIcon className="h-4 w-4 text-[#B68D40]" />
                <span>Focus on 2D/3D Map</span>
              </button>

              <Link
                href={`/trails/${detailModalTrail.slug || detailModalTrail.id}`}
                className="px-5 py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition"
              >
                <span>View Full Itinerary & Booking</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function UnifiedDiscoveryHub(props: UnifiedDiscoveryHubProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-[#B68D40] text-sm">
          Loading Himalayan Discovery Hub...
        </div>
      }
    >
      <UnifiedDiscoveryHubContent {...props} />
    </Suspense>
  );
}
