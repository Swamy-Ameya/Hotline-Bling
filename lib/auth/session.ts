import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type UserRole = 'student' | 'doctor' | 'warden';

export interface Session {
  role: UserRole;
  userId: string;
  name: string;
  identifier: string;
  blockId?: string | null;
  email?: string;
}

const COOKIE_NAME = 'outbreak_session';

/**
 * Reads and parses the current session from cookies.
 * Next.js 16: cookies() is async and must be awaited.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) return null;

    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')) as Session;
    if (!parsed || !parsed.role || !parsed.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Encodes session data for setting the cookie.
 */
export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

export { COOKIE_NAME };

/**
 * Route protection guard for server components.
 * Redirects unauthenticated users to /login and student users away from warden/doctor tools.
 */
export async function requireRole(...roles: UserRole[]): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  if (roles.length > 0 && !roles.includes(session.role)) {
    if (session.role === 'student') {
      redirect('/app');
    } else {
      redirect('/radar');
    }
  }

  return session;
}
