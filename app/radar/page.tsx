'use client';

import React, { useState, useTransition } from 'react';
import { fixtureFor, ALL_FIXTURES } from '@/lib/detect/fixture';
import { SCENARIOS, type ScenarioId, type DetectionResult } from '@/lib/types';
import { ElevationView } from '@/components/radar/elevation-view';
import { ContrastPanel } from '@/components/radar/contrast-panel';
import { ClusterCards } from '@/components/radar/cluster-cards';
import { ScenarioBar } from '@/components/radar/scenario-bar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Radar,
  Radio,
  Clock,
  Users,
  Network,
  Binary,
  Shield,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function RadarPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('filter_fault');
  const [result, setResult] = useState<DetectionResult>(() => fixtureFor('filter_fault'));
  const [isScanning, setIsScanning] = useState(false);

  // Handle scenario switch
  const handleScenarioChange = (scenario: ScenarioId) => {
    setSelectedScenario(scenario);
    setResult(fixtureFor(scenario));
  };

  // Handle Run Detection trigger with a brief scanning transition
  const handleRunDetection = () => {
    setIsScanning(true);
    setTimeout(() => {
      setResult(fixtureFor(selectedScenario));
      setIsScanning(false);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Hostel food &amp; water-borne micro-outbreak early warning system
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
            <div className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>Window: <strong>{result.windowHours}h</strong></span>
            </div>
            <div className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              <span>Cases: <strong>{result.totalCases}</strong> / {result.totalPopulation}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <Network className="h-3.5 w-3.5 text-zinc-400" />
              <span>Nodes: <strong>{result.nodesTested}</strong></span>
            </div>
            <div className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <Binary className="h-3.5 w-3.5 text-zinc-400" />
              <span>FDR: <strong>q={result.fdrQ}</strong></span>
            </div>
          </div>
        </header>

        {/* Scenario Switcher Bar */}
        <ScenarioBar
          selectedScenario={selectedScenario}
          onSelectScenario={handleScenarioChange}
          onRunDetection={handleRunDetection}
          isScanning={isScanning}
        />

        {/* Main Dashboard Layout */}
        <main className="space-y-6">
          {/* Hero Visual: Campus Infrastructure Elevation */}
          <section aria-label="Campus Elevation">
            <ElevationView elevation={result.elevation} />
          </section>

          {/* Contrast Panel: Permutation Test vs. Naive Threshold */}
          <section aria-label="Statistical Contrast Panel">
            <ContrastPanel result={result} />
          </section>

          {/* Active Cluster Cards & Empty State */}
          <section aria-label="Detected Clusters">
            <ClusterCards clusters={result.clusters} />
          </section>
        </main>

        {/* Footer */}
        <footer className="pt-8 pb-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
          <p>
            Outbreak Radar • Permutation-tested spatial scan statistics for campus public health
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Compliant with DPDP Act 2023 privacy thresholds (&lt;3 cases suppressed) • Manipal University Jaipur
          </p>
        </footer>
      </div>
    </div>
  );
}
