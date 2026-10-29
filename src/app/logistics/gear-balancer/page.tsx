'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  Mountain,
  Heart,
  Users,
  Compass,
  ArrowLeft,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import GearWeightBalancer from '@/components/logistics/GearWeightBalancer';
import { GearManifest } from '@/types/gear';

export default function GearBalancerPage() {
  const [manifests, setManifests] = useState<GearManifest[]>([]);
  const [loadingManifests, setLoadingManifests] = useState(true);

  // Load existing manifests from SQLite
  const loadManifests = async () => {
    try {
      const res = await fetch('/api/logistics/gear-manifest');
      const data = await res.json();
      if (data.manifests) {
        setManifests(data.manifests);
      }
    } catch (err) {
      console.error('Failed to load manifests:', err);
    } finally {
      setLoadingManifests(false);
    }
  };

  useEffect(() => {
    loadManifests();
  }, []);

  return (
    <div data-slot="base" className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div data-slot="header" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link href="/" className="hover:text-accent transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/explore" className="hover:text-accent transition-colors">
            Logistics & Preparation
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white">Gear & Porter Load Balancer</span>
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-border/40 backdrop-blur-xl bg-surface/60 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-accent/15 border border-accent/30 text-accent">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>IPPG & TAAN Himalayan Porter Protection Standard</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Expedition Gear Balancer & Porter Load Ethics
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every year in the Himalayas, hundreds of porters suffer preventable frostbite and lumbar trauma due to overloaded baggage. Our interactive balancer calculates physiological exertion across Himalayan altitude zones and guarantees your team complies with the 5 International Porter Protection Group (IPPG) mandates.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-surface/50 border border-border/30">
                <div className="text-muted-foreground">Porter Cap</div>
                <div className="text-lg font-black text-accent">25 kg</div>
                <div className="text-[10px] text-muted-foreground">TAAN Legal Max</div>
              </div>
              <div className="p-3 rounded-xl bg-surface/50 border border-border/30">
                <div className="text-muted-foreground">Shared Target</div>
                <div className="text-lg font-black text-emerald-400">12.5 kg</div>
                <div className="text-[10px] text-muted-foreground">Per Trekker (Pair)</div>
              </div>
              <div className="p-3 rounded-xl bg-surface/50 border border-border/30">
                <div className="text-muted-foreground">Daypack Limit</div>
                <div className="text-lg font-black text-white">&le; 15%</div>
                <div className="text-[10px] text-muted-foreground">Of Body Weight</div>
              </div>
              <div className="p-3 rounded-xl bg-surface/50 border border-border/30">
                <div className="text-muted-foreground">Fair Wage Base</div>
                <div className="text-lg font-black text-accent">NPR 3,000</div>
                <div className="text-[10px] text-muted-foreground">Per Porter / Day</div>
              </div>
            </div>
          </div>
        </div>

        {/* The Interactive Gear Balancer Component */}
        <GearWeightBalancer
          initialTrekkerName="Expedition Leader"
          initialGroupSize={2}
          initialAltitudeM={5364}
          onManifestSaved={(_m) => loadManifests()}
        />

        {/* Recently Saved Authentic Manifests */}
        <div data-slot="body" className="rounded-2xl border border-border/40 backdrop-blur-xl bg-surface/70 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/30 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-0.5">
                <FileText className="w-4 h-4 text-accent" />
                <span>Verified Manifest Database</span>
              </div>
              <h3 className="text-xl font-black text-white">Active Expedition Packing Manifests</h3>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {manifests.length} Recorded Manifests
            </span>
          </div>

          {loadingManifests ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading manifests from database...
            </div>
          ) : manifests.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No manifests saved yet. Use the balancer above to persist your gear weights.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {manifests.map((man) => (
                <div
                  key={man.id}
                  className="p-4 rounded-xl border border-border/30 bg-surface/40 hover:bg-surface/60 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{man.trekkerName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {man.targetAltitudeM}m Target • Team of {man.groupSize}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      man.ippgCompliance === 'COMPLIANT'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {man.ippgCompliance}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-surface/60 border border-border/20">
                      <div className="text-[10px] text-muted-foreground">Daypack</div>
                      <div className="font-extrabold text-accent">{man.daypackWeightKg.toFixed(1)} kg</div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface/60 border border-border/20">
                      <div className="text-[10px] text-muted-foreground">Duffel</div>
                      <div className="font-extrabold text-emerald-400">{man.duffelWeightKg.toFixed(1)} kg</div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface/60 border border-border/20">
                      <div className="text-[10px] text-muted-foreground">Porters</div>
                      <div className="font-extrabold text-white">{man.porterCountRecommended} Porter(s)</div>
                    </div>
                  </div>

                  {man.notes && (
                    <p className="text-[11px] text-muted-foreground italic border-t border-border/20 pt-2">
                      &quot;{man.notes}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IPPG Ethics & Himalayan High-Altitude Medicine Guide */}
        <div data-slot="footer" className="rounded-2xl border border-border/40 backdrop-blur-xl bg-surface/50 p-6 sm:p-8 space-y-4 text-xs text-muted-foreground">
          <h4 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>The 5 IPPG Mandates for Himalayan Porters</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
            <p>
              <strong className="text-white">1. Clothing & Footwear:</strong> Every porter must have mountain-grade boots, thermal layers, and rain protection suited to extreme freezing temperatures above 4,000m.
            </p>
            <p>
              <strong className="text-white">2. Medical Care:</strong> A sick porter is entitled to the same urgent care, medication, and helicopter evacuation consideration as a paying client.
            </p>
            <p>
              <strong className="text-white">3. Weight Restrictions:</strong> Never exceed 25kg (or 30kg max under exceptional conditions). High passes such as Cho La (5,420m) and Thorong La (5,416m) demand loads &le; 20kg.
            </p>
            <p>
              <strong className="text-white">4. Shelter & Nutrition:</strong> Porters must have adequate warm bedding and hot meals provided, not forced to sleep in caves or unheated animal sheds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
