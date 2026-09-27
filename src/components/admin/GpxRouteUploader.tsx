'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
  Mountain,
  Navigation,
  Sparkles,
  Layers,
  ArrowRight,
  FileText
} from 'lucide-react';
import {
  parseRouteFile,
  ParsedRouteResult,
  SAMPLE_EBC_GPX,
  SAMPLE_ANNAPURNA_GPX
} from '@/lib/gpxParser';

export interface GpxRouteUploaderProps {
  onRouteLoaded: (result: ParsedRouteResult) => void;
  onApplyToForm: (result: ParsedRouteResult) => void;
  onClear: () => void;
  initialRouteName?: string;
}

export default function GpxRouteUploader({
  onRouteLoaded,
  onApplyToForm,
  onClear,
  initialRouteName
}: GpxRouteUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRoute, setParsedRoute] = useState<ParsedRouteResult | null>(null);
  const [applied, setApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processContent = (content: string, fileName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = parseRouteFile(content, fileName);
      setParsedRoute(result);
      setApplied(false);
      onRouteLoaded(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse route file.';
      setError(msg);
      setParsedRoute(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processContent(content, file.name);
    };
    reader.onerror = () => {
      setError('Unable to read the selected file from disk.');
      setIsLoading(false);
    };
    reader.readAsText(file);

    // Reset input so same file can be re-uploaded if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(gpx|kml|xml)$/i)) {
      setError('Please upload a valid .gpx, .kml, or .xml route file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processContent(content, file.name);
    };
    reader.onerror = () => {
      setError('Unable to read dropped file.');
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!parsedRoute) return;
    onApplyToForm(parsedRoute);
    setApplied(true);
  };

  const handleReset = () => {
    setParsedRoute(null);
    setError(null);
    setApplied(false);
    onClear();
  };

  const handleLoadSample = (sampleType: 'ebc' | 'annapurna') => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      const xml = sampleType === 'ebc' ? SAMPLE_EBC_GPX : SAMPLE_ANNAPURNA_GPX;
      const fileName = sampleType === 'ebc' ? 'Everest_Base_Camp_Trek.gpx' : 'Annapurna_Circuit.gpx';
      processContent(xml, fileName);
    }, 200);
  };

  return (
    <div
      data-slot="base"
      className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4 shadow-xl backdrop-blur-xl transition"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#B68D40]/10 border border-[#B68D40]/30 text-[#B68D40]">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>GPX / KML Route Importer</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                WGS-84 Native
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload official Garmin, Suunto, AllTrails, or Gaia GPS track files to auto-render route waypoints and telemetry.
            </p>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-gray-500 font-semibold hidden md:inline">Presets:</span>
          <button
            type="button"
            onClick={() => handleLoadSample('ebc')}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-[#B68D40]/20 hover:text-[#B68D40] text-gray-300 text-[11px] font-semibold transition border border-neutral-700/80 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="h-3 w-3 text-[#B68D40]" />
            <span>Sample EBC GPX</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('annapurna')}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-[#B68D40]/20 hover:text-[#B68D40] text-gray-300 text-[11px] font-semibold transition border border-neutral-700/80 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="h-3 w-3 text-[#B68D40]" />
            <span>Sample Annapurna</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx,.kml,.xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Dropzone Area (Shown if no parsed route yet) */}
      {!parsedRoute && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-[#B68D40] bg-[#B68D40]/10 text-white scale-[1.01]'
              : 'border-neutral-700/80 hover:border-[#B68D40]/60 bg-black/40 text-gray-300'
          }`}
        >
          <div className="p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700 text-[#B68D40] shadow-inner">
            <UploadCloud className={`h-8 w-8 ${isLoading ? 'animate-bounce text-[#B68D40]' : ''}`} />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              {isLoading ? 'Parsing GPX Trackpoints & Elevation...' : 'Click to Browse or Drag & Drop Route File'}
            </p>
            <p className="text-xs text-gray-400">
              Supports standard <strong className="text-gray-200">.gpx</strong> (v1.0 & v1.1), <strong className="text-gray-200">.kml</strong>, and <strong className="text-gray-200">.xml</strong> formats
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-gray-400 font-mono">
            <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Trackpoints &lt;trkpt&gt;</span>
            <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Routes &lt;rtept&gt;</span>
            <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Waypoints &lt;wpt&gt;</span>
            <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700">Elevation &lt;ele&gt;</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Parsed Route Telemetry Card */}
      {parsedRoute && (
        <div className="rounded-2xl bg-black/60 border border-emerald-500/40 p-5 space-y-4 animate-in fade-in duration-300">
          
          {/* Top Status & File Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {parsedRoute.name || 'Himalayan Expedition Trail'}
                  </h4>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/30 font-bold">
                    {parsedRoute.format.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                  <span>File: <strong className="text-gray-300">{parsedRoute.fileName || 'Route File'}</strong></span>
                  <span>•</span>
                  <span>Trailhead: <strong className="text-gray-300">{parsedRoute.startPoint}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Upload Another</span>
              </button>
            </div>
          </div>

          {/* Key Metric Tiles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Distance</span>
              <span className="text-base sm:text-lg font-extrabold text-[#B68D40]">
                {parsedRoute.totalDistanceKm} <span className="text-xs font-normal">km</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Max Altitude</span>
              <span className="text-base sm:text-lg font-extrabold text-white">
                {parsedRoute.maxElevationM} <span className="text-xs font-normal">m</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Elev Gain</span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-400">
                +{parsedRoute.elevationGainM} <span className="text-xs font-normal">m</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Trackpoints</span>
              <span className="text-base sm:text-lg font-extrabold text-cyan-400">
                {parsedRoute.trackpoints.length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Landmarks</span>
              <span className="text-base sm:text-lg font-extrabold text-amber-400">
                {parsedRoute.landmarks.length}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Est. Days</span>
              <span className="text-base sm:text-lg font-extrabold text-purple-400">
                {parsedRoute.estimatedDays} <span className="text-xs font-normal">days</span>
              </span>
            </div>
          </div>

          {/* Description / Summary if present */}
          {parsedRoute.description && (
            <p className="text-xs text-gray-300 italic bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
              &quot;{parsedRoute.description}&quot;
            </p>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {parsedRoute.waypoints.length} GPS coordinates loaded & centered onto Leaflet Map Editor.
              </span>
            </div>

            <button
              type="button"
              onClick={handleApply}
              disabled={applied}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-lg cursor-pointer ${
                applied
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default'
                  : 'bg-[#B68D40] hover:bg-[#c99e4b] text-black shadow-[#B68D40]/20'
              }`}
            >
              {applied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Metadata Applied to Form!</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Auto-Fill Expedition Form Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
