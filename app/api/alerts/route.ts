import { NextResponse } from 'next/server';
import { createAlert, listAlerts, resolveAudience, setAlertState } from '@/lib/db';
import { sendWebPushNotification } from '@/lib/push';

export const dynamic = 'force-dynamic';

/** GET /api/alerts — everything sent so far. */
export async function GET() {
  return NextResponse.json({ ok: true, alerts: listAlerts() });
}

/**
 * POST /api/alerts — send an advisory.
 *
 * Only a person can do this. Nothing in the detection path sends an alert on
 * its own: an automated public-health warning fired off unverified reports is
 * how you panic a campus at 2am.
 *
 * Sending also arms the prompted-report rule. From here on, reports from
 * students inside the notified group are kept out of the assessment, so a
 * warning cannot generate the evidence that justifies the next warning.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body?.action === 'dismiss' || body?.action === 'resolve') {
    if (!body.id) {
      return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
    }
    setAlertState(body.id, body.action === 'dismiss' ? 'dismissed' : 'resolved');
    return NextResponse.json({ ok: true });
  }

  if (!body?.title || !body?.body) {
    return NextResponse.json(
      { ok: false, error: 'title and body are required' },
      { status: 400 },
    );
  }

  const alert = createAlert({
    clusterId: body.clusterId ?? 'manual',
    blockId: body.blockId ?? null,
    floor: body.floor ?? null,
    floors: body.floors ?? null,
    mealId: body.mealId ?? null,
    title: body.title,
    body: body.body,
    sentBy: body.sentBy,
  });

  // Push goes to exactly the cohort the advisory was addressed to — the same
  // resolution the alert row recorded, never a wider one.
  const { studentIds } = resolveAudience({
    blockId: body.blockId ?? null,
    floor: body.floor ?? null,
    floors: body.floors ?? null,
    mealId: body.mealId ?? null,
  });

  sendWebPushNotification(studentIds, {
    title: body.title,
    body: body.body,
    url: '/app/alerts',
  }).catch(() => {});

  return NextResponse.json({ ok: true, alert });
}
