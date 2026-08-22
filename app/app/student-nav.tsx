'use client';

/**
 * The student tab bar.
 *
 * Four destinations, text-led, square. Icons were doing no work here — every
 * label is one short word, and a row of glyphs made it look like a game.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function StudentNavigation({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: '/app', label: 'Home' },
    { href: '/app/report', label: 'Report' },
    { href: '/app/pool', label: 'Pool' },
    { href: '/app/alerts', label: 'Alerts', badge: unreadCount },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line-light bg-paper/95 backdrop-blur-md">
      <div className="mx-auto grid h-14 max-w-2xl grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'relative flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                active ? 'text-ink' : 'text-muted-ink',
              )}
            >
              {active && <span className="absolute inset-x-5 top-0 h-px bg-ink" />}
              {t.label}
              {t.badge ? (
                <span className="ml-1.5 inline-flex size-4 items-center justify-center bg-thermal-red text-[9px] font-bold text-white">
                  {t.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
