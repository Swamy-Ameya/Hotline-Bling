'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermutationSummary } from '@/lib/types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  Cell 
} from 'recharts';
import { Dna, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface PermutationPanelProps {
  permutation: PermutationSummary;
  scenarioId?: string;
}

export function PermutationPanel({ permutation, scenarioId }: PermutationPanelProps) {
  const { replicates, observedLlr, nullLlrs, pValue, rank } = permutation;

  // Build histogram data with 16 bins
  const chartData = useMemo(() => {
    if (!nullLlrs || nullLlrs.length === 0) return [];

    const min = 0;
    const max = Math.max(...nullLlrs, observedLlr) * 1.08;
    const numBins = 16;
    const binWidth = (max - min) / numBins;

    const bins = Array.from({ length: numBins }, (_, i) => {
      const start = min + i * binWidth;
      const end = start + binWidth;
      return {
        binIndex: i,
        start,
        end,
        label: `${start.toFixed(1)}–${end.toFixed(1)}`,
        midpoint: (start + end) / 2,
        count: 0,
        isObservedBin: observedLlr >= start && (i === numBins - 1 ? observedLlr <= end : observedLlr < end),
      };
    });

    nullLlrs.forEach((val) => {
      let idx = Math.floor((val - min) / binWidth);
      if (idx < 0) idx = 0;
      if (idx >= numBins) idx = numBins - 1;
      bins[idx].count += 1;
    });

    return bins;
  }, [nullLlrs, observedLlr]);

  const isSignificant = pValue < 0.05;

  return (
    <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
              <Dna className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
                  Challenge Question Proof
                </Badge>
                <span className="text-xs text-zinc-500 font-mono">
                  {replicates} Monte Carlo Replicates
                </span>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight mt-0.5">
                Permutation Scan Significance (p = {pValue})
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs px-3 py-1 font-mono font-bold border-0 ${
                isSignificant
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
              }`}
            >
              {isSignificant ? 'Statistically Significant (p < 0.05)' : 'Within Chance Variation (p ≥ 0.05)'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Plain-English Money Caption */}
        <div className="p-4 rounded-xl border bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                &ldquo;We shuffled these cases at random {replicates} times across rooms. Only {rank} of {replicates + 1} shuffles produced a cluster this tight.&rdquo;
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {isSignificant ? (
                  <span>
                    The observed concentration (LLR = <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{observedLlr}</span>) sits far in the extreme right tail. Chance alone cannot explain this spatial pattern.
                  </span>
                ) : (
                  <span>
                    The observed concentration (LLR = <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{observedLlr}</span>) falls inside the main distribution. Unclustered room assignments frequently produce clusters of this density purely by coincidence.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Histogram Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Null Distribution of Maximum Log-Likelihood Ratio (LLR)
            </span>
            <span className="font-mono">
              Observed LLR: <strong className="text-zinc-900 dark:text-zinc-100">{observedLlr}</strong>
            </span>
          </div>

          <div className="h-64 w-full bg-zinc-50/60 dark:bg-zinc-950/40 rounded-lg p-2 border border-zinc-100 dark:border-zinc-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 25, left: -15, bottom: 20 }}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: '#71717a' }} 
                  interval={2}
                  axisLine={{ stroke: '#e4e4e7' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#71717a' }} 
                  axisLine={{ stroke: '#e4e4e7' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 shadow-lg text-xs">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">LLR Range: {data.label}</p>
                          <p className="text-zinc-600 dark:text-zinc-400">
                            Null Replicates: <strong className="font-mono text-zinc-900 dark:text-zinc-100">{data.count}</strong> of {replicates} ({((data.count / replicates) * 100).toFixed(1)}%)
                          </p>
                          {data.isObservedBin && (
                            <p className="text-red-500 font-semibold mt-1">★ Contains Observed LLR ({observedLlr})</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  x={chartData.find((d) => d.isObservedBin)?.label}
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  label={{
                    value: `Observed LLR = ${observedLlr}`,
                    position: 'top',
                    fill: '#ef4444',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isObservedBin ? '#ef4444' : '#a1a1aa'}
                      opacity={entry.isObservedBin ? 0.95 : 0.45}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistical Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-0.5">Observed Test Statistic</span>
            <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">LLR = {observedLlr}</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-0.5">Null Exceedances</span>
            <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">{rank} / {replicates}</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-0.5">Permutation p-Value</span>
            <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">{pValue}</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-0.5">Null Distribution Peak</span>
            <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">~1.8 - 2.8</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
