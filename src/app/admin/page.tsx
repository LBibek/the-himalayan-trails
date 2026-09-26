'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  Compass,
  Mountain,
  MapPin,
  Route,
  Save,
  CheckCircle2,
  Trash2,
  Edit,
  Eye,
  Layers,
  Sparkles,
  Download,
  Loader2
} from 'lucide-react';
import { Trail, Landmark } from '@/types';
import { EditableLandmark } from '@/components/admin/ExpeditionMapEditor';

// Dynamically import map editor with SSR disabled
const ExpeditionMapEditor = dynamic(() => import('@/components/admin/ExpeditionMapEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-neutral-900 animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-2xl border border-neutral-800">
      Loading Admin Map Studio & Waypoint Engine...
    </div>
  )
});

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'bookings'>('create');
  const [expeditions, setExpeditions] = useState<Trail[]>([]);
  const [loadingExpeditions, setLoadingExpeditions] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [landmarksCount, setLandmarksCount] = useState(0);

  // Fetch expeditions, landmarks, and bookings from SQLite DB
  useEffect(() => {
    fetch('/api/trails')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Trail[]) => {
        setExpeditions(data);
        setLoadingExpeditions(false);
      })
      .catch(() => setLoadingExpeditions(false));

    fetch('/api/landmarks')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown[]) => {
        setLandmarksCount(data.length);
      })
      .catch(console.error);

    fetch('/api/bookings')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        setBookings(data);
        setLoadingBookings(false);
      })
      .catch(() => setLoadingBookings(false));
  }, []);

  // Form State
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState<Trail['region']>('Everest');
  const [difficulty, setDifficulty] = useState<Trail['difficulty']>('Strenuous');
  const [durationDays, setDurationDays] = useState<number>(12);
  const [maxElevation, setMaxElevation] = useState<number>(5364);
  const [startPoint, setStartPoint] = useState('Lukla');
  const [endPoint, setEndPoint] = useState('Lukla');
  const [description, setDescription] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('Kala Patthar Sunrise, Khumbu Icefall, Tengboche Monastery');
  const [imageUrl, setImageUrl] = useState('/steps/trails.jpg');

  // Manual Map Drawn Data
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [landmarks, setLandmarks] = useState<EditableLandmark[]>([]);

  // Notification State
  const [successMessage, setSuccessMessage] = useState('');

  // Persist expeditions state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('himalayan_admin_expeditions', JSON.stringify(expeditions));
    }
  }, [expeditions]);

  const handleSaveExpedition = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please provide an Expedition Title');
      return;
    }

    const highlightsArray = highlightsInput
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    // Calculate distance from mapped waypoints if drawn, else default estimate
    let calculatedDistance = 120;
    if (waypoints.length >= 2) {
      let m = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        const lat1 = waypoints[i][0];
        const lng1 = waypoints[i][1];
        const lat2 = waypoints[i+1][0];
        const lng2 = waypoints[i+1][1];
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        m += R * c;
      }
      calculatedDistance = Number(m.toFixed(1));
    }

    fetch('/api/trails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: title.trim(),
        region,
        difficulty,
        distanceKm: calculatedDistance,
        durationDays: Number(durationDays),
        maxElevation: Number(maxElevation),
        elevationGain: Number(maxElevation) - 1000,
        image: imageUrl || '/steps/trails.jpg',
        description: description.trim() || 'Custom high-altitude expedition trail created via Admin Panel.',
        highlights: highlightsArray.length ? highlightsArray : ['High Pass Traverse', 'Panoramic Snow Views'],
        bestMonths: ['Mar-May', 'Sep-Nov'],
        startPoint,
        endPoint
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to create trail in database');
        return res.json();
      })
      .then((savedTrail: Trail) => {
        setExpeditions((prev) => [savedTrail, ...prev]);
        setSuccessMessage(`Expedition "${title}" persisted to database with ${waypoints.length} route waypoints!`);
        
        // Reset Form
        setTitle('');
        setDescription('');
        setWaypoints([]);
        setLandmarks([]);

        setTimeout(() => {
          setSuccessMessage('');
          setActiveTab('list');
        }, 2000);
      })
      .catch((err) => {
        alert(err.message || 'Error saving expedition to database');
      });
  };

  const handleDeleteExpedition = (id: string) => {
    if (confirm('Are you sure you want to delete this expedition?')) {
      setExpeditions((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleExportJSON = (expedition: Trail) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(expedition, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${expedition.slug}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleUpdateBookingStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
        );
        setSuccessMessage(`Booking ${id} status updated to ${newStatus}`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        setSuccessMessage(`Booking ${id} successfully removed`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to delete booking:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-10 space-y-8">
      
      {/* ADMIN PANEL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B68D40]/20 border border-[#B68D40]/40 text-[#B68D40] text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#B68D40] via-[#E2C085] to-white">
            Expedition & Trail Studio
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manually draw high-altitude trail polyline tracks on Leaflet map, configure custom landmarks, and manage bookings.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'create'
                ? 'bg-[#B68D40] text-black shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Create Expedition</span>
          </button>
          
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'list'
                ? 'bg-[#B68D40] text-black shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Directory ({expeditions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'bookings'
                ? 'bg-[#B68D40] text-black shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Customer Bookings ({bookings.length})</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Expeditions</div>
          <div className="text-2xl font-extrabold text-[#B68D40]">{expeditions.length}</div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Landmarks Registered</div>
          <div className="text-2xl font-extrabold text-amber-400">{landmarksCount + landmarks.length}</div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Distance Mapped</div>
          <div className="text-2xl font-extrabold text-green-400">
            {expeditions.reduce((acc, cur) => acc + cur.distanceKm, 0)} km
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Map Engine Status</div>
          <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Leaflet Active</span>
          </div>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-green-500/20 border border-green-500/40 text-green-300 text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* TAB 1: CREATE EXPEDITION & INTERACTIVE MAP STUDIO */}
      {activeTab === 'create' && (
        <form onSubmit={handleSaveExpedition} className="space-y-8">
          
          {/* Section 1: Basic Information */}
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-6">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Mountain className="h-5 w-5 text-[#B68D40]" />
              <h2 className="text-lg font-bold text-white">1. Expedition Metadata & Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Expedition / Trail Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kanchenjunga North Base Camp Circuit"
                  className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Himalayan Region *</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Trail['region'])}
                  className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
                >
                  <option value="Everest">Everest / Khumbu</option>
                  <option value="Annapurna">Annapurna Circuit</option>
                  <option value="Langtang">Langtang Valley</option>
                  <option value="Manaslu">Manaslu Circuit</option>
                  <option value="Mustang">Upper Mustang</option>
                  <option value="Rolwaling">Rolwaling Valley</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Difficulty Level *</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Trail['difficulty'])}
                  className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
                >
                  <option value="Moderate">Moderate</option>
                  <option value="Strenuous">Strenuous</option>
                  <option value="Challenging">Challenging</option>
                  <option value="Extreme">Extreme High Altitude</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Max Elevation (Meters) *</label>
                <input
                  type="number"
                  required
                  value={maxElevation}
                  onChange={(e) => setMaxElevation(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Duration (Days) *</label>
                <input
                  type="number"
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Start Point</label>
                <input
                  type="text"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  placeholder="e.g. Taplejung / Lukla"
                  className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">End Point</label>
                <input
                  type="text"
                  value={endPoint}
                  onChange={(e) => setEndPoint(e.target.value)}
                  placeholder="e.g. Taplejung"
                  className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Cover Image URL</label>
                <select
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
                >
                  <option value="/steps/trails.jpg">High Alpine Trails Photo (/steps/trails.jpg)</option>
                  <option value="/steps/region.jpg">Panoramic Region View (/steps/region.jpg)</option>
                  <option value="/steps/weather.jpg">Mountain Peaks Cloud Sunset (/steps/weather.jpg)</option>
                  <option value="/steps/itinerary.jpg">Tea House Lodge View (/steps/itinerary.jpg)</option>
                  <option value="/bg.jpg">Starry Night Himalayas (/bg.jpg)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Highlights (Comma Separated)</label>
              <input
                type="text"
                value={highlightsInput}
                onChange={(e) => setHighlightsInput(e.target.value)}
                placeholder="Pangpema Base Camp, Kangbachen Village, Yarlung Glacier"
                className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Expedition Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the terrain, pass crossings, wilderness exposure, and culture..."
                className="w-full p-3 rounded-xl bg-black border border-neutral-700 text-white text-sm focus:outline-none focus:border-[#B68D40]"
              />
            </div>
          </div>

          {/* Section 2: Interactive Leaflet Map Trail & Landmark Builder */}
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-[#B68D40]" />
                <h2 className="text-lg font-bold text-white">2. Interactive Map Studio — Draw Trail & Place Landmarks</h2>
              </div>
              <span className="text-xs text-[#B68D40] font-semibold bg-[#B68D40]/10 px-3 py-1 rounded-full border border-[#B68D40]/30">
                Leaflet Point-by-Point Studio
              </span>
            </div>

            <ExpeditionMapEditor
              onWaypointsChange={(pts) => setWaypoints(pts)}
              onLandmarksChange={(lms) => setLandmarks(lms)}
            />
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-4 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-sm transition shadow-2xl shadow-[#B68D40]/30 flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              <span>Publish Expedition to Platform</span>
            </button>
          </div>

        </form>
      )}

      {/* TAB 2: EXPEDITION DIRECTORY & MANAGEMENT TABLE */}
      {activeTab === 'list' && (
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#B68D40]" />
              <span>Registered Himalayan Expeditions Directory</span>
            </h2>

            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 rounded-xl bg-[#B68D40] text-black font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>New Expedition</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black text-[#B68D40] uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">Expedition Name</th>
                  <th className="p-3">Region</th>
                  <th className="p-3">Max Altitude</th>
                  <th className="p-3">Distance / Duration</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {expeditions.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-800/50 transition">
                    <td className="p-3 font-bold text-white flex items-center gap-3">
                      <img src={exp.image} alt={exp.name} className="w-10 h-10 object-cover rounded-lg" />
                      <span>{exp.name}</span>
                    </td>
                    <td className="p-3 text-gray-300 font-semibold">{exp.region}</td>
                    <td className="p-3 text-amber-400 font-extrabold">{exp.maxElevation}m</td>
                    <td className="p-3 text-gray-300">{exp.distanceKm} km • {exp.durationDays} Days</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-gray-300 border border-neutral-700">
                        {exp.difficulty}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleExportJSON(exp)}
                        className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                        title="Export JSON / GPX data"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpedition(exp.id)}
                        className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        title="Delete Expedition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER BOOKINGS & EXPEDITION DISPATCH */}
      {activeTab === 'bookings' && (
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#B68D40]" />
                Customer Expedition Bookings ({bookings.length})
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Real-time booking dispatch, permit status triage, and customer lifecycle management.
              </p>
            </div>
          </div>

          {loadingBookings ? (
            <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#B68D40]" />
              <span>Loading customer bookings...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No customer bookings found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-neutral-950 uppercase tracking-wider text-gray-400 border-b border-neutral-800">
                  <tr>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">Party</th>
                    <th className="p-3">Total ($)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {bookings.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-3 font-mono text-[#B68D40]">{booking.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{booking.fullName}</div>
                        <div className="text-[11px] text-gray-400">{booking.email} • {booking.phone}</div>
                      </td>
                      <td className="p-3 font-medium text-gray-200">{booking.startDate}</td>
                      <td className="p-3">{booking.travelers} {booking.travelers === 1 ? 'Trekker' : 'Trekkers'}</td>
                      <td className="p-3 font-bold text-white">${booking.totalPrice}</td>
                      <td className="p-3">
                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-xs font-semibold text-white focus:outline-none focus:border-[#B68D40]"
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="EXPEDITION_ACTIVE">ACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                          title="Delete Booking"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
