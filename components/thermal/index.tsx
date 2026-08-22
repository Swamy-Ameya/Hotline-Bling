/**
 * Thermal primitives.
 *
 * The colour contract lives in app/globals.css as --t0..--t7 face triples.
 * Nothing in this file hardcodes a colour; it only decides WHICH stop a given
 * measurement lands on. That separation is deliberate — retuning the palette
 * must never require touching component logic, and vice versa.
 *
 * Read docs/CLAUDE-DESIGN.md first.
 */
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/domain/risk';

/* ------------------------------------------------------------------ ramp -- */

/** Eight stops, cold (0) to crimson core (7). */
export type ThermalStop = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ThermalFaces {
  /** Lit face — the top of an extruded block. */
  top: string;
  /** Turned away from the light. */
  right: string;
  /** In shadow. */
  left: string;
}

export function thermalFaces(stop: ThermalStop): ThermalFaces {
  return {
    top: `var(--t${stop}-top)`,
    right: `var(--t${stop}-right)`,
    left: `var(--t${stop}-left)`,
  };
}

/**
 * Continuous ramp, for the map only.
 *
 * `share` is the unit's attack rate as a fraction of the campus maximum, so
 * the ramp is always relative — a quiet week does not paint the whole campus
 * cold, and a bad one does not saturate it. Anything at or below zero is t0.
 *
 * Stop 1 is intentionally unreachable from this function. "Below baseline" is
 * a claim the detection engine makes, not something inferable from a share of
 * the maximum.
 */
export function thermalStopFor(share: number): ThermalStop {
  if (!Number.isFinite(share) || share <= 0) return 0;
  if (share <= 0.14) return 2;
  if (share <= 0.30) return 3;
  if (share <= 0.48) return 4;
  if (share <= 0.68) return 5;
  if (share <= 0.86) return 6;
  return 7;
}

/** Explicitly below baseline. Only the engine may assert this. */
export const THERMAL_BELOW_BASELINE: ThermalStop = 1;

/**
 * Risk level anchors. A unit whose level is known renders at its anchor
 * regardless of share, because the level is the considered judgement and the
 * share is only a measurement.
 */
export const RISK_STOP: Record<RiskLevel, ThermalStop> = {
  normal: 0,
  watch: 3,
  elevated: 5,
  critical: 7,
};

export function facesForRisk(level: RiskLevel): ThermalFaces {
  return thermalFaces(RISK_STOP[level]);
}

/** Hot enough to earn a rim, a bloom, and a place in the ranked list. */
export function isHot(level: RiskLevel): boolean {
  return level !== 'normal';
}

export const THERMAL_GLOW: Record<RiskLevel, string> = {
  normal: '',
  watch: 'thermal-glow-watch',
  elevated: 'thermal-glow-elevated',
  critical: 'thermal-glow-critical',
};

/**
 * A flat surface tinted by intensity — table cells, floor matrices, list rows.
 *
 * Returns an inline style rather than a class because the ramp lives in CSS
 * variables now, and a Tailwind palette class would silently drift away from
 * the map that sits three inches above it on the same screen.
 */
export function heatStyle(share: number): React.CSSProperties {
  const stop = thermalStopFor(share);
  return {
    background: `var(--t${stop}-top)`,
    color: stop >= 5 ? '#FFFFFF' : stop === 0 ? 'var(--muted)' : 'var(--ink)',
  };
}

/** Legacy class-based ramp. Prefer `heatStyle`. */
export function heatClass(share: number): string {
  if (!Number.isFinite(share) || share <= 0) return 'bg-paper-sunk text-muted-ink';
  return '';
}

/* ------------------------------------------------------- field geometry -- */

/**
 * Heat radius in px for a given intensity.
 *
 * Deliberately superlinear at the low end and flattening at the top: the
 * difference between "nothing" and "something" has to be visible from across a
 * room, while the difference between bad and worse is carried by colour, not
 * by an ever-expanding blob that would swallow its neighbours.
 */
export function fieldRadius(intensity: number, base = 96): number {
  const t = Math.max(0, Math.min(1, intensity));
  return base * (0.55 + 0.75 * Math.sqrt(t));
}

/**
 * The SVG gradient id for a stop. The map defines one radial gradient per stop
 * once, in <defs>, and every field references it — twenty separate gradient
 * definitions is how an SVG map starts dropping frames on a phone.
 */
