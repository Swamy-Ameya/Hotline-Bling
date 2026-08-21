/**
 * ============================================================================
 *  CAMPUS — the resource graph, the roster, and the mess calendar
 * ============================================================================
 *  Deterministic. Built once per process and cached.
 *
 *  The shape here is load-bearing for detection, not decoration:
 *    - ONE tank per block, feeding all of its floors. No two blocks share a
 *      tank, so a cluster confined to one block can only be that block's water.
 *    - TWO filters per floor, each serving a different room range. This is the
 *      finest resolution we can localise to, and it is what lets us tell a
 *      warden which specific filter to replace.
 *    - ONE mess, shared by every block AND by day scholars. It is the only node
 *      every case can have in common, so it must be tested against every
 *      cluster, however tight that cluster looks spatially.
 *    - Day scholars eat at the mess and drink no hostel tank water, which makes
 *      them a free control group: if they are sick, water is near-eliminated.
 * ============================================================================
 */

import type { InfraNode, Residency } from '@/lib/types';
import { mulberry32 } from '@/lib/rng';

export const BLOCKS = ['A', 'B', 'C', 'D'] as const;
export const FLOORS = [1, 2, 3, 4, 5] as const;
export const HALVES = ['A', 'B'] as const;

export const ROOT_ID = 'source';
export const MESS_ID = 'mess';

export type BlockLetter = (typeof BLOCKS)[number];

export interface Student {
  id: string;
  name: string;
  studentId: string;
  residency: Residency;
  roomNumber: string | null;
  /** null for day scholars — they have no hostel water lineage at all. */
  roomFilterId: string | null;
  blockLabel: string | null;
  floorLabel: string | null;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner';
  items: string[];
  servingStart: Date;
  servingEnd: Date;
  label: string; // "Tue dinner"
}

export interface Campus {
  nodes: InfraNode[];
  nodeById: Map<string, InfraNode>;
  childrenOf: Map<string, string[]>;
  students: Student[];
  studentsByFilter: Map<string, Student[]>;
  meals: Meal[];
  /** mealId -> student ids who ate it. The denominator for every 2x2 table. */
  ticketsByMeal: Map<string, Set<string>>;
  now: Date;
}

/* ---------------------------------------------------------------- ids ----- */

export function filterId(block: string, floor: number, half: string) {
  return `filter-${block}${floor}${half}`;
}
export function floorId(block: string, floor: number) {
  return `floor-${block}${floor}`;
}
export function tankId(block: string) {
  return `tank-${block}`;
}

/** Uneven on purpose. If every filter served the same number of students, raw
 *  counts and attack rates would agree and the denominator argument would be
 *  invisible on screen. */
export function filterPopulation(block: string, floor: number, half: string): number {
  const r = mulberry32(block.charCodeAt(0) * 1000 + floor * 10 + half.charCodeAt(0));
  return 12 + Math.floor(r() * 7); // 12..18
}

function roomRange(floor: number, half: string, pop: number) {
  const start = floor * 100 + (half === 'A' ? 1 : 21);
  return `${start}-${start + pop - 1}`;
}

export const DAY_SCHOLAR_COUNT = 140;

/* ------------------------------------------------------------ the graph -- */

function buildNodes(): InfraNode[] {
  const nodes: InfraNode[] = [
    {
      id: ROOT_ID,
      name: 'Main source',
      type: 'source',
      parentId: null,
      servesRooms: null,
      exposedPopulation: 0,
      blockLabel: null,
      floorLabel: null,
    },
    {
      id: MESS_ID,
      name: 'Mess',
      type: 'mess',
      parentId: ROOT_ID,
      servesRooms: null,
      exposedPopulation: 0,
      blockLabel: null,
      floorLabel: null,
    },
    ...['M1', 'M2'].map((m) => ({
      id: `mess-${m}`,
      name: `Mess filter ${m}`,
      type: 'filter' as const,
      parentId: MESS_ID,
      servesRooms: null,
      exposedPopulation: 0,
      blockLabel: null,
      floorLabel: null,
    })),
  ];

  for (const b of BLOCKS) {
    nodes.push({
      id: tankId(b),
      name: `Tank ${b}`,
      type: 'tank',
      parentId: ROOT_ID,
      servesRooms: null,
      exposedPopulation: 0,
      blockLabel: `Block ${b}`,
      floorLabel: null,
    });
    for (const f of FLOORS) {
      nodes.push({
        id: floorId(b, f),
        name: `Block ${b} Floor ${f}`,
        type: 'floor',
        parentId: tankId(b),
        servesRooms: null,
        exposedPopulation: 0,
        blockLabel: `Block ${b}`,
        floorLabel: `Floor ${f}`,
      });
      for (const h of HALVES) {
        const pop = filterPopulation(b, f, h);
        nodes.push({
          id: filterId(b, f, h),
          name: `Filter ${f}${h}`,
          type: 'filter',
          parentId: floorId(b, f),
          servesRooms: roomRange(f, h, pop),
          exposedPopulation: pop,
          blockLabel: `Block ${b}`,
          floorLabel: `Floor ${f}`,
        });
      }
    }
  }
  return nodes;
}

