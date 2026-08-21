/**
 * ============================================================================
 *  DETECTION ENGINE
 * ============================================================================
 *  Pure functions over plain arrays. No database handle, no React, no fetch —
 *  which is why `npm run detect:test` can prove the whole thing from a terminal
 *  before any screen exists.
 *
 *  Pipeline:
 *    1. assemble unprompted cases in the window
 *    2. expected counts per node from occupancy x baseline
 *    3. spatial scan  -> Kulldorff LLR per node, take the max
 *    4. permutation   -> is that max any better than chance? THE key step
 *    5. cohort scan   -> 2x2 per meal, relative risk, Fisher exact
 *    6. arbitrate     -> water or food, with the loser kept visible
 *    7. FDR           -> Benjamini-Hochberg, then the watch/alert ladder
 * ============================================================================
 */

import type {
  CampusElevation,
  CaseRow,
  Cluster,
  DetectionResult,
  ElevationBlock,
  ElevationCell,
  ElevationFloor,
  EpiCurve,
  EpiCurveBucket,
  Hypothesis,
  MealAssociation,
  MealMarker,
  PermutationSummary,
  ScenarioId,
} from '@/lib/types';
import { SUPPRESSION_THRESHOLD } from '@/lib/types';
import { mulberry32 } from '@/lib/rng';
import {
  BLOCKS,
  FLOORS,
  HALVES,
  MESS_ID,
  filterId,
  floorId,
  getCampus,
  leafFiltersUnder,
  tankId,
  type Campus,
} from '@/lib/seed/campus';
import type { ReportRecord } from '@/lib/store';
import {
  benjaminiHochberg,
  fisherExact,
  kulldorffLLR,
  median,
  relativeRisk,
  spread80,
} from '@/lib/detect/stats';

const WINDOWS = [48, 72] as const;
const REPLICATES = 999;
const FDR_Q = 0.1;
const BASELINE_LOOKBACK_DAYS = 14;

/** A count threshold this crude is what most systems in this space actually
 *  do, and what we are arguing against. Kept honest and simple on purpose. */
const NAIVE_CASE_THRESHOLD = 5;

export interface EngineInput {
  campus: Campus;
  reports: ReportRecord[];
  scenario: ScenarioId;
  now: Date;
  clusterStatusOverrides?: Record<string, 'confirmed' | 'dismissed' | 'resolved'>;
}

/* --------------------------------------------------------------- cases --- */

function casesInWindow(reports: ReportRecord[], now: Date, hours: number) {
  const cutoff = now.getTime() - hours * 3600_000;
  return reports.filter(
    (r) =>
      r.onsetTime.getTime() >= cutoff &&
      r.onsetTime.getTime() <= now.getTime() &&
      // Reports from students who were already notified are excluded from the
      // statistic. Otherwise an advisory inflates its own evidence.
      r.promptedByAdvisoryId === null,
  );
}

/** Flat per-student-per-day rate estimated from history strictly OUTSIDE the
 *  detection window, so an ongoing outbreak cannot raise its own baseline. */
function estimateBaselineRate(campus: Campus, reports: ReportRecord[], now: Date, windowHours: number) {
  const windowStart = now.getTime() - windowHours * 3600_000;
  const historyStart = now.getTime() - BASELINE_LOOKBACK_DAYS * 86400_000;
  const historical = reports.filter(
    (r) =>
      r.onsetTime.getTime() >= historyStart &&
      r.onsetTime.getTime() < windowStart &&
      r.promptedByAdvisoryId === null,
  );
  const personDays =
    campus.students.length * Math.max(1, BASELINE_LOOKBACK_DAYS - windowHours / 24);
  const weighted = historical.reduce((s, r) => s + r.sourceWeight, 0);
  return Math.max(0.0005, weighted / personDays);
}

/* ------------------------------------------------------- candidate zones -- */

/** Every node worth testing. Filters, floors, tanks, and the mess. We do NOT
 *  test the root: "the whole campus is affected" localises nothing. */
function candidateZones(campus: Campus): string[] {
  const zones: string[] = [MESS_ID];
  for (const b of BLOCKS) {
    zones.push(tankId(b));
    for (const f of FLOORS) {
      zones.push(floorId(b, f));
      for (const h of HALVES) zones.push(filterId(b, f, h));
    }
  }
  return zones;
}

function leafPopulations(campus: Campus): Map<string, number> {
  const m = new Map<string, number>();
  for (const b of BLOCKS)
    for (const f of FLOORS)
      for (const h of HALVES) {
        const id = filterId(b, f, h);
        m.set(id, campus.nodeById.get(id)!.exposedPopulation);
      }
  return m;
}

