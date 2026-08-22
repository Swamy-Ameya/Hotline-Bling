import { NextResponse } from 'next/server';
import { createSelfReport, findStudent, getStudent, getCases, getMealsEatenBy } from '@/lib/db';
import type { Symptom } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports — a student reporting their own symptoms.
 *
 * Lower trust than a doctor's record, and that is fine: the value is timing.
 * Most people do not visit a health centre for a mild stomach upset, and the
 * ones who eventually do turn up a day or two late. This channel is what makes
 * the difference between noticing on day one and noticing on day three.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const studentIdentifier = body?.studentId || body?.student;

  if (!studentIdentifier || !body?.symptoms?.length || !body?.onsetAt) {
    return NextResponse.json(
      { ok: false, error: 'student, symptoms and onsetAt are required' },
      { status: 400 },
    );
  }

  const student = getStudent(String(studentIdentifier)) ?? findStudent(String(studentIdentifier));
  if (!student) {
    return NextResponse.json(
      { ok: false, error: `No student found for "${studentIdentifier}"` },
      { status: 404 },
    );
  }

  const selectedMealIds = Array.isArray(body.mealIds) && body.mealIds.length > 0
    ? body.mealIds
    : getMealsEatenBy(student.id, 72).map((m) => m.id);

  const row = createSelfReport({
    studentId: student.id,
    symptoms: body.symptoms as Symptom[],
    onsetAt: body.onsetAt,
    severity: Number(body.severity ?? 2),
    mealIds: selectedMealIds,
  });

  return NextResponse.json({
    ok: true,
    id: row.id,
    prompted: row.promptedByAlertId !== null,
    pool: row.pool,
    student: {
      name: student.name,
      registration: student.registration,
      block: student.blockId,
      floor: student.floor,
      room: student.room,
    },
  });
}

/** GET /api/reports — recent cases, both channels. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hours = Number(searchParams.get('hours') ?? 72);
  return NextResponse.json({ ok: true, cases: getCases(hours) });
}
