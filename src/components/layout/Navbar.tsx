'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  ChevronRight,
  Mountain,
  Map as MapIcon,
  Calendar,
  CloudSun,
  BookOpen,
  User,
  ShieldCheck,
  Search,
  PhoneCall,
  Compass,
  Globe
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Keyboard Escape listener and focus restoration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        triggerButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const leftNavItems = [
    { label: 'Home', href: '/' },
    { label: 'Explore & Trails', href: '/map' },
    { label: '3D Globe Map', href: '/map?engine=3d' },
    { label: 'Stories', href: '/stories' },
  ];

  const rightNavItems = [
    { label: 'Planner', href: '/itinerary/planner' },
    { label: 'Weather', href: '/weather' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Login', href: '/login' },
  ];

  const primaryNavLinks = [
    {
      label: 'Alpine Gateway',
      href: '/',
      icon: Mountain,
      description: 'Expedition Matrix & Live Regional Map',
    },
    {
      label: 'Explore & Trails',
      href: '/map',
      icon: MapIcon,
      description: 'AllTrails Interactive Topo & GPS Tracks',
    },
    {
      label: '3D Globe Map',
      href: '/map?engine=3d',
      icon: Globe,
      description: 'Himalayan Massifs & Summit Drone Tours',
    },
    {
      label: 'Itinerary Studio',
      href: '/itinerary/planner',
      icon: Calendar,
      description: 'Interactive Pacing, DnD Days & Waypoints',
    },
    {
      label: 'Alpine Met Office',
      href: '/weather',
      icon: CloudSun,
      description: 'Avalanche Risk, Summit Temps & Lapse Rates',
    },
    {
      label: 'Trekker Stories',
      href: '/stories',
      icon: BookOpen,
      description: 'Verified Photo Journals & Dispatches',
    },
    {
      label: 'Adventurer Profile',
      href: '/dashboard',
      icon: User,
      description: 'Active Bookings, Badges & Reviews',
    },
    {
      label: 'Command Studio',
      href: '/admin',
      icon: ShieldCheck,
      description: 'Expedition Operations & Catalog Management',
    },
  ];

  const expeditionShortcuts = [
    {
      name: 'Everest Base Camp',
      code: 'EBC',
      altitude: '5,364m',
      pass: 'Khumbu',
      href: '/map?trail=everest-base-camp',
    },
    {
      name: 'Annapurna Circuit',
      code: 'Annapurna',
      altitude: '5,416m',
      pass: 'Thorong La',
      href: '/map?trail=annapurna-circuit',
    },
    {
      name: 'Manaslu Circuit',
      code: 'Manaslu',
      altitude: '5,106m',
      pass: 'Larkya La',
      href: '/map?trail=manaslu-circuit',
    },
    {
      name: 'Upper Mustang',
      code: 'Mustang',
      altitude: '3,840m',
      pass: 'Lo Manthang',
      href: '/map?trail=upper-mustang',
    },
  ];

  const secondaryNavLinks = [
    { label: 'Landmark Guide', href: '/landmarks' },
    { label: 'Saved Itineraries', href: '/itineraries' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact Support', href: '/contact' },
  ];

  const handleCloseMenu = () => {
    setMobileMenuOpen(false);
    triggerButtonRef.current?.focus();
  };

  return (
    <header
      data-slot="base"
      className="w-full sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-neutral-800 text-white"
    >
      <nav className="max-w-7xl mx-auto px-4 py-3 md:px-8 md:py-4 flex justify-between items-center relative">
        
        {/* Left Nav Links */}
        <div className="hidden md:flex flex-1 justify-start gap-6 lg:gap-10 text-xs sm:text-sm font-light uppercase tracking-widest whitespace-nowrap">
          {leftNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors hover:text-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none rounded-md px-1 py-0.5 ${
                  isActive ? 'text-[#B68D40] font-semibold border-b-2 border-[#B68D40] pb-1' : 'text-gray-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Brand Logo in Center */}
        <div className="flex-shrink-0 mx-4 flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none rounded-lg p-1"
            aria-label="The Himalayan Trail Home"
          >
            <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full bg-neutral-900 border border-[#B68D40]/40 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="The Himalayan Trail Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-extrabold text-base md:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-[#F5F6F7]">
              The Himalayan Trail
            </span>
          </Link>
        </div>

        {/* Right Nav Links */}
        <div className="hidden md:flex flex-1 justify-end gap-6 lg:gap-10 text-xs sm:text-sm font-light uppercase tracking-widest whitespace-nowrap items-center">
          {rightNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors hover:text-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none rounded-md px-1 py-0.5 ${
                  isActive ? 'text-[#B68D40] font-semibold border-b-2 border-[#B68D40] pb-1' : 'text-gray-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          
          <Link
            href="/signup"
            className="px-4 py-1.5 rounded-full bg-[#B68D40] hover:bg-[#c99e4b] text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#B68D40]/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile menu animated trigger button */}
        <div className="flex md:hidden items-center">
          <button
            ref={triggerButtonRef}
            data-slot="trigger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none rounded-xl relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 transition-colors"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-overlay"
          >
            <span
              className={`block w-6 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                mobileMenuOpen ? 'rotate-45 translate-y-2 bg-[#B68D40]' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                mobileMenuOpen ? '-rotate-45 -translate-y-2 bg-[#B68D40]' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Luxury Full-Screen Frosted Glass Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          data-slot="overlay"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white flex flex-col justify-between overflow-y-auto overscroll-contain animate-in fade-in duration-300"
        >
          {/* Overlay Top Bar / Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 shrink-0 bg-black/60">
            <Link
              href="/"
              onClick={handleCloseMenu}
              className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none rounded-lg p-1"
              aria-label="The Himalayan Trail Home"
            >
              <div className="relative w-9 h-9 rounded-full bg-neutral-900 border border-[#B68D40]/40 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <img
                  src="/logo.png"
                  alt="The Himalayan Trail Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-[#F5F6F7]">
                The Himalayan Trail
              </span>
            </Link>
            <button
              type="button"
              data-slot="trigger"
              onClick={handleCloseMenu}
              className="p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none transition-colors"
              aria-label="Close Mobile Navigation"
            >
              <X className="h-5 w-5 text-[#B68D40]" />
            </button>
          </div>

          {/* Overlay Body - Luxury Split Layout */}
          <div data-slot="body" className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Primary Navigation Column (Left / Top) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                  <span className="text-xs font-bold text-[#B68D40] uppercase tracking-widest flex items-center gap-1.5">
                    <Mountain className="h-3.5 w-3.5" />
                    Alpine Expeditions & Portals
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Core Routes</span>
                </div>
                <div className="space-y-1.5">
                  {primaryNavLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleCloseMenu}
                        className={`flex items-start gap-3.5 p-3 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                          isActive
                            ? 'bg-[#B68D40]/15 border-[#B68D40]/50 text-white font-semibold shadow-lg'
                            : 'bg-neutral-950/40 border-neutral-800/60 hover:border-neutral-700 hover:bg-neutral-900/60 text-gray-200 hover:text-white'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[#B68D40] shrink-0 mt-0.5">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold tracking-wide text-white">{item.label}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-[#B68D40] transition-colors" />
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Secondary Discovery Chips */}
                <div className="pt-2 flex flex-wrap gap-2">
                  {secondaryNavLinks.map((sec) => (
                    <Link
                      key={sec.href}
                      href={sec.href}
                      onClick={handleCloseMenu}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 text-xs text-gray-300 hover:text-[#B68D40] transition-colors focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                    >
                      {sec.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Utility Column (Right / Bottom) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Live Search Input Field */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#B68D40] uppercase tracking-widest flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5" />
                    Live Expedition Search
                  </span>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim()) {
                        setMobileMenuOpen(false);
                        router.push(`/map?search=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                    className="relative w-full"
                  >
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#B68D40]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search routes, peaks, passes..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-700/80 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </form>
                </div>

                {/* Quick Expedition Shortcuts */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#B68D40] uppercase tracking-widest flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5" />
                      Quick Expedition Shortcuts
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">High-Altitude</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {expeditionShortcuts.map((sc) => (
                      <Link
                        key={sc.code}
                        href={sc.href}
                        onClick={handleCloseMenu}
                        className="p-3 rounded-xl bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800 hover:border-[#B68D40]/50 transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-[#B68D40] transition-colors">{sc.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-[#B68D40] border border-[#B68D40]/20 font-bold">{sc.code}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                          <span>{sc.altitude}</span>
                          <span className="text-gray-400">{sc.pass}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 24/7 Helicopter Evacuation & High-Altitude SAR Emergency Hotline CTA */}
                <div
                  data-slot="hotline-card"
                  className="p-4 rounded-2xl bg-gradient-to-br from-red-950/50 via-neutral-900/90 to-neutral-950 border border-red-500/30 text-white space-y-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                      24/7 Helicopter Evacuation & High-Altitude SAR
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Direct satellite link to Garmin inReach & Himalayan Search and Rescue (SAR) emergency dispatch.
                  </p>
                  <a
                    href="tel:+97714123456"
                    className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold text-xs shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>Call Emergency Hotline: +977-1-412-3456</span>
                  </a>
                </div>

              </div>

            </div>
          </div>

          {/* Overlay Footer */}
          <div data-slot="footer" className="px-6 py-4 border-t border-neutral-800/80 bg-black/60 shrink-0">
            <div className="max-w-5xl mx-auto flex items-center gap-3">
              <Link
                href="/login"
                onClick={handleCloseMenu}
                className="flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider rounded-xl border border-neutral-700 hover:border-neutral-500 text-gray-200 hover:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none transition-all"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={handleCloseMenu}
                className="flex-1 py-2.5 text-center text-xs font-extrabold uppercase tracking-wider rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black shadow-lg shadow-[#B68D40]/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-all"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

