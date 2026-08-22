'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Plus, ShieldAlert, Sparkles, HeartPulse, Droplets } from 'lucide-react';
import { Surface, EmptyState, RiskBadge } from '@/components/neu';
import { POOLS } from '@/lib/domain/pools';
import type { StudentView } from '@/lib/domain/student-view';
import { timeAgo } from '@/lib/format';

export function StudentPoolClient({ view }: { view: StudentView }) {
  const { myPool, poolHeat, myReports } = view;

  if (!myPool || !poolHeat) {
    return (
      <div className="space-y-4 animate-rise">
        <Surface className="p-6">
          <EmptyState
            icon={<Activity className="size-10 text-indigo-400" />}
            title="No Sickness Pool Assigned Yet"
            body="Once you file a symptom report, our clinical system classifies your illness into a sickness pool and unlocks its campus spread view."
          />
          <div className="mt-4 flex justify-center">
            <Link
              href="/app/report"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-all"
            >
              <Plus className="size-4" /> Report symptoms now
            </Link>
          </div>
        </Surface>
      </div>
    );
  }

  const pool = POOLS[myPool];
  const latestReport = myReports[0];

  return (
    <div className="space-y-5 animate-rise">
      {/* Pool Header */}
      <Surface className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="grid size-11 place-items-center rounded-2xl neu-inset text-indigo-600 shrink-0">
              <Activity className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Your Classified Sickness Pool
                </span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
                  Active
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 mt-1">
                {pool.label}
              </h1>
              <p className="text-xs text-slate-500 mt-1">{pool.blurb}</p>
            </div>
          </div>
        </div>

        {latestReport && (
          <div className="mt-4 pt-3.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
            <span>Last reported: <strong>{timeAgo(latestReport.reportedAt)}</strong></span>
            <span className="text-slate-400">Severity {latestReport.severity}/5</span>
          </div>
        )}
      </Surface>

      {/* Pool Spread Across Campus (No raw numbers) */}
      <Surface className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {pool.label} — Campus Spread
            </h2>
            <p className="text-xs text-slate-500">
              Shows relative activity of your illness pool across hostel blocks
            </p>
          </div>
          <Sparkles className="size-4 text-indigo-500" />
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-4">
          {poolHeat.map((b) => (
            <div
              key={b.blockId}
              className={`rounded-xl p-2.5 text-center transition-all ${
                b.level === 'critical'
                  ? 'bg-red-500 text-white font-bold shadow-md'
                  : b.level === 'elevated'
                    ? 'bg-orange-400 text-white font-semibold'
                    : b.level === 'watch'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'neu-inset-sm text-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{b.name}</div>
              <div className="text-[9px] uppercase tracking-tighter opacity-85 mt-0.5">
                {b.level === 'critical' ? 'High' : b.level === 'elevated' ? 'Moderate' : b.level === 'watch' ? 'Low' : 'Calm'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-200/50 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500 inline-block" /> Calm
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-400 inline-block" /> Low activity
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-orange-500 inline-block" /> Moderate spread
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-500 inline-block" /> Concentrated cluster
          </span>
        </div>
      </Surface>

      {/* Care & Health Guidelines for this pool */}
      <Surface className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="size-4 text-rose-500" />
          <h2 className="text-sm font-bold text-slate-800">Student Care Advisory</h2>
        </div>

        {myPool === 'gastro' ? (
          <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <p className="flex items-start gap-2">
              <Droplets className="size-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Hydration is critical:</strong> Take Oral Rehydration Salts (ORS) or electrolyte water frequently in small sips.</span>
            </p>
            <p className="flex items-start gap-2">
              <ShieldAlert className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Avoid heavy, oily, or unboiled items. Stick to curd, khichdi, bananas, and bottled/boiled water.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="size-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
              <span>If symptoms persist beyond 24 hours or include severe dehydration, visit the MUJ Health Centre.</span>
            </p>
          </div>
        ) : (
          <div className="text-xs text-slate-600 leading-relaxed">
            Rest adequately, stay hydrated, avoid sharing personal washroom items, and visit the campus health centre if fever or breathing difficulty develops.
          </div>
        )}
      </Surface>
    </div>
  );
}
