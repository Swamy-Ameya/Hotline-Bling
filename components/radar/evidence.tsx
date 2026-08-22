'use client';

/**
 * ============================================================================
 *  EVIDENCE
 * ============================================================================
 *  The part of the screen that answers "why should I believe you".
 *
 *  Three readings, in the order a person actually asks for them:
 *
 *    WHEN   the epi curve. A sharp spike means one sitting; a smeared one means
 *           a continuing exposure like a tank. That is a second, near-
 *           independent line of evidence, which is why the curve is a first-
 *           class figure here and not a decoration in the corner.
 *
 *    WHERE  attack rate per block — cases divided by the number of students
 *           who live there. Five cases in a block of 240 is calmer than three
 *           in a block of 60, and raw counts hide that completely.
 *
 *    WHETHER  the contrast with a count threshold. A dumb system alerts on
 *           seven reports in a block; seven unrelated upsets land in the same
 *           block by chance regularly. Showing both verdicts side by side is
 *           the single most persuasive thing on this page.
 *
 *  Charts are hand-drawn SVG rather than a chart library, because a library's
 *  defaults — rounded bars, blue palette, drop shadows, axis chrome — would
 *  quietly reintroduce the visual language this build spent a day removing.
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { SituationReport } from '@/lib/domain/surveillance';
import type { MapBlock } from '@/components/radar/campus-map';
import { thermalStopFor } from '@/components/thermal';

const BUCKET_HOURS = 6;
const BUCKETS = 12; // 72 hours

/* ------------------------------------------------------------- epi curve -- */

function useEpiCurve(report: SituationReport) {
  return useMemo(() => {
    // Bins are measured back from when the report was generated, not from the
    // wall clock: the server decided what "the last 72 hours" means, and the
    // curve has to agree with the numbers printed beside it.
    const now = +new Date(report.generatedAt);
    const counted = report.recentCases.filter((c) => !c.prompted);
    const bins = Array.from({ length: BUCKETS }, () => ({ doctor: 0, self: 0 }));

    for (const c of counted) {
      const hoursAgo = (now - +new Date(c.onsetAt)) / 3_600_000;
      if (hoursAgo < 0 || hoursAgo > BUCKETS * BUCKET_HOURS) continue;
      const idx = BUCKETS - 1 - Math.floor(hoursAgo / BUCKET_HOURS);
      if (idx < 0 || idx >= BUCKETS) continue;
      if (c.origin === 'doctor') bins[idx].doctor++;
      else bins[idx].self++;
    }

    const totals = bins.map((b) => b.doctor + b.self);
    const peak = Math.max(1, ...totals);

    // Onset spread across the counted cases — the shape verdict in one number.
    const times = counted
      .map((c) => +new Date(c.onsetAt))
      .filter((t) => now - t <= BUCKETS * BUCKET_HOURS * 3_600_000)
      .sort((a, b) => a - b);
    const spreadHours =
      times.length > 1 ? (times[times.length - 1] - times[0]) / 3_600_000 : 0;

    return { bins, totals, peak, spreadHours, n: times.length };
  }, [report]);
}

