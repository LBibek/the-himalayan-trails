'use client';

import React from 'react';
import { Shield, Check, Plus, PackageCheck, Scale, DollarSign } from 'lucide-react';
import { GroupGearOption, GroupMember } from '@/types';

interface GearChecklistProps {
  availableGear: GroupGearOption[];
  activeMember?: GroupMember | null;
  selectedGear: string[];
  onToggleGear: (gearName: string) => void;
  readOnly?: boolean;
}

export default function GearChecklist({
  availableGear,
  activeMember,
  selectedGear,
  onToggleGear,
  readOnly
}: GearChecklistProps) {
  const totalWeight = availableGear
    .filter((g) => selectedGear.includes(g.name) || selectedGear.includes(g.id))
    .reduce((sum, g) => sum + g.weightKg, 0);

  const totalDailyCost = availableGear
    .filter((g) => selectedGear.includes(g.name) || selectedGear.includes(g.id))
    .reduce((sum, g) => sum + g.dailyRateUsd, 0);

  return (
    <div
      data-slot="base"
      className="p-5 md:p-6 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-slate-700/50 shadow-2xl space-y-4"
    >
      {/* Header Slot */}
      <div data-slot="header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-[#B68D40] text-xs font-bold uppercase tracking-wider">
            <PackageCheck className="w-4 h-4" />
            <span>Personal Gear Logistics</span>
          </div>
          <h3 className="text-lg md:text-xl font-black text-white tracking-tight mt-1">
            Rental Gear Customization Checklist
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 font-mono">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            {totalWeight.toFixed(1)} kg selected
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[#E2C085] border border-slate-700 flex items-center gap-1 font-mono font-bold">
            <DollarSign className="w-3.5 h-3.5 text-[#B68D40]" />
            +${totalDailyCost}/day
          </span>
        </div>
      </div>

      {/* Body Slot */}
      <div data-slot="body" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableGear.map((gear) => {
          const isSelected = selectedGear.includes(gear.name) || selectedGear.includes(gear.id);

          return (
            <div
              key={gear.id}
              onClick={() => {
                if (!readOnly) {
                  onToggleGear(gear.name);
                }
              }}
              data-slot="trigger"
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-amber-950/20 border-[#B68D40] shadow-md shadow-[#B68D40]/10'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              } ${readOnly ? 'cursor-default' : ''}`}
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {gear.category}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#B68D40] border-[#B68D40] text-black'
                        : 'border-slate-700 bg-slate-900 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                <h4 className="font-bold text-white text-xs">
                  {gear.name}
                </h4>

                <p className="text-[11px] text-slate-400 leading-snug">
                  {gear.description}
                </p>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-800/60 font-mono">
                <span className="text-slate-400">Weight: <strong className="text-white">{gear.weightKg} kg</strong></span>
                <span className="text-[#E2C085] font-bold">${gear.dailyRateUsd}/day</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
