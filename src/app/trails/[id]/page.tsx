'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Mountain,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Compass,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Star,
  Share2,
  Send,
  AlertCircle,
  Sparkles,
  PhoneCall,
  Info,
  Loader2
} from 'lucide-react';
import { Trail, Itinerary } from '@/types';
import { submitTrekInquiry } from '@/app/actions/inquiry';

export default function TrailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trailParam = (params?.id as string) || '';

  const [trail, setTrail] = useState<Trail | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Accordion open/close state
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 1: true, 2: true });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);

    Promise.all([
      fetch(`/api/trails/${trailParam}`).then((res) => {
        if (!res.ok) throw new Error('Trail not found in database');
        return res.json();
      }),
      fetch('/api/itineraries').then((res) => (res.ok ? res.json() : []))
    ])
      .then(([trailData, itineraries]: [Trail, Itinerary[]]) => {
        if (!isMounted) return;
        setTrail(trailData);

        const matched = itineraries.find(
          (it) =>
            it.trailName.toLowerCase().includes(trailData.name.toLowerCase()) ||
            trailData.name.toLowerCase().includes(it.trailName.toLowerCase())
        ) || itineraries[0] || null;
        setItinerary(matched);

        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || 'Error retrieving trail from database');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [trailParam]);

  // Inquiry Form State
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    groupSize: 2,
    preferredStartDate: '',
    fitnessLevel: 'Intermediate (Regular Gym / Hiker)',
    notes: '',
  });

  const [formStatus, setFormStatus] = useState<{
    success?: boolean;
    message?: string;
    errors?: Record<string, string>;
  } | null>(null);

  const toggleDay = (dayNum: number) => {
    setOpenDays((prev) => ({ ...prev, [dayNum]: !prev[dayNum] }));
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);

    startTransition(async () => {
      if (!trail) return;
      const res = await submitTrekInquiry({
        trailId: trail.id,
        trailName: trail.name,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        groupSize: Number(formData.groupSize),
        preferredStartDate: formData.preferredStartDate,
        fitnessLevel: formData.fitnessLevel,
        notes: formData.notes,
      });

      setFormStatus(res);
      if (res.success) {
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          country: '',
          groupSize: 2,
          preferredStartDate: '',
          fitnessLevel: 'Intermediate (Regular Gym / Hiker)',
          notes: '',
        });
      }
    });
  };

  // Estimated starting cost calculation
  const estimatedCost = itinerary?.estimatedCostUSD || 1290;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-cyan-400">
        <Loader2 className="h-10 w-10 animate-spin" />
        <span className="text-sm">Loading expedition details from database...</span>
      </div>
    );
  }

  if (loadError || !trail) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-md space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Trail Not Found</h2>
          <p className="text-xs text-slate-400">{loadError || 'The requested trail record does not exist in our database.'}</p>
          <Link href="/trails" className="inline-block px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs">
            Return to Trail Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Top Breadcrumb & Back bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/trails"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Trails</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              {trail.region} Himalaya
            </span>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: trail.name, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Trail link copied to clipboard!');
                }
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Share Trail"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[480px] sm:h-[540px] w-full overflow-hidden">
        <img
          src={trail.image}
          alt={trail.name}
          className="w-full h-full object-cover object-center filter brightness-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5">
              <Mountain className="h-3.5 w-3.5" />
              {trail.difficulty} Grade
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-300" />
              {trail.rating} ({trail.reviewsCount} reviews)
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Best: {trail.bestMonths.join(', ')}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {trail.name}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            {trail.description}
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Details, Highlights, Itinerary, Elevation */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-slate-900/60 border border-slate-800">
              <div className="space-y-1 p-3">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  Duration
                </span>
                <p className="text-xl font-bold text-white">{trail.durationDays} Days</p>
                <span className="text-[11px] text-slate-500">Paced for altitude</span>
              </div>

              <div className="space-y-1 p-3">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                  Max Altitude
                </span>
                <p className="text-xl font-bold text-white">{trail.maxElevation.toLocaleString()} m</p>
                <span className="text-[11px] text-slate-500">Peak vantage</span>
              </div>

              <div className="space-y-1 p-3">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-blue-400" />
                  Total Distance
                </span>
                <p className="text-xl font-bold text-white">{trail.distanceKm} km</p>
                <span className="text-[11px] text-slate-500">Round-trip trail</span>
              </div>

              <div className="space-y-1 p-3">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  Start & Finish
                </span>
                <p className="text-sm font-bold text-white truncate" title={trail.startPoint}>
                  {trail.startPoint.split('(')[0]}
                </p>
                <span className="text-[11px] text-slate-500">Trailhead hub</span>
              </div>
            </div>

            {/* Highlights List */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Expedition Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trail.highlights.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day-by-Day Detailed Itinerary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Day-by-Day Itinerary</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Guided itinerary designed for proper acclimatization and safe mountain ascent.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const days = itinerary?.days || [];
                    const allOpen = Object.keys(openDays).length === days.length;
                    if (allOpen) {
                      setOpenDays({});
                    } else {
                      const all: Record<number, boolean> = {};
                      days.forEach((d) => (all[d.day] = true));
                      setOpenDays(all);
                    }
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  {itinerary && Object.keys(openDays).length === itinerary.days.length ? 'Collapse All' : 'Expand All'}
                </button>
              </div>

              <div className="space-y-3">
                {(itinerary?.days || []).map((d) => {
                  const isOpen = Boolean(openDays[d.day]);
                  return (
                    <div
                      key={d.day}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => toggleDay(d.day)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                            D{d.day}
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-white">{d.title}</h3>
                            <p className="text-[11px] text-slate-400">{d.route}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                            <span className="text-emerald-400 font-semibold">{d.sleepingAltitude}m</span>
                            <span>•</span>
                            <span>{d.hours} hrs</span>
                            <span>•</span>
                            <span>{d.distanceKm} km</span>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 border-t border-slate-800/60 text-xs text-slate-300 space-y-3 bg-slate-950/40">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 text-[11px] text-slate-400 bg-slate-900/40 rounded-xl px-3 border border-slate-800/50">
                            <div>Sleeping Altitude: <strong className="text-white">{d.sleepingAltitude}m</strong></div>
                            <div>Daily Distance: <strong className="text-white">{d.distanceKm} km</strong></div>
                            <div>Trek Duration: <strong className="text-white">{d.hours} hours</strong></div>
                            <div>Net Gain: <strong className={d.altitudeGain >= 0 ? "text-amber-400" : "text-emerald-400"}>{d.altitudeGain > 0 ? `+${d.altitudeGain}m` : `${d.altitudeGain}m`}</strong></div>
                          </div>
                          <p className="leading-relaxed">
                            <strong className="text-emerald-400">Highlight:</strong> {d.highlights}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  What Is Included
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Certified Licensed English-speaking Sherpa Mountain Guide</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Strong porters (1 porter per 2 trekkers, max 20kg)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>All National Park Entry Permits & TIMS Cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Teahouse mountain lodge accommodation throughout trek</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Breakfast, Lunch, and Dinner with tea/coffee daily</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Emergency pulse oximeter & first aid medical kit</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose-400" />
                  What Is Excluded
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>International airfare & Nepal tourist visa fee</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>High-altitude travel & medical evacuation insurance (mandatory)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>Hot showers, battery charging, and Wi-Fi at teahouses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>Personal gear (sleeping bag, trekking poles, down jacket)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>Tips and gratuities for guides and porters</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking & Inquiry Card */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            
            <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl space-y-6">
              
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                  Guided All-Inclusive Package
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    ${estimatedCost}
                  </span>
                  <span className="text-xs text-slate-400">/ person (USD)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Best price guarantee • No hidden fees • Small groups
                </p>
              </div>

              {/* Instant Inquiry Form */}
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                
                {formStatus?.success && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{formStatus.message}</span>
                  </div>
                )}

                {formStatus?.success === false && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{formStatus.message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Alex Henderson"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {formStatus?.errors?.fullName && (
                    <p className="text-[10px] text-rose-400 mt-1">{formStatus.errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {formStatus?.errors?.email && (
                    <p className="text-[10px] text-rose-400 mt-1">{formStatus.errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Group Size
                    </label>
                    <select
                      value={formData.groupSize}
                      onChange={(e) => setFormData({ ...formData, groupSize: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={1}>1 Solo Trekker</option>
                      <option value={2}>2 People</option>
                      <option value={3}>3 People</option>
                      <option value={4}>4-6 People</option>
                      <option value={7}>7+ Group</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={formData.preferredStartDate}
                      onChange={(e) => setFormData({ ...formData, preferredStartDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Phone / WhatsApp (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0192"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isPending ? (
                    <span>Submitting Inquiry...</span>
                  ) : (
                    <>
                      <span>Inquire & Reserve Dates</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Safety Badges */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Licensed Nepal Tourism Board Operator</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Sherpa guides born & raised in Khumbu</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>24/7 Satellite Emergency Support</span>
                </div>
              </div>

            </div>

            {/* Quick WhatsApp Assistance */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Have a quick question?</p>
                <p className="text-[11px] text-slate-400">Chat directly with our lead expedition planner.</p>
              </div>
              <a
                href="https://wa.me/9779800000000"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition"
              >
                WhatsApp
              </a>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
