'use client';

import React, { useState, useEffect } from 'react';
import { CloudSun, ShieldAlert, Wind, Thermometer, Loader2, AlertCircle } from 'lucide-react';
import { WeatherReport } from '@/types';

export default function WeatherPage() {
  const [selectedElevation, setSelectedElevation] = useState<number>(4940);
  const [weatherData, setWeatherData] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/api/weather')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load weather`);
        return res.json();
      })
      .then((data: WeatherReport) => {
        if (isMounted) {
          setWeatherData(data);
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
      <div className="space-y-3 border-b border-slate-800 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
          <CloudSun className="h-3.5 w-3.5" />
          <span>weather and trail Feature</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Himalayan Altitude Weather & Trail Safety Hub
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Real-time weather metrics, freezing altitude levels, wind gusts, avalanche danger ratings, and community-reported trail hazards.
        </p>
      </div>

      {/* Altitude Weather Interactive Widget */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Live Elevation Weather Calculator</h3>
            <p className="text-xs text-slate-400">Drag altitude slider to estimate temperature drop at higher high passes.</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Selected Altitude:</span>
            <div className="text-xl font-extrabold text-cyan-400">{selectedElevation} meters</div>
          </div>
        </div>

        {/* Altitude Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="2000"
            max="6000"
            step="100"
            value={selectedElevation}
            onChange={(e) => setSelectedElevation(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Lukla (2,860m)</span>
            <span>Namche (3,440m)</span>
            <span>Dingboche (4,410m)</span>
            <span>Thorong La (5,416m)</span>
          </div>
        </div>

        {/* Calculated Weather Display Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Thermometer className="h-4 w-4 text-cyan-400" />
              <span>Est. Temperature</span>
            </div>
            <div className="text-3xl font-extrabold text-cyan-400 mt-2">
              {Math.round(15 - (selectedElevation / 1000) * 6.5)}°C
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Lapse rate: -6.5°C per 1,000m</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Wind className="h-4 w-4 text-sky-400" />
              <span>Wind Speed</span>
            </div>
            <div className="text-3xl font-extrabold text-white mt-2">
              {Math.round(15 + (selectedElevation / 1000) * 4)} km/h
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Moderate high-altitude breeze</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">Freezing Level</div>
            <div className="text-3xl font-extrabold text-blue-400 mt-2">2,800m</div>
            <div className="text-[11px] text-slate-400 mt-1">Frost expected above 2,800m</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400">UV Index Rating</div>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">11+ Extreme</div>
            <div className="text-[11px] text-slate-400 mt-1">Requires Grade-4 UV Goggles</div>
          </div>
        </div>

      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-sky-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm font-medium">Fetching active hazard advisories from database...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* TRAIL HAZARDS & WARNINGS SECTION */}
      {!loading && weatherData && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <span>Active Trail Hazards & Database Advisories ({weatherData.location})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weatherData.hazards.length === 0 ? (
              <div className="col-span-full p-6 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                No critical hazard warnings recorded at this time.
              </div>
            ) : (
              weatherData.hazards.map((h) => (
                <div key={h.id} className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">{h.type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400">{h.updatedAt}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{h.location}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{h.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
