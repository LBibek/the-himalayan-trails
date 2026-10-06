'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Bed, Wifi, Sun, Flame, Utensils, Star,
  ShieldCheck, MapPin, Mountain, Search,
  PhoneCall, Check, ArrowRight, Radio, Filter,
  Sparkles, Coffee, BatteryCharging, HeartHandshake, Eye
} from 'lucide-react';
import { Teahouse, TeahouseReservation } from '@/types';
import ReserveTeahouseModal from '@/components/teahouses/ReserveTeahouseModal';
import TrailConditionsFeed from '@/components/conditions/TrailConditionsFeed';

const REGIONS = ['All', 'Everest', 'Annapurna', 'Langtang', 'Manaslu'];
const VILLAGES = [
  'All',
  'Namche Bazaar',
  'Dingboche',
  'Gokyo',
  'Manang',
  'Thorong High Camp',
  'Kyanjin Gompa',
  'Samagaun',
  'Lama Hotel'
];

const POPULAR_AMENITIES = [
  'Solar Hot Showers',
  'Starlink / Wi-Fi',
  'Heated Dining Room',
  'Electric Blankets',
];

export default function TeahousesDirectoryPage() {
  const [teahouses, setTeahouses] = useState<Teahouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);

  // Active modal
  const [modalTeahouse, setModalTeahouse] = useState<Teahouse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tab: Lodges Directory vs. Live Condition Reports
  const [activeTab, setActiveTab] = useState<'lodges' | 'conditions'>('lodges');

  useEffect(() => {
    async function loadTeahouses() {
      try {
        setLoading(true);
        const res = await fetch('/api/teahouses');
        const data = await res.json();
        if (data.success && Array.isArray(data.teahouses)) {
          setTeahouses(data.teahouses);
        }
      } catch (err) {
        console.error('Error fetching teahouses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeahouses();
  }, []);

  const filteredTeahouses = useMemo(() => {
    return teahouses.filter((th) => {
      if (selectedRegion !== 'All' && th.region.toLowerCase() !== selectedRegion.toLowerCase()) {
        return false;
      }
      if (selectedVillage !== 'All' && th.village.toLowerCase() !== selectedVillage.toLowerCase()) {
        return false;
      }
      if (selectedAmenity && !th.amenities.some((a) => a.toLowerCase().includes(selectedAmenity.toLowerCase()))) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = th.name.toLowerCase().includes(q);
        const matchesVillage = th.village.toLowerCase().includes(q);
        const matchesRegion = th.region.toLowerCase().includes(q);
        const matchesFood = th.foodMenu.some((f) => f.toLowerCase().includes(q));
        const matchesAmenity = th.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchesName && !matchesVillage && !matchesRegion && !matchesFood && !matchesAmenity) {
          return false;
        }
      }
      return true;
    });
  }, [teahouses, selectedRegion, selectedVillage, selectedAmenity, searchQuery]);

  const handleOpenReserve = (th: Teahouse) => {
    setModalTeahouse(th);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ──────── HERO BANNER ──────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#B68D40]/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B68D40]/15 border border-[#B68D40]/30 text-[#E2C085] text-xs font-bold uppercase tracking-wider">
            <Bed className="w-3.5 h-3.5 text-[#B68D40]" />
            <span>Authentic Himalayan Lodging &amp; Field Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Himalayan Teahouse Directory &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-amber-200">
              Live Trekker Reports
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Reserve verified stone lodges across Khumbu, Annapurna, Manaslu, and Langtang. Check solar showers, Starlink Wi-Fi, and live high-pass conditions before dawn ascent.
          </p>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {[
              { icon: ShieldCheck, label: '100% Verified Sherpa Hosts' },
              { icon: Sun, label: 'Solar Hot Showers' },
              { icon: Wifi, label: 'Starlink High-Speed Wi-Fi' },
              { icon: Utensils, label: 'Authentic Sherpa Kitchens' },
            ].map((spec, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 shadow-sm"
              >
                <spec.icon className="w-4 h-4 text-[#B68D40]" />
                <span>{spec.label}</span>
              </div>
            ))}
          </div>

          {/* Tab Switcher */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('lodges')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition ${
                activeTab === 'lodges'
                  ? 'bg-[#B68D40] text-black shadow-lg shadow-[#B68D40]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏔 Teahouse Lodges ({teahouses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('conditions')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                activeTab === 'conditions'
                  ? 'bg-[#B68D40] text-black shadow-lg shadow-[#B68D40]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Live Field Reports</span>
            </button>
          </div>
        </div>
      </section>

      {/* ──────── MAIN CONTENT AREA ──────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'conditions' ? (
          <div className="max-w-4xl mx-auto">
            <TrailConditionsFeed />
          </div>
        ) : (
          <div className="space-y-8">
            {/* ──── FILTER BAR ──── */}
            <div className="p-5 sm:p-6 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search Bar */}
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by lodge name, village, or Sherpa food specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B68D40]"
                  />
                </div>

                {/* Village Selector */}
                <div>
                  <select
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                  >
                    {VILLAGES.map((v) => (
                      <option key={v} value={v}>
                        {v === 'All' ? 'All Villages' : `Village: ${v}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Region Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mr-1">
                  Region:
                </span>
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => {
                      setSelectedRegion(region);
                      setSelectedVillage('All');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedRegion === region
                        ? 'bg-[#B68D40] text-black'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                    }`}
                  >
                    {region === 'All' ? 'All Ranges' : `${region} Himal`}
                  </button>
                ))}
              </div>

              {/* Amenity Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mr-1">
                  Amenities:
                </span>
                {POPULAR_AMENITIES.map((amenity) => {
                  const isActive = selectedAmenity === amenity;
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => setSelectedAmenity(isActive ? null : amenity)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isActive && <Check className="w-3 h-3 text-cyan-300" />}
                      <span>{amenity}</span>
                    </button>
                  );
                })}
                {selectedAmenity && (
                  <button
                    type="button"
                    onClick={() => setSelectedAmenity(null)}
                    className="text-[10px] text-slate-400 hover:text-white underline ml-2"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* ──── TEAHOUSE CARDS GRID ──── */}
            {loading ? (
              <div className="py-20 text-center text-xs text-slate-400">
                <Bed className="w-8 h-8 mx-auto mb-3 text-[#B68D40] animate-bounce" />
                Loading authentic Himalayan lodges...
              </div>
            ) : filteredTeahouses.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
                <Mountain className="w-10 h-10 mx-auto text-slate-500" />
                <p className="text-base font-bold text-white">No teahouses match your criteria</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try clearing the village or amenity filters to discover lodges along other routes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRegion('All');
                    setSelectedVillage('All');
                    setSelectedAmenity(null);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeahouses.map((th) => (
                  <div
                    key={th.id}
                    data-slot="base"
                    className="group rounded-3xl backdrop-blur-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-[#B68D40]/50 shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    {/* Card Header & Image */}
                    <div data-slot="header" className="relative h-52 w-full overflow-hidden bg-slate-950">
                      <img
                        src={th.coverImage}
                        alt={th.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-black/60 backdrop-blur-md text-[#E2C085] border border-[#B68D40]/40">
                          {th.region} Himal
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <Mountain className="w-3 h-3" />
                          {th.elevation.toLocaleString()} m
                        </span>
                      </div>

                      {/* Village and Host Name overlay */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <div className="flex items-center gap-1 text-xs font-bold text-white">
                            <MapPin className="w-3.5 h-3.5 text-[#B68D40]" />
                            <span>{th.village}</span>
                          </div>
                          {th.hostName && (
                            <p className="text-[10px] text-slate-300 mt-0.5">
                              Host: <span className="text-white font-semibold">{th.hostName}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[#B68D40] text-xs font-black">
                          <Star className="w-3.5 h-3.5 fill-[#B68D40]" />
                          <span>{th.rating}</span>
                          <span className="text-slate-400 text-[10px] font-normal">({th.reviewsCount})</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div data-slot="body" className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-[#E2C085] transition">
                          {th.name}
                        </h3>

                        {/* Amenities Pills */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {th.amenities.slice(0, 3).map((a, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60"
                            >
                              {a}
                            </span>
                          ))}
                          {th.amenities.length > 3 && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800/50 text-slate-400">
                              +{th.amenities.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Sherpa Kitchen Food specialties */}
                        <div className="mt-3 pt-3 border-t border-slate-800/80">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1">
                            <Utensils className="w-3 h-3 text-[#B68D40]" /> Hearth Specialties:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {th.foodMenu.slice(0, 2).map((food, fIdx) => (
                              <span
                                key={fIdx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#B68D40]/10 text-[#E2C085] border border-[#B68D40]/20"
                              >
                                {food}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Price & CTA */}
                      <div data-slot="footer" className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400">From</span>
                          <p className="text-lg font-black text-white">
                            ${th.pricePerNightUsd}{' '}
                            <span className="text-xs text-slate-400 font-normal">/ night</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenReserve(th)}
                          data-slot="trigger"
                          className="px-4 py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs flex items-center gap-1.5 transition shadow-lg shadow-[#B68D40]/20 focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                        >
                          <Bed className="w-3.5 h-3.5" />
                          <span>Reserve Room</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ──────── RESERVATION MODAL ──────── */}
      <ReserveTeahouseModal
        teahouse={modalTeahouse}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