/* ------------------------------------------------------------- the scan -- */

interface ZoneScore {
  zoneId: string;
  observed: number;
  expected: number;
  llr: number;
  windowHours: number;
}

function scanOnce(
  campus: Campus,
  countsByLeaf: Map<string, number>,
  leafPop: Map<string, number>,
  totalCases: number,
  totalPop: number,
  windowHours: number,
  zones: string[],
  leavesByZone: Map<string, string[]>,
): ZoneScore[] {
  const out: ZoneScore[] = [];
  for (const zoneId of zones) {
    const leaves = leavesByZone.get(zoneId)!;
    let observed = 0;
    let pop = 0;
    for (const l of leaves) {
      observed += countsByLeaf.get(l) ?? 0;
      pop += leafPop.get(l) ?? 0;
    }
    // Conditioned on the total: expected is this zone's share of the campus.
    const expected = totalPop > 0 ? (pop / totalPop) * totalCases : 0;
    out.push({
      zoneId,
      observed,
      expected,
      llr: kulldorffLLR(observed, expected, totalCases),
      windowHours,
    });
  }
  return out;
}

/**
 * THE permutation test.
 *
 * Keep the number of cases exactly as observed, then scatter them at random
 * across rooms in proportion to how many people live there, and re-run the
 * entire scan. Do that 999 times and you have the distribution of "best cluster
 * you can find when nothing is actually wrong".
 *
 * The observed cluster's rank in that distribution IS the answer to the
 * Challenge Question, and it is an answer with a number attached rather than a
 * threshold someone picked by feel.
 */
