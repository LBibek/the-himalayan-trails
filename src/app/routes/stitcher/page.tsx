'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mountain,
  Compass,
  Route,
  ArrowRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Calendar,
  Share2,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
  Clock,
  ChevronRight,
  ExternalLink,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import type { Trail } from '@/types';
import type {
  StitchedRoute,
  PassCrossingAssessment,
  StitchedElevationPoint,
} from '@/types/routes';
import { stitchRoutes, exportStitchedGpx } from '@/lib/routeStitcher';
import { getAllPassCrossingAssessments } from '@/lib/passCrossingWindow';
import StitchedElevationChart from '@/components/routes/StitchedElevationChart';
import PassCrossingWindowCard from '@/components/routes/PassCrossingWindowCard';

// Dynamically import Leaflet map with SSR disabled
const StitchedRouteMap = dynamic(
  () => import('@/components/routes/StitchedRouteMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[460px] rounded-3xl bg-neutral-950 flex flex-col items-center justify-center text-[#B68D40] gap-3 border border-slate-800">
        <Compass className="w-8 h-8 animate-spin text-[#B68D40]" />
        <span className="text-xs uppercase tracking-wider text-[#E2C085]">
          Initializing Geodesic Multi-Trail Map Canvas...
        </span>
      </div>
    ),
  }
);

