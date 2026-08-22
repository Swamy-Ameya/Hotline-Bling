'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Bell, ArrowLeft, LogOut, RefreshCw, UserCheck } from 'lucide-react';
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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSwitchRole = async (targetRole: 'doctor' | 'warden') => {
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          targetRole === 'doctor'
            ? { identifier: 'health.centre@muj.ac.in', pin: '4321' }
            : { identifier: 'warden.b4@muj.ac.in', pin: '4321' }
        ),
      });
      router.push(targetRole === 'doctor' ? '/doctor' : '/radar');
      router.refresh();
    } catch {}
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-[var(--neu-bg)]/90 backdrop-blur-xl shadow-xs">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/radar"
            title="Exit student mode to staff dashboard"
            className="flex items-center gap-1.5 rounded-xl neu-raised-sm px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all active:scale-95"
          >
            <ArrowLeft className="size-3.5 text-slate-500" />
            <span className="hidden xs:inline">Staff View</span>
          </Link>

          <Link href="/app" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg neu-raised-sm text-slate-800">
              <Shield className="size-3.5" />
            </span>
            <span className="text-xs font-bold tracking-tight text-slate-800">
              Student App
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Student Pill */}
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
            <UserCheck className="size-3 text-emerald-600" />
            {session.name.split(' ')[0]}
          </span>

          {/* Alerts Bell */}
          <Link
            href="/app/alerts"
            title="Health Advisories"
            className="relative grid size-8 place-items-center rounded-xl neu-raised-sm text-slate-600 hover:text-slate-900 transition-transform active:scale-95"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Quick Logout / Exit Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out of student account"
            className="grid size-8 place-items-center rounded-xl neu-raised-sm text-slate-500 hover:text-slate-900 transition-colors active:scale-95"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
