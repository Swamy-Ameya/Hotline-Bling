import { getCases } from '@/lib/db';
import { AppShell } from '@/components/neu/shell';
import { DoctorClient } from './doctor-client';

export const dynamic = 'force-dynamic';

export default async function DoctorPage() {
  const seen = getCases(72).filter((c) => c.origin === 'doctor').length;
  return (
    <AppShell>
      <DoctorClient recentCount={seen} />
    </AppShell>
  );
}
