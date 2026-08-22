'use client';

/**
 * The student's pool view.
 *
 * A "pool" is the symptom family a report was grouped into — gastro,
 * respiratory, fever. Grouping matters because a stomach cluster and a cough
 * cluster in the same block are two different problems with two different
 * causes, and averaging them hides both.
 *
 * The spread grid shows levels, never counts, for the same reason the home
 * screen does: a number beside a floor in a hostel this size names a person.
 */

import React from 'react';
import Link from 'next/link';
import { EmptyState, NeuButton } from '@/components/neu';
import { RISK_STOP } from '@/components/thermal';
import { POOLS } from '@/lib/domain/pools';
import type { StudentView } from '@/lib/domain/student-view';
import { timeAgo } from '@/lib/format';

const LEVEL_WORD = {
  critical: 'Concentrated',
  elevated: 'Moderate',
  watch: 'Low',
  normal: 'Calm',
} as const;

export function StudentPoolClient({ view }: { view: StudentView }) {
  const { myPool, poolHeat, myReports } = view;

  if (!myPool || !poolHeat) {
    return (
      <div className="animate-rise">
        <EmptyState
          title="No pool yet"
          body="File a symptom report and it gets grouped into a pool — gastro, respiratory, fever — which unlocks the campus spread view for that pool."
        />
        <div className="mt-5 flex justify-center">
          <Link href="/app/report">
            <NeuButton variant="primary">Report symptoms</NeuButton>
          </Link>
        </div>
      </div>
    );
  }

  const pool = POOLS[myPool];
  const latest = myReports[0];

  return (
    <div className="animate-rise">
      {/* ── pool identity ─────────────────────────────────────────────── */}
      <div className="border-b border-ink pb-4">
        <span className="eyebrow">Your pool</span>
        <h1 className="mt-2 display text-[clamp(1.5rem,7vw,2rem)] text-ink">{pool.label}</h1>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted-ink">{pool.blurb}</p>
      </div>

      {latest && (
        <div className="flex items-center justify-between border-b border-line-light py-3">
          <span className="text-[12px] text-muted-ink">
            Last reported <strong className="font-semibold text-ink">{timeAgo(latest.reportedAt)}</strong>
          </span>
          <span className="meta tabular-nums">Severity {latest.severity}/5</span>
        </div>
      )}

      {/* ── spread ────────────────────────────────────────────────────── */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between border-b border-line-light pb-2">
          <span className="eyebrow">Campus spread</span>
          <span className="meta">{pool.label}</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-px bg-line-light sm:grid-cols-5">
          {poolHeat.map((b) => {
            const stop = RISK_STOP[b.level];
            const hot = b.level !== 'normal';
            return (
              <div
                key={b.blockId}
                className="px-2 py-3 text-center"
                style={{
                  background: hot ? `var(--t${stop}-top)` : 'var(--paper-bright)',
                  color: stop >= 5 ? '#FFFFFF' : 'var(--ink)',
                }}
              >
                <div className="text-[12px] font-bold">{b.name}</div>
                <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] opacity-75">
                  {LEVEL_WORD[b.level]}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div
            className="h-[6px] flex-1"
            style={{
              background:
                'linear-gradient(90deg, var(--t0-top) 0%, var(--t3-top) 40%, var(--t5-top) 72%, var(--t7-top) 100%)',
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between meta">
          <span>Calm</span>
          <span>Concentrated</span>
        </div>
      </section>

      {/* ── care ──────────────────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="border-b border-line-light pb-2">
          <span className="eyebrow">Looking after yourself</span>
        </div>

        {myPool === 'gastro' ? (
          <div className="mt-4">
            {[
              [
                'Hydration first',
                'Oral rehydration salts or electrolyte water, in small sips and often. This matters more than anything else on this list.',
              ],
              [
                'Keep food plain',
                'Curd, khichdi, bananas. Avoid oily or heavy items, and drink only bottled or boiled water until the advisory is lifted.',
              ],
              [
                'When to go in',
                'If it lasts beyond 24 hours, or you cannot keep fluids down, go to the campus health centre rather than waiting it out.',
              ],
            ].map(([t, b]) => (
              <div key={t} className="border-b border-line-light py-3.5">
                <div className="text-[13px] font-semibold text-ink">{t}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-ink">{b}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[13px] leading-relaxed text-muted-ink">
            Rest, stay hydrated, do not share washroom items, and visit the campus health centre if
            fever or difficulty breathing develops.
          </p>
        )}
      </section>
    </div>
  );
}