export function fieldGradientId(stop: ThermalStop): string {
  return `heat-stop-${stop}`;
}

/* ------------------------------------------------------------ components -- */

/**
 * One extruded block, in isometric projection.
 *
 * `height` is occupancy and `stop` is illness. Keeping those on two separate
 * channels is the whole reason this reads at a glance: a tall cold tower is a
 * big healthy hostel, a short crimson one is a small block in trouble, and you
 * can tell them apart without a legend.
 */
export function ThermalVoxel({
  x,
  y,
  width = 34,
  height,
  stop,
  rim = false,
  label,
}: {
  x: number;
  y: number;
  /** Half-width of the diamond top face. */
  width?: number;
  /** Extrusion in px. Drive this from occupancy, never from case count. */
  height: number;
  stop: ThermalStop;
  rim?: boolean;
  label?: string;
}) {
  const f = thermalFaces(stop);
  const w = width;
  const h = width / 2;
  const d = Math.max(4, height);

  return (
    <g aria-label={label}>
      <polygon
        points={`${x - w},${y + h} ${x},${y + 2 * h} ${x},${y + 2 * h - d} ${x - w},${y + h - d}`}
        fill={f.left}
      />
      <polygon
        points={`${x + w},${y + h} ${x},${y + 2 * h} ${x},${y + 2 * h - d} ${x + w},${y + h - d}`}
        fill={f.right}
      />
      <polygon
        points={`${x},${y - d} ${x + w},${y + h - d} ${x},${y + 2 * h - d} ${x - w},${y + h - d}`}
        fill={f.top}
        stroke={rim ? 'var(--thermal-rim)' : 'transparent'}
        strokeWidth={rim ? 1.25 : 0}
      />
    </g>
  );
}

/**
 * The <defs> block every thermal surface needs: one radial gradient per stop,
 * plus the bloom filter. Drop it once inside an <svg> and reference the ids.
 */
export function ThermalDefs({ blur = 12 }: { blur?: number }) {
  const stops: ThermalStop[] = [2, 3, 4, 5, 6, 7];
  return (
    <defs>
      {stops.map((s) => (
        <radialGradient key={s} id={fieldGradientId(s)}>
          <stop offset="0%" stopColor="var(--thermal-rim)" stopOpacity={s >= 5 ? 0.85 : 0.5} />
          <stop offset="18%" stopColor={`var(--t${s}-top)`} stopOpacity={0.78} />
          <stop offset="46%" stopColor={`var(--t${s}-right)`} stopOpacity={0.44} />
          <stop offset="70%" stopColor={`var(--t${s}-left)`} stopOpacity={0.18} />
          <stop offset="100%" stopColor={`var(--t${s}-left)`} stopOpacity={0} />
        </radialGradient>
      ))}
      <filter id="thermal-bloom" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation={blur} />
      </filter>
      <filter id="thermal-soften" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
    </defs>
  );
}

/**
 * The ramp, explained. Put this next to any thermal surface — an unlabelled
 * heat ramp is decoration, and a warden acting on decoration is the failure
 * mode this product exists to prevent.
 */
export function ThermalLegend({ className }: { className?: string }) {
  const marks: { stop: ThermalStop; label: string }[] = [
    { stop: 0, label: 'Normal' },
    { stop: 3, label: 'Watch' },
    { stop: 5, label: 'Elevated' },
    { stop: 7, label: 'Critical' },
  ];

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-2 sm:hidden">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-ink">
          Low
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-ink">
          High
        </span>
      </div>
      <div
        className="order-first h-[6px] w-24"
        style={{
          background:
            'linear-gradient(90deg, var(--t0-top) 0%, var(--t2-top) 26%, var(--t3-top) 45%, var(--t4-top) 62%, var(--t5-top) 78%, var(--t7-top) 100%)',
        }}
      />
      {/* The four named stops need ~300px. Below that the ramp plus its two
          end labels carries the same meaning in a third of the width. */}
      <div className="hidden items-center gap-3.5 sm:flex">
        {marks.map((m) => (
          <span
            key={m.stop}
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-ink"
          >
            <span className="size-[7px]" style={{ background: `var(--t${m.stop}-top)` }} />
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Height means occupancy, colour means illness. Say so once, near the map.
 */
export function ThermalKeyNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-[11px] leading-relaxed text-muted-ink', className)}>
      Height is how many students live there. Colour is how many are ill.
    </p>
  );
}
