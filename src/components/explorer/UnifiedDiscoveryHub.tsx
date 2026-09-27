'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
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
  CheckCircle2,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { Trail, Landmark } from '@/types';
import { ROUTE_TRACKS } from '@/data/routeTracks';
import ElevationProfileChart from '@/components/map/ElevationProfileChart';
import FloatingMapPanel from '@/components/ui/FloatingMapPanel';

// Clean and standardize trail names for compact HUD presentation
export function getCleanTrailName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\s+Trek$/i, '')
    .replace(/\s+&\s+Thorong\s+La$/i, '')
    .replace(/\s+&\s+Kyanjin\s+Ri$/i, '')
    .replace(/\s+Forbidden\s+Kingdom$/i, '')
    .replace(/\s+&\s+Tashi\s+Lapcha\s+Pass$/i, '')
    .trim();
}

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

interface SidebarQuickSpecsProps {
  trail: Trail;
  onBack: () => void;
  onFocusMap: () => void;
}

function SidebarQuickSpecs({ trail, onBack, onFocusMap }: SidebarQuickSpecsProps) {
  return (
    <div data-slot="base" className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200">
      {/* Back button & Title bar */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-[#B68D40] transition py-1 px-2 rounded-lg hover:bg-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Trail List</span>
        </button>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/30 font-bold">
          Quick Specs
        </span>
      </div>

      {/* Image & Header Overlay */}
      <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-lg">
        <img
          src={trail.image}
          alt={trail.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        
        <div className="absolute top-2.5 right-2.5">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black text-gray-300 hover:text-white transition"
            title="Close specs"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-[#B68D40] text-black text-[10px] font-extrabold uppercase">
              {trail.region}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-900/90 text-gray-200 text-[10px] font-semibold border border-neutral-700">
              {trail.difficulty}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400">
            {trail.durationDays} Days
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5">
        <h3 className="text-lg font-black text-white">{trail.name}</h3>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">{trail.description}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Distance</span>
          <p className="text-sm font-extrabold text-white font-mono">{trail.distanceKm} km</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Elev Gain</span>
          <p className="text-sm font-extrabold text-amber-400 font-mono">+{trail.elevationGain}m</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Max Alt</span>
          <p className="text-sm font-extrabold text-[#B68D40] font-mono">{trail.maxElevation}m</p>
        </div>
      </div>

      {/* Highlights */}
      {trail.highlights && trail.highlights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Key Highlights</h4>
          <div className="space-y-1.5">
            {trail.highlights.map((hl, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#B68D40] shrink-0 mt-0.5" />
                <span>{hl}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          onClick={onFocusMap}
          className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[#B68D40] text-xs font-bold flex items-center justify-center gap-2 transition"
        >
          <MapIcon className="h-4 w-4" />
          <span>Focus on 2D/3D Map</span>
        </button>

        <Link
          href={`/trails/${trail.slug || trail.id}`}
          className="w-full py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition"
        >
          <span>View Full Itinerary & Booking</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
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
  const [showTrailSwitcher, setShowTrailSwitcher] = useState<boolean>(true);
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(true);

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

  // Deduplicate trail entries for floating Trail Selector HUD
  const uniqueHudTrails = useMemo(() => {
    const seenKeys = new Set<string>();
    const seenNames = new Set<string>();
    const result: Trail[] = [];
    for (const t of trails) {
      const clean = getCleanTrailName(t.name).toLowerCase();
      const key = (t.slug || t.id || clean).trim();
      if (!seenKeys.has(key) && !seenNames.has(clean)) {
        seenKeys.add(key);
        seenNames.add(clean);
        result.push(t);
      }
    }
    return result;
  }, [trails]);

  const activeTrail = selectedTrail || (hoveredTrailId ? trails.find((t: Trail) => t.id === hoveredTrailId) : trails[0]) || null;

  const hasActiveFilters = selectedRegion !== 'All' || selectedDifficulty !== 'All' || searchQuery !== '' || maxAltitude < 6000;
  const resetFilters = () => {
    setSelectedRegion('All');
    setSelectedDifficulty('All');
    setSearchQuery('');
    setMaxAltitude(6000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-black text-white overflow-hidden relative">
      
      {/* 1. DISCOVERY HUB TOP NAVIGATION & FILTER BAR */}
      <header className="bg-neutral-950 border-b border-neutral-800 shrink-0 z-20">
        
        {/* ROW 1: PRIMARY CONTROLS (Search, Layout switcher, Engine switcher) */}
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-900">
          {/* Navigator Title & Search */}
          <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
            <div className="hidden sm:flex items-center gap-1.5 text-[#B68D40] font-black text-xs uppercase tracking-wider shrink-0">
              <Compass className="h-4 w-4" />
              <span>Navigator</span>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trails, peaks, passes, valleys..."
                className="w-full pl-9 pr-8 py-1.5 rounded-full bg-neutral-900 border border-neutral-700/80 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#B68D40] transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: View Layout Switcher + Map Engine Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Layout Toggle (Split Screen, Full Map, Grid View) */}
            <div className="flex items-center p-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold">
              <button
                onClick={() => setLayoutMode('split')}
                className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                  layoutMode === 'split' ? 'bg-[#B68D40] text-black shadow font-bold' : 'text-gray-400 hover:text-white'
                }`}
                title="Split Screen View"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Split</span>
              </button>

              <button
                onClick={() => setLayoutMode('mapOnly')}
                className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                  layoutMode === 'mapOnly' ? 'bg-[#B68D40] text-black shadow font-bold' : 'text-gray-400 hover:text-white'
                }`}
                title="Full Map View"
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Full Map</span>
              </button>

              <button
                onClick={() => setLayoutMode('cardsOnly')}
                className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                  layoutMode === 'cardsOnly' ? 'bg-[#B68D40] text-black shadow font-bold' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid Catalog View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Grid</span>
              </button>
            </div>

            {/* Map Engine Toggle: 2D Leaflet vs 3D Free Roam vs 3D Summit Tours */}
            <div className="flex items-center p-0.5 rounded-full bg-neutral-900 border border-[#B68D40]/30 text-xs font-semibold shadow-lg">
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
          </div>
        </div>

      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* A. LEFT PANEL — COMPACT NAVIGATOR HUB (25% width, SPLIT MODE) */}
        {layoutMode === 'split' && (
          <div className={`${leftPanelOpen ? 'w-full lg:w-[25%]' : 'w-10'} h-full border-r border-neutral-800 bg-neutral-950 flex flex-col shrink-0 transition-all duration-300`}>

            {/* ── Hub Header — title + inline filters ── */}
            <div className="shrink-0 border-b border-neutral-800">
              {/* Title row */}
              <div className="flex items-center justify-between px-2.5 py-2">
                {leftPanelOpen && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Compass className="h-3.5 w-3.5 text-[#B68D40] shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B68D40] truncate">Navigator</span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-gray-400 font-mono text-[9px] border border-neutral-700 shrink-0">
                      {filteredTrails.length}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setLeftPanelOpen((v) => !v)}
                  className="p-1 rounded-md text-gray-500 hover:text-[#B68D40] hover:bg-neutral-900 transition ml-auto shrink-0"
                  title={leftPanelOpen ? 'Collapse' : 'Expand'}
                >
                  {leftPanelOpen ? <ChevronDown className="h-3 w-3 -rotate-90" /> : <ChevronDown className="h-3 w-3 rotate-90" />}
                </button>
              </div>

              {/* Inline filters row */}
              {leftPanelOpen && (
                <div className="px-2.5 pb-2 flex items-center gap-1.5">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="flex-1 min-w-0 px-1.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-gray-300 focus:outline-none focus:border-[#B68D40] cursor-pointer truncate"
                  >
                    <option value="All">All Regions</option>
                    <option value="Everest">Everest</option>
                    <option value="Annapurna">Annapurna</option>
                    <option value="Langtang">Langtang</option>
                    <option value="Manaslu">Manaslu</option>
                    <option value="Mustang">Mustang</option>
                    <option value="Rolwaling">Rolwaling</option>
                    <option value="Kanchenjunga">Kangchenjunga</option>
                  </select>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="flex-1 min-w-0 px-1.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-gray-300 focus:outline-none focus:border-[#B68D40] cursor-pointer truncate"
                  >
                    <option value="All">All Diff.</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Strenuous">Strenuous</option>
                    <option value="Challenging">Challenging</option>
                  </select>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="p-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-gray-400 hover:text-white transition shrink-0"
                      title="Reset"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Trail Navigator List ── */}
            {leftPanelOpen && (
            <div className="flex-1 overflow-y-auto">
              {detailModalTrail ? (
                <SidebarQuickSpecs
                  trail={detailModalTrail}
                  onBack={() => setDetailModalTrail(null)}
                  onFocusMap={() => {
                    handleTrailSelect(detailModalTrail, true);
                  }}
                />
              ) : (
                <>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[#B68D40] gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-[10px]">Loading...</span>
                    </div>
                  ) : filteredTrails.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-[10px] px-3">
                      No trails match filters.
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-800/60">
                      {filteredTrails.map((trail) => {
                        const isSelected = activeTrail?.id === trail.id;
                        const isSaved = savedTrails.includes(trail.id);

                        return (
                          <div
                            key={trail.id}
                            onClick={() => handleTrailSelect(trail)}
                            onMouseEnter={() => handleTrailCardHover(trail)}
                            className={`group flex items-center gap-2 px-2.5 py-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#B68D40]/10 border-l-2 border-l-[#B68D40]'
                                : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                            }`}
                          >
                            {/* Tiny thumbnail */}
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                              <img
                                src={trail.image}
                                alt={trail.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-[11px] font-bold truncate ${isSelected ? 'text-[#B68D40]' : 'text-white group-hover:text-[#E2C085]'} transition`}>
                                {trail.name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-mono mt-0.5">
                                <span>{trail.distanceKm}km</span>
                                <span className="text-[#B68D40]">{trail.maxElevation}m</span>
                                <span>{trail.durationDays}d</span>
                              </div>
                            </div>

                            {/* Action icons — appear on hover */}
                            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveTrail(trail.id);
                                }}
                                className="p-1 rounded text-gray-500 hover:text-red-400 transition"
                                title="Save"
                              >
                                <Heart className={`h-3 w-3 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailModalTrail(trail);
                                }}
                                className="p-1 rounded text-gray-500 hover:text-[#B68D40] transition"
                                title="Quick Specs"
                              >
                                <Info className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
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
          <div className="flex-1 h-full relative overflow-hidden flex flex-col justify-between">
            
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

              {/* ─────────────────────────────────────────── */}
              {/* TRAIL SWITCHER HUD — top-left inside map    */}
              {/* ─────────────────────────────────────────── */}
              {showTrailSwitcher && (
                <div className="absolute top-3 left-3 z-[999] max-w-[calc(100%-6rem)]">
                  <FloatingMapPanel
                    id="trail-switcher-hud"
                    title="Trail Selector"
                    icon={<TrendingUp className="h-3.5 w-3.5 text-[#B68D40]" />}
                    allowDrag={true}
                    allowResize={false}
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
                      {uniqueHudTrails.map((t: Trail) => {
                        const isSelected = activeTrail?.id === t.id;
                        const cleanName = getCleanTrailName(t.name);
                        const formattedElevation = t.maxElevation
                          ? `${t.maxElevation.toLocaleString()}m`
                          : '';
                        return (
                          <button
                            key={t.id}
                            data-slot="trail-button"
                            data-trail-id={t.id}
                            aria-pressed={isSelected}
                            onClick={() => handleTrailSelect(t)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                              isSelected
                                ? 'bg-[#B68D40] text-black font-bold shadow-md'
                                : 'text-gray-300 hover:bg-neutral-800 hover:text-white'
                            }`}
                            title={`${cleanName} (${formattedElevation}) — ${t.region}`}
                          >
                            <span>{cleanName}</span>
                            {formattedElevation && (
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                  isSelected
                                    ? 'bg-black/20 text-black font-extrabold'
                                    : 'bg-neutral-800 text-[#B68D40]'
                                }`}
                              >
                                {formattedElevation}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </FloatingMapPanel>
                </div>
              )}

              {/* Restore trail switcher button */}
              {!showTrailSwitcher && (
                <button
                  onClick={() => setShowTrailSwitcher(true)}
                  className="absolute top-3 left-3 z-[999] px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-[#B68D40]/50 text-[#B68D40] hover:text-white hover:bg-black font-bold text-xs flex items-center gap-1.5 shadow-xl transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Trails</span>
                </button>
              )}

              {/* ─────────────────────────────────────────────────── */}
              {/* ALTITUDE PROFILE — always visible, mid-bottom glass */}
              {/* ─────────────────────────────────────────────────── */}
              {activeTrail && (
                <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none flex justify-center px-2 pb-2">
                  <div
                    data-slot="altitude-bar"
                    className="pointer-events-auto w-full max-w-4xl rounded-2xl overflow-hidden backdrop-blur-xl bg-black/60 border border-white/10 shadow-2xl shadow-black/60"
                  >
                    <ElevationProfileChart
                      trail={activeTrail}
                      onClose={() => {/* no-op — altitude bar is always visible */}}
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
                        setFocusedCoords([
                          base[0] + (ratio - 0.5) * 0.08,
                          base[1] + (ratio - 0.5) * 0.08
                        ]);
                      }}
                    />
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* 4. SLIDE-OVER SIDEBAR FOR QUICK SPECS (WHEN NOT IN SPLIT MODE) */}
      {layoutMode !== 'split' && detailModalTrail && (
        <div className="fixed top-28 right-0 bottom-0 w-full sm:w-[420px] z-50 bg-neutral-950/95 border-l border-neutral-800 shadow-2xl backdrop-blur-2xl p-5 overflow-y-auto animate-in slide-in-from-right duration-200">
          <SidebarQuickSpecs
            trail={detailModalTrail}
            onBack={() => setDetailModalTrail(null)}
            onFocusMap={() => {
              handleTrailSelect(detailModalTrail, true);
              setLayoutMode('split');
            }}
          />
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
