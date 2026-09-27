'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Compass,
  Mountain,
  Globe,
  ArrowUpRight,
  Loader2,
  Navigation,
  MapPin,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import GlassBadge from '@/components/ui/GlassBadge';

// Dynamic client-side Leaflet import with SSR disabled to prevent hydration mismatches
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div
      data-slot="loading"
      className="w-full h-[520px] md:h-[620px] bg-surface/80 backdrop-blur-xl animate-pulse flex flex-col items-center justify-center text-accent text-sm font-semibold rounded-2xl border border-border/40"
    >
      <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
      <span className="text-surface-foreground font-medium">Initializing Himalayan Regional Geospatial Engine...</span>
      <span className="text-xs text-muted-foreground mt-1">Calibrating 2D Topographic Contours & GPS Tracks</span>
    </div>
  ),
});

export interface RegionConfig {
  key: string;
  name: string;
  coords: [number, number];
  zoom: number;
  trailId: string;
  apexSummit: string;
  maxAlt: string;
  keyPass: string;
  description: string;
}

export const REGION_CONFIGS: Record<string, RegionConfig> = {
  'Everest': {
    key: 'Everest',
    name: 'Everest / Khumbu',
    coords: [27.9881, 86.9250],
    zoom: 10.5,
    trailId: 'ebc-trek',
    apexSummit: 'Mt. Everest (8,848m)',
    maxAlt: '5,545m (Kala Patthar)',
    keyPass: 'Cho La & Kongma La',
    description: 'Home of the Sherpa kingdom, soaring Khumbu Icefall, and the highest pinnacle on Earth.',
  },
  'Annapurna': {
    key: 'Annapurna',
    name: 'Annapurna',
    coords: [28.6000, 83.9500],
    zoom: 10.0,
    trailId: 'annapurna-circuit',
    apexSummit: 'Annapurna I (8,091m)',
    maxAlt: '5,416m (Thorong La)',
    keyPass: 'Thorong La Pass',
    description: 'A dramatic circumnavigation from lush rhododendron valleys to high-altitude Tibetan plateaus.',
  },
  'Manaslu': {
    key: 'Manaslu',
    name: 'Manaslu',
    coords: [28.4500, 84.6500],
    zoom: 10.5,
    trailId: 'manaslu-circuit',
    apexSummit: 'Mt. Manaslu (8,163m)',
    maxAlt: '5,106m (Larkya La)',
    keyPass: 'Larkya La Pass',
    description: 'Pristine wilderness traverse around the Mountain of the Spirit bordering mystical Tibet.',
  },
  'Mustang': {
    key: 'Mustang',
    name: 'Mustang',
    coords: [29.0000, 83.8500],
    zoom: 10.0,
    trailId: 'upper-mustang',
    apexSummit: 'Nilgiri North (7,061m)',
    maxAlt: '3,840m (Lo Manthang)',
    keyPass: 'Marang La (4,230m)',
    description: 'The ancient walled Buddhist Kingdom of Lo set within vibrant ochre wind-sculpted canyons.',
  },
  'Langtang': {
    key: 'Langtang',
    name: 'Langtang',
    coords: [28.2000, 85.4500],
    zoom: 11.0,
    trailId: 'langtang-valley',
    apexSummit: 'Langtang Lirung (7,234m)',
    maxAlt: '4,773m (Kyanjin Ri)',
    keyPass: 'Ganja La (5,130m)',
    description: 'The Valley of Glaciers steeped in ancient Tamang culture, yak pastures, and dramatic ice faces.',
  },
};

export interface HomeRegionalMapProps {
  className?: string;
}

