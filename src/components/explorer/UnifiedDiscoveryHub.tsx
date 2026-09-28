'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
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
  Activity,
  Share2,
  Route,
  Download,
  AlertCircle,
  Plane,
  CloudSun,
  Sun,
  Moon,
} from 'lucide-react';
import { Trail, Landmark, Itinerary, ItineraryDay, HimalayanRange } from '@/types';
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

// Compute accurate center coordinates for any trail (route tracks, routeCoordinates, or region preset)
export function getTrailCenterCoords(trail: Trail): [number, number] | undefined {
  if (!trail) return undefined;
  const track = ROUTE_TRACKS[trail.id];
  if (track && track.coords && track.coords.length > 0) {
    const midIdx = Math.floor(track.coords.length / 2);
    return track.coords[midIdx];
  }
  if (trail.routeCoordinates && trail.routeCoordinates.length > 0) {
    const midIdx = Math.floor(trail.routeCoordinates.length / 2);
    return [trail.routeCoordinates[midIdx][0], trail.routeCoordinates[midIdx][1]];
  }
  if (trail.region && REGION_FOCUS_COORDS[trail.region]) {
    return REGION_FOCUS_COORDS[trail.region].center;
  }
  return undefined;
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
  onToggleSave?: (trailId: string) => void;
  isSaved?: boolean;
}

function getDifficultyBadge(diff: string) {
  const d = diff?.toLowerCase() || '';
  if (d.includes('easy')) return { label: 'Easy', bg: 'bg-emerald-500 text-white' };
  if (d.includes('mod')) return { label: 'Moderate', bg: 'bg-amber-500 text-black' };
  if (d.includes('stren') || d.includes('hard')) return { label: 'Hard', bg: 'bg-orange-600 text-white' };
  return { label: 'Strenuous', bg: 'bg-rose-600 text-white' };
}

function getTrailRouteType(name: string): string {
  const n = name?.toLowerCase() || '';
  if (n.includes('circuit') || n.includes('loop') || n.includes('traverse')) return 'Loop';
  if (n.includes('pass') || n.includes('to')) return 'Point to point';
  return 'Out & back';
}

function getEstimatedHikingHours(distanceKm: number, difficulty: string): number {
  const speed = difficulty?.toLowerCase().includes('stren') ? 2.5 : 3.2;
  return Math.round((distanceKm / speed) * 10) / 10;
}

