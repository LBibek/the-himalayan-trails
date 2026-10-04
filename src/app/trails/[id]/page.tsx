'use client';

import React, { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import {
  Mountain, Calendar, Clock, MapPin, TrendingUp, Compass, CheckCircle2,
  XCircle, ShieldCheck, Users, ChevronDown, ChevronUp, ArrowLeft, Star,
  Share2, Send, AlertCircle, Sparkles, PhoneCall, Loader2, Camera,
  Route, Thermometer, Eye, Flag, X, ChevronLeft, ChevronRight,
  MessageSquare, ThumbsUp, Footprints, TreePine, Plane,
  WifiOff, Download, Trash2, HardDrive, Radio
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot
} from 'recharts';
import { Trail, Itinerary, Landmark } from '@/types';
import { submitTrekInquiry } from '@/app/actions/inquiry';
import ElevationProfileChart from '@/components/map/ElevationProfileChart';
import {
  saveTrailOffline,
  getOfflineTrail,
  deleteOfflineTrail,
  calculatePackSize,
  generateEmergencyGuide,
} from '@/lib/offline/trailStorage';

const CesiumGlobeMap = dynamic(() => import('@/components/map/CesiumGlobeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 text-[#B68D40] gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-[#B68D40]" />
      <span className="text-xs uppercase tracking-widest text-[#E2C085]">Initializing 3D Himalayan Terrain...</span>
    </div>
  ),
});

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────
const DIFFICULTY_COLORS: Record<string, string> = {
  'Easy':       'bg-emerald-500 text-white',
  'Moderate':   'bg-amber-500 text-black',
  'Hard':       'bg-orange-600 text-white',
  'Challenging':'bg-orange-600 text-white',
  'Strenuous':  'bg-rose-600 text-white',
  'Extreme':    'bg-red-700 text-white',
};

function difficultyColor(d: string) {
  return DIFFICULTY_COLORS[d] || 'bg-slate-600 text-white';
}

function relativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function computeElevationGain(profile?: { elevation: number }[]) {
  if (!profile || profile.length < 2) return 0;
  let gain = 0;
  for (let i = 1; i < profile.length; i++) {
    const diff = profile[i].elevation - profile[i - 1].elevation;
    if (diff > 0) gain += diff;
  }
  return Math.round(gain);
}

function estimateHikingHours(distKm: number, difficulty: string) {
  const baseSpeed = 3.5; // km/h
  const multiplier = difficulty === 'Easy' ? 1 : difficulty === 'Moderate' ? 1.25 : difficulty === 'Strenuous' || difficulty === 'Challenging' ? 1.5 : 1.75;
  return Math.round((distKm / baseSpeed) * multiplier);
}

function renderStars(rating: number, size = 14) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`inline-block ${i < Math.round(rating) ? 'text-[#B68D40] fill-[#B68D40]' : 'text-slate-600'}`}
      style={{ width: size, height: size }}
    />
  ));
}

interface ReviewData {
  id: string;
  reviewer_name: string;
  overall_rating: number;
  difficulty_rating: number;
  scenery_rating: number;
  safety_rating: number;
  comment: string;
  condition_tags: string;
  created_at: string;
}