function permutationTest(
  campus: Campus,
  leafPop: Map<string, number>,
  totalCases: number,
  totalPop: number,
  observedLlr: number,
  windowHours: number,
  zones: string[],
  leavesByZone: Map<string, string[]>,
  seed: number,
): PermutationSummary {
  const rng = mulberry32(seed);
  const leaves = [...leafPop.keys()];
  const cumulative: number[] = [];
  let acc = 0;
  for (const l of leaves) {
    acc += leafPop.get(l)!;
    cumulative.push(acc);
  }

  const nullLlrs: number[] = [];
  const caseCount = Math.max(1, Math.round(totalCases));

  for (let rep = 0; rep < REPLICATES; rep++) {
    const counts = new Map<string, number>();
    for (let c = 0; c < caseCount; c++) {
      const target = rng() * acc;
      let lo = 0;
      let hi = cumulative.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cumulative[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      const leaf = leaves[lo];
      counts.set(leaf, (counts.get(leaf) ?? 0) + 1);
    }
    const scores = scanOnce(
      campus, counts, leafPop, caseCount, totalPop, windowHours, zones, leavesByZone,
    );
    let best = 0;
    for (const s of scores) if (s.llr > best) best = s.llr;
    nullLlrs.push(Math.round(best * 100) / 100);
  }

  const beaten = nullLlrs.filter((v) => v >= observedLlr).length;
  return {
    replicates: REPLICATES,
    observedLlr: Math.round(observedLlr * 100) / 100,
    nullLlrs,
    pValue: (beaten + 1) / (REPLICATES + 1),
    rank: beaten,
  };
}

/* ------------------------------------------------------- meal 2x2 scan --- */

function mealAssociations(campus: Campus, cases: ReportRecord[], now: Date): MealAssociation[] {
  const sickIds = new Set(cases.map((c) => c.studentId));
  const out: MealAssociation[] = [];

  for (const meal of campus.meals) {
    const age = (now.getTime() - meal.servingStart.getTime()) / 3600_000;
    if (age < 0 || age > 96) continue;
    const eaters = campus.ticketsByMeal.get(meal.id);
    if (!eaters || eaters.size === 0) continue;

    let a = 0; // ate + sick
    let c = 0; // didn't eat + sick
    for (const s of campus.students) {
      const sick = sickIds.has(s.id);
      if (!sick) continue;
      if (eaters.has(s.id)) a++;
      else c++;
    }
    const b = eaters.size - a;
    const d = campus.students.length - eaters.size - c;

    // Below three exposed cases the ratio is noise dressed up as a number.
    if (a < 3) continue;

    /**
     * Haldane-Anscombe correction: add 0.5 to every cell when any cell is zero.
     *
     * This matters more than it looks. The single strongest possible evidence
     * against a meal is that EVERY case ate it and nobody who skipped it got
     * sick — which is exactly c = 0, and exactly where a naive risk ratio
     * divides by zero. Discarding those rows would throw away the clearest
     * signal the data can produce. Adding a half to each cell is the standard
     * epidemiological fix: the ratio stays finite, stays large, and stays
     * honest.
     */
    const hasZeroCell = a === 0 || b === 0 || c === 0 || d === 0;
    const rr = hasZeroCell
      ? relativeRisk(a + 0.5, b + 0.5, c + 0.5, d + 0.5)
      : relativeRisk(a, b, c, d);
    out.push({
      mealId: meal.id,
      label: meal.label,
      items: meal.items,
      exposedSick: a,
      exposedWell: b,
      unexposedSick: c,
      unexposedWell: d,
      attackRateExposed: a / Math.max(1, a + b),
      attackRateUnexposed: c / Math.max(1, c + d),
      relativeRisk: Number.isFinite(rr) ? Math.round(rr * 10) / 10 : 99,
      pValue: fisherExact(a, b, c, d),
    });
  }

  return out.sort((x, y) => x.pValue - y.pValue);
}

/* ------------------------------------------------------------ elevation -- */

function buildElevation(
  campus: Campus,
  weightByLeaf: Map<string, number>,
  flagged: Set<string>,
  dayScholarCases: number,
): CampusElevation {
  let maxAttackRate = 0;
  const round1 = (n: number) => Math.round(n * 10) / 10;

  const blocks: ElevationBlock[] = BLOCKS.map((b) => {
    const floors: ElevationFloor[] = FLOORS.map((f) => {
      const filters: ElevationCell[] = HALVES.map((h) => {
        const id = filterId(b, f, h);
        const node = campus.nodeById.get(id)!;
        const count = weightByLeaf.get(id) ?? 0;
        const rate = node.exposedPopulation ? count / node.exposedPopulation : 0;
        maxAttackRate = Math.max(maxAttackRate, rate);
        return {
          nodeId: id,
          label: `${f}${h}`,
          servesRooms: node.servesRooms,
          caseCount: round1(count),
          exposedPopulation: node.exposedPopulation,
          attackRate: rate,
          suppressed: count > 0 && count < SUPPRESSION_THRESHOLD,
          isFlagged: flagged.has(id),
        };
      });
      const count = filters.reduce((s, x) => s + x.caseCount, 0);
      const pop = filters.reduce((s, x) => s + x.exposedPopulation, 0);
      const fid = floorId(b, f);
      return {
        nodeId: fid,
        label: `Floor ${f}`,
        filters,
        caseCount: round1(count),
        attackRate: pop ? count / pop : 0,
        suppressed: count > 0 && count < SUPPRESSION_THRESHOLD,
        isFlagged: flagged.has(fid),
      };
    }).reverse(); // highest floor first, so it renders like a building

    const count = floors.reduce((s, x) => s + x.caseCount, 0);
    const pop = campus.nodeById.get(tankId(b))!.exposedPopulation;
    return {
      nodeId: tankId(b),
      label: `Block ${b}`,
      tankName: `Tank ${b}`,
      floors,
      caseCount: round1(count),
      attackRate: pop ? count / pop : 0,
      suppressed: count > 0 && count < SUPPRESSION_THRESHOLD,
      isFlagged: flagged.has(tankId(b)),
    };
  });

  const messNode = campus.nodeById.get(MESS_ID)!;
  const messCount = blocks.reduce((s, b) => s + b.caseCount, 0) + dayScholarCases;
  const messFilters: ElevationCell[] = ['M1', 'M2'].map((m) => ({
    nodeId: `mess-${m}`,
    label: m,
    servesRooms: null,
    caseCount: round1(messCount / 2),
    exposedPopulation: messNode.exposedPopulation,
    attackRate: messCount / 2 / Math.max(1, messNode.exposedPopulation),
    suppressed: false,
    isFlagged: flagged.has(MESS_ID) || flagged.has(`mess-${m}`),
  }));

  const dsPop = campus.students.filter((s) => s.residency === 'day_scholar').length;
  const dsRate = dsPop ? dayScholarCases / dsPop : 0;
  maxAttackRate = Math.max(maxAttackRate, dsRate);

  return {
    blocks,
    mess: {
      nodeId: MESS_ID,
      label: 'Mess',
      filters: messFilters,
      caseCount: round1(messCount),
      attackRate: messCount / Math.max(1, messNode.exposedPopulation),
      suppressed: false,
      isFlagged: flagged.has(MESS_ID),
    },
    dayScholars: {
      caseCount: round1(dayScholarCases),
      exposedPopulation: dsPop,
      attackRate: dsRate,
      suppressed: dayScholarCases > 0 && dayScholarCases < SUPPRESSION_THRESHOLD,
    },
    maxAttackRate: maxAttackRate || 1,
  };
}

/* ------------------------------------------------------------ epi curve -- */

function buildEpiCurve(campus: Campus, cases: ReportRecord[], now: Date, hours: number): EpiCurve {
  const BUCKET = 6;
  const n = Math.ceil(hours / BUCKET);
  const blockSet = new Set<string>();
  for (const c of cases) {
    const b = c.roomFilterId ? campus.nodeById.get(c.roomFilterId)?.blockLabel : 'Day scholars';
    blockSet.add(b ?? 'Day scholars');
  }
  const blocks = [...blockSet].sort();

  const buckets: EpiCurveBucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const end = now.getTime() - i * BUCKET * 3600_000;
    const start = end - BUCKET * 3600_000;
    const byBlock: Record<string, number> = {};
    for (const b of blocks) byBlock[b] = 0;
    let total = 0;
    for (const c of cases) {
      const t = c.onsetTime.getTime();
      if (t < start || t >= end) continue;
      const b =
        (c.roomFilterId ? campus.nodeById.get(c.roomFilterId)?.blockLabel : null) ?? 'Day scholars';
      byBlock[b] = (byBlock[b] ?? 0) + 1;
      total++;
    }
    const d = new Date(start);
    buckets.push({
      bucketStart: d.toISOString(),
      label: d.toLocaleString('en-IN', {
        weekday: 'short',
        hour: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }),
      byBlock,
      total,
    });
  }

  const mealMarkers: MealMarker[] = campus.meals
    .filter((m) => {
      const age = (now.getTime() - m.servingStart.getTime()) / 3600_000;
      return age >= 0 && age <= hours;
    })
    .map((m) => ({ mealId: m.id, label: m.label, at: m.servingStart.toISOString() }));

  return { buckets, blocks, mealMarkers, bucketHours: BUCKET };
}

