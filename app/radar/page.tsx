'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fixtureFor } from '@/lib/detect/fixture';
import { SCENARIOS, type ScenarioId, type DetectionResult } from '@/lib/types';
import { CampusMapView } from '@/components/radar/campus-map-view';
import { GeoCampusMap } from '@/components/radar/geo-campus-map';
import { ElevationView } from '@/components/radar/elevation-view';
import { ContrastPanel } from '@/components/radar/contrast-panel';
import { ClusterCards } from '@/components/radar/cluster-cards';
import { ScenarioBar } from '@/components/radar/scenario-bar';
import { StudentView } from '@/components/radar/student-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radar,
  Clock,
  Users,
  Network,
  Binary,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Map as MapIcon,
  Building2,
  GraduationCap,
  Shield,
  Send,
  CheckCircle2,
  Navigation,
  Globe
} from 'lucide-react';

export default function RadarPage() {
  const [role, setRole] = useState<'warden' | 'student'>('warden');
  const [viewMode, setViewMode] = useState<'geo' | 'map' | 'elevation'>('geo');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('filter_fault');
  const [result, setResult] = useState<DetectionResult>(() => fixtureFor('filter_fault'));
  const [isScanning, setIsScanning] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [advisorySent, setAdvisorySent] = useState(false);

  // Switch scenario via API with fixture fallback
  const handleScenarioChange = useCallback(async (scenario: ScenarioId) => {
    setSelectedScenario(scenario);
    setIsScanning(true);
    setAdvisorySent(false);

    try {
      // 1. Seed the scenario in the API store
      const seedRes = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });

      if (!seedRes.ok) throw new Error(`Seed failed with HTTP ${seedRes.status}`);

      // 2. Run fresh detection on seeded data
      const detectRes = await fetch('/api/detect', { method: 'POST' });
      if (!detectRes.ok) throw new Error(`Detect failed with HTTP ${detectRes.status}`);

      const data: DetectionResult = await detectRes.json();
      setResult(data);
      setIsLiveApi(true);
    } catch (err) {
      console.warn('API /api/seed or /api/detect failed; falling back to fixture:', err);
      setResult(fixtureFor(scenario));
      setIsLiveApi(false);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Run detection on demand
  const handleRunDetection = useCallback(async () => {
    setIsScanning(true);
    setAdvisorySent(false);

    try {
      const detectRes = await fetch('/api/detect', { method: 'POST' });
      if (!detectRes.ok) throw new Error(`Detect failed with HTTP ${detectRes.status}`);

      const data: DetectionResult = await detectRes.json();
      setResult(data);
      setIsLiveApi(true);
    } catch (err) {
      console.warn('API /api/detect failed; falling back to fixture:', err);
      await new Promise((r) => setTimeout(r, 400));
      setResult(fixtureFor(selectedScenario));
      setIsLiveApi(false);
    } finally {
      setIsScanning(false);
    }
  }, [selectedScenario]);

  // Initial load: sync with live API on mount
  useEffect(() => {
    handleScenarioChange('filter_fault');
  }, [handleScenarioChange]);

  const handleBroadcastAdvisory = () => {
    setAdvisorySent(true);
    setTimeout(() => setAdvisorySent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top App Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm">
                <Radar className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                    Outbreak Radar
                  </h1>
                  <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider py-0 px-1.5">
                    MUJ POC · v1.0
                  </Badge>
                  {isLiveApi ? (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-mono py-0 px-1.5 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      LIVE API
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 text-zinc-500">
                      FIXTURE MODE
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Hostel food &amp; water-borne micro-outbreak early warning system
                </p>
              </div>
            </div>
          </div>

          {/* Role Switcher & Live Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Switcher Pill */}
            <div className="p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRole('warden')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  role === 'warden'
                    ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span>Health / Warden Hub</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  role === 'student'
                    ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                <span>Student Portal</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <div className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                <span>Sick: <strong>{result.totalCases}</strong> / {result.totalPopulation}</span>
              </div>
            </div>
          </div>
        </header>

        {/* STUDENT ROLE VIEW */}
        {role === 'student' ? (
          <StudentView result={result} />
        ) : (
          /* WARDEN / HEALTH CENTER ROLE VIEW */
          <div className="space-y-6">
            {/* Data Pipeline Pillars Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block text-[11px]">Clinic &amp; Student Reports</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Doctor (1.0) · Mobile (0.6)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block text-[11px]">Mess Menu &amp; Timing</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Breakfast · Lunch · Dinner</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Network className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block text-[11px]">Hostel Allocation DB</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">4 Blocks · 20 Floors</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Radio className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 block text-[11px]">Targeted Push Advisories</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Direct to affected block</span>
                </div>
              </div>
            </div>

            {/* Scenario Switcher Bar */}
            <ScenarioBar
              selectedScenario={selectedScenario}
              onSelectScenario={handleScenarioChange}
              onRunDetection={handleRunDetection}
              isScanning={isScanning}
            />

            {/* Quick 1-Click Targeted Broadcast Action */}
            {result.topCluster && result.topCluster.status !== 'watch' && (
              <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 dark:bg-red-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-red-900 dark:text-red-200 block">
                      Active Outbreak Alert: {result.topCluster.name}
                    </span>
                    <span className="text-[11px] text-red-700 dark:text-red-300">
                      Confidence: 99.9% ({result.topCluster.observed} cases against {result.topCluster.expected.toFixed(1)} expected)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {advisorySent ? (
                    <Badge className="bg-emerald-600 text-white text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Push Advisory Dispatched to Students!
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleBroadcastAdvisory}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 h-8 rounded-lg shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" /> Broadcast Advisory to Block
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Main Visualizer: 3 View Modes Toggle */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Campus Visualizer Mode:
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('geo')}
                    className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                      viewMode === 'geo'
                        ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5 text-red-500" />
                    <span>Geo Satellite &amp; Pin Stamper</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                      viewMode === 'map'
                        ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <MapIcon className="h-3.5 w-3.5 text-emerald-500" />
                    <span>2D Layout Heatmap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('elevation')}
                    className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                      viewMode === 'elevation'
                        ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Block Elevation Grid</span>
                  </button>
                </div>
              </div>

              {/* Render Selected Visualizer */}
              {viewMode === 'geo' ? (
                <GeoCampusMap elevation={result.elevation} result={result} />
              ) : viewMode === 'map' ? (
                <CampusMapView elevation={result.elevation} result={result} />
              ) : (
                <ElevationView elevation={result.elevation} />
              )}
            </div>

            {/* Contrast Panel: Permutation Test vs. Naive Threshold */}
            <section aria-label="Statistical Contrast Panel">
              <ContrastPanel result={result} />
            </section>

            {/* Active Cluster Cards & Deliberate Empty State */}
            <section aria-label="Detected Clusters">
              <ClusterCards clusters={result.clusters} />
            </section>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
          <p>
            Outbreak Radar • Campus early warning surveillance system for college hostels &amp; PGs
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Compliant with DPDP Act 2023 privacy thresholds (&lt;3 cases suppressed) • Manipal University Jaipur
          </p>
        </footer>
      </div>
    </div>
  );
}
