'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Heart, MessageSquare, ArrowRight, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { Story } from '@/types';

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [likingMap, setLikingMap] = useState<Record<string, boolean>>({});

  // Story publishing modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: '',
    authorRole: 'Trekker',
    region: 'Everest',
    trailName: 'Everest Base Camp Trek',
    content: ''
  });

  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/stories');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch stories`);
      const data = await res.json();
      setStories(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to stories database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleLike = async (storyId: string) => {
    if (likingMap[storyId]) return;
    setLikingMap((prev) => ({ ...prev, [storyId]: true }));

    try {
      const res = await fetch(`/api/stories/${storyId}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStories((prev) =>
          prev.map((s) => (s.id === storyId ? { ...s, likes: data.likes } : s))
        );
      }
    } catch (err) {
      console.error('Failed to like story:', err);
    } finally {
      setLikingMap((prev) => ({ ...prev, [storyId]: false }));
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to publish story');
      }

      const newStory = await res.json();
      setStories((prev) => [newStory, ...prev]);
      setIsModalOpen(false);
      setFormData({
        title: '',
        subtitle: '',
        author: '',
        authorRole: 'Trekker',
        region: 'Everest',
        trailName: 'Everest Base Camp Trek',
        content: ''
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error publishing story');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Stories Feature</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Trekker Journals & Himalayan Stories
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Real stories, gear reflections, high-altitude survival logs, and cultural journeys persisted in our database.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-sky-400 shadow-lg shadow-cyan-500/20 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Write Your Story</span>
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-rose-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm font-medium">Loading published trekker journals...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && stories.length > 0 && (
        <>
          {/* Featured Editorial Story Card */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 group min-h-[360px] flex items-end p-8">
            <img
              src={stories[0].coverImage}
              alt={stories[0].title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

            <div className="relative z-10 space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold">
                <span className="bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 rounded-full">{stories[0].region} Region</span>
                <span>•</span>
                <span className="text-slate-300">{stories[0].readTime}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-snug">
                {stories[0].title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                {stories[0].subtitle}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <img src={stories[0].authorAvatar} className="h-7 w-7 rounded-full object-cover border border-slate-700" alt={stories[0].author} />
                  <span className="font-semibold text-white">{stories[0].author}</span>
                  <span className="text-[11px] text-slate-400">• {stories[0].authorRole}</span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <button
                    onClick={() => handleLike(stories[0].id)}
                    disabled={likingMap[stories[0].id]}
                    className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-full border border-rose-500/30 transition cursor-pointer"
                  >
                    <Heart className="h-3.5 w-3.5 fill-rose-400" />
                    <span>{stories[0].likes}</span>
                  </button>
                  <span className="flex items-center gap-1 text-slate-300">
                    <MessageSquare className="h-3.5 w-3.5" /> {stories[0].comments}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.slice(1).map((story) => (
              <div
                key={story.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-rose-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-cyan-400 border border-slate-800">
                      {story.trailName}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{story.date}</span>
                      <span>•</span>
                      <span>{story.readTime}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                      {story.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3">
                      {story.content}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <img src={story.authorAvatar} className="h-6 w-6 rounded-full object-cover border border-slate-700" alt={story.author} />
                      <span className="font-semibold text-slate-200">{story.author}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(story.id)}
                        disabled={likingMap[story.id]}
                        className="flex items-center gap-1 text-rose-400 font-semibold bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/30 transition cursor-pointer"
                      >
                        <Heart className="h-3 w-3 fill-rose-400" />
                        <span>{story.likes}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </>
      )}

      {/* Write Story Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Publish Trekker Journal</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Story Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Crossing Larkya La in Deep Snow"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Subtitle / Summary</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="A short hook describing the experience"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Full Name"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Region</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Everest">Everest</option>
                    <option value="Annapurna">Annapurna</option>
                    <option value="Langtang">Langtang</option>
                    <option value="Manaslu">Manaslu</option>
                    <option value="Mustang">Mustang</option>
                    <option value="Rolwaling">Rolwaling</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Story Journal / Content *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your personal reflections, teahouse memories, altitude challenges, and advice for fellow mountaineers..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 px-3 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{submitting ? 'Publishing...' : 'Publish to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