/* ------------------------------------------------------------- verdicts -- */

function describeWater(
  campus: Campus,
  zoneId: string,
  observed: number,
  expected: number,
  p: number,
  curveWidth: number,
  siblingNote: string,
): string {
  const node = campus.nodeById.get(zoneId)!;
  const where = node.type === 'filter' && node.floorLabel
    ? `${node.name} on ${node.floorLabel} of ${node.blockLabel}`
    : node.name;
  return (
    `${observed.toFixed(1)} weighted cases under ${where} against ${expected.toFixed(1)} expected. ` +
    `${siblingNote} ` +
    `Shuffling these cases at random across the campus produced a cluster at least this tight in ` +
    `${(p * 100).toFixed(1)}% of 999 attempts. ` +
    `Onset is spread over ${curveWidth.toFixed(0)} hours, which fits a water source rather than a single meal.`
  );
}

function describeFood(meal: MealAssociation, medianIncubation: number, curveWidth: number): string {
  return (
    `${meal.exposedSick} of ${meal.exposedSick + meal.exposedWell} students who ate ${meal.label} reported symptoms, ` +
    `against ${meal.unexposedSick} of ${meal.unexposedSick + meal.unexposedWell} who did not — a relative risk of ${meal.relativeRisk.toFixed(1)} ` +
    `(Fisher exact p = ${meal.pValue < 0.001 ? '<0.001' : meal.pValue.toFixed(3)}). ` +
    `Onset clusters ${medianIncubation.toFixed(0)} hours after service within a ${curveWidth.toFixed(0)}-hour window, ` +
    `which is the signature of a single point-source exposure rather than a water supply.`
  );
}

/* ---------------------------------------------------------------- main --- */

