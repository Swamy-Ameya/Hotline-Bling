'use client';

/**
 * The dashboard.
 *
 * It used to be eleven bordered cards in a three-column grid, all the same
 * size, all shouting equally. This is the same information in five sections
 * that answer, in order: what is happening, where, what to do about it, why we
 * believe it, and what came in.
 *
 * Rules that shaped it: the map is the hero and everything else is quieter;
 * a section is a rule and a heading, not a box; and colour appears only where
 * students are ill.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ConfidencePill,
  EmptyState,
  NeuButton,
  RiskBadge,
  Stat,
  StatusMark,
  timeAgo,
} from '@/components/neu';
import { CampusThermalMap, type MapBlock, type Ground } from '@/components/radar/campus-map';
import { DispatchConsole } from '@/components/radar/dispatch-console';
import { AlertLog } from '@/components/radar/alert-log';
import { AttackRates, ChanceContrast, EpiCurve } from '@/components/radar/evidence';
import { SOURCE_META } from '@/lib/domain/risk';
import type { SituationReport } from '@/lib/domain/surveillance';
import type { DispatchPlan } from '@/lib/domain/dispatch';
import { SYMPTOM_LABEL } from '@/lib/db/types';

export function RadarClient({
  report,
  blocks,
  plans,
}: {
  report: SituationReport;
  blocks: MapBlock[];
  plans: Record<string, DispatchPlan>;
}) {
  const [selected, setSelected] = useState<string | null>(
    report.hotspots[0]?.blockId ?? null,
  );
  const [ground, setGround] = useState<Ground>('satellite');
  // Bumped when an advisory goes out, so the log below re-reads itself and the
  // send visibly lands somewhere rather than just clearing the button.
  const [sendCount, setSendCount] = useState(0);

  const active = useMemo(
    () => report.hotspots.find((h) => h.blockId === selected) ?? report.hotspots[0] ?? null,
    [report.hotspots, selected],
  );
  const plan = active ? plans[active.blockId] : undefined;

  const headlineTone =
    report.overall === 'critical'
      ? 'text-thermal-red'
      : report.overall === 'elevated'
        ? 'text-thermal-orange'
        : 'text-ink';

  return (
    <div className="pb-24">
      {/* ═══ 01 — status ═══════════════════════════════════════════════ */}
      <section className="editorial pt-8">
        <div className="flex items-baseline justify-between gap-4 border-b border-line-light pb-3">
          <span className="eyebrow">01 / Campus status · last 72 hours</span>
          <span className="meta">
            Assessed {new Date(report.generatedAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="grid gap-6 pt-7 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <RiskBadge level={report.overall} pulse />
            <h1
              className={`mt-4 max-w-3xl text-[clamp(1.6rem,3.2vw,2.4rem)] font-bold leading-[1.15] tracking-[-0.03em] ${headlineTone}`}
            >
              {report.headline}
            </h1>
            <p className="mt-3 text-[13px] text-muted-ink">
              Updated {timeAgo(report.generatedAt)} · monitoring{' '}
              <span className="tabular-nums">{report.studentsMonitored.toLocaleString()}</span>{' '}
              students across 19 hostel blocks
            </p>
          </div>

          <div className="flex items-start justify-start gap-2 lg:col-span-4 lg:justify-end">
            <Link href="/doctor">
              <NeuButton>Clinic</NeuButton>
            </Link>
            <Link href="/app/report">
              <NeuButton variant="primary">Report symptoms</NeuButton>
            </Link>
          </div>
        </div>

        {/* Metrics as typography, not as four more cards. */}
        <div className="mt-10 grid grid-cols-2 gap-px border-y border-line-light bg-line-light sm:grid-cols-4">
          {[
            { l: 'Reports', v: report.totalCases, h: 'Last three days', a: undefined },
            { l: 'Seen by a doctor', v: report.doctorConfirmed, h: 'Examined at the health centre', a: undefined },
            { l: 'Self-reported', v: report.selfReported, h: 'Filed from a phone', a: undefined },
            {
              l: 'Blocks flagged',
              v: report.hotspots.length,
              h: report.hotspots.length ? 'Select one on the map' : 'All within normal range',
              a: report.hotspots.length ? 'text-thermal-red' : undefined,
            },
          ].map((s, i) => (
            <div key={s.l} className="bg-paper px-5 py-6">
              <Stat label={s.l} value={s.v} hint={s.h} accent={s.a} delay={i * 60} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 02 — the map ═════════════════════════════════════════════ */}
      <section className="editorial pt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-light pb-3">
          <span className="eyebrow">02 / Where it is concentrating</span>
          <Link href="/admin/map" className="meta transition-colors hover:text-ink">
            Calibrate block positions →
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <CampusThermalMap
              blocks={blocks}
              hotspots={report.hotspots}
              selectedId={selected}
              onSelect={setSelected}
              ground={ground}
              onGroundChange={setGround}
              className="h-[440px] border border-line-light sm:h-[540px]"
            />
            <p className="mt-3 text-[11px] leading-relaxed text-muted-ink">
              Buildings stand where they actually stand, extruded floor by floor. Height is how many
              students live there; colour is how many are ill. Select a block to trace its water and
              food lines.
            </p>
          </div>

          {/* Focus lens: the block under inspection, and what to do about it. */}
          <div className="lg:col-span-4">
            {active ? (
              <div className="border border-line-light bg-paper-bright">
                <div className="flex items-start justify-between gap-3 border-b border-line-light px-5 py-4">
                  <div>
                    <div className="meta">Needs attention</div>
                    <h3 className="mt-1.5 display text-[clamp(1.6rem,3vw,2.1rem)] text-ink">
                      Block {active.blockName}
                    </h3>
                  </div>
                  <RiskBadge level={active.level} pulse />
                </div>

                <div className="border-b border-line-light px-5 py-4">
                  <div className="text-[15px] font-semibold leading-snug tabular-nums text-ink">
                    {active.comparison}
                  </div>
                  <div className="mt-1.5 text-[11px] text-muted-ink">
                    {active.doctorConfirmed} of them were examined at the health centre
                  </div>
                </div>

                <p className="border-b border-line-light px-5 py-4 text-[13px] leading-relaxed text-ink-soft">
                  {active.summary}
                </p>

                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="meta">Most likely cause</span>
                    <ConfidencePill level={active.confidence} />
                  </div>
                  <div className="mt-3 text-[14px] font-semibold text-ink">
                    {SOURCE_META[active.source].label}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-ink">
                    {active.recommendedAction}
                  </p>
                </div>

                <div className="border-t border-line-light px-5 py-3">
                  <Link
                    href={`/radar/${active.blockId}`}
                    className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:text-thermal-red"
                  >
                    Floor-by-floor breakdown →
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Nothing needs attention"
                body="No block is reporting more illness than usual. The map will heat up before anyone has to be told."
              />
            )}
          </div>
        </div>
      </section>

      {/* ═══ 03 — dispatch ════════════════════════════════════════════ */}
      {active && plan && (
        <section className="editorial pt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-light pb-3">
            <span className="eyebrow">03 / Dispatch</span>
            <span className="meta">Surgical, not campus-wide</span>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <DispatchConsole
                plan={plan}
                clusterId={active.blockId}
                onSent={() => setSendCount((n) => n + 1)}
              />
            </div>
            <div className="lg:col-span-4">
              <h3 className="text-[15px] font-semibold text-ink">Why this reaches so few people</h3>
              <p className="mt-3 text-[13px] leading-[1.6] text-muted-ink">
                {plan.route === 'food'
                  ? 'Meal attendance is already a card scan, so the advisory can be addressed to exactly the students who ate that sitting. Everyone who ate elsewhere — including students in the same block — is left alone, and no unaffected mess is closed.'
                  : plan.route === 'water'
                    ? 'The cluster sits inside one block, so the tank and the floors feeding it are the whole exposed population. Students on other floors drink from a different line and get nothing.'
                    : 'No source is established yet, so the advisory stays at block level and says so plainly rather than implying a cause we cannot support.'}
              </p>
              <p className="mt-4 border-t border-line-light pt-4 text-[12px] leading-relaxed text-muted-ink">
                Every advisory sent from here also arms the prompted-report rule: reports filed by
                students who were warned are shown but excluded from the assessment, so a warning
                can never manufacture the evidence for the next one.
              </p>

              <div className="mt-8">
                <AlertLog refreshKey={sendCount} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ 04 — evidence ════════════════════════════════════════════ */}
      <section className="editorial pt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-light pb-3">
          <span className="eyebrow">04 / Evidence</span>
          <span className="meta">Timing · rate · chance</span>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <EpiCurve report={report} />
          </div>
          <div className="lg:col-span-5">
            <AttackRates blocks={blocks} selectedId={selected} onSelect={setSelected} />
          </div>
        </div>

        <div className="mt-12 border-t border-ink pt-8">
          <h3 className="display text-[clamp(1.3rem,2.6vw,2rem)] text-ink">
            Cluster, or coincidence?
          </h3>
          <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-muted-ink">
            The same reports, run through a fixed count threshold and through this system. When the
            two disagree, the disagreement is the whole point.
          </p>
          <div className="mt-6">
            <ChanceContrast report={report} />
          </div>
        </div>
      </section>

      {/* ═══ 05 — log ═════════════════════════════════════════════════ */}
      <section className="editorial pt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-light pb-3">
          <span className="eyebrow">05 / Incoming</span>
          <span className="meta">Newest first</span>
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-12">
          {/* operational log */}
          <div className="min-w-0 lg:col-span-8">
            <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink">
                  {['Time', 'Location', 'Symptoms', 'Source'].map((h) => (
                    <th
                      key={h}
                      className="pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-ink"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.recentCases.slice(0, 14).map((c) => (
                  <tr key={c.id} className="border-b border-line-light">
                    <td className="py-2.5 pr-3 text-[11px] tabular-nums text-muted-ink">
                      {timeAgo(c.onsetAt)}
                    </td>
                    <td className="py-2.5 pr-3 text-[12px] font-medium text-ink">
                      {c.blockName ? `${c.blockName} · Floor ${c.floor}` : 'Day scholar'}
                      {c.prompted && (
                        <span className="ml-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-ink">
                          after advisory
                        </span>
                      )}
                    </td>
                    <td className="max-w-[220px] truncate py-2.5 pr-3 text-[11px] text-muted-ink">
                      {c.symptoms.map((s) => SYMPTOM_LABEL[s]).join(', ')}
                    </td>
                    <td className="py-2.5">
                      <StatusMark
                        label={c.origin === 'doctor' ? 'Verified' : 'Self'}
                        tone={c.origin === 'doctor' ? 'ok' : 'neutral'}
                        square={c.origin === 'doctor'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {report.recentCases.some((c) => c.prompted) && (
              <p className="mt-4 max-w-2xl text-[11px] leading-relaxed text-muted-ink">
                Rows marked <strong className="font-semibold text-ink-soft">after advisory</strong>{' '}
                came from students who had already been warned. They still need care, so they are
                listed — but they are left out of the assessment, because otherwise a warning would
                create the very evidence used to justify the next one.
              </p>
            )}
          </div>

          {/* supply checks — water tests and suspect meals, as one list */}
          <div className="lg:col-span-4">
            <span className="meta">Supply checks</span>

            <div className="mt-4">
              {report.failingWaterSources.length === 0 && report.suspectMeals.length === 0 && (
                <p className="text-[13px] leading-relaxed text-muted-ink">
                  Every tank passed its last test, and no meal stands out. The students who are ill
                  did not eat together any more often than everybody else did.
                </p>
              )}

              {report.failingWaterSources.map((w) => (
                <div key={w.sourceId} className="border-b border-line-light py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-thermal-red">{w.name}</span>
                    <StatusMark label="Failed" tone="critical" square />
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-ink">
                    {w.notes ?? 'Failed its last test.'} · tested {timeAgo(w.testedAt)}
                  </p>
                </div>
              ))}

              {report.suspectMeals.map((m) => (
                <div key={m.mealId} className="border-b border-line-light py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink">{m.label}</span>
                    <StatusMark label="Review" tone="watch" />
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-ink">{m.phrase}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-line">
                    {m.menuItems.join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
