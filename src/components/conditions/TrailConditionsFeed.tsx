'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle,
  ThumbsUp, Plus, MapPin, Mountain, Radio, Clock,
  Filter, Sparkles, UserCheck, ShieldCheck, RefreshCw
} from 'lucide-react';
import { TrailConditionReport } from '@/types';
import ReportConditionModal from './ReportConditionModal';

interface TrailConditionsFeedProps {
  trailId?: string;
  trailName?: string;
  compact?: boolean;
}

export default function TrailConditionsFeed({
  trailId,
  trailName,
  compact = false,
}: TrailConditionsFeedProps) {
  const [reports, setReports] = useState<TrailConditionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [upvotingIds, setUpvotingIds] = useState<Record<string, boolean>>({});
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const url = trailId ? `/api/conditions?trailId=${encodeURIComponent(trailId)}` : '/api/conditions';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Failed to load trail conditions:', err);
    } finally {
      setLoading(false);
    }
  }, [trailId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpvote = async (id: string) => {
    if (upvotingIds[id] || upvotedIds[id]) return;

    setUpvotingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/conditions/${id}/upvote`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUpvotedIds((prev) => ({ ...prev, [id]: true }));
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, upvotes: data.upvotes } : r))
        );
      }
    } catch (err) {
      console.error('Error upvoting report:', err);
    } finally {
      setUpvotingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredReports = reports.filter((r) => {
    if (selectedStatus === 'ALL') return true;
    return r.statusLevel === selectedStatus;
  });

  const getStatusBadge = (level: string) => {
    switch (level) {
      case 'CLEAR_PASSABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Clear &amp; Passable
          </span>
        );
      case 'CAUTION_HAZARD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Caution &amp; Advisory
          </span>
        );
      case 'BLOCKED_IMPASSABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Hazard / Impassable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            {level}
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    if (role.includes('Sherpa') || role.includes('Guide')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#B68D40]/20 text-[#E2C085] border border-[#B68D40]/40">
          <ShieldCheck className="w-3 h-3 text-[#B68D40]" /> {role}
        </span>
      );
    }
    if (role.includes('Lodge')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          <UserCheck className="w-3 h-3 text-cyan-400" /> {role}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        {role}
      </span>
    );
  };

  return (
    <div
      data-slot="base"
      className="p-5 sm:p-6 rounded-3xl backdrop-blur-xl bg-slate-900/70 border border-slate-700/50 space-y-5"
    >
      {/* Header section */}
      <div data-slot="header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#B68D40]/20 border border-[#B68D40]/40 flex items-center justify-center text-[#B68D40]">
              <Radio className="w-4 h-4 text-[#B68D40] animate-pulse" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              Live Field Conditions &amp; Trail Reports
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time high-pass snow advisories, glacial bridges, and teahouse capacities broadcast by Sherpa guides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchReports}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition focus-visible:ring-2 focus-visible:ring-[#B68D40]"
            title="Refresh conditions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#B68D40]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            data-slot="trigger"
            className="px-4 py-2.5 rounded-xl bg-[#B68D40] hover:bg-[#c99e4b] text-black font-extrabold text-xs flex items-center gap-1.5 transition shadow-lg shadow-[#B68D40]/20 focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Report Condition</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
        {[
          { key: 'ALL', label: `All Reports (${reports.length})` },
          { key: 'CLEAR_PASSABLE', label: '🟢 Clear & Passable' },
          { key: 'CAUTION_HAZARD', label: '🟡 Caution & Advisory' },
          { key: 'BLOCKED_IMPASSABLE', label: '🔴 Hazard / Blocked' },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setSelectedStatus(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedStatus === f.key
                ? 'bg-[#B68D40] text-black shadow-md'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed Body */}
      <div data-slot="body" className="space-y-3.5">
        {loading && reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Radio className="w-6 h-6 mx-auto mb-2 text-[#B68D40] animate-pulse" />
            Receiving telemetry from mountain stations...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
            <p className="text-sm font-bold text-white">No active hazards or reports in this category</p>
            <p className="text-xs text-slate-400">All high passes and river bridges are operating under seasonal normal conditions.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              data-slot="report-card"
              className="p-4 sm:p-5 rounded-2xl backdrop-blur-md bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/40 hover:border-[#B68D40]/40 transition space-y-3"
            >
              {/* Card top row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(report.statusLevel)}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600/40">
                    {report.conditionType}
                  </span>
                  {report.trailName && (
                    <span className="text-[11px] text-[#E2C085] font-semibold hidden sm:inline">
                      • {report.trailName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {new Date(report.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Location & Elevation */}
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <MapPin className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
                <span>{report.locationName}</span>
                {report.elevation > 0 && (
                  <span className="text-slate-400 font-normal">
                    ({report.elevation.toLocaleString()} m)
                  </span>
                )}
              </div>

              {/* Notes */}
              <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed">
                {report.notes}
              </p>

              {/* Gear Callout */}
              {report.gearRecommended && (
                <div className="p-2.5 rounded-xl bg-[#B68D40]/10 border border-[#B68D40]/30 text-xs flex items-start gap-2 text-[#E2C085]">
                  <Sparkles className="w-4 h-4 text-[#B68D40] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-white">Recommended Equipment:</strong>{' '}
                    <span>{report.gearRecommended}</span>
                  </div>
                </div>
              )}

              {/* Card Footer: Reporter and Upvote */}
              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    {report.reporterName}
                  </span>
                  {getRoleBadge(report.reporterRole)}
                </div>

                <button
                  type="button"
                  onClick={() => handleUpvote(report.id)}
                  disabled={upvotedIds[report.id] || upvotingIds[report.id]}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    upvotedIds[report.id]
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/40 focus-visible:ring-2 focus-visible:ring-[#B68D40]'
                  }`}
                  title="Verify as helpful field intelligence"
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${upvotedIds[report.id] ? 'fill-emerald-300' : ''}`} />
                  <span>Helpful ({report.upvotes})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Modal */}
      <ReportConditionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTrailId={trailId}
        defaultTrailName={trailName}
        onSuccess={(newReport) => {
          setReports((prev) => [newReport, ...prev]);
        }}
      />
    </div>
  );
}
