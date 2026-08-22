/**
 * ============================================================================
 *  DATA ACCESS
 * ============================================================================
 *  The only module in the app that knows where data lives.
 *
 *  Right now every function reads from the seeded mock (lib/db/mock.ts). To go
 *  live against Postgres, rewrite the bodies here to run the SQL in
 *  db/schema.sql — no page, component or API route changes, because nothing
 *  else touches storage directly.
 * ============================================================================
 */

import { BLOCKS, MESSES, blockById, blockCapacity } from '@/lib/domain/campus';
import { getMockDb, mutateDb } from '@/lib/db/mock';
import { poolFor } from '@/lib/domain/pools';
import type {
  AlertRow,
  CaseView,
  ClusterRow,
  ConsultationRow,
  MessMealRow,
  NotificationRow,
  PoolId,
  SelfReportRow,
  StaffRow,
  StudentRow,
  Symptom,
  WaterTestRow,
} from '@/lib/db/types';

/* -------------------------------------------------------------- students -- */

export function listStudents(limit = 50): StudentRow[] {
  return getMockDb().students.slice(0, limit);
}

export function countStudents(): number {
  return getMockDb().students.length;
}

export function findStudent(query: string): StudentRow | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return getMockDb().students.find(
    (s) =>
      s.registration.toLowerCase() === q ||
      s.id === q ||
      s.name.toLowerCase() === q ||
      s.email.toLowerCase() === q,
  );
}

export function findStudentByExactRegistration(reg: string): StudentRow | undefined {
  const q = reg.trim().toLowerCase();
  if (!q) return undefined;
  return getMockDb().students.find((s) => s.registration.toLowerCase() === q || s.id.toLowerCase() === q);
}

