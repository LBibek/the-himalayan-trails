'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Mountain,
  Calendar,
  Users,
  Copy,
  Check,
  Share2,
  DollarSign,
  ShieldCheck,
  Receipt,
  UserPlus,
  Loader2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Clock,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { GroupExpeditionWithDetails, GroupMember } from '@/types';
import TeamPaymentGauge from '@/components/expeditions/TeamPaymentGauge';
import SideTripVotingBoard from '@/components/expeditions/SideTripVotingBoard';
import GearChecklist from '@/components/expeditions/GearChecklist';
import SplitPaymentModal from '@/components/expeditions/SplitPaymentModal';
import JoinExpeditionModal from '@/components/expeditions/JoinExpeditionModal';
import GearWeightBalancer from '@/components/logistics/GearWeightBalancer';
import TeamDispatchBoard from '@/components/expeditions/TeamDispatchBoard';

export default function JoinExpeditionPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : Array.isArray(params?.token) ? params.token[0] : '';
  const router = useRouter();

  const [expedition, setExpedition] = useState<GroupExpeditionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active member (logged in or selected)
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedPayMember, setSelectedPayMember] = useState<GroupMember | null>(null);

  // Active personal gear selection for member
  const [selectedGear, setSelectedGear] = useState<string[]>([]);

  // Fetch expedition data
  const loadExpedition = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/trips/${token}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load group expedition');
      }
      setExpedition(data.expedition);

      // Default active member to first unpaid member, or first member
      if (data.expedition?.members && data.expedition.members.length > 0) {
        setActiveMemberId((prev) => {
          if (prev && data.expedition.members.some((m: GroupMember) => m.id === prev)) {
            return prev;
          }
          const unpaid = data.expedition.members.find((m: GroupMember) => m.paymentStatus === 'UNPAID');
          return unpaid ? unpaid.id : data.expedition.members[0].id;
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error loading expedition');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadExpedition();
  }, [loadExpedition]);

  const activeMember = expedition?.members.find((m) => m.id === activeMemberId) || null;

  // Sync active member's gear
  useEffect(() => {
    if (activeMember) {
      setSelectedGear(activeMember.personalGearRentals || []);
    }
  }, [activeMemberId, activeMember]);

  // Copy share invite link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Vote side trip handler
  const handleVoteCast = async (sideTripName: string) => {
    if (!activeMember || !expedition) return;
    const res = await fetch(`/api/trips/${expedition.shareToken}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: activeMember.id,
        sideTripName
      })
    });

    const data = await res.json();
    if (res.ok && data.expedition) {
      setExpedition(data.expedition);
    }
  };

  // Toggle gear selection
  const handleToggleGear = (gearName: string) => {
    let nextGear: string[];
    if (selectedGear.includes(gearName)) {
      nextGear = selectedGear.filter((g) => g !== gearName);
    } else {
      nextGear = [...selectedGear, gearName];
    }
    setSelectedGear(nextGear);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#B68D40]" />
        <p className="text-xs uppercase tracking-widest text-[#E2C085]">
          Loading Himalayan Collaborative Expedition...
        </p>
      </div>
    );
  }

  if (error || !expedition) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Expedition Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || 'The requested group expedition share token is invalid or expired.'}
          </p>
          <Link
            href="/trails"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#B68D40] text-black font-bold text-xs"
          >
            Browse Available Trails
          </Link>
        </div>
      </div>
    );
  }

  const unpaidMembers = expedition.members.filter((m) => m.paymentStatus === 'UNPAID');

  return (
    <div className="min-h-screen bg-black text-white pb-24 selection:bg-[#B68D40] selection:text-black">
      {/* Hero Banner with Trail Visual */}
      <div className="relative border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-black to-black pt-10 pb-12 px-4 md:px-8 overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#B68D40]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          {/* Top navigation crumbs */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <Link
              href={expedition.trail?.slug ? `/trails/${expedition.trail.slug}` : '/trails'}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <span>← Back to {expedition.trail?.name || 'Trail Details'}</span>
            </Link>

            {/* 1-Click Copy Invite Link & Share Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                data-slot="trigger"
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-[#B68D40] ${
                  copiedLink
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-[#E2C085] border border-slate-700'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Join our Himalayan Expedition team for ${expedition.expeditionTitle}! Split deposit is $${expedition.depositPerPersonUsd.toFixed(2)}. Claim your spot here: `
                )}${typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : ''}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Expedition Title & Quick Specs */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-2">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#B68D40]/20 text-[#E2C085] border border-[#B68D40]/30">
                  Collaborative Group Expedition
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {expedition.trail?.region} Region
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                {expedition.expeditionTitle}
              </h1>

              <p className="text-xs md:text-sm text-slate-400 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Calendar className="w-4 h-4 text-[#B68D40]" />
                  Target Departure: <strong className="text-white">{expedition.targetStartDate}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4 text-[#B68D40]" />
                  Led by <strong className="text-white">{expedition.leaderName}</strong>
                </span>
                {expedition.trail && (
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Mountain className="w-4 h-4 text-[#B68D40]" />
                    Max Altitude: <strong className="text-white">{expedition.trail.maxElevation}m</strong>
                  </span>
                )}
              </p>
            </div>

            {/* Join Roster CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => setIsJoinModalOpen(true)}
                data-slot="trigger"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-[#E2C085] border border-[#B68D40]/50 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg focus-visible:ring-2 focus-visible:ring-[#B68D40]"
              >
                <UserPlus className="w-4 h-4 text-[#B68D40]" />
                <span>Join This Expedition Roster</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        {/* 1. Live Team Roster & Payment Gauge */}
        <TeamPaymentGauge
          expedition={expedition}
          unpaidMemberCount={unpaidMembers.length}
          onOpenPayment={() => {
            const target = activeMember?.paymentStatus === 'UNPAID' ? activeMember : unpaidMembers[0];
            if (target) {
              setSelectedPayMember(target);
              setIsPaymentModalOpen(true);
            }
          }}
        />

        {/* 2. Interactive Team Roster Grid */}
        <div
          data-slot="base"
          className="p-5 md:p-6 rounded-3xl backdrop-blur-xl bg-slate-900/75 border border-slate-700/50 shadow-2xl space-y-4"
        >
          <div data-slot="header" className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                Expedition Team Roster ({expedition.members.length} / {expedition.targetGroupSize})
              </h3>
              <p className="text-xs text-slate-400">
                Click a team member to manage personal gear or settle your split deposit.
              </p>
            </div>
          </div>

          <div data-slot="body" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expedition.members.map((mbr) => {
              const isPaid = mbr.paymentStatus !== 'UNPAID';
              const isSelected = mbr.id === activeMemberId;

              return (
                <div
                  key={mbr.id}
                  onClick={() => setActiveMemberId(mbr.id)}
                  data-slot="trigger"
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-950/25 border-[#B68D40] ring-1 ring-[#B68D40]'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            mbr.role === 'LEADER'
                              ? 'bg-[#B68D40] text-black'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {mbr.memberName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-none">
                            {mbr.memberName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {mbr.memberEmail}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          mbr.role === 'LEADER'
                            ? 'bg-[#B68D40]/20 text-[#E2C085] border border-[#B68D40]/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {mbr.role}
                      </span>
                    </div>

                    {/* Side trips voted */}
                    {mbr.sideTripVotes.length > 0 && (
                      <div className="text-[10px] text-slate-400 flex flex-wrap gap-1 pt-1">
                        <span className="text-slate-500">Votes:</span>
                        {mbr.sideTripVotes.map((v, vIdx) => (
                          <span
                            key={vIdx}
                            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span
                      data-slot="indicator"
                      className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Deposit Paid
                        </>
                      ) : (
                        'Deposit Pending ($' + mbr.shareAmountUsd.toFixed(2) + ')'
                      )}
                    </span>

                    {!isPaid ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayMember(mbr);
                          setIsPaymentModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-[11px] transition shadow-md shadow-[#B68D40]/20"
                      >
                        Pay Deposit
                      </button>
                    ) : (
                      mbr.receiptNumber && (
                        <span className="text-[10px] text-[#B68D40] font-mono font-bold">
                          {mbr.receiptNumber}
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Interactive Side-Trip Voting Board */}
        <SideTripVotingBoard
          expedition={expedition}
          activeMember={activeMember}
          onVoteCast={handleVoteCast}
        />

        {/* 4. Gear Customization Checklist */}
        <GearChecklist
          availableGear={expedition.availableGearOptions}
          activeMember={activeMember}
          selectedGear={selectedGear}
          onToggleGear={handleToggleGear}
        />

        {/* 5. Expedition Gear Weight & Porter Load Balancer (Sprint 9.1) */}
        <GearWeightBalancer
          expeditionId={expedition.id}
          initialTrekkerName={activeMember ? activeMember.memberName : expedition.leaderName}
          initialTrekkerEmail={activeMember ? activeMember.memberEmail : expedition.leaderEmail}
          initialGroupSize={expedition.targetGroupSize}
          initialAltitudeM={5364}
        />

        {/* 6. Expedition Team Dispatch Board & Offline Chat (Sprint 9.2) */}
        <TeamDispatchBoard
          expedition={expedition}
          activeMember={activeMember}
        />
      </div>

      {/* Modals */}
      {selectedPayMember && (
        <SplitPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPayMember(null);
          }}
          expedition={expedition}
          member={selectedPayMember}
          onPaymentSuccess={(_receipt, updatedExp) => {
            setExpedition(updatedExp);
          }}
        />
      )}

      <JoinExpeditionModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        expedition={expedition}
        onJoinSuccess={(member, updatedExp) => {
          setExpedition(updatedExp);
          setActiveMemberId(member.id);
        }}
      />
    </div>
  );
}
