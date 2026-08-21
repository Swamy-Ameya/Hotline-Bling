/**
 * ============================================================================
 *  FIXTURE — hardcoded engine output, in the exact final shape
 * ============================================================================
 *  Build the ENTIRE UI against this. Do not wait for the real engine.
 *
 *    import { fixtureFor, clusterDetailFixture } from '@/lib/detect/fixture';
 *    const result = fixtureFor('filter_fault');
 *
 *  At hour 7 this gets swapped for `await fetch('/api/detect')`, which returns
 *  the same `DetectionResult` type. If the contract held, that is a one-line
 *  change per screen.
 *
 *  Deterministic: same input always gives the same output, so screenshots and
 *  the demo are reproducible.
 * ============================================================================
 */

import type {
  CampusElevation,
  CaseRow,
  Cluster,
  ClusterDetail,
  DetectionResult,
  ElevationBlock,
  ElevationCell,
  ElevationFloor,
  EpiCurve,
  EpiCurveBucket,
  Intervention,
  MealAssociation,
  MealMarker,
  PermutationSummary,
  ScenarioId,
  Symptom,
} from '@/lib/types';
import { SUPPRESSION_THRESHOLD } from '@/lib/types';

/* ------------------------------------------------------------------ prng -- */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- campus -- */

const BLOCKS = ['A', 'B', 'C', 'D'] as const;
const FLOORS = [1, 2, 3, 4, 5] as const;
const HALVES = ['A', 'B'] as const;

/** Deliberately uneven so the attack-rate point is visible on screen: some
 *  filters serve many more rooms than others, and raw counts would mislead. */
function filterPopulation(block: string, floor: number, half: string): number {
  const r = mulberry32(
    block.charCodeAt(0) * 1000 + floor * 10 + half.charCodeAt(0),
  );
  return 12 + Math.floor(r() * 7); // 12..18
}

function filterId(block: string, floor: number, half: string) {
  return `filter-${block}${floor}${half}`;
}

function roomRange(floor: number, half: string, pop: number) {
  const start = floor * 100 + (half === 'A' ? 1 : 21);
  return `${start}-${start + pop - 1}`;
}

const MESS_FILTER_POP = 600;
const DAY_SCHOLAR_POP = 140;

/** ISO timestamp `hoursAgo` before the fixed demo clock. */
const NOW = new Date('2026-08-22T09:00:00+05:30');
function ago(hours: number): string {
  return new Date(NOW.getTime() - hours * 3600_000).toISOString();
}

/* ------------------------------------------------------------- elevation -- */

type CaseMap = Record<string, number>; // filterId -> weighted case count

