'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Mountain,
  ShieldAlert,
  ArrowRight,
  Compass,
  MapPin,
  TrendingUp,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  ChevronRight,
  Sparkles,
  Info,
  Move
} from 'lucide-react';
import { ActivityType, PlannerWaypoint, ACTIVITY_CONFIG } from '@/types/planner';
import PlannerElevationChart from '@/components/planner/PlannerElevationChart';

// Dynamically import Leaflet Planner Map without SSR
const ItineraryPlannerMap = dynamic(() => import('@/components/planner/ItineraryPlannerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-black/60 backdrop-blur-xl animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-2xl border border-white/10 shadow-2xl">
      Loading AllTrails Route Studio & Interactive Map Engine...
    </div>
  )
});

export default function ItineraryPlannerPage() {
  // Itinerary Waypoints State
  const [waypoints, setWaypoints] = useState<PlannerWaypoint[]>([
    {
      day: 1,
      title: 'Flight to Lukla & Trek to Phakding',
      distanceKm: 8,
      sleepingAltitude: 2610,
      altitudeGain: -250,
      activityType: 'flight',
      coordinates: { lat: 27.6869, lng: 86.7314 },
      notes: 'Scenic twin-otter flight to Tenzing-Hillary airport, start trekking along Dudh Koshi river.'
    },
    {
      day: 2,
      title: 'Phakding to Namche Bazaar',
      distanceKm: 11,
      sleepingAltitude: 3440,
      altitudeGain: 830,
      activityType: 'trekking',
      coordinates: { lat: 27.8069, lng: 86.7142 },
      notes: 'Cross Hillary Suspension Bridge and climb the famous steep Namche hill.'
    },
    {
      day: 3,
      title: 'Namche Rest & Acclimatization Hike to Everest View Hotel',
      distanceKm: 5,
      sleepingAltitude: 3440,
      altitudeGain: 0,
      activityType: 'acclimatization',
      coordinates: { lat: 27.8120, lng: 86.7150 },
      notes: 'Day hike to Syangboche (3,880m) for panoramic views of Mt. Everest and Ama Dablam.'
    },
    {
      day: 4,
      title: 'Namche Bazaar to Tengboche Monastery',
      distanceKm: 10,
      sleepingAltitude: 3867,
      altitudeGain: 427,
      activityType: 'monastery',
      coordinates: { lat: 27.8358, lng: 86.7645 },
      notes: 'Visit spiritual center of Khumbu region, witness monk evening chant ceremony.'
    },
    {
      day: 5,
      title: 'Tengboche to Dingboche Valley',
      distanceKm: 11,
      sleepingAltitude: 4410,
      altitudeGain: 543,
      activityType: 'camp',
      coordinates: { lat: 27.8920, lng: 86.8310 },
      notes: 'Pass Pangboche ancient village, climb into Imja Valley surrounded by Lhotse peak.'
    },
    {
      day: 6,
      title: 'Dingboche to Lobuche High Camp',
      distanceKm: 12,
      sleepingAltitude: 4940,
      altitudeGain: 530,
      activityType: 'camp',
      coordinates: { lat: 27.9480, lng: 86.8160 },
      notes: 'Trek along Khumbu Glacier lateral moraine and climber memorial stupas.'
    },
    {
      day: 7,
      title: 'Lobuche to Gorak Shep & Everest Base Camp',
      distanceKm: 14,
      sleepingAltitude: 5364,
      altitudeGain: 424,
      activityType: 'pass',
      coordinates: { lat: 28.0026, lng: 86.8528 },
      notes: 'Reach Everest Base Camp at foot of Khumbu Icefall (5,364m).'
    }
  ]);

  // Three-Way Synchronization State (Map ↔ Timeline ↔ Elevation Line Chart)
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(0);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('trekking');
  const [viewLayout, setViewLayout] = useState<'split' | 'mapOnly' | 'timelineOnly'>('split');
  const [showElevationProfile, setShowElevationProfile] = useState<boolean>(true);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDistance, setNewDistance] = useState('10');
  const [newAltitude, setNewAltitude] = useState('4500');
  const [newNotes, setNewNotes] = useState('');

  // Metrics Calculations
  const maxAltitude = waypoints.length ? Math.max(...waypoints.map((w) => w.sleepingAltitude)) : 0;
  const totalDistance = waypoints.reduce((acc, w) => acc + w.distanceKm, 0);

  // Safety checks for rapid sleeping altitude gain (> 600m above 3,000m altitude without acclimatization)
  const highGainDays = waypoints.filter(
    (w) => w.sleepingAltitude > 3000 && w.altitudeGain > 600 && w.activityType !== 'acclimatization'
  );

  // Form submit handler
  const handleAddDayForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const prevWp = waypoints[waypoints.length - 1];
    const prevAlt = prevWp ? prevWp.sleepingAltitude : 2000;
    const targetAlt = Number(newAltitude);
    const gain = targetAlt - prevAlt;

    const lastLat = prevWp ? prevWp.coordinates.lat : 27.8000;
    const lastLng = prevWp ? prevWp.coordinates.lng : 86.7000;
    const newLat = lastLat + 0.02 + (Math.random() * 0.01 - 0.005);
    const newLng = lastLng + 0.02 + (Math.random() * 0.01 - 0.005);

    const newWp: PlannerWaypoint = {
      day: waypoints.length + 1,
      title: newTitle,
      distanceKm: Number(newDistance),
      sleepingAltitude: targetAlt,
      altitudeGain: gain,
      activityType: selectedActivity,
      coordinates: { lat: newLat, lng: newLng },
      notes: newNotes || `${ACTIVITY_CONFIG[selectedActivity].label} along route.`
    };

    setWaypoints([...waypoints, newWp]);
    setActiveDayIndex(waypoints.length);
    setNewTitle('');
    setNewNotes('');
  };

  // Add Waypoint directly on Leaflet Map Click
  const handleAddWaypointOnMapClick = (lat: number, lng: number, activity: ActivityType) => {
    const prevWp = waypoints[waypoints.length - 1];
    const prevAlt = prevWp ? prevWp.sleepingAltitude : 2500;
    const estimatedAlt = prevAlt + Math.floor(Math.random() * 300) - 100;
    const estimatedDist = prevWp
      ? Math.round(Math.hypot((lat - prevWp.coordinates.lat) * 111, (lng - prevWp.coordinates.lng) * 100))
      : 10;
    const gain = estimatedAlt - prevAlt;

    const newWp: PlannerWaypoint = {
      day: waypoints.length + 1,
      title: `Day ${waypoints.length + 1} Waypoint (${ACTIVITY_CONFIG[activity].label.split('/')[0]})`,
      distanceKm: Math.max(estimatedDist, 4),
      sleepingAltitude: Math.max(estimatedAlt, 2000),
      altitudeGain: gain,
      activityType: activity,
      coordinates: { lat, lng },
      notes: `Custom waypoint dropped on map at ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E.`
    };

    setWaypoints([...waypoints, newWp]);
    setActiveDayIndex(waypoints.length);
  };

  // Update Waypoint coordinates when user drags marker on Leaflet Map
  const handleUpdateWaypointCoords = (index: number, lat: number, lng: number) => {
    setWaypoints((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          coordinates: { lat, lng }
        };
      }
      return updated;
    });
  };

  // Delete Day Waypoint
  const handleDeleteDay = (index: number) => {
    const updated = waypoints
      .filter((_, i) => i !== index)
      .map((w, idx) => ({ ...w, day: idx + 1 }));
    setWaypoints(updated);
    if (activeDayIndex !== null && activeDayIndex >= updated.length) {
      setActiveDayIndex(Math.max(0, updated.length - 1));
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 bg-black text-white">
      
      {/* 1. GLASSMORPHIC TOP HEADER */}
      <div className="p-6 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B68D40]/20 border border-[#B68D40]/40 text-[#B68D40] text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Compass className="h-3.5 w-3.5" />
            <span>Interactive Map ↔ Timeline ↔ Altitude Chart Sync Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-white tracking-tight">
            Himalayan Expedition Custom Route Planner
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl">
            Click or drag markers on the Leaflet map to plot your trek. The map, timeline cards, and altitude line chart remain dynamically synchronized in real-time.
          </p>
        </div>

        {/* Action Controls & Layout Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* View Modes */}
          <div className="p-1 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md flex items-center text-xs shadow-xl">
            <button
              onClick={() => setViewLayout('split')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                viewLayout === 'split' ? 'bg-[#B68D40] text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              onClick={() => setViewLayout('mapOnly')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                viewLayout === 'mapOnly' ? 'bg-[#B68D40] text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Map Only</span>
            </button>
            <button
              onClick={() => setViewLayout('timelineOnly')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                viewLayout === 'timelineOnly' ? 'bg-[#B68D40] text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>

          <button
            onClick={() => alert('Exporting Custom Expedition Route to PDF...')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/80 border border-white/15 text-xs font-bold text-gray-200 hover:bg-neutral-800 transition backdrop-blur-md shadow-xl"
          >
            <Download className="h-4 w-4 text-[#B68D40]" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 2. ACCLIMATIZATION SAFETY ADVISORY WARNING BANNER */}
      {highGainDays.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-3 shadow-2xl backdrop-blur-md animate-pulse">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white text-sm">High Altitude Acclimatization Alert Triggered</div>
            <p className="text-gray-300">
              Day {highGainDays.map((w) => w.day).join(', ')} has a sleeping elevation gain exceeding 600m above 3,000m. Consider adding an acclimatization rest day (Category: <strong>Acclimatization Rest 🧘</strong>) to mitigate Acute Mountain Sickness (AMS).
            </p>
          </div>
        </div>
      )}

      {/* 3. GLASSMORPHIC ACTIVITY ICON SELECTOR & ROUTE METRICS */}
      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Activity Type Selection Pills */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#B68D40]" />
            <span>Active Activity Icon Selector (Click Map to Place)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(ACTIVITY_CONFIG) as ActivityType[]).map((actKey) => {
              const cfg = ACTIVITY_CONFIG[actKey];
              const isSelected = selectedActivity === actKey;
              return (
                <button
                  key={actKey}
                  onClick={() => setSelectedActivity(actKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                    isSelected
                      ? `${cfg.badgeBg} text-white border-white shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-400/50`
                      : 'bg-black/60 text-gray-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm">{cfg.iconSymbol}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center gap-5 text-xs font-mono border-l border-white/10 pl-5">
          <div>
            <div className="text-gray-400 text-[10px]">TOTAL DISTANCE</div>
            <div className="text-lg font-bold text-[#B68D40]">{totalDistance} km</div>
          </div>
          <div>
            <div className="text-gray-400 text-[10px]">MAX ELEVATION</div>
            <div className="text-lg font-bold text-amber-400">{maxAltitude}m</div>
          </div>
          <div>
            <div className="text-gray-400 text-[10px]">DURATION</div>
            <div className="text-lg font-bold text-green-400">{waypoints.length} Days</div>
          </div>
        </div>

      </div>

      {/* 4. MAIN WORKSPACE (MAP & TIMELINE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEAFLET MAP SECTION */}
        {(viewLayout === 'split' || viewLayout === 'mapOnly') && (
          <div className={viewLayout === 'mapOnly' ? 'lg:col-span-12' : 'lg:col-span-7 space-y-4'}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#B68D40] uppercase tracking-wider flex items-center gap-2">
                <MapIcon className="h-4 w-4" />
                <span>Interactive Leaflet Map & Synced Markers</span>
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                Click map to drop waypoints • Drag markers to update
              </span>
            </div>

            <ItineraryPlannerMap
              waypoints={waypoints}
              activeDayIndex={activeDayIndex}
              hoveredDayIndex={hoveredDayIndex}
              onSelectDayIndex={setActiveDayIndex}
              onHoverDayIndex={setHoveredDayIndex}
              onAddWaypointOnMapClick={handleAddWaypointOnMapClick}
              onUpdateWaypointCoords={handleUpdateWaypointCoords}
              onDeleteWaypoint={handleDeleteDay}
              selectedActivity={selectedActivity}
              onSelectActivity={setSelectedActivity}
              height={viewLayout === 'mapOnly' ? 'h-[650px]' : 'h-[520px]'}
            />
          </div>
        )}

        {/* TIMELINE & ADD FORM SECTION */}
        {(viewLayout === 'split' || viewLayout === 'timelineOnly') && (
          <div className={viewLayout === 'timelineOnly' ? 'lg:col-span-12 space-y-6' : 'lg:col-span-5 space-y-6'}>
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#B68D40]" />
                <span>Itinerary Timeline ({waypoints.length} Days)</span>
              </h3>
              <span className="text-xs text-[#B68D40] font-semibold">
                Est. ${waypoints.length * 85} USD
              </span>
            </div>

            {/* TIMELINE LIST */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {waypoints.map((item, index) => {
                const isActive = activeDayIndex === index;
                const isHovered = hoveredDayIndex === index;
                const cfg = ACTIVITY_CONFIG[item.activityType] || ACTIVITY_CONFIG.trekking;

                return (
                  <div
                    key={item.day}
                    onClick={() => setActiveDayIndex(index)}
                    onMouseEnter={() => setHoveredDayIndex(index)}
                    onMouseLeave={() => setHoveredDayIndex(null)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl ${
                      isActive
                        ? 'bg-neutral-900/90 border-[#B68D40] shadow-2xl ring-2 ring-[#B68D40]/50 scale-[1.01]'
                        : isHovered
                        ? 'bg-neutral-900/70 border-amber-400/50 shadow-lg'
                        : 'bg-black/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      
                      <div className="flex items-start gap-3">
                        {/* Activity Icon Badge */}
                        <div className={`w-10 h-10 shrink-0 rounded-xl ${cfg.badgeBg} border ${cfg.borderColor} text-white font-extrabold flex flex-col items-center justify-center shadow-lg text-xs`}>
                          <span>{cfg.iconSymbol}</span>
                          <span className="text-[9px] font-mono">D{item.day}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-white leading-snug">{item.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cfg.badgeBg} text-white border ${cfg.borderColor}`}>
                              {cfg.label.split('/')[0]}
                            </span>
                          </div>

                          <div className="text-xs text-gray-400 font-mono flex flex-wrap items-center gap-3">
                            <span>Dist: <strong className="text-white">{item.distanceKm} km</strong></span>
                            <span>•</span>
                            <span>Sleeping Alt: <strong className="text-amber-400">{item.sleepingAltitude}m</strong></span>
                            <span>•</span>
                            <span className={item.altitudeGain >= 0 ? 'text-green-400' : 'text-cyan-400'}>
                              {item.altitudeGain >= 0 ? `+${item.altitudeGain}m` : `${item.altitudeGain}m`}
                            </span>
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-gray-400 line-clamp-2 pt-1 border-t border-white/10">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDay(index);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-900 transition"
                        title="Delete Day"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* ADD DAY TO TIMELINE FORM */}
            <form onSubmit={handleAddDayForm} className="p-5 rounded-2xl bg-black/60 border border-dashed border-white/15 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="text-xs font-bold text-[#B68D40] uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>Add Day to Itinerary Timeline</span>
                </h4>
                <span className="text-[10px] text-gray-400">Selected: <strong>{ACTIVITY_CONFIG[selectedActivity].label}</strong></span>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Day Destination Title (e.g. Lobuche to EBC)"
                  className="w-full rounded-xl bg-black/80 border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B68D40]"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Trek Distance (km)</label>
                    <input
                      type="number"
                      value={newDistance}
                      onChange={(e) => setNewDistance(e.target.value)}
                      className="w-full rounded-xl bg-black/80 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Sleeping Altitude (m)</label>
                    <input
                      type="number"
                      value={newAltitude}
                      onChange={(e) => setNewAltitude(e.target.value)}
                      className="w-full rounded-xl bg-black/80 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Highlights or acclimatization notes..."
                  className="w-full rounded-xl bg-black/80 border border-white/10 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Append Day {waypoints.length + 1} to Itinerary</span>
              </button>
            </form>

          </div>
        )}

      </div>

      {/* 5. GLASSMORPHIC BOTTOM DOCKED ELEVATION PROFILE CHART WITH 3-WAY SYNC */}
      {showElevationProfile && waypoints.length > 0 && (
        <div className="pt-2">
          <PlannerElevationChart
            waypoints={waypoints}
            activeDayIndex={activeDayIndex}
            hoveredDayIndex={hoveredDayIndex}
            onSelectDayIndex={setActiveDayIndex}
            onHoverDayIndex={setHoveredDayIndex}
          />
        </div>
      )}

    </div>
  );
}
