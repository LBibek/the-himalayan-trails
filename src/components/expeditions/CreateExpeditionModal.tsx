'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Sparkles, X, AlertCircle, Loader2, Calendar, Share2, Check } from 'lucide-react';
import { Trail } from '@/types';

interface CreateExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trail: Trail;
  initialDepositShare?: number;
}

export default function CreateExpeditionModal({
  isOpen,
  onClose,
  trail,
  initialDepositShare = 187.50
}: CreateExpeditionModalProps) {
  const router = useRouter();
  const [expeditionTitle, setExpeditionTitle] = useState(`${trail?.name || 'Himalayan'} Team Expedition 2026`);
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [targetStartDate, setTargetStartDate] = useState('');
  const [targetGroupSize, setTargetGroupSize] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!leaderName.trim()) {
      setErrorMessage('Please enter expedition leader full name.');
      return;
    }

    if (!leaderEmail.trim() || !leaderEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address for the leader.');
      return;
    }

    if (!targetStartDate) {
      setErrorMessage('Please choose a target expedition departure date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trailId: trail.id || trail.slug,
          leaderName: leaderName.trim(),
          leaderEmail: leaderEmail.trim(),
          expeditionTitle: expeditionTitle.trim(),
          targetStartDate,
          targetGroupSize: Number(targetGroupSize),
          shareAmountUsd: initialDepositShare
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create group expedition');
      }

      onClose();
      router.push(`/trips/join/${data.shareToken}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating group expedition');
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
              <span>Collaborative Expedition Planning</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white">
              Start Group Expedition &amp; Split Costs
            </h3>
            <p className="text-xs text-slate-400">
              Create a shareable invite link for <strong className="text-white">{trail?.name}</strong>. Team members can vote on detours and pay their own deposit.
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
                Expedition Title
              </label>
              <input
                type="text"
                required
                value={expeditionTitle}
                onChange={(e) => setExpeditionTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Target Departure
                </label>
                <input
                  type="date"
                  required
                  value={targetStartDate}
                  onChange={(e) => setTargetStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Team Size (Climbers)
                </label>
                <select
                  value={targetGroupSize}
                  onChange={(e) => setTargetGroupSize(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                >
                  <option value={2}>2 Climbers (Duo)</option>
                  <option value={3}>3 Climbers</option>
                  <option value={4}>4 Climbers (Standard)</option>
                  <option value={6}>6 Climbers</option>
                  <option value={8}>8 Climbers</option>
                  <option value={10}>10 Climbers</option>
                  <option value={12}>12 Climbers (Full Team)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Expedition Leader Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Leader Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="leader@alpine.org"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B68D40]"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs flex justify-between items-center font-mono">
              <span className="text-slate-400">Split-Deposit per member:</span>
              <span className="font-extrabold text-[#B68D40]">${initialDepositShare.toFixed(2)} USD</span>
            </div>
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
                  <span>Generating Shareable Expedition Link...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-black" />
                  <span>Create Expedition &amp; Get Invite Link</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-500">
              You will get a unique link to share with your group over WhatsApp, Email, or Slack.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
