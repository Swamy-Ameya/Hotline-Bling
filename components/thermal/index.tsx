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

/** Eight stops, cold (0) to ember core (7). */
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
 * `share` is the block's attack rate as a fraction of the campus maximum, so
 * the ramp is always relative — a quiet week does not paint the whole campus
 * cold, and a bad one does not saturate it. Anything at or below zero is t0.
 *
 * Stop 1 is intentionally unreachable from this function. Teal means "below
 * baseline", which is a claim the detection engine makes, not something you
 * can infer from a share of the maximum.
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
 * Risk level anchors. A block whose level is known renders at its anchor
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

/** Hot enough to earn a rim, a glow, and a place in the ranked list. */
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
 * The five-bucket Tailwind ramp from CLAUDE.md §11, preserved verbatim.
 *
 * Kept because it is the agreed contract for flat surfaces — table cells,
 * floor matrices, list rows. The eight-stop oklch ramp above is for extruded
 * geometry, where you need face separation this cannot give you.
 */
export function heatClass(share: number): string {
  if (!Number.isFinite(share) || share <= 0) return 'bg-zinc-100 dark:bg-zinc-800';
  if (share <= 0.25) return 'bg-amber-100 dark:bg-amber-950';
  if (share <= 0.5) return 'bg-amber-300 dark:bg-amber-800';
  if (share <= 0.75) return 'bg-orange-400 dark:bg-orange-700';
  return 'bg-red-500 dark:bg-red-600';
}

/* ------------------------------------------------------------ components -- */

/**
 * One extruded block, in isometric projection.
 *
 * `height` is occupancy and `stop` is illness. Keeping those on two separate
 * channels is the whole reason this reads at a glance: a tall cold tower is a
 * big healthy hostel, a short ember one is a small block in trouble, and you
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
      {/* left face — in shadow */}
      <polygon
        points={`${x - w},${y + h} ${x},${y + 2 * h} ${x},${y + 2 * h - d} ${x - w},${y + h - d}`}
        fill={f.left}
      />
      {/* right face — turned away */}
      <polygon
        points={`${x + w},${y + h} ${x},${y + 2 * h} ${x},${y + 2 * h - d} ${x + w},${y + h - d}`}
        fill={f.right}
      />
      {/* top face — lit */}
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
      <div className="flex items-center gap-1.5">
        {([0, 2, 3, 4, 5, 6, 7] as ThermalStop[]).map((s) => (
          <span
            key={s}
            className="size-3 rounded-[3px]"
            style={{ background: `var(--t${s}-top)` }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
        {marks.map((m) => (
          <span key={m.stop} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: `var(--t${m.stop}-top)` }} />
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
    <p className={cn('text-[11px] leading-relaxed text-slate-500', className)}>
      Height is how many students live there. Colour is how many are ill.
    </p>
  );
}
