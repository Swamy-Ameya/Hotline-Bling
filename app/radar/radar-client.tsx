'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Beaker,
  CheckCircle2,
  ChevronRight,
  Droplets,
  MapPin,
  Megaphone,
  Stethoscope,
  UtensilsCrossed,
} from 'lucide-react';
import {
  ConfidencePill,
  EmptyState,
  NeuButton,
  RiskBadge,
  SectionTitle,
  Stat,
  Surface,
  timeAgo,
} from '@/components/neu';
import { CampusHeatmap, type HeatBlock } from '@/components/radar/campus-heatmap';
import { SOURCE_META } from '@/lib/domain/risk';
import type { SituationReport } from '@/lib/domain/surveillance';
import { SYMPTOM_LABEL } from '@/lib/db/types';

export function RadarClient({
  report,
  heatBlocks,
}: {
  report: SituationReport;
  heatBlocks: HeatBlock[];
}) {
  const [selected, setSelected] = useState<string | null>(report.hotspots[0]?.blockId ?? null);
  const [sending, setSending] = useState(false);
  const [sentFor, setSentFor] = useState<string[]>([]);

  const active = useMemo(
    () => report.hotspots.find((h) => h.blockId === selected) ?? report.hotspots[0] ?? null,
    [report.hotspots, selected],
  );

  async function sendAdvisory(blockId: string, blockName: string, action: string) {
    setSending(true);
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterId: blockId,
          blockId,
          floor: null,
          title: `Health advisory — Block ${blockName}`,
          body: `We have seen a rise in stomach illness in your block. Until further notice, please use bottled or boiled water. If you feel unwell, visit the campus health centre. ${action}`,
        }),
      });
      setSentFor((s) => [...s, blockId]);
    } finally {
      setSending(false);
    }
  }

  const statusTone =
    report.overall === 'critical'
      ? 'text-red-600'
      : report.overall === 'elevated'
        ? 'text-orange-600'
        : report.overall === 'watch'
          ? 'text-amber-600'
          : 'text-emerald-600';

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-8">
      {/* ── status banner ─────────────────────────────────────────────── */}
      <Surface
        glow={report.overall}
        className="mb-6 overflow-hidden p-7 animate-rise"
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-[280px] flex-1">
            <div className="flex items-center gap-3">
              <RiskBadge level={report.overall} pulse />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Campus status · last 72 hours
              </span>
            </div>
            <h1
              className={`mt-3 text-2xl font-bold leading-snug tracking-tight ${statusTone}`}
            >
              {report.headline}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Updated {timeAgo(report.generatedAt)} · monitoring{' '}
              {report.studentsMonitored.toLocaleString()} students across 19 hostel blocks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/report">
              <NeuButton>Report symptoms</NeuButton>
            </Link>
            <Link href="/doctor">
              <NeuButton variant="primary" className="flex items-center gap-2">
                <Stethoscope className="size-4" />
                Health centre
              </NeuButton>
            </Link>
          </div>
        </div>
      </Surface>

      {/* ── stats ─────────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Students ill"
          value={report.totalCases}
          hint="Reported in the last three days"
          delay={0}
        />
        <Stat
          label="Seen by a doctor"
          value={report.doctorConfirmed}
          hint="Examined at the health centre"
          accent="text-slate-800"
          delay={60}
        />
        <Stat
          label="Self-reported"
          value={report.selfReported}
          hint="Filed from a student's phone"
          delay={120}
        />
        <Stat
          label="Blocks needing attention"
          value={report.hotspots.length}
          hint={report.hotspots.length ? 'Tap a block below' : 'Everything within normal range'}
          accent={report.hotspots.length ? 'text-red-600' : 'text-emerald-600'}
          delay={180}
        />
      </div>

      {/* ── map + detail ──────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Surface className="overflow-hidden p-2 animate-rise stagger-2">
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin className="size-4 text-slate-400" />
              Campus heat map
            </div>
            <span className="text-xs text-slate-400">Height = students · colour = illness</span>
          </div>
          <CampusHeatmap
            blocks={heatBlocks}
            hotspots={report.hotspots}
            selectedId={selected}
            onSelect={setSelected}
            className="h-[440px]"
          />
        </Surface>

        <div className="animate-rise stagger-3">
          {active ? (
            <Surface glow={active.level} className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Needs attention
                  </div>
                  <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
                    Block {active.blockName}
                  </h3>
                </div>
                <RiskBadge level={active.level} pulse />
              </div>

              <Surface inset small className="mt-5 px-4 py-3">
                <div className="text-lg font-semibold tabular-nums text-slate-800">
                  {active.comparison}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {active.doctorConfirmed} of them were examined at the health centre
                </div>
              </Surface>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">{active.summary}</p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Most likely cause
                  </span>
                  <ConfidencePill level={active.confidence} />
                </div>
                <Surface inset small className="flex items-start gap-3 px-4 py-3">
                  <Droplets className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {SOURCE_META[active.source].label}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500">
                      {active.recommendedAction}
                    </div>
                  </div>
                </Surface>
              </div>

              <div className="mt-auto flex gap-2 pt-6">
                {sentFor.includes(active.blockId) ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    Advisory sent to Block {active.blockName}
                  </div>
                ) : (
                  <NeuButton
                    variant="primary"
                    disabled={sending}
                    onClick={() =>
                      sendAdvisory(active.blockId, active.blockName, active.recommendedAction)
                    }
                    className="flex flex-1 items-center justify-center gap-2"
                  >
                    <Megaphone className="size-4" />
                    {sending ? 'Sending…' : 'Send advisory'}
                  </NeuButton>
                )}
                <Link href={`/radar/${active.blockId}`}>
                  <NeuButton className="flex items-center gap-1">
                    Details
                    <ChevronRight className="size-4" />
                  </NeuButton>
                </Link>
              </div>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
                Nothing is sent to students until you press this.
              </p>
            </Surface>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="size-10 text-emerald-500" />}
              title="Nothing needs attention"
              body="No block is reporting more illness than usual right now. The dashboard will flag anything that changes."
            />
          )}
        </div>
      </div>

      {/* ── secondary panels ──────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* water */}
        <Surface className="p-6 animate-rise stagger-4">
          <SectionTitle hint="Latest results from maintenance">Water testing</SectionTitle>
          {report.failingWaterSources.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              All tanks passed their last test
            </div>
          ) : (
            <ul className="space-y-3">
              {report.failingWaterSources.map((w) => (
                <li key={w.sourceId}>
                  <Surface inset small className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                      <Beaker className="size-4" />
                      {w.name}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {w.notes ?? 'Failed its last test.'}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">Tested {timeAgo(w.testedAt)}</p>
                  </Surface>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        {/* meals */}
        <Surface className="p-6 animate-rise stagger-5">
          <SectionTitle hint="Checked against normal turnout">Mess meals</SectionTitle>
          {report.suspectMeals.length === 0 ? (
            <p className="text-sm leading-relaxed text-slate-500">
              No meal stands out. The students who are ill did not eat together any more often than
              everybody else did.
            </p>
          ) : (
            <ul className="space-y-3">
              {report.suspectMeals.map((m) => (
                <li key={m.mealId}>
                  <Surface inset small className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <UtensilsCrossed className="size-4 text-orange-500" />
                      {m.label}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{m.phrase}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400">{m.menuItems.join(' · ')}</p>
                  </Surface>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        {/* recent cases */}
        <Surface className="p-6 animate-rise stagger-6">
          <SectionTitle hint="Newest first">Recent reports</SectionTitle>
          <ul className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {report.recentCases.slice(0, 12).map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60"
              >
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${
                    c.origin === 'doctor' ? 'bg-slate-700' : 'bg-slate-300'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-700">
                      {c.blockName ? `Block ${c.blockName} · Floor ${c.floor}` : 'Day scholar'}
                    </span>
                    {c.prompted && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        after advisory
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {c.symptoms.map((s) => SYMPTOM_LABEL[s]).join(', ')}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(c.onsetAt)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 border-t border-slate-200/70 pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-700" /> Health centre
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-300" /> Self-reported
            </span>
          </div>
        </Surface>
      </div>

      {/* footnote about prompted reports */}
      {report.recentCases.some((c) => c.prompted) && (
        <Surface inset className="mt-6 flex items-start gap-3 px-5 py-4 animate-rise">
          <Activity className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <p className="text-xs leading-relaxed text-slate-500">
            Reports marked <strong className="font-semibold text-slate-600">after advisory</strong>{' '}
            came from students who had already been warned. They are shown here because those
            students still need care, but they are left out of the assessment — otherwise a warning
            would create the very evidence used to justify the next one.
          </p>
        </Surface>
      )}
    </div>
  );
}
