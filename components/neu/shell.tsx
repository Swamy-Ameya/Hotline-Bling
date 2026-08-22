'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Radar,
  LogIn,
  LogOut,
  Smartphone,
  Stethoscope,
  MapPin,
  ChevronDown,
  User,
  ShieldAlert,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Session } from '@/lib/auth/session';

const NAV = [
  { href: '/radar', label: 'Dashboard', icon: Radar },
  { href: '/doctor', label: 'Health Centre', icon: Stethoscope },
  { href: '/app', label: 'Student App', icon: Smartphone, highlight: true },
  { href: '/admin/map', label: 'Placement Map', icon: MapPin },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.session) setSession(data.session);
        else setSession(null);
      })
      .catch(() => {});
  }, [pathname]);

  // Close role dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    setShowRoleMenu(false);
    router.push('/login');
    router.refresh();
  };

  const handleQuickSwitch = async (role: 'student' | 'doctor' | 'warden') => {
    setSwitching(true);
    try {
      let identifier = '2502050001';
      let pin = '1234';
      let targetPath = '/app';

      if (role === 'doctor') {
        identifier = 'health.centre@muj.ac.in';
        pin = '4321';
        targetPath = '/doctor';
      } else if (role === 'warden') {
        identifier = 'warden.b4@muj.ac.in';
        pin = '4321';
        targetPath = '/radar';
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, pin }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setShowRoleMenu(false);
        setMobileMenuOpen(false);
        router.push(targetPath);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="neu-page min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/40 bg-[var(--neu-bg)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl neu-raised-sm text-slate-800 transition-transform group-hover:scale-105">
                <Radar className="size-4" />
              </span>
              <span className="text-base font-bold tracking-tight text-slate-800">
                Outbreak Radar
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href + '/'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-xl px-3.5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5',
                    active
                      ? 'neu-inset-sm text-slate-900 bg-white/80'
                      : 'text-slate-500 hover:text-slate-900',
                    item.highlight && !active && 'text-indigo-600 font-bold',
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}

            {/* Quick Role Switcher Dropdown */}
            <div className="relative ml-2" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 rounded-xl neu-raised-sm px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all"
              >
                <User className="size-3.5 text-slate-500" />
                <span>
                  {session ? (
                    <>
                      {session.name.split(' ')[0]}{' '}
                      <span className="capitalize text-slate-400 font-normal">
                        ({session.role})
                      </span>
                    </>
                  ) : (
                    'Demo Role'
                  )}
                </span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl border border-slate-200/80 z-50 animate-rise text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Switch Active Role
                    </span>
                    <Sparkles className="size-3 text-indigo-500" />
                  </div>

                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => handleQuickSwitch('student')}
                    className={cn(
                      'w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-slate-50',
                      session?.role === 'student' && 'bg-indigo-50/80 text-indigo-900 font-bold',
                    )}
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                      🎓
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800">Demo Student</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Ishaan Reddy · 2502050001 (B1-101)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => handleQuickSwitch('doctor')}
                    className={cn(
                      'w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-slate-50',
                      session?.role === 'doctor' && 'bg-emerald-50/80 text-emerald-900 font-bold',
                    )}
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                      🩺
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800">Demo Doctor</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Campus Health Centre Clinic
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => handleQuickSwitch('warden')}
                    className={cn(
                      'w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-slate-50',
                      session?.role === 'warden' && 'bg-amber-50/80 text-amber-900 font-bold',
                    )}
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
                      🏢
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800">Demo Warden</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Block B4 Warden Console
                      </div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    {session ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left rounded-xl px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                      >
                        <LogOut className="size-3.5" /> Sign Out
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setShowRoleMenu(false)}
                        className="w-full rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-semibold"
                      >
                        <LogIn className="size-3.5" /> Manual Sign In
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid size-9 place-items-center rounded-xl neu-raised-sm text-slate-700"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/40 bg-[var(--neu-bg)] px-4 py-4 space-y-2 animate-rise">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                    active ? 'neu-inset-sm text-slate-900 bg-white' : 'text-slate-600',
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-200/60 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                1-Tap Demo Switch
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('student')}
                  className="rounded-xl neu-raised-sm p-2 text-center text-xs font-semibold text-slate-800"
                >
                  🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('doctor')}
                  className="rounded-xl neu-raised-sm p-2 text-center text-xs font-semibold text-slate-800"
                >
                  🩺 Doctor
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('warden')}
                  className="rounded-xl neu-raised-sm p-2 text-center text-xs font-semibold text-slate-800"
                >
                  🏢 Warden
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/40 py-8 mt-auto bg-[var(--neu-bg)]/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 text-xs text-slate-400">
          <span>Outbreak Radar · Manipal University Jaipur</span>
          <span>
            Health surveillance & micro-outbreak early detection system.
          </span>
        </div>
      </footer>
    </div>
  );
}
