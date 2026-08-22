'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Building, Bell, ShieldCheck, Activity } from 'lucide-react';
import { Surface, RiskBadge } from '@/components/neu';
import type { StudentView } from '@/lib/domain/student-view';
import { POOLS } from '@/lib/domain/pools';

export function StudentHomeClient({ view }: { view: StudentView }) {
  const { student, myBlock, campus, myPool, advisories, myReports } = view;
  const unreadAdvisories = advisories.filter((a) => !a.readAt);

  return (
    <div className="space-y-5 animate-rise">
      {/* Greeting & Block Card */}
      <Surface className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hostel Resident
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 mt-0.5">
              {student.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {student.blockName ? `Block ${student.blockName}` : 'Day Scholar'}
              {student.floor ? ` · Floor ${student.floor}` : ''}
              {student.room ? ` · Room ${student.room}` : ''} · Reg {student.registration}
            </p>
          </div>

          {myBlock && (
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-medium text-slate-400 mb-1">Your Block</span>
              <RiskBadge level={myBlock.level} pulse={myBlock.level !== 'normal'} />
            </div>
          )}
        </div>
      </Surface>

      {/* Advisory Banner (if unread) */}
      {unreadAdvisories.length > 0 && (
        <Link href="/app/alerts">
          <Surface glow="critical" className="p-4 flex items-center justify-between gap-3 bg-red-50/60 border border-red-200">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-red-500 text-white shadow-sm shrink-0">
                <Bell className="size-4 animate-bounce" />
              </span>
              <div>
                <div className="text-xs font-bold text-red-900">
                  {unreadAdvisories[0].title}
                </div>
                <div className="text-[11px] text-red-700 line-clamp-1">
                  {unreadAdvisories[0].body}
                </div>
              </div>
            </div>
            <ArrowRight className="size-4 text-red-600 shrink-0" />
          </Surface>
        </Link>
      )}

      {/* One-Tap Report Symptoms Primary CTA */}
      <Link href="/app/report" className="block group">
        <Surface className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white hover:shadow-xl transition-all neu-press">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-200">
                <Plus className="size-3" /> Quick self-report
              </div>
              <h2 className="text-lg font-bold">Feeling unwell today?</h2>
              <p className="text-xs text-slate-300 max-w-xs">
                Takes under 1 minute. Connects anonymously to hostel health monitoring.
              </p>
            </div>
            <div className="grid size-12 place-items-center rounded-2xl bg-white/10 text-white transition-transform group-hover:translate-x-1">
              <ArrowRight className="size-6" />
            </div>
          </div>
        </Surface>
      </Link>

      {/* Sickness Pool Status */}
      {myPool && (
        <Surface className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl neu-inset-sm text-indigo-600">
                <Activity className="size-5" />
              </span>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Your Classified Pool
                </span>
                <div className="text-sm font-bold text-slate-800">
                  {POOLS[myPool].label}
                </div>
              </div>
            </div>
            <Link
              href="/app/pool"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View Spread Map →
            </Link>
          </div>
        </Surface>
      )}

      {/* Campus Risk Overview (Level Only - No Case Counts) */}
      <Surface className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Campus Status Overview</h2>
            <p className="text-xs text-slate-500">General hostel health indicator (no private case counts)</p>
          </div>
          <ShieldCheck className="size-5 text-slate-400" />
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {campus.map((b) => (
            <div
              key={b.blockId}
              className={`rounded-xl p-2.5 text-center transition-all ${
                b.level === 'critical'
                  ? 'bg-red-500 text-white font-bold shadow-md shadow-red-200'
                  : b.level === 'elevated'
                    ? 'bg-orange-400 text-white font-semibold'
                    : b.level === 'watch'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'neu-inset-sm text-slate-700'
              }`}
            >
              <div className="text-xs font-bold">{b.name}</div>
              <div className="text-[9px] uppercase tracking-tighter opacity-80 mt-0.5">
                {b.level}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-200/50 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500 inline-block" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-400 inline-block" /> Watch
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-orange-500 inline-block" /> Elevated
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-500 inline-block" /> Attention
          </span>
        </div>
      </Surface>
    </div>
  );
}
