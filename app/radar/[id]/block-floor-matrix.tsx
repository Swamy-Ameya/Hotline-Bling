'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClusterDetail, ScenarioId } from '@/lib/types';
import { 
  Building2, 
  Droplets, 
  Utensils, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';

interface BlockFloorMatrixProps {
  detail: ClusterDetail;
  scenarioId: ScenarioId;
}

interface BlockSummary {
  id: string;
  name: string;
  type: 'hostel' | 'mess' | 'dayscholar';
  population: number;
  cases: number;
  attackRate: number;
  status: 'outbreak' | 'watch' | 'normal';
  peakFloor?: string;
  timeSpread: string;
}

export function BlockFloorMatrix({ detail, scenarioId }: BlockFloorMatrixProps) {
  const isFoodOutbreak = scenarioId === 'food';
  const isWaterOutbreak = scenarioId === 'filter_fault';
  const isCoincidence = scenarioId === 'coincidence';

  const [selectedBlockId, setSelectedBlockId] = useState<string>(isWaterOutbreak ? 'block-b' : isFoodOutbreak ? 'mess' : 'block-c');

  // Real-world practical blocks data
  const blocks: BlockSummary[] = [
    {
      id: 'block-a',
      name: 'Hostel Block A',
      type: 'hostel',
      population: 180,
      cases: isFoodOutbreak ? 4 : 1,
      attackRate: isFoodOutbreak ? 0.022 : 0.005,
      status: isFoodOutbreak ? 'watch' : 'normal',
      peakFloor: 'Floor 2 (1 case)',
      timeSpread: isFoodOutbreak ? 'Sharp (4-6h post-lunch)' : 'Scattered (7 days)',
    },
    {
      id: 'block-b',
      name: 'Hostel Block B',
      type: 'hostel',
      population: 180,
      cases: isWaterOutbreak ? 9 : isFoodOutbreak ? 5 : 1,
      attackRate: isWaterOutbreak ? 0.050 : isFoodOutbreak ? 0.027 : 0.005,
      status: isWaterOutbreak ? 'outbreak' : isFoodOutbreak ? 'watch' : 'normal',
      peakFloor: isWaterOutbreak ? 'Floor 3 (8 cases)' : 'Floor 4 (2 cases)',
      timeSpread: isWaterOutbreak ? 'Gradual Continuous (48h smeared)' : isFoodOutbreak ? 'Sharp Spike (4-6h post-lunch)' : 'Scattered',
    },
    {
      id: 'block-c',
      name: 'Hostel Block C',
      type: 'hostel',
      population: 180,
      cases: isCoincidence ? 7 : isFoodOutbreak ? 4 : 1,
      attackRate: isCoincidence ? 0.038 : isFoodOutbreak ? 0.022 : 0.005,
      status: isCoincidence ? 'watch' : isFoodOutbreak ? 'watch' : 'normal',
      peakFloor: isCoincidence ? 'Floor 1 (3 cases)' : 'Floor 2 (2 cases)',
      timeSpread: isCoincidence ? 'Random Baseline (72h scattered)' : isFoodOutbreak ? 'Sharp (4-6h post-lunch)' : 'Scattered',
    },
    {
      id: 'block-d',
      name: 'Hostel Block D',
      type: 'hostel',
      population: 180,
      cases: isFoodOutbreak ? 3 : 1,
      attackRate: isFoodOutbreak ? 0.016 : 0.005,
      status: isFoodOutbreak ? 'watch' : 'normal',
      peakFloor: 'Floor 3 (1 case)',
      timeSpread: isFoodOutbreak ? 'Sharp (4-6h post-lunch)' : 'Scattered',
    },
    {
      id: 'mess',
      name: 'Central Dining Mess',
      type: 'mess',
      population: 744,
      cases: isFoodOutbreak ? 19 : 0,
      attackRate: isFoodOutbreak ? 0.025 : 0.0,
      status: isFoodOutbreak ? 'outbreak' : 'normal',
      peakFloor: 'All Eating Students',
      timeSpread: isFoodOutbreak ? 'Point-Source Spike (3–7h after Friday Lunch)' : 'Normal',
    },
    {
      id: 'dayscholars',
      name: 'Day Scholars (Mess Only)',
      type: 'dayscholar',
      population: 150,
      cases: isFoodOutbreak ? 3 : 0,
      attackRate: isFoodOutbreak ? 0.020 : 0.0,
      status: isFoodOutbreak ? 'watch' : 'normal',
      peakFloor: 'Non-Hostellers',
      timeSpread: isFoodOutbreak ? 'Ate Friday Lunch only' : 'Zero cases',
    },
  ];

  const activeBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0];

  return (
    <div className="space-y-6">
      {/* 1. Practical Location & Time Probability Card */}
      <Card className="border border-zinc-200 dark:border-white/10 bg-zinc-950 text-white shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-zinc-900/90 border-b border-white/10 py-3.5 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-red-600 text-white">
                  <MapPin className="size-3.5" />
                </div>
                <CardTitle className="text-base font-bold text-zinc-100">
                  Location, Time &amp; Common Source Probability Matrix
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-zinc-400">
                  Campus-Wide
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Practical tracking of sick reports grouped by Building Location, Floor Concentration, and Time of Onset.
              </CardDescription>
            </div>

            {/* Verdict Status */}
            {isWaterOutbreak ? (
              <Badge className="bg-red-600 text-white text-xs font-bold py-1 px-3 flex items-center gap-1.5 shadow-sm">
                <Droplets className="size-3.5" />
                <span>Localized to Block B Water (p = 0.001)</span>
              </Badge>
            ) : isFoodOutbreak ? (
              <Badge className="bg-red-600 text-white text-xs font-bold py-1 px-3 flex items-center gap-1.5 shadow-sm">
                <Utensils className="size-3.5" />
                <span>Mess Food Poisoning (Point Source Spike)</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-700 bg-amber-950/40 text-amber-300 text-xs py-1 px-3">
                <CheckCircle2 className="size-3.5 text-amber-400 mr-1" />
                <span>Random Coincidence (p = 0.336 · Watch Only)</span>
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* 2. Core Detection Principles: Location + Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className={`p-3.5 rounded-xl border transition-all ${
              isWaterOutbreak ? 'bg-red-950/60 border-red-500 text-red-100 ring-1 ring-red-500/40' : 'bg-zinc-900/60 border-white/[0.08] text-zinc-400'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1 text-zinc-200">
                <Droplets className="size-3.5 text-blue-400" />
                <span>1. One Block Sick + Smeared Time</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Sick cases concentrate in <strong>one hostel block only</strong> over <strong>2 to 3 days</strong>.
                <br />
                <span className="text-zinc-200 font-semibold">Diagnosis:</span> Block water supply contamination.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border transition-all ${
              isFoodOutbreak ? 'bg-amber-950/60 border-amber-500 text-amber-100 ring-1 ring-amber-500/40' : 'bg-zinc-900/60 border-white/[0.08] text-zinc-400'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1 text-zinc-200">
                <Utensils className="size-3.5 text-amber-400" />
                <span>2. Multi-Block Sick + Sharp Spike</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Cases explode across <strong>multiple blocks &amp; day scholars</strong> within <strong>4 to 7 hours</strong> of a shared meal.
                <br />
                <span className="text-zinc-200 font-semibold">Diagnosis:</span> Central Mess food poisoning.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border transition-all ${
              isCoincidence ? 'bg-zinc-800 border-white/20 text-zinc-200' : 'bg-zinc-900/60 border-white/[0.08] text-zinc-400'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1 text-zinc-200">
                <Clock className="size-3.5 text-zinc-400" />
                <span>3. Scattered Cases + High p-Value</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Cases happen at random times and random rooms (Permutation test $p &gt; 0.05$).
                <br />
                <span className="text-zinc-200 font-semibold">Diagnosis:</span> Random coincidence, no alert sent.
              </p>
            </div>
          </div>

          {/* 3. Campus-Wide Location & Floor Breakdown Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="size-3.5 text-emerald-400" />
                <span>Location Matrix: Buildings, Floors &amp; Temporal Patterns</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Click any location to inspect</span>
            </div>

            <div className="border border-white/10 rounded-2xl overflow-hidden bg-zinc-900/80 divide-y divide-white/[0.08]">
              {/* Header */}
              <div className="grid grid-cols-12 px-4 py-2.5 bg-zinc-950/90 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                <div className="col-span-4">Location / Common Source</div>
                <div className="col-span-2 text-center">Cases / Total</div>
                <div className="col-span-2 text-center">Attack Rate</div>
                <div className="col-span-4 text-right">Time Pattern &amp; Spread</div>
              </div>

              {/* Rows */}
              {blocks.map((b) => {
                const isSelected = selectedBlockId === b.id;
                const isAlert = b.status === 'outbreak';
                const isWatch = b.status === 'watch';

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBlockId(b.id)}
                    className={`grid grid-cols-12 px-4 py-3 items-center text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-white/10'
                        : isAlert
                        ? 'bg-red-950/25 hover:bg-red-950/40'
                        : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Location Name */}
                    <div className="col-span-4 flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isAlert
                          ? 'bg-red-600 text-white'
                          : isWatch
                          ? 'bg-amber-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        {b.type === 'mess' ? (
                          <Utensils className="size-3.5" />
                        ) : (
                          <Building2 className="size-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                          <span>{b.name}</span>
                          {isAlert && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-red-600 text-white font-extrabold">
                              OUTBREAK
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {b.peakFloor}
                        </span>
                      </div>
                    </div>

                    {/* Case Count */}
                    <div className="col-span-2 text-center font-mono font-bold text-zinc-100">
                      {b.cases} / {b.population}
                    </div>

                    {/* Attack Rate */}
                    <div className="col-span-2 text-center font-mono font-bold">
                      <span className={isAlert ? 'text-red-400 font-extrabold' : isWatch ? 'text-amber-400' : 'text-zinc-400'}>
                        {(b.attackRate * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* Time Pattern */}
                    <div className="col-span-4 text-right text-[11px] font-mono text-zinc-300 flex items-center justify-end gap-1.5">
                      <Clock className="size-3 text-zinc-400" />
                      <span>{b.timeSpread}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Active Selected Location Breakdown Box */}
          {activeBlock && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    activeBlock.status === 'outbreak' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {activeBlock.type === 'mess' ? <Utensils className="size-4" /> : <Building2 className="size-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-100 text-sm">{activeBlock.name}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Exposed Population: {activeBlock.population} students · Highest Concentration: {activeBlock.peakFloor}
                    </p>
                  </div>
                </div>

                <Badge className={
                  activeBlock.status === 'outbreak'
                    ? 'bg-red-600 text-white font-bold text-xs py-1 px-2.5'
                    : activeBlock.status === 'watch'
                    ? 'bg-amber-600 text-white text-xs py-1 px-2.5'
                    : 'border-zinc-700 text-zinc-300 text-xs py-1'
                }>
                  {activeBlock.status === 'outbreak' ? 'CRITICAL OUTBREAK' : activeBlock.status === 'watch' ? 'ELEVATED (WATCH)' : 'NORMAL BASELINE'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Total Cases</span>
                  <span className="text-base font-bold font-mono text-zinc-100">
                    {activeBlock.cases} students
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Attack Rate</span>
                  <span className="text-base font-bold font-mono text-zinc-100">
                    {(activeBlock.attackRate * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Time Signature</span>
                  <span className="text-xs font-bold text-zinc-200">
                    {activeBlock.timeSpread}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/[0.08] text-[11px] text-zinc-300 leading-relaxed">
                <strong>Source Investigation:</strong>{' '}
                {isWaterOutbreak && activeBlock.id === 'block-b' ? (
                  <span>
                    Because illness is strictly confined to <strong>Hostel Block B</strong> and spread over a continuous 48-hour period while other blocks remain at baseline, the permutation test isolates this to the <strong>Block B Water Pipeline</strong>.
                  </span>
                ) : isFoodOutbreak ? (
                  <span>
                    Cases span multiple hostel blocks and non-hostel day scholars with an abrupt onset 4–6 hours after Friday Lunch, establishing the <strong>Mess Kitchen</strong> as the point source.
                  </span>
                ) : (
                  <span>
                    Reports in this location are temporally and geographically scattered, matching random background illness rates.
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
