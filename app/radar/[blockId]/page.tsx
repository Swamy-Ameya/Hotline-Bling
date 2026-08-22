import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Beaker, Building2, Droplets, Layers, Users, UtensilsCrossed } from 'lucide-react';
import { AppShell } from '@/components/neu/shell';
import { ConfidencePill, RiskBadge, Surface } from '@/components/neu';
import { timeAgo } from '@/lib/format';
import { BLOCKS, blockById, blockCapacity, floorCapacity, messForBlock } from '@/lib/domain/campus';
import { SOURCE_META } from '@/lib/domain/risk';
import { buildSituationReport } from '@/lib/domain/surveillance';
import { getCases, getMealAttendees, getRecentMeals, getWaterTests } from '@/lib/db';
import { getMockDb } from '@/lib/db/mock';
import { SYMPTOM_LABEL } from '@/lib/db/types';
import { heatClass } from '@/components/thermal';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        <Link
          href="/radar"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        {/* header */}
        <Surface glow={hotspot?.level} className="mt-4 p-7 animate-rise">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl neu-inset-sm text-slate-600">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                    Block {block.name}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {block.gender === 'boys' ? "Boys' hostel" : "Girls' hostel"} ·{' '}
                    {blockCapacity(block).toLocaleString()} students · {block.floors} floors · Served by {mess?.name ?? 'Central Mess'}
                  </p>
                </div>
              </div>

              {hotspot ? (
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700">
                  {hotspot.summary}
                </p>
              ) : (
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-500">
                  Nothing unusual in this block right now. {cases.length} report
                  {cases.length === 1 ? '' : 's'} in the last three days, which is within the normal
                  range.
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              <RiskBadge level={hotspot?.level ?? 'normal'} pulse />
              {hotspot && <ConfidencePill level={hotspot.confidence} />}
            </div>
          </div>
        </Surface>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            {/* floors */}
            <Surface className="p-6 animate-rise stagger-1">
              <div className="mb-5 flex items-center gap-2">
                <Layers className="size-4 text-slate-400" />
                <h2 className="text-base font-bold text-slate-800">Floor by floor</h2>
              </div>

              <div className="space-y-3">
                {[...perFloor].reverse().map((f) => {
                  const share = f.cases / peak;
                  return (
                    <div key={f.floor} className="flex items-center gap-4">
                      <span className="w-16 shrink-0 text-sm font-semibold text-slate-600">
                        Floor {f.floor}
                      </span>
                      <div className="h-9 flex-1 overflow-hidden rounded-xl neu-inset-sm p-1">
                        <div
                          className={cn(
                            'flex h-full items-center justify-end rounded-lg px-3 transition-all duration-700 text-xs font-bold shadow-xs',
                            f.cases > 0 ? heatClass(share) : 'bg-slate-100 text-slate-400',
                          )}
                          style={{ width: `${Math.max(10, share * 100)}%` }}
                        >
                          {f.cases > 0 && (
                            <span className={share > 0.5 ? 'text-white' : 'text-slate-800'}>
                              {f.cases}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="w-32 shrink-0 text-right text-xs text-slate-400">
                        {f.cases === 0
                          ? 'no reports'
                          : `${f.doctor} seen by doctor`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 text-xs leading-relaxed text-slate-400">
                Illness spread evenly across every floor points at the block’s shared tank. Illness
                stuck on one floor is more often passing between students through shared washrooms.
              </p>
            </Surface>

            {/* cases */}
            <Surface className="p-6 animate-rise stagger-2">
              <div className="mb-4 flex items-center gap-2">
                <Users className="size-4 text-slate-400" />
                <h2 className="text-base font-bold text-slate-800">
                  Reports ({cases.length})
                </h2>
              </div>

              {cases.length === 0 ? (
                <p className="text-sm text-slate-500">No reports from this block in the last three days.</p>
              ) : (
                <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                  {cases.map((c) => (
                    <li key={c.id}>
                      <Surface inset small className="flex items-start gap-3 px-4 py-3">
                        <span
                          className={`mt-1 size-2 shrink-0 rounded-full ${
                            c.origin === 'doctor' ? 'bg-slate-700' : 'bg-slate-300'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">
                              Floor {c.floor}
                            </span>
                            <span className="text-xs text-slate-400">
                              {c.origin === 'doctor' ? 'Seen at the health centre' : 'Self-reported'}
                            </span>
                            {c.prompted && (
                              <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                after advisory
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-600">
                            {c.symptoms.map((s) => SYMPTOM_LABEL[s]).join(', ')}
                          </div>
                          {c.diagnosis && (
                            <div className="mt-0.5 text-[11px] italic text-slate-400">
                              {c.diagnosis}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {timeAgo(c.onsetAt)}
                        </span>
                      </Surface>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                Room numbers are not shown here. Wardens see the floor; the health centre sees the
                rest.
              </p>
            </Surface>

            {/* 72h mess attendance timeline */}
            {mess && (
              <Surface className="p-6 animate-rise stagger-3">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="size-4 text-slate-400" />
                    <h2 className="text-base font-bold text-slate-800">Mess attendance (72h)</h2>
                  </div>
                  <span className="text-xs text-slate-400">{mess.name}</span>
                </div>

                {recentMeals.length === 0 ? (
                  <p className="text-sm text-slate-500">No meal records found in the last 72 hours.</p>
                ) : (
                  <div className="space-y-3">
                    {recentMeals.map((m) => {
                      const attendeeSet = getMealAttendees(m.id);
                      const count = blockStudents.filter((s) => attendeeSet.has(s.id)).length;
                      const cap = blockCapacity(block);
                      const pct = Math.round((count / cap) * 100);

                      return (
                        <Surface key={m.id} inset small className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-semibold capitalize text-slate-800">
                                {m.mealType}
                              </span>
                              <span className="ml-2 text-xs text-slate-400">
                                {timeAgo(m.opensAt)}
                              </span>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-slate-700">
                              {count} students ({pct}% turnout)
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{m.menuItems.join(' · ')}</p>
                        </Surface>
                      );
                    })}
                  </div>
                )}
              </Surface>
            )}
          </div>

          {/* side panels: water & cause */}
          <div className="space-y-5">
            {/* cause breakdown */}
            {hotspot && (
              <Surface glow={hotspot.level} className="p-6 animate-rise stagger-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-800">Assessment</h2>
                  <ConfidencePill level={hotspot.confidence} />
                </div>

                <div className="mt-4 space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <Droplets className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <div>
                      <strong className="font-semibold text-slate-800">
                        {SOURCE_META[hotspot.source].label}
                      </strong>
                      <p className="mt-0.5 text-slate-500">{hotspot.recommendedAction}</p>
                    </div>
                  </div>
                </div>
              </Surface>
            )}

            {/* water tank status */}
            <Surface className="p-6 animate-rise stagger-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Beaker className="size-4 text-slate-400" />
                  <h2 className="text-base font-bold text-slate-800">Tank test results</h2>
                </div>
                {latest && (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                      latest.passed
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700',
                    )}
                  >
                    {latest.passed ? 'Passed' : 'Failed'}
                  </span>
                )}
              </div>

              {tests.length === 0 ? (
                <p className="text-sm text-slate-500">No test records for this block’s tank.</p>
              ) : (
                <ul className="space-y-2.5">
                  {tests.map((t) => (
                    <li key={t.id}>
                      <Surface inset small className="px-3.5 py-2.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>{t.passed ? 'Passed test' : 'Failed test'}</span>
                          <span className="text-[11px] font-normal text-slate-400">
                            {timeAgo(t.testedAt)}
                          </span>
                        </div>
                        {t.notes && (
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">{t.notes}</p>
                        )}
                        <div className="mt-1.5 flex gap-3 text-[11px] text-slate-400">
                          {t.tds != null && <span>TDS {t.tds} mg/L</span>}
                          {t.chlorine != null && <span>Cl {t.chlorine} mg/L</span>}
                          {t.ph != null && <span>pH {t.ph}</span>}
                        </div>
                      </Surface>
                    </li>
                  ))}
                </ul>
              )}
            </Surface>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
