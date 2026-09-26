'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
  Globe
} from 'lucide-react';
import { Trail } from '@/types';
import { ROUTE_TRACKS } from '@/data/routeTracks';
import ElevationProfileChart from '@/components/map/ElevationProfileChart';

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

export default function AllTrailsExplorePage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [maxAltitude, setMaxAltitude] = useState<number>(6000);
  const [layoutMode, setLayoutMode] = useState<'split' | 'mapOnly' | 'cardsOnly'>('split');
  const [mapEngine, setMapEngine] = useState<'2d' | '3d'>('2d');
  
  // Active Selected / Hovered Trail for Elevation Profile & Map Focus
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [hoveredTrailId, setHoveredTrailId] = useState<string | null>(null);
  const [focusedCoords, setFocusedCoords] = useState<[number, number] | undefined>(undefined);
  const [savedTrails, setSavedTrails] = useState<string[]>([]);
  const [showElevationProfile, setShowElevationProfile] = useState<boolean>(true);

  React.useEffect(() => {
    fetch('/api/trails')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Trail[]) => {
        setTrails(data);
        if (data.length > 0 && !selectedTrail) {
          setSelectedTrail(data[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter Trails
  const filteredTrails = trails.filter((trail) => {
    const matchesSearch = trail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          trail.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          trail.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || trail.region === selectedRegion;
    const matchesDiff = selectedDifficulty === 'All' || trail.difficulty === selectedDifficulty;
    const matchesAlt = trail.maxElevation <= maxAltitude;
    return matchesSearch && matchesRegion && matchesDiff && matchesAlt;
  });

  const toggleSaveTrail = (id: string) => {
    setSavedTrails((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTrailSelect = (trail: Trail) => {
    setSelectedTrail(trail);
    setHoveredTrailId(trail.id);
    const track = ROUTE_TRACKS[trail.id];
    if (track && track.coords.length) {
      const midIdx = Math.floor(track.coords.length / 2);
      setFocusedCoords(track.coords[midIdx]);
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
      
      {/* 1. ALLTRAILS TOP NAVIGATION & FILTER BAR */}
      <header className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 z-20">
        
        {/* Left Search Bar */}
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, park, or trail name..."
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

        {/* View Layout Toggle */}
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

        {/* Map Engine Toggle: 2D Leaflet vs 3D Cesium */}
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
            onClick={() => setMapEngine('3d')}
            className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
              mapEngine === '3d' ? 'bg-[#B68D40] text-black font-bold shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>3D Cesium</span>
          </button>
        </div>

      </header>

      {/* 2. SPLIT SCREEN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT SIDEBAR: TRAIL CARDS LIST (40% width in split mode) */}
        {(layoutMode === 'split' || layoutMode === 'cardsOnly') && (
          <div className={`h-full overflow-y-auto p-4 space-y-4 bg-neutral-950 border-r border-neutral-800 ${
            layoutMode === 'split' ? 'w-full lg:w-[42%] flex-shrink-0' : 'w-full max-w-7xl mx-auto'
          }`}>
            
            {/* Header info count */}
            <div className="flex items-center justify-between text-xs text-gray-400 border-b border-neutral-900 pb-3">
              <span className="font-semibold text-white">
                Showing {filteredTrails.length} Himalayan Trails in Nepal
              </span>
              <span className="text-[11px] text-[#B68D40] font-mono">Synced with Leaflet Map</span>
            </div>

            {/* Trail Cards */}
            <div className={`grid gap-4 ${layoutMode === 'cardsOnly' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredTrails.map((trail) => {
                const isSelected = activeTrail?.id === trail.id;
                const isSaved = savedTrails.includes(trail.id);

                return (
                  <div
                    key={trail.id}
                    onClick={() => handleTrailSelect(trail)}
                    onMouseEnter={() => handleTrailCardHover(trail)}
                    className={`rounded-2xl border transition-all duration-300 bg-black overflow-hidden group flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#B68D40] shadow-xl shadow-[#B68D40]/20 ring-2 ring-[#B68D40]/30'
                        : 'border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      {/* Card Thumbnail Image & Badges */}
                      <div className="relative h-44 w-full overflow-hidden bg-neutral-900">
                        <img
                          src={trail.image}
                          alt={trail.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        
                        {/* Rating Pill */}
                        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-400 border border-neutral-800 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{trail.rating}</span>
                          <span className="text-gray-400 font-normal">({trail.reviewsCount})</span>
                        </div>

                        {/* Favorite Bookmark Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveTrail(trail.id);
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-neutral-800 flex items-center justify-center transition hover:scale-110"
                        >
                          <Heart className={`h-4 w-4 ${isSaved ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} />
                        </button>

                        {/* Difficulty Badge */}
                        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider text-gray-300 border border-neutral-800">
                          {trail.difficulty}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-2">
                        <div className="text-[11px] font-semibold text-[#B68D40] uppercase tracking-wider">
                          {trail.region} Region
                        </div>

                        <h3 className="text-base font-bold text-white group-hover:text-[#B68D40] transition-colors leading-snug">
                          {trail.name}
                        </h3>

                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {trail.description}
                        </p>

                        {/* AllTrails Specs Metrics Row */}
                        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-gray-300 font-semibold border-t border-neutral-900">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-[10px]">Length:</span>
                            <span>{trail.distanceKm} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-[10px]">Elev Gain:</span>
                            <span className="text-amber-400">+{trail.elevationGain}m</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-[10px]">Est. Time:</span>
                            <span>{trail.durationDays} Days</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-4 pt-0">
                      <div className="pt-3 border-t border-neutral-900 flex items-center justify-between text-xs">
                        <span className="text-[#B68D40] text-[11px] font-semibold flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          View Profile Graph
                        </span>
                        <Link
                          href="/itinerary/planner"
                          className="text-gray-300 font-bold hover:text-[#B68D40] flex items-center gap-1"
                        >
                          <span>Plan Trek</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* RIGHT FULLSCREEN INTERACTIVE LEAFLET MAP CANVAS (60% width in split mode) */}
        {(layoutMode === 'split' || layoutMode === 'mapOnly') && (
          <div className="flex-1 h-full relative flex flex-col justify-between">
            
            {/* MAP ENGINE CANVAS (2D LEAFLET OR 3D CESIUM GLOBE) */}
            <div className="flex-1 relative w-full h-full">
              {mapEngine === '2d' ? (
                <LeafletMap
                  selectedRegion={selectedRegion}
                  focusedCoords={focusedCoords}
                  activeTrailId={activeTrail?.id}
                  height="h-full"
                />
              ) : (
                <CesiumGlobeMap
                  height="h-full"
                  activeTrail={activeTrail}
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
            <div className="absolute bottom-16 left-4 z-[999] flex items-center gap-1.5 p-1.5 bg-black/85 border border-neutral-800 backdrop-blur-md rounded-2xl text-xs">
              <span className="text-[10px] text-gray-400 uppercase font-semibold px-2">Select Elevation Profile:</span>
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

          </div>
        )}

      </div>

      {/* 3. BOTTOM ALTITUDE ELEVATION PROFILE LINE GRAPH DRAWER */}
      {activeTrail && showElevationProfile && (
        <div className="z-30 relative border-t border-neutral-800">
          <ElevationProfileChart
            trail={activeTrail}
            onClose={() => setShowElevationProfile(false)}
            onHoverPoint={(pt) => {
              if (!pt || !activeTrail) {
                setFocusedCoords(undefined);
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
      {!showElevationProfile && activeTrail && (
        <button
          onClick={() => setShowElevationProfile(true)}
          className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full bg-[#B68D40] text-black font-bold text-xs flex items-center gap-2 shadow-2xl hover:bg-[#c99e4b] transition"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Show Altitude Line Graph</span>
        </button>
      )}

    </div>
  );
}
