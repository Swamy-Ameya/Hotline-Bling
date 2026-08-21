import type { ClusterStatus } from '@/lib/types';

/**
 * Returns Tailwind classes for the attack-rate ramp normalized against elevation.maxAttackRate.
 * Strictly adheres to AGENTS.md §11 token specifications.
 */
export function getAttackRateClasses(
  attackRate: number,
  maxAttackRate: number,
  isFlagged = false,
  suppressed = false,
): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  if (attackRate <= 0) {
    return {
      bg: 'bg-zinc-100 dark:bg-zinc-900/80',
      text: 'text-zinc-500 dark:text-zinc-400',
      border: 'border-zinc-200 dark:border-zinc-800',
      ring: 'ring-zinc-300 dark:ring-zinc-700',
    };
  }

  // If node is explicitly flagged by spatial permutation test, highlight it in red
  if (isFlagged) {
    return {
      bg: 'bg-red-600 dark:bg-red-600',
      text: 'text-white font-bold',
      border: 'border-red-700 dark:border-red-500',
      ring: 'ring-red-500 dark:ring-red-400',
    };
  }

  // If suppressed (<3 cases) and not flagged, keep it in calm baseline range
  if (suppressed) {
    return {
      bg: 'bg-zinc-100/90 dark:bg-zinc-900/90',
      text: 'text-zinc-400 dark:text-zinc-400',
      border: 'border-zinc-200 dark:border-zinc-800',
      ring: 'ring-zinc-300 dark:ring-zinc-700',
    };
  }

  const effectiveMax = Math.max(maxAttackRate, 0.20);
  const share = attackRate / effectiveMax;

  if (share <= 0.25 || attackRate < 0.05) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200/60 dark:border-amber-900/50',
      ring: 'ring-amber-300 dark:ring-amber-800',
    };
  }

  if (share <= 0.5) {
    return {
      bg: 'bg-amber-200 dark:bg-amber-900/80',
      text: 'text-amber-950 dark:text-amber-100 font-medium',
      border: 'border-amber-300 dark:border-amber-700',
      ring: 'ring-amber-400 dark:ring-amber-600',
    };
  }

  if (share <= 0.75) {
    return {
      bg: 'bg-orange-500 dark:bg-orange-600',
      text: 'text-white font-medium',
      border: 'border-orange-600 dark:border-orange-500',
      ring: 'ring-orange-500 dark:ring-orange-400',
    };
  }

  return {
    bg: 'bg-red-600 dark:bg-red-600',
    text: 'text-white font-bold',
    border: 'border-red-700 dark:border-red-500',
    ring: 'ring-red-500 dark:ring-red-400',
  };
}

/**
 * Format case count enforcing DPDP Act privacy suppression rule:
 * Suppress cells below 3 cases. When suppressed is true, render "<3".
 */
export function formatCases(count: number, suppressed: boolean): string {
  if (suppressed) {
    return '<3';
  }
  if (count === 0) {
    return '0';
  }
  return Number.isInteger(count) ? count.toString() : count.toFixed(1);
}

/**
 * Format attack rate as human-friendly percentage
 */
export function formatAttackRate(rate: number): string {
  const pct = rate * 100;
  if (pct === 0) return '0.0%';
  if (pct < 0.1) return '<0.1%';
  return `${pct.toFixed(1)}%`;
}

/**
 * Status badge styling adhering to AGENTS.md §11:
 * watch `bg-zinc-200 text-zinc-900` · alert `bg-amber-500 text-white` ·
 * confirmed `bg-red-600 text-white` · resolved `bg-emerald-600 text-white`
 */
export function getStatusBadgeClass(status: ClusterStatus): string {
  switch (status) {
    case 'watch':
      return 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100 border-transparent';
    case 'alert':
      return 'bg-amber-500 text-white border-transparent';
    case 'confirmed':
      return 'bg-red-600 text-white border-transparent';
    case 'resolved':
      return 'bg-emerald-600 text-white border-transparent';
    case 'dismissed':
      return 'bg-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-transparent';
    default:
      return 'bg-zinc-200 text-zinc-900 border-transparent';
  }
}
