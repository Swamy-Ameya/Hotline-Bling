/**
 * ============================================================================
 *  SCENARIOS — the demo data generator
 * ============================================================================
 *  Every scenario starts from the same background process: each student has a
 *  small independent daily chance of reporting GI symptoms. That noise floor is
 *  not filler. It is the thing the detector has to survive, and it is what makes
 *  the false-alarm argument honest rather than rhetorical.
 *
 *  A note on `coincidence`, because it is the one that matters most:
 *
 *  It injects NOTHING. It is pure background noise, with the random seed chosen
 *  so that one block happens to collect an eye-catching number of unrelated
 *  cases. That is precisely what the hackathon's Challenge Question describes —
 *  "a handful of unrelated stomach upsets that happen to cluster by
 *  coincidence" — and it is the only construction where the detector's verdict
 *  means anything. If we manufactured the cluster and then declared it
 *  insignificant, we would be grading our own homework.
 * ============================================================================
 */

import type { ScenarioId, Symptom } from '@/lib/types';
import { mulberry32, gaussian, type Rng } from '@/lib/rng';
import {
  BLOCKS,
  FLOORS,
  HALVES,
  filterId,
  getCampus,
  type Campus,
  type Student,
} from '@/lib/seed/campus';
import { resetStore, type ReportRecord } from '@/lib/store';

const BASELINE_DAYS = 21;

/** Background GI-symptom rate per student per day. A declared assumption:
 *  we have no real MUJ figure, so this is a plausible starting value and the
 *  deck says so out loud. */
const BASELINE_RATE: Record<ScenarioId, number> = {
  quiet: 0.0030,
  filter_fault: 0.0035,
  food: 0.0035,
  coincidence: 0.0055, // a busy but entirely ordinary week
};

const SYMPTOM_POOLS: Record<string, Symptom[][]> = {
  toxin: [
    ['vomiting', 'nausea', 'abdominal_cramps'],
    ['vomiting', 'nausea'],
    ['vomiting', 'abdominal_cramps', 'dehydration'],
  ],
  water: [
    ['diarrhea_watery', 'abdominal_cramps'],
    ['diarrhea_watery', 'nausea', 'fever'],
    ['diarrhea_watery', 'dehydration'],
    ['abdominal_cramps', 'fever', 'headache'],
  ],
  background: [
    ['nausea', 'headache'],
    ['abdominal_cramps'],
    ['diarrhea_watery'],
    ['nausea', 'abdominal_cramps'],
  ],
};

let counter = 0;
function makeReport(
  rng: Rng,
  student: Student,
  onset: Date,
  pool: keyof typeof SYMPTOM_POOLS,
  doctorShare: number,
  mealsEaten: string[],
): ReportRecord {
  const isDoctor = rng() < doctorShare;
  const options = SYMPTOM_POOLS[pool];
  // Reports arrive some hours AFTER onset — that lag is the whole reason a
  // clinic-only system notices an outbreak on day two rather than day zero.
  const lagHours = 3 + rng() * 20;
  return {
    id: `rep-${++counter}`,
    studentId: student.id,
    reportedBy: isDoctor ? 'doctor' : 'self',
    symptoms: options[Math.floor(rng() * options.length)],
    mealsEaten,
    onsetTime: onset,
    reportTime: new Date(onset.getTime() + lagHours * 3600_000),
    severity: 1 + Math.floor(rng() * 5),
    roomFilterId: student.roomFilterId,
    sourceWeight: isDoctor ? 1.0 : 0.6,
    promptedByAdvisoryId: null,
    doctorNotes: isDoctor ? 'Oral rehydration advised. Reviewed in 24h.' : null,
  };
}

/** Meals this student ate in the 72h before `onset`, from their tickets. */
function mealsBefore(campus: Campus, student: Student, onset: Date): string[] {
  const out: string[] = [];
  for (const meal of campus.meals) {
    const dt = onset.getTime() - meal.servingStart.getTime();
    if (dt < 0 || dt > 72 * 3600_000) continue;
    if (campus.ticketsByMeal.get(meal.id)?.has(student.id)) out.push(meal.id);
  }
  return out;
}

/* ------------------------------------------------------- background noise -- */

function generateBaseline(campus: Campus, rate: number, seed: number): ReportRecord[] {
  const rng = mulberry32(seed);
  const out: ReportRecord[] = [];
  for (const student of campus.students) {
    for (let d = 0; d < BASELINE_DAYS; d++) {
      if (rng() >= rate) continue;
      const onset = new Date(
        campus.now.getTime() - (d + rng()) * 86400_000,
      );
      out.push(makeReport(rng, student, onset, 'background', 0.35, mealsBefore(campus, student, onset)));
    }
  }
  return out;
}

/** How concentrated is the busiest block in the last 72h? Used only to search
 *  for a seed where chance alone produces a striking-looking cluster. */
