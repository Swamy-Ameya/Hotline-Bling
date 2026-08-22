/**
 * Row types — one per table in db/schema.sql.
 *
 * These are the shapes the app reads. Today they come from a seeded in-memory
 * store (lib/db/mock.ts); swapping to live Postgres means changing lib/db/index.ts
 * only, because every query in the app already goes through it.
 */

import type { Confidence, LikelySource, RiskLevel } from '@/lib/domain/risk';

export type StaffRole = 'doctor' | 'warden' | 'admin';
export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';
export type AlertState = 'draft' | 'sent' | 'resolved' | 'dismissed';
export type PoolId = 'gastro' | 'respiratory' | 'fever' | 'skin' | 'other';

export type Symptom =
  | 'vomiting'
  | 'loose_motions'
  | 'stomach_pain'
  | 'nausea'
  | 'fever'
  | 'headache'
  | 'weakness'
  | 'dehydration'
  | 'cough'
  | 'sore_throat'
  | 'body_ache'
  | 'rash'
  | 'itching'
  | 'breathlessness'
  | 'runny_nose';

export const SYMPTOM_LABEL: Record<Symptom, string> = {
  vomiting: 'Vomiting',
  loose_motions: 'Loose motions',
  stomach_pain: 'Stomach pain',
  nausea: 'Nausea',
  fever: 'Fever',
  headache: 'Headache',
  weakness: 'Weakness',
  dehydration: 'Dehydration',
  cough: 'Cough',
  sore_throat: 'Sore throat',
  body_ache: 'Body ache',
  rash: 'Skin rash',
  itching: 'Itching',
  breathlessness: 'Breathlessness',
  runny_nose: 'Runny nose',
};

export interface StudentRow {
  id: string;
  registration: string;
  name: string;
  email: string;
  phone: string;
  /** null = day scholar: eats at the mess, drinks no hostel water. */
  blockId: string | null;
  floor: number | null;
  room: string | null;
  messId: string | null;
}

export interface StaffRow {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  blockId: string | null;
}

export interface ConsultationRow {
  id: string;
  studentId: string;
  doctorId: string;
  symptoms: Symptom[];
  onsetAt: string;
  seenAt: string;
  severity: number;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  recalledMealIds: string[];
  pool?: PoolId;
}

export interface SelfReportRow {
  id: string;
  studentId: string;
  symptoms: Symptom[];
  onsetAt: string;
  reportedAt: string;
  severity: number;
  recalledMealIds: string[];
  promptedByAlertId: string | null;
  pool?: PoolId;
}

export interface MessMealRow {
  id: string;
  messId: string;
  servedOn: string;
  mealType: MealType;
  menuItems: string[];
  opensAt: string;
  closesAt: string;
}

export interface MealAttendanceRow {
  id: string;
  mealId: string;
  studentId: string;
  scannedAt: string;
}

export interface WaterTestRow {
  id: string;
  sourceId: string;
  testedAt: string;
  testedBy: string | null;
  tds: number | null;
  ph: number | null;
  chlorine: number | null;
  turbidity: number | null;
  coliform: boolean | null;
  passed: boolean;
  notes: string | null;
}

export interface ClusterRow {
  id: string;
  detectedAt: string;
  windowStart: string;
  windowEnd: string;
  blockId: string | null;
  floor: number | null;
  level: RiskLevel;
  confidence: Confidence;
  likelySource: LikelySource;
  caseCount: number;
  usualCount: number;
  summary: string;
  recommendedAction: string | null;
  suspectMealId: string | null;
  resolvedAt: string | null;
  resolvedCause: string | null;
}

export interface AlertRow {
  id: string;
  clusterId: string;
  state: AlertState;
  blockId: string | null;
  floor: number | null;
  title: string;
  body: string;
  createdAt: string;
  sentAt: string | null;
  sentBy: string | null;
  recipients: number;
  /** Several floors of one block. Additive — `floor` still handles the single case. */
  floors?: number[] | null;
  /**
   * Addressed to the students who scanned into one sitting rather than to a
   * place. A food cluster crosses blocks, so a block address would miss most
   * of the people at risk and reach hundreds who are not.
   */
  mealId?: string | null;
  /** How the recipients were chosen — rendered in the alert log. */
  audience?: 'campus' | 'block' | 'floor' | 'meal';
}

export interface NotificationRow {
  id: string;
  studentId: string;
  alertId: string;
  title: string;
  body: string;
  severity: RiskLevel;
  readAt: string | null;
  createdAt: string;
}

/** A case, joined and ready to render — either channel. */
export interface CaseView {
  id: string;
  origin: 'doctor' | 'self';
  studentId: string;
  studentName: string;
  registration: string;
  blockName: string | null;
  floor: number | null;
  room: string | null;
  symptoms: Symptom[];
  onsetAt: string;
  recordedAt: string;
  severity: number;
  diagnosis: string | null;
  prompted: boolean;
  pool?: PoolId;
}
