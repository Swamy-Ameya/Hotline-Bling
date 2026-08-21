'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { 
  ShieldAlert, 
  Stethoscope, 
  GraduationCap, 
  ArrowRight, 
  FileText, 
  Activity,
  MapPin,
  Radar,
  Users,
  BarChart3
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('warden');

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )role=([^;]*)/);
    if (match && (match[1] === 'student' || match[1] === 'doctor' || match[1] === 'warden')) {
      setSelectedRole(match[1] as UserRole);
    }
  }, []);

  const setRoleAndGo = (role: UserRole, url: string) => {
    document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    setSelectedRole(role);
    router.push(url);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ───── NAV BAR ───── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Radar className="size-4" />
            </div>
            <span className="font-bold text-base tracking-tight">Outbreak Radar</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/radar" className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors font-medium">
              Dashboard
            </Link>
            <Link href="/report" className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors font-medium">
              Report
            </Link>
            <Link href="/radar">
              <button className="ml-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors">
                Open Radar →
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 mb-6">
            <Activity className="size-3.5" />
            Manipal University Jaipur · Hackathon POC
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.1] mb-4">
            Hostel micro-outbreak
            <br />
            <span className="text-zinc-400">early warning system</span>
          </h1>

          <p className="text-lg text-zinc-500 leading-relaxed mb-8 max-w-lg">
            Track illness reports across hostel blocks, identify whether the source 
            is water or food, and prove it statistically before anyone panics.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRoleAndGo('warden', '/radar')}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-sm flex items-center gap-2"
            >
              Open Dashboard
              <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => setRoleAndGo('student', '/report')}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-all flex items-center gap-2"
            >
              <FileText className="size-4" />
              Report Illness
            </button>
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="border-t border-zinc-100 bg-zinc-50/50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-8">How it works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Users className="size-5" />
              </div>
              <h3 className="font-bold text-base mb-2">Students report symptoms</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                60-second mobile form: what symptoms, when did they start, what did you eat in the last 72 hours.
                Doctor reports carry 1.0 weight, self-reports carry 0.6.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
              <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <BarChart3 className="size-5" />
              </div>
              <h3 className="font-bold text-base mb-2">Engine scans for clusters</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Spatial scan statistic over the hostel graph. 999 permutation replicates answer: 
                "is this cluster real, or would random chance produce something this tight?"
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
              <div className="size-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <MapPin className="size-5" />
              </div>
              <h3 className="font-bold text-base mb-2">Localise water vs food</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                One block sick? It's the water tank. All blocks + day scholars sick? It's the mess kitchen. 
                Sharp onset = food, smeared curve = water.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── ROLE CARDS ───── */}
      <section className="border-t border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-8">Select your role</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Student */}
            <button
              onClick={() => setRoleAndGo('student', '/report')}
              className="text-left p-6 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all bg-white group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <GraduationCap className="size-5" />
                </div>
                <span className="text-xs font-mono text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-md">
                  Hosteller
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-zinc-900">Student</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Report symptoms and track campus health advisories.
              </p>
              <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1 group-hover:gap-2 transition-all">
                Submit Report <ArrowRight className="size-3.5" />
              </span>
            </button>

            {/* Doctor */}
            <button
              onClick={() => setRoleAndGo('doctor', '/radar')}
              className="text-left p-6 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all bg-white group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Stethoscope className="size-5" />
                </div>
                <span className="text-xs font-mono text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-md">
                  Health Centre
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-zinc-900">Doctor</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Clinical-grade intake with full-weight case logging.
              </p>
              <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1 group-hover:gap-2 transition-all">
                Open Radar <ArrowRight className="size-3.5" />
              </span>
            </button>

            {/* Warden */}
            <button
              onClick={() => setRoleAndGo('warden', '/radar')}
              className="text-left p-6 rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all bg-white group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="size-5" />
                </div>
                <span className="text-xs font-mono text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-md">
                  Administration
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-zinc-900">Warden</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Triage clusters, verify water tests, confirm advisories.
              </p>
              <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1 group-hover:gap-2 transition-all">
                Command Centre <ArrowRight className="size-3.5" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-zinc-100 bg-zinc-50/50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Radar className="size-4" />
            <span>Outbreak Radar · Manipal University Jaipur</span>
          </div>
          <p className="text-xs text-zinc-400">
            DPDP Act 2023 compliant · &lt;3 cases suppressed · Hackathon POC
          </p>
        </div>
      </footer>
    </div>
  );
}
