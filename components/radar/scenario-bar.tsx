'use client';

import React from 'react';
import { SCENARIOS, type ScenarioId } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, Sparkles, RefreshCw, FlaskConical, Check } from 'lucide-react';

interface ScenarioBarProps {
  selectedScenario: ScenarioId;
  onSelectScenario: (scenario: ScenarioId) => void;
  onRunDetection: () => void;
  isScanning: boolean;
}

export function ScenarioBar({
  selectedScenario,
  onSelectScenario,
  onRunDetection,
  isScanning,
}: ScenarioBarProps) {
  const currentMeta = SCENARIOS.find((s) => s.id === selectedScenario) ?? SCENARIOS[0];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 p-4 shadow-sm backdrop-blur-sm space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Hackathon Test Scenarios:
          </span>
        </div>

        {/* Action Run detection button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onRunDetection}
            disabled={isScanning}
            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold px-4 h-9 shadow-sm"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                <span>Running Scan (999 Permutations)...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                <span>Run Detection Engine</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scenario Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SCENARIOS.map((scenario) => {
          const isSelected = scenario.id === selectedScenario;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario.id)}
              disabled={isScanning}
              className={`text-left p-2.5 rounded-lg border transition-all relative ${
                isSelected
                  ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold leading-tight">{scenario.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </div>
              <span
                className={`text-[10px] block mt-1 line-clamp-1 opacity-80 ${
                  isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {scenario.id}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scenario Explanation Card */}
      <div className="px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono shrink-0 uppercase">
            Scenario Info
          </Badge>
          <span className="text-zinc-700 dark:text-zinc-300">{currentMeta.blurb}</span>
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 shrink-0 font-medium">
          <span>Expected:</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{currentMeta.expected}</span>
        </div>
      </div>
    </div>
  );
}