function buildElevation(cases: CaseMap, flagged: Set<string>, dayScholarCases: number): CampusElevation {
  let maxAttackRate = 0;

  const blocks: ElevationBlock[] = BLOCKS.map((b) => {
    const floors: ElevationFloor[] = FLOORS.map((f) => {
      const filters: ElevationCell[] = HALVES.map((h) => {
        const id = filterId(b, f, h);
        const pop = filterPopulation(b, f, h);
        const count = cases[id] ?? 0;
        const rate = pop > 0 ? count / pop : 0;
        maxAttackRate = Math.max(maxAttackRate, rate);
        return {
          nodeId: id,
          label: `${f}${h}`,
          servesRooms: roomRange(f, h, pop),
          caseCount: round1(count),
          exposedPopulation: pop,
          attackRate: rate,
          suppressed: count > 0 && count < SUPPRESSION_THRESHOLD,
          isFlagged: flagged.has(id),
        };
      });

      const count = filters.reduce((s, x) => s + x.caseCount, 0);
      const pop = filters.reduce((s, x) => s + x.exposedPopulation, 0);
      const fid = `floor-${b}${f}`;
      return {
        nodeId: fid,
        label: `Floor ${f}`,
        filters,
        caseCount: round1(count),
        attackRate: pop > 0 ? count / pop : 0,
        suppressed: count > 0 && count < SUPPRESSION_THRESHOLD,
        isFlagged: flagged.has(fid),
      };
    })
      .slice()
      .reverse(); // highest floor first — it renders as a building

    const count = floors.reduce((s, x) => s + x.caseCount, 0);
    const pop = floors.reduce(
      (s, x) => s + x.filters.reduce((t, y) => t + y.exposedPopulation, 0),
      0,
    );
    const tid = `tank-${b}`;
    return {
      nodeId: tid,
      label: `Block ${b}`,
      tankName: `Tank ${b}`,
      floors,
      caseCount: round1(count),
      attackRate: pop > 0 ? count / pop : 0,
      suppressed: count > 0 && count < SUPPRESSION_THRESHOLD,
      isFlagged: flagged.has(tid),
    };
  });

  const messCount = cases['mess'] ?? 0;
  const messFilters: ElevationCell[] = ['M1', 'M2'].map((m) => ({
    nodeId: `mess-${m}`,
    label: m,
    servesRooms: null,
    caseCount: round1(messCount / 2),
    exposedPopulation: MESS_FILTER_POP,
    attackRate: messCount / 2 / MESS_FILTER_POP,
    suppressed: false,
    isFlagged: flagged.has(`mess-${m}`) || flagged.has('mess'),
  }));

  const dsRate = dayScholarCases / DAY_SCHOLAR_POP;
  maxAttackRate = Math.max(maxAttackRate, dsRate);

  return {
    blocks,
    mess: {
      nodeId: 'mess',
      label: 'Mess',
      filters: messFilters,
      caseCount: round1(messCount),
      attackRate: messCount / MESS_FILTER_POP,
      suppressed: messCount > 0 && messCount < SUPPRESSION_THRESHOLD,
      isFlagged: flagged.has('mess'),
    },
    dayScholars: {
      caseCount: round1(dayScholarCases),
      exposedPopulation: DAY_SCHOLAR_POP,
      attackRate: dsRate,
      suppressed: dayScholarCases > 0 && dayScholarCases < SUPPRESSION_THRESHOLD,
    },
    maxAttackRate: maxAttackRate || 1,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/* ------------------------------------------------------------- epi curve -- */

const MEAL_MARKERS: MealMarker[] = [
  { mealId: 'meal-tue-dinner', label: 'Tue dinner', at: ago(38) },
  { mealId: 'meal-wed-breakfast', label: 'Wed breakfast', at: ago(26) },
  { mealId: 'meal-wed-lunch', label: 'Wed lunch', at: ago(20) },
  { mealId: 'meal-wed-dinner', label: 'Wed dinner', at: ago(14) },
];

/** `shape` controls how tightly onset clusters — the single strongest
 *  discriminator between a food point-source and a water problem. */
function buildEpiCurve(
  total: number,
  shape: 'sharp' | 'smeared' | 'flat',
  blocksInvolved: string[],
  seed: number,
): EpiCurve {
  const rand = mulberry32(seed);
  const buckets: EpiCurveBucket[] = [];
  const BUCKETS = 12; // 12 x 6h = 72h

  const weights = Array.from({ length: BUCKETS }, (_, i) => {
    if (shape === 'sharp') {
      // tight unimodal spike ~6h after Tue dinner
      const d = i - 6;
      return Math.exp(-(d * d) / 1.2);
    }
    if (shape === 'smeared') {
      // broad, low, sustained — the waterborne signature
      const d = i - 6;
      return Math.exp(-(d * d) / 14);
    }
    return 0.5 + rand() * 0.5; // flat noise
  });
  const wSum = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < BUCKETS; i++) {
    const hoursBack = (BUCKETS - i) * 6;
    const n = Math.round((weights[i] / wSum) * total);
    const byBlock: Record<string, number> = {};
    blocksInvolved.forEach((b) => (byBlock[b] = 0));
    for (let k = 0; k < n; k++) {
      const b = blocksInvolved[Math.floor(rand() * blocksInvolved.length)];
      byBlock[b] = (byBlock[b] ?? 0) + 1;
    }
    const t = new Date(NOW.getTime() - hoursBack * 3600_000);
    buckets.push({
      bucketStart: t.toISOString(),
      label: t.toLocaleString('en-IN', {
        weekday: 'short',
        hour: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }),
      byBlock,
      total: Object.values(byBlock).reduce((a, b) => a + b, 0),
    });
  }

  return { buckets, blocks: blocksInvolved, mealMarkers: MEAL_MARKERS, bucketHours: 6 };
}

/* ---------------------------------------------------- permutation nulls -- */

/** Null distribution of max-LLR under random reassignment. Right-skewed,
 *  which is what a real scan-statistic null looks like. */
function buildPermutation(observedLlr: number, pValue: number, seed: number): PermutationSummary {
  const rand = mulberry32(seed);
  const replicates = 999;
  const nullLlrs: number[] = [];
  for (let i = 0; i < replicates; i++) {
    const u = rand();
    nullLlrs.push(round1(-Math.log(1 - u) * 2.4 + rand() * 0.8));
  }
  nullLlrs.sort((a, b) => a - b);

  // Force the null distribution to be consistent with the stated p-value.
  const rank = Math.max(0, Math.round(pValue * (replicates + 1)) - 1);
  const idx = replicates - rank;
  for (let i = idx; i < replicates; i++) {
    nullLlrs[i] = round1(observedLlr + 0.2 + rand() * 2);
  }
  for (let i = 0; i < idx; i++) {
    if (nullLlrs[i] >= observedLlr) nullLlrs[i] = round1(observedLlr - 0.15 - rand() * 3);
  }

  return { replicates, observedLlr, nullLlrs, pValue, rank };
}

/* ------------------------------------------------------------ case rows -- */

const SYMPTOM_SETS: Symptom[][] = [
  ['vomiting', 'nausea', 'abdominal_cramps'],
  ['diarrhea_watery', 'abdominal_cramps'],
  ['diarrhea_watery', 'fever', 'nausea'],
  ['vomiting', 'diarrhea_watery', 'dehydration'],
  ['nausea', 'headache'],
];

function buildCases(
  n: number,
  filterIds: string[],
  onsetSpreadHours: number,
  centreHoursAgo: number,
  seed: number,
  doctorShare = 0.4,
): CaseRow[] {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => {
    const fid = filterIds[Math.floor(rand() * filterIds.length)];
    const m = /^filter-([A-D])(\d)([AB])$/.exec(fid);
    const block = m ? `Block ${m[1]}` : null;
    const floor = m ? `Floor ${m[2]}` : null;
    const isDoctor = rand() < doctorShare;
    const onset = centreHoursAgo + (rand() - 0.5) * onsetSpreadHours;
    return {
      id: `case-${seed}-${i}`,
      studentLabel: `Student #${100 + Math.floor(rand() * 800)}`,
      roomNumber: m ? `${m[2]}${(10 + Math.floor(rand() * 20)).toString()}` : null,
      blockLabel: block,
      floorLabel: floor,
      filterName: m ? `Filter ${m[2]}${m[3]}` : 'Mess',
      residency: 'hosteller' as const,
      symptoms: SYMPTOM_SETS[Math.floor(rand() * SYMPTOM_SETS.length)],
      onsetTime: ago(onset),
      reportTime: ago(Math.max(0.5, onset - 4 - rand() * 6)),
      severity: 2 + Math.floor(rand() * 3),
      reportedBy: isDoctor ? ('doctor' as const) : ('self' as const),
      sourceWeight: isDoctor ? 1.0 : 0.6,
      prompted: false,
    };
  });
}

