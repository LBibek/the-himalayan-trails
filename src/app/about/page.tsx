'use client';

import React from 'react';
import Link from 'next/link';
import {
  Mountain,
  ShieldCheck,
  Heart,
  Users,
  Compass,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TreePine,
  SunMedium
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'Years of Alpine Experience', value: '15+' },
    { label: 'Guided Trekkers Across Passes', value: '4,800+' },
    { label: 'Pass & Base Camp Success Rate', value: '99.2%' },
    { label: 'Local Sherpa Team & Porters', value: '100%' },
  ];

  const pillars = [
    {
      icon: ShieldCheck,
      title: 'High-Altitude Safety Protocol',
      desc: 'Our guides carry satellite communicators, portable altitude medical kits, and daily pulse oximeters. Acclimatization is built scientifically into every single itinerary.',
    },
    {
      icon: Heart,
      title: 'Ethical Porter Welfare',
      desc: 'We strictly adhere to IPPG (International Porter Protection Group) standards: mandatory 20kg weight limits, fair living wages, and high-altitude thermal gear.',
    },
    {
      icon: TreePine,
      title: 'Leave No Trace & Eco-Teahouses',
      desc: 'Preserving the sacred Himalaya is our sacred duty. We champion pack-it-in pack-it-out waste policies, reusable water purification, and eco-conscious tea lodges.',
    },
    {
      icon: Users,
      title: 'Sherpa-Owned & Operated',
      desc: 'Born and raised in Solukhumbu, Manang, and Rolwaling. We provide an authentic cultural immersion and deep ancestral reverence for the sacred mountains.',
    },
  ];

  const team = [
    {
      name: 'Tenzing Nuru Sherpa',
      role: 'Lead Expedition Leader & Co-Founder',
      region: 'Namche Bazaar, Khumbu',
      summits: 'Everest 4x, Cho Oyu 2x, Manaslu 3x',
      bio: 'Over 18 years leading high-altitude Himalayan crossings. Certified IFMGA guide dedicated to safe mountaineering education.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Pasang Lhamu Gurung',
      role: 'Head of Trek Operations & Safety',
      region: 'Pokhara & Annapurna',
      summits: 'Thorong La 28x, Annapurna Base Camp 40+',
      bio: 'Wilderness First Responder trained in rapid acute mountain sickness (AMS) diagnosis and emergency mountain helicopter evacuations.',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Dawa Tenzin Tamang',
      role: 'Cultural & Trail Naturalist',
      region: 'Langtang Valley',
      summits: 'Ganja La Pass, Kyanjin Ri, Gosainkunda',
      bio: 'Historian of Himalayan Buddhist heritage, flora, and fauna. Passionate about connecting travelers with ancient mountain monastery traditions.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Hero Section */}
      <div className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1800&q=80"
            alt="Himalayan Mountain Range"
            className="w-full h-full object-cover filter brightness-[0.25]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Compass className="h-4 w-4" />
            <span>Guiding with Ancestral Heritage Since 2009</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            Born from the Highest Ridges on Earth.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The Himalayan Trails was founded by native Sherpa guides and passionate high-altitude trekkers with one simple mission: to connect travelers with the majesty of the Himalayas while honoring its people, fragile ecology, and sacred traditions.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-emerald-500/20 shadow-2xl">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">{stat.value}</p>
              <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Mission & Values */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-16">
        
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-white">Our Core Expedition Pillars</h2>
          <p className="text-sm text-slate-400">
            Every step we take above 4,000 meters is guided by four uncompromising commitments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 group"
              >
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Lead Sherpa Team */}
        <div className="space-y-10 pt-12 border-t border-slate-800">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Meet Our Lead Mountain Guides</h2>
            <p className="text-sm text-slate-400">
              Experienced, licensed, and deeply rooted in Himalayan culture and wilderness medical care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-slate-900/40 border border-slate-800 overflow-hidden space-y-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all group"
              >
                <div>
                  <div className="h-64 w-full overflow-hidden bg-black">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-lg font-bold text-white">{member.name}</h3>
                    <p className="text-xs text-emerald-400 font-semibold">{member.role}</p>
                    <p className="text-[11px] text-slate-400">Origin: {member.region}</p>
                    <div className="pt-2 text-xs text-slate-300">
                      <span className="text-amber-400 font-semibold">Key Ascents:</span> {member.summits}
                    </div>
                    <p className="text-xs text-slate-400 pt-2 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-bold text-white">Ready for your Himalayan Adventure?</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Browse our curated trekking routes or speak directly with our expedition team in Kathmandu.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/trails"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
            >
              <span>Explore All Treks</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
