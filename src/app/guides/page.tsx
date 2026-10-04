'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Compass,
  Mountain,
  Users,
  Languages,
  DollarSign,
  Star,
  CheckCircle2,
  Calendar,
  Filter,
  ArrowRight,
  Loader2,
  HeartHandshake,
  FileCheck,
  Scale,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { Guide } from '@/types';
import PorterWeightCalculator from '@/components/logistics/PorterWeightCalculator';

export default function CertifiedGuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCert, setSelectedCert] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [selectedGuideForModal, setSelectedGuideForModal] = useState<Guide | null>(null);

  useEffect(() => {
    fetch('/api/guides')
      .then((res) => res.json())
      .then((data) => {
        if (data.guides) {
          setGuides(data.guides);
        }
      })
      .catch((err) => console.error('Error loading guides:', err))
      .finally(() => setLoading(false));
  }, []);

  // Keyboard Escape listener for accessible modal closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGuideForModal(null);
      }
    };
    if (selectedGuideForModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGuideForModal]);

  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      if (selectedCert !== 'All' && !g.certification.includes(selectedCert)) {
        return false;
      }
      if (selectedRegion !== 'All') {
        const specs = g.specialties.join(' ').toLowerCase();
        const clan = (g.sherpaClan || '').toLowerCase();
        const regionLower = selectedRegion.toLowerCase();
        if (!specs.includes(regionLower) && !clan.includes(regionLower)) {
          return false;
        }
      }
      if (availableOnly && !g.isAvailable) {
        return false;
      }
      return true;
    });
  }, [guides, selectedCert, selectedRegion, availableOnly]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-[#B68D40] selection:text-black">
      {/* ──────── 1. HERO SECTION ──────── */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(182,141,64,0.15),rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-[#B68D40]/15 text-[#B68D40] text-xs font-bold border border-[#B68D40]/30 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Nepal Mountaineering Association &amp; IFMGA Verified
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5" />
              100% IPPG Ethical Porter Wages
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Verified Sherpa Guides &amp; <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-amber-500">
              Alpine Porter Logistics Marketplace
            </span>
          </h1>

          <p className="max-w-3xl text-sm sm:text-base text-gray-300 leading-relaxed">
            Hire legendary IFMGA / UIAGM certified Sherpa mountain guides and ethical porter teams.
            Every guide holds authentic government credentials, decades of 8,000-meter summit experience,
            and strict Wilderness First Responder (WFR) clearance across the Mahalangur, Annapurna, and Rolwaling massifs.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Summits Logged</span>
              <span className="text-xl font-black text-[#B68D40]">68+ 8000m Peaks</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Certification Tier</span>
              <span className="text-xl font-black text-white">IFMGA / NNMGA / NMA</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Porter Standards</span>
              <span className="text-xl font-black text-emerald-400">IPPG &lt;25kg Load</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Rescue Coverage</span>
              <span className="text-xl font-black text-white">24/7 SAR Satellite</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──────── 2. FILTERS BAR ──────── */}
      <section className="sticky top-20 z-30 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-400 font-bold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#B68D40]" />
                Certification:
              </span>
              {['All', 'IFMGA', 'NNMGA', 'NMA'].map((cert) => (
                <button
                  key={cert}
                  onClick={() => setSelectedCert(cert)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                    selectedCert === cert
                      ? 'bg-gradient-to-r from-[#B68D40] to-[#E2C085] text-black font-extrabold shadow-lg shadow-[#B68D40]/20'
                      : 'bg-neutral-900 text-gray-300 hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  {cert === 'All' ? 'All Accreditations' : cert}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold">Specialty Massif:</span>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                >
                  <option value="All">All Himalayan Massifs</option>
                  <option value="Khumbu">Khumbu &amp; Everest</option>
                  <option value="Annapurna">Annapurna &amp; Dhaulagiri</option>
                  <option value="Manaslu">Manaslu Circuit</option>
                  <option value="Rolwaling">Rolwaling &amp; Tashi Lapcha</option>
                  <option value="Langtang">Langtang &amp; Gosainkunda</option>
                  <option value="Mustang">Upper Mustang Kingdom</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded bg-neutral-900 border-neutral-700 text-[#B68D40] focus:ring-[#B68D40]"
                />
                <span>Available for 2026</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* ──────── 3. GUIDE DIRECTORY & PORTER ALLOCATOR ──────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Guides Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-[#B68D40]" />
              Certified Sherpa Guide Registry
              <span className="text-xs font-mono font-normal text-gray-400">
                ({filteredGuides.length} verified guide{filteredGuides.length === 1 ? '' : 's'})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 text-[#B68D40] animate-spin" />
              <p className="text-xs font-semibold tracking-wider uppercase">Loading verified mountain guides...</p>
            </div>
          ) : filteredGuides.length === 0 ? (
            <div className="py-16 text-center space-y-3 rounded-3xl bg-neutral-900/40 border border-neutral-800">
              <ShieldCheck className="w-10 h-10 text-gray-500 mx-auto" />
              <p className="text-gray-300 text-sm font-semibold">No guides matching your criteria.</p>
              <button
                onClick={() => {
                  setSelectedCert('All');
                  setSelectedRegion('All');
                  setAvailableOnly(false);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map((guide) => (
                <div
                  key={guide.id}
                  data-slot="base"
                  className="rounded-3xl backdrop-blur-xl bg-neutral-900/70 border border-neutral-800 hover:border-[#B68D40]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xl hover:shadow-[#B68D40]/10"
                >
                  {/* Card Header & Avatar */}
                  <div data-slot="header" className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative">
                        <img
                          src={guide.avatarImage}
                          alt={guide.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-[#B68D40]/60 shadow-lg group-hover:scale-105 transition-transform"
                        />
                        {guide.isAvailable && (
                          <span
                            title="Available for Expeditions"
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-neutral-950"
                          />
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Daily Guiding Fee</span>
                        <span className="text-lg font-black text-[#B68D40]">${guide.dailyRateUsd}</span>
                        <span className="text-[10px] text-gray-400"> / day</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-white text-lg tracking-tight group-hover:text-[#B68D40] transition">
                          {guide.name}
                        </h3>
                      </div>
                      {guide.sherpaClan && (
                        <p className="text-xs text-gray-400 font-medium">{guide.sherpaClan}</p>
                      )}
                    </div>

                    {/* Accreditations Pill */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#B68D40]/15 text-[#B68D40] border border-[#B68D40]/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {guide.certification}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-gray-400 bg-neutral-950 border border-neutral-800">
                        {guide.licenseNumber}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div data-slot="body" className="px-6 space-y-4 text-xs">
                    {/* Trophies & Ratings */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-neutral-950/60 border border-neutral-850">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Summit Record</span>
                        <span className="font-extrabold text-white flex items-center gap-1">
                          <Mountain className="w-3.5 h-3.5 text-amber-400" />
                          {guide.summitCount} Peaks Climbed
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Explorer Rating</span>
                        <span className="font-extrabold text-white flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-[#B68D40] fill-[#B68D40]" />
                          {guide.rating.toFixed(1)} ({guide.reviewsCount})
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-gray-300 leading-relaxed text-xs line-clamp-3">
                      {guide.bio}
                    </p>

                    {/* Specialties */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Specialties</span>
                      <div className="flex flex-wrap gap-1">
                        {guide.specialties.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] text-gray-300 font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px] pt-1">
                      <Languages className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{guide.languages.join(' • ')}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div data-slot="footer" className="p-6 pt-4 border-t border-neutral-800/80 mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGuideForModal(guide)}
                      className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition border border-neutral-700/60 flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-[#B68D40]" />
                      <span>Verify License</span>
                    </button>

                    <Link
                      href={`/map`}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] hover:opacity-90 text-black font-extrabold text-xs transition shadow-lg shadow-[#B68D40]/20 flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                    >
                      <span>Choose Route</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ──────── 4. EMBEDDED ETHICAL PORTER WEIGHT LOGISTICS SECTION ──────── */}
        <section className="space-y-6 pt-8 border-t border-neutral-800">
          <div className="max-w-3xl space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 inline-flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Porter Welfare &amp; IPPG Compliance Tool
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Interactive Gear Weight &amp; Fair Porter Allocation
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Plan ethical logistics before you pack. The International Porter Protection Group (IPPG)
              strictly mandates a maximum 30kg load ceiling for porters, with 20-25kg recommended for safety
              and spinal health. Estimate your team’s cargo and review itemized fair wages below.
            </p>
          </div>

          <div className="max-w-4xl">
            <PorterWeightCalculator initialGroupSize={2} initialDurationDays={14} />
          </div>
        </section>
      </main>

      {/* ──────── 5. VERIFIED LICENSE CREDENTIALS MODAL ──────── */}
      {selectedGuideForModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedGuideForModal(null)}
        >
          <div
            className="max-w-md w-full rounded-3xl bg-neutral-900 border border-[#B68D40]/50 p-6 sm:p-7 space-y-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedGuideForModal.avatarImage}
                  alt={selectedGuideForModal.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-[#B68D40]/50 shrink-0"
                />
                <div>
                  <h3 className="font-extrabold text-white text-base">{selectedGuideForModal.name}</h3>
                  <p className="text-xs text-[#B68D40] font-semibold">{selectedGuideForModal.certification}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGuideForModal(null)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">License ID:</span>
                  <span className="text-[#B68D40] font-bold">{selectedGuideForModal.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Governing Body:</span>
                  <span className="text-gray-200">Nepal Mountaineering Association (NMA)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-emerald-400 font-bold">Active &amp; In Good Standing</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">First Aid:</span>
                  <span className="text-gray-200">Wilderness First Responder (WFR)</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Registered Clan / Heritage:</span>
                <p className="text-gray-200">{selectedGuideForModal.sherpaClan || 'High-Altitude Sherpa Alpinist'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 font-bold uppercase text-[10px]">High-Altitude Expeditions Log:</span>
                <p className="text-gray-300 leading-relaxed">{selectedGuideForModal.bio}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedGuideForModal(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] text-black font-extrabold text-xs shadow-lg transition"
            >
              Close Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
