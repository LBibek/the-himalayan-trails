'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  Printer,
  Save,
  RotateCcw,
  Scale,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Backpack,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type {
  GearCategory,
  Season,
  ElevationTier,
  PorterStatus,
  GearItem,
} from '@/types/gear';
import {
  getAllGearItems,
  getGearCatalog,
  calculateTotalPackWeight,
} from '@/lib/gearCatalog';

const CATEGORIES: GearCategory[] = [
  'Alpine Technical Layering',
  'Footwear & Mountain Traction',
  'Packs & Load Carrying',
  'Sleep System & Warmth',
  'High-Altitude Medical & First Aid',
  'Electronics & Navigation',
];

export default function GearAuditorCard() {
  const [season, setSeason] = useState<Season>('Autumn');
  const [elevationTier, setElevationTier] = useState<ElevationTier>('High-Pass');
  const [porterStatus, setPorterStatus] = useState<PorterStatus>('Porter-Supported');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Default select all essential items
    const all = getAllGearItems();
    return new Set(all.filter((i) => i.essential).map((i) => i.id));
  });
  const [activeCategory, setActiveCategory] = useState<GearCategory | 'All'>('All');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Restore saved checklist from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('himalayan_gear_checklist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          setSelectedIds(new Set(parsed.items));
          if (parsed.season) setSeason(parsed.season);
          if (parsed.elevationTier) setElevationTier(parsed.elevationTier);
          if (parsed.porterStatus) setPorterStatus(parsed.porterStatus);
        }
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  const visibleGear = useMemo(() => {
    return getGearCatalog({ season, elevationTier, porterStatus });
  }, [season, elevationTier, porterStatus]);

  const packAudit = useMemo(() => {
    return calculateTotalPackWeight(Array.from(selectedIds), porterStatus, visibleGear);
  }, [selectedIds, porterStatus, visibleGear]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleGear.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const selectAllEssential = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleGear.forEach((item) => {
        if (item.essential) {
          next.add(item.id);
        } else {
          next.delete(item.id);
        }
      });
      return next;
    });
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const handleSave = () => {
    try {
      const payload = {
        items: Array.from(selectedIds),
        season,
        elevationTier,
        porterStatus,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('himalayan_gear_checklist', JSON.stringify(payload));
      setSaveSuccessMsg('Expedition gear checklist saved to device!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch {
      setSaveSuccessMsg('Unable to save to local storage.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return visibleGear;
    return visibleGear.filter((i) => i.category === activeCategory);
  }, [visibleGear, activeCategory]);

  return (
    <div
      data-slot="base"
      className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-[#B68D40]/30 shadow-2xl space-y-6"
    >
      {/* Module Title */}
      <div data-slot="header" className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68D40] flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Dynamic Alpine Pack Weight Auditor &amp; Gear Registry
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Expedition Gear Checklist &amp; Load Auditor
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Calibrated against International Porter Protection Group (IPPG) guidelines and high-altitude thermal requirements.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            data-slot="trigger"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          >
            <Save className="w-3.5 h-3.5 text-[#B68D40]" />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            data-slot="trigger"
            className="px-3.5 py-2 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black text-xs font-bold flex items-center gap-1.5 transition focus-visible:ring-2 focus-visible:ring-white"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Checklist</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Filter Matrix (Season, Tier, Porter Mode) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
        {/* Season Selector */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Trekking Season
          </label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value as Season)}
            className="w-full bg-slate-800/90 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#B68D40] outline-none"
          >
            <option value="Autumn">Autumn (Sep - Nov, Peak Clarity)</option>
            <option value="Spring">Spring (Mar - May, Rhododendrons)</option>
            <option value="Winter">Winter (Dec - Feb, Sub-Zero Extreme)</option>
            <option value="Monsoon">Monsoon (Jun - Aug, High Rain/Leeches)</option>
            <option value="All Seasons">All Seasons View</option>
          </select>
        </div>

        {/* Elevation Tier */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Elevation Profile
          </label>
          <select
            value={elevationTier}
            onChange={(e) => setElevationTier(e.target.value as ElevationTier)}
            className="w-full bg-slate-800/90 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#B68D40] outline-none"
          >
            <option value="Sub-Alpine">Sub-Alpine (&lt; 4,000m)</option>
            <option value="High-Pass">High-Pass (4,000m - 5,500m)</option>
            <option value="Extreme Summit">Extreme Summit (&gt; 5,500m)</option>
          </select>
        </div>

        {/* Porter Status */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Logistics Support
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setPorterStatus('Porter-Supported')}
              data-slot="trigger"
              data-pressed={porterStatus === 'Porter-Supported'}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center ${
                porterStatus === 'Porter-Supported'
                  ? 'bg-[#B68D40] text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Porter Supported
            </button>
            <button
              type="button"
              onClick={() => setPorterStatus('Self-Supported')}
              data-slot="trigger"
              data-pressed={porterStatus === 'Self-Supported'}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center ${
                porterStatus === 'Self-Supported'
                  ? 'bg-[#B68D40] text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Self-Supported
            </button>
          </div>
        </div>
      </div>

      {/* Live Weight Telemetry Gauge */}
      <div
        data-slot="body"
        className={`p-5 rounded-2xl border transition-all ${
          packAudit.status === 'OPTIMAL'
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : packAudit.status === 'HEAVY'
            ? 'bg-amber-950/20 border-amber-500/30'
            : 'bg-rose-950/20 border-rose-500/40'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                packAudit.status === 'OPTIMAL'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : packAudit.status === 'HEAVY'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              <Backpack className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  {porterStatus === 'Porter-Supported' ? 'Daypack Carry Weight' : 'Total Expedition Pack'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    packAudit.status === 'OPTIMAL'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : packAudit.status === 'HEAVY'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {packAudit.statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{packAudit.ippgAdvisory}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {packAudit.daypackWeightKg}{' '}
              <span className="text-xs text-slate-400 font-sans font-normal">kg</span>
            </span>
            <span className="text-[11px] text-slate-400 block">
              Target: ≤ {packAudit.porterLimitKg} kg (incl. 2.4kg water &amp; snacks)
            </span>
          </div>
        </div>

        {/* Visual Progress Gauge */}
        <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              packAudit.status === 'OPTIMAL'
                ? 'bg-emerald-400'
                : packAudit.status === 'HEAVY'
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`}
            style={{
              width: `${Math.min(
                100,
                (packAudit.daypackWeightKg / (packAudit.porterLimitKg * 1.5)) * 100
              )}%`,
            }}
          />
        </div>

        {porterStatus === 'Porter-Supported' && (
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-slate-400">Porter Duffel Bag:</span>{' '}
              <span className="font-bold text-white font-mono">{packAudit.duffelWeightKg} kg</span>
              <span className="text-[10px] text-slate-500 block">IPPG Limit: ≤ 25 kg</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Total All Items:</span>{' '}
              <span className="font-bold text-[#E2C085] font-mono">{packAudit.totalWeightKg} kg</span>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs & Quick Batch Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory('All')}
            data-slot="trigger"
            data-pressed={activeCategory === 'All'}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeCategory === 'All'
                ? 'bg-[#B68D40] text-black'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All Items ({visibleGear.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              data-slot="trigger"
              data-pressed={activeCategory === cat}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeCategory === cat
                  ? 'bg-[#B68D40] text-black font-semibold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {cat.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={selectAllEssential}
            className="text-[#B68D40] hover:underline font-semibold"
          >
            Essential Only
          </button>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={selectAllVisible}
            className="text-slate-300 hover:underline"
          >
            Select All
          </button>
          <span className="text-slate-600">•</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-slate-400 hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Gear Checklist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 select-none ${
                isSelected
                  ? 'bg-slate-800/80 border-[#B68D40]/60 shadow-md'
                  : 'bg-slate-900/40 border-white/5 opacity-75 hover:opacity-100 hover:border-white/20'
              }`}
            >
              <div
                className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition ${
                  isSelected
                    ? 'bg-[#B68D40] border-[#B68D40] text-black'
                    : 'border-slate-600 bg-transparent'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  <span className="text-[11px] font-mono text-[#E2C085] shrink-0 font-semibold">
                    {item.weightGrams}g
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center gap-2 mt-2 text-[10px]">
                  <span className="text-slate-500 uppercase tracking-wider">{item.category}</span>
                  {item.essential && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      Essential
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.carrier}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div data-slot="footer" className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <span>
          Selected: <strong className="text-white">{selectedIds.size}</strong> of {visibleGear.length} items
        </span>
        <span className="text-[11px] text-[#B68D40]">
          Verified against UIAGM &amp; IPPG Mountain Porter Protections
        </span>
      </div>
    </div>
  );
}
