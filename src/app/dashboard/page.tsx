'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Calendar,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  Mountain,
  LogOut,
  ChevronRight,
  Printer,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserBooking {
  id: string;
  trailId: string;
  trailName?: string;
  trailSlug?: string;
  fullName: string;
  email: string;
  phone: string;
  startDate: string;
  travelers: number;
  totalPrice: number;
  status: string;
  specialRequests?: string;
  paymentOption?: 'FULL' | 'DEPOSIT';
  depositAmount?: number;
  remainingBalance?: number;
  receiptNumber?: string;
  basePrice?: number;
  permitFee?: number;
  taxAmount?: number;
  emergencyContact?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          setUser(null);
          setLoading(false);
          return;
        }

        const authData = await authRes.json();
        setUser(authData.user);

        // Fetch bookings
        const bookingsRes = await fetch('/api/user/bookings');
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData.bookings || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#B68D40] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm tracking-widest uppercase">Loading Trekker Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#B68D40]/10 border border-[#B68D40]/30 flex items-center justify-center">
            <Compass className="w-8 h-8 text-[#B68D40]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Trekker Portal</h1>
            <p className="text-sm text-gray-400 mt-2">
              Please sign in to access your Himalayan expeditions, permits, and saved routes.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/login?redirect=/dashboard"
              className="w-full py-3 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-semibold text-sm transition-all shadow-lg shadow-[#B68D40]/20"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/signup"
              className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm transition-all"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'EXPEDITION_ACTIVE');

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Top Banner */}
      <div className="relative border-b border-neutral-800 bg-gradient-to-b from-neutral-900 to-black px-4 py-12 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 border border-[#B68D40]/40 flex items-center justify-center text-2xl font-extrabold text-[#B68D40] shadow-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#B68D40]/20 text-[#B68D40] border border-[#B68D40]/40">
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/itinerary/planner"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#B68D40]/20"
            >
              <Sparkles className="w-4 h-4" />
              Plan New Trek
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-gray-300 hover:text-white font-medium text-xs tracking-wider uppercase transition-all"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-10 space-y-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#B68D40]/10 text-[#B68D40] border border-[#B68D40]/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">Total Expeditions</p>
              <p className="text-2xl font-bold text-white mt-1">{bookings.length}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">Active Bookings</p>
              <p className="text-2xl font-bold text-white mt-1">{activeBookings.length}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400">Total Expedition Value</p>
              <p className="text-2xl font-bold text-white mt-1">${totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Your Expedition Bookings</h2>
              <p className="text-xs text-gray-400">Active permits and verified trekking reservations</p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center space-y-4">
              <Mountain className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-200">No Expeditions Booked Yet</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Explore our catalog of classic Himalayan routes and book your next high-altitude adventure.
              </p>
              <Link
                href="/trails"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B68D40] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#c99e4b] transition-all"
              >
                Browse Himalayan Trails
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bookings.map((booking) => {
                const isDeposit = booking.paymentOption === 'DEPOSIT';
                const paidAmount = booking.depositAmount ?? (isDeposit ? Math.round(booking.totalPrice * 0.25) : booking.totalPrice);
                const remaining = booking.remainingBalance ?? (isDeposit ? Math.round(booking.totalPrice - paidAmount) : 0);

                return (
                  <div
                    key={booking.id}
                    data-slot="base"
                    className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-[#B68D40]/40 transition-all flex flex-col md:flex-row justify-between gap-6"
                  >
                    <div data-slot="body" className="space-y-3.5 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          data-slot="indicator"
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                            isDeposit
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isDeposit ? 'Confirmed — Deposit Paid' : 'Confirmed — Full Payment'}
                        </span>
                        {booking.receiptNumber && (
                          <span className="text-xs font-mono font-bold text-[#B68D40] bg-[#B68D40]/10 px-2.5 py-0.5 rounded-full border border-[#B68D40]/30">
                            {booking.receiptNumber}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-mono">Ref: {booking.id}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white">
                        {booking.trailName || 'Himalayan Expedition'}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#B68D40]" />
                          <span>Start Date: {booking.startDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#B68D40]" />
                          <span>{booking.travelers} {booking.travelers === 1 ? 'Traveler' : 'Travelers'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Total: <strong className="text-white">${booking.totalPrice.toLocaleString()}</strong></span>
                          <span className="text-emerald-400 font-semibold">(Paid: ${paidAmount.toLocaleString()})</span>
                        </div>
                      </div>

                      {/* Remaining balance notice if deposit option */}
                      {remaining > 0 ? (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            Outstanding Balance: <strong className="text-white font-bold">${remaining.toLocaleString()}</strong> • Outstanding balance payable in USD / NPR upon arrival at Kathmandu Basecamp briefing.
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Expedition package 100% fully settled. Official clearance active.</span>
                        </div>
                      )}

                      {booking.specialRequests && (
                        <p className="text-xs text-gray-400 italic">
                          &quot;{booking.specialRequests}&quot;
                        </p>
                      )}
                    </div>

                    <div data-slot="footer" className="flex md:flex-col justify-end gap-2 shrink-0 md:min-w-[210px]">
                      <Link
                        href={`/bookings/${booking.id}/voucher`}
                        data-slot="trigger"
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B68D40] to-[#E2C085] hover:opacity-95 text-black font-extrabold text-xs shadow-md shadow-[#B68D40]/20 transition-all focus-visible:ring-2 focus-visible:ring-[#B68D40]"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Download / Print Official Voucher
                      </Link>

                      {booking.trailSlug && (
                        <Link
                          href={`/trails/${booking.trailSlug}`}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-gray-200 transition-colors border border-neutral-700/60"
                        >
                          Trail Guide
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links Footer */}
        <div className="pt-6 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/map"
            className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-[#B68D40] transition-colors">Interactive 3D Map</p>
              <p className="text-xs text-gray-400 mt-1">Explore trails with topographic elevation</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="/weather"
            className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-[#B68D40] transition-colors">Weather & Avalanche Status</p>
              <p className="text-xs text-gray-400 mt-1">Check real-time mountain conditions</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="/stories"
            className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-[#B68D40] transition-colors">Community Stories</p>
              <p className="text-xs text-gray-400 mt-1">Share and read expedition narratives</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
