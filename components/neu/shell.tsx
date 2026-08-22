'use client';

/**
 * The shell.
 *
 * Navigation is deliberately almost invisible. There are three places to be —
 * the map, the clinic, the student app — and a person's job decides which one
 * they open. An earlier version had five destinations, an icon on each, a
 * drawer, and a dropdown; it competed with the map for attention and lost
 * anyone who was not already familiar with it.
 *
 * Everything else that used to live up here (the placement editor, the QR
 * code) now sits inside the screen that needs it, next to the thing it acts
 * on.
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Session } from '@/lib/auth/session';
import { LiveIndicator } from '@/components/neu';

const NAV = [
  { href: '/radar', label: 'Radar' },
  { href: '/doctor', label: 'Clinic' },
  { href: '/app', label: 'Student' },
];

const DEMO_ROLES = [
  {
    role: 'student' as const,
    label: 'Student',
    who: 'Ishaan Reddy · B1-101',
    identifier: '2502050001',
    pin: '1234',
    path: '/app',
  },
  {
    role: 'doctor' as const,
    label: 'Doctor',
    who: 'Campus Health Centre',
    identifier: 'health.centre@muj.ac.in',
    pin: '4321',
    path: '/doctor',
  },
  {
    role: 'warden' as const,
    label: 'Warden',
    who: 'Block B4 console',
    identifier: 'warden.b4@muj.ac.in',
    pin: '4321',
    path: '/radar',
  },
];

/** "Dr. Meenakshi Rao" should read as "Meenakshi", not as "Dr.". */
function shortName(name: string): string {
  const parts = name.replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s+/i, '').trim().split(/\s+/);
  return parts[0] || name;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSession(d?.session ?? null))
      .catch(() => {});
  }, [pathname]);

  // Rendered client-side only, and started at mount rather than at module load,
  // so the server and the first client paint agree on what the clock says.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, []);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  async function switchTo(entry: (typeof DEMO_ROLES)[number]) {
    setSwitching(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // `role` is required by the login route — without it every switch
        // silently 400s and the header just looks stuck.
        body: JSON.stringify({ role: entry.role, identifier: entry.identifier, pin: entry.pin }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setOpen(false);
        router.push(entry.path);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    setOpen(false);
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="paper-page paper-grain flex min-h-screen flex-col">
      <header className="sticky top-0 z-[900] border-b border-line-light bg-paper/92 backdrop-blur-md">
        <div className="editorial flex h-14 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-4 place-items-center">
                <span className="block size-2 bg-thermal-red" />
              </span>
              <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink">
                Outbreak Radar
              </span>
            </Link>

            {/* Three destinations fit on one line from 640px up. Below that
                they move to their own row rather than being crushed into a
                hamburger — a menu for three items costs a tap and teaches
                nothing. */}
            <nav className="hidden items-center gap-6 sm:flex">
              {NAV.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative py-4 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors',
                      active ? 'text-ink' : 'text-muted-ink hover:text-ink',
                    )}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute inset-x-0 -bottom-px h-px bg-ink" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <LiveIndicator at={now ?? undefined} className="hidden sm:inline-flex" />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="border border-line px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
              >
                {session ? shortName(session.name) : 'Sign in'}
                {session && <span className="ml-2 text-muted-ink">{session.role}</span>}
              </button>

              {open && (
                <div className="absolute right-0 top-full z-[950] mt-1 w-64 border border-line bg-paper-bright">
                  <div className="border-b border-line-light px-3 py-2 meta">Switch role</div>
                  {DEMO_ROLES.map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      disabled={switching}
                      onClick={() => switchTo(r)}
                      className={cn(
                        'flex w-full items-center justify-between border-b border-line-light px-3 py-2.5 text-left transition-colors hover:bg-paper-sunk',
                        session?.role === r.role && 'bg-paper-sunk',
                      )}
                    >
                      <span>
                        <span className="block text-[12px] font-semibold text-ink">{r.label}</span>
                        <span className="block text-[10px] text-muted-ink">{r.who}</span>
                      </span>
                      {session?.role === r.role && (
                        <span className="size-1.5 bg-thermal-red" />
                      )}
                    </button>
                  ))}
                  {session ? (
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink transition-colors hover:text-thermal-red"
                    >
                      Sign out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink transition-colors hover:text-ink"
                    >
                      Sign in manually
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="editorial flex items-center gap-7 border-t border-line-light py-2.5 sm:hidden">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors',
                  active ? 'text-ink underline underline-offset-[6px]' : 'text-muted-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="relative z-10 mt-auto border-t border-line-light">
        <div className="editorial flex flex-wrap items-center justify-between gap-3 py-6">
          <span className="meta">Outbreak Radar · Manipal University Jaipur</span>
          <span className="meta">Hostel micro-outbreak early warning</span>
        </div>
      </footer>
    </div>
  );
}
