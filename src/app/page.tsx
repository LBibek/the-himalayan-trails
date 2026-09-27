'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Mountain,
  Map as MapIcon,
  MapPin,
  Calendar,
  Layers,
  CloudSun,
  BookOpen,
  User,
  UserPlus,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  PhoneCall,
  Wind,
  FileText,
  Globe,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  HeartHandshake,
  Award,
  Zap,
} from 'lucide-react';
import { Trail } from '@/types';
import GlassCard from '@/components/ui/GlassCard';
import GlassBadge from '@/components/ui/GlassBadge';
import InfiniteCarousel from '@/components/ui/InfiniteCarousel';
import HomeRegionalMap from '@/components/home/HomeRegionalMap';

interface AlpineService {
  id: string;
  title: string;
  category: string;
  badge: string;
  badgeVariant: 'gold' | 'emerald' | 'blue' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
  trustMetric: string;
  ctaText: string;
  ctaHref: string;
  isEmergency?: boolean;
  phone?: string;
}

const ALPINE_SERVICES: AlpineService[] = [
  {
    id: 'guided-expeditions',
    title: 'Guided Alpine Expeditions',
    category: 'Elite Guiding',
    badge: '100% IFMGA Sherpa',
    badgeVariant: 'emerald',
    icon: Mountain,
    description: 'Summit pushes and high-altitude col crossings led by certified IFMGA/NNMGA Sherpa masters with redundant oxygen logistics and 1:1 client safety ratios.',
    features: [
      '1:1 Sherpa client ratio on 8,000m & 7,000m technical peaks',
      'Poisk oxygen systems with pulse oximeter monitoring',
      'Hyperbaric Gamow bags & wilderness trauma kits at high camps',
    ],
    trustMetric: '100% Safety Track Record',
    ctaText: 'Inquire Expedition',
    ctaHref: '/contact?service=guided-expeditions',
  },
  {
    id: 'custom-itinerary',
    title: 'Custom 3D Itinerary Planning',
    category: 'Terrain Telemetry',
    badge: 'Kinetic 3D Simulation',
    badgeVariant: 'blue',
    icon: Calendar,
    description: 'Day-by-day altitude-calibrated daily route design. Visualize ascents in 3D Cesium terrain, enforce scientific acclimatization rest days, and export verified GPX/KML routes.',
    features: [
      'Algorithmic altitude sickness prevention & lapse rate alerts',
      'Interactive 3D elevation profiling with waypoint checkpoints',
      'One-click Garmin, Coros & Suunto GPX/KML track export',
    ],
    trustMetric: 'Instant GPX / KML Export',
    ctaText: 'Launch 3D Planner',
    ctaHref: '/itinerary/planner',
  },
  {
    id: 'sherpa-logistics',
    title: 'Sherpa & Porter Logistics',
    category: 'Expedition Support',
    badge: 'Fair Living Wage',
    badgeVariant: 'gold',
    icon: ShieldCheck,
    description: 'Responsible, ethical expedition labor adhering strictly to International Porter Protection Group (IPPG) protocols: guaranteed fair living wages, medical insurance, and load caps.',
    features: [
      'Strict 20kg load limits per porter with certified mountain gear',
      'Full emergency medical, rescue & life insurance coverage',
      'Guaranteed heated teahouse accommodations & high-calorie meals',
    ],
    trustMetric: 'IPPG Ethical Certified',
    ctaText: 'Reserve Support Crew',
    ctaHref: '/contact?service=sherpa-logistics',
  },
  {
    id: 'heli-rescue',
    title: 'Helicopter Rescue & High-Altitude Evac',
    category: 'Emergency SAR',
    badge: '24/7 Garmin SAR',
    badgeVariant: 'gold',
    icon: PhoneCall,
    description: 'Round-the-clock emergency medical liaison with direct hotline to Airbus H125 (B3e) high-altitude rotorcraft crews capable of sling operations up to 7,000m across Nepal.',
    features: [
      'Direct satellite link to Garmin inReach, ZOLEO & Apple SOS',
      'Fast-track CAAN flight clearance for immediate dispatch',
      'Direct patient transfer to CIWEC Clinic & Era International',
    ],
    trustMetric: '< 45 Min Dispatch Window',
    ctaText: 'Emergency SAR Hotline',
    ctaHref: 'tel:+97714123456',
    isEmergency: true,
    phone: '+977 1 4123456',
  },
  {
    id: 'permits-tims',
    title: 'Conservation Permits & TIMS Passes',
    category: 'Alpine Legalities',
    badge: '100% Legal RAP Permits',
    badgeVariant: 'emerald',
    icon: FileText,
    description: 'Comprehensive government trekking clearances for national parks and restricted area permits (RAP) across Nepal’s sensitive border zones with zero Kathmandu queue delays.',
    features: [
      'Sagarmatha, Annapurna (ACAP), Langtang & Manaslu (MCAP) passes',
      'Upper Mustang & Manaslu Restricted Area Permits (RAP)',
      'TIMS biometric registration with pre-arrival digital clearance',
    ],
    trustMetric: '100% Verified Permits',
    ctaText: 'Permits Desk',
    ctaHref: '/landmarks',
  },
];