export function runDetection(input: EngineInput): DetectionResult {
  const { campus, reports, scenario, now } = input;
  const overrides = input.clusterStatusOverrides ?? {};

  const zones = candidateZones(campus);
  const leafPop = leafPopulations(campus);
  const totalPop = [...leafPop.values()].reduce((a, b) => a + b, 0);
  const leavesByZone = new Map(zones.map((z) => [z, leafFiltersUnder(campus, z)]));
  // The mess covers everyone, so for spatial purposes its "zone" is every leaf.
  leavesByZone.set(MESS_ID, [...leafPop.keys()]);

  let best: { score: ZoneScore; cases: ReportRecord[]; window: number } | null = null;
  let allScores: ZoneScore[] = [];

  for (const windowHours of WINDOWS) {
    const cases = casesInWindow(reports, now, windowHours);
    const hostelCases = cases.filter((c) => c.roomFilterId);
    const weighted = hostelCases.reduce((s, c) => s + c.sourceWeight, 0);
    if (weighted <= 0) continue;

    const countsByLeaf = new Map<string, number>();
    for (const c of hostelCases) {
      countsByLeaf.set(c.roomFilterId!, (countsByLeaf.get(c.roomFilterId!) ?? 0) + c.sourceWeight);
    }

    const scores = scanOnce(
      campus, countsByLeaf, leafPop, weighted, totalPop, windowHours, zones, leavesByZone,
    );
    allScores = allScores.concat(scores);
    for (const s of scores) {
      if (!best || s.llr > best.score.llr) best = { score: s, cases, window: windowHours };
    }
  }

  const windowHours = best?.window ?? 72;
  const windowCases = casesInWindow(reports, now, windowHours);
  const hostelCases = windowCases.filter((c) => c.roomFilterId);
  const weightedTotal = hostelCases.reduce((s, c) => s + c.sourceWeight, 0);
  const baselineRate = estimateBaselineRate(campus, reports, now, windowHours);

  // ---- permutation on the best zone
  const countsByLeaf = new Map<string, number>();
  for (const c of hostelCases) {
    countsByLeaf.set(c.roomFilterId!, (countsByLeaf.get(c.roomFilterId!) ?? 0) + c.sourceWeight);
  }
  const permutation =
    best && weightedTotal > 0
      ? permutationTest(
          campus, leafPop, weightedTotal, totalPop, best.score.llr, windowHours,
          zones, leavesByZone, 1234 + windowHours,
        )
      : null;

  // ---- meal cohort scan
  const meals = mealAssociations(campus, windowCases, now);
  const bestMeal = meals.find((m) => m.relativeRisk > 1) ?? null;

  // ---- onset shape
  const mealRef = bestMeal ? campus.meals.find((m) => m.id === bestMeal.mealId) : null;
  const onsetHours = windowCases.map((c) => (now.getTime() - c.onsetTime.getTime()) / 3600_000);
  const curveWidth = spread80(onsetHours);
  const incubations = mealRef
    ? windowCases
        .filter((c) => c.mealsEaten.includes(mealRef.id))
        .map((c) => (c.onsetTime.getTime() - mealRef.servingEnd.getTime()) / 3600_000)
        .filter((h) => h >= 0 && h <= 96)
    : [];
  const medianIncubation = incubations.length ? median(incubations) : null;

  // ---- FDR across every zone tested
  const pForLlr = (llr: number) =>
    permutation && llr > 0
      ? Math.max(
          1 / (REPLICATES + 1),
          (permutation.nullLlrs.filter((v) => v >= llr).length + 1) / (REPLICATES + 1),
        )
      : 1;

  const zoneP = allScores.map((s) => pForLlr(s.llr));
  const { qValues } = benjaminiHochberg(zoneP, FDR_Q);
  const bestIdx = best ? allScores.findIndex((s) => s === best!.score) : -1;
  const bestQ = bestIdx >= 0 ? qValues[bestIdx] : 1;

  const dayScholarCases = windowCases
    .filter((c) => !c.roomFilterId)
    .reduce((s, c) => s + c.sourceWeight, 0);

  /* ---- what a naive count-threshold system would have done -------------- */
  const rawByZone = new Map<string, number>();
  for (const z of zones) {
    let n = 0;
    for (const l of leavesByZone.get(z) ?? []) {
      n += hostelCases.filter((c) => c.roomFilterId === l).length;
    }
    rawByZone.set(z, n);
  }
  let naiveZoneId: string | null = null;
  let naiveRaw = 0;
  for (const [z, n] of rawByZone) {
    if (z === MESS_ID) continue;
    if (n >= NAIVE_CASE_THRESHOLD && n > naiveRaw) {
      naiveZoneId = z;
      naiveRaw = n;
    }
  }
  const naiveNode = naiveZoneId
    ? (() => {
        const node = campus.nodeById.get(naiveZoneId!)!;
        return node.type === 'filter' ? `${node.name} — ${node.blockLabel}` : node.name;
      })()
    : null;

  /* ---- arbitration: score both hypotheses, never branch on geography ---- */
  const spatialP = permutation?.pValue ?? 1;
  const spatialSignificant = spatialP <= 0.05 && bestQ <= FDR_Q;

  /**
   * Stratified re-check, and the most important guard in the whole engine.
   *
   * Students who share a filter also share timetables, so they eat together.
   * A genuine water cluster therefore drags a spurious meal association along
   * with it — a filter fault can show RR 6 on some unrelated breakfast purely
   * because the same nine people ate it.
   *
   * So: recompute the meal association with the spatial cluster's own cases
   * removed. If the association collapses, it was never about the food, and
   * saying so is the difference between naming the right filter and sending
   * maintenance to inspect a kitchen.
   */
  const clusterCaseIds = best
    ? new Set(casesUnder(campus, hostelCases, best.score.zoneId).map((c) => c.studentId))
    : new Set<string>();
  const strata = best
    ? mealAssociations(
        campus,
        windowCases.filter((c) => !clusterCaseIds.has(c.studentId)),
        now,
      )
    : meals;
  const mealSurvivesStratification = (mealId: string) => {
    const after = strata.find((m) => m.mealId === mealId);
    return !!after && after.relativeRisk >= 2 && after.pValue <= 0.05;
  };

  const foodStrong =
    !!bestMeal &&
    bestMeal.relativeRisk >= 3 &&
    bestMeal.pValue <= 0.01 &&
    (mealSurvivesStratification(bestMeal.mealId) || !spatialSignificant);
  const sharpCurve = curveWidth > 0 && curveWidth <= 14;

  let hypothesis: Hypothesis = 'unresolved';
  let verdict = '';
  let alternative: string | null = null;
  let name = best ? campus.nodeById.get(best.score.zoneId)!.name : 'No cluster';
  let nodeId: string | null = best?.score.zoneId ?? null;
  let mealId: string | null = null;
  /** Set when we report at the naive system's node instead of our own. */
  let naiveClusterScore: ZoneScore | null = null;
  /** The p-value actually shown, which is the one for the node we report on. */
  let reportedP = spatialP;
  /** Food clusters count exposed cases, not cases-under-a-node. */
  let reportedObserved: number | null = null;
  let reportedExpected: number | null = null;

  if (foodStrong && (sharpCurve || !spatialSignificant || dayScholarCases > 0)) {
    hypothesis = 'food';
    nodeId = null;
    mealId = bestMeal!.mealId;
    name = bestMeal!.label;
    // For a food cluster the meaningful count is "cases among people who ate
    // it", measured against what that group's own background rate predicts —
    // not cases sitting under some water node.
    reportedObserved = bestMeal!.exposedSick;
    {
      const exposedN = bestMeal!.exposedSick + bestMeal!.exposedWell;
      const unexposedN = bestMeal!.unexposedSick + bestMeal!.unexposedWell;
      // When nobody who skipped the meal got sick, the raw unexposed rate is 0
      // and "expected 0" reads as a bug rather than a finding. Use the same
      // half-count correction applied to the risk ratio so the card shows a
      // small, honest number instead.
      const unexposedRate =
        bestMeal!.unexposedSick > 0
          ? bestMeal!.attackRateUnexposed
          : 0.5 / Math.max(1, unexposedN + 1);
      reportedExpected = Math.max(0.1, Math.round(exposedN * unexposedRate * 10) / 10);
    }
    verdict = describeFood(bestMeal!, medianIncubation ?? 0, curveWidth);
    if (dayScholarCases > 0) {
      verdict +=
        ` Day scholars are affected too, and they share no hostel water tank, which rules the water supply out almost entirely.`;
    }
    alternative = spatialSignificant
      ? `The tightest water node is ${campus.nodeById.get(best!.score.zoneId)!.name} at p = ${spatialP.toFixed(3)}, but the meal association is the stronger explanation.`
      : `No water node comes close: the best reaches only p = ${spatialP.toFixed(3)}, well inside noise.`;
  } else if (spatialSignificant && best) {
    const node = campus.nodeById.get(best.score.zoneId)!;
    hypothesis = best.score.zoneId === MESS_ID ? 'mess_water' : 'water';
    const siblingNote = siblingComment(campus, best.score.zoneId, countsByLeaf);
    verdict = describeWater(
      campus, best.score.zoneId, best.score.observed, best.score.expected, spatialP, curveWidth, siblingNote,
    );
    name = node.type === 'filter' ? `${node.name} — ${node.blockLabel}` : node.name;
    if (!bestMeal) {
      alternative = 'No meal shows any association.';
    } else if (bestMeal.relativeRisk >= 3) {
      // Do not claim the meal signal is weak when it plainly is not. Say why we
      // set it aside: with the cluster's own cases removed it disappears, which
      // means the people who share this filter also share a mealtime, not that
      // the food was bad.
      const after = strata.find((m) => m.mealId === bestMeal.mealId);
      alternative =
        `${bestMeal.label} also looks associated at RR ${bestMeal.relativeRisk.toFixed(1)}, but that is these same students showing up twice: ` +
        `they share a filter and they share a mealtime. Remove this cluster's cases and the association ` +
        `${after ? `falls to RR ${after.relativeRisk.toFixed(1)} (p = ${after.pValue.toFixed(2)})` : 'disappears entirely'}, ` +
        `so the food is not the explanation.`;
    } else {
      alternative = `Meal correlation is weak — the strongest is ${bestMeal.label} at RR ${bestMeal.relativeRisk.toFixed(1)} (p = ${bestMeal.pValue.toFixed(2)}), inside noise.`;
    }
  } else if (naiveZoneId) {
    /**
     * Nothing is significant, but a count threshold WOULD have fired. This is
     * the coincidence case, and it is the one the Challenge Question is really
     * about.
     *
     * Report at the node the naive system would have flagged, not at our own
     * best-scoring node — otherwise we would be answering a different question
     * than the one a threshold system asked, and the comparison would be a
     * sleight of hand rather than a rebuttal.
     */
    hypothesis = 'unresolved';
    const node = campus.nodeById.get(naiveZoneId)!;
    const naiveScore = allScores.find(
      (s) => s.zoneId === naiveZoneId && s.windowHours === windowHours,
    );
    const naiveP = naiveScore ? pForLlr(naiveScore.llr) : 1;
    nodeId = naiveZoneId;
    name = node.type === 'filter' ? `${node.name} — ${node.blockLabel}` : node.name;
    naiveClusterScore = naiveScore ?? null;
    reportedP = naiveP;
    verdict =
      `${naiveRaw} reports under ${node.name} over ${windowHours} hours, which crosses the kind of ` +
      `count threshold most systems in this space use, so a threshold system alerts here. We do not. ` +
      `Shuffling these cases at random across the campus produced a cluster at least this tight in ` +
      `${(naiveP * 100).toFixed(0)}% of 999 attempts, so this sits comfortably inside what coincidence ` +
      `alone generates on a busy week. Holding at watch — no advisory goes out.`;
    alternative = bestMeal
      ? `No meal explains it either — the strongest is ${bestMeal.label} at RR ${bestMeal.relativeRisk.toFixed(1)} (p = ${bestMeal.pValue.toFixed(2)}). Neither hypothesis has support.`
      : 'No meal shows any association either. Neither hypothesis has support.';
  } else {
    // Nothing significant and nothing a threshold system would have fired on.
    // The correct output here is silence, not a cluster card nobody should act on.
    best = null;
  }

  /* ---- status ladder: significance alone never notifies anyone ---- */
  const clusterCases = best ? casesUnder(campus, hostelCases, best.score.zoneId) : [];
  const doctorConfirmed = clusterCases.some((c) => c.reportedBy === 'doctor');
  const corroborated = clusterCases.length >= 3;
  const significant = hypothesis === 'food' ? foodStrong : spatialSignificant;

  let status: Cluster['status'] = 'watch';
  if (significant && (doctorConfirmed || corroborated)) status = 'alert';
  const clusterId = `cluster-${scenario}`;
  if (overrides[clusterId]) status = overrides[clusterId];

  const flagged = new Set<string>();
  if (significant && best) {
    if (hypothesis === 'food') flagged.add(MESS_ID);
    else for (const id of leavesByZone.get(best.score.zoneId) ?? []) flagged.add(id);
    if (nodeId) flagged.add(nodeId);
  }

  const cluster: Cluster | null = best
    ? {
        id: clusterId,
        nodeId,
        mealId,
        name,
        hypothesis,
        status,
        windowStart: new Date(now.getTime() - windowHours * 3600_000).toISOString(),
        windowEnd: now.toISOString(),
        windowHours,
        observed: Math.round((reportedObserved ?? naiveClusterScore?.observed ?? best.score.observed) * 10) / 10,
        expected: Math.round((reportedExpected ?? naiveClusterScore?.expected ?? best.score.expected) * 10) / 10,
        llr: Math.round((naiveClusterScore?.llr ?? best.score.llr) * 100) / 100,
        pSpatial: reportedP,
        qValue: Math.round(bestQ * 1000) / 1000,
        significant,
        relativeRisk: bestMeal?.relativeRisk ?? null,
        pFood: hypothesis === 'food' ? bestMeal?.pValue : undefined,
        exposedSick: bestMeal?.exposedSick ?? 0,
        exposedWell: bestMeal?.exposedWell ?? 0,
        unexposedSick: bestMeal?.unexposedSick ?? 0,
        unexposedWell: bestMeal?.unexposedWell ?? 0,
        medianIncubationHours: medianIncubation !== null ? Math.round(medianIncubation) : null,
        curveWidthHours: Math.round(curveWidth),
        verdict,
        alternative,
        caseIds: clusterCases.map((c) => c.id),
        confirmedBy: null,
      }
    : null;


  const weightByLeaf = countsByLeaf;
  const elevation = buildElevation(campus, weightByLeaf, flagged, dayScholarCases);

  const headline = cluster
    ? significant
      ? hypothesis === 'food'
        ? `${cluster.name}: ${cluster.exposedSick} cases among students who ate it, relative risk ${cluster.relativeRisk?.toFixed(1)}, onset clustered ${cluster.medianIncubationHours}h after service.`
        : `${cluster.name} is carrying ${cluster.observed} weighted cases against ${cluster.expected} expected. A cluster this tight arose by chance in ${permutation?.rank ?? 0} of 999 shuffles.`
      : `${naiveRaw || Math.round(cluster.observed)} reports under ${cluster.name} — but a cluster this tight arises by chance ${(reportedP * 100).toFixed(0)}% of the time. Holding at watch, no advisory sent.`
    : `Nothing above baseline. ${windowCases.length} scattered reports, consistent with ordinary background illness.`;

  return {
    scenario,
    runAt: now.toISOString(),
    windowHours,
    totalCases: windowCases.length,
    totalPopulation: campus.students.length,
    baselineRatePerDay: Math.round(baselineRate * 10000) / 10000,
    clusters: cluster ? [cluster] : [],
    topCluster: cluster,
    elevation,
    epiCurve: buildEpiCurve(campus, windowCases, now, windowHours),
    permutation,
    naiveThresholdWouldAlert: naiveNode !== null,
    naiveThresholdNodeName: naiveNode,
    nodesTested: zones.length,
    fdrQ: FDR_Q,
    headline,
  };
}

