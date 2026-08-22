import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/neu/shell';
import { ConfidencePill, RiskBadge, Stat, StatusMark } from '@/components/neu';
import { timeAgo } from '@/lib/format';
import { blockById, blockCapacity, floorCapacity, messForBlock } from '@/lib/domain/campus';
import { SOURCE_META } from '@/lib/domain/risk';
import { buildSituationReport } from '@/lib/domain/surveillance';
import { getCases, getMealAttendees, getRecentMeals, getWaterTests } from '@/lib/db';
import { getMockDb } from '@/lib/db/mock';
import { SYMPTOM_LABEL } from '@/lib/db/types';
import { thermalStopFor } from '@/components/thermal';

export const dynamic = 'force-dynamic';

/**
 * One block, floor by floor.
 *
 * The whole point of this page is the floor column. Illness spread evenly
 * across every floor points at the block's shared tank; illness stuck on one
 * floor is more often passing between students through a shared washroom.
 * Those are different problems with different first actions, and only this
 * view separates them.
 */
export default async function BlockPage({ params }: { params: Promise<{ blockId: string }> }) {
  const { blockId } = await params; // Next 16: params is a Promise
  const block = blockById(blockId);
  if (!block) notFound();

  const report = buildSituationReport();
  const hotspot = report.hotspots.find((h) => h.blockId === blockId) ?? null;
  const cases = getCases(72).filter((c) => c.blockName === block.name);
  const tests = getWaterTests(block.tankId).slice(0, 4);
  const latest = tests[0];

  const mess = messForBlock(block.id);
  const recentMeals = mess
    ? getRecentMeals(72).filter((m) => m.messId === mess.id).slice(0, 6)
    : [];

  const blockStudents = getMockDb().students.filter((s) => s.blockId === block.id);

  const perFloor = Array.from({ length: block.floors }, (_, i) => {
    const floor = i + 1;
    const mine = cases.filter((c) => c.floor === floor);
    return {
      floor,
      cases: mine.length,
      doctor: mine.filter((c) => c.origin === 'doctor').length,
      capacity: floorCapacity(block),
    };
  });

  const peak = Math.max(1, ...perFloor.map((f) => f.cases));
  const doctorCount = cases.filter((c) => c.origin === 'doctor').length;

  return (
    <AppShell>
      <div className="editorial pb-24 pt-8">
        {/* ── header ──────────────────────────────────────────────────── */}
        <div className="flex items-baseline justify-between gap-4 border-b border-line-light pb-3">
          <Link href="/radar" className="meta transition-colors hover:text-ink">
            ← Campus radar
          </Link>
          <span className="meta">
            {block.gender === 'boys' ? "Boys' hostel" : "Girls' hostel"} · Tank {block.tankId.replace('tank-', '')}
          </span>
        </div>

        <div className="grid gap-8 pt-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <RiskBadge level={hotspot?.level ?? 'normal'} pulse />
            <h1 className="mt-4 display text-[clamp(2.4rem,6vw,4rem)] text-ink">
              Block {block.name}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.6] text-ink-soft">
              {hotspot
                ? hotspot.summary
                : `Nothing unusual in this block right now. ${cases.length} report${
                    cases.length === 1 ? '' : 's'
                  } in the last three days, which is within the normal range.`}
            </p>
          </div>

          <div className="lg:col-span-4">
            {hotspot && (
              <div className="border border-line-light bg-paper-bright p-5">
                <div className="flex items-center justify-between">
                  <span className="meta">Assessment</span>
                  <ConfidencePill level={hotspot.confidence} />
                </div>
                <div className="mt-3 text-[14px] font-semibold text-ink">
                  {SOURCE_META[hotspot.source].label}
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted-ink">
                  {hotspot.recommendedAction}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── metrics ─────────────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-2 gap-px border-y border-line-light bg-line-light sm:grid-cols-4">
          {[
            { l: 'Reports · 72 h', v: cases.length },
            { l: 'Seen by a doctor', v: doctorCount },
            { l: 'Residents', v: blockCapacity(block).toLocaleString() },
            { l: 'Floors', v: block.floors },
          ].map((s, i) => (
            <div key={s.l} className="bg-paper px-5 py-6">
              <Stat label={s.l} value={s.v} delay={i * 60} />
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            {/* ── floors ──────────────────────────────────────────────── */}
            <section>
              <div className="flex items-baseline justify-between border-b border-ink pb-2">
                <span className="eyebrow">01 / Floor by floor</span>
                <span className="meta">Reports per floor</span>
              </div>

              <div className="mt-5">
                {[...perFloor].reverse().map((f) => {
                  const share = f.cases / peak;
                  const stop = f.cases > 0 ? thermalStopFor(share) : 0;
                  return (
                    <div
                      key={f.floor}
                      className="grid grid-cols-[4.5rem_1fr_7rem] items-center gap-4 border-b border-line-light py-3"
                    >
                      <span className="text-[12px] font-semibold text-ink">Floor {f.floor}</span>
                      <span className="relative block h-7 bg-paper-sunk">
                        <span
                          className="absolute inset-y-0 left-0 flex items-center justify-end px-2 text-[11px] font-bold"
                          style={{
                            width: `${Math.max(3, share * 100)}%`,
                            background: f.cases > 0 ? `var(--t${stop}-top)` : 'var(--line-light)',
                            color: stop >= 5 ? '#FFFFFF' : 'var(--ink)',
                          }}
                        >
                          {/* Below three, a floor is a person, not a statistic.
                              CLAUDE.md §7 — suppress rather than name. */}
                          {f.cases === 0 ? '' : f.cases < 3 ? '<3' : f.cases}
                        </span>
                      </span>
                      <span className="text-right text-[11px] text-muted-ink">
                        {f.cases === 0 ? 'no reports' : `${f.doctor} seen by doctor`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-muted-ink">
                Illness spread evenly across every floor points at the block&rsquo;s shared tank.
                Illness stuck on one floor is more often passing between students through shared
                washrooms — a different problem, and a different first action.
              </p>
            </section>

            {/* ── reports ─────────────────────────────────────────────── */}
            <section className="mt-14">
              <div className="flex items-baseline justify-between border-b border-ink pb-2">
                <span className="eyebrow">02 / Reports</span>
                <span className="meta tabular-nums">{cases.length} in 72 h</span>
              </div>

              {cases.length === 0 ? (
                <p className="mt-5 text-[13px] text-muted-ink">
                  No reports from this block in the last three days.
                </p>
              ) : (
                <div className="-mx-1 mt-5 overflow-x-auto px-1">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line-light">
                      {['Onset', 'Floor', 'Symptoms', 'Source'].map((h) => (
                        <th key={h} className="pb-2 meta">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cases.slice(0, 20).map((c) => (
                      <tr key={c.id} className="border-b border-line-light">
                        <td className="py-2.5 pr-3 text-[11px] tabular-nums text-muted-ink">
                          {timeAgo(c.onsetAt)}
                        </td>
                        <td className="py-2.5 pr-3 text-[12px] font-medium text-ink">
                          {c.floor}
                          {c.prompted && (
                            <span className="ml-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-ink">
                              after advisory
                            </span>
                          )}
                        </td>
                        <td className="max-w-[240px] truncate py-2.5 pr-3 text-[11px] text-muted-ink">
                          {c.symptoms.map((s) => SYMPTOM_LABEL[s]).join(', ')}
                          {c.diagnosis && (
                            <span className="italic text-line"> · {c.diagnosis}</span>
                          )}
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
              )}

              <p className="mt-4 text-[12px] leading-relaxed text-muted-ink">
                Room numbers are not shown here. Wardens see the floor; the health centre sees the
                rest.
              </p>
            </section>
          </div>

          {/* ── side ──────────────────────────────────────────────────── */}
          <aside className="lg:col-span-4">
            <section>
              <div className="flex items-baseline justify-between border-b border-ink pb-2">
                <span className="eyebrow">Tank tests</span>
                {latest && (
                  <StatusMark
                    label={latest.passed ? 'Passed' : 'Failed'}
                    tone={latest.passed ? 'ok' : 'critical'}
                    square={!latest.passed}
                  />
                )}
              </div>

              {tests.length === 0 ? (
                <p className="mt-4 text-[12px] text-muted-ink">
                  No test records for this block&rsquo;s tank.
                </p>
              ) : (
                <ul className="mt-2">
                  {tests.map((t) => (
                    <li key={t.id} className="border-b border-line-light py-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[12px] font-semibold ${
                            t.passed ? 'text-ink' : 'text-thermal-red'
                          }`}
                        >
                          {t.passed ? 'Passed' : 'Failed'}
                        </span>
                        <span className="meta">{timeAgo(t.testedAt)}</span>
                      </div>
                      {t.notes && (
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-ink">{t.notes}</p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-3 meta">
                        {t.tds != null && <span>TDS {t.tds}</span>}
                        {t.chlorine != null && <span>Cl {t.chlorine}</span>}
                        {t.ph != null && <span>pH {t.ph}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {mess && (
              <section className="mt-12">
                <div className="flex items-baseline justify-between border-b border-ink pb-2">
                  <span className="eyebrow">Mess turnout</span>
                  <span className="meta">{mess.name}</span>
                </div>

                {recentMeals.length === 0 ? (
                  <p className="mt-4 text-[12px] text-muted-ink">
                    No meal records in the last 72 hours.
                  </p>
                ) : (
                  <ul className="mt-2">
                    {recentMeals.map((m) => {
                      const attendeeSet = getMealAttendees(m.id);
                      const count = blockStudents.filter((s) => attendeeSet.has(s.id)).length;
                      const cap = blockCapacity(block);
                      const pct = Math.round((count / cap) * 100);

                      return (
                        <li key={m.id} className="border-b border-line-light py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold capitalize text-ink">
                              {m.mealType}
                            </span>
                            <span className="text-[11px] tabular-nums text-muted-ink">
                              {count} · {pct}%
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[11px] text-muted-ink">
                            {m.menuItems.join(' · ')}
                          </p>
                          <span className="meta">{timeAgo(m.opensAt)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
