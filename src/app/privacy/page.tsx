import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="bg-black text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 bg-neutral-900/60 p-8 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
          <ShieldCheck className="h-8 w-8 text-[#B68D40]" />
          <div>
            <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
            <p className="text-xs text-gray-400">Last updated: 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white">1. Information We Collect</h3>
            <p>
              When you use The Himalayan Trail, we collect location data strictly for rendering offline 3D topographic maps, tracking altitude gains, and providing real-time weather and safety alerts.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white">2. GPX & Community Contributions</h3>
            <p>
              Uploaded GPX tracks and trekker stories published publicly on the platform are accessible to the community to assist in safe navigation and itinerary planning.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white">3. Data Security</h3>
            <p>
              We implement industry-standard encryption to safeguard your account credentials, saved itineraries, and emergency contact details.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
