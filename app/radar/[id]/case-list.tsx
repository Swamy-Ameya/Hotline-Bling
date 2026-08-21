'use client';

import React, { useState } from 'react';
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
import { CaseRow, SYMPTOM_LABELS, Symptom } from '@/lib/types';
import { 
  Users, 
  Stethoscope, 
  User, 
  AlertCircle, 
  Info, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface CaseListProps {
  cases: CaseRow[];
}

export function CaseList({ cases }: CaseListProps) {
  const [filterType, setFilterType] = useState<'all' | 'unprompted' | 'prompted'>('all');

  const filteredCases = cases.filter((c) => {
    if (filterType === 'unprompted') return !c.prompted;
    if (filterType === 'prompted') return c.prompted;
    return true;
  });

  const promptedCount = cases.filter((c) => c.prompted).length;

  return (
    <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Users className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono">
                  Role-Redacted Case Stream
                </Badge>
                <span className="text-xs text-zinc-500 font-mono">
                  {cases.length} Total Reports
                </span>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight mt-0.5">
                Cluster Case Roster
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              All ({cases.length})
            </button>
            <button
              onClick={() => setFilterType('unprompted')}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'unprompted'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Unprompted ({cases.length - promptedCount})
            </button>
            {promptedCount > 0 && (
              <button
                onClick={() => setFilterType('prompted')}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterType === 'prompted'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Prompted ({promptedCount})
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Compliance / Prompted Exclusion Notice */}
        <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
          <Info className="size-4 text-zinc-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              Epidemiologic Integrity & DPDP Privacy:
            </span>
            <p className="text-zinc-600 dark:text-zinc-400 leading-normal">
              Student identities are rendered verbatim as provisioned by server-side role policies (sanitized IDs for wardens, clinical keys for physicians). 
              Any reports flagged with <strong>Prompted</strong> occurred after campus advisory broadcast and are <em>strictly excluded from spatial scan statistics</em> to eliminate rumour feedback loops while retaining care continuity.
            </p>
          </div>
        </div>

        {/* Case Table */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
              <TableRow className="text-xs">
                <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Student</TableHead>
                <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Location / Source</TableHead>
                <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Symptoms</TableHead>
                <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Onset (Local)</TableHead>
                <TableHead className="text-center font-bold text-zinc-900 dark:text-zinc-100">Severity</TableHead>
                <TableHead className="text-right font-bold text-zinc-900 dark:text-zinc-100">Intake Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-zinc-500">
                    No cases match the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCases.map((c) => {
                  const onsetDate = new Date(c.onsetTime).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Kolkata',
                  });

                  return (
                    <TableRow
                      key={c.id}
                      className={`text-xs hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 ${
                        c.prompted ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Student Label */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                            {c.studentLabel}
                          </span>
                          {c.prompted && (
                            <Badge variant="outline" className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 text-[10px] py-0 h-4">
                              Prompted (Excluded from Scan)
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {c.blockLabel ?? 'Day Scholar'} {c.roomNumber ? `· Rm ${c.roomNumber}` : ''}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            {c.filterName ?? 'Mess Kitchen'} {c.floorLabel ? `(${c.floorLabel})` : ''}
                          </div>
                        </div>
                      </TableCell>

                      {/* Symptoms */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {c.symptoms.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            >
                              {SYMPTOM_LABELS[s]}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      {/* Onset */}
                      <TableCell className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                        {onsetDate}
                      </TableCell>

                      {/* Severity */}
                      <TableCell className="text-center">
                        <Badge
                          className={`font-mono text-xs tabular-nums ${
                            c.severity >= 4
                              ? 'bg-red-600 text-white'
                              : c.severity === 3
                              ? 'bg-amber-500 text-white'
                              : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {c.severity} / 5
                        </Badge>
                      </TableCell>

                      {/* Intake Source */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1 text-xs">
                          {c.reportedBy === 'doctor' ? (
                            <>
                              <Stethoscope className="size-3.5 text-emerald-600" />
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Doctor (1.0×)</span>
                            </>
                          ) : (
                            <>
                              <User className="size-3.5 text-zinc-500" />
                              <span className="text-zinc-500">Self (0.6×)</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
