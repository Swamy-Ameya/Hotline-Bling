'use client';

import React from 'react';
import type { DetectionResult, Cluster } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, ShieldCheck, Scale, Shuffle, BellOff, BellRing } from 'lucide-react';
import { getStatusBadgeClass } from './attack-rate-utils';

interface ContrastPanelProps {
  result: DetectionResult;
}

export function ContrastPanel({ result }: ContrastPanelProps) {
  const {
    naiveThresholdWouldAlert,
    naiveThresholdNodeName,
    topCluster,
    headline,
    permutation,
    scenario,
  } = result;

  const isCoincidence = scenario === 'coincidence';
  const isWatchOnly = topCluster?.status === 'watch';

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Detection Arbitrage: Permutation Test vs. Naive Threshold
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Demonstrating how 999 spatial Monte Carlo shuffles prevent false-positive campus panics.
              </CardDescription>
            </div>
          </div>

          {isCoincidence && isWatchOnly && (
            <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 text-xs font-semibold px-2.5 py-1">
              Coincidence Trap Defended
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Headline verbatim banner */}
        <div className="p-3.5 rounded-lg bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block font-semibold mb-1">
            Engine Headline
          </span>
          {headline}
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Dumb Count Threshold */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Dumb Count-Threshold System
                </span>
                {naiveThresholdWouldAlert ? (
                  <Badge className="bg-red-600 text-white text-[11px] font-semibold flex items-center gap-1">
                    <BellRing className="h-3 w-3" /> ALERTS
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-zinc-500 text-[11px]">
                    STAYS SILENT
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <p>
                  <strong className="text-zinc-800 dark:text-zinc-200">Rule:</strong> Any node with &gt;5 cases in 48–72h fires an alarm.
                </p>
                <p>
                  <strong className="text-zinc-800 dark:text-zinc-200">Action:</strong>{' '}
                  {naiveThresholdWouldAlert ? (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      Would trigger emergency advisory on {naiveThresholdNodeName ?? 'flagged block'}.
                    </span>
                  ) : (
                    <span>No threshold exceeded.</span>
                  )}
                </p>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500">
                  <strong className="text-zinc-700 dark:text-zinc-300">Failure mode:</strong> Coincidence clustering lands in the same block by chance ~31% of the time, triggering false shutdowns and alarm fatigue.
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-500 dark:text-zinc-400">
              Assumes uniform dispersion · No Monte Carlo permutation · Zero population weighting
            </div>
          </div>

          {/* Right: Outbreak Radar Permutation Scan */}
          <div className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 flex flex-col justify-between space-y-3 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Outbreak Radar (Permutation Scan)
                </span>
                {topCluster ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${getStatusBadgeClass(
                      topCluster.status,
                    )}`}
                  >
                    {topCluster.status}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-zinc-500 text-[11px]">
                    CALM
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center justify-between text-xs tabular-nums">
                  <span>
                    <strong className="text-zinc-800 dark:text-zinc-200">Permutation p-value:</strong>
                  </span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {topCluster ? `p = ${topCluster.pSpatial.toFixed(3)}` : permutation ? `p = ${permutation.pValue.toFixed(3)}` : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs tabular-nums">
                  <span>
                    <strong className="text-zinc-800 dark:text-zinc-200">FDR q-value:</strong>
                  </span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {topCluster ? `q = ${topCluster.qValue.toFixed(3)}` : 'q > 0.10'}
                  </span>
                </div>

                <p className="pt-1">
                  <strong className="text-zinc-800 dark:text-zinc-200">Verdict:</strong>{' '}
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {topCluster?.verdict ?? 'Symptom incidence remains consistent with background baseline rate.'}
                  </span>
                </p>
              </div>
            </div>

            {topCluster?.alternative && (
              <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Alternative hypothesis: </span>
                {topCluster.alternative}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