/* ------------------------------------------------------------- scenarios -- */

function baselineNoise(seed: number, exclude: Set<string> = new Set()): CaseMap {
  const rand = mulberry32(seed);
  const map: CaseMap = {};
  BLOCKS.forEach((b) =>
    FLOORS.forEach((f) =>
      HALVES.forEach((h) => {
        const id = filterId(b, f, h);
        if (exclude.has(id)) return;
        if (rand() < 0.16) map[id] = round1(0.6 + rand() * 1.2);
      }),
    ),
  );
  return map;
}

function emptyCluster(): Cluster[] {
  return [];
}

export function fixtureFor(scenario: ScenarioId): DetectionResult {
  switch (scenario) {
    /* ------------------------------------------------------------- quiet -- */
    case 'quiet': {
      const cases = baselineNoise(11);
      const elevation = buildElevation(cases, new Set(), 0.6);
      return {
        scenario,
        runAt: NOW.toISOString(),
        windowHours: 72,
        totalCases: 5,
        totalPopulation: 740,
        baselineRatePerDay: 0.004,
        clusters: emptyCluster(),
        topCluster: null,
        elevation,
        epiCurve: buildEpiCurve(5, 'flat', ['Block A', 'Block B', 'Block C', 'Block D'], 3),
        permutation: buildPermutation(2.1, 0.68, 7),
        naiveThresholdWouldAlert: false,
        naiveThresholdNodeName: null,
        nodesTested: 61,
        fdrQ: 0.1,
        headline:
          'Nothing above baseline. 5 scattered reports across 4 blocks, consistent with ordinary background illness.',
      };
    }

    /* ------------------------------------------------------ filter fault -- */
    case 'filter_fault': {
      const target = filterId('B', 3, 'A');
      const cases = baselineNoise(21, new Set([target]));
      cases[target] = 7.8;
      const flagged = new Set([target]);
      const elevation = buildElevation(cases, flagged, 0);
      const cluster: Cluster = {
        id: 'cluster-filter-3a',
        nodeId: target,
        mealId: null,
        name: 'Filter 3A — Block B',
        hypothesis: 'water',
        status: 'alert',
        windowStart: ago(48),
        windowEnd: NOW.toISOString(),
        windowHours: 48,
        observed: 7.8,
        expected: 1.2,
        llr: 9.6,
        pSpatial: 0.002,
        qValue: 0.012,
        significant: true,
        relativeRisk: 1.3,
        exposedSick: 4,
        exposedWell: 168,
        unexposedSick: 5,
        unexposedWell: 421,
        medianIncubationHours: 34,
        curveWidthHours: 41,
        verdict:
          'Nine cases in 48 hours, all served by Filter 3A in Block B. Filter 3B on the same floor and the other four floors on Tank B are all at baseline, so the tank itself is unlikely. Onset is spread over 41 hours, which is consistent with a water source rather than a single meal.',
        alternative:
          'Meal correlation is weak — the strongest association is Tuesday dinner at RR 1.3, which is within noise.',
        caseIds: [],
        confirmedBy: null,
      };
      return {
        scenario,
        runAt: NOW.toISOString(),
        windowHours: 48,
        totalCases: 14,
        totalPopulation: 740,
        baselineRatePerDay: 0.004,
        clusters: [cluster],
        topCluster: cluster,
        elevation,
        epiCurve: buildEpiCurve(9, 'smeared', ['Block B'], 5),
        permutation: buildPermutation(9.6, 0.002, 13),
        naiveThresholdWouldAlert: true,
        naiveThresholdNodeName: 'Filter 3A — Block B',
        nodesTested: 61,
        fdrQ: 0.1,
        headline:
          'Filter 3A in Block B is carrying 9 cases against 1.2 expected. A cluster this tight arose by chance in 2 of 1,000 shuffles.',
      };
    }

    /* --------------------------------------------------------------- food -- */
    case 'food': {
      const rand = mulberry32(31);
      const cases = baselineNoise(31);
      // spread across three blocks — no single tank can explain this
      (['A', 'B', 'C'] as const).forEach((b) =>
        FLOORS.forEach((f) =>
          HALVES.forEach((h) => {
            if (rand() < 0.35) {
              const id = filterId(b, f, h);
              cases[id] = round1((cases[id] ?? 0) + 0.6 + rand() * 1.4);
            }
          }),
        ),
      );
      cases['mess'] = 14;
      const flagged = new Set(['mess']);
      const elevation = buildElevation(cases, flagged, 3.2);
      const cluster: Cluster = {
        id: 'cluster-tue-dinner',
        nodeId: null,
        mealId: 'meal-tue-dinner',
        name: 'Tuesday dinner',
        hypothesis: 'food',
        status: 'alert',
        windowStart: ago(40),
        windowEnd: NOW.toISOString(),
        windowHours: 48,
        observed: 14,
        expected: 3.1,
        llr: 7.4,
        pSpatial: 0.021,
        qValue: 0.063,
        significant: true,
        relativeRisk: 7.1,
        exposedSick: 14,
        exposedWell: 268,
        unexposedSick: 2,
        unexposedWell: 456,
        medianIncubationHours: 5,
        curveWidthHours: 7,
        verdict:
          'Fourteen cases across three blocks and among day scholars, who share no hostel water tank. Twelve of the sixteen ate Tuesday dinner (RR 7.1). Onset is concentrated in a 7-hour window about 5 hours after service, which is the signature of a point-source food exposure.',
        alternative:
          'No single tank or filter explains the spread — the strongest water node reaches only p = 0.41, well inside noise.',
        caseIds: [],
        confirmedBy: null,
      };
      return {
        scenario,
        runAt: NOW.toISOString(),
        windowHours: 48,
        totalCases: 16,
        totalPopulation: 740,
        baselineRatePerDay: 0.004,
        clusters: [cluster],
        topCluster: cluster,
        elevation,
        epiCurve: buildEpiCurve(14, 'sharp', ['Block A', 'Block B', 'Block C'], 9),
        permutation: buildPermutation(7.4, 0.021, 17),
        naiveThresholdWouldAlert: true,
        naiveThresholdNodeName: 'Mess',
        nodesTested: 61,
        fdrQ: 0.1,
        headline:
          'Tuesday dinner: 14 cases across 3 blocks and day scholars, RR 7.1, onset clustered 5 hours after service.',
      };
    }

    /* ------------------------------------------------ the coincidence trap -- */
    case 'coincidence': {
      const rand = mulberry32(41);
      const cases = baselineNoise(41);
      // 7 cases that happen to land in Block A, scattered across its floors
      const picks = [
        filterId('A', 1, 'A'),
        filterId('A', 2, 'B'),
        filterId('A', 3, 'A'),
        filterId('A', 4, 'B'),
        filterId('A', 5, 'A'),
      ];
      picks.forEach((id) => {
        cases[id] = round1((cases[id] ?? 0) + 1.0 + rand() * 0.6);
      });
      const cluster: Cluster = {
        id: 'cluster-block-a-chance',
        nodeId: 'tank-A',
        mealId: null,
        name: 'Block A (Tank A)',
        hypothesis: 'unresolved',
        status: 'watch',
        windowStart: ago(72),
        windowEnd: NOW.toISOString(),
        windowHours: 72,
        observed: 6.6,
        expected: 4.4,
        llr: 2.6,
        pSpatial: 0.31,
        qValue: 0.62,
        significant: false,
        relativeRisk: 1.1,
        exposedSick: 3,
        exposedWell: 210,
        unexposedSick: 4,
        unexposedWell: 380,
        medianIncubationHours: null,
        curveWidthHours: 63,
        verdict:
          'Seven reports in Block A over 72 hours. A count threshold would fire here. We do not: shuffling these cases at random across the campus produces a cluster at least this tight 31% of the time, so this is well within what coincidence alone generates. Holding at watch.',
        alternative:
          'Cases are spread across five different floors with no shared filter, and no meal reaches RR 1.5. Neither hypothesis has support.',
        caseIds: [],
        confirmedBy: null,
      };
      const elevation = buildElevation(cases, new Set(), 0.6);
      return {
        scenario,
        runAt: NOW.toISOString(),
        windowHours: 72,
        totalCases: 12,
        totalPopulation: 740,
        baselineRatePerDay: 0.004,
        clusters: [cluster],
        topCluster: cluster,
        elevation,
        epiCurve: buildEpiCurve(7, 'flat', ['Block A'], 23),
        permutation: buildPermutation(2.6, 0.31, 29),
        naiveThresholdWouldAlert: true,
        naiveThresholdNodeName: 'Block A (Tank A)',
        nodesTested: 61,
        fdrQ: 0.1,
        headline:
          'Seven cases in Block A — but a cluster this tight arises by chance 31% of the time. Holding at watch, no advisory sent.',
      };
    }
  }
}

