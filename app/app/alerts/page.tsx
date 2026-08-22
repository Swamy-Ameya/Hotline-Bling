import { requireRole } from '@/lib/auth/session';
import { getStudentNotifications } from '@/lib/db';
import { StudentAlertsClient } from './student-alerts-client';

export const dynamic = 'force-dynamic';

export default async function StudentAlertsPage() {
  const session = await requireRole('student', 'doctor', 'warden');
  const notifications = getStudentNotifications(session.userId);

  return <StudentAlertsClient initialNotifications={notifications} studentId={session.userId} />;
}
