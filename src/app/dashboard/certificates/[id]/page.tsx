'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Printer,
  Award,
  ShieldCheck,
  Mountain,
  Calendar,
  Compass,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  QrCode,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { HighAltitudeCertificate } from '@/types/certificate';

export default function CertificatePage() {
  const params = useParams();
  const id = params?.id as string;

  const [certificate, setCertificate] = useState<HighAltitudeCertificate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCertificate() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/certificates/${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Unable to load certificate for '${id}'`);
        }
        const data = await res.json();
        setCertificate(data.certificate);
      } catch (err: any) {
        console.error('Failed to load certificate:', err);
        setError(err.message || 'Failed to retrieve high-altitude certificate');
      } finally {
        setLoading(false);
      }
    }

    loadCertificate();
  }, [id]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <Loader2 className="w-10 h-10 text-[#B68D40] animate-spin" />
        <h2 className="text-xl font-bold text-white">Validating Cryptographic Certificate...</h2>
        <p className="text-xs text-gray-400 font-mono">Verifying IFMGA registry credentials & digital signatures</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-white">Certificate Not Found</h2>
        <p className="text-sm text-gray-400 max-w-md">{error || 'The requested expedition completion certificate could not be located.'}</p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-[#B68D40] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#c99e4b] transition-all"
        >
          Return to User Dashboard
        </Link>
      </div>
    );
  }

  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/dashboard/certificates/${certificate.verificationCode}`
    : `https://the-himalayan-trails.vercel.app/dashboard/certificates/${certificate.verificationCode}`;

  return (
    <div data-slot="base" className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 md:px-8">
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors p-2 rounded-xl bg-white/5 border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            data-slot="trigger"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-[#B68D40] hover:opacity-95 text-black font-black text-xs uppercase tracking-wider shadow-xl shadow-[#B68D40]/25 transition-all focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Download Certificate as PDF
          </button>
        </div>
      </div>

      {/* Official Commemorative High-Altitude Certificate Paper */}
      <div
        id="official-certificate-document"
        className="max-w-4xl mx-auto p-6 sm:p-10 md:p-14 bg-gradient-to-b from-[#0c0d10] via-[#08090b] to-[#040405] text-slate-100 rounded-3xl border-4 border-[#B68D40] shadow-2xl relative overflow-hidden print:border-8 print:border-[#B68D40] print:m-0 print:p-8 print:w-full print:max-w-none print:shadow-none print:rounded-none"
      >
        {/* Ornate Inner Double Gold Border */}
        <div className="absolute inset-3 sm:inset-4 md:inset-5 border-2 border-[#B68D40]/50 rounded-2xl pointer-events-none" />
        <div className="absolute inset-4 sm:inset-5 md:inset-6 border border-[#E2C085]/30 rounded-xl pointer-events-none" />

        {/* Alpine Corner Accents */}
        <div className="absolute top-6 left-6 text-[#B68D40] font-mono text-xs opacity-75">❖</div>
        <div className="absolute top-6 right-6 text-[#B68D40] font-mono text-xs opacity-75">❖</div>
        <div className="absolute bottom-6 left-6 text-[#B68D40] font-mono text-xs opacity-75">❖</div>
        <div className="absolute bottom-6 right-6 text-[#B68D40] font-mono text-xs opacity-75">❖</div>

        {/* Subtle Watermark Mountain Crest Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Mountain className="w-[500px] h-[500px] text-white" />
        </div>

        {/* Certificate Content Container */}
        <div className="relative z-10 text-center space-y-6 md:space-y-8 py-4 sm:py-6">

          {/* Header & Verification Crest */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#B68D40]/10 border border-[#B68D40]/40 text-[#B68D40] text-xs font-mono font-bold tracking-widest uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>IFMGA • UIAGM Himalayan Expedition Registry</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#F5E2B8] to-[#B68D40] uppercase">
              Certificate of High-Altitude Achievement
            </h1>

            <p className="text-xs sm:text-sm font-mono tracking-widest text-[#E2C085] uppercase">
              The Himalayan Trails • Kingdom of Nepal
            </p>
          </div>

          {/* Conferral Statement */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <p className="text-xs sm:text-sm font-serif italic text-gray-300">
              This official high-altitude credentials record certifies that
            </p>

            <div className="py-2 border-b-2 border-[#B68D40]/60 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-wide">
                {certificate.adventurerName}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-serif">
              has with extraordinary grit, endurance, and mountaineering resolve, successfully completed the grueling expedition of
            </p>

            <h3 className="text-xl sm:text-3xl font-black text-[#E2C085] tracking-tight uppercase">
              {certificate.trailName}
            </h3>
          </div>

          {/* Milestone Metrics Box */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto bg-black/50 p-4 rounded-2xl border border-[#B68D40]/30 shadow-inner">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block">Apex Altitude Reached</span>
              <p className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
                {certificate.maxElevation.toLocaleString()}m
              </p>
            </div>

            <div className="space-y-0.5 border-x border-white/10">
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block">Total Expedition Trek</span>
              <p className="text-lg sm:text-2xl font-black text-white font-mono">
                {certificate.totalDistanceKm} km
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block">Completion Date</span>
              <p className="text-xs sm:text-base font-bold text-[#E2C085] font-mono mt-1">
                {certificate.completionDate}
              </p>
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div className="pt-6 sm:pt-10 grid grid-cols-1 sm:grid-cols-3 items-end gap-6 max-w-2xl mx-auto border-t border-[#B68D40]/30">

            {/* Left: Chief Guide Signature */}
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-serif italic text-lg sm:text-xl text-[#E2C085] border-b border-gray-600 pb-1 font-semibold">
                {certificate.chiefGuideName}
              </div>
              <p className="text-[10px] uppercase font-mono font-bold text-gray-300">
                Pasang Sherpa, IFMGA
              </p>
              <p className="text-[9px] text-gray-500 font-mono leading-tight">
                Chief Guide & Lead Expedition Leader (#NMA-0142)
              </p>
            </div>

            {/* Center: Official Gold Foil Seal Stamp */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#946F25] via-[#E2C085] to-[#B68D40] p-1 shadow-2xl flex items-center justify-center">
                <div className="w-full h-full rounded-full border-2 border-black/40 bg-[#0c0d10] flex flex-col items-center justify-center text-center p-1.5 shadow-inner">
                  <Award className="w-6 h-6 text-[#E2C085] mb-0.5" />
                  <span className="text-[8px] font-black uppercase text-[#E2C085] tracking-widest leading-none">
                    OFFICIAL
                  </span>
                  <span className="text-[7px] font-mono text-gray-400 leading-none mt-0.5">
                    SUMMIT SEAL
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Cryptographic Verification QR & Code */}
            <div className="space-y-1 text-center sm:text-right">
              <div className="inline-block p-1 bg-white rounded-lg border border-gray-300 shadow">
                <QrCode className="w-12 h-12 text-black" />
              </div>
              <p className="text-[10px] font-mono font-extrabold text-[#E2C085] tracking-wider block">
                {certificate.verificationCode}
              </p>
              <p className="text-[8px] font-mono text-gray-500 truncate max-w-[180px] sm:ml-auto">
                Sig: {certificate.digitalSignatureHash.slice(0, 16)}...
              </p>
            </div>

          </div>

          {/* Footer Verification Notice */}
          <div className="text-[9px] text-gray-500 font-mono tracking-wide pt-2">
            Verified by The Himalayan Trails Cryptographic Expedition Authority • Verify online at{' '}
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E2C085]/80 hover:text-[#E2C085] underline underline-offset-2 transition-colors"
            >
              {verificationUrl}
            </a>
          </div>

        </div>
      </div>

      {/* Print CSS Specific Rules */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #000000 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, footer, nav, .no-print, [data-slot="hotline-card"] {
            display: none !important;
          }
          #official-certificate-document {
            background: #0c0d10 !important;
            border: 6px solid #B68D40 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
