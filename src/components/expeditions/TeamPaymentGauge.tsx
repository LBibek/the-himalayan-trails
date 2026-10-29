'use client';

import React from 'react';
import { Users, ShieldCheck, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { GroupExpeditionWithDetails } from '@/types';

interface TeamPaymentGaugeProps {
  expedition: GroupExpeditionWithDetails;
  onOpenPayment?: () => void;
  unpaidMemberCount: number;
}

export default function TeamPaymentGauge({
  expedition,
  onOpenPayment,
  unpaidMemberCount
}: TeamPaymentGaugeProps) {
  const {
    paidMembersCount,
    targetGroupSize,
    depositPerPersonUsd,
    totalCollectedUsd,
    isFullyFunded,
    status
  } = expedition;

  const progressPercent = Math.min(100, Math.round((paidMembersCount / Math.max(1, targetGroupSize)) * 100));
  const isConfirmed = isFullyFunded || status === 'CONFIRMED' || status === 'EXPEDITION_READY';

  return (
    <div
      data-slot="base"
      className="p-5 md:p-6 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[#B68D40]/50"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#B68D40]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header Slot */}
      <div data-slot="header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span
              data-slot="indicator"
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest border flex items-center gap-1.5 ${
                isConfirmed
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {isConfirmed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Expedition Confirmed
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Organizing • Split Deposits Pending
                </>
              )}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Share Token: <strong className="text-white">{expedition.shareToken}</strong>
            </span>
          </div>

          <h3 className="text-lg md:text-xl font-black text-white tracking-tight mt-2">
            Team Roster &amp; Payment Gauge
          </h3>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Split-Deposit Share</p>
          <p className="text-xl md:text-2xl font-black text-[#B68D40] tracking-tight">
            ${depositPerPersonUsd.toFixed(2)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ adventurer</span>
          </p>
        </div>
      </div>

      {/* Body Slot */}
      <div data-slot="body" className="py-4 space-y-3">
        <div className="flex justify-between items-center text-xs md:text-sm">
          <span className="font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#B68D40]" />
            <span>
              {paidMembersCount} of {targetGroupSize} Members Confirmed
            </span>
          </span>
          <span className="font-extrabold text-[#E2C085]">
            {progressPercent}% Locked (${totalCollectedUsd.toLocaleString()} collected)
          </span>
        </div>

        {/* Tactical Himalayan Progress Gauge */}
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#B68D40] via-amber-400 to-[#E2C085] shadow-lg shadow-[#B68D40]/30"
            style={{ width: `${Math.max(8, progressPercent)}%` }}
          />
        </div>

        {/* Visual Slot Markers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
          {Array.from({ length: targetGroupSize }).map((_, idx) => {
            const member = expedition.members[idx];
            const isPaid = member && member.paymentStatus !== 'UNPAID';
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  isPaid
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : member
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isPaid
                      ? 'bg-emerald-500 text-black'
                      : member
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate text-[11px]">
                    {member ? member.memberName.split(' ')[0] : 'Slot Open'}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider opacity-80">
                    {isPaid ? 'Deposit Paid' : member ? 'Joined' : 'Invite Pending'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Slot */}
      <div data-slot="footer" className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {isConfirmed
              ? 'Official expedition slot secured with Nepal Tourism Board clearance.'
              : `Need ${Math.max(0, targetGroupSize - paidMembersCount)} more confirmed member(s) to automatically lock expedition clearance.`}
          </span>
        </p>

        {unpaidMemberCount > 0 && onOpenPayment && (
          <button
            type="button"
            onClick={onOpenPayment}
            data-slot="trigger"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-[#B68D40]/20 flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          >
            <DollarSign className="w-3.5 h-3.5 text-black" />
            <span>Pay Split-Deposit (${depositPerPersonUsd.toFixed(2)})</span>
          </button>
        )}
      </div>
    </div>
  );
}
