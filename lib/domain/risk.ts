/**
 * ============================================================================
 *  RISK CLASSIFICATION
 * ============================================================================
 *  This file decides what a warden sees. It deliberately exposes no p-values,
 *  no likelihood ratios, and no attack rates.
 *
 *  The reasoning behind a flag can be statistical. The OUTPUT has to be a
 *  sentence a hostel warden can act on at 11pm without a statistics degree:
 *  which block, which floor, how bad, how sure we are, and what to check first.
 *
 *  A number nobody can act on is worse than no number at all.
 * ============================================================================
 */

import { WEIGHT } from '@/lib/domain/weighting';

export type RiskLevel = 'normal' | 'watch' | 'elevated' | 'critical';

export type Confidence = 'low' | 'medium' | 'high';

export type LikelySource =
  | 'block_water'
  | 'campus_water'
  | 'mess_food'
  | 'person_to_person'
  | 'unclear';

export const RISK_META: Record<
  RiskLevel,
  { label: string; blurb: string; tone: string; dot: string; ring: string }
> = {
  normal: {
    label: 'Normal',
    blurb: 'Within the usual range for this time of year.',
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-200',
  },
  watch: {
    label: 'Watch',
    blurb: 'Slightly more reports than usual. Worth keeping an eye on.',
    tone: 'text-amber-700 bg-amber-50 border-amber-200',
    dot: 'bg-amber-400',
    ring: 'ring-amber-200',
  },
  elevated: {
    label: 'Elevated',
    blurb: 'Clearly more reports than usual, concentrated in one place.',
    tone: 'text-orange-700 bg-orange-50 border-orange-200',
    dot: 'bg-orange-500',
    ring: 'ring-orange-200',
  },
  critical: {
    label: 'Critical',
    blurb: 'A serious cluster. Act now and notify the health centre.',
    tone: 'text-red-700 bg-red-50 border-red-200',
    dot: 'bg-red-500',
    ring: 'ring-red-200',
  },
};

export const SOURCE_META: Record<LikelySource, { label: string; action: string }> = {
  block_water: {
    label: 'Block water supply',
    action: 'Test the overhead tank for this block and check when it was last cleaned.',
  },
  campus_water: {
    label: 'Campus water supply',
    action: 'Escalate to the central RO plant — more than one block is affected.',
  },
  mess_food: {
    label: 'A mess meal',
    action: 'Check the kitchen and the menu for the suspected meal window.',
  },
  person_to_person: {
    label: 'Spreading between students',
    action: 'Likely contact spread on one floor. Check shared washrooms and advise hygiene.',
  },
  unclear: {
    label: 'Not established yet',
    action: 'Not enough information yet. Keep monitoring and follow up on new reports.',
  },
};

/* ------------------------------------------------------------ inputs ----- */

export interface ClusterSignal {
  /** Confirmed + self-reported raw whole-person count. */
  cases: number;
  /** Raw whole cases count. */
  rawCases?: number;
  /** Weighted case total (doctor 1.0, self 0.4). */
  weightedCases?: number;
  /** What this location normally sees over the same window. */
  usual: number;
  /** How many were seen and recorded by a doctor rather than self-reported. */
  doctorConfirmed: number;
  /** Distinct floors involved. 1 means tightly localised. */
  floorsAffected: number;
  /** Distinct blocks involved. >1 rules a single block tank out. */
  blocksAffected: number;
  /** Whether students who don't live on campus (day scholars) are also ill. */
  dayScholarsAffected: boolean;
  /** Whether most cases share one meal sitting. */
  sharedMeal: boolean;
  /** Hours between the first and last reported onset. */
  onsetSpreadHours: number;
  /** 1-5, averaged. */
  avgSeverity: number;
}

export interface RiskAssessment {
  level: RiskLevel;
  confidence: Confidence;
  source: LikelySource;
  /** One plain sentence. This is the headline a warden reads. */
  summary: string;
  /** What to do first. */
  recommendedAction: string;
  /** "12 reports, where we'd normally expect about 3" — no ratios, no p-values. */
  comparison: string;
}

/* -------------------------------------------------------- classification -- */

export function assessRisk(s: ClusterSignal): RiskAssessment {
  const level = classifyLevel(s);
  const source = inferSource(s);
  const confidence = gaugeConfidence(s);

  const rawCount = s.rawCases ?? s.cases;
  const usualRounded = Math.max(1, Math.round(s.usual));
  const comparison =
    rawCount <= usualRounded
      ? `${rawCount} report${rawCount === 1 ? '' : 's'}, which is about normal here.`
      : `${rawCount} reports, where we'd normally expect about ${usualRounded}.`;

  return {
    level,
    confidence,
    source,
    summary: buildSummary(s, level, source),
    recommendedAction: SOURCE_META[source].action,
    comparison,
  };
}

