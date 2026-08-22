import { resolveStudentSession } from '@/lib/auth/session';
import { getMealsEatenBy } from '@/lib/db';
import { StudentReportClient } from './student-report-client';
import { blockById } from '@/lib/domain/campus';

export const dynamic = 'force-dynamic';

export default async function StudentReportPage() {
  const { student } = await resolveStudentSession();

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
