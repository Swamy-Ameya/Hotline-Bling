'use client';

/**
 * Sign-in.
 *
 * Split down the middle: the campus on the left as a still thermal field, the
 * form on the right. It is the first screen anyone sees, so it has to
 * establish the visual language before the app gets data-heavy — paper, thin
 * rules, one accent, and heat only where illness is.
 *
 * There is no real auth here and the deck says so out loud (CLAUDE.md §10).
 * The demo credentials are printed on the page rather than hidden, because
 * pretending otherwise during a demo wastes everyone's time.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NeuButton, Spinner } from '@/components/neu';
import { cn } from '@/lib/utils';

type Role = 'student' | 'doctor' | 'warden';

const ROLES: {
  role: Role;
  label: string;
  identifier: string;
  pin: string;
  who: string;
  path: string;
  does: string;
}[] = [
  {
    role: 'student',
    label: 'Student',
    identifier: '2502050001',
    pin: '1234',
    who: 'Ishaan Reddy · Block B1, room 101',
    path: '/app',
    does: 'Report symptoms in thirty seconds and receive advisories addressed to your floor.',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    identifier: 'health.centre@muj.ac.in',
    pin: '4321',
    who: 'Dr Meenakshi Rao · Campus Health Centre',
    path: '/doctor',
    does: 'Record a consultation once; block, floor and room come from the roster.',
  },
  {
    role: 'warden',
    label: 'Warden',
    identifier: 'warden.b4@muj.ac.in',
    pin: '4321',
    who: 'Block B4 warden console',
    path: '/radar',
    does: 'See the campus field, and decide whether an advisory goes out.',
  },
];

export function LoginClient() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('student');
  const [identifier, setIdentifier] = useState('2502050001');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeRole = ROLES.find((r) => r.role === role)!;

  function pick(next: Role) {
    const entry = ROLES.find((r) => r.role === next)!;
    setRole(next);
    setIdentifier(entry.identifier);
    setPin(entry.pin);
    setError(null);
  }

  async function submit(
    e?: React.FormEvent,
    override?: { role: Role; identifier: string; pin: string },
  ) {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    const r = override?.role ?? role;
    const ident = override?.identifier ?? identifier;
    const code = override?.pin ?? pin;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: r, identifier: ident, pin: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Sign-in failed');

      router.push(ROLES.find((x) => x.role === r)!.path);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
      setLoading(false);
    }
  }

  return (
    <div className="paper-page paper-grain min-h-screen">
      <div className="editorial grid min-h-screen gap-0 lg:grid-cols-2">
        {/* ── left: identity ──────────────────────────────────────────── */}
        <div className="relative flex flex-col justify-between py-10 lg:pr-16">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="block size-2 bg-thermal-red" />
              <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink">
                Outbreak Radar
              </span>
            </Link>
            <Link href="/radar" className="meta transition-colors hover:text-ink">
              Skip to dashboard →
            </Link>
          </div>

          <div className="py-16">
            <span className="eyebrow">Manipal University Jaipur</span>
            <h1 className="mt-6 display text-[clamp(2.4rem,5.4vw,4rem)] text-ink">
              One campus.
              <br />
              Many signals.
              <br />
              <span className="text-thermal-red">One live map.</span>
            </h1>
            <p className="mt-7 max-w-md text-[14px] leading-[1.65] text-ink-soft">
              Three people see three different halves of the same outbreak — a doctor, a warden and
              the students themselves. Sign in as any of them.
            </p>
          </div>

          {/* A still thermal field. The same gradient language as the map, at
              rest, so the login screen belongs to the same instrument. */}
          <div className="relative hidden h-40 overflow-hidden border border-line-light lg:block">
            <div
              className="heat-field thermal-breathe"
              style={{ left: '18%', top: '10%', width: 200, height: 120 }}
            />
            <div
              className="heat-field"
              style={{ left: '58%', top: '38%', width: 130, height: 80, opacity: 0.5 }}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-paper-bright/85 px-4 py-2 backdrop-blur-sm">
              <span className="meta">Campus field · illustrative</span>
              <span className="meta">19 blocks · 2 messes · 1 RO plant</span>
            </div>
          </div>
        </div>

        {/* ── right: form ─────────────────────────────────────────────── */}
        <div className="border-line-light py-10 lg:border-l lg:pl-16">
          <div className="max-w-md">
            <span className="eyebrow">Sign in</span>

            {/* role picker — three square tabs, no pills */}
            <div className="mt-5 grid grid-cols-3 gap-px bg-line-light">
              {ROLES.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => pick(r.role)}
                  className={cn(
                    'py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
                    role === r.role
                      ? 'bg-ink text-paper-bright'
                      : 'bg-paper-bright text-muted-ink hover:text-ink',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <p className="mt-4 text-[13px] leading-relaxed text-muted-ink">{activeRole.does}</p>

            <form onSubmit={submit} className="mt-7 space-y-5">
              <div>
                <label className="meta">
                  {role === 'student' ? 'Registration number' : 'Email address'}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-2 w-full border border-line bg-paper-bright px-4 py-3 font-mono text-[13px] text-ink outline-none transition-colors placeholder:text-line focus:border-ink"
                  required
                />
              </div>

              <div>
                <label className="meta">PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="mt-2 w-full border border-line bg-paper-bright px-4 py-3 font-mono text-[13px] tracking-[0.4em] text-ink outline-none transition-colors focus:border-ink"
                  required
                />
                <span className="mt-2 block meta">
                  Demo PIN {role === 'student' ? '1234' : '4321'}
                </span>
              </div>

              {error && (
                <div className="border-l-2 border-thermal-red bg-paper-bright px-4 py-2.5 text-[12px] text-thermal-red">
                  {error}
                </div>
              )}

              <NeuButton type="submit" variant="primary" disabled={loading} className="w-full py-3">
                {loading ? <Spinner /> : 'Sign in'}
              </NeuButton>
            </form>

            <div className="mt-10 border-t border-line-light pt-6">
              <span className="meta">One-tap demo accounts</span>
              <div className="mt-3">
                {ROLES.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    disabled={loading}
                    onClick={() => submit(undefined, r)}
                    className="flex w-full items-center justify-between border-b border-line-light py-3 text-left transition-colors hover:bg-paper-bright disabled:opacity-40"
                  >
                    <span>
                      <span className="block text-[13px] font-semibold text-ink">{r.label}</span>
                      <span className="block text-[11px] text-muted-ink">{r.who}</span>
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-ink">
                      {r.path} →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
