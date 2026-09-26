'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, Mountain, Loader2, AlertCircle } from 'lucide-react';

export default function ShareTrailPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    region: 'Everest / Khumbu',
    elevation: '5360',
    difficulty: 'Moderate',
    distance: '15 km',
    duration: '2 Days',
    description: '',
    creatorName: '',
    creatorEmail: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/share-trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit trail contribution');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error communicating with database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Mountain className="h-3.5 w-3.5" />
            <span>Community Contributor Hub</span>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[#B68D40] to-white">
            Become a Himalayan Contributor
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Share your high-altitude GPX tracks, trail updates, teahouse reviews, and hazard warnings directly into our persistent database.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-400 flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="bg-neutral-900 border border-blue-500/40 p-8 rounded-2xl text-center space-y-4 animate-in fade-in duration-300">
            <CheckCircle2 className="h-16 w-16 text-blue-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Submission Recorded in Database!</h2>
            <p className="text-gray-300 text-sm">
              Thank you for sharing your trail insights. Your contribution has been saved and will appear in the community database.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  title: '',
                  region: 'Everest / Khumbu',
                  elevation: '5360',
                  difficulty: 'Moderate',
                  distance: '15 km',
                  duration: '2 Days',
                  description: '',
                  creatorName: '',
                  creatorEmail: ''
                });
              }}
              className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer"
            >
              Submit Another Trail
            </button>
          </div>
        ) : (
          <form className="bg-neutral-900/80 p-8 rounded-2xl border border-neutral-800 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-medium">Trail / Route Name *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Gokyo Ri to Cho La Pass Circuit"
                className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Contributor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.creatorName}
                  onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
                  placeholder="Your full name"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Contributor Email *</label>
                <input
                  type="email"
                  required
                  value={formData.creatorEmail}
                  onChange={(e) => setFormData({ ...formData, creatorEmail: e.target.value })}
                  placeholder="Your email address"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Region *</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Everest / Khumbu">Everest / Khumbu</option>
                  <option value="Annapurna">Annapurna</option>
                  <option value="Langtang Valley">Langtang Valley</option>
                  <option value="Mustang">Mustang</option>
                  <option value="Manaslu">Manaslu</option>
                  <option value="Rolwaling">Rolwaling</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Max Altitude (m) *</label>
                <input
                  type="number"
                  required
                  value={formData.elevation}
                  onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                  placeholder="e.g., 5360"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Moderate">Moderate</option>
                  <option value="Strenuous">Strenuous</option>
                  <option value="Challenging">Challenging</option>
                  <option value="Extreme">Extreme</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Est. Distance</label>
                <input
                  type="text"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  placeholder="e.g., 24 km"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-medium">Est. Duration</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 3 Days"
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* GPX Notice */}
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-medium">GPX Track Format</label>
              <div className="border border-dashed border-neutral-700 rounded-xl p-5 text-center bg-neutral-800/40">
                <UploadCloud className="h-8 w-8 text-blue-400 mx-auto mb-1" />
                <div className="text-xs text-gray-300 font-semibold">Standard WGS84 GPS coordinate format accepted</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Route coordinates will be parsed into the trail database.</div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-medium">Trail Description & Hazard Notes</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mention water sources, teahouse availability, landslide risks, permit requirements..."
                className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              <span>{loading ? 'Submitting to Database...' : 'Submit Trail & Track to Community'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
