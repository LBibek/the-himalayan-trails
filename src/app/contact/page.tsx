'use client';

import React, { useState, useTransition } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { submitContactMessage } from '@/app/actions/contact';

export default function ContactPage() {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [formStatus, setFormStatus] = useState<{
    success?: boolean;
    message?: string;
    errors?: Record<string, string>;
  } | null>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);

    startTransition(async () => {
      const res = await submitContactMessage(formData);
      setFormStatus(res);
      if (res.success) {
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
      }
    });
  };

  const faqs = [
    {
      q: 'Do I need special permits to trek in Nepal?',
      a: 'Yes, almost all Himalayan treks require entry permits (such as Sagarmatha National Park, ACAP for Annapurna, or Special Restricted Area Permits for Manaslu/Upper Mustang) along with TIMS cards. All permits are arranged in advance and included in our guided packages.',
    },
    {
      q: 'What happens if I experience Acute Mountain Sickness (AMS)?',
      a: 'Our guides monitor your blood oxygen saturation and pulse twice daily using fingertip oximeters. If symptoms occur, our standard medical protocol is immediate rest, hydration, medication (Diamox), and gradual descent. In rare severe cases, we coordinate immediate emergency helicopter evacuation.',
    },
    {
      q: 'What is the best season to trek in the Himalayas?',
      a: 'The two prime seasons are Spring (March to May) with blooming rhododendrons and warmer conditions, and Autumn (September to late November) offering crystal-clear mountain vistas and stable weather.',
    },
    {
      q: 'Can you customize private itineraries for families or groups?',
      a: 'Absolutely! More than 60% of our expeditions are custom-tailored with flexible rest days, customized pace, helicopter returns, or side trips to sacred lakes and monasteries.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      
      {/* Header */}
      <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>24/7 Kathmandu Expedition Support</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Contact Our Mountain Specialists
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Whether you need customized route planning, weather updates, or gear guidance, our local Himalayan team is ready to assist you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Kathmandu Headquarters</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tridevi Marg, Thamel, Kathmandu, Nepal 44600
            </p>
            <p className="text-[11px] text-emerald-400 font-medium">Open Sun - Fri (8:00 AM - 6:00 PM NPT)</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Phone & Emergency SOS</h3>
            <p className="text-xs text-slate-400">
              Office: +977 1 4268900<br />
              Emergency 24/7: +977 98510 12345
            </p>
            <a
              href="https://wa.me/9779851012345"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-[11px] text-emerald-400 font-semibold hover:underline"
            >
              Chat on WhatsApp →
            </a>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Direct Email Inquiries</h3>
            <p className="text-xs text-slate-400">
              expeditions@thehimalayantrails.com<br />
              support@thehimalayantrails.com
            </p>
            <p className="text-[11px] text-slate-500">Average response time: &lt; 4 hours</p>
          </div>

        </div>

        {/* Form and FAQ Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left: Interactive Form */}
          <div className="lg:col-span-7 p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Send Us a Direct Message</h2>
              <p className="text-xs text-slate-400 mt-1">
                Tell us about your dream trek, preferred travel dates, or any special questions.
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              
              {formStatus?.success && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Message Delivered!</strong>
                    <span>{formStatus.message}</span>
                  </div>
                </div>
              )}

              {formStatus?.success === false && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Submission Notice</strong>
                    <span>{formStatus.message}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {formStatus?.errors?.name && (
                    <p className="text-[10px] text-rose-400 mt-1">{formStatus.errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {formStatus?.errors?.email && (
                    <p className="text-[10px] text-rose-400 mt-1">{formStatus.errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Custom 12-day Annapurna Sanctuary Trek inquiry"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {formStatus?.errors?.subject && (
                  <p className="text-[10px] text-rose-400 mt-1">{formStatus.errors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Include dates, fitness levels, group size, or questions about routes..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
                {formStatus?.errors?.message && (
                  <p className="text-[10px] text-rose-400 mt-1">{formStatus.errors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isPending ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Right: FAQ Accordion */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-emerald-400" />
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Common questions from international trekkers preparing for the Himalayas.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition gap-3"
                    >
                      <span className="text-xs font-bold text-white">{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/30">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>All communications and booking inquiries are processed securely.</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
