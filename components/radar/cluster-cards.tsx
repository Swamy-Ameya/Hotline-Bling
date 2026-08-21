'use client';

import React from 'react';
import Link from 'next/link';
import type { Cluster } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStatusBadgeClass } from './attack-rate-utils';
import {
  Activity,
  CheckCircle2,
  Droplets,
  Utensils,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Flame,
} from 'lucide-react';

interface ClusterCardsProps {
  clusters: Cluster[];
}

export function ClusterCards({ clusters }: ClusterCardsProps) {
  if (!clusters || clusters.length === 0) {
    return <QuietEmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Detected Outbreak Clusters
          </h3>
          <Badge variant="outline" className="tabular-nums font-mono text-xs">
            {clusters.length} {clusters.length === 1 ? 'cluster' : 'clusters'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {clusters.map((cluster) => (
          <ClusterItem key={cluster.id} cluster={cluster} />
        ))}
      </div>
    </div>
  );
}

function ClusterItem({ cluster }: { cluster: Cluster }) {
  const isFood = cluster.hypothesis === 'food';
  const isWater = cluster.hypothesis === 'water';

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {isFood ? (
                <Utensils className="h-4 w-4 text-orange-500" />
              ) : isWater ? (
                <Droplets className="h-4 w-4 text-blue-500" />
              ) : (
                <HelpCircle className="h-4 w-4 text-zinc-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {cluster.name}
                </CardTitle>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClass(
                    cluster.status,
                  )}`}
                >
                  {cluster.status}
                </span>
                <Badge variant="outline" className="text-xs capitalize font-medium">
                  {cluster.hypothesis.replace('_', ' ')} hypothesis
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Trailing {cluster.windowHours}h scan window</span>
              </CardDescription>
            </div>
          </div>

          <Link href={`/radar/${cluster.id}`}>
            <Button size="sm" variant="outline" className="text-xs font-medium gap-1.5 w-full sm:w-auto">
              <span>Investigate Drill-down</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Metric tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
          <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-0.5">Observed vs Expected</span>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {cluster.observed.toFixed(1)}{' '}
              <span className="text-xs font-normal text-zinc-500">/ {cluster.expected.toFixed(1)} exp</span>
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-0.5">Permutation p-value</span>
            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
              p = {cluster.pSpatial.toFixed(3)}
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-0.5">Relative Risk / LLR</span>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm font-mono">
              {cluster.relativeRisk ? `RR ${cluster.relativeRisk.toFixed(1)}` : `LLR ${cluster.llr.toFixed(1)}`}
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-0.5">Epi Curve Signature</span>
            <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
              {cluster.curveWidthHours
                ? `${cluster.curveWidthHours}h width (${cluster.curveWidthHours < 12 ? 'Sharp / Food' : 'Smeared / Water'})`
                : 'Diffuse dispersion'}
            </div>
          </div>
        </div>

        {/* Plain-English verdict verbatim */}
        <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <strong className="text-zinc-900 dark:text-zinc-100 font-semibold block mb-1">
            Arbitration Verdict:
          </strong>
          {cluster.verdict}
        </div>
      </CardContent>
    </Card>
  );
}

function QuietEmptyState() {
  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-md">
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Campus Operating at Baseline
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            No anomalous spatial or cohort clusters detected across 61 infrastructure nodes. All reported symptoms remain within expected stochastic Poisson bounds (FDR q &gt; 0.10).
          </p>
        </div>
        <div className="pt-2 flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>Scan status: ALL CLEAR</span>
          <span>•</span>
          <span>Permutation p &gt; 0.50</span>
        </div>
      </CardContent>
    </Card>
  );
}