/* --------------------------------------------------------- cluster detail -- */

const MEAL_TABLE: Record<ScenarioId, MealAssociation[]> = {
  quiet: [],
  filter_fault: [
    mealRow('meal-tue-dinner', 'Tue dinner', ['Rajma', 'Rice', 'Salad'], 4, 168, 5, 421),
    mealRow('meal-wed-lunch', 'Wed lunch', ['Chole', 'Bhature', 'Curd'], 3, 190, 6, 399),
  ],
  food: [
    mealRow('meal-tue-dinner', 'Tue dinner', ['Paneer curry', 'Rice', 'Raita'], 14, 268, 2, 456),
    mealRow('meal-wed-breakfast', 'Wed breakfast', ['Poha', 'Tea'], 5, 300, 11, 424),
  ],
  coincidence: [
    mealRow('meal-wed-lunch', 'Wed lunch', ['Dal', 'Rice', 'Sabzi'], 3, 210, 4, 380),
  ],
};

function mealRow(
  mealId: string,
  label: string,
  items: string[],
  a: number,
  b: number,
  c: number,
  d: number,
): MealAssociation {
  const arExp = a / (a + b);
  const arUn = c / (c + d);
  return {
    mealId,
    label,
    items,
    exposedSick: a,
    exposedWell: b,
    unexposedSick: c,
    unexposedWell: d,
    attackRateExposed: arExp,
    attackRateUnexposed: arUn,
    relativeRisk: arUn > 0 ? round1(arExp / arUn) : 0,
    pValue: arExp / Math.max(arUn, 1e-9) > 4 ? 0.004 : 0.42,
  };
}

