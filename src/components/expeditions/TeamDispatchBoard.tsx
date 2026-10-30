'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  CloudSun,
  ShieldAlert,
  PackageCheck,
  Compass,
  Radio,
  WifiOff,
  Wifi,
  Sparkles,
  AlertTriangle,
  User,
  Clock,
  Tag
} from 'lucide-react';
import { ExpeditionMessage, GroupExpeditionWithDetails, GroupMember } from '@/types';

interface TeamDispatchBoardProps {
  expedition: GroupExpeditionWithDetails;
  activeMember?: GroupMember | null;
  className?: string;
}

export default function TeamDispatchBoard({
  expedition,
  activeMember,
  className = ''
}: TeamDispatchBoardProps) {
  const [messages, setMessages] = useState<ExpeditionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'GENERAL' | 'LOGISTICS' | 'GEAR' | 'URGENT' | 'WEATHER'>('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const localCacheKey = `ht_expedition_messages_${expedition.id}`;

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);

    if (typeof window !== 'undefined') {
      setIsOfflineMode(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Fetch messages with LocalStorage offline caching
  const loadMessages = async () => {
    try {
      // 1. Load from cache first for instant UX
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(localCacheKey);
        if (cached) {
          try {
            setMessages(JSON.parse(cached));
          } catch {
            // ignore
          }
        }
      }

      // 2. Fetch fresh from API
      const res = await fetch(`/api/trips/${expedition.shareToken}/messages`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        if (typeof window !== 'undefined') {
          localStorage.setItem(localCacheKey, JSON.stringify(data.messages));
        }
      }
    } catch (err) {
      console.warn('Network offline or error fetching messages, falling back to cache:', err);
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 12000); // Poll updates periodically
    return () => clearInterval(interval);
  }, [expedition.shareToken, expedition.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Post message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const senderName = activeMember ? activeMember.memberName : expedition.leaderName;
    const senderEmail = activeMember ? activeMember.memberEmail : expedition.leaderEmail;
    const senderRole = activeMember ? activeMember.role : 'LEADER';

    const optimisticMsg: ExpeditionMessage = {
      id: `opt_${Date.now()}`,
      expeditionId: expedition.id,
      senderName,
      senderEmail,
      senderRole: senderRole as any,
      messageText: inputText.trim(),
      category: selectedCategory,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update
    const nextList = [...messages, optimisticMsg];
    setMessages(nextList);
    setInputText('');
    if (typeof window !== 'undefined') {
      localStorage.setItem(localCacheKey, JSON.stringify(nextList));
    }

    try {
      const res = await fetch(`/api/trips/${expedition.shareToken}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName,
          senderEmail,
          senderRole,
          messageText: optimisticMsg.messageText,
          category: selectedCategory
        })
      });

      const data = await res.json();
      if (res.ok && data.message) {
        // Replace optimistic entry with server-confirmed entry
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? data.message : m))
        );
      }
    } catch (err) {
      console.error('Failed to post message online, kept in offline cache:', err);
      setIsOfflineMode(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            URGENT
          </span>
        );
      case 'WEATHER':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <CloudSun className="w-3 h-3 text-sky-300" />
            WEATHER
          </span>
        );
      case 'GEAR':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <PackageCheck className="w-3 h-3 text-purple-300" />
            GEAR
          </span>
        );
      case 'LOGISTICS':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Compass className="w-3 h-3 text-amber-300" />
            LOGISTICS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface/60 text-muted-foreground border border-border/30">
            <Tag className="w-3 h-3" />
            GENERAL
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'LEADER':
        return <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/40">Leader</span>;
      case 'GUIDE':
        return <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Sherpa Guide</span>;
      default:
        return <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">Member</span>;
    }
  };

  return (
    <div
      data-slot="base"
      className={`rounded-2xl border border-border/40 backdrop-blur-xl bg-surface/75 text-surface-foreground p-6 shadow-2xl transition-all ${className}`}
    >
      {/* Header Slot */}
      <div data-slot="header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
            <Radio className="w-4 h-4 text-accent animate-pulse" />
            <span>Encrypted Trail Communications & Dispatch</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Expedition Team Dispatch Board
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time logistical coordination between team members, guides, and leadership with offline PWA synchronization.
          </p>
        </div>

        {/* Network & Offline Status Indicator */}
        <div data-slot="indicator" className="flex items-center gap-2">
          {isOfflineMode ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <WifiOff className="w-3.5 h-3.5" />
              Offline Cache Mode
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Wifi className="w-3.5 h-3.5" />
              Live Mesh Sync
            </span>
          )}
        </div>
      </div>

      {/* Body Slot: Message Timeline */}
      <div data-slot="body" className="py-4">
        <div className="h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-border/40">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Loading team messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
              <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
              <div className="text-sm font-semibold text-white">No messages posted yet</div>
              <p className="text-xs max-w-sm">
                Start the logistics discussion! Coordinate flight times into Lukla, gear packing, or side-trip plans.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = activeMember
                ? msg.senderEmail?.toLowerCase() === activeMember.memberEmail.toLowerCase()
                : msg.senderEmail?.toLowerCase() === expedition.leaderEmail.toLowerCase();

              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrentUser
                      ? 'bg-accent/10 border-accent/30 ml-4 sm:ml-8'
                      : 'bg-surface/50 border-border/30 mr-4 sm:mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-accent" />
                        {msg.senderName}
                      </span>
                      {getRoleBadge(msg.senderRole)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(msg.category)}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-surface-foreground leading-relaxed whitespace-pre-wrap">
                    {msg.messageText}
                  </p>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer Slot: Message Composer */}
      <div data-slot="footer" className="border-t border-border/30 pt-4">
        {/* Category Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-[11px]">
          <span className="text-xs font-bold text-muted-foreground mr-1">Topic:</span>
          {(['GENERAL', 'LOGISTICS', 'GEAR', 'WEATHER', 'URGENT'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${
                selectedCategory === cat
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-surface/60 text-muted-foreground hover:bg-surface/90 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2 mt-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message team as ${activeMember ? activeMember.memberName : expedition.leaderName}...`}
            className="flex-1 bg-surface/80 border border-border/40 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-focus"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-lg disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
