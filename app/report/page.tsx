import { AppShell } from '@/components/neu/shell';
import { ReportClient } from './report-client';

export const dynamic = 'force-dynamic';

export default function ReportPage() {
  return (
    <AppShell>
      <ReportClient />
    </AppShell>
  );
}
