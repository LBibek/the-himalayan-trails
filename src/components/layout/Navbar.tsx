'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  ChevronDown,
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
  Globe,
  LayoutDashboard,
  Tent,
  FileText,
  Menu,
  ArrowRight,
  WifiOff,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────── */
/* Data                                                            */
/* ─────────────────────────────────────────────────────────────── */

const exploreGroup = {
  label: 'Explore',
  items: [
    {
      label: 'Explore & Trails',
      href: '/map',
      icon: MapIcon,
      description: 'Interactive topo maps, GPS tracks & trail filters',
    },
    {
      label: '3D Globe Map',
      href: '/map?engine=3d',
      icon: Globe,
      description: 'Cesium Himalayan terrain, summit drone fly-throughs',
    },
    {
      label: 'Trekker Stories',
      href: '/stories',
      icon: BookOpen,
      description: 'Verified photo journals & expedition dispatches',
    },
    {
      label: 'Weather',
      href: '/weather',
      icon: CloudSun,
      description: 'Avalanche risk, summit temps & altitude lapse rates',
    },
  ],
};

const toolsGroup = {
  label: 'Plan',
  items: [
    {
      label: 'Itinerary Studio',
      href: '/itinerary/planner',
      icon: Calendar,
      description: 'Day-by-day pacing, DnD stages & GPX export',
    },
    {
      label: 'Offline Wilderness Hub',
      href: '/offline',
      icon: WifiOff,
      description: 'Cached GPS route packs & emergency SOS guides',
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Active bookings, explorer badges & reviews',
    },
    {
      label: 'Admin Studio',
      href: '/admin',
      icon: ShieldCheck,
      description: 'Expedition catalog & operations management',
    },
    {
      label: 'Permits & TIMS',
      href: '/contact',
      icon: FileText,
      description: 'National park entry & restricted area permits',
    },
  ],
};

const mobileNavLinks = [
  { label: 'Alpine Gateway',   href: '/',                   icon: Mountain,       description: 'Expedition Matrix & Live Regional Map' },
  { label: 'Explore & Trails', href: '/map',                icon: MapIcon,        description: 'AllTrails interactive topo & GPS tracks' },
  { label: '3D Globe Map',     href: '/map?engine=3d',      icon: Globe,          description: 'Himalayan massifs & summit drone tours' },
  { label: 'Itinerary Studio', href: '/itinerary/planner',  icon: Calendar,       description: 'Interactive pacing, DnD days & waypoints' },
  { label: 'Offline Wilderness', href: '/offline',          icon: WifiOff,        description: 'Cached GPS route packs & emergency SOS guides' },
  { label: 'Weather Office',   href: '/weather',            icon: CloudSun,       description: 'Avalanche risk, summit temps & lapse rates' },
  { label: 'Trekker Stories',  href: '/stories',            icon: BookOpen,       description: 'Verified photo journals & dispatches' },
  { label: 'Dashboard',        href: '/dashboard',          icon: User,           description: 'Active bookings, badges & reviews' },
  { label: 'Admin Studio',     href: '/admin',              icon: ShieldCheck,    description: 'Expedition operations & catalog management' },
];

const secondaryLinks = [
  { label: 'Landmark Guide',    href: '/landmarks' },
  { label: 'About Us',          href: '/about' },
  { label: 'Contact Support',   href: '/contact' },
];

const expeditionShortcuts = [
  { name: 'Everest Base Camp', code: 'EBC',      altitude: '5,364m', pass: 'Khumbu',      href: '/map?trail=everest-base-camp' },
  { name: 'Annapurna Circuit', code: 'Annapurna',altitude: '5,416m', pass: 'Thorong La',  href: '/map?trail=annapurna-circuit' },
  { name: 'Manaslu Circuit',   code: 'Manaslu',  altitude: '5,106m', pass: 'Larkya La',   href: '/map?trail=manaslu-circuit' },
  { name: 'Upper Mustang',     code: 'Mustang',  altitude: '3,840m', pass: 'Lo Manthang', href: '/map?trail=upper-mustang' },
];

/* ─────────────────────────────────────────────────────────────── */
/* Dropdown Component                                              */
/* ─────────────────────────────────────────────────────────────── */

