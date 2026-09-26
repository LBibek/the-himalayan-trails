'use client';

import React, { useState, useId } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Mountain,
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
  Save,
  Printer,
  FileCode,
  Loader2,
  GripVertical,
  Globe,
  Layers,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ActivityType, PlannerWaypoint, ACTIVITY_CONFIG } from '@/types/planner';
import PlannerElevationChart from '@/components/planner/PlannerElevationChart';

// Dynamically import Leaflet Planner Map without SSR
const ItineraryPlannerMap = dynamic(() => import('@/components/planner/ItineraryPlannerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-black/60 backdrop-blur-xl animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-3xl border border-white/10 shadow-2xl">
      Loading AllTrails Route Studio & Interactive Map Engine...
    </div>
  ),
});

// Dynamically import Cesium 3D Globe Map without SSR
const CesiumGlobeMap = dynamic(() => import('@/components/map/CesiumGlobeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-black/60 backdrop-blur-xl animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-3xl border border-white/10 shadow-2xl">
      Loading Cesium 3D Himalayan Terrain Engine...
    </div>
  ),
});

// Sortable Waypoint Item Component using @dnd-kit and HeroUI compound semantics
interface SortableWaypointItemProps {
  item: PlannerWaypoint;
  index: number;
  isActive: boolean;
  isHovered: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  onDelete: (index: number) => void;
}

