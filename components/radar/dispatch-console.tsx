'use client';

/**
 * ============================================================================
 *  DISPATCH CONSOLE
 * ============================================================================
 *  Where a human turns an assessment into an action.
 *
 *  Two things are shown before the button, deliberately and in this order:
 *  the exact supply line being blamed, and the exact number of students who
 *  will receive the message. A warden who can see "112 students on two floors,
 *  not 4,000 across campus" will press it; one who cannot, won't — and an
 *  advisory nobody is willing to send is the same as no system at all.
 *
 *  Nothing on this panel sends anything by itself. See CLAUDE.md §7.
 * ============================================================================
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DispatchPlan } from '@/lib/domain/dispatch';
import { NeuButton, StatusMark } from '@/components/neu';

const ROUTE_META: Record<
  DispatchPlan['route'],
  { label: string; tone: 'critical' | 'watch' | 'neutral'; channel: string }
> = {
  water: {
    label: 'Waterborne route',
    tone: 'critical',
    channel: 'Addressed by floor — only residents of the affected line',
  },
  food: {
    label: 'Foodborne route',
    tone: 'watch',
    channel: 'Addressed by meal scan — only students who ate that sitting',
  },
  unclear: {
    label: 'Source not established',
    tone: 'neutral',
    channel: 'Held at block level until a source is identified',
  },
};

export function DispatchConsole({
  plan,
  clusterId,
  onSent,
}: {
  plan: DispatchPlan;
  clusterId: string;
  onSent?: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [dispatchedMaintenance, setDispatchedMaintenance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = ROUTE_META[plan.route];
  const spared = Math.max(0, plan.campusPopulation - plan.recipients);
  const sharePct = (plan.recipients / Math.max(1, plan.campusPopulation)) * 100;

  async function send() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterId,
          blockId: plan.target.blockId,
          floor: plan.target.floor,
          floors: plan.target.floors,
          mealId: plan.target.mealId,
          title: plan.advisoryTitle,
          body: plan.advisoryBody,
        }),
      });
      if (!res.ok) throw new Error('Send failed');
      setSentAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      onSent?.();
    } catch {
      setError('Could not send. Check the connection and try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border border-line-light bg-paper-bright">
      {/* route header — the only coloured strip on the panel */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 px-5 py-3',
          plan.route === 'water' && 'bg-thermal-red text-white',
          plan.route === 'food' && 'bg-thermal-amber text-ink',
          plan.route === 'unclear' && 'bg-paper-sunk text-ink',
        )}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
          {plan.route === 'unclear' ? '□' : '■'} {meta.label}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-85">
          {meta.channel}
        </span>
      </div>

      {/* the line being blamed */}
      <div className="border-b border-line-light px-5 py-4">
        <div className="meta">Supply line</div>
        <div className="mt-2 text-[15px] font-semibold leading-snug text-ink">
          {plan.supplyLine}
        </div>
        {plan.meal && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-ink">
            <span>{plan.meal.menuItems.join(' · ')}</span>
            <span className="tabular-nums">{plan.meal.attendees} scanned in</span>
          </div>
        )}
      </div>

      {/* who gets it, and who explicitly does not */}
      <div className="grid grid-cols-2 divide-x divide-line-light border-b border-line-light">
        <div className="px-5 py-4">
          <div className="numeral text-[clamp(2rem,4vw,2.8rem)] text-thermal-red">
            {plan.recipients.toLocaleString()}
          </div>
          <div className="mt-2 meta">Students notified</div>
        </div>
        <div className="px-5 py-4">
          <div className="numeral text-[clamp(2rem,4vw,2.8rem)] text-ink">
            {spared.toLocaleString()}
          </div>
          <div className="mt-2 meta">Deliberately not notified</div>
        </div>
      </div>

      {/* the same two numbers as a single bar, because the ratio is the point */}
      <div className="border-b border-line-light px-5 py-3">
        <div className="flex h-2 w-full bg-paper-sunk">
          <div
            className="bg-thermal-red"
            style={{ width: `${Math.max(0.6, sharePct)}%` }}
            title={`${plan.recipients} of ${plan.campusPopulation}`}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-ink">
          {sharePct < 12
            ? `${sharePct.toFixed(1)}% of campus. No campus-wide broadcast, no unaffected mess closed.`
            : `${sharePct.toFixed(1)}% of campus — wide, because the evidence points at something shared.`}
        </p>
      </div>

      {/* work order */}
      <div className="border-b border-line-light px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="meta">Work order</div>
          <StatusMark
            label={dispatchedMaintenance ? 'Dispatched' : 'Ready'}
            tone={dispatchedMaintenance ? 'ok' : 'neutral'}
            square
          />
        </div>
        <div className="mt-2 text-[13px] font-semibold text-ink">{plan.maintenance.target}</div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-ink">
          {plan.maintenance.instruction}
        </p>
        <button
          type="button"
          disabled={dispatchedMaintenance}
          onClick={() => setDispatchedMaintenance(true)}
          className="mt-3 border border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink disabled:opacity-40"
        >
          {dispatchedMaintenance
            ? `Sent to ${plan.maintenance.team}`
            : `Dispatch ${plan.maintenance.team}`}
        </button>
      </div>

      {/* the message itself, verbatim, before it goes anywhere */}
      <div className="px-5 py-4">
        <div className="meta">Advisory · exactly as students will read it</div>
        <div className="mt-2 border-l-2 border-ink pl-3">
          <div className="text-[13px] font-semibold text-ink">{plan.advisoryTitle}</div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">{plan.advisoryBody}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line-light px-5 py-4">
        {sentAt ? (
          <div className="flex items-center gap-2 text-[12px] font-semibold text-ink">
            <span className="inline-block size-2 bg-thermal-red" />
            Sent {sentAt} to {plan.recipients.toLocaleString()} students
          </div>
        ) : (
          <NeuButton variant="critical" disabled={sending} onClick={send}>
            {sending ? 'Sending…' : 'Send advisory'}
          </NeuButton>
        )}
        <span className="text-[11px] text-muted-ink">
          Nothing reaches a student until a person presses this.
        </span>
        {error && <span className="text-[11px] font-semibold text-thermal-red">{error}</span>}
      </div>
    </div>
  );
}
