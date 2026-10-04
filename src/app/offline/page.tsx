'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  WifiOff,
  Radio,
  HardDrive,
  Download,
  Trash2,
  Mountain,
  Compass,
  TrendingUp,
  Clock,
  Route,
  PhoneCall,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { OfflineTrailPack, ItineraryDay, Landmark } from '@/types';
import {
  getAllOfflineTrails,
  deleteOfflineTrail,
  clearAllOfflineTrails,
  calculateLakeLouiseScore,
  LAKE_LOUISE_CRITERIA,
} from '@/lib/offline/trailStorage';

const OfflineRouteMap = dynamic(() => import('@/components/map/OfflineRouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[460px] rounded-3xl bg-slate-950 flex flex-col items-center justify-center text-[#B68D40] gap-3 border border-slate-800">
      <Compass className="w-8 h-8 animate-spin text-[#B68D40]" />
      <span className="text-xs uppercase tracking-wider text-[#E2C085]">
        Initializing Offline Vector Topo Engine...
      </span>
    </div>
  ),
});

function OfflineHubContent() {
  const searchParams = useSearchParams();
  const trailParam = searchParams.get('trail');

  const [packs, setPacks] = useState<OfflineTrailPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'elevation' | 'itinerary' | 'landmarks' | 'emergency'>('map');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Lake Louise AMS interactive state
  const [amsScores, setAmsScores] = useState({
    headache: 0,
    gastrointestinal: 0,
    fatigue: 0,
    dizziness: 0,
  });

  // Load offline packs
  const loadPacks = async () => {
    setIsLoading(true);
    try {
      const stored = await getAllOfflineTrails();
      setPacks(stored);

      if (stored.length > 0) {
        if (trailParam) {
          const match = stored.find(
            (p) => p.id === trailParam || p.trail.id === trailParam || p.trail.slug === trailParam
          );
          setSelectedPackId(match ? match.id : stored[0].id);
        } else if (!selectedPackId || !stored.find((p) => p.id === selectedPackId)) {
          setSelectedPackId(stored[0].id);
        }
      } else {
        setSelectedPackId(null);
      }
    } catch (err) {
      console.error('Failed to load offline trail packs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPacks();

    // Connection tracking
    const updateNetworkStatus = () => {
      const sim = typeof window !== 'undefined' && localStorage.getItem('himalayan_simulate_offline') === 'true';
      setIsSimulatedOffline(sim);
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine && !sim : true);
    };

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    window.addEventListener('storage', updateNetworkStatus);
    window.addEventListener('himalayan_offline_toggle', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      window.removeEventListener('storage', updateNetworkStatus);
      window.removeEventListener('himalayan_offline_toggle', updateNetworkStatus);
    };
  }, [trailParam]);

  const toggleSimulateOffline = () => {
    const next = !isSimulatedOffline;
    setIsSimulatedOffline(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('himalayan_simulate_offline', next ? 'true' : 'false');
      window.dispatchEvent(new Event('himalayan_offline_toggle'));
    }
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine && !next : !next);
  };

  const handleDeletePack = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Remove this cached route pack from offline storage?')) return;
    await deleteOfflineTrail(id);
    await loadPacks();
  };

  const handleClearAll = async () => {
    if (!window.confirm('Purge all downloaded offline trail packs from this device?')) return;
    await clearAllOfflineTrails();
    await loadPacks();
  };

  const selectedPack = useMemo(() => {
    return packs.find((p) => p.id === selectedPackId) || packs[0] || null;
  }, [packs, selectedPackId]);

  const totalBytes = useMemo(() => {
    return packs.reduce((acc, p) => acc + (p.packSizeBytes || 0), 0);
  }, [packs]);

  const filteredPacks = useMemo(() => {
    if (!searchQuery.trim()) return packs;
    const q = searchQuery.toLowerCase();
    return packs.filter(
      (p) =>
        p.trail.name.toLowerCase().includes(q) ||
        p.trail.region.toLowerCase().includes(q) ||
        p.trail.difficulty.toLowerCase().includes(q)
    );
  }, [packs, searchQuery]);

  const amsResult = useMemo(() => {
    return calculateLakeLouiseScore(amsScores);
  }, [amsScores]);

  // Elevation Chart data
  const chartData = useMemo(() => {
    if (!selectedPack?.elevationProfile) return [];
    return selectedPack.elevationProfile.map((pt, i, arr) => {
      let grade = 0;
      if (i > 0) {
        const dElev = pt.elevation - arr[i - 1].elevation;
        const dDist = (pt.distanceKm - arr[i - 1].distanceKm) * 1000;
        grade = dDist > 0 ? Math.abs(dElev / dDist) * 100 : 0;
      }
      return {
        ...pt,
        grade: Math.round(grade * 10) / 10,
      };
    });
  }, [selectedPack]);

  return (
    <div data-slot="base" className="min-h-screen bg-slate-950 text-slate-100 pb-24 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ──────── TOP BANNER & CONNECTION CONTROL ──────── */}
        <div data-slot="header" className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-[#B68D40]/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#B68D40]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-[#B68D40]/20 text-[#E2C085] border border-[#B68D40]/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#B68D40]" />
                  Wilderness Protocol v1.0
                </span>

                {isOnline ? (
                  <span data-slot="indicator" className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online • Cloud Connected
                  </span>
                ) : (
                  <span data-slot="indicator" className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    Offline • Autonomous Mode
                  </span>
                )}

                {isSimulatedOffline && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-semibold">
                    Simulated Offline
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Wilderness Offline Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Autonomous high-altitude navigation, pre-cached GPS trackpoints, day-by-day itineraries, and life-saving AMS / HACE / HAPE medical protocols. Zero cellular signal required.
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleSimulateOffline}
                data-slot="trigger"
                data-pressed={isSimulatedOffline}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                  isSimulatedOffline
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                <WifiOff className="w-4 h-4" />
                <span>{isSimulatedOffline ? 'Disable Simulated Offline' : 'Simulate Offline Mode'}</span>
              </button>

              <a
                href="tel:+97714123456"
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-2 transition shadow-lg shadow-rose-900/30 focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Helicopter SAR: +977-1-4123456</span>
              </a>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Cached Routes</p>
              <p className="text-lg font-black text-white">{packs.length} Expeditions</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Offline Disk Usage</p>
              <p className="text-lg font-black text-[#B68D40]">
                {(totalBytes / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Emergency Frequency</p>
              <p className="text-lg font-black text-emerald-400">156.800 MHz</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Storage Engine</p>
                <p className="text-xs font-bold text-slate-300">IndexedDB v1</p>
              </div>
              {packs.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ──────── MAIN SPLIT LAYOUT ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ──── LEFT COLUMN: PACK LIST & DISCOVERY ──── */}
          <div className="lg:col-span-4 space-y-4">
            <div data-slot="base" className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 shadow-2xl space-y-4">
              <div data-slot="header" className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#B68D40]" />
                  Cached Route Packs
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
                  {packs.length}
                </span>
              </div>

              {/* Search input */}
              {packs.length > 3 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter cached packs..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B68D40]"
                  />
                </div>
              )}

              {/* Route Pack Items */}
              <div data-slot="body" className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Scanning offline storage...
                  </div>
                ) : filteredPacks.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-slate-400">
                      No offline trail packs stored yet.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Download packs on individual trail pages before departing into wilderness regions with no network coverage.
                    </p>
                    <Link
                      href="/map"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B68D40] text-black font-bold text-xs hover:bg-[#c99e4b] transition"
                    >
                      <span>Explore Trails</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  filteredPacks.map((pack) => {
                    const isSelected = selectedPack?.id === pack.id;
                    return (
                      <div
                        key={pack.id}
                        onClick={() => setSelectedPackId(pack.id)}
                        data-slot="trigger"
                        data-pressed={isSelected}
                        className={`p-3.5 rounded-2xl cursor-pointer transition border text-left space-y-2 group ${
                          isSelected
                            ? 'bg-slate-800/90 border-[#B68D40] shadow-lg shadow-[#B68D40]/10 ring-1 ring-[#B68D40]/40'
                            : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-xs font-bold text-white group-hover:text-[#E2C085] transition">
                              {pack.trail.name}
                            </h3>
                            <p className="text-[10px] text-slate-400">
                              {pack.trail.region} • {pack.trail.difficulty}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDeletePack(pack.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete pack"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span>{pack.trail.distanceKm} km • {pack.trail.maxElevation}m</span>
                          <span className="font-semibold text-emerald-400">
                            {((pack.packSizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recommended packs quick download shortcuts */}
            <div data-slot="base" className="p-5 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-slate-700/40 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B68D40]" />
                Recommended Routes to Cache
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Save complete route packs before entering high-altitude valleys:
              </p>
              <div className="space-y-1.5">
                {[
                  { name: 'Everest Base Camp', id: 'everest-base-camp', region: 'Khumbu', elev: '5,364m' },
                  { name: 'Annapurna Circuit', id: 'annapurna-circuit', region: 'Annapurna', elev: '5,416m' },
                  { name: 'Manaslu Circuit', id: 'manaslu-circuit', region: 'Manaslu', elev: '5,106m' },
                  { name: 'Langtang Valley', id: 'langtang-valley', region: 'Langtang', elev: '4,984m' },
                ].map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/trails/${rec.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-xs text-slate-300 hover:text-white transition group"
                  >
                    <span>{rec.name}</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-[#B68D40] transition">
                      {rec.elev} →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ──── RIGHT COLUMN: SELECTED PACK VIEWER & EMERGENCY HUB ──── */}
          <div className="lg:col-span-8 space-y-6">
            {selectedPack ? (
              <div data-slot="base" className="rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 shadow-2xl overflow-hidden space-y-6 p-6">

                {/* Trail Header */}
                <div data-slot="header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        Cached Route
                      </span>
                      <span className="text-xs text-slate-400">{selectedPack.trail.region}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                      {selectedPack.trail.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedPack.trail.distanceKm} km • Max Alt: {selectedPack.trail.maxElevation.toLocaleString()}m • {selectedPack.trail.durationDays} Days
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/trails/${selectedPack.trail.id || selectedPack.trail.slug}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition border border-slate-700 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    >
                      <span>Online Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                  {[
                    { key: 'map', label: 'Offline GPS Map', icon: Compass },
                    { key: 'elevation', label: 'Elevation Profile', icon: TrendingUp },
                    { key: 'itinerary', label: 'Stages & Itinerary', icon: Calendar },
                    { key: 'landmarks', label: `Landmarks (${selectedPack.landmarks?.length || 0})`, icon: Mountain },
                    { key: 'emergency', label: 'Emergency & SAR Guide', icon: AlertTriangle, highlight: true },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key as any)}
                        data-slot="trigger"
                        data-pressed={isActive}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                          isActive
                            ? t.highlight
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                              : 'bg-[#B68D40] text-black shadow-lg shadow-[#B68D40]/20'
                            : t.highlight
                            ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                            : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: Offline GPS Map */}
                {activeTab === 'map' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <OfflineRouteMap
                      routeCoordinates={selectedPack.routeCoordinates || []}
                      landmarks={selectedPack.landmarks || []}
                      trailName={selectedPack.trail.name}
                    />
                    <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-xs text-slate-300">
                      <span>Coordinates: {selectedPack.routeCoordinates?.length || 0} trackpoints</span>
                      <span>Cached Waypoints: {selectedPack.landmarks?.length || 0} POIs</span>
                    </div>
                  </div>
                )}

                {/* Tab 2: Elevation Profile */}
                {activeTab === 'elevation' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="h-[280px] sm:h-[340px] p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="offlineElevGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#B68D40" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#B68D40" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis
                            dataKey="distanceKm"
                            stroke="#94a3b8"
                            fontSize={11}
                            tickFormatter={(v) => `${v}km`}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={11}
                            domain={['dataMin - 200', 'dataMax + 200']}
                            tickFormatter={(v) => `${v}m`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.95)',
                              borderColor: '#B68D40',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '11px',
                            }}
                            formatter={(val: any) => [`${val} m`, 'Altitude']}
                            labelFormatter={(l) => `Distance: ${l} km`}
                          />
                          <Area
                            type="monotone"
                            dataKey="elevation"
                            stroke="#B68D40"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#offlineElevGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <p className="text-slate-400 text-[10px]">Max Altitude</p>
                        <p className="text-white font-bold">{selectedPack.trail.maxElevation}m</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <p className="text-slate-400 text-[10px]">Total Distance</p>
                        <p className="text-white font-bold">{selectedPack.trail.distanceKm} km</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                        <p className="text-slate-400 text-[10px]">Elevation Gain</p>
                        <p className="text-emerald-400 font-bold">{selectedPack.trail.elevationGain || 0}m</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Itinerary Stages */}
                {activeTab === 'itinerary' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    {selectedPack.itinerary && selectedPack.itinerary.length > 0 ? (
                      selectedPack.itinerary.map((day) => (
                        <div
                          key={day.day}
                          className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#B68D40]/20 text-[#E2C085] text-xs font-bold border border-[#B68D40]/30">
                              Day {day.day}
                            </span>
                            <span className="text-xs text-slate-400">
                              {day.distanceKm} km • {day.hours} hrs
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{day.title}</h4>
                          <p className="text-xs text-[#B68D40] font-semibold">{day.route}</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{day.highlights}</p>
                          <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-4">
                            <span>Sleeping Alt: <strong className="text-white">{day.sleepingAltitude}m</strong></span>
                            <span>Alt Gain: <strong className="text-emerald-400">+{day.altitudeGain}m</strong></span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-8">
                        No day-by-day itinerary stage data attached to this pack.
                      </p>
                    )}
                  </div>
                )}

                {/* Tab 4: Landmarks */}
                {activeTab === 'landmarks' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                    {selectedPack.landmarks && selectedPack.landmarks.length > 0 ? (
                      selectedPack.landmarks.map((lm) => (
                        <div
                          key={lm.id}
                          className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {lm.category}
                            </span>
                            <span className="text-xs font-bold text-[#B68D40]">{lm.elevation}m</span>
                          </div>
                          <h4 className="text-xs font-bold text-white">{lm.name}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{lm.description}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {lm.coordinates.lat.toFixed(4)}°N, {lm.coordinates.lng.toFixed(4)}°E
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-xs text-slate-400">
                        No landmark waypoints cached in this trail pack.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 5: High-Altitude Emergency & SAR Guide */}
                {activeTab === 'emergency' && (
                  <div className="space-y-6 animate-in fade-in duration-200">

                    {/* Interactive Lake Louise AMS Diagnostic Calculator */}
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            Lake Louise 2018 Acute Mountain Sickness (AMS) Calculator
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Select symptoms to calculate clinical severity score at altitude.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-base font-black px-3 py-1 rounded-xl border ${
                            amsResult.severity === 'Moderate / Severe AMS'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : amsResult.severity === 'Mild AMS'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            Score: {amsResult.totalScore} ({amsResult.severity})
                          </span>
                        </div>
                      </div>

                      {/* Criteria inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {LAKE_LOUISE_CRITERIA.map((crit) => {
                          const currentVal = amsScores[crit.category];
                          return (
                            <div key={crit.category} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                              <label className="text-xs font-bold text-slate-200 block">
                                {crit.label}
                              </label>
                              <div className="grid grid-cols-4 gap-1">
                                {crit.options.map((opt) => (
                                  <button
                                    key={opt.score}
                                    type="button"
                                    onClick={() =>
                                      setAmsScores((prev) => ({
                                        ...prev,
                                        [crit.category]: opt.score,
                                      }))
                                    }
                                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition border ${
                                      currentVal === opt.score
                                        ? 'bg-[#B68D40] text-black border-[#E2C085]'
                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                    }`}
                                  >
                                    {opt.score}: {opt.label.split(' ')[0]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Clinical Recommendation Box */}
                      <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        amsResult.severity === 'Moderate / Severe AMS'
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                          : amsResult.severity === 'Mild AMS'
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}>
                        <strong>Action Protocol: </strong>
                        {amsResult.recommendation}
                      </div>
                    </div>

                    {/* HACE & HAPE Critical Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* HACE */}
                      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider">
                            HACE (Cerebral Edema)
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                            Fatal in 24-48h
                          </span>
                        </div>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                          <li><strong>Ataxia:</strong> Inability to walk heel-to-toe in straight line</li>
                          <li>Mental confusion, hallucinations, extreme lethargy</li>
                          <li>Severe intractable headache unresponsive to analgesics</li>
                        </ul>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                          <p><strong className="text-rose-400">Emergency Descent:</strong> Immediate &gt;1,000m descent</p>
                          <p><strong className="text-rose-400">Medication:</strong> Dexamethasone 8mg stat, then 4mg q6h</p>
                          <p><strong className="text-rose-400">Oxygen:</strong> 4-6 L/min; Gamow Bag 2 psi (105 mmHg)</p>
                        </div>
                      </div>

                      {/* HAPE */}
                      <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-sky-300 uppercase tracking-wider">
                            HAPE (Pulmonary Edema)
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                            #1 Altitude Killer
                          </span>
                        </div>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                          <li>Severe dyspnea (breathlessness) at complete rest</li>
                          <li>Cough with frothy pink or blood-tinged sputum</li>
                          <li>Audible lung crackles, cyanosis (blue lips/nails)</li>
                        </ul>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                          <p><strong className="text-sky-400">Emergency Descent:</strong> Immediate descent (minimize patient effort)</p>
                          <p><strong className="text-sky-400">Medication:</strong> Nifedipine 30mg sustained release q12h</p>
                          <p><strong className="text-sky-400">Oxygen:</strong> High-flow oxygen; Gamow Bag 2 hours</p>
                        </div>
                      </div>
                    </div>

                    {/* Satellite Dispatch & Frequencies */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <Radio className="w-3.5 h-3.5 text-[#B68D40]" />
                        SAR Dispatch & Satellite Beacon Telemetry
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedPack.emergencyGuide?.gpsSosInstructions}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <p className="text-slate-400 font-semibold">Nepal SAR Heli Ops</p>
                          <p className="font-bold text-[#E2C085]">+977-1-4123456</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <p className="text-slate-400 font-semibold">VHF Distress Line</p>
                          <p className="font-bold text-emerald-400">156.800 MHz (Ch 16)</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <p className="text-slate-400 font-semibold">COSPAS-SARSAT</p>
                          <p className="font-bold text-blue-400">406.037 MHz</p>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-4">
                <Compass className="w-12 h-12 text-[#B68D40] mx-auto opacity-40" />
                <h3 className="text-base font-bold text-white">No Route Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a cached route pack from the left column or download a new trail pack from the directory.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default function OfflinePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-[#B68D40] gap-3">
          <Compass className="w-8 h-8 animate-spin" />
          <span className="text-xs">Loading Wilderness Hub...</span>
        </div>
      }
    >
      <OfflineHubContent />
    </Suspense>
  );
}