export default function HomeRegionalMap({ className = '' }: HomeRegionalMapProps) {
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>('Everest');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const currentRegion = REGION_CONFIGS[selectedRegionKey] || REGION_CONFIGS['Everest'];

  return (
    <section
      data-slot="base"
      className={`py-20 px-4 sm:px-6 lg:px-8 bg-surface/30 border-t border-border/30 relative overflow-hidden ${className}`}
    >
      {/* Decorative ambient gradient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-accent/5 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header slot: Title, badge, copy, and prominent 3D Cesium CTA */}
        <div
          data-slot="header"
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border/30 pb-8"
        >
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <GlassBadge variant="gold" pulse={true}>
                Live Regional Topography
              </GlassBadge>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                2D / 3D Geospatial Engine
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Interactive Himalayan Regional Map
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Explore iconic massifs with live GPS trail tracks, 8,000m apex summit telemetry, and conservation boundary polygons. Select any region below to fly camera coordinates dynamically.
            </p>
          </div>

          {/* Prominent High-Contrast Direct CTA to 3D Cesium Discovery Hub */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/map?engine=cesium"
              data-slot="trigger"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-accent text-accent-foreground font-bold hover:bg-[#c99e4b] transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:ring-offset-2 focus-visible:ring-offset-background transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span>Launch 3D Cesium Discovery Hub</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </Link>

            <Link
              href="/trails"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-surface/80 hover:bg-surface text-surface-foreground border border-border/50 hover:border-accent/60 font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
            >
              <Compass className="h-4 w-4 text-accent shrink-0" />
              <span>All Trails Catalog</span>
            </Link>
          </div>
        </div>

        {/* Body slot: Region selector tabs, telemetry strip, and embedded Leaflet canvas */}
        <div data-slot="body" className="space-y-4">
          
          {/* Quick Region Selector Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-surface/80 border border-border/40 backdrop-blur-xl shadow-lg">
            <div
              role="tablist"
              aria-label="Himalayan Regions"
              className="flex flex-wrap items-center gap-2"
            >
              {Object.values(REGION_CONFIGS).map((reg) => {
                const isActive = selectedRegionKey === reg.key;
                const isHovered = hoveredRegion === reg.key;

                return (
                  <button
                    key={reg.key}
                    role="tab"
                    id={`tab-${reg.key.toLowerCase()}`}
                    aria-selected={isActive}
                    aria-controls={`panel-${reg.key.toLowerCase()}`}
                    data-slot="trigger"
                    data-selected={isActive ? 'true' : 'false'}
                    data-hovered={isHovered ? 'true' : 'false'}
                    onMouseEnter={() => setHoveredRegion(reg.key)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => setSelectedRegionKey(reg.key)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                      isActive
                        ? 'bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/25'
                        : 'bg-surface/50 text-surface-foreground/80 hover:text-white hover:bg-surface/90 border-border/30 hover:border-accent/40'
                    }`}
                  >
                    <Mountain className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-accent-foreground' : 'text-accent'}`} />
                    <span>{reg.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Region Coordinates & Summit Telemetry Pill */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-background/60 border border-border/30 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Navigation className="h-3 w-3 text-accent" />
                <span>
                  {currentRegion.coords[0].toFixed(4)}°N, {currentRegion.coords[1].toFixed(4)}°E
                </span>
              </span>
              <span className="text-border">•</span>
              <span>
                Apex: <strong className="text-accent">{currentRegion.apexSummit}</strong>
              </span>
              <span className="text-border">•</span>
              <span>
                Max: <strong className="text-foreground">{currentRegion.maxAlt}</strong>
              </span>
            </div>
          </div>

          {/* Active Region Highlights Sub-Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface/40 border border-border/30 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
              <span>{currentRegion.description}</span>
            </p>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-semibold text-foreground">
                Key Pass: <span className="text-accent">{currentRegion.keyPass}</span>
              </span>
              <span>•</span>
              <Link
                href={`/map?engine=cesium&trail=${currentRegion.trailId}`}
                className="inline-flex items-center gap-1 text-accent hover:text-[#c99e4b] font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B68D40]"
              >
                <span>Fly in 3D Drone Simulator</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Embedded Dynamic Leaflet Map Canvas */}
          <div
            id={`panel-${currentRegion.key.toLowerCase()}`}
            role="tabpanel"
            aria-labelledby={`tab-${currentRegion.key.toLowerCase()}`}
            className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl bg-surface"
          >
            <LeafletMap
              selectedRegion={selectedRegionKey}
              focusedCoords={currentRegion.coords}
              activeTrailId={currentRegion.trailId}
              height="h-[520px] md:h-[620px]"
              hideHeaderControls={true}
            />
          </div>

        </div>

      </div>
    </section>
  );
}
