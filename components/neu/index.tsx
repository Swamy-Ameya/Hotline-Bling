'use client';

/**
 * Editorial primitives.
 *
 * Every component in here is intentionally plain. A blank panel is off-white,
 * a thin rule and black type — nothing more. Heat, weight and colour arrive
 * only when a measurement puts them there, which is the entire reason a hot
 * panel is legible at a glance.
 *
 * The file is still called `neu` because nineteen screens import from it. The
 * neumorphism it was named after is gone; see docs/CLAUDE-DESIGN.md.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { Confidence, RiskLevel } from '@/lib/domain/risk';
import { THERMAL_GLOW } from '@/components/thermal';

// Re-exported so client components can keep importing it from one place.
export { timeAgo, formatDateTime } from '@/lib/format';

/* ------------------------------------------------------------- surfaces -- */

/**
 * The one panel. `inset` sinks it into the page, `glow` lets a risk level
 * colour its border — and only its border. A filled red card would flatten the
 * contrast the map depends on.
 */
export function Surface({
  children,
  className,
  inset = false,
  // Accepted and ignored. The old system had two shadow depths; this one has
  // one border. Kept in the signature so the dozen call sites still passing it
  // do not spread `small` onto a DOM node.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  small = false,
  press = false,
  glow,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  inset?: boolean;
  small?: boolean;
  press?: boolean;
  glow?: RiskLevel;
}) {
  return (
    <div
      className={cn(
        inset ? 'panel-sunk' : 'panel',
        glow && THERMAL_GLOW[glow],
        press && 'panel-interactive cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Alias with the name the system actually uses. Prefer this in new code. */
export const Panel = Surface;

/* ------------------------------------------------------------ typography -- */

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('eyebrow', className)}>{children}</div>;
}

export function Meta({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('meta', className)}>{children}</span>;
}

/* ----------------------------------------------------------------- stat -- */

/**
 * A metric rendered as a graphic object: the number is enormous, the label is
 * a whisper underneath it. That ordering is the point — 184 reads before
 * REPORTS does, which is how someone scanning the page actually works.
 */
export function Stat({
  label,
  value,
  hint,
  accent,
  className,
  delay = 0,
  size = 'md',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
  className?: string;
  delay?: number;
  size?: 'md' | 'lg';
}) {
  return (
    <div
      className={cn('animate-rise', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={cn(
          'numeral animate-count',
          size === 'lg' ? 'text-[clamp(3rem,6vw,5rem)]' : 'text-[clamp(2.25rem,4vw,3.25rem)]',
          accent ?? 'text-ink',
        )}
        style={{ animationDelay: `${delay + 80}ms` }}
      >
        {value}
      </div>
      <div className="mt-2.5 eyebrow">{label}</div>
      {hint && (
        <div className="mt-1 max-w-[26ch] text-[12px] leading-snug text-muted-ink">{hint}</div>
      )}
    </div>
  );
}

/** Stat inside a bordered cell, for the metric strip under a map. */
export function StatCell({
  label,
  value,
  hint,
  accent,
  className,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={cn('px-5 py-6 sm:px-6 sm:py-7', className)}>
      <Stat label={label} value={value} hint={hint} accent={accent} delay={delay} />
    </div>
  );
}

/* ---------------------------------------------------------------- status -- */

const RISK_STYLE: Record<RiskLevel, { mark: string; text: string; label: string }> = {
  normal:   { mark: 'bg-line',            text: 'text-ink-soft',        label: 'Normal' },
  watch:    { mark: 'bg-thermal-amber',   text: 'text-ink',             label: 'Watch' },
  elevated: { mark: 'bg-thermal-orange',  text: 'text-thermal-orange',  label: 'Elevated' },
  critical: { mark: 'bg-thermal-red',     text: 'text-thermal-red',     label: 'Critical' },
};

/**
 * A tiny square plus typography. Not a pill — pills read as decoration, and
 * this is the single most consequential word on the screen.
 */
export function RiskBadge({
  level,
  className,
  pulse = false,
}: {
  level: RiskLevel;
  className?: string;
  pulse?: boolean;
}) {
  const s = RISK_STYLE[level];
  const critical = level === 'critical';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]',
        s.text,
        className,
      )}
    >
      <span className="relative flex size-2">
        {pulse && level !== 'normal' && (
          <span className={cn('absolute inline-flex size-2 animate-pulse-ring', s.mark)} />
        )}
        <span
          className={cn('relative inline-flex size-2', s.mark, critical ? '' : 'rounded-none')}
        />
      </span>
      {s.label}
    </span>
  );
}