/** Roll leaf populations up the tree so every node carries a real denominator. */
function rollUpPopulations(nodes: InfraNode[], childrenOf: Map<string, string[]>) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visit = (id: string): number => {
    const node = byId.get(id)!;
    const kids = childrenOf.get(id) ?? [];
    if (kids.length === 0) return node.exposedPopulation;
    const total = kids.reduce((s, k) => s + visit(k), 0);
    node.exposedPopulation = total;
    return total;
  };
  for (const b of BLOCKS) visit(tankId(b));

  // Everyone eats at the mess: all hostellers plus day scholars.
  const hostellers = BLOCKS.reduce((s, b) => s + byId.get(tankId(b))!.exposedPopulation, 0);
  const messTotal = hostellers + DAY_SCHOLAR_COUNT;
  byId.get(MESS_ID)!.exposedPopulation = messTotal;
  byId.get('mess-M1')!.exposedPopulation = messTotal;
  byId.get('mess-M2')!.exposedPopulation = messTotal;
  byId.get(ROOT_ID)!.exposedPopulation = messTotal;
}

/* --------------------------------------------------------------- roster -- */

const FIRST = ['Aarav', 'Isha', 'Rohan', 'Meera', 'Kabir', 'Ananya', 'Vivaan', 'Diya', 'Arjun', 'Sara', 'Neel', 'Tara', 'Reyansh', 'Kavya', 'Aditya', 'Nisha'];
const LAST = ['Sharma', 'Verma', 'Iyer', 'Reddy', 'Nair', 'Bose', 'Kulkarni', 'Menon', 'Gupta', 'Rao', 'Joshi', 'Desai'];

function buildStudents(nodes: InfraNode[]): Student[] {
  const rng = mulberry32(20260822);
  const students: Student[] = [];
  let n = 0;

  for (const node of nodes) {
    if (node.type !== 'filter' || node.id.startsWith('mess-')) continue;
    const m = /^filter-([A-D])(\d)([AB])$/.exec(node.id)!;
    const [, block, floorStr, half] = m;
    const floor = Number(floorStr);
    const firstRoom = floor * 100 + (half === 'A' ? 1 : 21);

    for (let i = 0; i < node.exposedPopulation; i++) {
      n++;
      students.push({
        id: `stu-${n}`,
        name: `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`,
        studentId: `MUJ${String(23000 + n)}`,
        residency: 'hosteller',
        roomNumber: String(firstRoom + i),
        roomFilterId: node.id,
        blockLabel: `Block ${block}`,
        floorLabel: `Floor ${floor}`,
      });
    }
  }

  for (let i = 0; i < DAY_SCHOLAR_COUNT; i++) {
    n++;
    students.push({
      id: `stu-${n}`,
      name: `${FIRST[Math.floor(rng() * FIRST.length)]} ${LAST[Math.floor(rng() * LAST.length)]}`,
      studentId: `MUJ${String(23000 + n)}`,
      residency: 'day_scholar',
      roomNumber: null,
      roomFilterId: null,
      blockLabel: null,
      floorLabel: null,
    });
  }

  return students;
}

/* ----------------------------------------------------------- mess & meals -- */

