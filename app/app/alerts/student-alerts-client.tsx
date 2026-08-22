'use client';

import React, { useState } from 'react';
import { Bell, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { Surface, EmptyState, RiskBadge } from '@/components/neu';
import type { NotificationRow } from '@/lib/db/types';
import { timeAgo } from '@/lib/format';

export function StudentAlertsClient({
  initialNotifications,
  studentId,
}: {
  initialNotifications: NotificationRow[];
  studentId: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [testing, setTesting] = useState(false);

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch {}
  };

  const triggerDemoAlert = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (data?.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
      }
    } catch {}
    setTesting(false);
  };

  return (
    <div className="space-y-5 animate-rise">
      <Surface className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Health Advisories</h1>
          <p className="text-xs text-slate-500">Official notifications issued by hostel wardens & health centre</p>
        </div>
        <button
          onClick={triggerDemoAlert}
          disabled={testing}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 rounded-xl neu-inset-sm px-3 py-1.5 flex items-center gap-1"
        >
          <Sparkles className="size-3" /> Demo test alert
        </button>
      </Surface>

      {notifications.length === 0 ? (
        <Surface className="p-6">
          <EmptyState
            icon={<Bell className="size-10 text-slate-300" />}
            title="No Active Advisories"
            body="No health warnings or water notices currently active for your block. Everything is operating normally."
          />
        </Surface>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isUnread = !n.readAt;
            return (
              <Surface
                key={n.id}
                glow={isUnread ? n.severity : undefined}
                className={`p-5 transition-all ${
                  isUnread
                    ? 'bg-red-50/50 border border-red-200 shadow-sm'
                    : 'opacity-85'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid size-9 place-items-center rounded-xl shrink-0 ${
                        isUnread ? 'bg-red-600 text-white' : 'neu-inset-sm text-slate-500'
                      }`}
                    >
                      <ShieldAlert className="size-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{n.title}</h2>
                        {isUnread && (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{n.body}</p>
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{timeAgo(n.createdAt)}</span>
                        <span>•</span>
                        <RiskBadge level={n.severity} />
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      className="rounded-xl neu-raised-sm p-2 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
                    >
                      <Check className="size-4" />
                    </button>
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
}
