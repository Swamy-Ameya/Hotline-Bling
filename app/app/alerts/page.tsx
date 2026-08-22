import { resolveStudentSession } from '@/lib/auth/session';
import { getStudentNotifications } from '@/lib/db';
import { StudentAlertsClient } from './student-alerts-client';

export const dynamic = 'force-dynamic';

export default async function StudentAlertsPage() {
  const { student } = await resolveStudentSession();
  const notifications = getStudentNotifications(student.id);

  return <StudentAlertsClient initialNotifications={notifications} studentId={student.id} />;
}
