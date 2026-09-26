'use client';

import React from 'react';
import Link from 'next/link';
import { Mountain, Compass, Mail, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black/80 border-t border-white/10 backdrop-blur-xl text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-neutral-900 border border-[#B68D40]/50 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-white">
              The Himalayan Trail
            </span>
          </Link>
          <p className="text-xs text-gray-400 leading-relaxed">
            The ultimate 3D interactive trekking explorer, custom itinerary planner, and weather hazard radar across the Nepalese Himalayas.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-widest text-[#B68D40]">Explorer Navigation</h3>
          <ul className="space-y-2 text-xs text-gray-400 font-mono">
            <li><Link className="hover:text-[#B68D40] transition flex items-center gap-1.5" href="/map"><Compass className="h-3.5 w-3.5" /> AllTrails 3D Map</Link></li>
            <li><Link className="hover:text-[#B68D40] transition flex items-center gap-1.5" href="/trails"><Mountain className="h-3.5 w-3.5" /> Trekking Trail Directory</Link></li>
            <li><Link className="hover:text-[#B68D40] transition flex items-center gap-1.5" href="/itinerary/planner"><ShieldCheck className="h-3.5 w-3.5" /> Itinerary Route Studio</Link></li>
            <li><Link className="hover:text-[#B68D40] transition flex items-center gap-1.5" href="/admin"><ShieldCheck className="h-3.5 w-3.5" /> Admin Expedition Studio</Link></li>
          </ul>
        </div>
        
        {/* Newsletter Subscription */}
        <div>
          <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-widest text-[#B68D40]">Himalayan Dispatch</h3>
          <p className="mb-3 text-xs text-gray-400">Subscribe for seasonal high pass weather hazard alerts, new trail tracks, and permits guide.</p>
          <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email address..."
              className="p-2.5 rounded-xl bg-black/80 text-white border border-white/10 text-xs focus:outline-none focus:border-[#B68D40]"
            />
            <button
              type="submit"
              className="bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold px-4 py-2.5 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-[#B68D40]/20"
            >
              Subscribe Dispatch
            </button>
          </form>
        </div>

        {/* Social Links & Trust Badge */}
        <div>
          <h3 className="text-white font-bold mb-4 text-xs uppercase tracking-widest text-[#B68D40]">Social & Trust</h3>
          <div className="flex gap-4 text-xl text-gray-400 mb-4">
            <a href="#" aria-label="Facebook" className="hover:text-[#B68D40] transition">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 320 512" height="1em" width="1em">
                <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path>
              </svg>
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-[#B68D40] transition">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em">
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
              </svg>
            </a>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 backdrop-blur-md">
            Verified GPX Topographic Data • Nepal Tourism Board Partner
          </div>
        </div>

      </div>
      
      <div className="text-center text-gray-500 mt-10 text-xs border-t border-white/10 pt-6 font-mono">
        © 2026 The Himalayan Trail. All rights reserved. Crafted with Tailwind CSS & Leaflet.
      </div>
    </footer>
  );
}