interface DropdownGroupProps {
  label: string;
  items: { label: string; href: string; icon: React.ElementType; description: string }[];
  pathname: string;
  scrolled: boolean;
}

function DropdownGroup({ label, items, pathname, scrolled }: DropdownGroupProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isGroupActive = items.some((i) => pathname === i.href || pathname.startsWith(i.href + '?'));

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-widest px-2 py-1.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
          isGroupActive
            ? 'text-[#B68D40]'
            : scrolled
            ? 'text-gray-200 hover:text-[#B68D40]'
            : 'text-white/90 hover:text-[#B68D40]'
        }`}
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180 text-[#B68D40]' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 rounded-2xl border border-white/10 bg-black/95 backdrop-blur-2xl shadow-2xl shadow-black/60 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Caret */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/95 border-l border-t border-white/10 rotate-45" />
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '?');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                  active
                    ? 'bg-[#B68D40]/15 text-white'
                    : 'hover:bg-white/5 text-gray-300 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 border ${active ? 'bg-[#B68D40]/20 border-[#B68D40]/40 text-[#B68D40]' : 'bg-white/5 border-white/10 text-gray-400 group-hover:text-[#B68D40]'}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${active ? 'text-[#B68D40]' : 'text-white'}`}>{item.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-snug">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Main Navbar                                                     */
/* ─────────────────────────────────────────────────────────────── */

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll-aware styles + progress bar
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (y / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Body scroll lock when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = orig; };
    }
  }, [mobileMenuOpen]);

  // Escape key close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        triggerButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileMenuOpen]);

  const handleCloseMenu = useCallback(() => {
    setMobileMenuOpen(false);
    triggerButtonRef.current?.focus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMobileMenuOpen(false);
      router.push(`/map?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Determine home-page hero transparency
  const isHome = pathname === '/';

  return (
    <header
      data-slot="base"
      className={`w-full sticky top-0 z-50 transition-all duration-500 ${
        scrolled || !isHome
          ? 'bg-black/95 backdrop-blur-xl border-b border-white/8 shadow-xl shadow-black/30'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* Scroll Progress Bar */}
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-[#B68D40] transition-all duration-150 z-10 pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <nav className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4 relative">

        {/* ── Brand Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none rounded-lg p-1 shrink-0"
          aria-label="The Himalayan Trail — Home"
        >
          <div className="relative w-9 h-9 rounded-full bg-neutral-900 border border-[#B68D40]/50 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="hidden sm:block font-extrabold text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-[#F5F6F7] whitespace-nowrap">
            The Himalayan Trail
          </span>
        </Link>

        {/* ── Desktop Navigation ── */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {/* Home */}
          <Link
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={`text-xs font-semibold uppercase tracking-widest px-2 py-1.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
              pathname === '/'
                ? 'text-[#B68D40]'
                : scrolled || !isHome
                ? 'text-gray-300 hover:text-[#B68D40]'
                : 'text-white/90 hover:text-[#B68D40]'
            }`}
          >
            Home
          </Link>

          {/* Explore dropdown */}
          <DropdownGroup label="Explore" items={exploreGroup.items} pathname={pathname} scrolled={scrolled || !isHome} />

          {/* Plan dropdown */}
          <DropdownGroup label="Plan" items={toolsGroup.items} pathname={pathname} scrolled={scrolled || !isHome} />
        </div>

        {/* ── Desktop Right Side ── */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Desktop Live Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/map?search=${encodeURIComponent(searchQuery.trim())}`);
              } else {
                router.push('/map');
              }
            }}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs transition-all ${
              scrolled || !isHome
                ? 'border-white/15 text-gray-300 bg-white/5 focus-within:border-[#B68D40]'
                : 'border-white/20 text-white/90 bg-white/5 focus-within:border-[#B68D40]'
            }`}
          >
            <button
              type="submit"
              className="text-gray-400 hover:text-[#B68D40] transition focus-visible:outline-none"
              aria-label="Submit search"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trails, peaks…"
              className="bg-transparent border-none text-xs text-white placeholder-gray-400 focus:outline-none w-28 lg:w-36 focus:w-44 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-white"
                aria-label="Clear search query"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </form>

          {/* Login */}
          <Link
            href="/login"
            className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
              scrolled || !isHome
                ? 'text-gray-300 hover:text-white'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Login
          </Link>

          {/* Sign Up CTA */}
          <Link
            href="/signup"
            className="px-4 py-1.5 rounded-full bg-[#B68D40] hover:bg-[#c99e4b] active:bg-[#a07a35] text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#B68D40]/25 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Sign Up
          </Link>
        </div>

        <button
          ref={triggerButtonRef}
          data-slot="trigger"
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl text-white focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none transition-colors hover:bg-white/10 flex-col gap-1.5 relative"
          aria-label="Toggle navigation menu"
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

      </nav>

      {/* ─────────────────────────────────────────────────── */}
      {/* Luxury Full-Screen Mobile Navigation Overlay       */}
      {/* ─────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          data-slot="overlay"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl text-white flex flex-col overflow-hidden animate-in fade-in duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
            <Link
              href="/"
              onClick={handleCloseMenu}
              className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none rounded-lg p-1"
              aria-label="Home"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-900 border border-[#B68D40]/40 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-[#F5F6F7]">
                The Himalayan Trail
              </span>
            </Link>
            <button
              type="button"
              onClick={handleCloseMenu}
              className="p-2 rounded-xl border border-white/10 text-gray-300 hover:text-[#B68D40] hover:border-[#B68D40]/40 transition-all focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div data-slot="body" className="flex-1 overflow-y-auto overscroll-contain">
            <div className="px-5 py-5 max-w-2xl mx-auto space-y-6">

              {/* Live Search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B68D40] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search routes, peaks, passes..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#B68D40] focus-visible:ring-2 focus-visible:ring-[#B68D40] transition"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    aria-label="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>

              {/* Primary Nav Links */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#B68D40] pb-1 flex items-center gap-1.5">
                  <Mountain className="h-3 w-3" /> Alpine Expeditions &amp; Portals
                </p>
                {mobileNavLinks.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleCloseMenu}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none ${
                        active
                          ? 'bg-[#B68D40]/15 border-[#B68D40]/40 text-white'
                          : 'bg-white/3 border-white/6 hover:bg-white/8 hover:border-white/12 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg border shrink-0 ${active ? 'bg-[#B68D40]/20 border-[#B68D40]/40 text-[#B68D40]' : 'bg-white/5 border-white/8 text-gray-500'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold ${active ? 'text-[#B68D40]' : 'text-white'}`}>{item.label}</div>
                        <div className="text-xs text-gray-500 truncate">{item.description}</div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                    </Link>
                  );
                })}
              </div>

              {/* Secondary chips */}
              <div className="flex flex-wrap gap-2">
                {secondaryLinks.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={handleCloseMenu}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-[#B68D40] hover:border-[#B68D40]/40 transition-all focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>

              {/* Quick Expedition Shortcuts */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#B68D40] flex items-center gap-1.5">
                  <Compass className="h-3 w-3" /> Quick Expedition Shortcuts
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {expeditionShortcuts.map((sc) => (
                    <Link
                      key={sc.code}
                      href={sc.href}
                      onClick={handleCloseMenu}
                      className="p-3 rounded-xl bg-white/4 border border-white/8 hover:border-[#B68D40]/40 hover:bg-[#B68D40]/8 transition-all group focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-[#B68D40] transition-colors leading-snug">{sc.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-[#B68D40] border border-[#B68D40]/25 font-bold">{sc.code}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>{sc.altitude}</span>
                        <span>{sc.pass}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Emergency Hotline */}
              <div
                data-slot="hotline-card"
                className="p-4 rounded-2xl bg-gradient-to-br from-red-950/60 via-neutral-900/80 to-black border border-red-500/25 space-y-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                    24/7 Helicopter Evacuation &amp; SAR
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Direct satellite link to Garmin inReach &amp; Himalayan Search and Rescue emergency dispatch.
                </p>
                <a
                  href="tel:+97714123456"
                  className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none"
                >
                  <PhoneCall className="h-4 w-4" />
                  Call +977-1-412-3456
                </a>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div data-slot="footer" className="shrink-0 px-5 py-4 border-t border-white/8 bg-black/60">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <Link
                href="/login"
                onClick={handleCloseMenu}
                className="flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 hover:border-white/20 text-gray-300 hover:text-white hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#B68D40] focus-visible:outline-none transition-all"
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