/* --------------------------------------------------------------- helpers -- */

function casesUnder(campus: Campus, cases: ReportRecord[], zoneId: string): ReportRecord[] {
  const leaves = new Set(leafFiltersUnder(campus, zoneId));
  if (zoneId === MESS_ID) return cases;
  return cases.filter((c) => c.roomFilterId && leaves.has(c.roomFilterId));
}

/** The sibling comparison is what turns "somewhere in Block B" into "Filter 3A".
 *  Saying it in the verdict is what makes the result actionable for a warden. */
function siblingComment(campus: Campus, zoneId: string, counts: Map<string, number>): string {
  const node = campus.nodeById.get(zoneId);
  if (!node) return '';
  if (node.type === 'filter') {
    const m = /^filter-([A-D])(\d)([AB])$/.exec(zoneId);
    if (!m) return '';
    const sibHalf = m[3] === 'A' ? 'B' : 'A';
    const sib = filterId(m[1], Number(m[2]), sibHalf);
    const sibCount = counts.get(sib) ?? 0;
    return `Filter ${m[2]}${sibHalf} on the same floor is at ${sibCount.toFixed(1)}, and the other floors on Tank ${m[1]} are at baseline, so the tank itself is unlikely.`;
  }
  if (node.type === 'floor') return 'Both filters on this floor are raised, so the fault is at floor level rather than in one cartridge.';
  if (node.type === 'tank') return 'Every floor on this tank is raised, which points at the tank rather than any single filter.';
  return '';
}

