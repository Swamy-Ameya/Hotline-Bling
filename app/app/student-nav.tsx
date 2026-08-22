'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Activity, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StudentNavigation({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: '/app', label: 'Home', icon: Home },
    { href: '/app/report', label: 'Report', icon: PlusCircle, highlight: true },
    { href: '/app/pool', label: 'My Pool', icon: Activity },
    { href: '/app/alerts', label: 'Alerts', icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/40 bg-[var(--neu-bg)]/90 backdrop-blur-xl shadow-lg">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-3">
        {tabs.map((t) => {
          const active = pathname === t.href;
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all text-xs font-semibold',
                active
                  ? 'text-slate-900 scale-105'
                  : 'text-slate-400 hover:text-slate-700',
                t.highlight && !active && 'text-indigo-600 font-bold',
              )}
            >
              <div className="relative">
                <Icon className={cn('size-5', t.highlight ? 'size-6 stroke-[2.2]' : '')} />
                {t.badge && t.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {t.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
