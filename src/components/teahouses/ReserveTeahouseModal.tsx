'use client';

import React, { useState } from 'react';
import {
  X, CheckCircle2, AlertCircle, Mountain, Calendar,
  Users, Coffee, Bed, CreditCard, ShieldCheck, Loader2, Sparkles, MapPin
} from 'lucide-react';
import { Teahouse, TeahouseReservation } from '@/types';

interface ReserveTeahouseModalProps {
  teahouse: Teahouse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (reservation: TeahouseReservation) => void;
}

export default function ReserveTeahouseModal({
  teahouse,
  isOpen,
  onClose,
  onSuccess,
}: ReserveTeahouseModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkInDate, setCheckInDate] = useState(defaultDateStr);
  const [guestsCount, setGuestsCount] = useState(1);
  const [roomType, setRoomType] = useState(
    teahouse && teahouse.roomTypes.length > 0 ? teahouse.roomTypes[0] : 'Twin Mountain View'
  );
  const [dietaryNotes, setDietaryNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<TeahouseReservation | null>(null);

  if (!isOpen || !teahouse) return null;

  const currentRoom = roomType || (teahouse.roomTypes[0] || 'Standard Room');
  const totalPrice = teahouse.pricePerNightUsd * Math.max(1, guestsCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guestName.trim() || !guestEmail.trim() || !checkInDate) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/teahouses/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teahouseId: teahouse.id,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim() || undefined,
          checkInDate,
          guestsCount,
          roomType: currentRoom,
          dietaryNotes: dietaryNotes.trim() || undefined,
          totalPriceUsd: totalPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm reservation');
      }

      setConfirmedReservation(data.reservation);
      if (onSuccess) {
        onSuccess(data.reservation);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setConfirmedReservation(null);
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setDietaryNotes('');
    setCheckInDate(defaultDateStr);
    setGuestsCount(1);
    onClose();
  };

  return (
    <div
      data-slot="base"
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleResetAndClose}
    >
      <div
        data-slot="content"
        className="relative w-full max-w-lg my-8 rounded-3xl backdrop-blur-2xl bg-neutral-900/95 border border-[#B68D40]/40 shadow-2xl overflow-hidden text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div data-slot="header" className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B68D40]/20 border border-[#B68D40]/40 flex items-center justify-center text-[#B68D40]">
              <Bed className="w-5 h-5 text-[#B68D40]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Reserve Mountain Teahouse</h2>
              <p className="text-xs text-neutral-400">
                {teahouse.name} • {teahouse.village} ({teahouse.elevation}m)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Screen */}
        {confirmedReservation ? (
          <div data-slot="body" className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#B68D40] font-extrabold">
                Instant Confirmation Verified
              </span>
              <h3 className="text-xl font-black text-white mt-1">Room Guaranteed!</h3>
              <p className="text-xs text-neutral-300 mt-1">
                Your reservation at <strong className="text-white">{teahouse.name}</strong> is registered on the high-pass radio manifest.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Reservation Ref:</span>
                <span className="font-mono text-[#E2C085] font-bold">{confirmedReservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Guest:</span>
                <span className="text-white font-semibold">{confirmedReservation.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Check-in:</span>
                <span className="text-white font-semibold">{confirmedReservation.checkInDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Room Tier:</span>
                <span className="text-white font-semibold">{confirmedReservation.roomType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Guests:</span>
                <span className="text-white font-semibold">{confirmedReservation.guestsCount} Trekker(s)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-800">
                <span className="text-neutral-400">Total Due at Lodge:</span>
                <span className="text-emerald-400 font-extrabold">${confirmedReservation.totalPriceUsd} USD</span>
              </div>
            </div>

            <div data-slot="footer">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs transition"
              >
                Done &amp; Return to Directory
              </button>
            </div>
          </div>
        ) : (
          /* Reservation Form */
          <form onSubmit={handleSubmit} data-slot="body" className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Lodge Specs summary */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="text-[11px] text-neutral-400">Nightly Rate</p>
                <p className="text-sm font-black text-white">${teahouse.pricePerNightUsd} USD / night</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[11px] text-neutral-400">Host</p>
                <p className="text-xs font-bold text-[#E2C085]">{teahouse.hostName || 'Lodge Proprietor'}</p>
              </div>
            </div>

            {/* Guest Name & Email */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Full Name (as on Passport / TIMS Card) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#B68D40]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    WhatsApp / Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+977 980-0000000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#B68D40]"
                  />
                </div>
              </div>
            </div>

            {/* Dates & Guests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Trekkers Count *
                </label>
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest (Solo)' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Type */}
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                Room Category *
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
              >
                {teahouse.roomTypes.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            {/* Dietary notes */}
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">
                Dietary &amp; Acclimatization Requests (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vegetarian Dal Bhat, Extra hot water bottle for bed"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#B68D40]"
              />
            </div>

            {/* Price Preview */}
            <div className="p-3 rounded-2xl bg-[#B68D40]/10 border border-[#B68D40]/30 flex items-center justify-between text-xs">
              <span className="text-neutral-300">Total Accommodation Estimated:</span>
              <span className="text-sm font-extrabold text-[#E2C085]">
                ${totalPrice} USD
              </span>
            </div>

            {/* Submit */}
            <div data-slot="footer" className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={handleResetAndClose}
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
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>Confirm Room Reservation (${totalPrice})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
