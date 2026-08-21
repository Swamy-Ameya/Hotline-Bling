'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EpiCurve } from '@/lib/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Activity, Clock, Utensils, Waves, Info } from 'lucide-react';

interface EpiCurveChartProps {
  epiCurve: EpiCurve;
  hypothesis?: string;
}

// Consistent cool neutral/slate palettes for blocks so warm colors are reserved for risk
const BLOCK_COLORS: Record<string, string> = {
  'Block A': '#3b82f6', // blue-500
  'Block B': '#6366f1', // indigo-500
  'Block C': '#06b6d4', // cyan-500
  'Block D': '#64748b', // slate-500
  Mess: '#8b5cf6',      // violet-500
};

const DEFAULT_COLOR = '#475569';

export function EpiCurveChart({ epiCurve, hypothesis }: EpiCurveChartProps) {
  const { buckets, blocks, mealMarkers, bucketHours } = epiCurve;

  // Flatten data for Recharts stacked bar chart
  const chartData = buckets.map((b) => ({
    label: b.label,
    bucketStart: b.bucketStart,
    total: b.total,
    ...b.byBlock,
  }));

  const totalCases = buckets.reduce((sum, b) => sum + b.total, 0);

  // Analytical interpretation of curve shape
  const isSharp = hypothesis === 'food';
  const isSmeared = hypothesis === 'water' || hypothesis === 'mess_water';

  return (
    <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Activity className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {bucketHours}h Window Buckets · Asia/Kolkata (IST)
                </Badge>
                <span className="text-xs text-zinc-500 font-mono">
                  {totalCases} Cases Tracked
                </span>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight mt-0.5">
                Epidemic Curve (Onset Timeline)
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSharp && (
              <Badge className="bg-red-600 text-white gap-1 text-xs">
                <Utensils className="size-3" />
                <span>Sharp Point-Source Signature (Food)</span>
              </Badge>
            )}
            {isSmeared && (
              <Badge className="bg-amber-600 text-white gap-1 text-xs">
                <Waves className="size-3" />
                <span>Smeared Multi-Day Curve (Water Supply)</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-5">
        {/* Analytical Readout Banner */}
        <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
          <Info className="size-4 text-zinc-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              Epidemiologic Curve Diagnostics:
            </span>
            <p className="text-zinc-600 dark:text-zinc-400">
              {isSharp && (
                <>
                  A steep unimodal peak occurring within 4–8 hours of meal service indicates a <strong>single common-source food contamination event</strong>.
                </>
              )}
              {isSmeared && (
                <>
                  A continuous, multi-day low-amplitude distribution indicates <strong>sustained exposure from a compromised water supply or plumbing node</strong>.
                </>
              )}
              {!isSharp && !isSmeared && (
                <>
                  Onset distribution across 6-hour windows with meal service reference lines to differentiate point-source vs continuous transmission.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="h-72 w-full bg-zinc-50/50 dark:bg-zinc-950/40 rounded-lg p-2 border border-zinc-100 dark:border-zinc-800">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 25, right: 20, left: -20, bottom: 25 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={{ stroke: '#e4e4e7' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={{ stroke: '#e4e4e7' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const totalInBucket = payload.reduce(
                      (sum, item) => sum + (Number(item.value) || 0),
                      0
                    );
                    return (
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 shadow-lg text-xs space-y-1">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{label}</p>
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                          Total Cases: {totalInBucket}
                        </p>
                        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1 space-y-0.5">
                          {payload.map((entry, idx) => (
                            <div key={idx} className="flex justify-between gap-4 text-zinc-500">
                              <span className="flex items-center gap-1">
                                <span
                                  className="inline-block size-2 rounded-xs"
                                  style={{ backgroundColor: entry.color }}
                                />
                                {entry.name}:
                              </span>
                              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />

              {/* Stacked bars per block */}
              {blocks.map((blockName, idx) => (
                <Bar
                  key={blockName}
                  dataKey={blockName}
                  stackId="epi"
                  fill={BLOCK_COLORS[blockName] || DEFAULT_COLOR}
                  radius={idx === blocks.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}

              {/* Meal Markers Reference Lines */}
              {mealMarkers.map((marker, mIdx) => {
                // Find matching bucket label for this timestamp
                const markerDate = new Date(marker.at).getTime();
                const matchedBucket = buckets.reduce((prev, curr) => {
                  const currDiff = Math.abs(new Date(curr.bucketStart).getTime() - markerDate);
                  const prevDiff = Math.abs(new Date(prev.bucketStart).getTime() - markerDate);
                  return currDiff < prevDiff ? curr : prev;
                }, buckets[0]);

                if (!matchedBucket) return null;

                return (
                  <ReferenceLine
                    key={marker.mealId}
                    x={matchedBucket.label}
                    stroke="#d97706"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    label={{
                      value: marker.label,
                      position: mIdx % 2 === 0 ? 'top' : 'insideTopRight',
                      fill: '#b45309',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
