'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { Confidence, RiskLevel } from '@/lib/domain/risk';
import { THERMAL_GLOW } from '@/components/thermal';

// Re-exported so client components can keep importing it from one place.
export { timeAgo, formatDateTime } from '@/lib/format';

/* ------------------------------------------------------------- surfaces -- */

export function Surface({
  children,
  className,
  inset = false,
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
        'rounded-2xl transition-shadow',
        inset ? (small ? 'neu-inset-sm' : 'neu-inset') : small ? 'neu-raised-sm' : 'neu-raised',
        glow && THERMAL_GLOW[glow],
        press && 'neu-press cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- stat -- */

export function Stat({
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
    <Surface
      className={cn('p-5 animate-rise', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div
        className={cn(
          'mt-2 text-4xl font-bold tabular-nums tracking-tight animate-count',
          accent ?? 'text-slate-800',
        )}
        style={{ animationDelay: `${delay + 90}ms` }}
      >
        {value}
      </div>
      {hint && <div className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</div>}
    </Surface>
  );
}

/* ---------------------------------------------------------------- badges -- */

const RISK_STYLE: Record<RiskLevel, { chip: string; dot: string; text: string }> = {
  normal: { chip: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', text: 'Normal' },
  watch: { chip: 'bg-amber-50 text-amber-900 border border-amber-200/60', dot: 'bg-amber-500', text: 'Watch' },
  elevated: { chip: 'bg-orange-50 text-orange-950 border border-orange-200/60', dot: 'bg-orange-500', text: 'Elevated' },
  critical: { chip: 'bg-red-50 text-red-950 border border-red-200/60 font-bold', dot: 'bg-red-600', text: 'Critical' },
};

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
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tabular-nums',
        s.chip,
        className,
      )}
    >
      <span className="relative flex size-2">
        {pulse && level !== 'normal' && (
          <span
            className={cn('absolute inline-flex size-2 rounded-full animate-pulse-ring', s.dot)}
          />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', s.dot)} />
      </span>
      {s.text}
    </span>
  );
}

export function ConfidencePill({ level }: { level: Confidence }) {
  const bars = { low: 1, medium: 2, high: 3 }[level];
  const label = { low: 'Low confidence', medium: 'Moderate confidence', high: 'High confidence' }[level];
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
      <span className="flex items-end gap-[3px]">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'w-[3px] rounded-full transition-colors',
              i === 1 && 'h-2',
              i === 2 && 'h-3',
              i === 3 && 'h-4',
              i <= bars ? 'bg-slate-500' : 'bg-slate-300',
            )}
          />
        ))}
      </span>
      {label}
    </span>
  );
}

/* --------------------------------------------------------------- buttons -- */

export function NeuButton({
  children,
  className,
  variant = 'default',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'ghost' }) {
  return (
    <button
      className={cn(
        'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all neu-press',
        variant === 'primary'
          ? 'bg-slate-800 text-white shadow-[4px_4px_10px_rgba(163,177,198,0.5),-4px_-4px_10px_rgba(255,255,255,0.9)] hover:bg-slate-900'
          : variant === 'ghost'
            ? 'text-slate-500 hover:text-slate-800'
            : 'neu-raised-sm text-slate-700',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- misc -- */

export function SectionTitle({
  children,
  hint,
  action,
}: {
  children: React.ReactNode;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-800">{children}</h2>
        {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700',
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Surface inset className="flex flex-col items-center justify-center px-8 py-14 text-center">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{body}</p>
    </Surface>
  );
}
