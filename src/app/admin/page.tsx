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
  Loader2,
  Mail,
  HelpCircle,
  Clock,
  UserCheck,
  Calendar,
  Users,
  Receipt,
  FileText,
  FileCheck2,
  DollarSign,
  X
} from 'lucide-react';
import { Trail, Landmark, Inquiry, ContactMessage } from '@/types';
import { EditableLandmark } from '@/components/admin/ExpeditionMapEditor';
import GpxRouteUploader from '@/components/admin/GpxRouteUploader';
import { ParsedRouteResult } from '@/lib/gpxParser';

// Dynamically import map editor with SSR disabled
const ExpeditionMapEditor = dynamic(() => import('@/components/admin/ExpeditionMapEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-neutral-900 animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-2xl border border-neutral-800">
      Loading Admin Map Studio & Waypoint Engine...
    </div>
  )
});

// Dynamically import LandmarkAdminStudio with SSR disabled
const LandmarkAdminStudio = dynamic(() => import('@/components/admin/LandmarkAdminStudio'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-neutral-900 animate-pulse flex items-center justify-center text-[#B68D40] text-sm font-semibold rounded-2xl border border-neutral-800">
      Loading Himalayan Landmarks & POI Studio...
    </div>
  )
});

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'landmarks' | 'list' | 'bookings' | 'inquiries' | 'contact'>('create');
  const [expeditions, setExpeditions] = useState<Trail[]>([]);
  const [loadingExpeditions, setLoadingExpeditions] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loadingContactMessages, setLoadingContactMessages] = useState(true);

  const [landmarksCount, setLandmarksCount] = useState(0);

  const [editingTrailSlug, setEditingTrailSlug] = useState<string | null>(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<any | null>(null);

  // Fetch expeditions, landmarks, bookings, inquiries, and contact messages from real SQLite DB APIs
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

    fetch('/api/inquiries')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Inquiry[]) => {
        setInquiries(data);
        setLoadingInquiries(false);
      })
      .catch(() => setLoadingInquiries(false));

    fetch('/api/contact')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ContactMessage[]) => {
        setContactMessages(data);
        setLoadingContactMessages(false);
      })
      .catch(() => setLoadingContactMessages(false));
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

  // Manual Map Drawn & GPX Imported Data
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [landmarks, setLandmarks] = useState<EditableLandmark[]>([]);
  const [elevationProfile, setElevationProfile] = useState<{ distanceKm: number; elevation: number; label?: string }[]>([]);
  const [uploadedGpxInfo, setUploadedGpxInfo] = useState<ParsedRouteResult | null>(null);

  // Notification State
  const [successMessage, setSuccessMessage] = useState('');

  // Handle GPX Route Loaded
  const handleRouteLoaded = (result: ParsedRouteResult) => {
    setUploadedGpxInfo(result);
    setWaypoints(result.waypoints);
    if (result.landmarks.length > 0) {
      setLandmarks(result.landmarks);
    }
    setElevationProfile(result.elevationProfile);
  };

  // Handle Auto-fill Form with GPX Metadata
  const handleApplyGpxToForm = (result: ParsedRouteResult) => {
    if (result.name) setTitle(result.name);
    if (result.description) setDescription(result.description);
    if (result.maxElevationM > 0) setMaxElevation(result.maxElevationM);
    if (result.estimatedDays > 0) setDurationDays(result.estimatedDays);
    if (result.startPoint) setStartPoint(result.startPoint);
    if (result.endPoint) setEndPoint(result.endPoint);

    // Auto-detect Himalayan region from geographic longitude & latitude
    if (result.waypoints.length > 0) {
      const [lat, lng] = result.waypoints[0];
      if (lng > 86.4 && lng < 87.2) setRegion('Everest');
      else if (lng >= 83.5 && lng <= 84.6) setRegion('Annapurna');
      else if (lng >= 84.6 && lng <= 85.2) setRegion('Manaslu');
      else if (lng >= 85.2 && lng <= 85.8) setRegion('Langtang');
      else if (lng >= 83.6 && lng <= 84.2 && lat > 28.7) setRegion('Mustang');
      else if (lng >= 86.2 && lng <= 86.6) setRegion('Rolwaling');
    }

    // Auto-detect difficulty based on max altitude & distance
    if (result.maxElevationM >= 5400 || result.totalDistanceKm > 100) {
      setDifficulty('Extreme');
    } else if (result.maxElevationM >= 4500 || result.totalDistanceKm > 60) {
      setDifficulty('Challenging');
    } else if (result.maxElevationM >= 3500) {
      setDifficulty('Strenuous');
    } else {
      setDifficulty('Moderate');
    }

    // Auto-populate highlights from parsed landmark names
    if (result.landmarks.length > 0) {
      const lmHighlights = result.landmarks.slice(0, 5).map((l) => l.name).join(', ');
      setHighlightsInput(lmHighlights);
    }
  };

  const handleClearGpx = () => {
    setUploadedGpxInfo(null);
    setWaypoints([]);
    setLandmarks([]);
    setElevationProfile([]);
  };

  const handleEditExpedition = (trail: Trail) => {
    setEditingTrailSlug(trail.slug);
    setTitle(trail.name);
    setRegion(trail.region);
    setDifficulty(trail.difficulty);
    setDurationDays(trail.durationDays);
    setMaxElevation(trail.maxElevation);
    setStartPoint(trail.startPoint);
    setEndPoint(trail.endPoint);
    setImageUrl(trail.image);
    setHighlightsInput(trail.highlights.join(', '));
    setDescription(trail.description);
    if (trail.routeCoordinates && Array.isArray(trail.routeCoordinates)) {
      setWaypoints(trail.routeCoordinates.map((pt) => [pt[0], pt[1]]));
    }
    if (trail.elevationProfile && Array.isArray(trail.elevationProfile)) {
      setElevationProfile(trail.elevationProfile);
    }
    setActiveTab('create');
  };

  const handleCancelEdit = () => {
    setEditingTrailSlug(null);
    setTitle('');
    setDescription('');
    setWaypoints([]);
    setLandmarks([]);
    setElevationProfile([]);
    setUploadedGpxInfo(null);
  };

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

    const payload = {
      name: title.trim(),
      region,
      difficulty,
      distanceKm: calculatedDistance,
      durationDays: Number(durationDays),
      maxElevation: Number(maxElevation),
      elevationGain: Math.max(Number(maxElevation) - 1000, 500),
      image: imageUrl || '/steps/trails.jpg',
      description: description.trim() || 'Custom high-altitude expedition trail created via Admin Panel.',
      highlights: highlightsArray.length ? highlightsArray : ['High Pass Traverse', 'Panoramic Snow Views'],
      bestMonths: ['Mar-May', 'Sep-Nov'],
      startPoint,
      endPoint,
      routeCoordinates: waypoints.length > 0 ? waypoints : undefined,
      elevationProfile: elevationProfile.length > 0 ? elevationProfile : undefined
    };

    if (editingTrailSlug) {
      // Real API PUT request to update trail
      fetch(`/api/trails/${editingTrailSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to update trail in database');
          return res.json();
        })
        .then((updatedTrail: Trail) => {
          setExpeditions((prev) =>
            prev.map((t) => (t.slug === editingTrailSlug ? updatedTrail : t))
          );
          setSuccessMessage(`Expedition "${title}" successfully updated!`);
          handleCancelEdit();
          setTimeout(() => {
            setSuccessMessage('');
            setActiveTab('list');
          }, 2000);
        })
        .catch((err) => {
          alert(err.message || 'Error updating expedition in database');
        });
    } else {
      // Real API POST request to persist trail
      fetch('/api/trails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to create trail in database');
          return res.json();
        })
        .then((savedTrail: Trail) => {
          setExpeditions((prev) => [savedTrail, ...prev]);
          setSuccessMessage(`Expedition "${title}" persisted to database with ${waypoints.length} route waypoints!`);
          
          handleCancelEdit();
          setTimeout(() => {
            setSuccessMessage('');
            setActiveTab('list');
          }, 2000);
        })
        .catch((err) => {
          alert(err.message || 'Error saving expedition to database');
        });
    }
  };

  const handleDeleteExpedition = async (slugOrId: string) => {
    if (!confirm('Are you sure you want to delete this expedition? All related records will be removed from database.')) {
      return;
    }

    try {
      const res = await fetch(`/api/trails/${slugOrId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete trail');
      
      setExpeditions((prev) => prev.filter((item) => item.id !== slugOrId && item.slug !== slugOrId));
      setSuccessMessage('Expedition successfully deleted from database');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error deleting trail from database');
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

  const handleUpdateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus as any } : inq))
        );
        setSuccessMessage(`Inquiry ${id} status set to ${newStatus}`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      const res = await fetch(`/api/inquiries?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInquiries((prev) => prev.filter((inq) => inq.id !== id));
        setSuccessMessage(`Inquiry ${id} deleted`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
    }
  };

  const handleUpdateContactStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setContactMessages((prev) =>
          prev.map((msg) => (msg.id === id ? { ...msg, status: newStatus as any } : msg))
        );
        setSuccessMessage(`Contact message ${id} status updated to ${newStatus}`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to update contact message status:', err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact message?')) return;
    try {
      const res = await fetch(`/api/contact?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContactMessages((prev) => prev.filter((msg) => msg.id !== id));
        setSuccessMessage(`Contact message ${id} deleted`);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to delete contact message:', err);
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
            Persistently manage Himalayan expeditions, route waypoints, customer inquiries, and contact submissions.
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
            <span>{editingTrailSlug ? 'Edit Expedition' : 'Create Expedition'}</span>
          </button>

          <button
            onClick={() => setActiveTab('landmarks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'landmarks'
                ? 'bg-[#B68D40] text-black shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Landmarks Studio ({landmarksCount})</span>
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
            <span>Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'inquiries'
                ? 'bg-[#B68D40] text-black shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Inquiries ({inquiries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'contact'
                ? 'bg-[#B68D40] text-black shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Contact Inbox ({contactMessages.length})</span>
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
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Customer Inquiries</div>
          <div className="text-2xl font-extrabold text-amber-400">{inquiries.length}</div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Contact Messages</div>
          <div className="text-2xl font-extrabold text-cyan-400">{contactMessages.length}</div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Database Persistence</div>
          <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>SQLite Active</span>
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

      {/* TAB 1: CREATE / EDIT EXPEDITION & INTERACTIVE MAP STUDIO */}
      {activeTab === 'create' && (
        <form onSubmit={handleSaveExpedition} className="space-y-8">
          
          {/* Section 1: Basic Information */}
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Mountain className="h-5 w-5 text-[#B68D40]" />
                <h2 className="text-lg font-bold text-white">
                  {editingTrailSlug ? `Editing Expedition: ${title}` : '1. Expedition Metadata & Details'}
                </h2>
              </div>
              {editingTrailSlug && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/itinerary/planner?trail=${editingTrailSlug}`}
                    className="text-xs text-[#B68D40] hover:text-white px-3 py-1 bg-[#B68D40]/20 rounded-lg flex items-center gap-1.5 border border-[#B68D40]/40 transition"
                    title="Open this expedition in the Itinerary Planner"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Open in Itinerary Planner Studio</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs text-neutral-400 hover:text-white px-3 py-1 bg-neutral-800 rounded-lg"
                  >
                    Cancel Edit Mode
                  </button>
                </div>
              )}
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

          {/* Section 2: GPX Route Upload & Interactive Map Studio */}
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-[#B68D40]" />
                <h2 className="text-lg font-bold text-white">2. Route Studio — Upload GPX / KML &amp; Interactive Map Editor</h2>
              </div>
              <span className="text-xs text-[#B68D40] font-semibold bg-[#B68D40]/10 px-3 py-1 rounded-full border border-[#B68D40]/30">
                GPX 1.1 Native &amp; Leaflet Studio
              </span>
            </div>

            {/* GPX & KML Route Importer Dropzone */}
            <GpxRouteUploader
              onRouteLoaded={handleRouteLoaded}
              onApplyToForm={handleApplyGpxToForm}
              onClear={handleClearGpx}
              initialRouteName={title}
            />

            {/* Interactive Leaflet Map Editor */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#B68D40]" />
                  <span>Interactive Map Studio (Visual Waypoints &amp; Landmark Placement)</span>
                </h3>
                {waypoints.length > 0 && (
                  <span className="text-xs text-gray-400 font-mono">
                    <strong className="text-[#B68D40]">{waypoints.length}</strong> waypoints mapped
                  </span>
                )}
              </div>

              <ExpeditionMapEditor
                initialWaypoints={waypoints}
                initialLandmarks={landmarks}
                onWaypointsChange={(pts) => setWaypoints(pts)}
                onLandmarksChange={(lms) => setLandmarks(lms)}
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-4 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                handleCancelEdit();
                setActiveTab('list');
              }}
              className="px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-gray-200 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-sm transition shadow-2xl shadow-[#B68D40]/30 flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              <span>{editingTrailSlug ? 'Update Expedition' : 'Publish Expedition to Platform'}</span>
            </button>
          </div>

        </form>
      )}

      {/* TAB: HIMALAYAN LANDMARKS & POI STUDIO */}
      {activeTab === 'landmarks' && (
        <LandmarkAdminStudio trails={expeditions} />
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
              onClick={() => {
                handleCancelEdit();
                setActiveTab('create');
              }}
              className="px-4 py-2 rounded-xl bg-[#B68D40] text-black font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>New Expedition</span>
            </button>
          </div>

          {loadingExpeditions ? (
            <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#B68D40]" />
              <span>Loading expeditions...</span>
            </div>
          ) : (
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
                        <div>
                          <span>{exp.name}</span>
                          <span className="block text-[10px] text-gray-500 font-mono font-normal">slug: {exp.slug}</span>
                        </div>
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
                        <Link
                          href={`/itinerary/planner?trail=${exp.slug || exp.id}`}
                          className="p-1.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 inline-block align-middle"
                          title="Plan & Customize Route in Itinerary Planner Studio"
                        >
                          <Compass className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleEditExpedition(exp)}
                          className="p-1.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                          title="Edit Expedition"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportJSON(exp)}
                          className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                          title="Export JSON / GPX data"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpedition(exp.slug || exp.id)}
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
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER BOOKINGS */}
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
                    <th className="p-3">Receipt &amp; Ref</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">Party</th>
                    <th className="p-3">Payment Option</th>
                    <th className="p-3">Paid / Remaining</th>
                    <th className="p-3">Total ($)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Clearance &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {bookings.map((booking: any) => {
                    const isDeposit = booking.paymentOption === 'DEPOSIT';
                    const paidAmount = booking.depositAmount ?? (isDeposit ? Math.round(booking.totalPrice * 0.25) : booking.totalPrice);
                    const remaining = booking.remainingBalance ?? (isDeposit ? Math.round(booking.totalPrice - paidAmount) : 0);

                    return (
                      <tr key={booking.id} className="hover:bg-neutral-800/50 transition">
                        <td className="p-3">
                          <span className="font-mono font-bold text-[#B68D40] block">
                            {booking.receiptNumber || 'N/A'}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400">{booking.id}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{booking.fullName}</div>
                          <div className="text-[11px] text-gray-400">{booking.email} • {booking.phone}</div>
                        </td>
                        <td className="p-3 font-medium text-gray-200">{booking.startDate}</td>
                        <td className="p-3">{booking.travelers} {booking.travelers === 1 ? 'Trekker' : 'Trekkers'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isDeposit
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {isDeposit ? 'DEPOSIT (25%)' : 'FULL (100%)'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-emerald-400 font-semibold">${paidAmount.toLocaleString()} paid</div>
                          {remaining > 0 ? (
                            <div className="text-amber-300 text-[11px]">${remaining.toLocaleString()} due</div>
                          ) : (
                            <div className="text-gray-400 text-[10px]">Settled</div>
                          )}
                        </td>
                        <td className="p-3 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>${booking.totalPrice.toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceBooking(booking)}
                              className="p-1 rounded bg-neutral-800 hover:bg-[#B68D40]/20 text-gray-300 hover:text-[#B68D40] transition"
                              title="View itemized invoice breakdown"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
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
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/bookings/${booking.id}/voucher`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-[#B68D40]/10 text-[#B68D40] hover:bg-[#B68D40]/20 border border-[#B68D40]/30 transition"
                              title="View & Print Official Expedition Voucher"
                            >
                              <FileCheck2 className="h-3.5 w-3.5" />
                            </Link>

                            <button
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                              title="Delete Booking"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Selected Booking Invoice Breakdown Modal */}
          {selectedInvoiceBooking && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="max-w-md w-full p-6 rounded-2xl bg-neutral-900 border border-[#B68D40]/40 shadow-2xl space-y-4 text-white">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#B68D40]" />
                    <h3 className="font-bold text-sm">Itemized Invoice Breakdown</h3>
                  </div>
                  <button
                    onClick={() => setSelectedInvoiceBooking(null)}
                    className="p-1 rounded-lg hover:bg-neutral-800 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Receipt Number:</span>
                    <span className="font-mono font-bold text-[#B68D40]">{selectedInvoiceBooking.receiptNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Adventurer:</span>
                    <span className="font-semibold text-white">{selectedInvoiceBooking.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Party Size:</span>
                    <span>{selectedInvoiceBooking.travelers} trekkers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Price:</span>
                    <span>${(selectedInvoiceBooking.basePrice || selectedInvoiceBooking.totalPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Permit Fees (TIMS + Conservation):</span>
                    <span>${(selectedInvoiceBooking.permitFee || (50 * selectedInvoiceBooking.travelers)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nepal VAT (13%):</span>
                    <span>${(selectedInvoiceBooking.taxAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-neutral-800 text-sm">
                    <span>Total Package Price:</span>
                    <span className="text-white">${selectedInvoiceBooking.totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 pt-1">
                    <span>Amount Paid ({selectedInvoiceBooking.paymentOption || 'FULL'}):</span>
                    <span>${(selectedInvoiceBooking.depositAmount || selectedInvoiceBooking.totalPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Remaining Balance:</span>
                    <span>${(selectedInvoiceBooking.remainingBalance || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex justify-end gap-2">
                  <Link
                    href={`/bookings/${selectedInvoiceBooking.id}/voucher`}
                    target="_blank"
                    className="px-4 py-2 rounded-xl bg-[#B68D40] text-black font-bold text-xs flex items-center gap-1.5"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Open Official Voucher
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CUSTOMER INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-[#B68D40]" />
                Customer Trek Inquiries ({inquiries.length})
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Manage expedition customization inquiries, group sizes, and lead follow-ups.
              </p>
            </div>
          </div>

          {loadingInquiries ? (
            <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#B68D40]" />
              <span>Loading inquiries...</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No trek inquiries recorded yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-neutral-950 uppercase tracking-wider text-gray-400 border-b border-neutral-800">
                  <tr>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Trail Target</th>
                    <th className="p-3">Group / Date</th>
                    <th className="p-3">Fitness</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-3">
                        <div className="font-bold text-white">{inq.fullName}</div>
                        <div className="text-[11px] text-gray-400">{inq.email} {inq.phone ? `• ${inq.phone}` : ''}</div>
                        {inq.country && <div className="text-[10px] text-neutral-500">Country: {inq.country}</div>}
                      </td>
                      <td className="p-3 font-semibold text-[#B68D40]">{inq.trailName}</td>
                      <td className="p-3">
                        <div>{inq.groupSize} Trekkers</div>
                        <div className="text-[11px] text-gray-400">{inq.preferredStartDate || 'Flexible date'}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700">
                          {inq.fitnessLevel || 'Standard'}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs text-gray-400 line-clamp-2">
                        {inq.notes || '—'}
                      </td>
                      <td className="p-3">
                        <select
                          value={inq.status}
                          onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-xs font-semibold text-white focus:outline-none focus:border-[#B68D40]"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                          title="Delete Inquiry"
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

      {/* TAB 5: CONTACT INBOX */}
      {activeTab === 'contact' && (
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#B68D40]" />
                Contact Inbox & Messages ({contactMessages.length})
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                General visitor queries, permit clarifications, and partnership messages.
              </p>
            </div>
          </div>

          {loadingContactMessages ? (
            <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#B68D40]" />
              <span>Loading messages...</span>
            </div>
          ) : contactMessages.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No contact messages received.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-neutral-950 uppercase tracking-wider text-gray-400 border-b border-neutral-800">
                  <tr>
                    <th className="p-3">Sender</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Message</th>
                    <th className="p-3">Received At</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {contactMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-neutral-800/50 transition">
                      <td className="p-3">
                        <div className="font-bold text-white">{msg.name}</div>
                        <div className="text-[11px] text-gray-400">{msg.email}</div>
                      </td>
                      <td className="p-3 font-semibold text-[#B68D40]">{msg.subject}</td>
                      <td className="p-3 max-w-sm text-gray-300 leading-relaxed">
                        {msg.message}
                      </td>
                      <td className="p-3 text-gray-400 font-mono text-[11px]">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <select
                          value={msg.status || 'UNREAD'}
                          onChange={(e) => handleUpdateContactStatus(msg.id, e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-xs font-semibold text-white focus:outline-none focus:border-[#B68D40]"
                        >
                          <option value="UNREAD">UNREAD</option>
                          <option value="READ">READ</option>
                          <option value="RESPONDED">RESPONDED</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteContact(msg.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                          title="Delete Message"
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
