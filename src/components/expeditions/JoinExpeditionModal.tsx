'use client';

import React, { useState } from 'react';
import { Users, UserPlus, X, AlertCircle, Loader2, ShieldCheck, Check } from 'lucide-react';
import { GroupExpeditionWithDetails, GroupMember } from '@/types';

interface JoinExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  expedition: GroupExpeditionWithDetails;
  onJoinSuccess: (member: GroupMember, updatedExpedition: GroupExpeditionWithDetails) => void;
}

export default function JoinExpeditionModal({
  isOpen,
  onClose,
  expedition,
  onJoinSuccess
}: JoinExpeditionModalProps) {
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [selectedSideTrips, setSelectedSideTrips] = useState<string[]>([]);
  const [selectedGear, setSelectedGear] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!memberName.trim() || memberName.trim().length < 2) {
      setErrorMessage('Please enter your full adventurer name.');
      return;
    }

    if (!memberEmail.trim() || !memberEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/trips/${expedition.shareToken}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberName: memberName.trim(),
          memberEmail: memberEmail.trim(),
          sideTripVotes: selectedSideTrips,
          personalGearRentals: selectedGear,
          shareAmountUsd: expedition.depositPerPersonUsd || 187.50
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join group expedition');
      }

      onJoinSuccess(data.member, data.expedition);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error joining expedition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-slot="base"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden relative">
        <button
          type="button"
          onClick={onClose}
          data-slot="trigger"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          <div data-slot="header" className="space-y-1">
            <div className="flex items-center gap-2 text-[#B68D40] text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Join Team Roster</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white">
              Claim Your Expedition Spot
            </h3>
            <p className="text-xs text-slate-400">
              Joining: <strong className="text-white">{expedition.expeditionTitle}</strong>
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div data-slot="body" className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="e.g. Maya Sherpa"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="adventurer@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              />
            </div>

            {/* Optional Pre-select Side Trips */}
            {expedition.availableSideTrips && expedition.availableSideTrips.length > 0 && (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                  Pre-select Side Trip Votes (Optional)
                </label>
                <div className="space-y-1.5">
                  {expedition.availableSideTrips.map((st) => {
                    const isSelected = selectedSideTrips.includes(st.name);
                    return (
                      <div
                        key={st.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSideTrips(selectedSideTrips.filter((n) => n !== st.name));
                          } else {
                            setSelectedSideTrips([...selectedSideTrips, st.name]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex justify-between items-center transition ${
                          isSelected
                            ? 'bg-amber-950/20 border-[#B68D40] text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{st.name} ({st.elevationMeters}m)</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-[#B68D40] text-black border-[#B68D40]' : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div data-slot="footer" className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              data-slot="trigger"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] hover:opacity-95 text-black font-extrabold text-xs shadow-xl shadow-[#B68D40]/20 flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-[#B68D40] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Joining Expedition Roster...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-black" />
                  <span>Join Roster &amp; Select Split-Deposit</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-500">
              Split-deposit share is locked at ${expedition.depositPerPersonUsd.toFixed(2)} USD per climber.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
