'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Session } from '@/lib/auth/session';

export function StudentHeader({
  session,
  unreadCount = 0,
}: {
  session: Session;
  unreadCount?: number;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line-light bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex h-13 max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/app" className="flex items-center gap-2">
          <span className="block size-2 bg-thermal-red" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
            Outbreak Radar
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-ink sm:inline">
            {session.name.replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s+/i, '').split(' ')[0]}
          </span>

          {unreadCount > 0 && (
            <Link
              href="/app/alerts"
              className="inline-flex items-center gap-1.5 bg-thermal-red px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
            >
              {unreadCount} new
            </Link>
          )}

          <Link href="/radar" className="meta transition-colors hover:text-ink">
            Staff
          </Link>

          <button
            onClick={logout}
            disabled={loggingOut}
            className="meta transition-colors hover:text-ink disabled:opacity-40"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
