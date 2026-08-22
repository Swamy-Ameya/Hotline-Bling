import { resolveStudentSession } from '@/lib/auth/session';
import { buildStudentView } from '@/lib/domain/student-view';
import { StudentPoolClient } from './student-pool-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentPoolPage() {
  const { student } = await resolveStudentSession();
  const view = buildStudentView(student.id);
  if (!view) notFound();

  return <StudentPoolClient view={view} />;
}
