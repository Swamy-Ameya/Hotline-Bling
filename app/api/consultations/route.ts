import { NextResponse } from 'next/server';
import { createConsultation, findStudent, getMealsEatenBy } from '@/lib/db';
import type { Symptom } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/consultations
 *
 * What the campus doctor files during a visit — the high-trust channel. The
 * student's block, floor and room come from the roster, so the doctor never
 * has to ask for them; the form is symptoms, when it started, and what they
 * were prescribed.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.student || !body?.symptoms?.length || !body?.onsetAt) {
    return NextResponse.json(
      { ok: false, error: 'student, symptoms and onsetAt are required' },
      { status: 400 },
    );
  }

  const student = findStudent(String(body.student));
  if (!student) {
    return NextResponse.json(
      { ok: false, error: `No student found for "${body.student}"` },
      { status: 404 },
    );
  }

  // Pull the meals they actually collected in the 72h before onset straight
  // from the mess scans, rather than asking a sick student to remember.
  const meals = getMealsEatenBy(student.id, 72).map((m) => m.id);

  const row = createConsultation({
    studentId: student.id,
    doctorId: body.doctorId ?? 'staff-doc-1',
    symptoms: body.symptoms as Symptom[],
    onsetAt: body.onsetAt,
    severity: Number(body.severity ?? 3),
    diagnosis: body.diagnosis,
    prescription: body.prescription,
    notes: body.notes,
    mealIds: meals,
  });

  return NextResponse.json({
    ok: true,
    id: row.id,
    student: {
      name: student.name,
      registration: student.registration,
      block: student.blockId,
      floor: student.floor,
      room: student.room,
    },
    mealsLinked: meals.length,
  });
}
