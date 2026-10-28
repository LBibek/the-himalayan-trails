'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Radio,
  Send,
  Copy,
  Check,
  PhoneCall,
  MapPin,
  Battery,
  Users,
  X,
  ShieldAlert,
  Compass,
  Satellite,
  Info,
} from 'lucide-react';
import {
  EmergencyCondition,
  EmergencySosOptions,
  formatEmergencySosMessage,
  generateSmsUri,
  HIMALAYAN_EMERGENCY_CONTACTS,
} from '@/lib/emergencySos';

interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTrailName?: string;
  defaultCoords?: [number, number];
  defaultAltitude?: number;
}

export default function EmergencySosModal({
  isOpen,
  onClose,
  defaultTrailName = '',
  defaultCoords = [27.9892, 86.8291],
  defaultAltitude = 4940,
}: EmergencySosModalProps) {
  const [condition, setCondition] = useState<EmergencyCondition>('AMS/HAPE/HACE');
  const [partySize, setPartySize] = useState<number>(2);
  const [casualtiesCount, setCasualtiesCount] = useState<number>(1);
  const [latitude, setLatitude] = useState<number>(defaultCoords[0]);
  const [longitude, setLongitude] = useState<number>(defaultCoords[1]);
  const [altitudeMeters, setAltitudeMeters] = useState<number>(defaultAltitude);
  const [checkpoint, setCheckpoint] = useState<string>(
    defaultTrailName ? `${defaultTrailName.slice(0, 15)} Ridge` : 'Lobuche Ridge'
  );
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(undefined);
  const [contactNumber, setContactNumber] = useState<string>('+97714123456');
  const [requirements, setRequirements] = useState<string>('HELI RESCUE O2');
  const [copied, setCopied] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<string>('Cached GPS');

  // Auto-detect Battery Status on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          setBatteryLevel(Math.round(battery.level * 100));
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        })
        .catch(() => {});
    }
  }, []);

  // Synchronize location props when modal opens or active trail pack changes
  useEffect(() => {
    if (isOpen) {
      if (defaultCoords && defaultCoords.length >= 2) {
        setLatitude(defaultCoords[0]);
        setLongitude(defaultCoords[1]);
      }
      if (typeof defaultAltitude === 'number' && Number.isFinite(defaultAltitude)) {
        setAltitudeMeters(defaultAltitude);
      }
      if (defaultTrailName) {
        setCheckpoint(`${defaultTrailName.slice(0, 15)} Ridge`);
      }
    }
  }, [isOpen, defaultCoords, defaultAltitude, defaultTrailName]);

  // Fetch real-time GPS coordinates via navigator.geolocation
  const handleAutoDetectGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    setGpsStatus('Acquiring GPS fix...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        if (pos.coords.altitude) {
          setAltitudeMeters(Math.round(pos.coords.altitude));
        }
        setIsLocating(false);
        setGpsStatus(`GPS Fix (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setIsLocating(false);
        setGpsStatus('GPS signal blocked; using manual coords');
        console.warn('Geolocation error:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Build real-time formatted message
  const sosOptions: EmergencySosOptions = {
    condition,
    partySize,
    casualtiesCount,
    latitude,
    longitude,
    altitudeMeters,
    checkpoint,
    batteryLevel,
    contactNumber,
    requirements,
  };

  const formattedSos = formatEmergencySosMessage(sosOptions);
  const charCount = formattedSos.length;
  const isSmsSafe = charCount <= 160;

  // Copy to clipboard
  const handleCopyPayload = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(formattedSos);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error('Failed to copy SOS text', e);
    }
  };

  // Launch SMS URI
  const handleSendSms = () => {
    const smsUri = generateSmsUri(contactNumber, formattedSos);
    if (typeof window !== 'undefined') {
      window.location.href = smsUri;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        data-slot="base"
        className="relative w-full max-w-2xl rounded-3xl bg-slate-950 border-2 border-rose-600/80 shadow-2xl shadow-rose-950/50 p-5 sm:p-7 space-y-5 text-slate-100 my-auto"
      >
        {/* ──────── MODAL HEADER ──────── */}
        <div data-slot="header" className="flex items-start justify-between gap-4 pb-4 border-b border-rose-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-7 h-7 animate-pulse text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider">
                  Emergency SOS
                </span>
                <span className="text-xs font-mono text-rose-300">2G SMS & Satellite Dispatch</span>
              </div>
              <h2 id="sos-modal-title" className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                Satellite / 2G SMS Emergency Telemetry
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            data-slot="trigger"
            aria-label="Close SOS Modal"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ──────── FORM INPUTS ──────── */}
        <div data-slot="body" className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">

          {/* Condition Category Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Emergency Condition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'AMS/HAPE/HACE', label: 'AMS / HAPE / HACE', sub: 'Altitude Sickness' },
                { id: 'FRACTURE/TRAUMA', label: 'Fracture / Trauma', sub: 'Fall or Limb Injury' },
                { id: 'HYPOTHERMIA', label: 'Hypothermia', sub: 'Severe Cold Exposure' },
                { id: 'LOST/BLIZZARD', label: 'Lost in Blizzard', sub: 'Zero Visibility' },
                { id: 'AVALANCHE', label: 'Avalanche Burial', sub: 'Snowpack Slide' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCondition(c.id as EmergencyCondition)}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    condition === c.id
                      ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950/40 font-bold'
                      : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{c.label}</p>
                  <p className="text-[10px] opacity-75">{c.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Party Size & Casualties Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#B68D40]" />
                <span>Total Party Size (PAX)</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newParty = Math.max(1, partySize - 1);
                    setPartySize(newParty);
                    if (casualtiesCount > newParty) {
                      setCasualtiesCount(newParty);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700"
                >
                  -
                </button>
                <span className="text-base font-extrabold text-white w-8 text-center">
                  {partySize}
                </span>
                <button
                  type="button"
                  onClick={() => setPartySize(partySize + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700"
                >
                  +
                </button>
                <span className="text-[11px] text-slate-400">Total persons</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Casualties Requiring Evac</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCasualtiesCount(Math.max(1, casualtiesCount - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700"
                >
                  -
                </button>
                <span className="text-base font-extrabold text-rose-400 w-8 text-center">
                  {casualtiesCount}
                </span>
                <button
                  type="button"
                  onClick={() => setCasualtiesCount(Math.min(partySize, casualtiesCount + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700"
                >
                  +
                </button>
                <span className="text-[11px] text-slate-400">Victims</span>
              </div>
            </div>
          </div>

          {/* Coordinates & Checkpoint */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>GPS Location Telemetry</span>
              </label>
              <button
                type="button"
                onClick={handleAutoDetectGps}
                disabled={isLocating}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition"
              >
                <Compass className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Fixing GPS...' : 'Acquire GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Latitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-[#B68D40]"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Longitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-[#B68D40]"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Altitude (m)</span>
                <input
                  type="number"
                  value={altitudeMeters}
                  onChange={(e) => setAltitudeMeters(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-[#B68D40]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Nearest Checkpoint / Landmark</span>
                <input
                  type="text"
                  value={checkpoint}
                  onChange={(e) => setCheckpoint(e.target.value)}
                  placeholder="e.g. Lobuche Ridge"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block flex items-center justify-between">
                  <span>Battery Status</span>
                  {batteryLevel !== undefined && (
                    <span className="text-emerald-400 font-mono font-bold">{batteryLevel}%</span>
                  )}
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={batteryLevel ?? ''}
                  placeholder="e.g. 22"
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setBatteryLevel(isNaN(v) ? undefined : Math.max(0, Math.min(100, v)));
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-[#B68D40]"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">{gpsStatus}</p>
          </div>

          {/* Rescue Requirements & Destination Hotline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Required Extraction Resource
              </label>
              <select
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              >
                <option value="HELI RESCUE O2">HELI RESCUE + O2</option>
                <option value="HELI EVAC STRETCHER">HELI EVAC STRETCHER</option>
                <option value="GROUND SAR TEAM">GROUND SAR TEAM</option>
                <option value="DOCTOR ADVICE">MEDICAL ADVICE ONLY</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Dispatch Recipient Hotline
              </label>
              <select
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              >
                {HIMALAYAN_EMERGENCY_CONTACTS.map((c) => (
                  <option key={c.phone} value={c.phone}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ──────── LIVE ENCODED PAYLOAD PREVIEW ──────── */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#E2C085] flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5 text-[#B68D40]" />
                Formatted Compressed Payload
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  isSmsSafe
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {charCount} / 160 chars ({isSmsSafe ? 'SMS Safe' : 'Multipart'})
              </span>
            </div>

            <p className="p-3 rounded-xl bg-black font-mono text-xs text-emerald-400 select-all border border-slate-800 break-words leading-relaxed">
              {formattedSos}
            </p>
          </div>

        </div>

        {/* ──────── MODAL ACTIONS ──────── */}
        <div data-slot="footer" className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${contactNumber}`}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span>Direct Dial</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPayload}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copy SOS Payload</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendSms}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-950/50 transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <Send className="w-4 h-4" />
              <span>Send SMS Dispatch</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