export function EpiCurve({ report }: { report: SituationReport }) {
  const { bins, totals, peak, spreadHours, n } = useEpiCurve(report);

  const shape =
    n < 3
      ? { label: 'Too few reports to read a shape', detail: 'Nothing to conclude from timing yet.' }
      : spreadHours <= 14
        ? {
            label: 'Sharp — points at one sitting',
            detail:
              'Almost everyone fell ill inside the same short window. That is the signature of a single meal rather than a water supply, which exposes people continuously.',
          }
        : spreadHours >= 30
          ? {
              label: 'Smeared — points at a continuing exposure',
              detail:
                'Onsets are spread across days rather than hours. People are being exposed repeatedly, which fits a tank or a line far better than one sitting.',
            }
          : {
              label: 'Mixed — not decisive on its own',
              detail:
                'The spread sits between the two signatures. Timing alone cannot separate food from water here; the spatial pattern has to carry the call.',
            };

  const W = 640;
  const H = 150;
  const gap = 5;
  const bw = (W - gap * (BUCKETS - 1)) / BUCKETS;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="meta">Onsets · 6-hour bins · last 72 h</span>
        <span className="meta tabular-nums">peak {peak}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H + 22}`} className="mt-3 w-full" role="img" aria-label="Epidemic curve">
        {/* Baseline. Black, 1px, and the only axis chrome on the figure. */}
        <line x1="0" y1={H} x2={W} y2={H} stroke="var(--ink)" strokeWidth="1" />

        {bins.map((b, i) => {
          const total = totals[i];
          const h = (total / peak) * (H - 12);
          const x = i * (bw + gap);
          const stop = thermalStopFor(total / peak);
          const doctorH = total ? (b.doctor / total) * h : 0;

          return (
            <g key={i}>
              {/* self-reported sits underneath, doctor-confirmed on top —
                  weight of evidence reads bottom-up */}
              <rect
                x={x}
                y={H - h}
                width={bw}
                height={h}
                fill={total ? `var(--t${stop}-top)` : 'var(--line-light)'}
              />
              {doctorH > 0 && (
                <rect x={x} y={H - h} width={bw} height={doctorH} fill={`var(--t${stop}-left)`} />
              )}
              {total > 0 && (
                <text
                  x={x + bw / 2}
                  y={H - h - 5}
                  textAnchor="middle"
                  style={{ fontSize: 9, fontWeight: 700, fill: 'var(--ink)' }}
                  className="tabular-nums"
                >
                  {total}
                </text>
              )}
              <text
                x={x + bw / 2}
                y={H + 14}
                textAnchor="middle"
                style={{ fontSize: 8, fill: 'var(--muted)', letterSpacing: '0.06em' }}
              >
                {(BUCKETS - i) * BUCKET_HOURS}h
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex items-center gap-4 border-t border-line-light pt-3">
        <span className="inline-flex items-center gap-1.5 meta">
          <span className="size-2" style={{ background: 'var(--t5-left)' }} /> Doctor
        </span>
        <span className="inline-flex items-center gap-1.5 meta">
          <span className="size-2" style={{ background: 'var(--t5-top)' }} /> Self-reported
        </span>
        <span className="ml-auto meta tabular-nums">spread {Math.round(spreadHours)} h</span>
      </div>

      <p className="mt-4 text-[13px] font-semibold text-ink">{shape.label}</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-ink">{shape.detail}</p>
    </div>
  );
}

/* ----------------------------------------------------------- attack rate -- */

export function AttackRates({
  blocks,
  selectedId,
  onSelect,
}: {
  blocks: MapBlock[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const rows = useMemo(() => {
    const withRate = blocks
      .map((b) => ({
        ...b,
        rate: b.capacity > 0 ? b.cases / b.capacity : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
    const max = Math.max(0.0001, withRate[0]?.rate ?? 0);
    return withRate.slice(0, 8).map((b) => ({ ...b, share: b.rate / max }));
  }, [blocks]);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="meta">Attack rate · reports per 100 residents</span>
        <span className="meta">Top 8 blocks</span>
      </div>

      <div className="mt-3">
        {rows.map((b) => {
          const stop = thermalStopFor(b.share);
          const selected = selectedId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect?.(b.id)}
              className={cn(
                'grid w-full grid-cols-[2.5rem_1fr_3.5rem] items-center gap-3 border-b border-line-light py-2 text-left transition-colors hover:bg-paper-sunk',
                selected && 'bg-paper-sunk',
              )}
            >
              <span
                className={cn(
                  'text-[11px] font-bold tabular-nums',
                  selected ? 'text-ink' : 'text-ink-soft',
                )}
              >
                {b.name}
              </span>
              <span className="relative block h-3 bg-paper-sunk">
                <span
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${Math.max(2, b.share * 100)}%`,
                    background: `var(--t${stop}-top)`,
                  }}
                />
              </span>
              <span className="text-right text-[11px] tabular-nums text-muted-ink">
                {b.cases === 0 ? '—' : (b.rate * 100).toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-muted-ink">
        Rate, never raw count. Five cases in a block of 240 residents is a calmer reading than three
        in a block of 60, and a count on its own hides that completely.
      </p>
    </div>
  );
}

/* ------------------------------------------------------ chance contrast -- */

/**
 * The assertion the whole build exists to make.
 *
 * A count threshold fires on volume alone. We ask whether the cases sit
 * together more tightly than chance would put them, and we say so even when
 * the honest answer is "not enough to act on".
 */
export function ChanceContrast({ report }: { report: SituationReport }) {
  const top = report.hotspots[0];
  const naiveWouldAlert = report.hotspots.some((h) => h.cases >= 5) || report.totalCases >= 8;
  const weAlert = report.overall === 'elevated' || report.overall === 'critical';

  const disagree = naiveWouldAlert !== weAlert;

  return (
    <div className="grid gap-px bg-line-light md:grid-cols-2">
      <div className="bg-paper-bright p-6">
        <div className="meta">Count threshold</div>
        <div
          className={cn(
            'mt-4 display text-[clamp(1.3rem,2.4vw,1.9rem)]',
            naiveWouldAlert ? 'text-muted-ink' : 'text-muted-ink',
          )}
        >
          {naiveWouldAlert ? 'Would alert' : 'Would stay quiet'}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted-ink">
          {naiveWouldAlert
            ? `${report.totalCases} reports campus-wide crosses a fixed threshold, regardless of where or when they happened.`
            : `${report.totalCases} reports is under the threshold, so nothing is examined at all — including anything tightly clustered.`}
        </p>
      </div>

      <div className="bg-paper-bright p-6">
        <div className="meta text-thermal-red">This system</div>
        <div
          className={cn(
            'mt-4 display text-[clamp(1.3rem,2.4vw,1.9rem)]',
            weAlert ? 'text-thermal-red' : 'text-ink',
          )}
        >
          {weAlert ? 'Alerts, with an address' : 'Watches, does not alert'}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted-ink">
          {top
            ? `${top.comparison} Concentrated in ${top.blockName}, which is what separates a cluster from a coincidence.`
            : 'Reports are scattered across blocks, floors and meals — the pattern of ordinary background illness, not of a shared source.'}
        </p>
        {disagree && (
          <p className="mt-4 border-t border-line-light pt-3 text-[12px] font-semibold leading-relaxed text-ink">
            The two disagree right now. That gap is the product.
          </p>
        )}
      </div>
    </div>
  );
}
