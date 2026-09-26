'use client';

import React from 'react';
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
  ShieldCheck,
  Thermometer,
  Wind,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Trail } from '@/types';

export default function Home() {
  const [featuredTrails, setFeaturedTrails] = React.useState<Trail[]>([]);
  const [loadingTrails, setLoadingTrails] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/trails')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Trail[]) => {
        setFeaturedTrails(data.slice(0, 3));
        setLoadingTrails(false);
      })
      .catch(() => setLoadingTrails(false));
  }, []);
  // All 9 core features specified in the frontend roadmap & spec
  const userFeatures = [
    {
      name: 'Login',
      desc: 'Access saved itineraries, offline downloaded GPX maps, and trekker profile.',
      href: '/login',
      icon: User,
      badge: 'Account',
      gradient: 'from-amber-600/20 to-[#B68D40]/20 text-[#B68D40] border-[#B68D40]/40'
    },
    {
      name: 'Sign Up',
      desc: 'Join the global trekker network, log high-altitude ascents, and publish journals.',
      href: '/signup',
      icon: UserPlus,
      badge: 'Account',
      gradient: 'from-amber-600/20 to-[#B68D40]/20 text-amber-300 border-[#B68D40]/40'
    },
    {
      name: 'Itinerary Planner',
      desc: 'Drag-and-drop daily route builder with altitude gain alerts & gear checklist builder.',
      href: '/itinerary/planner',
      icon: Calendar,
      badge: 'Planning',
      gradient: 'from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/30'
    },
    {
      name: 'Trails View',
      desc: 'Discover top Himalayan routes, filter by difficulty, max elevation, and duration.',
      href: '/trails',
      icon: Mountain,
      badge: 'Explorer',
      gradient: 'from-blue-600/20 to-indigo-600/20 text-blue-400 border-blue-500/30'
    },
    {
      name: 'MAP',
      desc: 'Interactive 3D topographic terrain map with satellite overlay and GPX track visualization.',
      href: '/map',
      icon: MapIcon,
      badge: 'Interactive 3D',
      gradient: 'from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/30'
    },
    {
      name: 'Landmark',
      desc: 'Explore high passes, base camps, ancient monasteries, sacred lakes, and tea houses.',
      href: '/landmarks',
      icon: MapPin,
      badge: 'POIs & Passes',
      gradient: 'from-[#B68D40]/20 to-orange-600/20 text-[#B68D40] border-[#B68D40]/40'
    },
    {
      name: 'Itineraries View',
      desc: 'Browse curated community itineraries, view day-by-day breakdowns, and clone routes.',
      href: '/itineraries',
      icon: Layers,
      badge: 'Community',
      gradient: 'from-teal-600/20 to-cyan-600/20 text-teal-400 border-teal-500/30'
    },
    {
      name: 'weather and trail',
      desc: 'Live high-altitude weather updates, temperature lapse rates, and real-time hazard warnings.',
      href: '/weather',
      icon: CloudSun,
      badge: 'Safety',
      gradient: 'from-sky-600/20 to-blue-600/20 text-sky-400 border-sky-500/30'
    },
    {
      name: 'Stories',
      desc: 'Trekker trip journals, photo galleries, survival stories, and cultural insights.',
      href: '/stories',
      icon: BookOpen,
      badge: 'Journal',
      gradient: 'from-rose-600/20 to-pink-600/20 text-rose-400 border-rose-500/30'
    },
  ];

  const regions = [
    { name: 'Everest / Khumbu', alt: '5,364m Base Camp', image: '/steps/region.jpg' },
    { name: 'Annapurna Circuit', alt: '5,416m Thorong La', image: '/steps/trails.jpg' },
    { name: 'Langtang Valley', alt: '4,773m Kyanjin Ri', image: '/steps/weather.jpg' },
    { name: 'Upper Mustang', alt: '3,840m Lo Manthang', image: '/steps/itinerary.jpg' },
  ];

  return (
    <main className="bg-black text-white min-h-screen flex flex-col">

      {/* 1. HERO SECTION (REFERENCE DESIGN MIRROR) */}
      <section className="min-h-[92vh] w-full relative flex flex-col items-center justify-between text-white overflow-hidden">
        {/* Hero Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105" 
          style={{ backgroundImage: "url('/bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center bottom' }} 
        />
        
        {/* Dark Vignette and Gradient Overlay */}
        <div 
          className="absolute inset-0 z-10" 
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.95) 100%)' }} 
        />

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center justify-center flex-grow text-center px-6 pt-20 pb-12 max-w-5xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-[#B68D40]/50 backdrop-blur-md mb-6">
            <Compass className="h-4 w-4 text-[#B68D40] animate-spin-slow" />
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
              className="relative cursor-pointer px-8 py-3.5 w-64 md:w-72 rounded-full overflow-hidden group bg-[#B68D40] text-black font-semibold flex items-center justify-center shadow-2xl shadow-[#B68D40]/30 hover:bg-[#c99e4b] transition-all transform hover:-translate-y-0.5"
            >
              <span className="relative z-30 text-base font-bold tracking-wide">Start Your Journey</span>
            </Link>

            <Link
              href="/map"
              className="px-8 py-3.5 rounded-full bg-black/60 border border-neutral-700 text-white font-medium hover:bg-neutral-900 hover:border-[#B68D40] transition-all backdrop-blur-md text-base"
            >
              Launch 3D MAP
            </Link>
          </div>

        </div>

        {/* Stats Bar */}
        <div 
          className="relative z-20 w-full py-8 md:py-12 border-t border-neutral-800/60" 
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.85), rgba(0,0,0,0))' }}
        >
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16 px-4">
            <div className="flex flex-col items-center flex-shrink-0">
              <h3 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-widest mb-1 whitespace-nowrap">
                Total Distance Mapped
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-[#B68D40] whitespace-nowrap">
                3,500+ km
              </p>
            </div>

            <div className="flex flex-col items-center flex-shrink-0">
              <h3 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-widest mb-1 whitespace-nowrap">
                Communities Connected
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-[#B68D40] whitespace-nowrap">
                150+
              </p>
            </div>

            <div className="flex flex-col items-center flex-shrink-0">
              <h3 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-widest mb-1 whitespace-nowrap">
                Regions Explored
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-[#B68D40] whitespace-nowrap">
                12+
              </p>
            </div>

            <div className="flex flex-col items-center flex-shrink-0">
              <h3 className="text-xs md:text-sm font-medium text-gray-400 uppercase tracking-widest mb-1 whitespace-nowrap">
                Landmarks Documented
              </h3>
              <p className="text-2xl md:text-3xl font-bold text-[#B68D40] whitespace-nowrap">
                200+
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "WHAT YOU CAN FIND" ALTERNATING SHOWCASE (REFERENCE DESIGN MIRROR) */}
      <section className="bg-black py-24 px-4 md:px-8 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto space-y-24">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-[#B68D40] text-xs uppercase tracking-widest font-semibold">Trekker Exploration</h2>
            <h3 className="text-white text-3xl md:text-5xl font-semibold">What You Can Find</h3>
            <p className="text-gray-400 text-sm md:text-base">Comprehensive features designed for high-altitude trekking success and safety.</p>
          </div>

          <div className="space-y-28">
            
            {/* Feature 1: Choose Your Region */}
            <div className="flex flex-col md:flex-row items-center gap-10 group">
              <div className="relative w-full md:w-1/2 h-64 md:h-96 overflow-hidden rounded-2xl border border-neutral-800 shadow-2xl">
                <img
                  src="/steps/region.jpg"
                  alt="Choose Your Region"
                  className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {regions.map((r) => (
                    <span key={r.name} className="text-[11px] font-medium bg-black/70 text-[#E2C085] px-2.5 py-1 rounded-md border border-[#B68D40]/30 backdrop-blur-md">
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-1/2 text-white space-y-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-[#B68D40]">Step 01</div>
                <h3 className="text-2xl md:text-4xl font-semibold">Choose Your Region</h3>
                <p className="text-gray-300 md:text-lg leading-relaxed">
                  Pick the Himalayan range you want to explore from various iconic regions including Everest, Annapurna, Langtang, Mustang, Manaslu, and Ladakh.
                </p>
                <Link
                  href="/landmarks"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#B68D40] hover:text-[#c99e4b] pt-2"
                >
                  <span>Explore Regions & Landmarks</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 2: Select Trails */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10 group">
              <div className="relative w-full md:w-1/2 h-64 md:h-96 overflow-hidden rounded-2xl border border-neutral-800 shadow-2xl">
                <img
                  src="/steps/trails.jpg"
                  alt="Select Trails"
                  className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="w-full md:w-1/2 text-white space-y-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-[#B68D40]">Step 02</div>
                <h3 className="text-2xl md:text-4xl font-semibold">Select Trails</h3>
                <p className="text-gray-300 md:text-lg leading-relaxed">
                  Browse curated trails with detailed insights, elevation profiles, high pass warnings, route difficulty levels, and GPX track visualization.
                </p>
                <Link
                  href="/trails"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#B68D40] hover:text-[#c99e4b] pt-2"
                >
                  <span>Browse All Himalayan Trails</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 3: Live Weather & POIs */}
            <div className="flex flex-col md:flex-row items-center gap-10 group">
              <div className="relative w-full md:w-1/2 h-64 md:h-96 overflow-hidden rounded-2xl border border-neutral-800 shadow-2xl">
                <img
                  src="/steps/weather.jpg"
                  alt="Live Weather & POIs"
                  className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="w-full md:w-1/2 text-white space-y-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-[#B68D40]">Step 03</div>
                <h3 className="text-2xl md:text-4xl font-semibold">Live Weather & POIs</h3>
                <p className="text-gray-300 md:text-lg leading-relaxed">
                  See real-time high-altitude weather, satellite view overlays, avalanche advisory notices, and verified points of interest along your trek.
                </p>
                <Link
                  href="/weather"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#B68D40] hover:text-[#c99e4b] pt-2"
                >
                  <span>Check Weather & Hazards Hub</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Feature 4: View Stories & Itineraries */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10 group">
              <div className="relative w-full md:w-1/2 h-64 md:h-96 overflow-hidden rounded-2xl border border-neutral-800 shadow-2xl">
                <img
                  src="/steps/itinerary.jpg"
                  alt="View Stories & Itineraries"
                  className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="w-full md:w-1/2 text-white space-y-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-[#B68D40]">Step 04</div>
                <h3 className="text-2xl md:text-4xl font-semibold">View Stories & Itineraries</h3>
                <p className="text-gray-300 md:text-lg leading-relaxed">
                  Read authentic trekker trip journals, drag-and-drop daily itineraries, altitude safety guides, and cultural insights from local Sherpas.
                </p>
                <div className="flex gap-4 pt-2">
                  <Link
                    href="/itinerary/planner"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#B68D40] hover:text-[#c99e4b]"
                  >
                    <span>Itinerary Planner</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/stories"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white"
                  >
                    <span>Read Stories</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. CORE HIMALAYAN TRAIL 9 MODULES DIRECTORY HUB */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-t border-b border-neutral-900">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-semibold text-[#B68D40] tracking-widest uppercase">
              Full Suite Directory
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Explore All 9 Himalayan Trail Modules
            </h2>
            <p className="text-sm text-gray-400">
              Access every feature module built to spec for seamless high-altitude planning and exploration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userFeatures.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Link
                  key={feature.name}
                  href={feature.href}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl bg-black border border-neutral-800 hover:border-[#B68D40]/60 transition-all duration-300 hover:shadow-xl hover:shadow-[#B68D40]/10"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${feature.gradient} transition-transform group-hover:scale-110`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-neutral-900 text-gray-300 border border-neutral-800">
                        {feature.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#B68D40] transition-colors flex items-center justify-between">
                      <span>{feature.name}</span>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#B68D40]" />
                    </h3>

                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-between text-xs text-[#B68D40] font-medium">
                    <span>Open {feature.name}</span>
                    <span className="text-gray-600 group-hover:text-[#B68D40]">→</span>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. FEATURED TRAILS SNAPSHOT */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-900 pb-6">
            <div>
              <span className="text-xs font-semibold text-[#B68D40] tracking-widest uppercase">Curated Routes</span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mt-1">Popular Himalayan Ascents</h2>
            </div>
            <Link href="/trails" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B68D40] hover:underline uppercase tracking-wider">
              <span>View All Trails</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingTrails ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 text-[#B68D40]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Loading trails from database...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTrails.map((trail) => (
              <div key={trail.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden group hover:border-neutral-700 transition-all flex flex-col">
                <div className="relative h-52 w-full overflow-hidden bg-neutral-900">
                  <img
                    src={trail.image}
                    alt={trail.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#E2C085] border border-[#B68D40]/30">
                    {trail.region} Region
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-400 border border-neutral-800">
                    Max {trail.maxElevation}m
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#B68D40] transition-colors">
                      {trail.name}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                      {trail.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-900 flex items-center justify-between text-xs text-gray-400">
                    <div>
                      <span className="text-white font-semibold">{trail.distanceKm} km</span> • {trail.durationDays} Days
                    </div>
                    <Link href="/trails" className="text-[#B68D40] font-bold hover:underline">
                      Explore Route →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

        </div>
      </section>

      {/* 5. CONTRIBUTE TO THE HIMALAYAN CAUSE (REFERENCE DESIGN MIRROR) */}
      <section 
        className="relative h-[85vh] md:h-[75vh] w-full bg-cover bg-center flex items-center px-4"
        style={{ backgroundImage: "url('/sub-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
        
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <div className="backdrop-blur-md bg-white/10 p-8 md:p-12 rounded-3xl shadow-2xl border border-white/20 space-y-6">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-snug drop-shadow-lg text-white">
              Contribute to the Himalayan Cause
            </h2>
            <p className="text-base md:text-xl text-gray-200 leading-relaxed max-w-2xl mx-auto">
              Support conservation, empower trekking communities, and help preserve the natural beauty and culture of the Himalayas.
            </p>
            
            <div className="flex justify-center gap-4 flex-wrap pt-4">
              <Link
                href="/donate"
                className="px-8 py-3.5 rounded-xl font-bold transition shadow-lg bg-green-600 hover:bg-green-500 text-white shadow-green-600/30 text-sm md:text-base"
              >
                Donate
              </Link>
              <Link
                href="/share-trail"
                className="px-8 py-3.5 rounded-xl font-bold transition shadow-lg bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 text-sm md:text-base"
              >
                Become a contributor
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
