import { requireRole } from '@/lib/auth/session';
import { getStudent, getMealsEatenBy } from '@/lib/db';
import { StudentReportClient } from './student-report-client';
import { notFound } from 'next/navigation';
import { blockById } from '@/lib/domain/campus';

export const dynamic = 'force-dynamic';

export default async function StudentReportPage() {
  const session = await requireRole('student', 'doctor', 'warden');
  const student = getStudent(session.userId);
  if (!student) notFound();

  const blockName = student.blockId ? (blockById(student.blockId)?.name ?? null) : null;
  const recentMeals = getMealsEatenBy(student.id, 72);

  return (
    <StudentReportClient
      student={{
        id: student.id,
        name: student.name,
        registration: student.registration,
        blockName,
        floor: student.floor,
        room: student.room,
      }}
      recentMeals={recentMeals}
    />
  );
}
