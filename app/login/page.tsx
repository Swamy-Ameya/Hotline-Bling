import { AppShell } from '@/components/neu/shell';
import { LoginClient } from './login-client';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    if (session.role === 'student') redirect('/app');
    if (session.role === 'doctor') redirect('/doctor');
    redirect('/radar');
  }

  return (
    <AppShell>
      <LoginClient />
    </AppShell>
  );
}
