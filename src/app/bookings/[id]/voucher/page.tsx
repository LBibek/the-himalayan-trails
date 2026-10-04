'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Printer,
  Compass,
  Calendar,
  Users,
  ShieldCheck,
  Mountain,
  PhoneCall,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Lock,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface VoucherData {
  header: string;
  receiptNumber: string;
  bookingId: string;
  issueDate: string;
  status: string;
  authenticityHash: string;
  verificationQrValue: string;
  adventurer: {
    fullName: string;
    email: string;
    phone: string;
    groupSize: number;
    emergencyContact: string;
  };
  expedition: {
    trailId: string;
    trailName: string;
    trailSlug?: string;
    region: string;
    startDate: string;
    durationDays: number;
    startPoint: string;
    endPoint: string;
    maxAltitude: string;
  };
  financialStatement: {
    basePackagePrice: number;
    tieredGroupDiscount: number;
    discountPercent: number;
    permitFeesBreakdown: {
      timsFee: number;
      conservationAreaFee: number;
      totalPermits: number;
    };
    nepalVat: number;
    totalAmount: number;
    paymentOption: 'FULL' | 'DEPOSIT';
    paidAmount: number;
    outstandingBalance: number;
    currency: string;
    paymentTermsNotice: string;
  };
  protocols: {
    timsVerification: string;
    mandatoryInsurance: string;
    sarHotline: string;
    liaisonNotice: string;
  };
  assignedGuide?: {
    id: string;
    name: string;
    licenseNumber: string;
    certification: string;
    avatarImage?: string;
  } | null;
  porterLogistics?: {
    porterCount: number;
    totalGearWeightKg: number;
    ippgCompliance: string;
  };
}