function SidebarQuickSpecs({
  trail,
  onBack,
  onFocusMap,
  onToggleSave,
  isSaved = false,
}: SidebarQuickSpecsProps) {
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const diffBadge = getDifficultyBadge(trail.difficulty);
  const routeType = getTrailRouteType(trail.name);
  const estHours = getEstimatedHikingHours(trail.distanceKm, trail.difficulty);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/trails/${trail.slug || trail.id}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownloadGPX = () => {
    const coords = trail.routeCoordinates && trail.routeCoordinates.length > 0
      ? trail.routeCoordinates
      : ROUTE_TRACKS[trail.id]?.coords || [];
    
    const trackPoints = coords.map((c) => `
      <trkpt lat="${c[0]}" lon="${c[1]}">
        <ele>${c[2] || trail.maxElevation}</ele>
        <time>${new Date().toISOString()}</time>
      </trkpt>`).join('');

    const gpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="The Himalayan Trails" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${trail.name}</name>
    <desc>${trail.description}</desc>
  </metadata>
  <trk>
    <name>${trail.name}</name>
    <trkseg>${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trail.slug || 'himalayan-trail'}-route.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const estSummitTemp = Math.round(15 - ((trail.maxElevation - 1400) / 1000) * 6.5);

  return (
    <div data-slot="base" className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200 pb-4">
      {/* 1. Header Toolbar — Back, Share, Save, Close */}
      <div data-slot="header" className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
        <button
          type="button"
          data-slot="trigger"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-[#B68D40] transition py-1 px-2 rounded-lg hover:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/30 font-bold">
          Quick Specs
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-slot="trigger"
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
            title="Share trail"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>

          {onToggleSave && (
            <button
              type="button"
              data-slot="trigger"
              onClick={() => onToggleSave(trail.id)}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-red-500 transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
              title="Save trail"
            >
              <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          )}

          <button
            type="button"
            data-slot="trigger"
            onClick={onBack}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white transition ml-0.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
            title="Close specs"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {copied && (
        <div className="text-[11px] text-center text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 py-1 rounded-xl">
          Trail link copied to clipboard!
        </div>
      )}

      {/* BODY CONTENT CONTAINER */}
      <div data-slot="body" className="space-y-4">
        {/* 2. Hero Image Banner with AllTrails Overlays */}
        <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-xl group">
          <img
            src={trail.image}
            alt={trail.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

          {/* Top Badges: Difficulty & Stars */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-md ${diffBadge.bg}`}>
              {diffBadge.label}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold border border-white/20 flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span>{(trail.rating || 4.8).toFixed(1)}</span>
              <span className="text-gray-400">({trail.reviewsCount || 86})</span>
            </span>
          </div>

          {/* Bottom Badge: Duration */}
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono font-bold text-amber-400 border border-amber-500/20">
            {trail.durationDays} Days Expedition
          </div>
        </div>

        {/* 3. Title & Region Breadcrumb */}
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white leading-tight">{trail.name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5 text-[#B68D40] shrink-0" />
            <span className="truncate">{trail.region} National Park • Bagmati / Gandaki, Nepal</span>
          </div>
        </div>

        {/* 4. AllTrails Signature 4-Box Key Stats Grid */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-left">
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-900">
            <span className="text-[9px] text-gray-400 uppercase font-semibold block">Length</span>
            <p className="text-sm font-extrabold text-white font-mono mt-0.5">{trail.distanceKm} km</p>
          </div>
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-900">
            <span className="text-[9px] text-gray-400 uppercase font-semibold block">Elevation Gain</span>
            <p className="text-sm font-extrabold text-amber-400 font-mono mt-0.5">
              +{trail.elevationGain || (trail.maxElevation - 1500).toLocaleString()} m
            </p>
          </div>
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-900">
            <span className="text-[9px] text-gray-400 uppercase font-semibold block">Route Type</span>
            <p className="text-xs font-bold text-white mt-0.5">{routeType}</p>
          </div>
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-900">
            <span className="text-[9px] text-gray-400 uppercase font-semibold block">Est. Time</span>
            <p className="text-xs font-bold text-[#B68D40] font-mono mt-0.5">
              {estHours} hrs ({trail.durationDays}d)
            </p>
          </div>
        </div>

        {/* 5. AllTrails Feature Tag Chips */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
            Trail Features:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-gray-300">
              🏔️ Mountain Views
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-gray-300">
              🌸 Wildflowers
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-gray-300">
              🌲 Forest Trail
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-gray-300">
              💧 River & Waterfalls
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-gray-300">
              🏛️ Sacred Monastery
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-gray-300">
              🏕️ Teahouses Available
            </span>
          </div>
        </div>

        {/* 6. Trail Condition & Live Weather Telemetry Banner */}
        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1.5 text-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <CloudSun className="h-3.5 w-3.5 text-[#B68D40]" />
              <span>Apex Weather Telemetry</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {estSummitTemp <= -5 ? `${estSummitTemp}°C Alpine Freeze` : `${estSummitTemp}°C Clear & Crisp`}
            </span>
          </div>
          <div className="text-[11px] text-gray-300 flex items-center justify-between border-t border-neutral-800/80 pt-1.5">
            <span className="text-gray-400">Summit Forecast:</span>
            <span className="font-semibold text-white">
              {estSummitTemp <= -5 ? 'Freezing Temperatures • High Wind Chill' : 'Clear Visibility • Favorable Climbing'}
            </span>
          </div>
          <div className="text-[11px] text-gray-300 flex items-center justify-between">
            <span className="text-gray-400">Best Season:</span>
            <span className="font-semibold text-white">
              {trail.bestMonths && trail.bestMonths.length > 0
                ? trail.bestMonths.join(', ')
                : 'March - May, Sept - Nov'}
            </span>
          </div>
          <div className="text-[11px] text-gray-300 flex items-center justify-between">
            <span className="text-gray-400">Permits Required:</span>
            <span className="font-semibold text-amber-400">TIMS & National Park</span>
          </div>
        </div>

        {/* 7. Route Altitude Progression Profile */}
        <div className="p-2.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
            Altitude Progression:
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
            <div className="p-1.5 rounded-xl bg-neutral-950 border border-neutral-900">
              <span className="text-gray-500 block text-[9px]">Start</span>
              <span className="font-bold text-gray-300 truncate block">{trail.startPoint}</span>
            </div>
            <div className="p-1.5 rounded-xl bg-neutral-950 border border-[#B68D40]/30">
              <span className="text-[#B68D40] block text-[9px] font-bold">Apex Peak</span>
              <span className="font-extrabold text-amber-400 block">{trail.maxElevation.toLocaleString()}m</span>
            </div>
            <div className="p-1.5 rounded-xl bg-neutral-950 border border-neutral-900">
              <span className="text-gray-500 block text-[9px]">Finish</span>
              <span className="font-bold text-gray-300 truncate block">{trail.endPoint}</span>
            </div>
          </div>
        </div>

        {/* 8. Description with Read More Toggle */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Overview</h4>
          <p className={`text-xs text-gray-300 leading-relaxed ${showFullDesc ? '' : 'line-clamp-3'}`}>
            {trail.description}
          </p>
          {trail.description && trail.description.length > 140 && (
            <button
              type="button"
              data-slot="trigger"
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-[11px] font-bold text-[#B68D40] hover:underline focus-visible:outline-none"
            >
              {showFullDesc ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* 9. Key Highlights */}
        {trail.highlights && trail.highlights.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-neutral-900">
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
      </div>

      {/* 10. Actions & GPX Export (Footer) */}
      <div data-slot="footer" className="pt-2 space-y-2 border-t border-neutral-900">
        <button
          type="button"
          data-slot="trigger"
          onClick={onFocusMap}
          className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[#B68D40] text-xs font-bold flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
        >
          <MapIcon className="h-4 w-4" />
          <span>Focus on 2D/3D Map</span>
        </button>

        <button
          type="button"
          data-slot="trigger"
          onClick={handleDownloadGPX}
          className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
        >
          <Download className="h-3.5 w-3.5 text-gray-400" />
          <span>Download GPX Track</span>
        </button>

        <Link
          href={`/trails/${trail.slug || trail.id}`}
          data-slot="trigger"
          className="w-full py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <span>View Full Trail Guide & Book Expedition</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

interface LandmarkQuickSpecsProps {
  landmark: Landmark;
  onBack: () => void;
  onFocusMap: () => void;
}

function LandmarkQuickSpecs({ landmark, onBack, onFocusMap }: LandmarkQuickSpecsProps) {
  const estLapseTemp = Math.round(15 - ((landmark.elevation - 1400) / 1000) * 6.5);
  return (
    <div data-slot="base" className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200 pb-4">
      {/* 1. Header Toolbar */}
      <div data-slot="header" className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
        <button
          type="button"
          data-slot="trigger"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-[#B68D40] transition py-1 px-2 rounded-lg hover:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
          {landmark.category || 'Landmark'}
        </span>

        <button
          type="button"
          data-slot="trigger"
          onClick={onBack}
          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
          title="Close specs"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 2. Body Container */}
      <div data-slot="body" className="space-y-4">
        {landmark.image && (
          <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-xl group">
            <img
              src={landmark.image}
              alt={landmark.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[#B68D40] text-[10px] font-bold border border-[#B68D40]/30 uppercase">
              {landmark.region || 'Himalayan Ridge'}
            </div>
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono font-bold text-amber-400 border border-amber-500/20">
              {landmark.elevation}m Altitude
            </div>
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white leading-tight">{landmark.name}</h3>
          {landmark.nativeName && (
            <p className="text-xs text-[#B68D40] font-medium">{landmark.nativeName}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5 text-[#B68D40] shrink-0" />
            <span>{landmark.region || 'Nepal'} • {landmark.coordinates.lat.toFixed(4)}°N, {landmark.coordinates.lng.toFixed(4)}°E</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-left">
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-900">
            <span className="text-[9px] text-gray-400 uppercase font-semibold block">Elevation</span>
            <p className="text-sm font-extrabold text-amber-400 font-mono mt-0.5">{landmark.elevation.toLocaleString()} m</p>
          </div>
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-900">
            <span className="text-[9px] text-gray-400 uppercase font-semibold block">Category</span>
            <p className="text-xs font-bold text-white mt-0.5">{landmark.category}</p>
          </div>
        </div>

        {/* Live Weather Telemetry */}
        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1.5 text-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <CloudSun className="h-3.5 w-3.5 text-[#B68D40]" />
              <span>Apex Weather Telemetry</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {estLapseTemp <= 0 ? `${estLapseTemp}°C Sub-Zero Alpine` : `${estLapseTemp}°C Crisp Mountain Air`}
            </span>
          </div>
          <div className="text-[11px] text-gray-300 flex items-center justify-between border-t border-neutral-800/80 pt-1.5">
            <span className="text-gray-400">Permit Status:</span>
            <span className="font-semibold text-amber-400">{landmark.permitRequired || 'Standard Park Permit'}</span>
          </div>
          {landmark.associatedTrail && (
            <div className="text-[11px] text-gray-300 flex items-center justify-between">
              <span className="text-gray-400">Associated Expedition:</span>
              <span className="font-semibold text-white truncate max-w-[160px]">{landmark.associatedTrail}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {landmark.description && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Overview</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {landmark.description}
            </p>
          </div>
        )}
      </div>

      {/* 3. Footer */}
      <div data-slot="footer" className="pt-2 space-y-2 border-t border-neutral-900">
        <button
          type="button"
          data-slot="trigger"
          onClick={onFocusMap}
          className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[#B68D40] text-xs font-bold flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
        >
          <MapIcon className="h-4 w-4" />
          <span>Focus on 2D/3D Map</span>
        </button>
      </div>
    </div>
  );
}

interface SummitQuickSpecsProps {
  summit: ApexSummit;
  onBack: () => void;
  onFocusMap: () => void;
  onLaunchTour?: () => void;
}

function SummitQuickSpecs({
  summit,
  onBack,
  onFocusMap,
  onLaunchTour,
}: SummitQuickSpecsProps) {
  const matchingTour = SUMMIT_TOURS.find(
    (t) =>
      t.name.toLowerCase().includes(summit.name.toLowerCase()) ||
      summit.name.toLowerCase().includes(t.name.toLowerCase())
  );

  const oxygenPercent = matchingTour?.oxygenAtSummitPercent ?? Math.round(100 * Math.exp(-summit.elevation / 7200));
  const estSummitTemp = matchingTour?.summitTempC ?? Math.round(15 - (summit.elevation / 1000) * 6.5);
  const isDeathZone = summit.elevation >= 8000;

  return (
    <div data-slot="base" className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200 pb-4">
      {/* 1. Header Toolbar */}
      <div data-slot="header" className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
        <button
          type="button"
          data-slot="trigger"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-[#B68D40] transition py-1 px-2 rounded-lg hover:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-bold ${
          isDeathZone
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        }`}>
          {isDeathZone ? '☠️ 8,000m+ Death Zone' : 'Apex Summit'}
        </span>

        <button
          type="button"
          data-slot="trigger"
          onClick={onBack}
          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
          title="Close specs"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 2. Body Container */}
      <div data-slot="body" className="space-y-4">
        {matchingTour?.coverImage && (
          <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-xl group">
            <img
              src={matchingTour.coverImage}
              alt={summit.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[#B68D40] text-[10px] font-bold border border-[#B68D40]/30 uppercase">
              {summit.region} Massif
            </div>
            {matchingTour.rankInWorld && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-[#B68D40]/90 text-black text-[10px] font-extrabold uppercase shadow">
                #{matchingTour.rankInWorld} Earth
              </div>
            )}
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono font-bold text-amber-400 border border-amber-500/20">
              {summit.elevation.toLocaleString()}m Altitude
            </div>
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white leading-tight">{summit.name}</h3>
          {matchingTour?.nativeName && (
            <p className="text-xs text-[#B68D40] font-medium">{matchingTour.nativeName}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5 text-[#B68D40] shrink-0" />
            <span>{summit.region} Range • {summit.coords.lat.toFixed(4)}°N, {summit.coords.lng.toFixed(4)}°E</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-left">
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-900">
            <span className="text-[9px] text-gray-400 uppercase font-semibold block">Apex Elevation</span>
            <p className="text-xs font-extrabold text-amber-400 font-mono mt-0.5">{summit.elevation.toLocaleString()}m</p>
          </div>
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-900">
            <span className="text-[9px] text-gray-400 uppercase font-semibold block">Effective O₂</span>
            <p className="text-xs font-extrabold text-emerald-400 font-mono mt-0.5">{oxygenPercent}% sea level</p>
          </div>
          <div className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-900">
            <span className="text-[9px] text-gray-400 uppercase font-semibold block">Lapse Temp</span>
            <p className="text-xs font-extrabold text-sky-400 font-mono mt-0.5">{estSummitTemp}°C</p>
          </div>
        </div>

        {/* Live Weather & Hypoxia Telemetry */}
        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1.5 text-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <CloudSun className="h-3.5 w-3.5 text-[#B68D40]" />
              <span>Apex Weather & Hypoxia Telemetry</span>
            </span>
            <span className={`text-[10px] font-mono font-bold ${isDeathZone ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isDeathZone ? 'High Hypoxia Danger' : 'Sub-Apex Alpine'}
            </span>
          </div>
          <div className="text-[11px] text-gray-300 flex items-center justify-between border-t border-neutral-800/80 pt-1.5">
            <span className="text-gray-400">Summit Winds:</span>
            <span className="font-semibold text-white">
              {matchingTour?.summitWindKmh ? `${matchingTour.summitWindKmh} km/h Jet Stream` : '40-60 km/h Alpine Gusts'}
            </span>
          </div>
          {matchingTour?.firstAscenders && (
            <div className="text-[11px] text-gray-300 flex flex-col gap-0.5 border-t border-neutral-800/80 pt-1.5">
              <span className="text-gray-400">First Ascent ({matchingTour.firstAscentYear}):</span>
              <span className="font-semibold text-white text-[10px] leading-tight">{matchingTour.firstAscenders}</span>
            </div>
          )}
        </div>

        {/* Historical Overview */}
        {matchingTour?.historicalOverview && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mountaineering History</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {matchingTour.historicalOverview}
            </p>
          </div>
        )}
      </div>

      {/* 3. Footer */}
      <div data-slot="footer" className="pt-2 space-y-2 border-t border-neutral-900">
        {matchingTour && onLaunchTour && (
          <button
            type="button"
            data-slot="trigger"
            onClick={onLaunchTour}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#B68D40] to-amber-500 hover:from-[#c99e4b] hover:to-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Mountain className="h-4 w-4 fill-black" />
            <span>Launch 3D Summit Orbital Tour</span>
          </button>
        )}

        <button
          type="button"
          data-slot="trigger"
          onClick={onFocusMap}
          className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[#B68D40] text-xs font-bold flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
        >
          <MapIcon className="h-4 w-4" />
          <span>Focus on 2D/3D Map</span>
        </button>
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
  const urlSearch = searchParams.get('search') || searchParams.get('q');

  const [trails, setTrails] = useState<Trail[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [ranges, setRanges] = useState<HimalayanRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [maxAltitude, setMaxAltitude] = useState<number>(6000);
  const [layoutMode, setLayoutMode] = useState<'split' | 'mapOnly' | 'cardsOnly'>(urlLayout || defaultLayout);
  const [mapEngine, setMapEngine] = useState<'2d' | '3d-freeroam' | '3d-summit-tours' | '3d-drone-flight'>('2d');
  const [perspective, setPerspective] = useState<'topo' | 'ridge' | 'summit'>('ridge');
  const [timeOfDay, setTimeOfDay] = useState<'sunrise' | 'midday' | 'sunset' | 'night'>('midday');
  const [droneDistanceKm, setDroneDistanceKm] = useState<number | null>(null);
  
  // Active Selected / Hovered Trail for Elevation Profile & Map Focus
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [selectedSummit, setSelectedSummit] = useState<ApexSummit | null>(null);
  const [activeSummitTourSlug, setActiveSummitTourSlug] = useState<string>(urlTour || 'everest');
  const [hoveredTrailId, setHoveredTrailId] = useState<string | null>(null);
  const [focusedCoords, setFocusedCoords] = useState<[number, number] | undefined>(undefined);
  const [savedTrails, setSavedTrails] = useState<string[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [activeItineraryDay, setActiveItineraryDay] = useState<number | null>(null);
  const [showTrailSwitcher, setShowTrailSwitcher] = useState<boolean>(true);
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(true);
  const [sidebarView, setSidebarView] = useState<'card' | 'list'>('card');
  const [sidebarTab, setSidebarTab] = useState<'trails' | 'hud'>('trails');
  const [activeSummit, setActiveSummit] = useState<string | null>(null);
  const [showElevationProfile, setShowElevationProfile] = useState<boolean>(true);
  const [weatherOverlay, setWeatherOverlay] = useState<'none' | 'radar' | 'clouds'>('none');

  // Quick Detail Modal / Slide-Over State
  const [detailModalTrail, setDetailModalTrail] = useState<Trail | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  // Synchronize URL search queries with instant map focus and trail/landmark selection
  useEffect(() => {
    if (urlSearch && trails.length > 0) {
      const q = urlSearch.trim().toLowerCase();
      const matchTrail = trails.find(
        (t) => t.name.toLowerCase() === q || t.slug.toLowerCase() === q
      ) || trails.find((t) => t.name.toLowerCase().includes(q));

      if (matchTrail) {
        handleTrailSelect(matchTrail, true);
        return;
      }

      const matchSummit = HIMALAYAN_SUMMITS.find(
        (s) => s.name.toLowerCase().includes(q)
      );
      if (matchSummit) {
        setActiveSummit(matchSummit.name);
        setSelectedSummit(matchSummit);
        setFocusedCoords([matchSummit.coords.lat, matchSummit.coords.lng]);
        setSelectedRegion(matchSummit.region);
        setSidebarTab('hud');
        return;
      }

      if (landmarks.length > 0) {
        const matchLandmark = landmarks.find(
          (lm) => lm.name.toLowerCase().includes(q)
        );
        if (matchLandmark) {
          setSelectedLandmark(matchLandmark);
          setFocusedCoords([matchLandmark.coordinates.lat, matchLandmark.coordinates.lng]);
          if (matchLandmark.region) setSelectedRegion(matchLandmark.region);
          setSidebarTab('hud');
        }
      }
    }
  }, [urlSearch, trails, landmarks]);

  useEffect(() => {
    if (urlLayout) {
      setLayoutMode(urlLayout);
    }
  }, [urlLayout]);

  useEffect(() => {
    if (urlMode === 'drone-flight' || urlMode === 'drone') {
      setMapEngine('3d-drone-flight');
    } else if (urlMode === 'summit-tours' || urlTour) {
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

  // Single centralized source of truth: fetch trails, itineraries, landmarks, and ranges ONCE
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

    fetch('/api/itineraries')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Itinerary[]) => {
        if (Array.isArray(data)) {
          setItineraries(data);
        }
      })
      .catch((err) => console.warn('Failed to load itineraries in Discovery Hub:', err));

    fetch('/api/landmarks')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Landmark[]) => {
        if (Array.isArray(data)) {
          setLandmarks(data);
        }
      })
      .catch((err) => console.warn('Failed to load landmarks in Discovery Hub:', err));

    fetch('/api/ranges')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: HimalayanRange[]) => {
        if (Array.isArray(data)) {
          setRanges(data);
        }
      })
      .catch((err) => console.warn('Failed to load ranges in Discovery Hub:', err));
  }, [urlTrail]);

  // Match urlLandmark from centralized landmarks (no duplicate network requests)
  useEffect(() => {
    if (urlLandmark && landmarks.length > 0) {
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
    }
  }, [urlLandmark, landmarks]);

  // Compute matching itinerary for current active expedition
  const activeItinerary = useMemo(() => {
    const current = selectedTrail || (trails.length > 0 ? trails[0] : null);
    if (!current || !itineraries.length) return null;
    const tName = current.name.toLowerCase();
    const tSlug = (current.slug || current.id).toLowerCase();
    return (
      itineraries.find((it) => {
        const itTrail = it.trailName.toLowerCase();
        const itTitle = it.title.toLowerCase();
        return (
          itTrail.includes(tName) ||
          tName.includes(itTrail) ||
          itTrail.includes(tSlug) ||
          itTitle.includes(tName)
        );
      }) || null
    );
  }, [selectedTrail, trails, itineraries]);

  const handleSelectItineraryDay = (day: ItineraryDay, coords?: [number, number]) => {
    setActiveItineraryDay(day.day);
    if (coords) {
      setFocusedCoords(coords);
    }
    if (activeItinerary?.days) {
      let cumDist = 0;
      for (const d of activeItinerary.days) {
        cumDist += d.distanceKm || 10;
        if (d.day === day.day) break;
      }
      setDroneDistanceKm(cumDist);
    }
  };

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

  // Real-time categorized search filtering across trails, summits, passes, and landmarks
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { trails: [], summits: [], passes: [], landmarks: [] };

    const matchingTrails = trails.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );

    const matchingSummits = HIMALAYAN_SUMMITS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    );

    const matchingPasses = landmarks.filter(
      (lm) =>
        (lm.category === 'High Pass' || lm.name.toLowerCase().includes('pass')) &&
        (lm.name.toLowerCase().includes(q) || (lm.region && lm.region.toLowerCase().includes(q)))
    );

    const matchingLandmarks = landmarks.filter(
      (lm) =>
        lm.category !== 'High Pass' &&
        !lm.name.toLowerCase().includes('pass') &&
        (lm.name.toLowerCase().includes(q) ||
          (lm.category && lm.category.toLowerCase().includes(q)) ||
          (lm.region && lm.region.toLowerCase().includes(q)))
    );

    return {
      trails: matchingTrails,
      summits: matchingSummits,
      passes: matchingPasses,
      landmarks: matchingLandmarks,
    };
  }, [searchQuery, trails, landmarks]);

  const totalSearchMatches =
    searchResults.trails.length +
    searchResults.summits.length +
    searchResults.passes.length +
    searchResults.landmarks.length;

  const handleSelectSearchResult = (
    type: 'trail' | 'summit' | 'pass' | 'landmark',
    item: any
  ) => {
    setSearchOpen(false);
    if (type === 'trail') {
      const trail = item as Trail;
      handleTrailSelect(trail, true);
      setDetailModalTrail(trail);
      setSelectedLandmark(null);
      setSelectedSummit(null);
      if (trail.region) setSelectedRegion(trail.region);
      const center = getTrailCenterCoords(trail);
      if (center) {
        setFocusedCoords(center);
      }
    } else if (type === 'summit') {
      const summit = item as ApexSummit;
      setActiveSummit(summit.name);
      setSelectedSummit(summit);
      setFocusedCoords([summit.coords.lat, summit.coords.lng]);
      setSelectedRegion(summit.region);
      setSelectedLandmark(null);
      setDetailModalTrail(null);
      setLeftPanelOpen(true);
    } else {
      const lm = item as Landmark;
      setSelectedLandmark(lm);
      setSelectedSummit(null);
      setDetailModalTrail(null);
      setFocusedCoords([lm.coordinates.lat, lm.coordinates.lng]);
      if (lm.region) setSelectedRegion(lm.region);
      setSidebarTab('hud');
      setLeftPanelOpen(true);
    }
  };

  const toggleSaveTrail = (id: string) => {
    setSavedTrails((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTrailSelect = (trail: Trail, switchMode = false) => {
    setSelectedTrail(trail);
    setHoveredTrailId(trail.id);
    setSelectedLandmark(null);
    setSelectedSummit(null);
    setActiveItineraryDay(1);
    const center = getTrailCenterCoords(trail);
    if (center) {
      setFocusedCoords(center);
    }
    if (switchMode && layoutMode === 'cardsOnly') {
      setLayoutMode('split');
    }
  };

  const handleTrailCardHover = (trail: Trail) => {
    setHoveredTrailId(trail.id);
    const center = getTrailCenterCoords(trail);
    if (center) {
      setFocusedCoords(center);
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

            <div className="relative w-full" ref={searchContainerRef}>
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 z-10" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchOpen(false);
                }}
                placeholder="Search trails, peaks, passes, valleys..."
                className="w-full pl-9 pr-8 py-1.5 rounded-full bg-neutral-900 border border-neutral-700/80 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#B68D40] transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-white z-10"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Real-time categorized search dropdown */}
              {searchOpen && searchQuery.trim().length > 0 && (
                <div
                  data-slot="search-results"
                  className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-2xl bg-neutral-950/95 border border-[#B68D40]/40 shadow-2xl backdrop-blur-2xl p-2 z-50 divide-y divide-neutral-900 scrollbar-thin scrollbar-thumb-amber-500/20"
                >
                  {totalSearchMatches === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400">
                      No matching trails, peaks, passes, or landmarks found.
                    </div>
                  ) : (
                    <>
                      {/* 1. Trails */}
                      {searchResults.trails.length > 0 && (
                        <div className="py-1.5 first:pt-0">
                          <span className="text-[10px] text-[#B68D40] uppercase font-bold tracking-wider px-2 block mb-1">
                            Trails & Expeditions ({searchResults.trails.length})
                          </span>
                          <div className="space-y-0.5">
                            {searchResults.trails.slice(0, 5).map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                data-slot="trigger"
                                onClick={() => handleSelectSearchResult('trail', t)}
                                className="w-full px-2 py-1.5 rounded-xl hover:bg-white/10 text-left flex items-center justify-between transition group focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="text-xs font-bold text-white group-hover:text-[#E2C085] truncate">
                                    {t.name}
                                  </div>
                                  <div className="text-[10px] text-gray-400 truncate">
                                    {t.region} • {t.distanceKm} km • {t.durationDays}d
                                  </div>
                                </div>
                                <span className="text-[10px] font-mono text-amber-400 shrink-0">
                                  {t.maxElevation}m
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Apex Summits */}
                      {searchResults.summits.length > 0 && (
                        <div className="py-1.5">
                          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider px-2 block mb-1">
                            Apex Peaks & Summits ({searchResults.summits.length})
                          </span>
                          <div className="space-y-0.5">
                            {searchResults.summits.slice(0, 4).map((s) => (
                              <button
                                key={s.name}
                                type="button"
                                data-slot="trigger"
                                onClick={() => handleSelectSearchResult('summit', s)}
                                className="w-full px-2 py-1.5 rounded-xl hover:bg-white/10 text-left flex items-center justify-between transition group focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                  <Mountain className="h-3 w-3 text-[#B68D40] shrink-0" />
                                  <span className="text-xs font-bold text-white group-hover:text-[#E2C085] truncate">
                                    {s.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400">({s.region})</span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                                  {s.elevation}m
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. High Passes */}
                      {searchResults.passes.length > 0 && (
                        <div className="py-1.5">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider px-2 block mb-1">
                            High Altitude Passes ({searchResults.passes.length})
                          </span>
                          <div className="space-y-0.5">
                            {searchResults.passes.slice(0, 4).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                data-slot="trigger"
                                onClick={() => handleSelectSearchResult('pass', p)}
                                className="w-full px-2 py-1.5 rounded-xl hover:bg-white/10 text-left flex items-center justify-between transition group focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                  <span className="text-xs">🚩</span>
                                  <span className="text-xs font-bold text-white group-hover:text-[#E2C085] truncate">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400">({p.region || 'Himalayas'})</span>
                                </div>
                                <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                                  {p.elevation}m
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Landmarks & POIs */}
                      {searchResults.landmarks.length > 0 && (
                        <div className="py-1.5 last:pb-0">
                          <span className="text-[10px] text-sky-400 uppercase font-bold tracking-wider px-2 block mb-1">
                            Monasteries & Base Camps ({searchResults.landmarks.length})
                          </span>
                          <div className="space-y-0.5">
                            {searchResults.landmarks.slice(0, 4).map((lm) => (
                              <button
                                key={lm.id}
                                type="button"
                                data-slot="trigger"
                                onClick={() => handleSelectSearchResult('landmark', lm)}
                                className="w-full px-2 py-1.5 rounded-xl hover:bg-white/10 text-left flex items-center justify-between transition group focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                  <MapPin className="h-3 w-3 text-[#B68D40] shrink-0" />
                                  <span className="text-xs font-bold text-white group-hover:text-[#E2C085] truncate">
                                    {lm.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400">({lm.category || 'Landmark'})</span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-300 shrink-0">
                                  {lm.elevation}m
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
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

            {/* Map Engine Toggle: 2D Leaflet vs 3D Free Roam vs 3D Drone Flight vs 3D Summit Tours */}
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
                onClick={() => setMapEngine('3d-drone-flight')}
                className={`px-3 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                  mapEngine === '3d-drone-flight' ? 'bg-[#B68D40] text-black font-bold shadow' : 'text-gray-400 hover:text-white'
                }`}
                title="3D Alpine Drone Flight Simulator"
              >
                <Plane className="h-3.5 w-3.5" />
                <span>Drone Flight</span>
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

            {/* Real-time Weather Radar Layer Toggle */}
            <div data-slot="weather-toggle" className="hidden sm:flex items-center p-0.5 rounded-full bg-neutral-900 border border-white/10 text-xs font-semibold shadow-lg">
              <span className="px-2 text-[10px] uppercase font-mono font-bold text-gray-400">Radar:</span>
              <button
                type="button"
                data-slot="trigger"
                data-pressed={weatherOverlay === 'none'}
                onClick={() => setWeatherOverlay('none')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                  weatherOverlay === 'none' ? 'bg-[#B68D40] text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                None
              </button>
              <button
                type="button"
                data-slot="trigger"
                data-pressed={weatherOverlay === 'radar'}
                onClick={() => setWeatherOverlay('radar')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                  weatherOverlay === 'radar' ? 'bg-[#B68D40] text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
                title="Real-Time Rain & Precipitation Radar"
              >
                <span>Rain Radar</span>
              </button>
              <button
                type="button"
                data-slot="trigger"
                data-pressed={weatherOverlay === 'clouds'}
                onClick={() => setWeatherOverlay('clouds')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                  weatherOverlay === 'clouds' ? 'bg-[#B68D40] text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
                title="Satellite Atmospheric Coverage & Clouds"
              >
                <span>Wind & Clouds</span>
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
                      onToggleSave={toggleSaveTrail}
                      isSaved={savedTrails.includes(detailModalTrail.id)}
                    />
                  </div>
                ) : selectedLandmark ? (
                  <div className="p-3">
                    <LandmarkQuickSpecs
                      landmark={selectedLandmark}
                      onBack={() => setSelectedLandmark(null)}
                      onFocusMap={() => {
                        setFocusedCoords([selectedLandmark.coordinates.lat, selectedLandmark.coordinates.lng]);
                      }}
                    />
                  </div>
                ) : selectedSummit ? (
                  <div className="p-3">
                    <SummitQuickSpecs
                      summit={selectedSummit}
                      onBack={() => setSelectedSummit(null)}
                      onFocusMap={() => {
                        setFocusedCoords([selectedSummit.coords.lat, selectedSummit.coords.lng]);
                      }}
                      onLaunchTour={() => {
                        const matchingTour = SUMMIT_TOURS.find(
                          (t) =>
                            t.name.toLowerCase().includes(selectedSummit.name.toLowerCase()) ||
                            selectedSummit.name.toLowerCase().includes(t.name.toLowerCase())
                        );
                        if (matchingTour) {
                          setActiveSummitTourSlug(matchingTour.slug);
                        }
                        setMapEngine('3d-summit-tours');
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
                                    setSelectedSummit(summit);
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

                        {/* 4. Quick Trail Selector HUD (Docked into Sidebar) */}
                        <div id="trail-switcher-hud" className="space-y-2 pt-2 border-t border-neutral-900">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                              Quick Trail Selector:
                            </span>
                            <span className="text-[9px] text-[#B68D40] font-mono">
                              {uniqueHudTrails.length} Tracks
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
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
                                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                                    isSelected
                                      ? 'bg-[#B68D40] text-black font-bold shadow-md'
                                      : 'bg-neutral-900/90 text-gray-300 border border-neutral-800 hover:border-neutral-700 hover:text-white'
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

                        {/* 1. Camera Perspective Presets & Reset */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                              Camera Perspective:
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const target = REGION_FOCUS_COORDS['All'] || { center: [28.25, 85.4] };
                                setFocusedCoords(target.center);
                                setSelectedRegion('All');
                              }}
                              className="text-[10px] text-gray-400 hover:text-[#B68D40] flex items-center gap-1 transition"
                              title="Reset 3D Camera"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Reset</span>
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              data-slot="trigger"
                              data-pressed={perspective === 'topo'}
                              onClick={() => setPerspective('topo')}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                                perspective === 'topo'
                                  ? 'bg-[#B68D40] text-black shadow'
                                  : 'bg-neutral-900 text-gray-300 border border-neutral-800 hover:text-white'
                              }`}
                            >
                              <span>Topo (90°)</span>
                            </button>
                            <button
                              type="button"
                              data-slot="trigger"
                              data-pressed={perspective === 'ridge'}
                              onClick={() => setPerspective('ridge')}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                                perspective === 'ridge'
                                  ? 'bg-[#B68D40] text-black shadow'
                                  : 'bg-neutral-900 text-gray-300 border border-neutral-800 hover:text-white'
                              }`}
                            >
                              <span>Ridge (45°)</span>
                            </button>
                            <button
                              type="button"
                              data-slot="trigger"
                              data-pressed={perspective === 'summit'}
                              onClick={() => setPerspective('summit')}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                                perspective === 'summit'
                                  ? 'bg-[#B68D40] text-black shadow'
                                  : 'bg-neutral-900 text-gray-300 border border-neutral-800 hover:text-white'
                              }`}
                            >
                              <span>Summit</span>
                            </button>
                          </div>
                        </div>

                        {/* 3D Sun & Alpenglow Lighting */}
                        <div className="space-y-2 pt-2 border-t border-neutral-900">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                              3D Sun & Lighting:
                            </span>
                            <span className="text-[9px] text-[#B68D40] font-mono capitalize font-bold">
                              {timeOfDay}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {(['sunrise', 'midday', 'sunset', 'night'] as const).map((time) => (
                              <button
                                key={time}
                                type="button"
                                data-slot="trigger"
                                data-pressed={timeOfDay === time}
                                onClick={() => setTimeOfDay(time)}
                                className={`py-1 px-1.5 rounded-xl text-[10px] font-bold capitalize transition flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                                  timeOfDay === time
                                    ? 'bg-[#B68D40] text-black shadow'
                                    : 'bg-neutral-900 text-gray-300 border border-neutral-800 hover:text-white'
                                }`}
                              >
                                <span>{time === 'sunrise' ? '🌅 Dawn' : time === 'midday' ? '☀️ Noon' : time === 'sunset' ? '🌄 Dusk' : '🌙 Night'}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Range Boundaries in 3D */}
                        <div className="space-y-2 pt-2 border-t border-neutral-900">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                            Explore Range Boundaries:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {Object.keys(REGION_FOCUS_COORDS).map((reg) => (
                              <button
                                key={reg}
                                type="button"
                                data-slot="trigger"
                                onClick={() => {
                                  setSelectedRegion(reg);
                                  const target = REGION_FOCUS_COORDS[reg];
                                  if (target) setFocusedCoords(target.center);
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition border text-left flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                                  selectedRegion.toLowerCase() === reg.toLowerCase() || (selectedRegion === 'All' && reg === 'All')
                                    ? 'bg-[#B68D40] text-black border-[#B68D40] font-bold shadow-md'
                                    : 'bg-neutral-900/90 text-gray-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                                }`}
                              >
                                <Layers className={`h-3 w-3 ${selectedRegion.toLowerCase() === reg.toLowerCase() || (selectedRegion === 'All' && reg === 'All') ? 'text-black' : 'text-[#B68D40]'}`} />
                                <span className="truncate">{reg}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Apex Summits in 3D */}
                        <div className="space-y-2 pt-2 border-t border-neutral-900">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                            Apex Summits (8,000m+ Giants):
                          </span>
                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {HIMALAYAN_SUMMITS.map((summit: ApexSummit) => {
                              const isActive = activeSummit === summit.name;
                              return (
                                <button
                                  key={summit.name}
                                  type="button"
                                  data-slot="trigger"
                                  onClick={() => {
                                    setActiveSummit(summit.name);
                                    setSelectedSummit(summit);
                                    setFocusedCoords([summit.coords.lat, summit.coords.lng]);
                                    setSelectedRegion(summit.region);
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition flex items-center justify-between border focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
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

                        {/* 4. Quick Trail Selector HUD in 3D Mode */}
                        <div className="space-y-2 pt-2 border-t border-neutral-900">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                              Quick Trail Selector (3D):
                            </span>
                            <span className="text-[9px] text-[#B68D40] font-mono">
                              {uniqueHudTrails.length} Tracks
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                            {uniqueHudTrails.map((t: Trail) => {
                              const isSelected = activeTrail?.id === t.id;
                              const cleanName = getCleanTrailName(t.name);
                              const formattedElevation = t.maxElevation
                                ? `${t.maxElevation.toLocaleString()}m`
                                : '';
                              return (
                                <button
                                  key={`3d-hud-${t.id}`}
                                  data-slot="trail-button"
                                  data-trail-id={t.id}
                                  aria-pressed={isSelected}
                                  onClick={() => handleTrailSelect(t)}
                                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                                    isSelected
                                      ? 'bg-[#B68D40] text-black font-bold shadow-md'
                                      : 'bg-neutral-900/90 text-gray-300 border border-neutral-800 hover:border-neutral-700 hover:text-white'
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
                        </div>

                        {/* Mode Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-neutral-900">
                          <button
                            type="button"
                            data-slot="trigger"
                            onClick={() => setMapEngine('3d-drone-flight')}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#B68D40] to-amber-500 hover:from-[#c99e4b] hover:to-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                          >
                            <Plane className="h-4 w-4 fill-black" />
                            <span>Launch 3D Drone Flight Simulator</span>
                          </button>

                          <button
                            type="button"
                            data-slot="trigger"
                            onClick={() => setMapEngine('3d-summit-tours')}
                            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-[#B68D40]/50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                          >
                            <Mountain className="h-4 w-4 text-[#B68D40]" />
                            <span>Launch 3D Summit Orbital Tours</span>
                          </button>

                          <button
                            type="button"
                            data-slot="trigger"
                            onClick={() => setMapEngine('2d')}
                            className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-gray-300 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                          >
                            Switch to 2D Topo Map
                          </button>
                        </div>
                      </div>
                    )}

                    {/* MODE 4: 3D Alpine Drone Flight Simulator */}
                    {mapEngine === '3d-drone-flight' && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-accent/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-accent">Drone Flight Simulator</span>
                            <span className="text-[10px] text-emerald-400 font-mono">Active</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            Photorealistic 3D drone trajectory navigation with Chase & Cockpit camera perspectives and Recharts elevation sync.
                          </p>
                        </div>

                        {activeTrail && (
                          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-1.5 text-xs">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Simulating Expedition:</span>
                            <div className="font-bold text-white text-sm">{activeTrail.name}</div>
                            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono text-gray-400">
                              <div>Distance: <strong className="text-white">{activeTrail.distanceKm}km</strong></div>
                              <div>Apex: <strong className="text-amber-400">{activeTrail.maxElevation}m</strong></div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 pt-2 border-t border-neutral-900">
                          <button
                            type="button"
                            onClick={() => setMapEngine('3d-freeroam')}
                            className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-gray-300 text-xs font-semibold transition"
                          >
                            Exit Drone Simulator to 3D Roam
                          </button>
                          <button
                            type="button"
                            onClick={() => setMapEngine('2d')}
                            className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-gray-300 text-xs font-semibold transition"
                          >
                            Switch to 2D Topo Map
                          </button>
                        </div>
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
                            {SUMMIT_TOURS.map((tour) => {
                              const isTourActive = activeSummitTourSlug === tour.slug;
                              return (
                                <button
                                  key={tour.id}
                                  type="button"
                                  data-slot="trigger"
                                  onClick={() => {
                                    setActiveSummitTourSlug(tour.slug);
                                    if (tour.waypoints[0]) {
                                      setFocusedCoords([tour.waypoints[0].coords.lat, tour.waypoints[0].coords.lng]);
                                    }
                                    setActiveSummit(tour.name);
                                  }}
                                  className={`w-full text-left p-3 rounded-2xl border transition space-y-2 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                                    isTourActive
                                      ? 'bg-neutral-900 border-[#B68D40] shadow-md shadow-[#B68D40]/20'
                                      : 'bg-neutral-900/90 border-neutral-800 hover:border-[#B68D40]/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <h4 className={`text-xs font-black ${isTourActive ? 'text-[#E2C085]' : 'text-white'}`}>
                                      {tour.name}
                                    </h4>
                                    <span className="text-[10px] font-mono text-[#B68D40] font-bold">
                                      #{tour.rankInWorld} World
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 border-t border-neutral-800 pt-1.5">
                                    <div>Elevation: <strong className="text-white">{tour.elevation}m</strong></div>
                                    <div>Oxygen: <strong className="text-amber-400">{tour.oxygenAtSummitPercent}%</strong></div>
                                  </div>
                                </button>
                              );
                            })}
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
                  landmarks={landmarks}
                  ranges={ranges}
                  onSelectRegion={(reg) => setSelectedRegion(reg)}
                  onSelectTrail={(trailId) => {
                    const match = trails.find((t) => t.id === trailId);
                    if (match) handleTrailSelect(match);
                  }}
                  onSelectLandmark={(lm) => {
                    setSelectedLandmark(lm);
                    setFocusedCoords([lm.coordinates.lat, lm.coordinates.lng]);
                    setSidebarTab('hud');
                    setLeftPanelOpen(true);
                  }}
                  itineraryDays={activeItinerary?.days}
                  activeItineraryDay={activeItineraryDay}
                  onSelectItineraryDay={handleSelectItineraryDay}
                  height="h-full"
                  hideHeaderControls={layoutMode === 'split'}
                  weatherOverlay={weatherOverlay}
                  onWeatherOverlayChange={setWeatherOverlay}
                />
              ) : (
                <CesiumGlobeMap
                  height="h-full"
                  activeTrail={activeTrail}
                  itineraryDays={activeItinerary?.days}
                  activeItineraryDay={activeItineraryDay}
                  onSelectItineraryDay={handleSelectItineraryDay}
                  weatherOverlay={weatherOverlay}
                  onWeatherOverlayChange={setWeatherOverlay}
                  mode={
                    mapEngine === '3d-drone-flight'
                      ? 'drone-flight'
                      : mapEngine === '3d-summit-tours'
                      ? 'summit-tours'
                      : 'freeroam'
                  }
                  initialSummitSlug={activeSummitTourSlug || urlTour || (selectedRegion.toLowerCase().includes('everest') ? 'everest' : selectedRegion.toLowerCase().includes('annapurna') ? 'annapurna' : selectedRegion.toLowerCase().includes('manaslu') ? 'manaslu' : 'everest')}
                  onSelectLandmark={(lm) => {
                    setSelectedLandmark(lm);
                    setFocusedCoords([lm.coordinates.lat, lm.coordinates.lng]);
                    setSidebarTab('hud');
                    setLeftPanelOpen(true);
                  }}
                  activeDistanceKm={droneDistanceKm}
                  onFlightTelemetry={(t) => {
                    setDroneDistanceKm(t.currentDistanceMeters / 1000);
                  }}
                  onSeekDistanceKm={(km) => {
                    setDroneDistanceKm(km);
                  }}
                  scrubberPoint={
                    focusedCoords
                      ? { lat: focusedCoords[0], lng: focusedCoords[1], altitude: 6000 }
                      : null
                  }
                  focusedCoords={focusedCoords}
                  selectedRegion={selectedRegion}
                  activeSummit={activeSummit}
                  ranges={ranges}
                  landmarks={landmarks}
                  perspective={perspective}
                  onPerspectiveChange={setPerspective}
                  trails={trails}
                  onSelectTrail={handleTrailSelect}
                  timeOfDay={timeOfDay}
                  onTimeOfDayChange={setTimeOfDay}
                  initialCenter={
                    focusedCoords
                      ? { lat: focusedCoords[0], lng: focusedCoords[1], altitude: 9000 }
                      : undefined
                  }
                  onClose3D={() => setMapEngine('2d')}
                  hideHUD={layoutMode === 'split' && mapEngine !== '3d-drone-flight'}
                />
              )}

              {/* ─────────────────────────────────────────────────── */}
              {/* ALTITUDE PROFILE — toggleable mid-bottom glass */}
              {/* ─────────────────────────────────────────────────── */}
              {activeTrail && showElevationProfile && (
                <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none flex justify-center px-2 pb-2">
                  <div
                    data-slot="altitude-bar"
                    className="pointer-events-auto w-full max-w-xl sm:max-w-2xl rounded-2xl overflow-hidden backdrop-blur-xl bg-black/80 border border-white/10 shadow-2xl shadow-black/60"
                  >
                    <ElevationProfileChart
                      trail={activeTrail}
                      itinerary={activeItinerary}
                      itineraryDays={activeItinerary?.days}
                      activeDayNumber={activeItineraryDay}
                      onSelectItineraryDay={handleSelectItineraryDay}
                      activeDistanceKm={droneDistanceKm}
                      onClose={() => setShowElevationProfile(false)}
                      onSelectPoint={(pt) => {
                        setDroneDistanceKm(pt.distanceKm);
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
                        setDroneDistanceKm(pt.distanceKm);
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

              {/* Floating trigger button to restore elevation profile if closed */}
              {activeTrail && !showElevationProfile && (
                <div className="absolute bottom-4 right-4 z-[1000] pointer-events-auto">
                  <button
                    onClick={() => setShowElevationProfile(true)}
                    data-slot="trigger"
                    className="px-3.5 py-2 rounded-2xl bg-neutral-950/85 hover:bg-neutral-900 border border-[#B68D40]/40 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl flex items-center gap-2 transition hover:scale-105"
                    title="Open Elevation Profile"
                  >
                    <Activity className="w-3.5 h-3.5 text-[#B68D40]" />
                    <span>Elevation Profile</span>
                  </button>
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
            onToggleSave={toggleSaveTrail}
            isSaved={savedTrails.includes(detailModalTrail.id)}
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