function SortableWaypointItem({
  item,
  index,
  isActive,
  isHovered,
  onSelect,
  onHover,
  onDelete,
}: SortableWaypointItemProps) {
  const itemId = item.id || `waypoint-${item.day}-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const cfg = ACTIVITY_CONFIG[item.activityType] || ACTIVITY_CONFIG.trekking;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot="base"
      data-selected={isActive}
      data-hovered={isHovered}
      data-dragging={isDragging}
      onClick={() => onSelect(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer backdrop-blur-2xl group select-none print:border-neutral-300 print:bg-white print:text-black ${
        isDragging
          ? 'opacity-80 bg-neutral-900/95 border-[#B68D40] shadow-2xl ring-4 ring-[#B68D40]/50 scale-[1.03] z-50'
          : isActive
          ? 'bg-neutral-900/90 border-[#B68D40] shadow-2xl ring-2 ring-[#B68D40]/50 scale-[1.01]'
          : isHovered
          ? 'bg-neutral-900/70 border-amber-400/50 shadow-lg'
          : 'bg-black/60 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* DnD Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            data-slot="handle"
            className="mt-1 p-1 -ml-1 text-gray-500 hover:text-amber-400 cursor-grab active:cursor-grabbing rounded-lg hover:bg-white/10 transition print:hidden"
            title="Drag to reorder itinerary day"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Activity Icon Badge */}
          <div
            data-slot="indicator"
            className={`w-10 h-10 shrink-0 rounded-xl ${cfg.badgeBg} border ${cfg.borderColor} text-white font-extrabold flex flex-col items-center justify-center shadow-lg text-xs`}
          >
            <span>{cfg.iconSymbol}</span>
            <span className="text-[9px] font-mono">D{item.day}</span>
          </div>

          {/* Waypoint Details */}
          <div data-slot="body" className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-white print:text-black leading-snug">
                {item.title}
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${cfg.badgeBg} text-white border ${cfg.borderColor}`}
              >
                {cfg.label.split('/')[0]}
              </span>
            </div>

            <div className="text-xs text-gray-400 print:text-neutral-600 font-mono flex flex-wrap items-center gap-3">
              <span>
                Dist: <strong className="text-white print:text-black">{item.distanceKm} km</strong>
              </span>
              <span>•</span>
              <span>
                Sleeping Alt:{' '}
                <strong className="text-amber-400 print:text-black">
                  {item.sleepingAltitude.toLocaleString()}m
                </strong>
              </span>
              <span>•</span>
              <span className={item.altitudeGain >= 0 ? 'text-green-400' : 'text-cyan-400'}>
                {item.altitudeGain >= 0 ? `+${item.altitudeGain}m` : `${item.altitudeGain}m`}
              </span>
            </div>

            {item.notes && (
              <p className="text-[11px] text-gray-400 print:text-neutral-700 line-clamp-2 pt-1 border-t border-white/10 print:border-neutral-200">
                {item.notes}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div data-slot="actions" className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
            className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-900 transition print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            title="Delete Day"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryPlannerPage() {
  const dndId = useId();

  // Itinerary Waypoints State with stable IDs
  const [waypoints, setWaypoints] = useState<PlannerWaypoint[]>([
    {
      id: 'wp-1',
      day: 1,
      title: 'Flight to Lukla & Trek to Phakding',
      distanceKm: 8,
      sleepingAltitude: 2610,
      altitudeGain: -250,
      activityType: 'flight',
      coordinates: { lat: 27.6869, lng: 86.7314 },
      notes: 'Scenic twin-otter flight to Tenzing-Hillary airport, start trekking along Dudh Koshi river.',
    },
    {
      id: 'wp-2',
      day: 2,
      title: 'Phakding to Namche Bazaar',
      distanceKm: 11,
      sleepingAltitude: 3440,
      altitudeGain: 830,
      activityType: 'trekking',
      coordinates: { lat: 27.8069, lng: 86.7142 },
      notes: 'Cross Hillary Suspension Bridge and climb the famous steep Namche hill.',
    },
    {
      id: 'wp-3',
      day: 3,
      title: 'Namche Rest & Acclimatization Hike to Everest View Hotel',
      distanceKm: 5,
      sleepingAltitude: 3440,
      altitudeGain: 0,
      activityType: 'acclimatization',
      coordinates: { lat: 27.8120, lng: 86.7150 },
      notes: 'Day hike to Syangboche (3,880m) for panoramic views of Mt. Everest and Ama Dablam.',
    },
    {
      id: 'wp-4',
      day: 4,
      title: 'Namche Bazaar to Tengboche Monastery',
      distanceKm: 10,
      sleepingAltitude: 3867,
      altitudeGain: 427,
      activityType: 'monastery',
      coordinates: { lat: 27.8358, lng: 86.7645 },
      notes: 'Visit spiritual center of Khumbu region, witness monk evening chant ceremony.',
    },
    {
      id: 'wp-5',
      day: 5,
      title: 'Tengboche to Dingboche Valley',
      distanceKm: 11,
      sleepingAltitude: 4410,
      altitudeGain: 543,
      activityType: 'camp',
      coordinates: { lat: 27.8920, lng: 86.8310 },
      notes: 'Pass Pangboche ancient village, climb into Imja Valley surrounded by Lhotse peak.',
    },
    {
      id: 'wp-6',
      day: 6,
      title: 'Dingboche to Lobuche High Camp',
      distanceKm: 12,
      sleepingAltitude: 4940,
      altitudeGain: 530,
      activityType: 'camp',
      coordinates: { lat: 27.9480, lng: 86.8160 },
      notes: 'Trek along Khumbu Glacier lateral moraine and climber memorial stupas.',
    },
    {
      id: 'wp-7',
      day: 7,
      title: 'Lobuche to Gorak Shep & Everest Base Camp',
      distanceKm: 14,
      sleepingAltitude: 5364,
      altitudeGain: 424,
      activityType: 'pass',
      coordinates: { lat: 28.0026, lng: 86.8528 },
      notes: 'Reach Everest Base Camp at foot of Khumbu Icefall (5,364m).',
    },
  ]);

  // Three-Way Synchronization State (Map ↔ Timeline ↔ Elevation Line Chart)
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(0);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('trekking');
  const [viewLayout, setViewLayout] = useState<'split' | 'mapOnly' | 'timelineOnly'>('split');
  const [mapEngine, setMapEngine] = useState<'2d' | '3d'>('2d');
  const [showElevationProfile, setShowElevationProfile] = useState<boolean>(true);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDistance, setNewDistance] = useState('10');
  const [newAltitude, setNewAltitude] = useState('4500');
  const [newNotes, setNewNotes] = useState('');

  // Persistence State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // DnD Sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag threshold before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Metrics Calculations
  const maxAltitude = waypoints.length ? Math.max(...waypoints.map((w) => w.sleepingAltitude)) : 0;
  const totalDistance = waypoints.reduce((acc, w) => acc + w.distanceKm, 0);

  // Safety checks for rapid sleeping altitude gain (> 600m above 3,000m altitude without acclimatization)
  const highGainDays = waypoints.filter(
    (w) => w.sleepingAltitude > 3000 && w.altitudeGain > 600 && w.activityType !== 'acclimatization'
  );

  // Handle Drag & Drop reorder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = waypoints.findIndex(
      (w, idx) => (w.id || `waypoint-${w.day}-${idx}`) === active.id
    );
    const newIndex = waypoints.findIndex(
      (w, idx) => (w.id || `waypoint-${w.day}-${idx}`) === over.id
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(waypoints, oldIndex, newIndex);

      // Re-assign sequential day numbers and recalculate altitude gains
      const recalculated = reordered.map((w, idx) => {
        const prevAlt = idx > 0 ? reordered[idx - 1].sleepingAltitude : 2000;
        const gain = w.sleepingAltitude - prevAlt;
        return {
          ...w,
          day: idx + 1,
          altitudeGain: gain,
        };
      });

      setWaypoints(recalculated);
      setActiveDayIndex(newIndex);
    }
  };

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
      id: `wp-${Date.now()}`,
      day: waypoints.length + 1,
      title: newTitle,
      distanceKm: Number(newDistance),
      sleepingAltitude: targetAlt,
      altitudeGain: gain,
      activityType: selectedActivity,
      coordinates: { lat: newLat, lng: newLng },
      notes: newNotes || `${ACTIVITY_CONFIG[selectedActivity].label} along route.`,
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
      ? Math.round(
          Math.hypot((lat - prevWp.coordinates.lat) * 111, (lng - prevWp.coordinates.lng) * 100)
        )
      : 10;
    const gain = estimatedAlt - prevAlt;

    const newWp: PlannerWaypoint = {
      id: `wp-${Date.now()}`,
      day: waypoints.length + 1,
      title: `Day ${waypoints.length + 1} Waypoint (${ACTIVITY_CONFIG[activity].label.split('/')[0]})`,
      distanceKm: Math.max(estimatedDist, 4),
      sleepingAltitude: Math.max(estimatedAlt, 2000),
      altitudeGain: gain,
      activityType: activity,
      coordinates: { lat, lng },
      notes: `Custom waypoint dropped on map at ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E.`,
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
          coordinates: { lat, lng },
        };
      }
      return updated;
    });
  };

  // Delete Day Waypoint
  const handleDeleteDay = (index: number) => {
    const filtered = waypoints.filter((_, i) => i !== index);
    const updated = filtered.map((w, idx) => {
      const prevAlt = idx > 0 ? filtered[idx - 1].sleepingAltitude : 2000;
      return {
        ...w,
        day: idx + 1,
        altitudeGain: w.sleepingAltitude - prevAlt,
      };
    });

    setWaypoints(updated);
    if (activeDayIndex !== null && activeDayIndex >= updated.length) {
      setActiveDayIndex(Math.max(0, updated.length - 1));
    }
  };

  // Real GPX XML Download Generator
  const handleExportGPX = () => {
    const routeTitle = 'Custom Himalayan Expedition Route';
    const gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="The Himalayan Trails - Route Studio" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${routeTitle}</name>
    <desc>Custom Himalayan Expedition Itinerary (${waypoints.length} Days, ${totalDistance} km, Max Altitude ${maxAltitude}m)</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <rte>
    <name>${routeTitle}</name>
    ${waypoints
      .map(
        (w) => `
    <rtept lat="${w.coordinates.lat}" lon="${w.coordinates.lng}">
      <ele>${w.sleepingAltitude}</ele>
      <name>Day ${w.day}: ${w.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</name>
      <desc>${(w.notes || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</desc>
      <type>${w.activityType}</type>
    </rtept>`
      )
      .join('')}
  </rte>
  <trk>
    <name>${routeTitle} Track</name>
    <trkseg>
      ${waypoints
        .map(
          (w) => `
      <trkpt lat="${w.coordinates.lat}" lon="${w.coordinates.lng}">
        <ele>${w.sleepingAltitude}</ele>
        <time>${new Date().toISOString()}</time>
      </trkpt>`
        )
        .join('')}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxXml], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `himalayan-expedition-${waypoints.length}days.gpx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  // Print / PDF generator trigger
  const handlePrintPDF = () => {
    window.print();
  };

  // Save Custom Itinerary to Database via API
  const handleSaveItinerary = async () => {
    if (!waypoints.length) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Custom Expedition (${waypoints.length} Days)`,
          trailName: waypoints[0]?.title || 'Himalayan Custom Route',
          author: 'Trekker Expedition Planner',
          totalDays: waypoints.length,
          maxAltitude,
          difficulty: maxAltitude > 5000 ? 'Challenging' : 'Moderate',
          estimatedCostUSD: waypoints.length * 85,
          days: waypoints.map((w) => ({
            day: w.day,
            title: w.title,
            route: `Day ${w.day}: ${w.coordinates.lat.toFixed(3)}°N, ${w.coordinates.lng.toFixed(3)}°E`,
            distanceKm: w.distanceKm,
            hours: Math.round(w.distanceKm / 2.5),
            sleepingAltitude: w.sleepingAltitude,
            altitudeGain: w.altitudeGain,
            highlights: w.notes || `${ACTIVITY_CONFIG[w.activityType]?.label || 'Trek'} route section`,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save itinerary');
      }

      const savedData = await res.json();
      setSaveSuccessMessage(`Itinerary successfully saved to database (ID: ${savedData.id})!`);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error saving custom itinerary');
    } finally {
      setIsSaving(false);
    }
  };

  // Polyline coordinates for 3D Cesium Map
  const activeWp =
    activeDayIndex !== null
      ? waypoints[activeDayIndex]
      : hoveredDayIndex !== null
      ? waypoints[hoveredDayIndex]
      : waypoints[0];

  const cesiumPolyline = {
    id: 'planner-3d-route',
    points: waypoints.map((w) => ({
      lat: w.coordinates.lat,
      lng: w.coordinates.lng,
      altitude: w.sleepingAltitude,
    })),
    color: '#B68D40',
    weight: 5,
  };

  const cesiumMarkers = waypoints.map((w) => ({
    id: `planner-marker-${w.day}`,
    position: {
      lat: w.coordinates.lat,
      lng: w.coordinates.lng,
      altitude: w.sleepingAltitude,
    },
    title: `Day ${w.day}: ${w.title}`,
    elevation: w.sleepingAltitude,
    category: w.activityType,
  }));

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 bg-black text-white print:bg-white print:text-black print:p-0">
      {/* 1. GLASSMORPHIC TOP HEADER */}
      <div
        data-slot="base"
        className="p-6 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none print:bg-transparent"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B68D40]/20 border border-[#B68D40]/40 text-[#B68D40] text-xs font-semibold uppercase tracking-wider backdrop-blur-md print:hidden">
            <Compass className="h-3.5 w-3.5" />
            <span>Interactive DnD Timeline ↔ 2D/3D Map ↔ Recharts Altitude Sync</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-white tracking-tight print:text-black">
            Himalayan Expedition Custom Route Planner
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl print:text-neutral-700">
            Drag to reorder days using DnD, click or drag markers on the map, and monitor the Recharts elevation curve in real-time.
          </p>
        </div>

        {/* Action Controls & Layout Toggles */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {/* Map Engine Toggle (2D Leaflet vs 3D Cesium Globe) */}
          <div className="p-1 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md flex items-center text-xs shadow-xl">
            <button
              onClick={() => setMapEngine('2d')}
              data-slot="trigger"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                mapEngine === '2d'
                  ? 'bg-[#B68D40] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>2D Topo</span>
            </button>
            <button
              onClick={() => setMapEngine('3d')}
              data-slot="trigger"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                mapEngine === '3d'
                  ? 'bg-[#B68D40] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>3D Globe</span>
            </button>
          </div>

          {/* View Modes */}
          <div className="p-1 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md flex items-center text-xs shadow-xl">
            <button
              onClick={() => setViewLayout('split')}
              data-slot="trigger"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                viewLayout === 'split'
                  ? 'bg-[#B68D40] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewLayout('mapOnly')}
              data-slot="trigger"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                viewLayout === 'mapOnly'
                  ? 'bg-[#B68D40] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Map Only</span>
            </button>
            <button
              onClick={() => setViewLayout('timelineOnly')}
              data-slot="trigger"
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                viewLayout === 'timelineOnly'
                  ? 'bg-[#B68D40] text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>

          {/* Export GPX Button */}
          <button
            onClick={handleExportGPX}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/80 border border-white/15 text-xs font-bold text-gray-200 hover:bg-neutral-800 transition backdrop-blur-md shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title="Download standard GPX 1.1 file"
          >
            <FileCode className="h-4 w-4 text-[#B68D40]" />
            <span>Export GPX</span>
          </button>

          {/* Print / Export PDF Button */}
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/80 border border-white/15 text-xs font-bold text-gray-200 hover:bg-neutral-800 transition backdrop-blur-md shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title="Print or Save PDF"
          >
            <Printer className="h-4 w-4 text-[#B68D40]" />
            <span>Print PDF</span>
          </button>

          {/* Save Itinerary Button */}
          <button
            onClick={handleSaveItinerary}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black text-xs font-extrabold transition shadow-xl disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Cloud'}</span>
          </button>
        </div>
      </div>

      {/* SAVE SUCCESS TOAST BANNER */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-green-500/20 border border-green-500/40 text-green-300 text-xs flex items-center gap-3 shadow-2xl backdrop-blur-md animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <span className="font-semibold">{saveSuccessMessage}</span>
        </div>
      )}

      {/* 2. ACCLIMATIZATION SAFETY ADVISORY WARNING BANNER */}
      {highGainDays.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-3 shadow-2xl backdrop-blur-md animate-pulse print:border-neutral-300 print:text-black">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white text-sm print:text-black">
              High Altitude Acclimatization Alert Triggered
            </div>
            <p className="text-gray-300 print:text-neutral-700">
              Day {highGainDays.map((w) => w.day).join(', ')} has a sleeping elevation gain exceeding 600m above 3,000m. Consider adding an acclimatization rest day (Category: <strong>Acclimatization Rest 🧘</strong>) to mitigate Acute Mountain Sickness (AMS).
            </p>
          </div>
        </div>
      )}

      {/* 3. GLASSMORPHIC ACTIVITY ICON SELECTOR & ROUTE METRICS */}
      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4 print:border print:border-neutral-300 print:bg-neutral-50 print:text-black">
        {/* Activity Type Selection Pills */}
        <div className="space-y-1.5 print:hidden">
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
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]`}
                >
                  <span className="text-sm">{cfg.iconSymbol}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center gap-5 text-xs font-mono border-l border-white/10 pl-5 print:border-none print:pl-0">
          <div>
            <div className="text-gray-400 text-[10px] print:text-neutral-500">TOTAL DISTANCE</div>
            <div className="text-lg font-bold text-[#B68D40] print:text-black">{totalDistance} km</div>
          </div>
          <div>
            <div className="text-gray-400 text-[10px] print:text-neutral-500">MAX ELEVATION</div>
            <div className="text-lg font-bold text-amber-400 print:text-black">{maxAltitude.toLocaleString()}m</div>
          </div>
          <div>
            <div className="text-gray-400 text-[10px] print:text-neutral-500">DURATION</div>
            <div className="text-lg font-bold text-green-400 print:text-black">{waypoints.length} Days</div>
          </div>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE (MAP & DND TIMELINE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MAP SECTION (2D LEAFLET OR 3D CESIUM) */}
        {(viewLayout === 'split' || viewLayout === 'mapOnly') && (
          <div
            className={`${
              viewLayout === 'mapOnly' ? 'lg:col-span-12' : 'lg:col-span-7'
            } space-y-4 print:hidden`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#B68D40] uppercase tracking-wider flex items-center gap-2">
                {mapEngine === '2d' ? (
                  <>
                    <MapIcon className="h-4 w-4" />
                    <span>Interactive Leaflet Map & Synced Markers</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    <span>Cesium 3D Himalayan Terrain & Waypoint Fly-To</span>
                  </>
                )}
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                {mapEngine === '2d'
                  ? 'Click map to drop waypoints • Drag markers to update'
                  : '3D Terrain Elevation View of Custom Route'}
              </span>
            </div>

            {mapEngine === '2d' ? (
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
            ) : (
              <CesiumGlobeMap
                height={viewLayout === 'mapOnly' ? 'h-[650px]' : 'h-[520px]'}
                polyline={cesiumPolyline}
                markers={cesiumMarkers}
                scrubberPoint={
                  activeWp
                    ? {
                        lat: activeWp.coordinates.lat,
                        lng: activeWp.coordinates.lng,
                        altitude: activeWp.sleepingAltitude + 500,
                      }
                    : null
                }
                initialCenter={
                  activeWp
                    ? {
                        lat: activeWp.coordinates.lat,
                        lng: activeWp.coordinates.lng,
                        altitude: 9000,
                      }
                    : { lat: 27.85, lng: 86.75, altitude: 9000 }
                }
                onClose3D={() => setMapEngine('2d')}
              />
            )}
          </div>
        )}

        {/* TIMELINE & DND REORDER SECTION */}
        {(viewLayout === 'split' || viewLayout === 'timelineOnly') && (
          <div
            className={`${
              viewLayout === 'timelineOnly' ? 'lg:col-span-12' : 'lg:col-span-5'
            } space-y-6 print:col-span-12 print:w-full`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 print:text-black">
                <Calendar className="h-4 w-4 text-[#B68D40]" />
                <span>
                  Itinerary Timeline ({waypoints.length} Days)
                </span>
              </h3>
              <span className="text-xs text-[#B68D40] font-semibold print:text-black">
                Est. ${waypoints.length * 85} USD
              </span>
            </div>

            {/* DND SORTABLE CONTEXT LIST */}
            <DndContext
              id={dndId}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={waypoints.map((w, idx) => w.id || `waypoint-${w.day}-${idx}`)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  data-slot="sortable-list"
                  className="space-y-3 max-h-[480px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible"
                >
                  {waypoints.map((item, index) => (
                    <SortableWaypointItem
                      key={item.id || `waypoint-${item.day}-${index}`}
                      item={item}
                      index={index}
                      isActive={activeDayIndex === index}
                      isHovered={hoveredDayIndex === index}
                      onSelect={setActiveDayIndex}
                      onHover={setHoveredDayIndex}
                      onDelete={handleDeleteDay}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* ADD DAY TO TIMELINE FORM */}
            <form
              onSubmit={handleAddDayForm}
              data-slot="form"
              className="p-5 rounded-2xl bg-black/60 border border-dashed border-white/15 backdrop-blur-xl space-y-4 print:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="text-xs font-bold text-[#B68D40] uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>Add Day to Itinerary Timeline</span>
                </h4>
                <span className="text-[10px] text-gray-400">
                  Selected: <strong>{ACTIVITY_CONFIG[selectedActivity].label}</strong>
                </span>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Day Destination Title (e.g. Lobuche to EBC)"
                  className="w-full rounded-xl bg-black/80 border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                      Trek Distance (km)
                    </label>
                    <input
                      type="number"
                      value={newDistance}
                      onChange={(e) => setNewDistance(e.target.value)}
                      className="w-full rounded-xl bg-black/80 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                      Sleeping Altitude (m)
                    </label>
                    <input
                      type="number"
                      value={newAltitude}
                      onChange={(e) => setNewAltitude(e.target.value)}
                      className="w-full rounded-xl bg-black/80 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Highlights or acclimatization notes..."
                  className="w-full rounded-xl bg-black/80 border border-white/10 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
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
        <div className="pt-2 print:hidden">
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
