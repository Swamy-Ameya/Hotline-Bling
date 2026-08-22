import { NextResponse } from 'next/server';
import { findStudent, getMealsEatenBy, searchStudents } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** GET /api/students?q=... — typeahead for the doctor console and report form. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const exact = searchParams.get('exact');

  if (exact) {
    const student = findStudent(exact);
    if (!student) {
      return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      student,
      recentMeals: getMealsEatenBy(student.id, 72),
    });
  }

  return NextResponse.json({ ok: true, results: searchStudents(q) });
}
