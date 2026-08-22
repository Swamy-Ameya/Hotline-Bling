import { requireRole } from '@/lib/auth/session';
import { buildStudentView } from '@/lib/domain/student-view';
import { StudentHomeClient } from './student-home-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentHomePage() {
  const session = await requireRole('student', 'doctor', 'warden');
  const view = buildStudentView(session.userId);
  if (!view) notFound();

  return <StudentHomeClient view={view} />;
}
