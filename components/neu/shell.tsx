'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radar } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/radar', label: 'Dashboard' },
  { href: '/doctor', label: 'Health centre' },
  { href: '/report', label: 'Report symptoms' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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

          <nav className="flex items-center gap-1.5">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-xl px-3.5 py-2 text-sm font-medium transition-all',
                    active
                      ? 'neu-inset-sm text-slate-800'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
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
