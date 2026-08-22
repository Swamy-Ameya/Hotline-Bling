import { NextResponse } from 'next/server';
import { resolveStudentSession } from '@/lib/auth/session';
import { buildStudentView } from '@/lib/domain/student-view';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { student } = await resolveStudentSession();
  const view = buildStudentView(student.id);
  if (!view) {
    return NextResponse.json({ ok: false, error: 'Student record not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, view });
}
