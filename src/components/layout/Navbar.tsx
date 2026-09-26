'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronRight,
  Mountain,
  Map as MapIcon,
  MapPin,
  Calendar,
  CloudSun,
  BookOpen,
  User,
  Heart,
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const leftNavItems = [
    { label: 'Home', href: '/' },
    { label: 'Trails', href: '/trails' },
    { label: 'Explore MAP', href: '/map' },
    { label: 'Stories', href: '/stories' },
  ];

  const rightNavItems = [
    { label: 'Itineraries', href: '/itineraries' },
    { label: 'Weather', href: '/weather' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Login', href: '/login' },
  ];

  const allNavItems = [
    { label: 'Home', href: '/', icon: Mountain },
    { label: 'Dashboard', href: '/dashboard', icon: User },
    { label: 'Trails View', href: '/trails', icon: Mountain },
    { label: '3D MAP', href: '/map', icon: MapIcon },
    { label: 'Landmark Guide', href: '/landmarks', icon: MapPin },
    { label: 'Admin Expedition Studio', href: '/admin', icon: ShieldCheck },
    { label: 'Itinerary Planner', href: '/itinerary/planner', icon: Calendar },
    { label: 'Itineraries View', href: '/itineraries', icon: Calendar },
    { label: 'Weather & Status', href: '/weather', icon: CloudSun },
    { label: 'Trekker Stories', href: '/stories', icon: BookOpen },
    { label: 'About Us', href: '/about', icon: Heart },
    { label: 'Contact', href: '/contact', icon: User },
  ];

  return (
    <header className="w-full sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-neutral-800 text-white">
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
                className={`transition-colors hover:text-[#B68D40] ${
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
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="The Himalayan Trail Home">
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
                className={`transition-colors hover:text-[#B68D40] ${
                  isActive ? 'text-[#B68D40] font-semibold border-b-2 border-[#B68D40] pb-1' : 'text-gray-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          
          <Link
            href="/signup"
            className="px-4 py-1.5 rounded-full bg-[#B68D40] hover:bg-[#c99e4b] text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#B68D40]/20"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#B68D40]/50 rounded-lg"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-7 w-7 text-[#B68D40]" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          role="region"
          aria-label="Mobile Navigation Menu"
          className="md:hidden bg-neutral-950 border-b border-neutral-800 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top duration-300"
        >
          <div className="text-xs font-semibold text-[#B68D40] uppercase tracking-widest px-2 pt-1 border-b border-neutral-800 pb-2">
            Himalayan Explorer Navigation
          </div>
          <div className="grid grid-cols-1 gap-1">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/40 font-semibold'
                      : 'text-gray-300 hover:bg-neutral-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[#B68D40]" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-600" />
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-800 flex gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 py-2.5 text-center text-xs font-semibold uppercase tracking-wider rounded-lg border border-neutral-700 text-gray-200 hover:bg-neutral-900"
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 py-2.5 text-center text-xs font-bold uppercase tracking-wider rounded-lg bg-[#B68D40] text-black hover:bg-[#c99e4b]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

