'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fixtureFor } from '@/lib/detect/fixture';
import { SCENARIOS, type ScenarioId, type DetectionResult } from '@/lib/types';
import { GeoCampusMap } from '@/components/radar/geo-campus-map';
import { ContrastPanel } from '@/components/radar/contrast-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radar,
  Users,
  ShieldAlert,
  AlertTriangle,
  Send,
  CheckCircle2,
  FileText,
  ArrowRight,
  Activity,
  Building2,
  Utensils,
  Droplets,
  Clock,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

export default function RadarPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('filter_fault');
  const [result, setResult] = useState<DetectionResult>(() => fixtureFor('filter_fault'));
  const [isScanning, setIsScanning] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [advisorySent, setAdvisorySent] = useState(false);

  const handleScenarioChange = useCallback(async (scenario: ScenarioId) => {
    setSelectedScenario(scenario);
    setIsScanning(true);
    setAdvisorySent(false);

    try {
      const seedRes = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      if (!seedRes.ok) throw new Error(`Seed failed`);

      const detectRes = await fetch('/api/detect', { method: 'POST' });
      if (!detectRes.ok) throw new Error(`Detect failed`);

      const data: DetectionResult = await detectRes.json();
      setResult(data);
      setIsLiveApi(true);
    } catch {
      setResult(fixtureFor(scenario));
      setIsLiveApi(false);
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    handleScenarioChange('filter_fault');
  }, [handleScenarioChange]);

  const handleBroadcastAdvisory = () => {
    setAdvisorySent(true);
    setTimeout(() => setAdvisorySent(false), 5000);
  };

  const topCluster = result.topCluster;
  const status = topCluster?.status ?? null;
  const isAlert = status === 'alert' || status === 'confirmed';
  const isWatch = status === 'watch';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ───── HEADER: Simple & Clean ───── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600 text-white shadow-sm">
              <Radar className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Outbreak Radar</h1>
              <p className="text-xs text-zinc-400">Hostel micro-outbreak early warning · MUJ Campus</p>
            </div>
            {isLiveApi ? (
              <Badge className="bg-emerald-600 text-white text-[10px] font-mono py-0 px-1.5 flex items-center gap-1 ml-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 text-zinc-500 ml-2">
                DEMO
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/report">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 border-white/10 text-zinc-300 hover:text-white">
                <FileText className="size-3.5" />
                Report Illness
              </Button>
            </Link>
            <Link href="/">
              <Button size="sm" variant="ghost" className="text-xs text-zinc-400 hover:text-white">
                Home
              </Button>
            </Link>
          </div>
        </header>

        {/* ───── SCENARIO SWITCHER: 4 Simple Buttons ───── */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400 mr-1">Test Scenario:</span>
          {SCENARIOS.map((sc) => {
            const isCurrent = sc.id === selectedScenario;
            return (
              <button
                key={sc.id}
                onClick={() => handleScenarioChange(sc.id)}
                disabled={isScanning}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isCurrent
                    ? 'bg-white text-zinc-950 border-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/25 hover:text-zinc-200'
                } ${isScanning ? 'opacity-50' : ''}`}
              >
                {sc.label}
              </button>
            );
          })}
          {isScanning && (
            <span className="text-xs text-zinc-400 animate-pulse ml-2">Scanning...</span>
          )}
        </div>

        {/* ───── STATUS BANNER: What's happening right now ───── */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isAlert
            ? 'bg-red-950/50 border-red-500/50'
            : isWatch
            ? 'bg-amber-950/30 border-amber-500/30'
            : 'bg-zinc-900/50 border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isAlert ? 'bg-red-600 text-white' : isWatch ? 'bg-amber-500 text-zinc-950' : 'bg-emerald-600 text-white'
            }`}>
              {isAlert ? <ShieldAlert className="size-5" /> : isWatch ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {result.headline}
              </h2>
              <p className="text-xs text-zinc-300 mt-0.5">
                {topCluster?.verdict ?? 'No active clusters detected. System monitoring.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Key Stats */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-1 rounded-lg bg-zinc-950 border border-white/10 text-zinc-300">
                <Users className="size-3 inline mr-1" />{result.totalCases} sick / {result.totalPopulation}
              </span>
              {topCluster && (
                <span className={`px-2 py-1 rounded-lg border ${
                  isAlert ? 'bg-red-950 border-red-500 text-red-200' : 'bg-zinc-950 border-white/10 text-zinc-400'
                }`}>
                  p = {topCluster.pSpatial.toFixed(3)}
                </span>
              )}
            </div>

            {/* Broadcast Button (only on real alerts) */}
            {isAlert && (
              advisorySent ? (
                <Badge className="bg-emerald-600 text-white text-xs py-1.5 px-3 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Sent!
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={handleBroadcastAdvisory}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold gap-1 shadow-sm"
                >
                  <Send className="size-3" /> Broadcast Advisory
                </Button>
              )
            )}
          </div>
        </div>

        {/* ───── SATELLITE MAP: The Main Visual ───── */}
        <GeoCampusMap elevation={result.elevation} result={result} />

        {/* ───── LOCATION BREAKDOWN: Simple Table ───── */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Activity className="size-4 text-amber-400" />
              Location Breakdown
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">
              Click a row to investigate
            </span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {/* Blocks */}
            {result.elevation.blocks.map((block) => {
              const isFlagged = block.isFlagged;
              const hasCase = block.caseCount > 0;

              return (
                <Link
                  key={block.label}
                  href={`/radar/${selectedScenario}`}
                  className={`flex items-center justify-between px-4 py-3 text-xs transition-colors ${
                    isFlagged ? 'bg-red-950/30 hover:bg-red-950/50' : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${
                      isFlagged ? 'bg-red-600 text-white' : hasCase ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      <Building2 className="size-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-zinc-100">{block.label}</span>
                      {isFlagged && (
                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-red-600 text-white font-extrabold">
                          OUTBREAK
                        </span>
                      )}
                      <span className="block text-[10px] text-zinc-400 font-mono">{block.tankName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-bold font-mono text-zinc-100 block">
                        {block.suppressed ? '<3' : block.caseCount} cases
                      </span>
                      <span className={`text-[10px] font-mono ${isFlagged ? 'text-red-400' : 'text-zinc-400'}`}>
                        AR: {(block.attackRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <ArrowRight className="size-3.5 text-zinc-500" />
                  </div>
                </Link>
              );
            })}

            {/* Mess */}
            <Link
              href={`/radar/${selectedScenario}`}
              className={`flex items-center justify-between px-4 py-3 text-xs transition-colors ${
                result.elevation.mess.isFlagged ? 'bg-red-950/30 hover:bg-red-950/50' : 'hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${
                  result.elevation.mess.isFlagged ? 'bg-red-600 text-white' : 'bg-amber-700 text-white'
                }`}>
                  <Utensils className="size-3.5" />
                </div>
                <div>
                  <span className="font-bold text-zinc-100">Central Dining Mess</span>
                  {result.elevation.mess.isFlagged && (
                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-red-600 text-white font-extrabold">
                      OUTBREAK
                    </span>
                  )}
                  <span className="block text-[10px] text-zinc-400 font-mono">Shared by all hostellers + day scholars</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-bold font-mono text-zinc-100 block">
                    {result.elevation.mess.suppressed ? '<3' : result.elevation.mess.caseCount} cases
                  </span>
                  <span className={`text-[10px] font-mono ${result.elevation.mess.isFlagged ? 'text-red-400' : 'text-zinc-400'}`}>
                    AR: {(result.elevation.mess.attackRate * 100).toFixed(1)}%
                  </span>
                </div>
                <ArrowRight className="size-3.5 text-zinc-500" />
              </div>
            </Link>

            {/* Day Scholars */}
            <div className="flex items-center justify-between px-4 py-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400">
                  <Users className="size-3.5" />
                </div>
                <div>
                  <span className="font-bold text-zinc-100">Day Scholars (Control Group)</span>
                  <span className="block text-[10px] text-zinc-400 font-mono">Eat at mess, drink no hostel water</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold font-mono text-zinc-100 block">
                  {result.elevation.dayScholars.suppressed ? '<3' : result.elevation.dayScholars.caseCount} cases
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {result.elevation.dayScholars.caseCount > 0 ? 'Mess food suspect' : 'Water cleared'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ───── SMART vs DUMB CONTRAST: The money shot ───── */}
        <ContrastPanel result={result} />

        {/* ───── DEEP DIVE LINK ───── */}
        {topCluster && (
          <Link href={`/radar/${selectedScenario}`}>
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <TrendingUp className="size-5 text-amber-400" />
                <div>
                  <span className="font-bold text-sm text-zinc-100 group-hover:text-white">
                    Deep Dive: {topCluster.name}
                  </span>
                  <span className="block text-xs text-zinc-400">
                    Permutation test, epi curve, 2×2 food table, case roster, and intervention logs
                  </span>
                </div>
              </div>
              <ExternalLink className="size-4 text-zinc-400 group-hover:text-white" />
            </div>
          </Link>
        )}

        {/* ───── FOOTER ───── */}
        <footer className="pt-6 pb-4 border-t border-white/10 text-center text-xs text-zinc-500 space-y-1">
          <p>Outbreak Radar · Manipal University Jaipur · Hackathon POC</p>
          <p className="text-[11px] text-zinc-600">DPDP Act 2023 compliant · &lt;3 cases suppressed</p>
        </footer>
      </div>
    </div>
  );
}
