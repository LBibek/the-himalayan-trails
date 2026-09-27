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
  RotateCcw,
  LayoutList,
  Grid,
  Eye,
  Activity
} from 'lucide-react';
import { Trail, Landmark } from '@/types';
import { ROUTE_TRACKS } from '@/data/routeTracks';
import ElevationProfileChart from '@/components/map/ElevationProfileChart';
import FloatingMapPanel from '@/components/ui/FloatingMapPanel';
import { HIMALAYAN_SUMMITS, SUMMIT_TOURS, ApexSummit } from '@/data/summitTours';

// Himalayan regional coordinate presets for one-click navigator camera fly-to
export const REGION_FOCUS_COORDS: Record<string, { center: [number, number]; zoom: number }> = {
  'All': { center: [28.2500, 85.4000], zoom: 7.5 },
  'Everest': { center: [27.9881, 86.9250], zoom: 10.5 },
  'Annapurna': { center: [28.6000, 83.9500], zoom: 10 },
  'Langtang': { center: [28.2000, 85.4500], zoom: 11 },
  'Manaslu': { center: [28.4500, 84.6500], zoom: 10.5 },
  'Mustang': { center: [29.0000, 83.8500], zoom: 10 },
  'Rolwaling': { center: [27.8800, 86.4200], zoom: 10.5 },
  'Kanchenjunga': { center: [27.7025, 88.1475], zoom: 10.5 },
};

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
  const [sidebarView, setSidebarView] = useState<'card' | 'list'>('card');
  const [sidebarTab, setSidebarTab] = useState<'trails' | 'hud'>('trails');
  const [activeSummit, setActiveSummit] = useState<string | null>(null);

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

        {/* A. LEFT PANEL — DYNAMIC GEOSPATIAL HUD & EXPEDITION NAVIGATOR (SPLIT MODE) */}
        {layoutMode === 'split' && (
          <div
            data-slot="navigator-sidebar"
            className={`${
              leftPanelOpen ? 'w-full lg:w-[28%] xl:w-[26%] min-w-[320px] max-w-[440px]' : 'w-12'
            } h-full border-r border-neutral-800 bg-neutral-950/95 backdrop-blur-xl flex flex-col shrink-0 transition-all duration-300 shadow-2xl z-20`}
          >
            {/* ── 1. HUD Status Bar & Mode Indicator ── */}
            <div className="shrink-0 border-b border-neutral-800/80 bg-neutral-950">
              <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-900">
                {leftPanelOpen && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Compass className="h-4 w-4 text-[#B68D40] shrink-0 animate-pulse" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-white truncate">
                          {mapEngine === '2d'
                            ? '2D Geospatial'
                            : mapEngine === '3d-summit-tours'
                            ? 'Summit Tours'
                            : '3D Globe'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/30 font-mono text-[9px] font-bold">
                          HUD
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {leftPanelOpen && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full truncate">
                    {focusedCoords
                      ? `${focusedCoords[0].toFixed(2)}°N, ${focusedCoords[1].toFixed(2)}°E`
                      : '27.83°N, 86.74°E'}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setLeftPanelOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#B68D40] hover:bg-neutral-900 transition ml-auto shrink-0"
                  title={leftPanelOpen ? 'Collapse HUD' : 'Expand HUD'}
                >
                  {leftPanelOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                  )}
                </button>
              </div>

              {/* ── 2. Navigation Mode Tabs: Trails Catalog vs Geospatial HUD ── */}
              {leftPanelOpen && (
                <div className="px-3 py-2 flex items-center justify-between gap-2 bg-neutral-900/60">
                  <div className="flex items-center p-0.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSidebarTab('trails')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                        sidebarTab === 'trails'
                          ? 'bg-[#B68D40] text-black shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Mountain className="h-3 w-3" />
                      <span>Expeditions ({filteredTrails.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSidebarTab('hud')}
                      className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                        sidebarTab === 'hud'
                          ? 'bg-[#B68D40] text-black shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Layers className="h-3 w-3" />
                      <span>Navigator</span>
                    </button>
                  </div>

                  {/* Card vs List View Toggle (When in Trails mode) */}
                  {sidebarTab === 'trails' && (
                    <div className="flex items-center p-0.5 rounded-lg bg-neutral-950 border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setSidebarView('card')}
                        className={`p-1 rounded-md transition ${
                          sidebarView === 'card'
                            ? 'bg-[#B68D40] text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title="Card View (Large Cards with Specs)"
                      >
                        <Grid className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSidebarView('list')}
                        className={`p-1 rounded-md transition ${
                          sidebarView === 'list'
                            ? 'bg-[#B68D40] text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title="List View (Compact Rows)"
                      >
                        <LayoutList className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 3. Main Sidebar Body Content ── */}
            {leftPanelOpen && (
              <div className="flex-1 overflow-y-auto">
                {/* A. If Quick Specs is active for a trail, render SidebarQuickSpecs */}
                {detailModalTrail ? (
                  <div className="p-3">
                    <SidebarQuickSpecs
                      trail={detailModalTrail}
                      onBack={() => setDetailModalTrail(null)}
                      onFocusMap={() => {
                        handleTrailSelect(detailModalTrail, true);
                      }}
                    />
                  </div>
                ) : sidebarTab === 'hud' ? (
                  /* B. Geospatial HUD View (Adapted for 2D, 3D Roam, 3D Summit Tours) */
                  <div className="p-3 space-y-4 animate-in fade-in duration-200">
                    {/* MODE 1: 2D Geospatial Navigator */}
                    {mapEngine === '2d' && (
                      <div className="space-y-4">
                        {/* 1. Regional Range Selector */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                              Select Himalayan Range:
                            </span>
                            <span className="text-[9px] text-[#B68D40] font-mono">
                              {selectedRegion} Active
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {Object.keys(REGION_FOCUS_COORDS).map((reg) => {
                              const isSelected =
                                selectedRegion.toLowerCase() === reg.toLowerCase() ||
                                (selectedRegion === 'All' && reg === 'All');
                              return (
                                <button
                                  key={reg}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRegion(reg);
                                    const target = REGION_FOCUS_COORDS[reg];
                                    if (target) setFocusedCoords(target.center);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition border flex items-center gap-1.5 ${
                                    isSelected
                                      ? 'bg-[#B68D40] text-black border-[#B68D40] shadow-md font-bold'
                                      : 'bg-neutral-900/90 text-gray-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                                  }`}
                                >
                                  <Layers className={`h-3 w-3 ${isSelected ? 'text-black' : 'text-[#B68D40]'}`} />
                                  <span className="truncate">{reg}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Apex Summits 8,000m+ Giants Fly-To */}
                        <div className="space-y-2 pt-2 border-t border-neutral-900">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                            Apex Summits (8,000m+ Giants):
                          </span>
                          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                            {HIMALAYAN_SUMMITS.map((summit: ApexSummit) => {
                              const isActive = activeSummit === summit.name;
                              return (
                                <button
                                  key={summit.name}
                                  type="button"
                                  onClick={() => {
                                    setActiveSummit(summit.name);
                                    setFocusedCoords([summit.coords.lat, summit.coords.lng]);
                                    setSelectedRegion(summit.region);
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition flex items-center justify-between border ${
                                    isActive
                                      ? 'bg-[#B68D40] text-black border-[#B68D40] font-bold shadow'
                                      : 'bg-neutral-900/80 text-gray-200 border-neutral-800 hover:border-neutral-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs">⛰️</span>
                                    <span>{summit.name}</span>
                                  </div>
                                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    isActive ? 'bg-black/20 text-black font-extrabold' : 'bg-neutral-800 text-amber-400'
                                  }`}>
                                    {summit.elevation}m
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3. Layer Mode Indicator */}
                        <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Active Map Engine:
                          </span>
                          <div className="flex items-center justify-between text-gray-300">
                            <span>OpenTopoMap Topo Layers</span>
                            <span className="text-emerald-400 font-mono text-[10px]">● Online</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed">
                            Contour isolines, high-altitude passes, and glacial moraines rendered dynamically.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* MODE 2: 3D Free Roam Globe HUD */}
                    {mapEngine === '3d-freeroam' && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#B68D40]">Cesium 3D Globe</span>
                            <span className="text-[10px] text-emerald-400 font-mono">60 FPS</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            Photorealistic 3D Himalayan terrain engine with global elevation mesh & satellite orthophotos.
                          </p>
                        </div>

                        {/* Apex Summit Fly-To */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                            Summit 3D Camera Teleport:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {HIMALAYAN_SUMMITS.slice(0, 6).map((summit: ApexSummit) => (
                              <button
                                key={summit.name}
                                type="button"
                                onClick={() => {
                                  setFocusedCoords([summit.coords.lat, summit.coords.lng]);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-gray-200 hover:border-[#B68D40] transition text-left"
                              >
                                <div className="font-bold truncate">{summit.name}</div>
                                <div className="text-[10px] font-mono text-[#B68D40]">{summit.elevation}m</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mode Action */}
                        <button
                          type="button"
                          onClick={() => setMapEngine('3d-summit-tours')}
                          className="w-full py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                        >
                          <Mountain className="h-4 w-4" />
                          <span>Launch 3D Summit Orbital Tours</span>
                        </button>
                      </div>
                    )}

                    {/* MODE 3: 3D Summit Tours Console */}
                    {mapEngine === '3d-summit-tours' && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-amber-400">Summit Orbital Tours</span>
                            <span className="text-[10px] text-amber-400 font-mono">Flight Active</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            Kinetic orbital fly-through featuring base camps, technical seracs, and summit ridges.
                          </p>
                        </div>

                        {/* Summit Tours List */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                            Select Peak Tour:
                          </span>
                          <div className="space-y-2">
                            {SUMMIT_TOURS.map((tour) => (
                              <div
                                key={tour.id}
                                className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-[#B68D40] transition space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-white">{tour.name}</h4>
                                  <span className="text-[10px] font-mono text-[#B68D40] font-bold">
                                    #{tour.rankInWorld} World
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 border-t border-neutral-800 pt-1.5">
                                  <div>Elevation: <strong className="text-white">{tour.elevation}m</strong></div>
                                  <div>Oxygen: <strong className="text-amber-400">{tour.oxygenAtSummitPercent}%</strong></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setMapEngine('2d')}
                          className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-gray-300 text-xs font-bold transition"
                        >
                          Return to 2D Topo Navigator
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* C. Expeditions Catalog List / Card View */
                  <div className="p-3 space-y-3">
                    {/* Inline Quick Filter Bar */}
                    <div className="space-y-2 pb-2 border-b border-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value)}
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-gray-300 focus:outline-none focus:border-[#B68D40] cursor-pointer"
                        >
                          <option value="All">All Regions</option>
                          <option value="Everest">Everest / Khumbu</option>
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
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-gray-300 focus:outline-none focus:border-[#B68D40] cursor-pointer"
                        >
                          <option value="All">All Difficulties</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Strenuous">Strenuous</option>
                          <option value="Challenging">Challenging</option>
                        </select>

                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white transition"
                            title="Reset filters"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-20 text-[#B68D40] gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-xs">Loading Trails...</span>
                      </div>
                    ) : filteredTrails.length === 0 ? (
                      <div className="text-center py-16 text-gray-500 text-xs">
                        No expeditions match the selected filters.
                      </div>
                    ) : sidebarView === 'card' ? (
                      /* ── 1. EXPANDED CARD VIEW (Rich HeroUI Cards with Quick Specs on Click) ── */
                      <div className="space-y-3">
                        {filteredTrails.map((trail) => {
                          const isSelected = activeTrail?.id === trail.id;
                          const isSaved = savedTrails.includes(trail.id);

                          return (
                            <div
                              key={trail.id}
                              onClick={() => {
                                handleTrailSelect(trail);
                                setDetailModalTrail(trail); // Click opens quick specs directly in sidebar!
                              }}
                              onMouseEnter={() => handleTrailCardHover(trail)}
                              className={`group cursor-pointer rounded-2xl border transition-all duration-200 overflow-hidden bg-neutral-900/70 hover:bg-neutral-900 ${
                                isSelected
                                  ? 'border-[#B68D40] shadow-xl shadow-[#B68D40]/15'
                                  : 'border-neutral-800 hover:border-neutral-700'
                              }`}
                            >
                              {/* Card Image Banner */}
                              <div className="relative h-32 w-full overflow-hidden bg-neutral-800">
                                <img
                                  src={trail.image}
                                  alt={trail.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[#B68D40] text-[9px] font-bold border border-[#B68D40]/30 uppercase">
                                    {trail.region}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[9px] font-semibold border border-white/20">
                                    {trail.difficulty}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSaveTrail(trail.id);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 backdrop-blur-md text-white hover:text-red-500 transition"
                                >
                                  <Heart
                                    className={`h-3.5 w-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`}
                                  />
                                </button>

                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono text-amber-400 font-bold border border-amber-500/20">
                                  {trail.durationDays} Days
                                </div>
                              </div>

                              {/* Card Info */}
                              <div className="p-3 space-y-2">
                                <h4 className="text-sm font-bold text-white group-hover:text-[#E2C085] transition truncate">
                                  {trail.name}
                                </h4>

                                <div className="grid grid-cols-3 gap-1 py-1.5 px-2 rounded-xl bg-neutral-950 border border-neutral-900 text-center text-[10px]">
                                  <div>
                                    <span className="text-gray-500 block text-[9px] uppercase">Dist</span>
                                    <span className="font-mono font-bold text-white">{trail.distanceKm}km</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 block text-[9px] uppercase">Gain</span>
                                    <span className="font-mono font-bold text-amber-400">+{trail.elevationGain}m</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 block text-[9px] uppercase">Max</span>
                                    <span className="font-mono font-bold text-[#B68D40]">{trail.maxElevation}m</span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-xs">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTrailSelect(trail);
                                      setDetailModalTrail(trail);
                                    }}
                                    className="text-[#B68D40] text-[11px] font-bold flex items-center gap-1 hover:underline"
                                  >
                                    <Info className="h-3 w-3" />
                                    <span>Quick Specs</span>
                                  </button>

                                  <Link
                                    href={`/trails/${trail.slug || trail.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-gray-300 hover:text-white flex items-center gap-1 text-[11px] font-semibold"
                                  >
                                    <span>Details</span>
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* ── 2. COMPACT LIST VIEW ── */
                      <div className="divide-y divide-neutral-900 rounded-2xl border border-neutral-900 overflow-hidden bg-neutral-900/50">
                        {filteredTrails.map((trail) => {
                          const isSelected = activeTrail?.id === trail.id;
                          const isSaved = savedTrails.includes(trail.id);

                          return (
                            <div
                              key={trail.id}
                              onClick={() => {
                                handleTrailSelect(trail);
                                setDetailModalTrail(trail); // Click opens quick specs directly in sidebar!
                              }}
                              onMouseEnter={() => handleTrailCardHover(trail)}
                              className={`group flex items-center gap-2.5 p-2.5 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[#B68D40]/15 border-l-2 border-l-[#B68D40]'
                                  : 'hover:bg-neutral-900 border-l-2 border-l-transparent'
                              }`}
                            >
                              <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                                <img
                                  src={trail.image}
                                  alt={trail.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`text-xs font-bold truncate ${
                                    isSelected
                                      ? 'text-[#B68D40]'
                                      : 'text-white group-hover:text-[#E2C085]'
                                  } transition`}
                                >
                                  {trail.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                                  <span>{trail.distanceKm}km</span>
                                  <span className="text-amber-400">+{trail.elevationGain}m</span>
                                  <span className="text-[#B68D40]">{trail.maxElevation}m</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailModalTrail(trail);
                                }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-[#B68D40] transition"
                                title="Quick Specs"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
                  hideHeaderControls={true}
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
