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
  AlertTriangle, 
  ArrowRight, 
  Info,
  HelpCircle,
  Activity,
  Layers,
  Search
} from 'lucide-react';

interface FloorFilterMatrixProps {
  detail: ClusterDetail;
  scenarioId: ScenarioId;
}

interface FloorData {
  floorNum: number;
  label: string;
  filterA: {
    id: string;
    label: string;
    roomRange: string;
    population: number;
    cases: number;
    attackRate: number;
    isHot: boolean;
  };
  filterB: {
    id: string;
    label: string;
    roomRange: string;
    population: number;
    cases: number;
    attackRate: number;
    isHot: boolean;
  };
}

export function FloorFilterMatrix({ detail, scenarioId }: FloorFilterMatrixProps) {
  const isFoodOutbreak = scenarioId === 'food';
  const isFilterFault = scenarioId === 'filter_fault';
  const isCoincidence = scenarioId === 'coincidence';

  const [selectedFilterId, setSelectedFilterId] = useState<string>(isFilterFault ? 'filter-B3A' : 'filter-B3A');

  // Ground-truth floor matrix for Block B
  const floors: FloorData[] = [
    {
      floorNum: 5,
      label: 'Floor 5',
      filterA: { id: 'filter-B5A', label: 'Filter 5A', roomRange: 'Rooms 501–515', population: 36, cases: isFoodOutbreak ? 2 : 0, attackRate: isFoodOutbreak ? 0.055 : 0, isHot: false },
      filterB: { id: 'filter-B5B', label: 'Filter 5B', roomRange: 'Rooms 516–530', population: 36, cases: isFoodOutbreak ? 1 : 0, attackRate: isFoodOutbreak ? 0.027 : 0, isHot: false },
    },
    {
      floorNum: 4,
      label: 'Floor 4',
      filterA: { id: 'filter-B4A', label: 'Filter 4A', roomRange: 'Rooms 401–415', population: 36, cases: isFoodOutbreak ? 2 : 0, attackRate: isFoodOutbreak ? 0.055 : 0, isHot: false },
      filterB: { id: 'filter-B4B', label: 'Filter 4B', roomRange: 'Rooms 416–430', population: 36, cases: isFoodOutbreak ? 1 : 0, attackRate: isFoodOutbreak ? 0.027 : 0, isHot: false },
    },
    {
      floorNum: 3,
      label: 'Floor 3',
      filterA: { id: 'filter-B3A', label: 'Filter 3A', roomRange: 'Rooms 301–315', population: 36, cases: isFilterFault ? 8 : isCoincidence ? 2 : isFoodOutbreak ? 2 : 0, attackRate: isFilterFault ? 0.222 : isCoincidence ? 0.055 : isFoodOutbreak ? 0.055 : 0, isHot: isFilterFault },
      filterB: { id: 'filter-B3B', label: 'Filter 3B', roomRange: 'Rooms 316–330', population: 36, cases: isFilterFault ? 0 : isCoincidence ? 1 : isFoodOutbreak ? 1 : 0, attackRate: isFilterFault ? 0.0 : isCoincidence ? 0.027 : isFoodOutbreak ? 0.027 : 0, isHot: false },
    },
    {
      floorNum: 2,
      label: 'Floor 2',
      filterA: { id: 'filter-B2A', label: 'Filter 2A', roomRange: 'Rooms 201–215', population: 36, cases: isFoodOutbreak ? 2 : 0, attackRate: isFoodOutbreak ? 0.055 : 0, isHot: false },
      filterB: { id: 'filter-B2B', label: 'Filter 2B', roomRange: 'Rooms 216–230', population: 36, cases: isFoodOutbreak ? 1 : 0, attackRate: isFoodOutbreak ? 0.027 : 0, isHot: false },
    },
    {
      floorNum: 1,
      label: 'Floor 1',
      filterA: { id: 'filter-B1A', label: 'Filter 1A', roomRange: 'Rooms 101–115', population: 36, cases: isFoodOutbreak ? 1 : 0, attackRate: isFoodOutbreak ? 0.027 : 0, isHot: false },
      filterB: { id: 'filter-B1B', label: 'Filter 1B', roomRange: 'Rooms 116–130', population: 36, cases: isFoodOutbreak ? 2 : 0, attackRate: isFoodOutbreak ? 0.055 : 0, isHot: false },
    },
  ];

  // Find active selected filter info
  let activeFilterInfo: FloorData['filterA'] | null = null;
  let activeFloorNum = 3;
  let siblingFilterInfo: FloorData['filterB'] | null = null;

  for (const fl of floors) {
    if (fl.filterA.id === selectedFilterId) {
      activeFilterInfo = fl.filterA;
      siblingFilterInfo = fl.filterB;
      activeFloorNum = fl.floorNum;
      break;
    }
    if (fl.filterB.id === selectedFilterId) {
      activeFilterInfo = fl.filterB;
      siblingFilterInfo = fl.filterA;
      activeFloorNum = fl.floorNum;
      break;
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Diagnostic Detective Summary Card */}
      <Card className="border border-zinc-200 dark:border-white/10 bg-zinc-950 text-white shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-zinc-900/90 border-b border-white/10 py-3.5 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500 text-zinc-950">
                  <Search className="size-3.5" />
                </div>
                <CardTitle className="text-base font-bold text-zinc-100">
                  Floor &amp; Sibling Filter Diagnostic Matrix
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-zinc-400">
                  Block B (Tank B)
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Localising the exact point of failure by comparing vertical floor dispersion and horizontal sibling filter contrast.
              </CardDescription>
            </div>

            {/* Diagnostic Conclusion Badge */}
            {isFilterFault ? (
              <Badge className="bg-red-600 text-white text-xs font-bold py-1 px-3 flex items-center gap-1.5 shadow-sm">
                <ShieldAlert className="size-3.5" />
                <span>Localized to Filter 3A (Single Dispenser)</span>
              </Badge>
            ) : isFoodOutbreak ? (
              <Badge className="bg-amber-600 text-white text-xs font-bold py-1 px-3 flex items-center gap-1.5 shadow-sm">
                <Utensils className="size-3.5" />
                <span>Uniform Cross-Block Spread (Mess Kitchen)</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-xs py-1 px-3">
                <CheckCircle2 className="size-3.5 text-emerald-400 mr-1" />
                <span>Uniform Background Variance (No Localized Fault)</span>
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* 2. Three Golden Diagnostic Rules Cheat Sheet */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className={`p-3.5 rounded-xl border transition-all ${
              isFilterFault ? 'bg-red-950/60 border-red-500/80 ring-1 ring-red-500/40 text-red-100' : 'bg-zinc-900/60 border-white/[0.08] text-zinc-400'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1 text-zinc-200">
                <Droplets className="size-3.5 text-red-400" />
                <span>1. Single Filter Hot, Sibling Cold</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Filter 3A is hot (8 cases), but Filter 3B on the exact same floor is cold (0 cases). 
                <strong> Proves:</strong> The fault is inside the Filter 3A dispenser cartridge, not the tank.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border transition-all ${
              !isFilterFault && !isFoodOutbreak ? 'bg-zinc-800/80 border-white/20 text-zinc-200' : 'bg-zinc-900/60 border-white/[0.08] text-zinc-400'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1 text-zinc-200">
                <Building2 className="size-3.5 text-amber-400" />
                <span>2. Whole Block Uniformly Sick</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                If Floors 1, 2, 3, 4, 5 all carry equal attack rates inside Block B only. 
                <strong> Proves:</strong> The overhead Tank B supplying all 5 floors is contaminated.
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border transition-all ${
              isFoodOutbreak ? 'bg-amber-950/60 border-amber-500/80 ring-1 ring-amber-500/40 text-amber-100' : 'bg-zinc-900/60 border-white/[0.08] text-zinc-400'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1 text-zinc-200">
                <Utensils className="size-3.5 text-amber-400" />
                <span>3. Cross-Block + Day Scholars Sick</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Cases scatter across Block A, B, C, D AND day scholars (who drink no tank water). 
                <strong> Proves:</strong> The central mess kitchen food is the common source.
              </p>
            </div>
          </div>

          {/* 3. Interactive Vertical Floor & Sibling Filter Comparison Matrix */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="size-3.5 text-blue-400" />
                <span>Block B: Floor-by-Floor Sibling Filter Comparison Matrix</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Click any filter to inspect room lineage</span>
            </div>

            <div className="border border-white/10 rounded-2xl overflow-hidden bg-zinc-900/80 divide-y divide-white/[0.08]">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-4 py-2.5 bg-zinc-950/90 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                <div className="col-span-2">Floor</div>
                <div className="col-span-5 text-center border-r border-white/10 pr-2">Filter A (Rooms 01–15)</div>
                <div className="col-span-5 text-center pl-2">Filter B (Rooms 16–30)</div>
              </div>

              {/* 5 Floors Top-Down (Floor 5 down to Floor 1) */}
              {floors.map((floor) => {
                const isFloor3Hot = floor.floorNum === 3 && isFilterFault;

                return (
                  <div
                    key={floor.floorNum}
                    className={`grid grid-cols-12 px-4 py-3 items-center text-xs transition-colors ${
                      isFloor3Hot ? 'bg-red-950/30' : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Floor Label Column */}
                    <div className="col-span-2 flex flex-col">
                      <span className="font-bold text-zinc-100">{floor.label}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">72 Students</span>
                    </div>

                    {/* Filter A Column */}
                    <div className="col-span-5 border-r border-white/10 pr-3">
                      <button
                        type="button"
                        onClick={() => setSelectedFilterId(floor.filterA.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          floor.filterA.isHot
                            ? 'bg-red-600 text-white border-white shadow-md ring-2 ring-red-400'
                            : selectedFilterId === floor.filterA.id
                            ? 'bg-zinc-800 border-white text-zinc-100'
                            : 'bg-zinc-950 border-white/[0.08] text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <Droplets className={`size-3 ${floor.filterA.isHot ? 'text-white' : 'text-blue-400'}`} />
                            <span>{floor.filterA.label}</span>
                            {floor.filterA.isHot && (
                              <span className="ml-1 text-[9px] bg-white text-red-700 px-1 py-0.2 rounded font-extrabold">
                                HOTSPOT
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] block ${floor.filterA.isHot ? 'text-red-100' : 'text-zinc-400 font-mono'}`}>
                            {floor.filterA.roomRange}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold font-mono text-sm block">
                            {floor.filterA.cases} cases
                          </span>
                          <span className={`text-[10px] font-mono ${floor.filterA.isHot ? 'text-red-100' : 'text-zinc-400'}`}>
                            AR: {(floor.filterA.attackRate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Filter B Column (Sibling Filter) */}
                    <div className="col-span-5 pl-3">
                      <button
                        type="button"
                        onClick={() => setSelectedFilterId(floor.filterB.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          floor.filterB.isHot
                            ? 'bg-red-600 text-white border-white shadow-md ring-2 ring-red-400'
                            : selectedFilterId === floor.filterB.id
                            ? 'bg-zinc-800 border-white text-zinc-100'
                            : 'bg-zinc-950 border-white/[0.08] text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <Droplets className="size-3 text-blue-400" />
                            <span>{floor.filterB.label}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono block">
                            {floor.filterB.roomRange}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold font-mono text-sm block">
                            {floor.filterB.cases} cases
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            AR: {(floor.filterB.attackRate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Selected Filter & Sibling Contrast Breakdown Box */}
          {activeFilterInfo && siblingFilterInfo && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${activeFilterInfo.isHot ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                    <Droplets className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-100 text-sm">
                      Inspecting: {activeFilterInfo.label} (Floor {activeFloorNum})
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Serving {activeFilterInfo.roomRange} · Population: {activeFilterInfo.population} students
                    </p>
                  </div>
                </div>

                {activeFilterInfo.isHot ? (
                  <Badge className="bg-red-600 text-white font-bold text-xs py-1 px-2.5 animate-pulse">
                    HOTTEST OUTBREAK NODE
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-xs py-1">
                    Normal Baseline
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Filter Attack Rate</span>
                  <span className="text-base font-bold font-mono text-zinc-100">
                    {(activeFilterInfo.attackRate * 100).toFixed(1)}% ({activeFilterInfo.cases} / {activeFilterInfo.population})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Sibling Filter Contrast</span>
                  <span className="text-base font-bold font-mono text-zinc-100">
                    {siblingFilterInfo.label}: {(siblingFilterInfo.attackRate * 100).toFixed(1)}% ({siblingFilterInfo.cases} cases)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Upstream Source</span>
                  <span className="text-base font-bold text-zinc-100">
                    Block B Tank (Floor {activeFloorNum} Line)
                  </span>
                </div>
              </div>

              {/* Logical Isolation Callout */}
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/[0.08] text-[11px] text-zinc-300 leading-relaxed">
                <strong>Surveillance Diagnostic:</strong>{' '}
                {isFilterFault ? (
                  <span>
                    Because <strong>{activeFilterInfo.label}</strong> carries 8 cases while sibling <strong>{siblingFilterInfo.label}</strong> has 0 cases and adjacent floors have 0 cases, the permutation scan statistic ($p = 0.001$) localises the contamination exclusively to this single filter's carbon/UV cartridge.
                  </span>
                ) : isFoodOutbreak ? (
                  <span>
                    Cases are scattered evenly across multiple floors and outside blocks, indicating exposure was not dependent on this specific water dispenser.
                  </span>
                ) : (
                  <span>
                    Slight case differences across filters are within ordinary stochastic Poisson background noise ($p = 0.336$, held at watch).
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