export default function ExpeditionVoucherPage() {
  const params = useParams();
  const id = params?.id as string;

  const [voucher, setVoucher] = useState<VoucherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/bookings/${id}/voucher`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to load expedition voucher');
        }
        return res.json();
      })
      .then((data) => {
        if (data.voucher) {
          setVoucher(data.voucher);
        } else {
          setError('Voucher record incomplete');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching voucher:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#B68D40] animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-widest uppercase text-gray-400">
          Generating Official Expedition Clearance...
        </p>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-bold">Expedition Voucher Not Found</h1>
          <p className="text-xs text-gray-400">{error || 'Unable to locate booking voucher record.'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B68D40] text-black font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { adventurer, expedition, financialStatement, protocols } = voucher;
  const isDeposit = financialStatement.paymentOption === 'DEPOSIT';

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-8 px-4 sm:px-6 lg:px-8 selection:bg-[#B68D40] selection:text-black">
      {/* Print-specific style overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          .print-card {
            border: 1px solid #cccccc !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-text-dark {
            color: #000000 !important;
          }
          .print-text-muted {
            color: #444444 !important;
          }
          .print-gold-border {
            border-color: #B68D40 !important;
          }
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      {/* Top Action Toolbar (Hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white text-xs font-semibold border border-neutral-800 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trekker Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          {expedition.trailSlug && (
            <Link
              href={`/trails/${expedition.trailSlug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white text-xs font-semibold border border-neutral-800 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
            >
              <span>Trail Overview</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] hover:opacity-95 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#B68D40]/20 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Official Voucher Printable Document */}
      <div
        id="voucher-document"
        data-slot="base"
        className="print-container max-w-4xl mx-auto rounded-3xl backdrop-blur-xl bg-neutral-900/90 border border-[#B68D40]/40 shadow-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden"
      >
        {/* Luxury Gold Ambient Corner Glow (Screen only) */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#B68D40]/10 rounded-full blur-3xl pointer-events-none no-print" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#B68D40]/5 rounded-full blur-3xl pointer-events-none no-print" />

        {/* 1. Official Header & Verification Crest */}
        <div data-slot="header" className="border-b border-neutral-800 pb-6 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#B68D40]/10 border border-[#B68D40]/50 flex items-center justify-center text-[#B68D40] shrink-0 shadow-lg">
                <Mountain className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B68D40] px-2.5 py-0.5 rounded-full bg-[#B68D40]/10 border border-[#B68D40]/30">
                    Government Permit Clearance &amp; Receipt
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    isDeposit
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isDeposit ? 'Confirmed — Deposit Paid' : 'Confirmed — Full Payment'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight print-text-dark">
                  {voucher.header || 'The Himalayan Trails — Official Expedition Voucher & Permit Clearance'}
                </h1>
                <p className="text-xs text-gray-400 mt-1 print-text-muted">
                  Official Operator License No. NTB-8942 • Ministry of Culture, Tourism &amp; Civil Aviation, Nepal
                </p>
              </div>
            </div>

            {/* Official QR Code & Hash Block */}
            <div className="flex items-center gap-3 bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800 shrink-0 print-card">
              {/* Authentic Crisp SVG QR Code Representation */}
              <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                <svg viewBox="0 0 29 29" className="w-full h-full text-black fill-current">
                  {/* Outer Frame & Finder patterns */}
                  <rect x="0" y="0" width="7" height="7" rx="1" />
                  <rect x="1" y="1" width="5" height="5" fill="#fff" />
                  <rect x="2" y="2" width="3" height="3" />

                  <rect x="22" y="0" width="7" height="7" rx="1" />
                  <rect x="23" y="1" width="5" height="5" fill="#fff" />
                  <rect x="24" y="2" width="3" height="3" />

                  <rect x="0" y="22" width="7" height="7" rx="1" />
                  <rect x="1" y="23" width="5" height="5" fill="#fff" />
                  <rect x="2" y="24" width="3" height="3" />

                  {/* Timing & Data Cells */}
                  <rect x="8" y="2" width="2" height="2" />
                  <rect x="12" y="2" width="2" height="2" />
                  <rect x="16" y="2" width="2" height="2" />
                  <rect x="18" y="4" width="2" height="2" />
                  <rect x="10" y="6" width="2" height="2" />
                  <rect x="14" y="6" width="2" height="2" />

                  <rect x="2" y="10" width="2" height="2" />
                  <rect x="6" y="10" width="2" height="2" />
                  <rect x="10" y="10" width="3" height="3" />
                  <rect x="15" y="10" width="2" height="2" />
                  <rect x="19" y="10" width="2" height="2" />
                  <rect x="23" y="10" width="3" height="2" />

                  <rect x="4" y="14" width="2" height="2" />
                  <rect x="8" y="14" width="3" height="2" />
                  <rect x="13" y="13" width="3" height="3" />
                  <rect x="18" y="14" width="2" height="2" />
                  <rect x="23" y="14" width="2" height="2" />

                  <rect x="2" y="18" width="2" height="2" />
                  <rect x="9" y="18" width="2" height="2" />
                  <rect x="13" y="18" width="3" height="2" />
                  <rect x="18" y="18" width="3" height="2" />
                  <rect x="23" y="18" width="2" height="2" />

                  <rect x="8" y="23" width="2" height="2" />
                  <rect x="12" y="23" width="3" height="2" />
                  <rect x="17" y="23" width="2" height="2" />
                  <rect x="21" y="23" width="3" height="3" />
                  <rect x="10" y="26" width="2" height="2" />
                  <rect x="14" y="26" width="3" height="2" />
                </svg>
              </div>
              <div className="text-[11px] space-y-0.5">
                <p className="text-gray-400 font-medium print-text-muted">Authenticity Stamp</p>
                <p className="font-mono font-bold text-[#B68D40] text-[10px] break-all">{voucher.authenticityHash}</p>
                <p className="text-[9px] text-gray-400 print-text-muted">Scan to verify at NTB checkpoint</p>
              </div>
            </div>
          </div>

          {/* Quick Identification Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-neutral-800/60 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider print-text-muted">Receipt Number</span>
              <span className="font-mono font-black text-white text-sm text-[#B68D40] print-text-dark">{voucher.receiptNumber}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider print-text-muted">Booking Reference</span>
              <span className="font-mono font-semibold text-gray-200 print-text-dark">{voucher.bookingId}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider print-text-muted">Issue Date</span>
              <span className="font-semibold text-gray-200 print-text-dark">
                {new Date(voucher.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider print-text-muted">Clearance Status</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                VALID &amp; REGISTERED
              </span>
            </div>
          </div>
        </div>

        {/* 2. Main Details Grid: Adventurer & Expedition Cards */}
        <div data-slot="body" className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 break-inside-avoid">
          {/* Card A: Adventurer Details */}
          <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3.5 print-card">
            <div className="flex items-center gap-2 text-[#B68D40] font-bold text-xs uppercase tracking-wider border-b border-neutral-800/80 pb-2">
              <Users className="w-4 h-4" />
              <span>Adventurer &amp; Party Details</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-gray-400 print-text-muted">Lead Adventurer:</span>
                <span className="font-bold text-white print-text-dark">{adventurer.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-gray-400 print-text-muted">Registered Email:</span>
                <span className="font-mono text-gray-300 print-text-dark">{adventurer.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-gray-400 print-text-muted">Contact Phone / WhatsApp:</span>
                <span className="font-mono text-gray-300 print-text-dark">{adventurer.phone}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-gray-400 print-text-muted">Party Size:</span>
                <span className="font-bold text-white print-text-dark">
                  {adventurer.groupSize} {adventurer.groupSize === 1 ? 'Trekker (Solo)' : 'Trekkers'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 print-text-muted">Emergency Contact:</span>
                <span className="font-semibold text-gray-300 text-right print-text-dark">{adventurer.emergencyContact}</span>
              </div>
            </div>
          </div>

          {/* Card B: Expedition Details */}
          <div className="p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-3.5 print-card">
            <div className="flex items-center gap-2 text-[#B68D40] font-bold text-xs uppercase tracking-wider border-b border-neutral-800/80 pb-2">
              <Compass className="w-4 h-4" />
              <span>Expedition Route &amp; Terrain Specs</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-gray-400 print-text-muted">Expedition Name:</span>
                <span className="font-bold text-white print-text-dark">{expedition.trailName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-gray-400 print-text-muted">Geographic Region:</span>
                <span className="font-semibold text-gray-300 print-text-dark">{expedition.region}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-gray-400 print-text-muted">Departure Date:</span>
                <span className="font-bold text-[#B68D40] print-text-dark">{expedition.startDate}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-gray-400 print-text-muted">Duration:</span>
                <span className="font-semibold text-gray-300 print-text-dark">{expedition.durationDays} Days Itinerary</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-gray-400 print-text-muted">Trailheads (Start → End):</span>
                <span className="font-semibold text-gray-300 print-text-dark">{expedition.startPoint} → {expedition.endPoint}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 print-text-muted">Max Apex Altitude:</span>
                <span className="font-bold text-white print-text-dark">{expedition.maxAltitude}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2.5 Assigned Sherpa Guide & Porter Logistics Team Clearance */}
        {(voucher.assignedGuide || (voucher.porterLogistics && voucher.porterLogistics.porterCount > 0)) && (
          <div data-slot="body" className="p-6 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4 print-card break-inside-avoid relative z-10">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-white font-extrabold text-sm uppercase tracking-wider print-text-dark">
                <ShieldCheck className="w-4 h-4 text-[#B68D40]" />
                <span>Verified Alpine Expedition Leadership &amp; Porter Logistics</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                IPPG &amp; NTB Certified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sherpa Guide Block */}
              {voucher.assignedGuide ? (
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider print-text-muted">Lead Sherpa Mountain Guide</span>
                    <span className="text-[10px] font-bold text-[#B68D40] bg-[#B68D40]/10 px-2 py-0.5 rounded-full border border-[#B68D40]/30">
                      {voucher.assignedGuide.certification}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    {voucher.assignedGuide.avatarImage && (
                      <img
                        src={voucher.assignedGuide.avatarImage}
                        alt={voucher.assignedGuide.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#B68D40]/40 shrink-0"
                      />
                    )}
                    <div>
                      <h4 className="font-bold text-white text-sm print-text-dark">{voucher.assignedGuide.name}</h4>
                      <p className="text-[11px] font-mono text-gray-400 print-text-muted">License: {voucher.assignedGuide.licenseNumber}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider print-text-muted">Expedition Guide</span>
                  <p className="text-xs text-gray-300 font-medium">Standard Licensed Group Leader Assigned at Kathmandu Briefing</p>
                </div>
              )}

              {/* Porter Logistics Block */}
              {voucher.porterLogistics && (
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider print-text-muted">Allocated Porter Logistics</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {voucher.porterLogistics.ippgCompliance}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block print-text-muted">Porter Crew</span>
                      <span className="font-bold text-white print-text-dark">
                        {voucher.porterLogistics.porterCount} Dedicated Porter{voucher.porterLogistics.porterCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block print-text-muted">Gear Weight</span>
                      <span className="font-bold text-white print-text-dark">
                        {voucher.porterLogistics.totalGearWeightKg > 0 ? `${voucher.porterLogistics.totalGearWeightKg} kg Total` : 'Standard Allocation'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Itemized Financial Statement */}
        <div data-slot="body" className="p-6 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4 print-card break-inside-avoid">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-sm uppercase tracking-wider print-text-dark">
              <DollarSign className="w-4 h-4 text-[#B68D40]" />
              <span>Official Financial Statement &amp; Tax Invoice</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 print-text-muted">Currency: USD ($)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 text-gray-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Unit / Rate</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-gray-300">
                <tr>
                  <td className="py-2.5">
                    <span className="font-semibold text-white block print-text-dark">Base Alpine Expedition Package</span>
                    <span className="text-[11px] text-gray-400 print-text-muted">
                      Full lodge accommodations, certified Sherpa guides, porters, and meals
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-gray-400 print-text-muted">
                    {adventurer.groupSize} trekker(s)
                  </td>
                  <td className="py-2.5 text-right font-medium text-white print-text-dark">
                    ${financialStatement.basePackagePrice.toLocaleString()}
                  </td>
                </tr>

                {financialStatement.tieredGroupDiscount > 0 && (
                  <tr>
                    <td className="py-2.5 text-emerald-400">
                      <span className="font-semibold block">Tiered Group Expeditions Discount</span>
                      <span className="text-[11px] opacity-80">
                        {financialStatement.discountPercent}% off base package ({adventurer.groupSize}+ trekkers)
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-emerald-400">
                      -{financialStatement.discountPercent}%
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">
                      -${financialStatement.tieredGroupDiscount.toLocaleString()}
                    </td>
                  </tr>
                )}

                <tr>
                  <td className="py-2.5">
                    <span className="font-semibold text-white block print-text-dark">Regional Trekking &amp; Conservation Permits</span>
                    <span className="text-[11px] text-gray-400 print-text-muted">
                      TIMS Card ($20) + National Park / Conservation Area Entry ($30) per trekker
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-gray-400 print-text-muted">
                    $50 × {adventurer.groupSize}
                  </td>
                  <td className="py-2.5 text-right font-medium text-white print-text-dark">
                    ${financialStatement.permitFeesBreakdown.totalPermits.toLocaleString()}
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5">
                    <span className="font-semibold text-white block print-text-dark">Nepal Inland Revenue Department VAT (13%)</span>
                    <span className="text-[11px] text-gray-400 print-text-muted">
                      Statutory value added tax on commercial expedition services
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-gray-400 print-text-muted">
                    13%
                  </td>
                  <td className="py-2.5 text-right font-medium text-white print-text-dark">
                    ${financialStatement.nepalVat.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals and Payment Summary Box */}
          <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-900/60 p-4 rounded-xl print-card">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider print-text-muted">
                Total Package Price
              </span>
              <span className="text-xl font-extrabold text-white mt-1 block print-text-dark">
                ${financialStatement.totalAmount.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider print-text-muted">
                Amount Paid ({isDeposit ? '25% Deposit' : '100% Full'})
              </span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                ${financialStatement.paidAmount.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider print-text-muted">
                Outstanding Balance Due
              </span>
              <span className={`text-xl font-extrabold mt-1 block ${
                financialStatement.outstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                ${financialStatement.outstandingBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Terms Callout */}
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-gray-300 print-card print-text-dark">
            <p className="font-semibold text-[#B68D40]">Payment Terms &amp; Settlement Note:</p>
            <p className="mt-0.5 text-gray-400 print-text-muted">
              {financialStatement.paymentTermsNotice || 'Outstanding balance payable in USD / NPR upon arrival at Kathmandu Basecamp briefing.'}
            </p>
          </div>
        </div>

        {/* 4. Mandatory Pre-Departure Protocols */}
        <div data-slot="body" className="p-6 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4 print-card break-inside-avoid">
          <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase tracking-wider border-b border-neutral-800 pb-2">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            <span>Mandatory Himalayan Pre-Departure &amp; Safety Protocols</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1.5 print-card">
              <div className="flex items-center gap-1.5 font-bold text-white print-text-dark">
                <Building2 className="w-4 h-4 text-[#B68D40]" />
                <span>1. TIMS Biometric Clearance</span>
              </div>
              <p className="text-gray-400 text-[11px] leading-relaxed print-text-muted">
                {protocols.timsVerification || 'TIMS biometric verification at Tourist Service Center Bhrikutimandap Kathmandu'}. Trekkers must present original passport and 2 passport photos at Bhrikutimandap.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1.5 print-card">
              <div className="flex items-center gap-1.5 font-bold text-white print-text-dark">
                <FileCheck2 className="w-4 h-4 text-[#B68D40]" />
                <span>2. Mandatory Evac Insurance</span>
              </div>
              <p className="text-gray-400 text-[11px] leading-relaxed print-text-muted">
                {protocols.mandatoryInsurance}. Proof of policy must be submitted prior to trailhead dispatch.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-1.5 print-card">
              <div className="flex items-center gap-1.5 font-bold text-white print-text-dark">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>3. 24/7 SAR Dispatch Hotline</span>
              </div>
              <p className="text-gray-400 text-[11px] leading-relaxed print-text-muted">
                Direct satellite coordination line: <strong className="text-white font-mono print-text-dark">{protocols.sarHotline || '+977-1-4123456'}</strong> (+977-1-4123456) for 24/7 SAR emergency dispatch.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Official Operator Certification & Signature Seal */}
        <div data-slot="footer" className="border-t border-neutral-800 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-xs text-gray-400 print-text-muted break-inside-avoid">
          <div className="space-y-1 max-w-md">
            <p className="font-bold text-white print-text-dark">The Himalayan Trails Operations Basecamp</p>
            <p>Tridevi Marg, Thamel, Kathmandu 44600, Nepal</p>
            <p>NTB Reg #8942 • TAAN Member #1042 • VAT #602934812</p>
          </div>

          <div className="text-right sm:text-right border-t sm:border-t-0 sm:border-l border-neutral-800 sm:pl-6 pt-4 sm:pt-0">
            <div className="inline-block p-2 rounded-xl border border-[#B68D40]/30 bg-[#B68D40]/5 mb-1 print-gold-border">
              <span className="font-serif italic font-bold text-[#B68D40] text-sm">
                Certified Himalayan Clearance
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-400 print-text-muted">
              Auth Hash: {voucher.authenticityHash}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
