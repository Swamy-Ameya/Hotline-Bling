import { NextResponse } from 'next/server';
import { addReport, getStore } from '@/lib/store';
import { getCampus } from '@/lib/seed/campus';
import type { CreateReportRequest, CreateReportResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** POST /api/reports — a student self-reports, or a doctor files an intake. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CreateReportRequest | null;

  if (!body?.studentId || !body.symptoms?.length || !body.onsetTime) {
    return NextResponse.json(
      { ok: false, error: 'studentId, symptoms and onsetTime are required' },
      { status: 400 },
    );
  }

  const campus = getCampus(new Date());
  const student = campus.students.find(
    (s) => s.id === body.studentId || s.studentId === body.studentId,
  );
  if (!student) {
    return NextResponse.json({ ok: false, error: 'unknown student' }, { status: 404 });
  }

  const store = getStore();

  /**
   * Rumour-amplifier control.
   *
   * If this student sits inside a cohort we have already notified, the report
   * is stamped and excluded from the detection statistic — otherwise an
   * advisory manufactures the very evidence that justifies the next advisory,
   * and the system talks itself into an outbreak. It still counts for care and
   * still shows in case lists. It just does not get to vote on whether an
   * outbreak exists.
   */
  const prior = student.roomFilterId
    ? store.advisories.find((a) => a.cohortNodeId === student.roomFilterId)
    : undefined;

  const isDoctor = body.reportedBy === 'doctor';
  const id = `rep-live-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  addReport({
    id,
    studentId: student.id,
    reportedBy: isDoctor ? 'doctor' : 'self',
    symptoms: body.symptoms,
    mealsEaten: body.mealsEaten ?? [],
    onsetTime: new Date(body.onsetTime),
    reportTime: new Date(),
    severity: body.severity ?? 3,
    roomFilterId: student.roomFilterId,
    // A clinician who examined the patient is worth more than a tap on a phone.
    sourceWeight: isDoctor ? 1.0 : 0.6,
    promptedByAdvisoryId: prior?.id ?? null,
    doctorNotes: body.doctorNotes ?? null,
  });

  const payload: CreateReportResponse = { ok: true, reportId: id };
  return NextResponse.json(payload);
}

/** GET /api/reports — lightweight status, useful for smoke-testing. */
export async function GET() {
  const store = getStore();
  return NextResponse.json({
    ok: true,
    scenario: store.scenario,
    count: store.reports.length,
  });
}
