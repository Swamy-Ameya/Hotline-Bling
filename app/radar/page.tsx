'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fixtureFor } from '@/lib/detect/fixture';
import { SCENARIOS, type ScenarioId, type DetectionResult } from '@/lib/types';
import { GeoCampusMap } from '@/components/radar/geo-campus-map';
import { ContrastPanel } from '@/components/radar/contrast-panel';
import {
  Radar,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  Activity,
  Building2,
  Utensils,
  ExternalLink,
  TrendingUp,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export default function RadarPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('filter_fault');
  const [result, setResult] = useState<DetectionResult>(() => fixtureFor('filter_fault'));
  const [isScanning, setIsScanning] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);

  const handleScenarioChange = useCallback(async (scenario: ScenarioId) => {
    setSelectedScenario(scenario);
    setIsScanning(true);

    try {
      const seedRes = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      if (!seedRes.ok) throw new Error('Seed failed');

      const detectRes = await fetch('/api/detect', { method: 'POST' });
      if (!detectRes.ok) throw new Error('Detect failed');

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

  const topCluster = result.topCluster;
  const status = topCluster?.status ?? null;
  const isAlert = status === 'alert' || status === 'confirmed';
  const isWatch = status === 'watch';

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* ───── NAV BAR ───── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Radar className="size-4" />
            </div>
            <span className="font-bold text-base tracking-tight">Outbreak Radar</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/radar" className="px-3 py-1.5 rounded-lg text-sm text-zinc-900 bg-zinc-100 font-semibold">
              Dashboard
            </Link>
            <Link href="/report" className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors font-medium">
              Report
            </Link>
            <Link href="/" className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors font-medium">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* ───── PAGE HEADER ───── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Campus outbreak monitoring & location intelligence</p>
          </div>

          <div className="flex items-center gap-2">
            {isLiveApi ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live API
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
                Demo Mode
              </span>
            )}
            <Link href="/report">
              <button className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors flex items-center gap-2">
                <FileText className="size-3.5" />
                Report Illness
              </button>
            </Link>
          </div>
        </div>

        {/* ───── SCENARIO SWITCHER ───── */}
        <div className="flex items-center gap-2 pb-2">
          <span className="text-xs font-medium text-zinc-400 mr-1">Scenario:</span>
          {SCENARIOS.map((sc) => {
            const isCurrent = sc.id === selectedScenario;
            return (
              <button
                key={sc.id}
                onClick={() => handleScenarioChange(sc.id)}
                disabled={isScanning}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isCurrent
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900'
                } ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {sc.label}
              </button>
            );
          })}
          {isScanning && (
            <span className="text-xs text-zinc-400 animate-pulse ml-2">Scanning...</span>
          )}
        </div>

        {/* ───── STATUS CARD ───── */}
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isAlert
            ? 'bg-red-50 border-red-200'
            : isWatch
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center ${
              isAlert ? 'bg-red-100 text-red-600' : isWatch ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {isAlert ? <ShieldAlert className="size-5" /> : isWatch ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-900">
                {result.headline}
              </h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                {topCluster?.verdict ?? 'All systems nominal. No clusters detected.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 font-mono text-xs flex items-center gap-1.5">
              <Users className="size-3.5 text-zinc-400" />
              {result.totalCases} sick / {result.totalPopulation}
            </div>
            {topCluster && (
              <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold ${
                isAlert
                  ? 'bg-red-100 border-red-200 text-red-700'
                  : isWatch
                  ? 'bg-amber-100 border-amber-200 text-amber-700'
                  : 'bg-white border-zinc-200 text-zinc-500'
              }`}>
                p = {topCluster.pSpatial.toFixed(3)}
              </div>
            )}
          </div>
        </div>

        {/* ───── SATELLITE MAP ───── */}
        <GeoCampusMap elevation={result.elevation} result={result} />

        {/* ───── LOCATION BREAKDOWN ───── */}
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="size-4 text-zinc-400" />
              Location Breakdown
            </h3>
            <span className="text-[11px] text-zinc-400">
              {result.elevation.blocks.length} blocks + mess + day scholars
            </span>
          </div>

          <div className="divide-y divide-zinc-100">
            {result.elevation.blocks.map((block) => {
              const isFlagged = block.isFlagged;
              const hasCases = block.caseCount > 0;

              return (
                <Link
                  key={block.label}
                  href={`/radar/${selectedScenario}`}
                  className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-zinc-50 ${
                    isFlagged ? 'bg-red-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-xl flex items-center justify-center ${
                      isFlagged ? 'bg-red-100 text-red-600' : hasCases ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900">{block.label}</span>
                        {isFlagged && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                            OUTBREAK
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400">{block.tankName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-semibold font-mono text-zinc-900">
                        {block.suppressed ? '<3' : block.caseCount}
                      </span>
                      <span className="text-xs text-zinc-400 ml-1">cases</span>
                      <span className={`block text-[11px] font-mono ${isFlagged ? 'text-red-600 font-semibold' : 'text-zinc-400'}`}>
                        {(block.attackRate * 100).toFixed(1)}% AR
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-zinc-300" />
                  </div>
                </Link>
              );
            })}

            {/* Mess */}
            <Link
              href={`/radar/${selectedScenario}`}
              className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-zinc-50 ${
                result.elevation.mess.isFlagged ? 'bg-red-50/50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`size-9 rounded-xl flex items-center justify-center ${
                  result.elevation.mess.isFlagged ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Utensils className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-900">Central Dining Mess</span>
                    {result.elevation.mess.isFlagged && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                        OUTBREAK
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-400">Shared by all hostellers + day scholars</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-semibold font-mono text-zinc-900">
                    {result.elevation.mess.suppressed ? '<3' : result.elevation.mess.caseCount}
                  </span>
                  <span className="text-xs text-zinc-400 ml-1">cases</span>
                  <span className={`block text-[11px] font-mono ${result.elevation.mess.isFlagged ? 'text-red-600 font-semibold' : 'text-zinc-400'}`}>
                    {(result.elevation.mess.attackRate * 100).toFixed(1)}% AR
                  </span>
                </div>
                <ChevronRight className="size-4 text-zinc-300" />
              </div>
            </Link>

            {/* Day Scholars */}
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center">
                  <Users className="size-4" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-zinc-900">Day Scholars</span>
                  <span className="block text-xs text-zinc-400">Control group: eat mess food, drink no hostel water</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold font-mono text-zinc-900">
                  {result.elevation.dayScholars.suppressed ? '<3' : result.elevation.dayScholars.caseCount}
                </span>
                <span className="text-xs text-zinc-400 ml-1">cases</span>
                <span className="block text-[11px] font-mono text-zinc-400">
                  {result.elevation.dayScholars.caseCount > 0 ? 'Mess food suspect' : 'Water hypothesis cleared'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ───── SMART vs DUMB CONTRAST ───── */}
        <ContrastPanel result={result} />

        {/* ───── DEEP DIVE LINK ───── */}
        {topCluster && (
          <Link href={`/radar/${selectedScenario}`}>
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md transition-all flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-zinc-900">
                    Deep Dive: {topCluster.name}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    Permutation test, epi curve, 2×2 food table, case roster & intervention logs
                  </span>
                </div>
              </div>
              <ArrowRight className="size-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
            </div>
          </Link>
        )}

        {/* ───── FOOTER ───── */}
        <footer className="pt-8 pb-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Radar className="size-3.5" />
            Outbreak Radar · Manipal University Jaipur
          </span>
          <span className="text-xs text-zinc-400">
            DPDP Act 2023 compliant · &lt;3 cases suppressed
          </span>
        </footer>
      </div>
    </div>
  );
}
