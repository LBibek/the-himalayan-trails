'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Heart, Copy, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Itinerary } from '@/types';

export default function ItinerariesViewPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/api/itineraries')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load itineraries`);
        return res.json();
      })
      .then((data: Itinerary[]) => {
        if (isMounted) {
          setItineraries(data);
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
  }, []);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold">
            <Layers className="h-3.5 w-3.5" />
            <span>Itineraries View Feature</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Community & Curated Itineraries
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Live database-persisted day-by-day trek itineraries created by Sherpa guides and experienced high-altitude mountaineers.
          </p>
        </div>

        <Link
          href="/itinerary/planner"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
        >
          <span>Create New Itinerary</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-teal-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm font-medium">Fetching curated itineraries from database...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Itineraries List */}
      {!loading && !error && (
        <div className="space-y-6">
          {itineraries.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No itineraries currently stored in the database.
            </div>
          ) : (
            itineraries.map((itinerary) => (
              <div
                key={itinerary.id}
                className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 transition-all space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold">
                      <span>{itinerary.trailName}</span>
                      <span>•</span>
                      <span>{itinerary.difficulty}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{itinerary.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 font-semibold">
                      <Heart className="h-3.5 w-3.5 fill-rose-400" />
                      <span>{itinerary.likes} Upvotes</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300 bg-slate-800 px-3 py-1 rounded-full font-semibold">
                      <Copy className="h-3.5 w-3.5" />
                      <span>{itinerary.clones} Cloned</span>
                    </div>
                  </div>
                </div>

                {/* Author & Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Total Duration</div>
                    <div className="text-base font-bold text-white mt-0.5">{itinerary.totalDays} Days</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Peak Altitude</div>
                    <div className="text-base font-bold text-cyan-400 mt-0.5">{itinerary.maxAltitude}m</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Est. Budget</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5">${itinerary.estimatedCostUSD} USD</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                    <img
                      src={itinerary.authorAvatar}
                      alt={itinerary.author}
                      className="h-8 w-8 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="text-slate-400 text-[10px]">Created by</div>
                      <div className="font-bold text-white text-xs">{itinerary.author}</div>
                    </div>
                  </div>
                </div>

                {/* Sample Days Preview */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Itinerary Schedule Preview:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    {itinerary.days.slice(0, 3).map((d) => (
                      <div key={d.day} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400">
                          <span>Day {d.day}: {d.title}</span>
                          <span>{d.sleepingAltitude}m</span>
                        </div>
                        <div className="text-slate-400 text-[11px] truncate">{d.route}</div>
                        <div className="text-slate-500 text-[10px]">{d.highlights}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{itinerary.days.length} Daily Stages Detailed</span>
                  <Link
                    href={`/itinerary/planner`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300"
                  >
                    <span>Clone & Customize Itinerary</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
