'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserRole, SCENARIOS } from '@/lib/types';
import { 
  ShieldAlert, 
  Stethoscope, 
  GraduationCap, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Activity,
  Waves,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';

interface DemoAccount {
  role: UserRole;
  title: string;
  name: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  primaryActionUrl: string;
  primaryActionLabel: string;
  secondaryActionUrl?: string;
  secondaryActionLabel?: string;
  privileges: string[];
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'student',
    title: 'Student Profile',
    name: 'Student #412',
    badge: 'Hosteller · Block B-304',
    icon: GraduationCap,
    description: 'Fast one-handed mobile reporting (<60s) for rapid symptom triage and meal tracking.',
    primaryActionUrl: '/report',
    primaryActionLabel: 'Submit Health Report',
    secondaryActionUrl: '/radar/filter_fault',
    secondaryActionLabel: 'View Active Radar',
    privileges: [
      'Submit symptom reports with 72h meal recall',
      'View public health advisories',
      'Sanitized privacy-preserving campus feed',
    ],
  },
  {
    role: 'doctor',
    title: 'Clinic Physician',
    name: 'Dr. A. Verma',
    badge: 'Hostel Health Centre',
    icon: Stethoscope,
    description: 'Clinical-grade report intake with 1.0 weight multiplier, diagnosis tagging, and unredacted case lists.',
    primaryActionUrl: '/radar/filter_fault',
    primaryActionLabel: 'Clinical Radar View',
    secondaryActionUrl: '/report',
    secondaryActionLabel: 'Log Clinical Case',
    privileges: [
      '1.0x detection weighting on clinical entries',
      'Clinical diagnosis note entry',
      'Access unredacted student identifiers for care',
    ],
  },
  {
    role: 'warden',
    title: 'Hostel Administration',
    name: 'Chief Warden R. K. Sharma',
    badge: 'Campus Operations',
    icon: Building2,
    description: 'Triage spatial clusters, review permutation p-values, verify water tests, and issue confirmed advisories.',
    primaryActionUrl: '/radar/filter_fault',
    primaryActionLabel: 'Operations Command',
    secondaryActionUrl: '/radar/coincidence',
    secondaryActionLabel: 'Inspect Coincidence Trap',
    privileges: [
      'Confirm or dismiss outbreak alerts',
      'Log water test parameters (TDS, chlorine, turbidity)',
      'DPDP Act 2023 compliant data suppression (<3 cases)',
    ],
  },
];

export default function HomePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('warden');
  const [isSettingRole, setIsSettingRole] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )role=([^;]*)/);
    if (match && (match[1] === 'student' || match[1] === 'doctor' || match[1] === 'warden')) {
      setSelectedRole(match[1] as UserRole);
    }
  }, []);

  const handleSelectRole = (role: UserRole, targetUrl: string) => {
    setIsSettingRole(true);
    document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    setSelectedRole(role);
    router.push(targetUrl);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[300px] bg-red-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar */}
      <header className="border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold tracking-wider shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.3)]">
              <ShieldAlert className="size-5 text-amber-400" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-base sm:text-lg text-white">Outbreak Radar</span>
              <span className="text-xs text-zinc-400 ml-2 hidden sm:inline border-l border-zinc-700 pl-2">
                Hostel Micro-Outbreak Early Warning System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-mono text-zinc-400 border-white/15 bg-white/5 backdrop-blur-md hidden md:inline-flex">
              MUJ Hackathon POC · Next.js 16
            </Badge>
            <Link href="/report">
              <Button size="sm" variant="glass" className="gap-1.5 text-xs">
                <FileText className="size-3.5" />
                Report Symptom
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1 flex flex-col justify-center relative z-10">
        {/* Hero Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-amber-300 mb-4 border border-white/15 backdrop-blur-md shadow-xs">
            <Sparkles className="size-3.5 text-amber-400" />
            <span>Role Switcher & Seeded Demo Persona Access</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 text-white">
            Hostel Water & Food Micro-Outbreak Detection
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Select a persona to experience Outbreak Radar from the perspective of students reporting illness, 
            clinic doctors diagnosing cases, or wardens arbitrating statistical scan clusters.
          </p>
        </div>

        {/* Translucent 3D Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isSelected = selectedRole === acc.role;

            return (
              <div
                key={acc.role}
                className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between backdrop-blur-xl border ${
                  isSelected
                    ? 'bg-white/15 border-white/40 shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-2 ring-white/30 scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white shadow-inner">
                      <Icon className="size-5" />
                    </div>
                    <Badge
                      variant={isSelected ? 'default' : 'outline'}
                      className={`text-[11px] font-mono tracking-tight ${isSelected ? 'bg-white text-zinc-950 font-bold' : 'border-white/20 text-zinc-300'}`}
                    >
                      {acc.badge}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-white">{acc.name}</h3>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    {acc.title}
                  </p>

                  <p className="text-xs text-zinc-300 leading-normal mb-4">
                    {acc.description}
                  </p>

                  <div className="pt-3 border-t border-white/10 space-y-1.5 mb-6">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Role Capabilities
                    </p>
                    {acc.privileges.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    className="w-full justify-between gap-2 h-11 rounded-xl font-bold text-sm bg-white/95 hover:bg-white text-zinc-950 shadow-[0_4px_16px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.6)] active:scale-98"
                    disabled={isSettingRole}
                    onClick={() => handleSelectRole(acc.role, acc.primaryActionUrl)}
                  >
                    <span>{acc.primaryActionLabel}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                  {acc.secondaryActionUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-zinc-400 hover:text-white"
                      onClick={() => handleSelectRole(acc.role, acc.secondaryActionUrl!)}
                    >
                      {acc.secondaryActionLabel}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Four Scenario Direct Access */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2 text-white">
                <Activity className="size-4 text-emerald-400" />
                <span>Simulated Scenarios (POC Test Suite)</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Directly inspect the 4 validated synthetic benchmark cases powering the early warning engine.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono w-fit border-white/20 text-zinc-300">
              4 Evaluated States
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCENARIOS.map((sc) => {
              const isFood = sc.id === 'food';
              const isWater = sc.id === 'filter_fault';
              const isCoincidence = sc.id === 'coincidence';
              const isQuiet = sc.id === 'quiet';

              return (
                <Link
                  key={sc.id}
                  href={`/radar/${sc.id}`}
                  onClick={() => {
                    document.cookie = `role=${selectedRole}; path=/; max-age=604800; SameSite=Lax`;
                  }}
                  className="group block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 backdrop-blur-md transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-98"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {isWater && <Waves className="size-4 text-amber-400" />}
                      {isFood && <UtensilsCrossed className="size-4 text-red-400" />}
                      {isCoincidence && <ShieldAlert className="size-4 text-zinc-400" />}
                      {isQuiet && <CheckCircle2 className="size-4 text-emerald-400" />}
                      <span className="font-semibold text-sm text-zinc-200 group-hover:text-white transition-colors">
                        {sc.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                    {sc.blurb}
                  </p>
                  <div className="text-[11px] font-mono text-zinc-300 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
                    {sc.expected}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500 relative z-10">
        <p>Outbreak Radar · Manipal University Jaipur 12-Hour POC · Graph Spatial Scan & Permutation Testing</p>
      </footer>
    </div>
  );
}
