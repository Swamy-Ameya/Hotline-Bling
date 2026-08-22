/**
 * ============================================================================
 *  SURVEILLANCE
 * ============================================================================
 *  Reads the database, works out what is happening, and hands the UI something
 *  a human can act on.
 *
 *  What comes out of here contains no statistical vocabulary at all. The UI
 *  should never have to know what a baseline is — it gets "12 reports, where
 *  we'd normally expect about 3", a risk level, and a recommended first action.
 * ============================================================================
 */

import {
  BLOCKS,
  MESSES,
  RO_PLANT,
  blockById,
  blockCapacity,
  floorCapacity,
} from '@/lib/domain/campus';
import {
  assessRisk,
  riskRank,
  type ClusterSignal,
  type Confidence,
  type LikelySource,
  type RiskAssessment,
  type RiskLevel,
} from '@/lib/domain/risk';
import {
  getBlockRollups,
  getCases,
  getDailyCounts,
  getDayScholarCases,
  getLatestWaterTest,
  getMealAttendees,
  getMessEligibleCount,
  getRecentMeals,
  countStudents,
} from '@/lib/db';
import type { CaseView, MessMealRow } from '@/lib/db/types';

export interface Hotspot {
  id: string;
  /** 'B4' or 'B4 · Floor 2' */
  label: string;
  blockId: string;
  blockName: string;
  floor: number | null;
  level: RiskLevel;
  confidence: Confidence;
  source: LikelySource;
  cases: number;
  usual: number;
  doctorConfirmed: number;
  summary: string;
  recommendedAction: string;
  comparison: string;
  /** For the map. */
  lat: number;
  lng: number;
  /** 0..1, for heat intensity. Not shown as a number anywhere. */
  intensity: number;
}

export interface MealSuspicion {
  mealId: string;
  label: string;
  menuItems: string[];
  servedAt: string;
  /** How many of the current cases ate this meal. */
  casesWhoAte: number;
  totalCases: number;
  /** Plain English, e.g. "9 of 12 people who are ill ate this". */
  phrase: string;
  /** Ranked 0..1 internally; never rendered as a number. */
  weight: number;
}

export interface SituationReport {
  generatedAt: string;
  windowHours: number;

  /** Worst risk level anywhere on campus right now. */
  overall: RiskLevel;
  headline: string;

  totalCases: number;
  doctorConfirmed: number;
  selfReported: number;
  dayScholarCases: number;
  studentsMonitored: number;

  hotspots: Hotspot[];
  suspectMeals: MealSuspicion[];
  trend: { date: string; count: number }[];
  recentCases: CaseView[];

  /** Water tests that failed recently, so the dashboard can surface them. */
  failingWaterSources: { sourceId: string; name: string; testedAt: string; notes: string | null }[];
}

const WINDOW_HOURS = 72;

/* --------------------------------------------------------------- helpers -- */

/** What this place normally sees over the same window, from its own history. */
function usualFor(capacity: number, dailyBaselineRate: number): number {
  return Math.max(0.4, capacity * dailyBaselineRate * (WINDOW_HOURS / 24));
}

function baselineRate(): number {
  const daily = getDailyCounts(30);
  // Drop the most recent three days so an outbreak in progress cannot inflate
  // the very baseline it is being measured against.
  const settled = daily.slice(0, Math.max(1, daily.length - 3));
  const avg = settled.reduce((s, d) => s + d.count, 0) / Math.max(1, settled.length);
  return avg / Math.max(1, countStudents());
}

function spreadHours(cases: CaseView[]): number {
  if (cases.length < 2) return 0;
  const times = cases.map((c) => +new Date(c.onsetAt)).sort((a, b) => a - b);
  return (times[times.length - 1] - times[0]) / 3600_000;
}

function avgSeverity(cases: CaseView[]): number {
  if (!cases.length) return 0;
  return cases.reduce((s, c) => s + c.severity, 0) / cases.length;
}

/* ------------------------------------------------------------ meal check -- */

function rankMeals(cases: CaseView[], caseStudentIds: Set<string>): MealSuspicion[] {
  const meals = getRecentMeals(96);
  const out: MealSuspicion[] = [];

  for (const meal of meals) {
    const attendees = getMealAttendees(meal.id);
    if (attendees.size === 0) continue;

    let ate = 0;
    for (const id of caseStudentIds) if (attendees.has(id)) ate++;
    if (ate < 3) continue;

    const share = ate / Math.max(1, caseStudentIds.size);

    /**
     * The comparison that actually matters.
     *
     * "32 of the 46 ill students ate lunch" sounds damning until you notice
     * that three quarters of the whole hostel eats lunch every day. Of course
     * most ill people ate it — most people ate it. On its own that number
     * would send a warden to inspect a perfectly clean kitchen.
     *
     * So we compare against how many students normally turn up to that
     * sitting. A meal is only suspicious when the people who are ill ate it at
     * a noticeably higher rate than everybody else did.
     */
    const eligible = getMessEligibleCount(meal.messId);
    const normalTurnout = eligible > 0 ? attendees.size / eligible : 0;
    if (normalTurnout <= 0) continue;

    const howMuchHigher = share / normalTurnout;
    if (share < 0.6 || howMuchHigher < 1.5) continue;

    const turnoutPct = Math.round(normalTurnout * 100);
    out.push({
      mealId: meal.id,
      label: mealLabel(meal),
      menuItems: meal.menuItems,
      servedAt: meal.opensAt,
      casesWhoAte: ate,
      totalCases: caseStudentIds.size,
      phrase:
        `${ate} of the ${caseStudentIds.size} students who are ill ate this meal, ` +
        `compared with about ${turnoutPct} in 100 students overall`,
      weight: howMuchHigher,
    });
  }

  return out.sort((a, b) => b.weight - a.weight).slice(0, 3);
}

