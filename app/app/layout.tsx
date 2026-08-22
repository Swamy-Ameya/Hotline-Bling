import React from 'react';
import { resolveStudentSession } from '@/lib/auth/session';
import { StudentNavigation } from './student-nav';
import { StudentHeader } from './student-header';
import { getStudentNotifications } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function StudentAppLayout({ children }: { children: React.ReactNode }) {
  const { session, student } = await resolveStudentSession();
  const notifications = getStudentNotifications(student.id);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="paper-page paper-grain min-h-screen pb-20">
      {/* Top Header with Exit/Switch Action */}
      <StudentHeader session={session} unreadCount={unreadCount} />

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-6">{children}</main>

      {/* Fixed Bottom Tab Navigation (Mobile & Desktop) */}
      <StudentNavigation unreadCount={unreadCount} />
    </div>
  );
}