export function searchStudents(query: string, limit = 8): StudentRow[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return getMockDb()
    .students.filter(
      (s) =>
        s.registration.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.room ?? '').toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export function getStudent(id: string): StudentRow | undefined {
  return getMockDb().students.find((s) => s.id === id);
}

/* ----------------------------------------------------------------- staff -- */

export function listStaff(): StaffRow[] {
  return getMockDb().staff;
}

export function getDoctors(): StaffRow[] {
  return getMockDb().staff.filter((s) => s.role === 'doctor');
}

export function getStaffById(id: string): StaffRow | undefined {
  return getMockDb().staff.find((s) => s.id === id);
}

export function findStaffByEmail(email: string): StaffRow | undefined {
  const q = email.trim().toLowerCase();
  return getMockDb().staff.find((s) => s.email.toLowerCase() === q);
}

/* ----------------------------------------------------------------- cases -- */

/** Both reporting channels, joined with the student, newest onset first. */
export function getCases(windowHours = 72): CaseView[] {
  const db = getMockDb();
  const cutoff = db.now.getTime() - windowHours * 3600_000;
  const byId = new Map(db.students.map((s) => [s.id, s]));

  const out: CaseView[] = [];

  for (const c of db.consultations) {
    if (new Date(c.onsetAt).getTime() < cutoff) continue;
    const s = byId.get(c.studentId);
    if (!s) continue;
    out.push({
      id: c.id,
      origin: 'doctor',
      studentId: s.id,
      studentName: s.name,
      registration: s.registration,
      blockName: s.blockId ? (blockById(s.blockId)?.name ?? null) : null,
      floor: s.floor,
      room: s.room,
      symptoms: c.symptoms,
      onsetAt: c.onsetAt,
      recordedAt: c.seenAt,
      severity: c.severity,
      diagnosis: c.diagnosis,
      prompted: false,
      pool: c.pool ?? poolFor(c.symptoms),
    });
  }

  for (const r of db.selfReports) {
    if (new Date(r.onsetAt).getTime() < cutoff) continue;
    const s = byId.get(r.studentId);
    if (!s) continue;
    out.push({
      id: r.id,
      origin: 'self',
      studentId: s.id,
      studentName: s.name,
      registration: s.registration,
      blockName: s.blockId ? (blockById(s.blockId)?.name ?? null) : null,
      floor: s.floor,
      room: s.room,
      symptoms: r.symptoms,
      onsetAt: r.onsetAt,
      recordedAt: r.reportedAt,
      severity: r.severity,
      diagnosis: null,
      prompted: r.promptedByAlertId !== null,
      pool: r.pool ?? poolFor(r.symptoms),
    });
  }

  return out.sort((a, b) => +new Date(b.onsetAt) - +new Date(a.onsetAt));
}

/** Historic daily case counts, for the baseline and the trend chart. */
export function getDailyCounts(days = 30): { date: string; count: number }[] {
  const db = getMockDb();
  const buckets = new Map<string, number>();
  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(db.now.getTime() - d * 86400_000).toISOString().slice(0, 10);
    buckets.set(day, 0);
  }
  const bump = (isoDate: string) => {
    const key = isoDate.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  };
  db.consultations.forEach((c) => bump(c.onsetAt));
  db.selfReports.forEach((r) => bump(r.onsetAt));
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

/* ------------------------------------------------------------------ mess -- */

export function getRecentMeals(hours = 96): MessMealRow[] {
  const db = getMockDb();
  const cutoff = db.now.getTime() - hours * 3600_000;
  return db.meals
    .filter((m) => {
      const t = new Date(m.opensAt).getTime();
      return t >= cutoff && t <= db.now.getTime();
    })
    .sort((a, b) => +new Date(b.opensAt) - +new Date(a.opensAt));
}

export function getMeal(id: string): MessMealRow | undefined {
  return getMockDb().meals.find((m) => m.id === id);
}

/** How many students that mess could serve — the denominator for "is this
 *  meal unusual, or does everybody just eat lunch?" */
export function getMessEligibleCount(messId: string): number {
  return getMockDb().students.filter((s) => s.messId === messId).length;
}

export function getMealAttendees(mealId: string): Set<string> {
  const db = getMockDb();
  if (db.attendanceByMeal) {
    return db.attendanceByMeal.get(mealId) ?? new Set<string>();
  }
  return new Set(
    db.attendance.filter((a) => a.mealId === mealId).map((a) => a.studentId),
  );
}

export function getMealsEatenBy(studentId: string, hours = 72): MessMealRow[] {
  const db = getMockDb();
  const cutoff = db.now.getTime() - hours * 3600_000;
  if (db.attendanceByStudent) {
    const records = db.attendanceByStudent.get(studentId) ?? [];
    const ids = new Set(
      records
        .filter((a) => new Date(a.scannedAt).getTime() >= cutoff)
        .map((a) => a.mealId),
    );
    return db.meals.filter((m) => ids.has(m.id));
  }
  const ids = new Set(
    db.attendance
      .filter((a) => a.studentId === studentId && new Date(a.scannedAt).getTime() >= cutoff)
      .map((a) => a.mealId),
  );
  return db.meals.filter((m) => ids.has(m.id));
}

/* ----------------------------------------------------------------- water -- */

export function getWaterTests(sourceId?: string): WaterTestRow[] {
  const db = getMockDb();
  const rows = sourceId ? db.waterTests.filter((w) => w.sourceId === sourceId) : db.waterTests;
  return [...rows].sort((a, b) => +new Date(b.testedAt) - +new Date(a.testedAt));
}

export function getLatestWaterTest(sourceId: string): WaterTestRow | undefined {
  return getWaterTests(sourceId)[0];
}

export function recordWaterTest(row: Omit<WaterTestRow, 'id'>): WaterTestRow {
  const created: WaterTestRow = { ...row, id: `wt-live-${Date.now()}` };
  mutateDb((db) => db.waterTests.push(created));
  return created;
}

/* ---------------------------------------------------------------- writes -- */

export function createSelfReport(input: {
  studentId: string;
  symptoms: Symptom[];
  onsetAt: string;
  severity: number;
  mealIds?: string[];
}): SelfReportRow {
  const db = getMockDb();
  const student = db.students.find((s) => s.id === input.studentId);

  /**
   * If this student is already inside a cohort we alerted, the report is
   * stamped and kept out of detection. Otherwise an alert generates the very
   * reports that appear to justify the next alert — the system talks itself
   * into an outbreak. It still counts for care and still shows in case lists.
   */
  const prior = db.alerts.find(
    (a) =>
      a.state === 'sent' &&
      student?.blockId === a.blockId &&
      (a.floor === null || a.floor === student?.floor),
  );

  const row: SelfReportRow = {
    id: `srep-live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId: input.studentId,
    symptoms: input.symptoms,
    onsetAt: input.onsetAt,
    reportedAt: new Date().toISOString(),
    severity: input.severity,
    recalledMealIds: input.mealIds ?? [],
    promptedByAlertId: prior?.id ?? null,
    pool: poolFor(input.symptoms),
  };
  mutateDb((d) => d.selfReports.push(row));
  return row;
}

export function createConsultation(input: {
  studentId: string;
  doctorId: string;
  symptoms: Symptom[];
  onsetAt: string;
  severity: number;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  mealIds?: string[];
}): ConsultationRow {
  const row: ConsultationRow = {
    id: `con-live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId: input.studentId,
    doctorId: input.doctorId,
    symptoms: input.symptoms,
    onsetAt: input.onsetAt,
    seenAt: new Date().toISOString(),
    severity: input.severity,
    diagnosis: input.diagnosis ?? null,
    prescription: input.prescription ?? null,
    notes: input.notes ?? null,
    recalledMealIds: input.mealIds ?? [],
    pool: poolFor(input.symptoms),
  };
  mutateDb((db) => db.consultations.push(row));
  return row;
}

/* ---------------------------------------------------------------- alerts & notifications -- */

export function listAlerts(): AlertRow[] {
  return [...getMockDb().alerts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/**
 * Work out who an advisory is actually addressed to.
 *
 * Order matters: a meal cohort wins over a place, because a food cluster
 * crosses blocks and addressing it by block would both miss most of the people
 * at risk and reach hundreds who were never exposed.
 */
export function resolveAudience(input: {
  blockId?: string | null;
  floor?: number | null;
  floors?: number[] | null;
  mealId?: string | null;
}): { studentIds: string[]; audience: NonNullable<AlertRow['audience']> } {
  const db = getMockDb();

  if (input.mealId) {
    const attendees = getMealAttendees(input.mealId);
    return { studentIds: [...attendees], audience: 'meal' };
  }

  const floors = input.floors && input.floors.length ? input.floors : null;

  const matched = db.students.filter((s) => {
    if (input.blockId && s.blockId !== input.blockId) return false;
    if (floors) return s.floor != null && floors.includes(s.floor);
    if (input.floor != null) return s.floor === input.floor;
    return true;
  });

  const audience = !input.blockId
    ? 'campus'
    : floors || input.floor != null
      ? 'floor'
      : 'block';

  return { studentIds: matched.map((s) => s.id), audience };
}

export function createAlert(input: {
  clusterId: string;
  blockId: string | null;
  floor: number | null;
  floors?: number[] | null;
  mealId?: string | null;
  title: string;
  body: string;
  sentBy?: string;
}): AlertRow {
  const { studentIds, audience } = resolveAudience(input);
  const db = getMockDb();
  const matchingStudents = db.students.filter((s) => studentIds.includes(s.id));

  const alertId = `alert-${Date.now()}`;
  const nowStr = new Date().toISOString();

  const row: AlertRow = {
    id: alertId,
    clusterId: input.clusterId,
    state: 'sent',
    blockId: input.blockId,
    floor: input.floor,
    floors: input.floors ?? null,
    mealId: input.mealId ?? null,
    audience,
    title: input.title,
    body: input.body,
    createdAt: nowStr,
    sentAt: nowStr,
    sentBy: input.sentBy ?? 'staff-admin-1',
    recipients: matchingStudents.length,
  };

  // Fan out notification rows to each recipient student
  const notifs: NotificationRow[] = matchingStudents.map((s, idx) => ({
    id: `notif-${alertId}-${s.id}-${idx}`,
    studentId: s.id,
    alertId,
    title: input.title,
    body: input.body,
    severity: 'watch' as const,
    readAt: null,
    createdAt: nowStr,
  }));

  mutateDb((d) => {
    d.alerts.push(row);
    d.notifications.push(...notifs);
  });

  return row;
}

export function setAlertState(id: string, state: AlertRow['state']) {
  mutateDb((db) => {
    const a = db.alerts.find((x) => x.id === id);
    if (a) a.state = state;
  });
}

export function getStudentNotifications(studentId: string): NotificationRow[] {
  const db = getMockDb();
  return db.notifications
    .filter((n) => n.studentId === studentId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function markNotificationRead(id: string): void {
  mutateDb((db) => {
    const n = db.notifications.find((x) => x.id === id);
    if (n && !n.readAt) n.readAt = new Date().toISOString();
  });
}

export function createDirectNotification(input: {
  studentId: string;
  title: string;
  body: string;
  severity?: 'normal' | 'watch' | 'elevated' | 'critical';
  alertId?: string;
}): NotificationRow {
  const nowStr = new Date().toISOString();
  const row: NotificationRow = {
    id: `notif-direct-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId: input.studentId,
    alertId: input.alertId ?? 'demo-test-alert',
    title: input.title,
    body: input.body,
    severity: input.severity ?? 'watch',
    readAt: null,
    createdAt: nowStr,
  };
  mutateDb((db) => db.notifications.push(row));
  return row;
}

export function getStudentSelfReports(studentId: string): SelfReportRow[] {
  const db = getMockDb();
  return db.selfReports
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
}

/* -------------------------------------------------------------- rollups --- */

export interface BlockRollup {
  blockId: string;
  blockName: string;
  gender: 'boys' | 'girls';
  capacity: number;
  cases: number;
  doctorConfirmed: number;
  floors: { floor: number; cases: number }[];
  lat: number;
  lng: number;
}

export function getBlockRollups(windowHours = 72): BlockRollup[] {
  const cases = getCases(windowHours);
  return BLOCKS.map((b) => {
    const mine = cases.filter((c) => c.blockName === b.name);
    const floors = Array.from({ length: b.floors }, (_, i) => ({
      floor: i + 1,
      cases: mine.filter((c) => c.floor === i + 1).length,
    }));
    return {
      blockId: b.id,
      blockName: b.name,
      gender: b.gender,
      capacity: blockCapacity(b),
      cases: mine.length,
      doctorConfirmed: mine.filter((c) => c.origin === 'doctor').length,
      floors,
      lat: b.lat,
      lng: b.lng,
    };
  });
}

export function getDayScholarCases(windowHours = 72): number {
  return getCases(windowHours).filter((c) => c.blockName === null).length;
}

export { BLOCKS, MESSES };
export type { ClusterRow, NotificationRow, PoolId };
