'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ExternalLink, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { Landmark } from '@/types';

export default function LandmarksPage() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Base Camp', 'High Pass', 'Monastery', 'Sacred Lake', 'Village'];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const query = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
    fetch(`/api/landmarks${query}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch landmarks`);
        return res.json();
      })
      .then((data: Landmark[]) => {
        if (isMounted) {
          setLandmarks(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error communicating with database');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <div className="space-y-3 border-b border-slate-800 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <MapPin className="h-3.5 w-3.5" />
          <span>Landmark Feature</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Points of Interest & Mountain Landmarks
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Discover high mountain passes, ancient Tibetan Buddhist monasteries, sacred glacial lakes, and emergency tea house settlements across the Himalayas.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-amber-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm font-medium">Querying landmarks from database...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Landmark Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landmarks.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              No landmarks found for this category.
            </div>
          ) : (
            landmarks.map((landmark) => (
              <div
                key={landmark.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-amber-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img
                      src={landmark.image}
                      alt={landmark.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-400 border border-slate-800">
                      {landmark.category}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-white border border-slate-800">
                      {landmark.elevation} meters
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                        {landmark.name}
                      </h3>
                      {landmark.nativeName && (
                        <span className="text-xs text-slate-500 font-medium">{landmark.nativeName}</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {landmark.description}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="text-slate-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                        <span>Permits Required:</span>
                      </div>
                      <div className="text-slate-300 font-medium">{landmark.permitRequired}</div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{landmark.region} Region</span>
                    <Link
                      href="/map"
                      className="inline-flex items-center gap-1 text-amber-400 font-semibold hover:underline"
                    >
                      <span>Locate on 3D MAP</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
