'use client';

import React, { useState } from 'react';
import { ThumbsUp, Mountain, Clock, TrendingUp, Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { GroupExpeditionWithDetails, GroupMember } from '@/types';

interface SideTripVotingBoardProps {
  expedition: GroupExpeditionWithDetails;
  activeMember?: GroupMember | null;
  onVoteCast: (sideTripName: string) => Promise<void>;
  isLoading?: boolean;
}

export default function SideTripVotingBoard({
  expedition,
  activeMember,
  onVoteCast,
  isLoading
}: SideTripVotingBoardProps) {
  const [submittingTrip, setSubmittingTrip] = useState<string | null>(null);

  const handleVote = async (tripName: string) => {
    if (!activeMember) return;
    setSubmittingTrip(tripName);
    try {
      await onVoteCast(tripName);
    } finally {
      setSubmittingTrip(null);
    }
  };

  const totalMembers = Math.max(1, expedition.members.length);

  return (
    <div
      data-slot="base"
      className="p-5 md:p-6 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-slate-700/50 shadow-2xl space-y-5"
    >
      {/* Header Slot */}
      <div data-slot="header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-[#B68D40] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Itinerary Customization</span>
          </div>
          <h3 className="text-lg md:text-xl font-black text-white tracking-tight mt-1">
            Side-Trip Voting Board
          </h3>
        </div>
        <p className="text-xs text-slate-400 max-w-xs text-left sm:text-right">
          Upvote optional alpine excursions. Side trips gaining majority team consensus get integrated into the master route.
        </p>
      </div>

      {/* Body Slot */}
      <div data-slot="body" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {expedition.sideTripTallies.map((trip) => {
          const hasVoted = activeMember
            ? activeMember.sideTripVotes.some((v) => v.toLowerCase() === trip.name.toLowerCase() || v.toLowerCase() === trip.id.toLowerCase())
            : false;

          const votePercentage = Math.round((trip.votesCount / totalMembers) * 100);
          const isMajority = trip.votesCount >= Math.ceil(totalMembers / 2);
          const isSubmittingThis = submittingTrip === trip.name;

          return (
            <div
              key={trip.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                hasVoted
                  ? 'bg-amber-950/20 border-[#B68D40]/60 shadow-lg shadow-[#B68D40]/10'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-extrabold text-white text-sm tracking-tight leading-snug">
                    {trip.name}
                  </h4>
                  {isMajority && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      Majority
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {trip.description}
                </p>

                {/* Altitude & Impact Metrics */}
                <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Peak Alt</span>
                    <span className="font-bold text-[#E2C085] flex items-center gap-0.5">
                      <Mountain className="w-3 h-3 text-[#B68D40]" />
                      {trip.elevationMeters}m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gain</span>
                    <span className="font-bold text-amber-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3 text-amber-400" />
                      +{trip.elevationGainMeters}m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Duration</span>
                    <span className="font-bold text-slate-200 flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-blue-400" />
                      ~{trip.durationHours}h
                    </span>
                  </div>
                </div>

                {/* Voter Chips */}
                {trip.voterNames.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                      Voted by ({trip.votesCount})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {trip.voterNames.map((name, nIdx) => (
                        <span
                          key={nIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-800/90 text-[10px] text-slate-300 border border-slate-700/60 font-medium"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div data-slot="footer" className="pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  disabled={!activeMember || isSubmittingThis || isLoading}
                  onClick={() => handleVote(trip.name)}
                  data-slot="trigger"
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                    hasVoted
                      ? 'bg-[#B68D40] text-black hover:bg-[#c99e4b] shadow-md shadow-[#B68D40]/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  } disabled:opacity-50`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-black' : ''}`} />
                  <span>
                    {hasVoted ? 'Voted (Click to revoke)' : `Vote for Detour (${trip.votesCount})`}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!activeMember && (
        <p className="text-[11px] text-center text-amber-300/80 italic pt-1">
          Join this expedition team roster below or sign in to cast your side-trip vote!
        </p>
      )}
    </div>
  );
}