/** Operational-log status marker: ● ACTIVE / ■ ESCALATED. */
export function StatusMark({
  label,
  tone = 'neutral',
  square = false,
  className,
}: {
  label: string;
  tone?: 'neutral' | 'watch' | 'elevated' | 'critical' | 'ok';
  square?: boolean;
  className?: string;
}) {
  const colour = {
    neutral: 'bg-line',
    ok: 'bg-ink-soft',
    watch: 'bg-thermal-amber',
    elevated: 'bg-thermal-orange',
    critical: 'bg-thermal-red',
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
        tone === 'critical' ? 'text-thermal-red' : 'text-ink-soft',
        className,
      )}
    >
      <span className={cn('inline-block size-[7px]', colour, square ? '' : 'rounded-full')} />
      {label}
    </span>
  );
}

export function ConfidencePill({ level }: { level: Confidence }) {
  const bars = { low: 1, medium: 2, high: 3 }[level];
  const pct = { low: '41%', medium: '68%', high: '89%' }[level];

  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-ink">
      <span className="flex items-end gap-[2px]">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'w-[3px]',
              i === 1 && 'h-1.5',
              i === 2 && 'h-2.5',
              i === 3 && 'h-3.5',
              i <= bars ? 'bg-ink' : 'bg-line-light',
            )}
          />
        ))}
      </span>
      <span className="tabular-nums text-ink">{pct}</span>
      confidence
    </span>
  );
}

/** ● LIVE · LAST SYNC 14:42:08 — the site implying, quietly, that it is awake. */
export function LiveIndicator({
  at,
  className,
}: {
  at?: string | Date;
  className?: string;
}) {
  const stamp = at ? new Date(at) : null;
  const time = stamp
    ? stamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <span className={cn('inline-flex items-center gap-2 meta', className)}>
      <span className="inline-block size-[6px] rounded-full bg-thermal-red live-pulse" />
      Live
      {time && <span className="text-line">·</span>}
      {time && <span className="tabular-nums">{time}</span>}
    </span>
  );
}

/* --------------------------------------------------------------- buttons -- */

/**
 * Square, solid, deliberate. Hover shifts colour and lifts one pixel; nothing
 * floats and nothing casts a shadow.
 */
export function NeuButton({
  children,
  className,
  variant = 'default',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'critical' | 'ghost';
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em]',
        'transition-[background,color,border-color,transform] duration-150 ease-out active:translate-y-px',
        variant === 'primary' &&
          'bg-ink text-paper-bright border border-ink hover:bg-ink-soft hover:border-ink-soft',
        variant === 'critical' &&
          'bg-thermal-red text-white border border-thermal-red hover:brightness-110',
        variant === 'default' &&
          'bg-transparent text-ink border border-line hover:border-ink hover:bg-paper-bright',
        variant === 'ghost' && 'border border-transparent text-muted-ink hover:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export const Button = NeuButton;

/* ----------------------------------------------------------------- misc -- */

export function SectionTitle({
  children,
  hint,
  action,
  className,
}: {
  children: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-ink">
          {children}
        </h2>
        {hint && <p className="mt-1.5 text-[12px] leading-snug text-muted-ink">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** A big editorial section head: 02 / ACTIVE CLUSTERS */
export function SectionHead({
  index,
  title,
  lede,
  className,
}: {
  index: string;
  title: string;
  lede?: string;
  className?: string;
}) {
  return (
    <div className={cn('rule pt-6', className)}>
      <div className="eyebrow">
        {index} / {title}
      </div>
      {lede && (
        <p className="mt-5 max-w-2xl text-[17px] leading-[1.5] text-ink-soft">{lede}</p>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-3.5 animate-spin rounded-full border-[1.5px] border-line-light border-t-ink',
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'panel-sunk flex h-full flex-col items-center justify-center px-8 py-16 text-center',
        className,
      )}
    >
      {icon && <div className="mb-5 text-line">{icon}</div>}
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-ink">{title}</h3>
      <p className="mt-2.5 max-w-sm text-[13px] leading-relaxed text-muted-ink">{body}</p>
    </div>
  );
}

/**
 * The ramp, explained, as a continuous strip rather than a rainbow key. An
 * unlabelled heat ramp is decoration, and a warden acting on decoration is the
 * failure this product exists to prevent.
 */
export function HeatScale({ className }: { className?: string }) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-baseline justify-between meta">
        <span>Low</span>
        <span>Activity</span>
        <span>High</span>
      </div>
      <div
        className="mt-1.5 h-[6px] w-full"
        style={{
          background:
            'linear-gradient(90deg, var(--t0-top) 0%, var(--t2-top) 26%, var(--t3-top) 45%, var(--t4-top) 62%, var(--t5-top) 78%, var(--t7-top) 100%)',
        }}
      />
    </div>
  );
}
