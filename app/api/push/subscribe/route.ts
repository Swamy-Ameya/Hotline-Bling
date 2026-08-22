import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { saveSubscription } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ ok: false, error: 'Invalid PushSubscription payload' }, { status: 400 });
    }

    saveSubscription({
      studentId: session.userId,
      endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      subscribedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Subscription failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
