import type { ClusterStatus } from '@/lib/types';

/**
 * Returns Tailwind classes for the attack-rate ramp normalized against elevation.maxAttackRate.
 * Strictly adheres to AGENTS.md §11 token specifications.
 */
export function getAttackRateClasses(attackRate: number, maxAttackRate: number): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  if (attackRate <= 0 || maxAttackRate <= 0) {
    return {
      bg: 'bg-zinc-100 dark:bg-zinc-800/80',
      text: 'text-zinc-700 dark:text-zinc-300',
      border: 'border-zinc-200 dark:border-zinc-700/60',
      ring: 'ring-zinc-300 dark:ring-zinc-700',
    };
  }

  const share = attackRate / maxAttackRate;

  if (share <= 0.25) {
    return {
      bg: 'bg-amber-100 dark:bg-amber-950/70',
      text: 'text-amber-900 dark:text-amber-200',
      border: 'border-amber-200 dark:border-amber-900/80',
      ring: 'ring-amber-300 dark:ring-amber-800',
    };
  }

  if (share <= 0.5) {
    return {
      bg: 'bg-amber-300 dark:bg-amber-800',
      text: 'text-amber-950 dark:text-amber-100 font-medium',
      border: 'border-amber-400 dark:border-amber-700',
      ring: 'ring-amber-400 dark:ring-amber-600',
    };
  }

  if (share <= 0.75) {
    return {
      bg: 'bg-orange-400 dark:bg-orange-700',
      text: 'text-white font-medium',
      border: 'border-orange-500 dark:border-orange-600',
      ring: 'ring-orange-500 dark:ring-orange-500',
    };
  }

  return {
    bg: 'bg-red-500 dark:bg-red-600',
    text: 'text-white font-bold',
    border: 'border-red-600 dark:border-red-500',
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