function classifyLevel(s: ClusterSignal): RiskLevel {
  const selfCount = Math.max(0, s.cases - s.doctorConfirmed);
  const weighted = s.weightedCases ?? (s.doctorConfirmed * WEIGHT.doctor + selfCount * WEIGHT.self);
  const excess = weighted - s.usual;

  // Nothing meaningfully above the usual background.
  // The floor of 2.5 weighted cases is deliberate (prevents 2-3 random complaints from triggering).
  if (weighted < 2.5 || excess <= s.usual * 0.75) return 'normal';

  // A few extra reports, but not enough to be sure it isn't a coincidence.
  if (weighted < 4.0 || excess < s.usual * 1.5) return 'watch';

  const severe = s.avgSeverity >= 4;
  const wide = s.blocksAffected > 1 || s.floorsAffected >= 3;
  const big = weighted >= 7.0 || excess >= s.usual * 3;

  if (big && (severe || wide || s.doctorConfirmed >= 3)) return 'critical';
  if (weighted >= 4.0) return 'elevated';
  return 'watch';
}

function inferSource(s: ClusterSignal): LikelySource {
  // Day scholars drink no hostel water at all. If they're ill too, the water
  // supply is essentially ruled out and the shared kitchen is the common factor.
  if (s.dayScholarsAffected && s.sharedMeal) return 'mess_food';

  // A tight onset window pointing at one sitting is the signature of food.
  if (s.sharedMeal && s.onsetSpreadHours <= 14) return 'mess_food';

  // More than one block, and no shared meal, points upstream of the tanks.
  if (s.blocksAffected > 1 && !s.sharedMeal) return 'campus_water';

  // One block, several floors, symptoms dragging on — the block's own tank.
  if (s.blocksAffected === 1 && s.floorsAffected >= 2 && s.onsetSpreadHours > 18) {
    return 'block_water';
  }

  // A single floor with a slow build is usually contact spread, not plumbing:
  // shared washrooms, not a shared tank.
  if (s.floorsAffected === 1 && s.onsetSpreadHours > 24) return 'person_to_person';

  if (s.blocksAffected === 1 && s.cases >= 5) return 'block_water';

  return 'unclear';
}

function gaugeConfidence(s: ClusterSignal): Confidence {
  let score = 0;

  // A doctor who examined the patient is worth more than a form on a phone.
  if (s.doctorConfirmed >= 4) score += 2;
  else if (s.doctorConfirmed >= 2) score += 1;

  // Volume.
  if (s.cases >= 10) score += 2;
  else if (s.cases >= 5) score += 1;

  // A clear pattern in space or time.
  if (s.floorsAffected === 1 || s.sharedMeal) score += 1;
  if (s.onsetSpreadHours <= 12 || s.onsetSpreadHours >= 36) score += 1;

  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function buildSummary(s: ClusterSignal, level: RiskLevel, source: LikelySource): string {
  if (level === 'normal') {
    return 'Nothing unusual here right now.';
  }

  const rawCount = s.rawCases ?? s.cases;
  const where =
    s.blocksAffected > 1
      ? `${s.blocksAffected} blocks`
      : s.floorsAffected > 1
        ? `${s.floorsAffected} floors of the same block`
        : 'one floor';

  const timing =
    s.onsetSpreadHours <= 12
      ? 'Almost everyone fell ill within the same few hours'
      : s.onsetSpreadHours <= 24
        ? 'Cases appeared over about a day'
        : 'Cases have been trickling in over several days';

  const cause = {
    mess_food: 'which usually means a single meal rather than the water',
    block_water: "which fits this block's own water supply",
    campus_water: 'which is too widespread to be any single tank',
    person_to_person: 'which looks more like it is passing between students',
    unclear: 'though it is too early to say what is behind it',
  }[source];

  return `${rawCount} students across ${where} have reported symptoms. ${timing}, ${cause}.`;
}

/* ---------------------------------------------------------------- misc --- */

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: 'Low confidence',
  medium: 'Moderate confidence',
  high: 'High confidence',
};

export function riskRank(level: RiskLevel): number {
  return { normal: 0, watch: 1, elevated: 2, critical: 3 }[level];
}