function mealLabel(m: MessMealRow): string {
  const d = new Date(m.opensAt);
  const day = d.toLocaleDateString('en-IN', { weekday: 'long' });
  const mess = MESSES.find((x) => x.id === m.messId)?.name ?? 'Mess';
  return `${day} ${m.mealType} · ${mess}`;
}

/* -------------------------------------------------------------- the scan -- */

export function buildSituationReport(): SituationReport {
  const cases = getCases(WINDOW_HOURS);
  // Reports filed by students we have already alerted are excluded from the
  // assessment. They still appear in the case list — they just cannot vote on
  // whether an outbreak exists.
  const counted = cases.filter((c) => !c.prompted);

  const rate = baselineRate();
  const rollups = getBlockRollups(WINDOW_HOURS);
  const dayScholarCases = getDayScholarCases(WINDOW_HOURS);
  const caseStudentIds = new Set(counted.map((c) => c.studentId));

  const hotspots: Hotspot[] = [];

  for (const r of rollups) {
    const block = blockById(r.blockId);
    if (!block) continue;

    const blockCases = counted.filter((c) => c.blockName === r.blockName);
    if (blockCases.length === 0) continue;

    const floorsHit = new Set(blockCases.map((c) => c.floor).filter(Boolean)).size;
    const blockCaseIds = new Set(blockCases.map((c) => c.studentId));
    const mealsHere = rankMeals(blockCases, blockCaseIds);
    const topMeal = mealsHere[0];

    const signal: ClusterSignal = {
      cases: blockCases.length,
      usual: usualFor(blockCapacity(block), rate),
      doctorConfirmed: blockCases.filter((c) => c.origin === 'doctor').length,
      floorsAffected: Math.max(1, floorsHit),
      blocksAffected: 1,
      dayScholarsAffected: dayScholarCases >= 3,
      sharedMeal: !!topMeal && topMeal.weight >= 0.6,
      onsetSpreadHours: spreadHours(blockCases),
      avgSeverity: avgSeverity(blockCases),
    };

    const assessment = assessRisk(signal);
    if (assessment.level === 'normal') continue;

    hotspots.push({
      id: r.blockId,
      label: r.blockName,
      blockId: r.blockId,
      blockName: r.blockName,
      floor: floorsHit === 1 ? (blockCases[0]?.floor ?? null) : null,
      level: assessment.level,
      confidence: assessment.confidence,
      source: assessment.source,
      cases: signal.cases,
      usual: signal.usual,
      doctorConfirmed: signal.doctorConfirmed,
      summary: assessment.summary,
      recommendedAction: assessment.recommendedAction,
      comparison: assessment.comparison,
      lat: r.lat,
      lng: r.lng,
      intensity: Math.min(1, signal.cases / Math.max(3, signal.usual * 4)),
    });
  }

  hotspots.sort((a, b) => riskRank(b.level) - riskRank(a.level) || b.cases - a.cases);

  const overall: RiskLevel = hotspots.length ? hotspots[0].level : 'normal';
  const suspectMeals = rankMeals(counted, caseStudentIds);

  const failingWaterSources = [RO_PLANT, ...BLOCKS.map((b) => ({ id: b.tankId, name: `${b.name} overhead tank` }))]
    .map((src) => {
      const t = getLatestWaterTest(src.id);
      return t && !t.passed
        ? { sourceId: src.id, name: src.name, testedAt: t.testedAt, notes: t.notes }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    generatedAt: new Date().toISOString(),
    windowHours: WINDOW_HOURS,
    overall,
    headline: buildHeadline(overall, hotspots, counted.length),
    totalCases: counted.length,
    doctorConfirmed: counted.filter((c) => c.origin === 'doctor').length,
    selfReported: counted.filter((c) => c.origin === 'self').length,
    dayScholarCases,
    studentsMonitored: countStudents(),
    hotspots,
    suspectMeals,
    trend: getDailyCounts(30),
    recentCases: cases.slice(0, 60),
    failingWaterSources,
  };
}

function buildHeadline(level: RiskLevel, hotspots: Hotspot[], total: number): string {
  if (level === 'normal' || hotspots.length === 0) {
    return `Nothing unusual across campus. ${total} report${total === 1 ? '' : 's'} in the last three days, which is about normal.`;
  }
  const top = hotspots[0];
  if (level === 'critical') {
    return `${top.blockName} needs attention now — ${top.cases} students ill, well above what this block normally sees.`;
  }
  if (level === 'elevated') {
    return `${top.blockName} is showing more illness than usual. ${top.cases} students affected in the last three days.`;
  }
  return `A few more reports than usual in ${top.blockName}. Worth watching.`;
}

export { riskRank };
export type { RiskLevel, Confidence, LikelySource, RiskAssessment };
