'use client';

/**
 * Advisories addressed to this student.
 *
 * Every message here was sent by a person, to a specific floor or a specific
 * meal sitting. That is worth saying on the screen: an advisory a student
 * believes was blasted to the whole campus is one they will ignore next time.
 */

import React, { useState } from 'react';
import { EmptyState, RiskBadge } from '@/components/neu';
import type { NotificationRow } from '@/lib/db/types';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

export function StudentAlertsClient({
  initialNotifications,
  studentId,
}: {
  initialNotifications: NotificationRow[];
  studentId: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [testing, setTesting] = useState(false);

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch {}
  }

  async function triggerDemoAlert() {
    setTesting(true);
    try {
      const res = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (data?.notification) setNotifications((prev) => [data.notification, ...prev]);
    } catch {}
    setTesting(false);
  }

  return (
    <div className="animate-rise">
      <div className="flex items-end justify-between border-b border-ink pb-3">
        <div>
          <span className="eyebrow">Advisories</span>
          <h1 className="mt-1.5 text-[18px] font-bold tracking-[-0.02em] text-ink">
            Sent to you, by a person
          </h1>
        </div>
        <button
          onClick={triggerDemoAlert}
          disabled={testing}
          className="meta transition-colors hover:text-ink disabled:opacity-40"
        >
          {testing ? 'Sending…' : 'Demo alert'}
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing active"
            body="No advisory is out for your block or for any meal you ate. You will get one only if a person decides to send it."
          />
        </div>
      ) : (
        <div className="mt-6">
          {notifications.map((n) => {
            const unread = !n.readAt;
            return (
              <article
                key={n.id}
                className={cn(
                  'border-b border-line-light py-5',
                  unread && 'border-l-2 border-l-thermal-red pl-4',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-[14px] font-semibold text-ink">{n.title}</h2>
                      {unread && (
                        <span className="bg-thermal-red px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{n.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <span className="meta">{timeAgo(n.createdAt)}</span>
                      <RiskBadge level={n.severity} />
                    </div>
                  </div>

                  {unread && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="shrink-0 border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-ink transition-colors hover:border-ink hover:text-ink"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
