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
    // Read current cookie if exists
    const match = document.cookie.match(/(?:^|; )role=([^;]*)/);
    if (match && (match[1] === 'student' || match[1] === 'doctor' || match[1] === 'warden')) {
      setSelectedRole(match[1] as UserRole);
    }
  }, []);

  const handleSelectRole = (role: UserRole, targetUrl: string) => {
    setIsSettingRole(true);
    // Set cookie
    document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    setSelectedRole(role);
    router.push(targetUrl);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold tracking-wider">
              <ShieldAlert className="size-5 text-amber-500" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-base sm:text-lg">Outbreak Radar</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2 hidden sm:inline border-l border-zinc-300 dark:border-zinc-700 pl-2">
                Hostel Micro-Outbreak Early Warning System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-mono text-zinc-600 dark:text-zinc-400 hidden md:inline-flex">
              MUJ Hackathon POC · Next.js 16
            </Badge>
            <Link href="/report">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <FileText className="size-3.5" />
                Report Symptom
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1 flex flex-col justify-center">
        {/* Hero Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mb-4 border border-zinc-200 dark:border-zinc-700">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Role Switcher & Seeded Demo Persona Access</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Hostel Water & Food Micro-Outbreak Detection
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Select a persona to experience Outbreak Radar from the perspective of students reporting illness, 
            clinic doctors diagnosing cases, or wardens arbitrating statistical scan clusters.
          </p>
        </div>

        {/* Demo Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isSelected = selectedRole === acc.role;

            return (
              <Card
                key={acc.role}
                className={`relative transition-all duration-200 flex flex-col justify-between border-2 ${
                  isSelected
                    ? 'border-zinc-900 dark:border-zinc-100 shadow-md bg-white dark:bg-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white/60 dark:bg-zinc-900/60'
                }`}
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                        <Icon className="size-5" />
                      </div>
                      <Badge
                        variant={isSelected ? 'default' : 'secondary'}
                        className="text-[11px] font-mono tracking-tight"
                      >
                        {acc.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold">{acc.name}</CardTitle>
                    <CardDescription className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {acc.title}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-normal">
                      {acc.description}
                    </p>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Role Capabilities
                      </p>
                      {acc.privileges.map((p, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                          <CheckCircle2 className="size-3.5 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">{p}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-4 flex flex-col gap-2">
                  <Button
                    className="w-full justify-between gap-2"
                    variant={isSelected ? 'default' : 'secondary'}
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
                      className="w-full text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      onClick={() => handleSelectRole(acc.role, acc.secondaryActionUrl!)}
                    >
                      {acc.secondaryActionLabel}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Four Scenario Direct Access */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Activity className="size-4 text-zinc-700 dark:text-zinc-300" />
                <span>Simulated Scenarios (POC Test Suite)</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Directly inspect the 4 validated synthetic benchmark cases powering the early warning engine.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono w-fit">
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
                  className="group block p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {isWater && <Waves className="size-4 text-amber-500" />}
                      {isFood && <UtensilsCrossed className="size-4 text-red-500" />}
                      {isCoincidence && <ShieldAlert className="size-4 text-zinc-500" />}
                      {isQuiet && <CheckCircle2 className="size-4 text-emerald-500" />}
                      <span className="font-semibold text-sm group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        {sc.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">
                    {sc.blurb}
                  </p>
                  <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-800">
                    {sc.expected}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
        <p>Outbreak Radar · Manipal University Jaipur 12-Hour POC · Graph Spatial Scan & Permutation Testing</p>
      </footer>
    </div>
  );
}
