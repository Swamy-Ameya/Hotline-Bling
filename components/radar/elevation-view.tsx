'use client';

import React from 'react';
import type { CampusElevation, ElevationBlock, ElevationCell, ElevationFloor } from '@/lib/types';
import { getAttackRateClasses, formatCases, formatAttackRate } from './attack-rate-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Utensils, Users, Info, ShieldAlert } from 'lucide-react';

interface ElevationViewProps {
  elevation: CampusElevation;
}

export function ElevationView({ elevation }: ElevationViewProps) {
  const { blocks, mess, dayScholars, maxAttackRate } = elevation;

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <CardHeader className="py-2.5 px-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Campus Infrastructure Elevation
              </CardTitle>
            </div>
            <CardDescription className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Topological graph view: 4 hostel tank blocks, 20 floors (2 filters/floor), central kitchen, and day scholars control group.
            </CardDescription>
          </div>

          {/* Color Ramp Legend */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-medium text-[11px]">
              <span>Attack rate:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 tabular-nums">
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700" />
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400">0%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-900" />
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400">≤25%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-amber-300 dark:bg-amber-800 border border-amber-400 dark:border-amber-700" />
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400">≤50%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-orange-400 dark:bg-orange-700 border border-orange-500 dark:border-orange-600" />
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400">≤75%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-red-500 dark:bg-red-600 border border-red-600 dark:border-red-500" />
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400">&gt;75%</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono tabular-nums bg-white dark:bg-zinc-900 py-0">
              Peak: {formatAttackRate(maxAttackRate)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Four Block Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {blocks.map((block) => (
            <BlockColumn
              key={block.nodeId}
              block={block}
              maxAttackRate={maxAttackRate}
            />
          ))}
        </div>

        {/* Mess and Day Scholars row spanning full width below blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
          {/* Central Mess Bar spanning 3 columns on large screens */}
          <div className="lg:col-span-3">
            <MessBar mess={mess} maxAttackRate={maxAttackRate} />
          </div>

          {/* Day Scholars Control Group Tile */}
          <div className="lg:col-span-1">
            <DayScholarsTile dayScholars={dayScholars} maxAttackRate={maxAttackRate} />
          </div>
        </div>

        {/* Privacy Note Footer */}
        <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3 text-zinc-400" />
            <span>DPDP Act 2023: Sub-threshold counts suppressed as &lt;3 to prevent room-level student deanonymisation.</span>
          </div>
          <span className="font-mono text-[9px] hidden sm:inline">Normalised vs. exposed sub-population</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface BlockColumnProps {
  block: ElevationBlock;
  maxAttackRate: number;
}

function BlockColumn({ block, maxAttackRate }: BlockColumnProps) {
  const isBlockFlagged = block.isFlagged;

  return (
    <div
      className={`flex flex-col rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/30 overflow-hidden transition-all ${
        isBlockFlagged
          ? 'border-red-400 dark:border-red-600 ring-2 ring-red-500 animate-pulse'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* Block Tank Header */}
      <div className="px-2.5 py-1.5 bg-zinc-100/90 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">{block.label}</span>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">({block.tankName})</span>
        </div>
        <div className="flex items-center gap-1.5 tabular-nums">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Cases: <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">{formatCases(block.caseCount, block.suppressed)}</strong>
          </span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-700 dark:text-zinc-300 font-mono">
            {formatAttackRate(block.attackRate)}
          </span>
        </div>
      </div>

      {/* Floors stack (Floors arrive highest first) */}
      <div className="p-1.5 flex flex-col gap-1 flex-1">
        {block.floors.map((floor) => (
          <FloorRow
            key={floor.nodeId}
            floor={floor}
            maxAttackRate={maxAttackRate}
          />
        ))}
      </div>
    </div>
  );
}

interface FloorRowProps {
  floor: ElevationFloor;
  maxAttackRate: number;
}

function FloorRow({ floor, maxAttackRate }: FloorRowProps) {
  const isFloorFlagged = floor.isFlagged;

  return (
    <div
      className={`rounded p-1 border transition-all ${
        isFloorFlagged
          ? 'border-red-400 dark:border-red-600 bg-red-50/30 dark:bg-red-950/20'
          : 'border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60'
      }`}
    >
      <div className="flex items-center justify-between text-[9px] text-zinc-500 dark:text-zinc-400 mb-0.5 px-0.5">
        <span className="font-medium">{floor.label}</span>
        <span className="tabular-nums font-mono text-[8.5px]">
          {floor.caseCount > 0 ? `${formatCases(floor.caseCount, floor.suppressed)} cases` : '0 cases'}
        </span>
      </div>

      {/* 2 Filters per floor */}
      <div className="grid grid-cols-2 gap-1">
        {floor.filters.map((cell) => (
          <FilterCell
            key={cell.nodeId}
            cell={cell}
            maxAttackRate={maxAttackRate}
          />
        ))}
      </div>
    </div>
  );
}

interface FilterCellProps {
  cell: ElevationCell;
  maxAttackRate: number;
}

function FilterCell({ cell, maxAttackRate }: FilterCellProps) {
  const color = getAttackRateClasses(cell.attackRate, maxAttackRate, cell.isFlagged, cell.suppressed);
  const isFlagged = cell.isFlagged;

  return (
    <div
      title={`Filter ${cell.label} · Rooms: ${cell.servesRooms ?? 'N/A'} · Exposed Pop: ${cell.exposedPopulation} · Attack Rate: ${formatAttackRate(cell.attackRate)}`}
      className={`relative rounded p-1 border flex flex-col justify-between transition-all ${color.bg} ${color.border} ${
        isFlagged ? 'ring-2 ring-red-500 animate-pulse z-10' : ''
      }`}
    >
      {isFlagged && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>
      )}

      <div className="flex items-center justify-between leading-none mb-0.5">
        <span className={`text-[10px] font-bold tracking-tight ${color.text}`}>
          Filter {cell.label}
        </span>
        <span className={`text-[9px] font-mono tabular-nums ${color.text}`}>
          {formatAttackRate(cell.attackRate)}
        </span>
      </div>

      <div className="flex items-center justify-between text-[8.5px] tabular-nums mt-0.5 opacity-90">
        <span className={color.text}>
          {cell.servesRooms ? `R:${cell.servesRooms}` : ''}
        </span>
        <span className={`font-semibold ${color.text}`}>
          {formatCases(cell.caseCount, cell.suppressed)} <span className="font-normal opacity-80">cases</span>
        </span>
      </div>
    </div>
  );
}

interface MessBarProps {
  mess: CampusElevation['mess'];
  maxAttackRate: number;
}

function MessBar({ mess, maxAttackRate }: MessBarProps) {
  const isMessFlagged = mess.isFlagged;
  const messColor = getAttackRateClasses(mess.attackRate, maxAttackRate, mess.isFlagged, mess.suppressed);

  return (
    <div
      className={`rounded-lg border p-2.5 flex flex-col justify-between transition-all ${
        isMessFlagged
          ? 'border-red-500 dark:border-red-600 ring-2 ring-red-500 animate-pulse bg-red-50/50 dark:bg-red-950/30'
          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Utensils className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                Central Mess &amp; Kitchen
              </span>
              <Badge variant="outline" className="text-[9px] font-normal py-0 px-1 border-zinc-300 dark:border-zinc-700">
                Shared (pop 600)
              </Badge>
              {isMessFlagged && (
                <Badge className="bg-red-600 text-white text-[9px] py-0 px-1 flex items-center gap-0.5">
                  <ShieldAlert className="h-2.5 w-2.5" /> FLAGGED
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] tabular-nums font-mono">
          <span className="text-zinc-600 dark:text-zinc-400">
            Cases: <strong className="text-zinc-900 dark:text-zinc-100">{formatCases(mess.caseCount, mess.suppressed)}</strong>
          </span>
          <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-[10px]">
            {formatAttackRate(mess.attackRate)}
          </span>
        </div>
      </div>

      {/* Mess filters M1 and M2 */}
      <div className="grid grid-cols-2 gap-1.5">
        {mess.filters.map((filter) => {
          const filterColor = getAttackRateClasses(filter.attackRate, maxAttackRate, filter.isFlagged, filter.suppressed);
          const isFilterFlagged = filter.isFlagged;

          return (
            <div
              key={filter.nodeId}
              className={`rounded p-1.5 border flex items-center justify-between ${filterColor.bg} ${filterColor.border} ${
                isFilterFlagged ? 'ring-2 ring-red-500 animate-pulse' : ''
              }`}
            >
              <div>
                <span className={`text-[11px] font-bold ${filterColor.text}`}>Filter {filter.label}</span>
                <span className={`text-[9px] block opacity-80 ${filterColor.text}`}>Kitchen supply</span>
              </div>
              <div className="text-right tabular-nums">
                <div className={`text-[10px] font-semibold ${filterColor.text}`}>
                  {formatCases(filter.caseCount, filter.suppressed)} cases
                </div>
                <div className={`text-[9px] font-mono ${filterColor.text}`}>
                  {formatAttackRate(filter.attackRate)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DayScholarsTileProps {
  dayScholars: CampusElevation['dayScholars'];
  maxAttackRate: number;
}

function DayScholarsTile({ dayScholars, maxAttackRate }: DayScholarsTileProps) {
  const color = getAttackRateClasses(dayScholars.attackRate, maxAttackRate, false, dayScholars.suppressed);

  return (
    <div
      className={`rounded-lg border p-2.5 flex flex-col justify-between h-full transition-all ${color.bg} ${color.border}`}
    >
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1">
            <Users className={`h-3.5 w-3.5 ${color.text}`} />
            <span className={`text-[11px] font-bold ${color.text}`}>Day Scholars</span>
          </div>
          <span className={`text-[9px] font-mono px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 ${color.text}`}>
            Control
          </span>
        </div>
        <p className={`text-[9px] leading-tight opacity-90 mt-0.5 ${color.text}`}>
          Pop {dayScholars.exposedPopulation}. Eat at mess, drink no hostel tank water.
        </p>
      </div>

      <div className="mt-2 pt-1.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between tabular-nums">
        <div className="text-left">
          <span className={`text-[9px] block opacity-80 ${color.text}`}>Cases</span>
          <span className={`text-[11px] font-bold ${color.text}`}>
            {formatCases(dayScholars.caseCount, dayScholars.suppressed)}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-[9px] block opacity-80 ${color.text}`}>Attack Rate</span>
          <span className={`text-[11px] font-mono font-semibold ${color.text}`}>
            {formatAttackRate(dayScholars.attackRate)}
          </span>
        </div>
      </div>
    </div>
  );
}
