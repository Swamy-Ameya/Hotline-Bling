import { resolveStudentSession } from '@/lib/auth/session';
import { buildStudentView } from '@/lib/domain/student-view';
import { StudentHomeClient } from './student-home-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentHomePage() {
  const { student } = await resolveStudentSession();
  const view = buildStudentView(student.id);
  if (!view) notFound();

  return <StudentHomeClient view={view} />;
}
