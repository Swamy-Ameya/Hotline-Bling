import { NextResponse } from 'next/server';
import { createDirectNotification, getStudent } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json().catch(() => ({}));
    const targetStudentId = body.studentId || session?.userId;

    if (!targetStudentId) {
      return NextResponse.json({ ok: false, error: 'Target student ID required' }, { status: 400 });
    }

    const student = getStudent(targetStudentId);
    if (!student) {
      return NextResponse.json({ ok: false, error: 'Student not found' }, { status: 404 });
    }

    const blockLabel = student.blockId ? `Block ${student.blockId.replace('block-', '')}` : 'Campus';

    const notif = createDirectNotification({
      studentId: targetStudentId,
      title: `Suspected outbreak near you — ${blockLabel}`,
      body: `Health surveillance detected higher than normal stomach complaints in ${blockLabel}. Avoid unboiled water and report any symptoms immediately.`,
      severity: 'critical',
    });

    return NextResponse.json({ ok: true, notification: notif });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send test alert';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
