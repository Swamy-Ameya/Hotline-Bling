import { AppShell } from '@/components/neu/shell';
import { MapEditorClient } from './map-editor-client';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminMapPage() {
  await requireRole('warden', 'doctor');

  return (
    <AppShell>
      <MapEditorClient />
    </AppShell>
  );
}