export default function RouteStitcherPage() {
  const router = useRouter();

  const [availableTrails, setAvailableTrails] = useState<Trail[]>([]);
  const [selectedTrailIds, setSelectedTrailIds] = useState<string[]>([
    'everest-base-camp',
    'gokyo-ri-cho-la',
  ]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [activePassId, setActivePassId] = useState<string | null>(null);
  const [isExportingGpx, setIsExportingGpx] = useState(false);
  const [gpxNotice, setGpxNotice] = useState<string | null>(null);
  const [allAssessments, setAllAssessments] = useState<PassCrossingAssessment[]>([]);

  // Fetch trails from DB API on mount
  useEffect(() => {
    fetch('/api/trails')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Trail[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableTrails(data);
          // Ensure selected trails strictly exist in catalog and default to at least two distinct trails
          setSelectedTrailIds((prev) => {
            const valid = prev.filter((id) =>
              data.some((t) => t.slug === id || t.id === id)
            );
            if (valid.length >= 2) return valid;
            const defaults = [...valid];
            for (const t of data) {
              const candidate = t.slug || t.id;
              if (!defaults.includes(candidate)) {
                defaults.push(candidate);
              }
              if (defaults.length >= 2) break;
            }
            return defaults.length >= 2 ? defaults : (data.length > 0 ? [data[0].slug] : prev);
          });
        }
      })
      .catch((err) => console.error('Failed to load trail catalog:', err))
      .finally(() => setLoadingCatalog(false));

    // Fetch high pass assessments
    fetch('/api/routes/pass-crossing')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PassCrossingAssessment[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllAssessments(data);
        } else {
          setAllAssessments(getAllPassCrossingAssessments());
        }
      })
      .catch(() => setAllAssessments(getAllPassCrossingAssessments()));
  }, []);

  // Selected Trail Objects in exact sequence
  const orderedTrails = useMemo<Trail[]>(() => {
    const list: Trail[] = [];
    for (const idOrSlug of selectedTrailIds) {
      const match = availableTrails.find(
        (t) => t.slug === idOrSlug || t.id === idOrSlug
      );
      if (match) {
        list.push(match);
      }
    }
    return list;
  }, [availableTrails, selectedTrailIds]);

  // Compute Stitched Route continuously using engine
  const stitchedRoute = useMemo<StitchedRoute>(() => {
    return stitchRoutes(orderedTrails);
  }, [orderedTrails]);

  // Handle reordering
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...selectedTrailIds];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setSelectedTrailIds(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= selectedTrailIds.length - 1) return;
    const next = [...selectedTrailIds];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setSelectedTrailIds(next);
  };

  const handleRemove = (index: number) => {
    if (selectedTrailIds.length <= 1) return;
    const next = selectedTrailIds.filter((_, i) => i !== index);
    setSelectedTrailIds(next);
  };

  const handleAddTrail = (trailSlug: string) => {
    if (!trailSlug) return;
    setSelectedTrailIds([...selectedTrailIds, trailSlug]);
  };

  // 1-Click Download Stitched GPX
  const handleDownloadGpx = () => {
    setIsExportingGpx(true);
    try {
      const gpxXml = exportStitchedGpx(stitchedRoute);
      const blob = new Blob([gpxXml], { type: 'application/gpx+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stitched-${stitchedRoute.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.gpx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setGpxNotice('Stitched GPX exported successfully!');
      setTimeout(() => setGpxNotice(null), 4000);
    } catch (err) {
      console.error('Failed to export GPX:', err);
    } finally {
      setIsExportingGpx(false);
    }
  };

  // 1-Click Send to Itinerary Planner
  const handleSendToPlanner = () => {
    try {
      const payload = {
        title: stitchedRoute.title,
        days: stitchedRoute.mergedItinerary,
        coordinates: stitchedRoute.coordinates,
        metrics: stitchedRoute.metrics,
      };
      sessionStorage.setItem('stitched_route_import', JSON.stringify(payload));
      router.push('/itinerary/planner?stitched=true');
    } catch (err) {
      console.error('Failed to transmit to planner:', err);
      router.push('/itinerary/planner');
    }
  };

  // High Pass list prioritized: passes on route first
  const sortedPassAssessments = useMemo(() => {
    const traversedIds = new Set(stitchedRoute.traversedPasses.map((p) => p.passId));
    return [...allAssessments].sort((a, b) => {
      const aOn = traversedIds.has(a.passId) ? 1 : 0;
      const bOn = traversedIds.has(b.passId) ? 1 : 0;
      return bOn - aOn;
    });
  }, [allAssessments, stitchedRoute.traversedPasses]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Hero Header */}
        <div data-slot="header" className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B68D40]/15 border border-[#B68D40]/40 text-[#E2C085] text-xs font-bold uppercase tracking-wider">
            <Compass className="h-4 w-4" />
            <span>Sprint 7.2 • Alpine Route Engineering</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Multi-Trail Route Stitcher
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mt-2 max-w-3xl leading-relaxed">
                Connect and bridge consecutive Himalayan trails with great-circle geodesic interpolation.
                Calculate cumulative vertical metrics, export standard GPX XML, and monitor real-time 48-hour
                crossing windows for iconic high passes.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadGpx}
                disabled={isExportingGpx || stitchedRoute.segments.length === 0}
                className="px-5 py-2.5 rounded-2xl bg-[#B68D40] hover:bg-[#c99e4b] active:bg-[#a07a35] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-[#B68D40]/25 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#B68D40] disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>Download Stitched GPX</span>
              </button>

              <button
                type="button"
                onClick={handleSendToPlanner}
                disabled={stitchedRoute.segments.length === 0}
                className="px-5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-white/20 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              >
                <Calendar className="h-4 w-4 text-[#B68D40]" />
                <span>Send to Itinerary Planner</span>
              </button>
            </div>
          </div>

          {gpxNotice && (
            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{gpxNotice}</span>
            </div>
          )}
        </div>

        {/* Live Stitched Metrics HUD */}
        <div
          data-slot="base"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 sm:p-5 rounded-3xl backdrop-blur-xl bg-surface/70 border border-border/40 shadow-2xl"
        >
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Total Distance
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {stitchedRoute.metrics.totalDistanceKm} <span className="text-xs font-normal text-gray-400">km</span>
            </div>
            <span className="text-[10px] text-[#38bdf8] mt-1 block">
              {stitchedRoute.connectors.length > 0 ? `+${stitchedRoute.metrics.connectorDistanceKm}km bridged` : 'Direct path'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Elevation Gain
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              +{stitchedRoute.metrics.totalElevationGainM.toLocaleString()} <span className="text-xs font-normal text-gray-400">m</span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              Cumulative vertical
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Elevation Loss
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
              -{stitchedRoute.metrics.totalElevationLossM.toLocaleString()} <span className="text-xs font-normal text-gray-400">m</span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              Descent terrain
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Apex Altitude
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#E2C085] font-mono">
              {stitchedRoute.metrics.maxAltitudeM.toLocaleString()} <span className="text-xs font-normal text-gray-400">m</span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              High point
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Duration
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {stitchedRoute.metrics.totalDays} <span className="text-xs font-normal text-gray-400">days</span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              {stitchedRoute.segments.length} trail segments
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Passes Crossed
            </span>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono flex items-center gap-1.5">
              <span>🏔️</span>
              <span>{stitchedRoute.traversedPasses.length}</span>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 block">
              Monitored in HUD
            </span>
          </div>
        </div>

        {/* Trail Segment Selector & Sequence Builder */}
        <div data-slot="body" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 rounded-3xl backdrop-blur-xl bg-surface/70 border border-border/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#B68D40] flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  <span>Trail Segments Sequence</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-gray-300">
                  {orderedTrails.length} Linked
                </span>
              </div>

              {/* Segment List */}
              <div className="space-y-3">
                {orderedTrails.map((trail, idx) => (
                  <div
                    key={`${trail.id}-${idx}`}
                    className="p-3.5 rounded-2xl bg-neutral-900/90 border border-white/10 hover:border-white/20 transition space-y-2 relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#B68D40]/20 border border-[#B68D40]/40 text-[#B68D40] text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">
                            {trail.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            {trail.region} • {trail.distanceKm}km • {trail.maxElevation}m
                          </p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-20 transition cursor-pointer"
                          title="Move segment earlier"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === orderedTrails.length - 1}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-20 transition cursor-pointer"
                          title="Move segment later"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          disabled={orderedTrails.length <= 1}
                          className="p-1 rounded-lg bg-white/5 hover:bg-rose-950 text-gray-400 hover:text-rose-400 disabled:opacity-20 transition cursor-pointer"
                          title="Remove segment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Geodesic Bridge Indicator */}
                    {idx < orderedTrails.length - 1 && stitchedRoute.connectors[idx] && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-[#38bdf8] font-mono">
                        <span className="flex items-center gap-1">
                          <span>🌐</span>
                          <span>Geodesic Bridge #{idx + 1}</span>
                        </span>
                        <span>{stitchedRoute.connectors[idx].distanceKm} km</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Trail Segment Dropdown */}
              <div className="pt-2 border-t border-white/10">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Add Additional Trail Segment
                </label>
                <select
                  onChange={(e) => {
                    handleAddTrail(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2.5 rounded-2xl bg-neutral-900 border border-white/20 text-xs text-white focus:outline-none focus:border-[#B68D40] cursor-pointer"
                >
                  <option value="" disabled>
                    Select trail to link...
                  </option>
                  {availableTrails.map((t) => (
                    <option key={t.id} value={t.slug}>
                      + {t.name} ({t.region} • {t.distanceKm}km)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Itinerary Preview */}
            <div className="p-5 rounded-3xl backdrop-blur-xl bg-surface/70 border border-border/40 shadow-xl space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#B68D40] flex items-center justify-between">
                <span>Merged Stages ({stitchedRoute.mergedItinerary.length} Days)</span>
                <span className="text-[10px] text-gray-400 font-normal">Day 1 to {stitchedRoute.mergedItinerary.length}</span>
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 overscroll-contain">
                {stitchedRoute.mergedItinerary.map((stage) => (
                  <div
                    key={`stage-${stage.day}`}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-[#B68D40]/20 text-[#B68D40] font-mono text-[10px] font-bold shrink-0">
                        D{stage.day}
                      </span>
                      <span className="text-white truncate font-medium">{stage.title}</span>
                    </div>
                    <span className="text-gray-400 font-mono text-[10px] shrink-0">
                      {stage.sleepingAltitude}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map & Elevation Profile Canvas */}
          <div className="lg:col-span-2 space-y-6">
            <StitchedRouteMap
              stitchedRoute={stitchedRoute}
              activePassId={activePassId}
              onSelectPass={(pass) => setActivePassId(pass.passId)}
            />

            <StitchedElevationChart
              data={stitchedRoute.elevationProfile}
              maxAltitudeM={stitchedRoute.metrics.maxAltitudeM}
              minAltitudeM={stitchedRoute.metrics.minAltitudeM}
              totalGainM={stitchedRoute.metrics.totalElevationGainM}
              totalLossM={stitchedRoute.metrics.totalElevationLossM}
            />
          </div>
        </div>

        {/* High-Pass Alpine Crossing Window Predictor Section */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B68D40]">
                <span>🌬️</span>
                <span>Real-Time Atmospheric Hazard Telemetry</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                48-Hour High-Pass Crossing Window Predictor
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Alpine crossing feasibility evaluated with NOAA / JAG/TI wind chill formulas, ridge crest wind speed thresholds,
                and freezing altitude isotherms.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/weather"
                className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 font-semibold flex items-center gap-1.5 transition"
              >
                <span>Live Weather Office</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Pass Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPassAssessments.map((assessment) => {
              const isOnRoute = stitchedRoute.traversedPasses.some(
                (p) => p.passId === assessment.passId
              );
              return (
                <PassCrossingWindowCard
                  key={assessment.passId}
                  assessment={assessment}
                  isOnRoute={isOnRoute}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