export default function Home() {
  const [featuredTrails, setFeaturedTrails] = useState<Trail[]>([]);
  const [loadingTrails, setLoadingTrails] = useState(true);

  // Quick persistent inquiry modal state
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<AlpineService | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'Nepal',
    groupSize: 2,
    preferredStartDate: '2026-10-15',
    fitnessLevel: 'Advanced',
    notes: '',
  });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trails')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Trail[]) => {
        setFeaturedTrails(data.slice(0, 3));
        setLoadingTrails(false);
      })
      .catch(() => setLoadingTrails(false));
  }, []);

  const openInquiryForService = (svc: AlpineService) => {
    setSelectedService(svc);
    setInquirySuccess(null);
    setInquiryError(null);
    setInquiryModalOpen(true);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setInquirySubmitting(true);
    setInquiryError(null);

    try {
      const payload = {
        trailId: `svc-${selectedService.id}`,
        trailName: selectedService.title,
        fullName: inquiryForm.fullName,
        email: inquiryForm.email,
        phone: inquiryForm.phone,
        country: inquiryForm.country,
        groupSize: Number(inquiryForm.groupSize) || 1,
        preferredStartDate: inquiryForm.preferredStartDate,
        fitnessLevel: inquiryForm.fitnessLevel,
        notes: inquiryForm.notes || `Direct inquiry for alpine service: ${selectedService.title}`,
      };

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit service inquiry.');
      }

      setInquirySuccess(data.inquiry?.id || 'INQ-SUCCESS');
    } catch (err: unknown) {
      setInquiryError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setInquirySubmitting(false);
    }
  };

  // 9 Core Modules Directory
  const userFeatures = [
    {
      name: 'Login',
      desc: 'Access saved itineraries, offline downloaded GPX maps, and trekker profile.',
      href: '/login',
      icon: User,
      badge: 'Account',
      gradient: 'from-amber-600/20 to-[#B68D40]/20 text-[#B68D40] border-[#B68D40]/40',
    },
    {
      name: 'Sign Up',
      desc: 'Join the global trekker network, log high-altitude ascents, and publish journals.',
      href: '/signup',
      icon: UserPlus,
      badge: 'Account',
      gradient: 'from-amber-600/20 to-[#B68D40]/20 text-amber-300 border-[#B68D40]/40',
    },
    {
      name: 'Itinerary Planner',
      desc: 'Drag-and-drop daily route builder with altitude gain alerts & gear checklist builder.',
      href: '/itinerary/planner',
      icon: Calendar,
      badge: 'Planning',
      gradient: 'from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/30',
    },
    {
      name: 'Trails View',
      desc: 'Discover top Himalayan routes, filter by difficulty, max elevation, and duration.',
      href: '/trails',
      icon: Mountain,
      badge: 'Explorer',
      gradient: 'from-blue-600/20 to-indigo-600/20 text-blue-400 border-blue-500/30',
    },
    {
      name: 'MAP',
      desc: 'Interactive 3D topographic terrain map with satellite overlay and GPX track visualization.',
      href: '/map',
      icon: MapIcon,
      badge: 'Interactive 3D',
      gradient: 'from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30',
    },
    {
      name: 'Landmark',
      desc: 'Explore high passes, base camps, ancient monasteries, sacred lakes, and tea houses.',
      href: '/landmarks',
      icon: MapPin,
      badge: 'POIs & Passes',
      gradient: 'from-[#B68D40]/20 to-orange-600/20 text-[#B68D40] border-[#B68D40]/40',
    },
    {
      name: 'Itineraries View',
      desc: 'Browse curated community itineraries, view day-by-day breakdowns, and clone routes.',
      href: '/itineraries',
      icon: Layers,
      badge: 'Community',
      gradient: 'from-teal-600/20 to-cyan-600/20 text-teal-400 border-teal-500/30',
    },
    {
      name: 'Weather and Trail',
      desc: 'Live high-altitude weather updates, temperature lapse rates, and real-time hazard warnings.',
      href: '/weather',
      icon: CloudSun,
      badge: 'Safety',
      gradient: 'from-sky-600/20 to-blue-600/20 text-sky-400 border-sky-500/30',
    },
    {
      name: 'Stories',
      desc: 'Trekker trip journals, photo galleries, survival stories, and cultural insights.',
      href: '/stories',
      icon: BookOpen,
      badge: 'Journal',
      gradient: 'from-rose-600/20 to-pink-600/20 text-rose-400 border-rose-500/30',
    },
  ];

  return (
    <main className="bg-background text-foreground min-h-screen flex flex-col selection:bg-accent/30 selection:text-foreground">
      
      {/* 1. HERO SECTION */}
      <section className="min-h-[92vh] w-full relative flex flex-col items-center justify-between text-white overflow-hidden">
        {/* Hero Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: "url('/bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
          }}
        />

        {/* Dark Vignette and Gradient Overlay */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(to bottom, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.65) 45%, rgba(5,5,5,0.95) 100%)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center justify-center flex-grow text-center px-6 pt-24 pb-12 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-accent/50 backdrop-blur-md mb-6">
            <Compass className="h-4 w-4 text-accent animate-spin-slow" />
            <span className="text-xs sm:text-sm font-light uppercase tracking-widest text-[#E2C085]">
              High-Altitude Himalayan Navigation
            </span>
          </div>

          <h1
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold drop-shadow-2xl mb-6 leading-tight tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #B68D40, #F5F6F7)' }}
          >
            The Himalayan Trail
          </h1>

          <p className="text-xl md:text-3xl font-light tracking-wide mb-10 space-x-2 sm:space-x-3">
            <span className="text-[#D4A373]">Explore.</span>
            <span className="text-[#3A5A40]">Feel.</span>
            <span className="text-[#F5F6F7]">Live.</span>
            <span className="text-[#8E7CA1]">Remember.</span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/trails"
              data-slot="trigger"
              className="relative cursor-pointer px-8 py-3.5 w-64 md:w-72 rounded-full overflow-hidden group bg-accent text-accent-foreground font-bold flex items-center justify-center shadow-2xl shadow-accent/30 hover:bg-[#c99e4b] transition-all transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="relative z-30 text-base tracking-wide">Start Your Journey</span>
            </Link>

            <Link
              href="/map"
              data-slot="trigger"
              className="px-8 py-3.5 rounded-full bg-surface/70 border border-border/70 text-foreground font-semibold hover:bg-surface hover:border-accent transition-all backdrop-blur-md text-base shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Launch 3D MAP
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div
          className="relative z-20 w-full py-8 md:py-12 border-t border-border/40"
          style={{
            background:
              'linear-gradient(to top, rgba(5,5,5,1), rgba(5,5,5,0.85), rgba(5,5,5,0))',
          }}
        >
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16 px-4">
            <div className="flex flex-col items-center flex-shrink-0">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1 whitespace-nowrap">
                Total Distance Mapped
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-accent whitespace-nowrap">
                3,500+ km
              </p>
            </div>

            <div className="flex flex-col items-center flex-shrink-0">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1 whitespace-nowrap">
                Communities Connected
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-accent whitespace-nowrap">
                150+
              </p>
            </div>

            <div className="flex flex-col items-center flex-shrink-0">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1 whitespace-nowrap">
                Regions Explored
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-accent whitespace-nowrap">
                12+
              </p>
            </div>

            <div className="flex flex-col items-center flex-shrink-0">
              <h3 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1 whitespace-nowrap">
                Landmarks Documented
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-accent whitespace-nowrap">
                200+
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DUAL-SPEED CONTINUOUS INFINITE CAROUSEL */}
      <section className="py-12 bg-background border-t border-border/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GlassBadge variant="gold">
                Live Marquee
              </GlassBadge>
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                Continuous Telemetry Loop
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Top Expeditions & High-Altitude Services
            </h2>
          </div>

          <div className="text-xs text-muted-foreground font-mono hidden sm:block">
            <span>Hover or tap card to pause loop</span>
          </div>
        </div>

        {/* Infinite Continuous Carousel Component */}
        <InfiniteCarousel
          speed="normal"
          direction="left"
          pauseOnHover={true}
          pauseOnTouch={true}
        />
      </section>

      {/* 3. CORE ALPINE SERVICES MATRIX */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface/20 border-t border-border/30 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Matrix Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-center gap-2">
              <GlassBadge variant="gold" pulse={true}>
                Elite High-Altitude Operations
              </GlassBadge>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              Core Alpine Services Matrix
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Full-spectrum expedition infrastructure delivered by licensed IFMGA Sherpa teams, certified high-altitude rotorcraft pilots, and government permit liaisons.
            </p>
          </div>

          {/* 5 Dedicated Frosted-Glass Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ALPINE_SERVICES.map((svc) => {
              const IconComponent = svc.icon;

              return (
                <GlassCard
                  key={svc.id}
                  variant="interactive"
                  className="flex flex-col justify-between h-full p-6 group/card"
                >
                  <GlassCard.Header className="pb-4">
                    <span
                      data-slot="description"
                      className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                    >
                      {svc.category}
                    </span>
                    <GlassBadge variant={svc.badgeVariant} pulse={svc.isEmergency}>
                      {svc.badge}
                    </GlassBadge>
                  </GlassCard.Header>

                  <GlassCard.Body className="py-4 flex-1 space-y-4">
                    <div
                      data-slot="indicator"
                      className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center transition-transform group-hover/card:scale-110 shadow-lg"
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div>
                      <h3
                        data-slot="label"
                        className="text-xl font-bold text-foreground group-hover/card:text-accent transition-colors"
                      >
                        {svc.title}
                      </h3>
                      <p
                        data-slot="description"
                        className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed"
                      >
                        {svc.description}
                      </p>
                    </div>

                    <ul className="space-y-2 pt-3 border-t border-border/20 text-xs text-muted-foreground">
                      {svc.features.map((feat, i) => (
                        <li key={i} data-slot="feature" className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {svc.phone && (
                      <div className="pt-2 flex items-center gap-2 text-xs font-mono text-accent">
                        <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                        <span>Hotline: {svc.phone}</span>
                      </div>
                    )}
                  </GlassCard.Body>

                  <GlassCard.Footer className="pt-4 flex-col items-stretch gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Standard:</span>
                      <span className="font-semibold text-accent">{svc.trustMetric}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={svc.ctaHref}
                        data-slot="trigger"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface/90 hover:bg-accent hover:text-accent-foreground text-foreground border border-border/40 hover:border-accent font-semibold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                      >
                        <span>{svc.ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/card:translate-x-1" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => openInquiryForService(svc)}
                        data-slot="trigger"
                        title={`Fast-track booking inquiry for ${svc.title}`}
                        className="px-3.5 py-2.5 rounded-xl bg-accent/15 hover:bg-accent hover:text-accent-foreground text-accent border border-accent/40 font-semibold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] cursor-pointer"
                      >
                        Inquire
                      </button>
                    </div>
                  </GlassCard.Footer>
                </GlassCard>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. LIVE INTERACTIVE REGIONAL LEAFLET MAP MODULE */}
      <HomeRegionalMap />

      {/* 5. CURATED ROUTES / POPULAR HIMALAYAN ASCENTS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background border-t border-border/30">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/30 pb-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-accent tracking-widest uppercase">
                Curated Routes
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
                Popular Himalayan Ascents
              </h2>
            </div>
            <Link
              href="/trails"
              data-slot="trigger"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-[#c99e4b] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] rounded-lg px-2 py-1"
            >
              <span>View All Trails</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingTrails ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-accent">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs font-mono">Querying verified trail telemetry from database...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredTrails.map((trail, idx) => (
                <GlassCard
                  key={trail.id}
                  variant="interactive"
                  delay={idx * 0.1}
                  className="overflow-hidden group flex flex-col h-full"
                >
                  <div className="relative h-56 w-full overflow-hidden bg-neutral-900">
                    <img
                      src={trail.image}
                      alt={trail.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#E2C085] border border-accent/40">
                      {trail.region} Region
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-400 border border-neutral-800">
                      Max {trail.maxElevation.toLocaleString()}m
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                        {trail.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                        {trail.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground">
                      <div>
                        <span className="text-foreground font-semibold">{trail.distanceKm} km</span> • {trail.durationDays} Days
                      </div>
                      <Link
                        href={`/trails`}
                        data-slot="trigger"
                        className="text-accent font-bold hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B68D40] rounded"
                      >
                        <span>Explore Route</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 6. FULL SUITE 9 MODULES DIRECTORY HUB */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface/30 border-t border-border/30">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-semibold text-accent tracking-widest uppercase">
              Full Suite Directory
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Explore All 9 Himalayan Trail Modules
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Access every feature module built to spec for seamless high-altitude planning, community journals, and 3D exploration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFeatures.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <Link
                  key={feature.name}
                  href={feature.href}
                  data-slot="trigger"
                  className="block group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                >
                  <GlassCard
                    variant="interactive"
                    delay={idx * 0.04}
                    className="p-6 h-full flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border ${feature.gradient} transition-transform group-hover:scale-110`}
                        >
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <GlassBadge variant="gold">
                          {feature.badge}
                        </GlassBadge>
                      </div>

                      <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors flex items-center justify-between">
                        <span>{feature.name}</span>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-accent" />
                      </h3>

                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between text-xs text-accent font-medium">
                      <span>Open {feature.name}</span>
                      <span className="text-muted-foreground group-hover:text-accent">→</span>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. HIMALAYAN CONSERVATION & COMMUNITY BANNER */}
      <section
        className="relative h-[85vh] md:h-[70vh] w-full bg-cover bg-center flex items-center px-4"
        style={{ backgroundImage: "url('/sub-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />

        <div className="relative max-w-3xl mx-auto text-center text-white">
          <div className="backdrop-blur-xl bg-surface/70 text-surface-foreground p-8 md:p-12 rounded-3xl shadow-2xl border border-border/40 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/15 border border-accent/40 text-accent text-xs font-semibold">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Sustainable Mountain Stewardship</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold leading-snug drop-shadow-lg text-foreground">
              Contribute to the Himalayan Cause
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Support conservation, empower Sherpa and porter communities, and help preserve the sacred beauty and culture of high-altitude Nepal.
            </p>

            <div className="flex justify-center gap-4 flex-wrap pt-4">
              <Link
                href="/donate"
                data-slot="trigger"
                className="px-8 py-3.5 rounded-2xl font-bold transition shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
              >
                Donate
              </Link>
              <Link
                href="/share-trail"
                data-slot="trigger"
                className="px-8 py-3.5 rounded-2xl font-bold transition shadow-lg bg-accent text-accent-foreground hover:bg-[#c99e4b] shadow-accent/25 text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
              >
                Become a Contributor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ALPINE INQUIRY MODAL (PERSISTENT REAL ACID DATABASE BACKED) */}
      {inquiryModalOpen && selectedService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-dialog-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-surface border border-border/50 text-surface-foreground p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/30 pb-4">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-accent">
                  Expedition Inquiry
                </span>
                <h3 id="inquiry-dialog-title" className="text-xl font-bold text-foreground mt-0.5">
                  {selectedService.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInquiryModalOpen(false)}
                aria-label="Close dialog"
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface/80 border border-transparent hover:border-border/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inquirySuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-foreground">
                  Inquiry Successfully Registered
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                  Your request has been durably stored in our expedition dispatch ledger. Reference ID: <strong className="text-accent">{inquirySuccess}</strong>.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:bg-[#c99e4b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                  >
                    Done
                  </button>
                  <Link
                    href="/contact"
                    className="px-6 py-2.5 rounded-xl bg-surface/80 hover:bg-surface text-foreground border border-border/50 font-semibold text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                  >
                    Support Liaison
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                {inquiryError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tenzing Sherpa"
                      value={inquiryForm.fullName}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface/70 border border-border/50 text-foreground text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="adventurer@example.com"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface/70 border border-border/50 text-foreground text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+977 9801234567"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface/70 border border-border/50 text-foreground text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Country of Residence</label>
                    <input
                      type="text"
                      placeholder="Nepal / International"
                      value={inquiryForm.country}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, country: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface/70 border border-border/50 text-foreground text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Group Size</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={inquiryForm.groupSize}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, groupSize: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface/70 border border-border/50 text-foreground text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Preferred Date</label>
                    <input
                      type="date"
                      value={inquiryForm.preferredStartDate}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, preferredStartDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface/70 border border-border/50 text-foreground text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Fitness Level</label>
                    <select
                      value={inquiryForm.fitnessLevel}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, fitnessLevel: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border/50 text-foreground text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert / Technical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Objectives & Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Specify peak targets, oxygen requirements, or dates..."
                    value={inquiryForm.notes}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface/70 border border-border/50 text-foreground text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-border/20">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-surface text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:bg-[#c99e4b] transition-all disabled:opacity-50 shadow-lg shadow-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] cursor-pointer"
                  >
                    {inquirySubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Expedition Inquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </main>
  );
}
