'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CesiumController } from '@/lib/map/CesiumController';
import type { GeoPoint, MapMarker, MapPolyline } from '@/lib/map/types';
import GlassCard from '@/components/ui/GlassCard';
import GlassBadge from '@/components/ui/GlassBadge';
import {
  Compass,
  Mountain,
  Eye,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Maximize2
} from 'lucide-react';
import gsap from 'gsap';

interface CesiumGlobeMapProps {
  initialCenter?: GeoPoint;
  polyline?: MapPolyline;
  markers?: MapMarker[];
  scrubberPoint?: GeoPoint | null;
  height?: string;
  onClose3D?: () => void;
}

const HIMALAYAN_SUMMITS: { name: string; elevation: number; coords: GeoPoint }[] = [
  { name: 'Mt. Everest', elevation: 8848, coords: { lat: 27.9881, lng: 86.9250, altitude: 9500 } },
  { name: 'Annapurna I', elevation: 8091, coords: { lat: 28.5960, lng: 83.8200, altitude: 8800 } },
  { name: 'Manaslu', elevation: 8163, coords: { lat: 28.5500, lng: 84.5600, altitude: 9000 } },
  { name: 'Ama Dablam', elevation: 6812, coords: { lat: 27.9000, lng: 86.8600, altitude: 7500 } },
  { name: 'Kanchenjunga', elevation: 8586, coords: { lat: 27.7025, lng: 88.1475, altitude: 9300 } },
];

export default function CesiumGlobeMap({
  initialCenter = { lat: 27.9881, lng: 86.9250, altitude: 9000 },
  polyline,
  markers = [],
  scrubberPoint,
  height = 'h-[600px]',
  onClose3D,
}: CesiumGlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<CesiumController | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hudExpanded, setHudExpanded] = useState(true);
  const [activeSummit, setActiveSummit] = useState<string>('Mt. Everest');

  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new CesiumController();
    controllerRef.current = controller;

    controller
      .init(containerRef.current, { center: initialCenter })
      .then(() => {
        setIsLoading(false);

        if (polyline) {
          controller.setTrailPolyline(polyline);
        }
        if (markers.length > 0) {
          controller.addMarkers(markers);
        }

        // GSAP entrance for HUD
        if (hudRef.current) {
          gsap.from(hudRef.current, {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power3.out',
          });
        }
      })
      .catch((err) => {
        console.error('Cesium Globe initialization failed:', err);
        setLoadError(err.message || 'Failed to initialize Cesium 3D Globe');
        setIsLoading(false);
      });

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  // Sync polyline updates
  useEffect(() => {
    if (controllerRef.current?.isInitialized && polyline) {
      controllerRef.current.setTrailPolyline(polyline);
    }
  }, [polyline]);

  // Sync markers
  useEffect(() => {
    if (controllerRef.current?.isInitialized) {
      controllerRef.current.clearMarkers();
      if (markers.length > 0) {
        controllerRef.current.addMarkers(markers);
      }
    }
  }, [markers]);

  // Sync scrubber point
  useEffect(() => {
    if (controllerRef.current?.isInitialized) {
      controllerRef.current.setScrubberPosition(scrubberPoint || null);
    }
  }, [scrubberPoint]);

  const handleFlyToSummit = (summit: typeof HIMALAYAN_SUMMITS[0]) => {
    setActiveSummit(summit.name);
    controllerRef.current?.flyTo(summit.coords, summit.coords.altitude || 9000, 3);
  };

  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950`}>
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md text-white space-y-4">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 border-4 border-[#B68D40]/30 rounded-full animate-spin border-t-[#B68D40]" />
            <Mountain className="w-6 h-6 text-[#B68D40] absolute inset-0 m-auto" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold tracking-wider text-[#E2C085] uppercase">
              Initializing Cesium 3D Globe
            </p>
            <p className="text-xs text-gray-400">Loading Himalayan Digital Elevation Models & Atmosphere...</p>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/90 p-6 text-center text-white space-y-3">
          <Mountain className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-lg font-bold text-red-300">Cesium 3D Acceleration Notice</h3>
          <p className="text-xs text-gray-400 max-w-md">{loadError}</p>
          {onClose3D && (
            <button
              onClick={onClose3D}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition"
            >
              Switch Back to 2D Topo Map
            </button>
          )}
        </div>
      )}

      {/* TOP HUD: Status & Engine Badge */}
      {!isLoading && !loadError && (
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
          <GlassBadge variant="gold" pulse>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cesium 3D Globe Active</span>
          </GlassBadge>

          {onClose3D && (
            <button
              onClick={onClose3D}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
            >
              Switch to 2D Map
            </button>
          )}
        </div>
      )}

      {/* BOTTOM FLOATING GLASSMORPHIC HUD */}
      {!isLoading && !loadError && (
        <div ref={hudRef} className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          <GlassCard variant="glow" className="max-w-2xl mx-auto p-3 sm:p-4 pointer-events-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Mountain className="w-4 h-4 text-[#B68D40]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Himalayan Summit Navigation
                </span>
              </div>

              <button
                onClick={() => setHudExpanded(!hudExpanded)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                aria-label="Toggle Summit Menu"
              >
                {hudExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {hudExpanded && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {HIMALAYAN_SUMMITS.map((summit) => {
                    const isActive = activeSummit === summit.name;
                    return (
                      <button
                        key={summit.name}
                        onClick={() => handleFlyToSummit(summit)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#B68D40] text-black font-bold shadow-lg shadow-[#B68D40]/30 scale-105'
                            : 'bg-neutral-900/80 hover:bg-neutral-800 text-gray-300 border border-white/10 hover:border-[#B68D40]/40'
                        }`}
                      >
                        <Compass className={`w-3 h-3 ${isActive ? 'text-black' : 'text-[#B68D40]'}`} />
                        <span>{summit.name}</span>
                        <span className={`text-[10px] font-mono ${isActive ? 'text-black/80' : 'text-gray-400'}`}>
                          {summit.elevation}m
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-gray-400 flex items-center justify-between border-t border-white/5 pt-2">
                  <span>Hold Left-Click to pan • Right-Click + Drag to tilt/orbit • Scroll to zoom</span>
                  <button
                    onClick={() => controllerRef.current?.flyTo(initialCenter, 12000, 2)}
                    className="flex items-center gap-1 text-[#E2C085] hover:text-white transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset View</span>
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