// ────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────
export default function TrailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trailParam = (params?.id as string) || '';

  const [trail, setTrail] = useState<Trail | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewStats, setReviewStats] = useState<{ total: number; avg_rating: number; avg_difficulty: number; avg_scenery: number; avg_safety: number }>({ total: 0, avg_rating: 0, avg_difficulty: 0, avg_scenery: 0, avg_safety: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 1: true, 2: true });
  const [bookingTab, setBookingTab] = useState<'inquiry' | 'booking'>('inquiry');
  const [depositMode, setDepositMode] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '', condition: 'Good Conditions' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  // Inquiry form
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', country: '', groupSize: 2,
    preferredStartDate: '', fitnessLevel: 'Intermediate (Regular Gym / Hiker)', notes: '',
  });
  const [formStatus, setFormStatus] = useState<{ success?: boolean; message?: string; errors?: Record<string, string> } | null>(null);

  // 3D Alpine Theater Mode
  const [isTheaterModeOpen, setIsTheaterModeOpen] = useState(false);
  const [theaterDistanceKm, setTheaterDistanceKm] = useState<number | null>(null);
  const [theaterTelemetry, setTheaterTelemetry] = useState<any>(null);

  // ── Offline Wilderness Route Pack State ──
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [offlinePackSize, setOfflinePackSize] = useState<number | null>(null);
  const [offlinePackaging, setOfflinePackaging] = useState(false);
  const [offlineActionSuccess, setOfflineActionSuccess] = useState<string | null>(null);
  const [showOfflineDeleteConfirm, setShowOfflineDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!trail) return;
    let isMounted = true;
    getOfflineTrail(trail.id).then((pack) => {
      if (isMounted) {
        if (pack) {
          setIsOfflineSaved(true);
          setOfflinePackSize(pack.packSizeBytes);
        } else {
          setIsOfflineSaved(false);
          setOfflinePackSize(null);
        }
      }
    });
    return () => { isMounted = false; };
  }, [trail]);

  const handleDownloadOfflinePack = async () => {
    if (!trail) return;
    setOfflinePackaging(true);
    setOfflineActionSuccess(null);
    try {
      let packLandmarks = landmarks;
      if (!packLandmarks || packLandmarks.length === 0) {
        try {
          const res = await fetch(`/api/landmarks?trail=${encodeURIComponent(trail.name)}`);
          if (res.ok) {
            const data = await res.json();
            packLandmarks = Array.isArray(data) ? data : (data.landmarks || []);
          }
        } catch (e) {
          console.warn('Failed to load extra landmarks for offline pack', e);
        }
      }

      const emergencyGuide = generateEmergencyGuide(trail.name, trail.maxElevation);
      const packBase = {
        id: trail.id,
        trail,
        routeCoordinates: trail.routeCoordinates || [],
        elevationProfile: trail.elevationProfile || [],
        landmarks: packLandmarks,
        itinerary: itinerary?.days || [],
        emergencyGuide,
        savedAt: new Date().toISOString(),
        version: 1,
      };
      const packSizeBytes = calculatePackSize(packBase);
      const fullPack = { ...packBase, packSizeBytes };
      await saveTrailOffline(fullPack);
      setIsOfflineSaved(true);
      setOfflinePackSize(packSizeBytes);
      setOfflineActionSuccess(`Cached successfully (${(packSizeBytes / (1024 * 1024)).toFixed(2)} MB)`);
    } catch (err: any) {
      console.error('Failed to save offline pack', err);
      setOfflineActionSuccess('Failed to package trail');
    } finally {
      setOfflinePackaging(false);
    }
  };

  const handleDeleteOfflinePack = async () => {
    if (!trail) return;
    try {
      await deleteOfflineTrail(trail.id);
      setIsOfflineSaved(false);
      setOfflinePackSize(null);
      setShowOfflineDeleteConfirm(false);
      setOfflineActionSuccess('Offline pack removed from device.');
    } catch (err) {
      console.error('Failed to remove offline pack', err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTheaterModeOpen) {
        setIsTheaterModeOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterModeOpen]);

  useEffect(() => {
    if (isTheaterModeOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isTheaterModeOpen]);

  // ── Data fetching ──
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);

    Promise.all([
      fetch(`/api/trails/${trailParam}`).then(r => { if (!r.ok) throw new Error('Trail not found'); return r.json(); }),
      fetch('/api/itineraries').then(r => r.ok ? r.json() : []),
      fetch(`/api/landmarks?trailId=${trailParam}`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/trails/${trailParam}/reviews`).then(r => r.ok ? r.json() : { reviews: [], stats: { total: 0, avg_rating: 0, avg_difficulty: 0, avg_scenery: 0, avg_safety: 0 } }).catch(() => ({ reviews: [], stats: { total: 0, avg_rating: 0 } })),
    ]).then(([trailData, itineraries, lm, revData]) => {
      if (!mounted) return;
      setTrail(trailData);
      setLandmarks(Array.isArray(lm) ? lm : []);
      setReviews(revData.reviews || []);
      setReviewStats(revData.stats || { total: 0, avg_rating: 0, avg_difficulty: 0, avg_scenery: 0, avg_safety: 0 });
      const matched = itineraries.find((it: Itinerary) =>
        it.trailName.toLowerCase().includes(trailData.name.toLowerCase()) ||
        trailData.name.toLowerCase().includes(it.trailName.toLowerCase())
      ) || itineraries[0] || null;
    }).catch(async (err) => {
      // Fallback: If offline or network request fails, attempt recovery from IndexedDB
      try {
        const offlinePack = await getOfflineTrail(trailParam);
        if (mounted && offlinePack) {
          setTrail(offlinePack.trail);
          setLandmarks(offlinePack.landmarks || []);
          if (offlinePack.itinerary && offlinePack.itinerary.length > 0) {
            setItinerary({
              id: 'offline-' + (offlinePack.id || trailParam),
              trailId: offlinePack.trail.id,
              trailName: offlinePack.trail.name,
              region: offlinePack.trail.region,
              days: offlinePack.itinerary,
            } as any);
          }
          setIsOfflineSaved(true);
          setOfflinePackSize(offlinePack.packSizeBytes);
          setLoading(false);
          return;
        }
      } catch (offlineErr) {
        console.warn('Failed to retrieve offline trail pack fallback:', offlineErr);
      }

      if (mounted) {
        setLoadError(err.message);
        setLoading(false);
      }
    });

    return () => { mounted = false; };
  }, [trailParam]);

  // ── Review submission ──
  const submitReview = async () => {
    if (!trail) return;
    setReviewSubmitting(true);
    setReviewMsg('');
    try {
      const res = await fetch(`/api/trails/${trail.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_name: reviewForm.name,
          overall_rating: reviewForm.rating,
          difficulty_rating: reviewForm.rating,
          scenery_rating: reviewForm.rating,
          safety_rating: reviewForm.rating,
          comment: reviewForm.comment,
          condition_tags: reviewForm.condition,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewMsg('Review submitted successfully!');
        setShowReviewForm(false);
        setReviewForm({ name: '', rating: 5, comment: '', condition: 'Good Conditions' });
        // Refresh reviews
        const fresh = await fetch(`/api/trails/${trail.id}/reviews`).then(r => r.json());
        setReviews(fresh.reviews || []);
        setReviewStats(fresh.stats || reviewStats);
      } else {
        setReviewMsg(data.error || 'Failed to submit review');
      }
    } catch { setReviewMsg('Network error'); }
    setReviewSubmitting(false);
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);
    startTransition(async () => {
      if (!trail) return;
      const res = await submitTrekInquiry({
        trailId: trail.id, trailName: trail.name,
        fullName: formData.fullName, email: formData.email,
        phone: formData.phone, country: formData.country,
        groupSize: Number(formData.groupSize),
        preferredStartDate: formData.preferredStartDate,
        fitnessLevel: formData.fitnessLevel, notes: formData.notes,
      });
      setFormStatus(res);
      if (res.success) setFormData({ fullName: '', email: '', phone: '', country: '', groupSize: 2, preferredStartDate: '', fitnessLevel: 'Intermediate (Regular Gym / Hiker)', notes: '' });
    });
  };

  const toggleDay = (dayNum: number) => setOpenDays(p => ({ ...p, [dayNum]: !p[dayNum] }));

  // ── Computed values ──
  const estimatedCost = itinerary?.estimatedCostUSD || 1290;
  const elevGain = trail ? computeElevationGain(trail.elevationProfile) : 0;
  const estHours = trail ? estimateHikingHours(trail.distanceKm, trail.difficulty) : 0;

  // Photo gallery images
  const galleryImages = trail ? [
    trail.image,
    `https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1486911278844-a81c5267e227?w=800&h=600&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=800&h=600&fit=crop&q=80`,
    `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop&q=80`,
  ] : [];

  // Elevation chart data with steepness
  const chartData = trail?.elevationProfile?.map((pt, i, arr) => {
    let grade = 0;
    if (i > 0) {
      const dElev = pt.elevation - arr[i - 1].elevation;
      const dDist = (pt.distanceKm - arr[i - 1].distanceKm) * 1000;
      grade = dDist > 0 ? Math.abs(dElev / dDist) * 100 : 0;
    }
    return { ...pt, grade: Math.round(grade * 10) / 10, fill: grade > 11 ? '#f43f5e' : grade > 6 ? '#f59e0b' : '#10b981' };
  }) || [];

  // Pricing calc
  const basePrice = estimatedCost;
  const groupDiscount = formData.groupSize >= 4 ? Math.round(basePrice * 0.1) : formData.groupSize >= 2 ? Math.round(basePrice * 0.05) : 0;
  const subtotal = basePrice - groupDiscount;
  const vat = Math.round(subtotal * 0.13);
  const totalPrice = subtotal + vat;
  const depositAmount = Math.round(totalPrice * 0.25);

  // Condition tag colors
  const CONDITION_TAGS = [
    { label: '✅ Good Conditions', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { label: '🌿 Clear Trail', color: 'bg-green-500/20 text-green-300 border-green-500/40' },
    { label: '❄️ Snow Present', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { label: '🌧 Muddy Sections', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  ];

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-[#B68D40]">
        <Loader2 className="h-10 w-10 animate-spin" />
        <span className="text-sm">Loading expedition details...</span>
      </div>
    );
  }

  if (loadError || !trail) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-md space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Trail Not Found</h2>
          <p className="text-xs text-slate-400">
            {loadError || 'The requested trail could not be retrieved. If you are offline in the wilderness, ensure the trail pack was downloaded prior to departure.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/offline" className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Wilderness Offline Hub</span>
            </Link>
            <Link href="/trails" className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700">
              Return to Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-slot="base" className="min-h-screen bg-slate-950 text-slate-100 pb-20">

      {/* ──────── STICKY BREADCRUMB ──────── */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/trails" className="inline-flex items-center gap-2 text-xs font-semibold text-[#B68D40] hover:text-[#c99e4b] transition">
            <ArrowLeft className="h-4 w-4" />
            <span>All Trails</span>
          </Link>
          <div className="flex items-center gap-3">
            {isOfflineSaved && (
              <span data-slot="indicator" className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1.5 shadow-sm">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Wilderness Ready</span>
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficultyColor(trail.difficulty)}`}>
              {trail.difficulty}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              {trail.region}
            </span>
            <button
              onClick={() => {
                setTheaterDistanceKm(0);
                setIsTheaterModeOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#B68D40]/20 hover:bg-[#B68D40]/30 text-[#B68D40] border border-[#B68D40]/40 text-xs font-bold flex items-center gap-1.5 transition"
              title="Launch 3D Alpine Drone Flight"
            >
              <Plane className="w-3.5 h-3.5 fill-[#B68D40]" />
              <span>3D Flight</span>
            </button>
            <button
              onClick={() => { if (navigator.share) navigator.share({ title: trail.name, url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); } }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
              title="Share Trail"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ──────── HERO ──────── */}
      <div className="relative h-[420px] sm:h-[500px] w-full overflow-hidden">
        <img src={trail.image} alt={trail.name} className="w-full h-full object-cover object-center filter brightness-[0.65]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {isOfflineSaved && (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/25 backdrop-blur text-emerald-300 text-xs font-extrabold border border-emerald-400/50 flex items-center gap-1.5 shadow-lg">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Wilderness Offline Ready</span>
              </span>
            )}
            <span className={`px-4 py-1.5 rounded-full text-sm font-extrabold ${difficultyColor(trail.difficulty)} shadow-lg`}>
              {trail.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur text-white/90 text-xs font-semibold border border-white/20 flex items-center gap-1">
              {renderStars(trail.rating, 12)}
              <span className="ml-1">{trail.rating}</span>
              <span className="text-white/60">({trail.reviewsCount})</span>
            </span>
            <button
              onClick={() => {
                setTheaterDistanceKm(0);
                setIsTheaterModeOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#B68D40] to-[#E2C085] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-[#B68D40]/30 hover:scale-105 transition"
            >
              <Plane className="w-3.5 h-3.5 fill-black" />
              <span>3D Virtual Drone Tour</span>
            </button>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">{trail.name}</h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">{trail.description}</p>
        </div>
      </div>

      {/* ──────── 2. TRAIL STATS BAR ──────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div data-slot="body" className="grid grid-cols-2 sm:grid-cols-5 gap-0 p-1 rounded-2xl backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 shadow-2xl">
          {[
            { icon: <Route className="h-4 w-4 text-[#B68D40]" />, label: 'Distance', value: `${trail.distanceKm} km`, sub: 'Out & Back' },
            { icon: <TrendingUp className="h-4 w-4 text-emerald-400" />, label: 'Elev. Gain', value: `${elevGain.toLocaleString()} m`, sub: `↑ ascent` },
            { icon: <Clock className="h-4 w-4 text-blue-400" />, label: 'Est. Time', value: `${estHours} hrs`, sub: `${trail.durationDays} day trek` },
            { icon: <Mountain className="h-4 w-4 text-amber-400" />, label: 'Max Altitude', value: `${trail.maxElevation.toLocaleString()} m`, sub: `${Math.round(trail.maxElevation * 3.28084).toLocaleString()} ft` },
            { icon: <Star className="h-4 w-4 text-[#B68D40] fill-[#B68D40]" />, label: 'Avg Rating', value: trail.rating.toFixed(1), sub: `${trail.reviewsCount} reviews` },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">{s.icon}</div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{s.label}</p>
                <p className="text-base font-extrabold text-white">{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ──────── MAIN GRID ──────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ──── LEFT COLUMN ──── */}
          <div className="lg:col-span-8 space-y-10">

            {/* ──────── 3. ELEVATION CHART WITH STEEPNESS SHADING ──────── */}
            {chartData.length > 0 && (
              <div data-slot="body" className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#B68D40]" />
                    Elevation Profile
                  </h2>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> &lt;6% Grade</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 6-11%</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &gt;11%</span>
                  </div>
                </div>
                <div className="h-[200px] sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#B68D40" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#B68D40" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                      <XAxis dataKey="distanceKm" stroke="#64748b" fontSize={10} tickFormatter={(v: number) => `${v} km`} />
                      <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v: number) => `${v}m`} domain={['dataMin - 200', 'dataMax + 200']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(182,141,64,0.4)', borderRadius: '16px', backdropFilter: 'blur(20px)', fontSize: '11px' }}
                        labelStyle={{ color: '#B68D40', fontWeight: 700 }}
                        formatter={(value: any, name: any) => {
                          if (name === 'elevation') return [`${Number(value).toLocaleString()} m`, 'Elevation'];
                          return [value, name];
                        }}
                        labelFormatter={(label: any) => `Distance: ${label} km`}
                      />
                      <Area type="monotone" dataKey="elevation" stroke="#B68D40" strokeWidth={2.5} fill="url(#elevGrad)" />
                      {/* Landmark reference dots */}
                      {chartData.filter(pt => pt.label).map((pt, i) => (
                        <ReferenceDot key={i} x={pt.distanceKm} y={pt.elevation} r={5} fill="#B68D40" stroke="#fff" strokeWidth={2}>
                        </ReferenceDot>
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Start: {trail.startPoint.split('(')[0].trim()}</span>
                  <span>Peak: {trail.maxElevation.toLocaleString()}m</span>
                  <span>Total: {trail.distanceKm} km</span>
                </div>
              </div>
            )}

            {/* ──────── 5. PHOTO GALLERY STRIP ──────── */}
            <div data-slot="body" className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#B68D40]" />
                Trail Photos
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                {galleryImages.map((img, i) => (
                  <button key={i} onClick={() => setLightboxIdx(i)} className="shrink-0 w-[200px] h-[140px] rounded-2xl overflow-hidden border border-slate-700/50 hover:border-[#B68D40]/60 transition shadow-lg snap-start focus-visible:ring-2 focus-visible:ring-[#B68D40]">
                    <img src={img} alt={`${trail.name} photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
            </div>

            {/* LIGHTBOX MODAL */}
            {lightboxIdx !== null && (
              <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxIdx(null)}>
                <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.max(0, lightboxIdx - 1)); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10"><ChevronLeft className="h-6 w-6" /></button>
                <img src={galleryImages[lightboxIdx]} alt="" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
                <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.min(galleryImages.length - 1, lightboxIdx + 1)); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10"><ChevronRight className="h-6 w-6" /></button>
                <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60">{lightboxIdx + 1} / {galleryImages.length}</span>
              </div>
            )}

            {/* ──────── 6. KEY WAYPOINTS ──────── */}
            {(landmarks.length > 0 || trail.highlights.length > 0) && (
              <div data-slot="body" className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flag className="h-5 w-5 text-[#B68D40]" />
                  Key Waypoints & Points of Interest
                </h2>
                <div className="space-y-2.5">
                  {(landmarks.length > 0 ? landmarks.slice(0, 8) : trail.highlights).map((item, i) => {
                    const isLandmark = typeof item === 'object' && 'name' in item;
                    const lm = isLandmark ? (item as Landmark) : null;
                    const label = lm ? lm.name : (item as string);
                    const categoryIcons: Record<string, string> = { 'High Pass': '🏔', 'Base Camp': '⛺', 'Monastery': '🛕', 'Sacred Lake': '🌊', 'Village': '🏘', 'Viewpoint': '🎯' };
                    const icon = lm ? (categoryIcons[lm.category] || '📍') : '✦';
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-[#B68D40]/40 transition group">
                        <span className="w-8 h-8 rounded-lg bg-[#B68D40]/15 border border-[#B68D40]/30 flex items-center justify-center text-sm shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{label}</p>
                          {lm && <p className="text-[10px] text-slate-400">{lm.elevation.toLocaleString()}m · {lm.category}</p>}
                        </div>
                        <span className="text-[10px] text-[#B68D40] font-bold shrink-0">#{i + 1}</span>
                        {lm && (
                          <Link href={`/map?lat=${lm.coordinates.lat}&lng=${lm.coordinates.lng}&zoom=14`} className="text-[10px] text-slate-400 hover:text-[#B68D40] transition shrink-0">
                            View on Map →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ──────── 3D GLOBE CTA ──────── */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#B68D40]/20 via-[#B68D40]/10 to-transparent border border-[#B68D40]/40 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#B68D40]/25 border border-[#B68D40]/50 flex items-center justify-center shrink-0">
                  <Plane className="w-6 h-6 text-[#E2C085] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Alpine Drone Flight Simulator <Sparkles className="w-3.5 h-3.5 text-[#B68D40]" />
                  </h3>
                  <p className="text-xs text-gray-300">Fly along the 3D {trail.region} terrain in Alpine Theater mode with dual camera perspectives and live telemetry.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTheaterDistanceKm(0);
                    setIsTheaterModeOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-[#B68D40]/20 shrink-0 focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                >
                  <Plane className="w-4 h-4 fill-black" /> Launch Alpine Theater
                </button>
                <Link href={`/map?trail=${trail.id}&engine=3d`} className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700">
                  <Compass className="w-3.5 h-3.5 text-[#B68D40]" /> Explorer Map
                </Link>
              </div>
            </div>

            {/* ──────── HIGHLIGHTS ──────── */}
            <div data-slot="body" className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#B68D40]" /> Expedition Highlights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trail.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ──────── DAY-BY-DAY ITINERARY ──────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Day-by-Day Itinerary</h2>
                  <p className="text-xs text-slate-400 mt-1">Paced for altitude acclimatization and safety.</p>
                </div>
                <button onClick={() => {
                  const days = itinerary?.days || [];
                  const allOpen = Object.keys(openDays).length === days.length;
                  if (allOpen) setOpenDays({});
                  else { const all: Record<number, boolean> = {}; days.forEach(d => all[d.day] = true); setOpenDays(all); }
                }} className="text-xs font-semibold text-[#B68D40] hover:underline">
                  {itinerary && Object.keys(openDays).length === itinerary.days.length ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
              <div className="space-y-3">
                {(itinerary?.days || []).map(d => {
                  const isOpen = Boolean(openDays[d.day]);
                  return (
                    <div key={d.day} className="rounded-2xl border border-slate-700/50 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
                      <button onClick={() => toggleDay(d.day)} data-slot="trigger" className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:ring-inset">
                        <div className="flex items-center gap-3.5">
                          <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-[#B68D40]/15 border border-[#B68D40]/30 text-[#B68D40] font-bold text-xs">D{d.day}</span>
                          <div><h3 className="text-sm font-bold text-white">{d.title}</h3><p className="text-[11px] text-slate-400">{d.route}</p></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                            <span className="text-[#B68D40] font-semibold">{d.sleepingAltitude}m</span><span>•</span><span>{d.hours} hrs</span><span>•</span><span>{d.distanceKm} km</span>
                          </div>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 border-t border-slate-800/60 text-xs text-slate-300 space-y-3 bg-slate-950/40">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 text-[11px] text-slate-400 bg-slate-900/40 rounded-xl px-3 border border-slate-800/50">
                            <div>Sleeping: <strong className="text-white">{d.sleepingAltitude}m</strong></div>
                            <div>Distance: <strong className="text-white">{d.distanceKm} km</strong></div>
                            <div>Duration: <strong className="text-white">{d.hours} hours</strong></div>
                            <div>Gain: <strong className={d.altitudeGain >= 0 ? 'text-[#B68D40]' : 'text-emerald-400'}>{d.altitudeGain > 0 ? `+${d.altitudeGain}m` : `${d.altitudeGain}m`}</strong></div>
                          </div>
                          <p><strong className="text-[#B68D40]">Highlight:</strong> {d.highlights}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ──────── 8. PLAN THIS TREK CTA BANNER ──────── */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#B68D40]/15 via-emerald-500/10 to-transparent border border-[#B68D40]/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-[#B68D40]" />
                <div>
                  <h3 className="text-sm font-bold text-white">Ready to plan your expedition?</h3>
                  <p className="text-xs text-slate-300">Build your custom day-by-day itinerary with our interactive planner.</p>
                </div>
              </div>
              <Link href={`/itinerary/planner?trail=${trail.id}`} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition shrink-0 shadow-lg focus-visible:ring-2 focus-visible:ring-[#B68D40]">
                <Footprints className="w-4 h-4" /> Plan This Trek
              </Link>
            </div>

            {/* ──────── INCLUSIONS / EXCLUSIONS ──────── */}
            <div data-slot="body" className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> What Is Included</h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {['Licensed Sherpa Mountain Guide', 'Porters (1 per 2 trekkers, max 20kg)', 'National Park Permits & TIMS Cards', 'Teahouse lodge accommodation', 'Breakfast, Lunch & Dinner daily', 'Emergency pulse oximeter & first aid kit'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-emerald-400 font-bold">✓</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2"><XCircle className="h-5 w-5 text-rose-400" /> What Is Excluded</h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {['International airfare & Nepal visa', 'Travel & medical evacuation insurance', 'Hot showers, battery charging, Wi-Fi', 'Personal gear (sleeping bag, poles, jacket)', 'Tips & gratuities for staff'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-rose-400 font-bold">✕</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ──────── 4. TRAIL CONDITIONS & REVIEWS ──────── */}
            <div data-slot="body" className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#B68D40]" />
                  Trail Conditions & Reviews
                </h2>
                <button onClick={() => setShowReviewForm(!showReviewForm)} data-slot="trigger" className="px-3 py-1.5 rounded-xl bg-[#B68D40] text-black font-bold text-xs hover:bg-[#c99e4b] transition focus-visible:ring-2 focus-visible:ring-[#B68D40]">
                  ✍️ Write a Review
                </button>
              </div>

              {/* Condition Tags */}
              <div className="flex flex-wrap gap-2">
                {CONDITION_TAGS.map((tag, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-xs font-semibold border ${tag.color}`}>{tag.label}</span>
                ))}
              </div>

              {/* Rating Summary */}
              {reviewStats.total > 0 && (
                <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/40">
                  <div className="text-center">
                    <p className="text-3xl font-extrabold text-[#B68D40]">{reviewStats.avg_rating}</p>
                    <div className="flex gap-0.5 mt-1">{renderStars(reviewStats.avg_rating, 14)}</div>
                    <p className="text-[10px] text-slate-400 mt-1">{reviewStats.total} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[
                      { label: 'Difficulty', val: reviewStats.avg_difficulty },
                      { label: 'Scenery', val: reviewStats.avg_scenery },
                      { label: 'Safety', val: reviewStats.avg_safety },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className="w-16 text-slate-400">{s.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-700"><div className="h-1.5 rounded-full bg-[#B68D40]" style={{ width: `${(s.val / 5) * 100}%` }} /></div>
                        <span className="w-6 text-right text-slate-300 font-bold">{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-[#B68D40]/30 space-y-3">
                  <input type="text" placeholder="Your Name" value={reviewForm.name} onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B68D40]" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300">Rating:</span>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })} className="focus:outline-none">
                        <Star className={`h-5 w-5 ${n <= reviewForm.rating ? 'text-[#B68D40] fill-[#B68D40]' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                  <select value={reviewForm.condition} onChange={e => setReviewForm({ ...reviewForm, condition: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#B68D40]">
                    {CONDITION_TAGS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                  </select>
                  <textarea placeholder="Share your experience on the trail..." rows={3} value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-[#B68D40]" />
                  <button onClick={submitReview} disabled={reviewSubmitting} className="w-full py-2.5 rounded-xl bg-[#B68D40] text-black font-bold text-xs hover:bg-[#c99e4b] transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {reviewSubmitting ? 'Submitting...' : <><Send className="h-3.5 w-3.5" /> Submit Review</>}
                  </button>
                  {reviewMsg && <p className={`text-xs ${reviewMsg.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>{reviewMsg}</p>}
                </div>
              )}

              {/* Recent Reviews */}
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.slice(0, 5).map((rev) => (
                    <div key={rev.id} className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#B68D40]/20 border border-[#B68D40]/40 flex items-center justify-center text-[10px] font-bold text-[#B68D40]">
                            {(rev.reviewer_name || (rev as any).user_name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-white">{rev.reviewer_name || (rev as any).user_name || 'Adventurer'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{relativeTime(rev.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">{renderStars(rev.overall_rating, 12)}</div>
                      {rev.condition_tags && <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] border border-emerald-500/30">{rev.condition_tags}</span>}
                      <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No reviews yet. Be the first to share your experience!</p>
              )}
            </div>

          </div>

          {/* ──── RIGHT COLUMN: BOOKING SIDEBAR ──── */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">

            {/* ──── OFFLINE WILDERNESS ROUTE PACK CARD ──── */}
            <div data-slot="base" className="rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-[#B68D40]/30 shadow-2xl p-5 space-y-4">
              <div data-slot="header" className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#B68D40]/20 border border-[#B68D40]/40 flex items-center justify-center text-[#B68D40] shrink-0">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      Wilderness Offline Pack
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Cache route for disconnected mountain passes
                    </p>
                  </div>
                </div>
                {isOfflineSaved ? (
                  <span data-slot="indicator" className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shrink-0">
                    Cached
                  </span>
                ) : (
                  <span data-slot="indicator" className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold shrink-0">
                    Online Only
                  </span>
                )}
              </div>

              <div data-slot="body" className="space-y-3">
                {offlineActionSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{offlineActionSuccess}</span>
                  </div>
                )}

                {!isOfflineSaved ? (
                  <button
                    onClick={handleDownloadOfflinePack}
                    disabled={offlinePackaging}
                    data-slot="trigger"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] hover:opacity-95 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#B68D40]/20 transition focus-visible:ring-2 focus-visible:ring-[#B68D40] disabled:opacity-50"
                  >
                    {offlinePackaging ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Packaging & Caching...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-black" />
                        <span>Download Offline Trail Pack</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300">
                          Saved Offline {offlinePackSize ? `(${(offlinePackSize / (1024 * 1024)).toFixed(2)} MB)` : ''}
                        </span>
                      </div>
                      <Link
                        href={`/offline?trail=${trail.id}`}
                        className="text-[11px] font-bold text-[#B68D40] hover:text-[#c99e4b] underline flex items-center gap-1"
                      >
                        Hub →
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/offline?trail=${trail.id}`}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition border border-slate-700 focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-[#B68D40]" />
                        <span>Offline Map</span>
                      </Link>

                      {!showOfflineDeleteConfirm ? (
                        <button
                          onClick={() => setShowOfflineDeleteConfirm(true)}
                          data-slot="trigger"
                          className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Pack</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleDeleteOfflinePack}
                          data-slot="trigger"
                          className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition animate-pulse"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div data-slot="footer" className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                <p className="flex items-center gap-1.5">
                  <span className="text-[#B68D40]">✓</span> Offline GPS polyline, milestones & elevation profile
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="text-[#B68D40]">✓</span> Lake Louise AMS diagnostic & HAPE/HACE protocol
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="text-[#B68D40]">✓</span> Helicopter SAR hotline (+977-1-4123456)
                </p>
              </div>
            </div>

            <div data-slot="base" className="rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-[#B68D40]/30 shadow-2xl overflow-hidden">

              {/* 7. Tabbed Header */}
              <div className="flex border-b border-slate-800">
                {[
                  { key: 'inquiry' as const, label: 'Quick Inquiry' },
                  { key: 'booking' as const, label: 'Book & Pay' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setBookingTab(tab.key)} data-slot="trigger" data-pressed={bookingTab === tab.key}
                    className={`flex-1 py-3 text-xs font-bold transition ${bookingTab === tab.key ? 'text-[#B68D40] border-b-2 border-[#B68D40] bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-5">
                {/* Pricing */}
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider text-[#B68D40] font-semibold">All-Inclusive Package</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">${totalPrice.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">/ person</span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-300"><span>Base price</span><span className="font-bold text-white">${basePrice.toLocaleString()}</span></div>
                  {groupDiscount > 0 && <div className="flex justify-between text-emerald-400"><span>Group discount ({formData.groupSize}+ pax)</span><span>-${groupDiscount}</span></div>}
                  <div className="flex justify-between text-slate-300"><span>Nepal VAT (13%)</span><span>+${vat}</span></div>
                  <div className="flex justify-between text-white font-bold border-t border-slate-700 pt-1.5 mt-1"><span>Total</span><span>${totalPrice.toLocaleString()}</span></div>
                  {depositMode && <div className="flex justify-between text-[#B68D40] font-bold"><span>25% Deposit Now</span><span>${depositAmount.toLocaleString()}</span></div>}
                </div>

                {/* Deposit Toggle */}
                {bookingTab === 'booking' && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <button onClick={() => setDepositMode(!depositMode)} className={`w-10 h-5 rounded-full transition ${depositMode ? 'bg-[#B68D40]' : 'bg-slate-600'} relative`}>
                      <span className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${depositMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-xs text-slate-300">Pay 25% deposit only</span>
                  </div>
                )}

                {/* Inquiry Tab */}
                {bookingTab === 'inquiry' && (
                  <form onSubmit={handleInquirySubmit} className="space-y-3">
                    {formStatus?.success && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /><span>{formStatus.message}</span>
                      </div>
                    )}
                    {formStatus?.success === false && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{formStatus.message}</span>
                      </div>
                    )}
                    <input type="text" required placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B68D40]" />
                    <input type="email" required placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B68D40]" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={formData.groupSize} onChange={e => setFormData({ ...formData, groupSize: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]">
                        <option value={1}>1 Solo</option><option value={2}>2 People</option><option value={3}>3 People</option><option value={4}>4-6 People</option><option value={7}>7+ Group</option>
                      </select>
                      <input type="date" value={formData.preferredStartDate} onChange={e => setFormData({ ...formData, preferredStartDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]" />
                    </div>
                    <input type="tel" placeholder="Phone / WhatsApp (optional)" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B68D40]" />
                    <button type="submit" disabled={isPending}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B68D40] to-amber-600 hover:from-[#c99e4b] hover:to-amber-500 text-black font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#B68D40]">
                      {isPending ? 'Submitting...' : <><Send className="h-3.5 w-3.5" /> Inquire & Reserve Dates</>}
                    </button>
                  </form>
                )}

                {/* Booking Tab */}
                {bookingTab === 'booking' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300">Select your dates and secure your expedition spot with a {depositMode ? '25% deposit' : 'full payment'}.</p>
                    <input type="date" value={formData.preferredStartDate} onChange={e => setFormData({ ...formData, preferredStartDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]" />
                    <select value={formData.groupSize} onChange={e => setFormData({ ...formData, groupSize: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]">
                      <option value={1}>1 Solo Trekker</option><option value={2}>2 People</option><option value={3}>3 People</option><option value={4}>4-6 People</option><option value={7}>7+ Group</option>
                    </select>
                    <button className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]">
                      {depositMode ? `Pay Deposit $${depositAmount.toLocaleString()}` : `Book Now $${totalPrice.toLocaleString()}`}
                    </button>
                  </div>
                )}

                {/* Safety Badges */}
                <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" /><span>Licensed Nepal Tourism Board Operator</span></div>
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-400 shrink-0" /><span>Sherpa guides born & raised in Khumbu</span></div>
                  <div className="flex items-center gap-2"><PhoneCall className="h-4 w-4 text-[#B68D40] shrink-0" /><span>24/7 Satellite Emergency Support</span></div>
                </div>
              </div>
            </div>

            {/* WhatsApp Assistance */}
            <div className="p-4 rounded-2xl backdrop-blur-xl bg-slate-900/60 border border-slate-700/40 flex items-center justify-between">
              <div><p className="text-xs font-bold text-white">Quick question?</p><p className="text-[11px] text-slate-400">Chat with our expedition planner.</p></div>
              <a href="https://wa.me/9779800000000" target="_blank" rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition">WhatsApp</a>
            </div>
          </div>
        </div>
      </div>

      {/* ──────── 9. ALPINE THEATER 3D DRONE FLIGHT MODAL ──────── */}
      {isTheaterModeOpen && trail && (
        <div
          data-slot="alpine-theater-modal"
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-300"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-neutral-950/90 z-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#B68D40]/20 border border-[#B68D40]/40 flex items-center justify-center">
                <Plane className="w-5 h-5 text-[#B68D40] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-white">
                    Alpine Theater: 3D Drone Flight
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/40">
                    {trail.name}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-400">
                  Photorealistic 3D terrain simulation • Dual Chase & Cockpit perspectives • Recharts profile sync
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTheaterModeOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition border border-white/10"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Theater Mode (Esc)</span>
              </button>
            </div>
          </div>

          {/* 3D Cesium Canvas with Cockpit / Chase HUD */}
          <div className="relative flex-1 w-full overflow-hidden bg-black">
            <CesiumGlobeMap
              mode="drone-flight"
              activeTrail={trail}
              landmarks={landmarks}
              itineraryDays={itinerary?.days}
              activeDistanceKm={theaterDistanceKm}
              onFlightTelemetry={(t) => {
                setTheaterTelemetry(t);
                setTheaterDistanceKm(t.currentDistanceMeters / 1000);
              }}
              onSeekDistanceKm={(km) => setTheaterDistanceKm(km)}
              height="h-full"
            />
          </div>

          {/* Bottom Synchronized Recharts Elevation Profile Bar */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-neutral-950/95 max-h-60 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <ElevationProfileChart
                trail={trail}
                itinerary={itinerary}
                itineraryDays={itinerary?.days}
                landmarks={landmarks}
                activeDistanceKm={theaterDistanceKm}
                onHoverPoint={(pt) => {
                  if (pt) setTheaterDistanceKm(pt.distanceKm);
                }}
                onSelectPoint={(pt) => {
                  setTheaterDistanceKm(pt.distanceKm);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