/** Convenience wrapper used by the API routes and the test harness. */
export function detect(
  reports: ReportRecord[],
  scenario: ScenarioId,
  now: Date,
  overrides?: Record<string, 'confirmed' | 'dismissed' | 'resolved'>,
): DetectionResult {
  return runDetection({
    campus: getCampus(now),
    reports,
    scenario,
    now,
    clusterStatusOverrides: overrides,
  });
}

export function toCaseRow(campus: Campus, r: ReportRecord, revealIdentity: boolean): CaseRow {
  const student = campus.students.find((s) => s.id === r.studentId);
  const node = r.roomFilterId ? campus.nodeById.get(r.roomFilterId) : null;
  return {
    id: r.id,
    studentLabel: revealIdentity
      ? `${student?.name ?? 'Unknown'} (${student?.studentId ?? '-'})`
      : `Student #${(student?.studentId ?? '0').slice(-3)}`,
    roomNumber: student?.roomNumber ?? null,
    blockLabel: node?.blockLabel ?? null,
    floorLabel: node?.floorLabel ?? null,
    filterName: node?.name ?? 'Mess only (day scholar)',
    residency: student?.residency ?? 'hosteller',
    symptoms: r.symptoms,
    onsetTime: r.onsetTime.toISOString(),
    reportTime: r.reportTime.toISOString(),
    severity: r.severity,
    reportedBy: r.reportedBy,
    sourceWeight: r.sourceWeight,
    prompted: r.promptedByAdvisoryId !== null,
  };
}

export { mealAssociations };