const MENUS: Record<Meal['mealType'], string[][]> = {
  breakfast: [
    ['Poha', 'Boiled eggs', 'Tea'],
    ['Idli', 'Sambar', 'Coconut chutney'],
    ['Paratha', 'Curd', 'Pickle'],
  ],
  lunch: [
    ['Rajma', 'Rice', 'Salad', 'Buttermilk'],
    ['Chole', 'Bhature', 'Onion salad'],
    ['Dal tadka', 'Jeera rice', 'Mixed veg'],
  ],
  dinner: [
    ['Paneer butter masala', 'Rice', 'Raita'],
    ['Egg curry', 'Chapati', 'Salad'],
    ['Veg pulao', 'Dal fry', 'Curd'],
  ],
};

const MEAL_HOURS: Record<Meal['mealType'], [number, number]> = {
  breakfast: [7.5, 9.5],
  lunch: [12.5, 14.5],
  dinner: [19.5, 21.5],
};

function buildMeals(now: Date, days: number): Meal[] {
  const rng = mulberry32(77);
  const meals: Meal[] = [];
  for (let d = days; d >= 0; d--) {
    const day = new Date(now.getTime() - d * 86400_000);
    const ymd = day.toISOString().slice(0, 10);
    for (const mealType of ['breakfast', 'lunch', 'dinner'] as const) {
      const [h0, h1] = MEAL_HOURS[mealType];
      const start = new Date(day);
      start.setHours(Math.floor(h0), (h0 % 1) * 60, 0, 0);
      const end = new Date(day);
      end.setHours(Math.floor(h1), (h1 % 1) * 60, 0, 0);
      const options = MENUS[mealType];
      meals.push({
        id: `meal-${ymd}-${mealType}`,
        date: ymd,
        mealType,
        items: options[Math.floor(rng() * options.length)],
        servingStart: start,
        servingEnd: end,
        label: `${day.toLocaleDateString('en-IN', { weekday: 'short' })} ${mealType}`,
      });
    }
  }
  return meals;
}

/** Who ate what. ~72% attendance, which gives the 2x2 a real "well" column
 *  and a real unexposed group. Without this there is no relative risk. */
function buildTickets(students: Student[], meals: Meal[]): Map<string, Set<string>> {
  const rng = mulberry32(4242);
  const map = new Map<string, Set<string>>();
  for (const meal of meals) {
    const eaters = new Set<string>();
    for (const s of students) {
      // day scholars skip dinner far more often than hostellers
      const base = s.residency === 'day_scholar' ? (meal.mealType === 'dinner' ? 0.15 : 0.55) : 0.72;
      if (rng() < base) eaters.add(s.id);
    }
    map.set(meal.id, eaters);
  }
  return map;
}

/* --------------------------------------------------------------- build --- */

let cached: Campus | null = null;

export function getCampus(now: Date = new Date()): Campus {
  if (cached) return cached;

  const nodes = buildNodes();
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const list = childrenOf.get(n.parentId) ?? [];
    list.push(n.id);
    childrenOf.set(n.parentId, list);
  }
  rollUpPopulations(nodes, childrenOf);

  const students = buildStudents(nodes);
  const studentsByFilter = new Map<string, Student[]>();
  for (const s of students) {
    if (!s.roomFilterId) continue;
    const list = studentsByFilter.get(s.roomFilterId) ?? [];
    list.push(s);
    studentsByFilter.set(s.roomFilterId, list);
  }

  const meals = buildMeals(now, 7);

  cached = {
    nodes,
    nodeById: new Map(nodes.map((n) => [n.id, n])),
    childrenOf,
    students,
    studentsByFilter,
    meals,
    ticketsByMeal: buildTickets(students, meals),
    now,
  };
  return cached;
}

/** All node ids in the subtree rooted at `id`, inclusive. The TypeScript
 *  equivalent of the recursive CTE in db/schema.sql. */
export function descendants(campus: Campus, id: string): string[] {
  const out: string[] = [];
  const walk = (nid: string) => {
    out.push(nid);
    for (const k of campus.childrenOf.get(nid) ?? []) walk(k);
  };
  walk(id);
  return out;
}

/** Leaf filter ids under `id` — the only nodes reports actually attach to. */
export function leafFiltersUnder(campus: Campus, id: string): string[] {
  return descendants(campus, id).filter(
    (n) => campus.nodeById.get(n)?.type === 'filter' && !n.startsWith('mess-'),
  );
}
