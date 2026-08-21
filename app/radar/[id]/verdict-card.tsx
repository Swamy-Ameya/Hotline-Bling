'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cluster } from '@/lib/types';
import { 
  Waves, 
  UtensilsCrossed, 
  HelpCircle, 
  Clock, 
  Users, 
  Target, 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  Eye,
  XCircle
} from 'lucide-react';

interface VerdictCardProps {
  cluster: Cluster;
}

export function VerdictCard({ cluster }: VerdictCardProps) {
  const isWater = cluster.hypothesis === 'water' || cluster.hypothesis === 'mess_water';
  const isFood = cluster.hypothesis === 'food';
  const isUnresolved = cluster.hypothesis === 'unresolved';

  const statusConfig = {
    watch: { label: 'Watch (Dashboard Only)', bg: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100', icon: Eye },
    alert: { label: 'Alert (Awaiting Human)', bg: 'bg-amber-500 text-white dark:bg-amber-600', icon: AlertCircle },
    confirmed: { label: 'Confirmed Advisory Sent', bg: 'bg-red-600 text-white dark:bg-red-700', icon: CheckCircle2 },
    resolved: { label: 'Resolved & Closed', bg: 'bg-emerald-600 text-white dark:bg-emerald-700', icon: CheckCircle2 },
    dismissed: { label: 'Dismissed', bg: 'bg-zinc-400 text-white dark:bg-zinc-700', icon: XCircle },
  }[cluster.status];

  const StatusIcon = statusConfig.icon;

  return (
    <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${
              isWater ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' :
              isFood ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' :
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              {isWater && <Waves className="size-5" />}
              {isFood && <UtensilsCrossed className="size-5" />}
              {isUnresolved && <HelpCircle className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  {cluster.id}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  {cluster.windowHours}h Scan Window
                </span>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                {cluster.name}
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${statusConfig.bg} gap-1 text-xs py-1 px-2.5 font-medium border-0`}>
              <StatusIcon className="size-3.5" />
              <span>{statusConfig.label}</span>
            </Badge>

            <Badge variant="outline" className="text-xs font-mono py-1 px-2.5">
              Hypothesis: <span className="font-bold ml-1 uppercase">{cluster.hypothesis}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Metric Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <Users className="size-3.5" />
              <span>Observed vs Expected</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                {cluster.observed}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                / {cluster.expected} exp
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <Target className="size-3.5" />
              <span>Permutation p-Value</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono tabular-nums ${
                cluster.pSpatial < 0.05 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300'
              }`}>
                p = {cluster.pSpatial}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <Scale className="size-3.5" />
              <span>Kulldorff Max-LLR</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {cluster.llr}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                q={cluster.qValue}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <Clock className="size-3.5" />
              <span>Onset Curve Width</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                {cluster.curveWidthHours ? `${cluster.curveWidthHours}h` : 'N/A'}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {cluster.medianIncubationHours ? `med ${cluster.medianIncubationHours}h` : 'spread'}
              </span>
            </div>
          </div>
        </div>

        {/* Verdict Box - Primary Finding Verbatim */}
        <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Headline Arbitration Verdict
            </h3>
          </div>
          <p className="text-sm sm:text-base font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
            {cluster.verdict}
          </p>
        </div>

        {/* Alternative Hypothesis - Never Hidden */}
        {cluster.alternative && (
          <div className="p-3.5 rounded-lg bg-zinc-50/80 dark:bg-zinc-950/60 border border-dashed border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <span>Alternative Hypothesis & Noise Floor (Secondary)</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
              {cluster.alternative}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
