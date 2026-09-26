'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Mountain, Search, Star, Clock, Gauge, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { Trail } from '@/types';

// Dynamically load LeafletMap without SSR
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-neutral-900 animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-2xl">
      Loading Leaflet Interactive Trails Map...
    </div>
  )
});

export default function TrailsViewPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [maxAltitude, setMaxAltitude] = useState<number>(6000);
  const [showMap, setShowMap] = useState<boolean>(true);

  const regions = ['All', 'Everest', 'Annapurna', 'Langtang', 'Manaslu', 'Mustang', 'Rolwaling'];
  const difficulties = ['All', 'Moderate', 'Strenuous', 'Challenging'];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedRegion !== 'All') params.set('region', selectedRegion);
    if (selectedDifficulty !== 'All') params.set('difficulty', selectedDifficulty);
    if (maxAltitude) params.set('maxElevation', maxAltitude.toString());
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    fetch(`/api/trails?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch trails`);
        return res.json();
      })
      .then((data: Trail[]) => {
        if (isMounted) {
          setTrails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error communicating with persistent backend');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedRegion, selectedDifficulty, maxAltitude]);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 bg-black text-white">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B68D40]/20 border border-[#B68D40]/40 text-[#B68D40] text-xs font-semibold uppercase tracking-wider">
            <Mountain className="h-3.5 w-3.5" />
            <span>Himalayan Trails View</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-white">
            Curated Himalayan Trail Directory
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
            Live database-persisted trail routes, high pass GPS elevations, and Leaflet interactive overlays.
          </p>
        </div>

        <button
          onClick={() => setShowMap(!showMap)}
          className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-semibold text-[#B68D40] hover:bg-neutral-800 transition"
        >
          {showMap ? 'Hide Leaflet Map' : 'Show Leaflet Map'}
        </button>
      </div>

      {/* LEAFLET INTERACTIVE MAP PREVIEW */}
      {showMap && (
        <div className="rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
          <LeafletMap selectedRegion={selectedRegion} height="h-[420px]" />
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trails by name, valley, or pass..."
              className="w-full rounded-xl bg-black border border-neutral-800 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-[#B68D40] focus:outline-none"
            />
          </div>

          {/* Region dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full rounded-xl bg-black border border-neutral-800 py-2.5 px-3 text-xs text-white focus:border-[#B68D40] focus:outline-none"
            >
              {regions.map((r) => (
                <option key={r} value={r}>Region: {r}</option>
              ))}
            </select>
          </div>

          {/* Difficulty dropdown */}
          <div className="md:col-span-4">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full rounded-xl bg-black border border-neutral-800 py-2.5 px-3 text-xs text-white focus:border-[#B68D40] focus:outline-none"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>Difficulty: {d}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Altitude Range Slider */}
        <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#B68D40]" />
            <span>Max Elevation Filter: <strong className="text-[#B68D40]">{maxAltitude}m</strong></span>
          </div>
          <input
            type="range"
            min="3000"
            max="6000"
            step="100"
            value={maxAltitude}
            onChange={(e) => setMaxAltitude(Number(e.target.value))}
            className="w-full sm:w-64 accent-[#B68D40] cursor-pointer"
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#B68D40]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm font-medium">Fetching real trail catalog from database...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Trails Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trails.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500">
              No matching trails found for current filter criteria.
            </div>
          ) : (
            trails.map((trail) => (
              <div
                key={trail.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden hover:border-[#B68D40]/50 transition-all group flex flex-col justify-between"
              >
                <div>
                  <Link href={`/trails/${trail.slug || trail.id}`} className="block relative h-48 w-full overflow-hidden bg-black">
                    <img
                      src={trail.image}
                      alt={trail.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#E2C085] border border-[#B68D40]/30">
                      {trail.region}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-400 border border-neutral-800 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span>{trail.rating}</span>
                    </div>
                  </Link>

                  <div className="p-5 space-y-3">
                    <Link href={`/trails/${trail.slug || trail.id}`}>
                      <h3 className="text-lg font-bold text-white group-hover:text-[#E2C085] transition-colors">
                        {trail.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {trail.description}
                    </p>

                    {/* Highlights tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {trail.highlights.slice(0, 2).map((h) => (
                        <span key={h} className="text-[10px] px-2 py-0.5 rounded bg-black text-gray-300 border border-neutral-800">
                          • {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-white font-semibold">
                        <Clock className="h-3.5 w-3.5 text-[#B68D40]" />
                        {trail.durationDays} Days
                      </span>
                      <span>{trail.distanceKm} km</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/trails/${trail.slug || trail.id}`}
                        className="inline-flex items-center gap-1 text-[#E2C085] font-bold text-xs hover:underline"
                      >
                        <span>View Trek</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href="/map"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-white font-medium text-xs transition"
                      >
                        <span>MAP</span>
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
