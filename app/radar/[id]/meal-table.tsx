'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { MealAssociation } from '@/lib/types';
import { Utensils, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface MealTableProps {
  mealTable: MealAssociation[];
}

export function MealTable({ mealTable }: MealTableProps) {
  if (!mealTable || mealTable.length === 0) {
    return (
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Utensils className="size-5 text-zinc-500" />
            <CardTitle className="text-lg font-bold">2×2 Meal Cohort Analysis</CardTitle>
          </div>
          <CardDescription className="text-xs">
            No meal correlation data active for this cluster.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-center text-xs text-zinc-500">
            No significant meal exposure detected across trailing 72 hours.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Utensils className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono">
                  Retrospective Cohort 2×2
                </Badge>
                <span className="text-xs text-zinc-500 font-mono">
                  {mealTable.length} Meals Scanned
                </span>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight mt-0.5">
                Meal Exposure & Relative Risk (RR)
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              Threshold: RR &gt; 4.0 (High Point Source Risk)
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Crucial Explanatory Caption */}
        <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
          <HelpCircle className="size-4 text-zinc-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              Why the &ldquo;Well&rdquo; Control Column Exists:
            </span>
            <p className="text-zinc-600 dark:text-zinc-400 leading-normal">
              You cannot investigate an outbreak using only the people who got sick. A control cohort of unaffected students establishes whether eating a meal actually increases illness risk beyond baseline. Relative Risk (RR) compares Attack Rate (Exposed) against Attack Rate (Unexposed).
            </p>
          </div>
        </div>

        {/* 2x2 Table */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
              <TableRow className="text-xs">
                <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Meal / Menu</TableHead>
                <TableHead className="text-center font-bold text-zinc-900 dark:text-zinc-100 bg-amber-50/40 dark:bg-amber-950/20" colSpan={3}>
                  Ate Meal (Exposed)
                </TableHead>
                <TableHead className="text-center font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100/50 dark:bg-zinc-800/40" colSpan={3}>
                  Did Not Eat (Unexposed)
                </TableHead>
                <TableHead className="text-right font-bold text-zinc-900 dark:text-zinc-100">Relative Risk</TableHead>
                <TableHead className="text-right font-bold text-zinc-900 dark:text-zinc-100">p-value</TableHead>
              </TableRow>
              <TableRow className="text-[11px] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <TableHead></TableHead>
                <TableHead className="text-center font-mono bg-amber-50/40 dark:bg-amber-950/20">Sick (a)</TableHead>
                <TableHead className="text-center font-mono bg-amber-50/40 dark:bg-amber-950/20">Well (b)</TableHead>
                <TableHead className="text-center font-mono bg-amber-50/40 dark:bg-amber-950/20">Attack Rate</TableHead>
                <TableHead className="text-center font-mono bg-zinc-100/50 dark:bg-zinc-800/40">Sick (c)</TableHead>
                <TableHead className="text-center font-mono bg-zinc-100/50 dark:bg-zinc-800/40">Well (d)</TableHead>
                <TableHead className="text-center font-mono bg-zinc-100/50 dark:bg-zinc-800/40">Attack Rate</TableHead>
                <TableHead className="text-right font-mono">AR(exp) / AR(un)</TableHead>
                <TableHead className="text-right font-mono">Fisher Exact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mealTable.map((m) => {
                const isHighRisk = m.relativeRisk >= 4.0;

                return (
                  <TableRow
                    key={m.mealId}
                    className={`text-xs transition-colors ${
                      isHighRisk
                        ? 'bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100/70 dark:hover:bg-red-950/50 font-medium'
                        : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    {/* Meal details */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isHighRisk && <AlertTriangle className="size-4 text-red-600 shrink-0" />}
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">{m.label}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {m.items.join(', ')}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Exposed: Sick, Well, Attack Rate */}
                    <TableCell className="text-center font-mono tabular-nums bg-amber-50/30 dark:bg-amber-950/10 font-semibold">
                      {m.exposedSick}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums bg-amber-50/30 dark:bg-amber-950/10 text-zinc-500">
                      {m.exposedWell}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums bg-amber-50/30 dark:bg-amber-950/10 font-bold">
                      {(m.attackRateExposed * 100).toFixed(1)}%
                    </TableCell>

                    {/* Unexposed: Sick, Well, Attack Rate */}
                    <TableCell className="text-center font-mono tabular-nums bg-zinc-100/30 dark:bg-zinc-800/20">
                      {m.unexposedSick}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums bg-zinc-100/30 dark:bg-zinc-800/20 text-zinc-500">
                      {m.unexposedWell}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums bg-zinc-100/30 dark:bg-zinc-800/20 font-bold">
                      {(m.attackRateUnexposed * 100).toFixed(1)}%
                    </TableCell>

                    {/* Relative Risk */}
                    <TableCell className="text-right">
                      <Badge
                        className={`font-mono text-xs tabular-nums ${
                          isHighRisk
                            ? 'bg-red-600 text-white font-bold'
                            : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        RR {m.relativeRisk.toFixed(1)}×
                      </Badge>
                    </TableCell>

                    {/* p-value */}
                    <TableCell className="text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                      p={m.pValue}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
