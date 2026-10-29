'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GroupExpeditionWithDetails, User } from '@/types';
import { CheckCircle2, Clock, Share2, Copy, Check, ArrowRight } from 'lucide-react';

export interface GroupExpeditionCardProps {
  expedition: GroupExpeditionWithDetails;
  currentUser?: User | null;
}

export function GroupExpeditionCard({ expedition, currentUser }: GroupExpeditionCardProps) {
  const [copied, setCopied] = useState(false);

  const userMember = currentUser
    ? expedition.members.find((m) => m.memberEmail.toLowerCase() === currentUser.email.toLowerCase())
    : null;
  const isUserPaid = userMember && userMember.paymentStatus !== 'UNPAID';
  const isConfirmed = expedition.paidMembersCount >= expedition.targetGroupSize || expedition.status === 'CONFIRMED';
  const progressPct = Math.round((expedition.paidMembersCount / Math.max(1, expedition.targetGroupSize)) * 100);

  const handleCopyLink = async () => {
    try {
      const fullUrl = `${window.location.origin}/trips/join/${expedition.shareToken}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      data-slot="base"
      className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 hover:border-[#B68D40]/40 transition-all flex flex-col md:flex-row justify-between gap-6"
    >
      <div data-slot="body" className="space-y-3.5 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            data-slot="indicator"
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
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
                Organizing ({expedition.paidMembersCount} of {expedition.targetGroupSize} Paid)
              </>
            )}
          </span>

          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
            {expedition.shareToken}
          </span>

          {userMember && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isUserPaid
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
              }`}
            >
              Your Status: {isUserPaid ? 'Deposit Paid' : `Deposit Unpaid ($${userMember.shareAmountUsd.toFixed(2)})`}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {expedition.expeditionTitle}
          </h3>
          <p className="text-xs text-slate-400">
            Route: <strong className="text-slate-200">{expedition.trail?.name || expedition.trailId}</strong> • Led by <strong className="text-slate-200">{expedition.leaderName}</strong>
          </p>
        </div>

        {/* Mini Payment & Roster Progress Bar */}
        <div className="space-y-1.5 max-w-md">
          <div className="flex justify-between text-xs text-slate-300 font-mono">
            <span>Team Deposit Share: ${expedition.depositPerPersonUsd.toFixed(2)} / climber</span>
            <span className="font-bold text-[#E2C085]">{progressPct}% Complete</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-[#B68D40] to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(6, progressPct)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {expedition.paidMembersCount} of {expedition.targetGroupSize} confirmed climbers paid deposits ({expedition.members.length} on team roster)
          </p>
        </div>
      </div>

      <div data-slot="footer" className="flex md:flex-col justify-end items-end gap-2.5 self-center md:self-auto min-w-[200px]">
        <button
          onClick={handleCopyLink}
          type="button"
          data-slot="trigger"
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 border border-slate-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-[#B68D40]" />}
          {copied ? 'Link Copied!' : 'Copy Invite Link'}
        </button>

        <Link
          href={`/trips/join/${expedition.shareToken}`}
          data-slot="trigger"
          className="w-full py-2.5 px-4 rounded-xl bg-[#B68D40] hover:bg-[#A37B34] text-neutral-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#B68D40]/10"
        >
          Open Team Board
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default GroupExpeditionCard;
