'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Lock,
  CheckCircle2,
  X,
  AlertCircle,
  Receipt,
  Printer,
  ShieldCheck,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { GroupExpeditionWithDetails, GroupMember } from '@/types';

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  expedition: GroupExpeditionWithDetails;
  member: GroupMember;
  onPaymentSuccess: (receiptNumber: string, updatedExpedition: GroupExpeditionWithDetails) => void;
}

export default function SplitPaymentModal({
  isOpen,
  onClose,
  expedition,
  member,
  onPaymentSuccess
}: SplitPaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardholderName, setCardholderName] = useState(member?.memberName || '');
  const [billingCountry, setBillingCountry] = useState('United States');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<{
    receiptNumber: string;
    paidAt: string;
    amountPaid: number;
    paidMembersCount: number;
    targetGroupSize: number;
  } | null>(null);

  if (!isOpen) return null;

  const depositShare = member.shareAmountUsd || expedition.depositPerPersonUsd || 187.50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const sanitizedCard = cardNumber.replace(/\s+/g, '');
    if (sanitizedCard.length < 13 || sanitizedCard.length > 19) {
      setErrorMessage('Please enter a valid 16-digit credit card number.');
      return;
    }

    if (!cardExpiry || !cardExpiry.includes('/')) {
      setErrorMessage('Please enter a valid card expiration date (MM/YY).');
      return;
    }

    if (cardCvc.length < 3) {
      setErrorMessage('Please enter a valid 3-digit security code (CVC).');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch(`/api/trips/${expedition.shareToken}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          paymentMethod: 'CREDIT_CARD',
          cardLast4: sanitizedCard.slice(-4),
          amountUsd: depositShare
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process split deposit payment');
      }

      setSuccessReceipt({
        receiptNumber: data.receiptNumber,
        paidAt: data.paidAt,
        amountPaid: data.amountPaid,
        paidMembersCount: data.paidMembersCount,
        targetGroupSize: data.targetGroupSize
      });

      if (data.expedition) {
        onPaymentSuccess(data.receiptNumber, data.expedition);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      data-slot="base"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          data-slot="trigger"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
        >
          <X className="w-5 h-5" />
        </button>

        {successReceipt ? (
          /* Success Receipt Card */
          <div data-slot="body" className="p-6 md:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#B68D40]">
                Payment Authorized &amp; Confirmed
              </span>
              <h3 className="text-2xl font-black text-white">
                Split-Deposit Secured!
              </h3>
              <p className="text-xs text-slate-400">
                You have confirmed your individual spot on <strong className="text-white">{expedition.expeditionTitle}</strong>.
              </p>
            </div>

            {/* Official Receipt Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2.5 font-mono text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-500">Official Receipt:</span>
                <span className="font-bold text-[#E2C085]">{successReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Adventurer:</span>
                <span className="text-white">{member.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deposit Paid:</span>
                <span className="text-emerald-400 font-bold">${successReceipt.amountPaid.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-400">{new Date(successReceipt.paidAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-500">Team Status:</span>
                <span className="text-[#B68D40] font-bold">
                  {successReceipt.paidMembersCount} of {successReceipt.targetGroupSize} Members Paid
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] text-black font-extrabold text-xs shadow-lg transition hover:opacity-95"
              >
                Return to Team Roster
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Payment Form */
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            <div data-slot="header" className="space-y-1">
              <div className="flex items-center gap-2 text-[#B68D40] text-xs font-bold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>256-Bit Encrypted Split-Deposit</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white">
                Individual Deposit Checkout
              </h3>
              <p className="text-xs text-slate-400">
                Paying for: <strong className="text-white">{member.memberName}</strong> ({member.memberEmail})
              </p>
            </div>

            {/* Financial Breakdown Card */}
            <div data-slot="body" className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Expedition:</span>
                <span className="font-semibold text-white truncate max-w-[220px]">{expedition.expeditionTitle}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Departure Target:</span>
                <span className="text-white">{expedition.targetStartDate}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Team Target Size:</span>
                <span className="text-white">{expedition.targetGroupSize} Climbers</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-extrabold text-sm text-white">
                <span>Your Split Deposit (Due Today):</span>
                <span className="text-[#B68D40]">${depositShare.toFixed(2)} USD</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Credit Card Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Cardholder Full Name
                </label>
                <input
                  type="text"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Full name as printed on card"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                      setCardNumber(val);
                    }}
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-[#B68D40]"
                  />
                  <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Expiration (MM/YY)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length >= 2) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                      setCardExpiry(val);
                    }}
                    placeholder="12/28"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-[#B68D40]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-[#B68D40]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Submit Button */}
            <div data-slot="footer" className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isProcessing}
                data-slot="trigger"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] hover:opacity-95 text-black font-extrabold text-xs shadow-xl shadow-[#B68D40]/20 flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-[#B68D40] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Processing Split-Deposit Transaction...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-black" />
                    <span>Confirm &amp; Pay Split-Deposit (${depositShare.toFixed(2)})</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ACID SQLite Persistence • Individual Receipt Issued Upon Authorization
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
