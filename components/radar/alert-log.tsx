'use client';

/**
 * Everything that has actually been sent.
 *
 * This closes the loop the dispatch console opens: an advisory leaves here
 * with an audience attached, and the log shows what that audience was. Being
 * able to point at "meal · 84 recipients" a week later is the difference
 * between a system a campus trusts and one it stops reading.
 */

import React, { useEffect, useState } from 'react';
import { StatusMark, timeAgo } from '@/components/neu';
import type { AlertRow } from '@/lib/db/types';

const AUDIENCE_LABEL: Record<string, string> = {
  meal: 'Meal cohort',
  floor: 'Floor',
  block: 'Block',
  campus: 'Campus-wide',
};

export function AlertLog({ refreshKey = 0 }: { refreshKey?: number }) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        setAlerts(json.alerts ?? []);
        setLoaded(true);
      })
      .catch(() => {
        // The log is a record, not a control. A failed read is not worth an
        // error state sitting on the dashboard looking broken.
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-line-light pb-2">
        <span className="meta">Advisories sent</span>
        <span className="meta tabular-nums">{alerts.length}</span>
      </div>

      {!loaded ? (
        <div className="mt-3 h-px w-full animate-shimmer" />
      ) : alerts.length === 0 ? (
        <p className="mt-3 text-[12px] leading-relaxed text-muted-ink">
          Nothing has been sent. The system will not send anything on its own — every advisory here
          is one a person decided to issue.
        </p>
      ) : (
        <ul className="mt-1">
          {alerts.slice(0, 6).map((a) => (
            <li key={a.id} className="border-b border-line-light py-3">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-ink">
                    {a.title}
                  </span>
                  <span className="mt-0.5 block meta">
                    {AUDIENCE_LABEL[a.audience ?? 'block'] ?? 'Block'} ·{' '}
                    <span className="tabular-nums">{a.recipients}</span> recipients ·{' '}
                    {timeAgo(a.sentAt ?? a.createdAt)}
                  </span>
                </span>
                <StatusMark
                  label={a.state}
                  tone={a.state === 'sent' ? 'critical' : a.state === 'resolved' ? 'ok' : 'neutral'}
                  square={a.state === 'sent'}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
