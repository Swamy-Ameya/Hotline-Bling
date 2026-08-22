import { getCases } from '@/lib/db';
import { AppShell } from '@/components/neu/shell';
import { DoctorClient } from './doctor-client';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function DoctorPage() {
  await requireRole('doctor');
  const seen = getCases(72).filter((c) => c.origin === 'doctor').length;
  return (
    <AppShell>
      <DoctorClient recentCount={seen} />
    </AppShell>
  );
}
