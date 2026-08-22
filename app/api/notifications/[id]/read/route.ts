import { NextResponse } from 'next/server';
import { markNotificationRead } from '@/lib/db';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  markNotificationRead(id);

  return NextResponse.json({ ok: true });
}