function worstBlockConcentration(campus: Campus, reports: ReportRecord[]) {
  const cutoff = campus.now.getTime() - 72 * 3600_000;
  const byBlock = new Map<string, number>();
  let total = 0;
  for (const r of reports) {
    if (r.onsetTime.getTime() < cutoff || !r.roomFilterId) continue;
    const b = campus.nodeById.get(r.roomFilterId)?.blockLabel;
    if (!b) continue;
    byBlock.set(b, (byBlock.get(b) ?? 0) + 1);
    total++;
  }
  let best = '';
  let count = 0;
  for (const [b, c] of byBlock) if (c > count) [best, count] = [b, c];
  return { block: best, count, total };
}

/* ---------------------------------------------------------------- seeds --- */

export interface SeedOutcome {
  scenario: ScenarioId;
  reports: ReportRecord[];
  students: number;
  days: number;
  note: string;
}

export function seedScenario(scenario: ScenarioId, now: Date = new Date()): SeedOutcome {
  const campus = getCampus(now);
  const store = resetStore(scenario);
  counter = 0;

  let reports = generateBaseline(campus, BASELINE_RATE[scenario], seedFor(scenario));
  let note = '';

  switch (scenario) {
    case 'quiet':
      note = 'Background only. Nothing injected.';
      break;

    case 'filter_fault': {
      // One floor filter goes bad. Onset is smeared across two days, because
      // people drink from it at different times — the waterborne signature.
      const rng = mulberry32(9001);
      const target = filterId('B', 3, 'A');
      const pool = campus.studentsByFilter.get(target) ?? [];
      const picked = shuffle(rng, pool).slice(0, 9);
      for (const s of picked) {
        const hoursAgo = 6 + Math.abs(gaussian(rng, 20, 14));
        const onset = new Date(campus.now.getTime() - hoursAgo * 3600_000);
        reports.push(makeReport(rng, s, onset, 'water', 0.45, mealsBefore(campus, s, onset)));
      }
      note = '9 cases injected under Filter 3A (Block B), onset smeared over ~48h.';
      break;
    }

    case 'food': {
      // A bad batch at one meal. Everyone who ate it was equally exposed
      // (our declared uniform-batch assumption), so it lands across every
      // block AND on day scholars, which no single tank can explain.
      const rng = mulberry32(9002);
      // LUNCH, deliberately. Day scholars rarely stay for dinner, and their
      // involvement is the single cleanest piece of evidence we have: they eat
      // at the mess and drink no hostel tank water, so if they are sick the
      // water supply is ruled out campus-wide. A dinner outbreak would throw
      // that evidence away.
      const meal =
        [...campus.meals].reverse().find(
          (m) => m.mealType === 'lunch' && hoursAgo(campus, m.servingStart) > 12,
        ) ?? campus.meals[campus.meals.length - 1];
      const eaters = campus.students.filter((s) => campus.ticketsByMeal.get(meal.id)?.has(s.id));
      const dayScholarEaters = eaters.filter((s) => s.residency === 'day_scholar');
      const hostelEaters = eaters.filter((s) => s.residency === 'hosteller');
      // Everyone who ate the batch was equally exposed, so sample both groups
      // rather than letting the hostel majority crowd day scholars out.
      const picked = [
        ...shuffle(rng, hostelEaters).slice(0, 12),
        ...shuffle(rng, dayScholarEaters).slice(0, 4),
      ];
      for (const s of picked) {
        // Sharp: 3-7h after service. This tight curve is what says "toxin",
        // and it is what separates this from the filter scenario.
        const onset = new Date(meal.servingEnd.getTime() + (3 + rng() * 4) * 3600_000);
        if (onset > campus.now) continue;
        reports.push(makeReport(rng, s, onset, 'toxin', 0.5, mealsBefore(campus, s, onset)));
      }
      note = `15 cases injected among ${meal.label} eaters, onset 3-7h after service.`;
      break;
    }

    case 'coincidence': {
      // NOTHING is injected. Search seeds for a week where background noise
      // alone piles up in one block. See the file header.
      let best = { seed: 0, count: 0, reports };
      for (let s = 500; s < 700; s++) {
        const candidate = generateBaseline(campus, BASELINE_RATE.coincidence, s);
        const { count, total } = worstBlockConcentration(campus, candidate);
        // want an eye-catching absolute count that is still only a modest
        // share of a busy campus-wide week
        if (count >= 6 && count > best.count && total >= count + 5) {
          best = { seed: s, count, reports: candidate };
        }
      }
      reports = best.reports;
      const w = worstBlockConcentration(campus, reports);
      note = `Nothing injected. Background noise alone put ${w.count} of ${w.total} recent cases in ${w.block}.`;
      break;
    }
  }

  reports.sort((a, b) => a.onsetTime.getTime() - b.onsetTime.getTime());
  store.reports = reports;

  return {
    scenario,
    reports,
    students: campus.students.length,
    days: BASELINE_DAYS,
    note,
  };
}

function seedFor(s: ScenarioId) {
  return { quiet: 101, filter_fault: 202, food: 303, coincidence: 404 }[s];
}

function hoursAgo(campus: Campus, d: Date) {
  return (campus.now.getTime() - d.getTime()) / 3600_000;
}

function shuffle<T>(rng: Rng, xs: readonly T[]): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export { BLOCKS, FLOORS, HALVES };
