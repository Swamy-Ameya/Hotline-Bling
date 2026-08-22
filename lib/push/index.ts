/**
 * Web Push Notification Dispatcher
 *
 * Dispatches Web Push notifications to subscribed student PWAs.
 * Degrades gracefully if VAPID keys are not configured.
 */

import webPush from 'web-push';

export interface StoredSubscription {
  studentId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  subscribedAt: string;
}

const subscriptions = new Map<string, StoredSubscription[]>();

export function saveSubscription(sub: StoredSubscription) {
  const existing = subscriptions.get(sub.studentId) ?? [];
  // Deduplicate by endpoint
  const filtered = existing.filter((s) => s.endpoint !== sub.endpoint);
  filtered.push(sub);
  subscriptions.set(sub.studentId, filtered);
}

export function getSubscriptionsForStudent(studentId: string): StoredSubscription[] {
  return subscriptions.get(studentId) ?? [];
}

export async function sendWebPushNotification(
  studentIds: string[],
  payload: { title: string; body: string; url?: string }
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublic || !vapidPrivate) {
    // VAPID keys not configured in environment — gracefully degrade to in-app feed
    return { sent: 0, failed: 0 };
  }

  try {
    webPush.setVapidDetails('mailto:admin@muj.ac.in', vapidPublic, vapidPrivate);

    for (const sid of studentIds) {
      const subs = getSubscriptionsForStudent(sid);
      for (const sub of subs) {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            JSON.stringify(payload),
          );
          sent++;
        } catch {
          failed++;
        }
      }
    }
  } catch {
    // Graceful fallback
  }

  return { sent, failed };
}
