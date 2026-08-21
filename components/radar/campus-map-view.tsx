'use client';

import React, { useState } from 'react';
import type { CampusElevation, DetectionResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Utensils, ShieldAlert, CheckCircle2, AlertTriangle, Info, MapPin, Radio, Activity } from 'lucide-react';
import { formatCases, formatAttackRate } from './attack-rate-utils';

interface CampusMapViewProps {
  elevation: CampusElevation;
  result: DetectionResult;
}

export function CampusMapView({ elevation, result }: CampusMapViewProps) {
  const { blocks, mess } = elevation;
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const isMessOutbreak = result.topCluster?.hypothesis === 'food';

  // Helper to find blocks
  const blockA = blocks.find((b) => b.nodeId === 'block-A') || blocks[0];
  const blockB = blocks.find((b) => b.nodeId === 'block-B') || blocks[1];
  const blockC = blocks.find((b) => b.nodeId === 'block-C') || blocks[2];
  const blockD = blocks.find((b) => b.nodeId === 'block-D') || blocks[3];

  const selectedBlock = blocks.find((b) => b.nodeId === selectedBlockId);

  return (
    <div className="space-y-4">
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-md overflow-hidden bg-zinc-950 text-white relative">
        {/* Header */}
        <CardHeader className="py-3 px-4 sm:px-6 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <Radio className="h-4 w-4 animate-pulse text-emerald-400" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider">LIVE 2D RADAR</span>
                </div>
                <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
                  Hostel Campus Outbreak Heatmap
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Topological 2D layout: 4 residential hostel blocks (A, B, C, D) &amp; Central Dining Hall.
              </CardDescription>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-zinc-400 text-[11px]">Infection Heat:</span>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" /> Normal
                </span>
                <span className="flex items-center gap-1 text-[11px] text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> Watch
                </span>
                <span className="flex items-center gap-1 text-[11px] text-red-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" /> Outbreak
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* 2D Interactive Map Canvas */}
        <CardContent className="p-3 sm:p-5">
          <div className="relative w-full aspect-[16/10] max-h-[420px] rounded-xl bg-zinc-900/90 border border-zinc-800 overflow-hidden flex items-center justify-center p-3">
            {/* Background Grid Lines representing campus pathways */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            {/* Rotating Radar Sweep Line */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[85%] h-[85%] rounded-full border border-emerald-500/20 relative animate-[spin_8s_linear_infinite]">
                <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-emerald-400 origin-left" />
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.15)_90deg,transparent_90deg)] rounded-tr-full origin-bottom-left" />
              </div>
            </div>

            {/* Concentric Distance Rings */}
            <div className="absolute w-[60%] h-[60%] rounded-full border border-zinc-800 pointer-events-none" />
            <div className="absolute w-[35%] h-[35%] rounded-full border border-zinc-800/80 pointer-events-none" />

            {/* 2D Layout Map Nodes */}
            <div className="relative z-10 w-full h-full grid grid-cols-3 grid-rows-3 gap-2 sm:gap-4 items-center justify-items-center">
              {/* TOP LEFT: Block A */}
              <div className="col-start-1 row-start-1 w-full max-w-[200px]">
                <BuildingNode
                  block={blockA}
                  label="Hostel Block A"
                  sub="180 Students · Tank A"
                  isSelected={selectedBlockId === blockA.nodeId}
                  onClick={() => setSelectedBlockId(blockA.nodeId === selectedBlockId ? null : blockA.nodeId)}
                />
              </div>

              {/* TOP RIGHT: Block B */}
              <div className="col-start-3 row-start-1 w-full max-w-[200px]">
                <BuildingNode
                  block={blockB}
                  label="Hostel Block B"
                  sub="180 Students · Tank B"
                  isSelected={selectedBlockId === blockB.nodeId}
                  onClick={() => setSelectedBlockId(blockB.nodeId === selectedBlockId ? null : blockB.nodeId)}
                />
              </div>

              {/* CENTER: Central Mess & Dining Hall */}
              <div className="col-start-2 row-start-2 w-full max-w-[240px]">
                <MessNode
                  mess={mess}
                  isFlagged={mess.isFlagged || isMessOutbreak}
                  isSelected={selectedBlockId === 'mess'}
                  onClick={() => setSelectedBlockId(selectedBlockId === 'mess' ? null : 'mess')}
                />
              </div>

              {/* BOTTOM LEFT: Block C */}
              <div className="col-start-1 row-start-3 w-full max-w-[200px]">
                <BuildingNode
                  block={blockC}
                  label="Hostel Block C"
                  sub="180 Students · Tank C"
                  isSelected={selectedBlockId === blockC.nodeId}
                  onClick={() => setSelectedBlockId(blockC.nodeId === selectedBlockId ? null : blockC.nodeId)}
                />
              </div>

              {/* BOTTOM RIGHT: Block D */}
              <div className="col-start-3 row-start-3 w-full max-w-[200px]">
                <BuildingNode
                  block={blockD}
                  label="Hostel Block D"
                  sub="180 Students · Tank D"
                  isSelected={selectedBlockId === blockD.nodeId}
                  onClick={() => setSelectedBlockId(blockD.nodeId === selectedBlockId ? null : blockD.nodeId)}
                />
              </div>
            </div>
          </div>

          {/* Selected Node Breakdown Drawer */}
          {selectedBlock && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 transition-all animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{selectedBlock.label} Inspection Breakdown</h4>
                    <p className="text-xs text-zinc-400">Total Cases: <strong>{formatCases(selectedBlock.caseCount, selectedBlock.suppressed)}</strong> · Attack Rate: {formatAttackRate(selectedBlock.attackRate)}</p>
                  </div>
                </div>
                {selectedBlock.isFlagged ? (
                  <Badge className="bg-red-600 text-white font-bold animate-pulse">HOTSPOT FLAGGED</Badge>
                ) : (
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700">NORMAL BASELINE</Badge>
                )}
              </div>

              {/* Floor-by-Floor Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-3">
                {selectedBlock.floors.map((floor) => {
                  const hasCases = floor.caseCount > 0;
                  const isFloorHot = floor.isFlagged;

                  return (
                    <div
                      key={floor.nodeId}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                        isFloorHot
                          ? 'bg-red-950/60 border-red-500 text-red-200 ring-1 ring-red-500'
                          : hasCases
                          ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                          : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{floor.label}</span>
                        <span>{formatCases(floor.caseCount, floor.suppressed)} cases</span>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[11px] font-mono flex justify-between">
                        <span className="opacity-80">Attack Rate:</span>
                        <span>{formatAttackRate(floor.attackRate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedBlockId === 'mess' && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 transition-all animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-amber-400" />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">Central Mess &amp; Kitchen Breakdown</h4>
                    <p className="text-xs text-zinc-400">Serves all 4 hostel blocks (~744 students)</p>
                  </div>
                </div>
                {mess.isFlagged ? (
                  <Badge className="bg-red-600 text-white font-bold animate-pulse">SUSPECTED FOOD OUTBREAK</Badge>
                ) : (
                  <Badge variant="outline" className="text-zinc-400 border-zinc-700">KITCHEN NORMAL</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-400 block text-[11px]">Total Associated Cases:</span>
                  <span className="text-base font-bold text-zinc-100">{formatCases(mess.caseCount, mess.suppressed)} students</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-400 block text-[11px]">Meal Attack Rate:</span>
                  <span className="text-base font-bold text-zinc-100">{formatAttackRate(mess.attackRate)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface BuildingNodeProps {
  block: CampusElevation['blocks'][0];
  label: string;
  sub: string;
  isSelected: boolean;
  onClick: () => void;
}

function BuildingNode({ block, label, sub, isSelected, onClick }: BuildingNodeProps) {
  const isFlagged = block.isFlagged;
  const cases = block.caseCount;
  const isElevated = cases > 0 && !isFlagged;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 relative group p-3 sm:p-4 rounded-xl border flex flex-col items-center text-center shadow-lg ${
        isFlagged
          ? 'bg-red-950/80 border-red-500 ring-4 ring-red-500/40 animate-pulse'
          : isElevated
          ? 'bg-amber-950/60 border-amber-600 ring-2 ring-amber-500/30'
          : 'bg-zinc-950/90 border-zinc-800 hover:border-zinc-700'
      } ${isSelected ? 'scale-105 border-white ring-2 ring-white/50' : ''}`}
    >
      {/* Hotspot Heat Glow Circle behind building */}
      {isFlagged && (
        <span className="absolute -inset-2 rounded-2xl bg-red-600/30 blur-md pointer-events-none animate-pulse" />
      )}
      {isElevated && (
        <span className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur-sm pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`p-2 rounded-lg mb-1.5 transition-colors ${
            isFlagged
              ? 'bg-red-600 text-white shadow-lg'
              : isElevated
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700'
          }`}
        >
          <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        <span className="font-bold text-xs sm:text-sm text-zinc-100 tracking-tight">{label}</span>
        <span className="text-[10px] text-zinc-400 font-mono mt-0.5">{sub}</span>

        {/* Status Pill */}
        <div className="mt-2">
          {isFlagged ? (
            <Badge className="bg-red-600 text-white text-[10px] font-bold py-0.5 px-2 flex items-center gap-1 shadow-md">
              <ShieldAlert className="h-3 w-3" /> {formatCases(cases, block.suppressed)} SICK
            </Badge>
          ) : isElevated ? (
            <Badge className="bg-amber-500 text-zinc-950 text-[10px] font-bold py-0.5 px-1.5">
              {formatCases(cases, block.suppressed)} Cases (Watch)
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800/60 bg-emerald-950/30 py-0.5">
              <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> All Clear
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface MessNodeProps {
  mess: CampusElevation['mess'];
  isFlagged: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function MessNode({ mess, isFlagged, isSelected, onClick }: MessNodeProps) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 relative group p-3.5 sm:p-5 rounded-2xl border flex flex-col items-center text-center shadow-xl ${
        isFlagged
          ? 'bg-red-950/90 border-red-500 ring-4 ring-red-500/40 animate-pulse'
          : 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500'
      } ${isSelected ? 'scale-105 border-white ring-2 ring-white/50' : ''}`}
    >
      {/* Central glow aura */}
      {isFlagged ? (
        <span className="absolute -inset-3 rounded-full bg-red-600/30 blur-lg pointer-events-none animate-pulse" />
      ) : (
        <span className="absolute -inset-1 rounded-full bg-emerald-500/10 blur-md pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`p-2.5 rounded-xl mb-1.5 transition-colors ${
            isFlagged ? 'bg-red-600 text-white shadow-lg' : 'bg-emerald-600 text-white'
          }`}
        >
          <Utensils className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>

        <span className="font-extrabold text-xs sm:text-sm text-zinc-100 tracking-tight">Central Mess &amp; Dining</span>
        <span className="text-[10px] text-zinc-400 font-mono">Shared Hub (All Blocks)</span>

        <div className="mt-2">
          {isFlagged ? (
            <Badge className="bg-red-600 text-white text-[10px] font-bold py-0.5 px-2 flex items-center gap-1 shadow-md">
              <ShieldAlert className="h-3 w-3" /> MEAL OUTBREAK
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-zinc-300 border-zinc-700 bg-zinc-800/80 py-0.5">
              Kitchen Normal
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
