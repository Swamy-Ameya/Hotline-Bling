import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/session';
import { StudentNavigation } from './student-nav';
import { getStudentNotifications } from '@/lib/db';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('student', 'doctor', 'warden');
  const notifications = getStudentNotifications(session.userId);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="neu-page min-h-screen pb-24 md:pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/40 bg-[var(--neu-bg)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/app" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl neu-raised-sm text-slate-700">
              <Shield className="size-4" />
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-800">
              Outbreak Radar <span className="text-xs font-normal text-slate-400">· Student</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              {session.name.split(' ')[0]} ({session.identifier})
            </span>
            <Link
              href="/app/alerts"
              className="relative grid size-8 place-items-center rounded-xl neu-raised-sm text-slate-600 hover:text-slate-900 transition-transform active:scale-95"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>

      {/* Fixed Bottom Tab Navigation (Mobile & Desktop) */}
      <StudentNavigation unreadCount={unreadCount} />
    </div>
  );
}
