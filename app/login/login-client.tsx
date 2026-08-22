'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Stethoscope, User, Lock, ArrowRight, Sparkles, Building, ArrowLeft } from 'lucide-react';
import { Surface, NeuButton, Spinner } from '@/components/neu';

type Role = 'student' | 'doctor' | 'warden';

export function LoginClient() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('student');
  const [identifier, setIdentifier] = useState('2502050001');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (newRole: Role) => {
    setRole(newRole);
    setError(null);
    if (newRole === 'student') {
      setIdentifier('2502050001');
      setPin('1234');
    } else if (newRole === 'doctor') {
      setIdentifier('health.centre@muj.ac.in');
      setPin('4321');
    } else if (newRole === 'warden') {
      setIdentifier('warden.b4@muj.ac.in');
      setPin('4321');
    }
  };

  const handleSubmit = async (e?: React.FormEvent, customIdent?: string, customPin?: string, customRole?: Role) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const activeRole = customRole ?? role;
    const activeIdent = customIdent ?? identifier;
    const activePin = customPin ?? pin;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole,
          identifier: activeIdent,
          pin: activePin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (activeRole === 'student') {
        router.push('/app');
      } else if (activeRole === 'doctor') {
        router.push('/doctor');
      } else {
        router.push('/radar');
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  const quickLogin = (qRole: Role, qIdent: string, qPin: string) => {
    setRole(qRole);
    setIdentifier(qIdent);
    setPin(qPin);
    handleSubmit(undefined, qIdent, qPin, qRole);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/radar"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="size-3.5" /> Back to Dashboard
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl neu-inset text-slate-700">
          <Shield className="size-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Outbreak Radar</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to access hostel surveillance & health reporting</p>
      </div>

      {/* Role Picker Tabs */}
      <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl neu-inset p-1.5">
        <button
          type="button"
          onClick={() => handleRoleSelect('student')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            role === 'student'
              ? 'neu-raised text-slate-900 bg-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="size-3.5" />
          Student
        </button>
        <button
          type="button"
          onClick={() => handleRoleSelect('doctor')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            role === 'doctor'
              ? 'neu-raised text-slate-900 bg-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="size-3.5" />
          Doctor
        </button>
        <button
          type="button"
          onClick={() => handleRoleSelect('warden')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
            role === 'warden'
              ? 'neu-raised text-slate-900 bg-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="size-3.5" />
          Warden
        </button>
      </div>

      <Surface className="p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              {role === 'student' ? 'Registration Number' : 'Email Address'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={role === 'student' ? 'e.g. 2502050001' : 'e.g. health.centre@muj.ac.in'}
              className="w-full rounded-xl neu-inset px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-400 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              PIN Code
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full rounded-xl neu-inset px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-400 font-mono tracking-widest"
                required
              />
              <Lock className="absolute right-3.5 top-3.5 size-4 text-slate-400" />
            </div>
            <span className="mt-1 block text-[11px] text-slate-400">
              Demo PIN: {role === 'student' ? '1234' : '4321'}
            </span>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <NeuButton
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 text-sm"
          >
            {loading ? <Spinner /> : <>Sign In <ArrowRight className="size-4" /></>}
          </NeuButton>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-slate-500">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>One-Tap Demo Credentials</span>
          </div>
          <div className="grid gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => quickLogin('student', '2502050001', '1234')}
              className="flex items-center justify-between rounded-xl neu-inset-sm px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div>
                <span className="font-bold text-slate-900 block">🎓 Demo Student</span>
                <span className="text-[11px] text-slate-400 font-mono">2502050001 (Ishaan Reddy · B1)</span>
              </div>
              <span className="text-xs text-indigo-600 font-semibold">Tap to enter /app →</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => quickLogin('doctor', 'health.centre@muj.ac.in', '4321')}
              className="flex items-center justify-between rounded-xl neu-inset-sm px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div>
                <span className="font-bold text-slate-900 block">🩺 Demo Doctor</span>
                <span className="text-[11px] text-slate-400">Dr. Meenakshi Rao (Health Centre)</span>
              </div>
              <span className="text-xs text-indigo-600 font-semibold">Tap to enter /doctor →</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => quickLogin('warden', 'warden.b4@muj.ac.in', '4321')}
              className="flex items-center justify-between rounded-xl neu-inset-sm px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div>
                <span className="font-bold text-slate-900 block">🏢 Demo Warden</span>
                <span className="text-[11px] text-slate-400">Warden — B4 (Critical Hotspot)</span>
              </div>
              <span className="text-xs text-indigo-600 font-semibold">Tap to enter /radar →</span>
            </button>
          </div>
        </div>
      </Surface>
    </div>
  );
}
