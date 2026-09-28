'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CesiumController } from '@/lib/map/CesiumController';
import type { GeoPoint, MapMarker, MapPolyline } from '@/lib/map/types';
import type { Trail, Landmark, HimalayanRange } from '@/types';
import { ROUTE_TRACKS } from '@/data/routeTracks';
import GlassCard from '@/components/ui/GlassCard';
import GlassBadge from '@/components/ui/GlassBadge';
import {
  Compass,
  Mountain,
  Eye,
  RotateCcw,
  Sparkles,
  Layers,
  MapPin,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Navigation,
  Plane,
  AlertTriangle,
} from 'lucide-react';
import gsap from 'gsap';
import { HIMALAYAN_SUMMITS } from '@/data/summitTours';
import SummitTourConsole from '@/components/map/SummitTourConsole';
import DroneFlightConsole from '@/components/map/DroneFlightConsole';
import FloatingMapPanel from '@/components/ui/FloatingMapPanel';
import type { DroneFlightTelemetry } from '@/lib/map/types';
import { ItineraryDay } from '@/types';

interface CesiumGlobeMapProps {
  initialCenter?: GeoPoint;
  polyline?: MapPolyline;
  markers?: MapMarker[];
  landmarks?: Landmark[];
  itineraryDays?: ItineraryDay[];
  activeItineraryDay?: number | null;
  onSelectItineraryDay?: (day: ItineraryDay, coords: [number, number]) => void;
  onSelectLandmark?: (landmark: Landmark) => void;
  onMarkerClick?: (markerId: string) => void;
  onFlyToFullRoute?: () => void;
  scrubberPoint?: GeoPoint | null;
  activeTrail?: Trail | null;
  height?: string;
  onClose3D?: () => void;
  mode?: 'freeroam' | 'summit-tours' | 'drone-flight';
  initialSummitSlug?: string;
  onFlightTelemetry?: (telemetry: DroneFlightTelemetry) => void;
  onSeekDistanceKm?: (distanceKm: number) => void;
  activeDistanceKm?: number | null;
  cameraMode?: 'chase' | 'cockpit';
  hideHUD?: boolean;
}

