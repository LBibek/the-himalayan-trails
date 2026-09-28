'use client';

import React, { useState, useEffect, useId, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  ChevronDown,
  Sparkles,
  Info,
  Save,
  Printer,
  FileCode,
  Loader2,
  GripVertical,
  Globe,
  Layers,
  UploadCloud,
  Download,
  Filter,
  Route,
  RefreshCw,
  ExternalLink,
  Edit3,
  Check,
  X,
  Copy,
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
import { Trail, Landmark } from '@/types';
import PlannerElevationChart from '@/components/planner/PlannerElevationChart';
import { parseRouteFile, ParsedRouteResult } from '@/lib/gpxParser';

// Dynamically import Leaflet Planner Map without SSR
const ItineraryPlannerMap = dynamic(() => import('@/components/planner/ItineraryPlannerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-black/60 backdrop-blur-xl animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-3xl border border-white/10 shadow-2xl">
      Loading AllTrails Route Studio &amp; Interactive Map Engine...
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

// Authentic Canonical Itinerary Presets for popular expeditions
const EXPEDITION_BASE_DAYS: Record<string, PlannerWaypoint[]> = {
  'ebc-trek': [
    {
      id: 'ebc-d1',
      day: 1,
      title: 'Lukla Airstrip to Phakding',
      distanceKm: 8,
      sleepingAltitude: 2610,
      altitudeGain: -250,
      activityType: 'flight',
      coordinates: { lat: 27.6869, lng: 86.7314 },
      notes: 'Scenic mountain flight into Tenzing-Hillary Airport, begin trek beside the Dudh Koshi river.',
    },
    {
      id: 'ebc-d2',
      day: 2,
      title: 'Phakding to Namche Bazaar',
      distanceKm: 11,
      sleepingAltitude: 3440,
      altitudeGain: 830,
      activityType: 'trekking',
      coordinates: { lat: 27.8069, lng: 86.7142 },
      notes: 'Cross Hillary Suspension Bridge and make the steep ascent to the Sherpa capital.',
    },
    {
      id: 'ebc-d3',
      day: 3,
      title: 'Namche Rest & Acclimatization Hike',
      distanceKm: 5,
      sleepingAltitude: 3440,
      altitudeGain: 0,
      activityType: 'acclimatization',
      coordinates: { lat: 27.8120, lng: 86.7150 },
      notes: 'Day hike to Syangboche (3,880m) for panoramic vistas of Everest, Lhotse, and Ama Dablam.',
    },
    {
      id: 'ebc-d4',
      day: 4,
      title: 'Namche Bazaar to Tengboche Monastery',
      distanceKm: 10,
      sleepingAltitude: 3867,
      altitudeGain: 427,
      activityType: 'monastery',
      coordinates: { lat: 27.8358, lng: 86.7645 },
      notes: 'Traverse high ridge above Imja Khola, visit Tengboche Dawa Choling Gompa.',
    },
    {
      id: 'ebc-d5',
      day: 5,
      title: 'Tengboche to Dingboche Alpine Valley',
      distanceKm: 11,
      sleepingAltitude: 4410,
      altitudeGain: 543,
      activityType: 'camp',
      coordinates: { lat: 27.8920, lng: 86.8310 },
      notes: 'Pass ancient Pangboche village and enter stone-walled pastures of Dingboche.',
    },
    {
      id: 'ebc-d6',
      day: 6,
      title: 'Dingboche to Lobuche High Moraine',
      distanceKm: 12,
      sleepingAltitude: 4940,
      altitudeGain: 530,
      activityType: 'camp',
      coordinates: { lat: 27.9480, lng: 86.8160 },
      notes: 'Climb Dughla Pass past climber memorials, reach Khumbu Glacier terminal moraine.',
    },
    {
      id: 'ebc-d7',
      day: 7,
      title: 'Lobuche to Gorak Shep & Everest Base Camp',
      distanceKm: 14,
      sleepingAltitude: 5364,
      altitudeGain: 424,
      activityType: 'pass',
      coordinates: { lat: 28.0026, lng: 86.8528 },
      notes: 'Trek over glacial rubble to Gorak Shep and reach Everest Base Camp at the Khumbu Icefall.',
    },
  ],
  'annapurna-circuit': [
    {
      id: 'ac-d1',
      day: 1,
      title: 'Besisahar Trailhead to Chame',
      distanceKm: 14,
      sleepingAltitude: 2670,
      altitudeGain: 1910,
      activityType: 'trekking',
      coordinates: { lat: 28.5520, lng: 84.2380 },
      notes: 'Ascend through dramatic gorges of the Marshyangdi river into pine forests.',
    },
    {
      id: 'ac-d2',
      day: 2,
      title: 'Chame to Upper Pisang',
      distanceKm: 15,
      sleepingAltitude: 3200,
      altitudeGain: 530,
      activityType: 'trekking',
      coordinates: { lat: 28.6050, lng: 84.1450 },
      notes: 'View the sweeping Paungda Danda curved rock wall, cross into Manang district.',
    },
    {
      id: 'ac-d3',
      day: 3,
      title: 'Upper Pisang to Manang Valley',
      distanceKm: 16,
      sleepingAltitude: 3519,
      altitudeGain: 319,
      activityType: 'trekking',
      coordinates: { lat: 28.6670, lng: 84.0200 },
      notes: 'High trail via Ghyaru and Ngawal with stunning Annapurna II and IV panoramas.',
    },
    {
      id: 'ac-d4',
      day: 4,
      title: 'Manang Acclimatization & Gangapurna Lake',
      distanceKm: 6,
      sleepingAltitude: 3519,
      altitudeGain: 0,
      activityType: 'acclimatization',
      coordinates: { lat: 28.6700, lng: 84.0150 },
      notes: 'Day hike to Gangapurna glacial lake and Praken Gompa for high-pass blessing.',
    },
    {
      id: 'ac-d5',
      day: 5,
      title: 'Manang to Yak Kharka & Thorong Phedi',
      distanceKm: 14,
      sleepingAltitude: 4525,
      altitudeGain: 1006,
      activityType: 'camp',
      coordinates: { lat: 28.7500, lng: 83.9600 },
      notes: 'Trek into barren alpine tundra below the imposing Thorong peak.',
    },
    {
      id: 'ac-d6',
      day: 6,
      title: 'Thorong Phedi over Thorong La Pass to Muktinath',
      distanceKm: 16,
      sleepingAltitude: 3760,
      altitudeGain: 891,
      activityType: 'pass',
      coordinates: { lat: 28.7940, lng: 83.9370 },
      notes: 'Pre-dawn summit push to Thorong La (5,416m), descend to sacred pilgrimage temple of Muktinath.',
    },
  ],
  'langtang-valley': [
    {
      id: 'lv-d1',
      day: 1,
      title: 'Syabrubesi to Lama Hotel',
      distanceKm: 11,
      sleepingAltitude: 2470,
      altitudeGain: 967,
      activityType: 'trekking',
      coordinates: { lat: 28.1650, lng: 85.4200 },
      notes: 'Trek along roaring Langtang Khola river through oak and rhododendron woodlands.',
    },
    {
      id: 'lv-d2',
      day: 2,
      title: 'Lama Hotel to Langtang Village',
      distanceKm: 10,
      sleepingAltitude: 3430,
      altitudeGain: 960,
      activityType: 'trekking',
      coordinates: { lat: 28.2150, lng: 85.5000 },
      notes: 'Enter broad glacial valley with first close-up views of Langtang Lirung.',
    },
    {
      id: 'lv-d3',
      day: 3,
      title: 'Langtang Village to Kyanjin Gompa',
      distanceKm: 7,
      sleepingAltitude: 3870,
      altitudeGain: 440,
      activityType: 'monastery',
      coordinates: { lat: 28.2127, lng: 85.5684 },
      notes: 'Reach the historic yak cheese factory and monastery settlement under hanging glaciers.',
    },
    {
      id: 'lv-d4',
      day: 4,
      title: 'Kyanjin Gompa to Kyanjin Ri Summit Ascent',
      distanceKm: 5,
      sleepingAltitude: 3870,
      altitudeGain: 903,
      activityType: 'pass',
      coordinates: { lat: 28.2250, lng: 85.5750 },
      notes: 'Early morning climb to Kyanjin Ri apex (4,773m) for 360-degree Himalayan icefall views.',
    },
    {
      id: 'lv-d5',
      day: 5,
      title: 'Kyanjin Gompa Return to Syabrubesi',
      distanceKm: 18,
      sleepingAltitude: 1503,
      altitudeGain: -2367,
      activityType: 'trekking',
      coordinates: { lat: 28.1600, lng: 85.3500 },
      notes: 'Descend through river valleys back to the roadside trailhead.',
    },
  ],
};

// Sortable Waypoint Item Component using @dnd-kit and HeroUI compound semantics
interface SortableWaypointItemProps {
  item: PlannerWaypoint;
  index: number;
  isActive: boolean;
  isHovered: boolean;
  isEditing: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  onDelete: (index: number) => void;
  onStartEdit: (index: number) => void;
  onSaveEdit: (index: number, updatedItem: Partial<PlannerWaypoint>) => void;
  onCancelEdit: () => void;
  onInsertRestDayAfter?: (index: number) => void;
}

function SortableWaypointItem({
  item,
  index,
  isActive,
  isHovered,
  isEditing,
  onSelect,
  onHover,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onInsertRestDayAfter,
}: SortableWaypointItemProps) {
  const itemId = item.id || `waypoint-${item.day}-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId, disabled: isEditing });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : isEditing ? 30 : 1,
  };

  const cfg = ACTIVITY_CONFIG[item.activityType] || ACTIVITY_CONFIG.trekking;

  // Edit draft states
  const [draftTitle, setDraftTitle] = useState(item.title);
  const [draftActivity, setDraftActivity] = useState<ActivityType>(item.activityType);
  const [draftDistance, setDraftDistance] = useState<number | string>(item.distanceKm);
  const [draftAltitude, setDraftAltitude] = useState<number | string>(item.sleepingAltitude);
  const [draftLat, setDraftLat] = useState<number | string>(item.coordinates.lat);
  const [draftLng, setDraftLng] = useState<number | string>(item.coordinates.lng);
  const [draftNotes, setDraftNotes] = useState(item.notes || '');

  // Keep draft in sync with item changes when entering or resetting edit mode
  useEffect(() => {
    setDraftTitle(item.title);
    setDraftActivity(item.activityType);
    setDraftDistance(item.distanceKm);
    setDraftAltitude(item.sleepingAltitude);
    setDraftLat(item.coordinates.lat);
    setDraftLng(item.coordinates.lng);
    setDraftNotes(item.notes || '');
  }, [item, isEditing]);

  const handleSave = () => {
    onSaveEdit(index, {
      title: draftTitle.trim() || item.title,
      activityType: draftActivity,
      distanceKm: Math.max(0.5, Number(draftDistance) || item.distanceKm),
      sleepingAltitude: Math.max(500, Number(draftAltitude) || item.sleepingAltitude),
      coordinates: {
        lat: Number(draftLat) || item.coordinates.lat,
        lng: Number(draftLng) || item.coordinates.lng,
      },
      notes: draftNotes.trim(),
    });
  };

  return (
    <div
      id={`planner-day-card-${item.day}`}
      ref={setNodeRef}
      style={style}
      data-slot="base"
      data-selected={isActive}
      data-hovered={isHovered}
      data-dragging={isDragging}
      data-editing={isEditing}
      onClick={() => onSelect(index)}
      onDoubleClick={() => !isEditing && onStartEdit(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={`relative p-4 rounded-2xl border transition-all duration-200 backdrop-blur-2xl group select-none print:border-neutral-300 print:bg-white print:text-black ${
        isEditing
          ? 'bg-neutral-950/95 border-2 border-[#B68D40] shadow-2xl ring-4 ring-[#B68D40]/30 cursor-default'
          : isDragging
          ? 'opacity-80 bg-neutral-900/95 border-[#B68D40] shadow-2xl ring-4 ring-[#B68D40]/50 scale-[1.03] z-50 cursor-grabbing'
          : isActive
          ? 'bg-neutral-900/90 border-[#B68D40] shadow-2xl ring-2 ring-[#B68D40]/50 scale-[1.01] cursor-pointer'
          : isHovered
          ? 'bg-neutral-900/70 border-amber-400/50 shadow-lg cursor-pointer'
          : 'bg-black/60 border-white/10 hover:border-white/20 cursor-pointer'
      }`}
    >
      {isEditing ? (
        /* INLINE DAY EDITOR FORM */
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#B68D40] text-black font-extrabold text-[11px]">
                Day {item.day}
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="h-3.5 w-3.5 text-[#B68D40]" />
                <span>Edit Stage Details</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onCancelEdit}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Close and Discard Changes"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Stage Destination Title
            </label>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black border border-white/20 text-white text-xs font-bold focus:outline-none focus:border-[#B68D40] focus:ring-1 focus:ring-[#B68D40]"
              placeholder="e.g. Dingboche to Lobuche High Camp"
            />
          </div>

          {/* Activity selector */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Activity &amp; Terrain Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(Object.keys(ACTIVITY_CONFIG) as ActivityType[]).map((actKey) => {
                const act = ACTIVITY_CONFIG[actKey];
                const isAct = draftActivity === actKey;
                return (
                  <button
                    key={actKey}
                    type="button"
                    onClick={() => setDraftActivity(actKey)}
                    className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      isAct
                        ? `${act.badgeBg} text-white ${act.borderColor} shadow-md`
                        : 'bg-black/60 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span>{act.iconSymbol}</span>
                    <span className="truncate">{act.label.split('/')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Distance and Altitude */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Distance (km)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={draftDistance}
                onChange={(e) => setDraftDistance(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black border border-white/20 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#B68D40]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Sleeping Altitude (m)
              </label>
              <input
                type="number"
                min="500"
                max="8848"
                value={draftAltitude}
                onChange={(e) => setDraftAltitude(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black border border-white/20 text-amber-400 text-xs font-mono font-bold focus:outline-none focus:border-[#B68D40]"
              />
            </div>
          </div>

          {/* GPS Coordinates: Lat & Lng */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Latitude (°N)
              </label>
              <input
                type="number"
                step="0.0001"
                value={draftLat}
                onChange={(e) => setDraftLat(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black border border-white/20 text-gray-200 text-xs font-mono focus:outline-none focus:border-[#B68D40]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Longitude (°E)
              </label>
              <input
                type="number"
                step="0.0001"
                value={draftLng}
                onChange={(e) => setDraftLng(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-black border border-white/20 text-gray-200 text-xs font-mono focus:outline-none focus:border-[#B68D40]"
              />
            </div>
          </div>

          {/* Route Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Stage Notes, Lodges &amp; Acclimatization
            </label>
            <textarea
              rows={2}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-black border border-white/20 text-white text-xs focus:outline-none focus:border-[#B68D40]"
              placeholder="Teahouse lodges, suspension bridge crossings, high passes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            {onInsertRestDayAfter && (
              <button
                type="button"
                onClick={() => onInsertRestDayAfter(index)}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30 flex items-center gap-1 transition cursor-pointer"
                title="Insert an acclimatization rest day immediately after this stage"
              >
                <span>🧘</span>
                <span>+ Rest Day After</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW CARD */
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
                <h4 className="text-sm font-bold text-white print:text-black leading-snug group-hover:text-amber-200 transition">
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
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit(index);
              }}
              className="p-1.5 text-neutral-400 hover:text-[#B68D40] rounded-lg hover:bg-white/10 transition print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] cursor-pointer"
              title="Edit Day Details (Title, Altitude, Distance, Activity)"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
              className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-900 transition print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 cursor-pointer"
              title="Delete Day"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ItineraryPlannerContent() {
  const searchParams = useSearchParams();
  const trailParam = searchParams.get('trail') || searchParams.get('expedition') || searchParams.get('id');

  // Expedition & Persistent Database State
  const [expeditions, setExpeditions] = useState<Trail[]>([]);
  const [selectedTrailSlug, setSelectedTrailSlug] = useState<string | null>(trailParam || 'ebc-trek');
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [expeditionPolyline, setExpeditionPolyline] = useState<[number, number][]>([]);
  const [regionalLandmarks, setRegionalLandmarks] = useState<Landmark[]>([]);
  const [loadingLandmarks, setLoadingLandmarks] = useState(false);
  const [showLandmarksDrawer, setShowLandmarksDrawer] = useState(false);
  const [landmarkFilter, setLandmarkFilter] = useState<string>('All');
  const [landmarkScope, setLandmarkScope] = useState<'regional' | 'all'>('regional');
  const [focusedLandmarkCoords, setFocusedLandmarkCoords] = useState<[number, number] | null>(null);
  const [gpxUploadSuccess, setGpxUploadSuccess] = useState<string | null>(null);
  const [uploadedGpxData, setUploadedGpxData] = useState<ParsedRouteResult | null>(null);
  const gpxFileInputRef = useRef<HTMLInputElement>(null);

  // Itinerary Waypoints State with stable IDs
  const [waypoints, setWaypoints] = useState<PlannerWaypoint[]>(EXPEDITION_BASE_DAYS['ebc-trek']);

  // Three-Way Synchronization State (Map ↔ Timeline ↔ Elevation Line Chart)
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(0);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

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
  const [isUpdatingExpedition, setIsUpdatingExpedition] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Fetch all expeditions from DB API on mount
  useEffect(() => {
    fetch('/api/trails')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Trail[]) => {
        if (Array.isArray(data)) {
          setExpeditions(data);
          const targetSlug = trailParam || 'ebc-trek';
          const match = data.find((t) => t.slug === targetSlug || t.id === targetSlug) || data[0];
          if (match) {
            setSelectedTrail(match);
            setSelectedTrailSlug(match.slug);
          }
        }
      })
      .catch((err) => console.error('Failed to load expeditions:', err));
  }, [trailParam]);

  // When selected expedition changes, sync its GPX polyline track
  useEffect(() => {
    if (!selectedTrail) return;

    if (selectedTrail.routeCoordinates && Array.isArray(selectedTrail.routeCoordinates) && selectedTrail.routeCoordinates.length > 0) {
      setExpeditionPolyline(selectedTrail.routeCoordinates.map((pt) => [pt[0], pt[1]]));
    } else {
      setExpeditionPolyline(waypoints.map((w) => [w.coordinates.lat, w.coordinates.lng]));
    }
  }, [selectedTrail]);

  // Fetch landmarks based on active expedition region and selected scope
  useEffect(() => {
    setLoadingLandmarks(true);
    const url = (landmarkScope === 'all' || !selectedTrail)
      ? '/api/landmarks'
      : `/api/landmarks?region=${encodeURIComponent(selectedTrail.region)}`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Landmark[]) => {
        if (Array.isArray(data)) {
          setRegionalLandmarks(data);
        }
      })
      .catch((err) => console.error('Failed to fetch regional landmarks:', err))
      .finally(() => setLoadingLandmarks(false));
  }, [selectedTrail, landmarkScope]);

  // Switch active expedition
  const handleSelectExpedition = (slug: string) => {
    setSelectedTrailSlug(slug);
    const trail = expeditions.find((t) => t.slug === slug || t.id === slug);
    if (trail) {
      setSelectedTrail(trail);
      // If we have authentic base days for this trail, load them automatically
      if (EXPEDITION_BASE_DAYS[trail.slug]) {
        setWaypoints(EXPEDITION_BASE_DAYS[trail.slug]);
        setActiveDayIndex(0);
      }
    } else {
      setSelectedTrail(null);
    }
  };

  // Reset to canonical base days for this expedition
  const handleLoadBaseDays = () => {
    if (!selectedTrail) return;
    const baseDays = EXPEDITION_BASE_DAYS[selectedTrail.slug];
    if (baseDays && baseDays.length > 0) {
      setWaypoints(baseDays);
      setActiveDayIndex(0);
      setSaveSuccessMessage(`Loaded ${baseDays.length} canonical days for "${selectedTrail.name}".`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } else if (regionalLandmarks.length > 0) {
      // Create days from regional landmarks
      const generated: PlannerWaypoint[] = regionalLandmarks.slice(0, 6).map((lm, idx) => ({
        id: `wp-gen-${lm.id}-${idx}`,
        day: idx + 1,
        title: lm.name,
        distanceKm: 8 + idx * 2,
        sleepingAltitude: lm.elevation,
        altitudeGain: idx === 0 ? 0 : 400,
        activityType: lm.category === 'Base Camp' ? 'camp' : lm.category === 'High Pass' ? 'pass' : 'trekking',
        coordinates: { lat: lm.coordinates.lat, lng: lm.coordinates.lng },
        notes: lm.description || `${lm.name} checkpoint in ${lm.region}.`,
      }));
      setWaypoints(generated);
      setActiveDayIndex(0);
      setSaveSuccessMessage(`Generated ${generated.length} itinerary days from regional landmarks.`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    }
  };

  // Add Landmark directly to Itinerary as a Day Stop
  const handleAddLandmarkToItinerary = (lm: Landmark) => {
    let actType: ActivityType = 'trekking';
    if (lm.category === 'Base Camp') actType = 'camp';
    else if (lm.category === 'High Pass') actType = 'pass';
    else if (lm.category === 'Monastery') actType = 'monastery';
    else if (lm.category === 'Summit') actType = 'pass';
    else if (lm.category === 'Airport') actType = 'flight';
    else if (
      lm.category === 'Hotel' ||
      lm.category === 'Community Homestay' ||
      lm.category === 'Hot Spring' ||
      lm.category === 'Village' ||
      lm.category === 'Lodge'
    )
      actType = 'acclimatization';

    const prevWp = waypoints[waypoints.length - 1];
    const prevAlt = prevWp ? prevWp.sleepingAltitude : 2500;
    const gain = lm.elevation - prevAlt;

    const newWp: PlannerWaypoint = {
      id: `wp-${lm.id}-${Date.now()}`,
      day: waypoints.length + 1,
      title: lm.name,
      distanceKm: prevWp
        ? Math.max(4, Math.round(Math.hypot((lm.coordinates.lat - prevWp.coordinates.lat) * 111, (lm.coordinates.lng - prevWp.coordinates.lng) * 100)))
        : 10,
      sleepingAltitude: lm.elevation,
      altitudeGain: gain,
      activityType: actType,
      coordinates: { lat: lm.coordinates.lat, lng: lm.coordinates.lng },
      notes: lm.description || `Visit ${lm.name} (${lm.elevation}m) in ${lm.region}.`,
    };

    setWaypoints([...waypoints, newWp]);
    setActiveDayIndex(waypoints.length);
    setSaveSuccessMessage(`Added "${lm.name}" to Day ${waypoints.length + 1} of your itinerary!`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Upload & Import Custom GPX Route File into Planner
  const handleImportGPXFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const result: ParsedRouteResult = parseRouteFile(content, file.name);
        setUploadedGpxData(result);
        setExpeditionPolyline(result.waypoints);

        if (result.landmarks.length > 0) {
          // Merge parsed landmarks
          const convertedLandmarks: Landmark[] = result.landmarks.map((lm) => ({
            id: lm.id,
            name: lm.name,
            category: lm.category,
            elevation: lm.elevation,
            region: selectedTrail?.region || 'Himalayas',
            coordinates: { lat: lm.lat, lng: lm.lng },
            image: '/steps/trails.jpg',
            description: lm.description,
            permitRequired: 'Standard Region Entry Permit',
            associatedTrail: selectedTrail?.name || result.name || 'Custom Expedition',
          }));
          setRegionalLandmarks((prev) => [...convertedLandmarks, ...prev]);
        }

        setGpxUploadSuccess(
          `Imported "${result.name}": ${result.trackpoints.length} trackpoints, ${result.totalDistanceKm}km, apex ${result.maxElevationM}m. GPX High-Resolution Elevation Profile activated!`
        );
        setTimeout(() => setGpxUploadSuccess(null), 6000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to parse GPX file';
        alert(`GPX Parse Error: ${msg}`);
      }
    };
    reader.readAsText(file);
    if (gpxFileInputRef.current) gpxFileInputRef.current.value = '';
  };

  // Auto-generate itinerary stages directly from uploaded GPX route track
  const handleGenerateDaysFromGpx = () => {
    if (!uploadedGpxData) return;

    if (uploadedGpxData.landmarks.length >= 2) {
      const newDays: PlannerWaypoint[] = uploadedGpxData.landmarks.map((lm, idx) => {
        const prevLm = idx > 0 ? uploadedGpxData.landmarks[idx - 1] : null;
        const dist = prevLm
          ? Math.max(3, Math.round(Math.hypot((lm.lat - prevLm.lat) * 111, (lm.lng - prevLm.lng) * 100)))
          : 8;
        const prevAlt = prevLm ? prevLm.elevation : 2000;
        let actType: ActivityType = 'trekking';
        if (lm.category === 'Base Camp') actType = 'camp';
        else if (lm.category === 'High Pass' || lm.category === 'Summit') actType = 'pass';
        else if (lm.category === 'Monastery') actType = 'monastery';
        else if (lm.category === 'Village' || lm.category === 'Lodge') actType = 'acclimatization';

        return {
          id: `gpx-day-${idx + 1}-${Date.now()}`,
          day: idx + 1,
          title: lm.name,
          distanceKm: dist,
          sleepingAltitude: lm.elevation,
          altitudeGain: lm.elevation - prevAlt,
          activityType: actType,
          coordinates: { lat: lm.lat, lng: lm.lng },
          notes: lm.description || `Stage checkpoint along ${uploadedGpxData.name}.`,
        };
      });

      setWaypoints(newDays);
      setActiveDayIndex(0);
      setSaveSuccessMessage(`Generated ${newDays.length} itinerary days from GPX waypoints!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
      return;
    }

    // Split trackpoints evenly across estimated days
    const stageCount = uploadedGpxData.estimatedDays || Math.max(2, Math.ceil(uploadedGpxData.totalDistanceKm / 12));
    const totalPts = uploadedGpxData.trackpoints.length;
    const newDays: PlannerWaypoint[] = [];

    for (let d = 1; d <= stageCount; d++) {
      const ptIndex = Math.min(totalPts - 1, Math.round((d / stageCount) * (totalPts - 1)));
      const tp = uploadedGpxData.trackpoints[ptIndex];
      const prevTp = d > 1 ? uploadedGpxData.trackpoints[Math.min(totalPts - 1, Math.round(((d - 1) / stageCount) * (totalPts - 1)))] : null;
      const stageDist = prevTp ? Math.max(2, Math.round(tp.distanceFromStartKm - prevTp.distanceFromStartKm)) : Math.round(tp.distanceFromStartKm || (uploadedGpxData.totalDistanceKm / stageCount));
      const prevAlt = prevTp ? prevTp.elevation : 2000;

      newDays.push({
        id: `gpx-stage-${d}-${Date.now()}`,
        day: d,
        title: d === stageCount ? `Final Destination (${uploadedGpxData.endPoint})` : `Stage ${d}: ${tp.lat.toFixed(3)}°N, ${tp.lng.toFixed(3)}°E`,
        distanceKm: stageDist || Math.round(uploadedGpxData.totalDistanceKm / stageCount),
        sleepingAltitude: Math.round(tp.elevation),
        altitudeGain: Math.round(tp.elevation - prevAlt),
        activityType: tp.elevation > 4500 ? 'pass' : 'trekking',
        coordinates: { lat: tp.lat, lng: tp.lng },
        notes: `GPS track checkpoint at KM ${Math.round(tp.distanceFromStartKm)} along ${uploadedGpxData.name}.`,
      });
    }

    setWaypoints(newDays);
    setActiveDayIndex(0);
    setSaveSuccessMessage(`Generated ${newDays.length} itinerary stages from GPX track!`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // DnD Sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

  // Form submit handler to add new custom day
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

  // Save Edited Waypoint in Itinerary Timeline
  const handleSaveEditWaypoint = (index: number, updatedFields: Partial<PlannerWaypoint>) => {
    setWaypoints((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;

      updated[index] = {
        ...updated[index],
        ...updatedFields,
      };

      // Recalculate altitude gains relative to previous days
      for (let i = 0; i < updated.length; i++) {
        const prevAlt = i > 0 ? updated[i - 1].sleepingAltitude : 2000;
        updated[i].altitudeGain = updated[i].sleepingAltitude - prevAlt;
      }

      return updated;
    });

    setEditingDayIndex(null);
    setActiveDayIndex(index);
    setSaveSuccessMessage(`Day ${waypoints[index]?.day || index + 1} updated successfully!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Insert Rest / Acclimatization Day After specified index
  const handleInsertRestDayAfter = (index: number) => {
    const currentWp = waypoints[index];
    if (!currentWp) return;

    const restDay: PlannerWaypoint = {
      id: `wp-rest-${Date.now()}`,
      day: index + 2,
      title: `${currentWp.title.split(' to ')[1] || currentWp.title} Acclimatization & Ridge Exploration`,
      distanceKm: 4,
      sleepingAltitude: currentWp.sleepingAltitude,
      altitudeGain: 0,
      activityType: 'acclimatization',
      coordinates: {
        lat: currentWp.coordinates.lat + 0.003,
        lng: currentWp.coordinates.lng + 0.003,
      },
      notes: 'Acclimatization rest day. High-altitude ridge day hike, hydration, and medical pulse oximeter check.',
    };

    const updated = [
      ...waypoints.slice(0, index + 1),
      restDay,
      ...waypoints.slice(index + 1),
    ];

    const renumbered = updated.map((w, idx) => {
      const prevAlt = idx > 0 ? updated[idx - 1].sleepingAltitude : 2000;
      return {
        ...w,
        day: idx + 1,
        altitudeGain: w.sleepingAltitude - prevAlt,
      };
    });

    setWaypoints(renumbered);
    setEditingDayIndex(index + 1);
    setActiveDayIndex(index + 1);
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
    const routeTitle = selectedTrail ? `${selectedTrail.name} Custom Route` : 'Custom Himalayan Expedition Route';
    const gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="The Himalayan Trails - Route Studio" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${routeTitle}</name>
    <desc>Himalayan Expedition Itinerary (${waypoints.length} Days, ${totalDistance} km, Max Altitude ${maxAltitude}m)</desc>
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
      ${(expeditionPolyline.length > 0 ? expeditionPolyline : waypoints.map((w) => [w.coordinates.lat, w.coordinates.lng]))
        .map(
          (pt) => `
      <trkpt lat="${pt[0]}" lon="${pt[1]}">
        <ele>3500</ele>
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
    anchor.download = `${selectedTrail ? selectedTrail.slug : 'himalayan'}-custom-itinerary.gpx`;
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
          title: selectedTrail ? `${selectedTrail.name} Custom Expedition` : `Custom Expedition (${waypoints.length} Days)`,
          trailName: selectedTrail ? selectedTrail.name : (waypoints[0]?.title || 'Himalayan Custom Route'),
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
      setSaveSuccessMessage(`Itinerary successfully saved to persistent database (ID: ${savedData.id})!`);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving custom itinerary';
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Sync changes directly back to connected expedition in database
  const handleUpdateExpedition = async () => {
    if (!selectedTrail || !waypoints.length) return;
    setIsUpdatingExpedition(true);
    try {
      let cumDist = 0;
      const elevationProfile = waypoints.map((w) => {
        cumDist += w.distanceKm;
        return {
          distanceKm: Math.round(cumDist * 10) / 10,
          elevation: w.sleepingAltitude,
          label: w.title,
        };
      });

      const routeCoordinates =
        expeditionPolyline.length > 0
          ? expeditionPolyline
          : waypoints.map((w) => [w.coordinates.lat, w.coordinates.lng, w.sleepingAltitude]);

      const resTrail = await fetch(`/api/trails/${selectedTrail.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationDays: waypoints.length,
          distanceKm: totalDistance,
          maxElevation: maxAltitude,
          elevationProfile,
          routeCoordinates,
        }),
      });

      if (!resTrail.ok) {
        const errData = await resTrail.json();
        throw new Error(errData.error || 'Failed to update expedition record');
      }

      const updatedTrailData = await resTrail.json();
      setSelectedTrail(updatedTrailData);

      // Also persist to custom itineraries catalog
      await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${selectedTrail.name} Official Itinerary`,
          trailName: selectedTrail.name,
          author: 'Expedition Guide & Route Master',
          totalDays: waypoints.length,
          maxAltitude,
          difficulty: selectedTrail.difficulty,
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

      setSaveSuccessMessage(`Expedition "${selectedTrail.name}" successfully updated with ${waypoints.length} itinerary days!`);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating expedition';
      alert(msg);
    } finally {
      setIsUpdatingExpedition(false);
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
    points:
      expeditionPolyline.length > 0
        ? expeditionPolyline.map((pt, idx) => ({
            lat: pt[0],
            lng: pt[1],
            altitude: 3500 + idx * 50,
          }))
        : waypoints.map((w) => ({
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

  // Filter regional landmarks
  const filteredLandmarks =
    landmarkFilter === 'All'
      ? regionalLandmarks
      : regionalLandmarks.filter((lm) => lm.category === landmarkFilter);

  // Active continuous elevation profile: prefer uploaded GPX data, then connected expedition elevationProfile
  const activeElevationProfile =
    uploadedGpxData?.elevationProfile && uploadedGpxData.elevationProfile.length > 1
      ? uploadedGpxData.elevationProfile
      : selectedTrail?.elevationProfile && selectedTrail.elevationProfile.length > 1
      ? selectedTrail.elevationProfile
      : undefined;

  const activeGpxTelemetry = uploadedGpxData
    ? {
        totalDistanceKm: uploadedGpxData.totalDistanceKm,
        minElevationM: uploadedGpxData.minElevationM,
        maxElevationM: uploadedGpxData.maxElevationM,
        elevationGainM: uploadedGpxData.elevationGainM,
        elevationLossM: uploadedGpxData.elevationLossM,
        trackpointCount: uploadedGpxData.trackpoints.length,
        fileName: uploadedGpxData.fileName,
        routeName: uploadedGpxData.name,
      }
    : selectedTrail && selectedTrail.elevationProfile && selectedTrail.elevationProfile.length > 1
    ? {
        totalDistanceKm: selectedTrail.distanceKm,
        minElevationM: Math.min(...selectedTrail.elevationProfile.map((p) => p.elevation)),
        maxElevationM: selectedTrail.maxElevation,
        elevationGainM: selectedTrail.elevationGain,
        trackpointCount: selectedTrail.elevationProfile.length,
        routeName: selectedTrail.name,
      }
    : null;

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
            <span>Expedition Connected Studio • Map GPX &amp; Landmark Telemetry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-white tracking-tight print:text-black">
            Himalayan Expedition Custom Route Planner
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl print:text-neutral-700">
            Customize official Himalayan expeditions, view live GPX tracks and regional landmarks, drag &amp; drop itinerary days, and synchronize in real-time with 2D/3D maps.
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/80 border border-white/15 text-xs font-bold text-gray-200 hover:bg-neutral-800 transition backdrop-blur-md shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            title="Download standard GPX 1.1 file"
          >
            <FileCode className="h-4 w-4 text-[#B68D40]" />
            <span>Export GPX</span>
          </button>

          {/* Print / Export PDF Button */}
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/80 border border-white/15 text-xs font-bold text-gray-200 hover:bg-neutral-800 transition backdrop-blur-md shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="h-4 w-4 text-[#B68D40]" />
            <span>Print PDF</span>
          </button>

          {/* Save Itinerary Button */}
          <button
            onClick={handleSaveItinerary}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black text-xs font-extrabold transition shadow-xl disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Cloud'}</span>
          </button>

          {/* Sync Changes to Expedition Button */}
          {selectedTrail && (
            <button
              onClick={handleUpdateExpedition}
              disabled={isUpdatingExpedition}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition shadow-xl disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
              title={`Save modified itinerary directly back into ${selectedTrail.name} in the database`}
            >
              {isUpdatingExpedition ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{isUpdatingExpedition ? 'Syncing...' : 'Sync to Expedition'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. EXPEDITION CONNECTION & GPX / REGIONAL LANDMARKS STUDIO BAR */}
      <div
        data-slot="expedition-bar"
        className="p-5 rounded-3xl bg-neutral-900/90 border border-[#B68D40]/30 shadow-2xl backdrop-blur-2xl space-y-4 print:hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          
          {/* Left: Expedition Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#B68D40]/10 border border-[#B68D40]/30 text-[#B68D40]">
                <Mountain className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Connected Expedition:
              </span>
            </div>

            <div className="relative">
              <select
                value={selectedTrailSlug || ''}
                onChange={(e) => handleSelectExpedition(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-black border border-white/20 hover:border-[#B68D40] rounded-xl px-4 py-2 pr-9 text-xs sm:text-sm font-extrabold text-[#B68D40] focus:outline-none focus:ring-2 focus:ring-[#B68D40] cursor-pointer"
              >
                {expeditions.map((trail) => (
                  <option key={trail.slug} value={trail.slug} className="bg-neutral-950 text-white font-medium">
                    {trail.name} ({trail.region} • {trail.maxElevation}m)
                  </option>
                ))}
                <option value="" className="bg-neutral-950 text-white font-medium">
                  Custom Freeform Expedition
                </option>
              </select>
              <ChevronDown className="h-4 w-4 text-[#B68D40] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {selectedTrail && (
              <Link
                href={`/trails/${selectedTrail.slug}`}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 underline underline-offset-2 ml-1"
                title="View full expedition overview page"
              >
                <span>Overview</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Load Canonical Base Days */}
            {selectedTrail && (
              <button
                type="button"
                onClick={handleLoadBaseDays}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-[#B68D40]/20 hover:text-[#B68D40] text-gray-300 text-xs font-semibold transition border border-white/10 flex items-center gap-1.5 cursor-pointer"
                title="Reset day-by-day stops to match canonical expedition route"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#B68D40]" />
                <span>Load Base Itinerary</span>
              </button>
            )}

            {/* Hidden Input for GPX upload */}
            <input
              ref={gpxFileInputRef}
              type="file"
              accept=".gpx,.kml,.xml"
              onChange={handleImportGPXFile}
              className="hidden"
            />

            {/* Upload Custom GPX to Route */}
            <button
              type="button"
              onClick={() => gpxFileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-semibold transition border border-white/10 flex items-center gap-1.5 cursor-pointer"
              title="Import custom GPX track coordinates into map"
            >
              <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
              <span>Import GPX Track</span>
            </button>

            {/* Toggle Regional Landmarks Drawer */}
            <button
              type="button"
              onClick={() => setShowLandmarksDrawer(!showLandmarksDrawer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
                showLandmarksDrawer
                  ? 'bg-[#B68D40] text-black border-[#B68D40]'
                  : 'bg-black text-[#B68D40] border-[#B68D40]/40 hover:bg-[#B68D40]/10'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {showLandmarksDrawer ? 'Hide Area POIs' : `Area Landmarks (${regionalLandmarks.length})`}
              </span>
            </button>
          </div>
        </div>

        {/* Expedition Telemetry Chips & Trailhead */}
        {selectedTrail && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-black border border-white/10 font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{selectedTrail.region} Region</span>
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-black border border-white/10 text-amber-300 font-mono font-bold">
              Max Alt: {selectedTrail.maxElevation}m
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-black border border-white/10 text-gray-300 font-mono">
              Distance: <strong className="text-white">{selectedTrail.distanceKm} km</strong>
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-black border border-white/10 text-gray-300 font-mono">
              Difficulty: <strong className="text-[#B68D40]">{selectedTrail.difficulty}</strong>
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5" />
              <span>{expeditionPolyline.length} GPX Trackpoints Plotted</span>
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{regionalLandmarks.length} Regional POIs Available</span>
            </span>
          </div>
        )}

        {/* REGIONAL LANDMARKS STUDIO DRAWER (When Expanded) */}
        {showLandmarksDrawer && (
          <div className="pt-4 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#B68D40]" />
                  <span>Landmarks &amp; POIs in {selectedTrail?.region || 'Himalayan'} Region ({regionalLandmarks.length})</span>
                </h4>
                <p className="text-[11px] text-gray-400">
                  Click any landmark to view details, inspect altitude, or click &quot;+ Add to Itinerary&quot; to append it directly to your journey.
                </p>
              </div>

              {/* Scope & Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {/* Scope selector */}
                <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 mr-1">
                  <button
                    type="button"
                    onClick={() => setLandmarkScope('regional')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      landmarkScope === 'regional' ? 'bg-[#B68D40] text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {selectedTrail?.region || 'Region'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLandmarkScope('all')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      landmarkScope === 'all' ? 'bg-[#B68D40] text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All Himalayas
                  </button>
                </div>

                {['All', 'Hotel', 'Community Homestay', 'Airport', 'Hot Spring', 'Base Camp', 'High Pass', 'Monastery', 'Sacred Lake', 'Summit', 'Village'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setLandmarkFilter(cat)}
                    className={`px-2 py-0.5 rounded-lg font-medium transition cursor-pointer ${
                      landmarkFilter === cat
                        ? 'bg-[#B68D40] text-black font-bold'
                        : 'bg-black text-gray-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loadingLandmarks ? (
              <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#B68D40]" />
                <span>Loading landmarks...</span>
              </div>
            ) : filteredLandmarks.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 bg-black/40 rounded-2xl border border-white/10">
                No landmarks found matching filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                {filteredLandmarks.map((lm) => (
                  <div
                    key={lm.id}
                    className="p-3 rounded-2xl bg-black/70 border border-white/10 hover:border-[#B68D40]/50 transition flex flex-col justify-between gap-2.5 group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="px-2 py-0.5 rounded bg-neutral-900 text-[#B68D40] font-bold uppercase border border-neutral-800">
                          {lm.category}
                        </span>
                        <span className="font-extrabold text-amber-400">{lm.elevation}m</span>
                      </div>

                      <h5 className="text-xs font-bold text-white group-hover:text-[#B68D40] transition line-clamp-1">
                        {lm.name}
                      </h5>
                      {lm.nativeName && (
                        <div className="text-[10px] text-gray-500 font-serif line-clamp-1">{lm.nativeName}</div>
                      )}
                      <p className="text-[10px] text-gray-400 line-clamp-2 mt-1">{lm.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setFocusedLandmarkCoords([lm.coordinates.lat, lm.coordinates.lng]);
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-[10px] font-semibold transition text-center cursor-pointer"
                      >
                        Fly Map
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddLandmarkToItinerary(lm)}
                        className="flex-1 py-1 px-2 rounded-lg bg-[#B68D40] hover:bg-[#c99e4b] text-black text-[10px] font-extrabold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>+ Add Day</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* SUCCESS MESSAGES */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-green-500/20 border border-green-500/40 text-green-300 text-xs flex items-center gap-3 shadow-2xl backdrop-blur-md animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <span className="font-semibold">{saveSuccessMessage}</span>
        </div>
      )}

      {gpxUploadSuccess && (
        <div className="p-4 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-3 shadow-2xl backdrop-blur-md animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
          <span className="font-semibold">{gpxUploadSuccess}</span>
        </div>
      )}

      {/* UPLOADED GPX ROUTE INFO & STAGE GENERATOR PANEL */}
      {uploadedGpxData && (
        <div className="p-5 rounded-3xl bg-cyan-950/40 border border-cyan-500/40 backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
              <Route className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Uploaded GPX Data Info Active:
                </span>
                <strong className="text-sm font-extrabold text-white">
                  {uploadedGpxData.name}
                </strong>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                  {uploadedGpxData.trackpoints.length} GPS Trackpoints
                </span>
              </div>
              <div className="text-xs text-gray-300 font-mono flex flex-wrap items-center gap-3">
                <span>Distance: <strong className="text-white">{uploadedGpxData.totalDistanceKm} km</strong></span>
                <span>•</span>
                <span>Apex: <strong className="text-amber-400">{uploadedGpxData.maxElevationM}m</strong></span>
                <span>•</span>
                <span>Min: <strong className="text-emerald-400">{uploadedGpxData.minElevationM}m</strong></span>
                <span>•</span>
                <span>Total Ascent: <strong className="text-cyan-300">+{uploadedGpxData.elevationGainM}m</strong></span>
                <span>•</span>
                <span>Total Descent: <strong className="text-cyan-400">-{uploadedGpxData.elevationLossM}m</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGenerateDaysFromGpx}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
              title="Automatically generate daily itinerary stops from this uploaded GPX track"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate {uploadedGpxData.estimatedDays} Days from GPX</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadedGpxData(null);
                if (selectedTrail?.routeCoordinates) {
                  setExpeditionPolyline(selectedTrail.routeCoordinates.map((pt) => [pt[0], pt[1]]));
                } else {
                  setExpeditionPolyline(waypoints.map((w) => [w.coordinates.lat, w.coordinates.lng]));
                }
              }}
              className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/10 transition border border-white/10 cursor-pointer"
              title="Clear uploaded GPX track and revert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ACCLIMATIZATION SAFETY ADVISORY WARNING BANNER */}
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

      {/* 3. ACTIVITY ICON SELECTOR & ROUTE METRICS */}
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? `${cfg.badgeBg} text-white shadow-lg font-bold ring-2 ${cfg.borderColor} scale-105`
                      : 'bg-black/60 text-gray-300 border border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span>{cfg.iconSymbol}</span>
                  <span>{cfg.label.split('/')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Journey Metrics Strip */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
            <span className="text-gray-400 block text-[10px] uppercase">Total Route</span>
            <strong className="text-base text-white">{totalDistance} km</strong>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
            <span className="text-gray-400 block text-[10px] uppercase">Apex Altitude</span>
            <strong className="text-base text-amber-400">{maxAltitude.toLocaleString()}m</strong>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md">
            <span className="text-gray-400 block text-[10px] uppercase">Itinerary Days</span>
            <strong className="text-base text-cyan-400">{waypoints.length} Days</strong>
          </div>
        </div>
      </div>

      {/* 4. WORKSPACE: INTERACTIVE MAP STUDIO & TIMELINE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* MAP STUDIO SECTION */}
        {(viewLayout === 'split' || viewLayout === 'mapOnly') && (
          <div
            className={`${
              viewLayout === 'mapOnly' ? 'lg:col-span-12' : 'lg:col-span-7'
            } space-y-3 print:hidden`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {mapEngine === '2d' ? (
                  <>
                    <MapIcon className="h-4 w-4 text-[#B68D40]" />
                    <span>Leaflet Interactive Map • GPS Waypoints &amp; POIs</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 text-[#B68D40]" />
                    <span>Cesium 3D Himalayan Terrain &amp; Waypoint Fly-To</span>
                  </>
                )}
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                {mapEngine === '2d'
                  ? 'Click map to drop waypoints • Click POIs to add stops'
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
                landmarks={regionalLandmarks}
                expeditionPolyline={expeditionPolyline}
                onAddLandmarkToItinerary={handleAddLandmarkToItinerary}
                expeditionName={selectedTrail?.name}
                focusedCoords={focusedLandmarkCoords}
              />
            ) : (
              <CesiumGlobeMap
                height={viewLayout === 'mapOnly' ? 'h-[650px]' : 'h-[520px]'}
                polyline={cesiumPolyline}
                markers={cesiumMarkers}
                landmarks={regionalLandmarks}
                onMarkerClick={(markerId) => {
                  const match = markerId.match(/planner-marker-(\d+)/);
                  if (match) {
                    const dayNum = parseInt(match[1], 10);
                    const idx = waypoints.findIndex((w) => w.day === dayNum);
                    if (idx !== -1) {
                      setActiveDayIndex(idx);
                      const el = document.getElementById(`planner-day-card-${dayNum}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }
                  }
                }}
                scrubberPoint={
                  focusedLandmarkCoords
                    ? {
                        lat: focusedLandmarkCoords[0],
                        lng: focusedLandmarkCoords[1],
                        altitude: 5500,
                      }
                    : activeWp
                    ? {
                        lat: activeWp.coordinates.lat,
                        lng: activeWp.coordinates.lng,
                        altitude: activeWp.sleepingAltitude + 500,
                      }
                    : null
                }
                initialCenter={
                  focusedLandmarkCoords
                    ? {
                        lat: focusedLandmarkCoords[0],
                        lng: focusedLandmarkCoords[1],
                        altitude: 7000,
                      }
                    : activeWp
                    ? {
                        lat: activeWp.coordinates.lat,
                        lng: activeWp.coordinates.lng,
                        altitude: (activeWp.sleepingAltitude || 3500) + 2500,
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#B68D40]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                  Itinerary Timeline ({waypoints.length} Days)
                </h3>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    if (editingDayIndex !== null) {
                      setEditingDayIndex(null);
                    } else {
                      setEditingDayIndex(activeDayIndex !== null ? activeDayIndex : 0);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
                    editingDayIndex !== null
                      ? 'bg-[#B68D40] text-black border-[#B68D40] shadow-md'
                      : 'bg-neutral-800 text-[#B68D40] border-white/10 hover:border-[#B68D40]'
                  }`}
                  title="Toggle day editing mode for active stage"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{editingDayIndex !== null ? 'Close Edit Mode' : 'Edit Itinerary Day'}</span>
                </button>
                <span className="text-xs text-gray-400 font-mono hidden sm:inline">
                  Drag handle to reorder
                </span>
              </div>
            </div>

            {/* Active Day Quick Inspector & Edit Shortcut Bar */}
            {activeDayIndex !== null && waypoints[activeDayIndex] && editingDayIndex !== activeDayIndex && (
              <div className="px-3.5 py-2.5 rounded-2xl bg-neutral-900/90 border border-white/10 text-xs flex items-center justify-between gap-2 backdrop-blur-xl shadow-lg print:hidden animate-in fade-in duration-150">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#B68D40] animate-pulse shrink-0" />
                  <span className="text-gray-400 font-mono text-[11px] shrink-0">Selected:</span>
                  <span className="font-bold text-white truncate text-xs">
                    Day {waypoints[activeDayIndex].day}: {waypoints[activeDayIndex].title}
                  </span>
                  <span className="text-amber-400 font-mono text-[11px] shrink-0 hidden sm:inline">
                    ({waypoints[activeDayIndex].sleepingAltitude}m)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingDayIndex(activeDayIndex)}
                    className="px-2.5 py-1 rounded-lg bg-[#B68D40]/20 hover:bg-[#B68D40] text-[#B68D40] hover:text-black text-[11px] font-bold border border-[#B68D40]/40 transition flex items-center gap-1 cursor-pointer"
                    title={`Edit all details for Day ${waypoints[activeDayIndex].day}`}
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Day {waypoints[activeDayIndex].day}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertRestDayAfter(activeDayIndex)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 transition flex items-center gap-1 cursor-pointer hidden sm:flex"
                    title="Insert an acclimatization rest day immediately after this stage"
                  >
                    <span>🧘</span>
                    <span>+ Rest Day</span>
                  </button>
                </div>
              </div>
            )}

            {/* DND CONTEXT WRAPPER */}
            <DndContext
              id="itinerary-planner-dnd-context"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={waypoints.map((w, idx) => w.id || `waypoint-${w.day}-${idx}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
                  {waypoints.map((item, idx) => (
                    <SortableWaypointItem
                      key={item.id || `waypoint-${item.day}-${idx}`}
                      item={item}
                      index={idx}
                      isActive={activeDayIndex === idx}
                      isHovered={hoveredDayIndex === idx}
                      isEditing={editingDayIndex === idx}
                      onSelect={(index) => setActiveDayIndex(index)}
                      onHover={(index) => setHoveredDayIndex(index)}
                      onDelete={(index) => handleDeleteDay(index)}
                      onStartEdit={(index) => setEditingDayIndex(index)}
                      onSaveEdit={handleSaveEditWaypoint}
                      onCancelEdit={() => setEditingDayIndex(null)}
                      onInsertRestDayAfter={handleInsertRestDayAfter}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Quick Add Custom Day Stage Form */}
            <form
              onSubmit={handleAddDayForm}
              className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl space-y-3 print:hidden"
            >
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#B68D40]" />
                <span>Add Custom Day {waypoints.length + 1} Stage</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-gray-400 block mb-1">Day Destination Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dingboche to Chhukung Ri Apex"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#B68D40]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Stage Distance (km)</label>
                  <input
                    type="number"
                    min="1"
                    value={newDistance}
                    onChange={(e) => setNewDistance(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#B68D40]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Sleeping Altitude (m)</label>
                  <input
                    type="number"
                    min="1000"
                    max="8848"
                    value={newAltitude}
                    onChange={(e) => setNewAltitude(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#B68D40]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Route Highlights &amp; Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes about teahouse stops, permits, acclimatization pacing..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/80 border border-white/10 text-white text-xs focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Day {waypoints.length + 1} to Itinerary</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 5. INTERACTIVE RECHARTS ALTITUDE PROFILE WITH MAP SCRUBBING */}
      {showElevationProfile && waypoints.length > 0 && (
        <div className="pt-2 print:hidden">
          <PlannerElevationChart
            waypoints={waypoints}
            activeDayIndex={activeDayIndex}
            hoveredDayIndex={hoveredDayIndex}
            onSelectDayIndex={setActiveDayIndex}
            onHoverDayIndex={setHoveredDayIndex}
            gpxElevationProfile={activeElevationProfile}
            gpxTelemetry={activeGpxTelemetry}
          />
        </div>
      )}

    </div>
  );
}

export default function ItineraryPlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-[#B68D40] gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm font-bold uppercase tracking-wider">Loading Expedition Itinerary Planner...</span>
        </div>
      }
    >
      <ItineraryPlannerContent />
    </Suspense>
  );
}
