'use client';

import React, { useState } from 'react';
import {
  X, AlertTriangle, CheckCircle2, ShieldAlert,
  Send, Compass, Mountain, MapPin, Loader2, Info
} from 'lucide-react';
import { TrailConditionReport } from '@/types';

interface ReportConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTrailId?: string;
  defaultTrailName?: string;
  onSuccess: (report: TrailConditionReport) => void;
}

const TRAILS_LIST = [
  { id: 'ebc-trek', name: 'Everest Base Camp Trek', region: 'Everest', lat: 27.9881, lng: 86.9250 },
  { id: 'gokyo-ri-cho-la', name: 'Gokyo Lakes & Cho La Pass Traverse', region: 'Everest', lat: 27.9536, lng: 86.6953 },
  { id: 'annapurna-circuit', name: 'Annapurna Circuit & Thorong La', region: 'Annapurna', lat: 28.7942, lng: 83.9389 },
  { id: 'three-passes-trek', name: 'Three Passes Circuit (Kongma La, Cho La, Renjo La)', region: 'Everest', lat: 27.9250, lng: 86.7880 },
  { id: 'manaslu-circuit', name: 'Manaslu Circuit & Larkya La', region: 'Manaslu', lat: 28.5875, lng: 84.6339 },
  { id: 'langtang-valley', name: 'Langtang Valley & Kyanjin Gompa', region: 'Langtang', lat: 28.2125, lng: 85.5681 },
];

const ROLES = [
  'Certified Sherpa Guide',
  'Verified Adventurer',
  'Lodge Host',
];

const STATUS_LEVELS = [
  { value: 'CLEAR_PASSABLE', label: '🟢 Clear & Passable', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
  { value: 'CAUTION_HAZARD', label: '🟡 Caution & Gear Advisory', color: 'border-amber-500/50 text-amber-400 bg-amber-500/10' },
  { value: 'BLOCKED_IMPASSABLE', label: '🔴 Hazard / Blocked Route', color: 'border-rose-500/50 text-rose-400 bg-rose-500/10' },
];

const CONDITION_TYPES = [
  'Snow / Ice on Pass',
  'River Crossing / Bridge',
  'Landslide / Rockfall',
  'Weather Window',
  'Teahouse Capacity Full',
];

export default function ReportConditionModal({
  isOpen,
  onClose,
  defaultTrailId,
  defaultTrailName,
  onSuccess,
}: ReportConditionModalProps) {
  const [trailId, setTrailId] = useState(defaultTrailId || TRAILS_LIST[0].id);
  const [reporterName, setReporterName] = useState('');
  const [reporterRole, setReporterRole] = useState(ROLES[0]);
  const [statusLevel, setStatusLevel] = useState(STATUS_LEVELS[0].value);
  const [conditionType, setConditionType] = useState(CONDITION_TYPES[0]);
  const [locationName, setLocationName] = useState('');
  const [elevation, setElevation] = useState<number | ''>(4200);
  const [latitude, setLatitude] = useState<number | ''>(27.9);
  const [longitude, setLongitude] = useState<number | ''>(86.8);
  const [notes, setNotes] = useState('');
  const [gearRecommended, setGearRecommended] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrailChange = (selectedId: string) => {
    setTrailId(selectedId);
    const found = TRAILS_LIST.find((t) => t.id === selectedId);
    if (found) {
      setLatitude(found.lat);
      setLongitude(found.lng);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reporterName.trim() || !locationName.trim() || !notes.trim()) {
      setErrorMsg('Please complete all required fields: Reporter Name, Location Name, and Observations.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trailId,
          reporterName: reporterName.trim(),
          reporterRole,
          statusLevel,
          conditionType,
          latitude: Number(latitude) || 0,
          longitude: Number(longitude) || 0,
          locationName: locationName.trim(),
          elevation: Number(elevation) || 0,
          notes: notes.trim(),
          gearRecommended: gearRecommended.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit condition report');
      }

      onSuccess(data.report);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-slot="base"
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        data-slot="content"
        className="relative w-full max-w-xl my-8 rounded-3xl backdrop-blur-2xl bg-neutral-900/95 border border-[#B68D40]/40 shadow-2xl overflow-hidden text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div data-slot="header" className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B68D40]/20 border border-[#B68D40]/40 flex items-center justify-center text-[#B68D40]">
              <ShieldAlert className="w-5 h-5 text-[#B68D40]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Broadcast Live Field Condition</h2>
              <p className="text-xs text-neutral-400">Real-time trail status verified across Himalayan checkpoints</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} data-slot="body" className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Trail Selection */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">
              Himalayan Route / Checkpoint Area *
            </label>
            <select
              value={trailId}
              onChange={(e) => handleTrailChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
            >
              {TRAILS_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.region} Himal)
                </option>
              ))}
            </select>
          </div>

          {/* Reporter details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Reporter Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pemba Sherpa / Sarah J."
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#B68D40]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Reporter Role *
              </label>
              <select
                value={reporterRole}
                onChange={(e) => setReporterRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Level & Condition Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Status Level *
              </label>
              <select
                value={statusLevel}
                onChange={(e) => setStatusLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              >
                {STATUS_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Condition Type *
              </label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              >
                {CONDITION_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Name & Altitude */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Exact Landmark / Checkpoint *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cho La Glacier Tongue / Thorong Pass Marker"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#B68D40]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                Altitude (m)
              </label>
              <input
                type="number"
                placeholder="4200"
                value={elevation}
                onChange={(e) => setElevation(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#B68D40]"
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">
                Latitude (°N)
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">
                Longitude (°E)
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              />
            </div>
          </div>

          {/* Notes / Observation */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">
              Field Observations & Safety Advisory *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detail snow firmness, bridge cable stability, weather timing windows, or teahouse capacity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 resize-none focus:outline-none focus:border-[#B68D40]"
            />
          </div>

          {/* Gear Recommended */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">
              Recommended Gear (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Kahtoola Microspikes, 800-fill down, trekking poles"
              value={gearRecommended}
              onChange={(e) => setGearRecommended(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#B68D40]"
            />
          </div>

          {/* Footer CTA */}
          <div data-slot="footer" className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-slot="trigger"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-[#B68D40]/20 flex items-center gap-2 transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#B68D40]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-black" />
                  <span>Publish Field Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
