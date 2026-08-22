/**
 * ============================================================================
 *  MOCK DATABASE
 * ============================================================================
 *  A seeded, deterministic stand-in for Postgres, in exactly the row shapes
 *  db/schema.sql defines. Every query the app makes goes through lib/db, so
 *  pointing this at a live database later is a change to one module.
 *
 *  The data is meant to look like a real week on a real campus: roughly 4,500
 *  students, a mess serving four sittings a day, a steady trickle of ordinary
 *  stomach upsets, and — because a dashboard with nothing on it teaches nobody
 *  anything — one situation actually developing right now.
 * ============================================================================
 */

import { mulberry32 } from '@/lib/rng';
import {
  BLOCKS,
  MESSES,
  RO_PLANT,
  TANKS,
  blockCapacity,
  messForBlock,
  roomNumber,
} from '@/lib/domain/campus';
import type {
  AlertRow,
  ConsultationRow,
  MealAttendanceRow,
  MessMealRow,
  SelfReportRow,
  StaffRow,
  StudentRow,
  Symptom,
  WaterTestRow,
  MealType,
} from '@/lib/db/types';

/* -------------------------------------------------------------- helpers -- */

const FIRST_M = ['Aarav', 'Rohan', 'Kabir', 'Vivaan', 'Arjun', 'Neel', 'Reyansh', 'Aditya', 'Karan', 'Ishaan', 'Yash', 'Dhruv', 'Rahul', 'Siddharth', 'Aryan'];
const FIRST_F = ['Isha', 'Meera', 'Ananya', 'Diya', 'Sara', 'Tara', 'Kavya', 'Nisha', 'Riya', 'Aditi', 'Sneha', 'Pooja', 'Anjali', 'Shreya', 'Priya'];
const LAST = ['Sharma', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Bose', 'Kulkarni', 'Menon', 'Gupta', 'Rao', 'Joshi', 'Desai', 'Agarwal', 'Chauhan', 'Malhotra'];

const BREAKFAST = [
  ['Poha', 'Boiled eggs', 'Bread & butter', 'Tea'],
  ['Idli', 'Sambar', 'Coconut chutney', 'Coffee'],
  ['Aloo paratha', 'Curd', 'Pickle', 'Tea'],
  ['Upma', 'Banana', 'Milk'],
];
const LUNCH = [
  ['Rajma', 'Jeera rice', 'Roti', 'Salad', 'Buttermilk'],
  ['Chole', 'Bhature', 'Onion salad', 'Boondi raita'],
  ['Dal tadka', 'Steamed rice', 'Mix veg', 'Papad'],
  ['Kadhi pakora', 'Rice', 'Roti', 'Green salad'],
];
const SNACKS = [
  ['Samosa', 'Green chutney', 'Tea'],
  ['Pakora', 'Ketchup', 'Coffee'],
  ['Bread pakora', 'Tea'],
];
const DINNER = [
  ['Paneer butter masala', 'Roti', 'Rice', 'Raita'],
  ['Egg curry', 'Roti', 'Rice', 'Salad'],
  ['Veg pulao', 'Dal fry', 'Curd'],
  ['Chana masala', 'Poori', 'Halwa'],
];

const MENUS: Record<MealType, string[][]> = {
  breakfast: BREAKFAST,
  lunch: LUNCH,
  snacks: SNACKS,
  dinner: DINNER,
};

const MEAL_WINDOWS: Record<MealType, [number, number]> = {
  breakfast: [7.5, 9.5],
  lunch: [12.5, 14.5],
  snacks: [17, 18.5],
  dinner: [19.5, 21.5],
};

const ORDINARY: Symptom[][] = [
  ['stomach_pain'],
  ['nausea', 'headache'],
  ['loose_motions'],
  ['nausea', 'stomach_pain'],
  ['headache', 'weakness'],
];

const FOODBORNE: Symptom[][] = [
  ['vomiting', 'nausea', 'stomach_pain'],
  ['vomiting', 'loose_motions', 'weakness'],
  ['vomiting', 'nausea'],
  ['loose_motions', 'stomach_pain', 'dehydration'],
];

const WATERBORNE: Symptom[][] = [
  ['loose_motions', 'stomach_pain'],
  ['loose_motions', 'fever', 'weakness'],
  ['loose_motions', 'nausea', 'dehydration'],
  ['stomach_pain', 'fever'],
];

const DAY_SCHOLARS = 420;
const HISTORY_DAYS = 30;

/** Background rate of ordinary stomach complaints, per student per day.
 *  On a campus this size that's a handful a day — completely normal, and the
 *  thing any detection has to be able to see past. */
const BASE_RATE = 0.0016;

function iso(d: Date) {
  return d.toISOString();
}

/* ---------------------------------------------------------------- seed --- */

export interface MockDatabase {
  students: StudentRow[];
  staff: StaffRow[];
  meals: MessMealRow[];
  attendance: MealAttendanceRow[];
  consultations: ConsultationRow[];
  selfReports: SelfReportRow[];
  waterTests: WaterTestRow[];
  alerts: AlertRow[];
  now: Date;
}

let cache: MockDatabase | null = null;

export function getMockDb(): MockDatabase {
  if (cache) return cache;
  cache = seed();
  return cache;
}

/** Used by write paths so a newly filed report shows up immediately. */
export function mutateDb(fn: (db: MockDatabase) => void) {
  fn(getMockDb());
}

function seed(): MockDatabase {
  const rng = mulberry32(20260822);
  const now = new Date();

  /* ---- staff ---- */
  const staff: StaffRow[] = [
    { id: 'staff-doc-1', name: 'Dr. Meenakshi Rao', role: 'doctor', email: 'health.centre@muj.ac.in', blockId: null },
    { id: 'staff-doc-2', name: 'Dr. Ashok Sinha', role: 'doctor', email: 'ashok.sinha@muj.ac.in', blockId: null },
    { id: 'staff-admin-1', name: 'Chief Warden Office', role: 'admin', email: 'chiefwarden@muj.ac.in', blockId: null },
    ...BLOCKS.map((b, i) => ({
      id: `staff-warden-${b.name}`,
      name: `Warden — ${b.name}`,
      role: 'warden' as const,
      email: `warden.${b.name.toLowerCase()}@muj.ac.in`,
      blockId: b.id,
    })),
  ];

  /* ---- students ---- */
  const students: StudentRow[] = [];
  let regSeq = 0;

  for (const block of BLOCKS) {
    const names = block.gender === 'boys' ? FIRST_M : FIRST_F;
    const mess = messForBlock(block.id);
    for (let f = 1; f <= block.floors; f++) {
      for (let r = 0; r < block.roomsPerFloor; r++) {
        for (let s = 0; s < block.studentsPerRoom; s++) {
          regSeq++;
          students.push({
            id: `stu-${regSeq}`,
            registration: `24FE${String(10000 + regSeq)}`,
            name: `${names[Math.floor(rng() * names.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`,
            email: `student${regSeq}@muj.ac.in`,
            phone: `9${Math.floor(100000000 + rng() * 899999999)}`,
            blockId: block.id,
            floor: f,
            room: roomNumber(f, r),
            messId: mess?.id ?? null,
          });
        }
      }
    }
  }

  // Day scholars: no block, no hostel water. They matter because if they are
  // ill alongside hostellers, the water supply is effectively ruled out.
  for (let i = 0; i < DAY_SCHOLARS; i++) {
    regSeq++;
    const male = rng() < 0.55;
    const names = male ? FIRST_M : FIRST_F;
    students.push({
      id: `stu-${regSeq}`,
      registration: `24FE${String(10000 + regSeq)}`,
      name: `${names[Math.floor(rng() * names.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`,
      email: `student${regSeq}@muj.ac.in`,
      phone: `9${Math.floor(100000000 + rng() * 899999999)}`,
      blockId: null,
      floor: null,
      room: null,
      messId: MESSES[0].id,
    });
  }

  /* ---- mess meals ---- */
  const meals: MessMealRow[] = [];
  for (let d = HISTORY_DAYS; d >= 0; d--) {
    const day = new Date(now.getTime() - d * 86400_000);
    const servedOn = day.toISOString().slice(0, 10);
    for (const mess of MESSES) {
      for (const mealType of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
        const [h0, h1] = MEAL_WINDOWS[mealType];
        const opens = new Date(day);
        opens.setHours(Math.floor(h0), Math.round((h0 % 1) * 60), 0, 0);
        const closes = new Date(day);
        closes.setHours(Math.floor(h1), Math.round((h1 % 1) * 60), 0, 0);
        const options = MENUS[mealType];
        meals.push({
          id: `meal-${mess.id}-${servedOn}-${mealType}`,
          messId: mess.id,
          servedOn,
          mealType,
          menuItems: options[Math.floor(rng() * options.length)],
          opensAt: iso(opens),
          closesAt: iso(closes),
        });
      }
    }
  }

  /* ---- meal attendance (only recent days; that's all detection needs) ---- */
  const attendance: MealAttendanceRow[] = [];
  const recentMeals = meals.filter(
    (m) => now.getTime() - new Date(m.opensAt).getTime() < 5 * 86400_000,
  );
  let attSeq = 0;
  for (const meal of recentMeals) {
    const eligible = students.filter((s) => s.messId === meal.messId);
    const rate = meal.mealType === 'snacks' ? 0.28 : meal.mealType === 'breakfast' ? 0.55 : 0.74;
    for (const s of eligible) {
      // day scholars rarely stay for dinner
      const adj = s.blockId === null && meal.mealType === 'dinner' ? 0.12 : rate;
      if (rng() >= adj) continue;
      attSeq++;
      const open = new Date(meal.opensAt).getTime();
      const close = new Date(meal.closesAt).getTime();
      attendance.push({
        id: `att-${attSeq}`,
        mealId: meal.id,
        studentId: s.id,
        scannedAt: iso(new Date(open + rng() * (close - open))),
      });
    }
  }

  const ateMeal = (mealId: string) =>
    new Set(attendance.filter((a) => a.mealId === mealId).map((a) => a.studentId));

  const mealsBefore = (studentId: string, onset: Date) =>
    attendance
      .filter((a) => {
        if (a.studentId !== studentId) return false;
        const dt = onset.getTime() - new Date(a.scannedAt).getTime();
        return dt > 0 && dt < 72 * 3600_000;
      })
      .map((a) => a.mealId);

  /* ---- ordinary background illness ---- */
  const consultations: ConsultationRow[] = [];
  const selfReports: SelfReportRow[] = [];
  let cSeq = 0;
  let sSeq = 0;

  const addCase = (
    student: StudentRow,
    onset: Date,
    symptoms: Symptom[],
    severity: number,
    viaDoctor: boolean,
    diagnosis?: string,
  ) => {
    const recalled = mealsBefore(student.id, onset);
    if (viaDoctor) {
      cSeq++;
      consultations.push({
        id: `con-${cSeq}`,
        studentId: student.id,
        doctorId: rng() < 0.6 ? 'staff-doc-1' : 'staff-doc-2',
        symptoms,
        onsetAt: iso(onset),
        // Students usually turn up several hours to a day after symptoms begin.
        // That lag is exactly why a clinic-only system notices late.
        seenAt: iso(new Date(onset.getTime() + (4 + rng() * 22) * 3600_000)),
        severity,
        diagnosis: diagnosis ?? 'Acute gastroenteritis',
        prescription:
          severity >= 4
            ? 'ORS sachets 6-hourly, Ondansetron 4mg SOS, Metronidazole 400mg TDS x3d'
            : 'ORS sachets, light diet, review in 24h',
        notes: severity >= 4 ? 'Advised rest. Review if no improvement in 24h.' : null,
        recalledMealIds: recalled,
      });
    } else {
      sSeq++;
      selfReports.push({
        id: `srep-${sSeq}`,
        studentId: student.id,
        symptoms,
        onsetAt: iso(onset),
        reportedAt: iso(new Date(onset.getTime() + (1 + rng() * 8) * 3600_000)),
        severity,
        recalledMealIds: recalled,
        promptedByAlertId: null,
      });
    }
  };

  for (const student of students) {
    for (let d = 0; d < HISTORY_DAYS; d++) {
      if (rng() >= BASE_RATE) continue;
      const onset = new Date(now.getTime() - (d + rng()) * 86400_000);
      const symptoms = ORDINARY[Math.floor(rng() * ORDINARY.length)];
      const severity = 1 + Math.floor(rng() * 3);
      addCase(student, onset, symptoms, severity, rng() < 0.4);
    }
  }

  /* ---- what is happening right now ----------------------------------------
     A tank problem in one boys' block, developing over the last two days.
     Symptoms are waterborne in character, onset is spread out rather than
     sharp, and it is confined to one block — which is what points at that
     block's own overhead tank rather than the mess everyone shares.        */
  const affected = BLOCKS.find((b) => b.name === 'B4')!;
  const inBlock = students.filter((s) => s.blockId === affected.id);
  const picked = shuffle(rng, inBlock).slice(0, 14);
  picked.forEach((s, i) => {
    const hoursAgo = 4 + rng() * 40;
    const onset = new Date(now.getTime() - hoursAgo * 3600_000);
    addCase(
      s,
      onset,
      WATERBORNE[Math.floor(rng() * WATERBORNE.length)],
      2 + Math.floor(rng() * 3),
      i < 8, // most of these did reach the health centre
      'Acute gastroenteritis — suspected waterborne',
    );
  });

  /* ---- a smaller, older food incident, already resolved ---- */
  const lunchTwoDaysAgo = meals.find(
    (m) =>
      m.mealType === 'lunch' &&
      m.messId === MESSES[0].id &&
      now.getTime() - new Date(m.opensAt).getTime() > 60 * 3600_000 &&
      now.getTime() - new Date(m.opensAt).getTime() < 84 * 3600_000,
  );
  if (lunchTwoDaysAgo) {
    const eaters = [...ateMeal(lunchTwoDaysAgo.id)];
    const sample = shuffle(rng, eaters).slice(0, 9);
    for (const sid of sample) {
      const s = students.find((x) => x.id === sid);
      if (!s) continue;
      const onset = new Date(new Date(lunchTwoDaysAgo.closesAt).getTime() + (3 + rng() * 5) * 3600_000);
      if (onset > now) continue;
      addCase(s, onset, FOODBORNE[Math.floor(rng() * FOODBORNE.length)], 2 + Math.floor(rng() * 3), rng() < 0.55);
    }
  }

  /* ---- water testing history ---- */
  const waterTests: WaterTestRow[] = [];
  let wSeq = 0;
  for (const src of [RO_PLANT, ...TANKS]) {
    for (let d = 28; d >= 0; d -= 7) {
      wSeq++;
      const isAffected = src.id === affected.tankId;
      const recent = d <= 7;
      const bad = isAffected && recent;
      waterTests.push({
        id: `wt-${wSeq}`,
        sourceId: src.id,
        testedAt: iso(new Date(now.getTime() - d * 86400_000)),
        testedBy: 'staff-admin-1',
        tds: bad ? 430 + rng() * 60 : 180 + rng() * 90,
        ph: bad ? 6.2 + rng() * 0.3 : 7.0 + rng() * 0.5,
        chlorine: bad ? 0.02 + rng() * 0.05 : 0.4 + rng() * 0.3,
        turbidity: bad ? 5.5 + rng() * 3 : 0.4 + rng() * 0.8,
        coliform: bad,
        passed: !bad,
        notes: bad ? 'Residual chlorine near zero. Tank due for cleaning.' : null,
      });
    }
  }

  return {
    students,
    staff,
    meals,
    attendance,
    consultations,
    selfReports,
    waterTests,
    alerts: [],
    now,
  };
}

function shuffle<T>(rng: () => number, xs: readonly T[]): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export { blockCapacity };
