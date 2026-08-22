'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Radar, LogIn, LogOut, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Session } from '@/lib/auth/session';

const NAV = [
  { href: '/radar', label: 'Dashboard' },
  { href: '/doctor', label: 'Health centre' },
  { href: '/app', label: 'Student App' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.session) setSession(data.session);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="neu-page min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-[var(--neu-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl neu-raised-sm text-slate-700 transition-transform group-hover:scale-105">
              <Radar className="size-4" />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-slate-800">
              Outbreak Radar
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-xl px-3.5 py-2 text-sm font-medium transition-all flex items-center gap-1.5',
                    active
                      ? 'neu-inset-sm text-slate-800'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {item.href === '/app' && <Smartphone className="size-3.5" />}
                  {item.label}
                </Link>
              );
            })}

            {session ? (
              <div className="ml-2 flex items-center gap-2">
                <span className="rounded-full bg-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-700 capitalize">
                  {session.name.split(' ')[0]} ({session.role})
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="rounded-xl neu-raised-sm p-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 inline-flex items-center gap-1.5 rounded-xl neu-raised-sm px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                <LogIn className="size-3.5" />
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-white/40 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 text-xs text-slate-400">
          <span>Outbreak Radar · Manipal University Jaipur</span>
          <span>
            Health information is only shown to staff who need it. Individual records are visible to
            the health centre alone.
          </span>
        </div>
      </footer>
    </div>
  );
}
