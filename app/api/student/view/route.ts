import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { buildStudentView } from '@/lib/domain/student-view';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const view = buildStudentView(session.userId);
  if (!view) {
    return NextResponse.json({ ok: false, error: 'Student record not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, view });
}
