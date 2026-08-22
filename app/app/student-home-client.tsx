'use client';

/**
 * The student's home screen.
 *
 * A student needs four things and nothing else: whether their own block is
 * fine, whether anything has been sent to them, a way to report in under a
 * minute, and an honest picture of the rest of campus.
 *
 * What they deliberately do not get is case counts per block. A number next to
 * "B1, floor 2" in a hostel of sixty people identifies somebody. Levels are
 * the finest resolution a student view can honestly carry.
 */

import React from 'react';
import Link from 'next/link';
import { RiskBadge } from '@/components/neu';
import { RISK_STOP } from '@/components/thermal';
import type { StudentView } from '@/lib/domain/student-view';
import { POOLS } from '@/lib/domain/pools';

export function StudentHomeClient({ view }: { view: StudentView }) {
  const { student, myBlock, campus, myPool, advisories } = view;
  const unread = advisories.filter((a) => !a.readAt);

  return (
    <div className="animate-rise">
      {/* ── who and where ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 border-b border-line-light pb-5">
        <div>
          <span className="eyebrow">Hostel resident</span>
          <h1 className="mt-1.5 text-[20px] font-bold tracking-[-0.02em] text-ink">
            {student.name}
          </h1>
          <p className="mt-1 text-[11px] text-muted-ink">
            {student.blockName ? `Block ${student.blockName}` : 'Day scholar'}
            {student.floor ? ` · Floor ${student.floor}` : ''}
            {student.room ? ` · Room ${student.room}` : ''}
            {' · '}
            <span className="font-mono">{student.registration}</span>
          </p>
        </div>
        {myBlock && (
          <div className="text-right">
            <span className="meta">Your block</span>
            <div className="mt-1.5">
              <RiskBadge level={myBlock.level} pulse={myBlock.level !== 'normal'} />
            </div>
          </div>
        )}
      </div>

      {/* ── an advisory addressed to you ──────────────────────────────── */}
      {unread.length > 0 && (
        <Link href="/app/alerts" className="mt-5 block">
          <div className="panel-critical px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-85">
              ■ Advisory for you
            </div>
            <div className="mt-2 text-[14px] font-semibold leading-snug">{unread[0].title}</div>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed opacity-90">
              {unread[0].body}
            </p>
            <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em]">
              Read it →
            </div>
          </div>
        </Link>
      )}

      {/* ── the one action ────────────────────────────────────────────── */}
      <Link href="/app/report" className="mt-5 block">
        <div className="flex items-center justify-between gap-4 bg-ink px-5 py-6 text-paper-bright transition-colors hover:bg-ink-soft">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
              Self-report
            </div>
            <div className="mt-2 display text-[clamp(1.3rem,6vw,1.7rem)]">
              Feeling unwell?
            </div>
            <p className="mt-2 max-w-xs text-[12px] leading-relaxed opacity-80">
              Under a minute. Your name never leaves the health centre — the map only ever shows
              your block.
            </p>
          </div>
          <span className="text-[22px] leading-none">→</span>
        </div>
      </Link>

      {/* ── pool ──────────────────────────────────────────────────────── */}
      {myPool && (
        <Link href="/app/pool" className="mt-5 block">
          <div className="flex items-center justify-between border border-line-light bg-paper-bright px-4 py-3.5">
            <div>
              <span className="meta">Your pool</span>
              <div className="mt-1 text-[13px] font-semibold text-ink">{POOLS[myPool].label}</div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-ink">
              Spread →
            </span>
          </div>
        </Link>
      )}

      {/* ── campus, as levels only ────────────────────────────────────── */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between border-b border-ink pb-2">
          <span className="eyebrow">Campus right now</span>
          <span className="meta">Levels only</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-px bg-line-light sm:grid-cols-5">
          {campus.map((b) => {
            const stop = RISK_STOP[b.level];
            const hot = b.level !== 'normal';
            const mine = myBlock?.name === b.name;
            return (
              <div
                key={b.blockId}
                className="relative px-2 py-3 text-center"
                style={{
                  background: hot ? `var(--t${stop}-top)` : 'var(--paper-bright)',
                  color: stop >= 5 ? '#FFFFFF' : 'var(--ink)',
                }}
              >
                {mine && (
                  <span
                    className="absolute inset-0 border-2 border-ink"
                    aria-label="your block"
                  />
                )}
                <div className="text-[12px] font-bold">{b.name}</div>
                <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] opacity-75">
                  {b.level}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-ink">
          Colour is the level, not a count. Your own block is outlined. Numbers are deliberately not
          shown here — in a hostel this size, a case count next to a floor identifies somebody.
        </p>
      </section>
    </div>
  );
}
