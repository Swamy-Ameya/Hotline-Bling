/**
 * ============================================================================
 *  STORE
 * ============================================================================
 *  Deliberately thin. The detection engine operates on plain arrays of records,
 *  never on a database handle, so the storage layer is swappable and the engine
 *  stays unit-testable from a terminal with no database at all.
 *
 *  Today: an in-process store, seeded deterministically. Runs with zero setup,
 *  which means nobody on the team is ever blocked on Supabase credentials.
 *  When DATABASE_URL appears, only this file changes.
 * ============================================================================
 */

import type { ScenarioId, ReportSource, Symptom } from '@/lib/types';

export interface ReportRecord {
  id: string;
  studentId: string;
  reportedBy: ReportSource;
  symptoms: Symptom[];
  mealsEaten: string[];
  onsetTime: Date;
  reportTime: Date;
  severity: number;
  roomFilterId: string | null;
  sourceWeight: number;
  /** Set when this student had already been notified about a cluster.
   *  Detection ignores these rows entirely — see AGENTS.md §7. */
  promptedByAdvisoryId: string | null;
  doctorNotes: string | null;
}

export interface AdvisoryRecord {
  id: string;
  clusterId: string;
  cohortNodeId: string;
  message: string;
  sentAt: Date;
}

export interface InterventionRecord {
  id: string;
  clusterId: string;
  kind: 'water_test' | 'kitchen_inspection' | 'filter_replaced';
  tds: number | null;
  residualChlorine: number | null;
  turbidity: number | null;
  coliformPositive: boolean | null;
  outcome: string | null;
  causeCode: string | null;
  performedBy: string | null;
  performedAt: Date;
}

interface StoreState {
  scenario: ScenarioId;
  reports: ReportRecord[];
  advisories: AdvisoryRecord[];
  interventions: InterventionRecord[];
  confirmedClusters: Record<string, 'confirmed' | 'dismissed' | 'resolved'>;
  seededAt: Date;
}

/** Survives hot-reload in dev, which otherwise wipes state on every save. */
const globalRef = globalThis as unknown as { __outbreakStore?: StoreState };

function fresh(scenario: ScenarioId): StoreState {
  return {
    scenario,
    reports: [],
    advisories: [],
    interventions: [],
    confirmedClusters: {},
    seededAt: new Date(),
  };
}

export function getStore(): StoreState {
  if (!globalRef.__outbreakStore) globalRef.__outbreakStore = fresh('filter_fault');
  return globalRef.__outbreakStore;
}

export function resetStore(scenario: ScenarioId): StoreState {
  globalRef.__outbreakStore = fresh(scenario);
  return globalRef.__outbreakStore;
}

export function addReport(r: ReportRecord) {
  getStore().reports.push(r);
}

export function addIntervention(i: InterventionRecord) {
  getStore().interventions.push(i);
}

export function setClusterStatus(
  clusterId: string,
  status: 'confirmed' | 'dismissed' | 'resolved',
) {
  getStore().confirmedClusters[clusterId] = status;
}