const INTERVENTIONS: Intervention[] = [
  {
    id: 'int-1',
    clusterId: 'cluster-filter-3a',
    kind: 'water_test',
    tds: 412,
    residualChlorine: 0.05,
    turbidity: 6.4,
    coliformPositive: true,
    outcome: 'Coliform positive, residual chlorine near zero. Filter cartridge past service life.',
    causeCode: 'filter_media_exhausted',
    performedBy: 'Maintenance — R. Sharma',
    performedAt: ago(3),
  },
];

export function clusterDetailFixture(scenario: ScenarioId): ClusterDetail | null {
  const result = fixtureFor(scenario);
  if (!result.topCluster) return null;

  const casesByScenario: Record<ScenarioId, CaseRow[]> = {
    quiet: [],
    filter_fault: buildCases(9, [filterId('B', 3, 'A')], 41, 30, 101),
    food: buildCases(
      14,
      [filterId('A', 2, 'A'), filterId('B', 4, 'B'), filterId('C', 1, 'A')],
      7,
      33,
      202,
    ),
    coincidence: buildCases(
      7,
      [
        filterId('A', 1, 'A'),
        filterId('A', 2, 'B'),
        filterId('A', 3, 'A'),
        filterId('A', 4, 'B'),
        filterId('A', 5, 'A'),
      ],
      63,
      40,
      303,
    ),
  };

  return {
    cluster: result.topCluster,
    cases: casesByScenario[scenario],
    epiCurve: result.epiCurve,
    permutation: result.permutation!,
    interventions: scenario === 'filter_fault' ? INTERVENTIONS : [],
    mealTable: MEAL_TABLE[scenario],
  };
}

/** Every scenario's result at once — handy for the scenario switcher. */
export const ALL_FIXTURES: Record<ScenarioId, DetectionResult> = {
  quiet: fixtureFor('quiet'),
  filter_fault: fixtureFor('filter_fault'),
  food: fixtureFor('food'),
  coincidence: fixtureFor('coincidence'),
};
