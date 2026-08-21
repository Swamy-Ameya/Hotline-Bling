'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fixtureFor } from '@/lib/detect/fixture';
import { SCENARIOS, type ScenarioId, type DetectionResult } from '@/lib/types';
import { GeoCampusMap } from '@/components/radar/geo-campus-map';
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
  TrendingUp,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

/** Remap engine block labels to real MUJ GHS hostel names */
function remapBlockLabel(label: string): string {
  const map: Record<string, string> = {
    'Block A': 'B1 – GHS Boys Hostel',
    'Block B': 'B2 – GHS Boys Hostel',
    'Block C': 'G1 – GHS Girls Hostel',
    'Block D': 'G2 – GHS Girls Hostel',
  };
  return map[label] ?? label;
}

function remapTankName(name: string): string {
  const map: Record<string, string> = {
    'Tank A': 'B1 Overhead Tank',
    'Tank B': 'B2 Overhead Tank',
    'Tank C': 'G1 Overhead Tank',
    'Tank D': 'G2 Overhead Tank',
  };
  return map[name] ?? name;
}

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

  /** Clean up verdict text — remove internal filter references */
  function cleanVerdict(raw: string | null | undefined): string {
    if (!raw) return 'All systems nominal. No active clusters detected.';
    return raw
      .replace(/Filter \d+[AB]\s*(—|–|-)\s*/g, '')
      .replace(/Filter \d+[AB]/g, 'Water line')
      .replace(/filter \d+[AB]/g, 'water line');
  }

  function cleanHeadline(raw: string): string {
    return raw
      .replace(/Filter \d+[AB]\s*(—|–|-)\s*/g, '')
      .replace(/Filter \d+[AB]/g, 'water line')
      .replace(/filter \d+[AB]/g, 'water line')
      .replace(/Block A/g, 'B1')
      .replace(/Block B/g, 'B2')
      .replace(/Block C/g, 'G1')
      .replace(/Block D/g, 'G2');
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 antialiased">
      {/* ───── NAV BAR ───── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Radar className="size-4" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-zinc-900">Outbreak Radar</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/radar" className="px-3 py-1.5 rounded-lg text-[13px] text-zinc-900 bg-zinc-100 font-medium">
              Dashboard
            </Link>
            <Link href="/report" className="px-3 py-1.5 rounded-lg text-[13px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors font-medium">
              Report
            </Link>
            <Link href="/" className="px-3 py-1.5 rounded-lg text-[13px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors font-medium">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ───── PAGE HEADER ───── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight leading-tight text-zinc-900">Dashboard</h1>
            <p className="text-[15px] text-zinc-500 mt-1 leading-relaxed">
              Campus outbreak monitoring & location intelligence
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isLiveApi ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live API
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
                Demo Mode
              </span>
            )}
            <Link href="/report">
              <button className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm">
                <FileText className="size-3.5" />
                Report Illness
              </button>
            </Link>
          </div>
        </div>

        {/* ───── SCENARIO SWITCHER ───── */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-zinc-400 mr-1 uppercase tracking-wide">Scenario</span>
          {SCENARIOS.map((sc) => {
            const isCurrent = sc.id === selectedScenario;
            return (
              <button
                key={sc.id}
                onClick={() => handleScenarioChange(sc.id)}
                disabled={isScanning}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all border ${
                  isCurrent
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-800 hover:shadow-sm'
                } ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {sc.label}
              </button>
            );
          })}
          {isScanning && (
            <span className="text-[13px] text-zinc-400 animate-pulse ml-3">Scanning…</span>
          )}
        </div>

        {/* ───── STATUS CARD ───── */}
        <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isAlert
            ? 'bg-red-50 border-red-200/80'
            : isWatch
            ? 'bg-amber-50 border-amber-200/80'
            : 'bg-emerald-50 border-emerald-200/80'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isAlert ? 'bg-red-100 text-red-600' : isWatch ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {isAlert ? <ShieldAlert className="size-5" /> : isWatch ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
            </div>
            <div>
              <h2 className="font-semibold text-[16px] text-zinc-900 leading-snug">
                {cleanHeadline(result.headline)}
              </h2>
              <p className="text-[14px] text-zinc-500 mt-0.5 leading-relaxed">
                {cleanVerdict(topCluster?.verdict)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200/80 text-zinc-600 font-mono text-[13px] flex items-center gap-2 shadow-xs">
              <Users className="size-3.5 text-zinc-400" />
              <span>{result.totalCases} / {result.totalPopulation}</span>
            </div>
            {topCluster && (
              <div className={`px-3.5 py-2 rounded-xl border font-mono text-[13px] font-medium shadow-xs ${
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
        <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-zinc-900 flex items-center gap-2.5">
              <Activity className="size-4 text-zinc-400" />
              Location Breakdown
            </h3>
            <span className="text-[12px] text-zinc-400 font-medium">
              {result.elevation.blocks.length} blocks · mess · day scholars
            </span>
          </div>

          <div className="divide-y divide-zinc-100/80">
            {result.elevation.blocks.map((block) => {
              const isFlagged = block.isFlagged;
              const hasCases = block.caseCount > 0;

              return (
                <Link
                  key={block.label}
                  href={`/radar/${selectedScenario}`}
                  className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-50/80 ${
                    isFlagged ? 'bg-red-50/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isFlagged ? 'bg-red-100 text-red-600' : hasCases ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium text-[14px] text-zinc-900">{remapBlockLabel(block.label)}</span>
                        {isFlagged && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold tracking-wide">
                            OUTBREAK
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] text-zinc-400 mt-0.5 block">{remapTankName(block.tankName)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <span className="text-[15px] font-semibold font-mono text-zinc-900 tabular-nums">
                        {block.suppressed ? '<3' : block.caseCount}
                      </span>
                      <span className="text-[13px] text-zinc-400 ml-1">cases</span>
                      <span className={`block text-[12px] font-mono tabular-nums mt-0.5 ${isFlagged ? 'text-red-600 font-medium' : 'text-zinc-400'}`}>
                        {(block.attackRate * 100).toFixed(1)}% attack rate
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-zinc-300" />
                  </div>
                </Link>
              );
            })}

            {/* Blue Dove Mess */}
            <Link
              href={`/radar/${selectedScenario}`}
              className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-zinc-50/80 ${
                result.elevation.mess.isFlagged ? 'bg-red-50/40' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                  result.elevation.mess.isFlagged ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Utensils className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-[14px] text-zinc-900">Blue Dove Mess</span>
                    {result.elevation.mess.isFlagged && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold tracking-wide">
                        OUTBREAK
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] text-zinc-400 mt-0.5 block">Shared dining · all hostellers + day scholars</span>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <span className="text-[15px] font-semibold font-mono text-zinc-900 tabular-nums">
                    {result.elevation.mess.suppressed ? '<3' : result.elevation.mess.caseCount}
                  </span>
                  <span className="text-[13px] text-zinc-400 ml-1">cases</span>
                  <span className={`block text-[12px] font-mono tabular-nums mt-0.5 ${result.elevation.mess.isFlagged ? 'text-red-600 font-medium' : 'text-zinc-400'}`}>
                    {(result.elevation.mess.attackRate * 100).toFixed(1)}% attack rate
                  </span>
                </div>
                <ChevronRight className="size-4 text-zinc-300" />
              </div>
            </Link>

            {/* Day Scholars */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0">
                  <Users className="size-4" />
                </div>
                <div>
                  <span className="font-medium text-[14px] text-zinc-900">Day Scholars</span>
                  <span className="block text-[13px] text-zinc-400 mt-0.5">Control group · eat at mess, drink no hostel water</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[15px] font-semibold font-mono text-zinc-900 tabular-nums">
                  {result.elevation.dayScholars.suppressed ? '<3' : result.elevation.dayScholars.caseCount}
                </span>
                <span className="text-[13px] text-zinc-400 ml-1">cases</span>
                <span className="block text-[12px] font-mono text-zinc-400 tabular-nums mt-0.5">
                  {result.elevation.dayScholars.caseCount > 0 ? 'Mess food suspect' : 'Water hypothesis cleared'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ───── DEEP DIVE LINK ───── */}
        {topCluster && (
          <Link href={`/radar/${selectedScenario}`}>
            <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-md transition-all flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="size-11 rounded-2xl bg-zinc-100 text-zinc-500 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors shrink-0">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <span className="font-semibold text-[15px] text-zinc-900">
                    Deep Dive: {cleanHeadline(topCluster.name)}
                  </span>
                  <span className="block text-[13px] text-zinc-500 mt-0.5">
                    Permutation test · epi curve · 2×2 food table · case roster · intervention logs
                  </span>
                </div>
              </div>
              <ArrowRight className="size-4 text-zinc-400 group-hover:text-zinc-900 transition-colors shrink-0" />
            </div>
          </Link>
        )}

        {/* ───── FOOTER ───── */}
        <footer className="pt-10 pb-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[13px] text-zinc-400 flex items-center gap-2">
            <Radar className="size-3.5" />
            Outbreak Radar · Manipal University Jaipur
          </span>
          <span className="text-[12px] text-zinc-400">
            DPDP Act 2023 compliant · &lt;3 cases suppressed
          </span>
        </footer>
      </div>
    </div>
  );
}
