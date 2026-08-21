'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DetectionResult, SCENARIOS } from '@/lib/types';
import { EpiCurveChart } from './epi-curve-chart';
import { PermutationPanel } from './permutation-panel';
import { 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Waves, 
  UtensilsCrossed, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface QuietViewProps {
  detectionResult: DetectionResult;
}

export function QuietView({ detectionResult }: QuietViewProps) {
  const { totalCases, totalPopulation, baselineRatePerDay, epiCurve, permutation, headline } = detectionResult;

  return (
    <div className="space-y-6">
      {/* Baseline Status Hero */}
      <Card className="border-2 border-emerald-500/40 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-emerald-200/80 dark:border-emerald-900/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-xs">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white text-xs py-0.5 border-0">
                    Quiet Baseline Active
                  </Badge>
                  <span className="text-xs text-zinc-500 font-mono">
                    Scenario: Quiet
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight mt-1 text-emerald-950 dark:text-emerald-100">
                  No Active Outbreak Detected
                </CardTitle>
              </div>
            </div>

            <Badge variant="outline" className="text-xs font-mono py-1 px-3 bg-white dark:bg-zinc-900 border-emerald-300 dark:border-emerald-800">
              System State: Normal Operations
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Headline Text */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/80">
            <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
              {headline}
            </p>
          </div>

          {/* Key Baseline Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-0.5">Total Incident Reports</span>
              <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                {totalCases} cases
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-0.5">Campus Population</span>
              <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                {totalPopulation}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-0.5">Daily Baseline Rate</span>
              <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                {(baselineRatePerDay * 100).toFixed(2)}% / day
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-0.5">Spatial Concentration</span>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                p = {permutation?.pValue ?? 0.68}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Epidemic Curve for Baseline */}
      {epiCurve && (
        <EpiCurveChart epiCurve={epiCurve} hypothesis="unresolved" />
      )}

      {/* Permutation Null distribution for baseline */}
      {permutation && (
        <PermutationPanel permutation={permutation} scenarioId="quiet" />
      )}

      {/* Scenario Switcher Card */}
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-zinc-700 dark:text-zinc-300" />
            <CardTitle className="text-base font-bold">Simulate Active Outbreak Scenarios</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Switch between the 3 other synthetic test scenarios to evaluate detection arbitration:
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/radar/filter_fault"
            className="p-3 rounded-lg border border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-500 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200 mb-1">
                <Waves className="size-3.5 text-amber-600" />
                <span>Filter Fault (Water)</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                9 cases under Filter 3A, smeared onset, p=0.002.
              </p>
            </div>
            <div className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1 group-hover:underline">
              <span>View Drill-down</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>

          <Link
            href="/radar/food"
            className="p-3 rounded-lg border border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 hover:border-red-500 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-red-900 dark:text-red-200 mb-1">
                <UtensilsCrossed className="size-3.5 text-red-600" />
                <span>Food Batch Point Source</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                14 cases across 3 blocks + day scholars, sharp spike, RR 7.1.
              </p>
            </div>
            <div className="mt-2 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1 group-hover:underline">
              <span>View Drill-down</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>

          <Link
            href="/radar/coincidence"
            className="p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-500 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-zinc-200 mb-1">
                <ShieldAlert className="size-3.5 text-zinc-600" />
                <span>Coincidence Trap</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                7 cases landing in Block A by chance. System holds at watch (p=0.31).
              </p>
            </div>
            <div className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 group-hover:underline">
              <span>View Drill-down</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