export default function CesiumGlobeMap({
  initialCenter = { lat: 27.9881, lng: 86.9250, altitude: 9000 },
  polyline,
  markers = [],
  landmarks: propLandmarks,
  itineraryDays,
  activeItineraryDay,
  onSelectItineraryDay,
  onSelectLandmark,
  onMarkerClick,
  onFlyToFullRoute,
  scrubberPoint,
  activeTrail,
  height = 'h-[600px]',
  onClose3D,
  mode = 'freeroam',
  initialSummitSlug = 'everest',
  onFlightTelemetry,
  onSeekDistanceKm,
  activeDistanceKm,
  cameraMode = 'chase',
  hideHUD = false,
}: CesiumGlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<CesiumController | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hudExpanded, setHudExpanded] = useState(true);
  const [currentMode, setCurrentMode] = useState<'freeroam' | 'summit-tours' | 'drone-flight'>(mode);
  const [activeSummit, setActiveSummit] = useState<string>('Mt. Everest');
  const [ranges, setRanges] = useState<HimalayanRange[]>([]);
  const [selectedRange, setSelectedRange] = useState<string>('All');
  const [perspective, setPerspective] = useState<'topo' | 'ridge' | 'summit'>('ridge');
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [fetchedLandmarks, setFetchedLandmarks] = useState<Landmark[]>([]);

  useEffect(() => {
    setCurrentMode(mode);
    if (mode === 'drone-flight' && controllerRef.current?.isInitialized) {
      controllerRef.current.startDroneFlight({ speedMultiplier: 1, initialDistanceMeters: 0, cameraMode });
    }
  }, [mode, cameraMode]);

  useEffect(() => {
    if (controllerRef.current?.isInitialized && activeDistanceKm !== undefined && activeDistanceKm !== null) {
      controllerRef.current.seekDroneFlight(activeDistanceKm * 1000);
    }
  }, [activeDistanceKm]);

  useEffect(() => {
    if (controllerRef.current?.isInitialized && cameraMode) {
      controllerRef.current.setDroneCameraMode?.(cameraMode);
    }
  }, [cameraMode]);

  // Fly Cesium 3D camera to active itinerary day milestone
  useEffect(() => {
    if (!controllerRef.current?.isInitialized || !activeItineraryDay || !itineraryDays || !activeTrail) return;
    const day = itineraryDays.find((d) => d.day === activeItineraryDay);
    if (!day) return;
    const track = ROUTE_TRACKS[activeTrail.id];
    const trackCoords = track?.coords || (activeTrail.routeCoordinates?.map((c) => [c[0], c[1]] as [number, number]) || []);
    if (trackCoords.length < 2) return;
    const totalDayKm = itineraryDays.reduce((acc, d) => acc + (d.distanceKm || 0), 0);
    let runningKm = 0;
    for (let i = 0; i < itineraryDays.length; i++) {
      runningKm += itineraryDays[i].distanceKm || 12;
      if (itineraryDays[i].day === activeItineraryDay) break;
    }
    const ratio = totalDayKm > 0 ? Math.min(1, runningKm / totalDayKm) : 0.5;
    const targetIdx = Math.min(trackCoords.length - 1, Math.floor(ratio * (trackCoords.length - 1)));
    const coord = trackCoords[targetIdx];
    if (coord) {
      const alt = (day.sleepingAltitude || 4000) + 2200;
      controllerRef.current.flyTo(
        { lat: coord[0], lng: coord[1], altitude: alt },
        alt,
        1.5
      );
    }
  }, [activeItineraryDay, itineraryDays, activeTrail]);

  // 1. Fetch official Himalayan ranges & landmarks from persistent DB API
  useEffect(() => {
    fetch('/api/ranges')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: HimalayanRange[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setRanges(data);
        }
      })
      .catch((err) => console.warn('Failed to load ranges from API:', err));

    if (!propLandmarks || propLandmarks.length === 0) {
      fetch('/api/landmarks')
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Landmark[]) => {
          if (Array.isArray(data)) {
            setFetchedLandmarks(data);
          }
        })
        .catch((err) => console.warn('Failed to load landmarks in 3D Cesium:', err));
    }
  }, [propLandmarks]);

  const allLandmarks = propLandmarks && propLandmarks.length > 0 ? propLandmarks : fetchedLandmarks;

  // 2. Initialize Cesium Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new CesiumController();
    controllerRef.current = controller;

    controller
      .init(containerRef.current, { center: initialCenter })
      .then(() => {
        setIsLoading(false);

        // Register interactive marker click listener
        if (controller.onMarkerClick) {
          controller.onMarkerClick((markerId: string) => {
            onMarkerClick?.(markerId);
            if (markerId.startsWith('itin-day-') && itineraryDays && activeTrail) {
              const dayNum = parseInt(markerId.replace('itin-day-', ''), 10);
              const matchedDay = itineraryDays.find((d) => d.day === dayNum);
              if (matchedDay) {
                const track = ROUTE_TRACKS[activeTrail.id];
                const trackCoords = track?.coords || (activeTrail.routeCoordinates?.map((c) => [c[0], c[1]] as [number, number]) || []);
                const ratio = Math.min(1, dayNum / itineraryDays.length);
                const targetIdx = trackCoords.length > 1 ? Math.min(trackCoords.length - 1, Math.floor(ratio * (trackCoords.length - 1))) : 0;
                const coord = trackCoords[targetIdx] || [28.0, 86.85];
                onSelectItineraryDay?.(matchedDay, [coord[0], coord[1]]);
              }
              return;
            }
            const matched = allLandmarks.find((lm) => lm.id === markerId);
            if (matched) {
              onSelectLandmark?.(matched);
            }
          });
        }

        if (polyline) {
          controller.setTrailPolyline(polyline);
        } else if (activeTrail) {
          syncActiveTrailPolyline(controller, activeTrail);
        }

        // Combine custom markers, landmark markers, and itinerary days
        const allMarkers: MapMarker[] = [...markers];
        if (allLandmarks && allLandmarks.length > 0) {
          allLandmarks.forEach((lm) => {
            allMarkers.push({
              id: lm.id,
              position: { lat: lm.coordinates.lat, lng: lm.coordinates.lng, altitude: lm.elevation },
              title: lm.name,
              category: lm.category,
              elevation: lm.elevation,
            });
          });
        }

        if (itineraryDays && itineraryDays.length > 0 && activeTrail) {
          const track = ROUTE_TRACKS[activeTrail.id];
          const trackCoords = track?.coords || (activeTrail.routeCoordinates?.map((c) => [c[0], c[1]] as [number, number]) || []);
          let runningKm = 0;
          const totalDayKm = itineraryDays.reduce((acc, d) => acc + (d.distanceKm || 0), 0);

          itineraryDays.forEach((day, idx) => {
            if (idx === 0) {
              runningKm = day.distanceKm > 0 ? day.distanceKm : 10;
            } else {
              runningKm += day.distanceKm > 0 ? day.distanceKm : (totalDayKm ? totalDayKm / itineraryDays.length : 12);
            }
            const ratio = totalDayKm > 0 ? Math.min(1, runningKm / totalDayKm) : Math.min(1, (idx + 1) / itineraryDays.length);
            const targetIdx = trackCoords.length > 1
              ? Math.min(trackCoords.length - 1, Math.floor(ratio * (trackCoords.length - 1)))
              : 0;
            const coord = trackCoords[targetIdx] || [28.0, 86.85];

            allMarkers.push({
              id: `itin-day-${day.day}`,
              position: { lat: coord[0], lng: coord[1], altitude: (day.sleepingAltitude || 3500) + 120 },
              title: `Day ${day.day}: ${day.title} (${day.sleepingAltitude}m)`,
              category: 'Base Camp',
              elevation: day.sleepingAltitude || 3500,
            });
          });
        }

        if (allMarkers.length > 0) {
          controller.clearMarkers();
          controller.addMarkers(allMarkers);
        }

        if (ranges.length > 0) {
          controller.setRangeBoundaries(ranges);
        }

        // Render all route tracks in 3D
        controller.setAllRouteTracks(ROUTE_TRACKS, activeTrail?.id);

        // Kinetic GSAP entrance for HUD (slide from left)
        if (hudRef.current) {
          gsap.from(hudRef.current, {
            opacity: 0,
            x: -30,
            duration: 0.9,
            ease: 'power3.out',
          });
        }
      })
      .catch((err) => {
        console.error('Cesium Globe initialization failed:', err);
        setLoadError(err.message || 'Failed to initialize Cesium 3D Globe WebGL Context');
        setIsLoading(false);
      });

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  // Sync ranges when loaded
  useEffect(() => {
    if (controllerRef.current?.isInitialized && ranges.length > 0) {
      controllerRef.current.setRangeBoundaries(ranges, selectedRange === 'All' ? undefined : selectedRange);
    }
  }, [ranges, selectedRange]);

  // Sync trail polyline & route tracks helper
  const syncActiveTrailPolyline = (ctrl: CesiumController, trail: Trail) => {
    let points: GeoPoint[] = [];

    if (trail.routeCoordinates && trail.routeCoordinates.length > 0) {
      points = trail.routeCoordinates.map((c) => ({
        lat: c[0],
        lng: c[1],
        altitude: c[2] || trail.maxElevation || 4000,
      }));
    } else {
      const track = ROUTE_TRACKS[trail.id];
      if (track && track.coords.length > 0) {
        points = track.coords.map((c) => ({
          lat: c[0],
          lng: c[1],
          altitude: trail.maxElevation ? trail.maxElevation - 500 : 4000,
        }));
      }
    }

    if (points.length > 0) {
      ctrl.setTrailPolyline({
        id: `trail-3d-${trail.id}`,
        points,
        color: '#B68D40',
        weight: 6,
      });
    }
  };

  // Sync active trail updates
  useEffect(() => {
    if (!controllerRef.current?.isInitialized) return;
    controllerRef.current.setAllRouteTracks(ROUTE_TRACKS, activeTrail?.id);
    if (polyline) {
      controllerRef.current.setTrailPolyline(polyline);
    } else if (activeTrail) {
      syncActiveTrailPolyline(controllerRef.current, activeTrail);
    }
  }, [polyline, activeTrail]);

  // Sync markers & landmarks
  useEffect(() => {
    if (controllerRef.current?.isInitialized) {
      controllerRef.current.clearMarkers();
      const allMarkers: MapMarker[] = [...markers];
      if (allLandmarks && allLandmarks.length > 0) {
        allLandmarks.forEach((lm) => {
          allMarkers.push({
            id: lm.id,
            position: { lat: lm.coordinates.lat, lng: lm.coordinates.lng, altitude: lm.elevation },
            title: lm.name,
            category: lm.category,
            elevation: lm.elevation,
          });
        });
      }
      if (allMarkers.length > 0) {
        controllerRef.current.addMarkers(allMarkers);
      }
    }
  }, [markers, allLandmarks]);

  // Sync scrubber point
  useEffect(() => {
    if (controllerRef.current?.isInitialized) {
      controllerRef.current.setScrubberPosition(scrubberPoint || null);
    }
  }, [scrubberPoint]);

  const handleFlyToSummit = (summit: typeof HIMALAYAN_SUMMITS[0]) => {
    setActiveSummit(summit.name);
    controllerRef.current?.flyTo(summit.coords, summit.coords.altitude || 9000, 2.5);
  };

  const handleSelectLandmark = (landmark: Landmark) => {
    setSelectedLandmarkId(landmark.id);
    onSelectLandmark?.(landmark);
    controllerRef.current?.flyTo(
      { lat: landmark.coordinates.lat, lng: landmark.coordinates.lng, altitude: (landmark.elevation || 3500) + 1500 },
      (landmark.elevation || 3500) + 2000,
      2.0
    );
  };

  const handleSelectRange = (rangeName: string) => {
    setSelectedRange(rangeName);
    if (!controllerRef.current?.isInitialized) return;

    if (rangeName === 'All') {
      controllerRef.current.setRangeBoundaries(ranges);
      controllerRef.current.flyTo(initialCenter, 35000, 3);
      return;
    }

    const range = ranges.find((r) => r.name.toLowerCase() === rangeName.toLowerCase());
    if (range) {
      controllerRef.current.setRangeBoundaries(ranges, range.name);
      controllerRef.current.flyTo({ lat: range.center[0], lng: range.center[1] }, 26000, 2.5);

      // Add range summit POIs to map
      if (range.pois && range.pois.length > 0) {
        const poiMarkers: MapMarker[] = range.pois.map((p, idx) => ({
          id: `poi-summit-${idx}`,
          position: { lat: p.coord[0], lng: p.coord[1] },
          title: p.name,
          elevation: 7500,
        }));
        controllerRef.current.clearMarkers();
        controllerRef.current.addMarkers(poiMarkers);
      }
    }
  };

  const handlePerspectiveChange = (mode: 'topo' | 'ridge' | 'summit') => {
    setPerspective(mode);
    controllerRef.current?.setPerspective(mode);
  };

  return (
    <div
      data-slot="base"
      className={`relative w-full ${height} overflow-hidden rounded-3xl border border-border/40 bg-neutral-950`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} data-slot="canvas" className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          data-slot="indicator"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md text-white space-y-4"
        >
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 border-4 border-[#B68D40]/30 rounded-full animate-spin border-t-[#B68D40]" />
            <Mountain className="w-6 h-6 text-[#B68D40] absolute inset-0 m-auto" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold tracking-wider text-[#E2C085] uppercase">
              Initializing Cesium 3D Globe
            </p>
            <p className="text-xs text-gray-400">Loading Himalayan Terrain Elevation Models & 3D Topography...</p>
          </div>
        </div>
      )}

      {/* Non-Intrusive Hardware Acceleration Notice & Fallback */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xl p-6 text-center text-white space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-bold text-amber-300">Cesium 3D Acceleration Notice</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              {loadError.includes('already exists')
                ? 'Dynamic entity synchronization refreshed.'
                : loadError}
            </p>
          </div>
          {onClose3D && (
            <button
              onClick={onClose3D}
              data-slot="trigger"
              className="px-4 py-2 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-xs font-bold text-black transition shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
            >
              Switch to 2D Topo Map
            </button>
          )}
        </div>
      )}

      {/* LEFT-SIDE FLOATING HUD DOCK: Top Controls + Scrollable Consoles / Range-Summit Navigator */}
      {!isLoading && !loadError && (
        <div
          ref={hudRef}
          data-slot="base"
          className="absolute top-4 left-4 bottom-4 z-20 w-80 sm:w-[380px] max-w-[calc(100%-2rem)] flex flex-col gap-2.5 pointer-events-none"
        >
          {/* Header Controls: Cesium Engine Badge, 2D Switch, Perspective Presets */}
          <div
            data-slot="header"
            className="p-2.5 bg-neutral-950/85 backdrop-blur-xl border border-border/40 rounded-2xl shadow-2xl flex flex-col gap-2 pointer-events-auto shrink-0"
          >
            <div className="flex items-center justify-between gap-2">
              <GlassBadge variant="gold" pulse>
                <Sparkles className="w-3.5 h-3.5 text-[#B68D40]" />
                <span className="font-semibold text-xs">Cesium 3D Terrain</span>
              </GlassBadge>

              <div className="flex items-center gap-1.5">
                {onClose3D && (
                  <button
                    onClick={onClose3D}
                    data-slot="trigger"
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-border/30 backdrop-blur-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                  >
                    2D Map
                  </button>
                )}

                <button
                  onClick={() => controllerRef.current?.flyTo(initialCenter, 14000, 2)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-[#E2C085] bg-white/5 hover:bg-white/10 border border-border/30 transition"
                  title="Reset 3D Camera View"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Drone Fly-Through Quick Button if Trail Active */}
            {(activeTrail || polyline) && (
              <button
                onClick={() => {
                  if (currentMode === 'drone-flight') {
                    controllerRef.current?.stopDroneFlight();
                    setCurrentMode('freeroam');
                  } else {
                    setCurrentMode('drone-flight');
                    controllerRef.current?.startDroneFlight({ speedMultiplier: 1, initialDistanceMeters: 0 });
                  }
                }}
                data-slot="trigger"
                data-pressed={currentMode === 'drone-flight'}
                className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border shadow-lg ${
                  currentMode === 'drone-flight'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/30'
                    : 'bg-[#B68D40] text-black border-[#B68D40] shadow-[#B68D40]/25 hover:bg-[#d4a853]'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>{currentMode === 'drone-flight' ? 'Exit Drone Flight' : 'Start Drone Fly-Through'}</span>
              </button>
            )}

            {/* Perspective Preset Buttons & Full Route Overview */}
            <div className="flex items-center justify-between gap-1 bg-black/50 border border-border/30 rounded-xl p-1">
              {polyline && polyline.points.length > 0 && (
                <button
                  onClick={() => {
                    const mid = polyline.points[Math.floor(polyline.points.length / 2)];
                    controllerRef.current?.flyTo(mid, 18000, 2.0);
                    onFlyToFullRoute?.();
                  }}
                  data-slot="trigger"
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition flex items-center gap-1"
                  title="View Full Route from Orbit"
                >
                  <Eye className="w-3 h-3 text-[#B68D40]" />
                  <span>Orbit</span>
                </button>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => handlePerspectiveChange('topo')}
                  data-slot="trigger"
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                    perspective === 'topo' ? 'bg-[#B68D40] text-black font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Top-down Topographic View"
                >
                  Topo
                </button>
                <button
                  onClick={() => handlePerspectiveChange('ridge')}
                  data-slot="trigger"
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                    perspective === 'ridge' ? 'bg-[#B68D40] text-black font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                  title="45-degree Ridge Profile"
                >
                  Ridge (45°)
                </button>
                <button
                  onClick={() => handlePerspectiveChange('summit')}
                  data-slot="trigger"
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                    perspective === 'summit' ? 'bg-[#B68D40] text-black font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Low-angle Summit Horizon View"
                >
                  Summit
                </button>
              </div>
            </div>
          </div>

          {/* Body: Scrollable Consoles / FloatingMapPanel */}
          <div
            data-slot="body"
            className="flex-1 min-h-0 overflow-y-auto pointer-events-auto pr-0.5 space-y-2.5 scrollbar-thin scrollbar-thumb-amber-500/20"
          >
            {currentMode === 'drone-flight' ? (
              <DroneFlightConsole
                controller={controllerRef.current}
                trail={activeTrail}
                polyline={polyline}
                landmarks={allLandmarks}
                onClose={() => {
                  controllerRef.current?.stopDroneFlight();
                  setCurrentMode('freeroam');
                }}
                onTelemetryChange={onFlightTelemetry}
                onSeekDistanceKm={onSeekDistanceKm}
              />
            ) : currentMode === 'summit-tours' ? (
              <SummitTourConsole
                controller={controllerRef.current}
                initialSummitSlug={initialSummitSlug}
              />
            ) : !hideHUD ? (
              <FloatingMapPanel
                id="cesium-hud-window"
                title="Himalayan Ranges & Summits"
                icon={<Mountain className="w-4 h-4 text-[#B68D40]" />}
                badge={
                  activeTrail ? (
                    <span className="text-[10px] text-[#B68D40] font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-[#B68D40]/30 truncate max-w-[120px]">
                      {activeTrail.name}
                    </span>
                  ) : undefined
                }
                allowDrag={false}
                allowMinimize={true}
                allowMaximize={false}
                allowClose={false}
                defaultWidth="w-full"
              >
                <div className="space-y-3">
                  {/* 0. Active Trail Drone Fly-Through Call to Action */}
                  {activeTrail && (
                    <div className="p-2.5 rounded-xl bg-accent/15 border border-accent/40 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-accent animate-pulse shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Virtual Trail Simulation</p>
                          <p className="text-[10px] text-gray-300">Fly along {activeTrail.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentMode('drone-flight');
                          controllerRef.current?.startDroneFlight({ speedMultiplier: 1, initialDistanceMeters: 0 });
                        }}
                        data-slot="trigger"
                        className="w-full px-3 py-1.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:bg-[#d4a853] transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                      >
                        <Plane className="w-3.5 h-3.5" />
                        <span>Start Drone Fly-Through</span>
                      </button>
                    </div>
                  )}

                  {/* 1. Himalayan Ranges Navigator */}
                  {ranges.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                        Explore Range Boundaries:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => handleSelectRange('All')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                            selectedRange === 'All'
                              ? 'bg-[#B68D40] text-black font-bold shadow'
                              : 'bg-neutral-900/80 hover:bg-neutral-800 text-gray-300 border border-border/40'
                          }`}
                        >
                          All Ranges
                        </button>
                        {ranges.map((r) => {
                          const isSelected = selectedRange.toLowerCase() === r.name.toLowerCase();
                          return (
                            <button
                              key={r.name}
                              onClick={() => handleSelectRange(r.name)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-[#B68D40] text-black font-bold shadow'
                                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-gray-300 border border-border/40 hover:border-[#B68D40]/50'
                              }`}
                            >
                              <Layers className="w-3 h-3 text-[#B68D40]" />
                              <span>{r.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Landmarks Chips Row in 3D Mode */}
                  {allLandmarks && allLandmarks.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                        Regional Landmarks:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto">
                        {allLandmarks.map((lm: Landmark) => {
                          const isSelected = selectedLandmarkId === lm.id;
                          return (
                            <button
                              key={lm.id}
                              onClick={() => handleSelectLandmark(lm)}
                              className={`px-2 py-1 rounded-xl text-[10px] font-semibold transition-all flex items-center gap-1.5 border ${
                                isSelected
                                  ? 'bg-accent text-accent-foreground border-accent shadow-lg shadow-amber-500/20 scale-105'
                                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-gray-300 border border-border/40 hover:border-accent/40'
                              }`}
                            >
                              <MapPin className="w-3 h-3 text-[#B68D40]" />
                              <span>{lm.name}</span>
                              <span className="text-[9px] font-mono opacity-80">{lm.elevation}m</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Summit Quick Fly-To */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                      Apex Summits:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {HIMALAYAN_SUMMITS.map((summit) => {
                        const isActive = activeSummit === summit.name;
                        return (
                          <button
                            key={summit.name}
                            onClick={() => handleFlyToSummit(summit)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-[#B68D40] text-black font-bold shadow-lg shadow-[#B68D40]/30 scale-105'
                                : 'bg-neutral-900/80 hover:bg-neutral-800 text-gray-300 border border-border/40 hover:border-[#B68D40]/40'
                            }`}
                          >
                            <Compass className={`w-3 h-3 ${isActive ? 'text-black' : 'text-[#B68D40]'}`} />
                            <span>{summit.name}</span>
                            <span className={`text-[9px] font-mono ${isActive ? 'text-black/80' : 'text-gray-400'}`}>
                              {summit.elevation}m
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Controls & Navigation Tip */}
                  <div className="text-[10px] text-gray-400 flex flex-col gap-1 border-t border-border/30 pt-2">
                    <span>• Left-Click + Drag: Pan</span>
                    <span>• Right-Click + Drag: Orbit / Pitch</span>
                    <span>• Mouse Wheel: Altitude Zoom</span>
                  </div>
                </div>
              </FloatingMapPanel>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
